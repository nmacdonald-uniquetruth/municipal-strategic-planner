/**
 * RoadInventoryTable.jsx — Road segment inventory with status, treatment plan, and cost estimate.
 */
import React, { useState, useMemo } from 'react';
import { Search, ChevronUp, ChevronDown } from 'lucide-react';
import { STATUS_COLORS, WORK_TYPE_COLORS, fmt } from './roadCIPEngine';

const JURISDICTIONS = ['All', 'Townway', 'State-aid'];
const BUCKETS       = ['All', 'Critical', 'Aging', 'Mid-life', 'Good', 'Unknown'];

export default function RoadInventoryTable({ roads, onSelect, selectedId }) {
  const [search, setSearch]       = useState('');
  const [filterJuris, setJuris]   = useState('All');
  const [filterBucket, setBucket] = useState('All');
  const [sortKey, setSortKey]     = useState('priority_score');
  const [sortDir, setSortDir]     = useState('desc');

  const filtered = useMemo(() => {
    let list = roads.filter(r => {
      if (filterJuris !== 'All' && r.jurisdiction !== filterJuris) return false;
      if (filterBucket !== 'All' && r.status_bucket !== filterBucket) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!r.road_name?.toLowerCase().includes(q)) return false;
      }
      return true;
    });
    list = [...list].sort((a, b) => {
      const av = a[sortKey] ?? 0;
      const bv = b[sortKey] ?? 0;
      return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });
    return list;
  }, [roads, search, filterJuris, filterBucket, sortKey, sortDir]);

  const handleSort = key => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const SortIcon = ({ col }) => sortKey === col
    ? (sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)
    : null;

  const totals = useMemo(() => ({
    miles: filtered.reduce((s, r) => s + (r.centerline_miles || 0), 0),
    cost:  filtered.reduce((s, r) => s + (r.estimated_project_cost || 0), 0),
  }), [filtered]);

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search roads…"
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400"
          />
        </div>
        {[['Jurisdiction', JURISDICTIONS, filterJuris, setJuris], ['Condition', BUCKETS, filterBucket, setBucket]].map(([label, opts, val, set]) => (
          <select key={label} value={val} onChange={e => set(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none bg-white">
            {opts.map(o => <option key={o}>{o}</option>)}
          </select>
        ))}
        <span className="text-[11px] text-slate-400 ml-auto">{filtered.length} roads · {totals.miles.toFixed(2)} mi · {fmt(totals.cost)}</span>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
          <table className="w-full border-collapse text-xs min-w-[800px]">
            <thead className="sticky top-0 z-10">
              <tr className="bg-slate-900 text-white">
                {[
                  ['road_name',              'Road Name'],
                  ['jurisdiction',           'Jurisdiction'],
                  ['centerline_miles',       'Miles'],
                  ['status_bucket',          'Status'],
                  ['last_major_work_year',   'Last Work'],
                  ['planning_work_type',     'Next Treatment'],
                  ['next_treatment_year',    'Target Year'],
                  ['estimated_project_cost', 'Est. Cost'],
                  ['priority_score',         'Priority'],
                ].map(([key, label]) => (
                  <th key={key}
                    onClick={() => handleSort(key)}
                    className="px-3 py-2.5 text-left text-[9px] font-bold uppercase tracking-wider whitespace-nowrap cursor-pointer hover:bg-slate-800 select-none">
                    <span className="flex items-center gap-1">{label}<SortIcon col={key} /></span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((road, i) => {
                const sc = STATUS_COLORS[road.status_bucket] || STATUS_COLORS.Unknown;
                const wc = WORK_TYPE_COLORS[road.planning_work_type] || 'bg-slate-100 text-slate-600';
                const isSelected = selectedId === road.id || selectedId === road.road_name;
                return (
                  <tr key={road.id || road.road_name}
                    onClick={() => onSelect?.(road)}
                    className={`border-t border-slate-100 cursor-pointer transition-colors ${
                      isSelected ? 'bg-blue-50' : i % 2 === 0 ? 'bg-white hover:bg-slate-50' : 'bg-slate-50/40 hover:bg-slate-50'
                    }`}>
                    <td className="px-3 py-2.5 font-semibold text-slate-900">{road.road_name}</td>
                    <td className="px-3 py-2.5 text-slate-500">{road.jurisdiction}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{road.centerline_miles?.toFixed(3)}</td>
                    <td className="px-3 py-2.5">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${sc.bg} ${sc.text}`}>
                        {road.status_bucket || '—'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-slate-500">{road.last_major_work_year || '—'}</td>
                    <td className="px-3 py-2.5">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${wc}`}>
                        {road.planning_work_type || '—'}
                      </span>
                    </td>
                    <td className={`px-3 py-2.5 font-bold tabular-nums ${road.next_treatment_year <= 2027 ? 'text-red-700' : 'text-slate-700'}`}>
                      {road.next_treatment_year || '—'}
                    </td>
                    <td className="px-3 py-2.5 tabular-nums text-right">{fmt(road.estimated_project_cost)}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden w-16">
                          <div className={`h-full rounded-full ${road.priority_score >= 80 ? 'bg-red-500' : road.priority_score >= 60 ? 'bg-orange-400' : 'bg-amber-400'}`}
                            style={{ width: `${road.priority_score}%` }} />
                        </div>
                        <span className="text-[10px] font-bold text-slate-600 w-6 text-right">{road.priority_score}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}