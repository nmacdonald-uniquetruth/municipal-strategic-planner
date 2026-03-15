/**
 * BudgetControlTable — Main budget control grid with all columns & status flags
 */
import React, { useState, useMemo } from 'react';
import { computeControlMetrics } from './budgetControlEngine';
import { AlertTriangle, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronRight } from 'lucide-react';

const fmt = n => n == null ? '—' : `$${Math.round(Math.abs(n || 0)).toLocaleString()}`;
const pct = n => `${(n || 0).toFixed(1)}%`;
const signed = n => n >= 0 ? `+$${Math.round(n).toLocaleString()}` : `-$${Math.round(Math.abs(n)).toLocaleString()}`;

const STATUS_STYLES = {
  on_track:    { icon: TrendingDown, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', label: 'On Track' },
  watch:       { icon: Minus,        color: 'text-amber-600',   bg: 'bg-amber-50 border-amber-200',     label: 'Watch' },
  over_budget: { icon: TrendingUp,   color: 'text-red-600',     bg: 'bg-red-50 border-red-200',         label: 'Over Budget' },
  low_exec:    { icon: TrendingDown, color: 'text-orange-600',  bg: 'bg-orange-50 border-orange-200',   label: 'Low Execution' },
};

function statusFor(m) {
  if (m.overBudget) return 'over_budget';
  if (m.lowExecution) return 'low_exec';
  if (m.nearlyExhausted) return 'watch';
  if (Math.abs(m.variancePct) < 5) return 'on_track';
  return 'watch';
}

function SpendBar({ pct: spent, expected }) {
  const sp = Math.min(100, spent);
  const ex = Math.min(100, expected);
  return (
    <div className="relative h-2 w-24 bg-slate-100 rounded-full overflow-hidden" title={`${sp.toFixed(1)}% spent, ${ex.toFixed(1)}% expected`}>
      <div className="absolute inset-y-0 left-0 bg-slate-200 rounded-full" style={{ width: `${ex}%` }} />
      <div className={`absolute inset-y-0 left-0 rounded-full ${sp > ex + 10 ? 'bg-red-500' : sp > ex ? 'bg-amber-400' : 'bg-emerald-500'}`} style={{ width: `${sp}%` }} />
    </div>
  );
}

export default function BudgetControlTable({ records, currentMonth, onEdit }) {
  const [expandedFund, setExpandedFund] = useState(null);
  const [sortField, setSortField] = useState('department');
  const [sortDir, setSortDir] = useState(1);

  const withMetrics = useMemo(() =>
    records.map(r => ({ ...r, _m: computeControlMetrics(r, currentMonth) })),
    [records, currentMonth]
  );

  // Group by fund
  const groups = useMemo(() => {
    const g = {};
    withMetrics.forEach(r => {
      const k = r.fund || 'general_fund';
      if (!g[k]) g[k] = [];
      g[k].push(r);
    });
    return g;
  }, [withMetrics]);

  const FUND_LABELS = { general_fund: 'General Fund', school: 'School', county: 'County', enterprise: 'Enterprise', tif: 'TIF', debt_service: 'Debt Service', capital_reserve: 'Capital Reserve', special_revenue: 'Special Revenue' };

  const handleSort = field => {
    if (sortField === field) setSortDir(d => d * -1);
    else { setSortField(field); setSortDir(1); }
  };

  const Th = ({ field, children }) => (
    <th onClick={() => handleSort(field)} className="px-2 py-2 text-right text-[9px] font-bold uppercase tracking-wider cursor-pointer hover:bg-white/10 select-none whitespace-nowrap">
      {children}{sortField === field ? (sortDir > 0 ? ' ↑' : ' ↓') : ''}
    </th>
  );

  return (
    <div className="rounded-2xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse" style={{ minWidth: 1100 }}>
          <thead>
            <tr className="bg-slate-900 text-white">
              <th className="px-3 py-2 text-left text-[9px] font-bold uppercase tracking-wider w-36">Department</th>
              <Th field="budget">Adopted</Th>
              <Th field="revised">Revised</Th>
              <Th field="encumb">Encumb.</Th>
              <Th field="ytd">YTD Actual</Th>
              <Th field="obligated">Obligated</Th>
              <Th field="remaining">Remaining</Th>
              <Th field="pctSpent">% Spent</Th>
              <th className="px-2 py-2 text-center text-[9px] font-bold uppercase tracking-wider">vs Expected</th>
              <Th field="projected">Projected YE</Th>
              <Th field="variance">Variance</Th>
              <Th field="gaap">GAAP Adj.</Th>
              <th className="px-2 py-2 text-center text-[9px] font-bold uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(groups).map(([fund, rows]) => {
              const expanded = expandedFund === null || expandedFund === fund;
              const fundTotals = rows.reduce((acc, r) => {
                const m = r._m;
                acc.budget += m.budget; acc.ytd += m.ytd; acc.encumb += m.encumb;
                acc.obligated += m.obligated; acc.remaining += m.remaining;
                acc.projected += m.projected; acc.variance += m.variance;
                return acc;
              }, { budget:0, ytd:0, encumb:0, obligated:0, remaining:0, projected:0, variance:0 });
              const fundPctSpent = fundTotals.budget > 0 ? (fundTotals.ytd / fundTotals.budget) * 100 : 0;

              const sorted = [...rows].sort((a, b) => {
                const fld = { budget:'_m.budget', revised:'revised_budget', ytd:'_m.ytd', projected:'_m.projected', variance:'_m.variance', remaining:'_m.remaining', pctSpent:'_m.pctSpent', encumb:'_m.encumb', obligated:'_m.obligated', gaap:'_m.gaapAdj' };
                const get = (obj, path) => path.split('.').reduce((o, k) => o?.[k], obj);
                const af = get(a, fld[sortField] || sortField);
                const bf = get(b, fld[sortField] || sortField);
                if (typeof af === 'string') return af.localeCompare(bf) * sortDir;
                return ((af || 0) - (bf || 0)) * sortDir;
              });

              return (
                <React.Fragment key={fund}>
                  {/* Fund header row */}
                  <tr className="bg-slate-700 text-white cursor-pointer" onClick={() => setExpandedFund(expandedFund === fund ? null : fund)}>
                    <td className="px-3 py-1.5 font-bold flex items-center gap-1.5 text-[11px]">
                      {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                      {FUND_LABELS[fund] || fund}
                    </td>
                    <td className="px-2 py-1.5 text-right font-mono text-[10px]">{fmt(fundTotals.budget)}</td>
                    <td colSpan={2} />
                    <td className="px-2 py-1.5 text-right font-mono text-[10px]">{fmt(fundTotals.ytd)}</td>
                    <td className="px-2 py-1.5 text-right font-mono text-[10px]">{fmt(fundTotals.obligated)}</td>
                    <td className="px-2 py-1.5 text-right font-mono text-[10px]">{fmt(fundTotals.remaining)}</td>
                    <td className="px-2 py-1.5 text-right font-mono text-[10px]">{pct(fundPctSpent)}</td>
                    <td />
                    <td className="px-2 py-1.5 text-right font-mono text-[10px]">{fmt(fundTotals.projected)}</td>
                    <td className={`px-2 py-1.5 text-right font-mono font-bold text-[10px] ${fundTotals.variance >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>{signed(fundTotals.variance)}</td>
                    <td colSpan={2} />
                  </tr>
                  {/* Dept rows */}
                  {expanded && sorted.map((r, i) => {
                    const m = r._m;
                    const st = STATUS_STYLES[statusFor(m)];
                    const StatusIcon = st.icon;
                    return (
                      <tr key={i} className={`border-t border-slate-100 hover:bg-slate-50/60 transition-colors ${m.overBudget ? 'bg-red-50/30' : ''}`}>
                        <td className="px-3 py-2">
                          <button onClick={() => onEdit?.(r)} className="text-left hover:underline font-semibold text-slate-800">{r.department}</button>
                          {r.article_number && <div className="text-[9px] text-slate-400">{r.article_number}</div>}
                        </td>
                        <td className="px-2 py-2 text-right font-mono text-slate-700">{fmt(m.budget)}</td>
                        <td className="px-2 py-2 text-right font-mono text-slate-500 text-[10px]">{r.revised_budget ? fmt(r.revised_budget) : '—'}</td>
                        <td className="px-2 py-2 text-right font-mono text-slate-500 text-[10px]">{m.encumb ? fmt(m.encumb) : '—'}</td>
                        <td className="px-2 py-2 text-right font-mono text-slate-700">{fmt(m.ytd)}</td>
                        <td className="px-2 py-2 text-right font-mono text-slate-600 text-[10px]">{fmt(m.obligated)}</td>
                        <td className={`px-2 py-2 text-right font-mono text-[10px] font-semibold ${m.remaining < m.budget * 0.1 ? 'text-red-600' : m.remaining < m.budget * 0.2 ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {fmt(m.remaining)}
                        </td>
                        <td className="px-2 py-2">
                          <div className="flex items-center gap-1.5 justify-end">
                            <span className="font-mono text-[10px] text-slate-600">{pct(m.pctSpent)}</span>
                            <SpendBar pct={m.pctSpent} expected={m.expectedPct} />
                          </div>
                        </td>
                        <td className="px-2 py-2 text-center">
                          <span className={`text-[9px] font-bold ${m.executionGap > 5 ? 'text-red-600' : m.executionGap < -10 ? 'text-amber-600' : 'text-emerald-600'}`}>
                            {m.executionGap > 0 ? '+' : ''}{m.executionGap.toFixed(1)}pp
                          </span>
                        </td>
                        <td className="px-2 py-2 text-right font-mono text-slate-600 text-[10px]">{fmt(m.projected)}</td>
                        <td className={`px-2 py-2 text-right font-mono font-semibold text-[10px] ${m.variance >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                          {signed(m.variance)}
                        </td>
                        <td className="px-2 py-2 text-right font-mono text-slate-400 text-[10px]">{m.gaapAdj ? fmt(m.gaapAdj) : '—'}</td>
                        <td className="px-2 py-2 text-center">
                          <span className={`flex items-center justify-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${st.bg} ${st.color}`}>
                            <StatusIcon className="h-2.5 w-2.5" />{st.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              );
            })}
            {records.length === 0 && (
              <tr><td colSpan={13} className="px-4 py-10 text-center text-xs text-slate-400">No budget control records. Add department records to begin tracking.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}