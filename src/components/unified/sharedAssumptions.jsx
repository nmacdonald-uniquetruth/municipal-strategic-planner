/**
 * sharedAssumptions.js
 *
 * Centralises assumption loading/normalisation for the unified proposal system.
 * Fully-loaded cost and mill-rate helpers are imported from modelUtils — do NOT
 * redefine them here.
 */

import { calculateMillRateImpact, healthCostForTier } from '../machias/modelUtils';

// Re-export canonical helpers so callers that import from here still compile
export { calculateFullyLoadedCost } from '../machias/modelUtils';

/** Health cost by tier — thin wrapper around canonical helper */
export function calculateHealthInsuranceCost(tier, assumptions) {
  return healthCostForTier(tier, assumptions);
}

/**
 * Load shared assumptions from ModelSettings entity
 */
export const loadSharedAssumptions = async (base44) => {
  try {
    const settings = await base44.entities.ModelSettings.list();
    const activeSetting = settings.find(s => s.key === 'active') || settings[0];
    
    if (!activeSetting) return getDefaultAssumptions();
    
    return normalizeAssumptions(activeSetting);
  } catch (error) {
    console.warn('Failed to load shared assumptions, using defaults:', error);
    return getDefaultAssumptions();
  }
};

/**
 * Get default assumptions
 */
export const getDefaultAssumptions = () => ({
  // Fiscal
  fiscal_year_start: '2026-07-01',
  total_assessed_value: 198000000,
  current_mill_rate: 14.5,
  annual_tax_levy: 2871000,
  undesignated_fund_balance: 2500000,
  
  // Staffing
  wage_growth_rate: 0.04,
  fica_rate: 0.0765,
  pers_rate: 0.085,
  icma_403b_match_rate: 0.05,
  workers_comp_rate: 0.025,
  
  // Health insurance
  health_individual_annual: 17721,
  health_family_annual: 30938,
  health_tier_default: 'family',
  
  // EMS billing
  ems_transports_annual: 1648,
  avg_revenue_per_transport: 659,
  comstar_fee_rate: 0.0522,
  comstar_collection_rate: 0.874,
  inhouse_collection_rate: 0.9,
  transport_growth_rate: 0.02,
  
  // Regional services
  regional_adoption_base_rate: 0.5,
  regional_revenue_growth_rate: 0.05,
  
  // ERP
  erp_implementation_cost: 47000,
  erp_ongoing_annual_cost: 5000,
  erp_annual_value: 21000,
  
  // Enterprise funds
  ambulance_fund_balance: 500000,
  ambulance_loan_payoff: 130000,
  sewer_transfer: 21110,
  transfer_station_transfer: 21000,
  enterprise_growth_rate: 0.03
});

/**
 * Normalize assumptions from database format
 */
const normalizeAssumptions = (dbRecord) => {
  return {
    fiscal_year_start: dbRecord.start_date || '2026-07-01',
    total_assessed_value: dbRecord.total_assessed_value || 198000000,
    current_mill_rate: dbRecord.current_mill_rate || 14.5,
    annual_tax_levy: dbRecord.annual_tax_levy || 2871000,
    undesignated_fund_balance: dbRecord.gf_undesignated_balance || 2500000,
    
    wage_growth_rate: dbRecord.wage_growth_rate || 0.04,
    fica_rate: dbRecord.fica_rate || 0.0765,
    pers_rate: dbRecord.pers_rate || 0.085,
    icma_403b_match_rate: dbRecord.icma_403b_match_rate || 0.05,
    workers_comp_rate: dbRecord.wc_rate || 0.025,
    
    health_individual_annual: dbRecord.health_individual_annual || 17721,
    health_family_annual: dbRecord.health_family_annual || 30938,
    health_tier_default: 'family',
    
    ems_transports_annual: dbRecord.ems_transports || 1648,
    avg_revenue_per_transport: dbRecord.avg_revenue_per_transport || 659,
    comstar_fee_rate: dbRecord.comstar_fee_rate || 0.0522,
    comstar_collection_rate: dbRecord.comstar_collection_rate || 0.874,
    inhouse_collection_rate: dbRecord.inhouse_steady_rate || 0.9,
    transport_growth_rate: dbRecord.transport_growth_rate || 0.02,
    
    regional_adoption_base_rate: 0.5,
    regional_revenue_growth_rate: 0.05,
    
    erp_implementation_cost: dbRecord.erp_y1_cost || 47000,
    erp_ongoing_annual_cost: dbRecord.erp_ongoing_cost || 5000,
    erp_annual_value: dbRecord.erp_annual_value || 21000,
    
    ambulance_fund_balance: dbRecord.ambulance_fund_balance || 500000,
    ambulance_loan_payoff: dbRecord.ambulance_loan_payoff || 130000,
    sewer_transfer: dbRecord.sewer_transfer || 21110,
    transfer_station_transfer: dbRecord.ts_transfer || 21000,
    enterprise_growth_rate: dbRecord.enterprise_growth_rate || 0.03
  };
};

