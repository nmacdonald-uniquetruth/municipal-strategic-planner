import React, { useState } from 'react';
import { PRESET_SCENARIOS, simulateScenario, FUND_LABELS } from './financialSimEngine';
import { Zap, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';

const fmt = n => `$${Math.abs(Math.round(n)).toLocaleString()}`;
const sign = n => n >= 0 ? '+' : '-';

export default function ScenarioBuilder({ budgets }) {
  const [activeId, setActiveId] = useState(null);
  const [customDelta, setCustomDelta] = useState(0);
  const [customDept, setCustomDept] = useState(budgets[0]?.department_key || '');

  const activeScenario = PRESET_SCENARIOS.find(s => s.id === activeId);
  const result = activeScenario ? simulateScenario(budgets, activeScenario.changes) : null;

  // Custom scenario
  const customResult = customDept && customDelta !== 0
    ? simulateScenario(budgets, [{ department_key: customDept, budget_delta: customDelta, personnel_delta: 0 }])
    : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2.5 mb-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900">
          <Zap className="h-4 w-4 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900">Scenario Builder</h3>
          <p className="text-xs text-slate-500">Model budget changes and see tax impact instantly</p>
        </div>
      </div>

      {/* Preset scenarios */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {PRESET_SCENARIOS.map(s => {
          const res = simulateScenario(budgets, s.changes);
          const net = res.gfDelta - (s.revenueOffset || 0);
          const isActive = activeId === s.id;
          return (
            <button key={s.id} onClick={() => setActiveId(isActive ? null : s.id)}
              className={`text-left rounded-xl border p-4 transition-all ${isActive ? 'border-slate-900 bg-slate-900 text-white shadow-md' : 'border-slate-200 bg-white hover:border-slate-400'}`}>
              <div className="flex items-start justify-between">
                <p className={`text-xs font-bold ${isActive ? 'text-white' : 'text-slate-800'}`}>{s.label}</p>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ml-2 flex-shrink-0 ${
                  net <= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                }`}>
                  {net <= 0 ? `Saves ${fmt(Math.abs(net))}` : `+${fmt(net)} GF`}
                </span>
              </div>
              <p className={`text-[10px] mt-1.5 leading-relaxed ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>{s.description}</p>
              <div className={`mt-2 text-[10px] font-mono ${isActive ? 'text-slate-200' : 'text-slate-600'}`}>
                Mill rate: {sign(res.millRateDelta)}{Math.abs(res.millRateDelta).toFixed(4)} · Tax/home: {sign(res.taxPerHomeDelta)}{fmt(Math.abs(res.taxPerHomeDelta))}
              </div>
            </button>
          );
        })}
      </div>

      {/* Active scenario detail */}
      {result && activeScenario && (
        <div className="rounded-xl border border-slate-900 bg-slate-50 p-5">
          <p className="text-sm font-bold text-slate-900 mb-3">{activeScenario.label} — Detail</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {[
              { label: 'GF Budget Change', value: `${result.gfDelta >= 0 ? '+' : ''}${fmt(result.gfDelta)}`, color: result.gfDelta <= 0 ? '#2A7F7F' : '#e05c3a' },
              { label: 'Mill Rate Change', value: `${result.millRateDelta >= 0 ? '+' : ''}${result.millRateDelta.toFixed(4)} mills`, color: result.millRateDelta <= 0 ? '#2A7F7F' : '#e05c3a' },
              { label: 'Tax Change / Home', value: `${result.taxPerHomeDelta >= 0 ? '+' : ''}${fmt(result.taxPerHomeDelta)}`, color: result.taxPerHomeDelta <= 0 ? '#2A7F7F' : '#e05c3a' },
              { label: 'New GF Total', value: fmt(result.newSummary.totalGF), color: '#344A60' },
            ].map((s, i) => (
              <div key={i} className="text-center p-3 rounded-xl border border-slate-200 bg-white">
                <p className="text-lg font-bold" style={{ color: s.color }}>{s.value}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            {activeScenario.changes.map((c, i) => {
              const dept = result.modified.find(b => b.department_key === c.department_key);
              const base = result.baseSummary.byDept.find(b => b.department_key === c.department_key);
              return (
                <div key={i} className="flex items-center gap-3 text-xs rounded-lg border border-slate-200 bg-white px-3 py-2">
                  <span className="font-semibold text-slate-800 flex-1">{dept?.department_name || c.department_key}</span>
                  <span className="text-slate-400">{fmt(base?.annual_budget || 0)}</span>
                  <ArrowRight className="h-3 w-3 text-slate-400" />
                  <span className="font-bold text-slate-900">{fmt(dept?.annual_budget || 0)}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.budget_delta <= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                    {c.budget_delta >= 0 ? '+' : ''}{fmt(c.budget_delta)}
                  </span>
                  <span className="text-slate-500 text-[10px]">{c.description}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Custom scenario */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-xs font-bold text-slate-800 mb-3">Custom Budget Change</p>
        <div className="flex gap-3 flex-wrap">
          <div className="flex-1 min-w-40">
            <label className="text-[10px] text-slate-500 block mb-1">Department</label>
            <select value={customDept} onChange={e => setCustomDept(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none">
              {budgets.map(b => <option key={b.department_key} value={b.department_key}>{b.department_name}</option>)}
            </select>
          </div>
          <div className="w-40">
            <label className="text-[10px] text-slate-500 block mb-1">Budget Change ($)</label>
            <input type="number" value={customDelta} onChange={e => setCustomDelta(Number(e.target.value))}
              className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none" />
          </div>
          {customResult && (
            <div className="flex items-end gap-3 text-xs">
              <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-1.5 text-center">
                <p className="font-bold" style={{ color: customResult.millRateDelta >= 0 ? '#e05c3a' : '#2A7F7F' }}>
                  {customResult.millRateDelta >= 0 ? '+' : ''}{customResult.millRateDelta.toFixed(4)} mills
                </p>
                <p className="text-[10px] text-slate-400">Mill rate impact</p>
              </div>
              <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-1.5 text-center">
                <p className="font-bold" style={{ color: customResult.taxPerHomeDelta >= 0 ? '#e05c3a' : '#2A7F7F' }}>
                  {customResult.taxPerHomeDelta >= 0 ? '+' : ''}{fmt(customResult.taxPerHomeDelta)}/yr
                </p>
                <p className="text-[10px] text-slate-400">Per household</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}