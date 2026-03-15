/**
 * ArticleHistoryPanel — Shows multi-year history for a given article title/category.
 * Renders a sparkline-style table of amounts per year with % change.
 */
import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const fmt = n => n == null ? '—' : `$${Math.round(Math.abs(n || 0)).toLocaleString()}`;

export default function ArticleHistoryPanel({ historyRecords }) {
  // historyRecords: [{ fiscal_year, financial_amount, status, adopted, notes }]
  const sorted = [...(historyRecords || [])].sort((a, b) => a.fiscal_year.localeCompare(b.fiscal_year));

  if (sorted.length < 2) {
    return (
      <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
        <p className="text-[10px] text-slate-400 italic">No prior-year history recorded for this article yet. History is built as you save articles across fiscal years.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <div className="bg-slate-900 text-white px-3 py-1.5">
        <p className="text-[10px] font-bold uppercase tracking-wider">Article History by Fiscal Year</p>
      </div>
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-slate-50">
            <th className="px-3 py-1.5 text-left text-[9px] font-bold text-slate-500 uppercase tracking-wider">Year</th>
            <th className="px-3 py-1.5 text-right text-[9px] font-bold text-slate-500 uppercase tracking-wider">Amount</th>
            <th className="px-3 py-1.5 text-right text-[9px] font-bold text-slate-500 uppercase tracking-wider">Change</th>
            <th className="px-3 py-1.5 text-center text-[9px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
            <th className="px-3 py-1.5 text-left text-[9px] font-bold text-slate-500 uppercase tracking-wider">Notes</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r, i) => {
            const prev = sorted[i - 1];
            const diff = prev ? (r.financial_amount || 0) - (prev.financial_amount || 0) : null;
            const pct  = prev && prev.financial_amount ? ((diff / Math.abs(prev.financial_amount)) * 100).toFixed(1) : null;
            const Icon = diff == null ? null : diff > 0 ? TrendingUp : diff < 0 ? TrendingDown : Minus;
            const color = diff == null ? '' : diff > 0 ? 'text-red-600' : diff < 0 ? 'text-emerald-600' : 'text-slate-400';
            return (
              <tr key={r.fiscal_year} className="border-t border-slate-100 hover:bg-slate-50/40">
                <td className="px-3 py-1.5 font-semibold text-slate-800">{r.fiscal_year}</td>
                <td className="px-3 py-1.5 text-right font-mono text-slate-700">{fmt(r.financial_amount)}</td>
                <td className="px-3 py-1.5 text-right">
                  {diff != null ? (
                    <div className={`flex items-center justify-end gap-1 ${color}`}>
                      {Icon && <Icon className="h-3 w-3" />}
                      <span className="font-mono text-[10px]">{diff > 0 ? '+' : ''}{fmt(diff)}{pct ? ` (${pct}%)` : ''}</span>
                    </div>
                  ) : <span className="text-slate-300 text-[10px]">—</span>}
                </td>
                <td className="px-3 py-1.5 text-center">
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold ${r.status === 'adopted' ? 'bg-emerald-100 text-emerald-700' : r.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                    {r.status || 'draft'}
                  </span>
                </td>
                <td className="px-3 py-1.5 text-[10px] text-slate-500 max-w-[200px] truncate">{r.notes || '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}