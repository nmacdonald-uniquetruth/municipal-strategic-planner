/**
 * useCOABudget — React hook for COA-driven budget data
 * 
 * Provides unified access to:
 *  - Approved COA accounts
 *  - Budget structure from COA
 *  - Revenue/expenditure filtering
 *  - Article totals from COA mapping
 *  - Traceability info
 */
import { useMemo } from 'react';
import {
  getApprovedCOAAccounts,
  buildBudgetStructureFromCOA,
  getRevenueAccounts,
  getExpenditureAccounts,
  groupByDepartment,
  groupByReportingCategory,
  getArticleTotal,
  getTraceabilityInfo,
  validateBudgetCOAAlignment,
} from './coaBudgetBridge';

export function useCOABudget(coaAccounts, budgetLines) {
  // Approved accounts
  const approved = useMemo(
    () => getApprovedCOAAccounts(coaAccounts),
    [coaAccounts]
  );

  // Budget structure keyed by fund
  const budgetByFund = useMemo(
    () => buildBudgetStructureFromCOA(coaAccounts),
    [coaAccounts]
  );

  // Revenue & expenditure filtered views
  const revenue = useMemo(
    () => getRevenueAccounts(coaAccounts),
    [coaAccounts]
  );

  const expenditure = useMemo(
    () => getExpenditureAccounts(coaAccounts),
    [coaAccounts]
  );

  // Grouped by department
  const byDepartment = useMemo(
    () => groupByDepartment(coaAccounts),
    [coaAccounts]
  );

  // Grouped by reporting category
  const byCategory = useMemo(
    () => groupByReportingCategory(coaAccounts),
    [coaAccounts]
  );

  // Get article total helper
  const getArticleSum = (articleNumber, summaryData) =>
    getArticleTotal(coaAccounts, articleNumber, summaryData);

  // Get traceability helper
  const getTrace = (newAccountNumber) =>
    getTraceabilityInfo(newAccountNumber, coaAccounts);

  // Validation
  const alignmentIssues = useMemo(
    () => validateBudgetCOAAlignment(budgetLines, coaAccounts),
    [budgetLines, coaAccounts]
  );

  return {
    approved,
    budgetByFund,
    revenue,
    expenditure,
    byDepartment,
    byCategory,
    getArticleSum,
    getTrace,
    alignmentIssues,
    isReady: approved.length > 0,
  };
}