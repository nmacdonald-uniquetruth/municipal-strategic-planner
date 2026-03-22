/**
 * fiscalImpactEngine.js
 * Pure functions for predictive fiscal impact modeling of legislative items.
 *
 * Compares bill fiscal_impact_amount against historical municipal spending
 * patterns (BudgetControlRecord / FinancialRecord) and outputs a
 * 'potential_budget_variance_pct' plus a structured risk assessment.
 */

// ─── Department → budget category keyword map ────────────────────────────────
// Maps department names to BudgetControlRecord/FinancialRecord categories
export const DEPT_CATEGORY_MAP = {
  'Administration':      ['other_expense', 'contracted_services', 'supplies'],
  'Finance':             ['other_expense', 'contracted_services', 'salaries_wages'],
  'HR':                  ['salaries_wages', 'benefits'],
  'Public Works':        ['equipment', 'contracted_services', 'capital_outlay'],
  'Police':              ['salaries_wages', 'benefits', 'supplies', 'equipment'],
  'Fire':                ['salaries_wages', 'benefits', 'equipment'],
  'EMS / Ambulance':     ['salaries_wages', 'benefits', 'equipment', 'contracted_services'],
  'Planning / Code':     ['salaries_wages', 'contracted_services'],
  'Parks / Recreation':  ['salaries_wages', 'supplies', 'capital_outlay'],
  'Utilities':           ['capital_outlay', 'equipment', 'contracted_services'],
  'Transfer Station':    ['contracted_services', 'equipment', 'capital_outlay'],
  'Economic Development':['contracted_services', 'grants'],
  'Library':             ['salaries_wages', 'supplies'],
};

// ─── Risk tier thresholds ─────────────────────────────────────────────────────
export const RISK_TIERS = [
  { label: 'Critical',  min: 10,  color: 'red',    description: 'Exceeds 10% of affected budget — requires immediate Finance Director review' },
  { label: 'High',      min: 5,   color: 'orange',  description: '5–10% variance — flag for budget season review' },
  { label: 'Moderate',  min: 2,   color: 'amber',   description: '2–5% variance — monitor and plan contingency' },
  { label: 'Low',       min: 0.5, color: 'yellow',  description: '0.5–2% variance — watch list' },
  { label: 'Minimal',   min: 0,   color: 'green',   description: 'Under 0.5% — minimal fiscal risk' },
];

export function getRiskTier(variancePct) {
  const abs = Math.abs(variancePct);
  return RISK_TIERS.find(t => abs >= t.min) || RISK_TIERS[RISK_TIERS.length - 1];
}

// ─── Build spending baseline from BudgetControlRecords ────────────────────────

/**
 * Aggregate BudgetControlRecords into a per-department spending baseline.
 * Returns: { [department]: { adopted_budget, ytd_actual, revised_budget, categories: [...] } }
 */
export function buildSpendingBaseline(budgetControlRecords, fiscalYear = null) {
  const baseline = {};

  const records = fiscalYear
    ? budgetControlRecords.filter(r => r.fiscal_year === fiscalYear)
    : budgetControlRecords;

  records.forEach(r => {
    if (!r.department) return;
    const dept = r.department;
    if (!baseline[dept]) {
      baseline[dept] = {
        adopted_budget:  0,
        revised_budget:  0,
        ytd_actual:      0,
        encumbrances:    0,
        categories:      [],
        fiscal_year:     r.fiscal_year,
      };
    }
    baseline[dept].adopted_budget += r.adopted_budget || 0;
    baseline[dept].revised_budget += r.revised_budget || r.adopted_budget || 0;
    baseline[dept].ytd_actual     += r.ytd_actual || 0;
    baseline[dept].encumbrances   += r.encumbrances || 0;
    if (r.record_type) baseline[dept].categories.push(r.record_type);
  });

  return baseline;
}

/**
 * Build a supplemental baseline from FinancialRecords (older historical data).
 * Aggregates by category and fiscal_year. Returns total spend per category.
 */
export function buildHistoricalBaseline(financialRecords, fiscalYears = null) {
  const totals = {}; // { category: totalAmount }

  const records = fiscalYears
    ? financialRecords.filter(r => fiscalYears.includes(r.fiscal_year))
    : financialRecords;

  records.forEach(r => {
    if (!r.category || r.record_type !== 'expense') return;
    totals[r.category] = (totals[r.category] || 0) + Math.abs(r.amount || 0);
  });

  return totals;
}

// ─── Core prediction engine ───────────────────────────────────────────────────

/**
 * Predict budget variance for a single LegislationItem against the spending baseline.
 *
 * @param {object} item           - LegislationItem record
 * @param {object} spendingBaseline - Output of buildSpendingBaseline()
 * @param {object} historicalBaseline - Output of buildHistoricalBaseline()
 * @param {object} profile        - MunicipalityProfile
 * @returns {FiscalImpactPrediction}
 */
