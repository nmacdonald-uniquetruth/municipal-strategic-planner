/**
 * Article Mapping & Deductions Engine
 * Pure functions — no React.
 *
 * Concepts:
 *  - LineItem: a budget line (dept total, account, offset) that must be mapped to an article
 *  - MappingRecord: { lineItemId, articleNumber, bete_line, deduction_type, amount, ... }
 *  - Rollup: article → sum of all mapped line items
 *  - Exceptions: line items with no mapping
 */

// ─── Deduction type definitions ────────────────────────────────────────────────
export const DEDUCTION_TYPES = {
  state_revenue_sharing:  { label: 'State Revenue Sharing',    bete: 'stateRevenueSharing',  reduces_levy: true,  color: '#2A7F7F' },
  bete_reimbursement:     { label: 'BETE Reimbursement',        bete: 'beteReimbursement',    reduces_levy: true,  color: '#6B5EA8' },
  local_revenues:         { label: 'Local Revenues (Misc)',     bete: 'localRevenues',        reduces_levy: true,  color: '#2D7D46' },
  enterprise_offset:      { label: 'Enterprise Fund Offset',    bete: 'enterpriseOffsets',    reduces_levy: true,  color: '#1a6b7a' },
  ambulance_offset:       { label: 'Ambulance Enterprise Offset',bete: 'enterpriseOffsets',   reduces_levy: true,  color: '#1a6b7a' },
  transfer_station_offset:{ label: 'Transfer Station Offset',   bete: 'enterpriseOffsets',    reduces_levy: true,  color: '#1a6b7a' },
  interfund_transfer:     { label: 'Interfund Transfer',        bete: 'enterpriseOffsets',    reduces_levy: true,  color: '#7a3c6e' },
  fund_balance_use:       { label: 'Fund Balance Use',          bete: 'fundBalanceUse',       reduces_levy: true,  color: '#B5691E' },
  tif_financing:          { label: 'TIF Financing Plan',        bete: 'tifFinancingPlan',     reduces_levy: true,  color: '#9C5334' },
  excise_tax:             { label: 'Excise Tax Revenue',        bete: 'localRevenues',        reduces_levy: true,  color: '#2D7D46' },
  grants:                 { label: 'Grants & Reimbursements',   bete: 'grantsAndReimbursements', reduces_levy: true, color: '#4a90d9' },
  none:                   { label: 'N/A (Appropriation)',       bete: null,                   reduces_levy: false, color: '#888' },
};

// ─── BETE line definitions ─────────────────────────────────────────────────────
export const BETE_LINES = {
  municipalAppropriations:   { label: 'Municipal Appropriations',     sign: +1 },
  schoolAppropriations:      { label: 'School Appropriations',        sign: +1 },
  countyAssessment:          { label: 'County Assessment',            sign: +1 },
  enterpriseOffsets:         { label: 'Enterprise Fund Offsets',      sign: -1 },
  stateRevenueSharing:       { label: 'State Revenue Sharing',        sign: -1 },
  localRevenues:             { label: 'Local Revenues',               sign: -1 },
  fundBalanceUse:            { label: 'Fund Balance Use',             sign: -1 },
  tifFinancingPlan:          { label: 'TIF Financing Plan',           sign: -1 },
  beteReimbursement:         { label: 'BETE Reimbursement',           sign: -1 },
  grantsAndReimbursements:   { label: 'Grants & Reimbursements',      sign: -1 },
};

// ─── Seed line items from DepartmentBudget + WarrantArticle data ───────────────

/**
 * Build a default set of line items from warrant articles
 * (one per article, plus deduction stubs).
 */
export function buildLineItemsFromArticles(articles) {
  return articles.map(a => ({
    id: `li_${a.id || a.article_number}`,
    label: `${a.article_number} — ${a.title}`,
    department: (a.linked_departments || []).join(', ') || a.title,
    amount: a.financial_amount || 0,
    account_code: a.account_code || '',
    fund: a.fund || 'general_fund',
    record_type: ['revenue','fund_balance_transfer','enterprise_appropriation','tif'].includes(a.category) ? 'deduction' : 'appropriation',
    source_article: a.article_number,
    category: a.category,
    // Suggested mapping from article's existing bete_mapping
    suggested_article: a.article_number,
    suggested_bete: a.bete_mapping || '',
    suggested_deduction_type: deductionTypeFromCategory(a.category),
  }));
}

