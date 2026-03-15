/**
 * BudgetInputsPanel — Left-hand form: all appropriations and deductions
 * Drives the BETE calculation in the parent.
 */
import React from 'react';

const fmt = n => `$${Math.round(Math.abs(n || 0)).toLocaleString()}`;

function NumField({ label, value, onChange, sub, highlight }) {
  return (
    <div className={`rounded-lg p-2.5 border ${highlight ? 'border-blue-200 bg-blue-50/40' : 'border-slate-100 bg-slate-50/50'}`}>
      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</label>
      {sub && <p className="text-[9px] text-slate-400 mb-1">{sub}</p>}
      <div className="relative">
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">$</span>
        <input
          type="number"
          min={0}
          value={value || ''}
          onChange={e => onChange(parseFloat(e.target.value) || 0)}
          className="w-full pl-5 pr-2 py-1.5 text-xs font-mono rounded border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 text-right"
        />
      </div>
    </div>
  );
}

export default function BudgetInputsPanel({ inputs, onChange }) {
  const set = (key) => (val) => onChange({ ...inputs, [key]: val });

  return (
    <div className="space-y-4">
      {/* Appropriations */}
      <section>
        <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest mb-2 flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-slate-800" /> Appropriations
        </p>
        <div className="space-y-2">
          <NumField label="Municipal General Fund" value={inputs.municipalAppropriations} onChange={set('municipalAppropriations')} highlight />
          <NumField label="School / Local Education" value={inputs.schoolAppropriations} onChange={set('schoolAppropriations')} sub="Local share of RSU or tuition" />
          <NumField label="County Assessment" value={inputs.countyAssessment} onChange={set('countyAssessment')} sub="Washington County apportionment" />
          <NumField label="TIF Financing Plan" value={inputs.tifFinancingPlan} onChange={set('tifFinancingPlan')} sub="Amount retained in TIF district" />
          <div className="rounded-lg bg-slate-100 px-3 py-2 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Total Appropriations</span>
            <span className="font-mono text-sm font-bold text-slate-900">{fmt(inputs.municipalAppropriations + inputs.schoolAppropriations + inputs.countyAssessment + inputs.tifFinancingPlan)}</span>
          </div>
        </div>
      </section>

      {/* Deductions */}
      <section>
        <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest mb-2 flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-emerald-600" /> Deductions (Non-Tax Revenue)
        </p>
        <div className="space-y-2">
          <NumField label="Enterprise Fund Offsets" value={inputs.enterpriseOffsets} onChange={set('enterpriseOffsets')} sub="Ambulance, Sewer, Transfer Stn transfers" />
          <NumField label="State Revenue Sharing" value={inputs.stateRevenueSharing} onChange={set('stateRevenueSharing')} sub="Maine Municipal Revenue Sharing" />
          <NumField label="Local Revenues" value={inputs.localRevenues} onChange={set('localRevenues')} sub="Fees, excise tax, licenses, permits" />
          <NumField label="Fund Balance Use" value={inputs.fundBalanceUse} onChange={set('fundBalanceUse')} sub="Undesignated GF balance applied" />
          <NumField label="Grants & Reimbursements" value={inputs.grantsAndReimbursements} onChange={set('grantsAndReimbursements')} />
          <NumField label="BETE Reimbursement" value={inputs.beteReimbursement} onChange={set('beteReimbursement')} sub="Business Equipment Tax Exemption" />
          <div className="rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-2 flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800">Total Deductions</span>
            <span className="font-mono text-sm font-bold text-emerald-800">
              {fmt(inputs.enterpriseOffsets + inputs.stateRevenueSharing + inputs.localRevenues + inputs.fundBalanceUse + inputs.grantsAndReimbursements + inputs.beteReimbursement)}
            </span>
          </div>
        </div>
      </section>

      {/* Assessed Value */}
      <section>
        <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest mb-2 flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-blue-600" /> Assessment Base
        </p>
        <div className="space-y-2">
          <NumField label="Total Assessed Value" value={inputs.totalAssessedValue} onChange={set('totalAssessedValue')} highlight />
          <NumField label="Homestead Exemption Value" value={inputs.homesteadExemptionValue} onChange={set('homesteadExemptionValue')} sub="Reduces taxable valuation" />
        </div>
      </section>

      {/* Overlay */}
      <section>
        <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest mb-2 flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-amber-500" /> Overlay
        </p>
        <div className="rounded-lg p-2.5 border border-amber-100 bg-amber-50/40">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Overlay %</label>
          <p className="text-[9px] text-slate-400 mb-1">Applied to net raised; covers abatements & uncollectibles</p>
          <div className="relative">
            <input
              type="number"
              min={0} max={10} step={0.1}
              value={inputs.overlayPercent || ''}
              onChange={e => set('overlayPercent')(parseFloat(e.target.value) || 0)}
              className="w-full pr-6 pl-2 py-1.5 text-xs font-mono rounded border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 text-right"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span>
          </div>
        </div>
      </section>

      {/* Prior Year Comparison */}
      <section>
        <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest mb-2 flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-purple-500" /> Prior Year (Comparison)
        </p>
        <div className="space-y-2">
          <NumField label="Prior Year Net Raised" value={inputs.priorYearNetRaised} onChange={set('priorYearNetRaised')} />
          <NumField label="Prior Year Mill Rate" value={inputs.priorYearMillRate} onChange={set('priorYearMillRate')} sub="Current adopted mill rate" />
          <NumField label="Prior Year Levy" value={inputs.priorYearLevy} onChange={set('priorYearLevy')} />
        </div>
      </section>
    </div>
  );
}