import React, { useMemo } from 'react';
import { useModel } from '../components/machias/ModelContext';
import { runProFormaFromSettings } from '../components/machias/FinancialModelV2';
import { BookOpen, DollarSign, Users, Monitor, Landmark, TrendingUp, ShieldCheck, Target, AlertTriangle } from 'lucide-react';

function Section({ icon, title, children }) {
  const Icon = icon;
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2.5 border-b border-slate-200 pb-2">
        {Icon && <Icon className="h-4 w-4 text-slate-600 flex-shrink-0" />}
        <h2 className="text-base font-bold text-slate-900 tracking-tight">{title}</h2>
      </div>
      <div className="text-sm text-slate-700 leading-relaxed space-y-2">{children}</div>
    </div>
  );
}

function Callout({ color = 'slate', children }) {
  const colors = {
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    amber: 'bg-amber-50 border-amber-200 text-amber-800',
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
    slate: 'bg-slate-50 border-slate-200 text-slate-800',
    red: 'bg-red-50 border-red-200 text-red-800',
  };
  return (
    <div className={`rounded-xl border p-4 text-xs leading-relaxed ${colors[color]}`}>
      {children}
    </div>
  );
}

function DataRow({ label, value, highlight }) {
  return (
    <div className={`flex justify-between items-center py-1.5 border-b border-slate-100 last:border-0 ${highlight ? 'font-semibold' : ''}`}>
      <span className="text-slate-600">{label}</span>
      <span className="font-mono text-slate-900">{value}</span>
    </div>
  );
}

const fmt = (n) => n == null ? '—' : `$${Math.abs(Math.round(n)).toLocaleString()}`;

