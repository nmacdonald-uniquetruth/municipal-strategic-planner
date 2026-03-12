import React, { useState } from 'react';
import ERPRoadmap from '../components/machias/ERPRoadmap';
import ERPEvaluator from '../components/machias/ERPEvaluator';
import SectionHeader from '../components/machias/SectionHeader';
import StatCard from '../components/machias/StatCard';
import { useModel } from '../components/machias/ModelContext';
import { Monitor, DollarSign, Clock, Server, Database, AlertTriangle, CheckCircle2, ArrowRight, Users, FileText } from 'lucide-react';
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

      {/* WHY ERP */}
      {activeTab === 'why' && (
        <div className="space-y-5">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="font-bold text-slate-900 text-sm mb-3">Why ERP Modernization Is Essential</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-700">
              <div className="space-y-3">
                <p><strong>The core problem with legacy Trio:</strong> Trio was designed for simple single-fund municipal operations. Machias has outgrown it. Specific limitations:</p>
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
                    'Poor reporting — custom reports require IT or vendor support',
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
                    'Dashboards: real-time financial health for management and board',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs text-emerald-700"><span className="text-emerald-400 mt-0.5">✓</span>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-xl bg-slate-50 p-4 border border-slate-200">
              <p className="font-semibold text-slate-700 text-xs mb-1">Staff Only + Legacy System</p>
              <p className="text-xs text-slate-500">Recovers some FD capacity. Fixes separation of duties. But can't achieve monthly close discipline, multi-entity regional services, or GASB reporting quality needed for audit excellence.</p>
              <p className="text-xs text-amber-700 font-semibold mt-2">Partial fix — better than now</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4 border border-slate-200">
              <p className="font-semibold text-slate-700 text-xs mb-1">Modern ERP + No New Staff</p>
              <p className="text-xs text-slate-500">Possible, but at a cost. FD could lead implementation, but it would take significantly longer and delay other strategic priorities. The question is: at what cost to the FD's time, and would implementation quality suffer enough to require additional paid vendor support? The SA would work closely with the FD on implementation — not lead it alone.</p>
              <p className="text-xs text-amber-700 font-semibold mt-2">Possible — but slower, higher risk, and higher total cost</p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-4 border border-emerald-200">
              <p className="font-semibold text-emerald-800 text-xs mb-1">Staff + Modern ERP (This Plan)</p>
              <p className="text-xs text-emerald-700">Addresses everything simultaneously. SA manages implementation, COA rebuild, and ongoing operations. ERP enables regional services, GASB reporting, and audit excellence.</p>
              <p className="text-xs text-emerald-800 font-semibold mt-2">Full solution — recommended</p>
            </div>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-5">
            <h4 className="font-bold text-amber-900 text-sm mb-2 flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> ERP Cannot Succeed Without Staff Accountant</h4>
            <p className="text-xs text-amber-800">This is the most important sequencing requirement. Small municipalities that attempt ERP implementation without dedicated finance staff have a high failure rate. The reasons: (1) someone must lead the COA gap analysis before data migration; (2) parallel operation requires someone other than the FD; (3) vendor training needs to land on someone whose full-time job is using the system; (4) data quality issues require an accountant to resolve, not an IT project manager.</p>
          </div>
        </div>
      )}

      {/* TIMELINE */}
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
          <div className="rounded-2xl border border-amber-200 bg-amber-50/30 p-5">
            <h3 className="text-sm font-semibold text-amber-800 mb-2">Critical Dependencies</h3>
            <ul className="text-xs text-amber-700 space-y-1.5">
              <li>• <strong>Staff Accountant hired BEFORE ERP selection begins</strong> — SA participates on evaluation committee</li>
              <li>• COA rebuild must occur BEFORE data migration — clean account structure required</li>
              <li>• Billing Specialist / Comstar cutover is INDEPENDENT — can proceed in FY2027 before ERP go-live</li>
              <li>• White-glove implementation support is a non-negotiable contract term</li>
              <li>• Multi-entity architecture is required for regional financial services delivery</li>
              <li>• School payroll import interface: goal is clean W-2, withholding, 941 for all employees</li>
              <li>• 60–90 day parallel operation period required before old system decommission</li>
            </ul>
          </div>
        </>
      )}

      {/* EVALUATOR */}
      {activeTab === 'evaluator' && (
        <>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
            <strong>Systems under evaluation:</strong> Sage Intacct · TownCloud · Harris TRIO (upgrade) · Tyler Technologies (Munis / ERP Pro) · Edmunds GovTech · OpenGov · CivicPlus · Infor · Microsoft Dynamics 365 · Black Mountain Software · Caselle · BS&A Software · ClearGov · Paylocity · BambooHR · ADP · Paycor · Paycom · NEOGOV · HiBob · iSolved · SmartFusion
          </div>
          <ERPEvaluator />
        </>
      )}

      {/* ARCHITECTURE */}
      {activeTab === 'architecture' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                icon: Database, color: 'violet',
                title: 'Domain 1: Financial ERP',
                desc: 'GL, AP, AR, budget management, GASB fund reporting, grant tracking, fixed asset management, multi-entity sub-ledger for regional services. COA alignment to Maine AOS standards.',
                criteria: ['Fund accounting (GASB 34)', 'Multi-entity sub-ledger', 'Maine municipal references', 'TRIO data migration path', 'Budget module integrated', 'Grant project accounting', 'Fixed asset module', 'Bank reconciliation automation'],
                candidates: 'Sage Intacct, Tyler Munis, Edmunds, OpenGov, BS&A, Black Mountain, Caselle, Infor',
              },
              {
                icon: Server, color: 'blue',
                title: 'Domain 2: Payroll / HRIS',
                desc: 'Payroll processing, W-2, federal/state tax filing, PFML, 941. Employee self-service, benefits administration, onboarding/offboarding. School payroll data import and reconciliation.',
                criteria: ['Maine PERS compatible', 'School payroll data import', 'PFML administration', 'Employee self-service (ESS)', 'Benefits enrollment', 'ACA compliance', 'Direct deposit / positive pay', 'Time & attendance integration'],
                candidates: 'Paylocity, ADP Workforce Now, Paycor, Paycom, iSolved, HiBob, NEOGOV',
              },
              {
                icon: Monitor, color: 'emerald',
                title: 'Domain 3: Revenue / Civic',
                desc: 'Online citizen payments, utility billing, EMS/fire billing, permit and license management, citizen portal. Automated GL posting to ERP. Tax collection integration.',
                criteria: ['EMS/fire billing (CEMSB)', 'Online payment portal', 'GL posting automation', 'Utility billing', 'Permit/license mgmt', 'Tax collection integration', 'Citizen portal UX', 'Mobile-friendly interface'],
                candidates: 'TownCloud, CivicPlus, ClearGov, Tyler Cashiering, MunisOnline',
              },
            ].map((domain, i) => {
              const Icon = domain.icon;
              const colors = {
                violet: 'bg-violet-50 border-violet-100',
                blue: 'bg-blue-50 border-blue-100',
                emerald: 'bg-emerald-50 border-emerald-100',
              };
              const iconColors = { violet: 'text-violet-600', blue: 'text-blue-600', emerald: 'text-emerald-600' };
              const textColors = { violet: 'text-violet-800', blue: 'text-blue-800', emerald: 'text-emerald-800' };
              return (
                <div key={i} className={`rounded-xl p-4 border ${colors[domain.color]}`}>
                  <Icon className={`h-5 w-5 ${iconColors[domain.color]} mb-2`} />
                  <h4 className={`text-xs font-bold ${textColors[domain.color]} mb-1`}>{domain.title}</h4>
                  <p className={`text-[10px] ${textColors[domain.color]} opacity-80 mb-3`}>{domain.desc}</p>
                  <p className={`text-[10px] font-semibold ${textColors[domain.color]} mb-1`}>Key selection criteria:</p>
                  <div className="space-y-0.5 mb-3">
                    {domain.criteria.map((c, j) => (
                      <div key={j} className={`flex items-center gap-1 text-[10px] ${textColors[domain.color]} opacity-80`}>
                        <CheckCircle2 className="h-2.5 w-2.5 flex-shrink-0" />{c}
                      </div>
                    ))}
                  </div>
                  <p className={`text-[10px] ${textColors[domain.color]} opacity-60`}>Candidates: {domain.candidates}</p>
                </div>
              );
            })}
          </div>
          <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 text-xs text-slate-600 space-y-2">
            <p><strong>Integration strategy:</strong> Single-vendor integrated suite (Tyler full suite, Edmunds, OpenGov) is strongly preferred for a municipality of Machias's size — one contract, one support relationship, integrated GL posting. Best-of-breed point solutions are appropriate only if a critical capability gap exists that no integrated suite can fill.</p>
            <p><strong>Cloud SaaS requirement:</strong> All platforms must be cloud/SaaS hosted. No on-premise servers. Maine municipal networks have insufficient IT support for on-premise ERP infrastructure.</p>
            <p><strong>Maine AOS COA standard:</strong> The selected platform must support the Maine Office of the State Auditor Chart of Accounts structure, or the vendor must provide a documented migration path during implementation.</p>
          </div>
        </div>
      )}

      {/* PAYROLL & HRIS */}
      {activeTab === 'payroll' && (
        <div className="space-y-5">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="font-bold text-slate-900 text-sm mb-3">Payroll Processing — Current State vs. Target</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-red-700 mb-2">Current State Problems</p>
                <div className="space-y-1.5">
                  {[
                    'Payroll processed manually in legacy Trio or spreadsheets',
                    'School payroll reconciled separately — manual W-2 coordination',
                    'No employee self-service — all changes require HR/payroll staff',
                    'PFML tracking manual — high compliance risk',
                    'Benefits enrollment paper-based',
                    'Time & attendance not integrated — manual timesheet entry',
                    'No automatic journal entry to GL — manual posting',
                    '941 and W-2 filings require manual data export/import',
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-xs text-red-700">
                      <span className="text-red-400 flex-shrink-0 mt-0.5">✗</span>{item}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-emerald-700 mb-2">Target State (Post-ERP)</p>
                <div className="space-y-1.5">
                  {[
                    'Integrated payroll — one system for all employees including school overlap',
                    'Automatic GL posting on payroll run — zero manual journal entries',
                    'Employee self-service portal — leave requests, W-4 changes, paystub access',
                    'PFML tracking automated — contribution withholding + reporting',
                    'Online benefits enrollment with carrier data integration',
                    'Time & attendance integration — approve timesheets in system',
                    '941, W-2, state filings automated through payroll platform',
                    'Maine PERS contribution data electronically submitted',
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-xs text-emerald-700">
                      <span className="text-emerald-400 flex-shrink-0 mt-0.5">✓</span>{item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="font-bold text-slate-900 text-sm mb-3">Maine-Specific Payroll Requirements</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { req: 'Maine PERS (MERP)', detail: 'All regular employees enrolled in Maine Public Employees Retirement System. PERS employer contribution rate: 8.5% (current). Electronic contribution reporting via MECMS portal. Payroll system must generate PERS-compliant export file.' },
                { req: 'Maine PFML', detail: 'Maine Paid Family and Medical Leave (effective 2024). Employee and employer contributions. Payroll system must track PFML hours taken, contributions withheld, and generate required state reporting.' },
                { req: 'School Payroll Coordination', detail: 'Machias school employees may use the same Town payroll system, or Town must import school payroll data for unified W-2 and benefits administration. Joint platform optimal; data import acceptable.' },
                { req: 'Multiple Pay Rates', detail: 'Some employees have multiple pay rates (regular + overtime + stipend + on-call). Payroll system must handle multi-rate employees with automated overtime calculations.' },
                { req: 'Section 457 Deferred Comp', detail: 'Deferred compensation plan contributions must be tracked and reported separately. Integration with ICMA-RC or equivalent required.' },
                { req: 'Workers\' Comp Tracking', detail: `WC premium allocation by department at ${(settings.wc_rate*100).toFixed(1)}% of wages. Payroll system should allocate WC by department for accurate cost center reporting.` },
              ].map((r, i) => (
                <div key={i} className="rounded-lg border border-slate-200 p-3">
                  <p className="font-semibold text-slate-800 text-xs mb-1">{r.req}</p>
                  <p className="text-xs text-slate-600 leading-relaxed">{r.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-5">
            <h3 className="font-bold text-blue-900 text-sm mb-2">HRIS Modules — Priority Assessment</h3>
            <div className="rounded-xl border border-blue-100 overflow-hidden">
              <div className="bg-blue-900 text-white px-4 py-2 text-[10px] font-semibold uppercase tracking-wider grid grid-cols-4">
                <span>Module</span><span>Priority</span><span>Rationale</span><span>Minimum Requirement</span>
              </div>
              {[
                ['Employee Self-Service (ESS)', 'Critical', 'Reduces HR admin load immediately', 'Paystub, W-4, leave request, direct deposit'],
                ['Time & Attendance', 'High', 'Manual timesheet entry is error-prone', 'Clock-in/out, PTO tracking, manager approval'],
                ['Benefits Administration', 'High', 'ACA reporting + PFML coordination', 'Enrollment, carrier feeds, ACA 1095 generation'],
                ['Onboarding/Offboarding', 'Medium', 'Consistent I-9, direct deposit, PERS enrollment', 'Checklist workflow, document storage'],
                ['Performance Management', 'Low', 'Useful but not operationally critical Y1', 'Annual review workflow, goal tracking'],
                ['Learning Management (LMS)', 'Low', 'Training tracking — nice to have', 'Compliance training completion tracking'],
              ].map((row, i) => (
                <div key={i} className="px-4 py-2 grid grid-cols-4 text-xs border-t border-blue-100">
                  <span className="font-medium text-blue-900">{row[0]}</span>
                  <span className={`font-semibold ${row[1]==='Critical'?'text-red-700':row[1]==='High'?'text-amber-700':'text-slate-500'}`}>{row[1]}</span>
                  <span className="text-slate-600">{row[2]}</span>
                  <span className="text-slate-500 text-[10px]">{row[3]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PROCUREMENT */}
      {activeTab === 'procurement' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="font-bold text-slate-900 text-sm mb-3">Procurement Process & Timeline</h3>
            <div className="space-y-3">
              {[
                { step: 'Phase 0 — Requirements Gathering', timing: 'Q1-Q2 after SA hire', detail: 'SA conducts business process documentation. FD + SA define functional requirements. Review Maine AOS COA standards. Identify integration points (school, PERS, PFML). Budget Committee preliminary briefing.', deliverable: 'Functional requirements document (10–15 pages)' },
                { step: 'Phase 1 — RFI (Request for Information)', timing: 'Q2-Q3', detail: 'Issue broad RFI to all vendors on the evaluation list. Goal: eliminate vendors that can\'t meet minimum requirements (multi-entity, Maine PERS, GASB 34). Not a commitment — information gathering only.', deliverable: 'Shortlist of 4–6 vendors for RFP' },
                { step: 'Phase 2 — RFP (Request for Proposals)', timing: 'Q3-Q4', detail: 'Issue formal RFP to shortlisted vendors. Include: functional requirements, Maine-specific requirements, demo script, reference check requirements, implementation timeline requirements, pricing format. SA and FD on evaluation committee.', deliverable: 'Scored RFP responses; vendor shortlist of 2–3' },
                { step: 'Phase 3 — Demos & Reference Checks', timing: 'Q4', detail: 'Scripted demos using Machias-specific scenarios (multi-entity GL, payroll with school import, EMS billing, regional client sub-ledger). Check Maine municipal references — call at least 3 per finalist vendor. Ask specifically about implementation quality and go-live support.', deliverable: 'Evaluation committee scores; recommendation memo' },
                { step: 'Phase 4 — Contract Negotiation', timing: 'Q4 — Town Meeting', detail: 'Negotiate: fixed-price implementation, white-glove go-live support, data migration responsibility, COA consultation, parallel period support, annual pricing cap (3–4% escalation max), data export rights.', deliverable: 'Executed vendor contract; Town Meeting appropriation' },
                { step: 'Phase 5 — Implementation', timing: 'FY2028 Q1-Q4', detail: 'COA rebuild, data migration, configuration, testing. Staff training (SA, FD, Billing Specialist). 60–90 day parallel operation. Vendor on-site support required for go-live week.', deliverable: 'ERP live; old system decommissioned' },
              ].map((s, i) => (
                <div key={i} className="flex gap-3 rounded-lg border border-slate-200 p-4">
                  <span className="h-6 w-6 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">{i}</span>
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-slate-900 text-xs">{s.step}</p>
                      <span className="text-[10px] text-slate-400 font-mono ml-3">{s.timing}</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{s.detail}</p>
                    <p className="text-[10px] text-emerald-700 font-semibold mt-1">Deliverable: {s.deliverable}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="font-bold text-slate-900 text-sm mb-3">RFP Non-Negotiable Contract Terms</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[
                'Fixed-price implementation (not time & materials)',
                'White-glove go-live support (vendor staff on-site or available day 1)',
                '60-day parallel operation support included in contract',
                'Data migration is vendor responsibility (not Machias staff)',
                'COA consultation included in implementation',
                'Training for all primary users (SA, FD, BS, GA Coordinator)',
                'Data export rights — your data is yours, exportable at any time',
                'Annual price escalation cap: ≤ 4%',
                'Implementation timeline guarantee with penalty clause',
                'Maine AOS COA alignment documentation',
              ].map((term, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-slate-700 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500 flex-shrink-0" />{term}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* FINANCIAL ANALYSIS */}
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

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="font-bold text-slate-900 text-sm mb-3">Value Components — Detail</h3>
            <div className="space-y-2">
              {[
                { item: 'Reconciliation time savings', annual: 8000, detail: `SA and FD spend an estimated 15–20% less time on manual reconciliation with integrated AP/AR. At SA rate ~$${Math.round(settings.sa_base_salary/2080*1.187)}/hr, 150 hrs/yr saved = ~$8,000.` },
                { item: 'Audit preparation efficiency', annual: 7000, detail: 'Auditors currently spend significant fieldwork time reconstructing audit trails that modern ERP generates automatically. Reduced audit hours translate to lower audit fees and FD time.' },
                { item: 'Error reduction / fraud prevention', annual: 4000, detail: 'Automated AP approval workflows, segregated access controls, and real-time reconciliation reduce error rates. Conservative estimate vs. $56K control risk exposure.' },
                { item: 'Reporting time savings', annual: 2000, detail: 'Monthly board reports, grant financial reports, budget-vs-actual: currently manual. Modern ERP generates these in minutes.' },
              ].map((v, i) => (
                <div key={i} className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 p-3">
                  <div>
                    <p className="font-semibold text-slate-800 text-xs">{v.item}</p>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{v.detail}</p>
                  </div>
                  <span className="font-mono font-bold text-emerald-700 text-sm flex-shrink-0">{fmt(v.annual)}/yr</span>
                </div>
              ))}
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-100 font-semibold text-xs">
                <span>Total Annual Value</span>
                <span className="font-mono text-emerald-800">{fmt(settings.erp_annual_value)}/yr</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 text-xs text-blue-800">
            <strong>Funding strategy:</strong> The {fmt(settings.erp_designated_fund_offset)} designated fund offset reduces the net Year 1 appropriation to {fmt(settings.erp_y1_cost - settings.erp_designated_fund_offset)}. If ARPA funds or USDA Rural Development grants are available, ERP software implementation is an eligible use — potentially reducing the net GF cost to zero. The GA Coordinator should evaluate grant opportunities before the Town Meeting appropriation vote.
          </div>
        </div>
      )}
    </div>
  );
}