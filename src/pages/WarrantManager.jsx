/**
 * WarrantManager — Town Meeting Warrant & Article Management Engine
 *
 * Tabs:
 *  1. Articles      — list, add, edit, reorder
 *  2. Rollup        — article totals vs. BETE form
 *  3. Validation    — errors, warnings, gap detection
 *  4. Draft Packet  — full warrant text preview (board / public)
 */

import React, { useState, useMemo, useCallback } from 'react';
import { useModel } from '../components/machias/ModelContext';
import { calculateTaxCommitment } from '../components/budget/budgetEngine';
import { validateArticles, buildArticleRollup, findNumberingGaps, generateDraftText, generatePublicText, generateBoardText, ARTICLE_CATEGORIES, VOTING_LABELS } from '../components/warrant/warrantEngine';
import ArticleList from '../components/warrant/ArticleList';
import ArticleForm from '../components/warrant/ArticleForm';
import ArticleRollupPanel from '../components/warrant/ArticleRollupPanel';
import WarrantValidationPanel from '../components/warrant/WarrantValidationPanel';
import SectionHeader from '../components/machias/SectionHeader';
import { Scroll, Plus, AlertTriangle, FileText, CheckCircle, BarChart2 } from 'lucide-react';

const fmt = n => `$${Math.round(Math.abs(n || 0)).toLocaleString()}`;

// ── Seed articles from budget model defaults ───────────────────────────────────
function buildSeedArticles(settings) {
  const enterpriseOffsets = (settings.ambulance_transfer || 45000) + (settings.sewer_transfer || 21110) + (settings.ts_transfer || 21000) + (settings.telebusiness_transfer || 18525) + (settings.court_st_transfer || 15600);
  return [
    { id: 's1', fiscal_year: 'FY2027', article_number: 'Article 1', sort_order: 1, title: 'Fix Time and Place', category: 'other', legal_type: 'information', voting_method: 'n_a', financial_amount: 0, status: 'draft', legal_review_status: 'not_reviewed', text_frozen: false, draft_text: 'To fix a time and place for the next annual town meeting.', explanatory_notes: '' },
    { id: 's2', fiscal_year: 'FY2027', article_number: 'Article 2', sort_order: 2, title: 'Elect Town Officers', category: 'policy_authorization', legal_type: 'authorization', voting_method: 'secret_ballot', financial_amount: 0, status: 'draft', legal_review_status: 'not_reviewed', text_frozen: false, draft_text: 'To elect all necessary town officers for the ensuing year.', explanatory_notes: '' },
    { id: 's3', fiscal_year: 'FY2027', article_number: 'Article 3', sort_order: 3, title: 'County Assessment', category: 'county_assessment', legal_type: 'assessment', voting_method: 'majority_voice', financial_amount: 285000, prior_year_amount: 278000, status: 'draft', legal_review_status: 'not_reviewed', text_frozen: false, bete_mapping: 'countyAssessment', tax_impact_note: '', explanatory_notes: 'Washington County apportionment.', draft_text: '' },
    { id: 's4', fiscal_year: 'FY2027', article_number: 'Article 4', sort_order: 4, title: 'Administration & General Government', category: 'municipal_appropriation', legal_type: 'appropriation', voting_method: 'majority_voice', financial_amount: 745500, prior_year_amount: 710000, status: 'draft', legal_review_status: 'not_reviewed', text_frozen: false, bete_mapping: 'municipalAppropriations', explanatory_notes: 'Includes Town Manager, Finance Director, and new Staff Accountant position.', draft_text: '' },
    { id: 's5', fiscal_year: 'FY2027', article_number: 'Article 5', sort_order: 5, title: 'Police Department', category: 'municipal_appropriation', legal_type: 'appropriation', voting_method: 'majority_voice', financial_amount: 435000, prior_year_amount: 420000, status: 'draft', legal_review_status: 'not_reviewed', text_frozen: false, bete_mapping: 'municipalAppropriations', explanatory_notes: 'Police Chief and patrol staff.', draft_text: '' },
    { id: 's6', fiscal_year: 'FY2027', article_number: 'Article 6', sort_order: 6, title: 'Fire Department', category: 'municipal_appropriation', legal_type: 'appropriation', voting_method: 'majority_voice', financial_amount: 98000, prior_year_amount: 95000, status: 'draft', legal_review_status: 'not_reviewed', text_frozen: false, bete_mapping: 'municipalAppropriations', explanatory_notes: '', draft_text: '' },
    { id: 's7', fiscal_year: 'FY2027', article_number: 'Article 7', sort_order: 7, title: 'Ambulance Service (Enterprise)', category: 'enterprise_appropriation', legal_type: 'appropriation', voting_method: 'majority_voice', financial_amount: 498000, prior_year_amount: 480000, status: 'draft', legal_review_status: 'not_reviewed', text_frozen: false, bete_mapping: 'enterpriseOffsets', explanatory_notes: 'Funded by enterprise revenues; transfer to GF: ' + fmt(enterpriseOffsets), draft_text: '' },
    { id: 's8', fiscal_year: 'FY2027', article_number: 'Article 8', sort_order: 8, title: 'Public Works', category: 'municipal_appropriation', legal_type: 'appropriation', voting_method: 'majority_voice', financial_amount: 392000, prior_year_amount: 380000, status: 'draft', legal_review_status: 'not_reviewed', text_frozen: false, bete_mapping: 'municipalAppropriations', explanatory_notes: '', draft_text: '' },
    { id: 's9', fiscal_year: 'FY2027', article_number: 'Article 9', sort_order: 9, title: 'Accept Local Revenues', category: 'revenue', legal_type: 'authorization', voting_method: 'majority_voice', financial_amount: 485000, prior_year_amount: 460000, status: 'draft', legal_review_status: 'not_reviewed', text_frozen: false, bete_mapping: 'localRevenues', explanatory_notes: 'Excise tax, fees, State Revenue Sharing, grants.', draft_text: '' },
    { id: 's10', fiscal_year: 'FY2027', article_number: 'Article 10', sort_order: 10, title: 'School Appropriation (RSU)', category: 'school_appropriation', legal_type: 'appropriation', voting_method: 'majority_voice', financial_amount: 1950000, prior_year_amount: 1880000, status: 'draft', legal_review_status: 'not_reviewed', text_frozen: false, bete_mapping: 'schoolAppropriations', explanatory_notes: "Town's local share of RSU assessment.", draft_text: '' },
  ];
}

