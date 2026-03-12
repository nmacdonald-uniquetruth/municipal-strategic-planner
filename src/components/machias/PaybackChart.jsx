import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { PAYBACK_DATA } from './FinancialModel';

export default function PaybackChart() {
  let cumNet = 0;
  const data = PAYBACK_DATA.map(d => {
    cumNet += (d.value - d.costs);
    return { ...d, cumulative: cumNet, net: d.value - d.costs };
  });

  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white p-6">
      <h3 className="text-sm font-semibold text-slate-700 mb-1">Quarterly Payback Analysis</h3>
      <p className="text-xs text-slate-400 mb-4">Cumulative net value through 24 months — break-even ~Month 7-8</p>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#64748b' }} />
          <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 11, fill: '#64748b' }} />
          <Tooltip
            formatter={(v) => `$${v.toLocaleString()}`}
            contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }}
          />
          <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />
          <Area type="monotone" dataKey="cumulative" stroke="#1e293b" fill="#1e293b" fillOpacity={0.1} strokeWidth={2} name="Cumulative Net" />
        </AreaChart>
      </ResponsiveContainer>
      <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
        {data.map(d => (
          <div key={d.period} className="rounded-lg bg-slate-50 p-3">
            <p className="text-[10px] font-medium text-slate-400 uppercase">{d.period}</p>
            <p className="text-xs text-slate-600 mt-1">{d.milestone}</p>
          </div>
        ))}
      </div>
    </div>
  );
}