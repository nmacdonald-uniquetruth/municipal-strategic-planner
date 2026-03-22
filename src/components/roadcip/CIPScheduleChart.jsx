/**
 * CIPScheduleChart.jsx — 10-15 year fund balance bar/line chart + annual table.
 */
import React from 'react';
import { BarChart, Bar, Line, ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { fmt, fmtK } from './roadCIPEngine';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-xs space-y-1">
      <p className="font-bold text-slate-800 mb-1.5">FY{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: p.color }} />
          <span className="text-slate-600">{p.name}:</span>
          <span className="font-semibold text-slate-900">{fmtK(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

export default function CIPScheduleChart({ schedule }) {
  if (!schedule?.length) return null;

  const chartData = schedule.map(y => ({
    year:     y.year,
    Sources:  Math.round(y.total_sources),
    Uses:     Math.round(y.total_uses),
    Balance:  Math.round(y.ending_reserve),
  }));

  return (
    <div className="space-y-4">
      {/* Stacked chart */}
      <div style={{ height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 4, right: 12, left: 8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="year" tick={{ fontSize: 10 }} />
            <YAxis tickFormatter={v => `$${(v/1000).toFixed(0)}K`} tick={{ fontSize: 10 }} width={54} />
            <Tooltip content={<CustomTooltip />} />
            <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
            <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="4 2" strokeWidth={1.5} />
            <Bar dataKey="Sources" name="Total Sources" fill="#34d399" radius={[2,2,0,0]} maxBarSize={28} />
            <Bar dataKey="Uses"    name="Total Uses"    fill="#f59e0b" radius={[2,2,0,0]} maxBarSize={28} />
            <Line dataKey="Balance" name="Reserve Balance" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} type="monotone" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Year-by-year table */}
      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs min-w-[700px]">
            <thead>
              <tr className="bg-slate-800 text-white">
                {['Year', 'Begin Reserve', 'GF Transfer', 'Excise', 'LRAP', 'Total Sources', 'Total Uses', 'End Reserve', 'Projects'].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-[9px] font-bold uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {schedule.map((y, i) => (
                <tr key={y.year} className={`border-t border-slate-100 ${y.is_deficit ? 'bg-red-50' : i % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}>
                  <td className="px-3 py-2 font-bold text-slate-800">FY{y.year}</td>
                  <td className="px-3 py-2 tabular-nums text-right text-slate-600">{fmtK(y.beginning_reserve)}</td>
                  <td className="px-3 py-2 tabular-nums text-right text-emerald-700">{fmtK(y.gf_transfer)}</td>
                  <td className="px-3 py-2 tabular-nums text-right text-teal-700">{fmtK(y.excise_allocation)}</td>
                  <td className="px-3 py-2 tabular-nums text-right text-blue-600">{fmtK(y.lrap)}</td>
                  <td className="px-3 py-2 tabular-nums text-right font-semibold text-emerald-800">{fmtK(y.total_sources)}</td>
                  <td className="px-3 py-2 tabular-nums text-right font-semibold text-amber-800">{fmtK(y.total_uses)}</td>
                  <td className={`px-3 py-2 tabular-nums text-right font-bold ${y.is_deficit ? 'text-red-700' : 'text-slate-900'}`}>
                    {y.is_deficit ? '(' : ''}{fmtK(Math.abs(y.ending_reserve))}{y.is_deficit ? ')' : ''}
                  </td>
                  <td className="px-3 py-2 text-slate-500">{y.projects?.length || 0} projects</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}