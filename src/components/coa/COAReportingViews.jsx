/**
 * COAReportingViews — Old-to-New, Department, Revenue, Expenditure, Exceptions reports
 */
import React, { useMemo } from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import {
  buildOldToNewView, buildDepartmentView, buildRevenueView,
  buildExpenditureView, buildExceptionsReport,
  FUND_LABELS, ACCOUNT_TYPE_LABELS, VALIDATION_STATUS_COLORS, MAPPING_TYPE_LABELS
} from './coaEngine';

const fmt = n => n != null && !isNaN(n) && n !== 0 ? `$${Math.round(Math.abs(n)).toLocaleString()}` : '—';

function TableHeader({ cols }) {
  return (
    <thead>
      <tr className="bg-slate-900 text-white">
        {cols.map(c => (
          <th key={c} className="px-3 py-2 text-left text-[9px] font-bold uppercase tracking-wider whitespace-nowrap">{c}</th>
        ))}
      </tr>
    </thead>
  );
}

function StatusBadge({ status }) {
  const sc = VALIDATION_STATUS_COLORS[status] || VALIDATION_STATUS_COLORS.unmapped;
  return <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${sc.bg} ${sc.text}`}>{status?.replace(/_/g,' ')}</span>;
}

// ── Old-to-New ─────────────────────────────────────────────────────────────────
export function OldToNewView({ accounts }) {
  const rows = useMemo(() => buildOldToNewView(accounts), [accounts]);
  return (
    <div className="rounded-2xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto max-h-[600px]">
        <table className="w-full text-xs border-collapse min-w-[750px]">
          <TableHeader cols={['TRIO Account','TRIO Dept','TRIO Description','→','New Account #','New Title','Fund','Type','Status']} />
          <tbody>
            {rows.map((a, i) => (
              <tr key={i} className={`border-t border-slate-100 hover:bg-slate-50/40 ${!a.new_account_number ? 'bg-red-50/20' : ''}`}>
                <td className="px-3 py-1.5 font-mono text-[10px] text-slate-500">{a.trio_account || '—'}</td>
                <td className="px-3 py-1.5 text-[11px] text-slate-600">{a.trio_department || '—'}</td>
                <td className="px-3 py-1.5 text-[11px] text-slate-700 max-w-[150px] truncate" title={a.trio_description}>{a.trio_description || '—'}</td>
                <td className="px-3 py-1.5 text-slate-400 text-center">→</td>
                <td className="px-3 py-1.5 font-mono text-[10px] font-semibold text-slate-900">{a.new_account_number || <span className="text-red-400 italic">unmapped</span>}</td>
                <td className="px-3 py-1.5 text-[11px] text-slate-800 max-w-[150px] truncate" title={a.new_account_title}>{a.new_account_title || '—'}</td>
                <td className="px-3 py-1.5 text-[10px] text-slate-500 whitespace-nowrap">{FUND_LABELS[a.fund] || a.fund || '—'}</td>
                <td className="px-3 py-1.5 text-[10px] text-slate-500">{ACCOUNT_TYPE_LABELS[a.account_type] || a.account_type || '—'}</td>
                <td className="px-3 py-1.5"><StatusBadge status={a.validation_status} /></td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={9} className="px-4 py-8 text-center text-xs text-slate-400">No accounts.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Department view ────────────────────────────────────────────────────────────
export function DepartmentView({ accounts }) {
  const groups = useMemo(() => buildDepartmentView(accounts), [accounts]);
  return (
    <div className="space-y-4">
      {groups.map(g => (
        <div key={g.department} className="rounded-2xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-900 text-white px-4 py-2 flex items-center justify-between">
            <p className="text-xs font-bold">{g.department}</p>
            <div className="flex gap-4 text-[10px] text-white/70">
              <span>Budget: {fmt(g.totalBudget)}</span>
              <span>Actual: {fmt(g.totalActual)}</span>
              <span>{g.accounts.length} account{g.accounts.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse min-w-[600px]">
              <TableHeader cols={['TRIO Account','New Account #','New Title','Type','Article','Prior Budget','Prior Actual','Status']} />
              <tbody>
                {g.accounts.map((a, i) => (
                  <tr key={i} className="border-t border-slate-100 hover:bg-slate-50/40">
                    <td className="px-3 py-1.5 font-mono text-[10px] text-slate-500">{a.trio_account || '—'}</td>
                    <td className="px-3 py-1.5 font-mono text-[10px] font-semibold">{a.new_account_number || <span className="text-red-400 italic">unmapped</span>}</td>
                    <td className="px-3 py-1.5 text-[11px] text-slate-700">{a.new_account_title || '—'}</td>
                    <td className="px-3 py-1.5 text-[10px] text-slate-500">{ACCOUNT_TYPE_LABELS[a.account_type] || '—'}</td>
                    <td className="px-3 py-1.5 text-[10px] text-slate-500">{a.budget_article_mapping || '—'}</td>
                    <td className="px-3 py-1.5 font-mono text-[10px] text-right">{fmt(a.trio_historical_budget)}</td>
                    <td className="px-3 py-1.5 font-mono text-[10px] text-right">{fmt(a.trio_historical_actual)}</td>
                    <td className="px-3 py-1.5"><StatusBadge status={a.validation_status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Revenue / Expenditure views ────────────────────────────────────────────────
function AccountListView({ rows, label }) {
  const totalBudget = rows.reduce((s, a) => s + (a.trio_historical_budget || 0), 0);
  const totalActual = rows.reduce((s, a) => s + (a.trio_historical_actual || 0), 0);
  return (
    <div className="rounded-2xl border border-slate-200 overflow-hidden">
      <div className="bg-slate-900 text-white px-4 py-2 flex items-center justify-between">
        <p className="text-xs font-bold">{label} ({rows.length})</p>
        <div className="flex gap-4 text-[10px] text-white/70">
          <span>Total Budget: {fmt(totalBudget)}</span>
          <span>Total Actual: {fmt(totalActual)}</span>
        </div>
      </div>
      <div className="overflow-x-auto max-h-[500px]">
        <table className="w-full text-xs border-collapse min-w-[700px]">
          <TableHeader cols={['New Account #','New Title','TRIO Account','Department','Fund','Reporting Category','Prior Budget','Prior Actual','Status']} />
          <tbody>
            {rows.map((a, i) => (
              <tr key={i} className="border-t border-slate-100 hover:bg-slate-50/40">
                <td className="px-3 py-1.5 font-mono text-[10px] font-semibold text-slate-900">{a.new_account_number}</td>
                <td className="px-3 py-1.5 text-[11px] text-slate-800 max-w-[140px] truncate">{a.new_account_title}</td>
                <td className="px-3 py-1.5 font-mono text-[10px] text-slate-500">{a.trio_account || '—'}</td>
                <td className="px-3 py-1.5 text-[11px] text-slate-600 max-w-[100px] truncate">{a.department || a.trio_department || '—'}</td>
                <td className="px-3 py-1.5 text-[10px] text-slate-500 whitespace-nowrap">{FUND_LABELS[a.fund] || a.fund}</td>
                <td className="px-3 py-1.5 text-[10px] text-slate-500">{a.reporting_category?.replace(/_/g,' ') || '—'}</td>
                <td className="px-3 py-1.5 font-mono text-[10px] text-right">{fmt(a.trio_historical_budget)}</td>
                <td className="px-3 py-1.5 font-mono text-[10px] text-right">{fmt(a.trio_historical_actual)}</td>
                <td className="px-3 py-1.5"><StatusBadge status={a.validation_status} /></td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={9} className="px-4 py-8 text-center text-xs text-slate-400">No accounts.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function RevenueView({ accounts }) {
  const rows = useMemo(() => buildRevenueView(accounts), [accounts]);
  return <AccountListView rows={rows} label="Revenue Accounts" />;
}

export function ExpenditureView({ accounts }) {
  const rows = useMemo(() => buildExpenditureView(accounts), [accounts]);
  return <AccountListView rows={rows} label="Expenditure Accounts" />;
}

// ── Exceptions report ──────────────────────────────────────────────────────────
export function ExceptionsReport({ accounts }) {
  const rows = useMemo(() => buildExceptionsReport(accounts), [accounts]);
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 flex items-center gap-2">
        <CheckCircle className="h-4 w-4 text-emerald-600" />
        <p className="text-xs font-semibold text-emerald-800">No exceptions — all accounts are mapped or approved.</p>
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-slate-200 overflow-hidden">
      <div className="bg-red-700 text-white px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          <p className="text-xs font-bold">Exceptions Report ({rows.length} account{rows.length !== 1 ? 's' : ''})</p>
        </div>
        <p className="text-[10px] text-white/70">Unmapped, duplicate, ambiguous, or needs-review</p>
      </div>
      <div className="overflow-x-auto max-h-[500px]">
        <table className="w-full text-xs border-collapse min-w-[700px]">
          <TableHeader cols={['TRIO Account','TRIO Description','New Account #','Department','Fund','Issue','Mapping Type','Notes']} />
          <tbody>
            {rows.map((a, i) => {
              const sc = VALIDATION_STATUS_COLORS[a.validation_status] || VALIDATION_STATUS_COLORS.unmapped;
              return (
                <tr key={i} className="border-t border-slate-100 hover:bg-red-50/20">
                  <td className="px-3 py-1.5 font-mono text-[10px] text-slate-500">{a.trio_account || '—'}</td>
                  <td className="px-3 py-1.5 text-[11px] text-slate-700 max-w-[140px] truncate" title={a.trio_description}>{a.trio_description || '—'}</td>
                  <td className="px-3 py-1.5 font-mono text-[10px] font-semibold">{a.new_account_number || <span className="text-red-500 italic">missing</span>}</td>
                  <td className="px-3 py-1.5 text-[11px] text-slate-600">{a.department || a.trio_department || '—'}</td>
                  <td className="px-3 py-1.5 text-[10px] text-slate-500">{FUND_LABELS[a.fund] || a.fund || '—'}</td>
                  <td className="px-3 py-1.5"><span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${sc.bg} ${sc.text}`}>{a.validation_status?.replace(/_/g,' ')}</span></td>
                  <td className="px-3 py-1.5 text-[10px] text-slate-500">{MAPPING_TYPE_LABELS[a.mapping_type] || '—'}</td>
                  <td className="px-3 py-1.5 text-[10px] text-slate-500 max-w-[150px] truncate" title={a.transition_notes}>{a.transition_notes || a.notes || '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}