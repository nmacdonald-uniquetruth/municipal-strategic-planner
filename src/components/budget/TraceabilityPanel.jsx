import React, { useState } from 'react';
import { ChevronDown, GitMerge, BookOpen, DollarSign, Link2 } from 'lucide-react';
import { getTraceabilityInfo } from './coaBudgetBridge';

/**
 * TraceabilityPanel — trace any budget line to source accounts, articles, funds
 * Displays: new account ← TRIO sources → article → fund → dept
 */
export default function TraceabilityPanel({ newAccountNumber, coaAccounts, budgetValue }) {
  const [open, setOpen] = useState(false);
  const traceInfo = getTraceabilityInfo(newAccountNumber, coaAccounts);

  if (!traceInfo) {
    return <div className="text-[10px] text-slate-400">No COA mapping found</div>;
  }

  return (
    <div className="border border-slate-200 rounded-lg bg-white">
      {/* Toggle header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <Link2 className="h-3.5 w-3.5 text-slate-400" />
          Trace Account
        </div>
        <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="border-t border-slate-200 p-3 space-y-2 text-xs">
          {/* New account */}
          <div className="bg-emerald-50 border border-emerald-200 rounded p-2">
            <p className="font-bold text-emerald-900 flex items-center gap-1.5">
              <GitMerge className="h-3.5 w-3.5" />
              New Account
            </p>
            <p className="text-emerald-800 font-mono mt-1">{traceInfo.new_account_number}</p>
            <p className="text-emerald-700 mt-0.5">{traceInfo.new_account_title}</p>
          </div>

          {/* TRIO sources */}
          {traceInfo.trio_sources?.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded p-2">
              <p className="font-bold text-blue-900">TRIO Sources ({traceInfo.trio_sources.length})</p>
              {traceInfo.trio_sources.map((src, i) => (
                <div key={i} className="mt-1.5 text-blue-800">
                  <p className="font-mono text-blue-900">{src.trio_account}</p>
                  <p className="text-blue-700">{src.trio_description}</p>
                  <p className="text-[9px] text-blue-600 mt-0.5">
                    Budget: ${src.trio_historical_budget?.toLocaleString()} | 
                    Actual: ${src.trio_historical_actual?.toLocaleString()} |
                    Mapping: {src.mapping_type} {src.mapping_split_percent !== 100 ? `(${src.mapping_split_percent}%)` : ''}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Organization */}
          <div className="grid grid-cols-2 gap-2">
            {traceInfo.article_mapping && (
              <div className="bg-amber-50 border border-amber-200 rounded p-2">
                <p className="font-bold text-amber-900 flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  Article
                </p>
                <p className="text-amber-800 font-semibold mt-0.5">{traceInfo.article_mapping}</p>
              </div>
            )}

            {traceInfo.fund && (
              <div className="bg-violet-50 border border-violet-200 rounded p-2">
                <p className="font-bold text-violet-900 flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  Fund
                </p>
                <p className="text-violet-800 font-semibold mt-0.5 capitalize">{traceInfo.fund.replace(/_/g, ' ')}</p>
              </div>
            )}

            {traceInfo.department && (
              <div className="col-span-2 bg-slate-50 border border-slate-200 rounded p-2">
                <p className="font-bold text-slate-900">Department</p>
                <p className="text-slate-700 mt-0.5">{traceInfo.department}</p>
              </div>
            )}

            {traceInfo.reporting_category && (
              <div className="col-span-2 bg-slate-50 border border-slate-200 rounded p-2">
                <p className="font-bold text-slate-900">Reporting Category</p>
                <p className="text-slate-700 mt-0.5 capitalize">{traceInfo.reporting_category.replace(/_/g, ' ')}</p>
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="border-t border-slate-200 pt-2 mt-2">
            <p className="text-[9px] text-slate-600 leading-relaxed">
              {traceInfo.trio_sources?.length ? (
                <>This new account aggregates {traceInfo.trio_sources.length} legacy TRIO account{traceInfo.trio_sources.length > 1 ? 's' : ''}.</>
              ) : (
                <>This is a new account with no TRIO predecessor.</>
              )}
              {' '}
              {traceInfo.mapping_type === 'one_to_one' && 'Direct 1:1 mapping.'}
              {traceInfo.mapping_type === 'one_to_many' && 'This TRIO account splits across multiple new accounts.'}
              {traceInfo.mapping_type === 'many_to_one' && 'Multiple TRIO accounts aggregate here.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}