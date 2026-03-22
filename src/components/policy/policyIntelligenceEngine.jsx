/**
 * policyIntelligenceEngine.js
 * Full municipal policy intelligence layer — normalization, scoring,
 * deduplication, department mapping, insight generation, alert logic,
 * watchlist evaluation, and output object builders.
 *
 * Pure functions only. No React dependencies.
 */

// ─── Scoring version ──────────────────────────────────────────────────────────
export const SCORING_VERSION = '2.0';

// ─── Topic taxonomy ───────────────────────────────────────────────────────────
export const TOPIC_TAXONOMY = [
  { id: 'municipal_finance',       label: 'Municipal Finance',        keywords: ['budget', 'appropriation', 'fund balance', 'reserve', 'fiscal', 'general fund', 'mill rate', 'levy'] },
  { id: 'revenue_sharing',         label: 'Revenue Sharing',          keywords: ['revenue sharing', 'state aid', 'municipal aid', 'urip', 'local government aid', 'lga'] },
  { id: 'taxation',                label: 'Taxation',                 keywords: ['property tax', 'excise tax', 'tax increment', 'tif', 'homestead', 'circuit breaker', 'tax exemption', 'assessment', 'valuation'] },
  { id: 'procurement',             label: 'Procurement',              keywords: ['procurement', 'purchasing', 'bid', 'rfp', 'rfq', 'sole source', 'contract award', 'vendor'] },
  { id: 'audit_compliance',        label: 'Audit & Compliance',       keywords: ['audit', 'gasb', 'cafr', 'acfr', 'financial reporting', 'internal control', 'single audit', 'compliance', 'reporting requirement'] },
  { id: 'labor_hr',                label: 'Labor & HR',               keywords: ['labor', 'wage', 'salary', 'collective bargaining', 'union', 'employment', 'hiring', 'termination', 'civil service', 'personnel', 'workforce'] },
  { id: 'benefits_retirement',     label: 'Benefits & Retirement',    keywords: ['pension', 'retirement', 'mpers', 'pers', 'health insurance', 'benefit', 'cobra', 'workers comp', 'disability'] },
  { id: 'public_safety',           label: 'Public Safety',            keywords: ['public safety', 'emergency', '911', 'dispatch', 'first responder'] },
  { id: 'fire',                    label: 'Fire',                     keywords: ['fire', 'firefighter', 'nfpa', 'fire code', 'fire department', 'arson'] },
  { id: 'police',                  label: 'Police',                   keywords: ['police', 'law enforcement', 'officer', 'patrol', 'criminal justice', 'use of force', 'body camera'] },
  { id: 'ems',                     label: 'EMS / Ambulance',          keywords: ['ems', 'ambulance', 'paramedic', 'emergency medical', 'mema', 'emt', 'transport', 'medicare reimbursement', 'billing', 'comstar', 'ground transport'] },
  { id: 'public_works',            label: 'Public Works',             keywords: ['public works', 'highway', 'road maintenance', 'paving', 'snowplow', 'equipment', 'fleet', 'facility'] },
  { id: 'transportation',          label: 'Transportation',           keywords: ['transportation', 'dot', 'transit', 'bridge', 'road', 'highway', 'traffic', 'mdot'] },
  { id: 'utilities',               label: 'Utilities',                keywords: ['utility', 'water', 'sewer', 'wastewater', 'stormwater', 'electric', 'broadband', 'internet'] },
  { id: 'housing',                 label: 'Housing',                  keywords: ['housing', 'affordable housing', 'home rule', 'rent control', 'eviction', 'landlord', 'tenant'] },
  { id: 'land_use',                label: 'Land Use & Zoning',        keywords: ['zoning', 'land use', 'comprehensive plan', 'subdivision', 'ordinance', 'site plan', 'variance', 'conditional use'] },
  { id: 'planning_code',           label: 'Planning & Code',          keywords: ['planning', 'code enforcement', 'building permit', 'inspection', 'certificate of occupancy'] },
  { id: 'energy',                  label: 'Energy',                   keywords: ['energy', 'solar', 'wind', 'renewable', 'efficiency', 'heating fuel', 'electricity cost'] },
  { id: 'environmental',           label: 'Environmental Regulation', keywords: ['environment', 'epa', 'dep', 'clean water', 'clean air', 'brownfield', 'hazmat', 'solid waste', 'recycling', 'transfer station', 'landfill'] },
  { id: 'records_privacy',         label: 'Records & Privacy',        keywords: ['records', 'foia', 'foaa', 'public records', 'privacy', 'data protection', 'retention', 'open meeting'] },
  { id: 'cybersecurity',           label: 'Cybersecurity',            keywords: ['cybersecurity', 'cyber', 'ransomware', 'data breach', 'network security', 'it security'] },
  { id: 'grants',                  label: 'Grants & Appropriations',  keywords: ['grant', 'appropriation', 'cdbg', 'arpa', 'fema', 'usda', 'dot grant', 'competitive grant', 'formula funding', 'federal aid'] },
  { id: 'economic_development',    label: 'Economic Development',     keywords: ['economic development', 'business', 'tif', 'tax incentive', 'commerce', 'downtown', 'revitalization'] },
  { id: 'county_regional',         label: 'County & Regional Governance', keywords: ['county', 'regional', 'interlocal', 'shared services', 'cooperative', 'district', 'consortium'] },
];

