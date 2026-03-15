/**
 * COA-Driven Budget Summary
 * Replaces old summary pages with COA-sourced rollups
 * Shows appropriations/revenues/transfers aggregated from approved accounts
 */

import React, { useState } from 'react';
import { useCOABudgetReconciliation, traceTotal } from './useCOABudgetReconciliation';
import BudgetLineageTracer from './BudgetLineageTracer';
import { TrendingDown, TrendingUp, Building2 } from 'lucide-react';

export default function COADrivenBudgetSummary({ accounts, budgetLines = [], departmentBudgets = [], articles = [] }) {
  const [tracingTotal, setTracingTotal] = useState(null);
  const rec = useCOABudgetReconciliation(accounts, budgetLines, departmentBudgets, articles);

  if (rec.error) return <div className="p-4 text-red-700">{rec.error}</div>;

  // Summary card
  const SummaryCard = ({ icon: Icon, label, value, color }) => (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-600 mb-1">{label}</p>
          <p className={`text-xl font-bold ${color}`}>${(value || 0).toLocaleString()}</p>
        </div>
        <Icon className={`h-5 w-5 ${color} opacity-60`} />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* KPI strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <SummaryCard icon={TrendingDown} label="Total Appropriations" value={rec.totalAppropriations} color="text-slate-900" />
        <SummaryCard icon={TrendingUp} label="Total Revenues" value={rec.totalRevenues} color="text-emerald-700" />
        <SummaryCard icon={Building2} label="Net To Be Raised" value={rec.totalAppropriations - rec.totalRevenues} color="text-amber-700" />
      </div>

      {/* By Department */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-bold text-slate-900 mb-3">By Department</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-3 py-2 font-semibold text-slate-700">Department</th>
                <th className="text-right px-3 py-2 font-semibold text-slate-700">Budget</th>
                <th className="text-right px-3 py-2 font-semibold text-slate-700">YTD Actual</th>
                <th className="text-right px-3 py-2 font-semibold text-slate-700">Variance %</th>
                <th className="text-center px-3 py-2 font-semibold text-slate-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {rec.rollupByDept.map((rollup, i) => {
                const variance = ((rollup.totalActual - rollup.totalBudget) / rollup.totalBudget) * 100 || 0;
                return (
                  <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-3 py-2 font-medium text-slate-900">{rollup.department}</td>
                    <td className="px-3 py-2 text-right font-semibold">${(rollup.totalBudget || 0).toLocaleString()}</td>
                    <td className="px-3 py-2 text-right">${(rollup.totalActual || 0).toLocaleString()}</td>
                    <td className={`px-3 py-2 text-right font-semibold ${variance > 5 ? 'text-red-600' : variance < -5 ? 'text-amber-600' : 'text-slate-700'}`}>
                      {variance > 0 ? '+' : ''}{variance.toFixed(1)}%
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        onClick={() => setTracingTotal({ value: rollup.totalBudget, filter: l => l.department === rollup.department })}
                        className="text-blue-600 hover:text-blue-700 font-semibold underline text-[10px]"
                      >
                        Trace
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* By Fund */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-bold text-slate-900 mb-3">By Fund</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-3 py-2 font-semibold text-slate-700">Fund</th>
                <th className="text-left px-3 py-2 font-semibold text-slate-700">Type</th>
                <th className="text-right px-3 py-2 font-semibold text-slate-700">Budget</th>
                <th className="text-right px-3 py-2 font-semibold text-slate-700">Historical</th>
                <th className="text-center px-3 py-2 font-semibold text-slate-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {rec.rollupByFund.map((rollup, i) => (
                <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-3 py-2 font-medium text-slate-900">{rollup.fund}</td>
                  <td className="px-3 py-2 text-slate-600">{rollup.fundType}</td>
                  <td className="px-3 py-2 text-right font-semibold">${(rollup.totalBudget || 0).toLocaleString()}</td>
                  <td className="px-3 py-2 text-right text-slate-500">${(rollup.totalHistorical || 0).toLocaleString()}</td>
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={() => setTracingTotal({ value: rollup.totalBudget, filter: l => l.fund === rollup.fund })}
                      className="text-blue-600 hover:text-blue-700 font-semibold underline text-[10px]"
                    >
                      Trace
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* By Article */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-bold text-slate-900 mb-3">By Warrant Article</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-3 py-2 font-semibold text-slate-700">Article</th>
                <th className="text-right px-3 py-2 font-semibold text-slate-700">Budget</th>
                <th className="text-center px-3 py-2 font-semibold text-slate-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {rec.rollupByArticle.map((rollup, i) => (
                <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-3 py-2 font-medium text-slate-900">{rollup.article}</td>
                  <td className="px-3 py-2 text-right font-semibold">${(rollup.totalBudget || 0).toLocaleString()}</td>
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={() => setTracingTotal({ value: rollup.totalBudget, filter: l => l.budgetArticle === rollup.article })}
                      className="text-blue-600 hover:text-blue-700 font-semibold underline text-[10px]"
                    >
                      Trace
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lineage tracer modal */}
      {tracingTotal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Budget Lineage</h2>
              <button onClick={() => setTracingTotal(null)} className="text-slate-400 hover:text-slate-600 font-bold text-xl">
                ×
              </button>
            </div>
            <BudgetLineageTracer
              lineageData={traceTotal(tracingTotal.value, rec.coaBudgetLines, tracingTotal.filter)}
              totalAmount={tracingTotal.value}
            />
          </div>
        </div>
      )}
    </div>
  );
}