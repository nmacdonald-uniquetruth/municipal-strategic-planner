/**
 * ArticleRollupPanel — BETE-form rollup of all article amounts with reconciliation
 */
import React from 'react';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { buildArticleRollup, ARTICLE_CATEGORIES } from './warrantEngine';

const fmt = n => `$${Math.round(Math.abs(n || 0)).toLocaleString()}`;
const diff = (a, b) => {
  const d = Math.abs((a || 0) - (b || 0));
  return d < 100 ? null : d;
};

function Row({ label, articleAmt, beteAmt, indent, bold, green, separator }) {
  const d = beteAmt != null ? diff(articleAmt, beteAmt) : null;
  return (
    <>
      {separator && <tr><td colSpan={4}><div className="border-t border-slate-200 my-1" /></td></tr>}
      <tr className={bold ? 'bg-slate-50' : ''}>
        <td className={`py-1.5 text-xs ${indent ? 'pl-6' : 'pl-3'} ${bold ? 'font-bold text-slate-900' : 'text-slate-700'}`}>{label}</td>
        <td className={`py-1.5 text-right font-mono text-xs pr-3 ${green ? 'text-emerald-700' : bold ? 'text-slate-900' : 'text-slate-700'}`}>{fmt(articleAmt)}</td>
        <td className={`py-1.5 text-right font-mono text-xs pr-3 text-slate-400`}>{beteAmt != null ? fmt(beteAmt) : '—'}</td>
        <td className="py-1.5 text-center pr-2">
          {beteAmt != null && (d ? <AlertTriangle className="h-3 w-3 text-amber-500 inline" title={`Difference: $${d.toLocaleString()}`} /> : <CheckCircle className="h-3 w-3 text-emerald-500 inline" />)}
        </td>
      </tr>
    </>
  );
}

export default function ArticleRollupPanel({ articles, calc }) {
  const rollup = buildArticleRollup(articles);
  const bete = calc || {};

  const overallOk =
    !diff(rollup.municipalAppropriations, bete.municipalAppropriations) &&
    !diff(rollup.schoolAppropriations, bete.schoolAppropriations) &&
    !diff(rollup.countyAssessment, bete.countyAssessment);

  return (
    <div className="rounded-2xl border border-slate-200 overflow-hidden">
      <div className={`px-4 py-2.5 flex items-center justify-between ${overallOk ? 'bg-emerald-700' : 'bg-amber-600'}`}>
        <div>
          <p className="text-xs font-bold text-white">Article → BETE Rollup</p>
          <p className="text-[9px] mt-0.5 text-white/70">Article totals vs. BETE form inputs</p>
        </div>
        {overallOk
          ? <CheckCircle className="h-4 w-4 text-white" />
          : <AlertTriangle className="h-4 w-4 text-white" />
        }
      </div>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-slate-50">
            <th className="py-1.5 pl-3 text-left text-[9px] font-bold text-slate-400 uppercase tracking-wider">Line</th>
            <th className="py-1.5 pr-3 text-right text-[9px] font-bold text-slate-400 uppercase tracking-wider">Articles</th>
            <th className="py-1.5 pr-3 text-right text-[9px] font-bold text-slate-400 uppercase tracking-wider">BETE Form</th>
            <th className="py-1.5 pr-2 text-center text-[9px] font-bold text-slate-400 uppercase tracking-wider">Match</th>
          </tr>
        </thead>
        <tbody>
          <Row label="Municipal Appropriations" articleAmt={rollup.municipalAppropriations} beteAmt={bete.municipalAppropriations} indent />
          <Row label="School Appropriations" articleAmt={rollup.schoolAppropriations} beteAmt={bete.schoolAppropriations} indent />
          <Row label="County Assessment" articleAmt={rollup.countyAssessment} beteAmt={bete.countyAssessment} indent />
          <Row label="Total Appropriations" articleAmt={rollup.totalAppropriations} beteAmt={bete.totalAppropriations} bold separator />
          <Row label="Enterprise Offsets" articleAmt={rollup.enterpriseOffsets} beteAmt={bete.enterpriseOffsets} indent green />
          <Row label="Revenue / Local" articleAmt={rollup.localRevenues} beteAmt={bete.localRevenues} indent green />
          <Row label="TIF Financing" articleAmt={rollup.tifFinancingPlan} beteAmt={bete.tifFinancingPlan} indent green />
          <Row label="Fund Balance Use" articleAmt={rollup.fundBalanceUse} beteAmt={bete.fundBalanceUse} indent green />
          <Row label="Total Deductions" articleAmt={rollup.totalDeductions} beteAmt={bete.totalDeductions} bold green separator />
          <Row label="Net to Be Raised" articleAmt={rollup.netToBeRaised} beteAmt={bete.netToBeRaised} bold separator />
        </tbody>
      </table>
    </div>
  );
}