/**
 * policyEngine.js — Municipal Policy Intelligence Engine
 * Pure functions for scoring, filtering, and summarizing legislative items.
 */

export const JURISDICTIONS = ['federal', 'state', 'county', 'local', 'regional'];
export const PRIORITIES = ['critical', 'high', 'medium', 'watch'];
export const STATUSES = ['introduced', 'in_committee', 'passed_chamber', 'passed_both', 'signed', 'vetoed', 'enacted', 'failed', 'rulemaking', 'effective', 'watch'];
export const IMPACT_TYPES = ['Revenue', 'Expense', 'Compliance', 'Capital', 'HR', 'Operations', 'Governance', 'Grant Opportunity'];
export const IMPACT_LEVELS = ['very_high', 'high', 'moderate', 'low'];
export const RECOMMENDED_ACTIONS = ['monitor', 'advocate', 'budget', 'prepare', 'coordinate', 'respond', 'none'];

export const TOPIC_CATEGORIES = [
  'Municipal Finance', 'Revenue Sharing', 'Taxation', 'Public Safety', 'EMS / Ambulance',
  'Infrastructure', 'Transportation', 'Housing', 'Land Use', 'Energy', 'Labor / HR',
  'Benefits / Retirement', 'Compliance / Auditing', 'Cybersecurity / Records',
  'Economic Development', 'Environmental Regulation', 'Grants / Appropriations',
  'Zoning / Planning', 'Public Works', 'Elections / Governance', 'Other',
];

export const DEFAULT_DEPARTMENTS = [
  'Administration', 'Finance', 'HR', 'Public Works', 'Police', 'Fire',
  'EMS / Ambulance', 'Planning / Code', 'Parks / Recreation', 'Utilities',
  'Economic Development', 'Library', 'Transfer Station',
];

export const DEFAULT_STRATEGIC_GOALS = [
  'Operational Efficiency', 'Compliance', 'Infrastructure', 'Public Safety',
  'Economic Development', 'Housing', 'Workforce', 'Capital Planning', 'Regional Collaboration',
  'Financial Sustainability', 'Technology & Innovation',
];

export const STATUS_LABELS = {
  introduced: 'Introduced',
  in_committee: 'In Committee',
  passed_chamber: 'Passed Chamber',
  passed_both: 'Passed Both',
  signed: 'Signed',
  vetoed: 'Vetoed',
  enacted: 'Enacted',
  failed: 'Failed',
  rulemaking: 'Rulemaking',
  effective: 'Effective',
  watch: 'Watch',
};

