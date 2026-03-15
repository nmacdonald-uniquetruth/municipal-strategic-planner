/**
 * WarrantBuilderArticleForm — Full article editor for the Annual Warrant Builder.
 * Extends ArticleForm with: public explainer fields, history panel, dept/deduction linking,
 * BETE line linkage, and all 3 text generation modes.
 */
import React, { useState, useCallback } from 'react';
import { generateDraftText, generatePublicText, generateBoardText, ARTICLE_CATEGORIES, VOTING_LABELS } from './warrantEngine';
import ArticlePublicExplainer from './ArticlePublicExplainer';
import ArticleHistoryPanel from './ArticleHistoryPanel';
import { Wand2, Lock, Unlock, ChevronDown, ChevronUp } from 'lucide-react';

const CATEGORIES = Object.entries(ARTICLE_CATEGORIES).map(([v, d]) => ({ value: v, label: d.label }));
const VOTING = Object.entries(VOTING_LABELS).map(([v, l]) => ({ value: v, label: l }));
const LEGAL_TYPES = ['appropriation','authorization','transfer','assessment','information','other'];
const STATUSES = ['draft','proposed','board_approved','posted','adopted','amended','failed'];
const LEGAL_REVIEW = ['not_reviewed','under_review','approved','requires_revision'];
const BETE_LINES = ['municipalAppropriations','schoolAppropriations','countyAssessment','enterpriseOffsets','localRevenues','tifFinancingPlan','fundBalanceUse','stateRevenueSharing',''];

const DEPT_OPTIONS = ['Administration','Police','Fire Department','Ambulance Service','Public Works','Library','Planning','Code Enforcement','Recreation','Transfer Station','Airport','School (RSU Share)','County Assessment','General Government'];

const Field = ({ label, children, description }) => (
  <div>
    <label className="block text-[10px] font-semibold text-slate-600 mb-1">{label}</label>
    {children}
    {description && <p className="text-[9px] text-slate-400 mt-0.5">{description}</p>}
  </div>
);

const Input = ({ value, onChange, ...props }) => (
  <input value={value || ''} onChange={e => onChange(e.target.value)} {...props}
    className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-400" />
);

const Select = ({ value, onChange, options }) => (
  <select value={value || ''} onChange={e => onChange(e.target.value)}
    className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-400">
    {options.map(o => <option key={o.value || o} value={o.value || o}>{o.label || o}</option>)}
  </select>
);

const Textarea = ({ value, onChange, rows = 3, ...props }) => (
  <textarea value={value || ''} onChange={e => onChange(e.target.value)} rows={rows} {...props}
    className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-slate-400" />
);

const SectionToggle = ({ label, open, toggle }) => (
  <button onClick={toggle} className="flex items-center gap-2 w-full text-left py-2 border-b border-slate-100 mb-3">
    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</span>
    {open ? <ChevronUp className="h-3 w-3 text-slate-400 ml-auto" /> : <ChevronDown className="h-3 w-3 text-slate-400 ml-auto" />}
  </button>
);

