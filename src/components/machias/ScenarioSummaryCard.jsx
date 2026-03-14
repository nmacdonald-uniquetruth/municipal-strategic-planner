import React, { useMemo } from 'react';
import { runProFormaFromSettings } from './FinancialModelV2';
import { useModel } from './ModelContext';
import { TrendingUp, DollarSign, Users, AlertCircle } from 'lucide-react';

const fmt = (n) => n == null ? '—' : `$${Math.abs(Math.round(n)).toLocaleString()}`;

export default function ScenarioSummaryCard({ scenario, settings, isComparison = false }) {
  const data = useMemo(() => {
    if (!settings) return null;
    return runProFormaFromSettings(settings);
  }, [settings]);

  if (!data || !scenario) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center">
        <p className="text-xs text-slate-500">Select a scenario to view impacts</p>
      </div>
    );
  }

  const y1 = data[0];
  const y5 = data[4];
  
  // Calculate net impacts
  const netBudgetImpactY1 = y1.net;
  const totalBudgetImpact5Yr = data.reduce((sum, d) => sum + d.net, 0);
  const netLevyImpactY1 = y1.gf?.undesignatedDraw || 0;
  const staffingChange = [
    scenario.staffing_assumptions?.y1_staffing_model === 'fulltime_sa' ? 1 : 0,
    scenario.staffing_assumptions?.y5_senior_hire === 'controller' ? 1 : 0,
    scenario.operational_assumptions?.police_admin_enabled ? 1 : 0,
  ].filter(Boolean).length;

  const regionalRevenueY1 = y1.value?.regionalServices || 0;
  const regionalRevenueOffset = scenario.staffing_assumptions?.regional_services_enabled ? regionalRevenueY1 : 0;

  return (
    <div className={`rounded-lg border ${isComparison ? 'border-slate-200' : 'border-emerald-200 bg-emerald-50/30'} p-4 space-y-3`}>
      {/* Header */}
      <div>
        <h3 className="text-sm font-bold text-slate-900">{scenario.name}</h3>
        <p className="text-xs text-slate-600 mt-0.5">{scenario.type.charAt(0).toUpperCase() + scenario.type.slice(1)}</p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Budget Impact */}
        <div className="rounded border border-slate-200 bg-white p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <DollarSign className="h-3.5 w-3.5 text-amber-600" />
            <p className="text-[10px] font-semibold text-slate-600 uppercase">Year 1 Net</p>
          </div>
          <p className={`text-sm font-bold ${netBudgetImpactY1 >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
            {fmt(netBudgetImpactY1)}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">{netBudgetImpactY1 >= 0 ? 'Surplus' : 'Deficit'}</p>
        </div>

        {/* 5-Year Impact */}
        <div className="rounded border border-slate-200 bg-white p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
            <p className="text-[10px] font-semibold text-slate-600 uppercase">5-Year Total</p>
          </div>
          <p className={`text-sm font-bold ${totalBudgetImpact5Yr >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
            {fmt(totalBudgetImpact5Yr)}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">Cumulative value</p>
        </div>

        {/* Staffing */}
        <div className="rounded border border-slate-200 bg-white p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Users className="h-3.5 w-3.5 text-blue-600" />
            <p className="text-[10px] font-semibold text-slate-600 uppercase">Staffing</p>
          </div>
          <p className="text-sm font-bold text-slate-900">+{staffingChange} FTE</p>
          <p className="text-[10px] text-slate-500 mt-0.5">{staffingChange === 0 ? 'No change' : `${staffingChange} new position${staffingChange > 1 ? 's' : ''}`}</p>
        </div>

        {/* Regional Revenue */}
        <div className="rounded border border-slate-200 bg-white p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
            <p className="text-[10px] font-semibold text-slate-600 uppercase">Regional Rev</p>
          </div>
          <p className="text-sm font-bold text-emerald-700">{fmt(regionalRevenueOffset)}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Year 1 offset potential</p>
        </div>
      </div>

      {/* Risks */}
      {scenario.risks && scenario.risks.length > 0 && (
        <div className="rounded border border-amber-200 bg-amber-50 p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
            <p className="text-[10px] font-semibold text-amber-800 uppercase">Key Risks</p>
          </div>
          <ul className="space-y-1">
            {scenario.risks.slice(0, 2).map((risk, i) => (
              <li key={i} className="text-[10px] text-amber-700">
                • {risk.risk}
              </li>
            ))}
          </ul>
          {scenario.risks.length > 2 && (
            <p className="text-[9px] text-amber-600 mt-1">+{scenario.risks.length - 2} more</p>
          )}
        </div>
      )}

      {/* Recommendations */}
      {scenario.recommendations && scenario.recommendations.length > 0 && (
        <div className="rounded border border-blue-200 bg-blue-50 p-3">
          <p className="text-[10px] font-semibold text-blue-800 uppercase mb-2">Recommendations</p>
          <ul className="space-y-1">
            {scenario.recommendations.slice(0, 2).map((rec, i) => (
              <li key={i} className="text-[10px] text-blue-700">
                • {rec}
              </li>
            ))}
          </ul>
          {scenario.recommendations.length > 2 && (
            <p className="text-[9px] text-blue-600 mt-1">+{scenario.recommendations.length - 2} more</p>
          )}
        </div>
      )}
    </div>
  );
}