const TABS = [
  { id: 'articles',   label: 'Articles',     icon: Scroll },
  { id: 'rollup',     label: 'Rollup',        icon: BarChart2 },
  { id: 'validation', label: 'Validation',    icon: AlertTriangle },
  { id: 'packet',     label: 'Draft Packet',  icon: FileText },
];

// ── Draft Packet view ─────────────────────────────────────────────────────────
function DraftPacket({ articles, mode }) {
  const sorted = [...articles].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  const getText = a => {
    if (mode === 'public') return a.public_text || a.draft_text || '[No text generated]';
    if (mode === 'board') return a.board_text || a.draft_text || '[No text generated]';
    return a.draft_text || '[No draft text — click Generate in the article editor]';
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-amber-50/30 px-4 py-3">
        <p className="text-[10px] text-slate-500">
          <strong className="text-slate-700">Draft Warrant Packet</strong> — {mode === 'board' ? 'Select Board / Budget Committee version' : mode === 'public' ? 'Public / plain-language version' : 'Full legal draft'}.
          Click "Generate Text" in any article editor to populate article language from budget data.
        </p>
      </div>
      <div className="text-center py-4 border-b border-slate-200">
        <p className="text-base font-bold text-slate-900">TOWN OF MACHIAS, MAINE</p>
        <p className="text-sm text-slate-700 mt-1">ANNUAL TOWN MEETING WARRANT</p>
        <p className="text-xs text-slate-500 mt-1">{articles[0]?.fiscal_year || 'FY2027'}</p>
      </div>
      <div className="space-y-5">
        {sorted.map((a, i) => {
          const cat = ARTICLE_CATEGORIES[a.category];
          return (
            <div key={a.id || i} className="border-b border-slate-100 pb-5 last:border-0">
              <div className="flex items-start gap-3 mb-2">
                <div className="h-2 w-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: cat?.color || '#888' }} />
                <div>
                  <p className="text-sm font-bold text-slate-900">{a.article_number}</p>
                  <p className="text-[10px] text-slate-400">{cat?.label} · {VOTING_LABELS[a.voting_method]}</p>
                </div>
                {(a.financial_amount || 0) > 0 && (
                  <span className="ml-auto text-sm font-bold text-slate-900 font-mono flex-shrink-0">{fmt(a.financial_amount)}</span>
                )}
              </div>
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap pl-5">{getText(a)}</p>
              {a.tax_impact_note && (
                <p className="text-[10px] text-slate-500 mt-1 pl-5 italic">Tax impact: {a.tax_impact_note}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function WarrantManager() {
  const { settings } = useModel();
  const [articles, setArticles] = useState(() => buildSeedArticles(settings));
  const [editingArticle, setEditingArticle] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [activeTab, setActiveTab] = useState('articles');
  const [packetMode, setPacketMode] = useState('legal');
  const [fiscalYear, setFiscalYear] = useState('FY2027');

  // Derive BETE calc from model settings for cross-check
  const calc = useMemo(() => calculateTaxCommitment({
    municipalAppropriations: settings.annual_tax_levy ? Math.round(settings.annual_tax_levy * 1.35) : 3880000,
    schoolAppropriations: 1950000,
    countyAssessment: 285000,
    enterpriseOffsets: (settings.ambulance_transfer || 45000) + (settings.sewer_transfer || 21110) + (settings.ts_transfer || 21000) + (settings.telebusiness_transfer || 18525) + (settings.court_st_transfer || 15600),
    stateRevenueSharing: 165000,
    localRevenues: 320000,
    totalAssessedValue: settings.total_assessed_value || 198000000,
    overlayPercent: 1.0,
  }), [settings]);

  const validation = useMemo(() => validateArticles(articles, calc), [articles, calc]);
  const gaps = useMemo(() => findNumberingGaps(articles), [articles]);

  const errorCount = validation.errors.length;
  const warnCount = validation.warnings.length;
  const issueCount = errorCount + warnCount + gaps.length;

  // All validation errors for ArticleList inline badges
  const allErrors = [...validation.errors, ...validation.warnings];

  const handleSave = useCallback((form) => {
    if (editingArticle) {
      setArticles(prev => prev.map(a => a.id === editingArticle.id ? { ...a, ...form } : a));
    } else {
      setArticles(prev => [...prev, { ...form, id: `art_${Date.now()}` }]);
    }
    setEditingArticle(null);
    setIsAdding(false);
  }, [editingArticle]);

  const handleDelete = useCallback((a) => {
    if (window.confirm(`Delete "${a.title}"?`)) {
      setArticles(prev => prev.filter(x => x.id !== a.id));
    }
  }, []);

  const handleReorder = useCallback((a, dir) => {
    setArticles(prev => {
      const sorted = [...prev].sort((x, y) => (x.sort_order || 0) - (y.sort_order || 0));
      const idx = sorted.findIndex(x => x.id === a.id);
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= sorted.length) return prev;
      const updated = sorted.map((x, i) => ({ ...x, sort_order: i }));
      const tmp = updated[idx].sort_order;
      updated[idx].sort_order = updated[newIdx].sort_order;
      updated[newIdx].sort_order = tmp;
      return updated;
    });
  }, []);

  const rollup = useMemo(() => buildArticleRollup(articles), [articles]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <SectionHeader
          title="Warrant & Article Manager"
          subtitle={`${fiscalYear} — Town meeting warrant structure, article text, and BETE reconciliation`}
          icon={Scroll}
        />
        <div className="flex items-center gap-2">
          <select value={fiscalYear} onChange={e => setFiscalYear(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-400">
            {['FY2025','FY2026','FY2027','FY2028','FY2029'].map(fy => <option key={fy} value={fy}>{fy}</option>)}
          </select>
          {issueCount > 0 && (
            <button onClick={() => setActiveTab('validation')}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border ${errorCount > 0 ? 'border-red-200 bg-red-50 text-red-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
              <AlertTriangle className="h-3.5 w-3.5" />
              {issueCount} issue{issueCount !== 1 ? 's' : ''}
            </button>
          )}
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {[
          { label: 'Articles', value: articles.length, sub: 'total', color: 'text-slate-900' },
          { label: 'Appropriations', value: fmt(rollup.totalAppropriations), sub: 'articles total', color: 'text-slate-900' },
          { label: 'Deductions', value: fmt(rollup.totalDeductions), sub: 'article rollup', color: 'text-emerald-700' },
          { label: 'Net Raised', value: fmt(rollup.netToBeRaised), sub: 'from articles', color: 'text-slate-900' },
          {
            label: 'Validation',
            value: issueCount === 0 ? '✓ Clean' : `${issueCount} issue${issueCount !== 1 ? 's' : ''}`,
            sub: issueCount === 0 ? 'all articles valid' : `${errorCount} error${errorCount !== 1 ? 's' : ''}, ${warnCount} warning${warnCount !== 1 ? 's' : ''}`,
            color: issueCount === 0 ? 'text-emerald-700' : errorCount > 0 ? 'text-red-700' : 'text-amber-700',
          },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-3">
            <p className={`text-base font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] font-medium text-slate-600 mt-0.5">{s.label}</p>
            <p className="text-[9px] text-slate-400">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 overflow-x-auto">
        {TABS.map(({ id, label, icon: TabIcon }) => {
          const hasIssue = id === 'validation' && issueCount > 0;
          return (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${
                activeTab === id ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}>
              <TabIcon className="h-3.5 w-3.5 flex-shrink-0" />
              {label}
              {hasIssue && (
                <span className={`ml-1 text-[9px] px-1.5 py-0.5 rounded-full font-bold ${errorCount > 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                  {issueCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Articles tab ── */}
      {activeTab === 'articles' && (
        <div className="space-y-4">
          {(isAdding || editingArticle) ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-bold text-slate-700 mb-4">{editingArticle ? `Editing ${editingArticle.article_number}` : 'New Article'}</p>
              <ArticleForm
                article={editingArticle}
                onSave={handleSave}
                onCancel={() => { setEditingArticle(null); setIsAdding(false); }}
                calc={calc}
              />
            </div>
          ) : (
            <button onClick={() => setIsAdding(true)}
              className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-dashed border-slate-300 hover:border-slate-500 rounded-xl px-4 py-2.5 w-full justify-center transition-colors">
              <Plus className="h-4 w-4" /> New Article
            </button>
          )}
          {!isAdding && !editingArticle && (
            <ArticleList
              articles={articles}
              articleErrors={allErrors}
              onEdit={a => { setEditingArticle(a); setIsAdding(false); }}
              onDelete={handleDelete}
              onReorder={handleReorder}
            />
          )}
        </div>
      )}

      {/* ── Rollup tab ── */}
      {activeTab === 'rollup' && (
        <div className="space-y-4">
          <ArticleRollupPanel articles={articles} calc={calc} />
          {/* Per-category summary */}
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white px-4 py-2 grid grid-cols-4 text-[10px] font-bold uppercase tracking-wider">
              <span>Category</span><span className="text-right">Articles</span><span className="text-right">Amount</span><span className="text-right">% of Total</span>
            </div>
            {Object.entries(
              articles.reduce((acc, a) => {
                const key = a.category;
                if (!acc[key]) acc[key] = { count: 0, total: 0 };
                acc[key].count++;
                acc[key].total += a.financial_amount || 0;
                return acc;
              }, {})
            ).sort((a, b) => b[1].total - a[1].total).map(([cat, d]) => {
              const grandTotal = rollup.totalAppropriations + rollup.totalDeductions || 1;
              return (
                <div key={cat} className="px-4 py-2 grid grid-cols-4 text-xs border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: ARTICLE_CATEGORIES[cat]?.color || '#888' }} />
                    <span className="text-slate-700">{ARTICLE_CATEGORIES[cat]?.label || cat}</span>
                  </div>
                  <span className="text-right text-slate-500">{d.count}</span>
                  <span className="text-right font-mono text-slate-900">{fmt(d.total)}</span>
                  <span className="text-right font-mono text-slate-500">{grandTotal > 0 ? ((d.total / grandTotal) * 100).toFixed(1) : 0}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Validation tab ── */}
      {activeTab === 'validation' && (
        <WarrantValidationPanel validation={validation} gaps={gaps} />
      )}

      {/* ── Draft Packet tab ── */}
      {activeTab === 'packet' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            {[['legal','Full Legal Draft'],['board','Board Presentation'],['public','Public Summary']].map(([mode, label]) => (
              <button key={mode} onClick={() => setPacketMode(mode)}
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${packetMode === mode ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                {label}
              </button>
            ))}
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 max-h-[calc(100vh-300px)] overflow-y-auto">
            <DraftPacket articles={articles} mode={packetMode} />
          </div>
        </div>
      )}
    </div>
  );
}