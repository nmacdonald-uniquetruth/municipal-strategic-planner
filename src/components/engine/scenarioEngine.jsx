/**
 * Scenario Projection Engine
 * 5-year financial outlook: operating budget, capital, debt service, tax impact
 * Supports comparison of multiple strategic scenarios.
 */

import { calculateTaxRate, millRateDelta } from './taxCalculator';
import { netRegionalBenefit } from './serviceCostAllocator';

/**
 * Run a full 5-year projection for a single scenario
 * @param {object} scenario - scenario configuration
 * @param {object} baseline - baseline settings (from ModelSettings entity)
 */
export function runScenarioProjection(scenario, baseline) {
  const s = { ...baseline, ...scenario };
  const years = s.projectionYears || 5;
  const wg = s.wageGrowthRate || 0.04;
  const eg = s.enterpriseGrowthRate || 0.03;

  return Array.from({ length: years }, (_, i) => {
    const yr = i + 1;
    const esc = v => Math.round(v * Math.pow(1 + wg, yr - 1));
    const entEsc = v => Math.round(v * Math.pow(1 + eg, yr - 1));

    // ── Revenue ─────────────────────────────────────────────────────────────
    const baseLevy = s.annual_tax_levy || 2871000;
    const stateSharing = esc(s.state_sharing || 210000);
    const fees = esc(s.fees_revenue || 525000);

    // EMS billing
    const transports = (s.ems_transports || 1648) * Math.pow(1 + (s.transport_growth_rate || 0.02), yr - 1);
    const avgRevPerTransport = s.avg_revenue_per_transport || 659;
    const comstarRate = s.comstar_fee_rate || 0.0522;
    const comstarCollectionRate = s.comstar_collection_rate || 0.874;
    const inhouseRate = yr === 1 ? (s.inhouse_y1_rate || 0.855) : (s.inhouse_steady_rate || 0.90);
    const emsGross = transports * avgRevPerTransport;
    const comstarAvoided = Math.round(emsGross * comstarRate);
    const collectionGain = Math.round(emsGross * (inhouseRate - comstarCollectionRate));
    const emsBillingRevenue = Math.round(emsGross * inhouseRate);

    // Enterprise fund overhead transfers
    const enterpriseTransfers = entEsc(
      (s.ambulance_transfer || 45000) +
      (s.sewer_transfer || 21110) +
      (s.ts_transfer || 21000) +
      (s.telebusiness_transfer || 18525) +
      (s.court_st_transfer || 15600)
    );

    // Regional service contracts
    const rbRevenue = yr === 1
      ? Math.round((s.rb_annual_contract || 19000) * (4 / 12))
      : Math.round((s.rb_annual_contract || 19000) * Math.pow(1.04, yr - 1));
    const macRevenue = yr === 1
      ? Math.round((s.machiasport_annual_contract || 20000) * (4 / 12))
      : Math.round((s.machiasport_annual_contract || 20000) * Math.pow(1.04, yr - 1));
    const marshRevenue = yr >= 2 ? Math.round((s.marshfield_annual_contract || 15000) * Math.pow(1.04, yr - 2)) : 0;
    const whitRevenue = yr >= 3 ? Math.round((s.whitneyville_annual_contract || 11000) * Math.pow(1.04, yr - 3)) : 0;
    const northRevenue = yr >= 3 ? Math.round((s.northfield_annual_contract || 12000) * Math.pow(1.04, yr - 3)) : 0;
    const regionalContracts = rbRevenue + macRevenue + marshRevenue + whitRevenue + northRevenue;

    // Transfer station
    const transferStationRevenue = [8190, 52554, 109551, 74282, 131000][yr - 1] || 0;

    // ERP value
    const erpValue = yr >= 2 ? (s.erp_annual_value || 21000) : 0;

    // Stipend elimination savings
    const stipendSavings = yr === 1 && s.y1_staffing_model === 'parttime_stipend'
      ? 0
      : (s.stipend_elimination || 26000);
    const airportSavings = s.airport_savings || 2527;
    const controlRisk = yr === 1
      ? Math.round((s.control_risk_exposure || 56000) * 0.5)
      : Math.round((s.control_risk_exposure || 56000) * 0.75);

    const totalRevenue = baseLevy + stateSharing + fees + enterpriseTransfers +
      regionalContracts + transferStationRevenue + erpValue + stipendSavings +
      airportSavings + controlRisk + comstarAvoided + collectionGain;

    // ── Operating Expenditures ───────────────────────────────────────────────
    const healthAnnual = (s.health_tier === 'individual'
      ? (s.health_individual_annual || 17721)
      : (s.health_family_annual || 30938));
    const fl = base => {
      const icmaRate = s.icma_403b_match_rate || 0.05;
      const fica = base * (s.fica_rate || 0.0765);
      const icma = base * icmaRate;
      const wc = base * (s.wc_rate || 0.025);
      return Math.round(base + fica + icma + wc + healthAnnual);
    };

    const saCost = esc(fl(s.sa_base_salary || 65000));
    const bsCost = yr === 1
      ? Math.round(fl(s.bs_base_salary || 55000) * (6 / 12))
      : esc(fl(s.bs_base_salary || 55000));
    const gaCost = yr === 1
      ? Math.round((s.ga_stipend || 10000) * (4 / 12))
      : (s.ga_stipend || 10000);
    const erpCost = yr === 1 ? (s.erp_y1_cost || 47000) : (s.erp_ongoing_cost || 5000);
    const baseOperating = esc(s.base_operating_expense || 2800000);
    const totalOperating = baseOperating + saCost + bsCost + gaCost + erpCost;

    // ── Capital Spending ─────────────────────────────────────────────────────
    const capitalPlan = s.capitalPlan || [];
    const capitalThisYear = capitalPlan
      .filter(c => c.year === yr)
      .reduce((sum, c) => sum + (c.amount || 0), 0);

    // ── Debt Service ─────────────────────────────────────────────────────────
    const debtSchedule = s.debtSchedule || [];
    const debtThisYear = debtSchedule.length > 0
      ? debtSchedule[yr - 1] || 0
      : (s.annual_debt_service || 195000);

    // ── Net / Tax Impact ─────────────────────────────────────────────────────
    const totalExpenditures = totalOperating + capitalThisYear + debtThisYear;
    const requiredLevy = Math.max(0, totalExpenditures - (totalRevenue - baseLevy));
    const { millRate } = calculateTaxRate({
      totalBudget: totalExpenditures,
      nonTaxRevenue: totalRevenue - baseLevy,
      totalAssessedValue: s.total_assessed_value || 198000000,
    });

    const net = Math.round(totalRevenue - totalExpenditures);
    const gfLevyImpact = Math.round(requiredLevy - baseLevy);

    return {
      year: yr,
      label: `FY${2026 + yr}`,
      revenue: {
        taxLevy: baseLevy,
        stateSharing,
        fees,
        enterpriseTransfers,
        regionalContracts,
        transferStationRevenue,
        emsBilling: emsBillingRevenue,
        comstarAvoided,
        collectionGain,
        erpValue,
        stipendSavings,
        airportSavings,
        controlRisk,
        total: totalRevenue,
      },
      expenditures: {
        baseOperating,
        newStaffing: saCost + bsCost + gaCost,
        erpCost,
        capital: capitalThisYear,
        debtService: debtThisYear,
        total: totalExpenditures,
      },
      net,
      tax: {
        requiredLevy,
        millRate,
        gfLevyImpact,
        millImpactVsBaseline: millRate - (s.current_mill_rate || 14.5),
      },
    };
  });
}