// ─── Department keyword map ───────────────────────────────────────────────────
export const DEPARTMENT_KEYWORD_MAP = {
  'Administration': ['manager', 'administrator', 'clerk', 'selectboard', 'select board', 'town meeting', 'governance', 'records', 'foaa', 'open meeting'],
  'Finance':        ['finance', 'budget', 'appropriation', 'auditor', 'accounting', 'payroll', 'revenue', 'fiscal', 'gasb', 'cafr', 'acfr', 'mill rate', 'tax commitment'],
  'HR':             ['hr', 'human resource', 'personnel', 'employment', 'wage', 'labor', 'collective bargaining', 'union', 'pension', 'benefit', 'workers comp'],
  'Public Works':   ['public works', 'highway', 'road', 'bridge', 'paving', 'infrastructure', 'equipment', 'snowplow', 'facility', 'fleet'],
  'Police':         ['police', 'law enforcement', 'officer', 'patrol', 'criminal', 'dispatch', 'body camera', 'use of force'],
  'Fire':           ['fire', 'firefighter', 'nfpa', 'arson', 'fire code', 'fire department'],
  'EMS / Ambulance':['ems', 'ambulance', 'paramedic', 'emt', 'emergency medical', 'transport', 'medicare reimbursement', 'ground transport', 'billing'],
  'Planning / Code':['planning', 'zoning', 'code enforcement', 'subdivision', 'building permit', 'inspection', 'land use', 'variance'],
  'Parks / Recreation': ['park', 'recreation', 'trail', 'playground', 'open space', 'athletic'],
  'Utilities':      ['utility', 'water', 'sewer', 'wastewater', 'stormwater', 'broadband', 'electric'],
  'Transfer Station': ['transfer station', 'solid waste', 'recycling', 'landfill', 'waste'],
  'Economic Development': ['economic development', 'tif', 'business', 'revitalization', 'incentive'],
  'Library':        ['library', 'librarian', 'book'],
};

// ─── Source type weights (how much to trust/weight a source) ──────────────────
export const SOURCE_TRUST_WEIGHTS = {
  federal_legislation:  1.0,
  state_legislation:    1.0,
  agency_rulemaking:    0.9,
  funding_announcement: 0.95,
  county_agenda:        0.8,
  municipal_policy:     0.85,
  committee_calendar:   0.85,
  official_activity:    0.7,
  manual_entry:         1.0,
  csv_import:           0.8,
  api_connector:        0.9,
};

// ─── Normalization ────────────────────────────────────────────────────────────

/**
 * Normalize a raw source record into a LegislationItem-compatible object.
 * Does NOT write to the DB — returns the normalized shape for caller to persist.
 */
export function normalizeSourceRecord(raw) {
  const now = new Date().toISOString();
  return {
    identifier:         raw.external_id || raw.bill_number || '',
    title:              raw.raw_title || raw.title || 'Untitled Item',
    jurisdiction:       inferJurisdiction(raw),
    category:           raw.category || inferCategory(raw.raw_title, raw.raw_summary),
    status:             normalizeStatus(raw.status),
    summary:            raw.raw_summary || raw.summary || '',
    source_url:         raw.source_url || raw.source_link || '',
    sponsor:            raw.sponsor || '',
    last_action:        raw.last_action || '',
    last_action_date:   raw.last_action_date || raw.updated_at || null,
    hearing_date:       raw.hearing_date || null,
    vote_date:          raw.vote_date || null,
    comment_deadline:   raw.comment_deadline || raw.public_comment_deadline || null,
    effective_date:     raw.effective_date || null,
    introduced_date:    raw.introduced_date || null,
    departments_affected: [],
    strategic_goals:    [],
    impact_types:       [],
    priority:           'watch',
    impact_level:       'low',
    is_watched:         false,
    is_archived:        false,
    _source_type:       raw.source_type,
    _source_name:       raw.source_name,
    _ingested_at:       now,
    _source_record_id:  raw.id,
  };
}

function inferJurisdiction(raw) {
  if (raw.source_jurisdiction) return raw.source_jurisdiction;
  const st = raw.source_type || '';
  if (st.includes('federal') || st.includes('congress')) return 'federal';
  if (st.includes('state')) return 'state';
  if (st.includes('county')) return 'county';
  if (st.includes('municipal')) return 'local';
  return 'state';
}

function normalizeStatus(rawStatus) {
  if (!rawStatus) return 'watch';
  const s = rawStatus.toLowerCase().replace(/[\s_-]/g, '');
  if (s.includes('introduced') || s.includes('filed')) return 'introduced';
  if (s.includes('committee')) return 'in_committee';
  if (s.includes('passedchamber') || s.includes('passedhouse') || s.includes('passedsenate')) return 'passed_chamber';
  if (s.includes('passedboth') || s.includes('enacted') || s.includes('chaptered')) return 'enacted';
  if (s.includes('signed')) return 'signed';
  if (s.includes('vetoed') || s.includes('veto')) return 'vetoed';
  if (s.includes('failed') || s.includes('defeated') || s.includes('tabled')) return 'failed';
  if (s.includes('rulemaking') || s.includes('proposed rule') || s.includes('nprm')) return 'rulemaking';
  if (s.includes('effective') || s.includes('inforce')) return 'effective';
  return 'watch';
}

// ─── Deduplication ────────────────────────────────────────────────────────────

/**
 * Build a dedup key from an item. Items with matching keys are considered duplicates.
 */
export function buildDedupKey(item) {
  const id = (item.identifier || '').toLowerCase().replace(/[\s\.\-_]/g, '');
  const titleWords = (item.title || '').toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 3)
    .slice(0, 6)
    .join('_');
  if (id) return `${item.jurisdiction}__${id}`;
  return `${item.jurisdiction}__${titleWords}`;
}

/**
 * Given an array of normalized items, group duplicates.
 * Returns { canonical: item, duplicates: [...] }[]
 */
export function groupDuplicates(items) {
  const groups = {};
  items.forEach(item => {
    const key = buildDedupKey(item);
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  });
  return Object.values(groups).map(group => ({
    canonical: group[0],
    duplicates: group.slice(1),
    key: buildDedupKey(group[0]),
  }));
}

// ─── Topic classification ─────────────────────────────────────────────────────

/**
 * Auto-tag an item with topic taxonomy IDs based on title + summary text.
 */
