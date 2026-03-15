/**
 * COA ↔ Budget Bridge
 * 
 * Connects the approved Chart of Accounts crosswalk to all budget displays.
 * All budget line items are keyed to new account numbers from the approved COA.
 * Historical values flow through the TRIO→new mapping.
 */

/**
 * Get approved COA accounts, grouped by fund and account type
 */
export function getApprovedCOAAccounts(coaAccounts) {
  if (!coaAccounts?.length) return [];
  return coaAccounts.filter(a => a.validation_status === 'approved' && a.status === 'active');
}

/**
 * Build budget structure from approved COA
 * Returns accounts organized by: fund → account_type → account
 */
export function buildBudgetStructureFromCOA(coaAccounts) {
  const approved = getApprovedCOAAccounts(coaAccounts);
  const byFund = {};

  approved.forEach(acct => {
    const fund = acct.fund || 'general_fund';
    const type = acct.account_type || 'expenditure';
    
    if (!byFund[fund]) byFund[fund] = { fund, accounts: [] };
    byFund[fund].accounts.push({
      new_account_number: acct.new_account_number,
      new_account_title: acct.new_account_title,
      account_type: acct.account_type,
      department: acct.department || 'Unassigned',
      function_program: acct.function_program,
      natural_account: acct.natural_account,
      reporting_category: acct.reporting_category,
      budget_article_mapping: acct.budget_article_mapping,
      trio_account: acct.trio_account,
      trio_historical_budget: acct.trio_historical_budget || 0,
      trio_historical_actual: acct.trio_historical_actual || 0,
      mapping_type: acct.mapping_type,
      mapping_split_percent: acct.mapping_split_percent,
      coa_id: acct.id,
    });
  });

  return byFund;
}

/**
 * Allocate historical budget through the crosswalk mapping
 * For split mappings, distributes proportionally
 * Returns allocated budget for the new account
 */
export function getAllocatedHistoricalBudget(coaAccount, trioHistoricalBudget = 0) {
  if (!coaAccount) return 0;
  
  const pct = (coaAccount.mapping_split_percent || 100) / 100;
  return Math.round(trioHistoricalBudget * pct);
}

/**
 * Get all TRIO source accounts that map to a given new account
 */
export function getTrioSourceAccounts(coaAccounts, newAccountNumber) {
  return (coaAccounts || []).filter(a => a.new_account_number === newAccountNumber);
}

/**
 * Build article total from COA accounts mapped to that article
 * Sums up all accounts with matching budget_article_mapping
 */
export function getArticleTotal(coaAccounts, articleNumber, summaryData = null) {
  const matched = (coaAccounts || []).filter(a => a.budget_article_mapping === articleNumber);
  
  let total = 0;
  matched.forEach(acct => {
    if (summaryData && summaryData[acct.new_account_number]) {
      total += summaryData[acct.new_account_number].adopted_budget || 0;
    } else {
      total += acct.trio_historical_budget || 0;
    }
  });
  
  return total;
}

/**
 * Get revenue accounts (filters by account_type)
 */
export function getRevenueAccounts(coaAccounts) {
  return getApprovedCOAAccounts(coaAccounts).filter(a => a.account_type === 'revenue');
}

/**
 * Get expenditure accounts
 */
export function getExpenditureAccounts(coaAccounts) {
  return getApprovedCOAAccounts(coaAccounts).filter(a => 
    a.account_type === 'expenditure' || a.account_type === 'transfer'
  );
}

/**
 * Group approved COA by department
 */
export function groupByDepartment(coaAccounts) {
  const approved = getApprovedCOAAccounts(coaAccounts);
  const byDept = {};

  approved.forEach(acct => {
    const dept = acct.department || 'Unassigned';
    if (!byDept[dept]) byDept[dept] = [];
    byDept[dept].push(acct);
  });

  return byDept;
}

/**
 * Group approved COA by reporting category
 */
export function groupByReportingCategory(coaAccounts) {
  const approved = getApprovedCOAAccounts(coaAccounts);
  const byCategory = {};

  approved.forEach(acct => {
    const cat = acct.reporting_category || 'other';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(acct);
  });

  return byCategory;
}

/**
 * Create a traceability record for any budget line total
 * Returns: { newAccount, trioSources, articleMapping, fund, department, reportingCategory }
 */
export function getTraceabilityInfo(newAccountNumber, coaAccounts) {
  const coaRecord = (coaAccounts || []).find(a => a.new_account_number === newAccountNumber);
  if (!coaRecord) return null;

  const trioSources = getTrioSourceAccounts(coaAccounts, newAccountNumber);

  return {
    // New account
    new_account_number: coaRecord.new_account_number,
    new_account_title: coaRecord.new_account_title,
    account_type: coaRecord.account_type,
    
    // TRIO sources (historical)
    trio_sources: trioSources.map(t => ({
      trio_account: t.trio_account,
      trio_description: t.trio_description,
      trio_historical_budget: t.trio_historical_budget,
      trio_historical_actual: t.trio_historical_actual,
      mapping_type: t.mapping_type,
      mapping_split_percent: t.mapping_split_percent,
    })),
    
    // Organization
    article_mapping: coaRecord.budget_article_mapping,
    fund: coaRecord.fund,
    department: coaRecord.department,
    function_program: coaRecord.function_program,
    natural_account: coaRecord.natural_account,
    reporting_category: coaRecord.reporting_category,
    
    // Metadata
    mapping_type: coaRecord.mapping_type,
    mapping_group_key: coaRecord.mapping_group_key,
    coa_id: coaRecord.id,
    validation_status: coaRecord.validation_status,
  };
}

/**
 * Validate budget structure — ensure all active accounts have COA mappings
 * Returns: { unmapped: [], missingHistorical: [], warnings: [] }
 */
export function validateBudgetCOAAlignment(budgetLines, coaAccounts) {
  const issues = { unmapped: [], missingHistorical: [], warnings: [] };
  const coaNumbers = new Set((coaAccounts || []).map(a => a.new_account_number).filter(Boolean));

  (budgetLines || []).forEach(line => {
    if (!line.account_code) {
      issues.unmapped.push({ ...line, issue: 'Missing account code' });
    } else if (!coaNumbers.has(line.account_code)) {
      issues.unmapped.push({ ...line, issue: `Account ${line.account_code} not in approved COA` });
    }

    const coaRecord = (coaAccounts || []).find(a => a.new_account_number === line.account_code);
    if (coaRecord && !coaRecord.trio_account && coaRecord.mapping_type !== 'unmapped') {
      issues.missingHistorical.push({ ...line, issue: 'No TRIO source for historical comparison' });
    }
  });

  return issues;
}