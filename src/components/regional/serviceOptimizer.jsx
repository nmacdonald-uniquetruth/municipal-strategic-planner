/**
 * Regional Service Optimization Engine
 * Pure calculation functions — no React, no imports from components.
 */

// ── Service catalogue ─────────────────────────────────────────────────────────
// Each service definition describes what Machias can offer, staffing requirements,
// marginal delivery cost, and coverage radius.
export const MACHIAS_SERVICES = {
  financial_administration: {
    id: 'financial_administration',
    label: 'Financial Administration',
    icon: '🏛️',
    category: 'administrative',
    machinasCapacityNeeded: 'Staff Accountant (partial)',
    hoursPerTownPerMonth: 10,
    staffLevel: 'staff_accountant',
    marginalCostPerTown: 7500,      // annual marginal delivery cost
    baseAnnualFee: 18000,
    coverageRadiusMiles: 30,
    minPopulation: 0,
    maxTownsAtLaunch: 3,
    scalingTrigger: 'revenue_coordinator_at_4_towns',
    notes: 'Bookkeeping, warrant prep, payroll, budget support',
  },
  ems_billing: {
    id: 'ems_billing',
    label: 'EMS Billing Services',
    icon: '🚑',
    category: 'ambulance',
    machinasCapacityNeeded: 'Billing Specialist (partial)',
    hoursPerTownPerMonth: 6,
    staffLevel: 'billing_specialist',
    marginalCostPerTown: 5000,
    baseAnnualFee: 15000,
    coverageRadiusMiles: 40,
    minPopulation: 0,
    maxTownsAtLaunch: 2,
    scalingTrigger: 'billing_specialist_at_steady_state',
    notes: 'Outsourced EMS billing at below-Comstar rates',
  },
  transfer_station: {
    id: 'transfer_station',
    label: 'Transfer Station Access',
    icon: '♻️',
    category: 'public_works',
    machinasCapacityNeeded: 'Transfer Station staff (existing)',
    hoursPerTownPerMonth: 0,
    staffLevel: 'transfer_station',
    marginalCostPerTown: 4000,
    baseAnnualFee: 12000,
    coverageRadiusMiles: 20,
    minPopulation: 0,
    maxTownsAtLaunch: 5,
    scalingTrigger: null,
    notes: 'Tipping fee contracts; per-ton pricing available',
  },
  ambulance_coverage: {
    id: 'ambulance_coverage',
    label: 'Ambulance / EMS Coverage',
    icon: '🚒',
    category: 'ambulance',
    machinasCapacityNeeded: 'EMS crews (existing)',
    hoursPerTownPerMonth: 0,
    staffLevel: 'ems_crew',
    marginalCostPerTown: 8000,
    baseAnnualFee: 20000,
    coverageRadiusMiles: 25,
    minPopulation: 0,
    maxTownsAtLaunch: 4,
    scalingTrigger: null,
    notes: 'Interlocal coverage agreements; response time SLAs',
  },
  code_enforcement: {
    id: 'code_enforcement',
    label: 'Code Enforcement',
    icon: '📋',
    category: 'administrative',
    machinasCapacityNeeded: 'Code Enforcement Officer (partial)',
    hoursPerTownPerMonth: 4,
    staffLevel: 'code_officer',
    marginalCostPerTown: 3000,
    baseAnnualFee: 6000,
    coverageRadiusMiles: 20,
    minPopulation: 0,
    maxTownsAtLaunch: 4,
    scalingTrigger: null,
    notes: 'Shared CEO inspections and permit reviews',
  },
  assessing: {
    id: 'assessing',
    label: 'Property Assessing',
    icon: '🏠',
    category: 'administrative',
    machinasCapacityNeeded: 'Contracted Assessor',
    hoursPerTownPerMonth: 5,
    staffLevel: 'assessor',
    marginalCostPerTown: 4500,
    baseAnnualFee: 10000,
    coverageRadiusMiles: 30,
    minPopulation: 0,
    maxTownsAtLaunch: 6,
    scalingTrigger: null,
    notes: 'Annual revaluation, abatements, BETE/BETR filings',
  },
};

// ── Cost per resident ──────────────────────────────────────────────────────────
export function costPerResident(serviceCost, population) {
  if (!population || population === 0) return 0;
  return parseFloat((serviceCost / population).toFixed(2));
}

// ── Estimate coverage area ─────────────────────────────────────────────────────
/**
 * Given a set of towns and a service definition, return which towns fall within
 * coverage radius and have no known barrier.
 */
export function estimateCoverageArea(towns, serviceId) {
  const svc = MACHIAS_SERVICES[serviceId];
  if (!svc) return [];
  return towns.filter(t =>
    t.distance_from_machias_miles <= svc.coverageRadiusMiles &&
    t.population >= (svc.minPopulation || 0) &&
    t.name !== 'Machias'
  ).map(t => ({
    ...t,
    withinCoverage: true,
    distanceOk: t.distance_from_machias_miles <= svc.coverageRadiusMiles,
    estimatedFee: estimateFeeForTown(t, svc),
    marginalCost: svc.marginalCostPerTown,
    netBenefit: estimateFeeForTown(t, svc) - svc.marginalCostPerTown,
    cprMachias: costPerResident(svc.marginalCostPerTown, t.population),
    cprTown: costPerResident(estimateFeeForTown(t, svc), t.population),
  }));
}