export function classifyTopics(item) {
  const text = `${item.title || ''} ${item.summary || ''} ${item.category || ''}`.toLowerCase();
  return TOPIC_TAXONOMY
    .filter(topic => topic.keywords.some(kw => text.includes(kw)))
    .map(t => t.label);
}

/**
 * Infer a single primary category from text (used in normalization).
 */
export function inferCategory(title = '', summary = '') {
  const text = `${title} ${summary}`.toLowerCase();
  for (const topic of TOPIC_TAXONOMY) {
    if (topic.keywords.some(kw => text.includes(kw))) return topic.label;
  }
  return 'Other';
}

// ─── Department impact mapping ────────────────────────────────────────────────

/**
 * Map an item to affected municipal departments using keyword matching.
 * Returns array of department names.
 */
export function mapDepartmentImpacts(item, customDepartments = null) {
  const text = `${item.title || ''} ${item.summary || ''} ${item.category || ''} ${(item.impact_types || []).join(' ')}`.toLowerCase();
  const depts = customDepartments || Object.keys(DEPARTMENT_KEYWORD_MAP);
  const matched = [];
  depts.forEach(dept => {
    const keywords = DEPARTMENT_KEYWORD_MAP[dept] || [];
    if (keywords.some(kw => text.includes(kw))) {
      if (!matched.includes(dept)) matched.push(dept);
    }
  });
  // Always include Finance if there's any fiscal impact
  if ((item.fiscal_impact_amount || 0) > 0 && !matched.includes('Finance')) {
    matched.push('Finance');
  }
  return matched;
}

// ─── Geographic applicability scoring ────────────────────────────────────────

/**
 * Score how geographically applicable an item is to this municipality.
 * Returns 0–100.
 */
export function scoreGeographicApplicability(item, profile) {
  const jurisdiction = item.jurisdiction || '';
  const itemState = (item.state || '').toUpperCase();
  const profState = (profile?.state || '').toUpperCase();

  if (jurisdiction === 'federal') return 75; // Federal applies broadly
  if (jurisdiction === 'local' && item.municipality === profile?.name) return 100;
  if (jurisdiction === 'state') {
    if (itemState && profState && itemState === profState) return 90;
    if (!itemState) return 60; // Unknown state, still plausible
    return 5; // Different state
  }
  if (jurisdiction === 'county') {
    const itemCounty = (item.county || '').toLowerCase();
    const profCounty = (profile?.county || '').toLowerCase();
    if (itemCounty && profCounty && itemCounty === profCounty) return 85;
    if (!itemCounty) return 50;
    return 10;
  }
  if (jurisdiction === 'regional') return 60;
  return 40;
}

// ─── Main relevance scoring engine ───────────────────────────────────────────

/**
 * Full municipality-aware relevance scoring engine.
 * Returns a MunicipalImpactRecord-shaped object (not persisted — caller decides).
 */
export function scoreItemForMunicipality(item, profile) {
  const now = new Date();

  // 1. Geographic applicability
  const geoScore = scoreGeographicApplicability(item, profile);

  // 2. Topic classification
  const topicTags = classifyTopics(item);
  const profileFocusAreas = profile?.policy_focus_areas || [];
  const topicOverlap = topicTags.filter(t =>
    profileFocusAreas.some(fa => fa.toLowerCase().includes(t.toLowerCase()) || t.toLowerCase().includes(fa.toLowerCase()))
  ).length;
  const topicScore = Math.min(topicOverlap * 12, 36);

  // 3. Department impact
  const detectedDepts = mapDepartmentImpacts(item, profile?.departments);
  const profileDepts = profile?.departments || [];
  const deptOverlap = detectedDepts.filter(d => profileDepts.includes(d)).length;
  const deptScore = Math.min(deptOverlap * 8, 24);

  // 4. Strategic goal alignment
  const profileGoals = profile?.strategic_goals || [];
  const itemGoals = item.strategic_goals || [];
  const goalOverlap = itemGoals.filter(g => profileGoals.includes(g)).length;
  const goalScore = Math.min(goalOverlap * 6, 18);

  // 5. Enterprise fund relevance
  const enterpriseFunds = (profile?.enterprise_funds || []).map(f => f.toLowerCase());
  const itemText = `${item.title} ${item.summary || ''}`.toLowerCase();
  const enterpriseHits = enterpriseFunds.filter(ef => itemText.includes(ef.replace(' fund', '').trim())).length;
  const enterpriseScore = Math.min(enterpriseHits * 10, 20);

  // 6. Custom keyword matches
  const customKeywords = profile?.custom_categories || [];
  const customHits = customKeywords.filter(kw => itemText.toLowerCase().includes(kw.toLowerCase())).length;
  const customScore = Math.min(customHits * 8, 16);

  // 7. Budget / fiscal impact signal
  const hasFiscalImpact = !!(item.fiscal_impact_amount || item.fiscal_impact_note);
  const fiscalScore = hasFiscalImpact ? 10 : 0;

  // 8. Compliance burden
  const hasCompliance = !!(item.compliance_impact);
  const complianceScore = hasCompliance ? 8 : 0;

  // 9. Grant / funding opportunity
  const isGrant = item.is_flagged_grant || topicTags.includes('Grants & Appropriations');
  const grantScore = isGrant ? 10 : 0;

  // 10. Urgency / deadline proximity boost
  const urgencyScore = calcUrgencyScore(item);
  const urgencyBoost = urgencyScore > 70 ? 8 : urgencyScore > 40 ? 4 : 0;

  // 11. Probability of passage
  const passProb = item.probability_of_passage || 50;
  const probScore = Math.round(passProb / 10);

  // Combine weighted score
  let raw = (
    geoScore * 0.20 +
    topicScore * 0.18 +
    deptScore * 0.16 +
    goalScore * 0.12 +
    enterpriseScore * 0.10 +
    customScore * 0.08 +
    fiscalScore * 0.06 +
    complianceScore * 0.04 +
    grantScore * 0.04 +
    urgencyBoost * 0.01 +
    probScore * 0.01
  );

  // Manual flags boost
  if (item.is_flagged_urgent) raw = Math.min(raw + 8, 100);
  if (item.is_flagged_board) raw = Math.min(raw + 4, 100);
  if (item.is_flagged_budget) raw = Math.min(raw + 4, 100);

  const relevanceScore = Math.round(Math.min(raw, 100));

  // Derive priority level
  const priorityLevel = derivePriorityLevel(relevanceScore, urgencyScore, item);

  // Sub-dimension scores
  const budgetImpactScore  = scoreBudgetImpact(item, profile);
  const opsImpactScore     = scoreOperationsImpact(item, profile);
  const hrImpactScore      = scoreHRImpact(item);
  const compImpactScore    = scoreComplianceImpact(item);
  const capImpactScore     = scoreCapitalImpact(item, profile);
  const fundingOppScore    = scoreFundingOpportunity(item, profile);

  // Owner routing
  const recommendedOwner = routeToOwner(item, topicTags, detectedDepts);

  // Confidence
  const confidenceScore = calcConfidenceScore(item);

  return {
    policy_item_id:          item.id,
    municipality_name:       profile?.name || '',
    overall_relevance_score: relevanceScore,
    priority_level:          priorityLevel,
    urgency_score:           urgencyScore,
    confidence_score:        confidenceScore,
    budget_impact_score:     budgetImpactScore,
    operations_impact_score: opsImpactScore,
    hr_impact_score:         hrImpactScore,
    compliance_impact_score: compImpactScore,
    capital_impact_score:    capImpactScore,
    funding_opportunity_score: fundingOppScore,
    geographic_applicability_score: geoScore,
    department_matches:      detectedDepts,
    strategic_goal_matches:  itemGoals.filter(g => profileGoals.includes(g)),
    topic_tags:              topicTags,
    recommended_owner_role:  recommendedOwner,
    scoring_version:         SCORING_VERSION,
    generated_at:            now.toISOString(),
    generation_method:       'rule_based',
  };
}

