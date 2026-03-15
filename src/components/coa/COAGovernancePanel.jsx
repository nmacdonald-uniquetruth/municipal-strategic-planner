/**
 * COAGovernancePanel — Version control, approval workflow, and governance
 * for the Chart of Accounts crosswalk.
 *
 * Features:
 * - List crosswalk versions with status (draft → under_review → approved → superseded)
 * - Create new draft versions
 * - Approve / mark-for-review / supersede
 * - Show source file, upload date, account counts
 * - Active version indicator
 */
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, Clock, Archive, FileText, Plus, Shield, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

const STATUS_CONFIG = {
  draft:        { label: 'Draft',        color: 'text-slate-600',   bg: 'bg-slate-100',   border: 'border-slate-200',  icon: FileText },
  under_review: { label: 'Under Review', color: 'text-blue-700',    bg: 'bg-blue-50',     border: 'border-blue-200',   icon: Clock },
  approved:     { label: 'Approved',     color: 'text-emerald-700', bg: 'bg-emerald-50',  border: 'border-emerald-200',icon: CheckCircle },
  superseded:   { label: 'Superseded',   color: 'text-amber-700',   bg: 'bg-amber-50',    border: 'border-amber-200',  icon: Archive },
  archived:     { label: 'Archived',     color: 'text-slate-400',   bg: 'bg-slate-50',    border: 'border-slate-200',  icon: Archive },
};

const WORKFLOW = {
  draft:        ['under_review', 'archived'],
  under_review: ['approved', 'draft'],
  approved:     ['superseded'],
  superseded:   ['archived'],
  archived:     [],
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
      <Icon className="h-2.5 w-2.5" />{cfg.label}
    </span>
  );
}

