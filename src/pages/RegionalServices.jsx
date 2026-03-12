import React, { useState, useMemo } from 'react';
import { useModel } from '../components/machias/ModelContext';
import { runProFormaFromSettings } from '../components/machias/FinancialModelV2';
import SectionHeader from '../components/machias/SectionHeader';
import { Target, DollarSign, MapPin, Users, ChevronDown, ChevronUp, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

const fmt  = (n) => n == null ? '—' : `$${Math.abs(Math.round(n)).toLocaleString()}`;
const fmtK = (n) => `$${Math.round(Math.abs(n) / 1000)}K`;

// Tier 1: Managed services (annual fee range)
const TIER1_MANAGED = [
  { component: 'Complete Financial Administration', feeRange: '$9,000–$13,000', scope: 'Monthly GL posting, reconciliations, warrant prep, budget monitoring, annual close support, audit prep & auditor coordination; approx. 8–12 SA hrs/month per town.' },
  { component: 'Payroll Administration', feeRange: '$4,000–$5,500', scope: 'Bi-weekly payroll processing, tax deposits, quarterly 941 filings, W-2 preparation. Priced per pay period or flat annual rate based on employee count.' },
  { component: 'Budget Development Support', feeRange: '$2,500–$4,500', scope: 'Annual budget workbook preparation, department submissions, revenue analysis, Select Board presentation materials. FD attends budget committee meetings.' },
  { component: 'Complete Package (all three)', feeRange: '$16,000–$22,000', scope: 'Bundled rate with 10% discount vs. à la carte. Minimum 12-month interlocal agreement. Direct cost to serve one town (130 SA hrs + 24 FD oversight hrs): ~$7,900/yr.', highlight: true },
];

// Tier 2: Project-based engagements
const TIER2_PROJECTS = [
  { project: 'Chart of Accounts Rebuild', feeRange: '$4,500–$7,500', deliverables: 'COA assessment against Maine municipal GASB standards; redesign with fund accounting structure; ERP/TRIO configuration documentation; staff training.' },
  { project: 'Taxation Review & Assessment Analysis', feeRange: '$3,500–$5,500', deliverables: 'Mil rate review, property tax commitment analysis, abatement history, BETE/BETR compliance. Findings report with corrective action recommendations.' },
  { project: 'Audit Preparation & Corrective Action Support', feeRange: '$5,000–$9,000', deliverables: 'Pre-audit reconciliation, schedule prep (fixed assets, debt service, fund balance), PBC list completion, management letter response drafting.' },
  { project: 'ERP / Financial System Implementation Support', feeRange: '$6,000–$12,000', deliverables: 'Vendor evaluation, RFP development, COA configuration, data migration review, parallel testing, go-live support. Relevant for towns transitioning from TRIO.' },
  { project: 'Policy & Internal Controls Development', feeRange: '$2,500–$5,000', deliverables: 'Cash handling, purchasing, AP/AR, payroll policy drafts. Internal control gap assessment vs. audit standards. Board-ready resolutions.' },
  { project: 'Grant Administration Support', feeRange: '$1,500–$4,000/grant', deliverables: 'Application support, drawdown management, reporting, fund accounting setup, closeout documentation. Fee scales with grant complexity.' },
];

const SERVICE_TIERS = [
  {
    tier: 'Tier 1 — Complete Managed Financial Services',
    description: 'Recurring annual services delivered on a monthly basis under a minimum 12-month interlocal agreement. Priced at a blended rate of $55–$75/hr reflecting fully loaded internal costs.',
    hours_per_month: '8–12 hrs (basic) / 16–24 hrs (full)',
    staff_level: 'Staff Accountant + FD oversight',
    includes: ['Monthly GL posting & reconciliation', 'Warrant preparation', 'Budget monitoring', 'Annual close support', 'Audit preparation & coordination', 'Payroll administration (optional)', 'Budget development support (optional)'],
  },
  {
    tier: 'Tier 2 — Project-Based Engagements',
    description: 'Fixed-scope deliverables priced at completion or on a defined milestone schedule. Time allocation between FD and SA depends on client complexity and prior audit status.',
    hours_per_month: 'Project-based',
    staff_level: 'Staff Accountant + Finance Director (complexity-dependent)',
    includes: ['COA rebuild', 'Taxation review & assessment analysis', 'Audit prep & corrective action', 'ERP/system implementation support', 'Policy & internal controls development', 'Grant administration support'],
  },
  {
    tier: 'Tier 3 — Comprehensive Financial Services',
    description: 'All managed services plus enterprise fund oversight, capital planning support, debt service management, and on-site attendance at board meetings. Requires Revenue Coordinator.',
    hours_per_month: '32–40 hrs',
    staff_level: 'Staff Accountant + FD + Revenue Coordinator',
    includes: ['All Tier 1 services', 'Enterprise fund accounting', 'Capital improvement plan', 'Debt service scheduling', 'On-site board meeting attendance', 'GASB compliance review', 'Insurance procurement support'],
  },
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
          <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 text-sm text-amber-800">
            <strong>Pricing Philosophy:</strong> Managed services fees are derived from estimated staff time at a blended rate of $55–$75/hr (SA at $55/hr, FD at $85/hr), reflecting fully loaded internal costs with a modest recovery margin. All fees subject to interlocal agreement terms and annual CPI adjustment. Direct cost to serve one town (130 SA hrs + 24 FD oversight hrs): approximately $7,900/yr.
          </div>

          {/* Staff cost basis */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="font-semibold text-slate-800 text-sm mb-3">Staff Cost Basis (from Model Settings)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
                  <p className="text-[10px] text-slate-400 mt-1">+{Math.round((overhead_multiplier-1)*100)}% overhead = ${Math.round(r.hourly * overhead_multiplier)}/hr billed</p>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 mt-3">* Change staff salaries in <Link to="/ModelSettings" className="underline">Model Settings</Link> to update all pricing calculations automatically.</p>
          </div>

          {/* Tier 1: Managed Services Detail */}
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="bg-slate-900 text-white px-5 py-3">
              <h3 className="font-bold text-sm">Tier 1 — Complete Managed Financial Services</h3>
              <p className="text-[10px] text-slate-400">Recurring annual services · Staff Accountant + FD oversight · Minimum 12-month interlocal agreement</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-4 py-2 font-semibold text-slate-600 w-1/3">Service Component</th>
                    <th className="text-left px-4 py-2 font-semibold text-slate-600 w-1/5">Annual Fee Range</th>
                    <th className="text-left px-4 py-2 font-semibold text-slate-600">Scope</th>
                  </tr>
                </thead>
                <tbody>
                  {TIER1_MANAGED.map((row, i) => (
                    <tr key={i} className={`border-t border-slate-100 ${row.highlight ? 'bg-emerald-50' : ''}`}>
                      <td className={`px-4 py-2.5 font-semibold ${row.highlight ? 'text-emerald-800' : 'text-slate-800'}`}>{row.component}</td>
                      <td className={`px-4 py-2.5 font-mono font-bold ${row.highlight ? 'text-emerald-700' : 'text-slate-700'}`}>{row.feeRange}</td>
                      <td className={`px-4 py-2.5 leading-relaxed ${row.highlight ? 'text-emerald-700' : 'text-slate-600'}`}>{row.scope}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tier 2: Project-Based */}
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="bg-slate-800 text-white px-5 py-3">
              <h3 className="font-bold text-sm">Tier 2 — Project-Based Engagements</h3>
              <p className="text-[10px] text-slate-400">Fixed-scope deliverables · Fees invoiced at completion or milestone schedule · FD/SA allocation depends on client complexity</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-4 py-2 font-semibold text-slate-600 w-1/3">Project Type</th>
                    <th className="text-left px-4 py-2 font-semibold text-slate-600 w-1/5">Fixed Fee Range</th>
                    <th className="text-left px-4 py-2 font-semibold text-slate-600">Deliverables</th>
                  </tr>
                </thead>
                <tbody>
                  {TIER2_PROJECTS.map((row, i) => (
                    <tr key={i} className="border-t border-slate-100">
                      <td className="px-4 py-2.5 font-semibold text-slate-800">{row.project}</td>
                      <td className="px-4 py-2.5 font-mono font-bold text-slate-700">{row.feeRange}</td>
                      <td className="px-4 py-2.5 text-slate-600 leading-relaxed">{row.deliverables}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-500 italic">
              A municipality with open audit findings, a nonstandard COA, or no prior financial staff will require proportionally more Finance Director hours than a municipality with clean books and standard TRIO configuration.
            </div>
          </div>

          {/* Contract comparison */}
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-4 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider grid grid-cols-5">
              <span>Municipality</span><span>Tier</span><span>Model Price</span><span>Actual Contract</span><span>Margin</span>
            </div>
            {TOWNS.map((town, i) => {
              const tierIdx = parseInt(town.tier.slice(-1)) - 1;
              const modelPrice = [tier1AnnualCost, tier2AnnualCost, tier3AnnualCost][Math.min(tierIdx, 2)];
              const actual = settings[town.contractKey];
              const variance = actual - modelPrice;
              const margin = modelPrice > 0 ? Math.round((variance / modelPrice) * 100) : 0;
              return (
                <div key={i} className="px-4 py-2 grid grid-cols-5 text-xs border-t border-slate-100">
                  <span className="font-medium text-slate-800">{town.name}</span>
                  <span className="text-slate-600">{town.tier}</span>
                  <span className="font-mono text-slate-700">{fmt(modelPrice)}</span>
                  <span className="font-mono text-slate-700">{fmt(actual)}</span>
                  <span className={`font-mono font-semibold ${variance >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{variance >= 0 ? '+' : ''}{fmt(variance)} ({margin}%)</span>
                </div>
              );
            })}
          </div>

          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-xs text-slate-600 space-y-1">
            <p><strong>Adjusting contracts:</strong> Go to <Link to="/ModelSettings" className="underline text-slate-800">Model Settings → Regional Services</Link> to change any contract value. All projections, pro forma, and the pricing comparison above will update automatically.</p>
            <p><strong>Pricing adjustment factors:</strong> Small towns may need subsidized rates to close — consider a first-year discount of 10–15% to secure the contract, then escalate 4%/yr with annual CPI adjustment.</p>
          </div>
        </div>
      )}

      {/* EMS External Billing */}
      {activeTab === 'emsext' && (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Once the Billing Specialist is operational and the in-house EMS billing transition is complete, Machias can offer billing services to neighboring Ambulance Services — generating new revenue from existing capacity.
          </p>

          <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 text-xs text-amber-800">
            <strong>Note on Comstar fees:</strong> Comstar's fee is a percentage of collections — meaning it grows automatically as transport volume and revenue increase. This plan eliminates that escalating cost. The current contract is also under negotiation — the rate could go up or down. In-house billing provides cost certainty and removes Machias from that variable.
          </div>

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

          <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4">
            <h4 className="font-semibold text-blue-900 text-sm mb-1">EMS Billing Service Pricing Models</h4>
            <p className="text-xs text-blue-800 mb-3">All models are priced below Comstar's current {(settings.comstar_fee_rate*100).toFixed(2)}% rate and provide a compelling value proposition to neighboring services.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                {
                  label: 'Flat Annual Fee',
                  price: '$8,000–$15,000/yr',
                  note: 'Based on historical call volume. Predictable for client, simple to administer. Renews annually with CPI escalation. Best for smaller services with stable call volumes.',
                  tag: 'Simple'
                },
                {
                  label: 'Percentage of Collections',
                  price: '3.5–4.0% of gross',
                  note: `Below Comstar's ${(settings.comstar_fee_rate*100).toFixed(2)}% — a compelling pitch. Revenue grows with transport volume. Machias benefits from improving collections. Best for larger or growing services.`,
                  tag: 'Scalable'
                },
                {
                  label: 'Hybrid Model',
                  price: '3.5% with annual minimum',
                  note: 'Percentage of collections with a guaranteed annual floor (e.g., $8,000 minimum regardless of volume). Protects Machias from low-volume years. Client-friendly for variable call volumes.',
                  tag: 'Recommended'
                },
              ].map((m, i) => (
                <div key={i} className={`rounded-lg border p-3 text-xs ${m.tag === 'Recommended' ? 'border-emerald-300 bg-emerald-50' : 'bg-white border-blue-100'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold text-blue-900">{m.label}</p>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${m.tag === 'Recommended' ? 'bg-emerald-200 text-emerald-800' : 'bg-blue-100 text-blue-700'}`}>{m.tag}</span>
                  </div>
                  <p className="text-base font-bold text-blue-700 my-1">{m.price}</p>
                  <p className="text-blue-600 leading-relaxed">{m.note}</p>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-blue-600 mt-3 italic">Note: The flat fee per-transport model is not recommended — it creates perverse incentives around call classification and does not reflect actual billing complexity. Annual flat fee or hybrid percentage models are preferred.</p>
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