// Financial model driven by live settings from ModelContext
export function runProFormaFromSettings(settings) {
  const s = settings;

  const healthAnnual = s.health_tier === 'individual' ? s.health_individual_annual : s.health_family_annual;

  function fl(base, isStipend = false) {
    if (isStipend) return base;
    const fica = base * s.fica_rate;
    const pers = base * s.pers_rate;
    const wc = base * s.wc_rate;
    return Math.round(base + fica + pers + wc + healthAnnual);
  }

  const saFL = fl(s.sa_base_salary);
  const bsFL = fl(s.bs_base_salary);
  const gaFL = s.ga_stipend;
  const rcFL = fl(s.rc_base_salary);
  const ctrlFL = fl(s.controller_base_salary);
  const wg = s.wage_growth_rate;

  return [1, 2, 3, 4, 5].map((yr) => {
    const esc = (v) => Math.round(v * Math.pow(1 + wg, yr - 1));
    const entEsc = (v) => v * Math.pow(1 + s.enterprise_growth_rate, yr - 1);

    // Costs
    const saCost = esc(saFL);
    const bsCost = yr === 1 ? Math.round(bsFL * (6 / 12)) : esc(bsFL);
    const gaCost = yr === 1 ? Math.round(gaFL * (4 / 12)) : esc(gaFL);
    const rcCost = yr >= 3 ? esc(rcFL) : 0;
    const ctrlCost = yr >= 5 ? Math.round(ctrlFL * 0.5) : 0;
    const airportStipend = 2750;
    const implCost = yr === 1 ? s.erp_y1_cost || 0 : s.erp_ongoing_cost || 0;
    const totalCosts = saCost + bsCost + gaCost + rcCost + ctrlCost + airportStipend + implCost;

    // Enterprise overhead
    const entFunds = [s.ambulance_transfer, s.sewer_transfer, s.ts_transfer, s.telebusiness_transfer, s.court_st_transfer];
    const entTotal = Math.round(entFunds.reduce((a, v) => a + v, 0) * Math.pow(1 + s.enterprise_growth_rate, yr - 1));

    // FD / TM capacity
    const fdPct = yr === 1 ? 0.45 : yr === 2 ? 0.55 : 0.60;
    const tmPct = yr === 1 ? 0.18 : 0.22;
    const fdCapacity = Math.round(s.fd_loaded_cost * fdPct);
    const tmCapacity = Math.round(s.tm_loaded_cost * tmPct);

    // EMS
    const transports = s.ems_transports * Math.pow(1 + s.transport_growth_rate, yr - 1);
    const gross = transports * s.avg_revenue_per_transport;
    const comstarAvoided = Math.round(gross * s.comstar_collection_rate * s.comstar_fee_rate);
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

    return {
      year: yr,
      fiscalYear: `FY${2026 + yr}`,
      costs: {
        staffAccountant: saCost,
        billingSpecialist: bsCost,
        gaCoordinator: gaCost,
        revenueCoordinator: rcCost,
        controller: ctrlCost,
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