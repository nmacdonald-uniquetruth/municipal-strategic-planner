// ─── Machias Municipal Org Chart — Seed Data ─────────────────────────────────
// Positions are defined here as the canonical source of truth.
// Employees are assigned separately.

export const SEED_POSITIONS = [
  // ── Level 1: Residents ──────────────────────────────────────────────────────
  { position_id: 'residents', title: 'Residents & Voters', department: 'Governance', level: 1, reports_to: null, employment_type: 'elected', status: 'filled', sort_order: 0, visible_in_chart: true },

  // ── Level 2: Town Meeting ────────────────────────────────────────────────────
  { position_id: 'town_meeting', title: 'Town Meeting', department: 'Governance', level: 2, reports_to: 'residents', employment_type: 'elected', status: 'filled', sort_order: 0, visible_in_chart: true },

  // ── Level 3: Select Board ────────────────────────────────────────────────────
  { position_id: 'select_board', title: 'Select Board', subtitle: '5 Elected Members', department: 'Select Board', level: 3, reports_to: 'town_meeting', employment_type: 'elected', status: 'filled', sort_order: 0 },
  { position_id: 'sb_chair', title: 'Select Board Chair', department: 'Select Board', level: 3, reports_to: 'select_board', employment_type: 'elected', status: 'filled', sort_order: 1 },
  { position_id: 'sb_vice_chair', title: 'Select Board Vice Chair', department: 'Select Board', level: 3, reports_to: 'select_board', employment_type: 'elected', status: 'filled', sort_order: 2 },
  { position_id: 'sb_member_3', title: 'Select Board Member', department: 'Select Board', level: 3, reports_to: 'select_board', employment_type: 'elected', status: 'vacant', sort_order: 3 },
  { position_id: 'sb_member_4', title: 'Select Board Member', department: 'Select Board', level: 3, reports_to: 'select_board', employment_type: 'elected', status: 'vacant', sort_order: 4 },
  { position_id: 'sb_member_5', title: 'Select Board Member', department: 'Select Board', level: 3, reports_to: 'select_board', employment_type: 'elected', status: 'vacant', sort_order: 5 },

  // ── Level 4: Town Manager ────────────────────────────────────────────────────
  { position_id: 'town_manager', title: 'Town Manager', subtitle: 'Treasurer', department: 'Town Manager', level: 4, reports_to: 'select_board', employment_type: 'full_time', status: 'filled', base_salary: 75000, fund_source: 'general_fund', sort_order: 0 },

  // ── Boards & Committees (report to Select Board / Town Meeting) ────────────
  { position_id: 'budget_committee', title: 'Budget Committee', department: 'Governance', level: 3, reports_to: 'town_meeting', employment_type: 'appointed', status: 'filled', sort_order: 10 },
  { position_id: 'planning_board', title: 'Planning Board', department: 'Governance', level: 3, reports_to: 'select_board', employment_type: 'appointed', status: 'filled', sort_order: 11 },
  { position_id: 'board_of_appeals', title: 'Board of Appeals', department: 'Governance', level: 3, reports_to: 'select_board', employment_type: 'appointed', status: 'filled', sort_order: 12 },

  // ── Level 5: Departments ─────────────────────────────────────────────────────

  // Finance & Administration
  { position_id: 'finance_director', title: 'Finance Director', subtitle: 'Asst. Director of HR · Deputy Treasurer', department: 'Finance & Administration', level: 5, reports_to: 'town_manager', employment_type: 'full_time', status: 'filled', base_salary: 68000, fund_source: 'general_fund', sort_order: 0 },

  // Clerk's Office
  { position_id: 'town_clerk', title: 'Town Clerk', subtitle: 'Tax Collector', department: "Clerk's Office", level: 5, reports_to: 'town_manager', employment_type: 'full_time', status: 'filled', base_salary: 45000, fund_source: 'general_fund', sort_order: 1 },
  { position_id: 'deputy_clerk', title: 'Deputy Town Clerk', subtitle: 'Executive Assistant', department: "Clerk's Office", level: 6, reports_to: 'town_clerk', employment_type: 'full_time', status: 'filled', base_salary: 38000, fund_source: 'general_fund', sort_order: 0 },

  // Police
  { position_id: 'police_chief', title: 'Chief of Police', department: 'Police Department', level: 5, reports_to: 'town_manager', employment_type: 'full_time', status: 'filled', base_salary: 72000, fund_source: 'general_fund', sort_order: 2 },
  { position_id: 'police_sergeant', title: 'Sergeant', department: 'Police Department', level: 6, reports_to: 'police_chief', employment_type: 'full_time', status: 'filled', is_union: true, base_salary: 58000, fund_source: 'general_fund', sort_order: 0 },
  { position_id: 'police_corporal', title: 'Corporal', department: 'Police Department', level: 6, reports_to: 'police_chief', employment_type: 'full_time', status: 'filled', is_union: true, base_salary: 55000, fund_source: 'general_fund', sort_order: 1 },
  { position_id: 'police_officer_1', title: 'Police Officer', department: 'Police Department', level: 7, reports_to: 'police_chief', employment_type: 'full_time', status: 'filled', is_union: true, base_salary: 48000, fund_source: 'general_fund', sort_order: 2 },
  { position_id: 'police_reserve_1', title: 'Reserve Officer', department: 'Police Department', level: 7, reports_to: 'police_chief', employment_type: 'part_time', status: 'filled', fund_source: 'general_fund', sort_order: 3 },
  { position_id: 'police_reserve_2', title: 'Reserve Officer', department: 'Police Department', level: 7, reports_to: 'police_chief', employment_type: 'part_time', status: 'filled', fund_source: 'general_fund', sort_order: 4 },
  { position_id: 'police_reserve_3', title: 'Reserve Officer / SRO', subtitle: 'School Resource Officer', department: 'Police Department', level: 7, reports_to: 'police_chief', employment_type: 'part_time', status: 'filled', fund_source: 'general_fund', sort_order: 5 },
  { position_id: 'police_reserve_4', title: 'Reserve Officer', department: 'Police Department', level: 7, reports_to: 'police_chief', employment_type: 'part_time', status: 'filled', fund_source: 'general_fund', sort_order: 6 },
  { position_id: 'police_reserve_5', title: 'Reserve Officer', department: 'Police Department', level: 7, reports_to: 'police_chief', employment_type: 'part_time', status: 'filled', fund_source: 'general_fund', sort_order: 7 },
  { position_id: 'police_reserve_6', title: 'Reserve Officer', department: 'Police Department', level: 7, reports_to: 'police_chief', employment_type: 'part_time', status: 'filled', fund_source: 'general_fund', sort_order: 8 },
  { position_id: 'police_reserve_7', title: 'Reserve Officer', department: 'Police Department', level: 7, reports_to: 'police_chief', employment_type: 'part_time', status: 'filled', fund_source: 'general_fund', sort_order: 9 },
  { position_id: 'police_reserve_8', title: 'Reserve Officer', department: 'Police Department', level: 7, reports_to: 'police_chief', employment_type: 'part_time', status: 'filled', fund_source: 'general_fund', sort_order: 10 },
  { position_id: 'police_reserve_9', title: 'Reserve Officer', department: 'Police Department', level: 7, reports_to: 'police_chief', employment_type: 'part_time', status: 'filled', fund_source: 'general_fund', sort_order: 11 },
  { position_id: 'animal_control', title: 'Animal Control Officer', department: 'Police Department', level: 7, reports_to: 'police_chief', employment_type: 'part_time', status: 'filled', fund_source: 'general_fund', sort_order: 12 },
  { position_id: 'harbor_master', title: 'Harbor Master', department: 'Police Department', level: 6, reports_to: 'police_chief', employment_type: 'stipend', status: 'filled', fund_source: 'general_fund', sort_order: 13 },

  // Public Works
  { position_id: 'pw_director', title: 'Public Works Director', department: 'Public Works', level: 5, reports_to: 'town_manager', employment_type: 'full_time', status: 'filled', fund_source: 'general_fund', sort_order: 3 },

  // Fire
  { position_id: 'fire_chief', title: 'Fire Chief', department: 'Fire Department', level: 5, reports_to: 'town_manager', employment_type: 'full_time', status: 'filled', fund_source: 'general_fund', sort_order: 4 },

  // Ambulance
  { position_id: 'ambulance_chief', title: 'Ambulance Chief', department: 'Ambulance Service', level: 5, reports_to: 'town_manager', employment_type: 'full_time', status: 'filled', base_salary: 65000, fund_source: 'ambulance_fund', sort_order: 5 },
  { position_id: 'paramedic_1', title: 'Paramedic', department: 'Ambulance Service', level: 6, reports_to: 'ambulance_chief', employment_type: 'full_time', status: 'vacant', fund_source: 'ambulance_fund', sort_order: 0 },
  { position_id: 'paramedic_ruby', title: "Ruby's Paramedic Position", department: 'Ambulance Service', level: 6, reports_to: 'ambulance_chief', employment_type: 'full_time', status: 'vacant', fund_source: 'ambulance_fund', sort_order: 1 },

  // Wastewater
  { position_id: 'wastewater_super', title: 'Wastewater Superintendent', department: 'Wastewater', level: 5, reports_to: 'town_manager', employment_type: 'full_time', status: 'filled', fund_source: 'sewer_fund', sort_order: 6 },
  { position_id: 'wastewater_contract', title: 'Contract Operations Oversight', subtitle: 'Olver Associates', department: 'Wastewater', level: 6, reports_to: 'wastewater_super', employment_type: 'contracted', status: 'filled', fund_source: 'sewer_fund', sort_order: 0 },

  // Assessing
  { position_id: 'tax_assessor', title: 'Tax Assessor', department: 'Assessing', level: 5, reports_to: 'town_manager', employment_type: 'contracted', status: 'filled', fund_source: 'general_fund', sort_order: 7 },

  // Code Enforcement
  { position_id: 'code_enforcement', title: 'Code Enforcement / Plumbing Inspector', subtitle: 'Airport Inspector', department: 'Code Enforcement', level: 5, reports_to: 'town_manager', employment_type: 'full_time', status: 'filled', fund_source: 'general_fund', sort_order: 8 },

  // ── Finance Dept Positions (configurable) ────────────────────────────────────
  { position_id: 'controller', title: 'Controller', department: 'Finance & Administration', level: 6, reports_to: 'finance_director', employment_type: 'full_time', status: 'vacant', base_salary: 85000, fund_source: 'general_fund', is_configurable: true, scenario_tags: 'controller_sa,controller_2sa,controller_sa_ptsa', sort_order: 0 },
  { position_id: 'staff_accountant', title: 'Staff Accountant', department: 'Finance & Administration', level: 6, reports_to: 'finance_director', employment_type: 'full_time', status: 'vacant', base_salary: 65000, fund_source: 'general_fund', is_configurable: true, scenario_tags: 'controller_sa,controller_2sa,two_sa,sa_ptsa,controller_sa_ptsa', sort_order: 1 },
  { position_id: 'staff_accountant_2', title: 'Second Staff Accountant', department: 'Finance & Administration', level: 6, reports_to: 'finance_director', employment_type: 'full_time', status: 'vacant', base_salary: 65000, fund_source: 'general_fund', is_configurable: true, scenario_tags: 'controller_2sa,two_sa', sort_order: 2 },
  { position_id: 'staff_accountant_pt', title: 'Part-Time Staff Accountant', department: 'Finance & Administration', level: 6, reports_to: 'finance_director', employment_type: 'part_time', status: 'vacant', base_salary: 32000, fund_source: 'general_fund', is_configurable: true, scenario_tags: 'sa_ptsa,controller_sa_ptsa', sort_order: 3 },
  { position_id: 'billing_specialist', title: 'Billing Specialist', department: 'Finance & Administration', level: 6, reports_to: 'finance_director', employment_type: 'full_time', status: 'vacant', base_salary: 55000, fund_source: 'general_fund', is_configurable: true, scenario_tags: 'one_bs,two_bs,bs_rc', sort_order: 4 },
  { position_id: 'billing_specialist_2', title: 'Second Billing Specialist', department: 'Finance & Administration', level: 6, reports_to: 'finance_director', employment_type: 'full_time', status: 'vacant', base_salary: 55000, fund_source: 'general_fund', is_configurable: true, scenario_tags: 'two_bs', sort_order: 5 },
  { position_id: 'revenue_coordinator', title: 'Revenue Coordinator', department: 'Finance & Administration', level: 6, reports_to: 'finance_director', employment_type: 'full_time', status: 'vacant', base_salary: 39000, fund_source: 'regional_revenue', is_configurable: true, scenario_tags: 'bs_rc', sort_order: 6 },
  { position_id: 'ga_coordinator', title: 'General Assistance Coordinator', department: 'Finance & Administration', level: 6, reports_to: 'town_manager', reports_to_alt: 'finance_director', employment_type: 'stipend', status: 'vacant', base_salary: 10000, fund_source: 'general_fund', is_configurable: true, sort_order: 7 },

  // ── School Governance ────────────────────────────────────────────────────────
  { position_id: 'school_committee', title: 'School Committee', subtitle: '5 Elected Members', department: 'School Governance', level: 3, reports_to: 'residents', employment_type: 'elected', status: 'filled', sort_order: 20 },
  { position_id: 'sc_member_1', title: 'School Committee Member', department: 'School Governance', level: 3, reports_to: 'school_committee', employment_type: 'elected', status: 'filled', sort_order: 0 },
  { position_id: 'sc_member_2', title: 'School Committee Member', department: 'School Governance', level: 3, reports_to: 'school_committee', employment_type: 'elected', status: 'filled', sort_order: 1 },
  { position_id: 'sc_member_3', title: 'School Committee Member', department: 'School Governance', level: 3, reports_to: 'school_committee', employment_type: 'elected', status: 'filled', sort_order: 2 },
  { position_id: 'sc_member_4', title: 'School Committee Member', department: 'School Governance', level: 3, reports_to: 'school_committee', employment_type: 'elected', status: 'vacant', sort_order: 3 },
  { position_id: 'sc_member_5', title: 'School Committee Member', department: 'School Governance', level: 3, reports_to: 'school_committee', employment_type: 'elected', status: 'vacant', sort_order: 4 },

  // School Administration
  { position_id: 'superintendent', title: 'Superintendent', subtitle: 'AOS 96', department: 'School Administration', level: 4, reports_to: 'school_committee', employment_type: 'full_time', status: 'filled', fund_source: 'school', sort_order: 0 },
  { position_id: 'mmhs_principal', title: 'Principal', subtitle: 'Machias Memorial High School', department: 'School Administration', level: 5, reports_to: 'superintendent', employment_type: 'full_time', status: 'filled', fund_source: 'school', sort_order: 0 },
  { position_id: 'rmge_principal', title: 'Principal', subtitle: 'Rose M Gaffney Elementary', department: 'School Administration', level: 5, reports_to: 'superintendent', employment_type: 'full_time', status: 'filled', fund_source: 'school', sort_order: 1 },
  { position_id: 'rmge_asst_principal', title: 'Assistant Principal & Athletic Director', subtitle: 'Rose M Gaffney Elementary', department: 'School Administration', level: 6, reports_to: 'rmge_principal', employment_type: 'full_time', status: 'filled', fund_source: 'school', sort_order: 0 },
];

