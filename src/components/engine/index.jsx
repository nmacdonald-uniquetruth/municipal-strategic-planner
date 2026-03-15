/**
 * Machias Financial Modeling Engine — Public API
 *
 * Import from this file to access all modeling utilities:
 *   import { runScenarioProjection, compareScenarios, calculateTaxRate, ... } from '@/components/engine';
 */

// Tax calculations
export {
  calculateTaxRate,
  calculatePropertyTaxBill,
  millRateDelta,
  projectTaxRates,
} from './taxCalculator';

// Service cost allocation
export {
  costPerResident,
  regionalContractRevenue,
  allocateSharedCost,
  netRegionalBenefit,
} from './serviceCostAllocator';

// Staffing cost model
export {
  fullyLoadedCost,
  projectStaffingCosts,
  eliminationSavings,
} from './staffingModel';

// Scenario projection & comparison
export {
  runScenarioProjection,
  compareScenarios,
  sensitivityAnalysis,
} from './scenarioEngine';

// Capital & debt
export {
  generateDebtSchedule,
  aggregateDebtService,
  scheduleCapitalProjects,
  MACHIAS_KNOWN_OBLIGATIONS,
  MACHIAS_CAPITAL_PLAN,
} from './capitalDebtModel';

// ── Convenience: default Machias baseline ────────────────────────────────────
export const MACHIAS_BASELINE = {
  annual_tax_levy: 2871000,
  total_assessed_value: 198000000,
  current_mill_rate: 14.5,
  state_sharing: 210000,
  fees_revenue: 525000,
  base_operating_expense: 2800000,
  annual_debt_service: 195000,
  wage_growth_rate: 0.04,
  enterprise_growth_rate: 0.03,
  ems_transports: 1648,
  avg_revenue_per_transport: 659,
  comstar_fee_rate: 0.0522,
  comstar_collection_rate: 0.874,
  inhouse_y1_rate: 0.855,
  inhouse_steady_rate: 0.90,
  transport_growth_rate: 0.02,
  ambulance_transfer: 45000,
  sewer_transfer: 21110,
  ts_transfer: 21000,
  telebusiness_transfer: 18525,
  court_st_transfer: 15600,
  stipend_elimination: 26000,
  airport_savings: 2527,
  control_risk_exposure: 56000,
  rb_annual_contract: 19000,
  machiasport_annual_contract: 20000,
  marshfield_annual_contract: 15000,
  whitneyville_annual_contract: 11000,
  northfield_annual_contract: 12000,
  erp_y1_cost: 47000,
  erp_ongoing_cost: 5000,
  erp_annual_value: 21000,
  sa_base_salary: 65000,
  bs_base_salary: 55000,
  ga_stipend: 10000,
  health_tier: 'family',
  fica_rate: 0.0765,
  icma_403b_match_rate: 0.05,
  wc_rate: 0.025,
  health_individual_annual: 17721,
  health_family_annual: 30938,
  gf_undesignated_balance: 2500000,
  ambulance_fund_balance: 500000,
  ambulance_loan_payoff: 130000,
};