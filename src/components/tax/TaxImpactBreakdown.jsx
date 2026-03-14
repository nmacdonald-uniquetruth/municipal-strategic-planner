import React from 'react';
import { AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency, formatMillRate, formatPercentage, classifyImpactType } from '../utils/taxImpactCalculator';

export default function TaxImpactBreakdown({ impact, showDetails = true }) {
  if (!impact) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center">
        <p className="text-sm text-slate-600">No impact data available</p>
      </div>
    );
  }

  const impactType = classifyImpactType(impact);
  const isNegative = impact.net_municipal_cost < 0;

  const impactTypeConfig = {
    'revenue-generating': { label: 'Revenue-Generating', color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
    'offsettable': { label: 'Offsettable', color: 'bg-blue-50 border-blue-200 text-blue-700' },
    'phased': { label: 'Phased Impact', color: 'bg-amber-50 border-amber-200 text-amber-700' },
    'immediate': { label: 'Immediate Impact', color: 'bg-red-50 border-red-200 text-red-700' },
  };

  const config = impactTypeConfig[impactType];

  return (
    <div className="space-y-4">
      {/* Impact Type Badge */}
      <div className={`rounded-lg border p-3 ${config.color}`}>
        <p className="text-xs font-semibold">{config.label}</p>
      </div>

      {/* Cost Breakdown */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-bold text-slate-900 mb-3">Cost Breakdown</h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-600">Gross Cost</span>
            <span className="font-semibold text-slate-900">{formatCurrency(impact.gross_cost)}</span>
          </div>

          {impact.revenue_offsets > 0 && (
            <div className="flex justify-between items-center text-sm border-t border-slate-200 pt-2">
              <span className="text-slate-600">Revenue Offsets</span>
              <span className="font-semibold text-emerald-700">−{formatCurrency(impact.revenue_offsets)}</span>
            </div>
          )}

          {impact.grant_funding > 0 && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600">Grant Funding</span>
              <span className="font-semibold text-emerald-700">−{formatCurrency(impact.grant_funding)}</span>
            </div>
          )}

          {impact.regional_service_revenue > 0 && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600">Regional Service Revenue</span>
              <span className="font-semibold text-emerald-700">−{formatCurrency(impact.regional_service_revenue)}</span>
            </div>
          )}

          <div className={`flex justify-between items-center text-sm border-t border-slate-200 pt-2 font-bold ${isNegative ? 'text-emerald-700' : 'text-red-700'}`}>
            <span className={isNegative ? 'text-emerald-900' : 'text-red-900'}>Net Municipal Cost</span>
            <span>{isNegative ? '−' : '+'}{formatCurrency(Math.abs(impact.net_municipal_cost))}</span>
          </div>
        </div>
      </div>

      {/* Tax Impact Metrics */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-bold text-slate-900 mb-3">Tax Impact</h3>
        <div className="grid grid-cols-2 gap-3">
          {/* Mill Rate */}
          <div className="rounded-lg border border-slate-200 p-3">
            <p className="text-xs font-semibold text-slate-600 uppercase mb-1">Mill Rate Change</p>
            <p className={`text-lg font-bold ${impact.mill_rate_change > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
              {impact.mill_rate_change > 0 ? '+' : ''}{formatMillRate(impact.mill_rate_change)}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              From {formatMillRate(impact.current_mill_rate)} to {formatMillRate(impact.new_mill_rate)}
            </p>
          </div>

          {/* Per $100k Valuation */}
          <div className="rounded-lg border border-slate-200 p-3">
            <p className="text-xs font-semibold text-slate-600 uppercase mb-1">Per $100K Valuation</p>
            <p className={`text-lg font-bold ${impact.per_100k_change > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
              {impact.per_100k_change > 0 ? '+' : ''}${impact.per_100k_change.toFixed(2)}
            </p>
            <p className="text-xs text-slate-500 mt-1">Annual change</p>
          </div>

          {/* Per Household */}
          <div className="rounded-lg border border-slate-200 p-3">
            <p className="text-xs font-semibold text-slate-600 uppercase mb-1">Per Household (est.)</p>
            <p className={`text-lg font-bold ${impact.annual_per_household > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
              {impact.annual_per_household > 0 ? '+' : ''}{formatCurrency(impact.annual_per_household)}
            </p>
            <p className="text-xs text-slate-500 mt-1">$250K avg. home</p>
          </div>

          {/* Tax Levy Change */}
          <div className="rounded-lg border border-slate-200 p-3">
            <p className="text-xs font-semibold text-slate-600 uppercase mb-1">Tax Levy Change</p>
            <p className={`text-lg font-bold ${impact.tax_levy_change > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
              {impact.tax_levy_change > 0 ? '+' : ''}${(impact.tax_levy_change / 1000).toFixed(1)}K
            </p>
            <p className="text-xs text-slate-500 mt-1">{formatPercentage(impact.percentage_levy_change)}</p>
          </div>
        </div>
      </div>

      {/* Additional Details */}
      {showDetails && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 space-y-1">
          <p><span className="font-semibold">Total Assessed Value:</span> ${(198000000).toLocaleString()}</p>
          <p><span className="font-semibold">Current Annual Levy:</span> ${(2871000).toLocaleString()}</p>
          <p><span className="font-semibold">Projected New Levy:</span> ${impact.new_tax_levy?.toLocaleString()}</p>
        </div>
      )}
    </div>
  );
}