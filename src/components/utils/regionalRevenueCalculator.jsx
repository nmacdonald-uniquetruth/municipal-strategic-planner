/**
 * Regional Service Revenue Calculator
 * Projects revenue, costs, and net contribution from providing services to other towns
 */

export function calculateServiceRevenue(contract) {
  if (!contract || !contract.participating_towns) {
    return {
      gross_revenue: 0,
      service_cost: contract?.service_delivery_cost || 0,
      net_contribution: -(contract?.service_delivery_cost || 0),
    };
  }

  let grossRevenue = 0;

  switch (contract.pricing_model) {
    case 'fixed_fee':
      grossRevenue = (contract.fixed_fee || 0) * contract.participating_towns.length;
      break;

    case 'per_capita': {
      const totalPopulation = contract.participating_towns.reduce((sum, town) => sum + (town.population || 0), 0);
      grossRevenue = totalPopulation * (contract.per_capita_fee || 0);
      break;
    }

    case 'call_volume':
      grossRevenue = (contract.estimated_annual_calls || 0) * (contract.call_volume_rate || 0);
      break;

    case 'hourly':
      grossRevenue = (contract.estimated_annual_hours || 0) * (contract.hourly_rate || 0);
      break;

    case 'hybrid': {
      const baseComponent = (contract.hybrid_details?.base_fee || 0) * contract.participating_towns.length;
      let variableComponent = 0;

      if (contract.hybrid_details?.variable_component === 'per_capita') {
        const totalPopulation = contract.participating_towns.reduce((sum, town) => sum + (town.population || 0), 0);
        variableComponent = totalPopulation * (contract.hybrid_details?.variable_rate || 0);
      } else if (contract.hybrid_details?.variable_component === 'call_volume') {
        variableComponent = (contract.estimated_annual_calls || 0) * (contract.hybrid_details?.variable_rate || 0);
      }

      grossRevenue = baseComponent + variableComponent;
      break;
    }

    default:
      grossRevenue = 0;
  }

  const serviceCost = contract.service_delivery_cost || 0;
  const netContribution = grossRevenue - serviceCost;

  return {
    gross_revenue: grossRevenue,
    service_cost: serviceCost,
    net_contribution: netContribution,
    margin_percentage: serviceCost > 0 ? (netContribution / grossRevenue) * 100 : 0,
    active_towns: contract.participating_towns.filter((t) => t.status === 'active').length,
    total_towns: contract.participating_towns.length,
  };
}

/**
 * Calculate portfolio revenue across multiple services
 */
export function calculatePortfolioRevenue(contracts) {
  if (!contracts || contracts.length === 0) {
    return {
      total_gross_revenue: 0,
      total_service_cost: 0,
      total_net_contribution: 0,
      by_service: [],
    };
  }

  let totalGrossRevenue = 0;
  let totalServiceCost = 0;
  let totalNetContribution = 0;

  const byService = contracts.map((contract) => {
    const revenue = calculateServiceRevenue(contract);
    totalGrossRevenue += revenue.gross_revenue;
    totalServiceCost += revenue.service_cost;
    totalNetContribution += revenue.net_contribution;

    return {
      service_name: contract.service_name,
      service_type: contract.service_type,
      ...revenue,
    };
  });

  return {
    total_gross_revenue: totalGrossRevenue,
    total_service_cost: totalServiceCost,
    total_net_contribution: totalNetContribution,
    net_margin_percentage: totalGrossRevenue > 0 ? (totalNetContribution / totalGrossRevenue) * 100 : 0,
    by_service: byService,
  };
}

/**
 * Calculate multi-year revenue impact
 */
export function calculateMultiYearRevenue(contract, years = 5) {
  const yearlyData = [];

  for (let year = 1; year <= years; year++) {
    const contractForYear = {
      ...contract,
      startup_year: contract.startup_year || 1,
    };

    // If this year is before startup, no revenue
    if (year < contractForYear.startup_year) {
      yearlyData.push({
        year,
        gross_revenue: 0,
        service_cost: 0,
        net_contribution: 0,
        startup_cost: year === contractForYear.startup_year ? contract.startup_cost || 0 : 0,
        cumulative_net: 0,
      });
      continue;
    }

    const revenue = calculateServiceRevenue(contractForYear);
    const startupCost = year === contractForYear.startup_year ? contract.startup_cost || 0 : 0;
    const netContributionAfterStartup = revenue.net_contribution - startupCost;

    const previousCumulative = yearlyData[year - 2]?.cumulative_net || 0;
    const cumulativeNet = previousCumulative + netContributionAfterStartup;

    yearlyData.push({
      year,
      ...revenue,
      startup_cost: startupCost,
      cumulative_net: cumulativeNet,
    });
  }

  return yearlyData;
}

/**
 * Calculate revenue potential with adoption scenarios
 */
export function calculateAdoptionScenarios(contract) {
  const baseRevenue = calculateServiceRevenue(contract);

  // Conservative: only active towns
  const conservative = {
    scenario: 'conservative',
    participating_towns: contract.participating_towns.filter((t) => t.status === 'active'),
    gross_revenue: baseRevenue.gross_revenue * 0.7,
  };

  // Moderate: active + negotiating (50% adoption)
  const moderate = {
    scenario: 'moderate',
    participating_towns: contract.participating_towns.length,
    gross_revenue: baseRevenue.gross_revenue,
  };

  // Optimistic: all targets adopted
  const optimistic = {
    scenario: 'optimistic',
    participating_towns: (contract.target_towns?.length || contract.participating_towns.length) + 2,
    gross_revenue: baseRevenue.gross_revenue * 1.3,
  };

  return {
    conservative: { ...conservative, net_contribution: conservative.gross_revenue - contract.service_delivery_cost },
    moderate: { ...moderate, net_contribution: moderate.gross_revenue - contract.service_delivery_cost },
    optimistic: { ...optimistic, net_contribution: optimistic.gross_revenue - contract.service_delivery_cost },
  };
}

// Re-exported from canonical source — import from there directly in new code
export { formatCurrency } from '../machias/modelUtils';

/**
 * Format service type for display
 */
export function formatServiceType(type) {
  const labels = {
    ambulance_ems: 'Ambulance / EMS',
    policing: 'Policing',
    administrative_support: 'Administrative Support',
    public_works_support: 'Public Works Support',
    code_enforcement: 'Code Enforcement',
    shared_staffing: 'Shared Staffing',
    transfer_station: 'Transfer Station / Solid Waste',
    dispatch_communications: 'Dispatch / Communications',
  };
  return labels[type] || type;
}