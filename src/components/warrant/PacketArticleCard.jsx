/**
 * PacketArticleCard — Single article block for the warrant packet.
 * Shows proposed/prior/delta, text, and mode-specific explainer fields.
 */
import React from 'react';
import { ARTICLE_CATEGORIES, VOTING_LABELS } from './warrantEngine';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const fmt = n => (n == null || n === 0) ? '—' : `$${Math.round(Math.abs(n)).toLocaleString()}`;
const pct = (cur, prior) => prior ? (((cur - prior) / Math.abs(prior)) * 100).toFixed(1) : null;

export default function PacketArticleCard({ article, mode, index }) {
  const cat = ARTICLE_CATEGORIES[article.category];
  const cur   = article.financial_amount || 0;
  const prior = article.prior_year_amount || 0;
  const delta = cur - prior;
  const deltaPct = pct(cur, prior);
  const hasDelta = prior > 0 && cur > 0;

  const getText = () => {
    if (mode === 'public')  return article.public_text  || article.draft_text  || null;
    if (mode === 'board')   return article.board_text   || article.draft_text  || null;
    if (mode === 'hearing') return article.public_text  || article.draft_text  || null;
    return article.draft_text || null;
  };
  const text = getText();

  const DeltaIcon = !hasDelta ? null : delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
  const deltaColor = delta > 0 ? 'text-red-600' : delta < 0 ? 'text-emerald-600' : 'text-slate-400';

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
      {/* Header bar */}
      <div className="px-4 py-2.5 flex items-center gap-3" style={{ borderLeft: `4px solid ${cat?.color || '#888'}`, background: '#f8f9fa' }}>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-900 leading-tight">
            {article.article_number} — {article.title}
          </p>
          <p className="text-[9px] text-slate-400 mt-0.5 uppercase tracking-wider">
            {cat?.label} · {VOTING_LABELS[article.voting_method] || article.voting_method}
            {article.legal_review_status === 'approved' && <span className="ml-2 text-emerald-600">✓ Legal Approved</span>}
            {article.text_frozen && <span className="ml-2 text-amber-600">🔒 Frozen</span>}
          </p>
        </div>
        {/* Financial delta badge */}
        {cur > 0 && (
          <div className="text-right flex-shrink-0">
            <p className="text-sm font-bold font-mono text-slate-900">{fmt(cur)}</p>
            {hasDelta && (
              <div className={`flex items-center justify-end gap-1 text-[10px] font-semibold ${deltaColor}`}>
                {DeltaIcon && <DeltaIcon className="h-3 w-3" />}
                <span>{delta > 0 ? '+' : ''}{fmt(delta)}{deltaPct ? ` (${deltaPct}%)` : ''}</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="px-4 py-3 space-y-3">
        {/* Financial comparison row */}
        {(mode === 'board' || mode === 'hearing') && cur > 0 && (
          <div className="grid grid-cols-3 gap-2 bg-slate-50 rounded-lg px-3 py-2">
            <div>
              <p className="text-[9px] text-slate-400 uppercase tracking-wider">Proposed</p>
              <p className="text-xs font-bold font-mono text-slate-900">{fmt(cur)}</p>
            </div>
            <div>
              <p className="text-[9px] text-slate-400 uppercase tracking-wider">Prior Year</p>
              <p className="text-xs font-mono text-slate-600">{fmt(prior || null)}</p>
            </div>
            <div>
              <p className="text-[9px] text-slate-400 uppercase tracking-wider">Change</p>
              <p className={`text-xs font-semibold font-mono ${hasDelta ? deltaColor : 'text-slate-400'}`}>
                {hasDelta ? `${delta > 0 ? '+' : ''}${fmt(delta)} (${deltaPct}%)` : '—'}
              </p>
            </div>
          </div>
        )}

        {/* Article text */}
        {text && (
          <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{text}</p>
        )}

        {/* Public/Hearing explainer fields */}
        {(mode === 'public' || mode === 'hearing') && (
          <div className="space-y-1.5 border-t border-slate-100 pt-2">
            {article.pub_purpose    && <p className="text-[10px] text-slate-600"><span className="font-semibold">Purpose: </span>{article.pub_purpose}</p>}
            {article.pub_key_change && <p className="text-[10px] text-slate-600"><span className="font-semibold">Key change: </span>{article.pub_key_change}</p>}
            {(article.pub_tax_impact || article.tax_impact_note) && (
              <p className="text-[10px] text-slate-600"><span className="font-semibold">Tax relevance: </span>{article.pub_tax_impact || article.tax_impact_note}</p>
            )}
            {article.pub_recurring === false && (
              <p className="text-[10px] text-amber-700 font-semibold bg-amber-50 rounded px-2 py-1">⚠ One-time expenditure — not expected to recur in future years.</p>
            )}
          </div>
        )}

        {/* Board: technical backup */}
        {mode === 'board' && (article.explanatory_notes || article.linked_departments?.length > 0) && (
          <div className="border-t border-slate-100 pt-2 space-y-1">
            {article.linked_departments?.length > 0 && (
              <p className="text-[10px] text-slate-500"><span className="font-semibold">Departments: </span>{article.linked_departments.join(', ')}</p>
            )}
            {article.explanatory_notes && (
              <p className="text-[10px] text-slate-500"><span className="font-semibold">Staff notes: </span>{article.explanatory_notes}</p>
            )}
            {article.bete_mapping && (
              <p className="text-[10px] text-slate-400 font-mono">BETE: {article.bete_mapping}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}