export function predictFiscalImpact(item, spendingBaseline, historicalBaseline, profile) {
  const annualBudget = profile?.annual_budget || 4_000_000;
  const fiscalImpact = item.fiscal_impact_amount || 0;

  // 1. Identify affected departments (from item or auto-detect)
  const affectedDepts = item.departments_affected?.length
    ? item.departments_affected
    : inferDepartmentsFromText(item.title, item.summary || '');

  // 2. Compute total affected budget across those departments
  let totalAffectedBudget = 0;
  const deptBreakdown = [];

  affectedDepts.forEach(dept => {
    const baseline = spendingBaseline[dept];
    const deptBudget = baseline?.revised_budget || baseline?.adopted_budget || 0;

    if (deptBudget > 0) {
      totalAffectedBudget += deptBudget;
      deptBreakdown.push({
        department:     dept,
        adopted_budget: baseline.adopted_budget,
        revised_budget: baseline.revised_budget,
        ytd_actual:     baseline.ytd_actual,
        dept_variance_pct: deptBudget > 0
          ? parseFloat(((Math.abs(fiscalImpact) / deptBudget) * 100).toFixed(2))
          : null,
      });
    } else {
      deptBreakdown.push({
        department:     dept,
        adopted_budget: 0,
        revised_budget: 0,
        ytd_actual:     0,
        dept_variance_pct: null,
        note:           'No budget baseline found for this department',
      });
    }
  });

  // 3. Calculate overall variance as % of total affected budget
  // If no department baseline, fall back to % of total municipal budget
  const baselineBudget = totalAffectedBudget > 0 ? totalAffectedBudget : annualBudget;
  const variancePct = fiscalImpact !== 0
    ? parseFloat(((Math.abs(fiscalImpact) / baselineBudget) * 100).toFixed(2))
    : estimateVarianceFromText(item, annualBudget);

  const isRevenue  = fiscalImpact > 0;
  const isCost     = fiscalImpact < 0;
  const direction  = isRevenue ? 'revenue_increase' : isCost ? 'cost_increase' : 'unknown';

  // 4. Year-over-year spend trend (simple — if ytd data exists)
  const spendTrend = computeSpendTrend(affectedDepts, spendingBaseline);

  // 5. Risk tier
  const riskTier = getRiskTier(variancePct);

  // 6. Confidence score
  const confidence = calcPredictionConfidence(item, affectedDepts, spendingBaseline, totalAffectedBudget);

  // 7. Recommended action for Finance Director
  const financeAction = buildFinanceAction(variancePct, riskTier, item, direction);

  return {
    legislation_item_id:         item.id,
    identifier:                  item.identifier,
    title:                       item.title,
    status:                      item.status,
    jurisdiction:                item.jurisdiction,
    fiscal_impact_amount:        fiscalImpact,
    fiscal_impact_note:          item.fiscal_impact_note || '',
    potential_budget_variance_pct: variancePct,
    variance_direction:          direction,
    affected_departments:        affectedDepts,
    baseline_budget_used:        baselineBudget,
    department_breakdown:        deptBreakdown,
    spend_trend:                 spendTrend,
    risk_tier:                   riskTier.label,
    risk_color:                  riskTier.color,
    risk_description:            riskTier.description,
    confidence_score:            confidence,
    finance_action:              financeAction,
    annual_budget_pct:           parseFloat(((Math.abs(fiscalImpact) / annualBudget) * 100).toFixed(2)),
    modeled_at:                  new Date().toISOString(),
  };
}

/**
 * Run predictFiscalImpact across a collection of items.
 * Returns results sorted by variance descending (highest risk first).
 */
