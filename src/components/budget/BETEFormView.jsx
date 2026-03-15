/**
 * BETEFormView — Maine BETE-style tax rate calculation form
 * Mirrors the Maine State Assessor's commitment worksheet layout.
 */
import React from 'react';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

const $ = n => `$${Math.round(Math.abs(n || 0)).toLocaleString()}`;
const mr = n => (n || 0).toFixed(3);
const pct = n => `${(n || 0).toFixed(2)}%`;

function Row({ label, value, indent, bold, green, separator, sub }) {
  return (
    <>
      {separator && <tr><td colSpan={2} className="py-1"><div className="border-t border-slate-200" /></td></tr>}
      <tr className={bold ? 'bg-slate-50' : ''}>
        <td className={`py-1.5 pr-4 text-xs ${indent ? 'pl-6' : 'pl-2'} ${bold ? 'font-bold text-slate-900' : 'text-slate-700'}`}>
          {label}
          {sub && <span className="block text-[9px] text-slate-400 font-normal">{sub}</span>}
        </td>
        <td className={`py-1.5 text-right text-xs font-mono font-semibold ${green ? 'text-emerald-700' : bold ? 'text-slate-900' : 'text-slate-700'}`}>
          {value}
        </td>
      </tr>
    </>
  );
}

export default function BETEFormView({ calc, warnings, priorYear }) {
  if (!calc) return null;
  const pyMillRate = priorYear?.priorYearMillRate || 0;
  const pyLevy = priorYear?.priorYearLevy || 0;
  const levyChange = calc.taxForCommitment - pyLevy;
  const levyChangePct = pyLevy > 0 ? ((levyChange / pyLevy) * 100).toFixed(2) : null;

  return (
    <div className="space-y-4">
      {/* Validation banner */}
      {warnings.length > 0 && (
        <div className="space-y-1.5">
          {warnings.map((w, i) => (
            <div key={i} className={`rounded-xl border px-3 py-2 flex items-start gap-2 ${w.type === 'error' ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'}`}>
              {w.type === 'error' ? <XCircle className="h-3.5 w-3.5 text-red-600 flex-shrink-0 mt-0.5" /> : <AlertTriangle className="h-3.5 w-3.5 text-amber-600 flex-shrink-0 mt-0.5" />}
              <p className="text-[11px] text-slate-700">{w.msg}</p>
            </div>
          ))}
        </div>
      )}
      {warnings.length === 0 && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 flex items-center gap-2">
          <CheckCircle className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
          <p className="text-[11px] text-emerald-800 font-medium">All totals reconcile. Budget is internally consistent.</p>
        </div>
      )}

      {/* BETE Form Table */}
      <div className="rounded-2xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 px-4 py-2.5">
          <p className="text-xs font-bold text-white">Tax Commitment Worksheet — Maine Municipal Budget</p>
          <p className="text-[9px] mt-0.5" style={{ color: '#B3C6C8' }}>Mirrors Maine State Assessor BETE / LD 534 form</p>
        </div>
        <table className="w-full border-collapse">
          <tbody>
            <Row label="APPROPRIATIONS" bold />
            <Row label="Municipal General Fund" value={$(calc.municipalAppropriations)} indent />
            <Row label="School / Local Education" value={$(calc.schoolAppropriations)} indent />
            <Row label="County Assessment" value={$(calc.countyAssessment)} indent />
            <Row label="TIF Financing Plan" value={$(calc.tifFinancingPlan)} indent />
            <Row label="TOTAL APPROPRIATIONS" value={$(calc.totalAppropriations)} bold separator />

            <Row label="DEDUCTIONS" bold separator />
            <Row label="Enterprise Fund Offsets" value={$(calc.enterpriseOffsets)} indent green />
            <Row label="State Revenue Sharing" value={$(calc.stateRevenueSharing)} indent green />
            <Row label="Local Revenues (Fees, Excise, etc.)" value={$(calc.localRevenues)} indent green />
            <Row label="Fund Balance Applied" value={$(calc.fundBalanceUse)} indent green />
            <Row label="Grants & Reimbursements" value={$(calc.grantsAndReimbursements)} indent green />
            <Row label="BETE Reimbursement" value={$(calc.beteReimbursement)} indent green sub="Business Equipment Tax Exemption" />
            <Row label="TOTAL DEDUCTIONS" value={$(calc.totalDeductions)} bold green separator />

            <Row label="NET TO BE RAISED THROUGH TAXATION" value={$(calc.netToBeRaised)} bold separator />

            <Row label="Overlay" value={`${$(calc.overlayDollars)} (${pct(calc.overlayPercent)})`} indent />
            <Row label="TAX FOR COMMITMENT" value={$(calc.taxForCommitment)} bold separator />

            <Row label="ASSESSMENT BASE" bold separator />
            <Row label="Total Assessed Value" value={$(calc.totalAssessedValue)} indent />
            <Row label="Less: Homestead Exemption Value" value={`(${$(calc.homesteadExemptionValue)})`} indent />
            <Row label="Net Taxable Value" value={$(calc.taxableValue)} indent bold />

            <Row label="MILL RATE" bold separator />
            <Row label="Calculated Mill Rate" value={`${mr(calc.calculatedMillRate)} mills`} indent />
            <Row label="Selected Mill Rate" value={`${mr(calc.selectedMillRate)} mills`} indent bold />
            {pyMillRate > 0 && (
              <Row
                label="Prior Year Mill Rate"
                value={`${mr(pyMillRate)} mills (${calc.selectedMillRate - pyMillRate >= 0 ? '+' : ''}${(calc.selectedMillRate - pyMillRate).toFixed(3)} change)`}
                indent
              />
            )}

            <Row label="TAX FOR COMMITMENT (at selected rate)" value={$(calc.selectedCommitment)} bold separator />

            {pyLevy > 0 && (
              <>
                <Row label="Prior Year Levy" value={$(pyLevy)} indent />
                <Row
                  label="Year-over-Year Levy Change"
                  value={`${levyChange >= 0 ? '+' : ''}${$(levyChange)} (${levyChangePct}%)`}
                  indent
                  bold
                />
              </>
            )}

            <tr>
              <td colSpan={2} className="py-1"><div className="border-t border-slate-200" /></td>
            </tr>
            <tr className={calc.reconciled ? 'bg-emerald-50' : 'bg-red-50'}>
              <td className={`py-1.5 pl-2 text-xs font-bold ${calc.reconciled ? 'text-emerald-800' : 'text-red-800'}`}>
                Reconciliation Status
              </td>
              <td className={`py-1.5 text-right text-xs font-bold ${calc.reconciled ? 'text-emerald-700' : 'text-red-700'}`}>
                {calc.reconciled ? '✓ RECONCILED' : '✗ NOT RECONCILED'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Per-property impact */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Tax/Median Home ($150K)', value: `$${Math.round((calc.selectedMillRate / 1000) * 150000)}/yr` },
          { label: 'Tax/$250K Home', value: `$${Math.round((calc.selectedMillRate / 1000) * 250000)}/yr` },
          { label: 'Tax/$500K Property', value: `$${Math.round((calc.selectedMillRate / 1000) * 500000)}/yr` },
        ].map(s => (
          <div key={s.label} className="rounded-lg border border-slate-200 bg-white p-2.5 text-center">
            <p className="text-sm font-bold text-slate-900">{s.value}</p>
            <p className="text-[9px] text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}