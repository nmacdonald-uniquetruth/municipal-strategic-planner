/**
 * WarrantPacketGenerator — Warrant Packet & Public Hearing Support
 *
 * Modes:
 *  legal    — Full 30-A M.R.S.A. warrant language
 *  board    — Technical board/budget committee packet with financial backup
 *  hearing  — Public hearing narrative with full explanations
 *  public   — Plain-language resident summary
 *
 * Views (sub-tabs):
 *  articles  — Article-by-article cards
 *  summary   — Category summary pages (municipal, education, county, TIF, deductions, net)
 */
import React, { useState } from 'react';
import { ARTICLE_CATEGORIES, VOTING_LABELS } from './warrantEngine';
import PacketArticleCard from './PacketArticleCard';
import PacketSummaryPages from './PacketSummaryPages';
import { Download, Printer, FileText, BarChart2 } from 'lucide-react';

const fmt = n => (n == null) ? '—' : `$${Math.round(Math.abs(n || 0)).toLocaleString()}`;

const MODES = [
  {
    id: 'legal',
    label: 'Full Legal Draft',
    badge: null,
    desc: '30-A M.R.S.A. compliant article language for posting and town meeting.',
  },
  {
    id: 'board',
    label: 'Board Packet',
    badge: 'Technical',
    desc: 'Detailed Select Board / Budget Committee packet with financial comparison and staff notes.',
  },
  {
    id: 'hearing',
    label: 'Public Hearing',
    badge: 'Narrative',
    desc: 'Full narrative version for public hearing sessions — includes purpose, change rationale, and tax relevance for each article.',
  },
  {
    id: 'public',
    label: 'Public Summary',
    badge: 'Plain language',
    desc: 'Concise plain-language packet for residents, town website, and newsletter.',
  },
];

// ── Export helpers ────────────────────────────────────────────────────────────
function buildExportText(articles, calc, mode, fiscalYear) {
  const sorted = [...articles].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  const lines = [
    `TOWN OF MACHIAS, MAINE`,
    `ANNUAL TOWN MEETING WARRANT — ${fiscalYear}`,
    `Mode: ${MODES.find(m => m.id === mode)?.label || mode}`,
    '='.repeat(60),
    '',
  ];

  sorted.forEach(a => {
    const txt = mode === 'public' || mode === 'hearing' ? a.public_text : mode === 'board' ? a.board_text : a.draft_text;
    lines.push(`${a.article_number} — ${a.title}`);
    if (a.financial_amount) lines.push(`  Proposed: ${fmt(a.financial_amount)}`);
    if (a.prior_year_amount) {
      const d = (a.financial_amount || 0) - a.prior_year_amount;
      const p = a.prior_year_amount ? ((d / Math.abs(a.prior_year_amount)) * 100).toFixed(1) : null;
      lines.push(`  Prior Year: ${fmt(a.prior_year_amount)}  |  Change: ${d >= 0 ? '+' : ''}${fmt(d)}${p ? ` (${p}%)` : ''}`);
    }
    if (txt) lines.push(`  ${txt.replace(/\n/g, '\n  ')}`);
    if ((mode === 'public' || mode === 'hearing') && a.pub_purpose)    lines.push(`  Purpose: ${a.pub_purpose}`);
    if ((mode === 'public' || mode === 'hearing') && a.pub_key_change) lines.push(`  Key change: ${a.pub_key_change}`);
    if ((mode === 'public' || mode === 'hearing') && (a.pub_tax_impact || a.tax_impact_note)) lines.push(`  Tax relevance: ${a.pub_tax_impact || a.tax_impact_note}`);
    if (mode === 'board' && a.explanatory_notes) lines.push(`  Notes: ${a.explanatory_notes}`);
    lines.push('');
  });

  if (calc) {
    lines.push('─'.repeat(40));
    lines.push('BUDGET SUMMARY');
    lines.push(`Total Appropriations:    ${fmt(calc.totalAppropriations)}`);
    lines.push(`Total Deductions:        ${fmt(calc.totalDeductions)}`);
    lines.push(`Net to Be Raised:        ${fmt(calc.netToBeRaised)}`);
    lines.push(`Mill Rate:               ${(calc.selectedMillRate || 0).toFixed(3)} mills per $1,000`);
    if (calc.taxForCommitment) lines.push(`Tax for Commitment:      ${fmt(calc.taxForCommitment)}`);
  }

  return lines.join('\n');
}