function derivePriorityLevel(relevanceScore, urgencyScore, item) {
  if (item.priority && item.priority !== 'watch') return item.priority; // Respect manual priority
  const combined = relevanceScore * 0.7 + urgencyScore * 0.3;
  if (combined >= 75) return 'critical';
  if (combined >= 55) return 'high';
  if (combined >= 35) return 'medium';
  return 'watch';
}

function calcUrgencyScore(item) {
  const dates = [
    item.hearing_date,
    item.vote_date,
    item.comment_deadline,
    item.effective_date,
  ].filter(Boolean);

  if (!dates.length) {
    // Late-stage bills are inherently urgent
    if (['signed', 'enacted', 'effective', 'passed_both'].includes(item.status)) return 60;
    return 20;
  }
  const now = new Date();
  const minDays = Math.min(...dates.map(d => {
    const diff = Math.ceil((new Date(d) - now) / (1000 * 60 * 60 * 24));
    return diff;
  }));

  if (minDays <= 7) return 100;
  if (minDays <= 14) return 85;
  if (minDays <= 30) return 70;
  if (minDays <= 60) return 50;
  if (minDays <= 90) return 35;
  if (minDays < 0)   return 40; // Past but may have ongoing effect
  return 20;
}

function scoreBudgetImpact(item, profile) {
  let score = 0;
  const annualBudget = profile?.annual_budget || 4000000;
  if (item.fiscal_impact_amount) {
    const pct = Math.abs(item.fiscal_impact_amount) / annualBudget;
    if (pct > 0.10) score += 40;
    else if (pct > 0.05) score += 28;
    else if (pct > 0.01) score += 16;
    else score += 6;
  }
  if (item.fiscal_impact_note) score += 15;
  if (item.is_flagged_budget) score += 20;
  const text = `${item.title} ${item.summary || ''}`.toLowerCase();
  if (text.includes('appropriat') || text.includes('levy') || text.includes('mill rate') || text.includes('revenue sharing')) score += 15;
  return Math.min(score, 100);
}

function scoreOperationsImpact(item, profile) {
  let score = 0;
  if (item.operational_impact) score += 30;
  const text = `${item.title} ${item.summary || ''}`.toLowerCase();
  const opKeywords = ['require', 'mandate', 'reporting', 'data', 'training', 'procedure', 'protocol', 'standard', 'service delivery'];
  score += opKeywords.filter(kw => text.includes(kw)).length * 8;
  return Math.min(score, 100);
}

function scoreHRImpact(item) {
  let score = 0;
  if (item.hr_impact) score += 35;
  const text = `${item.title} ${item.summary || ''}`.toLowerCase();
  const hrKw = ['wage', 'salary', 'benefit', 'pension', 'retirement', 'collective bargaining', 'labor', 'hire', 'fte', 'staffing', 'workers comp'];
  score += hrKw.filter(kw => text.includes(kw)).length * 10;
  return Math.min(score, 100);
}

function scoreComplianceImpact(item) {
  let score = 0;
  if (item.compliance_impact) score += 35;
  const text = `${item.title} ${item.summary || ''}`.toLowerCase();
  const compKw = ['compliance', 'regulation', 'requirement', 'mandate', 'penalty', 'deadline', 'audit', 'report', 'certif'];
  score += compKw.filter(kw => text.includes(kw)).length * 8;
  return Math.min(score, 100);
}

function scoreCapitalImpact(item, profile) {
  let score = 0;
  if (item.capital_impact) score += 30;
  const text = `${item.title} ${item.summary || ''}`.toLowerCase();
  const capKw = ['capital', 'infrastructure', 'construction', 'renovation', 'equipment', 'vehicle', 'facility'];
  score += capKw.filter(kw => text.includes(kw)).length * 8;
  // Boost if municipality has active capital priorities
  const capitalPriorities = profile?.capital_priorities || [];
  if (capitalPriorities.length > 0) score += 10;
  return Math.min(score, 100);
}