function deductionTypeFromCategory(cat) {
  const map = {
    revenue: 'local_revenues',
    fund_balance_transfer: 'fund_balance_use',
    enterprise_appropriation: 'enterprise_offset',
    tif: 'tif_financing',
  };
  return map[cat] || 'none';
}

// ─── Build custom line items (for accounts-level mapping) ─────────────────────

export function buildDefaultLineItems(settings) {
  const ent = [
    { id: 'li_amb_offset', label: 'Ambulance Enterprise Offset', department: 'Ambulance Service', amount: settings.ambulance_transfer || 45000, record_type: 'deduction', suggested_deduction_type: 'ambulance_offset', suggested_bete: 'enterpriseOffsets' },
    { id: 'li_swr_offset', label: 'Sewer Enterprise Offset', department: 'Sewer Fund', amount: settings.sewer_transfer || 21110, record_type: 'deduction', suggested_deduction_type: 'interfund_transfer', suggested_bete: 'enterpriseOffsets' },
    { id: 'li_ts_offset',  label: 'Transfer Station Offset', department: 'Transfer Station', amount: settings.ts_transfer || 21000, record_type: 'deduction', suggested_deduction_type: 'transfer_station_offset', suggested_bete: 'enterpriseOffsets' },
    { id: 'li_tel_offset', label: 'Telebusiness Interfund Transfer', department: 'Telebusiness', amount: settings.telebusiness_transfer || 18525, record_type: 'deduction', suggested_deduction_type: 'interfund_transfer', suggested_bete: 'enterpriseOffsets' },
    { id: 'li_crt_offset', label: 'Court St. Interfund Transfer', department: 'Court St.', amount: settings.court_st_transfer || 15600, record_type: 'deduction', suggested_deduction_type: 'interfund_transfer', suggested_bete: 'enterpriseOffsets' },
    { id: 'li_srs',   label: 'State Revenue Sharing', department: 'Non-departmental', amount: 165000, record_type: 'deduction', suggested_deduction_type: 'state_revenue_sharing', suggested_bete: 'stateRevenueSharing' },
    { id: 'li_excise',label: 'Excise Tax Revenue', department: 'Non-departmental', amount: 220000, record_type: 'deduction', suggested_deduction_type: 'excise_tax', suggested_bete: 'localRevenues' },
    { id: 'li_fees',  label: 'Fees & Charges', department: 'Non-departmental', amount: 65000, record_type: 'deduction', suggested_deduction_type: 'local_revenues', suggested_bete: 'localRevenues' },
    { id: 'li_bete',  label: 'BETE State Reimbursement', department: 'Non-departmental', amount: 12000, record_type: 'deduction', suggested_deduction_type: 'bete_reimbursement', suggested_bete: 'beteReimbursement' },
    { id: 'li_fb',    label: 'Fund Balance Use', department: 'Finance', amount: settings.gf_undesignated_balance ? 50000 : 0, record_type: 'deduction', suggested_deduction_type: 'fund_balance_use', suggested_bete: 'fundBalanceUse' },
    { id: 'li_admin', label: 'Administration & General Government', department: 'Administration', amount: 745500, record_type: 'appropriation', suggested_deduction_type: 'none', suggested_bete: 'municipalAppropriations' },
    { id: 'li_police',label: 'Police Department', department: 'Police', amount: 435000, record_type: 'appropriation', suggested_deduction_type: 'none', suggested_bete: 'municipalAppropriations' },
    { id: 'li_fire',  label: 'Fire Department', department: 'Fire Department', amount: 98000, record_type: 'appropriation', suggested_deduction_type: 'none', suggested_bete: 'municipalAppropriations' },
    { id: 'li_pw',    label: 'Public Works', department: 'Public Works', amount: 392000, record_type: 'appropriation', suggested_deduction_type: 'none', suggested_bete: 'municipalAppropriations' },
    { id: 'li_amb',   label: 'Ambulance Service Appropriation', department: 'Ambulance Service', amount: 498000, record_type: 'appropriation', suggested_deduction_type: 'none', suggested_bete: 'municipalAppropriations' },
    { id: 'li_school',label: 'Education — RSU School Assessment', department: 'RSU', amount: 1950000, record_type: 'appropriation', suggested_deduction_type: 'none', suggested_bete: 'schoolAppropriations' },
    { id: 'li_county',label: 'County Assessment', department: 'County', amount: 285000, record_type: 'appropriation', suggested_deduction_type: 'none', suggested_bete: 'countyAssessment' },
  ];
  return ent;
}

