import React, { useState } from 'react';
import ERPRoadmap from '../components/machias/ERPRoadmap';
import ERPEvaluator from '../components/machias/ERPEvaluator';
import SectionHeader from '../components/machias/SectionHeader';
import StatCard from '../components/machias/StatCard';
import { useModel } from '../components/machias/ModelContext';
import { Monitor, DollarSign, Clock, Server, Database, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';
import { ERP_PHASES } from '../components/machias/FinancialModel';

const fmt = (n) => n == null ? '—' : `$${Math.abs(Math.round(n)).toLocaleString()}`;

export default function ERPRoadmapPage() {
  const { settings } = useModel();
  const [activeTab, setActiveTab] = useState('why');

  const netY1ERP = (settings.erp_y1_cost || 47000) - (settings.erp_designated_fund_offset || 24000);
  const annualNetValue = (settings.erp_annual_value || 21000) - (settings.erp_ongoing_cost || 5000);

  const TABS = [
    ['why', 'Why ERP'],
    ['footprint', 'Machias Footprint'],
    ['roadmap', 'Timeline & Phases'],
    ['evaluator', 'System Evaluator'],
    ['architecture', 'Platform Architecture'],
    ['payroll', 'Payroll & HRIS'],
    ['procurement', 'Procurement Guide'],
    ['financial', 'Financial Analysis'],
  ];

  return (
    <div className="space-y-8">
      <SectionHeader title="ERP / Payroll / HRIS Modernization" subtitle="Comprehensive system modernization strategy — replacing legacy Trio" icon={Monitor} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Implementation Cost" value={`$${(settings.erp_y1_cost || 47000).toLocaleString()}`} icon={DollarSign} sub="Gross Y1" />
        <StatCard label="Net GF Cost (Y1)" value={`$${netY1ERP.toLocaleString()}`} icon={DollarSign} sub={`After $${(settings.erp_designated_fund_offset || 24000).toLocaleString()} fund offset`} />
        <StatCard label="Annual Net Value (Y2+)" value={`$${annualNetValue.toLocaleString()}`} icon={Clock} sub="Value minus ongoing cost" />
        <StatCard label="Payback Period" value="~2.1 yrs" icon={Server} sub="Net Y1 cost ÷ annual value" />
      </div>

      <div className="flex gap-2 flex-wrap">
        {TABS.map(([id, label]) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${activeTab === id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'why' && (
        <div className="space-y-5">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="font-bold text-slate-900 text-sm mb-3">Why ERP Modernization Is Essential</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-700">
              <div className="space-y-3">
                <p><strong>The core problem with legacy Trio:</strong></p>
                <ul className="text-xs space-y-1.5 ml-3">
                  {[
                    'No multi-entity sub-ledger — cannot serve regional clients without it',
                    'Limited audit trail — auditors must manually reconstruct transaction history',
                    'No integrated payroll — payroll processed separately, requiring manual GL reconciliation',
                    'No citizen payment portal — all payments in-person or by check',
                    'Minimal GASB reporting — CAFR preparation requires extensive manual work',
                    'No budgeting module — budget preparation in spreadsheets, not integrated',
                    'No document management — vendor invoices stored in filing cabinets',
                    'No employee self-service — leave requests, W-4 changes all manual',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs text-red-700"><span className="text-red-400 mt-0.5">✗</span>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="space-y-3">
                <p><strong>What modern ERP enables:</strong></p>
                <ul className="text-xs space-y-1.5 ml-3">
                  {[
                    'Multi-entity: serve Roque Bluffs, Machiasport, etc. as separate ledgers in one system',
                    'Real-time audit trail: every transaction logged with user, timestamp, and documentation',
                    'Integrated payroll: one system for payroll, W-2, PFML, 941, and GL posting',
                    'Online payments: utility bills, permits, EMS co-pays paid online',
                    'GASB 34 reporting: CAFR-ready reports generated in minutes, not weeks',
                    'Integrated budgeting: budget preparation, amendments, and tracking in one place',
                    'AP automation: electronic invoices, approval workflows, automatic GL coding',
                    'Employee self-service: online leave requests, paystubs, benefits enrollment',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs text-emerald-700"><span className="text-emerald-400 mt-0.5">✓</span>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-5">
            <h4 className="font-bold text-amber-900 text-sm mb-2 flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> ERP Cannot Succeed Without Staff Accountant</h4>
            <p className="text-xs text-amber-800">Small municipalities that attempt ERP implementation without dedicated finance staff have a high failure rate. Someone must lead the COA gap analysis, manage parallel operation, and absorb vendor training as their full-time job.</p>
          </div>
        </div>
      )}

      {activeTab === 'roadmap' && (
        <>
          <ERPRoadmap />
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="font-semibold text-slate-800 text-sm mb-3">Phase Detail & Dependencies</h3>
            <div className="space-y-3">
              {ERP_PHASES.map((phase, i) => (
                <div key={i} className="flex gap-3 rounded-lg border border-slate-200 p-3">
                  <span className="text-[10px] font-bold text-white bg-slate-800 rounded px-2 py-1 flex-shrink-0 h-fit">{phase.phase}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-slate-800 text-xs">{phase.name}</p>
                      <span className="text-[10px] text-slate-400 font-mono">{phase.timing}</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">{phase.desc}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1"><ArrowRight className="h-3 w-3" /> Depends on: {phase.dependency}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {activeTab === 'evaluator' && (
        <>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1.5">
            <p><strong>Systems under evaluation:</strong> Sage Intacct · TownCloud · Harris TRIO (upgrade) · Tyler Technologies (Munis / ERP Pro) · Edmunds GovTech · OpenGov · CivicPlus · Infor · Microsoft Dynamics 365 · ClearGov · Paylocity · BambooHR · ADP · Paycor · Paycom · NEOGOV · HiBob · iSolved · SmartFusion</p>
            <p className="text-red-600"><strong>⚠ Eliminated:</strong> BS&A Software, Black Mountain Software, and Caselle — no Maine references.</p>
          </div>
          <ERPEvaluator />
        </>
      )}

      {activeTab === 'financial' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="font-bold text-slate-900 text-sm mb-3">ERP Financial Analysis</h3>
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <div className="bg-slate-900 text-white px-4 py-2 text-[10px] font-semibold uppercase tracking-wider grid grid-cols-3">
                <span>Item</span><span>Amount</span><span>Notes</span>
              </div>
              {[
                ['Y1 Implementation Cost', fmt(settings.erp_y1_cost), 'Selection, migration, setup, training, first-year license'],
                ['Designated Fund Offset', `(${fmt(settings.erp_designated_fund_offset)})`, 'Prior-year surplus designated for technology'],
                ['Net Y1 GF Appropriation', fmt(settings.erp_y1_cost - settings.erp_designated_fund_offset), 'Net new GF budget line'],
                ['Annual Ongoing Cost (Y2+)', fmt(settings.erp_ongoing_cost), 'SaaS license + support tier'],
                ['Annual Value (Y2+)', fmt(settings.erp_annual_value), 'Reconciliation time, audit efficiency, error reduction'],
                ['Net Annual Benefit (Y2+)', fmt(settings.erp_annual_value - settings.erp_ongoing_cost), 'After ongoing license cost'],
                ['Simple Payback', `${((settings.erp_y1_cost - settings.erp_designated_fund_offset) / (settings.erp_annual_value - settings.erp_ongoing_cost)).toFixed(1)} years`, 'Net cost ÷ net annual benefit'],
              ].map((row, i) => (
                <div key={i} className={`px-4 py-2.5 grid grid-cols-3 text-xs border-t border-slate-100 ${i === 6 ? 'bg-emerald-50 font-semibold' : ''}`}>
                  <span className="font-medium text-slate-800">{row[0]}</span>
                  <span className="font-mono text-slate-700">{row[1]}</span>
                  <span className="text-slate-500">{row[2]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'architecture' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: Database, color: 'violet', title: 'Domain 1: Financial ERP', desc: 'GL, AP, AR, budget management, GASB fund reporting, grant tracking, fixed asset management, multi-entity sub-ledger for regional services.' },
              { icon: Server, color: 'blue', title: 'Domain 2: Payroll / HRIS', desc: 'Payroll processing, W-2, federal/state tax filing, PFML, 941. Employee self-service, benefits administration, onboarding/offboarding.' },
              { icon: Monitor, color: 'emerald', title: 'Domain 3: Revenue / Civic', desc: 'Online citizen payments, utility billing, EMS/fire billing, permit and license management, citizen portal.' },
            ].map((domain, i) => {
              const Icon = domain.icon;
              const colors = { violet: 'bg-violet-50 border-violet-100', blue: 'bg-blue-50 border-blue-100', emerald: 'bg-emerald-50 border-emerald-100' };
              const iconColors = { violet: 'text-violet-600', blue: 'text-blue-600', emerald: 'text-emerald-600' };
              const textColors = { violet: 'text-violet-800', blue: 'text-blue-800', emerald: 'text-emerald-800' };
              return (
                <div key={i} className={`rounded-xl p-4 border ${colors[domain.color]}`}>
                  <Icon className={`h-5 w-5 ${iconColors[domain.color]} mb-2`} />
                  <h4 className={`text-xs font-bold ${textColors[domain.color]} mb-1`}>{domain.title}</h4>
                  <p className={`text-[10px] ${textColors[domain.color]} opacity-80`}>{domain.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'footprint' && (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="font-bold text-slate-900 text-sm mb-2">Why Per-Capita Benchmarking Understates Machias</h3>
          <p className="text-xs text-slate-600 leading-relaxed">Machias has a residential population of approximately 2,105 but serves as the economic and service center for Washington County. A service-complexity weighted analysis places Machias at <strong>2.5–3.0× the operational intensity</strong> of a typical 2,000-person Maine municipality. The effective service population is <strong>6,000–8,000</strong>.</p>
        </div>
      )}

      {activeTab === 'payroll' && (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="font-bold text-slate-900 text-sm mb-3">Payroll & HRIS — Maine-Specific Requirements</h3>
          <p className="text-xs text-slate-600">Maine PERS, PFML, school payroll coordination, and multi-rate employees are the primary requirements. See Model Settings for current rate assumptions.</p>
        </div>
      )}

      {activeTab === 'procurement' && (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="font-bold text-slate-900 text-sm mb-3">Procurement Process</h3>
          <div className="space-y-3">
            {['Phase 0 — Requirements Gathering','Phase 1 — RFI','Phase 2 — RFP','Phase 3 — Demos & Reference Checks','Phase 4 — Contract Negotiation','Phase 5 — Implementation'].map((step, i) => (
              <div key={i} className="flex gap-3 items-start rounded-lg border border-slate-200 p-3">
                <span className="h-5 w-5 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">{i}</span>
                <p className="font-semibold text-slate-800 text-xs">{step}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}