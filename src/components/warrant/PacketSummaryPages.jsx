/**
 * PacketSummaryPages — Category summary pages for the warrant packet.
 * Sections: Municipal · Education · County · TIF · Deductions · Net Raised
 */
import React from 'react';
import { ARTICLE_CATEGORIES } from './warrantEngine';
import { TrendingUp, TrendingDown, Minus, CheckCircle } from 'lucide-react';

const fmt = n => (n == null) ? '—' : `$${Math.round(Math.abs(n || 0)).toLocaleString()}`;
const fmtSigned = n => n == null ? '—' : `${n >= 0 ? '+' : '-'}$${Math.round(Math.abs(n)).toLocaleString()}`;
const pct = (c, p) => p ? (((c - p) / Math.abs(p)) * 100).toFixed(1) : null;

const SECTIONS = [
  { key: 'municipal',   label: 'Municipal Appropriations',   cats: ['municipal_appropriation','policy_authorization','capital','debt_authorization','other'], sign: +1, bete: 'municipalAppropriations', color: '#344A60' },
  { key: 'education',   label: 'Education',                  cats: ['school_appropriation'], sign: +1, bete: 'schoolAppropriations', color: '#2A7F7F' },
  { key: 'county',      label: 'County Tax',                 cats: ['county_assessment'],    sign: +1, bete: 'countyAssessment',     color: '#9C5334' },
  { key: 'enterprise',  label: 'Enterprise Fund Appropriations', cats: ['enterprise_appropriation'], sign: +1, bete: 'enterpriseOffsets', color: '#1a6b7a' },
  { key: 'tif',         label: 'TIF Financing',              cats: ['tif'],                  sign: -1, bete: 'tifFinancingPlan',    color: '#6B5EA8' },
  { key: 'deductions',  label: 'Revenue & Deductions',       cats: ['revenue','fund_balance_transfer'], sign: -1, bete: 'localRevenues', color: '#2D7D46' },
];

