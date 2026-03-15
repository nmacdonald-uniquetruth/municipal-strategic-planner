/**
 * Annual Budget Process Engine
 * Pure functions — no React.
 */

// ─── Phase definitions ─────────────────────────────────────────────────────────

export const PHASES = [
  { id: 'setup',                   label: 'Budget Calendar Setup',       owner: 'Finance Director',   description: 'Establish timeline, forms, and instructions for departments.' },
  { id: 'dept_requests',           label: 'Department Requests',         owner: 'Department Heads',   description: 'All departments submit budget requests with justifications.' },
  { id: 'finance_review',          label: 'Finance Review',              owner: 'Finance Director',   description: 'Finance reviews, flags, and preliminarily reconciles all requests.' },
  { id: 'manager_recommendation',  label: 'Manager Recommendation',      owner: 'Town Manager',       description: 'Town Manager produces recommended budget for committee review.' },
  { id: 'budget_committee',        label: 'Budget Committee Review',     owner: 'Budget Committee',   description: 'Budget Committee holds public sessions and makes recommendations.' },
  { id: 'select_board',            label: 'Select Board Review',         owner: 'Select Board',       description: 'Select Board reviews and approves budget for warrant.' },
  { id: 'warrant_prep',            label: 'Warrant Preparation',         owner: 'Town Clerk / Counsel', description: 'Draft warrant articles; obtain legal review.' },
  { id: 'adopted',                 label: 'Town Meeting Adoption',       owner: 'Voters',             description: 'Town Meeting votes on each warrant article.' },
  { id: 'tax_commitment',          label: 'Tax Commitment',              owner: 'Assessor',           description: 'Assessor commits taxes; mill rate certified.' },
  { id: 'budget_control',          label: 'Budget Control & Tracking',   owner: 'Finance Director',   description: 'Monitor YTD actuals; approve transfers; track variances.' },
];

export const PHASE_ORDER = PHASES.map(p => p.id);

export const JUSTIFICATION_TAGS = {
  contractual:      { label: 'Contractual',       color: 'bg-blue-100 text-blue-700' },
  statutory:        { label: 'Statutory',          color: 'bg-indigo-100 text-indigo-700' },
  inflationary:     { label: 'Inflationary',       color: 'bg-amber-100 text-amber-700' },
  service_expansion:{ label: 'Service Expansion',  color: 'bg-emerald-100 text-emerald-700' },
  capital_need:     { label: 'Capital Need',       color: 'bg-orange-100 text-orange-700' },
  staffing:         { label: 'Staffing',            color: 'bg-purple-100 text-purple-700' },
  emergency_risk:   { label: 'Emergency / Risk',   color: 'bg-red-100 text-red-700' },
  grant_match:      { label: 'Grant Match',         color: 'bg-teal-100 text-teal-700' },
  one_time:         { label: 'One-Time',            color: 'bg-slate-100 text-slate-600' },
  recurring:        { label: 'Recurring',           color: 'bg-slate-200 text-slate-700' },
};

export const FUND_LABELS = {
  general_fund:    'General Fund',
  school:          'School / Education',
  county:          'County Assessment',
  enterprise:      'Enterprise Fund',
  tif:             'TIF District',
  debt_service:    'Debt Service',
  capital_reserve: 'Capital Reserve',
  special_revenue: 'Special Revenue',
};

export const BETE_FIELDS = [
  { key: 'municipalAppropriations', label: 'Municipal Appropriations' },
  { key: 'schoolAppropriations',    label: 'School Appropriations' },
  { key: 'countyAssessment',        label: 'County Assessment' },
  { key: 'enterpriseOffsets',       label: 'Enterprise Offsets' },
  { key: 'localRevenues',           label: 'Local Revenues' },
  { key: 'tifFinancingPlan',        label: 'TIF Financing Plan' },
  { key: 'fundBalanceUse',          label: 'Fund Balance Use' },
  { key: 'stateRevenueSharing',     label: 'State Revenue Sharing' },
];

