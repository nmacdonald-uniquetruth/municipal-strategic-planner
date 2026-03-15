/**
 * ArticleList — Sortable list of warrant articles with status badges and quick actions.
 */
import React from 'react';
import { Lock, AlertTriangle, CheckCircle, Pencil, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { ARTICLE_CATEGORIES, VOTING_LABELS } from './warrantEngine';

const fmt = n => n == null ? '—' : `$${Math.round(Math.abs(n)).toLocaleString()}`;

const STATUS_STYLES = {
  draft:           'bg-slate-100 text-slate-600',
  proposed:        'bg-blue-100 text-blue-700',
  board_approved:  'bg-indigo-100 text-indigo-700',
  posted:          'bg-amber-100 text-amber-700',
  adopted:         'bg-emerald-100 text-emerald-700',
  amended:         'bg-orange-100 text-orange-700',
  failed:          'bg-red-100 text-red-700',
};

const LEGAL_STYLES = {
  not_reviewed:       'text-slate-400',
  under_review:       'text-blue-500',
  approved:           'text-emerald-600',
  requires_revision:  'text-red-500',
};

export default function ArticleList({ articles, articleErrors, onEdit, onDelete, onReorder }) {
  const sorted = [...articles].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || a.article_number?.localeCompare(b.article_number));

  const getErrors = (a) => articleErrors.filter(e => e.id === a.id || e.id === a.article_number);

  return (
    <div className="space-y-1.5">
      {sorted.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-200 py-10 text-center">
          <p className="text-xs text-slate-400">No articles yet. Click "New Article" to begin.</p>
        </div>
      )}
      {sorted.map((a, idx) => {
        const cat = ARTICLE_CATEGORIES[a.category];
        const errs = getErrors(a);
        const hasError = errs.some(e => articleErrors.some(ae => ae.id === e.id));
        const py = a.prior_year_amount;
        const diff = py ? (a.financial_amount || 0) - py : null;

        return (
          <div key={a.id || a.article_number}
            className="rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors overflow-hidden">
            <div className="px-3 py-2.5 flex items-center gap-3">
              {/* Reorder */}
              <div className="flex flex-col gap-0.5 flex-shrink-0">
                <button onClick={() => onReorder(a, -1)} className="text-slate-300 hover:text-slate-600 transition-colors">
                  <ChevronUp className="h-3 w-3" />
                </button>
                <button onClick={() => onReorder(a, 1)} className="text-slate-300 hover:text-slate-600 transition-colors">
                  <ChevronDown className="h-3 w-3" />
                </button>
              </div>

              {/* Color dot */}
              <div className="h-3 w-3 rounded-full flex-shrink-0" style={{ background: cat?.color || '#888' }} />

              {/* Number & title */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold text-slate-500">{a.article_number || '—'}</span>
                  <span className="text-xs font-semibold text-slate-900 truncate">{a.title}</span>
                  {a.text_frozen && <Lock className="h-3 w-3 text-amber-500 flex-shrink-0" title="Text frozen" />}
                  {errs.length > 0 && <AlertTriangle className="h-3 w-3 text-red-500 flex-shrink-0" title={errs[0]?.msg} />}
                </div>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-[9px] text-slate-400">{cat?.label}</span>
                  <span className="text-[9px] text-slate-300">·</span>
                  <span className="text-[9px] text-slate-400">{VOTING_LABELS[a.voting_method] || a.voting_method}</span>
                  <span className="text-[9px] text-slate-300">·</span>
                  <span className={`text-[9px] font-semibold ${LEGAL_STYLES[a.legal_review_status]}`}>
                    {a.legal_review_status?.replace(/_/g,' ')}
                  </span>
                </div>
              </div>

              {/* Amount */}
              <div className="text-right flex-shrink-0 min-w-[80px]">
                <p className="text-xs font-bold text-slate-900 font-mono">{fmt(a.financial_amount)}</p>
                {diff !== null && (
                  <p className={`text-[9px] font-mono ${diff > 0 ? 'text-red-500' : diff < 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {diff >= 0 ? '+' : ''}{fmt(diff)}
                  </p>
                )}
              </div>

              {/* Status badge */}
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${STATUS_STYLES[a.status] || STATUS_STYLES.draft}`}>
                {a.status?.replace(/_/g,' ')}
              </span>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => onEdit(a)} className="p-1 text-slate-400 hover:text-slate-800 transition-colors rounded">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => onDelete(a)} className="p-1 text-slate-300 hover:text-red-500 transition-colors rounded">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Inline error */}
            {errs.length > 0 && (
              <div className="px-3 pb-2">
                {errs.slice(0, 1).map((e, i) => (
                  <p key={i} className="text-[10px] text-red-600 flex items-center gap-1">
                    <AlertTriangle className="h-2.5 w-2.5 flex-shrink-0" /> {e.msg}
                  </p>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}