function NewVersionForm({ onSave, onCancel }) {
  const [form, setForm] = useState({ version_label: '', fiscal_year: 'FY2027', notes: '' });
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
      <p className="text-xs font-bold text-slate-700">Create New Crosswalk Version</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Version Label *</label>
          <input value={form.version_label} onChange={e => setForm(f => ({ ...f, version_label: e.target.value }))}
            placeholder="e.g. v1.0-draft" className="mt-1 w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-400" />
        </div>
        <div>
          <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Fiscal Year</label>
          <select value={form.fiscal_year} onChange={e => setForm(f => ({ ...f, fiscal_year: e.target.value }))}
            className="mt-1 w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none">
            {['FY2026','FY2027','FY2028','FY2029'].map(fy => <option key={fy}>{fy}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Notes</label>
        <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          rows={2} className="mt-1 w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none resize-none" />
      </div>
      <div className="flex gap-2">
        <button onClick={() => onSave(form)} disabled={!form.version_label.trim()}
          className="text-xs bg-slate-900 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-slate-700 transition-colors disabled:opacity-40">
          Create Version
        </button>
        <button onClick={onCancel} className="text-xs text-slate-500 px-3 py-1.5 rounded-lg hover:bg-slate-100">Cancel</button>
      </div>
    </div>
  );
}

export default function COAGovernancePanel({ accounts, onLogEvent }) {
  const queryClient = useQueryClient();
  const [showNewForm, setShowNewForm] = useState(false);
  const [expanded, setExpanded] = useState(null);

  const { data: versions = [] } = useQuery({
    queryKey: ['coa_versions'],
    queryFn: () => base44.entities.COACrosswalkVersion.list('-created_date', 50),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: data => base44.entities.COACrosswalkVersion.create(data),
    onSuccess: () => queryClient.invalidateQueries(['coa_versions']),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.COACrosswalkVersion.update(id, data),
    onSuccess: () => queryClient.invalidateQueries(['coa_versions']),
  });

  // Derive stats from current accounts for attaching to new version
  const stats = {
    account_count:   accounts.length,
    mapped_count:    accounts.filter(a => ['mapped','approved'].includes(a.validation_status)).length,
    unmapped_count:  accounts.filter(a => a.validation_status === 'unmapped' || !a.new_account_number?.trim()).length,
    exception_count: accounts.filter(a => ['duplicate','ambiguous','needs_review'].includes(a.validation_status)).length,
  };

  const handleCreate = async (form) => {
    const now = new Date().toISOString();
    await createMutation.mutateAsync({ ...form, ...stats, upload_date: now, is_active: false, status: 'draft' });
    onLogEvent?.({ event_type: 'version_created', description: `Version "${form.version_label}" created for ${form.fiscal_year}` });
    setShowNewForm(false);
  };

  const handleTransition = async (version, newStatus) => {
    const updates = { status: newStatus };
    if (newStatus === 'approved') {
      updates.approved_date = new Date().toISOString();
      updates.is_active = true;
      // Supersede other active approved versions
      for (const v of versions.filter(v => v.id !== version.id && v.is_active)) {
        await updateMutation.mutateAsync({ id: v.id, data: { is_active: false, status: 'superseded' } });
      }
    }
    await updateMutation.mutateAsync({ id: version.id, data: updates });
    onLogEvent?.({ event_type: newStatus === 'approved' ? 'version_approved' : newStatus === 'superseded' ? 'version_superseded' : 'status_changed', description: `Version "${version.version_label}" → ${newStatus}` });
  };

  return (
    <div className="space-y-4">
      {/* Governance overview */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-slate-700" />
            <p className="text-xs font-bold text-slate-900">Crosswalk Governance</p>
          </div>
          <button onClick={() => setShowNewForm(v => !v)}
            className="flex items-center gap-1.5 text-xs font-semibold bg-slate-900 text-white px-3 py-1.5 rounded-lg hover:bg-slate-700 transition-colors">
            <Plus className="h-3.5 w-3.5" /> New Version
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {[
            { label: 'Total Versions', value: versions.length },
            { label: 'Active Version', value: versions.find(v => v.is_active)?.version_label || 'None', highlight: true },
            { label: 'Draft Versions', value: versions.filter(v => v.status === 'draft').length },
            { label: 'Approved Versions', value: versions.filter(v => v.status === 'approved').length },
          ].map(s => (
            <div key={s.label} className={`rounded-lg px-3 py-2 ${s.highlight ? 'bg-emerald-50 border border-emerald-200' : 'bg-slate-50'}`}>
              <p className={`text-sm font-bold ${s.highlight ? 'text-emerald-800' : 'text-slate-900'}`}>{s.value}</p>
              <p className="text-[9px] text-slate-500 uppercase tracking-wider mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Deletion protection notice */}
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 flex items-start gap-2">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-[10px] text-amber-800">
            <strong>Deletion Protection:</strong> Accounts referenced in historical reporting, active budget worksheets, or warrant articles cannot be deleted. They must be marked inactive instead. Approved crosswalk versions are immutable.
          </p>
        </div>
      </div>

      {showNewForm && <NewVersionForm onSave={handleCreate} onCancel={() => setShowNewForm(false)} />}

      {/* Version list */}
      {versions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 px-6 py-8 text-center">
          <p className="text-xs text-slate-400">No crosswalk versions yet. Create the first version to begin the governance workflow.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {versions.map(v => {
            const cfg = STATUS_CONFIG[v.status] || STATUS_CONFIG.draft;
            const transitions = WORKFLOW[v.status] || [];
            const isExpanded = expanded === v.id;
            return (
              <div key={v.id} className={`rounded-xl border overflow-hidden ${v.is_active ? 'border-emerald-300' : 'border-slate-200'} bg-white`}>
                <div className="flex items-center gap-3 px-4 py-3 cursor-pointer" onClick={() => setExpanded(isExpanded ? null : v.id)}>
                  {v.is_active && <div className="h-2 w-2 rounded-full bg-emerald-500 flex-shrink-0" title="Active version" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs font-bold text-slate-900">{v.version_label}</p>
                      <StatusBadge status={v.status} />
                      <span className="text-[9px] text-slate-400">{v.fiscal_year}</span>
                      {v.is_active && <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">Active</span>}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {v.account_count || 0} accounts · {v.mapped_count || 0} mapped · {v.unmapped_count || 0} unmapped
                      {v.upload_date && ` · Uploaded ${new Date(v.upload_date).toLocaleDateString()}`}
                      {v.source_file_name && ` · ${v.source_file_name}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {transitions.map(next => (
                      <button key={next} onClick={e => { e.stopPropagation(); handleTransition(v, next); }}
                        className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${next === 'approved' ? 'border-emerald-300 text-emerald-700 hover:bg-emerald-50' : next === 'under_review' ? 'border-blue-200 text-blue-700 hover:bg-blue-50' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                        → {STATUS_CONFIG[next]?.label || next}
                      </button>
                    ))}
                    {isExpanded ? <ChevronUp className="h-3.5 w-3.5 text-slate-400" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-400" />}
                  </div>
                </div>
                {isExpanded && (
                  <div className="px-4 pb-3 border-t border-slate-100 pt-3 text-[10px] text-slate-500 space-y-1">
                    {v.source_file_url && <p><strong>Source:</strong> <a href={v.source_file_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{v.source_file_name || v.source_file_url}</a></p>}
                    {v.approved_by   && <p><strong>Approved by:</strong> {v.approved_by} on {v.approved_date ? new Date(v.approved_date).toLocaleDateString() : '—'}</p>}
                    {v.review_notes  && <p><strong>Review notes:</strong> {v.review_notes}</p>}
                    {v.notes         && <p><strong>Notes:</strong> {v.notes}</p>}
                    <div className="flex gap-4 pt-1">
                      <span><strong>Mapped:</strong> {v.mapped_count}</span>
                      <span><strong>Unmapped:</strong> {v.unmapped_count}</span>
                      <span><strong>Exceptions:</strong> {v.exception_count}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}