// ─── Active column logic ───────────────────────────────────────────────────────

export function resolveActiveColumn(phase) {
  switch (phase) {
    case 'dept_requests':          return 'dept_request';
    case 'finance_review':         return 'finance_recommendation';
    case 'manager_recommendation': return 'manager_recommendation';
    case 'budget_committee':       return 'budget_committee_recommendation';
    case 'select_board':           return 'select_board_recommendation';
    case 'adopted':
    case 'tax_commitment':
    case 'budget_control':         return 'adopted_budget';
    default:                       return 'dept_request';
  }
}

export function getColumnLabel(col) {
  const map = {
    prior_year_budget:              'Prior Yr Budget',
    prior_year_actual:              'Prior Yr Actual',
    current_year_budget:            'Cur Yr Budget',
    ytd_actual:                     'YTD Actual',
    projected_year_end:             'Projected YE',
    dept_request:                   'Dept Request',
    finance_recommendation:         'Finance Rec',
    manager_recommendation:         'Mgr Rec',
    budget_committee_recommendation:'BC Rec',
    select_board_recommendation:    'SB Rec',
    adopted_budget:                 'Adopted',
    revised_budget:                 'Revised',
  };
  return map[col] || col;
}

// ─── Aggregation ───────────────────────────────────────────────────────────────

export function aggregateBudget(depts, activeColumn) {
  return depts.reduce((acc, d) => {
    acc.prior_year_budget        += d.prior_year_budget || 0;
    acc.prior_year_actual        += d.prior_year_actual || 0;
    acc.current_year_budget      += d.current_year_budget || 0;
    acc.ytd_actual               += d.ytd_actual || 0;
    acc.projected_year_end       += d.projected_year_end || 0;
    acc.active                   += d[activeColumn] || 0;
    acc.adopted_budget           += d.adopted_budget || 0;
    acc.enterprise_transfers     += d.enterprise_transfer || 0;
    acc.carryforward             += d.carryforward_amount || 0;
    return acc;
  }, { prior_year_budget: 0, prior_year_actual: 0, current_year_budget: 0, ytd_actual: 0, projected_year_end: 0, active: 0, adopted_budget: 0, enterprise_transfers: 0, carryforward: 0 });
}

export function groupDeptsByFund(depts) {
  const groups = {};
  depts.forEach(d => {
    const k = d.fund || 'general_fund';
    if (!groups[k]) groups[k] = [];
    groups[k].push(d);
  });
  return groups;
}

// ─── Variance analysis ─────────────────────────────────────────────────────────

export function computeVariance(depts) {
  return depts.map(d => {
    const adopted = d.adopted_budget || 0;
    const ytd     = d.ytd_actual || 0;
    const proj    = d.projected_year_end || 0;
    const variance = adopted - proj;
    const pct      = adopted > 0 ? (variance / adopted) * 100 : 0;
    return {
      ...d,
      variance,
      variance_pct: parseFloat(pct.toFixed(1)),
      status: variance < 0 ? 'over_budget' : variance < adopted * 0.05 ? 'watch' : 'on_track',
    };
  });
}

// ─── Clone year logic ──────────────────────────────────────────────────────────

export function cloneForNextYear(depts, fromYear, toYear) {
  return depts.map(d => ({
    ...d,
    id: undefined,
    fiscal_year: toYear,
    prior_year_budget:  d.current_year_budget || d.adopted_budget || 0,
    prior_year_actual:  d.projected_year_end || d.ytd_actual || 0,
    current_year_budget: d.adopted_budget || 0,
    ytd_actual: 0,
    projected_year_end: 0,
    dept_request: 0,
    finance_recommendation: 0,
    manager_recommendation: 0,
    budget_committee_recommendation: 0,
    select_board_recommendation: 0,
    adopted_budget: 0,
    revised_budget: 0,
    manager_approved: false,
    budget_committee_approved: false,
    select_board_approved: false,
    justification_narrative: '',
  }));
}