// (calculateHealthInsuranceCost and calculateFullyLoadedCost defined above via imports)

/**
 * Project salary over N years with growth
 */
export const projectSalary = (baseSalary, years, growthRate) => {
  const projections = [];
  let current = baseSalary;
  
  for (let year = 1; year <= years; year++) {
    projections.push({
      year,
      salary: current
    });
    current = current * (1 + growthRate);
  }
  
  return projections;
};

/**
 * Calculate EMS revenue impact
 */
export const calculateEMSRevenue = (
  transportGrowth,
  years,
  sharedAssumptions
) => {
  const baseAnnual = sharedAssumptions.ems_transports_annual *
                     sharedAssumptions.avg_revenue_per_transport;
  
  const grossRevenue = baseAnnual *
                      (1 + sharedAssumptions.comstar_fee_rate) *
                      sharedAssumptions.comstar_collection_rate;
  
  const netRevenue = grossRevenue * sharedAssumptions.inhouse_collection_rate;
  
  const projections = [];
  let current = netRevenue;
  
  for (let year = 1; year <= years; year++) {
    projections.push({
      year,
      transports: sharedAssumptions.ems_transports_annual * 
                 Math.pow(1 + transportGrowth, year - 1),
      gross_revenue: grossRevenue *
                    Math.pow(1 + transportGrowth, year - 1),
      net_revenue: netRevenue *
                  Math.pow(1 + transportGrowth, year - 1)
    });
  }
  
  return projections;
};

/**
 * Calculate regional services revenue
 */
export const calculateRegionalServicesRevenue = (
  targetMunicipalities,
  adoptionRate,
  years,
  sharedAssumptions
) => {
  const baseRevenuePerMuni = 15000; // Conservative average
  
  const projections = [];
  let activeParticipants = Math.round(targetMunicipalities.length * adoptionRate);
  
  for (let year = 1; year <= years; year++) {
    const yearRevenue = activeParticipants * baseRevenuePerMuni *
                       Math.pow(1 + sharedAssumptions.regional_revenue_growth_rate, year - 1);
    
    projections.push({
      year,
      active_participants: activeParticipants,
      annual_revenue: yearRevenue
    });
    
    // Gradual adoption over time
    if (year < years) {
      const additionalAdoption = Math.max(0, 
        Math.round((targetMunicipalities.length * adoptionRate) / years)
      );
      activeParticipants = Math.min(
        targetMunicipalities.length,
        activeParticipants + additionalAdoption
      );
    }
  }
  
  return projections;
};

/**
 * Calculate tax impact from financial impact
 */
export const calculateTaxImpactFromAssumptions = (
  annualImpact,
  sharedAssumptions
) => {
  const millRateChange = (annualImpact / sharedAssumptions.total_assessed_value) * 1000;
  
  return {
    annual_impact: annualImpact,
    mill_rate_change: -millRateChange,
    tax_levy_change: annualImpact,
    new_mill_rate: sharedAssumptions.current_mill_rate - millRateChange
  };
};

/**
 * Update assumptions for a scenario
 */
export const updateScenarioAssumptions = (scenario, updates) => {
  return {
    ...scenario,
    financial_assumptions: {
      ...scenario.financial_assumptions,
      ...updates
    }
  };
};