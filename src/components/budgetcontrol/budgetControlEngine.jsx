/**
 * Budget Control & Reconciliation Engine
 * Pure functions — no React dependencies.
 */

// ─── Seasonality profiles ───────────────────────────────────────────────────

const SEASONAL_WEIGHTS = {
  flat:             Array(12).fill(1/12),
  front_loaded:     [0.12,0.11,0.10,0.10,0.09,0.08,0.08,0.08,0.08,0.08,0.09,0.09],
  back_loaded:      [0.05,0.06,0.07,0.07,0.08,0.08,0.09,0.09,0.10,0.11,0.10,0.10],
  q2_q3_heavy:      [0.06,0.06,0.07,0.10,0.11,0.11,0.10,0.10,0.09,0.08,0.07,0.05],
  seasonal_summer:  [0.04,0.04,0.06,0.08,0.12,0.14,0.14,0.12,0.10,0.08,0.05,0.03],
  seasonal_winter:  [0.14,0.12,0.10,0.07,0.05,0.04,0.04,0.05,0.07,0.09,0.11,0.12],
};

function getWeights(record) {
  if (record.seasonality_profile === 'custom' && record.custom_monthly_weights?.length === 12) {
    return record.custom_monthly_weights;
  }
  return SEASONAL_WEIGHTS[record.seasonality_profile] || SEASONAL_WEIGHTS.flat;
}

// ─── Core metrics per record ────────────────────────────────────────────────

export function computeControlMetrics(record, currentMonth) {
  // currentMonth: 1-12 (month of fiscal year elapsed, e.g. 9 = 9 months through)
  const month = Math.max(1, Math.min(12, currentMonth || 9));
  const budget  = record.revised_budget || record.adopted_budget || 0;
  const ytd     = record.ytd_actual || 0;
  const encumb  = record.encumbrances || 0;
  const gaapAdj = record.gaap_adjustment || 0;
  const gaapBasis = ytd + gaapAdj;

  // Remaining budget (budgetary basis)
  const obligated   = ytd + encumb;
  const remaining   = budget - obligated;
  const remainingPct = budget > 0 ? (remaining / budget) * 100 : 0;

  // % spent (budgetary)
  const pctSpent = budget > 0 ? (ytd / budget) * 100 : 0;

  // Expected % spent at this point in the year (based on seasonality)
  const weights = getWeights(record);
  const expectedPct = weights.slice(0, month).reduce((s, w) => s + w, 0) * 100;

  // Execution gap: positive = spending faster than expected, negative = lagging
  const executionGap = pctSpent - expectedPct;

  // Year-end projection (if not manually set)
  const autoProjection = projectYearEnd(record, month);
  const projected = record.projected_year_end > 0 ? record.projected_year_end : autoProjection;

  // Variance (budget vs projected)
  const variance    = budget - projected;
  const variancePct = budget > 0 ? (variance / budget) * 100 : 0;

  // Status flags
  const overBudget       = projected > budget;
  const overThreshold    = variancePct < -(record.variance_threshold_pct || 5);
  const lowExecution     = month >= 6 && pctSpent < ((record.low_execution_threshold_pct || 15));
  const nearlyExhausted  = remaining > 0 && remaining < budget * 0.05 && month < 11;

  return {
    budget, ytd, encumb, gaapAdj, gaapBasis,
    obligated, remaining, remainingPct: parseFloat(remainingPct.toFixed(1)),
    pctSpent: parseFloat(pctSpent.toFixed(1)),
    expectedPct: parseFloat(expectedPct.toFixed(1)),
    executionGap: parseFloat(executionGap.toFixed(1)),
    autoProjection, projected,
    variance, variancePct: parseFloat(variancePct.toFixed(1)),
    overBudget, overThreshold, lowExecution, nearlyExhausted,
  };
}

// ─── Year-end projection ────────────────────────────────────────────────────

export function projectYearEnd(record, currentMonth) {
  const month = Math.max(1, Math.min(12, currentMonth || 9));
  const ytd = record.ytd_actual || 0;
  const weights = getWeights(record);
  const elapsed = weights.slice(0, month).reduce((s, w) => s + w, 0);
  if (elapsed <= 0) return record.adopted_budget || 0;
  // Simple run-rate projection weighted by seasonality
  const runRate = ytd / elapsed;
  return Math.round(runRate);
}

// ─── Reconciliation layers ──────────────────────────────────────────────────

/**
 * Layer 1: Dept → Fund rollup reconciliation
 * Returns per-fund totals and checks if sum of depts matches expected fund total.
 */
export function reconcileDeptToFund(records, fundTotals = {}) {
  const groups = {};
  records.forEach(r => {
    const k = r.fund || 'general_fund';
    if (!groups[k]) groups[k] = { budget: 0, ytd: 0, projected: 0, count: 0, dept_names: [] };
    const m = computeControlMetrics(r, 9);
    groups[k].budget    += m.budget;
    groups[k].ytd       += m.ytd;
    groups[k].projected += m.projected;
    groups[k].count++;
    groups[k].dept_names.push(r.department);
  });

  return Object.entries(groups).map(([fund, data]) => {
    const expected = fundTotals[fund] || data.budget;
    const diff = data.budget - expected;
    return { fund, ...data, expected, diff, reconciled: Math.abs(diff) < 1 };
  });
}

