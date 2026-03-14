// ─── Efficiency Analysis Engine ───────────────────────────────────────────────
// Computes span-of-control, staffing ratios, overhead, and department scores
// from raw OrgNode records.

const MACHIAS_POPULATION = 2100;
const RMGE_STUDENTS = 420; // approximate enrollment

// ── Department definitions ────────────────────────────────────────────────────
export const DEPT_DEFINITIONS = [
  {
    key: 'finance_hr',
    label: 'Finance & Human Resources',
    category: 'administration',
    icon: '💰',
    benchmarkFTE: { min: 2, max: 4 },
    benchmarkRatioDesc: '8–15% of total workforce',
    headName: 'Nicholas MacDonald',
    headTitle: 'Finance Director / Asst. HR Director',
  },
  {
    key: 'town_clerk',
    label: 'Town Clerk Office',
    category: 'administration',
    icon: '📋',
    benchmarkFTE: { min: 1, max: 3 },
    benchmarkRatioDesc: '1–2 per 1,000 residents',
    headName: null,
    headTitle: 'Town Clerk',
  },
  {
    key: 'police',
    label: 'Police Department',
    category: 'public_safety',
    icon: '🚔',
    benchmarkFTE: { min: 4, max: 8 },
    benchmarkRatioDesc: '1.5–3 officers per 1,000 residents',
    headName: 'Keith Mercier',
    headTitle: 'Chief of Police',
  },
  {
    key: 'fire',
    label: 'Fire Department',
    category: 'public_safety',
    icon: '🚒',
    benchmarkFTE: { min: 1, max: 3 },
    benchmarkRatioDesc: '0.5–1.5 career staff per 1,000 (volunteer supplemented)',
    headName: 'Joe Thompson',
    headTitle: 'Fire Chief',
  },
  {
    key: 'ambulance',
    label: 'Ambulance / EMS',
    category: 'public_safety',
    icon: '🚑',
    benchmarkFTE: { min: 6, max: 14 },
    benchmarkRatioDesc: '3–6 per 1,000 residents (call volume basis)',
    headName: 'Ryan Maker',
    headTitle: 'Ambulance Chief',
  },
  {
    key: 'public_works',
    label: 'Public Works',
    category: 'public_works',
    icon: '🔧',
    benchmarkFTE: { min: 4, max: 8 },
    benchmarkRatioDesc: '1 staff per 300–500 residents',
    headName: 'Mike Schopee',
    headTitle: 'Public Works Director',
  },
  {
    key: 'wastewater',
    label: 'Wastewater',
    category: 'utilities',
    icon: '💧',
    benchmarkFTE: { min: 2, max: 4 },
    benchmarkRatioDesc: '1–2 operators per system',
    headName: 'Dakota Norton',
    headTitle: 'Wastewater Superintendent',
  },
  {
    key: 'transfer_stn',
    label: 'Transfer Station',
    category: 'utilities',
    icon: '♻️',
    benchmarkFTE: { min: 2, max: 4 },
    benchmarkRatioDesc: '1–2 attendants per site',
    headName: 'Nicole Albee',
    headTitle: 'Solid Waste Director',
  },
  {
    key: 'parks_rec',
    label: 'Parks & Recreation',
    category: 'community_services',
    icon: '🌳',
    benchmarkFTE: { min: 1, max: 3 },
    benchmarkRatioDesc: '0.5–1.5 per 1,000 residents',
    headName: null,
    headTitle: 'Parks & Recreation Director',
  },
  {
    key: 'airport',
    label: 'Airport',
    category: 'community_services',
    icon: '✈️',
    benchmarkFTE: { min: 1, max: 2 },
    benchmarkRatioDesc: 'Admin only; FAA regulated',
    headName: null,
    headTitle: 'Airport Manager',
  },
  {
    key: 'planning',
    label: 'Planning & Development',
    category: 'administration',
    icon: '🗺️',
    benchmarkFTE: { min: 1, max: 2 },
    benchmarkRatioDesc: '0.5–1 per 1,000 residents',
    headName: null,
    headTitle: 'Planner',
  },
];

