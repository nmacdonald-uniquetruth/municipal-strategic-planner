/**
 * policyDataSync — Live Legislative & Policy Data Ingestion Engine
 *
 * Connector-based architecture. Each source adapter handles its own:
 *   fetch → parse → normalize → deduplicate → persist pipeline.
 *
 * Sources supported:
 *   - Congress.gov API v3 (federal bills, actions, members, committees)
 *   - Federal Register API (rulemaking notices, comment deadlines)
 *   - Grants.gov API (grant opportunities)
 *   - Maine Legislature (state XML feed — congress.maine.gov)
 *   - Generic state RSS/XML adapter (extensible to other states)
 *   - USDA Rural Development grants feed
 *
 * All records normalize into LegislationItem / PolicyCalendarEvent /
 * PolicyOfficial / PolicyFundingOpportunity / PolicySourceRecord schemas.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

// ── Constants ──────────────────────────────────────────────────────────────────

const CONGRESS_API_BASE = 'https://api.congress.gov/v3';
const FEDERAL_REGISTER_API = 'https://www.federalregister.gov/api/v1';
const GRANTS_GOV_API = 'https://apply07.grants.gov/grantsws/rest/opportunities/search';
const MAINE_LEGIS_BASE = 'https://legislature.maine.gov';

// How long (ms) before we consider data "stale"
const STALE_THRESHOLD_MS = {
  bills:     6 * 60 * 60 * 1000,   // 6 hours
  officials: 24 * 60 * 60 * 1000,  // 24 hours
  grants:    12 * 60 * 60 * 1000,  // 12 hours
  hearings:  4 * 60 * 60 * 1000,   // 4 hours
};

// Municipal-relevant search terms for grant / federal register filtering
const MUNICIPAL_KEYWORDS = [
  'municipality', 'municipal', 'town', 'city', 'local government',
  'rural community', 'community facilities', 'public safety',
  'fire department', 'police', 'EMS', 'ambulance',
  'infrastructure', 'water', 'sewer', 'transfer station',
  'solid waste', 'highway', 'bridge', 'road',
  'revenue sharing', 'property tax', 'excise tax',
];

const MUNICIPALITY_TOPIC_TERMS = [
  'revenue sharing', 'state aid', 'municipal finance', 'property tax',
  'excise tax', 'community development', 'public works', 'ems billing',
  'ambulance service', 'fire department', 'police', 'zoning',
  'housing', 'workforce', 'broadband', 'infrastructure',
  'capital improvements', 'grant', 'compliance', 'osha',
];

// Status normalization map
const STATUS_MAP = {
  // Congress.gov action types
  'Introduced in House': 'introduced',
  'Introduced in Senate': 'introduced',
  'Referred to Committee': 'in_committee',
  'Passed House': 'passed_chamber',
  'Passed Senate': 'passed_chamber',
  'Passed Congress': 'passed_both',
  'Signed by President': 'signed',
  'Became Law': 'enacted',
  'Vetoed': 'vetoed',
  'Failed': 'failed',
  // Federal Register
  'Final Rule': 'effective',
  'Proposed Rule': 'rulemaking',
  'Notice': 'rulemaking',
  'Interim Final Rule': 'effective',
  // Maine Legislature
  'LD': 'introduced',
  'Referred to Committee': 'in_committee',
  'Passed to be enacted': 'passed_both',
  'Signed by Governor': 'signed',
  'Enacted by Legislature': 'enacted',
  'DEAD': 'failed',
};

// ── Utility helpers ────────────────────────────────────────────────────────────

function now() { return new Date().toISOString(); }

function safeDate(d) {
  if (!d) return null;
  try { return new Date(d).toISOString().split('T')[0]; } catch { return null; }
}

function normalizeStatus(raw) {
  if (!raw) return 'watch';
  for (const [k, v] of Object.entries(STATUS_MAP)) {
    if (raw.toLowerCase().includes(k.toLowerCase())) return v;
  }
  return 'watch';
}

function dedupeKey(source, externalId) {
  return `${source}::${externalId}`;
}

function municipallyRelevant(text, profile) {
  if (!text) return false;
  const lower = text.toLowerCase();
  const terms = [...MUNICIPALITY_TOPIC_TERMS, ...(profile?.policy_focus_areas || [])];
  return terms.some(t => lower.includes(t.toLowerCase()));
}

function classifyPriority(item, profile) {
  if (item.impact_level === 'very_high') return 'critical';
  if (item.impact_level === 'high') return 'high';
  const deptMatch = (item.departments_affected || []).some(d => (profile?.departments || []).includes(d));
  if (deptMatch) return 'high';
  if (item.fiscal_impact_amount && item.fiscal_impact_amount > 50000) return 'high';
  return 'medium';
}

async function safeFetch(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000); // 20s timeout
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
    return res;
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

// ── Source Connector Definitions ───────────────────────────────────────────────

const SOURCE_CONNECTORS = {
  congress_gov_bills: {
    id: 'congress_gov_bills',
    name: 'Congress.gov — Bills & Resolutions',
    source_type: 'federal_legislation',
    jurisdiction: 'federal',
    access_method: 'api_json',
    auth_required: true,  // Requires CONGRESS_API_KEY
    default_refresh_hours: 6,
    description: 'Official U.S. Congress bill data via Congress.gov API v3',
    source_url: 'https://api.congress.gov/v3',
  },
  congress_gov_members: {
    id: 'congress_gov_members',
    name: 'Congress.gov — Congressional Members',
    source_type: 'official_activity',
    jurisdiction: 'federal',
    access_method: 'api_json',
    auth_required: true,
    default_refresh_hours: 24,
    description: 'U.S. House and Senate member directory from Congress.gov',
    source_url: 'https://api.congress.gov/v3/member',
  },
  federal_register: {
    id: 'federal_register',
    name: 'Federal Register — Rulemaking & Notices',
    source_type: 'agency_rulemaking',
    jurisdiction: 'federal',
    access_method: 'api_json',
    auth_required: false,
    default_refresh_hours: 12,
    description: 'Federal rulemaking, proposed rules, and public notices relevant to municipalities',
    source_url: 'https://www.federalregister.gov/api/v1',
  },
  grants_gov: {
    id: 'grants_gov',
    name: 'Grants.gov — Federal Grant Opportunities',
    source_type: 'funding_announcement',
    jurisdiction: 'federal',
    access_method: 'api_json',
    auth_required: false,
    default_refresh_hours: 12,
    description: 'Federal grant opportunities relevant to municipal governments',
    source_url: 'https://apply07.grants.gov/grantsws/rest',
  },
  maine_legislature: {
    id: 'maine_legislature',
    name: 'Maine Legislature — Bills & Calendars',
    source_type: 'state_legislation',
    jurisdiction: 'state',
    state: 'ME',
    access_method: 'rss_xml',
    auth_required: false,
    default_refresh_hours: 4,
    description: 'Maine Legislature bill listings and committee calendar feeds',
    source_url: 'https://legislature.maine.gov',
  },
};

// ── Connector: Congress.gov Bills ──────────────────────────────────────────────

async function syncCongressBills(base44, profile, apiKey, options = {}) {
  const results = { ingested: 0, normalized: 0, errors: [], items: [] };
  if (!apiKey) {
    results.errors.push('CONGRESS_API_KEY not set — using public rate-limited access');
  }

  const state = profile?.state || 'ME';
  const congress = 119; // 119th Congress (2025-2026)

  // Search terms focused on municipal topics
  const queries = [
    `state:${state} subject:"local government"`,
    `subject:"revenue sharing"`,
    `subject:"infrastructure"`,
    `subject:"community facilities"`,
    `subject:"public safety"`,
    `subject:"municipal"`,
  ];

  const headers = apiKey ? { 'X-API-Key': apiKey } : {};

  // Pull recent bills from current Congress
  const url = `${CONGRESS_API_BASE}/bill/${congress}?format=json&limit=50&sort=updateDate+desc&offset=0`;

  let data;
  try {
    const res = await safeFetch(url, { headers });
    data = await res.json();
    results.ingested++;
  } catch (err) {
    results.errors.push(`Congress.gov bills fetch failed: ${err.message}`);
    return results;
  }

  const bills = data.bills || [];

  for (const bill of bills) {
    // Filter for municipal relevance
    const titleText = (bill.title || '').toLowerCase();
    const isMunicipallyRelevant = municipallyRelevant(titleText, profile);
    if (!isMunicipallyRelevant && !options.include_all) continue;

    try {
      // Fetch bill detail for more fields
      let detail = bill;
      if (bill.url && apiKey) {
        try {
          const detailRes = await safeFetch(`${bill.url}?format=json`, { headers });
          const detailData = await detailRes.json();
          detail = detailData.bill || bill;
        } catch { /* use summary */ }
      }

      const normalized = normalizeFederalBill(detail, bill);
      results.items.push(normalized);
      results.normalized++;
    } catch (err) {
      results.errors.push(`Bill normalization error: ${err.message}`);
    }
  }

  return results;
}

