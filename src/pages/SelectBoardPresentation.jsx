import React, { useMemo, useState } from 'react';
import { useModel } from '../components/machias/ModelContext';
import { runProFormaFromSettings } from '../components/machias/FinancialModelV2';
import { ChevronLeft, ChevronRight, Printer, Download, BookOpen, Users, DollarSign, TrendingUp, ShieldCheck, CheckCircle2, AlertTriangle, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';

const fmt  = (n) => n == null ? '—' : `$${Math.abs(Math.round(n)).toLocaleString()}`;
const pct  = (n) => `${(n * 100).toFixed(1)}%`;
const fmtK = (n) => {
  const v = Math.abs(n);
  if (v >= 1000000) return `$${(v / 1000000).toFixed(2)}M`;
  return `$${Math.round(v / 1000)}K`;
};

function Slide({ children, notes, slideNum, total }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm min-h-[420px] p-8 flex flex-col">
        {children}
        <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[10px] text-slate-300 font-mono">Town of Machias — Strategic Restructuring Plan</span>
          <span className="text-[10px] text-slate-300 font-mono">{slideNum} / {total}</span>
        </div>
      </div>
      {notes && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
          <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-1">Speaker Notes</p>
          <p className="text-xs text-amber-900 leading-relaxed">{notes}</p>
        </div>
      )}
    </div>
  );
}

function SlideTitle({ label, title, sub }) {
  return (
    <div className="mb-6">
      {label && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>}
      <h2 className="text-2xl font-bold text-slate-900 leading-tight">{title}</h2>
      {sub && <p className="text-sm text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

function BulletList({ items }) {
  return (
    <ul className="space-y-2 mt-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
          <span className="flex-shrink-0 h-4 w-4 rounded-full bg-slate-900 text-white text-[9px] font-bold flex items-center justify-center mt-0.5">{i+1}</span>
          <span>{typeof item === 'string' ? item : item}</span>
        </li>
      ))}
    </ul>
  );
}

function StatRow({ items }) {
  return (
    <div className={`grid gap-4 mt-4`} style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}>
      {items.map((s, i) => (
        <div key={i} className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-center">
          <p className={`text-2xl font-bold ${s.color || 'text-slate-900'}`}>{s.value}</p>
          <p className="text-xs text-slate-600 mt-0.5 font-medium">{s.label}</p>
          {s.sub && <p className="text-[10px] text-slate-400 mt-0.5">{s.sub}</p>}
        </div>
      ))}
    </div>
  );
}

function TwoCol({ left, right }) {
  return (
    <div className="grid grid-cols-2 gap-6 mt-4">
      <div>{left}</div>
      <div>{right}</div>
    </div>
  );
}

