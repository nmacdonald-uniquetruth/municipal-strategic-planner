/**
 * FinancialModel.jsx — LEGACY SHIM
 *
 * runProForma() with hardcoded params is preserved only for ScenarioModeler's
 * slider-based what-if view. All other pages must use runProFormaFromSettings()
 * (FinancialModelV2) driven by ModelContext live settings.
 *
 * Do NOT add new calculations here. Centralise in FinancialModelV2 + ModelContext.
 */

// Re-export the canonical fully-loaded helper from ModelContext so nothing
// imports its own copy.
export { calculateFullyLoadedCost as calculateFullyLoaded } from './modelUtils';

// Kept only for ScenarioModeler slider overrides — merges overrides onto
// canonical defaults before calling FinancialModelV2.
import { DEFAULT_SETTINGS } from './ModelContext';
import { runProFormaFromSettings } from './FinancialModelV2';

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

  const saFL = calculateFullyLoaded(saBase, healthTier);
  const bsFL = calculateFullyLoaded(bsBase, healthTier);
  const years = [1, 2, 3, 4, 5];

  return years.map((yr) => {
    const escalator = Math.pow(1 + wageGrowth, yr - 1);
    const entEscalator = Math.pow(1 + BASE_DATA.enterprise_growth, yr - 1);

    // Position costs
    const saCost = yr === 1 ? saFL : saFL * escalator;
    const bsCost = yr === 1 ? bsFL * (6 / 12) : bsFL * escalator;
    const gaCost = yr === 1 ? gaStipend * (4 / 12) : gaStipend * Math.pow(1 + wageGrowth, yr - 1);
    const rcCost = yr >= 3 ? 39000 * Math.pow(1 + wageGrowth, yr - 3) : 0;
    const controllerCost = yr >= 5 ? 111375 * 0.5 : 0;
    const airportStipend = 2750;
    const implCost = yr === 1 ? 20000 : 5000;
    const totalCosts = saCost + bsCost + gaCost + rcCost + controllerCost + airportStipend + implCost;

    // Enterprise overhead
    const entTotal = Object.values(BASE_DATA.enterprise_transfers).reduce((s, v) => s + v, 0) * entEscalator;

    // FD/TM capacity
    const fdPct = yr === 1 ? 0.45 : yr === 2 ? 0.55 : 0.60;
    const tmPct = yr === 1 ? 0.18 : 0.22;
    const fdCapacity = BASE_DATA.fd_loaded * fdPct;
    const tmCapacity = BASE_DATA.tm_loaded * tmPct;

    // EMS
    const transports = BASE_DATA.ems_transports * Math.pow(1 + transportGrowth, yr - 1);
    const grossEms = transports * BASE_DATA.avg_revenue_per_transport;
    const comstarFeeAvoided = grossEms * BASE_DATA.comstar_collection_rate * comstarRate;
    const collectionImprovement = yr === 1 ? 0 : grossEms * (inhouseRate - BASE_DATA.comstar_collection_rate);

    // Stipends & control
    const stipendSavings = BASE_DATA.stipend_elimination;
    const airportSavings = BASE_DATA.airport_savings;
    const controlMit = yr === 1 ? BASE_DATA.control_risk_exposure * 0.5 : BASE_DATA.control_risk_exposure * 0.75;

    // Regional services
    let regionalRevenue = 0;
    if (regionalEnabled) {
      const rb = yr === 1 ? 19000 * (4 / 12) : 19000 * Math.pow(1.04, yr - 1);
      const mac = yr === 1 ? 20000 * (4 / 12) : 20000 * Math.pow(1.04, yr - 1);
      const marsh = yr >= 2 ? 15000 * Math.pow(1.04, yr - 2) : 0;
      const whit = yr >= 3 ? 11000 * Math.pow(1.04, yr - 3) : 0;
      const north = yr >= 3 ? 12000 * Math.pow(1.04, yr - 3) : 0;
      regionalRevenue = rb + mac + marsh + whit + north;
    }

    // EMS external billing
    const emsExternalRev = emsExternal ? [0, 15000, 30000, 45000, 55000][yr - 1] : 0;

    // Transfer station
    const tsRevenue = tsExpansion ? [8190, 52554, 109551, 74282, 131000][yr - 1] : 0;

    // ERP
    const erpCost = erpEnabled ? (yr === 1 ? erpY1Cost : erpOngoing) : 0;
    const erpVal = erpEnabled && yr >= 2 ? erpValue : 0;

    const structuralValue = entTotal + fdCapacity + tmCapacity + comstarFeeAvoided + collectionImprovement + stipendSavings + airportSavings + controlMit;
    const regionalTotal = regionalRevenue + emsExternalRev + tsRevenue;
    const totalValue = structuralValue + regionalTotal + erpVal;
    const totalAllCosts = totalCosts + erpCost;
    const netValue = totalValue - totalAllCosts;

    return {
      year: yr,
      fiscalYear: `FY${2026 + yr}`,
      costs: {
        staffAccountant: Math.round(saCost),
        billingSpecialist: Math.round(bsCost),
        gaCoordinator: Math.round(gaCost),
        revenueCoordinator: Math.round(rcCost),
        controller: Math.round(controllerCost),
        airportStipend,
        implementation: implCost,
        erp: erpCost,
        total: Math.round(totalAllCosts),
      },
      value: {
        enterpriseOverhead: Math.round(entTotal),
        fdCapacity: Math.round(fdCapacity),
        tmCapacity: Math.round(tmCapacity),
        comstarAvoided: Math.round(comstarFeeAvoided),
        collectionImprovement: Math.round(collectionImprovement),
        stipendSavings,
        airportSavings,
        controlRisk: Math.round(controlMit),
        regionalServices: Math.round(regionalRevenue),
        emsExternal: emsExternalRev,
        transferStation: tsRevenue,
        erpValue: erpVal,
        structuralTotal: Math.round(structuralValue),
        regionalTotal: Math.round(regionalTotal),
        total: Math.round(totalValue),
      },
      net: Math.round(netValue),
    };
  });
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