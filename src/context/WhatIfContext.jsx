/**
 * WhatIfContext.jsx
 * Global What-If fiscal scenario engine.
 * Manages property tax rate, budget allocations, and CIP funding overrides.
 * All downstream modules consume this context to render scenario-adjusted projections.
 */
import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';

// ─── Machias baseline constants ────────────────────────────────────────────────
export const BASELINE = {
  // Tax
  assessed_value:        95_000_000,   // Total assessed property value
  mill_rate:             14.20,        // Current mill rate (mills)
  annual_tax_levy:       3_920_000,    // Property tax levy
  // General Fund
  annual_budget:         4_200_000,    // Total GF budget
  budget_growth_rate:    0.025,        // Baseline 2.5% annual growth
  // Road CIP sources (Option C)
  cip_gf_transfer:       100_000,
  cip_excise:            100_000,
  cip_lrap:              20_724,
  // Revenue
  state_revenue_sharing: 420_000,
  non_tax_revenue:       380_000,
};

const DEPT_DEFAULTS = [
  { id: 'admin',    label: 'Administration',    budget: 480_000 },
  { id: 'police',   label: 'Police',            budget: 620_000 },
  { id: 'fire_ems', label: 'Fire / EMS',        budget: 890_000 },
  { id: 'pw',       label: 'Public Works',      budget: 540_000 },
  { id: 'finance',  label: 'Finance',           budget: 210_000 },
  { id: 'planning', label: 'Planning / Code',   budget: 95_000  },
  { id: 'parks',    label: 'Parks / Rec',       budget: 75_000  },
  { id: 'library',  label: 'Library',           budget: 130_000 },
  { id: 'transfer', label: 'Transfer Station',  budget: 260_000 },
  { id: 'other',    label: 'Other / Debt Svc',  budget: 500_000 },
];

export const DEPT_DEFAULTS_LIST = DEPT_DEFAULTS;

const SCENARIO_PRESETS = {
  baseline: {
    label: 'Baseline (Current)',
    color: '#64748b',
    mill_rate_delta:       0,
    budget_growth_override: null,
    dept_overrides:        {},
    cip_gf_transfer_delta: 0,
    cip_excise_delta:      0,
    revenue_sharing_delta: 0,
  },
  conservative: {
    label: 'Conservative (+2% levy)',
    color: '#f59e0b',
    mill_rate_delta:       0.28,
    budget_growth_override: 0.02,
    dept_overrides:        {},
    cip_gf_transfer_delta: 0,
    cip_excise_delta:      0,
    revenue_sharing_delta: 0,
  },
  growth: {
    label: 'Growth (+5% levy, +CIP)',
    color: '#10b981',
    mill_rate_delta:       0.71,
    budget_growth_override: 0.05,
    dept_overrides:        {},
    cip_gf_transfer_delta: 50_000,
    cip_excise_delta:      25_000,
    revenue_sharing_delta: 0,
  },
  austerity: {
    label: 'Austerity (flat budget)',
    color: '#ef4444',
    mill_rate_delta:       -0.50,
    budget_growth_override: 0.00,
    dept_overrides:        { pw: -30_000, admin: -20_000 },
    cip_gf_transfer_delta: -25_000,
    cip_excise_delta:      0,
    revenue_sharing_delta: 0,
  },
};

export const PRESETS = SCENARIO_PRESETS;

const WhatIfContext = createContext(null);

