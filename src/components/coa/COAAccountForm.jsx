/**
 * COAAccountForm — Create / edit a single COA crosswalk record
 */
import React, { useState } from 'react';
import {
  FUND_LABELS, ACCOUNT_TYPE_LABELS, MAPPING_TYPE_LABELS,
  REPORTING_CATEGORY_LABELS
} from './coaEngine';

const ACCOUNT_TYPES   = Object.keys(ACCOUNT_TYPE_LABELS);
const FUNDS           = Object.keys(FUND_LABELS);
const FUND_TYPES      = ['governmental','enterprise','internal_service','fiduciary','capital_projects'];
const MAPPING_TYPES   = Object.keys(MAPPING_TYPE_LABELS);
const REPORTING_CATS  = Object.keys(REPORTING_CATEGORY_LABELS);
const VALIDATION_STATUSES = ['mapped','unmapped','duplicate','ambiguous','needs_review','approved'];
const STATUSES        = ['active','inactive','deprecated','pending'];
const GASB34          = ['governmental_activities','business_type_activities','component_unit','fiduciary'];

const inputCls = "w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-400 bg-white";
const textareaCls = `${inputCls} resize-none`;

function Field({ label, children, sub, half }) {
  return (
    <div className={half ? '' : ''}>
      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</label>
      {sub && <p className="text-[9px] text-slate-400 mb-1">{sub}</p>}
      {children}
    </div>
  );
}

const EMPTY = {
  trio_account: '', trio_department: '', trio_object_code: '', trio_description: '',
  trio_historical_budget: '', trio_historical_actual: '',
  new_account_number: '', new_account_title: '', new_account_description: '',
  account_type: 'expenditure', fund: 'general_fund', fund_type: 'governmental',
  function_program: '', department: '', natural_account: '', reporting_category: 'other',
  budget_article_mapping: '', gasb_34_class: 'governmental_activities',
  mapping_type: 'one_to_one', mapping_split_percent: 100, mapping_group_key: '',
  validation_status: 'unmapped', status: 'active', fiscal_year_effective: 'FY2027',
  transition_notes: '', reviewed_by: '', review_date: '', erp_target_module: '', notes: '',
};

