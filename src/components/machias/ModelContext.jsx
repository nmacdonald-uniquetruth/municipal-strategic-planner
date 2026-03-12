import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

const DEFAULT_SETTINGS = {
  start_date: '2026-07-01',
  sa_base_salary: 65000,
  bs_base_salary: 55000,
  ga_stipend: 10000,
  rc_base_salary: 39000,
  controller_base_salary: 85000,
  y5_senior_hire: 'staff_accountant',
  y1_staffing_model: 'fulltime_sa',
  clerk_stipend_realloc: 26000,
  wage_growth_rate: 0.04,
  health_tier: 'family',
  fica_rate: 0.0765,
  pers_rate: 0.05, // Admin positions: 5% employer 457 match, not MainePERS
  wc_rate: 0.025,
  health_individual_annual: 17721,
  health_family_annual: 30938,
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
  enterprise_growth_rate: 0.03,
  stipend_elimination: 26000,
  airport_savings: 2527,
  control_risk_exposure: 56000,
  fd_loaded_cost: 86824,
  tm_loaded_cost: 96013,
  rb_annual_contract: 19000,
  machiasport_annual_contract: 20000,
  marshfield_annual_contract: 15000,
  whitneyville_annual_contract: 11000,
  northfield_annual_contract: 12000,
  erp_y1_cost: 47000,
  erp_designated_fund_offset: 24000,
  erp_ongoing_cost: 5000,
  erp_annual_value: 21000,
  gf_undesignated_balance: 2500000,
  ambulance_fund_balance: 500000,
  ambulance_loan_payoff: 130000,
  total_assessed_value: 198000000,
  current_mill_rate: 14.5,
  annual_tax_levy: 2871000,
};

const ModelContext = createContext(null);

export function ModelProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [settingsId, setSettingsId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.ModelSettings.filter({ key: 'main' }).then(records => {
      if (records && records.length > 0) {
        const rec = records[0];
        setSettingsId(rec.id);
        setSettings({ ...DEFAULT_SETTINGS, ...rec });
      } else {
        base44.entities.ModelSettings.create({ key: 'main', ...DEFAULT_SETTINGS }).then(rec => {
          setSettingsId(rec.id);
        });
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const updateSettings = useCallback(async (updates) => {
    const merged = { ...settings, ...updates };
    setSettings(merged);
    if (settingsId) {
      await base44.entities.ModelSettings.update(settingsId, updates);
    }
  }, [settings, settingsId]);

  // Compute milestone dates from start_date
  const startDate = new Date(settings.start_date || '2026-07-01');
  const addMonths = (d, m) => {
    const r = new Date(d);
    r.setMonth(r.getMonth() + m);
    return r.toISOString().split('T')[0];
  };

  const milestoneDates = {
    saHire: addMonths(startDate, 2),           // M3 from start
    stipendElim: addMonths(startDate, 3),
    interlocalsExec: addMonths(startDate, 6),   // M7-9
    bsHire: addMonths(startDate, 6),            // M7
    comstarParallel: addMonths(startDate, 6),
    comstarCutover: addMonths(startDate, 9),    // M10
    gaHire: addMonths(startDate, 8),            // M9
    airportStipend: addMonths(startDate, 1),
    coaAnalysis: addMonths(startDate, 3),       // Q1-Q2
    erpRfp: addMonths(startDate, 6),            // Q3-Q4
    erpTownMeeting: addMonths(startDate, 9),
    erpCoaRebuild: addMonths(startDate, 12),    // FY2028 Q1
    erpGoLive: addMonths(startDate, 21),        // FY2028 Q3-Q4
    rbInterlocal: addMonths(startDate, 6),
    macInterlocal: addMonths(startDate, 6),
    marshfieldOutreach: addMonths(startDate, 12),
    tsRenegotiate: addMonths(startDate, 6),
    yearEndProcedures: addMonths(startDate, 5),
  };

  return (
    <ModelContext.Provider value={{ settings, updateSettings, loading, milestoneDates, addMonths, startDate }}>
      {children}
    </ModelContext.Provider>
  );
}

export function useModel() {
  const ctx = useContext(ModelContext);
  if (!ctx) throw new Error('useModel must be used within ModelProvider');
  return ctx;
}