function normalizeFederalBill(detail, summary) {
  const billType = detail.type || summary.type || '';
  const billNumber = detail.number || summary.number || '';
  const identifier = billType && billNumber ? `${billType} ${billNumber}` : billNumber;
  const lastAction = detail.latestAction || summary.latestAction || {};
  const sponsors = detail.sponsors || [];
  const sponsor = sponsors[0] ? `${sponsors[0].firstName} ${sponsors[0].lastName} (${sponsors[0].party}-${sponsors[0].state})` : '';

  return {
    identifier,
    title: detail.title || summary.title || 'Untitled',
    jurisdiction: 'federal',
    status: normalizeStatus(lastAction.text || ''),
    summary: detail.policyArea?.name ? `Policy area: ${detail.policyArea.name}. ${detail.title || ''}` : detail.title || '',
    sponsor,
    committee: detail.committees?.item?.[0]?.name || '',
    last_action: lastAction.text || '',
    last_action_date: safeDate(lastAction.actionDate),
    source_url: detail.url || summary.url || `https://www.congress.gov/bill/${detail.congress}th-congress/${billType?.toLowerCase()}-bill/${billNumber}`,
    category: mapPolicyArea(detail.policyArea?.name),
    departments_affected: mapToMunicipalDepts(detail.policyArea?.name),
    impact_types: mapImpactTypes(detail.policyArea?.name),
    is_archived: false,
    _source: 'congress_gov_bills',
    _source_id: `${detail.congress}-${billType}-${billNumber}`,
    _retrieved_at: now(),
    _congress: detail.congress,
  };
}