/**
 * Compare multiple scenarios side by side
 * Returns a comparison matrix indexed by year then metric
 */
export function compareScenarios(scenarios, baseline) {
  const projections = scenarios.map(sc => ({
    id: sc.id || sc.name,
    name: sc.name,
    description: sc.description,
    type: sc.type,
    years: runScenarioProjection(
      {
        ...(sc.financial_assumptions || {}),
        ...(sc.staffing_assumptions || {}),
        ...(sc.operational_assumptions || {}),
        ...(sc.regional_assumptions || {}),
      },
      baseline
    ),
  }));

  // Build comparison matrix: for each year, show all scenario values
  const years = projections[0]?.years?.length || 5;
  const matrix = Array.from({ length: years }, (_, i) => {
    const yr = i + 1;
    return {
      year: yr,
      label: `FY${2026 + yr}`,
      scenarios: projections.map(p => {
        const y = p.years[i];
        return {
          id: p.id,
          name: p.name,
          type: p.type,
          net: y.net,
          millRate: y.tax.millRate,
          levyImpact: y.tax.gfLevyImpact,
          totalRevenue: y.revenue.total,
          totalExpenditures: y.expenditures.total,
          regionalContracts: y.revenue.regionalContracts,
          newStaffingCost: y.expenditures.newStaffing,
        };
      }),
    };
  });

  // 5-year cumulative summary per scenario
  const cumulativeSummary = projections.map(p => ({
    id: p.id,
    name: p.name,
    type: p.type,
    cumulativeNet: p.years.reduce((s, y) => s + y.net, 0),
    avgMillRate: parseFloat((p.years.reduce((s, y) => s + y.tax.millRate, 0) / years).toFixed(4)),
    totalRegionalRevenue: p.years.reduce((s, y) => s + y.revenue.regionalContracts, 0),
    totalNewStaffingCost: p.years.reduce((s, y) => s + y.expenditures.newStaffing, 0),
    yr5Net: p.years[years - 1]?.net,
    yr5MillRate: p.years[years - 1]?.tax.millRate,
  }));

  return { projections, matrix, cumulativeSummary };
}

/**
 * Quick sensitivity: run the same scenario across a range of one parameter
 */
export function sensitivityAnalysis(baseScenario, baseline, paramKey, paramRange) {
  return paramRange.map(value => {
    const modified = { ...baseScenario, [paramKey]: value };
    const years = runScenarioProjection(modified, baseline);
    return {
      paramValue: value,
      yr1Net: years[0].net,
      yr3Net: years[2].net,
      yr5Net: years[4].net,
      yr5MillRate: years[4].tax.millRate,
      cumulativeNet: years.reduce((s, y) => s + y.net, 0),
    };
  });
}