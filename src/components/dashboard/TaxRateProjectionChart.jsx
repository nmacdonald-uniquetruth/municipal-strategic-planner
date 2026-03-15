import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Link } from 'react-router-dom';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-lg p-3 text-xs">
      <p className="font-bold text-slate-800 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }} className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
          {p.name}: <strong>{p.name.includes('Mill') ? `${p.value?.toFixed(3)} mills` : `$${Number(p.value).toLocaleString()}`}</strong>
        </p>
      ))}
    </div>
  );
};

export default function TaxRateProjectionChart({ projections, settings }) {
  if (!projections || projections.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 h-64 flex items-center justify-center">
        <p className="text-xs text-slate-500">Loading projections…</p>
      </div>
    );
  }

  const baseline = settings.current_mill_rate ?? 14.5;

  const data = projections.map(y => ({
    name: y.fiscalYear,
    'Mill Rate Impact': parseFloat((y.gf?.millRateImpact ?? 0).toFixed(4)),
    'GF Net Levy': y.gf?.gfNetLevyImpact ?? 0,
  }));

  const anyPositive = data.some(d => d['Mill Rate Impact'] > 0);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 h-full">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Tax Rate Projections</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Estimated mill rate change from restructuring · Current rate: <strong>{baseline} mills</strong>
          </p>
        </div>
        <Link to="/TaxImpact" className="text-[11px] text-slate-500 hover:text-slate-800 underline flex-shrink-0">
          Full analysis →
        </Link>
      </div>

      {/* Plain-language summary */}
      <div className={`rounded-xl p-3 mb-4 text-xs ${anyPositive ? 'bg-amber-50 border border-amber-200 text-amber-800' : 'bg-emerald-50 border border-emerald-200 text-emerald-800'}`}>
        {anyPositive
          ? '⚠ Some years project a small mill rate increase. Review assumptions in Model Settings.'
          : '✓ Restructuring is projected to be tax-neutral or tax-reducing across all 5 years.'}
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="millGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#344A60" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#344A60" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} />
          <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={v => `${v.toFixed(2)}`} />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="4 2" label={{ value: 'No Change', fontSize: 9, fill: '#94a3b8', position: 'insideTopRight' }} />
          <Area
            type="monotone"
            dataKey="Mill Rate Impact"
            stroke="#344A60"
            strokeWidth={2}
            fill="url(#millGrad)"
            dot={{ r: 3, fill: '#344A60', strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {projections.map(y => {
          const impact = y.gf?.millRateImpact ?? 0;
          const isPos = impact > 0;
          return (
            <div key={y.year} className={`rounded-lg p-2 text-[11px] flex justify-between items-center ${isPos ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-800'}`}>
              <span className="font-semibold">{y.fiscalYear}</span>
              <span className="font-bold tabular-nums">
                {isPos ? `+${impact.toFixed(3)}` : impact.toFixed(3)} mills
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}