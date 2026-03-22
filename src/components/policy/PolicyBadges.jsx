/**
 * Shared badge/pill components for the Legislative & Policy module
 */
import React from 'react';
import { PRIORITY_COLORS, STATUS_COLORS, STATUS_LABELS, JURISDICTION_COLORS, ACTION_COLORS } from './policyEngine';

export function PriorityBadge({ priority, size = 'sm' }) {
  const c = PRIORITY_COLORS[priority] || PRIORITY_COLORS.watch;
  const sz = size === 'xs' ? 'text-[9px] px-1.5 py-0.5' : 'text-[10px] px-2 py-0.5';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-bold border ${sz} ${c.bg} ${c.text} ${c.border}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
      {priority?.charAt(0).toUpperCase() + priority?.slice(1)}
    </span>
  );
}

export function StatusBadge({ status, size = 'sm' }) {
  const c = STATUS_COLORS[status] || STATUS_COLORS.watch;
  const sz = size === 'xs' ? 'text-[9px] px-1.5 py-0.5' : 'text-[10px] px-2 py-0.5';
  return (
    <span className={`inline-block rounded-full font-semibold border ${sz} ${c.bg} ${c.text} ${c.border}`}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}

export function JurisdictionBadge({ jurisdiction, size = 'sm' }) {
  const c = JURISDICTION_COLORS[jurisdiction] || { bg: 'bg-slate-100', text: 'text-slate-600' };
  const sz = size === 'xs' ? 'text-[9px] px-1.5 py-0.5' : 'text-[10px] px-2 py-0.5';
  return (
    <span className={`inline-block rounded font-bold uppercase tracking-wide ${sz} ${c.bg} ${c.text}`}>
      {jurisdiction}
    </span>
  );
}

export function ActionBadge({ action }) {
  const c = ACTION_COLORS[action] || ACTION_COLORS.monitor;
  return (
    <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-semibold ${c.bg} ${c.text}`}>
      {action?.charAt(0).toUpperCase() + action?.slice(1)}
    </span>
  );
}

export function RelevanceScore({ score }) {
  const color = score >= 75 ? 'text-red-700 bg-red-50 border-red-200'
    : score >= 50 ? 'text-orange-700 bg-orange-50 border-orange-200'
    : score >= 30 ? 'text-amber-700 bg-amber-50 border-amber-200'
    : 'text-slate-500 bg-slate-50 border-slate-200';
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold border rounded px-1.5 py-0.5 ${color}`}>
      {Math.round(score || 0)}<span className="font-normal opacity-70">/100</span>
    </span>
  );
}

export function ImpactBadge({ level }) {
  const map = {
    very_high: 'bg-red-100 text-red-800 border-red-300',
    high: 'bg-orange-100 text-orange-800 border-orange-300',
    moderate: 'bg-amber-50 text-amber-700 border-amber-200',
    low: 'bg-slate-50 text-slate-500 border-slate-200',
  };
  const label = { very_high: 'Very High', high: 'High', moderate: 'Moderate', low: 'Low' };
  return (
    <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded border font-semibold ${map[level] || map.low}`}>
      {label[level] || level}
    </span>
  );
}

export function FlagRow({ item }) {
  const flags = [];
  if (item.is_flagged_urgent) flags.push({ label: '🚨 Urgent', cls: 'bg-red-100 text-red-700' });
  if (item.is_flagged_board) flags.push({ label: '📋 Board Review', cls: 'bg-purple-100 text-purple-700' });
  if (item.is_flagged_budget) flags.push({ label: '💰 Budget', cls: 'bg-amber-100 text-amber-700' });
  if (item.is_flagged_grant) flags.push({ label: '🎯 Grant', cls: 'bg-emerald-100 text-emerald-700' });
  if (!flags.length) return null;
  return (
    <div className="flex gap-1 flex-wrap">
      {flags.map(f => (
        <span key={f.label} className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${f.cls}`}>{f.label}</span>
      ))}
    </div>
  );
}