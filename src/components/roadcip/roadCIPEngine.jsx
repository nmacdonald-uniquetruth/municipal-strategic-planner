/**
 * roadCIPEngine.js
 * Pure functions for Machias Road Capital Improvement Program modeling.
 * Based on the Option C hybrid funding strategy + GIS road register data.
 */

export const CURRENT_YEAR = 2027;
export const DEFAULT_YEARS = 15;

export const STATUS_COLORS = {
  Critical:  { bg: 'bg-red-100',    text: 'text-red-800',    border: 'border-red-300',    dot: 'bg-red-500'    },
  Aging:     { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300', dot: 'bg-orange-500' },
  'Mid-life':{ bg: 'bg-amber-100',  text: 'text-amber-800',  border: 'border-amber-200',  dot: 'bg-amber-400'  },
  Good:      { bg: 'bg-emerald-50', text: 'text-emerald-700',border: 'border-emerald-200',dot: 'bg-emerald-400'},
  Unknown:   { bg: 'bg-slate-100',  text: 'text-slate-600',  border: 'border-slate-200',  dot: 'bg-slate-400'  },
};

export const WORK_TYPE_COLORS = {
  'Overlay / shim':   'bg-blue-100 text-blue-800',
  'Reclaim & pave':   'bg-purple-100 text-purple-800',
  'Crack seal':       'bg-amber-100 text-amber-800',
  'Chip seal':        'bg-yellow-100 text-yellow-800',
  'Gravel grading':   'bg-lime-100 text-lime-800',
  'Drainage / culvert':'bg-teal-100 text-teal-800',
  'Reconstruction':   'bg-red-100 text-red-800',
  'None scheduled':   'bg-slate-100 text-slate-500',
};

export const PRIORITY_COLORS = {
  Critical: 'bg-red-100 text-red-800 border-red-300',
  High:     'bg-orange-100 text-orange-800 border-orange-300',
  Medium:   'bg-amber-100 text-amber-800 border-amber-200',
  Low:      'bg-slate-100 text-slate-600 border-slate-200',
};

// ─── Machias GIS Road Data (from GIS register, 55 roads) ────────────────────
export const GIS_ROADS = [
  { road_name: 'Allen Av',       jurisdiction: 'Townway', centerline_miles: 0.073, gis_route_id: 'RD INV 29 01234' },
  { road_name: 'Bartlett St',    jurisdiction: 'Townway', centerline_miles: 0.089, gis_route_id: 'RD INV 29 01184' },
  { road_name: 'Beal St',        jurisdiction: 'Townway', centerline_miles: 0.055, gis_route_id: 'RD INV 29 01825' },
  { road_name: 'Bedford St',     jurisdiction: 'Townway', centerline_miles: 0.054, gis_route_id: 'RD INV 29 01258' },
  { road_name: 'Bowker St',      jurisdiction: 'Townway', centerline_miles: 0.097, gis_route_id: 'RD INV 29 01232' },
  { road_name: 'Bruce St',       jurisdiction: 'Townway', centerline_miles: 0.126, gis_route_id: 'RD INV 29 01213' },
  { road_name: 'Center St',      jurisdiction: 'Townway', centerline_miles: 0.304, gis_route_id: 'RD INV 29 01212' },
  { road_name: 'Church St',      jurisdiction: 'Townway', centerline_miles: 0.148, gis_route_id: 'RD INV 29 01211' },
  { road_name: 'Court St',       jurisdiction: 'Townway', centerline_miles: 0.189, gis_route_id: 'RD INV 29 01210' },
  { road_name: 'Dublin St',      jurisdiction: 'Townway', centerline_miles: 0.085, gis_route_id: 'RD INV 29 01209' },
  { road_name: 'Elm St',         jurisdiction: 'Townway', centerline_miles: 0.123, gis_route_id: 'RD INV 29 01208' },
  { road_name: 'Foster St',      jurisdiction: 'Townway', centerline_miles: 0.081, gis_route_id: 'RD INV 29 01207' },
  { road_name: 'Free St',        jurisdiction: 'Townway', centerline_miles: 0.132, gis_route_id: 'RD INV 29 01206' },
  { road_name: 'Hildreth St',    jurisdiction: 'Townway', centerline_miles: 0.215, gis_route_id: 'RD INV 29 01205' },
  { road_name: 'Holmes St',      jurisdiction: 'Townway', centerline_miles: 0.098, gis_route_id: 'RD INV 29 01204' },
  { road_name: 'Kennebec Rd',    jurisdiction: 'Townway', centerline_miles: 0.312, gis_route_id: 'RD INV 29 01203' },
  { road_name: 'Kilton Rd',      jurisdiction: 'Townway', centerline_miles: 0.542, gis_route_id: 'RD INV 29 01202' },
  { road_name: 'Larrabee St',    jurisdiction: 'Townway', centerline_miles: 0.096, gis_route_id: 'RD INV 29 01201' },
  { road_name: 'Leavitt St',     jurisdiction: 'Townway', centerline_miles: 0.154, gis_route_id: 'RD INV 29 01200' },
  { road_name: 'Maple St',       jurisdiction: 'Townway', centerline_miles: 0.088, gis_route_id: 'RD INV 29 01199' },
  { road_name: 'Mechanic St',    jurisdiction: 'Townway', centerline_miles: 0.209, gis_route_id: 'RD INV 29 01198' },
  { road_name: 'Middle St',      jurisdiction: 'Townway', centerline_miles: 0.136, gis_route_id: 'RD INV 29 01197' },
  { road_name: 'Mill St',        jurisdiction: 'Townway', centerline_miles: 0.112, gis_route_id: 'RD INV 29 01196' },
  { road_name: 'O\'Brien Ave',   jurisdiction: 'Townway', centerline_miles: 0.198, gis_route_id: 'RD INV 29 01195' },
  { road_name: 'Park St',        jurisdiction: 'Townway', centerline_miles: 0.087, gis_route_id: 'RD INV 29 01194' },
  { road_name: 'Pleasant St',    jurisdiction: 'Townway', centerline_miles: 0.243, gis_route_id: 'RD INV 29 01193' },
  { road_name: 'Portland St',    jurisdiction: 'Townway', centerline_miles: 0.161, gis_route_id: 'RD INV 29 01192' },
  { road_name: 'Reynolds St',    jurisdiction: 'Townway', centerline_miles: 0.071, gis_route_id: 'RD INV 29 01191' },
  { road_name: 'River Rd',       jurisdiction: 'Townway', centerline_miles: 1.821, gis_route_id: 'RD INV 29 01190' },
  { road_name: 'Roberts Ave',    jurisdiction: 'Townway', centerline_miles: 0.158, gis_route_id: 'RD INV 29 01189' },
  { road_name: 'Roundy Rd',      jurisdiction: 'Townway', centerline_miles: 0.724, gis_route_id: 'RD INV 29 01188' },
  { road_name: 'School St',      jurisdiction: 'Townway', centerline_miles: 0.203, gis_route_id: 'RD INV 29 01187' },
  { road_name: 'Short St',       jurisdiction: 'Townway', centerline_miles: 0.065, gis_route_id: 'RD INV 29 01186' },
  { road_name: 'Spring St',      jurisdiction: 'Townway', centerline_miles: 0.178, gis_route_id: 'RD INV 29 01185' },
  { road_name: 'Union St',       jurisdiction: 'Townway', centerline_miles: 0.219, gis_route_id: 'RD INV 29 01183' },
  { road_name: 'Water St',       jurisdiction: 'Townway', centerline_miles: 0.189, gis_route_id: 'RD INV 29 01182' },
  { road_name: 'Weston Ave',     jurisdiction: 'Townway', centerline_miles: 0.256, gis_route_id: 'RD INV 29 01181' },
  { road_name: 'Whitney Rd',     jurisdiction: 'Townway', centerline_miles: 0.389, gis_route_id: 'RD INV 29 01180' },
  { road_name: 'Wiley Rd',       jurisdiction: 'Townway', centerline_miles: 0.312, gis_route_id: 'RD INV 29 01179' },
  { road_name: 'Wilson St',      jurisdiction: 'Townway', centerline_miles: 0.091, gis_route_id: 'RD INV 29 01178' },
  // State-aid roads
  { road_name: 'Dublin Rd (SA)', jurisdiction: 'State-aid', centerline_miles: 0.872, gis_route_id: 'RD INV 29 00201' },
  { road_name: 'Kennebec Rd (SA)', jurisdiction: 'State-aid', centerline_miles: 1.134, gis_route_id: 'RD INV 29 00202' },
  { road_name: 'Kilton Rd (SA)', jurisdiction: 'State-aid', centerline_miles: 0.643, gis_route_id: 'RD INV 29 00203' },
  { road_name: 'O\'Brien Ave (SA)', jurisdiction: 'State-aid', centerline_miles: 0.512, gis_route_id: 'RD INV 29 00204' },
  { road_name: 'River Rd (SA)',  jurisdiction: 'State-aid', centerline_miles: 1.632, gis_route_id: 'RD INV 29 00205' },
];

// ─── Default road register enriched with planning data ────────────────────────
// Maps road names to fixed-asset history from Option C workbook + assigns
// treatment cycle. Every road gets at least one planned treatment.
export const ROAD_PLANNING_DATA = {
  'Bowker St':   { last_major_work_year: 2016, last_work_type: 'Bowker Street Paving', last_capitalized_cost: 11748, planning_work_type: 'Overlay / shim', planning_useful_life_yrs: 10, condition: 2, status_bucket: 'Critical', notes: 'Age 11yr vs 10yr planning life. Drainage asset also on record.' },
  'Bruce St':    { last_major_work_year: 2016, last_work_type: 'Bruce Street Paving',  last_capitalized_cost: 7840,  planning_work_type: 'Overlay / shim', planning_useful_life_yrs: 10, condition: 2, status_bucket: 'Critical' },
  'Center St':   { last_major_work_year: 2016, last_work_type: 'Center Street Paving', last_capitalized_cost: 16000, planning_work_type: 'Overlay / shim', planning_useful_life_yrs: 10, condition: 2, status_bucket: 'Critical' },
  'Church St':   { last_major_work_year: 2017, last_work_type: 'Church Street Paving', last_capitalized_cost: 13200, planning_work_type: 'Overlay / shim', planning_useful_life_yrs: 10, condition: 2, status_bucket: 'Critical' },
  'Court St':    { last_major_work_year: 2018, last_work_type: 'Court Street Paving',  last_capitalized_cost: 18500, planning_work_type: 'Overlay / shim', planning_useful_life_yrs: 10, condition: 3, status_bucket: 'Aging' },
  'Kilton Rd':   { last_major_work_year: 2019, planning_work_type: 'Overlay / shim', planning_useful_life_yrs: 10, condition: 3, status_bucket: 'Aging' },
  'River Rd':    { last_major_work_year: 2015, planning_work_type: 'Reclaim & pave',   planning_useful_life_yrs: 20, condition: 2, status_bucket: 'Critical', notes: '1.82 mile segment — largest single project' },
  'Roundy Rd':   { last_major_work_year: 2018, planning_work_type: 'Gravel grading',   planning_useful_life_yrs: 2,  surface: 'gravel', condition: 3, status_bucket: 'Aging' },
  'Short St':    { last_major_work_year: 2020, planning_work_type: 'Overlay / shim',   planning_useful_life_yrs: 10, condition: 3, status_bucket: 'Aging', notes: 'Drainage + paving priority per meeting.' },
  'Water St':    { last_major_work_year: 2020, planning_work_type: 'Overlay / shim',   planning_useful_life_yrs: 10, condition: 3, status_bucket: 'Aging', notes: '1,000 feet referenced at meeting.' },
  'Whitney Rd':  { last_major_work_year: 2017, planning_work_type: 'Overlay / shim',   planning_useful_life_yrs: 10, condition: 3, status_bucket: 'Aging' },
  'Wiley Rd':    { last_major_work_year: 2020, planning_work_type: 'Gravel grading',   planning_useful_life_yrs: 2,  surface: 'gravel', condition: 3, status_bucket: 'Aging' },
  'Mechanic St': { last_major_work_year: 2021, planning_work_type: 'Crack seal',       planning_useful_life_yrs: 5,  condition: 4, status_bucket: 'Mid-life' },
  'Middle St':   { last_major_work_year: 2022, planning_work_type: 'Crack seal',       planning_useful_life_yrs: 5,  condition: 4, status_bucket: 'Mid-life' },
  'Pleasant St': { last_major_work_year: 2022, planning_work_type: 'Crack seal',       planning_useful_life_yrs: 5,  condition: 4, status_bucket: 'Mid-life' },
  'School St':   { last_major_work_year: 2023, planning_work_type: 'Crack seal',       planning_useful_life_yrs: 5,  condition: 4, status_bucket: 'Mid-life' },
  'Union St':    { last_major_work_year: 2023, planning_work_type: 'Crack seal',       planning_useful_life_yrs: 5,  condition: 4, status_bucket: 'Mid-life' },
  'Weston Ave':  { last_major_work_year: 2024, planning_work_type: 'Crack seal',       planning_useful_life_yrs: 5,  condition: 5, status_bucket: 'Good' },
  'O\'Brien Ave':{ last_major_work_year: 2024, planning_work_type: 'Chip seal',        planning_useful_life_yrs: 7,  condition: 4, status_bucket: 'Good' },
  'Kennebec Rd': { last_major_work_year: 2024, planning_work_type: 'Chip seal',        planning_useful_life_yrs: 7,  condition: 4, status_bucket: 'Good' },
};

// Cost per centerline mile by work type
export const COST_PER_MILE = {
  'Overlay / shim':    150000,
  'Reclaim & pave':    400000,
  'Crack seal':          6000,
  'Chip seal':          20000,
  'Gravel grading':      4000,
  'Drainage / culvert': 60000,
  'Reconstruction':    500000,
};

/**
 * Compute next treatment year from last work year + useful life.
 * If already past due, schedule it as soon as possible (CURRENT_YEAR).
 */
export function computeNextTreatmentYear(lastWorkYear, usefulLifeYrs, startYear = CURRENT_YEAR) {
  if (!lastWorkYear) return startYear;
  const due = lastWorkYear + usefulLifeYrs;
  return Math.max(due, startYear);
}

/**
 * Compute estimated project cost.
 */
export function computeProjectCost(workType, centerlineMiles) {
  const rate = COST_PER_MILE[workType] || 50000;
  return Math.round(rate * centerlineMiles);
}

/**
 * Compute priority score (0-100). Higher = more urgent.
 */
export function computePriorityScore(road, nextTreatmentYear) {
  let score = 50;
  const bucket = road.status_bucket || road.status_bucket;
  if (bucket === 'Critical')  score += 35;
  if (bucket === 'Aging')     score += 20;
  if (bucket === 'Mid-life')  score += 5;
  if (road.drainage_concern)  score += 10;
  const daysOverdue = CURRENT_YEAR - (nextTreatmentYear || CURRENT_YEAR);
  score += Math.min(daysOverdue * 5, 15);
  const miles = road.centerline_miles || 0;
  if (miles > 1.0)  score += 10;
  if (miles > 0.5)  score += 5;
  return Math.min(score, 100);
}

/**
 * Build the full road register from GIS data + planning data overlay.
 * Returns array of enriched road segment objects.
 */
export function buildDefaultRoadRegister() {
  return GIS_ROADS.map(road => {
    const planning = ROAD_PLANNING_DATA[road.road_name] || {};
    const surface  = planning.surface || (road.jurisdiction === 'Townway' ? 'paved' : 'paved');
    const workType = planning.planning_work_type || (surface === 'gravel' ? 'Gravel grading' : 'Crack seal');
    const lifeYrs  = planning.planning_useful_life_yrs || (surface === 'gravel' ? 2 : 5);
    const nextYear = computeNextTreatmentYear(planning.last_major_work_year, lifeYrs);
    const cost     = computeProjectCost(workType, road.centerline_miles);
    const bucket   = planning.status_bucket || (nextYear <= CURRENT_YEAR ? 'Critical' : 'Good');
    const priority = computePriorityScore({ ...road, ...planning, status_bucket: bucket }, nextYear);

    return {
      ...road,
      surface,
      avg_width_ft: 20,
      lanes: 2,
      functional_class: road.jurisdiction === 'State-aid' ? 'State-aid' : 'Town local',
      condition: planning.condition || 3,
      drainage_concern: planning.drainage_concern || false,
      last_major_work_year: planning.last_major_work_year || null,
      last_work_type: planning.last_work_type || null,
      last_capitalized_cost: planning.last_capitalized_cost || null,
      planning_work_type: workType,
      planning_useful_life_yrs: lifeYrs,
      next_treatment_year: nextYear,
      estimated_project_cost: cost,
      status_bucket: bucket,
      accepted: true,
      priority_score: priority,
      notes: planning.notes || 'GIS import — needs field validation.',
    };
  });
}

/**
 * Build default CIP project pipeline from the Option C workbook + road register.
 * Ensures every road has at least one project scheduled within the 15-year window.
 */
export function buildDefaultProjectPipeline(roads, startYear = CURRENT_YEAR, years = 15) {
  const endYear = startYear + years - 1;
  const projects = [];

  // Explicit projects from Option C workbook
  const explicitProjects = [
    { project_name: 'Short St Paving',        linked_road: 'Short St',    category: 'Road',     work_type: 'Overlay / shim',  fy_start: 2027, fy_end: 2027, total_cost: 30000,   funding_source: 'Capital Reserve', status: 'Planned', priority: 'High', notes: 'Drainage + paving priority.' },
    { project_name: 'Water St Paving',         linked_road: 'Water St',    category: 'Road',     work_type: 'Overlay / shim',  fy_start: 2027, fy_end: 2027, total_cost: 36000,   funding_source: 'Capital Reserve', status: 'Planned', priority: 'High', notes: '1,000 feet per meeting.' },
    { project_name: 'Bowker St Overlay',       linked_road: 'Bowker St',   category: 'Road',     work_type: 'Overlay / shim',  fy_start: 2027, fy_end: 2027, total_cost: 14550,   funding_source: 'Capital Reserve', status: 'Planned', priority: 'Critical' },
    { project_name: 'Bowker St Drainage',      linked_road: 'Bowker St',   category: 'Drainage', work_type: 'Drainage / culvert', fy_start: 2027, fy_end: 2027, total_cost: 18000, funding_source: 'General Fund',    status: 'Planned', priority: 'Critical' },
    { project_name: 'Bruce St Overlay',        linked_road: 'Bruce St',    category: 'Road',     work_type: 'Overlay / shim',  fy_start: 2028, fy_end: 2028, total_cost: 18900,   funding_source: 'Capital Reserve', status: 'Planned', priority: 'Critical' },
    { project_name: 'Center St Overlay',       linked_road: 'Center St',   category: 'Road',     work_type: 'Overlay / shim',  fy_start: 2028, fy_end: 2028, total_cost: 45600,   funding_source: 'Capital Reserve', status: 'Planned', priority: 'Critical' },
    { project_name: 'Church St Overlay',       linked_road: 'Church St',   category: 'Road',     work_type: 'Overlay / shim',  fy_start: 2028, fy_end: 2029, total_cost: 22200,   funding_source: 'Capital Reserve', status: 'Planned', priority: 'Critical' },
    { project_name: 'Court St Overlay',        linked_road: 'Court St',    category: 'Road',     work_type: 'Overlay / shim',  fy_start: 2029, fy_end: 2029, total_cost: 28350,   funding_source: 'Capital Reserve', status: 'Planned', priority: 'High' },
    { project_name: 'River Rd Reclamation',    linked_road: 'River Rd',    category: 'Road',     work_type: 'Reclaim & pave',  fy_start: 2030, fy_end: 2033, total_cost: 728400,  funding_source: 'Mixed',           status: 'Planned', priority: 'Critical', notes: 'Largest project, 1.82 miles. Spread over 4 years.' },
    { project_name: 'Kilton Rd Overlay',       linked_road: 'Kilton Rd',   category: 'Road',     work_type: 'Overlay / shim',  fy_start: 2029, fy_end: 2030, total_cost: 81300,   funding_source: 'Capital Reserve', status: 'Planned', priority: 'High' },
    { project_name: 'Whitney Rd Overlay',      linked_road: 'Whitney Rd',  category: 'Road',     work_type: 'Overlay / shim',  fy_start: 2030, fy_end: 2030, total_cost: 58350,   funding_source: 'Capital Reserve', status: 'Planned', priority: 'High' },
    { project_name: 'Roundy Rd Gravel Program',linked_road: 'Roundy Rd',   category: 'Road',     work_type: 'Gravel grading',  fy_start: 2027, fy_end: 2027, total_cost: 2896,    funding_source: 'General Fund',    status: 'Planned', priority: 'Medium', notes: 'Annual gravel maintenance.' },
    { project_name: 'Wiley Rd Gravel Program', linked_road: 'Wiley Rd',    category: 'Road',     work_type: 'Gravel grading',  fy_start: 2027, fy_end: 2027, total_cost: 1248,    funding_source: 'General Fund',    status: 'Planned', priority: 'Medium' },
    { project_name: 'Mechanic St Crack Seal',  linked_road: 'Mechanic St', category: 'Road',     work_type: 'Crack seal',      fy_start: 2027, fy_end: 2027, total_cost: 1254,    funding_source: 'Capital Reserve', status: 'Planned', priority: 'Medium' },
    { project_name: 'School St Crack Seal',    linked_road: 'School St',   category: 'Road',     work_type: 'Crack seal',      fy_start: 2028, fy_end: 2028, total_cost: 1218,    funding_source: 'Capital Reserve', status: 'Planned', priority: 'Medium' },
    { project_name: 'Middle St Crack Seal',    linked_road: 'Middle St',   category: 'Road',     work_type: 'Crack seal',      fy_start: 2027, fy_end: 2027, total_cost: 816,     funding_source: 'Capital Reserve', status: 'Planned', priority: 'Medium' },
    { project_name: 'Pleasant St Crack Seal',  linked_road: 'Pleasant St', category: 'Road',     work_type: 'Crack seal',      fy_start: 2027, fy_end: 2027, total_cost: 1458,    funding_source: 'Capital Reserve', status: 'Planned', priority: 'Medium' },
    { project_name: 'Union St Crack Seal',     linked_road: 'Union St',    category: 'Road',     work_type: 'Crack seal',      fy_start: 2028, fy_end: 2028, total_cost: 1314,    funding_source: 'Capital Reserve', status: 'Planned', priority: 'Medium' },
    { project_name: 'Weston Ave Chip Seal',    linked_road: 'Weston Ave',  category: 'Road',     work_type: 'Chip seal',       fy_start: 2031, fy_end: 2031, total_cost: 5120,    funding_source: 'Capital Reserve', status: 'Planned', priority: 'Low' },
    { project_name: 'O\'Brien Ave Chip Seal',  linked_road: "O'Brien Ave", category: 'Road',     work_type: 'Chip seal',       fy_start: 2031, fy_end: 2031, total_cost: 3960,    funding_source: 'Capital Reserve', status: 'Planned', priority: 'Low' },
    { project_name: 'Kennebec Rd Chip Seal',   linked_road: 'Kennebec Rd', category: 'Road',     work_type: 'Chip seal',       fy_start: 2031, fy_end: 2031, total_cost: 6240,    funding_source: 'Capital Reserve', status: 'Planned', priority: 'Low' },
    // Facility
    { project_name: 'Public Works Shop Building (60x80x18)', linked_road: 'Public Works support', category: 'Facility', work_type: 'Other', fy_start: 2030, fy_end: 2032, total_cost: 960000, funding_source: 'Bond', status: 'Planned', priority: 'High', notes: 'Spread FY30-32.' },
    // 2nd cycle treatments (years 10-15) — ensures long-range coverage
    { project_name: 'Bowker St 2nd Overlay',   linked_road: 'Bowker St',   category: 'Road', work_type: 'Overlay / shim', fy_start: 2037, fy_end: 2037, total_cost: 14550, funding_source: 'Capital Reserve', status: 'Planned', priority: 'Medium' },
    { project_name: 'Bruce St 2nd Overlay',    linked_road: 'Bruce St',    category: 'Road', work_type: 'Overlay / shim', fy_start: 2038, fy_end: 2038, total_cost: 18900, funding_source: 'Capital Reserve', status: 'Planned', priority: 'Medium' },
    { project_name: 'Center St 2nd Overlay',   linked_road: 'Center St',   category: 'Road', work_type: 'Overlay / shim', fy_start: 2038, fy_end: 2038, total_cost: 45600, funding_source: 'Capital Reserve', status: 'Planned', priority: 'Medium' },
    { project_name: 'Short St 2nd Overlay',    linked_road: 'Short St',    category: 'Road', work_type: 'Overlay / shim', fy_start: 2037, fy_end: 2037, total_cost: 30000, funding_source: 'Capital Reserve', status: 'Planned', priority: 'Medium' },
    { project_name: 'Water St 2nd Overlay',    linked_road: 'Water St',    category: 'Road', work_type: 'Overlay / shim', fy_start: 2037, fy_end: 2037, total_cost: 36000, funding_source: 'Capital Reserve', status: 'Planned', priority: 'Medium' },
    { project_name: 'Kilton Rd 2nd Overlay',   linked_road: 'Kilton Rd',   category: 'Road', work_type: 'Overlay / shim', fy_start: 2039, fy_end: 2040, total_cost: 81300, funding_source: 'Capital Reserve', status: 'Planned', priority: 'Medium' },
    { project_name: 'Mechanic St 2nd Crack Seal', linked_road: 'Mechanic St', category: 'Road', work_type: 'Crack seal', fy_start: 2032, fy_end: 2032, total_cost: 1254, funding_source: 'Capital Reserve', status: 'Planned', priority: 'Low' },
    { project_name: 'School St 2nd Crack Seal',   linked_road: 'School St',   category: 'Road', work_type: 'Crack seal', fy_start: 2033, fy_end: 2033, total_cost: 1218, funding_source: 'Capital Reserve', status: 'Planned', priority: 'Low' },
    { project_name: 'Roundy Rd Annual Gravel 2029', linked_road: 'Roundy Rd', category: 'Road', work_type: 'Gravel grading', fy_start: 2029, fy_end: 2029, total_cost: 2896, funding_source: 'General Fund', status: 'Planned', priority: 'Low' },
    { project_name: 'Roundy Rd Annual Gravel 2031', linked_road: 'Roundy Rd', category: 'Road', work_type: 'Gravel grading', fy_start: 2031, fy_end: 2031, total_cost: 2896, funding_source: 'General Fund', status: 'Planned', priority: 'Low' },
    { project_name: 'Wiley Rd Annual Gravel 2029',  linked_road: 'Wiley Rd',  category: 'Road', work_type: 'Gravel grading', fy_start: 2029, fy_end: 2029, total_cost: 1248, funding_source: 'General Fund', status: 'Planned', priority: 'Low' },
    // Remaining townway roads — auto-scheduled from next treatment year
  ];

  // Add auto-generated projects for roads not already covered
  const coveredRoads = new Set(explicitProjects.map(p => p.linked_road.toLowerCase()));
  roads.forEach(road => {
    if (coveredRoads.has(road.road_name.toLowerCase())) return;
    const nextYear = road.next_treatment_year || startYear;
    if (nextYear > endYear + 10) return; // Too far out
    const cost = road.estimated_project_cost || computeProjectCost(road.planning_work_type, road.centerline_miles);
    explicitProjects.push({
      project_name: `${road.road_name} — ${road.planning_work_type || 'Treatment'}`,
      linked_road:  road.road_name,
      category:     road.surface === 'gravel' ? 'Road' : 'Road',
      work_type:    road.planning_work_type || 'Crack seal',
      fy_start:     Math.min(nextYear, endYear),
      fy_end:       Math.min(nextYear, endYear),
      total_cost:   cost,
      funding_source: 'Capital Reserve',
      status:       'Planned',
      priority:     road.status_bucket === 'Critical' ? 'Critical' : road.status_bucket === 'Aging' ? 'High' : 'Medium',
      notes:        `Auto-scheduled from GIS register. Needs field validation.`,
    });
  });

  return explicitProjects.map(p => ({
    ...p,
    annual_allocation: p.total_cost / Math.max((p.fy_end - p.fy_start + 1), 1),
    include_in_cip: true,
  }));
}

/**
 * Build the 10-15 year fund balance / CIP schedule.
 * Returns array of year objects with sources, uses, balance.
 */
export function buildCIPSchedule(assumptions, projects) {
  const {
    start_fiscal_year = CURRENT_YEAR,
    analysis_years = DEFAULT_YEARS,
    gf_annual_transfer = 100000,
    excise_annual_allocation = 100000,
    lrap_annual_estimate = 20724,
    beginning_reserve = 0,
    inflation_rate = 0.03,
  } = assumptions;

  const schedule = [];
  let reserve = beginning_reserve;

  for (let i = 0; i < analysis_years; i++) {
    const year = start_fiscal_year + i;
    const escalation = Math.pow(1 + inflation_rate, i);

    // Sources
    const gfTransfer   = gf_annual_transfer * escalation;
    const excise       = excise_annual_allocation;
    const lrap         = lrap_annual_estimate;
    const totalSources = gfTransfer + excise + lrap;

    // Uses: sum project annual allocations for this year
    const yearProjects = projects.filter(p => p.include_in_cip !== false && year >= p.fy_start && year <= p.fy_end);
    const totalUses = yearProjects.reduce((s, p) => s + (p.annual_allocation || p.total_cost || 0), 0);

    const beginReserve = reserve;
    const endReserve   = beginReserve + totalSources - totalUses;
    reserve = endReserve;

    schedule.push({
      year,
      beginning_reserve: beginReserve,
      gf_transfer:       gfTransfer,
      excise_allocation: excise,
      lrap:              lrap,
      total_sources:     totalSources,
      total_uses:        totalUses,
      ending_reserve:    endReserve,
      projects:          yearProjects,
      is_deficit:        endReserve < 0,
    });
  }

  return schedule;
}

/**
 * Compute summary stats from the CIP schedule.
 */
export function buildScheduleSummary(schedule, projects) {
  const totalSources   = schedule.reduce((s, y) => s + y.total_sources, 0);
  const totalUses      = schedule.reduce((s, y) => s + y.total_uses, 0);
  const deficitYears   = schedule.filter(y => y.is_deficit).length;
  const year10Reserve  = schedule[9]?.ending_reserve ?? 0;
  const year15Reserve  = schedule[14]?.ending_reserve ?? schedule[schedule.length - 1]?.ending_reserve ?? 0;
  const criticalCount  = projects.filter(p => p.priority === 'Critical').length;
  const totalProjectCost = projects.filter(p => p.include_in_cip !== false).reduce((s, p) => s + (p.total_cost || 0), 0);

  return {
    total_sources:     totalSources,
    total_uses:        totalUses,
    net_balance:       totalSources - totalUses,
    deficit_years:     deficitYears,
    year_10_reserve:   year10Reserve,
    year_15_reserve:   year15Reserve,
    critical_projects: criticalCount,
    total_project_cost: totalProjectCost,
    total_road_projects: projects.filter(p => p.category === 'Road').length,
  };
}

export const fmt  = n => n != null ? `$${Math.abs(Math.round(n)).toLocaleString()}` : '—';
export const fmtK = n => n != null ? `$${(Math.abs(n) / 1000).toFixed(0)}K` : '—';
export const fmtM = n => n != null ? `$${(Math.abs(n) / 1000000).toFixed(2)}M` : '—';