export const SEED_EMPLOYEES = [
  { position_id: 'sb_chair', full_name: 'Jake Patryn', status: 'active' },
  { position_id: 'sb_vice_chair', full_name: 'Ben Edwards', status: 'active' },
  { position_id: 'town_manager', full_name: 'Sarah Craighead Dedmon', status: 'active' },
  { position_id: 'finance_director', full_name: 'Nicholas MacDonald', status: 'active' },
  { position_id: 'town_clerk', full_name: 'Sandra Clifford', status: 'active' },
  { position_id: 'deputy_clerk', full_name: 'Jane Foss', status: 'active' },
  { position_id: 'police_chief', full_name: 'Keith Mercier', status: 'active' },
  { position_id: 'police_corporal', full_name: 'Timothy Mace', status: 'active' },
  { position_id: 'police_sergeant', full_name: 'Wade Walker', status: 'active' },
  { position_id: 'police_officer_1', full_name: 'James Frauenhoffer', status: 'active' },
  { position_id: 'police_reserve_1', full_name: 'William Sternbergh', status: 'active' },
  { position_id: 'police_reserve_2', full_name: 'Wayde Carter', status: 'active' },
  { position_id: 'police_reserve_3', full_name: 'Christy Verburgt', status: 'active' },
  { position_id: 'police_reserve_4', full_name: 'Dennis Perry', status: 'active' },
  { position_id: 'police_reserve_5', full_name: 'Amy Wells', status: 'active' },
  { position_id: 'police_reserve_6', full_name: 'Ryan Allen', status: 'active' },
  { position_id: 'police_reserve_7', full_name: 'Wayne Robbins', status: 'active' },
  { position_id: 'police_reserve_8', full_name: 'Allen Corey', status: 'active' },
  { position_id: 'animal_control', full_name: 'Jennifer Lewis', status: 'active' },
  { position_id: 'harbor_master', full_name: 'Jake Patryn', status: 'active' },
  { position_id: 'pw_director', full_name: 'Mike Schoppee', status: 'active' },
  { position_id: 'fire_chief', full_name: 'Joe Thompson', status: 'active' },
  { position_id: 'ambulance_chief', full_name: 'Ryan Maker', status: 'active' },
  { position_id: 'wastewater_super', full_name: 'Dakota Norton', status: 'active' },
  { position_id: 'wastewater_contract', full_name: 'Annaleis Hanford', status: 'active' },
  { position_id: 'tax_assessor', full_name: 'Tony Bennett', status: 'active' },
  { position_id: 'code_enforcement', full_name: 'Betsy Fitzgerald', status: 'active' },
  { position_id: 'sc_member_1', full_name: 'Teresa Saddler', status: 'active' },
  { position_id: 'sc_member_2', full_name: 'Cathy Morse', status: 'active' },
  { position_id: 'sc_member_3', full_name: 'Chloe Flower', status: 'active' },
  { position_id: 'superintendent', full_name: 'Nicole Case', status: 'active' },
  { position_id: 'mmhs_principal', full_name: 'Wendy Black', status: 'active' },
  { position_id: 'rmge_principal', full_name: 'Sue Dow', status: 'active' },
  { position_id: 'rmge_asst_principal', full_name: 'Chad Fitzsimmons', status: 'active' },
];