export default function COAAccountForm({ account, onSave, onCancel }) {
  const [form, setForm] = useState(account ? { ...EMPTY, ...account } : EMPTY);
  const set  = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const setN = k => e => setForm(p => ({ ...p, [k]: parseFloat(e.target.value) || 0 }));

  return (
    <div className="space-y-5">
      {/* Section: TRIO (Legacy) */}
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 pb-1 border-b border-slate-100">Legacy TRIO Account</p>
        <div className="grid grid-cols-3 gap-3">
          <Field label="TRIO Account #"><input value={form.trio_account} onChange={set('trio_account')} placeholder="e.g. 01-001-5100" className={inputCls} /></Field>
          <Field label="TRIO Department"><input value={form.trio_department} onChange={set('trio_department')} className={inputCls} /></Field>
          <Field label="Object Code"><input value={form.trio_object_code} onChange={set('trio_object_code')} className={inputCls} /></Field>
        </div>
        <div className="mt-3">
          <Field label="TRIO Description"><input value={form.trio_description} onChange={set('trio_description')} className={inputCls} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <Field label="Prior Year Budget ($)"><input type="number" value={form.trio_historical_budget} onChange={setN('trio_historical_budget')} className={`${inputCls} text-right font-mono`} /></Field>
          <Field label="Prior Year Actual ($)"><input type="number" value={form.trio_historical_actual} onChange={setN('trio_historical_actual')} className={`${inputCls} text-right font-mono`} /></Field>
        </div>
      </div>

      {/* Section: New Account */}
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 pb-1 border-b border-slate-100">New Chart of Accounts</p>
        <div className="grid grid-cols-3 gap-3">
          <Field label="New Account Number *"><input value={form.new_account_number} onChange={set('new_account_number')} placeholder="e.g. 01-110-51100" className={inputCls} /></Field>
          <Field label="New Account Title *"><input value={form.new_account_title} onChange={set('new_account_title')} className={inputCls} /></Field>
          <Field label="Fiscal Year Effective">
            <select value={form.fiscal_year_effective} onChange={set('fiscal_year_effective')} className={inputCls}>
              {['FY2025','FY2026','FY2027','FY2028','FY2029'].map(y => <option key={y}>{y}</option>)}
            </select>
          </Field>
        </div>
        <div className="mt-3">
          <Field label="New Account Description"><input value={form.new_account_description} onChange={set('new_account_description')} className={inputCls} /></Field>
        </div>
      </div>

      {/* Section: Classification */}
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 pb-1 border-b border-slate-100">Classification</p>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Account Type *">
            <select value={form.account_type} onChange={set('account_type')} className={inputCls}>
              {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{ACCOUNT_TYPE_LABELS[t]}</option>)}
            </select>
          </Field>
          <Field label="Fund *">
            <select value={form.fund} onChange={set('fund')} className={inputCls}>
              {FUNDS.map(f => <option key={f} value={f}>{FUND_LABELS[f]}</option>)}
            </select>
          </Field>
          <Field label="Fund Type">
            <select value={form.fund_type} onChange={set('fund_type')} className={inputCls}>
              {FUND_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g,' ')}</option>)}
            </select>
          </Field>
          <Field label="Department"><input value={form.department} onChange={set('department')} className={inputCls} /></Field>
          <Field label="Function / Program"><input value={form.function_program} onChange={set('function_program')} className={inputCls} /></Field>
          <Field label="Natural Account"><input value={form.natural_account} onChange={set('natural_account')} placeholder="e.g. Salaries" className={inputCls} /></Field>
          <Field label="Reporting Category">
            <select value={form.reporting_category} onChange={set('reporting_category')} className={inputCls}>
              {REPORTING_CATS.map(c => <option key={c} value={c}>{REPORTING_CATEGORY_LABELS[c]}</option>)}
            </select>
          </Field>
          <Field label="GASB 34 Class">
            <select value={form.gasb_34_class} onChange={set('gasb_34_class')} className={inputCls}>
              {GASB34.map(g => <option key={g} value={g}>{g.replace(/_/g,' ')}</option>)}
            </select>
          </Field>
          <Field label="Budget Article Mapping"><input value={form.budget_article_mapping} onChange={set('budget_article_mapping')} placeholder="Article 4" className={inputCls} /></Field>
        </div>
      </div>

      {/* Section: Mapping */}
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 pb-1 border-b border-slate-100">Crosswalk Mapping</p>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Mapping Type">
            <select value={form.mapping_type} onChange={set('mapping_type')} className={inputCls}>
              {MAPPING_TYPES.map(t => <option key={t} value={t}>{MAPPING_TYPE_LABELS[t]}</option>)}
            </select>
          </Field>
          {(form.mapping_type === 'split' || form.mapping_type === 'many_to_one') && (
            <Field label="Split %" sub="% of old account to this new account">
              <input type="number" value={form.mapping_split_percent} onChange={setN('mapping_split_percent')} min={0} max={100} className={`${inputCls} font-mono`} />
            </Field>
          )}
          {(form.mapping_type === 'split' || form.mapping_type === 'many_to_one' || form.mapping_type === 'one_to_many') && (
            <Field label="Group Key" sub="Links related accounts in a mapping cluster">
              <input value={form.mapping_group_key} onChange={set('mapping_group_key')} className={inputCls} />
            </Field>
          )}
          <Field label="Validation Status">
            <select value={form.validation_status} onChange={set('validation_status')} className={inputCls}>
              {VALIDATION_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
            </select>
          </Field>
          <Field label="Record Status">
            <select value={form.status} onChange={set('status')} className={inputCls}>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
        </div>
      </div>

      {/* Section: Workflow */}
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 pb-1 border-b border-slate-100">Workflow & Notes</p>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Reviewed By"><input value={form.reviewed_by} onChange={set('reviewed_by')} className={inputCls} /></Field>
          <Field label="Review Date"><input type="date" value={form.review_date} onChange={set('review_date')} className={inputCls} /></Field>
          <Field label="ERP Target Module"><input value={form.erp_target_module} onChange={set('erp_target_module')} placeholder="e.g. Municipal Finance" className={inputCls} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <Field label="Transition Notes" sub="Allocation logic, exceptions, split rationale">
            <textarea rows={2} value={form.transition_notes} onChange={set('transition_notes')} className={textareaCls} />
          </Field>
          <Field label="Internal Notes">
            <textarea rows={2} value={form.notes} onChange={set('notes')} className={textareaCls} />
          </Field>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
        <button onClick={onCancel} className="text-xs text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-400 transition-colors">Cancel</button>
        <button onClick={() => onSave(form)} className="text-xs bg-slate-900 text-white px-4 py-1.5 rounded-lg font-semibold hover:bg-slate-700 transition-colors">Save Account</button>
      </div>
    </div>
  );
}