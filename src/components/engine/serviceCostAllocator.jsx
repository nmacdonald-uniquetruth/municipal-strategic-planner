/**
 * Service Cost Allocation Engine
 * CostPerResident = ServiceCost / PopulationServed
 * Revenue = ContractFeePerResident * PartnerTownPopulation
 */

/**
 * Calculate per-resident cost of a service
 */
export function costPerResident(serviceCost, population) {
  if (!population || population === 0) return 0;
  return parseFloat((serviceCost / population).toFixed(2));
}

/**
 * Calculate regional service contract revenue
 * @param {Array} partnerTowns - [{ name, population, contractFeePerResident, adoptionRate? }]
 * @returns {{ totalRevenue, byTown }}
 */
export function regionalContractRevenue(partnerTowns = []) {
  const byTown = partnerTowns.map(town => {
    const rate = town.adoptionRate ?? 1.0;
    const revenue = Math.round(town.contractFeePerResident * town.population * rate);
    return {
      name: town.name,
      population: town.population,
      feePerResident: town.contractFeePerResident,
      adoptionRate: rate,
      revenue,
    };
  });
  return {
    totalRevenue: byTown.reduce((s, t) => s + t.revenue, 0),
    byTown,
  };
}

/**
 * Allocate shared service cost across multiple towns by weight (population, usage, or equal share)
 * @param {number} totalCost
 * @param {Array} towns - [{ name, population, usageWeight? }]
 * @param {'per_capita'|'equal_share'|'weighted'} method
 */
export function allocateSharedCost(totalCost, towns = [], method = 'per_capita') {
  const totalPop = towns.reduce((s, t) => s + (t.population || 0), 0);
  const totalWeight = towns.reduce((s, t) => s + (t.usageWeight || 1), 0);

  return towns.map(town => {
    let share;
    if (method === 'equal_share') {
      share = towns.length > 0 ? totalCost / towns.length : 0;
    } else if (method === 'weighted') {
      share = totalWeight > 0 ? (totalCost * (town.usageWeight || 1)) / totalWeight : 0;
    } else {
      share = totalPop > 0 ? (totalCost * town.population) / totalPop : 0;
    }
    return {
      name: town.name,
      population: town.population,
      costShare: Math.round(share),
      costPerResident: town.population > 0 ? parseFloat((share / town.population).toFixed(2)) : 0,
    };
  });
}

/**
 * Net fiscal benefit to Machias of adding a regional service contract
 */
export function netRegionalBenefit({ contractRevenue, marginalDeliveryCost, adminOverhead = 0 }) {
  const net = contractRevenue - marginalDeliveryCost - adminOverhead;
  const margin = contractRevenue > 0 ? (net / contractRevenue) * 100 : 0;
  return {
    contractRevenue: Math.round(contractRevenue),
    marginalDeliveryCost: Math.round(marginalDeliveryCost),
    adminOverhead: Math.round(adminOverhead),
    netBenefit: Math.round(net),
    marginPct: parseFloat(margin.toFixed(1)),
  };
}