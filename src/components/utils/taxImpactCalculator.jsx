/**
 * Tax Impact Calculator
 * Calculates cascading tax effects from operational changes
 */

export function calculateTaxImpact(data, modelSettings) {
  const {
    gross_cost = 0,
    revenue_offsets = 0,
    grant_funding = 0,
    regional_service_revenue = 0,
    annual_tax_levy = modelSettings?.annual_tax_levy || 2871000,
    total_assessed_value = modelSettings?.total_assessed_value || 198000000,
    current_mill_rate = modelSettings?.current_mill_rate || 14.5,
  } = data;

  // Calculate net municipal cost
  const net_municipal_cost = gross_cost - revenue_offsets - grant_funding - regional_service_revenue;

  // Calculate tax levy change
  const tax_levy_change = net_municipal_cost;
  const new_tax_levy = annual_tax_levy + tax_levy_change;

  // Calculate mill rate change
  // mill_rate = (tax_levy / assessed_value) * 1000
  const new_mill_rate = (new_tax_levy / total_assessed_value) * 1000;
  const mill_rate_change = new_mill_rate - current_mill_rate;

  // Calculate per $100,000 valuation effect
  const per_100k_change = (mill_rate_change / 1000) * 100000;

  // Calculate average household impact (assume average home value of $250,000)
  const average_home_value = 250000;
  const annual_per_household = (mill_rate_change / 1000) * average_home_value;

  return {
    gross_cost,
    revenue_offsets,
    grant_funding,
    regional_service_revenue,
    net_municipal_cost,
    tax_levy_change,
    new_tax_levy,
    current_mill_rate,
    new_mill_rate,
    mill_rate_change,
    per_100k_change,
    annual_per_household,
    percentage_levy_change: (tax_levy_change / annual_tax_levy) * 100,
  };
}

/**
 * Calculate multi-year tax impact with phasing
 */
export function calculateMultiYearTaxImpact(data, modelSettings, years = 5) {
  const yearlyData = [];

  for (let year = 1; year <= years; year++) {
    const yearPhasing = data.phasing?.[year] || {};
    const yearGross = (yearPhasing.gross_cost || data.gross_cost || 0) * (yearPhasing.percentage || 1);
    const yearRevenue = (yearPhasing.revenue_offsets || data.revenue_offsets || 0) * (yearPhasing.percentage || 1);
    const yearGrant = (yearPhasing.grant_funding || data.grant_funding || 0) * (yearPhasing.percentage || 1);
    const yearRegional = (yearPhasing.regional_service_revenue || data.regional_service_revenue || 0) * (yearPhasing.percentage || 1);

    const impact = calculateTaxImpact(
      {
        gross_cost: yearGross,
        revenue_offsets: yearRevenue,
        grant_funding: yearGrant,
        regional_service_revenue: yearRegional,
        annual_tax_levy: modelSettings?.annual_tax_levy || 2871000,
        total_assessed_value: modelSettings?.total_assessed_value || 198000000,
        current_mill_rate: modelSettings?.current_mill_rate || 14.5,
      },
      modelSettings
    );

    yearlyData.push({
      year,
      ...impact,
      phasing_notes: yearPhasing.notes || '',
    });
  }

  return yearlyData;
}

/**
 * Compare current state vs proposed state
 */
export function compareTaxImpacts(currentData, proposedData, modelSettings) {
  const current = calculateTaxImpact(currentData, modelSettings);
  const proposed = calculateTaxImpact(proposedData, modelSettings);

  return {
    current,
    proposed,
    changes: {
      net_cost_delta: proposed.net_municipal_cost - current.net_municipal_cost,
      mill_rate_delta: proposed.mill_rate_change - current.mill_rate_change,
      per_100k_delta: proposed.per_100k_change - current.per_100k_change,
      per_household_delta: proposed.annual_per_household - current.annual_per_household,
      levy_delta: proposed.tax_levy_change - current.tax_levy_change,
    },
  };
}

/**
 * Classify impact type
 */
export function classifyImpactType(impact, threshold = 5000) {
  const { net_municipal_cost, revenue_offsets, grant_funding, regional_service_revenue } = impact;

  if (net_municipal_cost < -50000) {
    return 'revenue-generating';
  }

  const totalOffsets = revenue_offsets + grant_funding + regional_service_revenue;
  if (totalOffsets > net_municipal_cost * 0.5) {
    return 'offsettable';
  }

  if (revenue_offsets > 0 || regional_service_revenue > 0) {
    return 'phased';
  }

  return 'immediate';
}

/**
 * Calculate break-even point for revenue-generating initiatives
 */
export function calculateBreakEven(data, modelSettings) {
  const { gross_cost, annual_benefit } = data;

  if (annual_benefit <= 0) {
    return null;
  }

  return {
    break_even_years: gross_cost / annual_benefit,
    payback_date: new Date(new Date().setFullYear(new Date().getFullYear() + Math.ceil(gross_cost / annual_benefit))),
  };
}

/**
 * Calculate cumulative impact over multiple years
 */
export function calculateCumulativeImpact(yearlyData) {
  let cumulativeNetCost = 0;
  let cumulativeLevyChange = 0;

  const cumulative = yearlyData.map((year) => {
    cumulativeNetCost += year.net_municipal_cost;
    cumulativeLevyChange += year.tax_levy_change;

    return {
      ...year,
      cumulative_net_cost: cumulativeNetCost,
      cumulative_levy_change: cumulativeLevyChange,
    };
  });

  return cumulative;
}

/**
 * Format currency for display
 */
export function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format mill rate for display
 */
export function formatMillRate(value) {
  return `${value.toFixed(3)}M`;
}

/**
 * Format percentage for display
 */
export function formatPercentage(value) {
  return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
}