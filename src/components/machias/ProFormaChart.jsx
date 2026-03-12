import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

const formatCurrency = (v) => `$${(v / 1000).toFixed(0)}K`;

export default function ProFormaChart({ data }) {
  const chartData = data.map(d => ({
    name: d.fiscalYear,
    'Structural Value': d.value.structuralTotal,
    'Regional Revenue': d.value.regionalTotal,
    'ERP Value': d.value.erpValue || 0,
    'Total Costs': -d.costs.total,
    'Net Value': d.net,
  }));

  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white p-6">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">5-Year Pro Forma: Value vs. Costs</h3>
      <ResponsiveContainer width="100%" height={340}>
        <BarChart data={chartData} barGap={2}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
          <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 11, fill: '#64748b' }} />
          <Tooltip formatter={(v) => `$${v.toLocaleString()}`} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />
          <Bar dataKey="Structural Value" fill="#1e293b" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Regional Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          <Bar dataKey="ERP Value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Total Costs" fill="#ef4444" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}