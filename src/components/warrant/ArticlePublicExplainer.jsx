/**
 * ArticlePublicExplainer — Public-facing explanation fields for a warrant article.
 * Editable inline panel: purpose, key change, tax impact, recurring/one-time.
 */
import React, { useState } from 'react';

const FIELD_DEFS = [
  { key: 'pub_purpose',     label: 'Purpose',                   placeholder: 'What does this article fund and why is it needed?', rows: 2 },
  { key: 'pub_key_change',  label: 'Key Change from Prior Year', placeholder: 'What is different this year? New position, cost increase, one-time item?', rows: 2 },
  { key: 'pub_tax_impact',  label: 'Impact on Taxation',        placeholder: 'Approximate mill rate impact or per-$100k home effect.', rows: 1 },
];

export default function ArticlePublicExplainer({ article, onChange }) {
  const [local, setLocal] = useState({
    pub_purpose:    article.pub_purpose    || '',
    pub_key_change: article.pub_key_change || '',
    pub_tax_impact: article.pub_tax_impact || '',
    pub_recurring:  article.pub_recurring  ?? true,
  });

  const set = (k, v) => {
    const updated = { ...local, [k]: v };
    setLocal(updated);
    onChange?.(updated);
  };

  return (
    <div className="space-y-3 rounded-xl border border-blue-100 bg-blue-50/40 p-4">
      <div className="flex items-center gap-2 mb-1">
        <div className="h-2 w-2 rounded-full bg-blue-500" />
        <p className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">Public Explanation Fields</p>
        <span className="text-[9px] text-blue-500 italic ml-1">— for newsletter, website & meeting packet</span>
      </div>
      {FIELD_DEFS.map(f => (
        <div key={f.key}>
          <label className="block text-[10px] font-semibold text-slate-600 mb-1">{f.label}</label>
          <textarea
            value={local[f.key]}
            onChange={e => set(f.key, e.target.value)}
            rows={f.rows}
            placeholder={f.placeholder}
            className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-blue-300 bg-white"
          />
        </div>
      ))}
      <div className="flex items-center gap-3 pt-1">
        <label className="text-[10px] font-semibold text-slate-600">Nature of Expenditure:</label>
        <div className="flex gap-2">
          {[{ v: true, label: 'Recurring' }, { v: false, label: 'One-Time' }].map(opt => (
            <button key={String(opt.v)} onClick={() => set('pub_recurring', opt.v)}
              className={`text-[10px] px-2.5 py-1 rounded-full font-semibold border transition-colors ${local.pub_recurring === opt.v ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'}`}>
              {opt.label}
            </button>
          ))}
        </div>
        {local.pub_recurring === false && (
          <span className="text-[9px] text-amber-600 font-semibold">⚠ One-time — note in public summary</span>
        )}
      </div>
    </div>
  );
}