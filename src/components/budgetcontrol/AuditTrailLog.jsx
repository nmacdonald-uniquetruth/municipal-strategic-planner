/**
 * AuditTrailLog — Adjustment log: view, add, and filter budget adjustments
 */
import React, { useState } from 'react';
import { Plus, Filter, Download, FileText } from 'lucide-react';

const fmt = n => `$${Math.round(Math.abs(n || 0)).toLocaleString()}`;

const ADJ_TYPES = [
  { value: 'budget_transfer',         label: 'Budget Transfer' },
  { value: 'supplemental_appropriation', label: 'Supplemental Appropriation' },
  { value: 'encumbrance',             label: 'Encumbrance' },
  { value: 'ytd_correction',          label: 'YTD Correction' },
  { value: 'gaap_adjustment',         label: 'GAAP Adjustment' },
  { value: 'projection_update',       label: 'Projection Update' },
  { value: 'revenue_revision',        label: 'Revenue Revision' },
  { value: 'transfer_in',             label: 'Transfer In' },
  { value: 'transfer_out',            label: 'Transfer Out' },
];

const ADJ_COLORS = {
  budget_transfer:           'bg-blue-100 text-blue-700',
  supplemental_appropriation:'bg-purple-100 text-purple-700',
  encumbrance:               'bg-slate-100 text-slate-600',
  ytd_correction:            'bg-amber-100 text-amber-700',
  gaap_adjustment:           'bg-indigo-100 text-indigo-700',
  projection_update:         'bg-teal-100 text-teal-700',
  revenue_revision:          'bg-emerald-100 text-emerald-700',
  transfer_in:               'bg-green-100 text-green-700',
  transfer_out:              'bg-orange-100 text-orange-700',
};

const EMPTY_FORM = { adjustment_type: 'budget_transfer', department_from: '', department_to: '', fund: 'general_fund', article_number: '', amount: '', reason: '', authorized_by: '', field_changed: 'adopted_budget', value_before: '', value_after: '', source_document: '', requires_vote: false };