export function WhatIfProvider({ children }) {
  const [activePreset, setActivePreset] = useState('baseline');
  // External financial inputs fed in from the dashboard (proposals, services, CIP)
  const [externalInputs, setExternalInputs] = useState({
    proposalSavings:   0,   // annual net savings from approved proposals
    proposalCosts:     0,   // annual new costs from approved proposals
    regionalRevenue:   0,   // annual regional service revenue
    cipAnnualDraw:     0,   // CIP total annual draw (GF + excise + LRAP) as expenditure
  });
  const [custom, setCustom] = useState({
    mill_rate_delta:        0,
    budget_growth_override: null,
    dept_overrides:         {},
    cip_gf_transfer_delta:  0,
    cip_excise_delta:       0,
    revenue_sharing_delta:  0,
  });

  const applyPreset = useCallback((key) => {
    setActivePreset(key);
    if (key !== 'custom') {
      const p = SCENARIO_PRESETS[key];
      setCustom({
        mill_rate_delta:        p.mill_rate_delta,
        budget_growth_override: p.budget_growth_override,
        dept_overrides:         { ...p.dept_overrides },
        cip_gf_transfer_delta:  p.cip_gf_transfer_delta,
        cip_excise_delta:       p.cip_excise_delta,
        revenue_sharing_delta:  p.revenue_sharing_delta,
      });
    }
  }, []);

  const updateParam = useCallback((key, value) => {
    setActivePreset('custom');
    setCustom(prev => ({ ...prev, [key]: value }));
  }, []);

  const updateDeptOverride = useCallback((deptId, delta) => {
    setActivePreset('custom');
    setCustom(prev => ({
      ...prev,
      dept_overrides: { ...prev.dept_overrides, [deptId]: delta },
    }));
  }, []);

  const setFinancialInputs = useCallback((inputs) => {
    setExternalInputs(prev => ({ ...prev, ...inputs }));
  }, []);

  const reset = useCallback(() => {
    setActivePreset('baseline');
    setCustom({
      mill_rate_delta: 0, budget_growth_override: null,
      dept_overrides: {}, cip_gf_transfer_delta: 0,
      cip_excise_delta: 0, revenue_sharing_delta: 0,
    });
  }, []);

  // ─── Derived outputs ─────────────────────────────────────────────────────────
  const scenario = useMemo(() => {
    const c   = custom;
    const ext = externalInputs;

    // Tax
    const mill_rate       = BASELINE.mill_rate + (c.mill_rate_delta || 0);
    const annual_tax_levy = (mill_rate / 1000) * BASELINE.assessed_value;
    const levy_delta      = annual_tax_levy - BASELINE.annual_tax_levy;
    const mill_delta_pct  = ((mill_rate - BASELINE.mill_rate) / BASELINE.mill_rate) * 100;
    const median_home_value = 180_000;
    const tax_per_home      = (mill_rate / 1000) * median_home_value;
    const tax_per_home_delta = ((c.mill_rate_delta || 0) / 1000) * median_home_value;

    // Budget growth
    const growth = c.budget_growth_override ?? BASELINE.budget_growth_rate;

    // CIP totals (needed in expenditure loop)
    const cip_gf_transfer  = BASELINE.cip_gf_transfer  + (c.cip_gf_transfer_delta  || 0);
    const cip_excise       = BASELINE.cip_excise       + (c.cip_excise_delta       || 0);
    const cip_lrap         = BASELINE.cip_lrap;
    const cip_total_annual = cip_gf_transfer + cip_excise + cip_lrap;

    // 5-year integrated projections — includes proposals, regional revenue, CIP draw, dept overrides
    const years = Array.from({ length: 5 }, (_, i) => {
      const fy = 2027 + i;
      const escalation = Math.pow(1 + growth, i);

      // Expenditures
      const base_budget   = BASELINE.annual_budget * escalation;
      const dept_adj      = Object.values(c.dept_overrides || {}).reduce((s, d) => s + (d || 0), 0);
      const new_costs     = (ext.proposalCosts || 0) * escalation;
      const cip_draw      = cip_total_annual * escalation;
      const total_expenditure = base_budget + dept_adj + new_costs + cip_draw;

      // Revenue
      const tax_revenue     = annual_tax_levy * escalation;
      const state_sharing   = (BASELINE.state_revenue_sharing + (c.revenue_sharing_delta || 0)) * escalation;
      const non_tax         = BASELINE.non_tax_revenue * escalation;
      const proposal_savings = (ext.proposalSavings || 0) * escalation;
      const regional_rev    = (ext.regionalRevenue || 0) * escalation;
      const total_revenue   = tax_revenue + state_sharing + non_tax + proposal_savings + regional_rev;

      const surplus_deficit = total_revenue - total_expenditure;

      return {
        fy, base_budget, dept_adj, new_costs, cip_draw,
        total_expenditure, tax_revenue, state_sharing, non_tax,
        proposal_savings, regional_rev, total_revenue, surplus_deficit,
      };
    });

    // Risk signal
    const yr1 = years[0];
    const risk = yr1.surplus_deficit < -100_000 ? 'high'
               : yr1.surplus_deficit < 0        ? 'medium'
               : 'low';

    return {
      mill_rate, mill_rate_delta: c.mill_rate_delta || 0,
      mill_delta_pct, levy_delta, annual_tax_levy,
      tax_per_home, tax_per_home_delta,
      growth_rate: growth,
      cip_gf_transfer, cip_excise, cip_lrap, cip_total_annual,
      cip_gf_delta: c.cip_gf_transfer_delta || 0,
      cip_excise_delta: c.cip_excise_delta || 0,
      cipAssumptionsDelta: {
        gf_annual_transfer:       cip_gf_transfer,
        excise_annual_allocation: cip_excise,
        lrap_annual_estimate:     cip_lrap,
      },
      years,
      risk,
      dept_overrides: c.dept_overrides,
      isBaseline: activePreset === 'baseline' && (c.mill_rate_delta || 0) === 0,
    };
  }, [custom, activePreset, externalInputs]);

  const isDirty = activePreset !== 'baseline' || (custom.mill_rate_delta || 0) !== 0
    || (custom.cip_gf_transfer_delta || 0) !== 0 || (custom.cip_excise_delta || 0) !== 0
    || Object.values(custom.dept_overrides || {}).some(v => v !== 0)
    || custom.budget_growth_override != null;

  return (
    <WhatIfContext.Provider value={{
      scenario, custom, activePreset,
      applyPreset, updateParam, updateDeptOverride, reset,
      setFinancialInputs,
      isDirty,
      BASELINE, DEPT_DEFAULTS: DEPT_DEFAULTS_LIST,
    }}>
      {children}
    </WhatIfContext.Provider>
  );
}

export function useWhatIf() {
  const ctx = useContext(WhatIfContext);
  if (!ctx) throw new Error('useWhatIf must be used inside WhatIfProvider');
  return ctx;
}