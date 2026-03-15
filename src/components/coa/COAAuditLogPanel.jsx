/**
 * COAAuditLogPanel — Full audit trail for crosswalk changes.
 * Reads from COAAuditLog entity. Supports filtering by event type and account.
 */
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Clock, Filter, RefreshCw, CheckCircle, AlertTriangle, Trash2, Plus, Edit, Upload, Lock } from 'lucide-react';

const EVENT_CONFIG = {
  account_created:    { label: 'Account Created',    icon: Plus,         color: 'text-emerald-600', bg: 'bg-emerald-50' },
  account_updated:    { label: 'Account Updated',    icon: Edit,         color: 'text-blue-600',    bg: 'bg-blue-50' },
  account_deleted:    { label: 'Account Deleted',    icon: Trash2,       color: 'text-red-600',     bg: 'bg-red-50' },
  account_approved:   { label: 'Account Approved',   icon: CheckCircle,  color: 'text-emerald-600', bg: 'bg-emerald-50' },
  mapping_changed:    { label: 'Mapping Changed',    icon: Edit,         color: 'text-amber-600',   bg: 'bg-amber-50' },
  status_changed:     { label: 'Status Changed',     icon: RefreshCw,    color: 'text-blue-600',    bg: 'bg-blue-50' },
  version_created:    { label: 'Version Created',    icon: Plus,         color: 'text-slate-600',   bg: 'bg-slate-50' },
  version_approved:   { label: 'Version Approved',   icon: CheckCircle,  color: 'text-emerald-600', bg: 'bg-emerald-50' },
  version_superseded: { label: 'Version Superseded', icon: Archive,      color: 'text-amber-600',   bg: 'bg-amber-50' },
  import_completed:   { label: 'Import Completed',   icon: Upload,       color: 'text-blue-600',    bg: 'bg-blue-50' },
  exception_resolved: { label: 'Exception Resolved', icon: CheckCircle,  color: 'text-emerald-600', bg: 'bg-emerald-50' },
  exception_flagged:  { label: 'Exception Flagged',  icon: AlertTriangle,color: 'text-amber-600',   bg: 'bg-amber-50' },
  deletion_blocked:   { label: 'Deletion Blocked',   icon: Lock,         color: 'text-red-600',     bg: 'bg-red-50' },
};

// For the Archive icon used in version_superseded
import { Archive } from 'lucide-react';

function LogRow({ entry }) {
  const cfg = EVENT_CONFIG[entry.event_type] || { label: entry.event_type, icon: Clock, color: 'text-slate-500', bg: 'bg-slate-50' };
  const Icon = cfg.icon;
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-slate-100 last:border-0">
      <div className={`h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${cfg.bg}`}>
        <Icon className={`h-3 w-3 ${cfg.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-xs font-semibold text-slate-800">{cfg.label}</p>
          {entry.account_number && <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{entry.account_number}</span>}
          {entry.trio_account   && <span className="font-mono text-[10px] text-slate-400">← {entry.trio_account}</span>}
        </div>
        {entry.description && <p className="text-[10px] text-slate-500 mt-0.5">{entry.description}</p>}
        {entry.field_changed && (
          <p className="text-[10px] text-slate-400 mt-0.5">
            <span className="font-medium">{entry.field_changed}:</span> {entry.value_before || '—'} → {entry.value_after || '—'}
          </p>
        )}
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-[9px] text-slate-400">{entry.timestamp ? new Date(entry.timestamp).toLocaleDateString() : '—'}</p>
        <p className="text-[9px] text-slate-400">{entry.timestamp ? new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</p>
        {entry.user_email && <p className="text-[9px] text-slate-300">{entry.user_email}</p>}
      </div>
    </div>
  );
}

export default function COAAuditLogPanel() {
  const [filterType, setFilterType] = useState('all');
  const [search, setSearch] = useState('');

  const { data: logs = [], isLoading, refetch } = useQuery({
    queryKey: ['coa_audit_log'],
    queryFn: () => base44.entities.COAAuditLog.list('-created_date', 200),
    initialData: [],
  });

  const filtered = logs.filter(l => {
    const typeMatch = filterType === 'all' || l.event_type === filterType;
    const searchMatch = !search || l.description?.toLowerCase().includes(search.toLowerCase()) ||
      l.account_number?.includes(search) || l.trio_account?.includes(search);
    return typeMatch && searchMatch;
  });

  return (
    <div className="space-y-3">
      {/* Controls */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
          <Filter className="h-3 w-3" />
          <select value={filterType} onChange={e => setFilterType(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2 py-1 focus:outline-none">
            <option value="all">All Events</option>
            {Object.entries(EVENT_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search account, description…"
          className="text-xs border border-slate-200 rounded-lg px-2.5 py-1 focus:outline-none flex-1 min-w-32" />
        <button onClick={() => refetch()} className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-700 px-2 py-1 rounded border border-slate-200 hover:border-slate-400 transition-colors">
          <RefreshCw className="h-3 w-3" /> Refresh
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 max-h-[60vh] overflow-y-auto">
        {isLoading && <p className="text-xs text-slate-400 py-4 text-center">Loading audit log…</p>}
        {!isLoading && filtered.length === 0 && (
          <div className="py-8 text-center">
            <Clock className="h-8 w-8 text-slate-200 mx-auto mb-2" />
            <p className="text-xs text-slate-400">No audit log entries yet. Changes to the crosswalk will be recorded here.</p>
          </div>
        )}
        {filtered.map((entry, i) => <LogRow key={entry.id || i} entry={entry} />)}
      </div>

      <p className="text-[9px] text-slate-400 text-center">
        Showing {filtered.length} of {logs.length} events · Audit log is immutable once written
      </p>
    </div>
  );
}