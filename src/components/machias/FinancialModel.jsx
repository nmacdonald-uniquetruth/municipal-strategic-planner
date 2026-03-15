/**
 * FinancialModel.jsx — LEGACY SHIM
 *
 * runProForma() with hardcoded params is preserved only for ScenarioModeler's
 * slider-based what-if view. All other pages must use runProFormaFromSettings()
 * (FinancialModelV2) driven by ModelContext live settings.
 *
 * Do NOT add new calculations here. Centralise in FinancialModelV2 + ModelContext.
 */

import { DEFAULT_SETTINGS } from './ModelContext';
import { runProFormaFromSettings } from './FinancialModelV2';
import { calculateFullyLoadedCost } from './modelUtils';

export { calculateFullyLoadedCost as calculateFullyLoaded };

/** @deprecated Use runProFormaFromSettings(settings) with ModelContext instead */
export function runProForma(params = {}) {
  const {
    saBase,
    bsBase,
    gaStipend,
    wageGrowth,
    healthTier,
    regionalEnabled,
    tsExpansion,
    emsExternal,
    erpEnabled,
    erpY1Cost,
    erpOngoing,
    erpValue,
    comstarRate,
    transportGrowth,
    inhouseRate,
  } = params;

  // Map legacy slider param names → ModelContext setting names, then delegate
  // to the canonical function. Only defined overrides are applied.
  const overrides = {};
  if (saBase          != null) overrides.sa_base_salary        = saBase;
  if (bsBase          != null) overrides.bs_base_salary        = bsBase;
  if (gaStipend       != null) overrides.ga_stipend            = gaStipend;
  if (wageGrowth      != null) overrides.wage_growth_rate      = wageGrowth;
  if (healthTier      != null) overrides.health_tier           = healthTier;
  if (comstarRate     != null) overrides.comstar_fee_rate      = comstarRate;
  if (transportGrowth != null) overrides.transport_growth_rate = transportGrowth;
  if (inhouseRate     != null) overrides.inhouse_steady_rate   = inhouseRate;
  if (erpY1Cost       != null) overrides.erp_y1_cost           = erpY1Cost;
  if (erpOngoing      != null) overrides.erp_ongoing_cost      = erpOngoing;
  if (erpValue        != null) overrides.erp_annual_value      = erpValue;

  // Boolean toggles
  if (regionalEnabled != null) overrides.regional_services_enabled    = regionalEnabled;
  if (tsExpansion     != null) overrides.transfer_station_expansion   = tsExpansion;
  if (emsExternal     != null) overrides.ems_external_billing         = emsExternal;
  if (erpEnabled      != null) overrides.erp_implementation           = erpEnabled;

  return runProFormaFromSettings({ ...DEFAULT_SETTINGS, ...overrides });
}

export const PAYBACK_DATA = [
  { period: 'Q1 (M1-3)', costs: 12900, value: 10400, milestone: 'SA hired; ERP vendor selected' },
  { period: 'Q2 (M4-6)', costs: 77600, value: 58800, milestone: 'SA operational; overhead allocation begins' },
  { period: 'Q3 (M7-9)', costs: 54800, value: 68400, milestone: 'BS hired; Comstar parallel run' },
  { period: 'Q4 (M10-12)', costs: 57800, value: 92700, milestone: 'BS operational; Comstar cutover complete' },
  { period: 'Y2 H1', costs: 94000, value: 150300, milestone: 'Full contract year; EMS external client 1' },
  { period: 'Y2 H2', costs: 94500, value: 167100, milestone: 'TS Phase 1 active; Revenue Coord evaluation' },
];

export const ERP_PHASES = [
  { phase: 'Phase 0', name: 'Capacity Building', timing: 'FY2027 Q1-Q2', desc: 'SA hired. COA gap analysis. ERP requirements.', dependency: 'Staff Accountant hire' },
  { phase: 'Phase 1', name: 'Vendor Selection', timing: 'FY2027 Q3-Q4', desc: 'RFP/RFI. Evaluate platforms. Committee scores.', dependency: 'Phase 0 complete' },
  { phase: 'Budget', name: 'Budget Approval', timing: 'Town Meeting', desc: '$47K implementation; $24K designated fund offset.', dependency: 'Vendor selection complete' },
  { phase: 'Phase 2', name: 'COA Rebuild', timing: 'FY2028 Q1-Q2', desc: 'Align to Maine municipal COA standards.', dependency: 'Budget approved' },
  { phase: 'Phase 3', name: 'Payroll Integration', timing: 'FY2028 Q1-Q3', desc: 'School ERP data import. Shared payroll evaluation.', dependency: 'COA rebuild' },
  { phase: 'Phase 4', name: 'Go-Live', timing: 'FY2028 Q3-Q4', desc: 'Full ERP live. 60-90 day parallel period.', dependency: 'COA + Payroll ready' },
];

export const ENTERPRISE_FUNDS = [
  { fund: 'Ambulance', balance: 500000, transfer: 45000, loanPayoff: 130000, netBalance: 370000, status: 'HEALTHY', action: 'Increase to $65K Y2+' },
  { fund: 'Sewer', balance: -60200, transfer: 21110, loanPayoff: 0, netBalance: -60200, status: 'DEFICIT', action: 'Hold flat; address deficit' },
  { fund: 'Transfer Station', balance: -296245, transfer: 21000, loanPayoff: 0, netBalance: -296245, status: 'CRITICAL', action: 'Rebuild member revenue' },
  { fund: 'Telebusiness', balance: 14268, transfer: 18525, loanPayoff: 0, netBalance: 14268, status: 'MARGINAL', action: 'Evaluate enterprise exit' },
];

export const POSITIONS = [
  { title: 'Staff Accountant', base: 65000, loaded: 108061, hireMonth: 'Month 1-3', fund: 'General Fund', status: 'Phase 1' },
  { title: 'Billing Specialist', base: 55000, loaded: 96196, hireMonth: 'Month 7', fund: 'Ambulance Fund', status: 'Phase 1' },
  { title: 'GA Coordinator', base: 10000, loaded: 10000, hireMonth: 'Month 9', fund: 'General Fund', status: 'Phase 1' },
  { title: 'Revenue Coordinator', base: 39000, loaded: 39000, hireMonth: 'Year 3 Q1', fund: 'Regional Revenue', status: 'Trigger-based' },
  { title: 'Controller', base: 85000, loaded: 111375, hireMonth: 'Year 5 H2', fund: 'General Fund', status: 'Trigger-based' },
];