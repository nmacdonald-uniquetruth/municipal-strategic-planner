/**
 * MunicipalityProfilePanel — Configure the municipality profile for the module
 */
import React, { useState } from 'react';
import { Building2, Plus, X } from 'lucide-react';
import { DEFAULT_DEPARTMENTS, DEFAULT_STRATEGIC_GOALS, TOPIC_CATEGORIES } from './policyEngine';

const GOVERNANCE_TYPES = [
  { value: 'town_meeting', label: 'Town Meeting' },
  { value: 'council_manager', label: 'Council-Manager' },
  { value: 'mayor_council', label: 'Mayor-Council' },
  { value: 'select_board', label: 'Select Board' },
  { value: 'commission', label: 'Commission' },
  { value: 'other', label: 'Other' },
];

export default function MunicipalityProfilePanel({ profile, onSave }) {
  const [form, setForm] = useState({
    name: '', state: '', county: '', population: '', governance_type: 'town_meeting',
    fiscal_year: '', annual_budget: '',
    departments: DEFAULT_DEPARTMENTS,
    enterprise_funds: [],
    strategic_goals: DEFAULT_STRATEGIC_GOALS,
    policy_focus_areas: [],
    custom_categories: [],
    notes: '',
    ...profile,
  });
  const [newDept, setNewDept] = useState('');
  const [newFund, setNewFund] = useState('');
  const [newGoal, setNewGoal] = useState('');
  const [newFocus, setNewFocus] = useState('');
  const [newCat, setNewCat] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const addTo = (k, val, setter) => { if (!val.trim()) return; set(k, [...(form[k] || []), val.trim()]); setter(''); };
  const removeFrom = (k, idx) => set(k, form[k].filter((_, i) => i !== idx));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Building2 className="h-5 w-5 text-slate-700" />
        <h3 className="text-sm font-bold text-slate-900">Municipality Profile</h3>
        <p className="text-[10px] text-slate-400 ml-2">Configures all scoring, summaries, and filtering in this module.</p>
      </div>

      {/* Basic Info */}
      <Section title="Basic Information">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <LabeledInput label="Municipality Name" value={form.name} onChange={v => set('name', v)} placeholder="Machias" />
          <LabeledInput label="State" value={form.state} onChange={v => set('state', v)} placeholder="ME" />
          <LabeledInput label="County" value={form.county} onChange={v => set('county', v)} placeholder="Washington" />
          <LabeledInput label="Population" type="number" value={form.population} onChange={v => set('population', v)} />
          <div>
            <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Governance Type</label>
            <select value={form.governance_type} onChange={e => set('governance_type', e.target.value)}
              className="w-full text-xs border border-slate-200 rounded px-2.5 py-1.5 bg-white focus:outline-none">
              {GOVERNANCE_TYPES.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
            </select>
          </div>
          <LabeledInput label="Fiscal Year" value={form.fiscal_year} onChange={v => set('fiscal_year', v)} placeholder="FY2027" />
          <LabeledInput label="Annual Budget ($)" type="number" value={form.annual_budget} onChange={v => set('annual_budget', v)} />
        </div>
      </Section>

      {/* Departments */}
      <Section title="Departments & Service Areas">
        <TagListEditor items={form.departments} onRemove={i => removeFrom('departments', i)}
          newVal={newDept} onNewChange={setNewDept} onAdd={() => addTo('departments', newDept, setNewDept)} />
      </Section>

      {/* Enterprise Funds */}
      <Section title="Enterprise Funds">
        <TagListEditor items={form.enterprise_funds} onRemove={i => removeFrom('enterprise_funds', i)}
          newVal={newFund} onNewChange={setNewFund} onAdd={() => addTo('enterprise_funds', newFund, setNewFund)}
          placeholder="e.g. Sewer, Ambulance..." />
      </Section>

      {/* Strategic Goals */}
      <Section title="Strategic Goals">
        <TagListEditor items={form.strategic_goals} onRemove={i => removeFrom('strategic_goals', i)}
          newVal={newGoal} onNewChange={setNewGoal} onAdd={() => addTo('strategic_goals', newGoal, setNewGoal)} />
      </Section>

      {/* Policy Focus Areas */}
      <Section title="Policy Focus Areas">
        <TagListEditor items={form.policy_focus_areas} onRemove={i => removeFrom('policy_focus_areas', i)}
          newVal={newFocus} onNewChange={setNewFocus} onAdd={() => addTo('policy_focus_areas', newFocus, setNewFocus)}
          placeholder="e.g. Housing, EMS, Workforce..." />
      </Section>

      {/* Custom Categories */}
      <Section title="Custom Topic Categories">
        <TagListEditor items={form.custom_categories} onRemove={i => removeFrom('custom_categories', i)}
          newVal={newCat} onNewChange={setNewCat} onAdd={() => addTo('custom_categories', newCat, setNewCat)}
          placeholder="Add a custom topic category..." />
      </Section>

      <div className="flex justify-end pt-2 border-t border-slate-200">
        <button onClick={() => onSave(form)} className="text-xs px-5 py-2 rounded-lg bg-slate-900 text-white font-bold hover:bg-slate-700 transition-colors">
          Save Profile
        </button>
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

function LabeledInput({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">{label}</label>
      <input type={type} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full text-xs border border-slate-200 rounded px-2.5 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-slate-400" />
    </div>
  );
}

function TagListEditor({ items = [], onRemove, newVal, onNewChange, onAdd, placeholder = 'Add item...' }) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {items.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-1 text-[10px] bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-full font-medium">
            {item}
            <button onClick={() => onRemove(i)} className="text-slate-400 hover:text-red-500 transition-colors">
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={newVal} onChange={e => onNewChange(e.target.value)} placeholder={placeholder}
          onKeyDown={e => e.key === 'Enter' && onAdd()}
          className="flex-1 text-xs border border-slate-200 rounded px-2.5 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-slate-400" />
        <button onClick={onAdd} className="text-xs px-3 py-1.5 rounded border border-slate-300 bg-white text-slate-600 font-semibold hover:bg-slate-50 flex items-center gap-1">
          <Plus className="h-3 w-3" /> Add
        </button>
      </div>
    </div>
  );
}