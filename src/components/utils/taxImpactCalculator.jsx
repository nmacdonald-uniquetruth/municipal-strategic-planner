/**
 * taxImpactCalculator.js
 *
 * All mill-rate arithmetic now delegates to calculateMillRateImpact() in
 * modelUtils.js — the single canonical formula. This file only adds the
 * multi-year, comparison, break-even, and classification helpers that
 * consume that core function.
 */

import { calculateMillRateImpact, formatCurrency, formatMillRate, formatPercentage } from '../machias/modelUtils';

// Re-export formatting helpers (callers that imported them from here still work)
export { formatCurrency, formatMillRate, formatPercentage };

/**
 * Single-year tax impact.
 * `data.gross_cost` is the net cost change (positive = spending increase).
 * Pass revenue offsets, grants, and regional revenue as separate fields to
 * compute net_municipal_cost before hitting the mill rate formula.
 */
export function calculateTaxImpact(data, modelSettings) {
  const {
    gross_cost = 0,
    revenue_offsets = 0,
    grant_funding = 0,
    regional_service_revenue = 0,
  } = data;

  const net_municipal_cost = gross_cost - revenue_offsets - grant_funding - regional_service_revenue;

  return {
    gross_cost,
    revenue_offsets,
    grant_funding,
    regional_service_revenue,
    ...calculateMillRateImpact(net_municipal_cost, modelSettings),
  };
}

/**
 * Multi-year tax impact with optional per-year phasing overrides.
 */
export function calculateMultiYearTaxImpact(data, modelSettings, years = 5) {
  return Array.from({ length: years }, (_, i) => {
    const year = i + 1;
    const phase = data.phasing?.[year] ?? {};
    const pct   = phase.percentage ?? 1;

    return {
      year,
      phasing_notes: phase.notes ?? '',
      ...calculateTaxImpact(
        {
          gross_cost:               (phase.gross_cost               ?? data.gross_cost               ?? 0) * pct,
          revenue_offsets:          (phase.revenue_offsets          ?? data.revenue_offsets          ?? 0) * pct,
          grant_funding:            (phase.grant_funding            ?? data.grant_funding            ?? 0) * pct,
          regional_service_revenue: (phase.regional_service_revenue ?? data.regional_service_revenue ?? 0) * pct,
        },
        modelSettings,
      ),
    };
  });
}

/** Compare current vs proposed scenarios */
export function compareTaxImpacts(currentData, proposedData, modelSettings) {
  const current  = calculateTaxImpact(currentData,  modelSettings);
  const proposed = calculateTaxImpact(proposedData, modelSettings);

  return {
    current,
    proposed,
    changes: {
      net_cost_delta:       proposed.net_municipal_cost  - current.net_municipal_cost,
      mill_rate_delta:      proposed.mill_rate_change    - current.mill_rate_change,
      per_100k_delta:       proposed.per_100k_change     - current.per_100k_change,
      per_household_delta:  proposed.annual_per_household - current.annual_per_household,
      levy_delta:           proposed.tax_levy_change     - current.tax_levy_change,
    },
  };
}

/** Classify by cost/revenue profile */
export function classifyImpactType(impact) {
  const { net_municipal_cost, revenue_offsets, grant_funding, regional_service_revenue } = impact;
  if (net_municipal_cost < -50000) return 'revenue-generating';
  const totalOffsets = revenue_offsets + grant_funding + regional_service_revenue;
  if (totalOffsets > net_municipal_cost * 0.5) return 'offsettable';
  if (revenue_offsets > 0 || regional_service_revenue > 0) return 'phased';
  return 'immediate';
}

/** Break-even for revenue-generating initiatives */
export function calculateBreakEven(data) {
  const { gross_cost, annual_benefit } = data;
  if (!annual_benefit || annual_benefit <= 0) return null;
  const years = gross_cost / annual_benefit;
  return {
    break_even_years: years,
    payback_date: new Date(new Date().setFullYear(new Date().getFullYear() + Math.ceil(years))),
  };
}

/** Cumulative impact across a multi-year result set */
export function calculateCumulativeImpact(yearlyData) {
  let cumNet = 0;
  let cumLevy = 0;
  return yearlyData.map((yr) => {
    cumNet  += yr.net_municipal_cost;
    cumLevy += yr.tax_levy_change;
    return { ...yr, cumulative_net_cost: cumNet, cumulative_levy_change: cumLevy };
  });
}