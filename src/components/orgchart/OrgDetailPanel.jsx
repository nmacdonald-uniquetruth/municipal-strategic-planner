import React from 'react';
import { X, DollarSign, User, Building2, ArrowUp, Briefcase, Clock, Edit2 } from 'lucide-react';
import { DEPT_COLORS, FUND_LABELS } from './OrgData';

const STATUS_COLORS = {
  filled: 'bg-emerald-100 text-emerald-800',
  vacant: 'bg-amber-100 text-amber-800',
  proposed: 'bg-blue-100 text-blue-800',
  eliminated: 'bg-red-100 text-red-800',
  frozen: 'bg-slate-100 text-slate-700',
};

function Row({ label, value, mono = false }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-start justify-between gap-3 py-2 border-b border-slate-100 last:border-0">
      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex-shrink-0">{label}</span>
      <span className={`text-xs text-slate-800 text-right ${mono ? 'font-mono' : 'font-medium'}`}>{value}</span>
    </div>
  );
}

export default function OrgDetailPanel({ node, allPositions, onClose }) {
  if (!node) return null;
  const deptColor = DEPT_COLORS[node.department] || '#344A60';

  // Find supervisor name
  const supervisor = node.reports_to
    ? allPositions.find(p => p.position_id === node.reports_to)
    : null;

  // Find direct reports
  const directReports = allPositions.filter(p => p.reports_to === node.position_id && !p._hidden);

  // Budget calculation
  const healthAnnual = 30938; // family tier default
  const ficaRate = 0.0765;
  const persRate = 0.085;
  const wcRate = 0.025;
  let fullyLoaded = node.base_salary || 0;
  if (node.employment_type === 'full_time' && fullyLoaded > 0) {
    fullyLoaded = Math.round(fullyLoaded * (1 + ficaRate + persRate + wcRate) + healthAnnual);
  }

  return (
    <div className="w-80 flex-shrink-0 rounded-xl border border-slate-200 bg-white overflow-hidden shadow-lg">
      {/* Header */}
      <div className="px-4 py-4 text-white relative" style={{ background: deptColor }}>
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 rounded hover:bg-white/20 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-start gap-3 pr-8">
          <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
            <User className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold leading-tight">{node.title}</p>
            {node.subtitle && <p className="text-[11px] opacity-80 leading-tight mt-0.5">{node.subtitle}</p>}
            <p className="text-[11px] opacity-70 mt-1">{node.department}</p>
          </div>
        </div>
        {/* Status badge */}
        <div className="mt-3 flex gap-2 flex-wrap">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[node.status] || 'bg-white/20 text-white'}`}>
            {node.status}
          </span>
          {node.employment_type && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20">
              {node.employment_type.replace('_', ' ')}
            </span>
          )}
          {node.is_union && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-200 text-purple-900">Union</span>
          )}
        </div>
      </div>

      {/* Employee */}
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Assigned Employee</p>
        {node.employee
          ? <p className="text-sm font-semibold text-slate-900">{node.employee.full_name}</p>
          : <p className="text-sm italic text-amber-600">Position Vacant</p>
        }
      </div>

      {/* Details */}
      <div className="px-4 py-2">
        <Row label="Department" value={node.department} />
        <Row label="Level" value={`Level ${node.level}`} />
        <Row label="Reports To" value={supervisor ? `${supervisor.title}` : '—'} />
        <Row label="Direct Reports" value={directReports.length > 0 ? `${directReports.length} positions` : 'None'} />
        <Row label="Fund Source" value={FUND_LABELS[node.fund_source] || node.fund_source} mono />
        {node.base_salary > 0 && <Row label="Base Salary" value={`$${node.base_salary.toLocaleString()}`} mono />}
        {fullyLoaded > 0 && node.employment_type === 'full_time' && (
          <Row label="Fully Loaded (est.)" value={`$${fullyLoaded.toLocaleString()}`} mono />
        )}
        {node.account_code && <Row label="Account Code" value={node.account_code} mono />}
        {node.is_configurable && <Row label="Configurable" value="Yes — scenario-driven" />}
        {node.notes && <Row label="Notes" value={node.notes} />}
      </div>

      {/* Direct reports list */}
      {directReports.length > 0 && (
        <div className="px-4 py-3 border-t border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Direct Reports</p>
          <div className="space-y-1">
            {directReports.map(r => (
              <div key={r.position_id} className="flex items-center gap-2 text-xs text-slate-700 py-1 border-b border-slate-50 last:border-0">
                <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${r.status === 'filled' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                <span className="font-medium truncate">{r.title}</span>
                {r.status === 'vacant' && <span className="text-[9px] text-amber-600 italic flex-shrink-0">vacant</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}