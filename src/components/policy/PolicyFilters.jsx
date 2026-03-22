/**
 * PolicyFilters — search + filter bar for the bill tracker
 */
import React from 'react';
import { Search, X } from 'lucide-react';
import { JURISDICTIONS, PRIORITIES, STATUSES, STATUS_LABELS, TOPIC_CATEGORIES, DEFAULT_DEPARTMENTS } from './policyEngine';

export default function PolicyFilters({ filters, onChange, profile }) {
  const departments = profile?.departments?.length ? profile.departments : DEFAULT_DEPARTMENTS;
  const categories = profile?.custom_categories?.length
    ? [...TOPIC_CATEGORIES, ...profile.custom_categories]
    : TOPIC_CATEGORIES;

  const set = (key, val) => onChange({ ...filters, [key]: val });
  const clear = () => onChange({ jurisdiction: 'all', priority: 'all', status: 'all', category: 'all', department: 'all', search: '', watched: false, urgent: false });
  const hasFilters = Object.entries(filters).some(([k, v]) => v && v !== 'all' && v !== false && v !== '');

  return (
    <div className="space-y-2">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
        <input
          type="text"
          placeholder="Search bills, policies, identifiers..."
          value={filters.search || ''}
          onChange={e => set('search', e.target.value)}
          className="w-full pl-8 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 bg-white"
        />
        {filters.search && (
          <button onClick={() => set('search', '')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Dropdowns */}
      <div className="flex flex-wrap gap-2">
        <Select label="Jurisdiction" value={filters.jurisdiction} onChange={v => set('jurisdiction', v)}
          options={[{ value: 'all', label: 'All Jurisdictions' }, ...JURISDICTIONS.map(j => ({ value: j, label: j.charAt(0).toUpperCase() + j.slice(1) }))]} />
        <Select label="Priority" value={filters.priority} onChange={v => set('priority', v)}
          options={[{ value: 'all', label: 'All Priorities' }, ...PRIORITIES.map(p => ({ value: p, label: p.charAt(0).toUpperCase() + p.slice(1) }))]} />
        <Select label="Status" value={filters.status} onChange={v => set('status', v)}
          options={[{ value: 'all', label: 'All Statuses' }, ...STATUSES.map(s => ({ value: s, label: STATUS_LABELS[s] }))]} />
        <Select label="Category" value={filters.category} onChange={v => set('category', v)}
          options={[{ value: 'all', label: 'All Categories' }, ...categories.map(c => ({ value: c, label: c }))]} />
        <Select label="Department" value={filters.department} onChange={v => set('department', v)}
          options={[{ value: 'all', label: 'All Departments' }, ...departments.map(d => ({ value: d, label: d }))]} />
      </div>

      {/* Toggle filters + clear */}
      <div className="flex items-center gap-3 flex-wrap">
        <Toggle label="Watched Only" checked={filters.watched} onChange={v => set('watched', v)} />
        <Toggle label="Urgent Only" checked={filters.urgent} onChange={v => set('urgent', v)} />
        {hasFilters && (
          <button onClick={clear} className="text-[10px] text-red-600 hover:text-red-800 font-semibold flex items-center gap-1">
            <X className="h-3 w-3" /> Clear filters
          </button>
        )}
      </div>
    </div>
  );
}

function Select({ label, value, options, onChange }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-700"
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-slate-600 font-semibold select-none">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="rounded" />
      {label}
    </label>
  );
}