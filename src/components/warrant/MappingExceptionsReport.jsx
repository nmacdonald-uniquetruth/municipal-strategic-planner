/**
 * MappingExceptionsReport — Exceptions, adoption readiness gate, and BETE rollup.
 */
import React from 'react';
import { XCircle, AlertTriangle, CheckCircle, Lock } from 'lucide-react';
import { BETE_LINES, DEDUCTION_TYPES } from './articleMappingEngine';

const fmt = n => `$${Math.round(Math.abs(n || 0)).toLocaleString()}`;

export default function MappingExceptionsReport({ readiness, beteRollup, budgetCalc }) {
  const { ready, blockers = [], warnings = [], totalLines, mappedLines, unmappedCount, mappingCompletePct } = readiness;

  return (
    <div className="space-y-4">
      {/* Adoption Gate Banner */}
      <div className={`rounded-xl border px-4 py-3 flex items-start gap-3 ${ready ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
        {ready
          ? <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          : <Lock className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />}
        <div>
          <p className={`text-xs font-bold ${ready ? 'text-emerald-800' : 'text-red-800'}`}>
            {ready ? 'Mapping Complete — Adoption Output Enabled' : `Adoption Blocked — ${blockers.length} mapping error${blockers.length !== 1 ? 's' : ''} must be resolved`}
          </p>
          <p className="text-[10px] mt-0.5 text-slate-600">
            {mappedLines} of {totalLines} line items fully mapped ({mappingCompletePct}%). {unmappedCount > 0 ? `${unmappedCount} still need article and BETE line assignment.` : 'All lines assigned.'}
          </p>
        </div>
      </div>

      {/* Error blockers */}
      {blockers.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[9px] font-bold uppercase tracking-widest text-red-600">Mapping Errors (Block Adoption)</p>
          {blockers.map((e, i) => (
            <div key={i} className="rounded-lg border border-red-200 bg-red-50/80 px-3 py-2 flex items-start gap-2">
              <XCircle className="h-3.5 w-3.5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] font-semibold text-red-800">{e.lineItem.label}</p>
                <p className="text-[10px] text-red-600 mt-0.5">{e.reason}</p>
                <p className="text-[9px] text-red-400 mt-0.5">Amount: {fmt(e.lineItem.amount)} · Dept: {e.lineItem.department || '—'}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[9px] font-bold uppercase tracking-widest text-amber-600">Mapping Warnings (Non-blocking)</p>
          {warnings.map((w, i) => (
            <div key={i} className="rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2 flex items-start gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] text-amber-800">{w.lineItem.label}</p>
                <p className="text-[10px] text-amber-600 mt-0.5">{w.reason}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* BETE Line Rollup from mappings */}
      {beteRollup && (
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-900 text-white px-4 py-2">
            <p className="text-[10px] font-bold uppercase tracking-wider">BETE Line Rollup from Mapped Lines</p>
            <p className="text-[9px] text-white/60 mt-0.5">Built bottom-up from account-level mappings</p>
          </div>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-3 py-1.5 text-left text-[9px] font-bold text-slate-400 uppercase tracking-wider">BETE Line</th>
                <th className="px-3 py-1.5 text-right text-[9px] font-bold text-slate-400 uppercase tracking-wider">Mapped Total</th>
                <th className="px-3 py-1.5 text-right text-[9px] font-bold text-slate-400 uppercase tracking-wider">BETE Calc</th>
                <th className="px-3 py-1.5 text-center text-[9px] font-bold text-slate-400 uppercase tracking-wider">Δ</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(BETE_LINES).map(([key, def]) => {
                const mapped = beteRollup[key] || 0;
                const calc   = budgetCalc?.[key] || 0;
                const delta  = mapped - calc;
                const ok     = Math.abs(delta) < 500;
                return (
                  <tr key={key} className="border-t border-slate-100 hover:bg-slate-50/40">
                    <td className="px-3 py-1.5">
                      <p className="text-xs text-slate-700">{def.label}</p>
                      <p className="text-[9px] text-slate-400 font-mono">{key}</p>
                    </td>
                    <td className="px-3 py-1.5 text-right font-mono text-xs text-slate-800">{fmt(mapped)}</td>
                    <td className="px-3 py-1.5 text-right font-mono text-xs text-slate-400">{calc > 0 ? fmt(calc) : '—'}</td>
                    <td className="px-3 py-1.5 text-center">
                      {calc > 0
                        ? ok
                          ? <CheckCircle className="h-3.5 w-3.5 text-emerald-500 inline" />
                          : <span className="text-[9px] font-mono text-amber-700">{delta > 0 ? '+' : ''}{fmt(delta)}</span>
                        : <span className="text-[9px] text-slate-300">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {blockers.length === 0 && warnings.length === 0 && (
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 px-4 py-3 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
          <p className="text-xs text-emerald-700 font-semibold">No mapping exceptions — all line items are fully assigned.</p>
        </div>
      )}
    </div>
  );
}