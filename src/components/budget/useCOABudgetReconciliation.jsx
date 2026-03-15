/**
 * Hook: COA-Driven Budget Reconciliation
 *
 * Ties BudgetWorksheet and DepartmentBudget records to ChartOfAccounts crosswalk.
 * Provides:
 *  - Budget line items sourced from approved COA
 *  - Historical values allocated via bridge mappings
 *  - Rollup aggregation by department/fund/article
 *  - Traceability: total → new account → TRIO source → article
 */

import { useMemo } from 'react';
import { buildBridgeMapping, getMappingConfidence } from '../coa/coaEngine';

/**
 * Main hook: reconciles budget data with COA crosswalk
 */
export function useCOABudgetReconciliation(accounts, budgetLines = [], departmentBudgets = [], articles = []) {
  return useMemo(() => {
    if (!accounts?.length) return { error: 'No COA accounts available' };

    const { trioToNew, newToTrio } = buildBridgeMapping(accounts);

    // ── Build COA-driven budget structure ──
    const coaBudgetLines = accounts
      .filter(a => a.validation_status === 'approved' && a.account_type !== 'asset' && a.account_type !== 'liability')
      .map(a => {
        const newAcctNum = a.new_account_number;
        const trioMappings = newToTrio[newAcctNum] || [];

        // Find matching budget worksheet line
        const matchedBudgetLine = budgetLines.find(b =>
          b.account_code === newAcctNum || b.new_account_number === newAcctNum
        );

        // Allocate historical budget/actual via bridge
        let historicalBudget = 0;
        let historicalActual = 0;
        trioMappings.forEach(m => {
          const pct = (m.mapping_split_percent || 100) / 100;
          historicalBudget += (m.trio_historical_budget || 0) * pct;
          historicalActual += (m.trio_historical_actual || 0) * pct;
        });

        const confidence = getMappingConfidence(trioMappings);

        return {
          id: a.id,
          accountNumber: newAcctNum,
          accountTitle: a.new_account_title,
          accountDescription: a.new_account_description,
          department: a.department,
          fund: a.fund,
          fundType: a.fund_type,
          accountType: a.account_type,
          reportingCategory: a.reporting_category,
          function: a.function_program,
          budgetArticle: a.budget_article_mapping,
          // Historical data (from TRIO via bridge)
          historicalBudget: Math.round(historicalBudget),
          historicalActual: Math.round(historicalActual),
          historicalVariance: Math.round(historicalActual - historicalBudget),
          // Current budget (from BudgetWorksheet if available)
          adoptedBudget: matchedBudgetLine?.adopted || matchedBudgetLine?.adopted_budget || 0,
          revisedBudget: matchedBudgetLine?.revised_budget || matchedBudgetLine?.revised || 0,
          ytdActual: matchedBudgetLine?.ytd_actual || 0,
          projectedYearEnd: matchedBudgetLine?.projected_year_end || 0,
          // Mapping metadata
          trioMappings,
          mappingType: a.mapping_type,
          mappingConfidence: confidence,
          encumbrances: matchedBudgetLine?.encumbrances || 0,
          status: a.status,
        };
      });

    // ── Rollup aggregations ──
    const rollupByDept = {};
    const rollupByFund = {};
    const rollupByArticle = {};
    const rollupByCategory = {};

    coaBudgetLines.forEach(line => {
      // Department rollup
      const deptKey = line.department || 'Unassigned';
      if (!rollupByDept[deptKey]) rollupByDept[deptKey] = { department: deptKey, lines: [], totalBudget: 0, totalActual: 0, totalHistorical: 0 };
      rollupByDept[deptKey].lines.push(line);
      rollupByDept[deptKey].totalBudget += line.adoptedBudget || 0;
      rollupByDept[deptKey].totalActual += line.ytdActual || 0;
      rollupByDept[deptKey].totalHistorical += line.historicalBudget;

      // Fund rollup
      const fundKey = line.fund || 'general_fund';
      if (!rollupByFund[fundKey]) rollupByFund[fundKey] = { fund: fundKey, fundType: line.fundType, lines: [], totalBudget: 0, totalActual: 0, totalHistorical: 0 };
      rollupByFund[fundKey].lines.push(line);
      rollupByFund[fundKey].totalBudget += line.adoptedBudget || 0;
      rollupByFund[fundKey].totalActual += line.ytdActual || 0;
      rollupByFund[fundKey].totalHistorical += line.historicalBudget;

      // Article rollup
      const artKey = line.budgetArticle || 'Unassigned';
      if (!rollupByArticle[artKey]) rollupByArticle[artKey] = { article: artKey, lines: [], totalBudget: 0, totalActual: 0, totalHistorical: 0 };
      rollupByArticle[artKey].lines.push(line);
      rollupByArticle[artKey].totalBudget += line.adoptedBudget || 0;
      rollupByArticle[artKey].totalActual += line.ytdActual || 0;
      rollupByArticle[artKey].totalHistorical += line.historicalBudget;

      // Category rollup
      const catKey = line.reportingCategory || 'other';
      if (!rollupByCategory[catKey]) rollupByCategory[catKey] = { category: catKey, lines: [], totalBudget: 0, totalActual: 0 };
      rollupByCategory[catKey].lines.push(line);
      rollupByCategory[catKey].totalBudget += line.adoptedBudget || 0;
      rollupByCategory[catKey].totalActual += line.ytdActual || 0;
    });

    return {
      coaBudgetLines,
      rollupByDept: Object.values(rollupByDept),
      rollupByFund: Object.values(rollupByFund),
      rollupByArticle: Object.values(rollupByArticle),
      rollupByCategory: Object.values(rollupByCategory),
      totalAppropriations: coaBudgetLines
        .filter(l => l.accountType === 'expenditure')
        .reduce((s, l) => s + (l.adoptedBudget || 0), 0),
      totalRevenues: coaBudgetLines
        .filter(l => l.accountType === 'revenue')
        .reduce((s, l) => s + (l.adoptedBudget || 0), 0),
      getLineageForTotal: (totalValue, filterFn) => {
        // Given a rollup total and filter, return all contributing lines with lineage
        const lines = coaBudgetLines.filter(filterFn);
        return lines.map(line => ({
          newAccount: line.accountNumber,
          newTitle: line.accountTitle,
          trioSources: line.trioMappings.map(m => ({ account: m.trio_account, description: m.trio_description, pct: m.mapping_split_percent })),
          article: line.budgetArticle,
          fund: line.fund,
          amount: line.adoptedBudget || 0,
          mappingConfidence: line.mappingConfidence,
        }));
      },
    };
  }, [accounts, budgetLines, departmentBudgets, articles]);
}

/**
 * Helper: given a total and COA lines, trace back to sources
 */
export function traceTotal(totalValue, coaBudgetLines, filterFn) {
  const lines = coaBudgetLines.filter(filterFn);
  const sum = lines.reduce((s, l) => s + (l.adoptedBudget || 0), 0);
  
  return {
    totalValue,
    sumOfLines: sum,
    variance: totalValue - sum,
    lines: lines.map(line => ({
      account: line.accountNumber,
      title: line.accountTitle,
      amount: line.adoptedBudget,
      department: line.department,
      article: line.budgetArticle,
      fund: line.fund,
      trioSources: line.trioMappings.map(m => ({
        trioAccount: m.trio_account,
        trioDescription: m.trio_description,
        allocation: m.mapping_split_percent,
      })),
    })),
  };
}