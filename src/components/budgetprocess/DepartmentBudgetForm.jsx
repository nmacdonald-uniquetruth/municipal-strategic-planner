/**
 * DepartmentBudgetForm — create/edit a single department budget record
 * Now driven by approved COA accounts
 */
import React, { useState } from 'react';
import { JUSTIFICATION_TAGS, FUND_LABELS, BETE_FIELDS, getColumnLabel } from './budgetProcessEngine';
import TraceabilityPanel from '../budget/TraceabilityPanel';

const inputCls = "w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-400 bg-white";
const textareaCls = `${inputCls} resize-none`;

function Field({ label, children, sub }) {
  return (
    <div>
      <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</label>
      {sub && <p className="text-[9px] text-slate-400 mb-1">{sub}</p>}
      {children}
    </div>
  );
}

function NumField({ label, value, onChange, sub }) {
  return (
    <Field label={label} sub={sub}>
      <div className="relative">
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">$</span>
        <input type="number" min={0} value={value || ''} onChange={e => onChange(parseFloat(e.target.value) || 0)}
          className="w-full pl-5 pr-2 py-1.5 text-xs font-mono rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 text-right" />
      </div>
    </Field>
  );
}

const FUNDS = Object.keys(FUND_LABELS);
const EMPTY = {
  department: '', fund: 'general_fund', fund_type: 'governmental',
  article_number: '', bete_mapping: '', sort_order: 0,
  prior_year_budget: 0, prior_year_actual: 0, current_year_budget: 0,
  ytd_actual: 0, projected_year_end: 0, dept_request: 0,
  finance_recommendation: 0, manager_recommendation: 0,
  budget_committee_recommendation: 0, select_board_recommendation: 0,
  adopted_budget: 0, revised_budget: 0, carryforward_amount: 0, enterprise_transfer: 0,
  justification_tags: [], justification_narrative: '',
  manager_notes: '', budget_committee_notes: '', select_board_notes: '',
  manager_approved: false, budget_committee_approved: false, select_board_approved: false,
};

