/**
 * Chart of Accounts Crosswalk Engine
 * Pure functions — no React dependencies.
 *
 * Responsibilities:
 *  - Validate crosswalk completeness
 *  - Build reporting views (old→new, dept, revenue, expenditure, exceptions)
 *  - Cross-reference with budget worksheet and warrant articles
 *  - Detect mapping issues (unmapped, duplicate, ambiguous, split integrity)
 */

// ─── Constants ─────────────────────────────────────────────────────────────────

export const ACCOUNT_TYPE_LABELS = {
  revenue:      'Revenue',
  expenditure:  'Expenditure',
  asset:        'Asset',
  liability:    'Liability',
  equity:       'Equity',
  transfer:     'Transfer',
  contra:       'Contra',
};

export const FUND_LABELS = {
  general_fund:            'General Fund',
  ambulance_fund:          'Ambulance Fund',
  sewer_fund:              'Sewer Fund',
  transfer_station_fund:   'Transfer Station Fund',
  airport_fund:            'Airport Fund',
  capital_reserve:         'Capital Reserve',
  grant_fund:              'Grant Fund',
  debt_service_fund:       'Debt Service Fund',
  special_revenue:         'Special Revenue',
  tif_fund:                'TIF Fund',
  other:                   'Other',
};

export const REPORTING_CATEGORY_LABELS = {
  salaries_wages:      'Salaries & Wages',
  benefits:            'Benefits',
  supplies_materials:  'Supplies & Materials',
  contracted_services: 'Contracted Services',
  equipment:           'Equipment',
  debt_service:        'Debt Service',
  capital_outlay:      'Capital Outlay',
  intergovernmental:   'Intergovernmental',
  tax_revenue:         'Tax Revenue',
  non_tax_revenue:     'Non-Tax Revenue',
  enterprise_revenue:  'Enterprise Revenue',
  transfers:           'Transfers',
  other:               'Other',
};

export const MAPPING_TYPE_LABELS = {
  one_to_one:  '1:1',
  one_to_many: '1:N',
  many_to_one: 'N:1',
  unmapped:    'Unmapped',
  split:       'Split',
};

