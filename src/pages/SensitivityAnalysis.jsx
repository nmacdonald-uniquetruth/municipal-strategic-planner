import React, { useState, useMemo } from 'react';
import { useModel } from '../components/machias/ModelContext';
import { runProFormaFromSettings } from '../components/machias/FinancialModelV2';
import SectionHeader from '../components/machias/SectionHeader';
import { BarChart2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const fmt  = (n) => n == null ? '—' : `$${Math.abs(Math.round(n)).toLocaleString()}`;
const fmtK = (n) => `$${Math.round(n / 1000)}K`;

const TORNADO_VARS = [
  { key: 'comstar_fee_rate',        label: 'Comstar Fee Rate',          low: 0.035,  high: 0.065,  type: 'rate' },
  { key: 'comstar_collection_rate', label: 'Comstar Collection Rate',   low: 0.82,   high: 0.92,   type: 'rate' },
  { key: 'inhouse_steady_rate',     label: 'In-House Collection Rate',  low: 0.86,   high: 0.94,   type: 'rate' },
  { key: 'ems_transports',          label: 'Annual EMS Transports',     low: 1400,   high: 1900,   type: 'number' },
  { key: 'sa_base_salary',          label: 'Staff Accountant Salary',   low: 58000,  high: 72000,  type: 'dollar' },
  { key: 'bs_base_salary',          label: 'Billing Specialist Salary', low: 48000,  high: 62000,  type: 'dollar' },
  { key: 'rb_annual_contract',      label: 'Roque Bluffs Contract',     low: 13000,  high: 25000,  type: 'dollar' },
  { key: 'machiasport_annual_contract', label: 'Machiasport Contract',  low: 14000,  high: 26000,  type: 'dollar' },
  { key: 'wage_growth_rate',        label: 'Wage Growth Rate',          low: 0.02,   high: 0.06,   type: 'rate' },
  { key: 'enterprise_growth_rate',  label: 'Enterprise Growth Rate',    low: 0.01,   high: 0.05,   type: 'rate' },
];

const SCENARIOS_PRESETS = [
  { name: 'Pessimistic', description: 'Low EMS transports, high salaries, no new regional contracts, in-house collection at 86%', color: 'red', overrides: { ems_transports: 1400, sa_base_salary: 72000, bs_base_salary: 62000, inhouse_steady_rate: 0.86, machiasport_annual_contract: 14000, rb_annual_contract: 13000, marshfield_annual_contract: 0, whitneyville_annual_contract: 0, northfield_annual_contract: 0 } },
  { name: 'Conservative', description: 'Base EMS volume, market-rate salaries, Roque Bluffs + Machiasport only, no Marshfield', color: 'amber', overrides: { ems_transports: 1550, sa_base_salary: 65000, bs_base_salary: 55000, inhouse_steady_rate: 0.88, marshfield_annual_contract: 0, whitneyville_annual_contract: 0, northfield_annual_contract: 0 } },
  { name: 'Base Case', description: 'All model defaults — current settings', color: 'blue', overrides: {} },
  { name: 'Optimistic', description: 'High EMS growth, all 5 regional contracts, 92% collection rate, 3 EMS billing clients', color: 'emerald', overrides: { ems_transports: 1800, inhouse_steady_rate: 0.92, transport_growth_rate: 0.03, machiasport_annual_contract: 26000, rb_annual_contract: 24000, marshfield_annual_contract: 20000, whitneyville_annual_contract: 15000, northfield_annual_contract: 16000 } },
];

function getMetric(data) {
  const cashOnly5yr = data.reduce((sum, d) => {
    const cash = d.value.comstarAvoided + d.value.collectionImprovement +
      d.value.stipendSavings + d.value.airportSavings +
      d.value.regionalServices + d.value.emsExternal + d.value.transferStation;
    return sum + cash - d.costs.total;
  }, 0);
  return { cashOnly5yr, total5yr: data.reduce((s, d) => s + d.net, 0), y1Net: data[0].net, y1GFImpact: data[0].gf.gfNetLevyImpact };
}

export default function SensitivityAnalysis() {
  const { settings } = useModel();
  const [activeTab, setActiveTab] = useState('tornado');
  const [selectedMetric, setSelectedMetric] = useState('cashOnly5yr');
  const baseData = useMemo(() => runProFormaFromSettings(settings), [settings]);
  const baseMetrics = useMemo(() => getMetric(baseData), [baseData]);

  // Tornado chart data
  const tornadoData = useMemo(() => {
    return TORNADO_VARS.map(v => {
      const lowSettings = { ...settings, [v.key]: v.low };
      const highSettings = { ...settings, [v.key]: v.high };
      const lowMetric = getMetric(runProFormaFromSettings(lowSettings))[selectedMetric];
      const highMetric = getMetric(runProFormaFromSettings(highSettings))[selectedMetric];
      const baseVal = baseMetrics[selectedMetric];
      return {
        label: v.label,
        key: v.key,
        lowImpact: Math.round(lowMetric - baseVal),
        highImpact: Math.round(highMetric - baseVal),
        low: v.low,
        high: v.high,
        type: v.type,
        lowVal: lowMetric,
        highVal: highMetric,
        baseVal,
        spread: Math.abs(highMetric - lowMetric),
      };
    }).sort((a, b) => b.spread - a.spread);
  }, [settings, selectedMetric, baseMetrics]);

  // Single variable sensitivity
  const [selectedVar, setSelectedVar] = useState('comstar_fee_rate');
  const selectedVarDef = TORNADO_VARS.find(v => v.key === selectedVar);
  const sensitivityData = useMemo(() => {
    if (!selectedVarDef) return [];
    const steps = 10;
    const step = (selectedVarDef.high - selectedVarDef.low) / steps;
    return Array.from({ length: steps + 1 }, (_, i) => {
      const val = selectedVarDef.low + step * i;
      const testSettings = { ...settings, [selectedVar]: val };
      const m = getMetric(runProFormaFromSettings(testSettings));
      const label = selectedVarDef.type === 'rate' ? `${(val * 100).toFixed(1)}%` :
                    selectedVarDef.type === 'dollar' ? `$${Math.round(val/1000)}K` : val.toLocaleString();
      return { label, value: Math.round(m[selectedMetric]), base: baseMetrics[selectedMetric] };
    });
  }, [selectedVar, settings, selectedMetric, selectedVarDef, baseMetrics]);

  // Scenario comparison
  const scenarioResults = useMemo(() =>
    SCENARIOS_PRESETS.map(sc => ({
      ...sc,
      metrics: getMetric(runProFormaFromSettings({ ...settings, ...sc.overrides })),
    })), [settings]);

  const metricLabels = {
    cashOnly5yr: '5-Yr Cash Net',
    total5yr: '5-Yr Total Value',
    y1Net: 'Year 1 Net',
    y1GFImpact: 'Y1 GF Levy Impact',
  };

  return (
    <div className="space-y-8">
      <SectionHeader title="Sensitivity Analysis & Scenario Comparison" subtitle="Understand which assumptions drive the outcome most — and what happens under different futures" icon={BarChart2} />

      {/* Metric selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs font-medium text-slate-600">Analyze metric:</span>
        {Object.entries(metricLabels).map(([k, label]) => (
          <button key={k} onClick={() => setSelectedMetric(k)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${selectedMetric === k ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            {label}
          </button>
        ))}
        <span className="text-xs text-slate-500 ml-2">Base value: <strong className="font-mono text-slate-800">{fmt(baseMetrics[selectedMetric])}</strong></span>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[['tornado','Tornado Chart'],['single','Single Variable'],['scenarios','Scenario Comparison']].map(([id, label]) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${activeTab === id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Tornado */}
      {activeTab === 'tornado' && (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">The tornado chart shows which variables have the largest impact on <strong>{metricLabels[selectedMetric]}</strong>. Variables at the top have the most leverage — they deserve the most scrutiny.</p>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="space-y-2">
              {tornadoData.map((v, i) => {
                const maxSpread = tornadoData[0].spread;
                const leftPct = Math.round((Math.max(0, -v.lowImpact) / maxSpread) * 45);
                const rightPct = Math.round((Math.max(0, v.highImpact) / maxSpread) * 45);
                const leftNeg = Math.round((Math.max(0, v.lowImpact < 0 ? -v.lowImpact : 0) / maxSpread) * 45);
                return (
                  <div key={v.key} className="flex items-center gap-2">
                    <span className="text-xs text-slate-600 w-48 flex-shrink-0 text-right">{v.label}</span>
                    <div className="flex-1 flex items-center gap-0.5">
                      {/* Left (negative impact) */}
                      <div className="w-1/2 flex justify-end">
                        {v.lowImpact < 0 && (
                          <div className="h-6 rounded-l bg-red-400 flex items-center justify-end pr-1"
                            style={{ width: `${leftPct * 2}%`, minWidth: 4 }}>
                            <span className="text-[9px] text-white font-mono">{fmtK(v.lowImpact)}</span>
                          </div>
                        )}
                        {v.highImpact < 0 && (
                          <div className="h-6 rounded-l bg-amber-400 flex items-center justify-end pr-1"
                            style={{ width: `${Math.round((Math.abs(v.highImpact) / maxSpread) * 45) * 2}%`, minWidth: 4 }}>
                          </div>
                        )}
                      </div>
                      {/* Center line */}
                      <div className="w-0.5 h-7 bg-slate-300 flex-shrink-0" />
                      {/* Right (positive impact) */}
                      <div className="w-1/2">
                        {v.highImpact > 0 && (
                          <div className="h-6 rounded-r bg-emerald-400 flex items-center pl-1"
                            style={{ width: `${rightPct * 2}%`, minWidth: 4 }}>
                            <span className="text-[9px] text-white font-mono">+{fmtK(v.highImpact)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 w-20 flex-shrink-0">
                      {fmtK(v.lowVal)} → {fmtK(v.highVal)}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-emerald-400" /><span className="text-[10px] text-slate-500">Positive impact at high value</span></div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-red-400" /><span className="text-[10px] text-slate-500">Negative impact at low value</span></div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-4 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider grid grid-cols-5">
              <span>Variable</span><span>Low Value</span><span>High Value</span><span>Low Outcome</span><span>High Outcome</span>
            </div>
            {tornadoData.map((v, i) => (
              <div key={i} className="px-4 py-2 grid grid-cols-5 text-xs border-t border-slate-100">
                <span className="font-medium text-slate-800">{v.label}</span>
                <span className="font-mono text-slate-600">{v.type === 'rate' ? `${(v.low*100).toFixed(1)}%` : v.type === 'dollar' ? fmt(v.low) : v.low.toLocaleString()}</span>
                <span className="font-mono text-slate-600">{v.type === 'rate' ? `${(v.high*100).toFixed(1)}%` : v.type === 'dollar' ? fmt(v.high) : v.high.toLocaleString()}</span>
                <span className={`font-mono font-semibold ${v.lowVal < baseMetrics[selectedMetric] ? 'text-red-700' : 'text-emerald-700'}`}>{fmt(v.lowVal)}</span>
                <span className={`font-mono font-semibold ${v.highVal > baseMetrics[selectedMetric] ? 'text-emerald-700' : 'text-red-700'}`}>{fmt(v.highVal)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Single Variable */}
      {activeTab === 'single' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-medium text-slate-600">Select variable:</span>
            <select value={selectedVar} onChange={e => setSelectedVar(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-800 focus:outline-none">
              {TORNADO_VARS.map(v => <option key={v.key} value={v.key}>{v.label}</option>)}
            </select>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-slate-800 mb-1">
              {selectedVarDef?.label} → Impact on {metricLabels[selectedMetric]}
            </h3>
            <p className="text-xs text-slate-500 mb-4">Shows how {metricLabels[selectedMetric]} changes across the full range of {selectedVarDef?.label} values. Base case marked in orange.</p>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={sensitivityData} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${Math.round(v/1000)}K`} />
                <Tooltip formatter={(v) => fmt(v)} />
                <ReferenceLine y={baseMetrics[selectedMetric]} stroke="#f97316" strokeDasharray="3 3" label={{ value: 'Base', fontSize: 9, fill: '#f97316' }} />
                <Bar dataKey="value" name={metricLabels[selectedMetric]} fill="#3b82f6" radius={[4,4,0,0]}
                  label={{ position: 'top', fontSize: 9, formatter: v => `$${Math.round(v/1000)}K` }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-4 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider grid grid-cols-3">
              <span>{selectedVarDef?.label}</span><span>{metricLabels[selectedMetric]}</span><span>vs. Base</span>
            </div>
            {sensitivityData.map((row, i) => {
              const delta = row.value - baseMetrics[selectedMetric];
              return (
                <div key={i} className="px-4 py-2 grid grid-cols-3 text-xs border-t border-slate-100">
                  <span className="font-mono text-slate-800">{row.label}</span>
                  <span className="font-mono text-slate-700">{fmt(row.value)}</span>
                  <span className={`font-mono font-semibold ${delta > 0 ? 'text-emerald-700' : delta < 0 ? 'text-red-700' : 'text-slate-500'}`}>
                    {delta > 0 ? '+' : ''}{fmt(delta)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Scenario Comparison */}
      {activeTab === 'scenarios' && (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Side-by-side comparison of four named scenarios showing how each key metric changes under different futures. All scenarios use your current model settings as the base, then apply specific overrides.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {scenarioResults.map((sc, i) => {
              const colors = { red: 'border-red-200 bg-red-50/40', amber: 'border-amber-200 bg-amber-50/40', blue: 'border-blue-200 bg-blue-50/40', emerald: 'border-emerald-200 bg-emerald-50/40' };
              const textColors = { red: 'text-red-900', amber: 'text-amber-900', blue: 'text-blue-900', emerald: 'text-emerald-900' };
              const badgeColors = { red: 'bg-red-100 text-red-800', amber: 'bg-amber-100 text-amber-800', blue: 'bg-blue-100 text-blue-800', emerald: 'bg-emerald-100 text-emerald-800' };
              return (
                <div key={i} className={`rounded-xl border ${colors[sc.color]} p-4 space-y-3`}>
                  <div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeColors[sc.color]}`}>{sc.name}</span>
                    <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">{sc.description}</p>
                  </div>
                  <div className="space-y-2">
                    {Object.entries(metricLabels).map(([k, label]) => {
                      const val = sc.metrics[k];
                      const base = scenarioResults[2].metrics[k]; // Base case index
                      const delta = val - base;
                      return (
                        <div key={k} className="rounded-lg bg-white/70 px-3 py-2">
                          <p className="text-[10px] text-slate-500">{label}</p>
                          <p className={`text-base font-bold ${textColors[sc.color]}`}>{fmt(val)}</p>
                          {k !== 'y1GFImpact' && i !== 2 && (
                            <p className={`text-[10px] font-medium ${delta >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                              {delta >= 0 ? '+' : ''}{fmtK(delta)} vs. base
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white px-4 py-2 text-[10px] font-semibold uppercase tracking-wider grid grid-cols-5">
              <span>Metric</span>
              {scenarioResults.map(sc => <span key={sc.name}>{sc.name}</span>)}
            </div>
            {Object.entries(metricLabels).map(([k, label]) => (
              <div key={k} className="px-4 py-2.5 grid grid-cols-5 text-xs border-t border-slate-100">
                <span className="font-medium text-slate-800">{label}</span>
                {scenarioResults.map((sc, i) => {
                  const val = sc.metrics[k];
                  const base = scenarioResults[2].metrics[k];
                  const isBetter = k === 'y1GFImpact' ? val < base : val > base;
                  return (
                    <span key={i} className={`font-mono font-semibold ${i === 2 ? 'text-slate-700' : isBetter ? 'text-emerald-700' : 'text-red-700'}`}>
                      {fmt(val)}
                    </span>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-xs text-slate-600">
            <strong>Note:</strong> "Base Case" uses your current model settings exactly. The other scenarios apply specific overrides on top of your base. To permanently change any of these values, go to <strong>Model Settings</strong>.
          </div>
        </div>
      )}
    </div>
  );
}