// ── Fee estimation ─────────────────────────────────────────────────────────────
function estimateFeeForTown(town, svc) {
  // Fee scales modestly with population (larger towns → slightly higher fee)
  const popFactor = Math.min(1.5, Math.max(0.7, town.population / 500));
  return Math.round(svc.baseAnnualFee * popFactor);
}

// ── Scenario comparison: with vs without regionalization ──────────────────────
/**
 * Compare a 5-year financial outlook with and without a set of regional services.
 * @param {object} baseSettings  - from ModelSettings (MACHIAS_BASELINE)
 * @param {Array}  selectedTowns - town records with chosen services
 * @param {Array}  serviceIds    - which services to model
 * @param {number} years
 */
export function compareRegionalizationScenarios(baseSettings, selectedTowns, serviceIds, years = 5) {
  const annualRevenue = calcAnnualRegionalRevenue(selectedTowns, serviceIds, baseSettings);
  const annualCost = calcAnnualRegionalCost(selectedTowns, serviceIds, baseSettings);
  const netPerYear = annualRevenue - annualCost;

  const withRegional = [];
  const withoutRegional = [];

  for (let yr = 1; yr <= years; yr++) {
    // Ramp: partial year 1 (4/12), full from yr 2, +4% annual growth
    const rampFactor = yr === 1 ? 4 / 12 : Math.pow(1.04, yr - 1);
    const revThisYear = Math.round(annualRevenue * rampFactor);
    const costThisYear = Math.round(annualCost * (yr === 1 ? 4 / 12 : 1));
    const netThisYear = revThisYear - costThisYear;
    const baseLevy = baseSettings.annual_tax_levy || 2871000;

    withRegional.push({
      year: yr,
      label: `FY${2026 + yr}`,
      revenue: revThisYear,
      cost: costThisYear,
      net: netThisYear,
      levyImpact: -netThisYear, // negative = levy reduction
    });

    withoutRegional.push({
      year: yr,
      label: `FY${2026 + yr}`,
      revenue: 0,
      cost: 0,
      net: 0,
      levyImpact: 0,
    });
  }

  const cumWithRevenue = withRegional.reduce((s, y) => s + y.revenue, 0);
  const cumWithCost = withRegional.reduce((s, y) => s + y.cost, 0);
  const cumNet = withRegional.reduce((s, y) => s + y.net, 0);

  // Staffing impact: how many additional FTE needed?
  const staffingImpact = calcStaffingImpact(selectedTowns, serviceIds, baseSettings);

  return {
    withRegional,
    withoutRegional,
    summary: {
      totalRevenue5yr: cumWithRevenue,
      totalCost5yr: cumWithCost,
      netBenefit5yr: cumNet,
      yr1Revenue: withRegional[0].revenue,
      yr3Revenue: withRegional[2]?.revenue || 0,
      yr5Revenue: withRegional[4]?.revenue || 0,
      townsServed: selectedTowns.length,
      servicesOffered: serviceIds.length,
    },
    staffingImpact,
    millRateReduction: (baseSettings.total_assessed_value || 198000000) > 0
      ? parseFloat((cumNet / 5 / (baseSettings.total_assessed_value || 198000000) * 1000).toFixed(4))
      : 0,
  };
}

function calcAnnualRegionalRevenue(towns, serviceIds, settings) {
  return towns.reduce((sum, town) => {
    return sum + serviceIds.reduce((s, sid) => {
      const svc = MACHIAS_SERVICES[sid];
      if (!svc) return s;
      // Use model setting if available, else estimate
      const settingKey = `${town.name.toLowerCase().replace(/ /g, '')}_annual_contract`;
      return s + (settings[settingKey] || estimateFeeForTown(town, svc));
    }, 0);
  }, 0);
}

function calcAnnualRegionalCost(towns, serviceIds, settings) {
  return serviceIds.reduce((sum, sid) => {
    const svc = MACHIAS_SERVICES[sid];
    if (!svc) return sum;
    return sum + svc.marginalCostPerTown * towns.length;
  }, 0);
}

function calcStaffingImpact(towns, serviceIds, settings) {
  const totalHoursPerMonth = towns.length * serviceIds.reduce((s, sid) => {
    return s + (MACHIAS_SERVICES[sid]?.hoursPerTownPerMonth || 0);
  }, 0);

  const ftesNeeded = parseFloat((totalHoursPerMonth / 160).toFixed(2)); // 160 hrs = 1 FTE month
  const triggers = serviceIds
    .map(sid => MACHIAS_SERVICES[sid]?.scalingTrigger)
    .filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i);

  return {
    additionalHoursPerMonth: Math.round(totalHoursPerMonth),
    additionalFTEsNeeded: ftesNeeded,
    triggers,
    canHandleWithCurrent: ftesNeeded <= 0.5,
    requiresNewHire: ftesNeeded > 1.0,
    note: ftesNeeded <= 0.5
      ? 'Manageable within current staff capacity'
      : ftesNeeded <= 1.0
        ? 'Near capacity — monitor workload and plan Revenue Coordinator hire'
        : 'Exceeds current capacity — Revenue Coordinator hire required',
  };
}