// ── Connector: Federal Register ────────────────────────────────────────────────

async function syncFederalRegister(base44, profile) {
  const results = { ingested: 0, normalized: 0, errors: [], items: [] };

  // Search for municipal-relevant rulemaking
  const terms = MUNICIPALITY_TOPIC_TERMS.slice(0, 5).join(' OR ');
  const today = new Date().toISOString().split('T')[0];
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const url = `${FEDERAL_REGISTER_API}/documents.json?fields[]=document_number&fields[]=title&fields[]=type&fields[]=publication_date&fields[]=agencies&fields[]=abstract&fields[]=comment_url&fields[]=comments_close_on&fields[]=effective_on&fields[]=html_url&conditions[term]=${encodeURIComponent('municipal OR municipality OR local government OR community facilities')}&conditions[type][]=RULE&conditions[type][]=PRORULE&conditions[type][]=NOTICE&conditions[publication_date][gte]=${sixtyDaysAgo}&per_page=20&order=newest`;

  let data;
  try {
    const res = await safeFetch(url);
    data = await res.json();
    results.ingested++;
  } catch (err) {
    results.errors.push(`Federal Register fetch failed: ${err.message}`);
    return results;
  }

  for (const doc of (data.results || [])) {
    try {
      const normalized = normalizeFederalRegisterDoc(doc);
      results.items.push(normalized);
      results.normalized++;
    } catch (err) {
      results.errors.push(`Federal Register normalization error: ${err.message}`);
    }
  }

  return results;
}

function normalizeFederalRegisterDoc(doc) {
  const docType = doc.type === 'RULE' ? 'effective' : doc.type === 'PRORULE' ? 'rulemaking' : 'rulemaking';
  const agency = doc.agencies?.[0]?.name || 'Federal Agency';

  return {
    identifier: doc.document_number,
    title: doc.title,
    jurisdiction: 'federal',
    status: docType,
    summary: doc.abstract || doc.title,
    sponsor: agency,
    last_action: doc.type === 'RULE' ? 'Final Rule Published' : doc.type === 'PRORULE' ? 'Proposed Rule Published' : 'Notice Published',
    last_action_date: safeDate(doc.publication_date),
    comment_deadline: safeDate(doc.comments_close_on),
    effective_date: safeDate(doc.effective_on),
    source_url: doc.html_url,
    category: 'Compliance / Auditing',
    departments_affected: mapToMunicipalDepts(doc.title + ' ' + (doc.abstract || '')),
    impact_types: ['Compliance', 'Operations'],
    is_archived: false,
    _source: 'federal_register',
    _source_id: doc.document_number,
    _retrieved_at: now(),
  };
}

