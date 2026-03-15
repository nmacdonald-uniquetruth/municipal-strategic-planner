/**
 * BudgetVarianceTracker — Post-adoption control: YTD vs adopted vs projected
 */
import React, { useMemo } from 'react';
import { AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { computeVariance, FUND_LABELS } from './budgetProcessEngine';

const fmt = n => n == null ? '—' : `$${Math.round(Math.abs(n)).toLocaleString()}`;
const pct = (a, b) => b > 0 ? ((a / b) * 100).toFixed(1) : '0.0';

const STATUS = {
  on_track:    { icon: TrendingDown, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', label: 'On Track' },
  watch:       { icon: Minus,        color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-200',   label: 'Watch' },
  over_budget: { icon: TrendingUp,   color: 'text-red-600',     bg: 'bg-red-50',     border: 'border-red-200',     label: 'Over Budget' },
};

export default function BudgetVarianceTracker({ depts }) {
  const withVariance = useMemo(() => computeVariance(depts.filter(d => d.adopted_budget > 0)), [depts]);

  const overCount  = withVariance.filter(d => d.status === 'over_budget').length;
  const watchCount = withVariance.filter(d => d.status === 'watch').length;
  const totalAdopted = withVariance.reduce((s, d) => s + (d.adopted_budget || 0), 0);
  const totalProjected = withVariance.reduce((s, d) => s + (d.projected_year_end || 0), 0);
  const totalVariance = totalAdopted - totalProjected;

  return (
    <div className="space-y-4">
      {/* Summary banner */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="text-base font-bold text-slate-900 font-mono">{fmt(totalAdopted)}</p>
          <p className="text-[10px] font-medium text-slate-600 mt-0.5">Total Adopted Budget</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="text-base font-bold text-slate-900 font-mono">{fmt(totalProjected)}</p>
          <p className="text-[10px] font-medium text-slate-600 mt-0.5">Total Projected Year-End</p>
        </div>
        <div className={`rounded-xl border p-3 ${totalVariance >= 0 ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
          <p className={`text-base font-bold font-mono ${totalVariance >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
            {totalVariance >= 0 ? '+' : ''}{fmt(totalVariance)}
          </p>
          <p className="text-[10px] font-medium text-slate-600 mt-0.5">Total Variance (Under/Over)</p>
        </div>
      </div>

      {/* Alert strip */}
      {(overCount > 0 || watchCount > 0) && (
        <div className={`rounded-xl border px-3 py-2 flex items-center gap-2 ${overCount > 0 ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'}`}>
          <AlertTriangle className={`h-4 w-4 flex-shrink-0 ${overCount > 0 ? 'text-red-600' : 'text-amber-600'}`} />
          <p className="text-xs font-semibold text-slate-800">
            {overCount > 0 && `${overCount} department${overCount !== 1 ? 's' : ''} projected over budget. `}
            {watchCount > 0 && `${watchCount} department${watchCount !== 1 ? 's' : ''} to watch.`}
          </p>
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="px-3 py-2 text-left text-[9px] font-bold uppercase tracking-wider">Department</th>
                <th className="px-3 py-2 text-right text-[9px] font-bold uppercase tracking-wider">Adopted</th>
                <th className="px-3 py-2 text-right text-[9px] font-bold uppercase tracking-wider">YTD Actual</th>
                <th className="px-3 py-2 text-right text-[9px] font-bold uppercase tracking-wider">% Spent</th>
                <th className="px-3 py-2 text-right text-[9px] font-bold uppercase tracking-wider">Projected YE</th>
                <th className="px-3 py-2 text-right text-[9px] font-bold uppercase tracking-wider">Variance</th>
                <th className="px-3 py-2 text-right text-[9px] font-bold uppercase tracking-wider">Var %</th>
                <th className="px-3 py-2 text-center text-[9px] font-bold uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {withVariance.map((d, i) => {
                const st = STATUS[d.status];
                const StatusIcon = st.icon;
                return (
                  <tr key={i} className={`border-t border-slate-100 hover:bg-slate-50/40 ${d.status === 'over_budget' ? 'bg-red-50/20' : ''}`}>
                    <td className="px-3 py-2 font-semibold text-slate-800">{d.department}</td>
                    <td className="px-3 py-2 text-right font-mono text-slate-700">{fmt(d.adopted_budget)}</td>
                    <td className="px-3 py-2 text-right font-mono text-slate-600">{fmt(d.ytd_actual)}</td>
                    <td className="px-3 py-2 text-right font-mono text-slate-500">{pct(d.ytd_actual, d.adopted_budget)}%</td>
                    <td className="px-3 py-2 text-right font-mono text-slate-600">{fmt(d.projected_year_end)}</td>
                    <td className={`px-3 py-2 text-right font-mono font-semibold ${d.variance >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                      {d.variance >= 0 ? '+' : ''}{fmt(d.variance)}
                    </td>
                    <td className={`px-3 py-2 text-right font-mono text-[10px] ${d.variance_pct >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {d.variance_pct > 0 ? '+' : ''}{d.variance_pct}%
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={`flex items-center justify-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${st.bg} ${st.color} border ${st.border}`}>
                        <StatusIcon className="h-2.5 w-2.5" /> {st.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {withVariance.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-xs text-slate-400">No adopted budgets to track. Adopt budgets first.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}