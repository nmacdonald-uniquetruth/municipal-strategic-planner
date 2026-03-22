/**
 * ProjectPipelineTable.jsx — CIP project pipeline with Gantt-style year bars.
 */
import React, { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { PRIORITY_COLORS, WORK_TYPE_COLORS, fmt, fmtK } from './roadCIPEngine';

const YEARS = Array.from({ length: 15 }, (_, i) => 2027 + i);
const PRIORITY_ORDER = { Critical: 0, High: 1, Medium: 2, Low: 3 };

export default function ProjectPipelineTable({ projects, onAdd, onEdit, onDelete }) {
  const [filterPriority, setFilter] = useState('All');
  const [filterCategory, setCategory] = useState('All');

  const filtered = useMemo(() => {
    let list = projects.filter(p => {
      if (filterPriority !== 'All' && p.priority !== filterPriority) return false;
      if (filterCategory !== 'All' && p.category !== filterCategory) return false;
      return true;
    });
    return [...list].sort((a, b) =>
      (PRIORITY_ORDER[a.priority] ?? 4) - (PRIORITY_ORDER[b.priority] ?? 4) ||
      a.fy_start - b.fy_start
    );
  }, [projects, filterPriority, filterCategory]);

  const totalCost = useMemo(() =>
    filtered.filter(p => p.include_in_cip !== false).reduce((s, p) => s + (p.total_cost || 0), 0),
  [filtered]);

  const categories = ['All', ...new Set(projects.map(p => p.category).filter(Boolean))];

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          ['Priority', ['All', 'Critical', 'High', 'Medium', 'Low'], filterPriority, setFilter],
          ['Category', categories, filterCategory, setCategory],
        ].map(([label, opts, val, set]) => (
          <select key={label} value={val} onChange={e => set(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none">
            {opts.map(o => <option key={o}>{o}</option>)}
          </select>
        ))}
        <span className="text-[11px] text-slate-400 ml-auto">
          {filtered.length} projects · {fmt(totalCost)} total
        </span>
        <button onClick={onAdd}
          className="flex items-center gap-1 text-xs font-semibold bg-slate-900 text-white px-3 py-1.5 rounded-lg hover:bg-slate-700 transition-colors">
          <Plus className="h-3.5 w-3.5" /> Add Project
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs" style={{ minWidth: '1200px' }}>
            <thead className="sticky top-0 z-10">
              <tr className="bg-slate-900 text-white">
                <th className="px-3 py-2.5 text-left text-[9px] font-bold uppercase tracking-wider min-w-[180px]">Project</th>
                <th className="px-3 py-2.5 text-left text-[9px] font-bold uppercase tracking-wider min-w-[100px]">Road / Asset</th>
                <th className="px-3 py-2.5 text-left text-[9px] font-bold uppercase tracking-wider min-w-[90px]">Work Type</th>
                <th className="px-3 py-2.5 text-left text-[9px] font-bold uppercase tracking-wider">Priority</th>
                <th className="px-3 py-2.5 text-right text-[9px] font-bold uppercase tracking-wider">Total Cost</th>
                <th className="px-3 py-2.5 text-left text-[9px] font-bold uppercase tracking-wider">Funding</th>
                {YEARS.map(y => (
                  <th key={y} className="px-1.5 py-2.5 text-center text-[9px] font-bold uppercase w-10">{String(y).slice(2)}</th>
                ))}
                <th className="px-2 py-2.5 text-center text-[9px] font-bold uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => {
                const pc  = PRIORITY_COLORS[p.priority] || PRIORITY_COLORS.Low;
                const wc  = WORK_TYPE_COLORS[p.work_type] || '';
                return (
                  <tr key={p.id || p.project_name + p.fy_start}
                    className={`border-t border-slate-100 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'} hover:bg-blue-50/40 transition-colors`}>
                    <td className="px-3 py-2 font-semibold text-slate-900 leading-snug">{p.project_name}</td>
                    <td className="px-3 py-2 text-slate-500 text-[11px]">{p.linked_road || '—'}</td>
                    <td className="px-3 py-2">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${wc}`}>{p.work_type || '—'}</span>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${pc}`}>{p.priority}</span>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums font-semibold text-slate-800">{fmtK(p.total_cost)}</td>
                    <td className="px-3 py-2 text-[10px] text-slate-500">{p.funding_source}</td>
                    {YEARS.map(y => {
                      const active = y >= p.fy_start && y <= (p.fy_end || p.fy_start);
                      const isFirst = y === p.fy_start;
                      const isLast  = y === (p.fy_end || p.fy_start);
                      const color   = p.priority === 'Critical' ? 'bg-red-500' : p.priority === 'High' ? 'bg-orange-400' : p.priority === 'Medium' ? 'bg-amber-400' : 'bg-slate-300';
                      return (
                        <td key={y} className="px-0.5 py-2 text-center">
                          {active && (
                            <div className={`h-3 mx-0.5 ${color} ${isFirst ? 'rounded-l-full' : ''} ${isLast ? 'rounded-r-full' : ''}`} />
                          )}
                        </td>
                      );
                    })}
                    <td className="px-2 py-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {onEdit && (
                          <button onClick={() => onEdit(p)} className="text-slate-400 hover:text-slate-700 p-0.5 rounded hover:bg-slate-100">
                            <Pencil className="h-3 w-3" />
                          </button>
                        )}
                        {onDelete && (
                          <button onClick={() => onDelete(p)} className="text-slate-400 hover:text-red-600 p-0.5 rounded hover:bg-red-50">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
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