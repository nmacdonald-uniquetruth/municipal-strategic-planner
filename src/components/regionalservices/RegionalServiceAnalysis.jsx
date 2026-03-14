import React from 'react';
import { calculateServiceRevenue, formatServiceType, formatCurrency } from '../utils/regionalRevenueCalculator';

export default function RegionalServiceAnalysis({ contract }) {
  if (!contract) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center">
        <p className="text-sm text-slate-600">Select a service to view analysis</p>
      </div>
    );
  }

  const revenue = calculateServiceRevenue(contract);
  const activeTowns = (contract.participating_towns || []).filter((t) => t.status === 'active');

  const isNegative = revenue.net_contribution < 0;
  const isMarginal = revenue.net_contribution > 0 && revenue.net_contribution < 10000;

  return (
    <div className="space-y-4">
      {/* Overview */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-bold text-slate-900 mb-4">Revenue Analysis</h3>
        <div className="grid grid-cols-2 gap-3">
          {/* Gross Revenue */}
          <div className="rounded-lg border border-slate-200 p-3">
            <p className="text-xs font-semibold text-slate-600 uppercase mb-1">Gross Revenue</p>
            <p className="text-lg font-bold text-slate-900">{formatCurrency(revenue.gross_revenue)}</p>
            <p className="text-xs text-slate-500 mt-1">
              {activeTowns.length} active {activeTowns.length === 1 ? 'town' : 'towns'}
            </p>
          </div>

          {/* Service Cost */}
          <div className="rounded-lg border border-slate-200 p-3">
            <p className="text-xs font-semibold text-slate-600 uppercase mb-1">Service Cost</p>
            <p className="text-lg font-bold text-slate-900">{formatCurrency(revenue.service_cost)}</p>
            <p className="text-xs text-slate-500 mt-1">Annual delivery</p>
          </div>

          {/* Net Contribution */}
          <div className={`rounded-lg border p-3 ${isNegative ? 'border-red-200 bg-red-50' : 'border-emerald-200 bg-emerald-50'}`}>
            <p className={`text-xs font-semibold uppercase mb-1 ${isNegative ? 'text-red-700' : 'text-emerald-700'}`}>
              Net Contribution
            </p>
            <p className={`text-lg font-bold ${isNegative ? 'text-red-700' : 'text-emerald-700'}`}>
              {isNegative ? '−' : '+'}{formatCurrency(Math.abs(revenue.net_contribution))}
            </p>
            <p className={`text-xs mt-1 ${isNegative ? 'text-red-600' : 'text-emerald-600'}`}>
              {isNegative ? 'Cost to Machias' : isMarginal ? 'Minimal contribution' : 'Revenue to Machias'}
            </p>
          </div>

          {/* Margin */}
          <div className="rounded-lg border border-slate-200 p-3">
            <p className="text-xs font-semibold text-slate-600 uppercase mb-1">Margin</p>
            <p className="text-lg font-bold text-slate-900">
              {revenue.margin_percentage > 0 ? '+' : ''}{revenue.margin_percentage.toFixed(1)}%
            </p>
            <p className="text-xs text-slate-500 mt-1">Contribution ratio</p>
          </div>
        </div>
      </div>

      {/* Pricing Details */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-bold text-slate-900 mb-3">Pricing Model</h3>
        <div className="space-y-2 text-sm">
          {contract.pricing_model === 'fixed_fee' && (
            <>
              <div className="flex justify-between">
                <span className="text-slate-600">Annual fee per town:</span>
                <span className="font-semibold text-slate-900">{formatCurrency(contract.fixed_fee)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Participating towns:</span>
                <span className="font-semibold text-slate-900">{contract.participating_towns?.length || 0}</span>
              </div>
            </>
          )}

          {contract.pricing_model === 'per_capita' && (
            <>
              <div className="flex justify-between">
                <span className="text-slate-600">Fee per capita:</span>
                <span className="font-semibold text-slate-900">{formatCurrency(contract.per_capita_fee)}/year</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Total population:</span>
                <span className="font-semibold text-slate-900">
                  {(contract.participating_towns || []).reduce((sum, t) => sum + (t.population || 0), 0).toLocaleString()}
                </span>
              </div>
            </>
          )}

          {contract.pricing_model === 'call_volume' && (
            <>
              <div className="flex justify-between">
                <span className="text-slate-600">Fee per call:</span>
                <span className="font-semibold text-slate-900">{formatCurrency(contract.call_volume_rate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Estimated annual calls:</span>
                <span className="font-semibold text-slate-900">{contract.estimated_annual_calls?.toLocaleString()}</span>
              </div>
            </>
          )}

          {contract.pricing_model === 'hourly' && (
            <>
              <div className="flex justify-between">
                <span className="text-slate-600">Hourly rate:</span>
                <span className="font-semibold text-slate-900">{formatCurrency(contract.hourly_rate)}/hr</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Estimated annual hours:</span>
                <span className="font-semibold text-slate-900">{contract.estimated_annual_hours?.toLocaleString()}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Participating Towns */}
      {contract.participating_towns?.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">Participating Towns ({contract.participating_towns.length})</h3>
          </div>
          <div className="divide-y divide-slate-200">
            {contract.participating_towns.map((town, idx) => (
              <div key={idx} className="p-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-900">{town.town_name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Pop: {town.population?.toLocaleString() || 'N/A'} • {town.distance_miles || 'Distance N/A'} mi
                  </p>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded ${
                  town.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                  town.status === 'negotiating' ? 'bg-blue-100 text-blue-700' :
                  'bg-slate-100 text-slate-700'
                }`}>
                  {town.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status Badge */}
      <div className={`rounded-lg border p-3 ${
        contract.status === 'active' ? 'border-emerald-200 bg-emerald-50' :
        contract.status === 'concept' ? 'border-blue-200 bg-blue-50' :
        'border-slate-200 bg-slate-50'
      }`}>
        <p className="text-xs font-semibold text-slate-900">
          Status: <span className={
            contract.status === 'active' ? 'text-emerald-700' :
            contract.status === 'concept' ? 'text-blue-700' :
            'text-slate-700'
          }>{contract.status?.toUpperCase()}</span>
        </p>
      </div>
    </div>
  );
}