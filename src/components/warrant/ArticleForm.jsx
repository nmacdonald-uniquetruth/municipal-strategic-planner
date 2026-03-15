/**
 * ArticleForm — Create or edit a single warrant article.
 */
import React, { useState, useEffect } from 'react';
import { generateDraftText, generatePublicText, generateBoardText, ARTICLE_CATEGORIES, VOTING_LABELS } from './warrantEngine';
import { Sparkles, Lock, Unlock } from 'lucide-react';

const CATEGORIES = Object.entries(ARTICLE_CATEGORIES).map(([id, v]) => ({ id, ...v }));
const LEGAL_TYPES = ['appropriation','authorization','transfer','assessment','information','other'];
const VOTING_METHODS = Object.entries(VOTING_LABELS).map(([id, label]) => ({ id, label }));
const LEGAL_REVIEW_STATUSES = ['not_reviewed','under_review','approved','requires_revision'];
const STATUSES = ['draft','proposed','board_approved','posted','adopted','amended','failed'];

function Field({ label, children, sub }) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</label>
      {sub && <p className="text-[9px] text-slate-400 mb-1">{sub}</p>}
      {children}
    </div>
  );
}

const inputCls = "w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-400 bg-white";
const textareaCls = `${inputCls} resize-none leading-relaxed`;

export default function ArticleForm({ article, onSave, onCancel, calc }) {
  const [form, setForm] = useState(article || {
    article_number: '', sort_order: 0, title: '', category: 'municipal_appropriation',
    legal_type: 'appropriation', voting_method: 'majority_voice',
    financial_amount: 0, prior_year_amount: 0,
    draft_text: '', board_text: '', public_text: '',
    explanatory_notes: '', tax_impact_note: '', bete_mapping: '',
    legal_review_status: 'not_reviewed', text_frozen: false,
    status: 'draft', notes: '',
  });

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const setN = k => e => setForm(p => ({ ...p, [k]: parseFloat(e.target.value) || 0 }));
  const setB = k => v => setForm(p => ({ ...p, [k]: v }));

  const handleGenerate = () => {
    if (form.text_frozen) return;
    setForm(p => ({
      ...p,
      draft_text: generateDraftText(p, calc),
      public_text: generatePublicText(p),
      board_text: generateBoardText(p, calc),
    }));
  };

  const catColor = ARTICLE_CATEGORIES[form.category]?.color || '#344A60';

  return (
    <div className="space-y-4">
      {/* Header strip */}
      <div className="rounded-xl p-3 flex items-center justify-between" style={{ background: catColor + '18', borderLeft: `3px solid ${catColor}` }}>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold" style={{ color: catColor }}>{form.article_number || 'New Article'}</span>
          <span className="text-[10px] text-slate-500">{ARTICLE_CATEGORIES[form.category]?.label}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setB('text_frozen')(!form.text_frozen)}
            className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg border transition-colors ${form.text_frozen ? 'border-amber-300 bg-amber-50 text-amber-700' : 'border-slate-200 bg-white text-slate-500'}`}>
            {form.text_frozen ? <><Lock className="h-3 w-3" /> Frozen</> : <><Unlock className="h-3 w-3" /> Unfrozen</>}
          </button>
          {!form.text_frozen && (
            <button onClick={handleGenerate}
              className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-slate-900 text-white hover:bg-slate-700 transition-colors">
              <Sparkles className="h-3 w-3" /> Generate Text
            </button>
          )}
        </div>
      </div>

      {/* Identity */}
      <div className="grid grid-cols-3 gap-3">
        <Field label="Article #">
          <input value={form.article_number} onChange={set('article_number')} placeholder="Article 4" className={inputCls} />
        </Field>
        <Field label="Sort Order">
          <input type="number" value={form.sort_order} onChange={setN('sort_order')} className={inputCls} />
        </Field>
        <Field label="Status">
          <select value={form.status} onChange={set('status')} className={inputCls}>
            {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Title">
        <input value={form.title} onChange={set('title')} placeholder="Administration and General Government" className={inputCls} />
      </Field>

      {/* Classification */}
      <div className="grid grid-cols-3 gap-3">
        <Field label="Category">
          <select value={form.category} onChange={set('category')} className={inputCls}>
            {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </Field>
        <Field label="Legal Type">
          <select value={form.legal_type} onChange={set('legal_type')} className={inputCls}>
            {LEGAL_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g,' ')}</option>)}
          </select>
        </Field>
        <Field label="Voting Method">
          <select value={form.voting_method} onChange={set('voting_method')} className={inputCls}>
            {VOTING_METHODS.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
          </select>
        </Field>
      </div>

      {/* Financials */}
      <div className="grid grid-cols-3 gap-3">
        <Field label="Amount ($)" sub="This article's appropriation">
          <input type="number" value={form.financial_amount || ''} onChange={setN('financial_amount')} className={`${inputCls} text-right font-mono`} />
        </Field>
        <Field label="Prior Year ($)">
          <input type="number" value={form.prior_year_amount || ''} onChange={setN('prior_year_amount')} className={`${inputCls} text-right font-mono`} />
        </Field>
        <Field label="BETE Mapping" sub="e.g. municipalAppropriations">
          <input value={form.bete_mapping || ''} onChange={set('bete_mapping')} className={inputCls} />
        </Field>
      </div>

      {/* Tax impact */}
      <Field label="Tax Impact Note" sub="e.g. 'Raises mill rate ~0.15 mills'">
        <input value={form.tax_impact_note || ''} onChange={set('tax_impact_note')} className={inputCls} />
      </Field>
      <Field label="Explanatory Notes">
        <textarea rows={2} value={form.explanatory_notes || ''} onChange={set('explanatory_notes')} className={textareaCls} />
      </Field>

      {/* Text fields */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Warrant Article Text</p>
          {form.text_frozen && <span className="text-[9px] bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full">TEXT FROZEN — financial data will still update</span>}
        </div>
        <Field label="Draft Text (Full Legal Language)">
          <textarea rows={5} value={form.draft_text || ''} onChange={set('draft_text')} disabled={form.text_frozen}
            className={`${textareaCls} ${form.text_frozen ? 'bg-amber-50/50 border-amber-200 cursor-not-allowed' : ''}`} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Board Presentation Text">
            <textarea rows={4} value={form.board_text || ''} onChange={set('board_text')} disabled={form.text_frozen}
              className={`${textareaCls} ${form.text_frozen ? 'bg-amber-50/50 border-amber-200 cursor-not-allowed' : ''}`} />
          </Field>
          <Field label="Public / Plain-Language Summary">
            <textarea rows={4} value={form.public_text || ''} onChange={set('public_text')} disabled={form.text_frozen}
              className={`${textareaCls} ${form.text_frozen ? 'bg-amber-50/50 border-amber-200 cursor-not-allowed' : ''}`} />
          </Field>
        </div>
      </div>

      {/* Legal review */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Legal Review Status">
          <select value={form.legal_review_status} onChange={set('legal_review_status')} className={inputCls}>
            {LEGAL_REVIEW_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
          </select>
        </Field>
        <Field label="Internal Notes">
          <input value={form.notes || ''} onChange={set('notes')} className={inputCls} />
        </Field>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
        <button onClick={onCancel} className="text-xs text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-400 transition-colors">
          Cancel
        </button>
        <button onClick={() => onSave(form)}
          className="text-xs bg-slate-900 text-white px-4 py-1.5 rounded-lg font-semibold hover:bg-slate-700 transition-colors">
          Save Article
        </button>
      </div>
    </div>
  );
}