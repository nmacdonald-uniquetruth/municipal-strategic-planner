import React, { useMemo } from 'react';
import { TrendingUp, AlertCircle } from 'lucide-react';

export default function FiscalAnalysisSummary({ records }) {
  const analysis = useMemo(() => {
    const highFeasibility = records.filter(r => r.fiscal_feasibility === 'high');
    const totalRegionalRevenue = records.reduce((sum, r) => {
      const low = r.estimated_regional_service_price_low || 0;
      const high = r.estimated_regional_service_price_high || 0;
      return sum + ((low + high) / 2);
    }, 0);
    const totalCurrentCost = records.reduce((sum, r) => sum + (r.total_annual_cost || 0), 0);
    const avgCostPerMuni = Math.round(totalCurrentCost / records.length);

    return {
      highFeasibility,
      totalRegionalRevenue,
      totalCurrentCost,
      avgCostPerMuni,
    };
  }, [records]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {/* High Feasibility Candidates */}
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-200">
            <TrendingUp className="h-5 w-5 text-emerald-700" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">High Feasibility Candidates</p>
            <p className="text-2xl font-bold text-emerald-900 mt-1">{analysis.highFeasibility.length} municipalities</p>
            <p className="text-[10px] text-emerald-700 mt-1">Strong consolidation potential</p>
            {analysis.highFeasibility.length > 0 && (
              <ul className="text-[9px] text-emerald-700 mt-2 space-y-0.5">
                {analysis.highFeasibility.slice(0, 3).map(m => (
                  <li key={m.id}>• {m.municipality}</li>
                ))}
                {analysis.highFeasibility.length > 3 && (
                  <li>• +{analysis.highFeasibility.length - 3} more</li>
                )}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Current Market Average */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-200">
            <span className="text-lg font-bold text-blue-700">$</span>
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Region Average</p>
            <p className="text-2xl font-bold text-blue-900 mt-1">${analysis.avgCostPerMuni.toLocaleString()}</p>
            <p className="text-[10px] text-blue-700 mt-1">Annual per municipality</p>
            <p className="text-[9px] text-blue-600 mt-2">Total region: ${Math.round(analysis.totalCurrentCost).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Machias Revenue Potential */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-200">
            <span className="text-lg font-bold text-amber-700">↑</span>
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">Machias Revenue Potential</p>
            <p className="text-2xl font-bold text-amber-900 mt-1">${Math.round(analysis.totalRegionalRevenue).toLocaleString()}</p>
            <p className="text-[10px] text-amber-700 mt-1">Estimated annual (all municipalities)</p>
            <p className="text-[9px] text-amber-600 mt-2">
              ${Math.round(analysis.totalRegionalRevenue / records.length).toLocaleString()} per municipality
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}