// Span-of-control classifications
export function classifySpan(count) {
  if (count <= 3) return { label: 'Underutilized', color: 'bg-blue-100 text-blue-800', score: 40 };
  if (count <= 7) return { label: 'Optimal', color: 'bg-emerald-100 text-emerald-800', score: 100 };
  if (count <= 12) return { label: 'High Span', color: 'bg-amber-100 text-amber-800', score: 70 };
  return { label: 'Potential Overload', color: 'bg-red-100 text-red-800', score: 30 };
}

// FTE staffing assessment
export function assessStaffing(actual, benchmark) {
  if (actual < benchmark.min) return { label: 'Understaffed', color: 'bg-red-100 text-red-700', score: Math.round((actual / benchmark.min) * 60) };
  if (actual > benchmark.max) return { label: 'Review staffing', color: 'bg-amber-100 text-amber-700', score: 75 };
  return { label: 'Appropriate', color: 'bg-emerald-100 text-emerald-800', score: 100 };
}

// Count direct children that are not advisory
export function countDirectReports(nodeId, allNodes) {
  return allNodes.filter(n => n.parent_id === nodeId && !n.is_advisory).length;
}

// Derive FTE from a node (staff_count field or 1)
export function nodeFTE(n) {
  return n.staff_count || 1;
}

// Gather all descendant FTE for a subtree rooted at parentId
export function subtreeFTE(parentId, allNodes) {
  const children = allNodes.filter(n => n.parent_id === parentId);
  return children.reduce((sum, c) => sum + nodeFTE(c) + subtreeFTE(c.id, allNodes), 0);
}