// ─── Rollup engine ─────────────────────────────────────────────────────────────

/**
 * Given line items and their mapping records, build rollup per article.
 * Returns { [articleNumber]: { total, lines: [...] } }
 */
export function rollupByArticle(lineItems, mappings) {
  const result = {};
  lineItems.forEach(li => {
    const m = mappings[li.id];
    if (!m || !m.article_number) return;
    const key = m.article_number;
    if (!result[key]) result[key] = { total: 0, bete_total: {}, lines: [] };
    result[key].total += li.amount || 0;
    const beteKey = m.bete_line || '';
    result[key].bete_total[beteKey] = (result[key].bete_total[beteKey] || 0) + (li.amount || 0);
    result[key].lines.push({ ...li, mapping: m });
  });
  return result;
}

/**
 * Build BETE-line totals from mappings.
 * Returns { municipalAppropriations: n, stateRevenueSharing: n, ... }
 */
export function rollupByBeteLine(lineItems, mappings) {
  const result = {};
  Object.keys(BETE_LINES).forEach(k => { result[k] = 0; });
  lineItems.forEach(li => {
    const m = mappings[li.id];
    if (!m || !m.bete_line) return;
    if (m.bete_line in result) result[m.bete_line] += li.amount || 0;
  });
  return result;
}

// ─── Exceptions report ─────────────────────────────────────────────────────────

/**
 * Find all line items that have incomplete or missing mappings.
 * Returns array of { lineItem, reason }
 */
export function findMappingExceptions(lineItems, mappings) {
  const exceptions = [];
  lineItems.forEach(li => {
    const m = mappings[li.id];
    if (!m) {
      exceptions.push({ lineItem: li, reason: 'No mapping record — line item has not been assigned to an article.', severity: 'error' });
      return;
    }
    if (!m.article_number || m.article_number.trim() === '') {
      exceptions.push({ lineItem: li, reason: 'Mapping exists but no article number assigned.', severity: 'error' });
    }
    if (!m.bete_line || m.bete_line.trim() === '') {
      exceptions.push({ lineItem: li, reason: 'No BETE line assigned — required for tax rate calculation.', severity: 'error' });
    }
    if (li.record_type === 'deduction' && (!m.deduction_type || m.deduction_type === 'none')) {
      exceptions.push({ lineItem: li, reason: 'Deduction line has no deduction type assigned.', severity: 'warning' });
    }
    if ((li.amount || 0) === 0) {
      exceptions.push({ lineItem: li, reason: 'Line item has $0 amount — verify before adoption.', severity: 'warning' });
    }
  });
  return exceptions;
}

// ─── Adoption readiness gate ────────────────────────────────────────────────────

/**
 * Returns { ready: bool, blockers: [], warnings: [] }
 * Blocks adoption if any hard mapping errors exist.
 */
export function checkAdoptionReadiness(lineItems, mappings) {
  const exceptions = findMappingExceptions(lineItems, mappings);
  const blockers = exceptions.filter(e => e.severity === 'error');
  const warnings = exceptions.filter(e => e.severity === 'warning');
  return {
    ready: blockers.length === 0,
    blockers,
    warnings,
    totalLines: lineItems.length,
    mappedLines: lineItems.filter(li => mappings[li.id]?.article_number).length,
    unmappedCount: lineItems.filter(li => !mappings[li.id]?.article_number).length,
    mappingCompletePct: lineItems.length > 0
      ? Math.round((lineItems.filter(li => mappings[li.id]?.article_number && mappings[li.id]?.bete_line).length / lineItems.length) * 100)
      : 0,
  };
}

// ─── Auto-apply suggested mappings ────────────────────────────────────────────

export function applyAllSuggestedMappings(lineItems) {
  const mappings = {};
  lineItems.forEach(li => {
    mappings[li.id] = {
      article_number: li.suggested_article || '',
      bete_line: li.suggested_bete || '',
      deduction_type: li.suggested_deduction_type || 'none',
      notes: 'Auto-mapped from article/budget defaults',
    };
  });
  return mappings;
}