// ── Cover page ────────────────────────────────────────────────────────────────
function PacketCover({ mode, fiscalYear, articles, calc }) {
  const modeInfo = MODES.find(m => m.id === mode);
  const totalArticles = articles.length;
  const totalApprop = calc?.totalAppropriations || 0;
  const netRaised  = calc?.netToBeRaised || 0;
  const millRate   = calc?.selectedMillRate || 0;

  const modeDescriptions = {
    legal:   'This document contains the full legal text of each warrant article pursuant to 30-A M.R.S.A. § 2522 and related statutes.',
    board:   'This packet is prepared for Select Board and Budget Committee review. It contains article text, year-over-year financial comparisons, department notes, and BETE line references.',
    hearing: 'This document is prepared for the annual public hearing on the municipal budget. Each article includes a plain-language explanation, description of key changes from the prior year, and tax relevance.',
    public:  'This is the plain-language resident budget summary for the Town of Machias. It is intended to help voters understand the warrant articles before the annual town meeting.',
  };

  return (
    <div className="text-center pb-8 border-b-2 border-slate-300 mb-8 space-y-2">
      <p className="text-lg font-bold tracking-widest text-slate-900 uppercase">Town of Machias, Maine</p>
      <p className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Annual Town Meeting Warrant</p>
      <p className="text-xs text-slate-500 font-mono">{fiscalYear}</p>
      {modeInfo?.badge && (
        <span className="inline-block text-[10px] font-bold px-3 py-1 rounded-full bg-slate-900 text-white uppercase tracking-wider mt-1">{modeInfo.badge} Version</span>
      )}
      <p className="text-[10px] text-slate-400 max-w-xl mx-auto mt-3 leading-relaxed">{modeDescriptions[mode]}</p>
      {/* Summary stats */}
      <div className="flex justify-center gap-6 mt-4 flex-wrap">
        {[
          { label: 'Articles', value: totalArticles },
          { label: 'Total Appropriations', value: fmt(totalApprop) },
          { label: 'Net to Be Raised', value: fmt(netRaised) },
          { label: 'Mill Rate', value: `${millRate.toFixed(3)} mills` },
        ].map(s => (
          <div key={s.label} className="text-center">
            <p className="text-sm font-bold text-slate-900">{s.value}</p>
            <p className="text-[9px] text-slate-400 uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function WarrantPacketGenerator({ articles, fiscalYear, calc }) {
  const [mode, setMode]   = useState('legal');
  const [view, setView]   = useState('articles'); // articles | summary

  const sorted = [...articles].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  const currentMode = MODES.find(m => m.id === mode);

  const handleExportText = () => {
    const text = buildExportText(articles, calc, mode, fiscalYear);
    const blob = new Blob([text], { type: 'text/plain' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `warrant_${fiscalYear}_${mode}.txt`; a.click();
  };

  return (
    <div className="space-y-4">
      {/* Mode selector */}
      <div className="flex flex-wrap gap-1.5 items-center justify-between">
        <div className="flex gap-1.5 flex-wrap">
          {MODES.map(m => (
            <button key={m.id} onClick={() => setMode(m.id)}
              className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-colors border ${mode === m.id ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400 hover:text-slate-700'}`}>
              {m.label}
              {m.badge && <span className={`ml-1.5 text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase ${mode === m.id ? 'bg-white/20' : 'bg-slate-100'}`}>{m.badge}</span>}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportText}
            className="flex items-center gap-1.5 text-xs font-semibold border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg hover:border-slate-400 transition-colors">
            <Download className="h-3.5 w-3.5" /> Export .txt
          </button>
          <button onClick={() => window.print()}
            className="flex items-center gap-1.5 text-xs font-semibold border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg hover:border-slate-400 transition-colors">
            <Printer className="h-3.5 w-3.5" /> Print
          </button>
        </div>
      </div>

      {/* Mode description */}
      <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5">
        <p className="text-[10px] text-slate-500"><strong className="text-slate-700">{currentMode.label}:</strong> {currentMode.desc}</p>
      </div>

      {/* View sub-tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {[
          { id: 'articles', label: 'Articles', icon: FileText },
          { id: 'summary',  label: 'Budget Summary Pages', icon: BarChart2 },
        ].map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setView(id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border-b-2 transition-colors ${view === id ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-700'}`}>
            <Icon className="h-3.5 w-3.5" /> {label}
          </button>
        ))}
      </div>

      {/* Packet body */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 max-h-[72vh] overflow-y-auto">
        <PacketCover mode={mode} fiscalYear={fiscalYear} articles={articles} calc={calc} />

        {view === 'articles' && (
          <div className="space-y-4">
            {sorted.map((a, i) => (
              <PacketArticleCard key={a.id || i} article={a} mode={mode} index={i} />
            ))}

            {/* Financial footer */}
            {calc && (
              <div className="mt-6 pt-4 border-t border-slate-200 space-y-1">
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-2">Budget Totals</p>
                {[
                  ['Municipal Appropriations', fmt(calc.municipalAppropriations)],
                  ['School Appropriations',    fmt(calc.schoolAppropriations)],
                  ['County Assessment',        fmt(calc.countyAssessment)],
                  ['Total Appropriations',     fmt(calc.totalAppropriations), true],
                  ['Total Deductions',         fmt(calc.totalDeductions), false, true],
                  ['Net to Be Raised',         fmt(calc.netToBeRaised), true],
                  ['Mill Rate',                `${(calc.selectedMillRate || 0).toFixed(3)} mills per $1,000`, true],
                ].map(([l, v, bold, green]) => (
                  <div key={l} className={`flex justify-between border-b border-slate-100 pb-1 ${bold ? 'pt-1' : ''}`}>
                    <span className={`text-xs ${bold ? 'font-bold text-slate-900' : 'text-slate-600'}`}>{l}</span>
                    <span className={`font-mono text-xs ${bold ? 'font-bold text-slate-900' : ''} ${green ? 'text-emerald-600' : ''}`}>{v}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {view === 'summary' && (
          <PacketSummaryPages articles={articles} calc={calc} mode={mode} />
        )}
      </div>

      <p className="text-[9px] text-slate-400 text-center italic">
        All warrant text should be reviewed by municipal counsel prior to posting. Article amounts remain editable until text is frozen.
        Consistent with adopted article numbering from the Warrant Builder.
      </p>
    </div>
  );
}