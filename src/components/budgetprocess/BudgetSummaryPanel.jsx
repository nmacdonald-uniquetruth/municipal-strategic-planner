/**
 * BudgetSummaryPanel — Public-ready and internal summary views
 */
import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { aggregateBudget, resolveActiveColumn, FUND_LABELS, buildPublicSummary, buildBeteRollupFromDepts, BETE_FIELDS } from './budgetProcessEngine';

const fmt = n => n == null ? '—' : `$${Math.round(Math.abs(n || 0)).toLocaleString()}`;

const FUND_COLORS = {
  general_fund:    '#344A60',
  school:          '#2A7F7F',
  county:          '#9C5334',
  enterprise:      '#2D7D46',
  tif:             '#6B5EA8',
  debt_service:    '#B5691E',
  capital_reserve: '#4a4a8a',
  special_revenue: '#5a7a5a',
};

export default function BudgetSummaryPanel({ process, depts, activePhase }) {
  const [view, setView] = useState('public');
  const activeColumn = resolveActiveColumn(activePhase);
  const totals = useMemo(() => aggregateBudget(depts, activeColumn), [depts, activeColumn]);
  const beteRollup = useMemo(() => buildBeteRollupFromDepts(depts, activeColumn), [depts, activeColumn]);
  const publicText = useMemo(() => buildPublicSummary(process, depts, activeColumn), [process, depts, activeColumn]);

  // Chart data: by fund
  const chartData = useMemo(() => {
    const groups = {};
    depts.forEach(d => {
      const k = d.fund || 'general_fund';
      groups[k] = (groups[k] || 0) + (d[activeColumn] || 0);
    });
    return Object.entries(groups).map(([fund, val]) => ({ name: FUND_LABELS[fund] || fund, value: val, fund }));
  }, [depts, activeColumn]);

  return (
    <div className="space-y-4">
      {/* View toggle */}
      <div className="flex gap-2">
        {[['public','Public Summary'],['bete','BETE Rollup'],['chart','Fund Chart']].map(([v, l]) => (
          <button key={v} onClick={() => setView(v)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${view === v ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* Public summary */}
      {view === 'public' && (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="bg-slate-900 text-white px-4 py-2.5">
            <p className="text-xs font-bold">Public Budget Summary</p>
            <p className="text-[9px] text-white/60 mt-0.5">Plain-language for town website, newsletter, or public meeting</p>
          </div>
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Total Appropriations', value: fmt(totals.active) },
                { label: 'Prior Year Appropriations', value: fmt(totals.prior_year_budget) },
                { label: 'Enterprise Transfers', value: fmt(totals.enterprise_transfers) },
              ].map(s => (
                <div key={s.label} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                  <p className="text-sm font-bold text-slate-900 font-mono">{s.value}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
            <pre className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap font-mono bg-slate-50 rounded-xl p-4 border border-slate-100 max-h-80 overflow-y-auto">
              {publicText}
            </pre>
          </div>
        </div>
      )}

      {/* BETE rollup */}
      {view === 'bete' && (
        <div className="rounded-2xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-900 text-white px-4 py-2.5">
            <p className="text-xs font-bold">BETE Form Rollup from Department Budgets</p>
            <p className="text-[9px] text-white/60 mt-0.5">Auto-computed from BETE mapping on each department</p>
          </div>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-4 py-2 text-left text-[9px] font-bold text-slate-500 uppercase tracking-wider">BETE Line Item</th>
                <th className="px-4 py-2 text-right text-[9px] font-bold text-slate-500 uppercase tracking-wider">From Depts</th>
              </tr>
            </thead>
            <tbody>
              {BETE_FIELDS.map(bf => (
                <tr key={bf.key} className="border-t border-slate-100 hover:bg-slate-50/40">
                  <td className="px-4 py-2 text-slate-700">{bf.label}</td>
                  <td className="px-4 py-2 text-right font-mono text-slate-900">{fmt(beteRollup[bf.key])}</td>
                </tr>
              ))}
              <tr className="bg-slate-50 border-t border-slate-200">
                <td className="px-4 py-2 font-bold text-slate-900">Total (All BETE Lines)</td>
                <td className="px-4 py-2 text-right font-mono font-bold text-slate-900">
                  {fmt(Object.values(beteRollup).reduce((s, v) => s + v, 0))}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Fund chart */}
      {view === 'chart' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-bold text-slate-700 mb-3">Budget by Fund — {activeColumn.replace(/_/g, ' ')}</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 0, right: 10, left: 10, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={v => [`$${Math.round(v).toLocaleString()}`, 'Budget']} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={FUND_COLORS[entry.fund] || '#344A60'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}