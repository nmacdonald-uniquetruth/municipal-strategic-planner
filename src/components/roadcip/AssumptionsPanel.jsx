/**
 * AssumptionsPanel.jsx — Editable CIP funding assumptions (Option C hybrid).
 */
import React, { useState } from 'react';
import { Save } from 'lucide-react';
import { fmt } from './roadCIPEngine';

const Field = ({ label, value, onChange, prefix = '$', step = 1000, note }) => (
  <div className="space-y-1">
    <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</label>
    <div className="flex items-center gap-1.5">
      {prefix && <span className="text-xs text-slate-400">{prefix}</span>}
      <input
        type="number"
        value={value}
        step={step}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
        className="flex-1 text-sm font-semibold border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-400"
      />
    </div>
    {note && <p className="text-[10px] text-slate-400 leading-tight">{note}</p>}
  </div>
);

export default function AssumptionsPanel({ assumptions, onChange }) {
  const [local, setLocal] = useState({ ...assumptions });
  const isDirty = JSON.stringify(local) !== JSON.stringify(assumptions);

  const set = key => val => setLocal(prev => ({ ...prev, [key]: val }));

  const totalAnnual = (local.gf_annual_transfer || 0) + (local.excise_annual_allocation || 0) + (local.lrap_annual_estimate || 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">Option C Hybrid Funding Controls</p>
        {isDirty && (
          <button onClick={() => onChange(local)}
            className="flex items-center gap-1.5 text-xs font-bold bg-slate-900 text-white px-3 py-1.5 rounded-lg hover:bg-slate-700 transition-colors">
            <Save className="h-3.5 w-3.5" /> Apply Changes
          </button>
        )}
      </div>

      {/* Annual fund sources */}
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase mb-2.5">Annual Revenue Sources</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="GF Annual Transfer"     value={local.gf_annual_transfer}       onChange={set('gf_annual_transfer')}       note="General Fund capital transfer to road reserve" />
          <Field label="Excise Allocation"       value={local.excise_annual_allocation}  onChange={set('excise_annual_allocation')}  note="Excise tax dedicated share to roads" />
          <Field label="LRAP Estimate"           value={local.lrap_annual_estimate}      onChange={set('lrap_annual_estimate')}      prefix="$" step={100} note="Maine DOT Local Road Assistance Program" />
        </div>
        <div className="mt-3 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-2 flex items-center justify-between">
          <p className="text-xs text-emerald-800 font-semibold">Total Annual Sources (Year 1)</p>
          <p className="text-sm font-bold text-emerald-900">{fmt(totalAnnual)}</p>
        </div>
      </div>

      {/* Model controls */}
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase mb-2.5">Model Controls</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Field label="Start Fiscal Year"  value={local.start_fiscal_year}  onChange={set('start_fiscal_year')} prefix="" step={1} />
          <Field label="Analysis Years"     value={local.analysis_years}     onChange={set('analysis_years')}     prefix="" step={1} />
          <Field label="Beginning Reserve"  value={local.beginning_reserve}  onChange={set('beginning_reserve')} />
          <Field label="Inflation Rate %"   value={(local.inflation_rate || 0.03) * 100} onChange={v => set('inflation_rate')(v / 100)} prefix="%" step={0.5} note="Annual cost escalation" />
        </div>
      </div>

      {/* Lifecycle defaults */}
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase mb-2.5">Paved Road Lifecycle Defaults</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Field label="Crack Seal Cycle (yrs)"    value={local.crack_seal_cycle_yrs}    onChange={set('crack_seal_cycle_yrs')}    prefix="" step={1} />
          <Field label="Crack Seal $/mile"          value={local.crack_seal_cost_per_mile} onChange={set('crack_seal_cost_per_mile')} step={500} />
          <Field label="Chip Seal $/mile"           value={local.chip_seal_cost_per_mile}  onChange={set('chip_seal_cost_per_mile')}  step={1000} />
          <Field label="Overlay Cycle (yrs)"       value={local.overlay_cycle_yrs}        onChange={set('overlay_cycle_yrs')}        prefix="" step={1} />
          <Field label="Overlay $/mile"             value={local.overlay_cost_per_mile}    onChange={set('overlay_cost_per_mile')}    step={10000} />
          <Field label="Gravel Grading $/mile"     value={local.gravel_grading_cost_per_mile} onChange={set('gravel_grading_cost_per_mile')} step={500} />
        </div>
      </div>

      <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-[11px] text-blue-800 leading-relaxed">
        <strong>Option C Hybrid Strategy:</strong> Baseline GF transfer + dedicated excise allocation + LRAP.
        Based on the 3/19/2026 Public Works budget meeting. Excise estimate ~$200K/yr (conservative placeholder).
        GF transfer is the committed floor; excise provides upside for larger projects.
      </div>
    </div>
  );
}