function scoreFundingOpportunity(item, profile) {
  let score = 0;
  if (item.is_flagged_grant) score += 40;
  const text = `${item.title} ${item.summary || ''}`.toLowerCase();
  const grantKw = ['grant', 'funding opportunity', 'appropriation', 'arpa', 'cdbg', 'usda', 'fema', 'formula funding'];
  score += grantKw.filter(kw => text.includes(kw)).length * 12;
  const capitalPriorities = profile?.capital_priorities || [];
  if (capitalPriorities.length > 0 && score > 0) score += 10;
  return Math.min(score, 100);
}

function routeToOwner(item, topicTags, depts) {
  const text = `${item.title} ${item.summary || ''}`.toLowerCase();
  const topics = topicTags.map(t => t.toLowerCase());

  if (depts.includes('Finance') || topics.some(t => ['municipal finance', 'revenue sharing', 'taxation', 'audit & compliance', 'grants & appropriations'].some(ft => t.includes(ft.toLowerCase())))) {
    return 'Finance Director';
  }
  if (depts.includes('HR') || topics.some(t => t.includes('labor') || t.includes('benefit') || t.includes('retirement'))) {
    return 'HR Director';
  }
  if (depts.includes('Police')) return 'Police Chief';
  if (depts.includes('Fire') || depts.includes('EMS / Ambulance')) return 'Fire/EMS Chief';
  if (depts.includes('Public Works')) return 'Public Works Director';
  if (depts.includes('Planning / Code')) return 'Planning Director';
  return 'Town Manager / Administrator';
}

function calcConfidenceScore(item) {
  let score = 50; // Baseline
  if (item.summary && item.summary.length > 50) score += 15;
  if (item.identifier) score += 10;
  if (item.sponsor) score += 5;
  if (item.source_url) score += 10;
  if (item.last_action_date) score += 5;
  if (item.fiscal_impact_note) score += 5;
  if (item.probability_of_passage) score += 5;
  if (item.departments_affected?.length > 0) score -= 5; // We computed it, not authoritative
  return Math.min(score, 100);
}

// ─── Alert trigger engine ─────────────────────────────────────────────────────

/**
 * Evaluate whether an item should generate an alert.
 * Returns null if no alert, or an alert object.
 */
export function evaluateAlertTriggers(item, impactRecord, watchlists = []) {
  const alerts = [];
  const urgency = impactRecord?.urgency_score || 0;
  const priority = impactRecord?.priority_level || item.priority || 'watch';

  // Deadline proximity alerts
  const deadlineDates = [
    { label: 'Public Comment Deadline', date: item.comment_deadline },
    { label: 'Hearing', date: item.hearing_date },
    { label: 'Vote', date: item.vote_date },
  ].filter(d => d.date);

  deadlineDates.forEach(({ label, date }) => {
    const days = Math.ceil((new Date(date) - new Date()) / (1000 * 60 * 60 * 24));
    if (days > 0 && days <= 30) {
      alerts.push({
        title: `${label} in ${days} day${days !== 1 ? 's' : ''}: ${item.title?.slice(0, 60)}`,
        message: `${label} for "${item.identifier || item.title}" is on ${new Date(date).toLocaleDateString()}.`,
        alert_type: label.toLowerCase().includes('deadline') ? 'deadline' : label.toLowerCase().includes('hearing') ? 'hearing' : 'vote',
        severity: days <= 7 ? 'critical' : days <= 14 ? 'high' : 'medium',
        legislation_id: item.id,
        due_date: date,
      });
    }
  });

  // Critical priority alert
  if (priority === 'critical' && !item.is_archived) {
    alerts.push({
      title: `Critical Priority: ${item.title?.slice(0, 60)}`,
      message: `${item.identifier || item.title} is rated Critical priority. Relevance Score: ${impactRecord?.overall_relevance_score || '—'}/100.`,
      alert_type: 'urgent',
      severity: 'critical',
      legislation_id: item.id,
    });
  }

  // Grant deadline within 60 days
  if (item.is_flagged_grant && item.comment_deadline) {
    const days = Math.ceil((new Date(item.comment_deadline) - new Date()) / (1000 * 60 * 60 * 24));
    if (days > 0 && days <= 60) {
      alerts.push({
        title: `Grant Opportunity Deadline: ${item.title?.slice(0, 50)}`,
        message: `Grant application deadline in ${days} days.`,
        alert_type: 'funding',
        severity: days <= 14 ? 'high' : 'medium',
        legislation_id: item.id,
        due_date: item.comment_deadline,
      });
    }
  }

  // Board-flagged items
  if (item.is_flagged_board && priority !== 'watch') {
    alerts.push({
      title: `Board Review Needed: ${item.title?.slice(0, 60)}`,
      message: `This item has been flagged for governing body review.`,
      alert_type: 'status_change',
      severity: priority === 'critical' ? 'critical' : 'high',
      legislation_id: item.id,
    });
  }

  // Watchlist matches
  watchlists.filter(w => w.is_active).forEach(w => {
    const matchesValue = (
      (w.watch_type === 'topic' && (item.category || '').toLowerCase().includes(w.watch_value?.toLowerCase())) ||
      (w.watch_type === 'bill' && item.identifier === w.watch_value) ||
      (w.watch_type === 'department' && (item.departments_affected || []).includes(w.watch_value))
    );
    if (matchesValue) {
      const triggerPriorities = w.alert_on_priority || ['critical', 'high'];
      if (triggerPriorities.includes(priority)) {
        alerts.push({
          title: `Watchlist Alert (${w.name}): ${item.title?.slice(0, 50)}`,
          message: `Item matches your watchlist "${w.name}" for ${w.watch_type}: ${w.watch_value}.`,
          alert_type: 'new_item',
          severity: 'medium',
          legislation_id: item.id,
        });
      }
    }
  });

  return alerts;
}

