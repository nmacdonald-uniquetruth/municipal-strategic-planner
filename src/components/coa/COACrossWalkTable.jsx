/**
 * COACrossWalkTable — paginated, searchable, filterable crosswalk table
 */
import React, { useState, useMemo } from 'react';
import { Search, Filter, Pencil, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import {
  FUND_LABELS, ACCOUNT_TYPE_LABELS, MAPPING_TYPE_LABELS,
  VALIDATION_STATUS_COLORS, REPORTING_CATEGORY_LABELS
} from './coaEngine';

const fmt = n => n != null && !isNaN(n) ? `$${Math.round(Math.abs(n)).toLocaleString()}` : '—';

const SORT_KEYS = ['trio_account','new_account_number','department','fund','account_type','validation_status'];

export default function COACrossWalkTable({ accounts, onEdit, onDelete }) {
  const [search, setSearch] = useState('');
  const [filterFund, setFilterFund] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterFundType, setFilterFundType] = useState('');
  const [sortKey, setSortKey] = useState('trio_account');
  const [sortDir, setSortDir] = useState(1);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 25;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return accounts.filter(a => {
      const matchSearch = !q ||
        (a.trio_account || '').toLowerCase().includes(q) ||
        (a.new_account_number || '').toLowerCase().includes(q) ||
        (a.new_account_title || '').toLowerCase().includes(q) ||
        (a.trio_description || '').toLowerCase().includes(q) ||
        (a.department || '').toLowerCase().includes(q);
      const matchFund = !filterFund || a.fund === filterFund;
      const matchType = !filterType || a.account_type === filterType;
      const matchStatus = !filterStatus || a.validation_status === filterStatus;
      const matchFundType = !filterFundType || a.fund_type === filterFundType;
      return matchSearch && matchFund && matchType && matchStatus && matchFundType;
    }).sort((a, b) => {
      const av = a[sortKey] || '';
      const bv = b[sortKey] || '';
      return sortDir * (String(av).localeCompare(String(bv)));
    });
  }, [accounts, search, filterFund, filterType, filterStatus, filterFundType, sortKey, sortDir]);

  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
  const pageData  = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const toggleSort = key => {
    if (sortKey === key) setSortDir(d => -d);
    else { setSortKey(key); setSortDir(1); }
    setPage(0);
  };

  const SortIcon = ({ k }) => sortKey === k
    ? (sortDir > 0 ? <ChevronUp className="h-2.5 w-2.5" /> : <ChevronDown className="h-2.5 w-2.5" />)
    : null;

  const funds = [...new Set(accounts.map(a => a.fund).filter(Boolean))];
  const types = [...new Set(accounts.map(a => a.account_type).filter(Boolean))];
  const statuses = [...new Set(accounts.map(a => a.validation_status).filter(Boolean))];

  const selCls = "text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-400 bg-white";

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
            placeholder="Search TRIO, new account, title, dept…"
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 bg-white" />
        </div>
        <select value={filterFund} onChange={e => { setFilterFund(e.target.value); setPage(0); }} className={selCls}>
          <option value="">All Funds</option>
          {funds.map(f => <option key={f} value={f}>{FUND_LABELS[f] || f}</option>)}
        </select>
        <select value={filterType} onChange={e => { setFilterType(e.target.value); setPage(0); }} className={selCls}>
          <option value="">All Types</option>
          {types.map(t => <option key={t} value={t}>{ACCOUNT_TYPE_LABELS[t] || t}</option>)}
        </select>
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(0); }} className={selCls}>
          <option value="">All Statuses</option>
          {statuses.map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
        </select>
        <select value={filterFundType} onChange={e => { setFilterFundType(e.target.value); setPage(0); }} className={selCls}>
          <option value="">Govt + Enterprise</option>
          <option value="governmental">Governmental</option>
          <option value="enterprise">Enterprise</option>
        </select>
        <span className="text-[10px] text-slate-400 ml-auto">{filtered.length} account{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-slate-900 text-white">
                {[
                  ['trio_account', 'TRIO Account'],
                  ['department', 'Department'],
                  ['new_account_number', 'New Account #'],
                  ['new_account_title', 'New Title'],
                  ['account_type', 'Type'],
                  ['fund', 'Fund'],
                  ['validation_status', 'Status'],
                ].map(([k, label]) => (
                  <th key={k} onClick={() => toggleSort(k)}
                    className="px-3 py-2 text-left text-[9px] font-bold uppercase tracking-wider cursor-pointer hover:bg-slate-700 select-none whitespace-nowrap">
                    <span className="flex items-center gap-1">{label} <SortIcon k={k} /></span>
                  </th>
                ))}
                <th className="px-3 py-2 text-[9px] font-bold uppercase tracking-wider">Prior Budget</th>
                <th className="px-3 py-2 text-[9px] font-bold uppercase tracking-wider">Map Type</th>
                <th className="px-3 py-2 w-16"></th>
              </tr>
            </thead>
            <tbody>
              {pageData.length === 0 && (
                <tr><td colSpan={10} className="px-4 py-8 text-center text-xs text-slate-400">No accounts match your filters.</td></tr>
              )}
              {pageData.map((a, i) => {
                const sc = VALIDATION_STATUS_COLORS[a.validation_status] || VALIDATION_STATUS_COLORS.unmapped;
                return (
                  <tr key={a.id || i} className={`border-t border-slate-100 hover:bg-slate-50/50 transition-colors ${!a.new_account_number ? 'bg-red-50/30' : ''}`}>
                    <td className="px-3 py-2 font-mono text-[10px] text-slate-600 whitespace-nowrap">{a.trio_account || <span className="text-slate-300 italic">none</span>}</td>
                    <td className="px-3 py-2 text-[11px] text-slate-700 max-w-[120px] truncate" title={a.department}>{a.department || a.trio_department || '—'}</td>
                    <td className="px-3 py-2 font-mono text-[10px] font-semibold text-slate-900 whitespace-nowrap">{a.new_account_number || <span className="text-red-400 italic">unset</span>}</td>
                    <td className="px-3 py-2 text-[11px] text-slate-800 max-w-[160px] truncate" title={a.new_account_title}>{a.new_account_title || '—'}</td>
                    <td className="px-3 py-2 text-[10px] text-slate-600 whitespace-nowrap">{ACCOUNT_TYPE_LABELS[a.account_type] || a.account_type}</td>
                    <td className="px-3 py-2 text-[10px] text-slate-600 whitespace-nowrap max-w-[100px] truncate">{FUND_LABELS[a.fund] || a.fund}</td>
                    <td className="px-3 py-2">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${sc.bg} ${sc.text}`}>
                        {a.validation_status?.replace(/_/g,' ') || 'unmapped'}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono text-[10px] text-right text-slate-500">{fmt(a.trio_historical_budget)}</td>
                    <td className="px-3 py-2">
                      <span className="text-[9px] text-slate-400">{MAPPING_TYPE_LABELS[a.mapping_type] || '—'}</span>
                      {a.mapping_type === 'split' && <span className="text-[9px] text-amber-600 ml-1">{a.mapping_split_percent}%</span>}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        <button onClick={() => onEdit(a)} className="p-1 text-slate-400 hover:text-slate-800 transition-colors rounded">
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button onClick={() => onDelete(a)} className="p-1 text-slate-300 hover:text-red-500 transition-colors rounded">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-slate-400">Page {page + 1} of {pageCount} · {filtered.length} records</p>
          <div className="flex gap-1">
            <button disabled={page === 0} onClick={() => setPage(0)} className="text-[10px] px-2 py-1 rounded border border-slate-200 disabled:opacity-30">«</button>
            <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="text-[10px] px-2 py-1 rounded border border-slate-200 disabled:opacity-30">‹</button>
            <button disabled={page >= pageCount - 1} onClick={() => setPage(p => p + 1)} className="text-[10px] px-2 py-1 rounded border border-slate-200 disabled:opacity-30">›</button>
            <button disabled={page >= pageCount - 1} onClick={() => setPage(pageCount - 1)} className="text-[10px] px-2 py-1 rounded border border-slate-200 disabled:opacity-30">»</button>
          </div>
        </div>
      )}
    </div>
  );
}