export const STATUS_COLORS = {
  introduced: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  in_committee: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  passed_chamber: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  passed_both: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300' },
  signed: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  vetoed: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  enacted: { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300' },
  failed: { bg: 'bg-slate-100', text: 'text-slate-500', border: 'border-slate-200' },
  rulemaking: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  effective: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  watch: { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' },
};

export const PRIORITY_COLORS = {
  critical: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300', dot: 'bg-red-500' },
  high: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300', dot: 'bg-orange-500' },
  medium: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-400' },
  watch: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200', dot: 'bg-slate-400' },
};

export const JURISDICTION_COLORS = {
  federal: { bg: 'bg-blue-100', text: 'text-blue-800' },
  state: { bg: 'bg-purple-100', text: 'text-purple-800' },
  county: { bg: 'bg-amber-100', text: 'text-amber-800' },
  local: { bg: 'bg-emerald-100', text: 'text-emerald-800' },
  regional: { bg: 'bg-teal-100', text: 'text-teal-800' },
};

export const ACTION_COLORS = {
  monitor: { bg: 'bg-slate-100', text: 'text-slate-700' },
  advocate: { bg: 'bg-blue-100', text: 'text-blue-800' },
  budget: { bg: 'bg-amber-100', text: 'text-amber-800' },
  prepare: { bg: 'bg-orange-100', text: 'text-orange-800' },
  coordinate: { bg: 'bg-purple-100', text: 'text-purple-800' },
  respond: { bg: 'bg-red-100', text: 'text-red-800' },
  none: { bg: 'bg-slate-50', text: 'text-slate-400' },
};

export const EVENT_TYPE_LABELS = {
  hearing: 'Hearing',
  vote: 'Vote',
  work_session: 'Work Session',
  effective_date: 'Effective Date',
  comment_deadline: 'Comment Deadline',
  rulemaking: 'Rulemaking',
  grant_deadline: 'Grant Deadline',
  custom: 'Event',
};

export const EVENT_TYPE_COLORS = {
  hearing: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  vote: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  work_session: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  effective_date: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  comment_deadline: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  rulemaking: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  grant_deadline: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  custom: { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' },
};

// Governance type → jurisdiction weight map (mirrors policyIntelligenceEngine)
const GOV_GEO_BOOST = {
  town_meeting:   { state: 1.0, federal: 0.85, county: 0.70, regional: 0.65, local: 0.95 },
  select_board:   { state: 1.0, federal: 0.85, county: 0.70, regional: 0.65, local: 0.95 },
  council_manager:{ state: 1.0, federal: 0.90, county: 0.75, regional: 0.70, local: 1.0  },
  mayor_council:  { state: 1.0, federal: 0.90, county: 0.70, regional: 0.70, local: 1.0  },
  commission:     { state: 1.0, federal: 0.85, county: 0.90, regional: 0.75, local: 0.80 },
  other:          { state: 1.0, federal: 0.85, county: 0.70, regional: 0.65, local: 0.85 },
};

/** Calculate a 0-100 Municipal Relevance Score, governance-type-aware */
export function calcRelevanceScore(item, profile) {
  // Suppress items from wrong state/county entirely (return 0)
  const profState  = (profile?.state  || '').toUpperCase();
  const itemState  = (item.state || '').toUpperCase();
  const profCounty = (profile?.county || '').toLowerCase();
  const itemCounty = (item.county || '').toLowerCase();
  if (item.jurisdiction === 'state'  && itemState  && profState  && itemState  !== profState)  return 0;
  if (item.jurisdiction === 'county' && itemCounty && profCounty && itemCounty !== profCounty) return 0;
  // Suppress failed/vetoed (not manually watched)
  if (['failed', 'vetoed'].includes(item.status) && !item.is_watched && !item.is_flagged_urgent) return 0;

  // Governance-type jurisdiction boost
  const govType = profile?.governance_type || 'other';
  const geoBoosts = GOV_GEO_BOOST[govType] || GOV_GEO_BOOST.other;
  const jBoost = geoBoosts[item.jurisdiction] ?? 1.0;

  let score = 0;
  // Fiscal impact
  if (item.impact_level === 'very_high') score += 25;
  else if (item.impact_level === 'high') score += 18;
  else if (item.impact_level === 'moderate') score += 10;
  else score += 3;
  // Priority
  if (item.priority === 'critical') score += 20;
  else if (item.priority === 'high') score += 14;
  else if (item.priority === 'medium') score += 7;
  else score += 2;
  // Impact types
  score += Math.min((item.impact_types?.length || 0) * 3, 12);
  // Departments
  const deptOverlap = (item.departments_affected || []).filter(d =>
    (profile?.departments || []).includes(d)
  ).length;
  score += Math.min(deptOverlap * 4, 16);
  // Strategic goals
  const goalOverlap = (item.strategic_goals || []).filter(g =>
    (profile?.strategic_goals || []).includes(g)
  ).length;
  score += Math.min(goalOverlap * 3, 12);
  // Probability of passage
  score += Math.round((item.probability_of_passage || 50) / 10);
  // Watched / flagged
  if (item.is_flagged_urgent) score += 5;
  if (item.is_flagged_budget) score += 3;
  // Apply jurisdiction multiplier
  return Math.min(Math.round(score * jBoost), 100);
}

/** Filter items by multiple criteria */
export function filterItems(items, filters) {
  return items.filter(item => {
    if (filters.jurisdiction && filters.jurisdiction !== 'all' && item.jurisdiction !== filters.jurisdiction) return false;
    if (filters.priority && filters.priority !== 'all' && item.priority !== filters.priority) return false;
    if (filters.status && filters.status !== 'all' && item.status !== filters.status) return false;
    if (filters.category && filters.category !== 'all' && item.category !== filters.category) return false;
    if (filters.department && filters.department !== 'all' && !(item.departments_affected || []).includes(filters.department)) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (!item.title?.toLowerCase().includes(q) && !item.identifier?.toLowerCase().includes(q) && !item.summary?.toLowerCase().includes(q)) return false;
    }
    if (filters.watched && !item.is_watched) return false;
    if (filters.urgent && !item.is_flagged_urgent) return false;
    if (filters.archived !== true && item.is_archived) return false;
    return true;
  });
}

/** Sort items by relevance score descending */
export function sortByRelevance(items) {
  return [...items].sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0));
}

/** Get upcoming calendar events within N days */
export function getUpcomingEvents(events, days = 30) {
  const now = new Date();
  const cutoff = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  return events
    .filter(e => {
      if (!e.date) return false;
      const d = new Date(e.date);
      return d >= now && d <= cutoff;
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date));
}

/** Aggregate fiscal impact across items */
export function aggregateFiscalImpact(items) {
  return items.reduce((sum, item) => sum + (item.fiscal_impact_amount || 0), 0);
}

/** Build a plain-language "why this matters" if not provided */
export function buildRelevanceNote(item, profile) {
  if (item.municipal_relevance) return item.municipal_relevance;
  const parts = [];
  if (item.departments_affected?.length) {
    parts.push(`Affects ${item.departments_affected.join(', ')}`);
  }
  if (item.fiscal_impact_note) parts.push(item.fiscal_impact_note);
  if (item.compliance_impact) parts.push('Creates compliance obligations');
  if (!parts.length) return `This item is being tracked for potential relevance to ${profile?.name || 'your municipality'}.`;
  return parts.join('. ') + '.';
}

export const fmt = n => !n ? '—' : `$${Math.abs(n).toLocaleString()}`;
export const fmtDate = d => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
export const daysUntil = d => {
  if (!d) return null;
  const diff = Math.ceil((new Date(d) - new Date()) / (1000 * 60 * 60 * 24));
  return diff;
};