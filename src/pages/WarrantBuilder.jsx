/**
 * WarrantBuilder — Annual Town Warrant Builder
 *
 * Tabs:
 *  1. Articles       — list, add, edit, reorder
 *  2. Draft Packet   — 3-mode text preview + export
 *  3. Rollup / BETE  — article totals vs adopted budget + BETE reconciliation
 *  4. Validation     — errors, warnings, numbering gaps
 *  5. History        — per-article multi-year history viewer
 */
import React, { useState, useMemo, useCallback } from 'react';
import { useModel } from '../components/machias/ModelContext';
import { calculateTaxCommitment } from '../components/budget/budgetEngine';
import {
  validateArticles, buildArticleRollup, findNumberingGaps,
  generateDraftText, ARTICLE_CATEGORIES, VOTING_LABELS,
} from '../components/warrant/warrantEngine';
import WarrantBuilderArticleForm from '../components/warrant/WarrantBuilderArticleForm';
import WarrantPacketGenerator from '../components/warrant/WarrantPacketGenerator';
import ArticleRollupPanel from '../components/warrant/ArticleRollupPanel';
import WarrantValidationPanel from '../components/warrant/WarrantValidationPanel';
import ArticleHistoryPanel from '../components/warrant/ArticleHistoryPanel';
import SectionHeader from '../components/machias/SectionHeader';
import ArticleMappingTable from '../components/warrant/ArticleMappingTable';
import MappingExceptionsReport from '../components/warrant/MappingExceptionsReport';
import {
  buildDefaultLineItems, applyAllSuggestedMappings,
  rollupByBeteLine, findMappingExceptions, checkAdoptionReadiness,
} from '../components/warrant/articleMappingEngine';
import {
  FileText, Plus, AlertTriangle, BarChart2, Clock, ChevronUp, ChevronDown,
  Trash2, Pencil, Copy, Scroll, CheckCircle, GitMerge,
} from 'lucide-react';

const fmt = n => `$${Math.round(Math.abs(n || 0)).toLocaleString()}`;