// ─── Watchlist evaluation ─────────────────────────────────────────────────────

/**
 * Given a list of items and watchlists, return items that match any active watchlist.
 */
export function filterByWatchlists(items, watchlists) {
  const activeWatchlists = watchlists.filter(w => w.is_active);
  return items.filter(item =>
    activeWatchlists.some(w => {
      if (w.watch_type === 'topic') return (item.category || '').toLowerCase().includes((w.watch_value || '').toLowerCase());
      if (w.watch_type === 'bill') return item.identifier === w.watch_value;
      if (w.watch_type === 'department') return (item.departments_affected || []).includes(w.watch_value);
      if (w.watch_type === 'strategic_goal') return (item.strategic_goals || []).includes(w.watch_value);
      return false;
    })
  );
}

// ─── Insight generation (rule-based) ─────────────────────────────────────────

/**
 * Generate plain-language insight fields from item + profile.
 * Used when AI generation is not available or as a fallback.
 */
export function generateRuleBasedInsights(item, impactRecord, profile) {
  const muniName = profile?.name || 'your municipality';
  const depts = impactRecord?.department_matches || item.departments_affected || [];
  const goals = impactRecord?.strategic_goal_matches || item.strategic_goals || [];
  const relevance = impactRecord?.overall_relevance_score || 0;

  const why = item.municipal_relevance || buildWhyItMatters(item, impactRecord, profile);
  const budgetNote = item.fiscal_impact_note || buildBudgetNote(item, impactRecord, profile);
  const complianceNote = item.compliance_impact || buildComplianceNote(item, impactRecord);
  const operationsNote = item.operational_impact || buildOperationsNote(item, impactRecord);
  const hrNote = item.hr_impact || buildHRNote(item, impactRecord);
  const capitalNote = item.capital_impact || buildCapitalNote(item, impactRecord);

  const actions = buildRecommendedActions(item, impactRecord);

  return {
    why_it_matters_summary:   why,
    plain_language_summary:   item.summary || `${item.title} — being tracked for relevance to ${muniName}.`,
    what_changed:             item.last_action || `Status: ${item.status || 'unknown'}.`,
    who_it_affects:           depts.length ? `Primarily affects ${depts.join(', ')}.` : `Affects municipal operations broadly.`,
    possible_budget_impact:   budgetNote,
    possible_operational_impact: operationsNote,
    possible_hr_impact:       hrNote,
    possible_compliance_impact: complianceNote,
    possible_capital_impact:  capitalNote,
    possible_funding_opportunity: item.is_flagged_grant ? buildFundingNote(item, profile) : '',
    risks_if_enacted:         item.risk_if_enacted || buildRiskIfEnacted(item, impactRecord),
    risks_if_not_addressed:   item.risk_if_not_enacted || buildRiskIfNotAddressed(item, impactRecord),
    recommended_actions:      actions,
  };
}

function buildWhyItMatters(item, rec, profile) {
  const parts = [];
  const muniName = profile?.name || 'your municipality';
  if (rec?.geographic_applicability_score >= 85) parts.push(`This item applies directly to ${profile?.state || 'your state'} municipalities`);
  if (rec?.department_matches?.length > 0) parts.push(`affecting the ${rec.department_matches.join(' and ')} department${rec.department_matches.length > 1 ? 's' : ''}`);
  if (item.fiscal_impact_note) parts.push(item.fiscal_impact_note);
  if (!parts.length) return `This item is being tracked for potential relevance to ${muniName}.`;
  return parts.join(', ') + '.';
}

function buildBudgetNote(item, rec, profile) {
  if (!item.fiscal_impact_amount && !item.fiscal_impact_note && (rec?.budget_impact_score || 0) < 20) return '';
  const amount = item.fiscal_impact_amount;
  if (amount) {
    const sign = amount > 0 ? 'potential additional revenue' : 'potential cost';
    return `Estimated ${sign} of $${Math.abs(amount).toLocaleString()} annually. ${item.fiscal_impact_note || ''}`.trim();
  }
  return item.fiscal_impact_note || 'Monitor for fiscal impact as implementation details emerge.';
}

function buildComplianceNote(item, rec) {
  if ((rec?.compliance_impact_score || 0) < 20 && !item.compliance_impact) return '';
  return item.compliance_impact || 'May create new compliance obligations or reporting requirements. Review upon passage.';
}

function buildOperationsNote(item, rec) {
  if ((rec?.operations_impact_score || 0) < 15 && !item.operational_impact) return '';
  return item.operational_impact || 'May affect operational procedures or service delivery protocols.';
}

function buildHRNote(item, rec) {
  if ((rec?.hr_impact_score || 0) < 20 && !item.hr_impact) return '';
  return item.hr_impact || 'May affect staffing, compensation, or HR policies.';
}

function buildCapitalNote(item, rec) {
  if ((rec?.capital_impact_score || 0) < 20 && !item.capital_impact) return '';
  return item.capital_impact || 'May have capital planning or infrastructure implications.';
}

function buildFundingNote(item, profile) {
  return `Review eligibility and application requirements. ${item.fiscal_impact_note || ''}`.trim();
}

function buildRiskIfEnacted(item, rec) {
  const risks = [];
  if ((rec?.budget_impact_score || 0) > 40) risks.push('budget pressure if unfunded mandates are included');
  if ((rec?.compliance_impact_score || 0) > 40) risks.push('compliance cost and administrative burden');
  if ((rec?.hr_impact_score || 0) > 40) risks.push('workforce impacts requiring policy updates');
  if (!risks.length) return '';
  return `Risk includes ${risks.join('; ')}.`;
}

function buildRiskIfNotAddressed(item, rec) {
  if (['signed', 'enacted', 'effective'].includes(item.status)) {
    return 'Item is already law/effective — inaction means non-compliance risk.';
  }
  if ((rec?.urgency_score || 0) > 60) return 'Missed deadlines may limit advocacy options or grant eligibility.';
  return '';
}

