import React from 'react';
import { TrendingUp } from 'lucide-react';

export default function RegionalServicesTable({ prospects, forecasts, selectedScenario }) {
  const probabilityColors = {
    low: 'bg-red-50 text-red-900',
    medium: 'bg-amber-50 text-amber-900',
    high: 'bg-emerald-50 text-emerald-900',
  };

  const statusColors = {
    prospect: 'bg-blue-50 text-blue-900',
    engaged: 'bg-amber-50 text-amber-900',
    contracted: 'bg-emerald-50 text-emerald-900',
    inactive: 'bg-slate-100 text-slate-700',
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-900 text-white border-b border-slate-200">
              <th className="px-3 py-2.5 text-left font-bold">Municipality</th>
              <th className="px-3 py-2.5 text-left font-bold">Service Type</th>
              <th className="px-3 py-2.5 text-right font-bold">Annual Contract Value</th>
              <th className="px-3 py-2.5 text-right font-bold">5-Year Projection</th>
              <th className="px-3 py-2.5 text-center font-bold">Probability</th>
              <th className="px-3 py-2.5 text-center font-bold">Status</th>
              <th className="px-3 py-2.5 text-left font-bold">Relationship</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {prospects.map(prospect => {
              const forecast = forecasts.find(f => 
                f.municipality === prospect.municipality && 
                f.scenario === selectedScenario &&
                f.service_category === prospect.service_category
              );

              return (
                <tr key={prospect.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-3 py-2.5 font-bold text-slate-900">{prospect.municipality}</td>
                  <td className="px-3 py-2.5 text-slate-700">
                    <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded">
                      {prospect.service_category.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right font-bold text-slate-900">
                    ${prospect.estimated_annual_value?.toLocaleString() || '—'}
                  </td>
                  <td className="px-3 py-2.5 text-right font-bold text-emerald-700">
                    {forecast ? `$${Math.round(forecast.five_year_cumulative).toLocaleString()}` : '—'}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`px-2 py-1 rounded-full text-[9px] font-bold ${probabilityColors[prospect.probability_of_engagement] || 'bg-slate-100'}`}>
                      {prospect.probability_of_engagement ? prospect.probability_of_engagement.charAt(0).toUpperCase() + prospect.probability_of_engagement.slice(1) : '—'}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`px-2 py-1 rounded-full text-[9px] font-bold ${statusColors[prospect.status] || 'bg-slate-100'}`}>
                      {prospect.status.charAt(0).toUpperCase() + prospect.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-slate-600 text-[9px]">
                    {prospect.relationship_with_machias ? (
                      <span className="line-clamp-2">{prospect.relationship_with_machias}</span>
                    ) : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}