export const SEED_SCENARIOS = [
  { name: 'Current Structure', description: 'Existing organization as-is — no restructuring', is_baseline: true, finance_structure: 'two_sa', billing_structure: 'one_bs', ga_reporting: 'town_manager', show_vacant: true, show_part_time: true, enable_regional: false, color: '#344A60' },
  { name: 'Controller Model', description: 'Add Controller above SA; single billing specialist', finance_structure: 'controller_sa', billing_structure: 'one_bs', ga_reporting: 'finance_director', show_vacant: true, show_part_time: false, enable_regional: false, color: '#2A7F7F' },
  { name: 'Two Staff Accountant Model', description: 'Dual SA approach without Controller', finance_structure: 'two_sa', billing_structure: 'one_bs', ga_reporting: 'finance_director', show_vacant: true, show_part_time: false, enable_regional: false, color: '#9C5334' },
  { name: 'Regional Finance Model', description: 'Full regional services: BS + Revenue Coordinator', finance_structure: 'two_sa', billing_structure: 'bs_rc', ga_reporting: 'finance_director', show_vacant: true, show_part_time: false, enable_regional: true, color: '#5b6f3e' },
  { name: 'Administrative Consolidation', description: 'Controller + two SAs + dual billing — full build-out', finance_structure: 'controller_2sa', billing_structure: 'two_bs', ga_reporting: 'finance_director', show_vacant: false, show_part_time: true, enable_regional: true, color: '#6b4c8a' },
];