/**
 * Layer 2: Fund → Article reconciliation
 * Checks that each article_number total matches fund totals assigned to it.
 */
export function reconcileFundToArticle(records) {
  const articles = {};
  records.forEach(r => {
    const art = r.article_number || 'Unassigned';
    if (!articles[art]) articles[art] = { article: art, funds: {}, budget: 0, ytd: 0 };
    const fund = r.fund || 'general_fund';
    if (!articles[art].funds[fund]) articles[art].funds[fund] = 0;
    const m = computeControlMetrics(r, 9);
    articles[art].funds[fund] += m.budget;
    articles[art].budget += m.budget;
    articles[art].ytd += m.ytd;
  });

  return Object.values(articles).map(a => ({
    ...a,
    fundCount: Object.keys(a.funds).length,
    orphan: a.article === 'Unassigned',
  }));
}

/**
 * Layer 3: Article → BETE reconciliation
 */
export function reconcileArticleToBete(records) {
  const beteGroups = {};
  records.forEach(r => {
    const key = r.bete_mapping || 'unmapped';
    if (!beteGroups[key]) beteGroups[key] = { bete_line: key, budget: 0, ytd: 0, depts: [] };
    const m = computeControlMetrics(r, 9);
    beteGroups[key].budget += m.budget;
    beteGroups[key].ytd += m.ytd;
    beteGroups[key].depts.push(r.department);
  });
  return Object.values(beteGroups);
}

// ─── Alert engine ───────────────────────────────────────────────────────────

export const ALERT_TYPES = {
  overspend:       { label: 'Overspending',        severity: 'error',   color: 'text-red-700',    bg: 'bg-red-50',    border: 'border-red-200' },
  low_execution:   { label: 'Low Execution',        severity: 'warning', color: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-amber-200' },
  near_exhaustion: { label: 'Near Exhaustion',      severity: 'warning', color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200' },
  missing_revenue: { label: 'Missing Revenue',      severity: 'warning', color: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-amber-200' },
  unmapped_transfer:{ label: 'Unmapped Transfer',   severity: 'error',   color: 'text-red-700',    bg: 'bg-red-50',    border: 'border-red-200' },
  broken_rollup:   { label: 'Broken Rollup',        severity: 'error',   color: 'text-red-700',    bg: 'bg-red-50',    border: 'border-red-200' },
  projection_gap:  { label: 'Projection Gap',       severity: 'info',    color: 'text-blue-700',   bg: 'bg-blue-50',   border: 'border-blue-200' },
};

export function generateAlerts(records, currentMonth) {
  const alerts = [];

  records.forEach(r => {
    const m = computeControlMetrics(r, currentMonth);
    const label = `${r.department} (${r.fund})`;

    if (m.overBudget) {
      alerts.push({ type: 'overspend', dept: r.department, fund: r.fund,
        msg: `${label}: Projected year-end $${Math.round(m.projected).toLocaleString()} exceeds budget $${Math.round(m.budget).toLocaleString()} by $${Math.round(m.projected - m.budget).toLocaleString()} (${Math.abs(m.variancePct).toFixed(1)}%).` });
    }
    if (m.lowExecution) {
      alerts.push({ type: 'low_execution', dept: r.department, fund: r.fund,
        msg: `${label}: Only ${m.pctSpent.toFixed(1)}% spent at month ${currentMonth} — expected ~${m.expectedPct.toFixed(1)}%. Verify encumbrances or pending invoices.` });
    }
    if (m.nearlyExhausted) {
      alerts.push({ type: 'near_exhaustion', dept: r.department, fund: r.fund,
        msg: `${label}: Only $${Math.round(m.remaining).toLocaleString()} (${m.remainingPct.toFixed(1)}%) remaining with ${12 - currentMonth} months left.` });
    }
    if (!r.bete_mapping && r.record_type === 'appropriation') {
      alerts.push({ type: 'unmapped_transfer', dept: r.department, fund: r.fund,
        msg: `${label}: Appropriation has no BETE mapping — excluded from tax commitment rollup.` });
    }
    if (!r.article_number && r.record_type === 'appropriation') {
      alerts.push({ type: 'broken_rollup', dept: r.department, fund: r.fund,
        msg: `${label}: Appropriation has no warrant article assignment — rollup broken.` });
    }
  });

  // Revenue check
  const revRecords = records.filter(r => r.record_type === 'revenue');
  if (revRecords.length === 0) {
    alerts.push({ type: 'missing_revenue', dept: 'All', fund: 'general_fund',
      msg: 'No revenue records found. Budget control module should include revenue lines for full reconciliation.' });
  }

  return alerts;
}

// ─── GAAP reconciliation ───────────────────────────────────────────────────

export function buildGaapReconciliation(records) {
  return records.map(r => {
    const ytd = r.ytd_actual || 0;
    const adj = r.gaap_adjustment || 0;
    const gaap = ytd + adj;
    return {
      department: r.department, fund: r.fund,
      budgetary_basis: ytd,
      gaap_adjustment: adj,
      gaap_basis: gaap,
      adjustment_type: adj > 0 ? 'accrual_add' : adj < 0 ? 'deferral_remove' : 'none',
    };
  }).filter(r => r.gaap_adjustment !== 0);
}