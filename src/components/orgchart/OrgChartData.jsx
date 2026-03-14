// ─── Org Chart Data & Logic ────────────────────────────────────────────────────
// All positions and employees are defined here as the canonical source of truth.
// The chart regenerates automatically from settings.

export const DEPT_COLORS = {
  Governance:   '#1a3a5c',
  'Select Board': '#1a3a5c',
  'Town Manager': '#1a6b5c',
  Finance:      '#2a7a4a',
  Police:       '#8B2020',
  Fire:         '#7a2020',
  Ambulance:    '#8a4020',
  'Public Works': '#7a5c1a',
  Wastewater:   '#2a5c7a',
  Assessing:    '#5c3d8a',
  'Code Enforcement': '#3a5c3a',
  "Clerk's Office": '#3d6b4a',
  Schools:      '#2a4c6b',
  Vacant:       '#64748b',
};

// ─── Node type constants ───────────────────────────────────────────────────────
// structural = governance/committee body, never shows vacancy
// position   = actual municipal role, may be filled or vacant
export const NODE_TYPES = {
  STRUCTURAL: 'structural',
  POSITION: 'position',
};

// ─── Static employees assigned to fixed positions ─────────────────────────────
export const STATIC_POSITIONS = [
  // Governance — structural nodes (no vacancy logic)
  { id: 'residents',      title: 'Residents & Voters',    dept: 'Governance',   reportsTo: null,           nodeType: 'structural', status: 'structural', fullTime: false, employee: null },
  { id: 'town_meeting',   title: 'Town Meeting',          dept: 'Governance',   reportsTo: 'residents',    nodeType: 'structural', status: 'structural', fullTime: false, employee: null },
  { id: 'select_board',   title: 'Select Board',          dept: 'Select Board', reportsTo: 'town_meeting', nodeType: 'structural', status: 'structural', fullTime: false, employee: null },
  { id: 'sb_chair',       title: 'Chair, Select Board',   dept: 'Select Board', reportsTo: 'select_board', nodeType: 'position',   status: 'filled', fullTime: false, employee: 'Jake Patryn' },
  { id: 'sb_vice_chair',  title: 'Vice Chair, Select Board', dept: 'Select Board', reportsTo: 'select_board', nodeType: 'position', status: 'filled', fullTime: false, employee: 'Ben Edwards' },

  // Town Manager — position
  { id: 'town_manager',   title: 'Town Manager | Treasurer', dept: 'Town Manager', reportsTo: 'select_board', nodeType: 'position', status: 'filled', fullTime: true, employee: 'Sarah Craighead Dedmon' },

  // Finance Department — positions
  { id: 'finance_director', title: 'Finance Director & Asst. Director of HR', dept: 'Finance', reportsTo: 'town_manager', nodeType: 'position', status: 'filled', fullTime: true, employee: 'Nicholas MacDonald' },

  // Police — positions
  { id: 'police_chief',   title: 'Chief of Police',       dept: 'Police',       reportsTo: 'town_manager', nodeType: 'position', status: 'filled', fullTime: true,  employee: 'Keith Mercier' },
  { id: 'police_corp',    title: 'Corporal',               dept: 'Police',       reportsTo: 'police_chief', nodeType: 'position', status: 'filled', fullTime: true,  employee: 'Timothy Mace', isUnion: true },
  { id: 'police_sgt',     title: 'Sergeant',               dept: 'Police',       reportsTo: 'police_chief', nodeType: 'position', status: 'filled', fullTime: true,  employee: 'Wade Walker', isUnion: true },
  { id: 'police_off1',    title: 'Officer',                dept: 'Police',       reportsTo: 'police_chief', nodeType: 'position', status: 'filled', fullTime: true,  employee: 'James Frauenhoffer', isUnion: true },
  { id: 'police_res1',    title: 'Reserve Officer',        dept: 'Police',       reportsTo: 'police_chief', nodeType: 'position', status: 'filled', fullTime: false, employee: 'William Sternbergh' },
  { id: 'police_res2',    title: 'Reserve Officer',        dept: 'Police',       reportsTo: 'police_chief', nodeType: 'position', status: 'filled', fullTime: false, employee: 'Wayde Carter' },
  { id: 'police_res3',    title: 'Reserve Officer / SRO',  dept: 'Police',       reportsTo: 'police_chief', nodeType: 'position', status: 'filled', fullTime: false, employee: 'Christy Verburgt' },
  { id: 'police_res4',    title: 'Reserve Officer',        dept: 'Police',       reportsTo: 'police_chief', nodeType: 'position', status: 'filled', fullTime: false, employee: 'Dennis Perry' },
  { id: 'police_res5',    title: 'Reserve Officer',        dept: 'Police',       reportsTo: 'police_chief', nodeType: 'position', status: 'filled', fullTime: false, employee: 'Amy Wells' },
  { id: 'police_res6',    title: 'Reserve Officer',        dept: 'Police',       reportsTo: 'police_chief', nodeType: 'position', status: 'filled', fullTime: false, employee: 'Ryan Allen' },
  { id: 'police_res7',    title: 'Reserve Officer',        dept: 'Police',       reportsTo: 'police_chief', nodeType: 'position', status: 'filled', fullTime: false, employee: 'Wayne Robbins' },
  { id: 'police_res8',    title: 'Reserve Officer',        dept: 'Police',       reportsTo: 'police_chief', nodeType: 'position', status: 'filled', fullTime: false, employee: 'Allen Corey' },

  // Animal Control / Harbor — positions
  { id: 'animal_ctrl',    title: 'Animal Control Officer', dept: 'Police',       reportsTo: 'town_manager', nodeType: 'position', status: 'filled', fullTime: false, employee: 'Jennifer Lewis' },
  { id: 'harbor_master',  title: 'Harbor Master',          dept: 'Town Manager', reportsTo: 'town_manager', nodeType: 'position', status: 'filled', fullTime: false, employee: 'Jake Patryn' },

  // Public Works — position
  { id: 'pw_director',    title: 'Public Works Director',  dept: 'Public Works', reportsTo: 'town_manager', nodeType: 'position', status: 'filled', fullTime: true,  employee: 'Mike Schoppee' },

  // Fire — position
  { id: 'fire_chief',     title: 'Fire Chief',             dept: 'Fire',         reportsTo: 'town_manager', nodeType: 'position', status: 'filled', fullTime: true,  employee: 'Joe Thompson' },

  // Ambulance — positions
  { id: 'amb_chief',      title: 'Ambulance Chief',        dept: 'Ambulance',    reportsTo: 'town_manager', nodeType: 'position', status: 'filled', fullTime: true,  employee: 'Ryan Maker' },
  { id: 'paramedic_ruby', title: "Paramedic (Ruby's Position)", dept: 'Ambulance', reportsTo: 'amb_chief',  nodeType: 'position', status: 'vacant', fullTime: true,  employee: null },

  // Wastewater — positions
  { id: 'ww_super',       title: 'Wastewater Superintendent',    dept: 'Wastewater', reportsTo: 'town_manager', nodeType: 'position', status: 'filled', fullTime: true, employee: 'Dakota Norton' },
  { id: 'ww_contract',    title: 'Contract Operations Oversight', dept: 'Wastewater', reportsTo: 'ww_super',    nodeType: 'position', status: 'filled', fullTime: false, employee: 'Annaleis Hanford', contracted: true },

  // Clerk's Office — positions
  { id: 'town_clerk',     title: 'Town Clerk | Tax Collector',         dept: "Clerk's Office", reportsTo: 'town_manager', nodeType: 'position', status: 'filled', fullTime: true, employee: 'Sandra Clifford' },
  { id: 'dep_clerk',      title: 'Deputy Town Clerk | Executive Asst.', dept: "Clerk's Office", reportsTo: 'town_clerk',   nodeType: 'position', status: 'filled', fullTime: true, employee: 'Jane Foss' },

  // Assessing — position
  { id: 'tax_assessor',   title: 'Tax Assessor',           dept: 'Assessing',    reportsTo: 'town_manager', nodeType: 'position', status: 'filled', fullTime: false, employee: 'Tony Bennett', contracted: true },

  // Code Enforcement — position
  { id: 'code_enf',       title: 'Plumbing Inspector | Code Enforcement | Airport Inspector', dept: 'Code Enforcement', reportsTo: 'town_manager', nodeType: 'position', status: 'filled', fullTime: true, employee: 'Betsy Fitzgerald' },

  // School Committee — structural body
  { id: 'school_committee', title: 'School Committee', dept: 'Schools', reportsTo: 'residents', nodeType: 'structural', status: 'structural', fullTime: false, employee: null },
  { id: 'sc_1', title: 'Committee Member', dept: 'Schools', reportsTo: 'school_committee', nodeType: 'position', status: 'filled', fullTime: false, employee: 'Teresa Saddler' },
  { id: 'sc_2', title: 'Committee Member', dept: 'Schools', reportsTo: 'school_committee', nodeType: 'position', status: 'filled', fullTime: false, employee: 'Cathy Morse' },
  { id: 'sc_3', title: 'Committee Member', dept: 'Schools', reportsTo: 'school_committee', nodeType: 'position', status: 'filled', fullTime: false, employee: 'Chloe Flower' },
  { id: 'sc_4', title: 'Committee Member', dept: 'Schools', reportsTo: 'school_committee', nodeType: 'position', status: 'vacant', fullTime: false, employee: null },
  { id: 'sc_5', title: 'Committee Member', dept: 'Schools', reportsTo: 'school_committee', nodeType: 'position', status: 'vacant', fullTime: false, employee: null },

  // School Administration — positions
  { id: 'superintendent', title: 'Superintendent AOS96', dept: 'Schools', reportsTo: 'school_committee', nodeType: 'position', status: 'filled', fullTime: true, employee: 'Nicole Case' },
  { id: 'mmhs_principal', title: 'MMHS Principal',        dept: 'Schools', reportsTo: 'superintendent',   nodeType: 'position', status: 'filled', fullTime: true, employee: 'Wendy Black' },
  { id: 'rmge_principal', title: 'RMGE Principal',         dept: 'Schools', reportsTo: 'superintendent',   nodeType: 'position', status: 'filled', fullTime: true, employee: 'Sue Dow' },
  { id: 'rmge_ap',        title: 'Assistant Principal & Athletic Director', dept: 'Schools', reportsTo: 'rmge_principal', nodeType: 'position', status: 'filled', fullTime: true, employee: 'Chad Fitzsimmons' },
];