export default function DepartmentBudgetForm({ dept, fiscalYear, onSave, onCancel }) {
  const [form, setForm] = useState(dept ? { ...EMPTY, ...dept } : { ...EMPTY, fiscal_year: fiscalYear || 'FY2027' });

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const setN = k => v => setForm(p => ({ ...p, [k]: v }));
  const setB = k => v => setForm(p => ({ ...p, [k]: v }));

  const toggleTag = tag => {
    setForm(p => ({
      ...p,
      justification_tags: p.justification_tags?.includes(tag)
        ? p.justification_tags.filter(t => t !== tag)
        : [...(p.justification_tags || []), tag]
    }));
  };

  return (
    <div className="space-y-5">
      {/* Identity */}
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 pb-1 border-b border-slate-100">Department Identity</p>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Department Name *"><input value={form.department} onChange={set('department')} placeholder="e.g. Police" className={inputCls} /></Field>
          <Field label="Fund *">
            <select value={form.fund} onChange={set('fund')} className={inputCls}>
              {FUNDS.map(f => <option key={f} value={f}>{FUND_LABELS[f]}</option>)}
            </select>
          </Field>
          <Field label="Fund Type">
            <select value={form.fund_type} onChange={set('fund_type')} className={inputCls}>
              <option value="governmental">Governmental</option>
              <option value="enterprise">Enterprise</option>
              <option value="special_revenue">Special Revenue</option>
              <option value="debt_service">Debt Service</option>
            </select>
          </Field>
          <Field label="Warrant Article"><input value={form.article_number || ''} onChange={set('article_number')} placeholder="Article 4" className={inputCls} /></Field>
          <Field label="BETE Mapping">
            <select value={form.bete_mapping || ''} onChange={set('bete_mapping')} className={inputCls}>
              <option value="">— None —</option>
              {BETE_FIELDS.map(b => <option key={b.key} value={b.key}>{b.label}</option>)}
            </select>
          </Field>
          <Field label="Sort Order"><input type="number" value={form.sort_order || 0} onChange={e => setN('sort_order')(parseInt(e.target.value) || 0)} className={inputCls} /></Field>
        </div>
      </div>

      {/* Historical / current */}
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 pb-1 border-b border-slate-100">Historical & Current Year</p>
        <div className="grid grid-cols-3 gap-3">
          <NumField label="Prior Year Budget" value={form.prior_year_budget} onChange={setN('prior_year_budget')} />
          <NumField label="Prior Year Actual" value={form.prior_year_actual} onChange={setN('prior_year_actual')} />
          <NumField label="Current Year Budget" value={form.current_year_budget} onChange={setN('current_year_budget')} />
          <NumField label="YTD Actual" value={form.ytd_actual} onChange={setN('ytd_actual')} />
          <NumField label="Projected Year-End" value={form.projected_year_end} onChange={setN('projected_year_end')} />
          <NumField label="Carryforward Amount" value={form.carryforward_amount} onChange={setN('carryforward_amount')} sub="Prior year unexpended" />
        </div>
      </div>

      {/* Budget progression */}
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 pb-1 border-b border-slate-100">Budget Progression</p>
        <div className="grid grid-cols-3 gap-3">
          <NumField label="Dept Request" value={form.dept_request} onChange={setN('dept_request')} />
          <NumField label="Finance Recommendation" value={form.finance_recommendation} onChange={setN('finance_recommendation')} />
          <NumField label="Manager Recommendation" value={form.manager_recommendation} onChange={setN('manager_recommendation')} />
          <NumField label="Budget Committee Rec" value={form.budget_committee_recommendation} onChange={setN('budget_committee_recommendation')} />
          <NumField label="Select Board Rec" value={form.select_board_recommendation} onChange={setN('select_board_recommendation')} />
          <NumField label="Adopted Budget" value={form.adopted_budget} onChange={setN('adopted_budget')} />
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <NumField label="Revised Budget" value={form.revised_budget} onChange={setN('revised_budget')} sub="Post-adoption revisions" />
          <NumField label="Enterprise Transfer" value={form.enterprise_transfer} onChange={setN('enterprise_transfer')} sub="Enterprise fund offset contribution" />
        </div>
      </div>

      {/* Approvals */}
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 pb-1 border-b border-slate-100">Approvals</p>
        <div className="flex gap-4">
          {[['manager_approved','Manager'],['budget_committee_approved','Budget Committee'],['select_board_approved','Select Board']].map(([k, l]) => (
            <label key={k} className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={form[k]} onChange={e => setB(k)(e.target.checked)} className="rounded border-slate-300" />
              <span className="text-xs font-medium text-slate-700">{l}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Justification */}
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 pb-1 border-b border-slate-100">Justification</p>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {Object.entries(JUSTIFICATION_TAGS).map(([k, v]) => (
            <button key={k} type="button"
              onClick={() => toggleTag(k)}
              className={`text-[9px] font-semibold px-2 py-1 rounded-full border transition-colors ${form.justification_tags?.includes(k) ? v.color + ' border-current' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-400'}`}>
              {v.label}
            </button>
          ))}
        </div>
        <Field label="Justification Narrative">
          <textarea rows={3} value={form.justification_narrative || ''} onChange={set('justification_narrative')} className={textareaCls} placeholder="Explain requested changes, mandates, service impacts…" />
        </Field>
      </div>

      {/* Review notes */}
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 pb-1 border-b border-slate-100">Review Notes</p>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Manager Notes"><textarea rows={2} value={form.manager_notes || ''} onChange={set('manager_notes')} className={textareaCls} /></Field>
          <Field label="Budget Committee Notes"><textarea rows={2} value={form.budget_committee_notes || ''} onChange={set('budget_committee_notes')} className={textareaCls} /></Field>
          <Field label="Select Board Notes"><textarea rows={2} value={form.select_board_notes || ''} onChange={set('select_board_notes')} className={textareaCls} /></Field>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
        <button onClick={onCancel} className="text-xs text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-400 transition-colors">Cancel</button>
        <button onClick={() => onSave(form)} className="text-xs bg-slate-900 text-white px-4 py-1.5 rounded-lg font-semibold hover:bg-slate-700 transition-colors">Save Department</button>
      </div>
    </div>
  );
}