// Compute full efficiency report from flat OrgNode array
export function computeEfficiencyReport(nodes) {
  const municipalNodes = nodes.filter(n => n.branch === 'municipal');
  const schoolNodes    = nodes.filter(n => n.branch === 'school');

  // ── Span of control ───────────────────────────────────────────────────────
  const LEADERSHIP_KEYS = ['town_mgr', 'police_chief', 'fire_chief', 'amb_chief', 'pw_dir',
                            'superintendent', 'mmhs_principal', 'rmg_principal'];

  // Find leadership nodes by name patterns
  const leadershipNodes = nodes.filter(n =>
    n.node_type === 'executive_leadership' ||
    (n.node_type === 'staff_role' && [
      'Chief of Police', 'Fire Chief', 'Ambulance Chief', 'Public Works Director',
      'Principal', 'Superintendent',
    ].some(t => (n.name || '').includes(t)))
  );

  const spanData = leadershipNodes.map(leader => {
    const directReports = countDirectReports(leader.id, nodes);
    const cls = classifySpan(directReports);
    return {
      id: leader.id,
      name: leader.staff_name || leader.name,
      title: leader.name,
      directReports,
      classification: cls,
      branch: leader.branch,
    };
  }).sort((a, b) => b.directReports - a.directReports);

  // ── Municipal department FTE summary ─────────────────────────────────────
  const deptMap = {};
  municipalNodes.forEach(n => {
    if (n.node_type === 'department') {
      const fte = subtreeFTE(n.id, nodes);
      const def = DEPT_DEFINITIONS.find(d => d.label === n.name || n.name.includes(d.label.split(' ')[0]));
      deptMap[n.id] = {
        id: n.id,
        name: n.name,
        fte,
        def,
        assessment: def ? assessStaffing(fte, def.benchmarkFTE) : null,
        category: def?.category || 'other',
      };
    }
  });
  const depts = Object.values(deptMap);

  // ── Total FTE counts ──────────────────────────────────────────────────────
  const totalMunicipalFTE = municipalNodes.reduce((s, n) =>
    n.node_type === 'department' ? s : (n.node_type === 'staff_role' ? s + nodeFTE(n) : s), 0);

  const adminDepts = ['Finance & Human Resources', 'Town Clerk Office', 'Planning & Development'];
  const adminFTE = depts
    .filter(d => adminDepts.some(a => d.name.includes(a.split(' ')[0])))
    .reduce((s, d) => s + d.fte, 0);

  const totalStaffFTE = depts.reduce((s, d) => s + d.fte, 0) || 1;
  const adminPct = adminFTE / totalStaffFTE;

  // ── Staffing ratios ────────────────────────────────────────────────────────
  const policeDept = depts.find(d => d.name.includes('Police'));
  const pwDept     = depts.find(d => d.name.includes('Public Works'));
  const adminDept  = depts.filter(d => adminDepts.some(a => d.name.includes(a.split(' ')[0])));

  const ratios = [
    {
      label: 'Police Officers per 1,000 residents',
      value: policeDept ? ((policeDept.fte / MACHIAS_POPULATION) * 1000).toFixed(2) : '—',
      benchmark: '1.5–3.0',
      unit: 'per 1k',
      raw: policeDept ? (policeDept.fte / MACHIAS_POPULATION) * 1000 : 0,
      benchMin: 1.5, benchMax: 3.0,
    },
    {
      label: 'Public Works Staff per 1,000 residents',
      value: pwDept ? ((pwDept.fte / MACHIAS_POPULATION) * 1000).toFixed(2) : '—',
      benchmark: '2.0–4.0',
      unit: 'per 1k',
      raw: pwDept ? (pwDept.fte / MACHIAS_POPULATION) * 1000 : 0,
      benchMin: 2.0, benchMax: 4.0,
    },
    {
      label: 'Administrative Staff per 1,000 residents',
      value: adminDept.length ? ((adminDept.reduce((s, d) => s + d.fte, 0) / MACHIAS_POPULATION) * 1000).toFixed(2) : '—',
      benchmark: '1.5–3.0',
      unit: 'per 1k',
      raw: adminDept.length ? (adminDept.reduce((s, d) => s + d.fte, 0) / MACHIAS_POPULATION) * 1000 : 0,
      benchMin: 1.5, benchMax: 3.0,
    },
  ];

  // ── Cross-department overlap flags ────────────────────────────────────────
  const overlaps = [
    {
      title: 'Fire & EMS Administration',
      description: 'Fire Chief and Ambulance Chief both report directly to Town Manager. EMS admin and fire admin overlap in dispatch coordination and emergency response planning.',
      opportunity: 'Shared Emergency Services Director role or combined administrative support.',
      severity: 'medium',
    },
    {
      title: 'Finance & HR',
      description: 'Finance Director doubles as Assistant HR Director. HR functions are distributed across payroll (Finance) and personnel management (Town Manager).',
      opportunity: 'Proposed Staff Accountant separates transactional finance from strategic HR oversight.',
      severity: 'high',
    },
    {
      title: 'IT Responsibilities',
      description: 'No dedicated IT role identified. Technology coordination likely distributed across departments and/or contracted out.',
      opportunity: 'Centralized IT coordinator role or regional shared-services arrangement.',
      severity: 'low',
    },
    {
      title: 'Regional Financial Services',
      description: 'Finance Director informally supports neighboring towns. No formal structure or compensation for this service.',
      opportunity: 'Proposed Revenue Coordinator formalizes regional service delivery into a revenue stream.',
      severity: 'high',
    },
  ];

  // ── Overall efficiency score ───────────────────────────────────────────────
  const spanScore = spanData.length
    ? spanData.reduce((s, d) => s + d.classification.score, 0) / spanData.length
    : 75;
  const staffScore = depts.filter(d => d.assessment).length
    ? depts.filter(d => d.assessment).reduce((s, d) => s + d.assessment.score, 0) / depts.filter(d => d.assessment).length
    : 75;
  const adminScore = adminPct >= 0.08 && adminPct <= 0.15 ? 100 : adminPct < 0.08 ? 60 : 70;
  const overallScore = Math.round((spanScore * 0.35 + staffScore * 0.45 + adminScore * 0.2));

  return {
    spanData,
    depts,
    totalStaffFTE,
    adminFTE,
    adminPct,
    ratios,
    overlaps,
    overallScore,
    spanScore: Math.round(spanScore),
    staffScore: Math.round(staffScore),
    adminScore: Math.round(adminScore),
    population: MACHIAS_POPULATION,
    schoolNodes: schoolNodes.length,
    municipalNodes: municipalNodes.length,
  };
}