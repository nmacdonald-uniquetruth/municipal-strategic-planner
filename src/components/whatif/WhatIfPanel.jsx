/**
 * WhatIfPanel.jsx
 * Slide-in control panel for the What-If fiscal scenario engine.
 * Finance Director adjusts mill rate, budget growth, dept allocations, and CIP funding.
 */
import React, { useState } from 'react';
import { X, RotateCcw, ChevronDown, ChevronUp, Sliders, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { useWhatIf, PRESETS, BASELINE } from '../../context/WhatIfContext';

const SliderRow = ({ label, value, min, max, step, onChange, format, note }) => (
  <div className="space-y-1">
    <div className="flex items-center justify-between">
      <span className="text-[11px] font-semibold text-slate-600">{label}</span>
      <span className="text-xs font-bold text-slate-900 tabular-nums">{format ? format(value) : value}</span>
    </div>
    <input type="range" min={min} max={max} step={step} value={value}
      onChange={e => onChange(parseFloat(e.target.value))}
      className="w-full h-1.5 rounded-full accent-slate-800 cursor-pointer" />
    {note && <p className="text-[10px] text-slate-400">{note}</p>}
  </div>
);

const Section = ({ title, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 transition-colors text-left">
        <span className="text-[11px] font-bold uppercase tracking-wide text-slate-600">{title}</span>
        {open ? <ChevronUp className="h-3.5 w-3.5 text-slate-400" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-400" />}
      </button>
      {open && <div className="p-3.5 space-y-3.5">{children}</div>}
    </div>
  );
};

export default function WhatIfPanel({ onClose }) {
  const { scenario, custom, activePreset, applyPreset, updateParam, updateDeptOverride, reset, isDirty, DEPT_DEFAULTS } = useWhatIf();

  const riskColors = { low: 'bg-emerald-50 text-emerald-800 border-emerald-200', medium: 'bg-amber-50 text-amber-800 border-amber-200', high: 'bg-red-50 text-red-800 border-red-300' };
  const riskLabel  = { low: 'Balanced', medium: 'Caution', high: 'Risk Alert' };

  return (
    <div className="flex flex-col h-full bg-white" style={{ width: 340 }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-900 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Sliders className="h-4 w-4 text-amber-400" />
          <span className="text-sm font-bold text-white">What-If Scenario Engine</span>
        </div>
        <div className="flex items-center gap-2">
          {isDirty && (
            <button onClick={reset} className="text-[10px] font-semibold text-slate-300 hover:text-white flex items-center gap-1">
              <RotateCcw className="h-3 w-3" /> Reset
            </button>
          )}
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5">
        {/* Risk signal */}
        <div className={`rounded-lg border px-3 py-2.5 flex items-center gap-2.5 ${riskColors[scenario.risk]}`}>
          {scenario.risk === 'high' ? <AlertTriangle className="h-4 w-4 flex-shrink-0" /> :
           scenario.risk === 'medium' ? <TrendingDown className="h-4 w-4 flex-shrink-0" /> :
           <TrendingUp className="h-4 w-4 flex-shrink-0" />}
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold">{riskLabel[scenario.risk]}</p>
            <p className="text-[10px] opacity-75">
              FY2027: {scenario.years[0]?.surplus_deficit >= 0 ? '+' : ''}
              ${Math.round(scenario.years[0]?.surplus_deficit || 0).toLocaleString()} surplus/deficit
            </p>
          </div>
          {activePreset !== 'baseline' && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-black/10">{PRESETS[activePreset]?.label || 'Custom'}</span>
          )}
        </div>

        {/* Preset buttons */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-2">Quick Presets</p>
          <div className="grid grid-cols-2 gap-1.5">
            {Object.entries(PRESETS).map(([key, p]) => (
              <button key={key} onClick={() => applyPreset(key)}
                className={`text-[10px] font-semibold px-2.5 py-2 rounded-lg border transition-colors text-left leading-tight ${
                  activePreset === key
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                }`}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Property Tax */}
        <Section title="Property Tax Rate">
          <SliderRow
            label="Mill Rate Adjustment"
            value={custom.mill_rate_delta || 0}
            min={-3} max={5} step={0.05}
            onChange={v => updateParam('mill_rate_delta', v)}
            format={v => `${v >= 0 ? '+' : ''}${v.toFixed(2)} mills`}
            note={`Effective rate: ${scenario.mill_rate.toFixed(2)} mills (baseline: ${BASELINE.mill_rate})`}
          />
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="rounded-lg bg-slate-50 p-2">
              <p className="text-[9px] text-slate-500 font-semibold uppercase">Tax Levy</p>
              <p className="text-sm font-bold text-slate-900">${(scenario.annual_tax_levy / 1000).toFixed(0)}K</p>
              <p className={`text-[10px] font-semibold ${scenario.levy_delta >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                {scenario.levy_delta >= 0 ? '+' : ''}${Math.round(scenario.levy_delta).toLocaleString()}
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 p-2">
              <p className="text-[9px] text-slate-500 font-semibold uppercase">Avg Home ($180K)</p>
              <p className="text-sm font-bold text-slate-900">${scenario.tax_per_home.toFixed(0)}/yr</p>
              <p className={`text-[10px] font-semibold ${scenario.tax_per_home_delta >= 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                {scenario.tax_per_home_delta >= 0 ? '+' : ''}${scenario.tax_per_home_delta.toFixed(0)}/yr
              </p>
            </div>
          </div>
        </Section>

        {/* Budget Growth */}
        <Section title="Budget Growth Rate">
          <SliderRow
            label="Annual Growth Rate"
            value={(custom.budget_growth_override ?? BASELINE.budget_growth_rate) * 100}
            min={0} max={8} step={0.25}
            onChange={v => updateParam('budget_growth_override', v / 100)}
            format={v => `${v.toFixed(2)}%`}
            note={`Baseline: ${(BASELINE.budget_growth_rate * 100).toFixed(1)}%`}
          />
        </Section>

        {/* Department Budget Adjustments */}
        <Section title="Dept Budget Adjustments" defaultOpen={false}>
          <p className="text-[10px] text-slate-400">Adjust department allocations vs. baseline (±$K)</p>
          <div className="space-y-2.5">
            {DEPT_DEFAULTS.map(dept => {
              const override = custom.dept_overrides?.[dept.id] || 0;
              return (
                <div key={dept.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] text-slate-700 font-semibold">{dept.label}</span>
                    <span className={`text-[10px] font-bold tabular-nums ${override !== 0 ? (override > 0 ? 'text-red-600' : 'text-emerald-700') : 'text-slate-400'}`}>
                      {override >= 0 ? '+' : ''}${(override / 1000).toFixed(0)}K
                    </span>
                  </div>
                  <input type="range"
                    min={-100000} max={200000} step={5000}
                    value={override}
                    onChange={e => updateDeptOverride(dept.id, parseFloat(e.target.value))}
                    className="w-full h-1.5 rounded-full accent-slate-700 cursor-pointer" />
                </div>
              );
            })}
          </div>
        </Section>

        {/* CIP Funding */}
        <Section title="Road CIP Funding">
          <SliderRow
            label="GF Transfer to CIP"
            value={custom.cip_gf_transfer_delta || 0}
            min={-50000} max={200000} step={5000}
            onChange={v => updateParam('cip_gf_transfer_delta', v)}
            format={v => `${v >= 0 ? '+' : ''}$${Math.abs(v / 1000).toFixed(0)}K`}
            note={`Total: $${(scenario.cip_gf_transfer / 1000).toFixed(0)}K/yr`}
          />
          <SliderRow
            label="Excise Tax Allocation"
            value={custom.cip_excise_delta || 0}
            min={-50000} max={150000} step={5000}
            onChange={v => updateParam('cip_excise_delta', v)}
            format={v => `${v >= 0 ? '+' : ''}$${Math.abs(v / 1000).toFixed(0)}K`}
            note={`Total: $${(scenario.cip_excise / 1000).toFixed(0)}K/yr`}
          />
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-[10px] text-emerald-800">
            <span className="font-bold">CIP Total: </span>${(scenario.cip_total_annual / 1000).toFixed(0)}K/yr
            {(scenario.cip_gf_delta + scenario.cip_excise_delta) !== 0 && (
              <span className="ml-2 font-semibold">
                ({(scenario.cip_gf_delta + scenario.cip_excise_delta) >= 0 ? '+' : ''}$
                {Math.round(Math.abs(scenario.cip_gf_delta + scenario.cip_excise_delta) / 1000)}K vs baseline)
              </span>
            )}
          </div>
        </Section>

        {/* 5-Year preview */}
        <Section title="5-Year Outlook Preview">
          <div className="space-y-1">
            {scenario.years.map(y => (
              <div key={y.fy} className="flex items-center gap-2 text-[11px]">
                <span className="font-bold text-slate-500 w-12">FY{y.fy}</span>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${y.surplus_deficit >= 0 ? 'bg-emerald-400' : 'bg-red-400'}`}
                    style={{ width: `${Math.min(Math.abs(y.surplus_deficit) / 100000 * 20, 100)}%` }}
                  />
                </div>
                <span className={`w-20 text-right font-semibold tabular-nums ${y.surplus_deficit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                  {y.surplus_deficit >= 0 ? '+' : ''}${(y.surplus_deficit / 1000).toFixed(0)}K
                </span>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* Footer label */}
      <div className="flex-shrink-0 px-4 py-2.5 border-t border-slate-200 bg-slate-50 text-[10px] text-slate-400 text-center">
        Changes apply live to Dashboard and Road CIP modules
      </div>
    </div>
  );
}