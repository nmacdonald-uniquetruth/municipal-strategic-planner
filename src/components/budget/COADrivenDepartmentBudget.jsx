/**
 * COA-Driven Department Budget Sheet
 * Replaces legacy DepartmentBudget views
 * Shows all budget lines sourced from approved COA with TRIO historical data
 */

import React, { useState, useMemo } from 'react';
import { useCOABudgetReconciliation } from './useCOABudgetReconciliation';
import BudgetLineageTracer from './BudgetLineageTracer';
import { ChevronDown, AlertCircle } from 'lucide-react';

export default function COADrivenDepartmentBudget({
  accounts,
  departmentName,
  budgetLines = [],
  departmentBudgets = [],
  articles = [],
}) {
  const [expandedLineage, setExpandedLineage] = useState(null);
  const rec = useCOABudgetReconciliation(accounts, budgetLines, departmentBudgets, articles);

  if (rec.error) return <div className="p-4 text-red-700">{rec.error}</div>;

  // Filter lines for this department
  const deptLines = useMemo(
    () => rec.coaBudgetLines.filter(l => l.department === departmentName),
    [rec.coaBudgetLines, departmentName]
  );

  // Group by reporting category
  const byCategory = {};
  deptLines.forEach(line => {
    const cat = line.reportingCategory || 'other';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(line);
  });

  const totalBudget = deptLines.reduce((s, l) => s + (l.adoptedBudget || 0), 0);
  const totalHistorical = deptLines.reduce((s, l) => s + (l.historicalBudget || 0), 0);
  const totalActual = deptLines.reduce((s, l) => s + (l.ytdActual || 0), 0);

  // Line item detail row
  const LineRow = ({ line }) => (
    <tr className="border-b border-slate-100 hover:bg-slate-50">
      <td className="px-3 py-2 font-mono text-[10px] text-slate-700">{line.accountNumber}</td>
      <td className="px-3 py-2 text-xs font-medium text-slate-900 max-w-xs truncate" title={line.accountTitle}>
        {line.accountTitle}
      </td>
      <td className="px-3 py-2 text-right text-xs font-semibold text-slate-900">
        ${(line.historicalBudget || 0).toLocaleString()}
      </td>
      <td className="px-3 py-2 text-right text-xs font-semibold text-slate-900">
        ${(line.adoptedBudget || 0).toLocaleString()}
      </td>
      <td className="px-3 py-2 text-right text-xs text-slate-600">
        {line.adoptedBudget && line.historicalBudget
          ? `${(((line.adoptedBudget - line.historicalBudget) / line.historicalBudget) * 100).toFixed(1)}%`
          : '—'}
      </td>
      <td className="px-3 py-2 text-right text-xs font-semibold text-slate-900">
        ${(line.ytdActual || 0).toLocaleString()}
      </td>
      <td className="px-3 py-2 text-center">
        {line.budgetArticle && (
          <span className="inline-block px-2 py-0.5 text-[9px] rounded bg-slate-100 text-slate-700 font-semibold">
            {line.budgetArticle}
          </span>
        )}
      </td>
      <td className="px-3 py-2 text-center">
        {line.mappingConfidence && (
          <button
            onClick={() => setExpandedLineage(line)}
            className="text-blue-600 hover:text-blue-700 text-[10px] font-semibold underline"
          >
            Trace
          </button>
        )}
      </td>
      {line.mappingConfidence?.level === 'ambiguous' && (
        <td className="px-3 py-2 text-center">
          <AlertCircle className="h-3.5 w-3.5 text-red-600" title={line.mappingConfidence.reason} />
        </td>
      )}
    </tr>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <h2 className="text-lg font-bold text-slate-900 mb-2">{departmentName}</h2>
        <div className="grid grid-cols-3 gap-4 text-xs">
          <div>
            <p className="text-slate-600 font-semibold mb-1">Historical Budget (TRIO)</p>
            <p className="text-lg font-bold text-slate-900">${totalHistorical.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-slate-600 font-semibold mb-1">Adopted Budget (New COA)</p>
            <p className="text-lg font-bold text-slate-900">${totalBudget.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-slate-600 font-semibold mb-1">YTD Actual</p>
            <p className="text-lg font-bold text-slate-900">${totalActual.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Budget by category */}
      {Object.entries(byCategory).map(([category, lines]) => {
        const catBudget = lines.reduce((s, l) => s + (l.adoptedBudget || 0), 0);
        const catHistorical = lines.reduce((s, l) => s + (l.historicalBudget || 0), 0);

        return (
          <div key={category} className="rounded-lg border border-slate-200 bg-white overflow-hidden">
            {/* Category header */}
            <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200">
              <p className="text-xs font-bold text-slate-900">{category.replace(/_/g, ' ').toUpperCase()}</p>
              <p className="text-[10px] text-slate-600 mt-0.5">
                Historical: ${catHistorical.toLocaleString()} | Budget: ${catBudget.toLocaleString()}
              </p>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-white border-b border-slate-200">
                  <tr>
                    <th className="text-left px-3 py-2 font-semibold text-slate-700">Account</th>
                    <th className="text-left px-3 py-2 font-semibold text-slate-700">Description</th>
                    <th className="text-right px-3 py-2 font-semibold text-slate-700">Historical</th>
                    <th className="text-right px-3 py-2 font-semibold text-slate-700">Adopted</th>
                    <th className="text-right px-3 py-2 font-semibold text-slate-700">Change %</th>
                    <th className="text-right px-3 py-2 font-semibold text-slate-700">YTD Actual</th>
                    <th className="text-center px-3 py-2 font-semibold text-slate-700">Article</th>
                    <th className="text-center px-3 py-2 font-semibold text-slate-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line, i) => (
                    <LineRow key={i} line={line} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {/* Lineage modal */}
      {expandedLineage && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">
                Account Lineage: {expandedLineage.accountNumber}
              </h2>
              <button onClick={() => setExpandedLineage(null)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">
                ×
              </button>
            </div>
            <BudgetLineageTracer
              lineageData={{
                lines: [
                  {
                    newAccount: expandedLineage.accountNumber,
                    newTitle: expandedLineage.accountTitle,
                    department: expandedLineage.department,
                    article: expandedLineage.budgetArticle,
                    fund: expandedLineage.fund,
                    amount: expandedLineage.adoptedBudget,
                    trioSources: expandedLineage.trioMappings.map(m => ({
                      trioAccount: m.trio_account,
                      trioDescription: m.trio_description,
                      allocation: m.mapping_split_percent,
                    })),
                    mappingConfidence: expandedLineage.mappingConfidence,
                  },
                ],
              }}
              totalAmount={expandedLineage.adoptedBudget}
            />
          </div>
        </div>
      )}
    </div>
  );
}