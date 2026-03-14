import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Wrench, Plus, Trash2 } from 'lucide-react';
import { FUND_LABELS, DEFAULT_DEPT_BUDGETS } from './financialSimEngine';

const fmt = n => n ? `$${Math.round(n).toLocaleString()}` : '—';

const STATUS_STYLES = {
  planned:     'bg-slate-100 text-slate-700',
  approved:    'bg-blue-100 text-blue-800',
  in_progress: 'bg-amber-100 text-amber-800',
  completed:   'bg-emerald-100 text-emerald-800',
};

const BLANK = { project_name: '', department: DEFAULT_DEPT_BUDGETS[0].department_name, project_cost: 0, timeline_years: 1, funding_source: 'general_fund', status: 'planned', description: '', annual_operating_impact: 0 };

export default function CapitalPlanTable({ projects, onRefresh }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);

  const totalCost = projects.reduce((s, p) => s + (p.project_cost || 0), 0);
  const totalImpact = projects.reduce((s, p) => s + (p.annual_operating_impact || 0), 0);

  async function handleAdd() {
    if (!form.project_name) return;
    setSaving(true);
    await base44.entities.CapitalProject.create(form);
    setForm(BLANK);
    setAdding(false);
    setSaving(false);
    onRefresh();
  }

  async function handleDelete(id) {
    await base44.entities.CapitalProject.delete(id);
    onRefresh();
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900">
            <Wrench className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Capital Planning</h3>
            <p className="text-xs text-slate-500">{projects.length} projects · Total: {fmt(totalCost)}</p>
          </div>
        </div>
        <button onClick={() => setAdding(a => !a)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 text-white hover:bg-slate-700 transition-colors">
          <Plus className="h-3 w-3" /> Add Project
        </button>
      </div>

      {adding && (
        <div className="mb-4 rounded-xl border border-slate-300 bg-slate-50 p-4 grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { key: 'project_name', label: 'Project Name', type: 'text' },
            { key: 'project_cost', label: 'Cost ($)', type: 'number' },
            { key: 'timeline_years', label: 'Years', type: 'number' },
            { key: 'annual_operating_impact', label: 'Annual Operating Impact ($)', type: 'number' },
          ].map(f => (
            <div key={f.key}>
              <label className="text-[10px] text-slate-500 block mb-1">{f.label}</label>
              <input type={f.type} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none" />
            </div>
          ))}
          <div>
            <label className="text-[10px] text-slate-500 block mb-1">Department</label>
            <select value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))}
              className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none">
              {DEFAULT_DEPT_BUDGETS.map(d => <option key={d.department_key}>{d.department_name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-slate-500 block mb-1">Funding Source</label>
            <select value={form.funding_source} onChange={e => setForm(p => ({ ...p, funding_source: e.target.value }))}
              className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none">
              {['general_fund','enterprise_fund','bond','grant','reserve_fund'].map(f => <option key={f} value={f}>{FUND_LABELS[f] || f}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-slate-500 block mb-1">Status</label>
            <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
              className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none">
              {['planned','approved','in_progress','completed'].map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
            </select>
          </div>
          <div className="col-span-full flex gap-2 mt-1">
            <button onClick={handleAdd} disabled={saving}
              className="px-4 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-700 transition-colors">
              {saving ? 'Saving…' : 'Save Project'}
            </button>
            <button onClick={() => setAdding(false)} className="px-4 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-slate-50">Cancel</button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-900 text-white">
              {['Project', 'Department', 'Cost', 'Years', 'Funding', 'Status', 'Annual Impact', ''].map((h, i) => (
                <th key={i} className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {projects.map((p, i) => (
              <tr key={p.id || i} className={i % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
                <td className="px-3 py-2 font-medium text-slate-800">{p.project_name}</td>
                <td className="px-3 py-2 text-slate-600">{p.department}</td>
                <td className="px-3 py-2 font-mono text-slate-800">{fmt(p.project_cost)}</td>
                <td className="px-3 py-2 text-slate-600">{p.timeline_years}yr</td>
                <td className="px-3 py-2 text-slate-600">{(FUND_LABELS[p.funding_source] || p.funding_source || '').replace('_',' ')}</td>
                <td className="px-3 py-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLES[p.status] || 'bg-slate-100 text-slate-600'}`}>
                    {(p.status || '').replace('_',' ')}
                  </span>
                </td>
                <td className={`px-3 py-2 font-mono ${(p.annual_operating_impact || 0) < 0 ? 'text-emerald-700' : (p.annual_operating_impact || 0) > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                  {p.annual_operating_impact ? `${p.annual_operating_impact > 0 ? '+' : ''}${fmt(p.annual_operating_impact)}/yr` : '—'}
                </td>
                <td className="px-3 py-2">
                  <button onClick={() => handleDelete(p.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-300 bg-slate-100 font-bold">
              <td className="px-3 py-2 text-slate-800" colSpan={2}>Total</td>
              <td className="px-3 py-2 font-mono text-slate-900">{fmt(totalCost)}</td>
              <td colSpan={3} />
              <td className={`px-3 py-2 font-mono ${totalImpact < 0 ? 'text-emerald-700' : totalImpact > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                {totalImpact ? `${totalImpact > 0 ? '+' : ''}${fmt(totalImpact)}/yr` : '—'}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}