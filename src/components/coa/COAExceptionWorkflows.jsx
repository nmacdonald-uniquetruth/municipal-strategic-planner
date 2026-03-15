/**
 * COAExceptionWorkflows — Exception management with workflow actions.
 *
 * Exception types:
 *  - unmapped: TRIO account with no new account number
 *  - duplicate: same new account number used by multiple TRIO accounts (only valid for many_to_one)
 *  - ambiguous: mapping_type=ambiguous or needs human decision
 *  - inactive_referenced: status=inactive but still in budget/warrant references
 *  - needs_review: explicitly flagged for review
 */
import React, { useState, useMemo } from 'react';
import { AlertTriangle, CheckCircle, Link, Copy, HelpCircle, EyeOff, ChevronDown, ChevronUp, Filter } from 'lucide-react';
import { buildExceptionsReport } from './coaEngine';
import { VALIDATION_STATUS_COLORS } from './coaEngine';

const EXCEPTION_TYPES = [
  { id: 'all',                label: 'All Exceptions',          icon: AlertTriangle,  color: 'text-slate-600' },
  { id: 'unmapped',           label: 'Unmapped Accounts',       icon: Link,           color: 'text-red-600' },
  { id: 'duplicate',          label: 'Duplicate Assignments',   icon: Copy,           color: 'text-orange-600' },
  { id: 'ambiguous',          label: 'Ambiguous Mappings',      icon: HelpCircle,     color: 'text-amber-600' },
  { id: 'needs_review',       label: 'Needs Review',            icon: AlertTriangle,  color: 'text-blue-600' },
  { id: 'inactive_referenced',label: 'Inactive But Referenced', icon: EyeOff,         color: 'text-slate-500' },
];

const ACTIONS = {
  unmapped:            ['Mark as New Account', 'Assign to Existing', 'Mark Inactive', 'Flag for Finance Review'],
  duplicate:           ['Confirm Many-to-One', 'Split to Separate Accounts', 'Merge Source Accounts'],
  ambiguous:           ['Confirm Current Mapping', 'Reassign Account', 'Flag for Finance Review'],
  needs_review:        ['Approve Mapping', 'Request Correction', 'Escalate to Manager'],
  inactive_referenced: ['Reactivate Account', 'Remap References', 'Archive with Note'],
};

// Detect inactive-but-referenced accounts (not in coaEngine, we compute locally)
function findInactiveReferenced(accounts) {
  const inactiveNums = new Set(
    accounts.filter(a => a.status === 'inactive').map(a => a.new_account_number).filter(Boolean)
  );
  // Any other account referencing these via mapping_group_key or budget_article_mapping
  return accounts.filter(a =>
    a.status === 'inactive' && a.new_account_number &&
    (a.budget_article_mapping || a.mapping_group_key) // referenced in some mapping
  );
}

function severityBadge(type) {
  if (type === 'unmapped' || type === 'duplicate') return { label: 'Error', cls: 'bg-red-100 text-red-700' };
  if (type === 'ambiguous' || type === 'inactive_referenced') return { label: 'Warning', cls: 'bg-amber-100 text-amber-700' };
  return { label: 'Review', cls: 'bg-blue-100 text-blue-700' };
}

