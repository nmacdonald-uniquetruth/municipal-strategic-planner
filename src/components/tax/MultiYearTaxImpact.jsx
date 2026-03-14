import React from 'react';
import { calculateMultiYearTaxImpact, calculateCumulativeImpact, formatCurrency, formatMillRate } from '../utils/taxImpactCalculator';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function MultiYearTaxImpact({ data, modelSettings, years = 5 }) {
  if (!data) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center">
        <p className="text-sm text-slate-600">No impact data available</p>
      </div>
    );
  }

  const yearlyImpacts = calculateMultiYearTaxImpact(data, modelSettings, years);
  const cumulativeData = calculateCumulativeImpact(yearlyImpacts);

  return (
    <div className="space-y-6">
      {/* Annual Impact Chart */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-bold text-slate-900 mb-4">Annual Tax Impact</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={yearlyImpacts}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip
              formatter={(value) => formatCurrency(value)}
              contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}
            />
            <Legend />
            <Bar dataKey="net_municipal_cost" fill="#ef4444" name="Net Cost" />
            <Bar dataKey="revenue_offsets" fill="#10b981" name="Revenue Offsets" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Mill Rate Trend */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-bold text-slate-900 mb-4">Mill Rate Trajectory</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={yearlyImpacts}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip
              formatter={(value) => formatMillRate(value)}
              contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}
            />
            <Legend />
            <Line type="monotone" dataKey="new_mill_rate" stroke="#8b5cf6" name="Projected Mill Rate" />
            <Line type="monotone" dataKey="current_mill_rate" stroke="#94a3b8" name="Current Mill Rate" strokeDasharray="5 5" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Cumulative Impact */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-bold text-slate-900 mb-4">Cumulative {years}-Year Impact</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-lg border border-slate-200 p-3">
            <p className="text-xs font-semibold text-slate-600 uppercase mb-1">Total Net Cost</p>
            <p className="text-lg font-bold text-red-700">
              {formatCurrency(cumulativeData[cumulativeData.length - 1]?.cumulative_net_cost || 0)}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 p-3">
            <p className="text-xs font-semibold text-slate-600 uppercase mb-1">Total Levy Change</p>
            <p className="text-lg font-bold text-red-700">
              {formatCurrency(cumulativeData[cumulativeData.length - 1]?.cumulative_levy_change || 0)}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 p-3">
            <p className="text-xs font-semibold text-slate-600 uppercase mb-1">Avg Annual Impact</p>
            <p className="text-lg font-bold text-red-700">
              {formatCurrency((cumulativeData[cumulativeData.length - 1]?.cumulative_net_cost || 0) / years)}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 p-3">
            <p className="text-xs font-semibold text-slate-600 uppercase mb-1">Final Mill Rate</p>
            <p className="text-lg font-bold text-slate-900">
              {formatMillRate(yearlyImpacts[yearlyImpacts.length - 1]?.new_mill_rate || 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Year-by-Year Breakdown Table */}
      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h3 className="text-sm font-bold text-slate-900">Year-by-Year Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">Year</th>
                <th className="px-3 py-2 text-right font-semibold text-slate-700">Gross Cost</th>
                <th className="px-3 py-2 text-right font-semibold text-slate-700">Offsets</th>
                <th className="px-3 py-2 text-right font-semibold text-slate-700">Net Cost</th>
                <th className="px-3 py-2 text-right font-semibold text-slate-700">Mill Rate</th>
                <th className="px-3 py-2 text-right font-semibold text-slate-700">Per $100K</th>
                <th className="px-3 py-2 text-right font-semibold text-slate-700">Cumulative Cost</th>
              </tr>
            </thead>
            <tbody>
              {cumulativeData.map((row, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <td className="px-3 py-2 font-semibold text-slate-900">Year {row.year}</td>
                  <td className="px-3 py-2 text-right text-slate-700">{formatCurrency(row.gross_cost)}</td>
                  <td className="px-3 py-2 text-right text-emerald-700">−{formatCurrency(row.revenue_offsets + row.grant_funding + row.regional_service_revenue)}</td>
                  <td className="px-3 py-2 text-right font-semibold text-red-700">{formatCurrency(row.net_municipal_cost)}</td>
                  <td className="px-3 py-2 text-right text-slate-700">{formatMillRate(row.new_mill_rate)}</td>
                  <td className="px-3 py-2 text-right text-slate-700">${row.per_100k_change.toFixed(2)}</td>
                  <td className="px-3 py-2 text-right font-semibold text-red-700">{formatCurrency(row.cumulative_net_cost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}