// ─── Generate dynamic finance/billing positions from settings ─────────────────
export function getDynamicPositions(settings) {
  const positions = [];
  const fs = settings.FINANCE_DEPARTMENT_STRUCTURE;

  const pt = { nodeType: 'position' };

  // Controller
  if (fs === 'Controller + Staff Accountant' ||
      fs === 'Controller + Two Staff Accountants' ||
      fs === 'Controller + Staff Accountant + Part-Time Staff Accountant') {
    positions.push({ ...pt, id: 'controller', title: 'Controller', dept: 'Finance', reportsTo: 'finance_director', status: 'vacant', fullTime: true, employee: null });
  }

  // Staff Accountant (all options have at least one)
  positions.push({ ...pt, id: 'staff_accountant', title: 'Staff Accountant', dept: 'Finance', reportsTo: 'finance_director', status: 'vacant', fullTime: true, employee: null });

  // Second Staff Accountant
  if (fs === 'Controller + Two Staff Accountants' || fs === 'Two Staff Accountants') {
    positions.push({ ...pt, id: 'staff_accountant_2', title: 'Second Staff Accountant', dept: 'Finance', reportsTo: 'finance_director', status: 'vacant', fullTime: true, employee: null });
  }

  // Part-Time Staff Accountant
  if (fs === 'Staff Accountant + Part-Time Staff Accountant' ||
      fs === 'Controller + Staff Accountant + Part-Time Staff Accountant') {
    positions.push({ ...pt, id: 'staff_accountant_pt', title: 'Part-Time Staff Accountant', dept: 'Finance', reportsTo: 'finance_director', status: 'vacant', fullTime: false, employee: null });
  }

  // Billing structure
  const bs = settings.UTILITY_BILLING_STRUCTURE;
  positions.push({ ...pt, id: 'billing_specialist', title: 'Billing Specialist', dept: 'Finance', reportsTo: 'finance_director', status: 'vacant', fullTime: true, employee: null });
  if (bs === 'Two Billing Specialists') {
    positions.push({ ...pt, id: 'billing_specialist_2', title: 'Second Billing Specialist', dept: 'Finance', reportsTo: 'finance_director', status: 'vacant', fullTime: true, employee: null });
  } else if (bs === 'Billing Specialist + Revenue Coordinator') {
    positions.push({ ...pt, id: 'revenue_coordinator', title: 'Revenue Coordinator', dept: 'Finance', reportsTo: 'finance_director', status: 'vacant', fullTime: true, employee: null });
  }

  // GA Coordinator
  const gaReportsTo = settings.GA_REPORTING_STRUCTURE === 'Finance Director' ? 'finance_director' : 'town_manager';
  positions.push({ ...pt, id: 'ga_coordinator', title: 'General Assistance Coordinator', dept: 'Finance', reportsTo: gaReportsTo, status: 'vacant', fullTime: false, employee: null });

  return positions;
}