// ─── Scenario logic: which positions are visible given scenario settings ──────
export function getVisiblePositions(positions, scenario) {
  const fs = scenario.finance_structure;
  const bs = scenario.billing_structure;

  const FINANCE_STRUCTURE_MAP = {
    controller_sa: ['controller', 'staff_accountant'],
    controller_2sa: ['controller', 'staff_accountant', 'staff_accountant_2'],
    two_sa: ['staff_accountant', 'staff_accountant_2'],
    sa_ptsa: ['staff_accountant', 'staff_accountant_pt'],
    controller_sa_ptsa: ['controller', 'staff_accountant', 'staff_accountant_pt'],
  };

  const BILLING_STRUCTURE_MAP = {
    one_bs: ['billing_specialist'],
    two_bs: ['billing_specialist', 'billing_specialist_2'],
    bs_rc: ['billing_specialist', 'revenue_coordinator'],
  };

  const activeFinanceIds = FINANCE_STRUCTURE_MAP[fs] || [];
  const activeBillingIds = BILLING_STRUCTURE_MAP[bs] || [];
  const activeMgmtIds = [...activeFinanceIds, ...activeBillingIds, 'ga_coordinator'];

  return positions.map(p => {
    // Non-configurable positions: visible unless part_time hidden
    if (!p.is_configurable) {
      if (!scenario.show_part_time && p.employment_type === 'part_time') return { ...p, _hidden: true };
      if (!scenario.show_vacant && p.status === 'vacant') return { ...p, _hidden: true };
      return { ...p, _hidden: false };
    }

    // Configurable positions: only show if in active set
    const isActive = activeMgmtIds.includes(p.position_id);
    if (!isActive) return { ...p, _hidden: true };
    if (!scenario.show_vacant && p.status === 'vacant') return { ...p, _hidden: true };

    // GA Coordinator reporting line
    if (p.position_id === 'ga_coordinator') {
      return { ...p, _hidden: false, reports_to: scenario.ga_reporting === 'finance_director' ? 'finance_director' : 'town_manager' };
    }

    return { ...p, _hidden: false };
  });
}