// ─── BETE rollup from dept budgets ────────────────────────────────────────────

export function buildBeteRollupFromDepts(depts, activeColumn) {
  const rollup = {};
  depts.forEach(d => {
    const key = d.bete_mapping;
    if (key) rollup[key] = (rollup[key] || 0) + (d[activeColumn] || 0);
  });
  return rollup;
}

// ─── Validation ────────────────────────────────────────────────────────────────

export function validateBudgetProcess(process, phases, depts) {
  const errors = [], warnings = [], info = [];

  const activePhaseId = process?.current_phase;
  const activePhaseIdx = PHASE_ORDER.indexOf(activePhaseId);

  // All depts have a request entered?
  if (activePhaseIdx >= 2) {
    const missing = depts.filter(d => !d.dept_request && d.fund === 'general_fund');
    if (missing.length > 0)
      warnings.push({ msg: `${missing.length} General Fund department(s) have no budget request entered.` });
  }

  // Any adopted budget == 0 after adoption?
  if (activePhaseIdx >= PHASE_ORDER.indexOf('adopted')) {
    const zero = depts.filter(d => !d.adopted_budget && d.fund === 'general_fund');
    if (zero.length > 0)
      errors.push({ msg: `${zero.length} department(s) have $0 adopted budget — verify.` });
  }

  // Phases past deadline?
  const today = new Date();
  phases.forEach(p => {
    if (p.status === 'in_progress' && p.deadline) {
      const dl = new Date(p.deadline);
      if (dl < today) warnings.push({ msg: `Phase "${p.label}" is past its deadline (${p.deadline}).` });
    }
  });

  // Fund balance use
  if ((process?.fund_balance_use || 0) > (process?.total_appropriations || 0) * 0.15)
    warnings.push({ msg: 'Fund balance use exceeds 15% of total appropriations — review sustainability.' });

  // Enterprise transfers
  const entTotal = depts.filter(d => d.enterprise_transfer > 0).reduce((s, d) => s + d.enterprise_transfer, 0);
  if (entTotal > 0)
    info.push({ msg: `Enterprise fund offsets total $${Math.round(entTotal).toLocaleString()} across ${depts.filter(d => d.enterprise_transfer > 0).length} department(s).` });

  return { errors, warnings, info };
}

// ─── Public summary builder ───────────────────────────────────────────────────

export function buildPublicSummary(process, depts, activeColumn) {
  const totals = aggregateBudget(depts, activeColumn);
  const fy = process?.fiscal_year || 'FY2027';
  const mill = process?.adopted_mill_rate;
  const levy = process?.net_to_be_raised;

  const lines = [
    `Town of Machias ${fy} Budget Summary`,
    '',
    `Total Appropriations: $${Math.round(totals.active).toLocaleString()}`,
    `Prior Year Appropriations: $${Math.round(totals.prior_year_budget).toLocaleString()}`,
    `Change from Prior Year: $${Math.round(totals.active - totals.prior_year_budget).toLocaleString()} (${totals.prior_year_budget > 0 ? (((totals.active - totals.prior_year_budget) / totals.prior_year_budget) * 100).toFixed(1) : 0}%)`,
    '',
    mill ? `Adopted Mill Rate: ${mill.toFixed(3)} mills per $1,000 assessed value` : '',
    levy ? `Net Amount to Be Raised Through Taxation: $${Math.round(levy).toLocaleString()}` : '',
    '',
    'Budget Components:',
    ...Object.entries(groupDeptsByFund(depts)).map(([fund, ds]) => {
      const total = ds.reduce((s, d) => s + (d[activeColumn] || 0), 0);
      return `  ${FUND_LABELS[fund] || fund}: $${Math.round(total).toLocaleString()}`;
    }),
  ].filter(l => l !== undefined);

  return lines.join('\n');
}