// ── Connector: Grants.gov ──────────────────────────────────────────────────────

async function syncGrantsGov(base44, profile) {
  const results = { ingested: 0, normalized: 0, errors: [], items: [], funding_items: [] };

  // Search for municipal grants
  const searchPayload = {
    keyword: 'municipality local government community facilities public safety rural',
    oppStatuses: 'posted,forecasted',
    sortBy: 'openDate|desc',
    rows: 25,
    eligibilities: '21', // 21 = City or Township Governments
  };

  let data;
  try {
    const res = await safeFetch(GRANTS_GOV_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(searchPayload),
    });
    data = await res.json();
    results.ingested++;
  } catch (err) {
    results.errors.push(`Grants.gov fetch failed: ${err.message}`);
    return results;
  }

  for (const opp of (data.oppHits || [])) {
    try {
      const funding = normalizeGrantsGovOpp(opp);
      results.funding_items.push(funding);
      results.normalized++;
    } catch (err) {
      results.errors.push(`Grants.gov normalization error: ${err.message}`);
    }
  }

  return results;
}

function normalizeGrantsGovOpp(opp) {
  return {
    title: opp.title,
    program_name: opp.opportunityNumber,
    source: 'federal',
    amount_available: opp.totalFunding ? parseFloat(opp.totalFunding) : null,
    max_award: opp.awardCeiling ? parseFloat(opp.awardCeiling) : null,
    match_required: false,
    application_deadline: safeDate(opp.closeDate),
    status: opp.oppStatus === 'posted' ? 'open' : 'upcoming',
    summary: opp.synopsis || opp.title,
    source_url: `https://www.grants.gov/search-results-detail/${opp.id}`,
    departments_relevant: mapToMunicipalDepts(opp.title + ' ' + (opp.synopsis || '')),
    is_flagged: false,
    _source: 'grants_gov',
    _source_id: String(opp.id),
    _retrieved_at: now(),
  };
}

// ── Connector: Maine Legislature ───────────────────────────────────────────────

