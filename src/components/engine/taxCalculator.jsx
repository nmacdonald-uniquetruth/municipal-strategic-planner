/**
 * Tax Rate Calculation Engine
 * TaxRate = MunicipalBudget / TotalTaxableValue  (expressed as mills = rate * 1000)
 */

/**
 * Calculate mill rate from budget and assessed value
 * @param {number} totalBudget - Total municipal expenditures requiring tax levy
 * @param {number} nonTaxRevenue - Revenue from non-tax sources (state sharing, fees, etc.)
 * @param {number} totalAssessedValue - Total taxable assessed value
 * @returns {{ levy, millRate, ratePerThousand }}
 */
export function calculateTaxRate({ totalBudget, nonTaxRevenue = 0, totalAssessedValue }) {
  const levy = Math.max(0, totalBudget - nonTaxRevenue);
  const millRate = totalAssessedValue > 0 ? (levy / totalAssessedValue) * 1000 : 0;
  return {
    levy: Math.round(levy),
    millRate: parseFloat(millRate.toFixed(4)),
    ratePerThousand: parseFloat(millRate.toFixed(2)),
  };
}

/**
 * Calculate tax bill for a given property value
 */
export function calculatePropertyTaxBill(assessedValue, millRate) {
  return Math.round((assessedValue / 1000) * millRate);
}

/**
 * Calculate mill rate delta between two scenarios
 */
export function millRateDelta(baseMillRate, scenarioMillRate) {
  const delta = scenarioMillRate - baseMillRate;
  const pct = baseMillRate > 0 ? (delta / baseMillRate) * 100 : 0;
  return {
    delta: parseFloat(delta.toFixed(4)),
    direction: delta > 0 ? 'increase' : delta < 0 ? 'decrease' : 'unchanged',
    percentChange: parseFloat(pct.toFixed(2)),
    dollarImpactPerMedianHome: calculatePropertyTaxBill(170000, scenarioMillRate) - calculatePropertyTaxBill(170000, baseMillRate),
  };
}

/**
 * Project levy across multiple years with assessed value growth
 */
export function projectTaxRates({ baseLevy, assessedValue, levyGrowthRate = 0.02, assessedValueGrowthRate = 0.015, years = 5 }) {
  return Array.from({ length: years }, (_, i) => {
    const yr = i + 1;
    const projectedLevy = Math.round(baseLevy * Math.pow(1 + levyGrowthRate, yr - 1));
    const projectedAV = Math.round(assessedValue * Math.pow(1 + assessedValueGrowthRate, yr - 1));
    const millRate = projectedAV > 0 ? (projectedLevy / projectedAV) * 1000 : 0;
    return {
      year: yr,
      label: `FY${2026 + yr}`,
      levy: projectedLevy,
      assessedValue: projectedAV,
      millRate: parseFloat(millRate.toFixed(4)),
    };
  });
}