function SectionTable({ section, articles }) {
  const sectionArticles = articles.filter(a => section.cats.includes(a.category));
  if (sectionArticles.length === 0) return null;

  const total = sectionArticles.reduce((s, a) => s + (a.financial_amount || 0), 0);
  const priorTotal = sectionArticles.reduce((s, a) => s + (a.prior_year_amount || 0), 0);
  const delta = total - priorTotal;
  const deltaPct = pct(total, priorTotal);
  const isDeduction = section.sign < 0;

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      {/* Section header */}
      <div className="px-4 py-2.5 flex items-center justify-between" style={{ background: section.color }}>
        <p className="text-xs font-bold text-white uppercase tracking-wider">{section.label}</p>
        <div className="text-right">
          <p className="text-sm font-bold text-white font-mono">{fmt(total)}</p>
          {priorTotal > 0 && (
            <p className="text-[10px] text-white/70">Prior: {fmt(priorTotal)} · {delta >= 0 ? '+' : ''}{fmt(delta)} ({deltaPct}%)</p>
          )}
        </div>
      </div>

      {/* Article rows */}
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-slate-50">
            <th className="px-3 py-1.5 text-left text-[9px] font-bold text-slate-400 uppercase tracking-wider">Article</th>
            <th className="px-3 py-1.5 text-right text-[9px] font-bold text-slate-400 uppercase tracking-wider">Proposed</th>
            <th className="px-3 py-1.5 text-right text-[9px] font-bold text-slate-400 uppercase tracking-wider">Prior Year</th>
            <th className="px-3 py-1.5 text-right text-[9px] font-bold text-slate-400 uppercase tracking-wider">$ Change</th>
            <th className="px-3 py-1.5 text-right text-[9px] font-bold text-slate-400 uppercase tracking-wider">% Change</th>
          </tr>
        </thead>
        <tbody>
          {sectionArticles.map(a => {
            const cur   = a.financial_amount || 0;
            const prior = a.prior_year_amount || 0;
            const d     = cur - prior;
            const p     = pct(cur, prior);
            const dColor = d > 0 ? (isDeduction ? 'text-emerald-600' : 'text-red-600') : d < 0 ? (isDeduction ? 'text-red-600' : 'text-emerald-600') : 'text-slate-400';
            return (
              <tr key={a.id} className="border-t border-slate-100 hover:bg-slate-50/40">
                <td className="px-3 py-2">
                  <p className="text-xs font-semibold text-slate-800">{a.article_number}</p>
                  <p className="text-[10px] text-slate-500 leading-tight">{a.title}</p>
                </td>
                <td className="px-3 py-2 text-right font-mono text-xs font-bold text-slate-900">{cur > 0 ? fmt(cur) : '—'}</td>
                <td className="px-3 py-2 text-right font-mono text-xs text-slate-500">{prior > 0 ? fmt(prior) : '—'}</td>
                <td className={`px-3 py-2 text-right font-mono text-xs font-semibold ${prior > 0 ? dColor : 'text-slate-300'}`}>
                  {prior > 0 ? `${d >= 0 ? '+' : ''}${fmt(d)}` : '—'}
                </td>
                <td className={`px-3 py-2 text-right text-xs font-semibold ${prior > 0 ? dColor : 'text-slate-300'}`}>
                  {prior > 0 && p ? `${d >= 0 ? '+' : ''}${p}%` : '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-slate-300 bg-slate-50">
            <td className="px-3 py-2 text-xs font-bold text-slate-700">Subtotal</td>
            <td className="px-3 py-2 text-right font-mono text-xs font-bold text-slate-900">{fmt(total)}</td>
            <td className="px-3 py-2 text-right font-mono text-xs text-slate-500">{priorTotal > 0 ? fmt(priorTotal) : '—'}</td>
            <td className={`px-3 py-2 text-right font-mono text-xs font-bold ${priorTotal > 0 ? (delta >= 0 ? 'text-red-700' : 'text-emerald-700') : 'text-slate-300'}`}>
              {priorTotal > 0 ? `${delta >= 0 ? '+' : ''}${fmt(delta)}` : '—'}
            </td>
            <td className={`px-3 py-2 text-right text-xs font-bold ${priorTotal > 0 ? (delta >= 0 ? 'text-red-700' : 'text-emerald-700') : 'text-slate-300'}`}>
              {priorTotal > 0 && deltaPct ? `${delta >= 0 ? '+' : ''}${deltaPct}%` : '—'}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function NetRaisedSummary({ articles, calc }) {
  const totalApprop = articles
    .filter(a => !['revenue','fund_balance_transfer','tif'].includes(a.category))
    .reduce((s, a) => s + (a.financial_amount || 0), 0);
  const totalDeduct = articles
    .filter(a => ['revenue','fund_balance_transfer','tif','enterprise_appropriation'].includes(a.category))
    .reduce((s, a) => s + (a.financial_amount || 0), 0);

  const calcNet   = calc?.netToBeRaised || 0;
  const calcMill  = calc?.selectedMillRate || 0;
  const calcAppro = calc?.totalAppropriations || 0;
  const calcDedu  = calc?.totalDeductions || 0;

  const rows = [
    { label: 'Total Appropriations',             value: calcAppro || totalApprop, bold: false, indent: false },
    { label: 'Less: Total Deductions',            value: calcDedu  || totalDeduct, bold: false, indent: false, green: true },
    { label: 'Net Amount to Be Raised by Tax',   value: calcNet,  bold: true,  indent: false },
    null,
    { label: 'Total Assessed Value',             value: calc?.totalAssessedValue, bold: false, indent: true, isTav: true },
    { label: 'Adopted Mill Rate',                value: null, millRate: calcMill, bold: true, indent: false },
    { label: 'Tax for Commitment',               value: calc?.taxForCommitment, bold: true, indent: false },
  ];

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-4 py-2.5 bg-slate-900 flex items-center justify-between">
        <p className="text-xs font-bold text-white uppercase tracking-wider">Net Raised Through Taxation</p>
        <p className="text-sm font-bold text-white font-mono">{fmt(calcNet)}</p>
      </div>
      <table className="w-full border-collapse">
        <tbody>
          {rows.map((r, i) => {
            if (!r) return <tr key={i}><td colSpan={2} className="py-1"><div className="border-t border-slate-200 mx-3" /></td></tr>;
            return (
              <tr key={i} className={r.bold ? 'bg-slate-50' : ''}>
                <td className={`px-3 py-2 text-xs ${r.indent ? 'pl-6' : ''} ${r.bold ? 'font-bold text-slate-900' : 'text-slate-700'}`}>{r.label}</td>
                <td className={`px-3 py-2 text-right font-mono text-xs ${r.bold ? 'font-bold text-slate-900' : ''} ${r.green ? 'text-emerald-600' : ''}`}>
                  {r.millRate != null ? `${r.millRate.toFixed(3)} mills per $1,000` : r.isTav ? `$${Math.round(r.value || 0).toLocaleString()}` : fmt(r.value)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function PacketSummaryPages({ articles, calc, mode }) {
  const sorted = [...articles].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
        <p className="text-[10px] text-slate-500">
          <strong className="text-slate-700">Budget Summary by Category</strong> — Article totals grouped by appropriation type. Deductions reduce the net amount raised through taxation. All figures in US dollars.
        </p>
      </div>
      {SECTIONS.map(s => <SectionTable key={s.key} section={s} articles={sorted} />)}
      <NetRaisedSummary articles={sorted} calc={calc} />
    </div>
  );
}