// Build a tree from a flat list of positions
export function buildTree(positions, employeeMap) {
  const visible = positions.filter(p => !p._hidden);
  const byId = {};
  visible.forEach(p => { byId[p.position_id] = { ...p, children: [], employee: employeeMap[p.position_id] || null }; });

  const roots = [];
  visible.forEach(p => {
    const node = byId[p.position_id];
    if (!node) return;
    if (p.reports_to && byId[p.reports_to]) {
      byId[p.reports_to].children.push(node);
    } else if (!p.reports_to) {
      roots.push(node);
    } else {
      roots.push(node); // orphan — float to root
    }
  });

  // Sort children by sort_order
  const sortChildren = (node) => {
    node.children.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    node.children.forEach(sortChildren);
  };
  roots.forEach(sortChildren);
  roots.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  return roots;
}

// Department color map
export const DEPT_COLORS = {
  'Governance': '#344A60',
  'Select Board': '#344A60',
  'Town Manager': '#344A60',
  'Finance & Administration': '#2A7F7F',
  "Clerk's Office": '#5b6f3e',
  'Police Department': '#1a3a5c',
  'Public Works': '#7a5c2e',
  'Fire Department': '#8B2020',
  'Ambulance Service': '#9C5334',
  'Wastewater': '#3d6b8a',
  'Assessing': '#6b4c8a',
  'Code Enforcement': '#4a6b4a',
  'School Governance': '#2e5c6b',
  'School Administration': '#2e5c6b',
};

export const FUND_LABELS = {
  general_fund: 'GF',
  ambulance_fund: 'AMB',
  sewer_fund: 'SEW',
  transfer_station: 'TS',
  airport: 'AIR',
  school: 'SCH',
  enterprise: 'ENT',
  regional_revenue: 'REG',
  grant: 'GNT',
};