export default function Narrative() {
  const { settings } = useModel();
  const data = useMemo(() => runProFormaFromSettings(settings), [settings]);

  const s = settings;
  const d1 = data[0];
  const d2 = data[1];
  const d5 = data[4];

  const cashOnly5yr = data.reduce((sum, d) => {
    const cash = d.value.comstarAvoided + d.value.collectionImprovement +
      d.value.stipendSavings + d.value.airportSavings +
      d.value.regionalServices + d.value.emsExternal + d.value.transferStation;
    return sum + cash - d.costs.total;
  }, 0);

  const cumulative = data.reduce((sum, d) => sum + d.net, 0);

  const usePartTime = s.y1_staffing_model === 'parttime_stipend';
  const y5SeniorLabel = s.y5_senior_hire === 'controller' ? 'Controller (½ year)' : 'Second Staff Accountant';
  const healthLabel = s.health_tier === 'individual' ? 'Individual' : 'Family';

  return (
    <div className="max-w-3xl mx-auto space-y-10 pb-16">

      {/* Title */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 p-7 text-white">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="h-5 w-5 text-slate-400" />
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Strategic Narrative</span>
        </div>
        <h1 className="text-xl font-bold mb-1">Town of Machias — Administrative Restructuring</h1>
        <p className="text-sm text-slate-400">A comprehensive rationale for the proposed Finance & Administration realignment, ERP modernization, and regional service strategy. All figures reflect current model settings.</p>
        <div className="flex gap-6 mt-5 flex-wrap">
          <div><p className="text-2xl font-bold text-emerald-400">{fmt(cashOnly5yr)}</p><p className="text-[10px] text-slate-400">5-Yr Cash Net</p></div>
          <div><p className="text-2xl font-bold text-slate-300">{fmt(cumulative)}</p><p className="text-[10px] text-slate-400">5-Yr Total Value</p></div>
          <div><p className="text-2xl font-bold text-blue-400">{d1?.gf?.gfNetLevyImpact <= 0 ? 'Levy Neutral Y1' : 'Review Y1'}</p><p className="text-[10px] text-slate-400">General Fund Impact</p></div>
        </div>
      </div>

      {/* 1. Executive Summary */}
      <Section icon={BookOpen} title="1. Executive Summary">
        <p>
          The Town of Machias currently relies on its Finance Director and Town Manager to perform a significant volume of transactional financial work — accounts payable, payroll processing, EMS billing, airport inspection oversight, and informal accounting support to neighboring municipalities. This arrangement is costly, exposes the Town to material internal control risk, and consumes executive bandwidth that should be directed toward strategic management, economic development, and intergovernmental leadership.
        </p>
        <p>
          This plan proposes creating three dedicated positions —{' '}
          <strong>Staff Accountant</strong> ({fmt(s.sa_base_salary)} base),{' '}
          <strong>Billing Specialist</strong> ({fmt(s.bs_base_salary)} base, Ambulance Fund), and{' '}
          <strong>GA Coordinator</strong> ({fmt(s.ga_stipend)} stipend) — along with a formal ERP modernization, an in-house EMS billing transition, and a regional financial services program.
        </p>
        <p>
          The restructuring is designed to be <strong>levy-neutral from Year 1</strong>. Non-tax revenue streams, avoided costs, and enterprise overhead recoveries exceed the total cost of the new positions. Over five years, the plan generates{' '}
          <strong>{fmt(cashOnly5yr)} in actual cash</strong> and{' '}
          <strong>{fmt(cumulative)} in total financial value</strong> (including capacity and risk mitigation).
        </p>
        <Callout color="emerald">
          <strong>Core finding:</strong> The Town already spends more than {fmt(229000)} annually in structural inefficiency — executive compensation on transactional tasks, outsourced billing fees, and informal stipend arrangements. This plan formalizes that expenditure into right-sized roles at the appropriate level.
        </Callout>
      </Section>

      {/* 2. The Problem */}
      <Section icon={AlertTriangle} title="2. The Problem — Structural Inefficiency">
        <p>
          The Finance Director's fully loaded cost is estimated at <strong>{fmt(s.fd_loaded_cost)}/year</strong>. At present, approximately 45% of FD time in Year 1 — rising to 60% by Year 3 — is consumed by tasks that do not require a Finance Director's expertise. Similarly, the Town Manager's fully loaded cost is <strong>{fmt(s.tm_loaded_cost)}/year</strong>, with approximately 18–22% of TM time directed toward accounting oversight and financial administration.
        </p>
        <p>
          In parallel, Machias pays <strong>Comstar {(s.comstar_fee_rate * 100).toFixed(2)}% of gross EMS collections</strong> to manage billing for its Ambulance Service — a fee that compounds annually as transport volume grows. At {s.ems_transports.toLocaleString()} annual transports and {fmt(s.avg_revenue_per_transport)} average revenue per transport, Comstar fees are approximately {fmt(d1?.value?.comstarAvoided)} per year in Year 1 alone.
        </p>
        <p>
          The Town also maintains informal stipend arrangements totaling approximately {fmt(s.stipend_elimination)}/year for administrative support functions that should be consolidated into a formal role.
        </p>
        <Callout color="amber">
          <strong>Internal control risk:</strong> The current staffing model creates separation-of-duties deficiencies. The auditors have flagged this. The control risk exposure is estimated at <strong>{fmt(s.control_risk_exposure)}/year</strong> — representing the realistic value of errors, audit adjustments, and missed grant opportunities attributable to inadequate finance staffing.
        </Callout>
      </Section>

      {/* 3. The Proposed Staffing Structure */}
      <Section icon={Users} title="3. Proposed Staffing Structure">
        {usePartTime ? (
          <>
            <p>
              <strong>Year 1 — Part-Time + Stipend Reallocation Model:</strong> Rather than hiring a full-time Staff Accountant immediately, Year 1 uses a part-time individual funded through the existing GA stipend ({fmt(s.ga_stipend)}) plus {fmt(s.clerk_stipend_realloc)} in reallocated clerk stipends. This person absorbs GA coordinator duties and provides accounting support while the Town establishes processes and prepares for a full-time hire. Total Y1 accounting role cost: <strong>{fmt(s.ga_stipend + s.clerk_stipend_realloc)}</strong>.
            </p>
            <p>
              <strong>Year 2 — Full-Time Staff Accountant hired</strong> at {fmt(s.sa_base_salary)} base salary with {healthLabel} health benefits, FICA ({(s.fica_rate * 100).toFixed(2)}%), Maine PERS ({(s.pers_rate * 100).toFixed(2)}%), and Workers' Comp ({(s.wc_rate * 100).toFixed(2)}%). GA Coordinator stipend resumes as a separate arrangement.
            </p>
          </>
        ) : (
          <p>
            <strong>Year 1 — Full-Time Staff Accountant:</strong> Hired at {fmt(s.sa_base_salary)} base salary with {healthLabel} health benefits, FICA ({(s.fica_rate * 100).toFixed(2)}%), Maine PERS ({(s.pers_rate * 100).toFixed(2)}%), and Workers' Comp ({(s.wc_rate * 100).toFixed(2)}%). Fully loaded Year 1 cost: <strong>{fmt(d1?.costs?.staffAccountant)}</strong>.
          </p>
        )}
        <p>
          <strong>Billing Specialist</strong> ({fmt(s.bs_base_salary)} base) is funded entirely by the Ambulance Fund — not a General Fund line item. This position manages in-house EMS billing beginning at 85.5% collection efficiency (vs current {(s.comstar_collection_rate * 100).toFixed(1)}% Comstar rate), ramping to a {(s.inhouse_steady_rate * 100).toFixed(0)}% steady-state target.
        </p>
        <p>
          <strong>GA Coordinator</strong> ({fmt(s.ga_stipend)} stipend) manages grant applications, reporting, and compliance — a function currently distributed across the FD and TM.
        </p>
        <p>
          <strong>Revenue Coordinator</strong> ({fmt(s.rc_base_salary)} base) is a trigger-based hire in Year 3, funded entirely by regional services contract revenue once that revenue exceeds the fully loaded position cost. No hire occurs unless contracts cover the cost.
        </p>
        <p>
          <strong>Year 5 Senior Hire: {y5SeniorLabel}</strong> — added at half-year in Year 5 once the department has sufficient workload to support senior-level capacity or a second accountant.
        </p>

        <div className="rounded-xl border border-slate-200 overflow-hidden mt-2">
          <div className="bg-slate-50 px-4 py-2 text-[10px] font-semibold text-slate-500 uppercase grid grid-cols-3">
            <span>Position</span><span>Y1 Cost</span><span>Fund Source</span>
          </div>
          {[
            { pos: usePartTime ? 'PT Accounting Role (Y1)' : 'Staff Accountant', cost: fmt(d1?.costs?.staffAccountant), fund: 'General Fund' },
            { pos: 'Billing Specialist (6 mo)', cost: fmt(d1?.costs?.billingSpecialist), fund: 'Ambulance Fund' },
            { pos: 'GA Coordinator', cost: usePartTime ? '$0 (absorbed Y1)' : fmt(d1?.costs?.gaCoordinator), fund: 'General Fund' },
            { pos: 'Revenue Coordinator', cost: 'Y3 trigger', fund: 'Regional Revenue' },
            { pos: y5SeniorLabel, cost: 'Y5 trigger', fund: 'General Fund' },
          ].map(r => (
            <div key={r.pos} className="px-4 py-2 grid grid-cols-3 text-xs border-t border-slate-100">
              <span className="font-medium text-slate-800">{r.pos}</span>
              <span className="font-mono text-slate-700">{r.cost}</span>
              <span className="text-slate-500">{r.fund}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* 4. EMS Billing Transition */}
      <Section icon={DollarSign} title="4. EMS Billing Transition — Comstar to In-House">
        <p>
          The Machias Ambulance Service currently contracts with Comstar for billing services at a confirmed rate of <strong>{(s.comstar_fee_rate * 100).toFixed(2)}%</strong> of gross collections. Based on {s.ems_transports.toLocaleString()} annual transports at {fmt(s.avg_revenue_per_transport)} average revenue per transport, the Town pays approximately <strong>{fmt(d1?.value?.comstarAvoided)}/year</strong> in billing fees, growing at {(s.transport_growth_rate * 100).toFixed(1)}% annually.
        </p>
        <p>
          The proposed transition brings billing in-house, managed by the new Billing Specialist. The model projects a Year 1 collection rate of <strong>{(s.inhouse_y1_rate * 100).toFixed(1)}%</strong> (ramp period, vs {(s.comstar_collection_rate * 100).toFixed(1)}% current) and a steady-state rate of <strong>{(s.inhouse_steady_rate * 100).toFixed(0)}%</strong> beginning in Year 2. Even at the more conservative Y1 rate, the avoided fee plus collection improvement exceeds the cost of the Billing Specialist position.
        </p>
        <div className="rounded-xl border border-slate-200 overflow-hidden mt-2">
          {data.map(d => (
            <div key={d.year} className="px-4 py-2 grid grid-cols-4 text-xs border-t border-slate-100 first:border-0">
              <span className="font-medium text-slate-700">{d.fiscalYear}</span>
              <span className="font-mono">{fmt(d.value.comstarAvoided)} avoided</span>
              <span className="font-mono text-emerald-700">+{fmt(d.value.collectionImprovement)} improvement</span>
              <span className="font-mono text-slate-500">{fmt(d.costs.billingSpecialist)} cost</span>
            </div>
          ))}
        </div>
        <Callout color="emerald">
          The Billing Specialist is <strong>Ambulance Fund-funded</strong> and produces a net positive cash position for the Ambulance Fund in all 5 years, while simultaneously freeing FD/TM time from billing oversight.
        </Callout>
      </Section>

      {/* 5. Regional Financial Services */}
      <Section icon={Target} title="5. Regional Financial Services Program">
        <p>
          Machias currently provides informal financial support to several neighboring municipalities. The Regional Financial Services program formalizes these relationships into <strong>paid interlocal agreements</strong>, generating new General Fund revenue while creating a scalable regional shared-services model.
        </p>
        <p>
          Initial contracts with <strong>Roque Bluffs</strong> ({fmt(s.rb_annual_contract)}/yr) and <strong>Machiasport</strong> ({fmt(s.machiasport_annual_contract)}/yr) begin in Year 1. Marshfield and additional towns are targeted for Year 2 expansion. Whitneyville and Northfield are modeled for Year 3.
        </p>
        <div className="rounded-xl border border-slate-200 overflow-hidden mt-2">
          {data.map(d => (
            <div key={d.year} className="px-4 py-2 grid grid-cols-3 text-xs border-t border-slate-100 first:border-0">
              <span className="font-medium text-slate-700">{d.fiscalYear}</span>
              <span className="font-mono text-emerald-700">{fmt(d.value.regionalServices)} contracts</span>
              <span className="font-mono text-slate-500">{fmt(d.value.emsExternal)} EMS external</span>
            </div>
          ))}
        </div>
        <Callout color="blue">
          The Revenue Coordinator position — when hired in Year 3 — is fully self-funded by regional contract revenue. No GF subsidy required. The coordinator's loaded cost ({fmt(s.rc_base_salary)}/yr base) is covered by contract revenue before the position is approved.
        </Callout>
      </Section>

      {/* 6. ERP Modernization */}
      <Section icon={Monitor} title="6. ERP Modernization">
        <p>
          The Town operates on legacy Trio software that limits financial reporting, audit trail quality, and multi-entity accounting capability. The proposed ERP modernization involves selecting and implementing a modern fund-accounting platform with payroll/HRIS and citizen revenue modules.
        </p>
        <p>
          Estimated implementation cost: <strong>{fmt(s.erp_y1_cost)}</strong> in Year 1, partially offset by a <strong>{fmt(s.erp_designated_fund_offset)}</strong> designated fund balance allocation from prior year surplus. Net Year 1 GF impact from ERP: <strong>{fmt(s.erp_y1_cost - s.erp_designated_fund_offset)}</strong>. Annual ongoing software cost: <strong>{fmt(s.erp_ongoing_cost)}/year</strong>.
        </p>
        <p>
          Conservative annual value from reduced manual reconciliation, improved audit efficiency, and eliminated workarounds is estimated at <strong>{fmt(s.erp_annual_value)}/year</strong> beginning in Year 2. The ERP cannot be successfully implemented without adequate finance staff — this underscores why the staffing restructuring is a prerequisite.
        </p>
      </Section>

      {/* 7. Enterprise Fund Overhead */}
      <Section icon={Landmark} title="7. Enterprise Fund Overhead Recovery">
        <p>
          The Town maintains five enterprise funds that appropriately transfer administrative overhead charges to the General Fund. These transfers recognize that GF staff provide finance, HR, and management services to enterprise operations.
        </p>
        <div className="rounded-xl border border-slate-200 overflow-hidden mt-2">
          {[
            { label: 'Ambulance Fund', val: s.ambulance_transfer },
            { label: 'Sewer Fund', val: s.sewer_transfer },
            { label: 'Transfer Station', val: s.ts_transfer },
            { label: 'Telebusiness Center', val: s.telebusiness_transfer },
            { label: '7 Court Street', val: s.court_st_transfer },
          ].map(r => (
            <div key={r.label} className="px-4 py-2 grid grid-cols-2 text-xs border-t border-slate-100 first:border-0">
              <span className="text-slate-700">{r.label}</span>
              <span className="font-mono">{fmt(r.val)}/yr base</span>
            </div>
          ))}
          <div className="px-4 py-2 grid grid-cols-2 text-xs border-t border-slate-200 bg-slate-50 font-semibold">
            <span>Total Y1 Enterprise Overhead</span>
            <span className="font-mono">{fmt(d1?.value?.enterpriseOverhead)}</span>
          </div>
        </div>
        <Callout color="slate">
          Enterprise transfers grow at {(s.enterprise_growth_rate * 100).toFixed(1)}% annually and are <strong>pre-existing budget lines</strong>, not new restructuring revenue. They are included in the GF cost offset analysis because they directly reduce the net levy requirement for the new positions.
        </Callout>
      </Section>

      {/* 8. General Fund Fiscal Impact */}
      <Section icon={ShieldCheck} title="8. General Fund Fiscal Impact — Levy Neutrality">
        <p>
          The central fiscal policy guardrail of this plan is that it must be <strong>levy-neutral</strong> — the restructuring cannot require a tax rate increase. The following table shows the Year 1 GF analysis under the current model settings:
        </p>
        <div className="rounded-xl border border-slate-200 overflow-hidden mt-2">
          <DataRow label="GF-Funded Position Costs (SA + GA + Airport + ERP)" value={fmt(d1?.gf?.gfFundedCosts)} />
          <DataRow label="GF Cash Offsets (contracts + EMS + stipends + overhead)" value={`(${fmt(d1?.gf?.gfCashOffsets)})`} />
          <DataRow label="Net GF Levy Impact" value={d1?.gf?.gfNetLevyImpact <= 0 ? `(${fmt(Math.abs(d1?.gf?.gfNetLevyImpact))}) surplus` : fmt(d1?.gf?.gfNetLevyImpact)} highlight />
          <DataRow label="Mill Rate Impact" value={`${d1?.gf?.millRateImpact > 0 ? '+' : ''}${d1?.gf?.millRateImpact?.toFixed(4)} mills`} />
          <DataRow label="Undesignated Fund Draw Required" value={d1?.gf?.undesignatedDraw === 0 ? 'None' : fmt(d1?.gf?.undesignatedDraw)} />
        </div>
        <Callout color={d1?.gf?.gfNetLevyImpact <= 0 ? 'emerald' : 'red'}>
          {d1?.gf?.gfNetLevyImpact <= 0
            ? `Under current model settings, the restructuring produces a net GF surplus of ${fmt(Math.abs(d1?.gf?.gfNetLevyImpact))} in Year 1. No tax increase and no undesignated fund draw required.`
            : `Under current model settings, there is a net GF gap of ${fmt(d1?.gf?.gfNetLevyImpact)} in Year 1. Review the model settings or revenue assumptions to restore levy neutrality.`
          }
        </Callout>
      </Section>

      {/* 9. 5-Year Summary */}
      <Section icon={TrendingUp} title="9. Five-Year Financial Summary">
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 px-4 py-2 text-[10px] font-semibold text-slate-500 uppercase grid grid-cols-5">
            <span>Year</span><span>Total Costs</span><span>Total Value</span><span>Net</span><span>GF Levy Impact</span>
          </div>
          {data.map(d => (
            <div key={d.year} className={`px-4 py-2 grid grid-cols-5 text-xs border-t border-slate-100 ${d.net > 0 ? 'text-emerald-700' : 'text-red-700'}`}>
              <span className="font-medium text-slate-800">{d.fiscalYear}</span>
              <span className="font-mono text-slate-700">{fmt(d.costs.total)}</span>
              <span className="font-mono text-slate-700">{fmt(d.value.total)}</span>
              <span className="font-mono font-semibold">{d.net >= 0 ? '' : '('}{fmt(d.net)}{d.net < 0 ? ')' : ''}</span>
              <span className={`font-mono ${d.gf.gfNetLevyImpact <= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{d.gf.gfNetLevyImpact <= 0 ? `(${fmt(Math.abs(d.gf.gfNetLevyImpact))})` : fmt(d.gf.gfNetLevyImpact)}</span>
            </div>
          ))}
          <div className="px-4 py-2 grid grid-cols-5 text-xs border-t border-slate-200 bg-slate-50 font-semibold">
            <span>5-Year Total</span>
            <span className="font-mono">{fmt(data.reduce((s, d) => s + d.costs.total, 0))}</span>
            <span className="font-mono">{fmt(data.reduce((s, d) => s + d.value.total, 0))}</span>
            <span className="font-mono">{fmt(cumulative)}</span>
            <span className="font-mono">{fmt(data.reduce((s, d) => s + d.gf.gfNetLevyImpact, 0))}</span>
          </div>
        </div>
      </Section>

      {/* Footer note */}
      <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-xs text-slate-500 leading-relaxed">
        <strong>Note on value categories:</strong> "Total Value" includes three categories: (1) actual cash — regional contracts, EMS billing improvement, avoided Comstar fees, stipend savings; (2) budget impact — enterprise overhead, airport savings; (3) capacity value — time redirected from FD/TM to strategic work, internal control risk mitigation. Only Category 1 represents new dollars deposited. Categories 2–3 are real but non-cash. The "5-Yr Cash Net" figure on the Overview uses only Category 1 figures minus total costs for a conservative estimate.
      </div>
    </div>
  );
}