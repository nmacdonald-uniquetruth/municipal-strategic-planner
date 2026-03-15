/**
 * BudgetLineageTracer
 * Interactive component to trace any budget total back to:
 *  - Source account (new COA structure)
 *  - Historical TRIO account(s)
 *  - Warrant article
 *  - Fund classification
 *  - Confidence level of mapping
 */

import React, { useState } from 'react';
import { ChevronDown, Link as LinkIcon, AlertCircle } from 'lucide-react';

export default function BudgetLineageTracer({ lineageData, totalAmount }) {
  const [expandedLines, setExpandedLines] = useState(new Set());

  if (!lineageData?.lines?.length) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
        <p className="text-xs text-amber-700">No lineage data available for this total.</p>
      </div>
    );
  }

  const toggleLine = (accountNum) => {
    const next = new Set(expandedLines);
    if (next.has(accountNum)) next.delete(accountNum);
    else next.add(accountNum);
    setExpandedLines(next);
  };

  const confidenceBadge = (conf) => {
    if (!conf) return null;
    const colors = {
      exact: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      estimated: 'bg-amber-100 text-amber-700 border-amber-200',
      ambiguous: 'bg-red-100 text-red-700 border-red-200',
    };
    return (
      <span className={`text-[10px] px-2 py-0.5 rounded border font-semibold ${colors[conf.level] || colors.ambiguous}`} title={conf.reason}>
        {conf.level === 'exact' ? '✓ Exact' : conf.level === 'estimated' ? '⚠ Estimated' : '✗ Ambiguous'}
      </span>
    );
  };

  return (
    <div className="space-y-2 text-xs">
      <p className="font-bold text-slate-700 flex items-center gap-2">
        <LinkIcon className="h-3.5 w-3.5" />
        Lineage: ${totalAmount?.toLocaleString()} total
      </p>

      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
        {lineageData.lines.map((line, i) => {
          const expanded = expandedLines.has(line.newAccount);
          const hasTrioSources = line.trioSources?.length > 0;

          return (
            <div key={i} className="border-b border-slate-100 last:border-b-0">
              {/* New Account row */}
              <button
                onClick={() => hasTrioSources && toggleLine(line.newAccount)}
                className={`w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors flex items-center justify-between ${hasTrioSources ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">{line.newAccount}</p>
                  <p className="text-slate-500 text-[9px]">{line.newTitle}</p>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[8px] font-semibold">{line.fund}</span>
                    {line.article && <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[8px] font-semibold">{line.article}</span>}
                    {line.department && <span className="px-1.5 py-0.5 rounded bg-slate-50 text-slate-600 text-[8px]">{line.department}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="text-right">
                    <p className="font-bold text-slate-900">${(line.amount || 0).toLocaleString()}</p>
                    {line.mappingConfidence && (
                      <div className="mt-0.5">
                        {confidenceBadge(line.mappingConfidence)}
                      </div>
                    )}
                  </div>
                  {hasTrioSources && (
                    <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                  )}
                </div>
              </button>

              {/* TRIO sources (expandable) */}
              {expanded && hasTrioSources && (
                <div className="bg-slate-50 px-3 py-2 border-t border-slate-200">
                  <p className="text-[9px] font-bold text-slate-600 mb-1.5">Source Accounts (TRIO):</p>
                  <div className="space-y-1">
                    {line.trioSources.map((trio, j) => (
                      <div key={j} className="pl-3 border-l-2 border-slate-300 py-1">
                        <p className="font-mono text-[9px] text-slate-700">{trio.trioAccount}</p>
                        <p className="text-[8px] text-slate-500">{trio.trioDescription}</p>
                        {trio.allocation && trio.allocation !== 100 && (
                          <p className="text-[8px] text-amber-600 font-semibold mt-0.5">Allocation: {trio.allocation}%</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Reconciliation footer */}
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
        <div className="flex items-center justify-between text-[9px]">
          <span className="font-semibold text-slate-700">Total from lineage:</span>
          <span className="font-bold text-slate-900">${lineageData.lines.reduce((s, l) => s + (l.amount || 0), 0).toLocaleString()}</span>
        </div>
        {lineageData.variance && Math.abs(lineageData.variance) > 1 && (
          <div className="flex items-center gap-1.5 mt-1.5 p-1.5 rounded bg-amber-50 border border-amber-200">
            <AlertCircle className="h-3 w-3 text-amber-600 flex-shrink-0" />
            <span className="text-[8px] text-amber-700">Variance: ${Math.abs(lineageData.variance).toLocaleString()} — check for unmapped accounts</span>
          </div>
        )}
      </div>
    </div>
  );
}