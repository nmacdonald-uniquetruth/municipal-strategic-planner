/**
 * LegislationForm — Add / Edit a tracked legislation or policy item
 */
import React, { useState } from 'react';
import { JURISDICTIONS, PRIORITIES, STATUSES, STATUS_LABELS, TOPIC_CATEGORIES, IMPACT_TYPES, IMPACT_LEVELS, RECOMMENDED_ACTIONS, DEFAULT_DEPARTMENTS, DEFAULT_STRATEGIC_GOALS } from './policyEngine';

const Field = ({ label, children, className = '' }) => (
  <div className={className}>
    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">{label}</label>
    {children}
  </div>
);

const Input = (props) => (
  <input {...props} className="w-full text-xs border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-400 bg-white" />
);

const Textarea = (props) => (
  <textarea {...props} rows={3} className="w-full text-xs border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-400 bg-white resize-none" />
);

const Select = ({ options, ...props }) => (
  <select {...props} className="w-full text-xs border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-400 bg-white">
    {options.map(o => <option key={o.value || o} value={o.value || o}>{o.label || o}</option>)}
  </select>
);

export default function LegislationForm({ item, profile, onSave, onCancel }) {
  const departments = profile?.departments?.length ? profile.departments : DEFAULT_DEPARTMENTS;
  const goals = profile?.strategic_goals?.length ? profile.strategic_goals : DEFAULT_STRATEGIC_GOALS;
  const categories = profile?.custom_categories?.length ? [...TOPIC_CATEGORIES, ...profile.custom_categories] : TOPIC_CATEGORIES;

  const [form, setForm] = useState({
    identifier: '', title: '', jurisdiction: 'state', category: '', status: 'watch',
    priority: 'medium', impact_level: 'moderate', summary: '', municipal_relevance: '',
    sponsor: '', committee: '', last_action: '', last_action_date: '', effective_date: '',
    hearing_date: '', vote_date: '', comment_deadline: '',
    departments_affected: [], strategic_goals: [], impact_types: [],
    fiscal_impact_note: '', fiscal_impact_amount: '', operational_impact: '',
    compliance_impact: '', hr_impact: '', capital_impact: '',
    risk_if_enacted: '', risk_if_not_enacted: '', opportunities: '',
    recommended_action: 'monitor', recommended_action_note: '',
    probability_of_passage: 50, confidence_level: 'medium', source_url: '',
    is_watched: false, is_flagged_urgent: false, is_flagged_board: false,
    is_flagged_budget: false, is_flagged_grant: false, notes: '',
    ...item,
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleArr = (k, val) => set(k, form[k]?.includes(val) ? form[k].filter(x => x !== val) : [...(form[k] || []), val]);

  const handleSave = () => {
    const out = { ...form, fiscal_impact_amount: form.fiscal_impact_amount ? parseFloat(form.fiscal_impact_amount) : null };
    onSave(out);
  };

  return (
    <div className="space-y-5">
      {/* Section: Identity */}
      <Section title="Item Identity">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Identifier / Bill #">
            <Input value={form.identifier} onChange={e => set('identifier', e.target.value)} placeholder="HB 1234, S. 456..." />
          </Field>
          <Field label="Priority">
            <Select value={form.priority} onChange={e => set('priority', e.target.value)}
              options={PRIORITIES.map(p => ({ value: p, label: p.charAt(0).toUpperCase() + p.slice(1) }))} />
          </Field>
        </div>
        <Field label="Title" className="mt-3">
          <Input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Bill or policy title..." />
        </Field>
        <div className="grid grid-cols-3 gap-3 mt-3">
          <Field label="Jurisdiction">
            <Select value={form.jurisdiction} onChange={e => set('jurisdiction', e.target.value)}
              options={JURISDICTIONS.map(j => ({ value: j, label: j.charAt(0).toUpperCase() + j.slice(1) }))} />
          </Field>
          <Field label="Status">
            <Select value={form.status} onChange={e => set('status', e.target.value)}
              options={STATUSES.map(s => ({ value: s, label: STATUS_LABELS[s] }))} />
          </Field>
          <Field label="Category">
            <Select value={form.category} onChange={e => set('category', e.target.value)}
              options={[{ value: '', label: '-- Select --' }, ...categories.map(c => ({ value: c, label: c }))]} />
          </Field>
        </div>
      </Section>

      {/* Section: Summary */}
      <Section title="Summary & Municipal Relevance">
        <Field label="Plain-Language Summary">
          <Textarea value={form.summary} onChange={e => set('summary', e.target.value)} placeholder="What is this bill/policy doing?" />
        </Field>
        <Field label={`Why This Matters to ${profile?.name || 'Your Municipality'}`} className="mt-3">
          <Textarea value={form.municipal_relevance} onChange={e => set('municipal_relevance', e.target.value)} placeholder="How does this affect local operations, budget, or services?" />
        </Field>
      </Section>

      {/* Section: Legislative Details */}
      <Section title="Legislative Details">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Sponsor">
            <Input value={form.sponsor} onChange={e => set('sponsor', e.target.value)} />
          </Field>
          <Field label="Committee / Agency">
            <Input value={form.committee} onChange={e => set('committee', e.target.value)} />
          </Field>
          <Field label="Last Action">
            <Input value={form.last_action} onChange={e => set('last_action', e.target.value)} />
          </Field>
          <Field label="Last Action Date">
            <Input type="date" value={form.last_action_date} onChange={e => set('last_action_date', e.target.value)} />
          </Field>
          <Field label="Hearing Date">
            <Input type="date" value={form.hearing_date} onChange={e => set('hearing_date', e.target.value)} />
          </Field>
          <Field label="Vote Date">
            <Input type="date" value={form.vote_date} onChange={e => set('vote_date', e.target.value)} />
          </Field>
          <Field label="Comment Deadline">
            <Input type="date" value={form.comment_deadline} onChange={e => set('comment_deadline', e.target.value)} />
          </Field>
          <Field label="Effective Date">
            <Input type="date" value={form.effective_date} onChange={e => set('effective_date', e.target.value)} />
          </Field>
          <Field label="Probability of Passage (0-100)">
            <Input type="number" min={0} max={100} value={form.probability_of_passage} onChange={e => set('probability_of_passage', +e.target.value)} />
          </Field>
          <Field label="Source URL">
            <Input value={form.source_url} onChange={e => set('source_url', e.target.value)} placeholder="https://..." />
          </Field>
        </div>
      </Section>

      {/* Section: Impact */}
      <Section title="Impact Assessment">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Impact Level">
            <Select value={form.impact_level} onChange={e => set('impact_level', e.target.value)}
              options={IMPACT_LEVELS.map(l => ({ value: l, label: l.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()) }))} />
          </Field>
          <Field label="Est. Fiscal Impact ($)">
            <Input type="number" value={form.fiscal_impact_amount} onChange={e => set('fiscal_impact_amount', e.target.value)} placeholder="0" />
          </Field>
        </div>
        <div className="mt-3">
          <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Impact Types</label>
          <div className="flex flex-wrap gap-1.5">
            {IMPACT_TYPES.map(t => (
              <button key={t} type="button"
                onClick={() => toggleArr('impact_types', t)}
                className={`text-[10px] px-2 py-1 rounded-full border font-semibold transition-colors ${form.impact_types?.includes(t) ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <Field label="Fiscal Impact Note">
            <Textarea value={form.fiscal_impact_note} onChange={e => set('fiscal_impact_note', e.target.value)} />
          </Field>
          <Field label="Operational Impact">
            <Textarea value={form.operational_impact} onChange={e => set('operational_impact', e.target.value)} />
          </Field>
          <Field label="Compliance Impact">
            <Textarea value={form.compliance_impact} onChange={e => set('compliance_impact', e.target.value)} />
          </Field>
          <Field label="HR / Labor Impact">
            <Textarea value={form.hr_impact} onChange={e => set('hr_impact', e.target.value)} />
          </Field>
          <Field label="Capital Impact">
            <Textarea value={form.capital_impact} onChange={e => set('capital_impact', e.target.value)} />
          </Field>
          <Field label="Opportunities">
            <Textarea value={form.opportunities} onChange={e => set('opportunities', e.target.value)} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <Field label="Risk if Enacted">
            <Textarea value={form.risk_if_enacted} onChange={e => set('risk_if_enacted', e.target.value)} />
          </Field>
          <Field label="Risk if Not Enacted">
            <Textarea value={form.risk_if_not_enacted} onChange={e => set('risk_if_not_enacted', e.target.value)} />
          </Field>
        </div>
      </Section>

      {/* Section: Action */}
      <Section title="Recommended Action">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Action">
            <Select value={form.recommended_action} onChange={e => set('recommended_action', e.target.value)}
              options={RECOMMENDED_ACTIONS.map(a => ({ value: a, label: a.charAt(0).toUpperCase() + a.slice(1) }))} />
          </Field>
          <Field label="Confidence Level">
            <Select value={form.confidence_level} onChange={e => set('confidence_level', e.target.value)}
              options={[{ value: 'high', label: 'High' }, { value: 'medium', label: 'Medium' }, { value: 'low', label: 'Low' }]} />
          </Field>
        </div>
        <Field label="Action Notes" className="mt-3">
          <Textarea value={form.recommended_action_note} onChange={e => set('recommended_action_note', e.target.value)} />
        </Field>
      </Section>

      {/* Section: Departments & Goals */}
      <Section title="Departments Affected">
        <div className="flex flex-wrap gap-1.5">
          {departments.map(d => (
            <button key={d} type="button" onClick={() => toggleArr('departments_affected', d)}
              className={`text-[10px] px-2 py-1 rounded border font-medium transition-colors ${form.departments_affected?.includes(d) ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}>
              {d}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Strategic Goals">
        <div className="flex flex-wrap gap-1.5">
          {goals.map(g => (
            <button key={g} type="button" onClick={() => toggleArr('strategic_goals', g)}
              className={`text-[10px] px-2 py-1 rounded border font-medium transition-colors ${form.strategic_goals?.includes(g) ? 'bg-blue-700 text-white border-blue-700' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}>
              {g}
            </button>
          ))}
        </div>
      </Section>

      {/* Section: Flags */}
      <Section title="Flags & Watchlist">
        <div className="flex flex-wrap gap-4">
          {[
            { key: 'is_watched', label: '⭐ Watch This Item' },
            { key: 'is_flagged_urgent', label: '🚨 Urgent' },
            { key: 'is_flagged_board', label: '📋 Board Review' },
            { key: 'is_flagged_budget', label: '💰 Budget Planning' },
            { key: 'is_flagged_grant', label: '🎯 Grant Planning' },
          ].map(f => (
            <label key={f.key} className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 select-none">
              <input type="checkbox" checked={!!form[f.key]} onChange={e => set(f.key, e.target.checked)} className="rounded" />
              {f.label}
            </label>
          ))}
        </div>
        <Field label="Notes" className="mt-3">
          <Textarea value={form.notes} onChange={e => set('notes', e.target.value)} />
        </Field>
      </Section>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
        <button onClick={onCancel} className="text-xs px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold">Cancel</button>
        <button onClick={handleSave} className="text-xs px-5 py-2 rounded-lg bg-slate-900 text-white font-bold hover:bg-slate-700 transition-colors">Save Item</button>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <p className="text-[11px] font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-1.5 mb-3">{title}</p>
      {children}
    </div>
  );
}