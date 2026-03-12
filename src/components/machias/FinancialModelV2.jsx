// Financial model driven by live settings from ModelContext
export function runProFormaFromSettings(settings) {
  const s = settings;

  const healthAnnual = s.health_tier === 'individual' ? s.health_individual_annual : s.health_family_annual;

  function fl(base, isStipend = false) {
    if (isStipend) return base;
    const fica = base * s.fica_rate;
    const icmaRate = s.icma_403b_match_rate ?? 0.05;
    const icma = base * icmaRate;
    const wc = base * s.wc_rate;
    return Math.round(base + fica + icma + wc + healthAnnual);
  }

  const saFL = fl(s.sa_base_salary);
  const bsFL = fl(s.bs_base_salary);
  const gaFL = s.ga_stipend;
  const rcFL = fl(s.rc_base_salary);
  const ctrlFL = fl(s.controller_base_salary);
  const wg = s.wage_growth_rate;

  // Part-time Y1 model: in Y1, instead of a full-time SA, a part-time contractor covers
  // GA duties + accounting support funded by the GA stipend + reallocation of clerk stipends.
  // Full-time SA is hired in Y2. GA coordinator cost in Y1 is $0 (absorbed by the PT role).
  const usePartTimeY1 = s.y1_staffing_model === 'parttime_stipend';
  // Part-time person is funded by: GA stipend ($10k) + clerk stipend elimination ($26k) = $36k
  const clerkStipendRealloc = s.clerk_stipend_realloc || s.stipend_elimination || 26000;

  return [1, 2, 3, 4, 5].map((yr) => {
    const esc = (v) => Math.round(v * Math.pow(1 + wg, yr - 1));
    const entEsc = (v) => v * Math.pow(1 + s.enterprise_growth_rate, yr - 1);

    // Costs
    // Part-time Y1: SA cost = GA stipend + clerk stipend reallocation (no benefits, no full hire)
    //   GA coordinator cost = $0 in Y1 (duties absorbed by part-time person)
    //   Y2+: full-time SA hired, GA coordinator resumes normal stipend
    const saCost = usePartTimeY1 && yr === 1
      ? (s.ga_stipend + clerkStipendRealloc)  // stipend-funded part-time role
      : esc(saFL);
    const bsCost = yr === 1 ? Math.round(bsFL * (6 / 12)) : esc(bsFL);
    const gaCost = usePartTimeY1 && yr === 1
      ? 0  // GA duties covered by part-time person in Y1
      : (yr === 1 ? Math.round(gaFL * (4 / 12)) : esc(gaFL));
    // Revenue Coordinator: only hire when regional services revenue covers fully loaded cost
    const rcFullyLoaded = esc(rcFL);
    const regionalAtYr = (() => {
      const rb = yr === 1 ? Math.round(s.rb_annual_contract * (4/12)) : Math.round(s.rb_annual_contract * Math.pow(1.04, yr-1));
      const mac = yr === 1 ? Math.round(s.machiasport_annual_contract * (4/12)) : Math.round(s.machiasport_annual_contract * Math.pow(1.04, yr-1));
      const marsh = yr >= 2 ? Math.round(s.marshfield_annual_contract * Math.pow(1.04, yr-2)) : 0;
      const whit = yr >= 3 ? Math.round(s.whitneyville_annual_contract * Math.pow(1.04, yr-3)) : 0;
      const north = yr >= 3 ? Math.round(s.northfield_annual_contract * Math.pow(1.04, yr-3)) : 0;
      return rb + mac + marsh + whit + north;
    })();
    const rcCost = regionalAtYr >= rcFullyLoaded ? rcFullyLoaded : 0;

    // Y5 senior hire: Controller (half-year) OR second Staff Accountant — model setting toggle
    const useController = s.y5_senior_hire === 'controller';
    const ctrlCost = yr >= 5 ? (useController ? Math.round(ctrlFL * 0.5) : esc(saFL)) : 0;
    const airportStipend = 2750;
    const implCost = yr === 1 ? s.erp_y1_cost || 0 : s.erp_ongoing_cost || 0;
    const totalCosts = saCost + bsCost + gaCost + rcCost + ctrlCost + airportStipend + implCost;

    // Enterprise overhead
    const entFunds = [s.ambulance_transfer, s.sewer_transfer, s.ts_transfer, s.telebusiness_transfer, s.court_st_transfer];
    const entTotal = Math.round(entFunds.reduce((a, v) => a + v, 0) * Math.pow(1 + s.enterprise_growth_rate, yr - 1));

    // FD / TM capacity
    // Year 1: use actuals from CONTROLS sheet audit; Year 2+: formula-based
    const fdCapacity = yr === 1 ? 50229 : Math.round(s.fd_loaded_cost * (yr === 2 ? 0.55 : 0.60));
    const tmCapacity = yr === 1 ? 21587 : Math.round(s.tm_loaded_cost * (yr === 2 ? 0.22 : 0.22));

    // EMS
    const transports = s.ems_transports * Math.pow(1 + s.transport_growth_rate, yr - 1);
    const gross = transports * s.avg_revenue_per_transport;
    const comstarAvoided = Math.round(gross * s.comstar_fee_rate);
    // Y1: improved collection 87.4% → 90% yields ~$27,780; Y2+: full inhouse_steady_rate vs comstar
    const collectionImprovement = yr === 1
      ? Math.round(gross * (0.90 - s.comstar_collection_rate))
      : Math.round(gross * (s.inhouse_steady_rate - s.comstar_collection_rate));

    // Stipends, airport, control
    const stipendSavings = s.stipend_elimination;
    const airportSavings = s.airport_savings;
    const controlRisk = yr === 1 ? Math.round(s.control_risk_exposure * 0.5) : Math.round(s.control_risk_exposure * 0.75);

    // Regional services
    const rb = yr === 1 ? Math.round(s.rb_annual_contract * (4 / 12)) : Math.round(s.rb_annual_contract * Math.pow(1.04, yr - 1));
    const mac = yr === 1 ? Math.round(s.machiasport_annual_contract * (4 / 12)) : Math.round(s.machiasport_annual_contract * Math.pow(1.04, yr - 1));
    const marsh = yr >= 2 ? Math.round(s.marshfield_annual_contract * Math.pow(1.04, yr - 2)) : 0;
    const whit = yr >= 3 ? Math.round(s.whitneyville_annual_contract * Math.pow(1.04, yr - 3)) : 0;
    const north = yr >= 3 ? Math.round(s.northfield_annual_contract * Math.pow(1.04, yr - 3)) : 0;
    const regionalServices = rb + mac + marsh + whit + north;

    // EMS external
    const emsExternal = [0, 15000, 30000, 45000, 55000][yr - 1];

    // Transfer station
    const transferStation = [8190, 52554, 109551, 74282, 131000][yr - 1];

    // ERP value
    const erpValue = yr >= 2 ? s.erp_annual_value : 0;

    const structuralTotal = entTotal + fdCapacity + tmCapacity + comstarAvoided + collectionImprovement + stipendSavings + airportSavings + controlRisk;
    const regionalTotal = regionalServices + emsExternal + transferStation;
    const totalValue = structuralTotal + regionalTotal + erpValue;
    const net = Math.round(totalValue - totalCosts);

    // General Fund fiscal impact analysis
    // Cash offsets that directly reduce GF levy pressure:
    //   - Comstar fee avoided (saves GF spend)
    //   - Collection improvement (new cash to Ambulance Fund, offsets transfer needs)
    //   - Stipend savings (direct GF expenditure reduction)
    //   - Airport savings (direct GF expenditure reduction)
    //   - Regional services contracts (new GF revenue)
    //   - Enterprise overhead transfers (pre-existing, but sustains cost coverage)
    // Non-cash / capacity items excluded from GF calc (FD/TM capacity, controlRisk)
    const gfCashOffsets = Math.round(
      comstarAvoided + collectionImprovement + stipendSavings + airportSavings +
      regionalServices + emsExternal + entTotal
    );
    // GF-funded costs only: SA + GA + airportStipend + ERP (BS funded by Ambulance Fund)
    const gfFundedCosts = saCost + gaCost + rcCost + ctrlCost + airportStipend + implCost;
    // Net GF levy impact: negative = reduced levy pressure / savings; positive = requires levy increase
    const gfNetLevyImpact = Math.round(gfFundedCosts - gfCashOffsets);
    // Undesignated fund draw needed (only if GF impact is still positive after cash offsets)
    const undesignatedDraw = Math.max(0, gfNetLevyImpact);
    // Mill rate equivalent of remaining gap (if any)
    const millRateImpact = s.total_assessed_value > 0
      ? parseFloat((gfNetLevyImpact / s.total_assessed_value * 1000).toFixed(4))
      : 0;

    return {
      year: yr,
      fiscalYear: `FY${2026 + yr}`,
      costs: {
        staffAccountant: saCost,
        billingSpecialist: bsCost,
        gaCoordinator: gaCost,
        revenueCoordinator: rcCost,
        controller: ctrlCost,  // may be SA2 depending on y5_senior_hire setting
        airportStipend,
        implementation: implCost,
        total: totalCosts,
      },
      value: {
        enterpriseOverhead: entTotal,
        fdCapacity,
        tmCapacity,
        comstarAvoided,
        collectionImprovement,
        stipendSavings,
        airportSavings,
        controlRisk,
        regionalServices,
        emsExternal,
        transferStation,
        erpValue,
        structuralTotal,
        regionalTotal,
        total: totalValue,
      },
      net,
      gf: {
        gfFundedCosts,
        gfCashOffsets,
        gfNetLevyImpact,
        undesignatedDraw,
        millRateImpact,
      },
    };
  });
}

// Cash-only 5-year total (most conservative)
export function cashOnlyTotal(settings) {
  const data = runProFormaFromSettings(settings);
  return data.reduce((s, d) => {
    const cash = ['comstarAvoided','collectionImprovement','stipendSavings','airportSavings','regionalServices','emsExternal','transferStation']
      .reduce((a, k) => a + (d.value[k] || 0), 0);
    return s + cash - d.costs.total;
  }, 0);
}