function buildRecommendedActions(item, rec) {
  const actions = [];
  const priority = rec?.priority_level || item.priority || 'watch';
  const urgency = rec?.urgency_score || 0;

  if (priority === 'critical' || urgency > 75) actions.push('brief leadership');
  if (item.is_flagged_board || priority === 'critical') actions.push('flag for governing body');
  if ((rec?.budget_impact_score || 0) > 35) actions.push('assess budget impact');
  if ((rec?.compliance_impact_score || 0) > 35) actions.push('prepare compliance update');
  if (item.is_flagged_grant) actions.push('pursue grant opportunity');
  if (['introduced', 'in_committee'].includes(item.status) && priority !== 'watch') actions.push('explore advocacy');
  if (urgency > 50) actions.push('add to budget season review');
  if (!actions.length) actions.push('monitor');

  return actions;
}

// ─── Output object builders ───────────────────────────────────────────────────

/**
 * Build an Executive Brief output object from scored items.
 */
export function buildExecutiveBrief(items, impactRecords, profile, asOfDate = new Date()) {
  const impactMap = Object.fromEntries((impactRecords || []).map(r => [r.policy_item_id, r]));
  const scored = items
    .map(item => ({ item, impact: impactMap[item.id] }))
    .filter(({ impact }) => impact?.overall_relevance_score >= 30)
    .sort((a, b) => (b.impact?.overall_relevance_score || 0) - (a.impact?.overall_relevance_score || 0));

  const critical = scored.filter(({ impact }) => impact?.priority_level === 'critical');
  const high     = scored.filter(({ impact }) => impact?.priority_level === 'high');
  const grantOps = scored.filter(({ impact }) => (impact?.funding_opportunity_score || 0) >= 40);
  const upcoming = scored.filter(({ item }) =>
    [item.hearing_date, item.vote_date, item.comment_deadline].some(d => {
      if (!d) return false;
      const days = Math.ceil((new Date(d) - new Date()) / (1000 * 60 * 60 * 24));
      return days > 0 && days <= 30;
    })
  );

  const totalFiscalImpact = items.reduce((s, i) => s + Math.abs(i.fiscal_impact_amount || 0), 0);

  return {
    type:             'executive_brief',
    municipality:     profile?.name || 'Municipality',
    state:            profile?.state || '',
    generated_at:     asOfDate.toISOString(),
    as_of_date:       asOfDate.toLocaleDateString(),
    fiscal_year:      profile?.fiscal_year || '',
    total_tracked:    items.length,
    critical_count:   critical.length,
    high_count:       high.length,
    grant_count:      grantOps.length,
    upcoming_count:   upcoming.length,
    total_fiscal_exposure: totalFiscalImpact,
    critical_items:   critical.slice(0, 5).map(({ item, impact }) => ({
      id: item.id, identifier: item.identifier, title: item.title,
      priority: impact?.priority_level, score: impact?.overall_relevance_score,
      why: impact?.why_it_matters_summary || item.municipal_relevance,
      action: impact?.recommended_actions?.[0],
    })),
    high_items:       high.slice(0, 8).map(({ item, impact }) => ({
      id: item.id, identifier: item.identifier, title: item.title,
      priority: impact?.priority_level, score: impact?.overall_relevance_score,
    })),
    grant_opportunities: grantOps.slice(0, 5).map(({ item, impact }) => ({
      id: item.id, title: item.title, score: impact?.funding_opportunity_score,
      deadline: item.comment_deadline,
    })),
    upcoming_deadlines: upcoming.slice(0, 5).map(({ item }) => ({
      id: item.id, title: item.title,
      hearing_date: item.hearing_date, vote_date: item.vote_date, comment_deadline: item.comment_deadline,
    })),
  };
}

/**
 * Build a Board Packet output object.
 */
export function buildBoardPacket(items, impactRecords, profile) {
  const impactMap = Object.fromEntries((impactRecords || []).map(r => [r.policy_item_id, r]));
  const boardItems = items
    .filter(item => item.is_flagged_board || impactMap[item.id]?.is_board_ready)
    .sort((a, b) => (impactMap[b.id]?.overall_relevance_score || 0) - (impactMap[a.id]?.overall_relevance_score || 0));

  return {
    type:          'board_packet',
    municipality:  profile?.name || 'Municipality',
    generated_at:  new Date().toISOString(),
    item_count:    boardItems.length,
    items:         boardItems.map(item => ({
      id:             item.id,
      identifier:     item.identifier,
      title:          item.title,
      jurisdiction:   item.jurisdiction,
      status:         item.status,
      priority:       impactMap[item.id]?.priority_level || item.priority,
      why_it_matters: impactMap[item.id]?.why_it_matters_summary || item.municipal_relevance,
      budget_impact:  impactMap[item.id]?.possible_budget_impact,
      compliance:     impactMap[item.id]?.possible_compliance_impact,
      actions:        impactMap[item.id]?.recommended_actions,
      fiscal_amount:  item.fiscal_impact_amount,
    })),
  };
}

/**
 * Build a Budget Risk Summary output.
 */
export function buildBudgetRiskSummary(items, impactRecords, profile) {
  const impactMap = Object.fromEntries((impactRecords || []).map(r => [r.policy_item_id, r]));
  const budgetItems = items
    .filter(item => item.is_flagged_budget || (impactMap[item.id]?.budget_impact_score || 0) >= 20)
    .sort((a, b) => (impactMap[b.id]?.budget_impact_score || 0) - (impactMap[a.id]?.budget_impact_score || 0));

  const totalExposure = budgetItems.reduce((s, i) => s + Math.abs(i.fiscal_impact_amount || 0), 0);

  return {
    type:           'budget_risk_summary',
    municipality:   profile?.name || 'Municipality',
    fiscal_year:    profile?.fiscal_year || '',
    generated_at:   new Date().toISOString(),
    item_count:     budgetItems.length,
    total_exposure: totalExposure,
    items:          budgetItems.map(item => ({
      id:              item.id,
      identifier:      item.identifier,
      title:           item.title,
      budget_score:    impactMap[item.id]?.budget_impact_score,
      fiscal_amount:   item.fiscal_impact_amount,
      fiscal_note:     item.fiscal_impact_note,
      priority:        impactMap[item.id]?.priority_level || item.priority,
      departments:     impactMap[item.id]?.department_matches,
    })),
  };
}

