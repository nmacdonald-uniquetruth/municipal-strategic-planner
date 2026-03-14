// ─── Community Governance Digital Twin — Static Governance Data ──────────────
// This is the authoritative, curated governance map for Machias/AOS 96.
// Used as the source-of-truth for the digital twin visualization.

export const MACHIAS_POPULATION = 2100;
export const SCHOOL_ENROLLMENT  = 420;

// ── Governance tree (hierarchical, id-referenced) ────────────────────────────
export const TWIN_NODES = [

  // ROOT
  { id: 'residents',    label: 'Residents / Voters', role: null,                 type: 'root',        branch: 'root',      icon: '🏘️', color: '#1e2f3d', children: ['select_board','school_comm'], description: 'Ultimate authority. All governance derives from residents and voters of Machias.', staff: [] },

  // ═══════════════════════ MUNICIPAL BRANCH ═══════════════════════════════════

  { id: 'select_board', label: 'Select Board',       role: null,                 type: 'governance',  branch: 'municipal', icon: '⚖️',  color: '#344A60', children: ['town_mgr','planning_board','budget_comm','airport_comm'],
    description: '5-member elected body. Sets policy, approves budget, appoints Town Manager.',
    staff: ['Jake Patryn — Chair','Ben Edwards — Vice Chair','Carole Porcher','Sandra Sinford','Michael Hinerman'],
  },

  { id: 'planning_board',label: 'Planning Board',    role: null,                 type: 'committee',   branch: 'municipal', icon: '📐', color: '#6B7280', children: [], description: 'Reviews land use, comprehensive planning, zoning amendments. Advisory.', staff: [] },
  { id: 'budget_comm',  label: 'Budget Committee',   role: null,                 type: 'committee',   branch: 'municipal', icon: '💼', color: '#6B7280', children: [], description: 'Reviews and recommends annual budget. Advisory.', staff: [] },
  { id: 'airport_comm', label: 'Airport Committee',  role: null,                 type: 'committee',   branch: 'municipal', icon: '✈️', color: '#6B7280', children: [], description: 'Advisory committee for airport planning and policy.', staff: [] },

  { id: 'town_mgr',     label: 'Town Manager',       role: 'Sarah Craighead-Dedmon', type: 'executive', branch: 'municipal', icon: '🏛️', color: '#2A7F7F',
    children: ['finance_hr','town_clerk','police','fire','ambulance','public_works','wastewater','transfer_stn','airport','parks_rec','planning_dept','olver'],
    description: 'Chief administrative officer. Implements Select Board policy, supervises all departments.',
    staff: [],
    budget: 185000, fte: 1,
  },

  { id: 'finance_hr',   label: 'Finance & HR',        role: 'Nicholas MacDonald',     type: 'department', branch: 'municipal', icon: '💰', color: '#344A60',
    children: [], description: 'Financial management, budgeting, payroll, HR. Proposed: add Staff Accountant, Billing Specialist, GA Coordinator.',
    staff: ['Nicholas MacDonald — Finance Director / Asst. HR Director'],
    budget: 165000, fte: 2, efficiencyScore: 62, restructuringStatus: 'proposed_change',
  },
  { id: 'town_clerk',   label: 'Town Clerk',           role: 'Sandra Clifford',        type: 'department', branch: 'municipal', icon: '📋', color: '#344A60',
    children: [], description: 'Records, elections, licenses, vital statistics, public information.',
    staff: ['Sandra Clifford — Town Clerk','Deputy Clerk'],
    budget: 72000, fte: 2, efficiencyScore: 88,
  },
  { id: 'police',       label: 'Police Dept.',         role: 'Keith Mercier',          type: 'department', branch: 'municipal', icon: '🚔', color: '#344A60',
    children: [], description: 'Law enforcement, public safety, emergency dispatch coordination.',
    staff: ['Keith Mercier — Chief of Police','6 Officers','2 Administrative Staff'],
    budget: 680000, fte: 9, efficiencyScore: 92,
  },
  { id: 'fire',         label: 'Fire Dept.',           role: 'Joe Thompson',           type: 'department', branch: 'municipal', icon: '🚒', color: '#344A60',
    children: [], description: 'Fire suppression, fire prevention, hazmat response. Primarily volunteer.',
    staff: ['Joe Thompson — Fire Chief','~20 Volunteer Firefighters'],
    budget: 195000, fte: 1, efficiencyScore: 78,
  },
  { id: 'ambulance',    label: 'Ambulance / EMS',      role: 'Ryan Maker',             type: 'department', branch: 'municipal', icon: '🚑', color: '#344A60',
    children: [], description: '~1,648 transports/year. Enterprise fund. Comstar contract under review.',
    staff: ['Ryan Maker — Ambulance Chief','12 EMS Personnel'],
    budget: 920000, fte: 13, efficiencyScore: 81,
  },
  { id: 'public_works', label: 'Public Works',         role: 'Mike Schoppee',          type: 'department', branch: 'municipal', icon: '🔧', color: '#344A60',
    children: [], description: 'Roads, infrastructure, snow removal, fleet management.',
    staff: ['Mike Schoppee — Public Works Director','4 Crew Members'],
    budget: 520000, fte: 5, efficiencyScore: 85,
  },
  { id: 'wastewater',   label: 'Wastewater',           role: 'Dakota Norton',          type: 'department', branch: 'municipal', icon: '💧', color: '#4A6741',
    children: [], description: 'Wastewater treatment and sewer system operations. Enterprise fund. Deficit: ($60,200).',
    staff: ['Dakota Norton — Wastewater Superintendent','3 Operators'],
    budget: 380000, fte: 4, efficiencyScore: 74,
  },
  { id: 'transfer_stn', label: 'Solid Waste',          role: 'Nicole Albee',           type: 'department', branch: 'municipal', icon: '♻️', color: '#4A6741',
    children: [], description: 'Transfer Station enterprise fund. Deficit: ($296,245). Roque Bluffs interested in joining.',
    staff: ['Nicole Albee — Solid Waste Director','3 Attendants'],
    budget: 210000, fte: 4, efficiencyScore: 55,
  },
  { id: 'airport',      label: 'Airport',              role: null,                     type: 'department', branch: 'municipal', icon: '✈️', color: '#4A6741',
    children: [], description: 'Machias Valley Airport. FAA compliance, hangar leases. Enterprise fund.',
    staff: ['Airport Administration'],
    budget: 95000, fte: 1, efficiencyScore: 72,
  },
  { id: 'parks_rec',    label: 'Parks & Rec.',         role: null,                     type: 'department', branch: 'municipal', icon: '🌳', color: '#344A60',
    children: [], description: 'Public parks, recreational programming, community events.',
    staff: ['Parks & Recreation Staff (3)'],
    budget: 68000, fte: 3, efficiencyScore: 80,
  },
  { id: 'planning_dept',label: 'Planning & Dev.',      role: null,                     type: 'department', branch: 'municipal', icon: '🗺️', color: '#344A60',
    children: [], description: 'Comprehensive planning, zoning, permitting, economic development.',
    staff: ['Planning Staff'],
    budget: 42000, fte: 1, efficiencyScore: 70,
  },
  { id: 'olver',        label: 'Olver Associates',     role: 'Annaleis Hanford',       type: 'contracted', branch: 'municipal', icon: '🤝', color: '#8B6914',
    children: [], description: 'Contracted engineering and planning services.',
    staff: ['Annaleis Hanford — Project Lead'],
    budget: 0, fte: 0, efficiencyScore: null,
  },

  // ═══════════════════════ SCHOOL BRANCH ══════════════════════════════════════

  { id: 'school_comm',  label: 'School Committee', role: null, type: 'governance', branch: 'school', icon: '🏫', color: '#6B4C9A',
    children: ['superintendent'],
    description: 'Elected school committee for AOS 96. Sets education policy, approves school budget.',
    staff: ['Teresa Saddler','Cathy Morse','Chloe Flower','Member TBD','Member TBD'],
  },

  { id: 'superintendent', label: 'Superintendent', role: 'Nicole Case', type: 'executive', branch: 'school', icon: '🎓', color: '#6B4C9A',
    children: ['mmhs','rmg','dist_admin','transportation'],
    description: 'Chief executive of AOS 96 school district. Oversees all schools.',
    staff: [],
    budget: 0, fte: 1,
  },

  { id: 'dist_admin',   label: 'District Admin',   role: null, type: 'division', branch: 'school', icon: '📊', color: '#6B4C9A',
    children: [], description: 'Central office: IASA/Curriculum Coordinator, Special Education Director.',
    staff: ['Mitchell Look — IASA/Curriculum Coordinator','Mary Maker — Special Education Director'],
    budget: 0, fte: 2,
  },

  { id: 'mmhs',         label: 'Machias Memorial HS', role: 'Wendy Black', type: 'school', branch: 'school', icon: '🏫', color: '#6B4C9A',
    children: [], description: 'Grades 9–12. Serves Machias and surrounding communities.',
    staff: ['Wendy Black — Principal','~20 Faculty & Staff','Special Education Program'],
    budget: 0, fte: 25,
  },

  { id: 'rmg',          label: 'Rose M. Gaffney Elem.', role: 'Sue Dow', type: 'school', branch: 'school', icon: '🎒', color: '#6B4C9A',
    children: [], description: 'Pre-K through Grade 8. Principal Sue Dow, AP/Athletic Dir. Chad Fitzsimmons.',
    staff: ['Sue Dow — Principal','Chad Fitzsimmons — AP / Athletic Director','17 Classroom Teachers','17+ SpEd Technicians','Specialists & Support Staff'],
    budget: 0, fte: 60,
  },

  { id: 'transportation', label: 'Transportation & Facilities', role: null, type: 'support', branch: 'school', icon: '🚌', color: '#6B4C9A',
    children: [], description: 'Shared transportation, food service, facilities management for AOS 96.',
    staff: ['Mike Hinerman — Transportation Director','Emily Fitzsimmons — Food Service Director','Kris Smith — Facilities Manager'],
    budget: 0, fte: 12,
  },
];

