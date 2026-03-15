/**
 * ArticleMappingTable — Editable grid mapping each line item to article/BETE/deduction type.
 */
import React, { useState } from 'react';
import { DEDUCTION_TYPES, BETE_LINES } from './articleMappingEngine';
import { CheckCircle, AlertTriangle, XCircle, Wand2 } from 'lucide-react';

const fmt = n => `$${Math.round(Math.abs(n || 0)).toLocaleString()}`;

const BETE_OPTIONS = [
  { value: '', label: '— unassigned —' },
  ...Object.entries(BETE_LINES).map(([v, d]) => ({ value: v, label: d.label })),
];
const DEDUCTION_OPTIONS = Object.entries(DEDUCTION_TYPES).map(([v, d]) => ({ value: v, label: d.label }));

function MappingRow({ lineItem, mapping, articles, onChange }) {
  const m = mapping || {};
  const isComplete = m.article_number && m.bete_line;
  const isDeduction = lineItem.record_type === 'deduction';
  const needsDeductionType = isDeduction && (!m.deduction_type || m.deduction_type === 'none');

  return (
    <tr className={`border-t border-slate-100 hover:bg-slate-50/50 transition-colors ${!isComplete ? 'bg-red-50/20' : ''}`}>
      {/* Status */}
      <td className="px-2 py-1.5 text-center w-6">
        {isComplete && !needsDeductionType
          ? <CheckCircle className="h-3.5 w-3.5 text-emerald-500 inline" />
          : !m.article_number
            ? <XCircle className="h-3.5 w-3.5 text-red-500 inline" title="No article assigned" />
            : <AlertTriangle className="h-3.5 w-3.5 text-amber-500 inline" title="Incomplete mapping" />}
      </td>

      {/* Label + dept */}
      <td className="px-3 py-1.5 min-w-[180px]">
        <p className="text-xs font-semibold text-slate-800 leading-tight">{lineItem.label}</p>
        {lineItem.department && <p className="text-[9px] text-slate-400 mt-0.5">{lineItem.department}</p>}
        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold mt-0.5 inline-block ${isDeduction ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
          {isDeduction ? 'deduction' : 'appropriation'}
        </span>
      </td>

      {/* Amount */}
      <td className="px-2 py-1.5 text-right font-mono text-xs text-slate-700 whitespace-nowrap">
        {fmt(lineItem.amount)}
      </td>

      {/* Article Number */}
      <td className="px-2 py-1.5 min-w-[130px]">
        <select
          value={m.article_number || ''}
          onChange={e => onChange({ ...m, article_number: e.target.value })}
          className="w-full text-[10px] border border-slate-200 rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-slate-400 bg-white"
        >
          <option value="">— assign article —</option>
          {articles.map(a => (
            <option key={a.article_number} value={a.article_number}>
              {a.article_number} — {a.title}
            </option>
          ))}
        </select>
      </td>

      {/* BETE Line */}
      <td className="px-2 py-1.5 min-w-[160px]">
        <select
          value={m.bete_line || ''}
          onChange={e => onChange({ ...m, bete_line: e.target.value })}
          className="w-full text-[10px] border border-slate-200 rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-slate-400 bg-white"
        >
          {BETE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </td>

      {/* Deduction Type */}
      <td className="px-2 py-1.5 min-w-[160px]">
        <select
          value={m.deduction_type || 'none'}
          onChange={e => onChange({ ...m, deduction_type: e.target.value })}
          className={`w-full text-[10px] border rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-slate-400 bg-white ${needsDeductionType ? 'border-amber-300' : 'border-slate-200'}`}
        >
          {DEDUCTION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </td>

      {/* Notes */}
      <td className="px-2 py-1.5 min-w-[120px]">
        <input
          value={m.notes || ''}
          onChange={e => onChange({ ...m, notes: e.target.value })}
          placeholder="optional note"
          className="w-full text-[10px] border border-slate-200 rounded px-1.5 py-1 focus:outline-none bg-white"
        />
      </td>
    </tr>
  );
}

export default function ArticleMappingTable({ lineItems, mappings, articles, onMappingChange, onAutoMap }) {
  const [filter, setFilter] = useState('all'); // all | unmapped | deductions | appropriations

  const filtered = lineItems.filter(li => {
    if (filter === 'unmapped') return !mappings[li.id]?.article_number || !mappings[li.id]?.bete_line;
    if (filter === 'deductions') return li.record_type === 'deduction';
    if (filter === 'appropriations') return li.record_type === 'appropriation';
    return true;
  });

  const completePct = lineItems.length > 0
    ? Math.round((lineItems.filter(li => mappings[li.id]?.article_number && mappings[li.id]?.bete_line).length / lineItems.length) * 100)
    : 0;

  return (
    <div className="space-y-3">
      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-1">
          {[['all','All'],['unmapped','Unmapped'],['deductions','Deductions'],['appropriations','Appropriations']].map(([v, l]) => (
            <button key={v} onClick={() => setFilter(v)}
              className={`text-[10px] px-2.5 py-1 rounded-full font-semibold border transition-colors ${filter === v ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'}`}>
              {l}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-24 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${completePct}%` }} />
            </div>
            <span className="text-[10px] font-semibold text-slate-600">{completePct}% mapped</span>
          </div>
          <button onClick={onAutoMap}
            className="flex items-center gap-1.5 text-[10px] font-semibold bg-slate-900 text-white px-2.5 py-1 rounded-lg hover:bg-slate-700 transition-colors">
            <Wand2 className="h-3 w-3" /> Auto-Map Suggestions
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 overflow-auto max-h-[60vh]">
        <table className="w-full border-collapse text-xs">
          <thead className="sticky top-0 z-10">
            <tr className="bg-slate-900 text-white">
              <th className="px-2 py-2 text-center text-[9px] uppercase tracking-wider w-6">OK</th>
              <th className="px-3 py-2 text-left text-[9px] uppercase tracking-wider">Line Item</th>
              <th className="px-2 py-2 text-right text-[9px] uppercase tracking-wider">Amount</th>
              <th className="px-2 py-2 text-left text-[9px] uppercase tracking-wider">Article</th>
              <th className="px-2 py-2 text-left text-[9px] uppercase tracking-wider">BETE Line</th>
              <th className="px-2 py-2 text-left text-[9px] uppercase tracking-wider">Deduction Type</th>
              <th className="px-2 py-2 text-left text-[9px] uppercase tracking-wider">Notes</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(li => (
              <MappingRow
                key={li.id}
                lineItem={li}
                mapping={mappings[li.id]}
                articles={articles}
                onChange={m => onMappingChange(li.id, m)}
              />
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-xs text-slate-400 italic">No items match the current filter.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-[9px] text-slate-400 italic">
        Auto-Map applies suggested mappings from article defaults. Review and correct individually before publishing the warrant.
      </p>
    </div>
  );
}