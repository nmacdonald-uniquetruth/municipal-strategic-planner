import React, { useState, useMemo } from 'react';
import { useModel } from '../components/machias/ModelContext';
import { runProFormaFromSettings } from '../components/machias/FinancialModelV2';
import SectionHeader from '../components/machias/SectionHeader';
import { Target, DollarSign, MapPin, Users, ChevronDown, ChevronUp, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

const fmt  = (n) => n == null ? '—' : `$${Math.abs(Math.round(n)).toLocaleString()}`;
const fmtK = (n) => `$${Math.round(Math.abs(n) / 1000)}K`;

const SERVICE_TIERS = [
  {
    tier: 'Tier 1A — Complete Financial Administration',
    description: 'Monthly GL posting, reconciliations, warrant preparation, budget monitoring, annual close support, audit preparation and auditor coordination. Approx. 8–12 SA hours/month per town.',
    feeRange: '$9,000–$13,000',
    hours_per_month: '8–12 hrs',
    staff_level: 'Staff Accountant',
    includes: ['Monthly GL posting', 'Bank reconciliation', 'Warrant preparation', 'Budget monitoring', 'Annual close support', 'Audit prep & auditor coordination'],
  },
  {
    tier: 'Tier 1B — Payroll Administration',
    description: 'Bi-weekly payroll processing, tax deposits, quarterly 941 filings, W-2 preparation. Priced per pay period or flat annual rate based on employee count.',
    feeRange: '$4,000–$5,500',
    hours_per_month: '4–6 hrs',
    staff_level: 'Staff Accountant',
    includes: ['Bi-weekly payroll processing', 'Tax deposits', 'Quarterly 941 filings', 'W-2 preparation', 'State filings', 'Maine PERS data'],
  },
  {
    tier: 'Tier 1C — Budget Development Support',
    description: 'Annual budget workbook preparation, department submissions, revenue analysis, Select Board presentation materials. Finance Director attends budget committee meetings.',
    feeRange: '$2,500–$4,500',
    hours_per_month: '~4 hrs (annual peak)',
    staff_level: 'Staff Accountant + FD oversight',
    includes: ['Budget workbook prep', 'Department submission templates', 'Revenue analysis', 'Select Board presentation materials', 'Budget committee attendance (FD)'],
  },
  {
    tier: 'Tier 1 Complete Package (A+B+C)',
    description: 'Bundled rate with 10% discount vs. a la carte. Minimum 12-month interlocal agreement. Includes all financial administration, payroll, and budget development.',
    feeRange: '$16,000–$22,000',
    hours_per_month: '16–22 hrs',
    staff_level: 'Staff Accountant + FD oversight',
    includes: ['All Tier 1A services', 'All Tier 1B services', 'All Tier 1C services', '10% bundle discount', '12-month minimum agreement', 'Annual CPI adjustment clause'],
    highlight: true,
  },
];

const PROJECT_ENGAGEMENTS = [
  { type: 'Chart of Accounts Rebuild', fee: '$4,500–$7,500', deliverable: 'COA assessment vs. Maine GASB standards; redesign with fund accounting structure; ERP/TRIO config docs; staff training. Implementation-ready COA with crosswalk from prior structure.' },
  { type: 'Taxation Review & Assessment Analysis', fee: '$3,500–$5,500', deliverable: 'Mill rate review, property tax commitment analysis, abatement history, BETE/BETR compliance. Findings report with corrective action and estimated revenue recovery.' },
  { type: 'Audit Preparation & Corrective Action Support', fee: '$5,000–$9,000', deliverable: 'Pre-audit reconciliation, schedule prep (fixed assets, debt service, fund balance), PBC list completion, management letter response drafting. Higher end for towns with open findings.' },
  { type: 'ERP / Financial System Implementation Support', fee: '$6,000–$12,000', deliverable: 'Vendor evaluation, RFP development, COA configuration, data migration review, parallel testing, go-live support. Relevant for towns transitioning from Harris TRIO.' },
  { type: 'Policy & Internal Controls Development', fee: '$2,500–$5,000', deliverable: 'Cash handling, purchasing, AP/AR, payroll policy drafts. Internal control gap assessment vs. audit standards. Board-ready resolutions.' },
  { type: 'Grant Administration Support', fee: '$1,500–$4,000/grant', deliverable: 'Application support, drawdown management, reporting, fund accounting setup, closeout documentation. Fee scales with grant complexity.' },
];

const TOWNS = [
  {
    name: 'Roque Bluffs',
    population: 320,
    tier: 'Tier 1',
    status: 'confirmed',
    phase: 1,
    startMonth: 'Month 9 (Y1)',
    contractKey: 'rb_annual_contract',
    notes: 'Very small, GF-only operations. Town meetings informal. Clerk does most bookkeeping currently.',
    color: 'emerald',
  },
  {
    name: 'Machiasport',
    population: 1050,
    tier: 'Tier 1–2',
    status: 'confirmed',
    phase: 1,
    startMonth: 'Month 9 (Y1)',
    contractKey: 'machiasport_annual_contract',
    notes: 'Slightly more complex — has a small sewer district. FD oversight may be needed quarterly.',
    color: 'emerald',
  },
  {
    name: 'Marshfield',
    population: 430,
    tier: 'Tier 1',
    status: 'prospective',
    phase: 2,
    startMonth: 'Year 2',
    contractKey: 'marshfield_annual_contract',
    notes: 'Outreach planned in Year 1. Town Clerk currently handles all bookkeeping without formal training.',
    color: 'blue',
  },
  {
    name: 'Whitneyville',
    population: 310,
    tier: 'Tier 1',
    status: 'prospective',
    phase: 3,
    startMonth: 'Year 3',
    contractKey: 'whitneyville_annual_contract',
    notes: 'Very small. Likely bundled service with Northfield for efficiency.',
    color: 'amber',
  },
  {
    name: 'Northfield',
    population: 230,
    tier: 'Tier 1',
    status: 'prospective',
    phase: 3,
    startMonth: 'Year 3',
    contractKey: 'northfield_annual_contract',
    notes: 'Smallest of the group. May be a good pilot for shared bookkeeping with one other town.',
    color: 'amber',
  },
];

function TownCard({ town, settings, data }) {
  const [open, setOpen] = useState(false);
  const contractAmt = settings[town.contractKey];
  const colors = {
    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-800', text: 'text-emerald-800' },
    blue:    { bg: 'bg-blue-50',    border: 'border-blue-200',    badge: 'bg-blue-100 text-blue-800',       text: 'text-blue-800'    },
    amber:   { bg: 'bg-amber-50',   border: 'border-amber-200',   badge: 'bg-amber-100 text-amber-800',     text: 'text-amber-800'   },
  };
  const c = colors[town.color];
  const tierData = SERVICE_TIERS.find(t => t.tier.startsWith(town.tier.split('–')[0]));

  return (
    <div className={`rounded-xl border ${c.border} ${c.bg} overflow-hidden`}>
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="h-3.5 w-3.5 text-slate-500" />
              <h3 className="font-bold text-slate-900 text-sm">{town.name}</h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.badge}`}>
                {town.status === 'confirmed' ? '✓ Confirmed' : 'Prospective'}
              </span>
            </div>
            <p className="text-xs text-slate-500">Pop. {town.population.toLocaleString()} · {town.tier} · Phase {town.phase} · Starts {town.startMonth}</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-slate-900">{fmt(contractAmt)}</p>
            <p className="text-[10px] text-slate-400">per year (base)</p>
          </div>
        </div>
        <p className="text-xs text-slate-600 mt-2">{town.notes}</p>
        <button onClick={() => setOpen(!open)} className="mt-2 flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 font-medium">
          {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          {open ? 'Hide' : 'Show'} service details
        </button>
      </div>
      {open && tierData && (
        <div className="border-t border-slate-200 bg-white px-4 py-3">
          <p className="text-xs font-semibold text-slate-700 mb-2">Services included ({tierData.tier}):</p>
          <div className="grid grid-cols-2 gap-1">
            {tierData.includes.map((item, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs text-slate-600">
                <span className="text-emerald-500">✓</span> {item}
              </div>
            ))}
          </div>
          <p className="text-[10px] text-slate-400 mt-2">Est. time commitment: {tierData.hours_per_month}/month · Delivered by: {tierData.staff_level}</p>
        </div>
      )}
    </div>
  );
}

export default function RegionalServices() {
  const { settings, updateSettings } = useModel();
  const data = useMemo(() => runProFormaFromSettings(settings), [settings]);
  const [showPricing, setShowPricing] = useState(false);
  const [activeTab, setActiveTab] = useState('towns');

  const totalY1Regional = data[0].value.regionalServices;
  const total5yr = data.reduce((s, d) => s + d.value.regionalServices + d.value.emsExternal, 0);

  // Pricing model — based on loaded staff costs
  const saFL = Math.round(settings.sa_base_salary * (1 + settings.fica_rate + settings.pers_rate + settings.wc_rate) + settings.health_family_annual);
  const rcFL = Math.round(settings.rc_base_salary * (1 + settings.fica_rate + settings.pers_rate + settings.wc_rate) + settings.health_family_annual);
  const ctrlFL = Math.round(settings.controller_base_salary * (1 + settings.fica_rate + settings.pers_rate + settings.wc_rate) + settings.health_family_annual);
  const fdFL = settings.fd_loaded_cost;

  const annualHours = 2080;
  const saHourly = Math.round(saFL / annualHours);
  const fdHourly = Math.round(fdFL / annualHours);
  const ctrlHourly = Math.round(ctrlFL / annualHours);
  const overhead_multiplier = 1.25; // 25% overhead recovery

  const tier1AnnualCost = Math.round(saHourly * 10 * 12 * overhead_multiplier); // 10 hrs/mo
  const tier2AnnualCost = Math.round((saHourly * 18 + fdHourly * 2) * 12 * overhead_multiplier); // 18 SA + 2 FD per month
  const tier3AnnualCost = Math.round((saHourly * 30 + fdHourly * 4 + ctrlHourly * 2) * 12 * overhead_multiplier);

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <SectionHeader
          title="Regional Financial Services Program"
          subtitle="Paid interlocal agreements with neighboring municipalities — new General Fund revenue"
          icon={Target}
        />
        <Link to="/ModelSettings" className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 border border-slate-200 rounded-lg px-3 py-1.5">
          <Settings className="h-3.5 w-3.5" /> Adjust Settings
        </Link>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Y1 Contract Revenue', value: fmt(totalY1Regional), sub: 'Partial year (4 months)' },
          { label: 'Y3 Annual Revenue', value: fmt(data[2].value.regionalServices), sub: 'All 5 towns active' },
          { label: '5-Yr Total (incl EMS ext)', value: fmtK(total5yr), sub: 'Municipal + EMS billing' },
          { label: 'Towns Served by Y3', value: '5', sub: 'Roque Bluffs → Northfield' },
        ].map((s, i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-2xl font-bold text-slate-900">{s.value}</p>
            <p className="text-xs font-medium text-slate-600 mt-0.5">{s.label}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {[['towns','Town Profiles'],['phases','Phase Timeline'],['pricing','Pricing Model'],['emsext','EMS External Billing'],['legal','Legal Framework']].map(([id, label]) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${activeTab === id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Town Profiles */}
      {activeTab === 'towns' && (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">All contract values are adjustable in <Link to="/ModelSettings" className="underline text-slate-800 font-medium">Model Settings</Link>. Click any town card for service details.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TOWNS.map(town => (
              <TownCard key={town.name} town={town} settings={settings} data={data} />
            ))}
          </div>
        </div>
      )}

      {/* Phase Timeline */}
      {activeTab === 'phases' && (
        <div className="space-y-4">
          <div className="space-y-3">
            {[
              {
                phase: 'Phase 1 — Confirmed Contracts', timing: 'Year 1 (Month 9)', color: 'emerald',
                towns: ['Roque Bluffs', 'Machiasport'],
                actions: ['Draft interlocal agreements under 30-A M.R.S.A. § 2201', 'Select Board authorization', 'Set up sub-ledger in ERP for each client entity', 'Define monthly deliverable package and reporting schedule'],
                revenue: fmt(Math.round(settings.rb_annual_contract * 4/12) + Math.round(settings.machiasport_annual_contract * 4/12)),
                note: 'Partial year — 4 months of service in Y1',
              },
              {
                phase: 'Phase 2 — Expansion', timing: 'Year 2', color: 'blue',
                towns: ['Marshfield'],
                actions: ['Outreach and proposal in Year 1', 'SA capacity available after Comstar cutover', 'Audit prior year financials to establish baseline', 'Revenue Coordinator evaluation begins'],
                revenue: fmt(settings.marshfield_annual_contract),
                note: 'Full year contract. Combined Y2 regional revenue: ' + fmt(data[1].value.regionalServices),
              },
              {
                phase: 'Phase 3 — Full Program', timing: 'Year 3', color: 'amber',
                towns: ['Whitneyville', 'Northfield'],
                actions: ['Revenue Coordinator hire triggered', 'Bundled service model for smallest towns', 'ERP multi-entity fully operational', 'External EMS billing for neighboring Ambulance Services'],
                revenue: fmt(data[2].value.regionalServices),
                note: 'Revenue Coordinator hired when this revenue covers fully loaded position cost',
              },
            ].map((ph, i) => {
              const colors = {
                emerald: 'border-emerald-200 bg-emerald-50',
                blue: 'border-blue-200 bg-blue-50',
                amber: 'border-amber-200 bg-amber-50',
              };
              return (
                <div key={i} className={`rounded-xl border ${colors[ph.color]} p-5`}>
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{ph.phase}</h3>
                      <p className="text-xs text-slate-500">{ph.timing} · Towns: {ph.towns.join(', ')}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-lg font-bold text-slate-900">{ph.revenue}</p>
                      <p className="text-[10px] text-slate-500">annual contract revenue</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 mb-2">
                    {ph.actions.map((a, j) => (
                      <div key={j} className="flex items-start gap-1.5 text-xs text-slate-700">
                        <span className="text-slate-400 mt-0.5">→</span> {a}
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-500 italic">{ph.note}</p>
                </div>
              );
            })}
          </div>

          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white px-4 py-2 text-[10px] font-semibold uppercase tracking-wider grid grid-cols-6">
              <span>Fiscal Year</span>
              {data.map(d => <span key={d.year}>{d.fiscalYear}</span>)}
            </div>
            {[
              ['Roque Bluffs', (d, i) => i === 0 ? fmt(Math.round(settings.rb_annual_contract*4/12)) : fmt(Math.round(settings.rb_annual_contract * Math.pow(1.04, i)))],
              ['Machiasport', (d, i) => i === 0 ? fmt(Math.round(settings.machiasport_annual_contract*4/12)) : fmt(Math.round(settings.machiasport_annual_contract * Math.pow(1.04, i)))],
              ['Marshfield', (d, i) => i >= 1 ? fmt(Math.round(settings.marshfield_annual_contract * Math.pow(1.04, i-1))) : '—'],
              ['Whitneyville', (d, i) => i >= 2 ? fmt(Math.round(settings.whitneyville_annual_contract * Math.pow(1.04, i-2))) : '—'],
              ['Northfield', (d, i) => i >= 2 ? fmt(Math.round(settings.northfield_annual_contract * Math.pow(1.04, i-2))) : '—'],
              ['Total Contracts', (d) => fmt(d.value.regionalServices)],
            ].map(([label, fn], ri) => (
              <div key={label} className={`px-4 py-2 grid grid-cols-6 text-xs border-t border-slate-100 ${ri === 5 ? 'bg-slate-50 font-semibold' : ''}`}>
                <span className="font-medium text-slate-800">{label}</span>
                {data.map((d, i) => <span key={i} className="font-mono text-slate-700">{fn(d, i)}</span>)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pricing Model */}
      {activeTab === 'pricing' && (
        <div className="space-y-5">
          {/* Cost basis */}
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="font-semibold text-slate-800 text-sm mb-3">Pricing Basis — Staff Cost at Model Settings</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
              {[
                { label: 'Staff Accountant', fl: saFL, hourly: saHourly },
                { label: 'Finance Director', fl: fdFL, hourly: fdHourly },
                { label: 'Revenue Coordinator', fl: rcFL, hourly: Math.round(rcFL / annualHours) },
                { label: 'Controller', fl: ctrlFL, hourly: ctrlHourly },
              ].map((r, i) => (
                <div key={i} className="rounded-lg bg-slate-50 p-3 text-xs">
                  <p className="font-semibold text-slate-700">{r.label}</p>
                  <p className="text-slate-500 mt-1">Fully loaded: <span className="font-mono font-bold text-slate-800">{fmt(r.fl)}/yr</span></p>
                  <p className="text-slate-500">Effective rate: <span className="font-mono font-bold text-slate-800">${r.hourly}/hr</span></p>
                  <p className="text-[10px] text-slate-400 mt-1">+{Math.round((overhead_multiplier-1)*100)}% overhead → ${Math.round(r.hourly * overhead_multiplier)}/hr billed</p>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-slate-400">Blended billing rate: SA at ~${saHourly}/hr, FD at ~${fdHourly}/hr. Managed services fees invoiced monthly; project fees at completion. All fees subject to annual CPI adjustment per interlocal agreement.</p>
            <p className="text-[10px] text-slate-400 mt-1">* Change staff salaries in <Link to="/ModelSettings" className="underline">Model Settings</Link> to update all pricing calculations automatically.</p>
          </div>

          {/* Tier 1 Managed Services */}
          <div>
            <h3 className="font-semibold text-slate-800 text-sm mb-3">Tier 1 — Managed Financial Services (Annual Contracts)</h3>
            <div className="space-y-3">
              {SERVICE_TIERS.map((tier, i) => (
                <div key={i} className={`rounded-xl border overflow-hidden ${tier.highlight ? 'border-emerald-300' : 'border-slate-200'} bg-white`}>
                  <div className={`px-5 py-3 flex items-center justify-between ${tier.highlight ? 'bg-emerald-800' : 'bg-slate-900'} text-white`}>
                    <div>
                      <h3 className="font-bold text-sm">{tier.tier}</h3>
                      <p className="text-[10px] text-slate-300">{tier.staff_level} · {tier.hours_per_month}/month</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-emerald-300">{tier.feeRange}</p>
                      <p className="text-[10px] text-slate-400">annual fee range</p>
                    </div>
                  </div>
                  <div className="px-5 py-4">
                    <p className="text-xs text-slate-600 mb-3">{tier.description}</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5">
                      {tier.includes.map((item, j) => (
                        <div key={j} className="flex items-center gap-1.5 text-xs text-slate-700">
                          <span className="text-emerald-500 font-bold">✓</span> {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tier 2 Project-Based */}
          <div>
            <h3 className="font-semibold text-slate-800 text-sm mb-3">Tier 2 — Project-Based Engagements (Fixed Fee)</h3>
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <div className="bg-slate-900 text-white px-4 py-2 text-[10px] font-semibold uppercase tracking-wider grid grid-cols-3">
                <span>Project Type</span><span>Fixed Fee Range</span><span>Deliverables</span>
              </div>
              {PROJECT_ENGAGEMENTS.map((p, i) => (
                <div key={i} className="px-4 py-3 grid grid-cols-3 text-xs border-t border-slate-100">
                  <span className="font-semibold text-slate-800">{p.type}</span>
                  <span className="font-mono font-bold text-emerald-700">{p.fee}</span>
                  <span className="text-slate-600">{p.deliverable}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 mt-2">Municipality complexity drives FD vs. SA time allocation. A town with open audit findings or nonstandard COA requires proportionally more Finance Director hours. All project fees subject to interlocal agreement terms.</p>
          </div>

          {/* Contract comparison */}
          <div>
            <h3 className="font-semibold text-slate-800 text-sm mb-2">Current Contract Values vs. Cost Basis</h3>
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 px-4 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider grid grid-cols-5">
                <span>Municipality</span><span>Tier</span><span>Direct Cost/yr</span><span>Contract Value</span><span>Margin</span>
              </div>
              {TOWNS.slice(0,3).map((town, i) => {
                const directCost = Math.round(saHourly * 130 + fdHourly * 24); // ~130 SA hrs + 24 FD oversight hrs
                const actual = settings[town.contractKey];
                const margin = actual - directCost;
                const marginPct = Math.round((margin / directCost) * 100);
                return (
                  <div key={i} className="px-4 py-2 grid grid-cols-5 text-xs border-t border-slate-100">
                    <span className="font-medium text-slate-800">{town.name}</span>
                    <span className="text-slate-600">{town.tier}</span>
                    <span className="font-mono text-slate-500">~{fmt(directCost)}</span>
                    <span className="font-mono font-semibold text-slate-800">{fmt(actual)}</span>
                    <span className={`font-mono font-semibold ${margin >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{fmt(margin)} ({marginPct}%)</span>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Direct cost = ~130 SA hours + 24 FD oversight hours per town per year at model rates. Adjust contract values in <Link to="/ModelSettings" className="underline">Model Settings</Link>.</p>
          </div>
        </div>
      )}

      {/* EMS External Billing */}
      {activeTab === 'emsext' && (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Once the Billing Specialist is operational, Machias can offer EMS billing services to neighboring Ambulance Services. Machias ran <strong>1,648 transports</strong> in FY2024–25 with <strong>$2.44M gross charges</strong> and an <strong>87.39% overall collection rate</strong> under Comstar — in-house with a dedicated specialist is projected to reach 90%+.
          </p>

          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white px-4 py-2 text-[10px] font-semibold uppercase tracking-wider grid grid-cols-4">
              <span>Fiscal Year</span><span>EMS Ext Revenue</span><span>Target Clients</span><span>Notes</span>
            </div>
            {[
              ['FY2027', data[0].value.emsExternal, '0', 'Transition year — focus on Machias billing only'],
              ['FY2028', data[1].value.emsExternal, '1', 'Jonesport or Harrington first client'],
              ['FY2029', data[2].value.emsExternal, '2', 'Second EMS service added'],
              ['FY2030', data[3].value.emsExternal, '3', 'Third client; full regional EMS billing hub'],
              ['FY2031', data[4].value.emsExternal, '3–4', 'Stable client base; modest growth'],
            ].map(([fy, rev, clients, note], i) => (
              <div key={i} className="px-4 py-2.5 grid grid-cols-4 text-xs border-t border-slate-100">
                <span className="font-medium text-slate-800">{fy}</span>
                <span className="font-mono text-emerald-700 font-semibold">{fmt(rev)}</span>
                <span className="text-slate-600">{clients}</span>
                <span className="text-slate-500">{note}</span>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-5">
            <h4 className="font-semibold text-blue-900 text-sm mb-3">EMS External Billing Pricing Models</h4>
            <p className="text-xs text-blue-800 mb-4">Pricing undercuts Comstar's {(settings.comstar_fee_rate*100).toFixed(2)}% fee while maintaining positive margin for Machias. Flat fee is based on historical annual call volume — not a per-transport rate — to provide budget certainty for client towns.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              {[
                {
                  label: 'Annual Flat Fee',
                  price: 'Fixed annual amount',
                  note: 'Based on prior-year transport volume. Client gets budget certainty regardless of call volume. Machias absorbs year-over-year variance.',
                  recommended: false,
                  example: 'e.g., 400 annual transports × $40/transport = $16,000/yr flat',
                },
                {
                  label: 'Percentage of Collections',
                  price: '3.5–4.0% of gross',
                  note: `Below Comstar's ${(settings.comstar_fee_rate*100).toFixed(2)}% — compelling pitch. Machias revenue grows as client transport volume grows. Client pays more in high-volume years.`,
                  recommended: false,
                  example: 'e.g., $500K gross billings × 3.75% = $18,750/yr',
                },
                {
                  label: 'Hybrid Model',
                  price: '% with annual minimum',
                  note: 'Percentage of collections with a floor. Client pays the greater of the minimum or % calculation. Machias gets baseline revenue protection; client upside is capped at minimum.',
                  recommended: true,
                  example: 'e.g., $12,000 minimum or 3.75% of gross, whichever is greater',
                },
              ].map((m, i) => (
                <div key={i} className={`rounded-lg border p-3 text-xs ${m.recommended ? 'border-blue-400 bg-blue-50' : 'bg-white border-blue-100'}`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <p className="font-semibold text-blue-900">{m.label}</p>
                    {m.recommended && <span className="text-[9px] bg-blue-600 text-white px-1.5 py-0.5 rounded-full font-bold">RECOMMENDED</span>}
                  </div>
                  <p className="text-base font-bold text-blue-700 my-1">{m.price}</p>
                  <p className="text-blue-700 mb-2">{m.note}</p>
                  <p className="text-[10px] text-blue-500 italic">{m.example}</p>
                </div>
              ))}
            </div>

            {/* Machias actual data context */}
            <div className="rounded-xl bg-white border border-blue-200 p-4">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Machias FY2024–25 Billing Data (Comstar)</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Total Transports', value: '1,648' },
                  { label: 'Gross Charges', value: '$2,443,735' },
                  { label: 'Total Collected', value: '$1,095,931' },
                  { label: 'Overall Collection Rate', value: '87.39%' },
                ].map((s, i) => (
                  <div key={i} className="text-center">
                    <p className="text-lg font-bold text-slate-900">{s.value}</p>
                    <p className="text-[10px] text-slate-500">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { payer: 'Medicare', rate: '97.95%', transports: 1001 },
                  { payer: 'Medicaid', rate: '97.40%', transports: 292 },
                  { payer: 'Blue Cross', rate: '91.95%', transports: 48 },
                  { payer: 'Self-Pay (Uninsured)', rate: '3.26%', transports: 35 },
                ].map((p, i) => (
                  <div key={i} className="rounded bg-slate-50 px-2 py-1.5 text-[10px]">
                    <p className="font-semibold text-slate-700">{p.payer}</p>
                    <p className="text-emerald-700 font-bold">{p.rate}</p>
                    <p className="text-slate-400">{p.transports} transports</p>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 mt-2">Note: 19.6% of denials were controllable by Comstar (duplicate claims, incorrect codes, missing info). In-house billing with FD oversight can directly reduce this. 35 uninsured self-pay patients represent the primary write-off risk — payment plan program can recover a portion.</p>
            </div>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 text-xs text-amber-800">
            <strong>Payment Plan Opportunity:</strong> The 159 self-pay patients (insured + uninsured) collected only $19,833 of $141,303 allowable (14%). An in-house billing specialist with direct patient contact can implement flexible payment plans — even recovering 25% of currently written-off self-pay would add ~$30,000/year in collections. This increases billing specialist workload moderately but reduces write-offs meaningfully.
          </div>
        </div>
      )}

      {/* Legal Framework */}
      {activeTab === 'legal' && (
        <div className="space-y-4 text-sm text-slate-700">
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
            <h3 className="font-bold text-slate-900">Legal Authority — Interlocal Cooperation Act</h3>
            <p>Maine municipalities may enter into agreements to jointly exercise any power, privilege, or authority under <strong>30-A M.R.S.A. § 2201 (Interlocal Cooperation Act)</strong>. This is the primary legal vehicle for the Regional Financial Services Program.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
              {[
                { title: 'Required elements', items: ['Written agreement signed by both parties', 'Select Board vote in both municipalities', 'Filed with the Secretary of State', 'Defines scope of services', 'Establishes compensation and term'] },
                { title: 'Optional elements', items: ['Indemnification provisions', 'Insurance requirements', 'Data security and confidentiality', 'Termination notice period (recommend 90 days)', 'Annual review and renegotiation clause'] },
              ].map((col, i) => (
                <div key={i} className="rounded-lg bg-slate-50 p-3">
                  <p className="font-semibold text-slate-700 text-xs mb-2">{col.title}</p>
                  {col.items.map((item, j) => (
                    <p key={j} className="text-xs text-slate-600">• {item}</p>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-2">
            <h3 className="font-bold text-slate-900">Liability & Insurance Considerations</h3>
            <p className="text-xs">Each interlocal agreement should address: professional liability coverage for finance services, errors and omissions coverage, data breach coverage for financial records. Machias's existing municipal liability policy may need a rider for financial services delivery. MMEHT and MMTCTP should be consulted.</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-2">
            <h3 className="font-bold text-slate-900">Revenue Classification</h3>
            <p className="text-xs">Interlocal service agreement revenue is classified as <strong>non-tax revenue</strong> in the General Fund. It reduces the net amount to be raised by taxation (mill rate) and is reported on line 3 of the budget summary as "Intergovernmental Revenue." This is not a taxable enterprise — it is a governmental service agreement.</p>
          </div>
        </div>
      )}
    </div>
  );
}