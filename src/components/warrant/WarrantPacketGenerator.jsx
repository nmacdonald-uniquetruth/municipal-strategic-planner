/**
 * WarrantPacketGenerator — Full-warrant text preview and export in 3 modes.
 * Modes: legal draft, board presentation, public summary
 */
import React, { useState } from 'react';
import { ARTICLE_CATEGORIES, VOTING_LABELS } from './warrantEngine';
import { Download, Printer } from 'lucide-react';

const fmt = n => n == null ? '—' : `$${Math.round(Math.abs(n || 0)).toLocaleString()}`;

const MODES = [
  { id: 'legal',  label: 'Full Legal Draft',      desc: '30-A M.R.S.A. compliant article language for posting and town meeting.' },
  { id: 'board',  label: 'Board Presentation',     desc: 'Concise version for Select Board / Budget Committee sessions.' },
  { id: 'public', label: 'Public Summary',          desc: 'Plain-language packet for residents, website, and newsletter.' },
];

function ArticleBlock({ article, mode }) {
  const cat = ARTICLE_CATEGORIES[article.category];
  const getText = () => {
    if (mode === 'public') return article.public_text || article.draft_text || '[No public text — generate in article editor]';
    if (mode === 'board')  return article.board_text  || article.draft_text || '[No board text — generate in article editor]';
    return article.draft_text || '[No legal draft text — generate in article editor]';
  };
  const hasPublicExplainer = mode === 'public' && (article.pub_purpose || article.pub_key_change || article.pub_tax_impact);

  return (
    <div className="pb-6 border-b border-slate-100 last:border-0">
      <div className="flex items-start gap-3 mb-2">
        <div className="h-2.5 w-2.5 rounded-full mt-1 flex-shrink-0" style={{ background: cat?.color || '#888' }} />
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-slate-900">{article.article_number} — {article.title}</p>
            {(article.financial_amount || 0) > 0 && (
              <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">{fmt(article.financial_amount)}</span>
            )}
            {article.prior_year_amount > 0 && (
              <span className="text-[9px] text-slate-400">Prior: {fmt(article.prior_year_amount)}</span>
            )}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">{cat?.label} · {VOTING_LABELS[article.voting_method] || article.voting_method}</p>
        </div>
        {article.legal_review_status === 'approved' && (
          <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold flex-shrink-0">Legal Approved</span>
        )}
        {article.text_frozen && (
          <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-semibold flex-shrink-0">Frozen</span>
        )}
      </div>

      <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap pl-5">{getText()}</p>

      {article.tax_impact_note && (
        <p className="text-[10px] text-slate-500 mt-1.5 pl-5 italic">Tax impact: {article.tax_impact_note}</p>
      )}

      {hasPublicExplainer && mode === 'public' && (
        <div className="mt-3 pl-5 space-y-1.5">
          {article.pub_purpose    && <p className="text-[10px] text-slate-600"><strong>Purpose:</strong> {article.pub_purpose}</p>}
          {article.pub_key_change && <p className="text-[10px] text-slate-600"><strong>Key change:</strong> {article.pub_key_change}</p>}
          {article.pub_tax_impact && <p className="text-[10px] text-slate-600"><strong>Tax impact:</strong> {article.pub_tax_impact}</p>}
          {article.pub_recurring === false && (
            <p className="text-[10px] text-amber-700 font-semibold">⚠ One-time expenditure — not expected to recur.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function WarrantPacketGenerator({ articles, fiscalYear, calc }) {
  const [mode, setMode] = useState('legal');
  const sorted = [...articles].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  const currentMode = MODES.find(m => m.id === mode);

  const handlePrint = () => window.print();

  const handleExportText = () => {
    const lines = [`TOWN OF MACHIAS, MAINE\nANNUAL TOWN MEETING WARRANT — ${fiscalYear}\n${'='.repeat(60)}\n`];
    sorted.forEach(a => {
      const txt = mode === 'public' ? a.public_text : mode === 'board' ? a.board_text : a.draft_text;
      lines.push(`${a.article_number} — ${a.title}`);
      if (a.financial_amount) lines.push(`Amount: ${fmt(a.financial_amount)}`);
      if (txt) lines.push(txt);
      if (mode === 'public' && a.pub_purpose)    lines.push(`Purpose: ${a.pub_purpose}`);
      if (mode === 'public' && a.pub_key_change) lines.push(`Key change: ${a.pub_key_change}`);
      lines.push('');
    });
    if (calc) {
      lines.push('─'.repeat(40));
      lines.push(`Total Appropriations: ${fmt(calc.totalAppropriations)}`);
      lines.push(`Total Deductions:     ${fmt(calc.totalDeductions)}`);
      lines.push(`Net to Be Raised:     ${fmt(calc.netToBeRaised)}`);
      lines.push(`Mill Rate:            ${(calc.selectedMillRate || 0).toFixed(3)} mills`);
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `warrant_${fiscalYear}_${mode}.txt`; a.click();
  };

  return (
    <div className="space-y-4">
      {/* Mode selector */}
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex gap-1.5">
          {MODES.map(m => (
            <button key={m.id} onClick={() => setMode(m.id)}
              className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-colors ${mode === m.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {m.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportText}
            className="flex items-center gap-1.5 text-xs font-semibold border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg hover:border-slate-400 transition-colors">
            <Download className="h-3.5 w-3.5" /> Export .txt
          </button>
          <button onClick={handlePrint}
            className="flex items-center gap-1.5 text-xs font-semibold border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg hover:border-slate-400 transition-colors">
            <Printer className="h-3.5 w-3.5" /> Print
          </button>
        </div>
      </div>

      {/* Mode description */}
      <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5">
        <p className="text-[10px] text-slate-500"><strong className="text-slate-700">{currentMode.label}:</strong> {currentMode.desc}</p>
      </div>

      {/* Packet body */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 max-h-[70vh] overflow-y-auto space-y-2">
        {/* Cover */}
        <div className="text-center pb-6 border-b border-slate-200 mb-6">
          <p className="text-base font-bold text-slate-900 tracking-wide">TOWN OF MACHIAS, MAINE</p>
          <p className="text-sm text-slate-700 mt-1">ANNUAL TOWN MEETING WARRANT</p>
          <p className="text-xs text-slate-500 mt-1 font-mono">{fiscalYear}</p>
          {mode === 'legal' && (
            <p className="text-[10px] text-slate-400 mt-2 max-w-md mx-auto">
              Pursuant to 30-A M.R.S.A. § 2522, the inhabitants of the Town of Machias qualified to vote in Town affairs are hereby notified to meet as set forth in Article 1 below.
            </p>
          )}
        </div>
        {sorted.map((a, i) => <ArticleBlock key={a.id || i} article={a} mode={mode} />)}
        {/* Financial footer */}
        {calc && (
          <div className="mt-6 pt-4 border-t border-slate-200">
            <p className="text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-2">Budget Summary</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                ['Total Appropriations', fmt(calc.totalAppropriations)],
                ['Total Deductions', fmt(calc.totalDeductions)],
                ['Net to Be Raised through Taxation', fmt(calc.netToBeRaised)],
                ['Adopted Mill Rate', `${(calc.selectedMillRate || 0).toFixed(3)} mills per $1,000`],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between border-b border-slate-100 pb-1">
                  <span className="text-slate-600">{l}</span>
                  <span className="font-mono font-semibold text-slate-900">{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <p className="text-[9px] text-slate-400 text-center italic">
        All warrant text should be reviewed by municipal counsel prior to posting. Article amounts remain editable until text is frozen.
      </p>
    </div>
  );
}