export default function SelectBoardPresentation() {
  const { settings } = useModel();
  const data = useMemo(() => runProFormaFromSettings(settings), [settings]);
  const [slide, setSlide] = useState(0);

  const s = settings;
  const d1 = data[0];
  const d2 = data[1];

  const healthAnnual = s.health_tier === 'individual' ? s.health_individual_annual : s.health_family_annual;
  const saFL = Math.round(s.sa_base_salary * (1 + s.fica_rate + s.pers_rate + s.wc_rate) + healthAnnual);
  const bsFL = Math.round(s.bs_base_salary * (1 + s.fica_rate + s.pers_rate + s.wc_rate) + healthAnnual);
  const usePartTime = s.y1_staffing_model === 'parttime_stipend';
  const y5Label = s.y5_senior_hire === 'controller' ? 'Controller' : 'Second Staff Accountant';

  const cashOnly5yr = data.reduce((sum, d) => {
    const cash = d.value.comstarAvoided + d.value.collectionImprovement +
      d.value.stipendSavings + d.value.airportSavings +
      d.value.regionalServices + d.value.emsExternal + d.value.transferStation;
    return sum + cash - d.costs.total;
  }, 0);

  const SLIDES = [
    // 0 — Title
    {
      notes: `Welcome the Select Board. This presentation covers the full administrative restructuring proposal for the Town of Machias. Each slide reflects the current model settings — figures will adjust if assumptions change. Plan for about 30–45 minutes including Q&A.`,
      content: (
        <div className="flex flex-col items-center justify-center flex-1 text-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-slate-900 flex items-center justify-center mb-2">
            <BookOpen className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 leading-tight">Administrative Restructuring,<br/>ERP Modernization &<br/>Regional Service Strategy</h1>
          <p className="text-slate-500 text-sm max-w-md mt-2">A proposal for the Select Board of the Town of Machias<br/>Prepared by: Town Manager & Finance Director</p>
          <div className="flex gap-6 mt-4">
            <div className="text-center"><p className="text-xl font-bold text-emerald-600">{fmtK(cashOnly5yr)}</p><p className="text-xs text-slate-500">5-Year Cash Net</p></div>
            <div className="text-center"><p className="text-xl font-bold text-blue-600">{d1?.gf?.gfNetLevyImpact <= 0 ? 'Levy Neutral' : 'Review GF'}</p><p className="text-xs text-slate-500">Tax Impact Y1</p></div>
            <div className="text-center"><p className="text-xl font-bold text-slate-700">3 positions</p><p className="text-xs text-slate-500">Phase 1 hires</p></div>
          </div>
        </div>
      )
    },
    // 1 — The Problem
    {
      notes: `Frame the problem clearly before proposing solutions. The key message: this is not a spending increase. We are already paying for this work — just at the wrong level. The FD earns ${fmt(s.fd_loaded_cost)}/year all-in. Spending 45% of that time on tasks a $${s.sa_base_salary.toLocaleString()} Staff Accountant should do is the definition of structural inefficiency.`,
      content: (
        <>
          <SlideTitle label="The Challenge" title="We're Paying Executive Rates for Transactional Work" sub="Why the current structure doesn't scale" />
          <TwoCol
            left={
              <div className="space-y-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Finance Director Time (All-In: {fmt(s.fd_loaded_cost)}/yr)</p>
                {[
                  { task: 'Accounts payable & receivable', pct: '15%' },
                  { task: 'Payroll processing', pct: '12%' },
                  { task: 'EMS billing / Comstar oversight', pct: '8%' },
                  { task: 'Informal support to neighboring towns', pct: '6%' },
                  { task: 'Grant tracking', pct: '4%' },
                ].map((t, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-100 rounded-full h-2">
                      <div className="bg-red-400 h-2 rounded-full" style={{ width: t.pct }} />
                    </div>
                    <span className="text-xs text-slate-600 w-8 text-right font-mono">{t.pct}</span>
                    <span className="text-xs text-slate-500 w-40">{t.task}</span>
                  </div>
                ))}
                <p className="text-sm font-bold text-red-600 mt-3">45% of FD time = {fmt(s.fd_loaded_cost * 0.45)}/yr on sub-FD tasks</p>
              </div>
            }
            right={
              <div className="space-y-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Additional Pain Points</p>
                {[
                  { label: 'Annual Comstar fees', value: fmt(d1?.value?.comstarAvoided), color: 'text-red-600' },
                  { label: 'Informal stipends (unstructured)', value: fmt(s.stipend_elimination), color: 'text-red-600' },
                  { label: 'Audit separation-of-duties risk', value: fmt(s.control_risk_exposure), color: 'text-red-600' },
                  { label: 'TM time on finance admin (18–22%)', value: fmt(s.tm_loaded_cost * 0.20), color: 'text-amber-600' },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
                    <span className="text-xs text-slate-700">{item.label}</span>
                    <span className={`text-sm font-bold ${item.color}`}>{item.value}</span>
                  </div>
                ))}
              </div>
            }
          />
        </>
      )
    },
    // 2 — The Solution
    {
      notes: `Three simultaneous initiatives — emphasize they are designed to be mutually reinforcing, not independent line items. The GA Coordinator is relatively independent and primarily relieves TM time directly. The Billing Specialist reports to the FD but is funded through the ambulance transfer. No single initiative creates the full value — together they do.`,
      content: (
        <>
          <SlideTitle label="The Plan" title="Three Simultaneous Initiatives" sub="Each initiative funds itself through different mechanisms" />
          <div className="grid grid-cols-3 gap-4 mt-4">
            {[
              { num: '1', title: 'Administrative Restructuring', icon: Users, items: ['Staff Accountant — General Fund', 'Billing Specialist — via Ambulance transfer', 'GA Coordinator — General Fund stipend', 'Revenue Coordinator (Year 3 trigger)', `${y5Label} (Year 5 trigger)`], color: 'bg-slate-900 text-white' },
              { num: '2', title: 'ERP Modernization', icon: Monitor, items: ['Replace legacy Trio software', 'Fund accounting + audit trails', 'Payroll & AR integration', 'Regional services capacity', 'Estimated net Y1 cost: ' + fmt(s.erp_y1_cost - s.erp_designated_fund_offset)], color: 'bg-violet-700 text-white' },
              { num: '3', title: 'Regional Services', icon: Target, items: ['Roque Bluffs — FY2027 target', 'Machiasport — active conversations', 'Marshfield, Whitneyville, Northfield', 'External EMS billing', 'Transfer Station cost-sharing'], color: 'bg-blue-700 text-white' },
            ].map(init => {
              const Icon = init.icon;
              return (
                <div key={init.num} className="rounded-xl border border-slate-200 overflow-hidden">
                  <div className={`px-4 py-3 ${init.color} flex items-center gap-2`}>
                    <Icon className="h-4 w-4" />
                    <p className="font-bold text-sm">{init.title}</p>
                  </div>
                  <ul className="p-3 space-y-1">
                    {init.items.map((item, i) => (
                      <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
                        <span className="text-slate-300 mt-0.5">›</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </>
      )
    },
    // 3 — Staffing Details
    {
      notes: `Walk through each position's funding source carefully. The Billing Specialist is paid from the GF admin budget but the ambulance transfer increases to cover it — it does not hit the levy. The GA Coordinator is a modest stipend with outsized grant potential. The Revenue Coordinator cannot be hired until regional revenue covers its full all-in cost — it is self-funding by design.`,
      content: (
        <>
          <SlideTitle label="Staffing" title="Position Details & Fund Sources" sub="All-in costs include salary, FICA, PERS, Workers' Comp, and health insurance" />
          <div className="space-y-2 mt-4">
            {[
              { pos: usePartTime ? 'PT Accounting Role (Y1)' : 'Staff Accountant', base: usePartTime ? `Stipend reallocation` : fmt(s.sa_base_salary), allin: usePartTime ? `${fmt(s.ga_stipend + (s.clerk_stipend_realloc || 26000))}` : fmt(saFL), y1: fmt(d1?.costs?.staffAccountant), fund: 'General Fund', timing: 'Month 1–3' },
              { pos: 'Billing Specialist', base: fmt(s.bs_base_salary), allin: fmt(bsFL), y1: fmt(d1?.costs?.billingSpecialist), fund: 'GF Admin / Amb. Transfer', timing: 'Month 7' },
              { pos: 'GA Coordinator', base: fmt(s.ga_stipend), allin: fmt(s.ga_stipend), y1: usePartTime ? '$0 absorbed' : fmt(d1?.costs?.gaCoordinator), fund: 'General Fund', timing: 'Month 9' },
              { pos: 'Revenue Coordinator', base: fmt(s.rc_base_salary), allin: fmt(s.rc_base_salary), y1: 'Trigger-based', fund: 'Regional Revenue', timing: 'Y3 — self-funded' },
              { pos: y5Label, base: s.y5_senior_hire === 'controller' ? fmt(s.controller_base_salary) : fmt(s.sa_base_salary), allin: '—', y1: 'Trigger-based', fund: 'General Fund', timing: 'Y5 H2 (½ yr)' },
            ].map((row, i) => (
              <div key={i} className="grid text-xs rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-2 gap-2" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1.5fr 1fr' }}>
                <span className="font-semibold text-slate-800">{row.pos}</span>
                <span className="font-mono text-slate-600">{row.base}</span>
                <span className="font-mono text-slate-700 font-semibold">{row.allin}</span>
                <span className="font-mono text-slate-600">{row.y1}</span>
                <span className="text-slate-500">{row.fund}</span>
                <span className="text-slate-400">{row.timing}</span>
              </div>
            ))}
            <div className="grid text-[10px] text-slate-400 px-3 gap-2" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1.5fr 1fr' }}>
              <span>Position</span><span>Base</span><span>All-In</span><span>Y1 Cost</span><span>Fund Source</span><span>Timing</span>
            </div>
          </div>
        </>
      )
    },
    // 4 — EMS Billing
    {
      notes: `The Comstar fee is ${fmt(d1?.value?.comstarAvoided)} in Year 1 and grows every year. The Billing Specialist's all-in cost is ${fmt(bsFL)} — less than the fee we currently pay Comstar. Even without any collection improvement, we come out ahead. And the Billing Specialist also handles airport billing, fire department billing, rental billing, and other AR — making their value even higher.`,
      content: (
        <>
          <SlideTitle label="EMS Billing" title="From Comstar to In-House" sub={`${s.ems_transports.toLocaleString()} annual calls — growing at ${pct(s.transport_growth_rate)}/yr`} />
          <TwoCol
            left={
              <div className="space-y-3">
                <div className="rounded-xl bg-red-50 border border-red-200 p-4">
                  <p className="text-xs font-bold text-red-700 uppercase tracking-wider mb-2">Current (Comstar)</p>
                  <p className="text-sm text-red-800">Collection rate: <strong>{pct(s.comstar_collection_rate)}</strong></p>
                  <p className="text-sm text-red-800">Annual fee: <strong>{fmt(d1?.value?.comstarAvoided)}</strong></p>
                  <p className="text-xs text-red-600 mt-1">Fee grows annually with call volume</p>
                </div>
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
                  <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2">Proposed (In-House)</p>
                  <p className="text-sm text-emerald-800">Y1 rate: <strong>{pct(s.inhouse_y1_rate)}</strong></p>
                  <p className="text-sm text-emerald-800">Y2+ rate: <strong>{pct(s.inhouse_steady_rate)}</strong></p>
                  <p className="text-sm text-emerald-800">BS all-in cost: <strong>{fmt(bsFL)}</strong></p>
                  <p className="text-xs text-emerald-600 mt-1">Also handles: airport billing, fire dept. billing, rental AR, and more</p>
                </div>
              </div>
            }
            right={
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">5-Year EMS Net Benefit</p>
                <div className="space-y-2">
                  {data.map(d => (
                    <div key={d.year} className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">{d.fiscalYear}</span>
                      <div className="flex-1 mx-3 bg-slate-100 rounded-full h-1.5">
                        <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, ((d.value.comstarAvoided + d.value.collectionImprovement - d.costs.billingSpecialist) / 80000) * 100)}%` }} />
                      </div>
                      <span className="font-mono font-semibold text-emerald-700">{fmt(d.value.comstarAvoided + d.value.collectionImprovement - d.costs.billingSpecialist)}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs font-bold text-slate-700 mt-4 border-t border-slate-100 pt-2">
                  5-Year Total: {fmt(data.reduce((sum, d) => sum + d.value.comstarAvoided + d.value.collectionImprovement - d.costs.billingSpecialist, 0))}
                </p>
              </div>
            }
          />
        </>
      )
    },
    // 5 — Regional Services
    {
      notes: `Neighboring towns want to pay Machias for financial services. All municipalities face stronger scrutiny on finances — Washington County, Penobscot, Farmington, and Waldo County all have towns with underskilled individuals in financial roles. Machias can be the county seat of financial administration. Active conversations are already happening with Roque Bluffs about finance services AND Transfer Station access in FY2027. The Finance Director manages these relationships.`,
      content: (
        <>
          <SlideTitle label="Regional Services" title="Machias as the County Seat of Financial Administration" sub="Neighboring towns want to pay us — active conversations are already happening" />
          <div className="grid grid-cols-2 gap-6 mt-4">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Contract Pipeline</p>
              <div className="space-y-2">
                {[
                  { town: 'Roque Bluffs', status: 'Active conversations', y1: fmt(Math.round(s.rb_annual_contract * 4/12)), note: 'Finance + Transfer Station FY2027', color: 'bg-emerald-100 text-emerald-800' },
                  { town: 'Machiasport', status: 'Confirmed interest', y1: fmt(Math.round(s.machiasport_annual_contract * 4/12)), note: 'Active conversations ongoing', color: 'bg-blue-100 text-blue-800' },
                  { town: 'Marshfield', status: 'Prospective Y2', y1: '—', note: 'Outreach in Y1', color: 'bg-slate-100 text-slate-600' },
                  { town: 'Whitneyville', status: 'Prospective Y3', y1: '—', note: fmt(s.whitneyville_annual_contract) + '/yr from Y3', color: 'bg-slate-100 text-slate-600' },
                  { town: 'Northfield', status: 'Prospective Y3', y1: '—', note: fmt(s.northfield_annual_contract) + '/yr from Y3', color: 'bg-slate-100 text-slate-600' },
                ].map((row, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg border border-slate-100 bg-white px-3 py-2">
                    <span className="font-semibold text-slate-800 text-xs w-24">{row.town}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${row.color}`}>{row.status}</span>
                    <span className="font-mono text-emerald-700 text-xs ml-auto">{row.y1}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">5-Year Regional Revenue</p>
              <div className="space-y-2">
                {data.map(d => {
                  const total = d.value.regionalServices + d.value.emsExternal;
                  return (
                    <div key={d.year} className="flex items-center gap-3 text-xs">
                      <span className="text-slate-500 w-12">{d.fiscalYear}</span>
                      <div className="flex-1 bg-slate-100 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${Math.min(100, (total / 130000) * 100)}%` }} />
                      </div>
                      <span className="font-mono font-semibold text-blue-700 w-16 text-right">{fmt(total)}</span>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs font-bold text-slate-700 mt-4 border-t border-slate-100 pt-2">
                5-Yr Total: {fmt(data.reduce((sum, d) => sum + d.value.regionalServices + d.value.emsExternal, 0))}
              </p>
              <p className="text-xs text-slate-500 mt-2">Finance Director manages all regional relationships. Revenue Coordinator hired in Y3 when regional revenue covers all-in position cost.</p>
            </div>
          </div>
        </>
      )
    },
    // 6 — Levy Neutrality
    {
      notes: `This is the most important slide for the Board. Lead with the bottom line: no tax increase. Walk through the GF-funded costs vs. the cash offsets. The Billing Specialist does NOT appear in this calculation — it's handled through the ambulance fund transfer. The critical message: new revenue and avoided costs pay for the new positions.`,
      content: (
        <>
          <SlideTitle label="Fiscal Impact" title="Levy Neutrality — Year 1 Analysis" sub="GF-funded costs vs. GF cash offsets" />
          <TwoCol
            left={
              <div>
                <p className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-2">GF-Funded Costs</p>
                <div className="space-y-1.5">
                  {[
                    [`${usePartTime ? 'PT Accounting Role' : 'Staff Accountant'}`, fmt(d1?.costs?.staffAccountant)],
                    ['GA Coordinator', fmt(d1?.costs?.gaCoordinator)],
                    ['Airport Stipend', fmt(d1?.costs?.airportStipend)],
                    ['ERP (net of offset)', fmt(d1?.costs?.implementation)],
                  ].map(([label, val], i) => (
                    <div key={i} className="flex justify-between text-xs rounded bg-red-50 border border-red-100 px-3 py-1.5">
                      <span className="text-slate-700">{label}</span>
                      <span className="font-mono text-red-700">{val}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-xs rounded bg-slate-100 border border-slate-200 px-3 py-1.5 font-bold">
                    <span>Total GF Costs</span>
                    <span className="font-mono">{fmt(d1?.gf?.gfFundedCosts)}</span>
                  </div>
                </div>
              </div>
            }
            right={
              <div>
                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-2">GF Cash Offsets</p>
                <div className="space-y-1.5">
                  {[
                    ['Regional contracts', fmt(d1?.value?.regionalServices)],
                    ['Comstar fee avoided', fmt(d1?.value?.comstarAvoided)],
                    ['Collection improvement', fmt(d1?.value?.collectionImprovement)],
                    ['Stipend elimination', fmt(d1?.value?.stipendSavings)],
                    ['Airport savings', fmt(d1?.value?.airportSavings)],
                    ['Enterprise overhead', fmt(d1?.value?.enterpriseOverhead)],
                  ].map(([label, val], i) => (
                    <div key={i} className="flex justify-between text-xs rounded bg-emerald-50 border border-emerald-100 px-3 py-1.5">
                      <span className="text-slate-700">{label}</span>
                      <span className="font-mono text-emerald-700">{val}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-xs rounded bg-slate-100 border border-slate-200 px-3 py-1.5 font-bold">
                    <span>Total Offsets</span>
                    <span className="font-mono">{fmt(d1?.gf?.gfCashOffsets)}</span>
                  </div>
                </div>
              </div>
            }
          />
          <div className={`mt-4 rounded-xl p-4 text-center ${d1?.gf?.gfNetLevyImpact <= 0 ? 'bg-emerald-50 border border-emerald-300' : 'bg-red-50 border border-red-300'}`}>
            <p className={`text-xl font-bold ${d1?.gf?.gfNetLevyImpact <= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
              {d1?.gf?.gfNetLevyImpact <= 0
                ? `Year 1 GF Surplus: ${fmt(Math.abs(d1?.gf?.gfNetLevyImpact))} — No Tax Increase Required`
                : `Year 1 GF Gap: ${fmt(d1?.gf?.gfNetLevyImpact)} — Review Settings`}
            </p>
            <p className="text-xs text-slate-500 mt-1">Billing Specialist excluded — funded via Ambulance Fund transfer</p>
          </div>
        </>
      )
    },
    // 7 — 5-Year Summary
    {
      notes: `Show the full 5-year picture. The top line — ${fmtK(cashOnly5yr)} — is the most conservative number: actual cash in minus actual cash out, with no capacity value or soft benefits included. If the Board is skeptical of anything, point to that number and note that it excludes ERP value, FD/TM time savings, and internal control risk mitigation. The plan stands on cash alone.`,
      content: (
        <>
          <SlideTitle label="5-Year Outlook" title="Financial Summary" sub={`Conservative cash net: ${fmtK(cashOnly5yr)} over 5 years`} />
          <div className="space-y-2 mt-4">
            <div className="grid text-[10px] text-slate-400 px-3 gap-2" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 1fr' }}>
              <span></span>{data.map(d => <span key={d.year}>{d.fiscalYear}</span>)}<span>5-Yr</span>
            </div>
            {[
              { label: 'Structural Value', key: d => d.value.structuralTotal, color: 'text-slate-700' },
              { label: 'Regional Value', key: d => d.value.regionalTotal, color: 'text-blue-700' },
              { label: 'ERP Value', key: d => d.value.erpValue, color: 'text-violet-700' },
              { label: 'Total Value', key: d => d.value.total, color: 'text-slate-900 font-bold', border: true },
              { label: 'Total Costs', key: d => d.costs.total, color: 'text-red-600' },
              { label: 'Net', key: d => d.net, color: 'text-emerald-700 font-bold', border: true },
            ].map((row, i) => {
              const total = data.reduce((s, d) => s + row.key(d), 0);
              return (
                <div key={i} className={`grid text-xs px-3 py-1.5 rounded-lg gap-2 ${row.border ? 'bg-slate-100 border border-slate-200' : 'bg-white border border-slate-50'}`}
                  style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 1fr' }}>
                  <span className={`font-medium text-slate-700 ${row.color.includes('bold') ? 'font-bold' : ''}`}>{row.label}</span>
                  {data.map(d => <span key={d.year} className={`font-mono ${row.color}`}>{fmt(row.key(d))}</span>)}
                  <span className={`font-mono ${row.color}`}>{fmt(total)}</span>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-slate-400 mt-2">Conservative cash-only 5-yr net (excludes FD/TM capacity & control risk): <strong className="text-slate-700">{fmtK(cashOnly5yr)}</strong></p>
        </>
      )
    },
    // 8 — Next Steps
    {
      notes: `Close with the ask. The Board needs to take one action today: authorize the Staff Accountant recruitment. Everything else can follow from there. Emphasize: the regional services conversations are happening NOW with Roque Bluffs — delay has a cost. Every month of delay is a month of Comstar fees and a month of structural inefficiency.`,
      content: (
        <>
          <SlideTitle label="Next Steps" title="What the Select Board Needs to Decide" sub="Each action has a clear owner and dependency" />
          <div className="space-y-2 mt-4">
            {[
              { num: 1, urgency: 'Immediate', action: 'Authorize Staff Accountant recruitment (position + salary range)', body: 'Select Board', color: 'bg-red-50 border-red-200' },
              { num: 2, urgency: 'Month 1–3', action: 'Draft interlocal agreements — Roque Bluffs & Machiasport', body: 'Town Manager', color: 'bg-amber-50 border-amber-200' },
              { num: 3, urgency: 'Month 1–6', action: 'Comstar transition planning and EMS billing software review (MEFIRS)', body: 'Finance Director', color: 'bg-amber-50 border-amber-200' },
              { num: 4, urgency: 'Month 3–6', action: 'Evaluate TRIO AR module purchase ($3K–$5K) and COA gap analysis', body: 'Finance Director', color: 'bg-amber-50 border-amber-200' },
              { num: 5, urgency: 'Month 7', action: 'Authorize Billing Specialist position + ambulance fund transfer adjustment', body: 'Select Board', color: 'bg-blue-50 border-blue-200' },
              { num: 6, urgency: 'Town Meeting', action: 'ERP budget appropriation (~$47K, $24K offset available)', body: 'Town Meeting', color: 'bg-slate-50 border-slate-200' },
            ].map(step => (
              <div key={step.num} className={`flex gap-3 rounded-xl border p-3 ${step.color}`}>
                <div className="flex-shrink-0 h-6 w-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">{step.num}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-slate-900 text-sm">{step.action}</p>
                    <span className="text-[10px] text-slate-400 font-mono flex-shrink-0">{step.urgency}</span>
                  </div>
                  <p className="text-xs text-slate-500">Decision body: <strong className="text-slate-700">{step.body}</strong></p>
                </div>
              </div>
            ))}
          </div>
        </>
      )
    },
  ];

  const total = SLIDES.length;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Select Board Presentation</h1>
          <p className="text-xs text-slate-500">Dynamic — figures reflect current model settings</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handlePrint}>
            <Printer className="h-3.5 w-3.5" /> Print / Save PDF
          </Button>
        </div>
      </div>

      {/* Slide counter + nav */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" disabled={slide === 0} onClick={() => setSlide(s => s - 1)} className="h-8 w-8 p-0">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex gap-1.5 flex-1 justify-center">
          {SLIDES.map((_, i) => (
            <button key={i} onClick={() => setSlide(i)}
              className={`h-1.5 rounded-full transition-all ${i === slide ? 'bg-slate-900 w-6' : 'bg-slate-200 w-1.5 hover:bg-slate-400'}`} />
          ))}
        </div>
        <Button variant="outline" size="sm" disabled={slide === total - 1} onClick={() => setSlide(s => s + 1)} className="h-8 w-8 p-0">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <Slide notes={SLIDES[slide].notes} slideNum={slide + 1} total={total}>
        {SLIDES[slide].content}
      </Slide>

      {/* Slide index */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-4 py-2 border-b border-slate-100 bg-slate-50">
          <p className="text-xs font-semibold text-slate-600">All Slides</p>
        </div>
        <div className="divide-y divide-slate-50">
          {[
            'Title', 'The Problem', 'The Three Initiatives', 'Staffing Details',
            'EMS Billing Transition', 'Regional Services', 'Levy Neutrality', '5-Year Summary', 'Next Steps'
          ].map((title, i) => (
            <button key={i} onClick={() => setSlide(i)}
              className={`w-full text-left px-4 py-2 text-xs flex items-center gap-3 hover:bg-slate-50 transition-colors ${slide === i ? 'bg-slate-900 text-white' : 'text-slate-600'}`}>
              <span className={`font-mono text-[10px] w-4 ${slide === i ? 'text-slate-400' : 'text-slate-300'}`}>{i + 1}</span>
              {title}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}