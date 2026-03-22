/**
 * fiscalImpactPredictor.js
 * Backend function — runs predictive fiscal impact modeling for a set of
 * LegislationItems against the municipality's actual BudgetControlRecords.
 *
 * POST payload:
 * {
 *   item_ids?: string[]         // specific items to model (omit = all with fiscal signals)
 *   fiscal_year?: string        // e.g. "FY2027" — which budget baseline to use
 *   profile_id?: string         // MunicipalityProfile ID to use
 * }
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

// ─── Inline engine (no local imports allowed) ─────────────────────────────────

const RISK_TIERS = [
  { label: 'Critical', min: 10 },
  { label: 'High',     min: 5  },
  { label: 'Moderate', min: 2  },
  { label: 'Low',      min: 0.5},
  { label: 'Minimal',  min: 0  },
];

function getRiskTier(variancePct) {
  const abs = Math.abs(variancePct);
  return RISK_TIERS.find(t => abs >= t.min) || RISK_TIERS[RISK_TIERS.length - 1];
}

function buildSpendingBaseline(records) {
  const baseline = {};
  records.forEach(r => {
    if (!r.department) return;
    const d = r.department;
    if (!baseline[d]) baseline[d] = { adopted_budget: 0, revised_budget: 0, ytd_actual: 0 };
    baseline[d].adopted_budget += r.adopted_budget || 0;
    baseline[d].revised_budget += r.revised_budget || r.adopted_budget || 0;
    baseline[d].ytd_actual     += r.ytd_actual || 0;
  });
  return baseline;
}

function inferDepts(title = '', summary = '') {
  const text = `${title} ${summary}`.toLowerCase();
  const kw = {
    'Finance':         ['finance','budget','audit','fiscal','revenue','tax','appropriation'],
    'Public Works':    ['highway','road','bridge','infrastructure','public works'],
    'Police':          ['police','law enforcement','officer'],
    'Fire':            ['fire','firefighter'],
    'EMS / Ambulance': ['ems','ambulance','paramedic','emt','emergency medical'],
    'Administration':  ['administration','manager','clerk','governance'],
    'HR':              ['wage','salary','benefit','pension','labor','workforce'],
    'Planning / Code': ['planning','zoning','code enforcement'],
    'Transfer Station':['transfer station','solid waste','recycling'],
    'Utilities':       ['utility','water','sewer','wastewater'],
  };
  const matched = [];
  Object.entries(kw).forEach(([dept, words]) => {
    if (words.some(w => text.includes(w))) matched.push(dept);
  });
  if (!matched.includes('Finance') && ['fund','cost','reimburse','grant','levy'].some(w => text.includes(w))) {
    matched.push('Finance');
  }
  return matched.length ? matched : ['Administration'];
}

function extractAmountFromText(text = '', annualBudget) {
  const m = text.match(/\$([0-9,]+(?:\.[0-9]+)?)\s*(million|m|thousand|k)?/i);
  if (m) {
    let amt = parseFloat(m[1].replace(/,/g, ''));
    const u = (m[2] || '').toLowerCase();
    if (u === 'million' || u === 'm') amt *= 1_000_000;
    if (u === 'thousand' || u === 'k') amt *= 1_000;
    return amt;
  }
  return 0;
}

function predictOne(item, baseline, annualBudget) {
  const depts = item.departments_affected?.length
    ? item.departments_affected
    : inferDepts(item.title, item.summary || '');

  let fiscalImpact = item.fiscal_impact_amount || 0;
  if (!fiscalImpact) {
    fiscalImpact = extractAmountFromText(
      `${item.title} ${item.summary || ''} ${item.fiscal_impact_note || ''}`,
      annualBudget
    );
  }

  let totalDeptBudget = 0;
  const deptBreakdown = [];
  depts.forEach(dept => {
    const b = baseline[dept];
    const budget = b?.revised_budget || b?.adopted_budget || 0;
    totalDeptBudget += budget;
    deptBreakdown.push({
      department:     dept,
      adopted_budget: b?.adopted_budget || 0,
      revised_budget: b?.revised_budget || 0,
      ytd_actual:     b?.ytd_actual || 0,
      dept_variance_pct: budget > 0
        ? parseFloat(((Math.abs(fiscalImpact) / budget) * 100).toFixed(2))
        : null,
    });
  });

  const baseBudget   = totalDeptBudget > 0 ? totalDeptBudget : annualBudget;
  const variancePct  = fiscalImpact !== 0
    ? parseFloat(((Math.abs(fiscalImpact) / baseBudget) * 100).toFixed(2))
    : 0;
  const riskTier     = getRiskTier(variancePct);

  // Confidence
  let confidence = 40;
  if (item.fiscal_impact_amount) confidence += 30;
  if (item.fiscal_impact_note)   confidence += 10;
  if (totalDeptBudget > 0)       confidence += 15;
  if (item.departments_affected?.length) confidence += 5;
  confidence = Math.min(confidence, 100);

  // Finance action
  const ref = item.identifier || (item.title || '').slice(0, 40);
  let financeAction = '';
  if (riskTier.label === 'Critical') financeAction = `IMMEDIATE: Brief Finance Director on ${ref}. Potential ${variancePct.toFixed(1)}% budget variance requires contingency planning.`;
  else if (riskTier.label === 'High') financeAction = `Flag ${ref} for budget season review. Estimated ${variancePct.toFixed(1)}% impact.`;
  else if (riskTier.label === 'Moderate') financeAction = `Add ${ref} to Finance watch list and model into FY projections.`;
  else financeAction = `Monitor ${ref}. Minor fiscal signal — revisit if status advances.`;

  return {
    legislation_item_id:           item.id,
    identifier:                    item.identifier || '',
    title:                         item.title,
    status:                        item.status,
    jurisdiction:                  item.jurisdiction,
    fiscal_impact_amount:          fiscalImpact,
    fiscal_impact_note:            item.fiscal_impact_note || '',
    potential_budget_variance_pct: variancePct,
    variance_direction:            fiscalImpact > 0 ? 'revenue_increase' : fiscalImpact < 0 ? 'cost_increase' : 'unknown',
    affected_departments:          depts,
    baseline_budget_used:          baseBudget,
    department_breakdown:          deptBreakdown,
    risk_tier:                     riskTier.label,
    confidence_score:              confidence,
    finance_action:                financeAction,
    annual_budget_pct:             parseFloat(((Math.abs(fiscalImpact) / annualBudget) * 100).toFixed(2)),
    modeled_at:                    new Date().toISOString(),
  };
}

// ─── Handler ──────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user   = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body       = await req.json();
    const { item_ids, fiscal_year, profile_id } = body;

    // 1. Load municipality profile
    let profile = null;
    if (profile_id) {
      const profiles = await base44.entities.MunicipalityProfile.filter({ id: profile_id });
      profile = profiles[0] || null;
    }
    if (!profile) {
      const allProfiles = await base44.entities.MunicipalityProfile.filter({ is_active: true });
      profile = allProfiles[0] || null;
    }
    const annualBudget = profile?.annual_budget || 4_000_000;

    // 2. Load budget baseline
    const budgetFilter = fiscal_year ? { fiscal_year } : {};
    const budgetRecords = await base44.entities.BudgetControlRecord.filter(budgetFilter);
    const spendingBaseline = buildSpendingBaseline(budgetRecords);

    // 3. Load legislation items
    let items = [];
    if (item_ids?.length) {
      items = await Promise.all(item_ids.map(id =>
        base44.entities.LegislationItem.filter({ id }).then(r => r[0]).catch(() => null)
      ));
      items = items.filter(Boolean);
    } else {
      // All non-archived items with fiscal signals
      items = await base44.entities.LegislationItem.filter({ is_archived: false });
      items = items.filter(item =>
        item.fiscal_impact_amount ||
        item.fiscal_impact_note ||
        ['very_high', 'high'].includes(item.impact_level)
      );
    }

    if (!items.length) {
      return Response.json({ predictions: [], summary: null, message: 'No items with fiscal signals found.' });
    }

    // 4. Run predictions
    const predictions = items
      .map(item => predictOne(item, spendingBaseline, annualBudget))
      .sort((a, b) => b.potential_budget_variance_pct - a.potential_budget_variance_pct);

    // 5. Build summary
    const critical     = predictions.filter(p => p.risk_tier === 'Critical');
    const high         = predictions.filter(p => p.risk_tier === 'High');
    const totalExposure = predictions.reduce((s, p) => s + Math.abs(p.fiscal_impact_amount || 0), 0);
    const avgVariance   = predictions.length
      ? predictions.reduce((s, p) => s + p.potential_budget_variance_pct, 0) / predictions.length
      : 0;

    const summary = {
      total_modeled:    predictions.length,
      critical_count:   critical.length,
      high_count:       high.length,
      total_exposure:   totalExposure,
      avg_variance_pct: parseFloat(avgVariance.toFixed(2)),
      fiscal_year:      fiscal_year || budgetRecords[0]?.fiscal_year || 'N/A',
      baseline_depts:   Object.keys(spendingBaseline).length,
      profile_name:     profile?.name || 'Unknown',
      annual_budget:    annualBudget,
      modeled_at:       new Date().toISOString(),
    };

    return Response.json({ predictions, summary });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});