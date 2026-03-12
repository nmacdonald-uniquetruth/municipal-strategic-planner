import React, { useState } from 'react';
import SectionHeader from '../components/machias/SectionHeader';
import { MessageSquare, Users, Calendar, FileText, ChevronRight } from 'lucide-react';
import { useModel } from '../components/machias/ModelContext';
import { runProFormaFromSettings } from '../components/machias/FinancialModelV2';

const fmt = (n) => n == null ? '—' : `$${Math.abs(Math.round(n)).toLocaleString()}`;

export default function CommunicationStrategy() {
  const { settings } = useModel();
  const data = runProFormaFromSettings(settings);
  const d1 = data[0];
  const [activeTab, setActiveTab] = useState('stakeholders');

  const STAKEHOLDERS = [
    {
      group: 'Select Board',
      priority: 'Primary Decision Maker',
      color: 'slate',
      concerns: ['Fiscal responsibility — no tax increase', 'Legal authority and risk management', 'Staff capacity to execute', 'Timeline and milestones'],
      messages: [
        `The restructuring is levy-neutral: Year 1 GF impact is ${d1.gf.gfNetLevyImpact <= 0 ? `a surplus of ${fmt(Math.abs(d1.gf.gfNetLevyImpact))}` : fmt(d1.gf.gfNetLevyImpact)}.`,
        'Every position has a defined trigger and a defined funding source.',
        `Comstar fees are currently ${fmt(d1.value.comstarAvoided)}/yr and will increase as EMS revenue grows — the contract is under active negotiation and fees could change. In-house billing eliminates this variable cost entirely.`,
        'The auditors have flagged separation-of-duties risk. This plan directly addresses it.',
        'Roque Bluffs and Machiasport have expressed interest in paid interlocal agreements.',
      ],
      format: 'Formal presentation + written memo + financial model walkthrough',
      timing: 'Initial briefing before vote on SA recruitment; monthly updates thereafter',
    },
    {
      group: 'Budget Committee',
      priority: 'Financial Oversight',
      color: 'blue',
      concerns: ['Detailed cost analysis', 'Revenue assumptions validation', 'Multi-year budget impact', 'Break-even timing'],
      messages: [
        'The 5-year pro forma is conservative — it uses actual confirmed rates, not projections.',
        `Cash break-even is projected around Year 2 on a cash-only basis (${fmt(data.slice(0,2).reduce((s,d)=>{const c=d.value.comstarAvoided+d.value.collectionImprovement+d.value.stipendSavings+d.value.airportSavings+d.value.regionalServices+d.value.emsExternal+d.value.transferStation;return s+c-d.costs.total;},0))} cumulative 2-year cash net).`,
        'Model Settings are transparent and adjustable — the committee can change any assumption.',
        'The Billing Specialist cost never touches the tax levy — it is 100% Ambulance Fund.',
      ],
      format: 'Detailed financial model walkthrough + access to this planning tool',
      timing: 'Prior to Town Meeting budget authorization; annual review',
    },
    {
      group: 'Town Meeting / Taxpayers',
      priority: 'Approval Authority',
      color: 'amber',
      concerns: ['Tax rate impact', 'Why we need new positions', 'What these people will do', 'Are we getting value'],
      messages: [
        `No tax increase required. GF cost is covered by new revenue and savings.`,
        `We are already paying ${fmt(settings.fd_loaded_cost)} for the Finance Director to do bookkeeping. This plan puts that work at the right level.`,
        `Neighboring towns are asking to pay Machias for financial services. This plan captures that revenue.`,
        `The auditors said we need better internal controls. This is how we fix it without raising taxes.`,
      ],
      format: '2-page plain-language summary; public hearing presentation; FAQ handout',
      timing: 'Annual Town Meeting; public hearing 30 days prior',
    },
    {
      group: 'Finance Director & Town Manager',
      priority: 'Implementation Leadership',
      color: 'emerald',
      concerns: ['Workload during transition', 'Role clarity with new staff', 'ERP timeline feasibility', 'Performance expectations'],
      messages: [
        'The goal is to free FD time for financial strategy — not to create more work for the FD.',
        'Clear role delineation: SA handles transactions; FD handles strategy, oversight, and intergovernmental relations.',
        'The TM gains 18–22% of time back for economic development and regional leadership.',
        'Implementation is phased — no single quarter adds too much operational change simultaneously.',
      ],
      format: 'Internal planning sessions; weekly check-ins during transition; clear org chart',
      timing: 'Before Board vote; ongoing throughout implementation',
    },
    {
      group: 'Neighboring Municipalities',
      priority: 'Revenue Partners',
      color: 'purple',
      concerns: ['What services are included', 'Cost — is it reasonable', 'What happens if Machias can\'t deliver', 'Confidentiality of their financial data'],
      messages: [
        'You get professional financial services at a fraction of the cost of hiring your own FD.',
        'Services are clearly defined in the interlocal agreement with explicit deliverables.',
        'Machias provides a 90-day termination notice period — you are not locked in.',
        'Financial data is segregated by entity in the ERP — your records are yours.',
      ],
      format: 'Direct outreach by Town Manager; formal proposal + draft interlocal agreement',
      timing: 'Month 1–6 outreach; Month 6–9 agreement execution',
    },
    {
      group: 'Employees & Clerk\'s Office',
      priority: 'Affected Staff',
      color: 'red',
      concerns: ['Will I lose my stipend?', 'Does this affect my job?', 'More work or less?', 'Who is supervising whom?'],
      messages: [
        `Stipend arrangements (${fmt(settings.stipend_elimination)}/yr combined) will be eliminated upon SA hire — affected employees will be notified with 60 days\' advance notice.`,
        'The new SA does not supervise Clerk staff — they work alongside the FD.',
        'The workload relief from formal financial staffing should reduce the informal burden on the Clerk\'s office.',
        'No existing positions are being eliminated — this is growth, not reduction.',
      ],
      format: 'Direct conversation from Town Manager; written notice for stipend changes',
      timing: 'Before any public announcement; before SA hire is finalized',
    },
  ];

  const TIMELINE = [
    { month: 'Month 1–2', action: 'Select Board briefing', audience: 'Select Board', type: 'decision', detail: 'Full presentation of restructuring plan. Vote on SA recruitment authorization.' },
    { month: 'Month 1–3', action: 'Stakeholder pre-briefing', audience: 'Key stakeholders', type: 'relationship', detail: 'Individual conversations with neighboring town managers. Budget Committee preview.' },
    { month: 'Month 3', action: 'Public notice / job posting', audience: 'Public', type: 'announcement', detail: 'SA job posting goes live. Brief public announcement — frame as organizational improvement.' },
    { month: 'Month 4–6', action: 'Interlocal outreach', audience: 'Roque Bluffs, Machiasport', type: 'relationship', detail: 'Formal proposals sent. Select Board of each town receives presentation.' },
    { month: 'Month 6–8', action: 'SA onboarding communication', audience: 'Internal staff', type: 'internal', detail: 'Introduce SA to staff. Clarify role boundaries. Brief on stipend timeline.' },
    { month: 'Month 9', action: 'Contract execution announcements', audience: 'Public + regional media', type: 'announcement', detail: 'Press release: Machias signs financial services agreements with Roque Bluffs and Machiasport. Emphasize county leadership role.' },
    { month: 'Town Meeting', action: 'ERP budget presentation', audience: 'Town Meeting', type: 'decision', detail: `Request ${fmt(settings.erp_y1_cost)} implementation appropriation. Present plain-language ROI. Explain ${fmt(settings.erp_designated_fund_offset)} designated fund offset.` },
    { month: 'Year 2 Annual', action: 'Progress report to Board', audience: 'Select Board + public', type: 'reporting', detail: 'Annual report: actual vs. projected financials. Regional services performance. ERP status.' },
  ];

  const MESSAGES = [
    { headline: 'No Tax Increase', body: `The restructuring pays for itself through new revenue and avoided costs. Year 1 General Fund impact: ${d1.gf.gfNetLevyImpact <= 0 ? `surplus of ${fmt(Math.abs(d1.gf.gfNetLevyImpact))}` : fmt(d1.gf.gfNetLevyImpact)}.`, audience: 'All stakeholders', priority: 'Primary' },
    { headline: 'Right Work, Right Level', body: `The Finance Director spends 45% of their time on tasks appropriate for a Staff Accountant. This plan fixes that misallocation without adding cost to the General Fund.`, audience: 'Select Board, Budget Committee', priority: 'Primary' },
    { headline: 'Machias as Regional Leader', body: `Neighboring towns want to pay Machias for financial services. This plan positions Machias as the county seat of financial administration — a role that generates revenue and strengthens regional relationships.`, audience: 'Select Board, Public', priority: 'Secondary' },
    { headline: 'Audit Risk is Real', body: `Annual auditors have flagged separation-of-duties deficiencies. The control risk exposure is estimated at ${fmt(settings.control_risk_exposure)}/year. This plan directly addresses the root cause.`, audience: 'Budget Committee, Board', priority: 'Secondary' },
    { headline: 'The Ambulance Fund Funds the Billing Specialist', body: `The single most confusing aspect. The BS is paid by the Ambulance Fund — not taxpayers. It eliminates Comstar fees that are currently ${fmt(d1.value.comstarAvoided)}/yr and will grow as EMS revenue grows. Note: Comstar contract is currently under negotiation — fees could change in either direction. In-house billing eliminates this variable entirely.`, audience: 'All — clarify proactively', priority: 'Clarification' },
    { headline: 'Phased and Triggered', body: `The Revenue Coordinator and the Year 5 senior hire (a second Staff Accountant or Controller, depending on complexity at that time) only happen when revenues cover their costs. No speculative hiring. No budget risk. The Select Board will decide which Y5 hire is appropriate based on conditions at that time.`, audience: 'Budget Committee, Skeptics', priority: 'Secondary' },
  ];

  const colorMap = {
    slate: 'border-slate-200 bg-slate-50',
    blue: 'border-blue-200 bg-blue-50',
    amber: 'border-amber-200 bg-amber-50',
    emerald: 'border-emerald-200 bg-emerald-50',
    purple: 'border-purple-200 bg-purple-50',
    red: 'border-red-200 bg-red-50',
  };

  return (
    <div className="space-y-8">
      <SectionHeader title="Communication Strategy" subtitle="Stakeholder messaging, timeline, and key talking points for each audience" icon={MessageSquare} />

      <div className="flex gap-2 flex-wrap">
        {[['stakeholders','Stakeholders'],['messages','Key Messages'],['timeline','Comm Timeline'],['materials','Materials Needed']].map(([id, label]) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${activeTab === id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'stakeholders' && (
        <div className="space-y-4">
          {STAKEHOLDERS.map((sh, i) => (
            <div key={i} className={`rounded-xl border ${colorMap[sh.color]} overflow-hidden`}>
              <div className="px-5 py-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{sh.group}</h3>
                    <p className="text-xs text-slate-500">{sh.priority} · {sh.format}</p>
                  </div>
                  <span className="text-[10px] text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full font-medium">{sh.timing}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Their Concerns</p>
                    <div className="space-y-1">
                      {sh.concerns.map((c, j) => <p key={j} className="text-xs text-slate-700">• {c}</p>)}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Key Messages</p>
                    <div className="space-y-1">
                      {sh.messages.map((m, j) => (
                        <div key={j} className="flex items-start gap-1.5 text-xs text-slate-700">
                          <ChevronRight className="h-3 w-3 text-emerald-500 flex-shrink-0 mt-0.5" />
                          {m}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'messages' && (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Core messages that should appear consistently across all communications. All figures are live from Model Settings.</p>
          {MESSAGES.map((msg, i) => (
            <div key={i} className={`rounded-xl border p-5 ${msg.priority === 'Primary' ? 'border-slate-800 bg-slate-900 text-white' : msg.priority === 'Clarification' ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-white'}`}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className={`font-bold text-sm ${msg.priority === 'Primary' ? 'text-white' : 'text-slate-900'}`}>{msg.headline}</h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${msg.priority === 'Primary' ? 'bg-white/20 text-white' : msg.priority === 'Clarification' ? 'bg-amber-200 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>{msg.priority}</span>
              </div>
              <p className={`text-sm ${msg.priority === 'Primary' ? 'text-slate-300' : 'text-slate-700'}`}>{msg.body}</p>
              <p className={`text-[10px] mt-2 ${msg.priority === 'Primary' ? 'text-slate-400' : 'text-slate-400'}`}>Use with: {msg.audience}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'timeline' && (
        <div className="space-y-3">
          {TIMELINE.map((item, i) => {
            const typeColors = { decision: 'bg-slate-800 text-white', announcement: 'bg-emerald-600 text-white', relationship: 'bg-blue-600 text-white', internal: 'bg-amber-600 text-white', reporting: 'bg-violet-600 text-white' };
            return (
              <div key={i} className="flex gap-4 rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex-shrink-0 w-24 text-right">
                  <p className="text-xs font-semibold text-slate-700">{item.month}</p>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded mt-1 inline-block ${typeColors[item.type] || 'bg-slate-100 text-slate-600'}`}>{item.type}</span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900 text-sm">{item.action}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Audience: {item.audience}</p>
                  <p className="text-xs text-slate-700 mt-1">{item.detail}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'materials' && (
        <div className="space-y-3">
          {[
            { doc: 'Executive Summary (2-page)', audience: 'All stakeholders', status: 'Available — export from Dashboard', priority: 'Critical', format: 'PDF' },
            { doc: 'Select Board Presentation', audience: 'Select Board', status: 'Create from this system\'s data', priority: 'Critical', format: 'Slides + printed handout' },
            { doc: 'Plain-Language Taxpayer FAQ', audience: 'Town Meeting', status: 'Draft from Q&A section', priority: 'High', format: '1-page printed' },
            { doc: 'Position Job Descriptions', audience: 'Internal + public posting', status: 'Draft required', priority: 'Critical', format: 'PDF + posting' },
            { doc: 'Interlocal Agreement Template', audience: 'Neighboring towns', status: 'Legal review required', priority: 'High', format: 'Word / PDF' },
            { doc: 'Budget Committee Financial Model Walkthrough', audience: 'Budget Committee', status: 'Use this system directly', priority: 'High', format: 'Live demo' },
            { doc: 'Annual Progress Report Template', audience: 'Select Board + Public', status: 'Create Year 2', priority: 'Medium', format: 'PDF' },
            { doc: 'ERP RFP Document', audience: 'Vendors', status: 'Draft in Year 1 after SA hire', priority: 'Medium', format: 'Word / PDF' },
            { doc: 'Press Release — Service Agreement Signing', audience: 'Media + public', status: 'Draft upon contract execution', priority: 'Medium', format: 'Press release' },
          ].map((m, i) => (
            <div key={i} className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-slate-900 text-sm">{m.doc}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${m.priority === 'Critical' ? 'bg-red-100 text-red-700' : m.priority === 'High' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{m.priority}</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{m.audience} · Format: {m.format}</p>
                <p className="text-xs text-slate-600 mt-0.5 italic">{m.status}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}