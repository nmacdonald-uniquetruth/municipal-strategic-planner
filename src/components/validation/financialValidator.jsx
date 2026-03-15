/**
 * Financial Logic Validator
 * Checks budget balance, tax rate integrity, and revenue source completeness.
 */

import { calculateTaxRate } from '@/components/engine/taxCalculator';

// Severity levels
export const SEVERITY = { ERROR: 'error', WARNING: 'warning', INFO: 'info' };

/**
 * Validate that a budget balances — revenues cover expenditures within a tolerance
 */
export function validateBudgetBalance(revenue, expenditures, tolerance = 0.02) {
  const results = [];
  const gap = revenue - expenditures;
  const pctGap = expenditures > 0 ? Math.abs(gap) / expenditures : 0;

  if (gap < 0 && Math.abs(gap) > 1000) {
    results.push({
      id: 'BUDGET_DEFICIT',
      severity: SEVERITY.ERROR,
      category: 'budget_balance',
      message: `Budget deficit of ${fmt(Math.abs(gap))} — expenditures exceed revenues.`,
      detail: `Revenue: ${fmt(revenue)} | Expenditures: ${fmt(expenditures)} | Gap: ${fmt(gap)}`,
      remediation: 'Increase revenue sources, reduce expenditures, or draw from undesignated reserves.',
    });
  } else if (gap > expenditures * 0.15) {
    results.push({
      id: 'BUDGET_SURPLUS_LARGE',
      severity: SEVERITY.WARNING,
      category: 'budget_balance',
      message: `Unusually large projected surplus of ${fmt(gap)} (${(pctGap * 100).toFixed(1)}% of budget).`,
      detail: 'Large surpluses may indicate understated expenditures or overstated revenues.',
      remediation: 'Review revenue projections for accuracy.',
    });
  }

  return results;
}

/**
 * Validate computed mill rate against known reasonable bounds
 */
export function validateTaxRate({ millRate, levy, assessedValue, currentMillRate, legalMaxMillRate = null }) {
  const results = [];

  // Recalculate to confirm internal consistency
  const { millRate: computed } = calculateTaxRate({ totalBudget: levy, totalAssessedValue: assessedValue });
  if (Math.abs(computed - millRate) > 0.01) {
    results.push({
      id: 'MILL_RATE_MISMATCH',
      severity: SEVERITY.ERROR,
      category: 'tax_calculation',
      message: `Mill rate mismatch — displayed ${millRate.toFixed(4)} but calculated ${computed.toFixed(4)}.`,
      detail: `Levy: ${fmt(levy)} | AV: ${fmt(assessedValue)}`,
      remediation: 'Recalculate mill rate from levy and assessed value.',
    });
  }

  // Sanity bounds
  if (millRate <= 0) {
    results.push({
      id: 'MILL_RATE_ZERO',
      severity: SEVERITY.ERROR,
      category: 'tax_calculation',
      message: 'Mill rate is zero or negative — levy or assessed value may be missing.',
      remediation: 'Ensure total assessed value and tax levy are set in Model Settings.',
    });
  }

  if (millRate > 30) {
    results.push({
      id: 'MILL_RATE_HIGH',
      severity: SEVERITY.WARNING,
      category: 'tax_calculation',
      message: `Mill rate of ${millRate.toFixed(2)} exceeds 30 mills — well above Washington County norms.`,
      detail: 'Washington County municipalities typically range 10–22 mills.',
      remediation: 'Review expenditure growth assumptions and regional revenue projections.',
    });
  }

  if (currentMillRate && millRate > currentMillRate * 1.1) {
    results.push({
      id: 'MILL_RATE_INCREASE_10PCT',
      severity: SEVERITY.WARNING,
      category: 'tax_calculation',
      message: `Mill rate increases more than 10% over current rate (${currentMillRate} → ${millRate.toFixed(2)}).`,
      remediation: 'Consider phasing new expenditures or accelerating regional revenue capture.',
    });
  }

  if (legalMaxMillRate && millRate > legalMaxMillRate) {
    results.push({
      id: 'MILL_RATE_LEGAL_LIMIT',
      severity: SEVERITY.ERROR,
      category: 'tax_calculation',
      message: `Mill rate of ${millRate.toFixed(2)} exceeds legal maximum of ${legalMaxMillRate}.`,
      remediation: 'Reduce expenditures or obtain Town Meeting authorization to exceed limit.',
    });
  }

  return results;
}

/**
 * Validate that all major revenue categories are defined (non-zero)
 */
export function validateRevenueSources(revenue) {
  const results = [];
  const required = [
    { key: 'taxLevy', label: 'Property Tax Levy' },
    { key: 'stateSharing', label: 'State Revenue Sharing' },
    { key: 'fees', label: 'Fees & Charges' },
  ];

  required.forEach(({ key, label }) => {
    if (!revenue[key] || revenue[key] <= 0) {
      results.push({
        id: `REVENUE_MISSING_${key.toUpperCase()}`,
        severity: SEVERITY.ERROR,
        category: 'revenue_sources',
        message: `Revenue source "${label}" is undefined or zero.`,
        remediation: `Set ${label} in Model Settings or the financial assumptions.`,
      });
    }
  });

  // Warn if EMS billing is absent but transports are projected
  if (!revenue.emsBilling && revenue.emsTransports > 0) {
    results.push({
      id: 'REVENUE_EMS_BILLING_MISSING',
      severity: SEVERITY.WARNING,
      category: 'revenue_sources',
      message: 'EMS transports are projected but no EMS billing revenue is defined.',
      remediation: 'Set avg_revenue_per_transport and collection rates in Model Settings.',
    });
  }

  return results;
}

/**
 * Run all financial validations for a single projection year
 */
export function validateProjectionYear(yearData, settings = {}) {
  return [
    ...validateBudgetBalance(yearData.revenue?.total || 0, yearData.expenditures?.total || 0),
    ...validateTaxRate({
      millRate: yearData.tax?.millRate || 0,
      levy: yearData.tax?.requiredLevy || 0,
      assessedValue: settings.total_assessed_value || 198000000,
      currentMillRate: settings.current_mill_rate || 14.5,
    }),
    ...validateRevenueSources(yearData.revenue || {}),
  ];
}

const fmt = n => `$${Math.abs(n).toLocaleString()}`;