export function batchPredictFiscalImpact(items, spendingBaseline, historicalBaseline, profile) {
  return items
    .filter(item => item.fiscal_impact_amount || hasFiscalSignals(item))
    .map(item => predictFiscalImpact(item, spendingBaseline, historicalBaseline, profile))
    .sort((a, b) => b.potential_budget_variance_pct - a.potential_budget_variance_pct);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function inferDepartmentsFromText(title = '', summary = '') {
  const text = `${title} ${summary}`.toLowerCase();
  const matched = [];
  const keywords = {
    'Finance':             ['finance', 'budget', 'audit', 'fiscal', 'revenue', 'tax', 'appropriation'],
    'Public Works':        ['highway', 'road', 'bridge', 'infrastructure', 'public works', 'paving'],
    'Police':              ['police', 'law enforcement', 'officer', 'patrol'],
    'Fire':                ['fire', 'firefighter'],
    'EMS / Ambulance':     ['ems', 'ambulance', 'paramedic', 'emt', 'emergency medical'],
    'Administration':      ['administration', 'manager', 'clerk', 'governance'],
    'HR':                  ['wage', 'salary', 'benefit', 'pension', 'labor', 'workforce', 'hr', 'human resource'],
    'Planning / Code':     ['planning', 'zoning', 'code enforcement', 'building permit'],
    'Transfer Station':    ['transfer station', 'solid waste', 'recycling'],
    'Utilities':           ['utility', 'water', 'sewer', 'wastewater'],
  };
  Object.entries(keywords).forEach(([dept, kws]) => {
    if (kws.some(kw => text.includes(kw))) matched.push(dept);
  });
  // Always include Finance if there's fiscal language
  if (!matched.includes('Finance') && (text.includes('fund') || text.includes('cost') || text.includes('reimburse'))) {
    matched.push('Finance');
  }
  return matched.length ? matched : ['Administration'];
}

function hasFiscalSignals(item) {
  const text = `${item.title || ''} ${item.summary || ''} ${item.fiscal_impact_note || ''}`.toLowerCase();
  return ['cost', 'fund', 'budget', 'appropriat', 'revenue', 'reimburse', 'grant', 'levy', 'tax'].some(kw => text.includes(kw));
}

/**
 * If no dollar amount is provided, estimate variance from text signals.
 * Returns a conservative estimate percentage.
 */
function estimateVarianceFromText(item, annualBudget) {
  const text = `${item.title || ''} ${item.summary || ''} ${item.fiscal_impact_note || ''}`.toLowerCase();
  // Look for dollar amounts in the text
  const dollarMatch = text.match(/\$([0-9,]+(?:\.[0-9]+)?)\s*(million|m|thousand|k)?/i);
  if (dollarMatch) {
    let amount = parseFloat(dollarMatch[1].replace(/,/g, ''));
    const unit = (dollarMatch[2] || '').toLowerCase();
    if (unit === 'million' || unit === 'm') amount *= 1_000_000;
    if (unit === 'thousand' || unit === 'k') amount *= 1_000;
    return parseFloat(((amount / annualBudget) * 100).toFixed(2));
  }
  // Fallback: signal-based rough estimate
  if (item.impact_level === 'very_high') return 8.0;
  if (item.impact_level === 'high')      return 4.0;
  if (item.impact_level === 'moderate')  return 1.5;
  return 0.3;
}

function computeSpendTrend(depts, spendingBaseline) {
  const trends = [];
  depts.forEach(dept => {
    const b = spendingBaseline[dept];
    if (!b) return;
    const adopted = b.adopted_budget || 0;
    const revised = b.revised_budget || adopted;
    const ytd     = b.ytd_actual || 0;
    if (adopted > 0 && ytd > 0) {
      const executionPct = parseFloat(((ytd / revised) * 100).toFixed(1));
      trends.push({ department: dept, execution_pct: executionPct, adopted, revised, ytd });
    }
  });
  return trends;
}

function calcPredictionConfidence(item, depts, spendingBaseline, totalAffectedBudget) {
  let score = 40;
  if (item.fiscal_impact_amount) score += 30;   // Hard dollar amount given
  if (item.fiscal_impact_note)   score += 10;   // Narrative context
  if (totalAffectedBudget > 0)   score += 15;   // Dept budget baseline exists
  if (depts.length > 0 && item.departments_affected?.length) score += 5; // Dept explicitly tagged
  return Math.min(score, 100);
}

function buildFinanceAction(variancePct, riskTier, item, direction) {
  const abs = Math.abs(variancePct);
  const billRef = item.identifier || item.title?.slice(0, 40) || 'this item';

  if (riskTier.label === 'Critical') {
    return `IMMEDIATE: Brief Finance Director on ${billRef}. Potential ${abs.toFixed(1)}% budget variance requires contingency planning before passage.`;
  }
  if (riskTier.label === 'High') {
    return `Flag ${billRef} for budget season review. Estimated ${abs.toFixed(1)}% impact on affected department budgets.`;
  }
  if (riskTier.label === 'Moderate') {
    return `Add ${billRef} to Finance watch list. Model ${direction === 'revenue_increase' ? 'revenue gain' : 'cost impact'} into FY projections.`;
  }
  if (riskTier.label === 'Low') {
    return `Monitor ${billRef}. Minor fiscal signal — revisit if status advances.`;
  }
  return `No immediate Finance action required for ${billRef}.`;
}

// ─── Summary stats for the UI panel ──────────────────────────────────────────

export function buildFiscalModelSummary(predictions) {
  if (!predictions.length) return null;

  const critical = predictions.filter(p => p.risk_tier === 'Critical');
  const high     = predictions.filter(p => p.risk_tier === 'High');
  const totalExposure = predictions.reduce((s, p) => s + Math.abs(p.fiscal_impact_amount || 0), 0);
  const avgVariance   = predictions.reduce((s, p) => s + p.potential_budget_variance_pct, 0) / predictions.length;

  return {
    total_modeled:   predictions.length,
    critical_count:  critical.length,
    high_count:      high.length,
    total_exposure:  totalExposure,
    avg_variance_pct: parseFloat(avgVariance.toFixed(2)),
    top_critical:    critical.slice(0, 3),
    top_high:        high.slice(0, 5),
  };
}