async function syncMaineLegislature(base44, profile) {
  const results = { ingested: 0, normalized: 0, errors: [], items: [], events: [] };

  // Maine Legislature — try multiple known URL patterns in order
  const MAINE_URLS = [
    `${MAINE_LEGIS_BASE}/LawMakerWeb/search.asp`,
    `${MAINE_LEGIS_BASE}/bills/bills_display.asp?LD=1&PaperType=LD&LegSession=132`,
    `${MAINE_LEGIS_BASE}/LawMakerWeb/bills.asp`,
    `${MAINE_LEGIS_BASE}/ros/lom/`,
  ];

  let xmlText;
  let fetchedUrl = null;
  for (const url of MAINE_URLS) {
    try {
      const res = await safeFetch(url, {
        headers: { 'Accept': 'text/html,application/xhtml+xml,text/xml', 'User-Agent': 'Municipal-Policy-Tracker/1.0' },
      });
      xmlText = await res.text();
      fetchedUrl = url;
      results.ingested++;
      break;
    } catch (err) {
      results.errors.push(`Maine Legislature URL failed (${url}): ${err.message}`);
    }
  }

  if (!xmlText) {
    results.errors.push('All Maine Legislature URL attempts failed. The legislature website may be temporarily unavailable.');
    return results;
  }

  // Parse LD numbers and titles from HTML (stable selectors for maine.gov)
  const billMatches = xmlText.match(/LD\s*\d+[^<]{0,200}/g) || [];
  const seen = new Set();

  for (const match of billMatches.slice(0, 40)) {
    const ldMatch = match.match(/LD\s*(\d+)/);
    if (!ldMatch) continue;
    const ldNumber = ldMatch[1];
    const key = `LD${ldNumber}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const titleGuess = match.replace(/LD\s*\d+\s*[-–]?\s*/i, '').replace(/<[^>]+>/g, '').trim().slice(0, 200);
    if (!titleGuess || titleGuess.length < 10) continue;

    if (!municipallyRelevant(titleGuess, profile)) continue;

    const normalized = {
      identifier: `LD ${ldNumber}`,
      title: titleGuess,
      jurisdiction: 'state',
      status: 'introduced',
      summary: `Maine Legislature — ${key}: ${titleGuess}`,
      source_url: `${MAINE_LEGIS_BASE}/bills/getPDF.asp?Paper=LD${ldNumber}&Item=1&snum=132`,
      category: classifyMunicipalCategory(titleGuess),
      departments_affected: mapToMunicipalDepts(titleGuess),
      impact_types: mapImpactTypes(titleGuess),
      is_archived: false,
      _source: 'maine_legislature',
      _source_id: `132-LD${ldNumber}`,
      _retrieved_at: now(),
    };

    results.items.push(normalized);
    results.normalized++;
  }

  return results;
}

// ── Connector: Generic State RSS/XML ──────────────────────────────────────────

async function syncStateRssFeed(stateCode, feedUrl, profile) {
  const results = { ingested: 0, normalized: 0, errors: [], items: [] };

  let xmlText;
  try {
    const res = await safeFetch(feedUrl, {
      headers: { 'Accept': 'application/rss+xml, application/xml, text/xml', 'User-Agent': 'Municipal-Policy-Tracker/1.0' },
    });
    xmlText = await res.text();
    results.ingested++;
  } catch (err) {
    results.errors.push(`State RSS feed (${stateCode}) fetch failed: ${err.message}`);
    return results;
  }

  // Parse RSS <item> elements
  const itemMatches = xmlText.match(/<item>[\s\S]*?<\/item>/g) || [];
  for (const itemXml of itemMatches.slice(0, 30)) {
    try {
      const title = (itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || itemXml.match(/<title>(.*?)<\/title>/))?.[1] || '';
      const link  = (itemXml.match(/<link>(.*?)<\/link>/))?.[1] || '';
      const desc  = (itemXml.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) || itemXml.match(/<description>(.*?)<\/description>/))?.[1] || '';
      const pubDate = (itemXml.match(/<pubDate>(.*?)<\/pubDate>/))?.[1] || '';

      if (!title || !municipallyRelevant(title + ' ' + desc, profile)) continue;

      results.items.push({
        identifier: '',
        title: title.trim(),
        jurisdiction: 'state',
        status: 'watch',
        summary: desc.replace(/<[^>]+>/g, '').trim().slice(0, 500),
        last_action_date: safeDate(pubDate),
        source_url: link,
        category: classifyMunicipalCategory(title + ' ' + desc),
        departments_affected: mapToMunicipalDepts(title + ' ' + desc),
        impact_types: mapImpactTypes(title + ' ' + desc),
        is_archived: false,
        _source: `state_rss_${stateCode.toLowerCase()}`,
        _source_id: link,
        _retrieved_at: now(),
      });
      results.normalized++;
    } catch (err) {
      results.errors.push(`RSS item parse error: ${err.message}`);
    }
  }

  return results;
}

// ── Classification helpers ─────────────────────────────────────────────────────

function mapPolicyArea(policyArea) {
  if (!policyArea) return 'Other';
  const pa = policyArea.toLowerCase();
  if (pa.includes('tax') || pa.includes('revenue')) return 'Taxation';
  if (pa.includes('transport') || pa.includes('road') || pa.includes('highway')) return 'Infrastructure';
  if (pa.includes('health') || pa.includes('ems') || pa.includes('medical')) return 'EMS / Ambulance';
  if (pa.includes('labor') || pa.includes('employment') || pa.includes('workforce')) return 'Labor / HR';
  if (pa.includes('environment')) return 'Environmental Regulation';
  if (pa.includes('housing')) return 'Housing';
  if (pa.includes('energy')) return 'Energy';
  if (pa.includes('crime') || pa.includes('law enforcement') || pa.includes('public safety')) return 'Public Safety';
  if (pa.includes('government operations') || pa.includes('finance')) return 'Municipal Finance';
  if (pa.includes('social welfare') || pa.includes('community')) return 'Economic Development';
  return 'Other';
}

function classifyMunicipalCategory(text) {
  const t = text.toLowerCase();
  if (t.includes('tax') || t.includes('revenue sharing') || t.includes('excise')) return 'Taxation';
  if (t.includes('road') || t.includes('bridge') || t.includes('infrastructure') || t.includes('sewer') || t.includes('water')) return 'Infrastructure';
  if (t.includes('ems') || t.includes('ambulance') || t.includes('emergency medical')) return 'EMS / Ambulance';
  if (t.includes('police') || t.includes('public safety') || t.includes('fire')) return 'Public Safety';
  if (t.includes('labor') || t.includes('wage') || t.includes('workforce') || t.includes('pension') || t.includes('retirement')) return 'Labor / HR';
  if (t.includes('housing') || t.includes('zoning') || t.includes('land use')) return 'Housing';
  if (t.includes('energy') || t.includes('solar') || t.includes('wind')) return 'Energy';
  if (t.includes('grant') || t.includes('appropriation') || t.includes('fund')) return 'Grants / Appropriations';
  if (t.includes('compliance') || t.includes('audit') || t.includes('osha') || t.includes('regulation')) return 'Compliance / Auditing';
  if (t.includes('environment') || t.includes('climate') || t.includes('pollution')) return 'Environmental Regulation';
  if (t.includes('economic') || t.includes('development') || t.includes('business')) return 'Economic Development';
  return 'Municipal Finance';
}

function mapToMunicipalDepts(text) {
  if (!text) return [];
  const t = text.toLowerCase();
  const depts = [];
  if (t.includes('finance') || t.includes('budget') || t.includes('tax') || t.includes('revenue') || t.includes('fiscal')) depts.push('Finance');
  if (t.includes('police') || t.includes('law enforcement')) depts.push('Police');
  if (t.includes('fire') && !t.includes('federal')) depts.push('Fire');
  if (t.includes('ems') || t.includes('ambulance') || t.includes('emergency medical')) depts.push('EMS / Ambulance');
  if (t.includes('road') || t.includes('highway') || t.includes('bridge') || t.includes('infrastructure') || t.includes('public works')) depts.push('Public Works');
  if (t.includes('housing') || t.includes('zoning') || t.includes('planning') || t.includes('land use')) depts.push('Planning / Code');
  if (t.includes('labor') || t.includes('wage') || t.includes('workforce') || t.includes('employment') || t.includes('pension') || t.includes('retirement')) depts.push('HR');
  if (t.includes('administration') || t.includes('governance') || t.includes('government operations') || t.includes('municipal')) depts.push('Administration');
  if (t.includes('water') || t.includes('sewer') || t.includes('utility') || t.includes('wastewater')) depts.push('Utilities');
  if (t.includes('transfer station') || t.includes('solid waste') || t.includes('recycling')) depts.push('Transfer Station');
  return [...new Set(depts)];
}

function mapImpactTypes(text) {
  if (!text) return [];
  const t = text.toLowerCase();
  const types = [];
  if (t.includes('tax') || t.includes('revenue') || t.includes('budget') || t.includes('fiscal') || t.includes('fund')) types.push('Revenue');
  if (t.includes('expense') || t.includes('cost') || t.includes('spending') || t.includes('appropriat')) types.push('Expense');
  if (t.includes('comply') || t.includes('compliance') || t.includes('regulation') || t.includes('rule') || t.includes('standard') || t.includes('mandate') || t.includes('require')) types.push('Compliance');
  if (t.includes('capital') || t.includes('infrastructure') || t.includes('construction') || t.includes('facility')) types.push('Capital');
  if (t.includes('labor') || t.includes('employ') || t.includes('wage') || t.includes('workforce') || t.includes('pension') || t.includes('retirement') || t.includes('benefit')) types.push('HR');
  if (t.includes('operation') || t.includes('service') || t.includes('program') || t.includes('delivery')) types.push('Operations');
  if (t.includes('grant') || t.includes('opportun') || t.includes('award') || t.includes('eligib')) types.push('Grant Opportunity');
  return [...new Set(types)];
}

// ── Deduplication & upsert logic ───────────────────────────────────────────────

async function upsertLegislationItem(base44, normalized, existingMap) {
  const key = normalized._source_id || normalized.identifier;
  const existing = existingMap[key];

  const record = {
    identifier:          normalized.identifier,
    title:               normalized.title,
    jurisdiction:        normalized.jurisdiction,
    status:              normalized.status,
    summary:             normalized.summary,
    sponsor:             normalized.sponsor,
    committee:           normalized.committee,
    last_action:         normalized.last_action,
    last_action_date:    normalized.last_action_date,
    comment_deadline:    normalized.comment_deadline,
    effective_date:      normalized.effective_date,
    hearing_date:        normalized.hearing_date,
    vote_date:           normalized.vote_date,
    source_url:          normalized.source_url,
    category:            normalized.category,
    departments_affected: normalized.departments_affected || [],
    impact_types:        normalized.impact_types || [],
    is_archived:         false,
    // Preserve user overrides if existing
    priority:            existing?.priority || classifyFromNormalized(normalized),
    is_watched:          existing?.is_watched || false,
    is_flagged_budget:   existing?.is_flagged_budget || false,
    is_flagged_board:    existing?.is_flagged_board || false,
    is_flagged_urgent:   existing?.is_flagged_urgent || false,
    is_flagged_grant:    existing?.is_flagged_grant || (normalized.impact_types || []).includes('Grant Opportunity'),
    notes:               existing?.notes || '',
  };

  if (existing?.id) {
    return base44.asServiceRole.entities.LegislationItem.update(existing.id, record);
  }
  return base44.asServiceRole.entities.LegislationItem.create(record);
}

function classifyFromNormalized(n) {
  if (n.status === 'critical') return 'critical';
  if ((n.departments_affected || []).length >= 3) return 'high';
  if ((n.impact_types || []).includes('Compliance')) return 'high';
  return 'medium';
}

async function upsertFundingOpportunity(base44, normalized, existingMap) {
  const key = normalized._source_id;
  const existing = existingMap[key];
  const record = {
    title: normalized.title,
    program_name: normalized.program_name,
    source: normalized.source,
    amount_available: normalized.amount_available,
    max_award: normalized.max_award,
    match_required: normalized.match_required,
    application_deadline: normalized.application_deadline,
    status: normalized.status,
    summary: normalized.summary,
    source_url: normalized.source_url,
    departments_relevant: normalized.departments_relevant || [],
    is_flagged: existing?.is_flagged || false,
  };
  if (existing?.id) {
    return base44.asServiceRole.entities.PolicyFundingOpportunity.update(existing.id, record);
  }
  return base44.asServiceRole.entities.PolicyFundingOpportunity.create(record);
}

// ── Ingestion log ──────────────────────────────────────────────────────────────

async function writeIngestionLog(base44, log) {
  await base44.asServiceRole.entities.PolicyIngestionLog.create({
    ...log,
    started_at: log.started_at || now(),
  });
}

// ── Main handler ───────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { sources = ['all'], force = false, profile_id } = body;

    // Load municipality profile
    let profile;
    if (profile_id) {
      profile = await base44.asServiceRole.entities.MunicipalityProfile.filter({ id: profile_id }).then(r => r[0]);
    } else {
      const profiles = await base44.asServiceRole.entities.MunicipalityProfile.list();
      profile = profiles?.[0];
    }
    if (!profile) {
      return Response.json({ error: 'No municipality profile configured' }, { status: 400 });
    }

    // Load API keys
    const congressApiKey = Deno.env.get('CONGRESS_API_KEY') || '';

    // Load existing items for deduplication (source_id mapping)
    const existingItems = await base44.asServiceRole.entities.LegislationItem.list('-created_date', 500);
    const existingFunding = await base44.asServiceRole.entities.PolicyFundingOpportunity.list('-created_date', 200);

    // Build dedup maps (by identifier)
    const itemMap = {};
    existingItems.forEach(item => {
      if (item.identifier) itemMap[item.identifier] = item;
    });
    const fundingMap = {};
    existingFunding.forEach(f => {
      if (f.program_name) fundingMap[f.program_name] = f;
    });

    const runAll = sources.includes('all');
    const logStart = now();
    const syncResults = {
      total_ingested: 0,
      total_normalized: 0,
      total_upserted: 0,
      errors: [],
      sources_run: [],
      completed_at: null,
    };

    // ── Run connectors ────────────────────────────────────────────────────────

    // 1. Congress.gov bills
    if (runAll || sources.includes('congress_gov_bills')) {
      console.log('Syncing Congress.gov bills...');
      const r = await syncCongressBills(base44, profile, congressApiKey);
      syncResults.total_ingested += r.ingested;
      syncResults.total_normalized += r.normalized;
      syncResults.errors.push(...r.errors);
      syncResults.sources_run.push('congress_gov_bills');

      // Upsert to database
      for (const item of r.items) {
        try {
          await upsertLegislationItem(base44, item, itemMap);
          syncResults.total_upserted++;
        } catch (err) {
          syncResults.errors.push(`Upsert error (congress bill): ${err.message}`);
        }
      }
    }

    // 2. Federal Register
    if (runAll || sources.includes('federal_register')) {
      console.log('Syncing Federal Register...');
      const r = await syncFederalRegister(base44, profile);
      syncResults.total_ingested += r.ingested;
      syncResults.total_normalized += r.normalized;
      syncResults.errors.push(...r.errors);
      syncResults.sources_run.push('federal_register');

      for (const item of r.items) {
        try {
          await upsertLegislationItem(base44, item, itemMap);
          syncResults.total_upserted++;
        } catch (err) {
          syncResults.errors.push(`Upsert error (fed register): ${err.message}`);
        }
      }
    }

    // 3. Grants.gov
    if (runAll || sources.includes('grants_gov')) {
      console.log('Syncing Grants.gov...');
      const r = await syncGrantsGov(base44, profile);
      syncResults.total_ingested += r.ingested;
      syncResults.total_normalized += r.normalized;
      syncResults.errors.push(...r.errors);
      syncResults.sources_run.push('grants_gov');

      for (const fundingItem of r.funding_items) {
        try {
          await upsertFundingOpportunity(base44, fundingItem, fundingMap);
          syncResults.total_upserted++;
        } catch (err) {
          syncResults.errors.push(`Upsert error (grant): ${err.message}`);
        }
      }
    }

    // 4. State legislature (Maine by default, extensible by state code)
    const stateCode = profile?.state?.toUpperCase() || 'ME';
    if (runAll || sources.includes('state_legislature')) {
      console.log(`Syncing ${stateCode} Legislature...`);

      let stateResults;
      if (stateCode === 'ME') {
        stateResults = await syncMaineLegislature(base44, profile);
      } else {
        // Generic RSS fallback for other states
        const feedUrl = buildStateFeedUrl(stateCode);
        if (feedUrl) {
          stateResults = await syncStateRssFeed(stateCode, feedUrl, profile);
        } else {
          stateResults = { ingested: 0, normalized: 0, errors: [`No feed URL configured for state: ${stateCode}`], items: [] };
        }
      }

      syncResults.total_ingested += stateResults.ingested;
      syncResults.total_normalized += stateResults.normalized;
      syncResults.errors.push(...stateResults.errors);
      syncResults.sources_run.push('state_legislature');

      for (const item of stateResults.items) {
        try {
          await upsertLegislationItem(base44, item, itemMap);
          syncResults.total_upserted++;
        } catch (err) {
          syncResults.errors.push(`Upsert error (state bill): ${err.message}`);
        }
      }
    }

    syncResults.completed_at = now();

    // Write ingestion log
    await writeIngestionLog(base44, {
      run_type: 'manual',
      source_type: 'multi_source',
      source_name: syncResults.sources_run.join(', '),
      started_at: logStart,
      completed_at: syncResults.completed_at,
      status: syncResults.errors.length === 0 ? 'completed' : syncResults.errors.length < 3 ? 'partial' : 'failed',
      records_ingested: syncResults.total_ingested,
      records_normalized: syncResults.total_normalized,
      records_scored: 0,
      records_errored: syncResults.errors.length,
      error_log: syncResults.errors.length ? syncResults.errors.slice(0, 10).join('\n') : null,
      triggered_by: user.email,
      notes: `Profile: ${profile.name}, ${profile.state}`,
    });

    return Response.json({
      success: true,
      ...syncResults,
      profile: { name: profile.name, state: profile.state },
    });

  } catch (error) {
    console.error('policyDataSync error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// ── State feed URL registry ────────────────────────────────────────────────────
// Add more states here as needed. Each state has an official RSS/XML feed or API.
function buildStateFeedUrl(stateCode) {
  const STATE_FEEDS = {
    ME: null,  // handled by dedicated Maine connector
    VT: 'https://legislature.vermont.gov/bill/search/2026/all',
    NH: 'https://gencourt.state.nh.us/rss/',
    MA: 'https://malegislature.gov/Bills/search?inputQuery=&StatusID=&ResultType=List',
    CT: 'https://www.cga.ct.gov/rss/bill.asp',
    RI: 'https://webserver.rilin.state.ri.us/BillText/billmaster.asp',
    NY: 'https://www.nysenate.gov/search/legislation',
    // Add more states as municipality profile expands
  };
  return STATE_FEEDS[stateCode] || null;
}