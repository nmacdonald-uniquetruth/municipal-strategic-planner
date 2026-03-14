import React from 'react';
import { ArrowRight } from 'lucide-react';
import { compareTaxImpacts, formatCurrency, formatMillRate } from '../utils/taxImpactCalculator';
import TaxImpactBreakdown from './TaxImpactBreakdown';

export default function TaxImpactComparison({ currentData, proposedData, modelSettings }) {
  if (!currentData || !proposedData) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center">
        <p className="text-sm text-slate-600">Provide both current and proposed impact data</p>
      </div>
    );
  }

  const comparison = compareTaxImpacts(currentData, proposedData, modelSettings);
  const { current, proposed, changes } = comparison;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current State */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 mb-3 pb-2 border-b border-slate-200">Current State</h3>
          <TaxImpactBreakdown impact={current} showDetails={false} />
        </div>

        {/* Proposed State */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 mb-3 pb-2 border-b border-slate-200">Proposed State</h3>
          <TaxImpactBreakdown impact={proposed} showDetails={false} />
        </div>
      </div>

      {/* Changes Summary */}
      <div className="rounded-lg border-2 border-slate-900 bg-slate-50 p-4">
        <h3 className="text-sm font-bold text-slate-900 mb-4">Impact Changes</h3>
        <div className="space-y-3">
          {/* Net Cost */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Net Municipal Cost</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-900 min-w-32 text-right">
                {formatCurrency(current.net_municipal_cost)}
              </span>
              <ArrowRight className="h-4 w-4 text-slate-400" />
              <span className="text-sm font-bold min-w-32 text-right" style={{
                color: changes.net_cost_delta > 0 ? '#b91c1c' : '#16a34a'
              }}>
                {formatCurrency(proposed.net_municipal_cost)}
              </span>
              <span className="text-sm font-semibold min-w-32 text-right" style={{
                color: changes.net_cost_delta > 0 ? '#b91c1c' : '#16a34a'
              }}>
                {changes.net_cost_delta > 0 ? '+' : '−'}{formatCurrency(Math.abs(changes.net_cost_delta))}
              </span>
            </div>
          </div>

          {/* Mill Rate */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Mill Rate</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-900 min-w-32 text-right">
                {formatMillRate(current.new_mill_rate)}
              </span>
              <ArrowRight className="h-4 w-4 text-slate-400" />
              <span className="text-sm font-bold min-w-32 text-right" style={{
                color: changes.mill_rate_delta > 0 ? '#b91c1c' : '#16a34a'
              }}>
                {formatMillRate(proposed.new_mill_rate)}
              </span>
              <span className="text-sm font-semibold min-w-32 text-right" style={{
                color: changes.mill_rate_delta > 0 ? '#b91c1c' : '#16a34a'
              }}>
                {changes.mill_rate_delta > 0 ? '+' : '−'}{formatMillRate(Math.abs(changes.mill_rate_delta))}
              </span>
            </div>
          </div>

          {/* Per $100k */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Per $100K Valuation</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-900 min-w-32 text-right">
                ${current.per_100k_change.toFixed(2)}
              </span>
              <ArrowRight className="h-4 w-4 text-slate-400" />
              <span className="text-sm font-bold min-w-32 text-right" style={{
                color: changes.per_100k_delta > 0 ? '#b91c1c' : '#16a34a'
              }}>
                ${proposed.per_100k_change.toFixed(2)}
              </span>
              <span className="text-sm font-semibold min-w-32 text-right" style={{
                color: changes.per_100k_delta > 0 ? '#b91c1c' : '#16a34a'
              }}>
                {changes.per_100k_delta > 0 ? '+' : '−'}${Math.abs(changes.per_100k_delta).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Per Household */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Per Household (est.)</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-900 min-w-32 text-right">
                {formatCurrency(current.annual_per_household)}
              </span>
              <ArrowRight className="h-4 w-4 text-slate-400" />
              <span className="text-sm font-bold min-w-32 text-right" style={{
                color: changes.per_household_delta > 0 ? '#b91c1c' : '#16a34a'
              }}>
                {formatCurrency(proposed.annual_per_household)}
              </span>
              <span className="text-sm font-semibold min-w-32 text-right" style={{
                color: changes.per_household_delta > 0 ? '#b91c1c' : '#16a34a'
              }}>
                {changes.per_household_delta > 0 ? '+' : '−'}{formatCurrency(Math.abs(changes.per_household_delta))}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}