function ExceptionRow({ account, exType, onAction }) {
  const [expanded, setExpanded] = useState(false);
  const [selectedAction, setSelectedAction] = useState('');
  const [note, setNote] = useState('');
  const colors = VALIDATION_STATUS_COLORS[account.validation_status] || VALIDATION_STATUS_COLORS.needs_review;
  const sev = severityBadge(exType);
  const actions = ACTIONS[exType] || ACTIONS.needs_review;

  return (
    <div className={`rounded-xl border overflow-hidden ${colors.border}`}>
      <div className="flex items-start gap-3 px-4 py-2.5 cursor-pointer" onClick={() => setExpanded(v => !v)}>
        <AlertTriangle className={`h-3.5 w-3.5 flex-shrink-0 mt-0.5 ${colors.text}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-xs font-semibold text-slate-800">
              {account.new_account_number || '(no new #)'} — {account.new_account_title || account.trio_description || 'Unknown'}
            </p>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${sev.cls}`}>{sev.label}</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">
            TRIO: {account.trio_account || '—'} · {account.trio_department || '—'} · {account.fund || '—'}
            {account.trio_historical_budget > 0 && ` · Prior budget: $${account.trio_historical_budget.toLocaleString()}`}
          </p>
          {account.transition_notes && <p className="text-[10px] text-slate-400 italic mt-0.5">{account.transition_notes}</p>}
        </div>
        {expanded ? <ChevronUp className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />}
      </div>

      {expanded && (
        <div className={`px-4 pb-3 border-t ${colors.border} ${colors.bg} space-y-2.5`}>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1 text-[10px] text-slate-600 pt-2">
            <span><strong>Mapping type:</strong> {account.mapping_type || '—'}</span>
            <span><strong>Validation status:</strong> {account.validation_status || '—'}</span>
            <span><strong>Fund type:</strong> {account.fund_type || '—'}</span>
            <span><strong>Account type:</strong> {account.account_type || '—'}</span>
            <span><strong>Article mapping:</strong> {account.budget_article_mapping || '—'}</span>
            <span><strong>BETE/Dept:</strong> {account.department || '—'}</span>
          </div>

          {/* Workflow action selector */}
          <div className="space-y-2 pt-1">
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Resolution Actions</p>
            <div className="flex flex-wrap gap-1.5">
              {actions.map(action => (
                <button key={action}
                  onClick={() => setSelectedAction(action)}
                  className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${selectedAction === action ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}>
                  {action}
                </button>
              ))}
            </div>
            {selectedAction && (
              <div className="flex gap-2 items-start">
                <textarea value={note} onChange={e => setNote(e.target.value)}
                  rows={2} placeholder="Add resolution note (optional)…"
                  className="flex-1 text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-slate-400" />
                <button onClick={() => { onAction(account, selectedAction, note); setSelectedAction(''); setNote(''); }}
                  className="text-xs bg-slate-900 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-slate-700 transition-colors whitespace-nowrap">
                  <CheckCircle className="h-3.5 w-3.5 inline mr-1" />Apply
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function COAExceptionWorkflows({ accounts, onResolve }) {
  const [filter, setFilter] = useState('all');

  const exceptions = useMemo(() => {
    const base = buildExceptionsReport(accounts);
    const inactive = findInactiveReferenced(accounts);
    const inactiveIds = new Set(inactive.map(a => a.id));
    const all = [...base];
    inactive.forEach(a => { if (!inactiveIds.has(a.id) || !all.find(x => x.id === a.id)) all.push({ ...a, _exType: 'inactive_referenced' }); });
    return all;
  }, [accounts]);

  const getExType = (a) => {
    if (a._exType) return a._exType;
    if (a.validation_status === 'unmapped' || !a.new_account_number?.trim()) return 'unmapped';
    if (a.validation_status === 'duplicate') return 'duplicate';
    if (a.validation_status === 'ambiguous') return 'ambiguous';
    return 'needs_review';
  };

  const filtered = filter === 'all' ? exceptions : exceptions.filter(a => getExType(a) === filter);

  const counts = useMemo(() => {
    const c = {};
    exceptions.forEach(a => { const t = getExType(a); c[t] = (c[t] || 0) + 1; });
    return c;
  }, [exceptions]);

  return (
    <div className="space-y-4">
      {/* Summary row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {EXCEPTION_TYPES.slice(1).map(t => (
          <button key={t.id} onClick={() => setFilter(t.id)}
            className={`rounded-xl border p-3 text-left transition-all ${filter === t.id ? 'border-slate-900 bg-slate-900' : 'border-slate-200 bg-white hover:border-slate-400'}`}>
            <p className={`text-sm font-bold ${filter === t.id ? 'text-white' : counts[t.id] > 0 ? t.color : 'text-slate-300'}`}>{counts[t.id] || 0}</p>
            <p className={`text-[9px] font-medium mt-0.5 ${filter === t.id ? 'text-white/70' : 'text-slate-500'}`}>{t.label}</p>
          </button>
        ))}
      </div>

      {/* Filter strip */}
      <div className="flex gap-1.5 flex-wrap items-center">
        <Filter className="h-3.5 w-3.5 text-slate-400" />
        {EXCEPTION_TYPES.map(t => (
          <button key={t.id} onClick={() => setFilter(t.id)}
            className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${filter === t.id ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:text-slate-700 hover:border-slate-400'}`}>
            {t.label} {t.id !== 'all' && counts[t.id] ? `(${counts[t.id]})` : ''}
          </button>
        ))}
      </div>

      {/* Exception list */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50 px-6 py-8 text-center">
          <CheckCircle className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
          <p className="text-xs font-semibold text-emerald-700">No exceptions in this category.</p>
          <p className="text-[10px] text-emerald-500 mt-1">All accounts in this filter are properly mapped and active.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((a, i) => (
            <ExceptionRow key={a.id || i} account={a} exType={getExType(a)} onAction={onResolve} />
          ))}
        </div>
      )}
    </div>
  );
}