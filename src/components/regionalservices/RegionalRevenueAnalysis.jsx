import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function RegionalRevenueAnalysis({ forecasts }) {
  const chartData = useMemo(() => {
    const years = {};
    
    forecasts.forEach(f => {
      for (let y = 1; y <= 5; y++) {
        const year = 2026 + y - 1;
        if (!years[year]) years[year] = { year, revenue: 0, cost: 0 };
        years[year].revenue += f[`year_${y}_revenue`] || 0;
        years[year].cost += f.estimated_marginal_cost_annual || 0;
      }
    });

    return Object.values(years).sort((a, b) => a.year - b.year);
  }, [forecasts]);

  const totalRevenue = forecasts.reduce((sum, f) => sum + (f.five_year_cumulative || 0), 0);
  const avgAnnualCost = forecasts.length > 0 
    ? forecasts.reduce((sum, f) => sum + (f.estimated_marginal_cost_annual || 0), 0)
    : 0;

  return (
    <div className="space-y-4">
      {/* Revenue vs Cost Chart */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-sm font-bold text-slate-900 mb-3">5-Year Revenue & Cost Projection</p>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="year" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip 
              formatter={(v) => `$${v.toLocaleString()}`}
              contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
            />
            <Legend />
            <Bar dataKey="revenue" fill="#10b981" name="Annual Revenue" />
            <Bar dataKey="cost" fill="#ef4444" name="Annual Cost" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total 5-Year Revenue</p>
          <p className="text-2xl font-bold text-emerald-700">${totalRevenue.toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-0.5">From all municipalities</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Annual Service Cost</p>
          <p className="text-2xl font-bold text-slate-900">${avgAnnualCost.toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-0.5">Marginal cost per year</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Avg Annual Net</p>
          <p className="text-2xl font-bold text-emerald-700">
            ${Math.round((totalRevenue - (avgAnnualCost * 5)) / 5).toLocaleString()}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Net fiscal benefit per year</p>
        </div>
      </div>
    </div>
  );
}