function AdjustmentForm({ onSubmit, onCancel, departments }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
      <p className="text-xs font-bold text-slate-700">New Budget Adjustment Entry</p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="col-span-2 md:col-span-1">
          <label className="block text-[10px] font-semibold text-slate-600 mb-1">Adjustment Type *</label>
          <select value={form.adjustment_type} onChange={e => set('adjustment_type', e.target.value)}
            className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-400">
            {ADJ_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-slate-600 mb-1">From Department</label>
          <input value={form.department_from} onChange={e => set('department_from', e.target.value)} list="dept-list"
            className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-400" placeholder="e.g. Police" />
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-slate-600 mb-1">To Department</label>
          <input value={form.department_to} onChange={e => set('department_to', e.target.value)} list="dept-list"
            className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-400" placeholder="e.g. Administration" />
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-slate-600 mb-1">Amount *</label>
          <input type="number" value={form.amount} onChange={e => set('amount', e.target.value)}
            className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-400" placeholder="0.00" />
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-slate-600 mb-1">Field Changed</label>
          <select value={form.field_changed} onChange={e => set('field_changed', e.target.value)}
            className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-400">
            {['adopted_budget','revised_budget','ytd_actual','projected_year_end','encumbrances','gaap_adjustment'].map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-slate-600 mb-1">Value Before</label>
          <input type="number" value={form.value_before} onChange={e => set('value_before', e.target.value)}
            className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-400" />
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-slate-600 mb-1">Value After</label>
          <input type="number" value={form.value_after} onChange={e => set('value_after', e.target.value)}
            className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-400" />
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-slate-600 mb-1">Authorized By</label>
          <input value={form.authorized_by} onChange={e => set('authorized_by', e.target.value)}
            className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-400" placeholder="Name or title" />
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-slate-600 mb-1">Source Document</label>
          <input value={form.source_document} onChange={e => set('source_document', e.target.value)}
            className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-400" placeholder="Memo #, resolution, etc." />
        </div>
        <div className="col-span-2 md:col-span-3">
          <label className="block text-[10px] font-semibold text-slate-600 mb-1">Reason / Justification *</label>
          <textarea value={form.reason} onChange={e => set('reason', e.target.value)} rows={2}
            className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-400 resize-none"
            placeholder="Describe the reason for this adjustment..." />
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="needs-vote" checked={form.requires_vote} onChange={e => set('requires_vote', e.target.checked)} className="h-3 w-3" />
          <label htmlFor="needs-vote" className="text-[10px] font-semibold text-slate-600">Requires vote / SB approval</label>
        </div>
      </div>
      <datalist id="dept-list">
        {departments.map(d => <option key={d} value={d} />)}
      </datalist>
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="text-xs px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:border-slate-400">Cancel</button>
        <button onClick={() => { if (!form.amount || !form.reason) return; onSubmit({ ...form, timestamp: new Date().toISOString() }); }}
          className="text-xs px-3 py-1.5 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-700">
          Log Adjustment
        </button>
      </div>
    </div>
  );
}

export default function AuditTrailLog({ logs, onAddLog, departments = [] }) {
  const [showForm, setShowForm] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [filterDept, setFilterDept] = useState('all');

  const handleSubmit = entry => {
    onAddLog(entry);
    setShowForm(false);
  };

  const filtered = logs.filter(l => {
    if (filterType !== 'all' && l.adjustment_type !== filterType) return false;
    if (filterDept !== 'all' && l.department_from !== filterDept && l.department_to !== filterDept) return false;
    return true;
  }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const exportCsv = () => {
    const rows = [['Timestamp','Type','From','To','Field','Before','After','Amount','Reason','Authorized By','Source Doc']];
    filtered.forEach(l => rows.push([l.timestamp, l.adjustment_type, l.department_from, l.department_to, l.field_changed, l.value_before, l.value_after, l.amount, l.reason, l.authorized_by, l.source_document]));
    const csv = rows.map(r => r.map(v => `"${v || ''}"`).join(',')).join('\n');
    const a = document.createElement('a'); a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = 'budget_adjustment_log.csv'; a.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-2 flex-wrap items-center">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          <select value={filterType} onChange={e => setFilterType(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none">
            <option value="all">All Types</option>
            {ADJ_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <select value={filterDept} onChange={e => setFilterDept(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none">
            <option value="all">All Departments</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <span className="text-[10px] text-slate-400">{filtered.length} entries</span>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCsv} className="flex items-center gap-1.5 text-xs border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg hover:border-slate-400">
            <Download className="h-3.5 w-3.5" /> Export
          </button>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 text-xs bg-slate-900 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-slate-700">
            <Plus className="h-3.5 w-3.5" /> Log Adjustment
          </button>
        </div>
      </div>

      {showForm && <AdjustmentForm onSubmit={handleSubmit} onCancel={() => setShowForm(false)} departments={departments} />}

      <div className="rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs" style={{ minWidth: 800 }}>
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="px-3 py-2 text-left text-[9px] font-bold uppercase tracking-wider">Date/Time</th>
                <th className="px-3 py-2 text-left text-[9px] font-bold uppercase tracking-wider">Type</th>
                <th className="px-3 py-2 text-left text-[9px] font-bold uppercase tracking-wider">From / To</th>
                <th className="px-3 py-2 text-right text-[9px] font-bold uppercase tracking-wider">Amount</th>
                <th className="px-3 py-2 text-left text-[9px] font-bold uppercase tracking-wider">Field</th>
                <th className="px-3 py-2 text-left text-[9px] font-bold uppercase tracking-wider">Reason</th>
                <th className="px-3 py-2 text-left text-[9px] font-bold uppercase tracking-wider">Auth By</th>
                <th className="px-3 py-2 text-center text-[9px] font-bold uppercase tracking-wider">Vote?</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l, i) => (
                <tr key={i} className="border-t border-slate-100 hover:bg-slate-50/40">
                  <td className="px-3 py-2 font-mono text-[10px] text-slate-500 whitespace-nowrap">
                    {l.timestamp ? new Date(l.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                  </td>
                  <td className="px-3 py-2">
                    <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${ADJ_COLORS[l.adjustment_type] || 'bg-slate-100 text-slate-600'}`}>
                      {ADJ_TYPES.find(t => t.value === l.adjustment_type)?.label || l.adjustment_type}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-[10px] text-slate-600">
                    {l.department_from && <><span className="font-semibold">{l.department_from}</span></>}
                    {l.department_from && l.department_to && <span className="text-slate-400"> → </span>}
                    {l.department_to && <span className="font-semibold">{l.department_to}</span>}
                    {!l.department_from && !l.department_to && <span className="text-slate-300 italic">—</span>}
                  </td>
                  <td className="px-3 py-2 text-right font-mono font-semibold text-slate-800">{fmt(l.amount)}</td>
                  <td className="px-3 py-2 text-[10px] text-slate-500 font-mono">{l.field_changed || '—'}</td>
                  <td className="px-3 py-2 text-[10px] text-slate-700 max-w-[200px] truncate" title={l.reason}>{l.reason}</td>
                  <td className="px-3 py-2 text-[10px] text-slate-500">{l.authorized_by || '—'}</td>
                  <td className="px-3 py-2 text-center">
                    {l.requires_vote
                      ? <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">Yes</span>
                      : <span className="text-[9px] text-slate-300">—</span>}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-xs text-slate-400">
                  <FileText className="h-6 w-6 text-slate-200 mx-auto mb-2" />
                  No adjustment entries yet. Log a budget transfer, correction, or GAAP adjustment to begin the audit trail.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}