export default function WarrantBuilderArticleForm({ article, onSave, onCancel, calc, history }) {
  const [form, setForm] = useState({
    article_number: '', sort_order: 0, fiscal_year: 'FY2027',
    title: '', category: 'municipal_appropriation', legal_type: 'appropriation',
    voting_method: 'majority_voice', status: 'draft', legal_review_status: 'not_reviewed',
    financial_amount: 0, prior_year_amount: 0,
    draft_text: '', board_text: '', public_text: '',
    text_frozen: false,
    linked_departments: [], linked_deductions: [],
    bete_mapping: '', explanatory_notes: '', tax_impact_note: '', notes: '',
    pub_purpose: '', pub_key_change: '', pub_tax_impact: '', pub_recurring: true,
    ...(article || {}),
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showDepts, setShowDepts] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [showExplainer, setShowExplainer] = useState(true);

  const set = useCallback((k, v) => setForm(p => ({ ...p, [k]: v })), []);

  const toggleDept = (dept) => {
    const linked = form.linked_departments || [];
    set('linked_departments', linked.includes(dept) ? linked.filter(d => d !== dept) : [...linked, dept]);
  };

  const handleGenerate = (mode) => {
    if (form.text_frozen && mode === 'draft') return;
    const generated = mode === 'draft' ? generateDraftText(form, calc)
      : mode === 'board' ? generateBoardText(form, calc)
      : generatePublicText(form);
    const fieldMap = { draft: 'draft_text', board: 'board_text', public: 'public_text' };
    set(fieldMap[mode], generated);
  };

  const handlePublicExplainerChange = (fields) => {
    setForm(p => ({ ...p, ...fields }));
  };

  const handleSubmit = () => {
    onSave(form);
  };

  const catColor = ARTICLE_CATEGORIES[form.category]?.color || '#888';

  return (
    <div className="space-y-5">
      {/* Identity */}
      <div>
        <SectionToggle label="Article Identity" open toggle={() => {}} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Field label="Article Number *">
            <Input value={form.article_number} onChange={v => set('article_number', v)} placeholder="e.g. Article 4" />
          </Field>
          <Field label="Sort Order">
            <Input type="number" value={form.sort_order} onChange={v => set('sort_order', +v)} />
          </Field>
          <Field label="Fiscal Year">
            <Select value={form.fiscal_year} onChange={v => set('fiscal_year', v)}
              options={['FY2024','FY2025','FY2026','FY2027','FY2028','FY2029'].map(v => ({ value: v, label: v }))} />
          </Field>
          <Field label="Status">
            <Select value={form.status} onChange={v => set('status', v)} options={STATUSES.map(s => ({ value: s, label: s }))} />
          </Field>
          <Field label="Title *" description="Short title for article index">
            <Input value={form.title} onChange={v => set('title', v)} placeholder="e.g. Administration & General Government" />
          </Field>
          <Field label="Category *">
            <Select value={form.category} onChange={v => set('category', v)} options={CATEGORIES} />
          </Field>
          <Field label="Legal Type">
            <Select value={form.legal_type} onChange={v => set('legal_type', v)}
              options={LEGAL_TYPES.map(t => ({ value: t, label: t }))} />
          </Field>
          <Field label="Voting Method">
            <Select value={form.voting_method} onChange={v => set('voting_method', v)} options={VOTING} />
          </Field>
        </div>
      </div>

      {/* Financial */}
      <div>
        <SectionToggle label="Financial Amounts" open toggle={() => {}} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Field label="Amount ($) *">
            <Input type="number" value={form.financial_amount} onChange={v => set('financial_amount', +v)} />
          </Field>
          <Field label="Prior Year Amount">
            <Input type="number" value={form.prior_year_amount} onChange={v => set('prior_year_amount', +v)} />
          </Field>
          <Field label="BETE Line Mapping">
            <Select value={form.bete_mapping} onChange={v => set('bete_mapping', v)}
              options={[{ value: '', label: '— None —' }, ...BETE_LINES.filter(Boolean).map(b => ({ value: b, label: b }))]} />
          </Field>
          <Field label="Tax Impact Note">
            <Input value={form.tax_impact_note} onChange={v => set('tax_impact_note', v)} placeholder="e.g. +0.12 mills / +$12 per $100k" />
          </Field>
        </div>
        {form.prior_year_amount > 0 && form.financial_amount > 0 && (
          <div className="mt-2 text-[10px] text-slate-500 font-mono">
            Change from prior year: {form.financial_amount >= form.prior_year_amount ? '+' : ''}{`$${Math.round((form.financial_amount - form.prior_year_amount)).toLocaleString()}`} ({(((form.financial_amount - form.prior_year_amount) / form.prior_year_amount) * 100).toFixed(1)}%)
          </div>
        )}
      </div>

      {/* Public Explainer */}
      <div>
        <SectionToggle label="Public Explanation" open={showExplainer} toggle={() => setShowExplainer(v => !v)} />
        {showExplainer && (
          <ArticlePublicExplainer article={form} onChange={handlePublicExplainerChange} />
        )}
      </div>

      {/* Linked Departments */}
      <div>
        <SectionToggle label="Linked Departments & Deductions" open={showDepts} toggle={() => setShowDepts(v => !v)} />
        {showDepts && (
          <div className="space-y-3">
            <div>
              <p className="text-[10px] font-semibold text-slate-500 mb-2">Departments covered by this article:</p>
              <div className="flex flex-wrap gap-1.5">
                {DEPT_OPTIONS.map(d => (
                  <button key={d} onClick={() => toggleDept(d)}
                    className={`text-[10px] px-2.5 py-1 rounded-full font-medium border transition-colors ${(form.linked_departments || []).includes(d) ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'}`}>
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-1">Linked Deductions (comma-separated article numbers)</label>
              <Input value={(form.linked_deductions || []).join(', ')} onChange={v => set('linked_deductions', v.split(',').map(s => s.trim()).filter(Boolean))} placeholder="e.g. Article 9, Article 11" />
            </div>
          </div>
        )}
      </div>

      {/* Text Generation */}
      <div>
        <SectionToggle label="Warrant Text" open toggle={() => {}} />
        <div className="space-y-4">
          {/* Draft / Legal */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-semibold text-slate-600">Legal Draft Text</label>
              <div className="flex items-center gap-2">
                <button onClick={() => set('text_frozen', !form.text_frozen)}
                  className={`flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded border transition-colors ${form.text_frozen ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                  {form.text_frozen ? <><Lock className="h-2.5 w-2.5" /> Frozen</> : <><Unlock className="h-2.5 w-2.5" /> Unlocked</>}
                </button>
                <button onClick={() => handleGenerate('draft')} disabled={form.text_frozen}
                  className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-slate-900 text-white hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  <Wand2 className="h-3 w-3" /> Generate Legal
                </button>
              </div>
            </div>
            <Textarea value={form.draft_text} onChange={v => !form.text_frozen && set('draft_text', v)} rows={4}
              placeholder="Click 'Generate Legal' to auto-generate from budget data, or type manually…" />
            {form.text_frozen && <p className="text-[9px] text-amber-600 mt-1">⚠ Text is frozen. Unlock to edit. Financial amounts still update.</p>}
          </div>

          {/* Board Text */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-semibold text-slate-600">Board Presentation Text</label>
              <button onClick={() => handleGenerate('board')}
                className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-slate-700 text-white hover:bg-slate-600 transition-colors">
                <Wand2 className="h-3 w-3" /> Generate Board
              </button>
            </div>
            <Textarea value={form.board_text} onChange={v => set('board_text', v)} rows={3}
              placeholder="Concise version for Select Board and Budget Committee presentation…" />
          </div>

          {/* Public Text */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-semibold text-slate-600">Public Summary Text</label>
              <button onClick={() => handleGenerate('public')}
                className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-[#2A7F7F] text-white hover:opacity-80 transition-colors">
                <Wand2 className="h-3 w-3" /> Generate Public
              </button>
            </div>
            <Textarea value={form.public_text} onChange={v => set('public_text', v)} rows={3}
              placeholder="Plain-language explanation for residents, newsletter, and town website…" />
          </div>
        </div>
      </div>

      {/* Advanced / Notes */}
      <div>
        <SectionToggle label="Notes & Legal Review" open={showAdvanced} toggle={() => setShowAdvanced(v => !v)} />
        {showAdvanced && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Explanatory Notes">
              <Textarea value={form.explanatory_notes} onChange={v => set('explanatory_notes', v)} rows={2} />
            </Field>
            <Field label="Manager / Staff Notes">
              <Textarea value={form.notes} onChange={v => set('notes', v)} rows={2} />
            </Field>
            <Field label="Legal Review Status">
              <Select value={form.legal_review_status} onChange={v => set('legal_review_status', v)}
                options={LEGAL_REVIEW.map(s => ({ value: s, label: s }))} />
            </Field>
          </div>
        )}
      </div>

      {/* History */}
      <div>
        <SectionToggle label="Article History" open={showHistory} toggle={() => setShowHistory(v => !v)} />
        {showHistory && <ArticleHistoryPanel historyRecords={history || []} />}
      </div>

      {/* Category color indicator */}
      <div className="flex items-center gap-2 py-1">
        <div className="h-3 w-3 rounded-full flex-shrink-0" style={{ background: catColor }} />
        <p className="text-[10px] text-slate-400">{ARTICLE_CATEGORIES[form.category]?.label} · BETE: {form.bete_mapping || 'unmapped'}</p>
      </div>

      {/* Actions */}
      <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
        <button onClick={onCancel} className="text-xs px-4 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:border-slate-400 font-medium">
          Cancel
        </button>
        <button onClick={handleSubmit}
          className="text-xs px-4 py-1.5 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-700 transition-colors">
          Save Article
        </button>
      </div>
    </div>
  );
}