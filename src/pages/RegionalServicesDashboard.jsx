import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, DollarSign, Target, Zap } from 'lucide-react';
import SectionHeader from '../components/machias/SectionHeader';
import RegionalServicesTable from '../components/regionalservices/RegionalServicesTable';
import RegionalRevenueAnalysis from '../components/regionalservices/RegionalRevenueAnalysis';

export default function RegionalServicesDashboard() {
  const [selectedScenario, setSelectedScenario] = useState('moderate');

  const { data: prospects = [] } = useQuery({
    queryKey: ['FinanceServicesProspect'],
    queryFn: () => base44.entities.FinanceServicesProspect.list(),
  });

  const { data: forecasts = [] } = useQuery({
    queryKey: ['RegionalServicesRevenueForecast'],
    queryFn: () => base44.entities.RegionalServicesRevenueForecast.list(),
  });

  // Calculate metrics for selected scenario
  const scenarioForecasts = forecasts.filter(f => f.scenario === selectedScenario);
  const totalYearOneRevenue = scenarioForecasts.reduce((sum, f) => sum + (f.year_1_revenue || 0), 0);
  const totalFiveYearRevenue = scenarioForecasts.reduce((sum, f) => sum + (f.five_year_cumulative || 0), 0);
  const totalMarginalCost = scenarioForecasts.reduce((sum, f) => sum + ((f.estimated_marginal_cost_annual || 0) * 5), 0);
  const netFiveYearImpact = scenarioForecasts.reduce((sum, f) => sum + (f.net_fiscal_impact_five_year || 0), 0);

  // Summary by prospect
  const prospectSummary = prospects.map(prospect => {
    const forecastsForProspect = forecasts.filter(f => 
      f.municipality === prospect.municipality && 
      f.scenario === selectedScenario
    );
    const midRangeForecast = forecastsForProspect[0];
    
    return {
      ...prospect,
      estimated_annual_value: midRangeForecast?.year_1_revenue || prospect.potential_allocation_low,
      five_year_projection: midRangeForecast?.five_year_cumulative || 0,
    };
  });

  return (
    <div className="space-y-4 max-w-[1400px] mx-auto">
      {/* Header */}
      <SectionHeader
        title="Regional Financial Services Dashboard"
        subtitle="Machias Bay Region service consolidation pipeline and 5-year revenue forecast"
        icon={TrendingUp}
      />

      {/* Scenario selector */}
      <div className="flex gap-2 items-center">
        <span className="text-xs font-bold text-slate-600">5-Year Scenario:</span>
        {['low', 'moderate', 'high'].map(scenario => (
          <button
            key={scenario}
            onClick={() => setSelectedScenario(scenario)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              selectedScenario === scenario
                ? 'bg-slate-900 text-white shadow-sm'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {scenario === 'low' ? 'Conservative ($5K)' : scenario === 'moderate' ? 'Moderate ($6K)' : 'Optimistic ($7K)'}
          </button>
        ))}
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Year 1 Revenue</p>
          <p className="text-2xl font-bold text-slate-900">${totalYearOneRevenue.toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-0.5">From all prospects</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">5-Year Revenue</p>
          <p className="text-2xl font-bold text-emerald-700">${totalFiveYearRevenue.toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-0.5">Cumulative forecast</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">5-Year Cost</p>
          <p className="text-2xl font-bold text-slate-900">${totalMarginalCost.toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-0.5">Service delivery</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Net Fiscal Impact</p>
          <p className={`text-2xl font-bold ${netFiveYearImpact > 0 ? 'text-emerald-700' : 'text-red-700'}`}>
            ${Math.abs(netFiveYearImpact).toLocaleString()}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">5-year net benefit</p>
        </div>
      </div>

      {/* Detailed analysis */}
      {scenarioForecasts.length > 0 && (
        <RegionalRevenueAnalysis forecasts={scenarioForecasts} />
      )}

      {/* Prospects table */}
      <RegionalServicesTable
        prospects={prospectSummary}
        forecasts={forecasts}
        selectedScenario={selectedScenario}
      />
    </div>
  );
}