// ── Lookup by id ──────────────────────────────────────────────────────────────
export const NODE_MAP = Object.fromEntries(TWIN_NODES.map(n => [n.id, n]));

// ── Governance complexity score ────────────────────────────────────────────────
export function computeGovernanceComplexity(nodes) {
  const depts     = nodes.filter(n => n.type === 'department').length;
  const committees= nodes.filter(n => n.type === 'committee').length;
  const agencies  = nodes.filter(n => n.type === 'contracted').length;
  const schools   = nodes.filter(n => n.type === 'school').length;
  const governance= nodes.filter(n => n.type === 'governance').length;
  const executive = nodes.filter(n => n.type === 'executive').length;

  // Count reporting layers (depth) — max depth from root
  function depth(id, visited = new Set()) {
    if (visited.has(id)) return 0;
    visited.add(id);
    const node = NODE_MAP[id];
    if (!node || !node.children?.length) return 0;
    return 1 + Math.max(...node.children.map(c => depth(c, new Set(visited))));
  }
  const layers = depth('residents');

  // Weighted complexity
  const raw = (depts * 3) + (committees * 2) + (agencies * 1.5) + (schools * 2) + (governance * 4) + (layers * 5);
  const normalized = Math.min(100, Math.round(raw / 1.2));

  return { depts, committees, agencies, schools, governance, executive, layers, raw: Math.round(raw), score: normalized };
}

