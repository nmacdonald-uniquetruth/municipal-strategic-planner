import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, TrendingUp } from 'lucide-react';

export default function ProposalComparison({ proposals, onRemove, onClearAll }) {
  if (proposals.length === 0) {
    return null;
  }

  const getMetrics = (proposal) => {
    const savings = proposal.estimatedAnnualSavings || 0;
    const revenue = proposal.estimatedAnnualRevenue || 0;
    const cost = proposal.implementationCost || 0;
    const netAnnual = savings + revenue;
    const paybackPeriod = cost > 0 ? (cost / netAnnual).toFixed(1) : 'N/A';
    return { savings, revenue, cost, netAnnual, paybackPeriod };
  };

  const allMetrics = proposals.map(p => getMetrics(p));
  const totalSavings = allMetrics.reduce((sum, m) => sum + m.savings, 0);
  const totalRevenue = allMetrics.reduce((sum, m) => sum + m.revenue, 0);
  const totalCost = allMetrics.reduce((sum, m) => sum + m.cost, 0);
  const totalNetAnnual = totalSavings + totalRevenue;

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          <CardTitle>Comparison ({proposals.length} proposals)</CardTitle>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onClearAll}
        >
          Clear All
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Summary Metrics */}
        <div className="grid grid-cols-4 gap-3 bg-white p-3 rounded-lg border">
          <div>
            <p className="text-xs text-gray-600 mb-1">Total Annual Savings</p>
            <p className="text-xl font-bold text-green-600">${(totalSavings / 1000).toFixed(0)}k</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-1">Total Annual Revenue</p>
            <p className="text-xl font-bold text-blue-600">${(totalRevenue / 1000).toFixed(0)}k</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-1">Total Implementation Cost</p>
            <p className="text-xl font-bold text-red-600">-${(totalCost / 1000).toFixed(0)}k</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-1">Net Annual Impact</p>
            <p className="text-xl font-bold text-emerald-600">+${(totalNetAnnual / 1000).toFixed(0)}k</p>
          </div>
        </div>

        {/* Detailed Comparison Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-2 font-semibold text-gray-700">Proposal</th>
                <th className="text-right py-2 px-2 font-semibold text-gray-700">Annual Savings</th>
                <th className="text-right py-2 px-2 font-semibold text-gray-700">Annual Revenue</th>
                <th className="text-right py-2 px-2 font-semibold text-gray-700">Impl. Cost</th>
                <th className="text-right py-2 px-2 font-semibold text-gray-700">Net Annual</th>
                <th className="text-right py-2 px-2 font-semibold text-gray-700">Payback (yrs)</th>
                <th className="text-center py-2 px-2 font-semibold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {proposals.map((proposal, idx) => {
                const metrics = allMetrics[idx];
                return (
                  <tr key={proposal.id} className="border-b hover:bg-white transition-colors">
                    <td className="py-2 px-2 font-medium text-gray-900">{proposal.title}</td>
                    <td className="text-right py-2 px-2 text-green-600 font-semibold">
                      {metrics.savings > 0 ? `$${(metrics.savings / 1000).toFixed(0)}k` : '—'}
                    </td>
                    <td className="text-right py-2 px-2 text-blue-600 font-semibold">
                      {metrics.revenue > 0 ? `$${(metrics.revenue / 1000).toFixed(0)}k` : '—'}
                    </td>
                    <td className="text-right py-2 px-2 text-red-600 font-semibold">
                      {metrics.cost > 0 ? `-$${(metrics.cost / 1000).toFixed(0)}k` : '—'}
                    </td>
                    <td className="text-right py-2 px-2 font-bold text-emerald-600">
                      +${(metrics.netAnnual / 1000).toFixed(0)}k
                    </td>
                    <td className="text-right py-2 px-2 text-gray-700">
                      {typeof metrics.paybackPeriod === 'number' ? metrics.paybackPeriod : '—'}
                    </td>
                    <td className="text-center py-2 px-2">
                      <button
                        onClick={() => onRemove(proposal.id)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Implementation Timeline */}
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">Implementation Timelines</p>
          <div className="space-y-1">
            {proposals.map(p => (
              <div key={p.id} className="text-xs bg-white p-2 rounded border flex items-center gap-2">
                <span className="font-medium text-gray-900 flex-1">{p.title}</span>
                <span className="text-gray-600">{p.implementationTimeline || 'TBD'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Key Metrics by Proposal */}
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">Key Details</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {proposals.map(p => (
              <div key={p.id} className="bg-white p-3 rounded border text-xs space-y-2">
                <p className="font-semibold text-gray-900">{p.title}</p>
                <div className="space-y-1 text-gray-600">
                  <div>Category: <span className="text-gray-900 font-medium">{p.category.replace(/_/g, ' ')}</span></div>
                  <div>Priority: <span className="text-gray-900 font-medium capitalize">{p.priority}</span></div>
                  <div>Status: <span className="text-gray-900 font-medium">{p.status.replace(/_/g, ' ')}</span></div>
                  {p.departments?.length > 0 && (
                    <div>Depts: <span className="text-gray-900 font-medium">{p.departments.join(', ')}</span></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}