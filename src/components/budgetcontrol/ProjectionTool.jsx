/**
 * ProjectionTool — Manager-facing year-end projection with seasonality controls
 */
import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { projectYearEnd, computeControlMetrics } from './budgetControlEngine';

const fmt = n => `$${Math.round(Math.abs(n || 0)).toLocaleString()}`;
const MONTHS = ['Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr','May','Jun'];

const PROFILES = [
  { value: 'flat',           label: 'Flat (even spend)' },
  { value: 'front_loaded',   label: 'Front-loaded (H1 heavy)' },
  { value: 'back_loaded',    label: 'Back-loaded (H2 heavy)' },
  { value: 'q2_q3_heavy',    label: 'Q2/Q3 Heavy' },
  { value: 'seasonal_summer',label: 'Seasonal – Summer' },
  { value: 'seasonal_winter',label: 'Seasonal – Winter' },
];

function ProjectionRow({ record, currentMonth, onProfileChange }) {
  const m = computeControlMetrics(record, currentMonth);
  const auto = m.autoProjection;
  const manual = record.projected_year_end || 0;
  const using = manual > 0 ? manual : auto;
  const variance = m.budget - using;

  return (
    <tr className={`border-t border-slate-100 hover:bg-slate-50/40 ${using > m.budget ? 'bg-red-50/20' : ''}`}>
      <td className="px-3 py-2 font-semibold text-slate-800 text-xs">{record.department}</td>
      <td className="px-3 py-2 text-right font-mono text-xs text-slate-700">{fmt(m.budget)}</td>
      <td className="px-3 py-2 text-right font-mono text-xs text-slate-600">{fmt(m.ytd)}</td>
      <td className="px-3 py-2 text-right font-mono text-xs text-emerald-700">{fmt(auto)}</td>
      <td className="px-3 py-2 text-right font-mono text-xs text-blue-700">{manual > 0 ? fmt(manual) : <span className="text-slate-300 italic">auto</span>}</td>
      <td className={`px-3 py-2 text-right font-mono text-xs font-bold ${variance >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
        {variance >= 0 ? '+' : ''}{fmt(variance)}
      </td>
      <td className="px-3 py-2">
        <select
          value={record.seasonality_profile || 'flat'}
          onChange={e => onProfileChange(record.department, e.target.value)}
          className="text-[10px] border border-slate-200 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-slate-400 w-full"
        >
          {PROFILES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
      </td>
    </tr>
  );
}

export default function ProjectionTool({ records, currentMonth, onRecordUpdate }) {
  const [localProfiles, setLocalProfiles] = useState({});

  const merged = useMemo(() => records.map(r => ({
    ...r,
    seasonality_profile: localProfiles[r.department] || r.seasonality_profile || 'flat',
  })), [records, localProfiles]);

  const handleProfileChange = (dept, profile) => {
    setLocalProfiles(prev => ({ ...prev, [dept]: profile }));
    const rec = records.find(r => r.department === dept);
    if (rec && onRecordUpdate) onRecordUpdate({ ...rec, seasonality_profile: profile });
  };

  // Chart: budget vs auto-projection per department
  const chartData = useMemo(() => merged.map(r => {
    const m = computeControlMetrics(r, currentMonth);
    return {
      name: r.department.length > 12 ? r.department.slice(0, 11) + '…' : r.department,
      budget: m.budget,
      projection: r.projected_year_end > 0 ? r.projected_year_end : m.autoProjection,
      ytd: m.ytd,
    };
  }), [merged, currentMonth]);

  const totals = useMemo(() => merged.reduce((acc, r) => {
    const m = computeControlMetrics(r, currentMonth);
    acc.budget += m.budget;
    acc.auto += m.autoProjection;
    acc.manual += r.projected_year_end || m.autoProjection;
    acc.ytd += m.ytd;
    return acc;
  }, { budget: 0, auto: 0, manual: 0, ytd: 0 }), [merged, currentMonth]);

  return (
    <div className="space-y-4">
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Adopted Budget', val: fmt(totals.budget), color: 'text-slate-900' },
          { label: 'YTD Actual (Month ' + currentMonth + ')', val: fmt(totals.ytd), color: 'text-slate-700' },
          { label: 'Auto-Projected Year-End', val: fmt(totals.auto), color: totals.auto > totals.budget ? 'text-red-700' : 'text-emerald-700' },
          { label: 'Projected Variance', val: `${totals.budget - totals.manual >= 0 ? '+' : ''}${fmt(totals.budget - totals.manual)}`, color: totals.budget - totals.manual >= 0 ? 'text-emerald-700' : 'text-red-700' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-3">
            <p className={`text-base font-bold ${s.color}`}>{s.val}</p>
            <p className="text-[10px] font-medium text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <p className="text-xs font-bold text-slate-700 mb-3">Budget vs Year-End Projection by Department</p>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData} margin={{ top: 0, right: 10, left: 10, bottom: 60 }} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-35} textAnchor="end" />
            <YAxis tick={{ fontSize: 9 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
            <Tooltip formatter={(v, name) => [`$${Math.round(v).toLocaleString()}`, name === 'budget' ? 'Adopted Budget' : name === 'projection' ? 'Projected YE' : 'YTD']} />
            <Bar dataKey="budget" name="budget" fill="#344A60" radius={[3,3,0,0]} />
            <Bar dataKey="projection" name="projection" radius={[3,3,0,0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.projection > entry.budget ? '#dc2626' : '#2A7F7F'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-2 justify-center">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-[#344A60]"/><span className="text-[10px] text-slate-500">Adopted Budget</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-[#2A7F7F]"/><span className="text-[10px] text-slate-500">Projected (under)</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-red-600"/><span className="text-[10px] text-slate-500">Projected (over)</span></div>
        </div>
      </div>

      {/* Per-department table with seasonality selector */}
      <div className="rounded-2xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 text-white px-4 py-2 flex items-center justify-between">
          <p className="text-xs font-bold">Year-End Projections — Month {currentMonth} of 12</p>
          <p className="text-[10px] text-white/50">Auto-projection uses run-rate × seasonality profile</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs" style={{ minWidth: 700 }}>
            <thead>
              <tr className="bg-slate-50">
                <th className="px-3 py-2 text-left text-[9px] font-bold text-slate-500 uppercase tracking-wider">Department</th>
                <th className="px-3 py-2 text-right text-[9px] font-bold text-slate-500 uppercase tracking-wider">Budget</th>
                <th className="px-3 py-2 text-right text-[9px] font-bold text-slate-500 uppercase tracking-wider">YTD</th>
                <th className="px-3 py-2 text-right text-[9px] font-bold text-slate-500 uppercase tracking-wider">Auto Proj.</th>
                <th className="px-3 py-2 text-right text-[9px] font-bold text-slate-500 uppercase tracking-wider">Manual YE</th>
                <th className="px-3 py-2 text-right text-[9px] font-bold text-slate-500 uppercase tracking-wider">Variance</th>
                <th className="px-3 py-2 text-left text-[9px] font-bold text-slate-500 uppercase tracking-wider">Seasonality Profile</th>
              </tr>
            </thead>
            <tbody>
              {merged.map((r, i) => (
                <ProjectionRow key={i} record={r} currentMonth={currentMonth} onProfileChange={handleProfileChange} />
              ))}
              {merged.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-xs text-slate-400">No records to project.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}