// ─── Build a flat list of all positions given settings ────────────────────────
export function getAllPositions(settings) {
  const dynamic = getDynamicPositions(settings);
  const all = [...STATIC_POSITIONS, ...dynamic];

  // Filter part-time if hidden
  if (!settings.SHOW_PART_TIME_POSITIONS) {
    return all.filter(p => p.fullTime !== false || p.status === 'filled');
  }
  // Filter vacant if hidden
  if (!settings.SHOW_VACANT_POSITIONS) {
    return all.filter(p => p.status !== 'vacant');
  }
  return all;
}

// ─── Build tree from flat positions ──────────────────────────────────────────
export function buildOrgTree(positions, collapsedIds = {}) {
  const byId = {};
  positions.forEach(p => { byId[p.id] = { ...p, children: [] }; });

  const roots = [];
  positions.forEach(p => {
    const node = byId[p.id];
    if (!node) return;
    if (p.reportsTo && byId[p.reportsTo]) {
      byId[p.reportsTo].children.push(node);
    } else if (!p.reportsTo) {
      roots.push(node);
    } else {
      roots.push(node); // orphan → float to root
    }
  });

  return roots;
}

// ─── Default settings ─────────────────────────────────────────────────────────
export const DEFAULT_ORG_SETTINGS = {
  FINANCE_DEPARTMENT_STRUCTURE: 'Two Staff Accountants',
  UTILITY_BILLING_STRUCTURE: 'One Billing Specialist',
  GA_REPORTING_STRUCTURE: 'Town Manager',
  SHOW_VACANT_POSITIONS: true,
  SHOW_PART_TIME_POSITIONS: true,
};

export const FINANCE_STRUCTURES = [
  'Controller + Staff Accountant',
  'Controller + Two Staff Accountants',
  'Two Staff Accountants',
  'Staff Accountant + Part-Time Staff Accountant',
  'Controller + Staff Accountant + Part-Time Staff Accountant',
];

export const BILLING_STRUCTURES = [
  'One Billing Specialist',
  'Two Billing Specialists',
  'Billing Specialist + Revenue Coordinator',
];

export const GA_STRUCTURES = [
  'Finance Director',
  'Town Manager',
];