// ── Strategic insights ─────────────────────────────────────────────────────────
export const STRATEGIC_INSIGHTS = [
  { id: 'sep_duties',  severity: 'critical', label: 'Separation of Duties Deficit', dept: 'finance_hr',     body: 'Finance Director processes, authorizes, and reconciles transactions without a second reviewer. Audit risk exposure: ~$56K/yr.' },
  { id: 'comstar',     severity: 'high',     label: 'EMS Billing Fee Drain',        dept: 'ambulance',      body: 'Comstar charges 5.22% of gross EMS collections (~$34K/yr). In-house Billing Specialist breaks even in Year 1.' },
  { id: 'ts_deficit',  severity: 'high',     label: 'Transfer Station Deficit',     dept: 'transfer_stn',   body: 'Fund deficit of ($296,245). No formal cost-sharing agreements. Roque Bluffs interested in joining.' },
  { id: 'ww_deficit',  severity: 'medium',   label: 'Wastewater Fund Deficit',      dept: 'wastewater',     body: 'Fund deficit of ($60,200). Rate study needed before expansion.' },
  { id: 'regional',    severity: 'opportunity', label: 'Regional Services Revenue', dept: 'finance_hr',     body: 'Machias informally supports neighboring towns. Formalizing contracts yields $60K–$120K/yr revenue.' },
  { id: 'capacity',    severity: 'opportunity', label: 'Executive Capacity Drain',  dept: 'town_mgr',       body: 'TM spends 18–22% of time on finance admin. Restructuring frees ~$21K/yr in TM strategic capacity.' },
];

// ── Node type display config ───────────────────────────────────────────────────
export const TYPE_CONFIG = {
  root:       { bg: '#1e2f3d', text: '#fff',     border: '#000',    ring: '#000',    label: 'Root' },
  governance: { bg: '#344A60', text: '#fff',     border: '#1e2f3d', ring: '#344A60', label: 'Governance' },
  executive:  { bg: '#2A7F7F', text: '#fff',     border: '#1d6060', ring: '#2A7F7F', label: 'Executive' },
  department: { bg: '#ffffff', text: '#2F2F30',  border: '#c9bba6', ring: '#344A60', label: 'Department' },
  committee:  { bg: '#E7D0B1', text: '#344A60',  border: '#c9b895', ring: '#8B6914', label: 'Committee' },
  school:     { bg: '#f5f0ff', text: '#6B4C9A',  border: '#c4b5e8', ring: '#6B4C9A', label: 'School' },
  division:   { bg: '#f5f0ff', text: '#6B4C9A',  border: '#c4b5e8', ring: '#6B4C9A', label: 'Division' },
  support:    { bg: '#f0f8f4', text: '#4A6741',  border: '#a8d4b8', ring: '#4A6741', label: 'Support' },
  contracted: { bg: '#fdf6e8', text: '#8B6914',  border: '#e8c46a', ring: '#8B6914', label: 'Contracted' },
};

export const SEVERITY_CONFIG = {
  critical:    { color: 'bg-red-100 text-red-800 border-red-300',       dot: 'bg-red-500',    label: 'Critical' },
  high:        { color: 'bg-amber-100 text-amber-800 border-amber-300', dot: 'bg-amber-500',  label: 'High' },
  medium:      { color: 'bg-blue-100 text-blue-700 border-blue-200',    dot: 'bg-blue-400',   label: 'Medium' },
  opportunity: { color: 'bg-emerald-100 text-emerald-800 border-emerald-300', dot: 'bg-emerald-500', label: 'Opportunity' },
};

export const BRANCH_COLORS = { municipal: '#344A60', school: '#6B4C9A', root: '#1e2f3d', shared: '#2A7F7F' };