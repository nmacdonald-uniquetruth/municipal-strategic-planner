/**
 * ReconciliationPanel — 3-layer reconciliation: Dept→Fund→Article→BETE + GAAP
 */
import React, { useMemo, useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react';
import { reconcileDeptToFund, reconcileFundToArticle, reconcileArticleToBete, buildGaapReconciliation } from './budgetControlEngine';

const fmt = n => `$${Math.round(Math.abs(n || 0)).toLocaleString()}`;
const signed = n => `${n >= 0 ? '+' : '-'}$${Math.round(Math.abs(n)).toLocaleString()}`;

const FUND_LABELS = { general_fund:'General Fund', school:'School', county:'County', enterprise:'Enterprise', tif:'TIF', debt_service:'Debt Service', capital_reserve:'Capital Reserve', special_revenue:'Special Revenue' };
const BETE_LABELS = { municipalAppropriations:'Municipal Appropriations', schoolAppropriations:'School Appropriations', countyAssessment:'County Assessment', enterpriseOffsets:'Enterprise Offsets', localRevenues:'Local Revenues', tifFinancingPlan:'TIF Financing Plan', fundBalanceUse:'Fund Balance Use', stateRevenueSharing:'State Revenue Sharing', unmapped:'⚠ Unmapped' };

function ReconcileRow({ ok, label, computed, expected, diff }) {
  return (
    <tr className={`border-t border-slate-100 ${!ok ? 'bg-red-50/30' : ''}`}>
      <td className="px-3 py-2 flex items-center gap-2">
        {ok ? <CheckCircle className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" /> : <XCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />}
        <span className="text-xs font-medium text-slate-800">{label}</span>
      </td>
      <td className="px-3 py-2 text-right font-mono text-xs text-slate-700">{fmt(computed)}</td>
      <td className="px-3 py-2 text-right font-mono text-xs text-slate-500">{fmt(expected)}</td>
      <td className={`px-3 py-2 text-right font-mono text-xs font-bold ${ok ? 'text-emerald-600' : 'text-red-600'}`}>
        {ok ? '✓ Reconciled' : signed(diff)}
      </td>
    </tr>
  );
}

export default function ReconciliationPanel({ records }) {
  const [layer, setLayer] = useState('dept_fund');

  const deptFund = useMemo(() => reconcileDeptToFund(records), [records]);
  const fundArticle = useMemo(() => reconcileFundToArticle(records), [records]);
  const articleBete = useMemo(() => reconcileArticleToBete(records), [records]);
  const gaap = useMemo(() => buildGaapReconciliation(records), [records]);

  const allClean = deptFund.every(r => r.reconciled) && fundArticle.every(r => !r.orphan);
  const totalDiff = deptFund.reduce((s, r) => s + Math.abs(r.diff), 0);

  return (
    <div className="space-y-4">
      {/* Summary badge */}
      <div className={`rounded-xl border px-4 py-2.5 flex items-center gap-3 ${allClean ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
        {allClean
          ? <CheckCircle className="h-4 w-4 text-emerald-600" />
          : <XCircle className="h-4 w-4 text-red-600" />}
        <div>
          <p className={`text-xs font-bold ${allClean ? 'text-emerald-800' : 'text-red-800'}`}>
            {allClean ? 'All reconciliation layers clean.' : `Reconciliation issues detected — total unreconciled: $${Math.round(totalDiff).toLocaleString()}`}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">Dept → Fund → Article → BETE · {records.length} records across {deptFund.length} funds</p>
        </div>
      </div>

      {/* Layer tabs */}
      <div className="flex gap-1">
        {[['dept_fund','Dept → Fund'],['fund_article','Fund → Article'],['article_bete','Article → BETE'],['gaap','GAAP Recon']].map(([v, l]) => (
          <button key={v} onClick={() => setLayer(v)}
            className={`text-[10px] px-3 py-1.5 rounded-full font-semibold transition-colors ${layer === v ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* Layer 1: Dept → Fund */}
      {layer === 'dept_fund' && (
        <div className="rounded-2xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-900 text-white px-4 py-2 flex items-center gap-2">
            <p className="text-xs font-bold">Layer 1: Department Totals → Fund Totals</p>
          </div>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-3 py-2 text-left text-[9px] font-bold text-slate-500 uppercase tracking-wider">Fund</th>
                <th className="px-3 py-2 text-right text-[9px] font-bold text-slate-500 uppercase tracking-wider">Dept Total</th>
                <th className="px-3 py-2 text-right text-[9px] font-bold text-slate-500 uppercase tracking-wider">Expected</th>
                <th className="px-3 py-2 text-right text-[9px] font-bold text-slate-500 uppercase tracking-wider">Reconciliation</th>
              </tr>
            </thead>
            <tbody>
              {deptFund.map((r, i) => (
                <ReconcileRow key={i} ok={r.reconciled} label={`${FUND_LABELS[r.fund] || r.fund} (${r.count} depts)`} computed={r.budget} expected={r.expected} diff={r.diff} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Layer 2: Fund → Article */}
      {layer === 'fund_article' && (
        <div className="rounded-2xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-900 text-white px-4 py-2">
            <p className="text-xs font-bold">Layer 2: Fund Lines → Warrant Articles</p>
          </div>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-3 py-2 text-left text-[9px] font-bold text-slate-500 uppercase tracking-wider">Article</th>
                <th className="px-3 py-2 text-right text-[9px] font-bold text-slate-500 uppercase tracking-wider">Budget Total</th>
                <th className="px-3 py-2 text-right text-[9px] font-bold text-slate-500 uppercase tracking-wider">YTD</th>
                <th className="px-3 py-2 text-center text-[9px] font-bold text-slate-500 uppercase tracking-wider">Funds Spanning</th>
                <th className="px-3 py-2 text-center text-[9px] font-bold text-slate-500 uppercase tracking-wider">Orphan?</th>
              </tr>
            </thead>
            <tbody>
              {fundArticle.map((a, i) => (
                <tr key={i} className={`border-t border-slate-100 ${a.orphan ? 'bg-amber-50/40' : ''}`}>
                  <td className="px-3 py-2 flex items-center gap-2">
                    {a.orphan ? <AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> : <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />}
                    <span className="font-medium text-slate-800">{a.article}</span>
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-slate-700">{fmt(a.budget)}</td>
                  <td className="px-3 py-2 text-right font-mono text-slate-500">{fmt(a.ytd)}</td>
                  <td className="px-3 py-2 text-center text-slate-500">{a.fundCount} fund{a.fundCount !== 1 ? 's' : ''}</td>
                  <td className="px-3 py-2 text-center">
                    {a.orphan ? <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">Yes — assign article</span>
                      : <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">No</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Layer 3: Article → BETE */}
      {layer === 'article_bete' && (
        <div className="rounded-2xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-900 text-white px-4 py-2">
            <p className="text-xs font-bold">Layer 3: Department Lines → BETE Calculation Lines</p>
          </div>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-3 py-2 text-left text-[9px] font-bold text-slate-500 uppercase tracking-wider">BETE Line</th>
                <th className="px-3 py-2 text-right text-[9px] font-bold text-slate-500 uppercase tracking-wider">Budget Total</th>
                <th className="px-3 py-2 text-right text-[9px] font-bold text-slate-500 uppercase tracking-wider">YTD Total</th>
                <th className="px-3 py-2 text-left text-[9px] font-bold text-slate-500 uppercase tracking-wider">Departments</th>
              </tr>
            </thead>
            <tbody>
              {articleBete.map((b, i) => (
                <tr key={i} className={`border-t border-slate-100 ${b.bete_line === 'unmapped' ? 'bg-red-50/30' : ''}`}>
                  <td className="px-3 py-2 flex items-center gap-2">
                    {b.bete_line === 'unmapped' ? <XCircle className="h-3.5 w-3.5 text-red-500" /> : <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />}
                    <span className="font-medium text-slate-800">{BETE_LABELS[b.bete_line] || b.bete_line}</span>
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-slate-700">{fmt(b.budget)}</td>
                  <td className="px-3 py-2 text-right font-mono text-slate-500">{fmt(b.ytd)}</td>
                  <td className="px-3 py-2 text-slate-500 text-[10px]">{b.depts.join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* GAAP reconciliation */}
      {layer === 'gaap' && (
        <div className="space-y-3">
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5">
            <p className="text-xs font-semibold text-blue-800">GAAP Basis Reconciliation</p>
            <p className="text-[10px] text-blue-700 mt-0.5">Converts budgetary-basis actuals to GAAP basis via accrual/deferral adjustments. Only records with a non-zero GAAP adjustment are shown.</p>
          </div>
          {gaap.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-6 text-center">
              <p className="text-xs text-slate-400">No GAAP adjustments recorded. Add <code className="text-slate-600">gaap_adjustment</code> values to department records to see reconciliation.</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 overflow-hidden">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white">
                    <th className="px-3 py-2 text-left text-[9px] font-bold uppercase tracking-wider">Department</th>
                    <th className="px-3 py-2 text-right text-[9px] font-bold uppercase tracking-wider">Budgetary Basis</th>
                    <th className="px-3 py-2 text-right text-[9px] font-bold uppercase tracking-wider">GAAP Adjustment</th>
                    <th className="px-3 py-2 text-right text-[9px] font-bold uppercase tracking-wider">GAAP Basis</th>
                    <th className="px-3 py-2 text-center text-[9px] font-bold uppercase tracking-wider">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {gaap.map((r, i) => (
                    <tr key={i} className="border-t border-slate-100">
                      <td className="px-3 py-2 font-medium text-slate-800">{r.department}</td>
                      <td className="px-3 py-2 text-right font-mono text-slate-700">{fmt(r.budgetary_basis)}</td>
                      <td className={`px-3 py-2 text-right font-mono font-semibold ${r.gaap_adjustment > 0 ? 'text-blue-700' : 'text-amber-700'}`}>{signed(r.gaap_adjustment)}</td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-slate-900">{fmt(r.gaap_basis)}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold ${r.adjustment_type === 'accrual_add' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                          {r.adjustment_type === 'accrual_add' ? 'Accrual Add' : 'Deferral Remove'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}