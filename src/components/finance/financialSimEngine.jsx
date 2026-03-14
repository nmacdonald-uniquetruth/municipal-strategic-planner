// ─── Financial Simulation Engine ─────────────────────────────────────────────

export const MACHIAS_POPULATION = 2100;
export const AVG_HOUSEHOLD_SIZE = 2.3;
export const AVG_HOME_VALUE = 148000; // assessed value per residential parcel

// Default department budget seed data (based on typical small Maine municipality)
export const DEFAULT_DEPT_BUDGETS = [
  { department_name: 'Town Manager / Administration', department_key: 'town_mgr',   fund_type: 'general_fund',    annual_budget: 185000,  personnel_costs: 155000, operating_costs: 30000,  capital_budget: 0 },
  { department_name: 'Finance & Human Resources',     department_key: 'finance_hr', fund_type: 'general_fund',    annual_budget: 165000,  personnel_costs: 140000, operating_costs: 25000,  capital_budget: 0 },
  { department_name: 'Town Clerk Office',             department_key: 'town_clerk', fund_type: 'general_fund',    annual_budget: 72000,   personnel_costs: 62000,  operating_costs: 10000,  capital_budget: 0 },
  { department_name: 'Police Department',             department_key: 'police',     fund_type: 'general_fund',    annual_budget: 680000,  personnel_costs: 590000, operating_costs: 90000,  capital_budget: 45000 },
  { department_name: 'Fire Department',               department_key: 'fire',       fund_type: 'general_fund',    annual_budget: 195000,  personnel_costs: 85000,  operating_costs: 60000,  capital_budget: 50000 },
  { department_name: 'Ambulance Department',          department_key: 'ambulance',  fund_type: 'enterprise_fund', annual_budget: 920000,  personnel_costs: 780000, operating_costs: 140000, capital_budget: 90000 },
  { department_name: 'Public Works',                  department_key: 'public_works',fund_type: 'general_fund',   annual_budget: 520000,  personnel_costs: 320000, operating_costs: 200000, capital_budget: 80000 },
  { department_name: 'Wastewater',                    department_key: 'wastewater', fund_type: 'enterprise_fund', annual_budget: 380000,  personnel_costs: 160000, operating_costs: 220000, capital_budget: 60000 },
  { department_name: 'Transfer Station',              department_key: 'transfer_stn',fund_type: 'enterprise_fund',annual_budget: 210000,  personnel_costs: 95000,  operating_costs: 115000, capital_budget: 20000 },
  { department_name: 'Parks & Recreation',            department_key: 'parks_rec',  fund_type: 'general_fund',    annual_budget: 68000,   personnel_costs: 48000,  operating_costs: 20000,  capital_budget: 10000 },
  { department_name: 'Airport',                       department_key: 'airport',    fund_type: 'enterprise_fund', annual_budget: 95000,   personnel_costs: 28000,  operating_costs: 67000,  capital_budget: 15000 },
  { department_name: 'Planning & Development',        department_key: 'planning',   fund_type: 'general_fund',    annual_budget: 42000,   personnel_costs: 32000,  operating_costs: 10000,  capital_budget: 0 },
];

export const DEFAULT_CAPITAL_PROJECTS = [
  { project_name: 'Police Cruiser Replacement',     department: 'Police Department',        project_cost: 55000,  timeline_years: 1, funding_source: 'reserve_fund', status: 'planned',   annual_operating_impact: 3000 },
  { project_name: 'Fire Truck Replacement',         department: 'Fire Department',          project_cost: 450000, timeline_years: 3, funding_source: 'bond',         status: 'planned',   annual_operating_impact: 8000 },
  { project_name: 'Public Works Facility Repair',  department: 'Public Works',             project_cost: 120000, timeline_years: 2, funding_source: 'general_fund', status: 'planned',   annual_operating_impact: 0 },
  { project_name: 'Wastewater Pump Upgrade',       department: 'Wastewater',               project_cost: 280000, timeline_years: 2, funding_source: 'enterprise_fund', status: 'approved', annual_operating_impact: -12000 },
  { project_name: 'Transfer Station Improvements', department: 'Transfer Station',         project_cost: 85000,  timeline_years: 1, funding_source: 'enterprise_fund', status: 'planned',  annual_operating_impact: 0 },
  { project_name: 'Airport Runway Maintenance',    department: 'Airport',                  project_cost: 75000,  timeline_years: 1, funding_source: 'grant',        status: 'planned',   annual_operating_impact: 0 },
  { project_name: 'ERP System Implementation',     department: 'Finance & Human Resources',project_cost: 47000,  timeline_years: 1, funding_source: 'reserve_fund', status: 'approved',  annual_operating_impact: -21000 },
];

// ── Tax math ─────────────────────────────────────────────────────────────────
export function millRateToTaxPerHome(millRate, homeValue = AVG_HOME_VALUE) {
  return (millRate / 1000) * homeValue;
}

export function budgetChangeToMillRate(budgetDelta, taxBase = 198000000) {
  return (budgetDelta / taxBase) * 1000;
}

export function budgetChangeToTaxPerHome(budgetDelta, homeValue = AVG_HOME_VALUE, taxBase = 198000000) {
  return (budgetDelta / taxBase) * homeValue;
}

export function costPerResident(amount) {
  return (amount / MACHIAS_POPULATION).toFixed(2);
}