export const VALIDATION_STATUS_COLORS = {
  mapped:       { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  unmapped:     { bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200' },
  duplicate:    { bg: 'bg-orange-50',  text: 'text-orange-700',  border: 'border-orange-200' },
  ambiguous:    { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200' },
  needs_review: { bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200' },
  approved:     { bg: 'bg-slate-50',   text: 'text-slate-700',   border: 'border-slate-200' },
};

// ─── Validation ────────────────────────────────────────────────────────────────

export function validateCrosswall(accounts) {
  const errors   = [];
  const warnings = [];
  const info     = [];

  // Index for cross-checks
  const newAccountNums = accounts.map(a => a.new_account_number).filter(Boolean);
  const trioNums       = accounts.map(a => a.trio_account).filter(Boolean);

  // 1. Missing required fields
  accounts.forEach(a => {
    if (!a.new_account_number?.trim()) {
      errors.push({ id: a.id, trio: a.trio_account, msg: `Account "${a.trio_description || a.trio_account}" is missing a new account number.`, field: 'new_account_number' });
    }
    if (!a.new_account_title?.trim()) {
      warnings.push({ id: a.id, trio: a.trio_account, msg: `Account ${a.new_account_number || a.trio_account} is missing a new account title.`, field: 'new_account_title' });
    }
    if (!a.fund) {
      warnings.push({ id: a.id, trio: a.trio_account, msg: `Account ${a.new_account_number} has no fund assigned.`, field: 'fund' });
    }
    if (!a.account_type) {
      warnings.push({ id: a.id, trio: a.trio_account, msg: `Account ${a.new_account_number} has no account type.`, field: 'account_type' });
    }
    if (a.mapping_type === 'unmapped' || a.validation_status === 'unmapped') {
      warnings.push({ id: a.id, trio: a.trio_account, msg: `Account ${a.new_account_number} (${a.new_account_title}) is marked unmapped.`, field: 'mapping_type' });
    }
    if (a.mapping_type === 'split' && (!a.mapping_split_percent || a.mapping_split_percent <= 0)) {
      errors.push({ id: a.id, trio: a.trio_account, msg: `Split account ${a.new_account_number} has no split percentage defined.`, field: 'mapping_split_percent' });
    }
  });

  // 2. Duplicate new account numbers
  const dupNew = newAccountNums.filter((n, i) => newAccountNums.indexOf(n) !== i);
  [...new Set(dupNew)].forEach(n => {
    errors.push({ id: n, msg: `Duplicate new account number: "${n}" appears more than once. Only valid for many-to-one mappings.`, field: 'new_account_number' });
  });

  // 3. Split groups must sum to 100%
  const splitGroups = {};
  accounts.filter(a => a.mapping_type === 'split' && a.mapping_group_key).forEach(a => {
    const k = a.mapping_group_key;
    if (!splitGroups[k]) splitGroups[k] = 0;
    splitGroups[k] += a.mapping_split_percent || 0;
  });
  Object.entries(splitGroups).forEach(([k, total]) => {
    if (Math.abs(total - 100) > 0.5) {
      errors.push({ id: k, msg: `Split group "${k}" allocations sum to ${total.toFixed(1)}% — must equal 100%.`, field: 'mapping_split_percent' });
    }
  });

  // 4. TRIO accounts with no mapping
  const unmappedTrio = accounts.filter(a => a.trio_account && (!a.new_account_number || a.mapping_type === 'unmapped'));
  if (unmappedTrio.length > 0) {
    info.push({ id: 'unmapped_trio', msg: `${unmappedTrio.length} TRIO account${unmappedTrio.length > 1 ? 's' : ''} have no new account mapping.` });
  }

  // 5. Accounts with no TRIO source (new accounts only)
  const newOnly = accounts.filter(a => !a.trio_account && a.new_account_number);
  if (newOnly.length > 0) {
    info.push({ id: 'new_only', msg: `${newOnly.length} account${newOnly.length > 1 ? 's' : ''} are new accounts with no TRIO predecessor.` });
  }

  return { errors, warnings, info };
}

// ─── Reporting views ───────────────────────────────────────────────────────────

/** Old-to-new full crosswalk listing */
export function buildOldToNewView(accounts) {
  return [...accounts]
    .filter(a => a.trio_account || a.new_account_number)
    .sort((a, b) => (a.trio_account || '').localeCompare(b.trio_account || ''));
}

/** Group by new department */
export function buildDepartmentView(accounts) {
  const groups = {};
  accounts.forEach(a => {
    const k = a.department || a.trio_department || 'Unassigned';
    if (!groups[k]) groups[k] = { department: k, accounts: [], totalBudget: 0, totalActual: 0 };
    groups[k].accounts.push(a);
    groups[k].totalBudget += a.trio_historical_budget || 0;
    groups[k].totalActual += a.trio_historical_actual || 0;
  });
  return Object.values(groups).sort((a, b) => a.department.localeCompare(b.department));
}

/** Revenue accounts only */
export function buildRevenueView(accounts) {
  return accounts
    .filter(a => a.account_type === 'revenue' || a.reporting_category?.includes('revenue'))
    .sort((a, b) => (a.new_account_number || '').localeCompare(b.new_account_number || ''));
}

/** Expenditure accounts only */
export function buildExpenditureView(accounts) {
  return accounts
    .filter(a => a.account_type === 'expenditure' || a.account_type === 'transfer')
    .sort((a, b) => (a.new_account_number || '').localeCompare(b.new_account_number || ''));
}

/** Exceptions report — all flagged accounts */
export function buildExceptionsReport(accounts) {
  return accounts.filter(a =>
    a.validation_status === 'unmapped' ||
    a.validation_status === 'duplicate' ||
    a.validation_status === 'ambiguous' ||
    a.validation_status === 'needs_review' ||
    a.mapping_type === 'unmapped' ||
    !a.new_account_number?.trim()
  ).sort((a, b) => {
    const order = { unmapped: 0, duplicate: 1, ambiguous: 2, needs_review: 3 };
    return (order[a.validation_status] ?? 9) - (order[b.validation_status] ?? 9);
  });
}

/** Summary stats for KPI strip */
export function buildSummaryStats(accounts) {
  const total          = accounts.length;
  const mapped         = accounts.filter(a => a.validation_status === 'mapped' || a.validation_status === 'approved').length;
  const unmapped       = accounts.filter(a => a.validation_status === 'unmapped' || !a.new_account_number?.trim()).length;
  const exceptions     = accounts.filter(a => ['duplicate','ambiguous','needs_review'].includes(a.validation_status)).length;
  const approved       = accounts.filter(a => a.validation_status === 'approved').length;
  const enterprise     = accounts.filter(a => a.fund_type === 'enterprise').length;
  const governmental   = accounts.filter(a => a.fund_type === 'governmental').length;
  const splitCount     = accounts.filter(a => a.mapping_type === 'split').length;
  const manyToOne      = accounts.filter(a => a.mapping_type === 'many_to_one').length;
  const completionPct  = total > 0 ? Math.round((mapped / total) * 100) : 0;

  return { total, mapped, unmapped, exceptions, approved, enterprise, governmental, splitCount, manyToOne, completionPct };
}

/** Cross-reference: given a new account number, find matching budget worksheet lines */
export function findBudgetMatches(newAccountNumber, budgetLines) {
  if (!budgetLines?.length) return [];
  return budgetLines.filter(l => l.account_code === newAccountNumber || l.account_code?.startsWith(newAccountNumber));
}

/** Cross-reference: find warrant articles linked to an account */
export function findWarrantMatches(account, articles) {
  if (!articles?.length) return [];
  return articles.filter(a => a.article_number === account.budget_article_mapping);
}

/**
 * ─── Old-to-New Bridge Reconciliation ──────────────────────────────────────
 * Calculates mappings between TRIO (legacy) and new account structures.
 * Supports aggregation (many old → one new) and disaggregation (one old → many new).
 */

export function buildBridgeMapping(accounts) {
  const trioToNew = {};  // TRIO account → [new accounts]
  const newToTrio = {};  // new account → [TRIO accounts]

  accounts.forEach(a => {
    if (!a.trio_account || !a.new_account_number) return;
    if (!trioToNew[a.trio_account]) trioToNew[a.trio_account] = [];
    if (!newToTrio[a.new_account_number]) newToTrio[a.new_account_number] = [];
    trioToNew[a.trio_account].push(a);
    newToTrio[a.new_account_number].push(a);
  });

  return { trioToNew, newToTrio };
}

/**
 * Confidence flag for a mapping relationship.
 * Returns: { level: 'exact' | 'estimated' | 'ambiguous', reason: string }
 */
export function getMappingConfidence(mappedAccounts) {
  if (!mappedAccounts || mappedAccounts.length === 0) {
    return { level: 'estimated', reason: 'No mapping found' };
  }
  if (mappedAccounts.length === 1) {
    const m = mappedAccounts[0];
    if (m.mapping_type === 'one_to_one') {
      return { level: 'exact', reason: 'One-to-one mapping' };
    } else if (m.mapping_type === 'split' && m.mapping_split_percent === 100) {
      return { level: 'exact', reason: '100% split allocation' };
    } else if (m.mapping_type === 'split') {
      return { level: 'estimated', reason: `Split ${m.mapping_split_percent}%` };
    }
  }
  if (mappedAccounts.length > 1) {
    const allHavePercent = mappedAccounts.every(m => m.mapping_split_percent);
    const totalPercent = mappedAccounts.reduce((s, m) => s + (m.mapping_split_percent || 0), 0);
    if (allHavePercent && Math.abs(totalPercent - 100) < 0.1) {
      return { level: 'exact', reason: `Many-to-one aggregation (${mappedAccounts.length} accounts)` };
    }
  }
  return { level: 'ambiguous', reason: 'Complex or incomplete mapping' };
}

/**
 * Bridge row reconciliation: given a TRIO account and historical data, allocate to new accounts.
 * Returns: { trioAccount, trioDesc, trioHistBudget, trioHistActual, newMappings: [...], confidence }
 */
export function buildBridgeRow(trioAcct, mappedAccounts, trioHistBudget = 0, trioHistActual = 0) {
  const confidence = getMappingConfidence(mappedAccounts);
  const newMappings = (mappedAccounts || []).map(m => {
    const pct = (m.mapping_split_percent || 100) / 100;
    return {
      newAccountNumber: m.new_account_number,
      newTitle: m.new_account_title,
      allocatedBudget: Math.round(trioHistBudget * pct),
      allocatedActual: Math.round(trioHistActual * pct),
      splitPercent: m.mapping_split_percent || 100,
      mappingType: m.mapping_type,
    };
  });

  return {
    trioAccount: trioAcct.trio_account || trioAcct,
    trioDescription: trioAcct.trio_description || '',
    trioHistBudget,
    trioHistActual,
    newMappings,
    confidence,
    totalMapped: newMappings.reduce((s, nm) => s + nm.allocatedBudget, 0),
    totalActual: newMappings.reduce((s, nm) => s + nm.allocatedActual, 0),
  };
}

/**
 * Bridge report by department: show TRIO data aggregated under new department grouping.
 */
export function buildDepartmentBridge(accounts) {
  const { trioToNew } = buildBridgeMapping(accounts);
  const byDept = {};

  accounts.forEach(a => {
    if (!a.department) return;
    const key = a.department;
    if (!byDept[key]) {
      byDept[key] = {
        department: key,
        newAccounts: [],
        trioHistBudgetTotal: 0,
        trioHistActualTotal: 0,
        bridges: [],
      };
    }
    byDept[key].newAccounts.push(a);
  });

  Object.entries(trioToNew).forEach(([trioNum, newAccts]) => {
    const budget = newAccts[0]?.trio_historical_budget || 0;
    const actual = newAccts[0]?.trio_historical_actual || 0;
    const primaryNewAcct = newAccts[0];
    const deptKey = primaryNewAcct?.department || 'Unknown';

    if (byDept[deptKey]) {
      byDept[deptKey].trioHistBudgetTotal += budget;
      byDept[deptKey].trioHistActualTotal += actual;
      byDept[deptKey].bridges.push(buildBridgeRow({ trio_account: trioNum }, newAccts, budget, actual));
    }
  });

  return Object.values(byDept).sort((a, b) => a.department.localeCompare(b.department));
}

/**
 * Bridge report by fund: TRIO accounts mapped to new fund structure.
 */
export function buildFundBridge(accounts) {
  const { trioToNew } = buildBridgeMapping(accounts);
  const byFund = {};

  accounts.forEach(a => {
    if (!a.fund) return;
    if (!byFund[a.fund]) {
      byFund[a.fund] = {
        fund: a.fund,
        fundType: a.fund_type,
        newAccounts: [],
        trioHistBudgetTotal: 0,
        trioHistActualTotal: 0,
        bridges: [],
      };
    }
    byFund[a.fund].newAccounts.push(a);
  });

  Object.entries(trioToNew).forEach(([trioNum, newAccts]) => {
    const budget = newAccts[0]?.trio_historical_budget || 0;
    const actual = newAccts[0]?.trio_historical_actual || 0;
    const fundKey = newAccts[0]?.fund || 'general_fund';

    if (byFund[fundKey]) {
      byFund[fundKey].trioHistBudgetTotal += budget;
      byFund[fundKey].trioHistActualTotal += actual;
      byFund[fundKey].bridges.push(buildBridgeRow({ trio_account: trioNum }, newAccts, budget, actual));
    }
  });

  return Object.values(byFund).sort((a, b) => a.fund.localeCompare(b.fund));
}

/**
 * Bridge reconciliation: sum all new accounts and verify they match TRIO total.
 */
export function bridgeReconciliation(bridgeRows) {
  const trioTotal = bridgeRows.reduce((s, r) => s + r.trioHistBudget, 0);
  const newTotal = bridgeRows.reduce((s, r) => s + r.totalMapped, 0);
  const difference = Math.abs(trioTotal - newTotal);
  return { trioTotal, newTotal, difference, reconciled: difference < 100 };
}

// ─── CSV / import parser ───────────────────────────────────────────────────────

/**
 * Parse a flat CSV-like array of objects (from ExtractDataFromUploadedFile)
 * into ChartOfAccounts records.
 */
export function parseCOAImport(rows) {
  return rows.map((row, i) => ({
    trio_account:          row['TRIO Account'] || row['trio_account'] || row['Old Account'] || '',
    trio_department:       row['TRIO Dept'] || row['trio_department'] || row['Department'] || '',
    trio_object_code:      row['Object Code'] || row['trio_object_code'] || '',
    trio_description:      row['TRIO Description'] || row['trio_description'] || row['Description'] || '',
    trio_historical_budget: parseFloat(row['Prior Budget'] || row['trio_historical_budget'] || 0) || 0,
    trio_historical_actual: parseFloat(row['Prior Actual'] || row['trio_historical_actual'] || 0) || 0,
    new_account_number:    row['New Account'] || row['new_account_number'] || '',
    new_account_title:     row['New Title'] || row['new_account_title'] || '',
    new_account_description: row['New Description'] || row['new_account_description'] || '',
    account_type:          row['Account Type'] || row['account_type'] || 'expenditure',
    fund:                  row['Fund'] || row['fund'] || 'general_fund',
    fund_type:             row['Fund Type'] || row['fund_type'] || 'governmental',
    function_program:      row['Function'] || row['function_program'] || '',
    department:            row['Department'] || row['department'] || row['TRIO Dept'] || '',
    natural_account:       row['Natural Account'] || row['natural_account'] || '',
    reporting_category:    row['Reporting Category'] || row['reporting_category'] || 'other',
    budget_article_mapping: row['Article'] || row['budget_article_mapping'] || '',
    mapping_type:          row['Mapping Type'] || row['mapping_type'] || 'one_to_one',
    mapping_split_percent: parseFloat(row['Split %'] || row['mapping_split_percent'] || 100) || 100,
    mapping_group_key:     row['Group Key'] || row['mapping_group_key'] || '',
    validation_status:     row['Status'] || row['validation_status'] || 'unmapped',
    status:                'active',
    fiscal_year_effective: row['Effective FY'] || row['fiscal_year_effective'] || 'FY2027',
    transition_notes:      row['Transition Notes'] || row['transition_notes'] || '',
    notes:                 row['Notes'] || row['notes'] || '',
  }));
}