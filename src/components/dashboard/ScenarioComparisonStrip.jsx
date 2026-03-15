import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { runProFormaFromSettings } from '@/components/machias/FinancialModelV2';
import { DEFAULT_SETTINGS } from '@/components/machias/ModelContext';

const fmt = n => n == null ? '—' : `$${Math.round(Math.abs(n)).toLocaleString()}`;

const SCENARIOS = [
  {
    label: 'Conservative',
    desc: 'Part-time Y1 · No regional · Family health',
    color: '#64748b',
    overrides: { y1_staffing_model: 'parttime_stipend', rb_annual_contract: 0, machiasport_annual_contract: 0, marshfield_annual_contract: 0, whitneyville_annual_contract: 0, northfield_annual_contract: 0 },
  },
  {
    label: 'Baseline',
    desc: 'Full-time SA Y1 · Core regional only',
    color: '#344A60',
    overrides: { marshfield_annual_contract: 0, whitneyville_annual_contract: 0, northfield_annual_contract: 0 },
    highlight: true,
  },
  {
    label: 'Aggressive',
    desc: 'Full regional · Controller Y5 · All initiatives',
    color: '#2A7F7F',
    overrides: { y5_senior_hire: 'controller' },
  },
];

function computeScenario(base, overrides) {
  try {
    const s = { ...base, ...overrides };
    const rows = runProFormaFromSettings(s);
    const cum5 = rows.reduce((a, r) => a + (r.net || 0), 0);
    const y1LevyImpact = rows[0]?.gf?.gfNetLevyImpact ?? 0;
    return { cum5, y1LevyImpact };
  } catch {
    return { cum5: 0, y1LevyImpact: 0 };
  }
}

export default function ScenarioComparisonStrip({ settings }) {
  const results = useMemo(() => {
    const base = { ...DEFAULT_SETTINGS, ...settings };
    return SCENARIOS.map(sc => ({ ...sc, ...computeScenario(base, sc.overrides) }));
  }, [settings]);

  const maxCum = Math.max(...results.map(r => Math.abs(r.cum5)), 1);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 h-full flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Scenario Comparison</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">5-year net benefit across planning scenarios</p>
        </div>
        <Link to="/Scenarios" className="text-[11px] text-slate-500 hover:text-slate-800 underline flex-shrink-0">
          Build scenario →
        </Link>
      </div>

      <div className="flex-1 space-y-4">
        {results.map(sc => {
          const barWidth = Math.max(4, Math.round((Math.abs(sc.cum5) / maxCum) * 100));
          const levyOk = sc.y1LevyImpact <= 0;
          return (
            <div key={sc.label}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-bold ${sc.highlight ? 'text-slate-900' : 'text-slate-600'}`}
                  >
                    {sc.label}
                    {sc.highlight && (
                      <span className="ml-1.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-800 text-white">Active</span>
                    )}
                  </span>
                </div>
                <span className={`text-xs font-bold tabular-nums ${sc.cum5 >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                  {sc.cum5 >= 0 ? '+' : '-'}{fmt(sc.cum5)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-slate-100 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-500"
                    style={{ width: `${barWidth}%`, background: sc.color }}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between mt-1">
                <p className="text-[10px] text-slate-500">{sc.desc}</p>
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${levyOk ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {levyOk ? 'Tax-neutral Y1' : 'Y1 levy pressure'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100">
        <Link
          to="/SensitivityAnalysis"
          className="block w-full text-center text-xs font-semibold py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
        >
          Run Sensitivity Analysis →
        </Link>
      </div>
    </div>
  );
}