// ── Aggregate stats from budget list ─────────────────────────────────────────
export function computeBudgetSummary(budgets) {
  const gf   = budgets.filter(b => b.fund_type === 'general_fund');
  const ent  = budgets.filter(b => b.fund_type === 'enterprise_fund');
  const cap  = budgets.filter(b => b.fund_type === 'capital_fund');
  const grant= budgets.filter(b => b.fund_type === 'grant_fund');

  const sum = arr => arr.reduce((s, b) => s + (b.annual_budget || 0), 0);
  const psum= arr => arr.reduce((s, b) => s + (b.personnel_costs || 0), 0);
  const osum= arr => arr.reduce((s, b) => s + (b.operating_costs || 0), 0);

  const totalGF = sum(gf);
  const totalAll = sum(budgets);
  const totalPersonnel = psum(budgets);
  const totalOperating = osum(budgets);

  return {
    totalAll, totalGF,
    totalEnterprise: sum(ent),
    totalCapital: sum(cap),
    totalGrant: sum(grant),
    totalPersonnel,
    totalOperating,
    personnelPct: totalAll > 0 ? totalPersonnel / totalAll : 0,
    gfPersonnelPct: totalGF > 0 ? psum(gf) / totalGF : 0,
    costPerResidentAll: costPerResident(totalAll),
    costPerResidentGF: costPerResident(totalGF),
    byDept: budgets.map(b => ({
      ...b,
      costPerResident: costPerResident(b.annual_budget || 0),
      personnelPct: (b.annual_budget || 0) > 0 ? ((b.personnel_costs || 0) / b.annual_budget) : 0,
    })),
  };
}

// ── Scenario simulation ────────────────────────────────────────────────────────
export function simulateScenario(baseBudgets, changes) {
  // changes: array of { department_key, budget_delta, personnel_delta, description }
  const modified = baseBudgets.map(b => {
    const change = changes.find(c => c.department_key === b.department_key);
    if (!change) return b;
    return {
      ...b,
      annual_budget: (b.annual_budget || 0) + (change.budget_delta || 0),
      personnel_costs: (b.personnel_costs || 0) + (change.personnel_delta || 0),
    };
  });
  const baseSummary = computeBudgetSummary(baseBudgets);
  const newSummary  = computeBudgetSummary(modified);
  const gfDelta = newSummary.totalGF - baseSummary.totalGF;
  return {
    modified,
    baseSummary,
    newSummary,
    gfDelta,
    millRateDelta: budgetChangeToMillRate(gfDelta),
    taxPerHomeDelta: budgetChangeToTaxPerHome(gfDelta),
  };
}

// Preset scenarios
export const PRESET_SCENARIOS = [
  {
    id: 'restructuring',
    label: 'Proposed Restructuring (Phase 1)',
    description: 'Add Staff Accountant ($108K), Billing Specialist ($98K to Ambulance Fund), GA Coordinator ($10K stipend). Offset by Comstar savings ($34K) and stipend elimination ($26K).',
    changes: [
      { department_key: 'finance_hr',  budget_delta: 92000,  personnel_delta: 92000,  description: 'SA + GA Coordinator, net of stipend elimination' },
      { department_key: 'ambulance',   budget_delta: 64000,  personnel_delta: 64000,  description: 'Billing Specialist (replaces Comstar fees)' },
    ],
  },
  {
    id: 'merge_fire_ems',
    label: 'Consolidate Fire & EMS Admin',
    description: 'Merge administrative overhead of Fire and Ambulance departments under a shared Emergency Services Director. Saves ~$45K/yr in overhead.',
    changes: [
      { department_key: 'fire',      budget_delta: -22000, personnel_delta: -22000, description: 'Shared admin savings' },
      { department_key: 'ambulance', budget_delta: -23000, personnel_delta: -23000, description: 'Shared admin savings' },
    ],
  },
  {
    id: 'police_vehicle',
    label: 'Police Fleet Capital (Year 1)',
    description: 'Fund one cruiser replacement from reserve fund. Adds $3K annual operating cost.',
    changes: [
      { department_key: 'police', budget_delta: 3000, personnel_delta: 0, description: 'Cruiser operating cost increase' },
    ],
  },
  {
    id: 'pw_reduction',
    label: 'Public Works — Reduce Overtime',
    description: 'Reduce Public Works overtime budget by $18K through improved scheduling.',
    changes: [
      { department_key: 'public_works', budget_delta: -18000, personnel_delta: -18000, description: 'Overtime reduction' },
    ],
  },
  {
    id: 'shared_services',
    label: 'Regional Shared Services',
    description: 'Add Revenue Coordinator ($62K) funded by regional contracts ($65K+). Net positive to GF.',
    changes: [
      { department_key: 'finance_hr', budget_delta: 62000, personnel_delta: 62000, description: 'Revenue Coordinator hire' },
    ],
    revenueOffset: 65000,
  },
];

export const FUND_COLORS = {
  general_fund: '#344A60',
  enterprise_fund: '#2A7F7F',
  capital_fund: '#8B6914',
  grant_fund: '#4A6741',
};

export const FUND_LABELS = {
  general_fund: 'General Fund',
  enterprise_fund: 'Enterprise Fund',
  capital_fund: 'Capital Fund',
  grant_fund: 'Grant Fund',
};