// ── Seed data ─────────────────────────────────────────────────────────────────
function buildSeedArticles(settings, fy) {
  const entOffsets = (settings.ambulance_transfer || 45000) + (settings.sewer_transfer || 21110) + (settings.ts_transfer || 21000) + (settings.telebusiness_transfer || 18525) + (settings.court_st_transfer || 15600);
  return [
    { id: 'wa1', fiscal_year: fy, article_number: 'Article 1', sort_order: 1, title: 'Fix Time and Place', category: 'other', legal_type: 'information', voting_method: 'n_a', financial_amount: 0, status: 'draft', legal_review_status: 'not_reviewed', text_frozen: false, bete_mapping: '', draft_text: 'To fix a time and place for the next annual town meeting.', board_text: '', public_text: '', pub_purpose: 'Administrative article — sets the date and location for the next annual meeting.', pub_key_change: 'Routine procedural article.', pub_recurring: true, linked_departments: [] },
    { id: 'wa2', fiscal_year: fy, article_number: 'Article 2', sort_order: 2, title: 'Elect Town Officers', category: 'policy_authorization', legal_type: 'authorization', voting_method: 'secret_ballot', financial_amount: 0, status: 'draft', legal_review_status: 'not_reviewed', text_frozen: false, bete_mapping: '', draft_text: 'To elect all necessary town officers for the ensuing year.', board_text: '', public_text: '', pub_purpose: 'Elects the Select Board and other officer positions required by charter.', pub_key_change: 'Routine annual election article.', pub_recurring: true, linked_departments: ['Administration'] },
    { id: 'wa3', fiscal_year: fy, article_number: 'Article 3', sort_order: 3, title: 'County Assessment', category: 'county_assessment', legal_type: 'assessment', voting_method: 'majority_voice', financial_amount: 285000, prior_year_amount: 278000, status: 'draft', legal_review_status: 'not_reviewed', text_frozen: false, bete_mapping: 'countyAssessment', draft_text: '', board_text: '', public_text: '', pub_purpose: 'Funds Machias\'s share of Washington County government operations.', pub_key_change: 'Increase of $7,000 (+2.5%) from county apportionment formula.', pub_tax_impact: 'Approx. +0.036 mills.', pub_recurring: true, tax_impact_note: '+0.036 mills', linked_departments: ['County Assessment'] },
    { id: 'wa4', fiscal_year: fy, article_number: 'Article 4', sort_order: 4, title: 'Administration & General Government', category: 'municipal_appropriation', legal_type: 'appropriation', voting_method: 'majority_voice', financial_amount: 745500, prior_year_amount: 710000, status: 'draft', legal_review_status: 'not_reviewed', text_frozen: false, bete_mapping: 'municipalAppropriations', draft_text: '', board_text: '', public_text: '', pub_purpose: 'Funds Town Manager, Finance Director, administrative staff, office operations, and a new Staff Accountant position.', pub_key_change: 'New Staff Accountant position added (+$65,000) to support financial restructuring.', pub_tax_impact: 'Approx. +0.18 mills from prior year.', pub_recurring: true, tax_impact_note: '+0.18 mills vs. prior year', linked_departments: ['Administration'], explanatory_notes: 'Includes new Staff Accountant position per FY2027 restructuring plan.' },
    { id: 'wa5', fiscal_year: fy, article_number: 'Article 5', sort_order: 5, title: 'Police Department', category: 'municipal_appropriation', legal_type: 'appropriation', voting_method: 'majority_voice', financial_amount: 435000, prior_year_amount: 420000, status: 'draft', legal_review_status: 'not_reviewed', text_frozen: false, bete_mapping: 'municipalAppropriations', draft_text: '', board_text: '', public_text: '', pub_purpose: 'Funds Police Chief, patrol officers, dispatch operations, and department equipment.', pub_key_change: 'Union contract CPI adjustment of 3.5%.', pub_tax_impact: 'Approx. +0.076 mills.', pub_recurring: true, linked_departments: ['Police'] },
    { id: 'wa6', fiscal_year: fy, article_number: 'Article 6', sort_order: 6, title: 'Fire Department', category: 'municipal_appropriation', legal_type: 'appropriation', voting_method: 'majority_voice', financial_amount: 98000, prior_year_amount: 95000, status: 'draft', legal_review_status: 'not_reviewed', text_frozen: false, bete_mapping: 'municipalAppropriations', draft_text: '', board_text: '', public_text: '', pub_purpose: 'Funds volunteer fire department operations, equipment maintenance, and training.', pub_key_change: 'Equipment maintenance increase due to aging apparatus.', pub_recurring: true, linked_departments: ['Fire Department'] },
    { id: 'wa7', fiscal_year: fy, article_number: 'Article 7', sort_order: 7, title: 'Ambulance Service (Enterprise Fund)', category: 'enterprise_appropriation', legal_type: 'appropriation', voting_method: 'majority_voice', financial_amount: 498000, prior_year_amount: 480000, status: 'draft', legal_review_status: 'not_reviewed', text_frozen: false, bete_mapping: 'enterpriseOffsets', draft_text: '', board_text: '', public_text: '', pub_purpose: 'Funds the municipal ambulance/EMS service. Enterprise fund revenues offset the General Fund appropriation.', pub_key_change: 'EMS transport billing being brought in-house in FY2027, increasing collections.', pub_tax_impact: `Enterprise offsets of ${fmt(entOffsets)} reduce tax levy.`, pub_recurring: true, tax_impact_note: `${fmt(entOffsets)} enterprise offset reduces levy`, linked_departments: ['Ambulance Service'] },
    { id: 'wa8', fiscal_year: fy, article_number: 'Article 8', sort_order: 8, title: 'Public Works', category: 'municipal_appropriation', legal_type: 'appropriation', voting_method: 'majority_voice', financial_amount: 392000, prior_year_amount: 380000, status: 'draft', legal_review_status: 'not_reviewed', text_frozen: false, bete_mapping: 'municipalAppropriations', draft_text: '', board_text: '', public_text: '', pub_purpose: 'Funds roads, bridges, winter maintenance, and town facilities.', pub_key_change: 'Materials inflation approximately 8% on road maintenance supplies.', pub_recurring: true, linked_departments: ['Public Works'] },
    { id: 'wa9', fiscal_year: fy, article_number: 'Article 9', sort_order: 9, title: 'Accept Local Revenues', category: 'revenue', legal_type: 'authorization', voting_method: 'majority_voice', financial_amount: 485000, prior_year_amount: 460000, status: 'draft', legal_review_status: 'not_reviewed', text_frozen: false, bete_mapping: 'localRevenues', draft_text: '', board_text: '', public_text: '', pub_purpose: 'Authorizes the town to apply non-tax revenues (excise, fees, State Revenue Sharing) to reduce the tax levy.', pub_key_change: 'Increased State Revenue Sharing estimate based on state projections.', pub_tax_impact: 'Reduces net amount raised by taxation.', pub_recurring: true, explanatory_notes: 'Excise tax, fees, State Revenue Sharing, and miscellaneous revenues.' },
    { id: 'wa10', fiscal_year: fy, article_number: 'Article 10', sort_order: 10, title: 'Education — RSU School Appropriation', category: 'school_appropriation', legal_type: 'appropriation', voting_method: 'majority_voice', financial_amount: 1950000, prior_year_amount: 1880000, status: 'draft', legal_review_status: 'not_reviewed', text_frozen: false, bete_mapping: 'schoolAppropriations', draft_text: '', board_text: '', public_text: '', pub_purpose: "Funds Machias's local share of the RSU school assessment for elementary and secondary education.", pub_key_change: 'Increase of $70,000 driven by RSU cost allocation and enrollment adjustments.', pub_tax_impact: 'Largest single appropriation — approx. +0.35 mills from prior year.', pub_recurring: true, linked_departments: ['School (RSU Share)'] },
  ];
}