/**
 * Build a Grant Opportunity Summary.
 */
export function buildGrantOpportunitySummary(items, impactRecords, profile) {
  const impactMap = Object.fromEntries((impactRecords || []).map(r => [r.policy_item_id, r]));
  const grantItems = items
    .filter(item => item.is_flagged_grant || (impactMap[item.id]?.funding_opportunity_score || 0) >= 30)
    .sort((a, b) => (impactMap[b.id]?.funding_opportunity_score || 0) - (impactMap[a.id]?.funding_opportunity_score || 0));

  return {
    type:          'grant_opportunity_summary',
    municipality:  profile?.name || 'Municipality',
    generated_at:  new Date().toISOString(),
    item_count:    grantItems.length,
    items:         grantItems.map(item => ({
      id:              item.id,
      title:           item.title,
      grant_score:     impactMap[item.id]?.funding_opportunity_score,
      fiscal_amount:   item.fiscal_impact_amount,
      deadline:        item.comment_deadline,
      departments:     impactMap[item.id]?.department_matches,
      funding_note:    impactMap[item.id]?.possible_funding_opportunity,
    })),
  };
}

/**
 * Build a Department Summary for a specific department.
 */
export function buildDepartmentSummary(department, items, impactRecords, profile) {
  const impactMap = Object.fromEntries((impactRecords || []).map(r => [r.policy_item_id, r]));
  const deptItems = items.filter(item =>
    (item.departments_affected || []).includes(department) ||
    (impactMap[item.id]?.department_matches || []).includes(department)
  ).sort((a, b) => (impactMap[b.id]?.overall_relevance_score || 0) - (impactMap[a.id]?.overall_relevance_score || 0));

  return {
    type:         'department_summary',
    department,
    municipality: profile?.name || 'Municipality',
    generated_at: new Date().toISOString(),
    item_count:   deptItems.length,
    items:        deptItems.map(item => ({
      id:         item.id,
      identifier: item.identifier,
      title:      item.title,
      priority:   impactMap[item.id]?.priority_level || item.priority,
      score:      impactMap[item.id]?.overall_relevance_score,
      budget:     impactMap[item.id]?.possible_budget_impact,
      operations: impactMap[item.id]?.possible_operational_impact,
      compliance: impactMap[item.id]?.possible_compliance_impact,
      actions:    impactMap[item.id]?.recommended_actions,
    })),
  };
}

/**
 * Build a Monthly Policy Memo.
 */
export function buildMonthlyMemo(items, impactRecords, profile, month = null) {
  const now = new Date();
  const memoMonth = month || now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const brief = buildExecutiveBrief(items, impactRecords, profile, now);

  return {
    type:              'monthly_memo',
    municipality:      profile?.name || 'Municipality',
    month:             memoMonth,
    generated_at:      now.toISOString(),
    executive_summary: `Policy tracking memo for ${profile?.name || 'your municipality'} — ${memoMonth}. ${brief.total_tracked} items tracked; ${brief.critical_count} critical, ${brief.high_count} high priority.`,
    critical_items:    brief.critical_items,
    upcoming_deadlines: brief.upcoming_deadlines,
    grant_opportunities: brief.grant_opportunities,
    total_fiscal_exposure: brief.total_fiscal_exposure,
    budget_risk_items: buildBudgetRiskSummary(items, impactRecords, profile).items.slice(0, 5),
  };
}

// ─── Batch scoring ────────────────────────────────────────────────────────────

/**
 * Score a collection of items against a municipality profile.
 * Returns array of MunicipalImpactRecord objects.
 */
export function batchScoreItems(items, profile) {
  return items.map(item => {
    const impactRecord = scoreItemForMunicipality(item, profile);
    const insights     = generateRuleBasedInsights(item, impactRecord, profile);
    return { ...impactRecord, ...insights };
  });
}

/**
 * Run a full normalization + scoring pipeline on raw source records.
 */
export function runIngestionPipeline(sourceRecords, existingItems, profile) {
  const log = {
    started_at:        new Date().toISOString(),
    records_ingested:  sourceRecords.length,
    records_normalized: 0,
    records_deduplicated: 0,
    records_scored:    0,
    records_errored:   0,
    errors:            [],
  };

  // Stage 1: Normalize
  const normalized = [];
  sourceRecords.forEach(raw => {
    try {
      normalized.push(normalizeSourceRecord(raw));
      log.records_normalized++;
    } catch (e) {
      log.records_errored++;
      log.errors.push(`Normalization error for ${raw.id}: ${e.message}`);
    }
  });

  // Stage 2: Dedup against existing items
  const allItems = [...existingItems, ...normalized];
  const groups   = groupDuplicates(allItems);
  const deduped  = groups.map(g => g.canonical);
  log.records_deduplicated = allItems.length - deduped.length;

  // Stage 3: Topic classification + department mapping
  const enriched = normalized.map(item => ({
    ...item,
    category:             item.category || inferCategory(item.title, item.summary),
    departments_affected: item.departments_affected?.length
      ? item.departments_affected
      : mapDepartmentImpacts(item, profile?.departments),
    _topic_tags:          classifyTopics(item),
  }));

  // Stage 4: Score
  const impactRecords = batchScoreItems(enriched, profile);
  log.records_scored = impactRecords.length;
  log.completed_at   = new Date().toISOString();

  return { enriched, impactRecords, log };
}