// ── Build article history across multiple years ───────────────────────────────
function buildHistory(allYearArticles, title) {
  return allYearArticles
    .filter(a => a.title === title || a.article_number === title)
    .map(a => ({ fiscal_year: a.fiscal_year, financial_amount: a.financial_amount, status: a.status, notes: a.explanatory_notes }));
}

// ── Article row in list ───────────────────────────────────────────────────────
function ArticleRow({ article, onEdit, onDelete, onReorder, errors, isFirst, isLast }) {
  const cat = ARTICLE_CATEGORIES[article.category];
  const hasError = errors.some(e => e.id === article.id);
  return (
    <div className={`rounded-xl border ${hasError ? 'border-red-200 bg-red-50/20' : 'border-slate-200 bg-white'} px-4 py-3 flex items-start gap-3 hover:border-slate-300 transition-colors`}>
      {/* Sort controls */}
      <div className="flex flex-col gap-0.5 mt-0.5 flex-shrink-0">
        <button disabled={isFirst} onClick={() => onReorder(article, -1)} className="p-0.5 rounded text-slate-300 hover:text-slate-600 disabled:opacity-20 transition-colors"><ChevronUp className="h-3.5 w-3.5" /></button>
        <button disabled={isLast}  onClick={() => onReorder(article, +1)} className="p-0.5 rounded text-slate-300 hover:text-slate-600 disabled:opacity-20 transition-colors"><ChevronDown className="h-3.5 w-3.5" /></button>
      </div>

      {/* Color chip */}
      <div className="h-2 w-2 rounded-full mt-2 flex-shrink-0" style={{ background: cat?.color || '#888' }} />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-xs font-bold text-slate-800">{article.article_number}</p>
          <span className="text-xs text-slate-700">{article.title}</span>
          {(article.financial_amount || 0) > 0 && (
            <span className="ml-auto font-mono text-xs font-bold text-slate-900 flex-shrink-0">{fmt(article.financial_amount)}</span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="text-[9px] text-slate-400">{cat?.label}</span>
          {article.prior_year_amount > 0 && (
            <span className="text-[9px] text-slate-400">Prior: {fmt(article.prior_year_amount)}</span>
          )}
          {article.status !== 'draft' && (
            <span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold ${article.status === 'adopted' ? 'bg-emerald-100 text-emerald-700' : article.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'}`}>
              {article.status}
            </span>
          )}
          {article.text_frozen && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-600 font-semibold">🔒 Frozen</span>}
          {article.legal_review_status === 'approved' && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-600 font-semibold">✓ Legal</span>}
          {!article.draft_text && <span className="text-[9px] text-amber-600">⚠ No text</span>}
          {article.pub_purpose && <span className="text-[9px] text-blue-500">📝 Explained</span>}
        </div>
        {article.pub_purpose && (
          <p className="text-[10px] text-slate-400 mt-1 truncate max-w-lg">{article.pub_purpose}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button onClick={() => onEdit(article)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => onDelete(article)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

const TABS = [
  { id: 'articles',   label: 'Articles',     icon: Scroll },
  { id: 'mapping',    label: 'Mapping',      icon: GitMerge },
  { id: 'packet',     label: 'Draft Packet', icon: FileText },
  { id: 'rollup',     label: 'Rollup / BETE',icon: BarChart2 },
  { id: 'validation', label: 'Validation',   icon: AlertTriangle },
  { id: 'history',    label: 'History',      icon: Clock },
];

// ── Main page ─────────────────────────────────────────────────────────────────
export default function WarrantBuilder() {
  const { settings } = useModel();
  const [fiscalYear, setFiscalYear] = useState('FY2027');

  // Maintain articles per fiscal year for history
  const [articlesByYear, setArticlesByYear] = useState({ 'FY2027': buildSeedArticles(settings, 'FY2027') });
  const articles = articlesByYear[fiscalYear] || [];
  const setArticles = useCallback((updater) => {
    setArticlesByYear(prev => ({ ...prev, [fiscalYear]: typeof updater === 'function' ? updater(prev[fiscalYear] || []) : updater }));
  }, [fiscalYear]);

  const [editingArticle, setEditingArticle] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [activeTab, setActiveTab] = useState('articles');
  const [historyTitle, setHistoryTitle] = useState(null);

  const allYearArticles = useMemo(() => Object.values(articlesByYear).flat(), [articlesByYear]);

  const calc = useMemo(() => calculateTaxCommitment({
    municipalAppropriations: articles.filter(a => a.bete_mapping === 'municipalAppropriations').reduce((s, a) => s + (a.financial_amount || 0), 0),
    schoolAppropriations:    articles.filter(a => a.bete_mapping === 'schoolAppropriations').reduce((s, a) => s + (a.financial_amount || 0), 0),
    countyAssessment:        articles.filter(a => a.bete_mapping === 'countyAssessment').reduce((s, a) => s + (a.financial_amount || 0), 0),
    enterpriseOffsets:       (settings.ambulance_transfer || 45000) + (settings.sewer_transfer || 21110) + (settings.ts_transfer || 21000) + (settings.telebusiness_transfer || 18525) + (settings.court_st_transfer || 15600),
    stateRevenueSharing:     165000,
    localRevenues:           articles.filter(a => a.bete_mapping === 'localRevenues').reduce((s, a) => s + (a.financial_amount || 0), 0),
    totalAssessedValue:      settings.total_assessed_value || 198000000,
    overlayPercent:          1.0,
  }), [articles, settings]);

  const validation = useMemo(() => validateArticles(articles, calc), [articles, calc]);
  const gaps = useMemo(() => findNumberingGaps(articles), [articles]);
  const rollup = useMemo(() => buildArticleRollup(articles), [articles]);
  const issueCount = validation.errors.length + validation.warnings.length + gaps.length;
  const errorCount = validation.errors.length;
  const allErrors = [...validation.errors, ...validation.warnings];

  const sorted = useMemo(() => [...articles].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)), [articles]);

  const handleSave = useCallback((form) => {
    if (editingArticle) {
      setArticles(prev => prev.map(a => a.id === editingArticle.id ? { ...a, ...form } : a));
    } else {
      setArticles(prev => [...prev, { ...form, id: `wa_${Date.now()}`, fiscal_year: fiscalYear }]);
    }
    setEditingArticle(null);
    setIsAdding(false);
  }, [editingArticle, fiscalYear, setArticles]);

  const handleDelete = useCallback((a) => {
    if (window.confirm(`Delete "${a.title}"?`)) setArticles(prev => prev.filter(x => x.id !== a.id));
  }, [setArticles]);

  const handleReorder = useCallback((a, dir) => {
    setArticles(prev => {
      const s = [...prev].sort((x, y) => (x.sort_order || 0) - (y.sort_order || 0));
      const idx = s.findIndex(x => x.id === a.id);
      const ni = idx + dir;
      if (ni < 0 || ni >= s.length) return prev;
      const updated = s.map((x, i) => ({ ...x, sort_order: i }));
      const tmp = updated[idx].sort_order;
      updated[idx].sort_order = updated[ni].sort_order;
      updated[ni].sort_order = tmp;
      return updated;
    });
  }, [setArticles]);

  const handleCloneYear = () => {
    const nextFY = `FY${parseInt(fiscalYear.replace('FY', '')) + 1}`;
    const cloned = articles.map(a => ({
      ...a, id: `wa_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      fiscal_year: nextFY, status: 'draft', legal_review_status: 'not_reviewed',
      text_frozen: false, prior_year_amount: a.financial_amount,
      draft_text: '', board_text: '', public_text: '',
    }));
    setArticlesByYear(prev => ({ ...prev, [nextFY]: cloned }));
    setFiscalYear(nextFY);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <SectionHeader
          title="Annual Town Warrant Builder"
          subtitle={`${fiscalYear} — Draft, validate, and publish the annual town meeting warrant`}
          icon={Scroll}
        />
        <div className="flex items-center gap-2 flex-wrap">
          <select value={fiscalYear} onChange={e => setFiscalYear(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none">
            {['FY2025','FY2026','FY2027','FY2028','FY2029'].map(fy => (
              <option key={fy} value={fy}>{fy}{articlesByYear[fy] ? ` (${articlesByYear[fy].length})` : ' —'}</option>
            ))}
          </select>
          <button onClick={handleCloneYear}
            className="flex items-center gap-1.5 text-xs font-semibold border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg hover:border-slate-500 hover:text-slate-900 transition-colors">
            <Copy className="h-3.5 w-3.5" /> Clone to Next Year
          </button>
          <button onClick={() => { setIsAdding(true); setEditingArticle(null); setActiveTab('articles'); }}
            className="flex items-center gap-1.5 text-xs font-semibold bg-slate-900 text-white px-3 py-1.5 rounded-lg hover:bg-slate-700 transition-colors">
            <Plus className="h-3.5 w-3.5" /> New Article
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {[
          { label: 'Articles', value: articles.length, sub: 'in warrant', color: 'text-slate-900' },
          { label: 'Appropriations', value: fmt(rollup.totalAppropriations), sub: 'article rollup total', color: 'text-slate-900' },
          { label: 'Deductions', value: fmt(rollup.totalDeductions), sub: 'revenue + offsets', color: 'text-emerald-700' },
          { label: 'Net to Be Raised', value: fmt(rollup.netToBeRaised), sub: `${(calc.selectedMillRate || 0).toFixed(3)} mills`, color: 'text-slate-900' },
          { label: 'Validation', value: issueCount === 0 ? '✓ Clean' : `${issueCount} issue${issueCount !== 1 ? 's' : ''}`, sub: issueCount === 0 ? 'no errors' : `${errorCount} error${errorCount !== 1 ? 's' : ''}`, color: issueCount === 0 ? 'text-emerald-700' : errorCount > 0 ? 'text-red-700' : 'text-amber-700' },
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
        {TABS.map(({ id, label, icon: TabIcon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${activeTab === id ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-700'}`}>
            <TabIcon className="h-3.5 w-3.5 flex-shrink-0" />
            {label}
            {id === 'validation' && issueCount > 0 && (
              <span className={`ml-1 text-[9px] px-1.5 py-0.5 rounded-full font-bold ${errorCount > 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{issueCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Articles ── */}
      {activeTab === 'articles' && (
        <div className="space-y-3">
          {(isAdding || editingArticle) ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-bold text-slate-700">{editingArticle ? `Editing: ${editingArticle.article_number} — ${editingArticle.title}` : 'New Warrant Article'}</p>
              </div>
              <WarrantBuilderArticleForm
                article={editingArticle}
                onSave={handleSave}
                onCancel={() => { setEditingArticle(null); setIsAdding(false); }}
                calc={calc}
                history={editingArticle ? buildHistory(allYearArticles, editingArticle.title) : []}
              />
            </div>
          ) : (
            <div className="space-y-2">
              {sorted.map((a, i) => (
                <ArticleRow
                  key={a.id}
                  article={a}
                  onEdit={a => { setEditingArticle(a); setIsAdding(false); }}
                  onDelete={handleDelete}
                  onReorder={handleReorder}
                  errors={allErrors}
                  isFirst={i === 0}
                  isLast={i === sorted.length - 1}
                />
              ))}
              {articles.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-300 px-6 py-8 text-center">
                  <p className="text-xs text-slate-400">No articles yet. Click "New Article" to begin building the warrant.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Draft Packet ── */}
      {activeTab === 'packet' && (
        <WarrantPacketGenerator articles={articles} fiscalYear={fiscalYear} calc={calc} />
      )}

      {/* ── Rollup / BETE ── */}
      {activeTab === 'rollup' && (
        <div className="space-y-4">
          <ArticleRollupPanel articles={articles} calc={calc} />
          <div className="rounded-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white px-4 py-2 grid grid-cols-4 text-[9px] font-bold uppercase tracking-wider">
              <span>Category</span><span className="text-right">Articles</span><span className="text-right">Amount</span><span className="text-right">% of Total</span>
            </div>
            {Object.entries(articles.reduce((acc, a) => {
              const k = a.category;
              if (!acc[k]) acc[k] = { count: 0, total: 0 };
              acc[k].count++; acc[k].total += a.financial_amount || 0;
              return acc;
            }, {})).sort((a, b) => b[1].total - a[1].total).map(([cat, d]) => {
              const grand = rollup.totalAppropriations + rollup.totalDeductions || 1;
              return (
                <div key={cat} className="px-4 py-2 grid grid-cols-4 text-xs border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ background: ARTICLE_CATEGORIES[cat]?.color || '#888' }} />
                    <span className="text-slate-700">{ARTICLE_CATEGORIES[cat]?.label || cat}</span>
                  </div>
                  <span className="text-right text-slate-500">{d.count}</span>
                  <span className="text-right font-mono text-slate-900">{fmt(d.total)}</span>
                  <span className="text-right font-mono text-slate-500">{grand > 0 ? ((d.total / grand) * 100).toFixed(1) : 0}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Validation ── */}
      {activeTab === 'validation' && (
        <WarrantValidationPanel validation={validation} gaps={gaps} />
      )}

      {/* ── History ── */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
            <p className="text-[10px] text-slate-500">Select an article to view its history across all fiscal years. History is preserved when you clone to a new year.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[...new Set(allYearArticles.map(a => a.title))].map(title => (
              <button key={title} onClick={() => setHistoryTitle(title)}
                className={`text-[10px] px-3 py-1.5 rounded-full font-medium border transition-colors ${historyTitle === title ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}>
                {title}
              </button>
            ))}
          </div>
          {historyTitle && (
            <ArticleHistoryPanel historyRecords={buildHistory(allYearArticles, historyTitle)} />
          )}
          {!historyTitle && (
            <div className="rounded-xl border border-dashed border-slate-200 px-6 py-8 text-center">
              <p className="text-xs text-slate-400">Click an article above to view its multi-year history.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}