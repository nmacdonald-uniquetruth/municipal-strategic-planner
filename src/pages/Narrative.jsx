import React, { useMemo, useState } from 'react';
import { useModel } from '../components/machias/ModelContext';
import { runProFormaFromSettings } from '../components/machias/FinancialModelV2';
import { ERP_PHASES, ENTERPRISE_FUNDS, PAYBACK_DATA } from '../components/machias/FinancialModel';
import {
  BookOpen, DollarSign, Users, Monitor, Landmark, TrendingUp, ShieldCheck,
  Target, AlertTriangle, ChevronRight, Building2, Truck, MapPin, Clock,
  CheckCircle2, Circle, ArrowRight, BarChart2, Lightbulb, FileText
} from 'lucide-react';

// ─── Primitive layout components ─────────────────────────────────────────────

// Each Section gets a fresh acronym-seen Set so first uses are re-defined per section.
const AcronymContext = React.createContext(null);

function Section({ icon, title, children, id }) {
  const Icon = icon;
  // Create a new seen set for each section render
  const seen = React.useMemo(() => new Set(), [id]);
  return (
    <AcronymContext.Provider value={seen}>
      <div id={id} className="space-y-4 scroll-mt-8">
        <div className="flex items-center gap-2.5 border-b-2 border-slate-900 pb-2">
          {Icon && <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 flex-shrink-0"><Icon className="h-3.5 w-3.5 text-white" /></div>}
          <h2 className="text-base font-bold text-slate-900 tracking-tight">{title}</h2>
        </div>
        <div className="text-sm text-slate-700 leading-relaxed space-y-3">{children}</div>
      </div>
    </AcronymContext.Provider>
  );
}

// Inline acronym component — consumes context from nearest Section
function Ac({ id }) {
  const seen = React.useContext(AcronymContext);
  const full = ACRONYM_MAP[id];
  if (!full) return <span className="font-medium">{id}</span>;
  if (!seen || seen.has(id)) return <span className="font-medium">{id}</span>;
  seen.add(id);
  return <><span className="font-medium">{full}</span> <span className="text-slate-500 text-[11px]">({id})</span></>;
}

function SubSection({ title, children }) {
  return (
    <div className="space-y-2 mt-4">
      <h3 className="text-sm font-semibold text-slate-800 border-b border-slate-100 pb-1">{title}</h3>
      <div className="text-sm text-slate-700 leading-relaxed space-y-2">{children}</div>
    </div>
  );
}

function Callout({ color = 'slate', label, children }) {
  const styles = {
    emerald: 'bg-emerald-50 border-emerald-300 text-emerald-900',
    amber:   'bg-amber-50  border-amber-300  text-amber-900',
    blue:    'bg-blue-50   border-blue-300   text-blue-900',
    slate:   'bg-slate-50  border-slate-300  text-slate-800',
    red:     'bg-red-50    border-red-300    text-red-900',
  };
  return (
    <div className={`rounded-xl border-l-4 px-4 py-3 text-xs leading-relaxed ${styles[color]}`}>
      {label && <p className="font-bold mb-1 text-[11px] uppercase tracking-wider opacity-70">{label}</p>}
      {children}
    </div>
  );
}

function DataTable({ headers, rows, footerRow }) {
  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden text-xs">
      {headers && (
        <div className={`bg-slate-900 text-white px-4 py-2 font-semibold grid gap-2 text-[10px] uppercase tracking-wider`}
          style={{ gridTemplateColumns: `repeat(${headers.length}, 1fr)` }}>
          {headers.map((h, i) => <span key={i}>{h}</span>)}
        </div>
      )}
      {rows.map((row, ri) => (
        <div key={ri}
          className={`px-4 py-2 grid gap-2 border-t border-slate-100 ${ri % 2 === 1 ? 'bg-slate-50/50' : ''}`}
          style={{ gridTemplateColumns: `repeat(${row.length}, 1fr)` }}>
          {row.map((cell, ci) => (
            <span key={ci} className={`${ci === 0 ? 'font-medium text-slate-800' : 'font-mono text-slate-700'}`}>{cell}</span>
          ))}
        </div>
      ))}
      {footerRow && (
        <div className="px-4 py-2 grid gap-2 border-t-2 border-slate-300 bg-slate-100 font-bold text-xs"
          style={{ gridTemplateColumns: `repeat(${footerRow.length}, 1fr)` }}>
          {footerRow.map((cell, i) => <span key={i} className="font-mono">{cell}</span>)}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, sub, color = 'slate' }) {
  const colors = { slate: 'text-slate-900', emerald: 'text-emerald-700', amber: 'text-amber-700', blue: 'text-blue-700', red: 'text-red-700' };
  return (
    <div className="text-center p-4 rounded-xl border border-slate-200 bg-white">
      <p className={`text-2xl font-bold ${colors[color]}`}>{value}</p>
      <p className="text-xs font-medium text-slate-600 mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

const fmt  = (n) => n == null ? '—' : `$${Math.abs(Math.round(n)).toLocaleString()}`;
const pct  = (n) => `${(n * 100).toFixed(1)}%`;
const fmtK = (n) => {
  const val = Math.abs(n);
  if (val >= 1000000) return `$${(val / 1000000).toFixed(2)}M`;
  return `$${Math.round(val / 1000)}K`;
};

// ─── Acronym definitions ──────────────────────────────────────────────────────
// Each section gets its own Set so acronyms are re-defined at the start of every major section.
const ACRONYM_MAP = {
  FD:      'Finance Director',
  TM:      'Town Manager',
  SA:      'Staff Accountant',
  BS:      'Billing Specialist',
  GA:      'General Assistance',
  RC:      'Revenue Coordinator',
  GF:      'General Fund',
  EMS:     'Emergency Medical Services',
  ERP:     'Enterprise Resource Planning',
  COA:     'Chart of Accounts',
  PERS:    'Public Employees Retirement System',
  FICA:    'Federal Insurance Contributions Act',
  GASB:    'Governmental Accounting Standards Board',
  HRIS:    'Human Resources Information System',
  RFP:     'Request for Proposals',
  CAFR:    'Comprehensive Annual Financial Report',
  PCR:     'Patient Care Report',
  CDBG:    'Community Development Block Grant',
  USDA:    'U.S. Department of Agriculture',
  MEFIRS:  'Maine EMS Incident Reporting System',
  MMA:     'Maine Municipal Association',
  NAEMSE:  'National Association of EMS Educators',
  TS:      'Transfer Station',
  AP:      'Accounts Payable',
  AR:      'Accounts Receivable',
};

// Wrap an acronym: shows "Full Term (ABBR)" first use per section, just "ABBR" after.
// Pass a mutable Set `seen` that is unique per section.
function A({ id, seen }) {
  const full = ACRONYM_MAP[id];
  if (!full) return <span className="font-medium">{id}</span>;
  if (seen.has(id)) return <span className="font-medium">{id}</span>;
  seen.add(id);
  return <span className="font-medium" title={full}>{full} <span className="text-slate-500">({id})</span></span>;
}

// ─── Table of Contents sidebar ───────────────────────────────────────────────

const SECTIONS = [
  { id: 'exec',        label: 'Executive Summary',         num: '0' },
  { id: 'context',     label: 'Machias Context',           num: '1' },
  { id: 'problem',     label: 'Structural Inefficiency',   num: '2' },
  { id: 'staffing',    label: 'Staffing Structure',        num: '3' },
  { id: 'ems',         label: 'EMS Billing Transition',    num: '4' },
  { id: 'regional',    label: 'Regional Services',         num: '5' },
  { id: 'ts',          label: 'Transfer Station',          num: '6' },
  { id: 'erp',         label: 'ERP Modernization',         num: '7' },
  { id: 'enterprise',  label: 'Enterprise Funds',          num: '8' },
  { id: 'capacity',    label: 'Capacity Value',            num: '9' },
  { id: 'gf',          label: 'GF Levy Impact',            num: '10' },
  { id: 'summary',     label: '5-Year Summary',            num: '11' },
  { id: 'risks',       label: 'Risks & Mitigations',       num: '12' },
  { id: 'next',        label: 'Next Steps',                num: '13' },
];

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Narrative() {
  const { settings } = useModel();
  const data = useMemo(() => runProFormaFromSettings(settings), [settings]);
  const [activeSection, setActiveSection] = useState('exec');

  const s = settings;
  const d1 = data[0];
  const d2 = data[1];
  const d3 = data[2];
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

  // Health cost
  const healthAnnual = s.health_tier === 'individual' ? s.health_individual_annual : s.health_family_annual;
  const saFL = Math.round(s.sa_base_salary * (1 + s.fica_rate + s.pers_rate + s.wc_rate) + healthAnnual);
  const bsFL = Math.round(s.bs_base_salary * (1 + s.fica_rate + s.pers_rate + s.wc_rate) + healthAnnual);

  // Scroll helper
  const scrollTo = (id) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="flex gap-6 max-w-6xl mx-auto pb-16">

      {/* ── Sticky TOC ── */}
      <div className="hidden lg:block w-52 flex-shrink-0">
        <div className="sticky top-4 space-y-0.5">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-2">Contents</p>
          {SECTIONS.map(sec => (
            <button key={sec.id} onClick={() => scrollTo(sec.id)}
              className={`w-full text-left px-2 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-2
                ${activeSection === sec.id ? 'bg-slate-900 text-white font-semibold' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}>
              <span className="opacity-40 font-mono text-[9px] w-4 flex-shrink-0">{sec.num}</span>
              {sec.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="flex-1 space-y-12 min-w-0">

        {/* Hero banner */}
        <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-7 text-white">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="h-4 w-4 text-slate-400" />
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Strategic Narrative — Town of Machias</span>
          </div>
          <h1 className="text-xl font-bold mb-1 leading-tight">Administrative Restructuring, ERP Modernization<br/>& Regional Service Strategy</h1>
          <p className="text-sm text-slate-400 max-w-2xl mt-2">
            A comprehensive, living document that explains the rationale, research, and financial projections behind the proposed restructuring. All figures update automatically when model settings change.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div><p className="text-xl font-bold text-emerald-400">{fmtK(cashOnly5yr)}</p><p className="text-[10px] text-slate-400">5-Yr Cash Net</p></div>
            <div><p className="text-xl font-bold text-slate-300">{fmtK(cumulative)}</p><p className="text-[10px] text-slate-400">5-Yr Total Value</p></div>
            <div><p className="text-xl font-bold text-blue-400">{d1?.gf?.gfNetLevyImpact <= 0 ? 'Levy Neutral' : 'Review GF'}</p><p className="text-[10px] text-slate-400">Y1 Tax Impact</p></div>
            <div><p className="text-xl font-bold text-amber-400">3 positions</p><p className="text-[10px] text-slate-400">New hires (Phase 1)</p></div>
          </div>
        </div>

        {/* 0 — Executive Summary */}
        <Section id="exec" icon={FileText} title="0. Executive Summary">
          <p>
            The Town of Machias (pop. ~2,100) is the county seat of Washington County and the principal service hub for a region of approximately 30,000 residents. Despite this regional significance, the Town's administrative structure has not evolved to match the complexity and volume of its operational responsibilities.
          </p>
          <p>
            The <Ac id="FD" /> ({fmt(s.fd_loaded_cost)}/yr fully loaded) and <Ac id="TM" /> ({fmt(s.tm_loaded_cost)}/yr fully loaded) collectively spend an estimated <strong>45–60% of FD time and 18–22% of TM time</strong> on transactional financial work: <Ac id="AP" /> processing, payroll processing, <Ac id="EMS" /> billing oversight, informal accounting support to neighboring towns, and grant administration. This is executive compensation applied to sub-professional tasks.
          </p>
          <p>
            Simultaneously, the Town outsources <Ac id="EMS" /> billing to Comstar at <strong>{pct(s.comstar_fee_rate)} of gross collections</strong> — approximately {fmt(d1?.value?.comstarAvoided)}/yr in fees on {s.ems_transports.toLocaleString()} annual transports — a function that an in-house <Ac id="BS" /> could perform at a fraction of that cost while improving collection rates.
          </p>
          <p>
            This plan proposes three simultaneous initiatives: (1) <strong>Administrative restructuring</strong> — three new dedicated positions; (2) <strong><Ac id="ERP" /> modernization</strong> — replacing legacy Trio software with a modern fund-accounting platform; (3) <strong>Regional services expansion</strong> — formalizing existing informal support into paid interlocal agreements with neighboring municipalities.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
            <Callout color="emerald" label="The Core Finding">
              The Town already <em>spends</em> more than $229,000/yr in structural inefficiency. This plan redirects that expenditure into right-sized dedicated roles — the cost is already in the budget.
            </Callout>
            <Callout color="blue" label="Levy Neutrality">
              The restructuring is designed to be levy-neutral from Year 1. New non-tax revenue and avoided costs exceed all <Ac id="GF" />-funded position costs, requiring no property tax increase.
            </Callout>
            <Callout color="amber" label="5-Year Outlook">
              Over five years: {fmtK(cashOnly5yr)} in actual cash net (conservative), {fmtK(cumulative)} in total value including capacity. Cash break-even projected Year 2.
            </Callout>
          </div>

          <SubSection title="What This Document Covers">
            <p>This narrative mirrors the structure of the original planning document but is dynamic — every figure reflects the current model settings. Sections cover: the Machias context and why this matters now; the specific problem of structural inefficiency; each proposed initiative in detail; enterprise fund health; capacity value methodology; general fund fiscal analysis; 5-year projections; and implementation risks and next steps.</p>
          </SubSection>
        </Section>

        {/* 1 — Context */}
        <Section id="context" icon={MapPin} title="1. The Machias Context — Why This Plan, Why Now">
          <p>
            Machias is the shire town of Washington County. As county seat, Machias anchors regional government, courts, healthcare, and commerce for a wide geographic area. The Town operates a General Fund, five enterprise funds (Ambulance, Sewer, Transfer Station, Telebusiness Center, and 7 Court Street), and provides financial administration support — formally or informally — to several neighboring municipalities.
          </p>

          <SubSection title="Current Administrative Capacity — The Gap">
            <p>The Town's Finance Department consists of the Finance Director and a Town Clerk. This staffing level is appropriate for a very small municipality with simple, single-fund operations. Machias is neither small nor simple:</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
              <Stat label="Annual Calls" value={s.ems_transports.toLocaleString()} sub="Ambulance Service" color="slate" />
              <Stat label="Enterprise Funds" value="4" sub="Ambulance, Sewer, Transfer Station, Telebusiness Center" color="slate" />
              <Stat label="Tax Levy" value={fmtK(s.annual_tax_levy)} sub="Annual GF levy" color="slate" />
              <Stat label="Assessed Value" value={`$${(s.total_assessed_value / 1000000).toFixed(0)}M`} sub="Total assessed value" color="slate" />
            </div>
          </SubSection>

          <SubSection title="The Timing Argument — Why Act Now">
            <p>Three factors converge to make the present moment the right time to restructure:</p>
            <div className="space-y-2 mt-1">
              {[
                { num: '1', title: 'Audit findings', body: `Annual audits have flagged separation-of-duties deficiencies — a direct consequence of inadequate staffing. Each year of inaction increases the risk of material misstatement, missed grant compliance requirements, or financial loss. The estimated annual control risk exposure is ${fmt(s.control_risk_exposure)}.` },
                { num: '2', title: 'Comstar contract renewal window', body: `The Town has a natural transition point to evaluate its EMS billing arrangement. Moving in-house now captures ${fmt(d1?.value?.comstarAvoided)} in Year 1 fees and eliminates a growing liability as transport volume increases at ${pct(s.transport_growth_rate)}/yr.` },
                { num: '3', title: 'Regional demand', body: `Roque Bluffs and Machiasport have already expressed interest in formal service agreements. Delaying creates the risk that these towns establish alternative arrangements — locking Machias out of the regional services revenue opportunity.` },
              ].map(item => (
                <div key={item.num} className="flex gap-3 rounded-lg border border-slate-200 p-3">
                  <span className="flex-shrink-0 h-5 w-5 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center">{item.num}</span>
                  <div><p className="font-semibold text-slate-800 text-xs">{item.title}</p><p className="text-xs text-slate-600 mt-0.5">{item.body}</p></div>
                </div>
              ))}
            </div>
          </SubSection>

          <SubSection title="Financial Baseline">
            <DataTable
              headers={['Parameter', 'Current Value', 'Notes']}
              rows={[
                ['Annual tax levy', fmt(s.annual_tax_levy), 'General Fund'],
                ['Current mill rate', `${s.current_mill_rate} mills`, 'Per $1,000 assessed value'],
                ['Total assessed value', `$${(s.total_assessed_value / 1000000).toFixed(1)}M`, 'Real property + personal'],
                ['GF undesignated balance', fmt(s.gf_undesignated_balance), 'Available for one-time needs'],
                ['Ambulance fund balance', fmt(s.ambulance_fund_balance), 'Post loan payoff: ' + fmt(s.ambulance_fund_balance - s.ambulance_loan_payoff)],
                ['FD fully loaded cost', fmt(s.fd_loaded_cost), 'All benefits included'],
                ['TM fully loaded cost', fmt(s.tm_loaded_cost), 'All benefits included'],
              ]}
            />
          </SubSection>
        </Section>

        {/* 2 — Problem */}
        <Section id="problem" icon={AlertTriangle} title="2. The Structural Inefficiency Problem">
          <p>
            The clearest way to understand the problem is to look at how the Town currently purchases administrative services and compare it to what those services actually cost in the market.
          </p>

          <SubSection title="Executive Compensation on Transactional Work">
            <p>
              The <Ac id="FD" />'s fully loaded compensation is <strong>{fmt(s.fd_loaded_cost)}/year</strong>. An analysis of FD time allocation reveals that a significant portion is spent on tasks properly performed by a <Ac id="SA" /> or <Ac id="BS" />:
            </p>
            <DataTable
              headers={['FD Task Category', 'Est. % of Time', 'Annual Value at FD Rate', 'Appropriate Level']}
              rows={[
                ['Accounts payable / receivable processing', '15%', fmt(s.fd_loaded_cost * 0.15), 'Staff Accountant'],
                ['Payroll processing and reconciliation', '12%', fmt(s.fd_loaded_cost * 0.12), 'Staff Accountant'],
                ['EMS billing oversight / Comstar liaison', '8%', fmt(s.fd_loaded_cost * 0.08), 'Billing Specialist'],
                ['Informal support to neighboring towns', '6%', fmt(s.fd_loaded_cost * 0.06), 'Revenue Coordinator'],
                ['Grant tracking / GA support', '4%', fmt(s.fd_loaded_cost * 0.04), 'GA Coordinator'],
                ['Total transactional (Y1 est.)', '45%', fmt(s.fd_loaded_cost * 0.45), '→ 3 positions'],
              ]}
              footerRow={['Y3+ steady state', '60%', fmt(s.fd_loaded_cost * 0.60), '→ Strategic capacity freed']}
            />
          </SubSection>

          <SubSection title="Town Manager Time Allocation">
            <p>
              The <Ac id="TM" />'s fully loaded cost is <strong>{fmt(s.tm_loaded_cost)}/year</strong>. Approximately 18–22% of TM time is consumed by financial administration oversight — supervising the FD on routine tasks, reviewing payroll, managing finance-adjacent decisions that should be delegated.
            </p>
            <DataTable
              headers={['Year', 'TM Finance Oversight %', 'Annual Value at TM Rate', 'Post-Restructuring Target']}
              rows={[
                ['Year 1', '18%', fmt(s.tm_loaded_cost * 0.18), 'Economic dev, grant strategy'],
                ['Year 2+', '22%', fmt(s.tm_loaded_cost * 0.22), 'Regional partnerships, capital planning'],
              ]}
            />
          </SubSection>

          <SubSection title="The Comstar Fee Problem">
            <p>
              Machias contracts with Comstar for <Ac id="EMS" /> billing at a confirmed rate of <strong>{pct(s.comstar_fee_rate)} of gross collections</strong>. At {s.ems_transports.toLocaleString()} annual calls and {fmt(s.avg_revenue_per_transport)} average revenue per call:
            </p>
            <DataTable
              headers={['Metric', 'Value', 'Notes']}
              rows={[
                ['Annual calls', s.ems_transports.toLocaleString(), `Growing at ${pct(s.transport_growth_rate)}/yr`],
                ['Avg revenue per call', fmt(s.avg_revenue_per_transport), 'Gross, pre-collection'],
                ['Gross annual EMS revenue', fmt(s.ems_transports * s.avg_revenue_per_transport), 'Before collection rate'],
                ['Comstar collection rate', pct(s.comstar_collection_rate), 'Current actual rate'],
                ['Comstar fee rate', pct(s.comstar_fee_rate), 'Confirmed contract rate'],
                ['Y1 Comstar fee paid', fmt(d1?.value?.comstarAvoided), 'Eliminated in-house'],
                ['Y5 projected Comstar fee', fmt(d5?.value?.comstarAvoided), 'Compounds with growth'],
              ]}
            />
            <p className="mt-2">A Billing Specialist at {fmt(s.bs_base_salary)} base ({fmt(bsFL)} all-in cost including all benefits) costs less than the Comstar fee in Year 1. The position pays for itself before counting any collection rate improvement.</p>
          </SubSection>

          <SubSection title="Informal Stipend Arrangements">
            <p>
              The Town maintains informal stipend arrangements totaling approximately <strong>{fmt(s.stipend_elimination)}/year</strong> for administrative support functions. These stipends create compliance risks (classification, benefits eligibility), lack formal job descriptions, and do not meet the needs of a growing administrative workload. This plan consolidates these functions into formal positions with proper supervision.
            </p>
          </SubSection>

          <SubSection title="Internal Control Risk">
            <Callout color="red" label="Audit Risk — Separation of Duties">
              <p>The current staffing model creates material separation-of-duties deficiencies. With one Finance Director and a Town Clerk, the same individuals are involved in authorization, recording, and reconciliation of financial transactions — a fundamental internal control failure.</p>
              <p className="mt-2">Annual auditors have flagged this. The estimated annual exposure — representing realistic costs from undetected errors, audit adjustments, potential disallowed grant expenditures, and missed compliance opportunities — is <strong>{fmt(s.control_risk_exposure)}/year</strong>. At 50% in Year 1 (partial mitigation) and 75% in Year 2+, this represents a significant portion of the plan's value.</p>
            </Callout>
          </SubSection>

          <div className="grid grid-cols-3 gap-3 mt-2">
            <Stat label="Annual FD time on transactional tasks" value="45–60%" color="red" sub="Y1→Y3 rising" />
            <Stat label="Annual Comstar fees (Y1)" value={fmt(d1?.value?.comstarAvoided)} color="red" sub="Growing annually" />
            <Stat label="Total structural inefficiency" value="$229K+" color="red" sub="FD time + Comstar + stipends" />
          </div>
        </Section>

        {/* 3 — Staffing */}
        <Section id="staffing" icon={Users} title="3. Proposed Staffing Structure">
          <p>
            Three Phase 1 positions are proposed, each funded by a different source to maintain levy neutrality. Two additional trigger-based positions follow in Years 3 and 5.
          </p>

          <SubSection title="Benefit Load Assumptions">
            <DataTable
              headers={['Benefit', 'Rate / Amount', 'Applies To']}
              rows={[
                ['Federal Insurance Contributions Act (FICA) — Social Security + Medicare', pct(s.fica_rate), 'All non-stipend positions'],
                ['Maine Public Employees Retirement System (PERS)', pct(s.pers_rate), 'All non-stipend positions'],
                ["Workers' Compensation", pct(s.wc_rate), 'All non-stipend positions'],
                [`Health Insurance (${healthLabel} tier)`, `${fmt(healthAnnual)}/yr`, 'All full-time positions'],
                ['Total benefit load on salary', pct(s.fica_rate + s.pers_rate + s.wc_rate), '+ health separately'],
              ]}
            />
          </SubSection>

          <SubSection title={`Year 1 Staffing Model: ${usePartTime ? 'Part-Time + Stipend Reallocation' : 'Full-Time Staff Accountant'}`}>
            {usePartTime ? (
              <>
                <p>
                  <strong>Part-time model:</strong> Rather than hiring a full-time <Ac id="SA" /> immediately, Year 1 deploys a part-time individual funded through the existing <Ac id="GA" /> stipend ({fmt(s.ga_stipend)}) plus {fmt(s.clerk_stipend_realloc)} in reallocated clerk stipends. This person absorbs GA coordinator duties and provides accounting support while the Town establishes processes, completes a <Ac id="COA" /> analysis, and prepares for a full-time hire in Year 2.
                </p>
                <p>Total Y1 accounting role cost: <strong>{fmt(s.ga_stipend + s.clerk_stipend_realloc)}</strong> — funded entirely through reallocation of existing budget lines, not new appropriations. Full-time SA is hired in Year 2 at {fmt(s.sa_base_salary)} base / {fmt(saFL)} fully loaded.</p>
              </>
            ) : (
              <p>
               <strong>Full-time model:</strong> <Ac id="SA" /> hired in Year 1 at {fmt(s.sa_base_salary)} base salary. All-in cost (including {healthLabel} health insurance, {pct(s.fica_rate)} <Ac id="FICA" />, {pct(s.pers_rate)} <Ac id="PERS" />, {pct(s.wc_rate)} WC): <strong>{fmt(saFL)}</strong>. Year 1 partial-year cost (prorated based on hire timing): <strong>{fmt(d1?.costs?.staffAccountant)}</strong>.
              </p>
            )}
          </SubSection>

          <SubSection title="Position Details and Fund Sources">
            <DataTable
              headers={['Position', 'Base Salary', 'Fully Loaded', 'Y1 Cost', 'Fund Source', 'Timing']}
              rows={[
                [usePartTime ? 'PT Accounting Role (Y1)' : 'Staff Accountant', usePartTime ? `${fmt(s.ga_stipend)}+${fmt(s.clerk_stipend_realloc)}` : fmt(s.sa_base_salary), usePartTime ? 'No benefits' : fmt(saFL), fmt(d1?.costs?.staffAccountant), 'General Fund', 'Month 1–3'],
                ['Billing Specialist', fmt(s.bs_base_salary), fmt(bsFL), fmt(d1?.costs?.billingSpecialist), 'Ambulance Fund', 'Month 7 (6 mo Y1)'],
                ['GA Coordinator', fmt(s.ga_stipend), 'Stipend only', usePartTime ? '$0 (absorbed)' : fmt(d1?.costs?.gaCoordinator), 'General Fund', usePartTime ? 'Y2 (separate)' : 'Month 9 (4 mo Y1)'],
                ['Revenue Coordinator', fmt(s.rc_base_salary), fmt(s.rc_base_salary), 'Trigger-based', 'Regional Revenue', 'Y3 — when covered by contracts'],
                [y5SeniorLabel, s.y5_senior_hire === 'controller' ? fmt(s.controller_base_salary) : fmt(s.sa_base_salary), '—', 'Trigger-based', 'General Fund', 'Y5 H2 (half-year)'],
              ]}
            />
          </SubSection>

          <SubSection title="Why Each Position Is Needed — Efficiency Gained">
            <div className="space-y-3">
              {[
                {
                  title: 'Staff Accountant', icon: '📊',
                  body: `The primary fix for the structural inefficiency problem. Takes over AP, payroll, bank reconciliation, grant financial reporting, and audit prep from the FD. Restores separation of duties. Enables the FD to focus on financial strategy, budget development, and capital planning. ERP implementation and regional services expansion can proceed without this hire, but will take longer and carry greater operational risk.`
                },
                {
                  title: 'Billing Specialist', icon: '🚑',
                  body: `Manages in-house EMS billing, replacing the Comstar contract. Positioned in the Finance Department and reports to the Finance Director. Funded through general administration budget with cost recovery via increased Ambulance Fund transfer. The position eliminates ${fmt(d1?.value?.comstarAvoided)}/yr in Comstar fees in Year 1 while improving collection rates from ${pct(s.comstar_collection_rate)} to ${pct(s.inhouse_y1_rate)} (Y1) and ${pct(s.inhouse_steady_rate)} (Y2+). Also positioned to manage external EMS billing for neighboring towns as a revenue source.`
                },
                {
                  title: 'GA Coordinator', icon: '📋',
                  body: `Manages grant applications, compliance reporting, and federal/state program administration. Currently distributed across the FD and TM, creating conflicts with financial oversight responsibilities and grant compliance risk. This role is relatively independent from the other hires — its primary value is directly relieving the Town Manager's time, which is currently consumed by grant tracking and program compliance. The ${fmt(s.ga_stipend)} stipend is modest relative to the grant dollars at stake — a single successful CDBG or USDA grant can return 50–100x the coordinator's annual cost.`
                },
                {
                  title: 'Revenue Coordinator (Trigger Y3)', icon: '🤝',
                  body: `Hired only when regional services contract revenue covers the fully loaded position cost. This trigger-based approach eliminates implementation risk — the position cannot create a budget deficit by definition. Once regional contracts reach ${fmt(s.rc_base_salary)} in annual revenue, the coordinator accelerates expansion by managing client relationships and compliance.`
                },
              ].map(p => (
                <div key={p.title} className="flex gap-3 rounded-xl border border-slate-200 p-4">
                  <span className="text-lg flex-shrink-0">{p.icon}</span>
                  <div><p className="font-semibold text-slate-800 text-xs mb-1">{p.title}</p><p className="text-xs text-slate-600 leading-relaxed">{p.body}</p></div>
                </div>
              ))}
            </div>
          </SubSection>

          <SubSection title="5-Year Staffing Cost Projection">
            <DataTable
              headers={['', 'FY2027', 'FY2028', 'FY2029', 'FY2030', 'FY2031']}
              rows={[
                ['Staff Accountant / PT Role', fmt(d1.costs.staffAccountant), fmt(d2.costs.staffAccountant), fmt(data[2].costs.staffAccountant), fmt(data[3].costs.staffAccountant), fmt(data[4].costs.staffAccountant)],
                ['Billing Specialist', fmt(d1.costs.billingSpecialist), fmt(d2.costs.billingSpecialist), fmt(data[2].costs.billingSpecialist), fmt(data[3].costs.billingSpecialist), fmt(data[4].costs.billingSpecialist)],
                ['GA Coordinator', fmt(d1.costs.gaCoordinator), fmt(d2.costs.gaCoordinator), fmt(data[2].costs.gaCoordinator), fmt(data[3].costs.gaCoordinator), fmt(data[4].costs.gaCoordinator)],
                ['Revenue Coordinator', '—', '—', fmt(data[2].costs.revenueCoordinator) || '—', fmt(data[3].costs.revenueCoordinator) || '—', fmt(data[4].costs.revenueCoordinator)],
                [`${y5SeniorLabel}`, '—', '—', '—', '—', fmt(data[4].costs.controller)],
                ['Airport Stipend', fmt(d1.costs.airportStipend), fmt(d2.costs.airportStipend), fmt(data[2].costs.airportStipend), fmt(data[3].costs.airportStipend), fmt(data[4].costs.airportStipend)],
                ['ERP Cost', fmt(d1.costs.implementation), fmt(d2.costs.implementation), fmt(data[2].costs.implementation), fmt(data[3].costs.implementation), fmt(data[4].costs.implementation)],
              ]}
              footerRow={['Total Costs', fmt(d1.costs.total), fmt(d2.costs.total), fmt(data[2].costs.total), fmt(data[3].costs.total), fmt(data[4].costs.total)]}
            />
            <p className="text-xs text-slate-500 mt-1">Wage escalation at {pct(s.wage_growth_rate)}/yr. Billing Specialist prorated 6 months in Y1.</p>
          </SubSection>
        </Section>

        {/* 4 — EMS Billing */}
        <Section id="ems" icon={DollarSign} title="4. EMS Billing Transition — Comstar to In-House">
          <p>
            The Machias <Ac id="EMS" /> (Ambulance Service) generated approximately <strong>{fmt(s.ems_transports * s.avg_revenue_per_transport)}</strong> in gross billing in the most recent year on {s.ems_transports.toLocaleString()} calls. Comstar currently collects {pct(s.comstar_collection_rate)} of that gross and charges {pct(s.comstar_fee_rate)} of gross collections — roughly <strong>{fmt(d1?.value?.comstarAvoided)}</strong> in fees in Year 1.
          </p>

          <SubSection title="The Case for In-House Billing">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Callout color="red" label="Current State (Comstar)">
                <p>Collection rate: {pct(s.comstar_collection_rate)}</p>
                <p>Annual fee: {fmt(d1?.value?.comstarAvoided)} (Y1), growing with transport volume</p>
                <p>Limited visibility into denial management and appeal rates</p>
                <p>No integration with local EMS run records</p>
                <p>Fee compounds as calls grow at {pct(s.transport_growth_rate)}/yr</p>
              </Callout>
              <Callout color="emerald" label="Proposed In-House">
                <p>Y1 collection rate: {pct(s.inhouse_y1_rate)} (ramp period)</p>
                <p>Y2+ collection rate: {pct(s.inhouse_steady_rate)} (steady state)</p>
                <p>Full denial management, appeal tracking, and <Ac id="PCR" /> integration</p>
                <p>External billing service potential for neighboring Ambulance Services</p>
                <p>Annual cost: Billing Specialist fully loaded ({fmt(bsFL)}) — Ambulance Fund</p>
              </Callout>
            </div>
          </SubSection>

          <SubSection title="Year-by-Year EMS Financial Impact">
            <DataTable
               headers={['Fiscal Year', 'Calls', 'Comstar Fee Avoided', 'Collection Improvement', 'BS Cost (Amb Fund)', 'Net Ambulance Fund Benefit']}
              rows={data.map(d => [
                d.fiscalYear,
                Math.round(s.ems_transports * Math.pow(1 + s.transport_growth_rate, d.year - 1)).toLocaleString(),
                fmt(d.value.comstarAvoided),
                fmt(d.value.collectionImprovement),
                fmt(d.costs.billingSpecialist),
                fmt(d.value.comstarAvoided + d.value.collectionImprovement - d.costs.billingSpecialist),
              ])}
              footerRow={['5-Year Total', '—',
                fmt(data.reduce((s, d) => s + d.value.comstarAvoided, 0)),
                fmt(data.reduce((s, d) => s + d.value.collectionImprovement, 0)),
                fmt(data.reduce((s, d) => s + d.costs.billingSpecialist, 0)),
                fmt(data.reduce((s, d) => s + d.value.comstarAvoided + d.value.collectionImprovement - d.costs.billingSpecialist, 0)),
              ]}
            />
          </SubSection>

          <SubSection title="Transition Plan">
            <div className="space-y-2">
              {[
                { phase: 'Month 1–6', title: 'Parallel operation', body: 'Billing Specialist hired in Month 7. Prior to hire, begin documentation of current Comstar processes, run data, and denial patterns. Negotiate transition timeline with Comstar.' },
                { phase: 'Month 7–9', title: 'Parallel billing run', body: `Billing Specialist begins processing alongside Comstar. Compare results. Target: achieve ≥ ${pct(s.inhouse_y1_rate)} collection rate before cutover.` },
                { phase: 'Month 10', title: 'Comstar cutover', body: 'Full transition to in-house billing. Comstar contract terminates. All new calls billed in-house. Begin denial management protocol.' },
                { phase: 'Year 2+', title: 'External EMS billing', body: 'Offer EMS billing services to neighboring Ambulance Services (Jonesport, Harrington, Whiting) as a regional service. Projected revenue: $15K (Y2), $30K (Y3), $45K (Y4), $55K (Y5).' },
              ].map(step => (
                <div key={step.phase} className="flex gap-3 rounded-lg border border-slate-200 p-3">
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 rounded px-2 py-1 flex-shrink-0 h-fit">{step.phase}</span>
                  <div><p className="font-semibold text-slate-800 text-xs">{step.title}</p><p className="text-xs text-slate-600 mt-0.5">{step.body}</p></div>
                </div>
              ))}
            </div>
          </SubSection>

          <Callout color="emerald" label="Key Point">
            The Billing Specialist is paid from the General Fund administration budget and reports to the Finance Director. The Ambulance Fund transfer to the General Fund increases to cover the Billing Specialist cost, maintaining the Ambulance Fund as a self-sustaining operation. This structure ensures proper financial supervision while distributing the cost through the ambulance transfer mechanism.
          </Callout>
        </Section>

        {/* 5 — Regional Services */}
        <Section id="regional" icon={Target} title="5. Regional Financial Services Program">
          <p>
            Machias currently provides informal, uncompensated financial support to several neighboring municipalities — reviewing budgets, answering accounting questions, assisting with grants. The Regional Financial Services Program formalizes these relationships into <strong>paid interlocal service agreements</strong> under Maine's interlocal cooperation statute (30-A M.R.S.A. § 2201).
            <span className="block mt-2 text-[11px] text-slate-500 italic">Key roles in this section: <Ac id="FD" /> (Finance Director), <Ac id="RC" /> (Revenue Coordinator), <Ac id="EMS" /> (Emergency Medical Services).</span>
          </p>

          <SubSection title="The Regional Demand">
            <p>Washington County towns face a shared challenge: they are too small to afford a full-time Finance Director, but their financial complexity (enterprise funds, federal grants, state programs) requires professional financial oversight. Machias, as the county seat with existing finance capacity, is the natural regional provider.</p>
            <p>Neighboring towns want to pay Machias for financial services. This plan positions Machias as the county seat of financial administration — a role that generates revenue and strengthens regional relationships. All municipalities are facing stronger scrutiny regarding finances due to underskilled individuals being in roles managing public money. This trend is visible across Washington County, Penobscot, Farmington, and Waldo County — creating both urgency and opportunity for a well-staffed regional hub.</p>
            <p>Active conversations are already happening about Roque Bluffs using Machias finance services and Transfer Station access beginning in FY2027. Confirmed interest also from Machiasport. Prospective clients include Marshfield, Whitneyville, and Northfield. Each contract provides basic financial services: monthly reconciliation, budget preparation support, grant financial reporting, and audit preparation. These relationships would be managed by the Finance Director.</p>
          </SubSection>

          <SubSection title="Contract Projections by Municipality">
            <DataTable
              headers={['Municipality', 'Contract Start', 'Y1 Contract', 'Y2 Contract', 'Notes']}
              rows={[
                ['Roque Bluffs', 'Month 9 (4 mo Y1)', fmt(Math.round(s.rb_annual_contract * 4/12)), fmt(s.rb_annual_contract), 'Confirmed interest; small town, basic services'],
                ['Machiasport', 'Month 9 (4 mo Y1)', fmt(Math.round(s.machiasport_annual_contract * 4/12)), fmt(s.machiasport_annual_contract), 'Confirmed interest; slightly larger scope'],
                ['Marshfield', 'Year 2', '—', fmt(s.marshfield_annual_contract), 'Prospective; outreach in Y1'],
                ['Whitneyville', 'Year 3', '—', '—', fmt(s.whitneyville_annual_contract) + '/yr from Y3'],
                ['Northfield', 'Year 3', '—', '—', fmt(s.northfield_annual_contract) + '/yr from Y3'],
              ]}
            />
          </SubSection>

          <SubSection title="5-Year Regional Revenue Projection">
            <DataTable
              headers={['Fiscal Year', 'Municipal Contracts', 'EMS External Billing', 'Total Regional', 'Cumulative']}
              rows={(() => {
                let cum = 0;
                return data.map(d => {
                  cum += d.value.regionalServices + d.value.emsExternal;
                  return [d.fiscalYear, fmt(d.value.regionalServices), fmt(d.value.emsExternal), fmt(d.value.regionalServices + d.value.emsExternal), fmt(cum)];
                });
              })()}
              footerRow={['5-Year Total', fmt(data.reduce((s, d) => s + d.value.regionalServices, 0)), fmt(data.reduce((s, d) => s + d.value.emsExternal, 0)), fmt(data.reduce((s, d) => s + d.value.regionalServices + d.value.emsExternal, 0)), '']}
            />
          </SubSection>

          <SubSection title="Revenue Coordinator Trigger Mechanics">
            <p>
              The Revenue Coordinator position ({fmt(s.rc_base_salary)} base) is hired <em>only when</em> annual regional services revenue meets or exceeds the fully loaded position cost. This is a hard trigger — the model calculates regional revenue at each year and only includes RC cost when coverage is confirmed.
            </p>
            <Callout color="blue" label="Self-Funding Design">
              Under base case projections, the Revenue Coordinator trigger is met in Year 3 when Whitneyville and Northfield contracts begin. Total regional revenue at that point: {fmt(d3?.value?.regionalServices)}. RC fully loaded cost: approximately {fmt(s.rc_base_salary)}. Net: {fmt((d3?.value?.regionalServices || 0) - s.rc_base_salary)} surplus above position cost.
            </Callout>
          </SubSection>
        </Section>

        {/* 6 — Transfer Station */}
        <Section id="ts" icon={Truck} title="6. Transfer Station Revenue Strategy">
          <p>
            The Machias Transfer Station enterprise fund carries a significant deficit balance of approximately <strong>($296,245)</strong> — the most financially stressed of the Town's enterprise funds. The deficit has accumulated over several years as operational costs have outpaced revenue.
          </p>
          <p>
            There are currently no formal member towns, but Roque Bluffs has expressed strong interest in joining beginning in summer of CY2026 or the start of FY2027. The restructuring creates the administrative capacity to finalize that agreement, implement proper cost allocation, and expand participation from additional towns. This is not purely a new revenue stream — it is cost sharing that reflects the regional reality of how the facility is used.
          </p>

          <SubSection title="Transfer Station Revenue Projections">
            <DataTable
              headers={['Fiscal Year', 'TS Revenue', 'Context']}
              rows={[
                ['FY2027 (Y1)', fmt(d1.value.transferStation), 'Partial year; begin renegotiations with existing members'],
                ['FY2028 (Y2)', fmt(d2.value.transferStation), 'Revised agreements take effect; Phase 1 expansion'],
                ['FY2029 (Y3)', fmt(data[2].value.transferStation), 'Full year of revised rates + new member towns'],
                ['FY2030 (Y4)', fmt(data[3].value.transferStation), 'Stable member base, annual escalation'],
                ['FY2031 (Y5)', fmt(data[4].value.transferStation), 'Full regional service model'],
              ]}
              footerRow={['5-Year Total', fmt(data.reduce((s, d) => s + d.value.transferStation, 0)), 'Toward deficit recovery']}
            />
          </SubSection>

          <Callout color="amber" label="Why the Finance Restructuring Enables This">
            The Transfer Station revenue expansion requires formal cost accounting, interlocal agreement drafting, and ongoing billing — tasks that the current Finance Department cannot absorb. The Staff Accountant position directly enables this revenue recovery by providing the capacity to manage member billing and cost reporting.
          </Callout>
        </Section>

        {/* 7 — ERP */}
        <Section id="erp" icon={Monitor} title="7. ERP Modernization — Replacing Legacy Trio">
          <p>
            The Town currently operates on <strong>Trio</strong>, a legacy municipal financial software platform. <Ac id="ERP" /> modernization replaces Trio with a modern fund-accounting system. Trio's current limitations relevant to growth include: limited multi-entity sub-ledger capability (serving regional clients will take longer to scale without it), payroll is integrated for Town employees but not for the school district — requiring significant manual effort to consolidate reports for quarterly submissions, a basic budgeting module exists but is not fully integrated with the general ledger, and limited reporting and audit trail tools. These constraints increase the time required for each annual audit and slow the path to regional service expansion. The Town may also need to purchase the <Ac id="AR" /> module from TRIO in the interim to get the books accurate — estimated cost $3,000–$5,000. Additionally, a review of <Ac id="EMS" /> billing software for insurance company connections and integration to <Ac id="MEFIRS" /> is needed before committing to an in-house billing platform.
          </p>

          <SubSection title="Why ERP Modernization Is a Prerequisite — Not an Add-On">
            <p>
              The administrative restructuring and <Ac id="ERP" /> implementation are <strong>interdependent</strong>. While ERP implementation is technically feasible without additional staff, the timeline extends significantly without adequate finance capacity. The <Ac id="SA" /> enables faster execution of <Ac id="COA" /> rebuild, data migration, and parallel operation. Conversely, the Staff Accountant's long-term effectiveness is significantly enhanced by modern ERP tools that provide reporting and automation capabilities that legacy software cannot support.
            </p>
            <Callout color="amber" label="Implementation Timing">
              Phase 0 of ERP implementation (COA gap analysis, requirements definition) can begin after the Staff Accountant is hired, accelerating the overall project timeline. Implementation without this staffing capacity is possible but would extend the deployment schedule by several months.
            </Callout>
          </SubSection>

          <SubSection title="Implementation Phases and Timeline">
            <div className="space-y-2">
              {ERP_PHASES.map((phase, i) => (
                <div key={i} className="flex gap-3 rounded-lg border border-slate-200 p-3">
                  <div className="flex-shrink-0">
                    <span className="text-[10px] font-bold text-white bg-slate-800 rounded px-2 py-1">{phase.phase}</span>
                  </div>
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
          </SubSection>

          <SubSection title="ERP Financial Analysis">
            <DataTable
              headers={['Item', 'Amount', 'Notes']}
              rows={[
                ['Y1 Implementation Cost', fmt(s.erp_y1_cost), 'Selection, migration, setup, training'],
                ['Designated Fund Offset', `(${fmt(s.erp_designated_fund_offset)})`, 'From prior-year designated surplus'],
                ['Net Y1 GF ERP Impact', fmt(s.erp_y1_cost - s.erp_designated_fund_offset), 'Net new GF appropriation needed'],
                ['Annual Ongoing Cost (Y2+)', fmt(s.erp_ongoing_cost), 'Software licensing + support'],
                ['Annual Value (Y2+)', fmt(s.erp_annual_value), 'Reconciliation time, audit efficiency, error reduction'],
                ['Net Annual Benefit (Y2+)', fmt(s.erp_annual_value - s.erp_ongoing_cost), 'After ongoing cost'],
              ]}
            />
          </SubSection>

          <SubSection title="Platform Evaluation Criteria">
            <p>The <Ac id="RFP" /> process will evaluate platforms against the following criteria, weighted for small Maine municipal context:</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-1">
              {[
                'Maine municipal references (critical)',
                'Trio migration path / data import',
                'Multi-entity fund accounting',
                'Governmental Accounting Standards Board (GASB)-compliant reporting',
                'Integrated payroll / Human Resources Information System (HRIS) module',
                'Citizen payment portal',
                'EMS billing module',
                'School district integration',
                'Annual SaaS cost within budget',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-slate-700 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                  <CheckCircle2 className="h-3 w-3 text-slate-400 flex-shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </SubSection>
        </Section>

        {/* 8 — Enterprise Funds */}
        <Section id="enterprise" icon={Landmark} title="8. Enterprise Fund Health & Overhead Recovery">
          <p>
            The Town operates four enterprise funds. Each appropriately transfers administrative overhead to the General Fund — recognizing that GF staff provide finance, HR, and management services to enterprise operations. These transfers are a legitimate cost recovery mechanism, not a subsidy.
          </p>

          <SubSection title="Enterprise Fund Status">
            <div className="space-y-3">
              {[
                {
                  fund: 'Ambulance Fund', status: 'HEALTHY', statusColor: 'emerald',
                  balance: fmt(s.ambulance_fund_balance),
                  transfer: fmt(s.ambulance_transfer),
                  loanPayoff: fmt(s.ambulance_loan_payoff),
                  netBalance: fmt(s.ambulance_fund_balance - s.ambulance_loan_payoff),
                  action: 'Fund the Billing Specialist position; target $65K overhead transfer in Y2+. Ambulance fund is well-positioned to absorb the billing specialist cost and emerge stronger.',
                  icon: '✅'
                },
                {
                  fund: 'Sewer Fund', status: 'DEFICIT', statusColor: 'red',
                  balance: '($60,200)', transfer: fmt(s.sewer_transfer), loanPayoff: '—', netBalance: '($60,200)',
                  action: 'Hold overhead transfer flat. Prioritize deficit analysis in Year 1 COA work. Rate study required before any expansion.',
                  icon: '⚠️'
                },
                {
                  fund: 'Transfer Station', status: 'CRITICAL', statusColor: 'red',
                  balance: '($296,245)', transfer: fmt(s.ts_transfer), loanPayoff: '—', netBalance: '($296,245)',
                  action: 'Highest priority for revenue restructuring. New member agreements and rate increases are the primary mechanism. SA capacity enables the renegotiation.',
                  icon: '🔴'
                },
                {
                  fund: 'Telebusiness Center', status: 'MARGINAL', statusColor: 'amber',
                  balance: '$14,268', transfer: fmt(s.telebusiness_transfer), loanPayoff: '—', netBalance: '$14,268',
                  action: 'Monitor closely. Evaluate whether the enterprise account scope should be broadened from being tied specifically to 17 Stackpole Road to covering any Town-owned property rental — which would require legal review (est. $2,500–$5,000). TM capacity recovered by restructuring enables this analysis.',
                  icon: '⚡'
                },
                {
                  fund: '7 Court Street', status: 'STABLE', statusColor: 'blue',
                  balance: 'N/A', transfer: fmt(s.court_st_transfer), loanPayoff: '—', netBalance: 'N/A',
                  action: 'Stable rental property fund. Maintain overhead transfer at current level; reassess in Year 3.',
                  icon: '🏢'
                },
              ].map(ef => (
                <div key={ef.fund} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{ef.icon}</span>
                      <h4 className="font-bold text-slate-900 text-sm">{ef.fund}</h4>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      ef.statusColor === 'emerald' ? 'bg-emerald-100 text-emerald-800' :
                      ef.statusColor === 'red' ? 'bg-red-100 text-red-800' :
                      ef.statusColor === 'amber' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                    }`}>{ef.status}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                    <div><p className="text-slate-400">Fund Balance</p><p className="font-mono font-semibold text-slate-800">{ef.balance}</p></div>
                    <div><p className="text-slate-400">GF Overhead Transfer</p><p className="font-mono font-semibold text-slate-800">{ef.transfer}/yr</p></div>
                    <div><p className="text-slate-400">Net Position</p><p className="font-mono font-semibold text-slate-800">{ef.netBalance}</p></div>
                  </div>
                  <p className="text-xs text-slate-600 border-t border-slate-100 pt-2">{ef.action}</p>
                </div>
              ))}
            </div>
          </SubSection>

          <SubSection title="Overhead Transfer Summary">
            <DataTable
              headers={['Fund', 'Y1 Transfer', 'Y3 Transfer (est.)', 'Y5 Transfer (est.)']}
              rows={[
                ['Ambulance Fund', fmt(s.ambulance_transfer), fmt(Math.round(s.ambulance_transfer * Math.pow(1 + s.enterprise_growth_rate, 2))), fmt(Math.round(s.ambulance_transfer * Math.pow(1 + s.enterprise_growth_rate, 4)))],
                ['Sewer Fund', fmt(s.sewer_transfer), fmt(Math.round(s.sewer_transfer * Math.pow(1 + s.enterprise_growth_rate, 2))), fmt(Math.round(s.sewer_transfer * Math.pow(1 + s.enterprise_growth_rate, 4)))],
                ['Transfer Station', fmt(s.ts_transfer), fmt(Math.round(s.ts_transfer * Math.pow(1 + s.enterprise_growth_rate, 2))), fmt(Math.round(s.ts_transfer * Math.pow(1 + s.enterprise_growth_rate, 4)))],
                ['Telebusiness Center', fmt(s.telebusiness_transfer), fmt(Math.round(s.telebusiness_transfer * Math.pow(1 + s.enterprise_growth_rate, 2))), fmt(Math.round(s.telebusiness_transfer * Math.pow(1 + s.enterprise_growth_rate, 4)))],
                ['7 Court Street', fmt(s.court_st_transfer), fmt(Math.round(s.court_st_transfer * Math.pow(1 + s.enterprise_growth_rate, 2))), fmt(Math.round(s.court_st_transfer * Math.pow(1 + s.enterprise_growth_rate, 4)))],
              ]}
              footerRow={['Total', fmt(d1.value.enterpriseOverhead), fmt(data[2].value.enterpriseOverhead), fmt(data[4].value.enterpriseOverhead)]}
            />
            <p className="text-xs text-slate-500 mt-1">Escalation at {pct(s.enterprise_growth_rate)}/yr per model settings.</p>
          </SubSection>
        </Section>

        {/* 9 — Capacity Value */}
        <Section id="capacity" icon={BarChart2} title="9. Capacity Value — The Non-Cash Value Category">
          <p>
            Category 3 value — <Ac id="FD" />/<Ac id="TM" /> capacity recovery and internal control risk mitigation — is real but not cash. It represents time redirected from transactional tasks to strategic work. The model uses conservative hourly valuation based on fully loaded compensation rates.
          </p>

          <SubSection title="Finance Director Capacity Recovery">
            <DataTable
              headers={['Year', 'FD Capacity Freed', '% of FD Time', 'Value at FD Rate', 'What This Time Enables']}
              rows={[
                ['FY2027', fmt(d1.value.fdCapacity), '45%', fmt(d1.value.fdCapacity), 'COA analysis, ERP requirements, audit prep quality'],
                ['FY2028', fmt(d2.value.fdCapacity), '55%', fmt(d2.value.fdCapacity), 'ERP implementation oversight, Comprehensive Annual Financial Report (CAFR) improvement'],
                ['FY2029+', fmt(data[2].value.fdCapacity), '60%', fmt(data[2].value.fdCapacity), 'Capital planning, grant strategy, rate studies'],
              ]}
            />
            <p className="text-xs text-slate-500 mt-1">Value calculated at {fmt(s.fd_loaded_cost)}/yr fully loaded FD cost ÷ ~2,080 annual hours × hours freed.</p>
          </SubSection>

          <SubSection title="Town Manager Capacity Recovery">
            <DataTable
              headers={['Year', 'TM Capacity Freed', '% of TM Time', 'Value at TM Rate', 'What This Time Enables']}
              rows={[
                ['FY2027', fmt(d1.value.tmCapacity), '18%', fmt(d1.value.tmCapacity), 'Economic development, regional partnership building'],
                ['FY2028+', fmt(d2.value.tmCapacity), '22%', fmt(d2.value.tmCapacity), 'Capital project oversight, state/federal lobbying'],
              ]}
            />
          </SubSection>

          <SubSection title="Internal Control Risk Mitigation">
            <p>
              The {fmt(s.control_risk_exposure)}/yr control risk exposure represents a conservative estimate of annual costs attributable to current separation-of-duties deficiencies. This includes:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
              {[
                { item: 'Audit adjustment costs', detail: 'Time and fees associated with correcting entries flagged in annual audit' },
                { item: 'Grant disallowance risk', detail: 'Federal/state grants can be disallowed for financial management deficiencies — a single CDBG disallowance could exceed this estimate' },
                { item: 'Payroll error exposure', detail: 'Overpayments, missed withholdings, benefit calculation errors without second-reviewer' },
                { item: 'Missed revenue', detail: 'Accounts Receivable (AR) aging without dedicated Accounts Payable (AP)/AR staff; unpursued billings' },
              ].map((r, i) => (
                <div key={i} className="rounded-lg border border-slate-200 p-3 text-xs">
                  <p className="font-semibold text-slate-800">{r.item}</p>
                  <p className="text-slate-500 mt-0.5">{r.detail}</p>
                </div>
              ))}
            </div>
            <DataTable
              headers={['Year', 'Control Risk Mitigation', '% of Exposure', 'Notes']}
              rows={data.map(d => [d.fiscalYear, fmt(d.value.controlRisk), d.year === 1 ? '50%' : '75%', d.year === 1 ? 'Partial — SA still ramping' : 'Full separation-of-duties achieved'])}
            />
          </SubSection>

          <Callout color="slate" label="How to Use Category 3 in Decision-Making">
            Category 3 is the most debatable component. For conservative decision-making, use the "5-Year Cash Net" figure on the Dashboard (which excludes all Category 3). For a full picture, Category 3 represents real value — the FD and TM's time is genuinely more valuable applied to strategic work. The model uses cost-of-compensation as a floor value; opportunity value (grants won, projects advanced) likely exceeds it.
          </Callout>
        </Section>

        {/* 10 — GF Levy Impact */}
        <Section id="gf" icon={ShieldCheck} title="10. General Fund Fiscal Impact — Levy Neutrality Analysis">
          <p>
            The central fiscal policy guardrail of this plan: <strong>the restructuring must not require a property tax increase.</strong> The following analysis separates GF-funded costs from GF cash offsets to determine the net levy impact.
          </p>

          <SubSection title="What Is and Is NOT in the GF Calculation">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-2">GF-Funded Costs (levy-financed)</p>
                <div className="space-y-1 text-xs">
                  {[
                    `Staff Accountant (${usePartTime ? 'PT Y1' : 'full-time'}): ${fmt(d1.costs.staffAccountant)}`,
                    `GA Coordinator stipend: ${fmt(d1.costs.gaCoordinator)}`,
                    `Airport stipend: ${fmt(d1.costs.airportStipend)}`,
                    `ERP net cost: ${fmt(d1.costs.implementation)}`,
                    '⚠ Billing Specialist: EXCLUDED (Ambulance Fund)',
                  ].map((item, i) => (
                    <div key={i} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${i === 4 ? 'bg-amber-50 border border-amber-200 text-amber-800' : 'bg-red-50 border border-red-100 text-red-800'}`}>
                      <span>{item}</span>
                    </div>
                  ))}
                  <div className="px-3 py-1.5 rounded-lg bg-slate-100 font-semibold text-slate-800">Total GF Costs: {fmt(d1.gf.gfFundedCosts)}</div>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-2">GF Cash Offsets (reduce levy need)</p>
                <div className="space-y-1 text-xs">
                  {[
                    `Regional contracts: ${fmt(d1.value.regionalServices)}`,
                    `Comstar fee avoided: ${fmt(d1.value.comstarAvoided)}`,
                    `Collection improvement: ${fmt(d1.value.collectionImprovement)}`,
                    `Stipend elimination: ${fmt(d1.value.stipendSavings)}`,
                    `Airport savings: ${fmt(d1.value.airportSavings)}`,
                    `Enterprise overhead: ${fmt(d1.value.enterpriseOverhead)}`,
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-800">
                      <span>{item}</span>
                    </div>
                  ))}
                  <div className="px-3 py-1.5 rounded-lg bg-slate-100 font-semibold text-slate-800">Total Offsets: {fmt(d1.gf.gfCashOffsets)}</div>
                </div>
              </div>
            </div>
          </SubSection>

          <SubSection title="5-Year GF Levy Impact">
            <DataTable
              headers={['Year', 'GF Costs', 'GF Cash Offsets', 'Net Levy Impact', 'Mill Rate Δ', 'Fund Draw']}
              rows={data.map(d => [
                d.fiscalYear,
                fmt(d.gf.gfFundedCosts),
                `(${fmt(d.gf.gfCashOffsets)})`,
                d.gf.gfNetLevyImpact <= 0 ? `(${fmt(Math.abs(d.gf.gfNetLevyImpact))}) surplus` : fmt(d.gf.gfNetLevyImpact),
                `${d.gf.millRateImpact > 0 ? '+' : ''}${d.gf.millRateImpact.toFixed(4)}`,
                d.gf.undesignatedDraw === 0 ? 'None' : fmt(d.gf.undesignatedDraw),
              ])}
            />
          </SubSection>

          <Callout color={d1.gf.gfNetLevyImpact <= 0 ? 'emerald' : 'red'} label="Year 1 Verdict">
            {d1.gf.gfNetLevyImpact <= 0
              ? `Under current model settings, the restructuring produces a net GF surplus of ${fmt(Math.abs(d1.gf.gfNetLevyImpact))} in Year 1. No tax increase required. No undesignated fund draw required. The plan is levy-neutral from the first fiscal year.`
              : `Under current model settings, there is a net GF gap of ${fmt(d1.gf.gfNetLevyImpact)} in Year 1. This would require a levy increase of approximately ${d1.gf.millRateImpact.toFixed(4)} mills or a draw of ${fmt(d1.gf.undesignatedDraw)} from undesignated fund balance. Adjust model settings to restore levy neutrality.`
            }
          </Callout>
        </Section>

        {/* 11 — 5-Year Summary */}
        <Section id="summary" icon={TrendingUp} title="11. Five-Year Financial Summary">
          <SubSection title="Complete Annual Breakdown">
            <DataTable
              headers={['', 'FY2027', 'FY2028', 'FY2029', 'FY2030', 'FY2031', '5-Yr Total']}
              rows={[
                ['Structural Value', fmt(d1.value.structuralTotal), fmt(d2.value.structuralTotal), fmt(data[2].value.structuralTotal), fmt(data[3].value.structuralTotal), fmt(data[4].value.structuralTotal), fmt(data.reduce((s,d)=>s+d.value.structuralTotal,0))],
                ['Regional Value', fmt(d1.value.regionalTotal), fmt(d2.value.regionalTotal), fmt(data[2].value.regionalTotal), fmt(data[3].value.regionalTotal), fmt(data[4].value.regionalTotal), fmt(data.reduce((s,d)=>s+d.value.regionalTotal,0))],
                ['ERP Value', fmt(d1.value.erpValue), fmt(d2.value.erpValue), fmt(data[2].value.erpValue), fmt(data[3].value.erpValue), fmt(data[4].value.erpValue), fmt(data.reduce((s,d)=>s+d.value.erpValue,0))],
                ['Total Value', fmt(d1.value.total), fmt(d2.value.total), fmt(data[2].value.total), fmt(data[3].value.total), fmt(data[4].value.total), fmt(data.reduce((s,d)=>s+d.value.total,0))],
                ['Total Costs', fmt(d1.costs.total), fmt(d2.costs.total), fmt(data[2].costs.total), fmt(data[3].costs.total), fmt(data[4].costs.total), fmt(data.reduce((s,d)=>s+d.costs.total,0))],
                ['Net (All Categories)', fmt(d1.net), fmt(d2.net), fmt(data[2].net), fmt(data[3].net), fmt(data[4].net), fmt(cumulative)],
                ['GF Levy Impact', d1.gf.gfNetLevyImpact<=0?`(${fmt(Math.abs(d1.gf.gfNetLevyImpact))})`:fmt(d1.gf.gfNetLevyImpact), d2.gf.gfNetLevyImpact<=0?`(${fmt(Math.abs(d2.gf.gfNetLevyImpact))})`:fmt(d2.gf.gfNetLevyImpact), data[2].gf.gfNetLevyImpact<=0?`(${fmt(Math.abs(data[2].gf.gfNetLevyImpact))})`:fmt(data[2].gf.gfNetLevyImpact), data[3].gf.gfNetLevyImpact<=0?`(${fmt(Math.abs(data[3].gf.gfNetLevyImpact))})`:fmt(data[3].gf.gfNetLevyImpact), data[4].gf.gfNetLevyImpact<=0?`(${fmt(Math.abs(data[4].gf.gfNetLevyImpact))})`:fmt(data[4].gf.gfNetLevyImpact), fmt(data.reduce((s,d)=>s+d.gf.gfNetLevyImpact,0))],
              ]}
            />
          </SubSection>

          <SubSection title="Cash-Only Conservative View">
            <p className="text-xs text-slate-600">The following excludes all non-cash value (FD/TM capacity, control risk, ERP value, enterprise overhead). Only actual dollars deposited or saved minus actual costs.</p>
            <DataTable
              headers={['Fiscal Year', 'Cash Revenue', 'Total Costs', 'Cash Net', 'Cumulative Cash Net']}
              rows={(() => {
                let cum = 0;
                return data.map(d => {
                  const cashRev = d.value.comstarAvoided + d.value.collectionImprovement +
                    d.value.stipendSavings + d.value.airportSavings +
                    d.value.regionalServices + d.value.emsExternal + d.value.transferStation;
                  const cashNet = cashRev - d.costs.total;
                  cum += cashNet;
                  return [d.fiscalYear, fmt(cashRev), fmt(d.costs.total), fmt(cashNet), fmt(cum)];
                });
              })()}
              footerRow={['5-Year Cash Net', '—', '—', '—', fmt(cashOnly5yr)]}
            />
          </SubSection>

          <SubSection title="Implementation Payback Timeline">
            <DataTable
              headers={['Period', 'Period Costs', 'Period Value', 'Milestone']}
              rows={PAYBACK_DATA.map(p => [p.period, fmt(p.costs), fmt(p.value), p.milestone])}
            />
            <p className="text-xs text-slate-500 mt-1">Based on phased revenue activation: SA operational Q2, BS/Comstar cutover Q4, full regional contracts Y2.</p>
          </SubSection>
        </Section>

        {/* 12 — Risks */}
        <Section id="risks" icon={AlertTriangle} title="12. Risk Analysis & Mitigations">
          <div className="space-y-3">
            {[
              {
                risk: 'Staff Accountant hiring fails or takes longer than modeled',
                likelihood: 'Medium', impact: 'High',
                mitigation: `Washington County labor market is thin for finance professionals. Mitigation: begin recruitment immediately upon Select Board authorization; consider a regional search firm; the part-time Y1 model (toggle in Model Settings) provides a fallback that uses existing stipend budget while the search continues.`,
                color: 'amber'
              },
              {
                risk: 'Regional services contracts not executed in Year 1',
                likelihood: 'Low-Medium', impact: 'Medium',
                mitigation: `Roque Bluffs and Machiasport have expressed formal interest. Contracts are straightforward under Maine interlocal statute. Mitigation: begin interlocal agreement drafting concurrently with staffing. Year 1 revenue is only partial-year (4 months); even a 1-month delay has minimal financial impact.`,
                color: 'amber'
              },
              {
                risk: 'In-house EMS billing underperforms collection rate targets',
                likelihood: 'Low', impact: 'Medium',
                mitigation: `The Year 1 target (${pct(s.inhouse_y1_rate)}) is conservative vs. Comstar's ${pct(s.comstar_collection_rate)}. Even at flat Comstar rates, the fee elimination alone covers the Billing Specialist cost. Collection improvement is upside, not downside protection.`,
                color: 'blue'
              },
              {
                risk: 'ERP implementation cost overrun',
                likelihood: 'Medium', impact: 'Medium',
                mitigation: `${fmt(s.erp_y1_cost)} budget is based on comparable small Maine municipal implementations. Designated fund offset (${fmt(s.erp_designated_fund_offset)}) provides cushion. Mitigation: fixed-price contract structure, phased go-live, no-cost parallel period requirement in RFP.`,
                color: 'amber'
              },
              {
                risk: 'Transfer Station deficit not resolved',
                likelihood: 'Medium', impact: 'High for TS fund',
                mitigation: `The TS fund deficit is a pre-existing condition, not created by this plan. The restructuring improves the Town's capacity to address it by freeing FD time for cost accounting and rate negotiation. Mitigation: include TS rate study in SA Year 1 work plan.`,
                color: 'red'
              },
              {
                risk: 'Sewer fund deficit deepens',
                likelihood: 'Medium', impact: 'Medium',
                mitigation: `The Sewer fund deficit of ($60,200) requires a rate study and potentially a connection fee or special assessment. SA capacity enables this analysis. Mitigation: rate study in Year 1, Board of Selectmen authorization for rate adjustment in Year 2.`,
                color: 'amber'
              },
            ].map((r, i) => (
              <div key={i} className={`rounded-xl border p-4 ${r.color === 'red' ? 'border-red-200 bg-red-50/30' : r.color === 'amber' ? 'border-amber-200 bg-amber-50/30' : 'border-blue-200 bg-blue-50/30'}`}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <p className="font-semibold text-slate-900 text-sm">{r.risk}</p>
                  <div className="flex gap-2 flex-shrink-0">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600">Likelihood: {r.likelihood}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600">Impact: {r.impact}</span>
                  </div>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed"><span className="font-semibold">Mitigation: </span>{r.mitigation}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* 13 — Next Steps */}
        <Section id="next" icon={CheckCircle2} title="13. Recommended Next Steps & Decision Points">
          <p>
            The following actions are required in priority sequence. Each has a specific decision body and a clear dependency chain.
          </p>
          <div className="space-y-2">
            {[
              { num: 1, action: 'Select Board authorization to recruit Staff Accountant', body: 'Select Board', timing: 'Immediate', dep: 'None — this is the critical path item', status: 'pending' },
              { num: 2, action: 'Finance Director COA analysis and ERP requirements scoping', body: 'Finance Director', timing: 'Q1 after SA hire', dep: 'Staff Accountant hired', status: 'pending' },
              { num: 3, action: 'Draft interlocal agreements (Roque Bluffs, Machiasport)', body: 'Town Manager', timing: 'Month 1–3', dep: 'Select Board approval of regional services program', status: 'pending' },
              { num: 4, action: 'Comstar contract transition planning', body: 'Finance Director', timing: 'Month 1–6', dep: 'Billing Specialist position authorized', status: 'pending' },
              { num: 5, action: 'ERP budget approval (Town Meeting)', body: 'Town Meeting', timing: 'Annual Town Meeting', dep: 'Vendor selected; COA analysis complete', status: 'pending' },
              { num: 6, action: 'Transfer Station rate study', body: 'Finance Director + SA', timing: 'Year 1', dep: 'Staff Accountant operational', status: 'pending' },
              { num: 7, action: 'Ambulance Fund financial plan (post-loan-payoff)', body: 'Finance Director', timing: 'Year 1', dep: 'Billing Specialist operational', status: 'pending' },
              { num: 8, action: 'Revenue Coordinator hire evaluation', body: 'Town Manager', timing: 'Year 3 Q1', dep: 'Regional revenue ≥ RC fully loaded cost', status: 'pending' },
            ].map(step => (
              <div key={step.num} className="flex gap-3 rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex-shrink-0 h-7 w-7 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">{step.num}</div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-slate-900 text-sm">{step.action}</p>
                    <span className="text-[10px] text-slate-400 font-mono flex-shrink-0">{step.timing}</span>
                  </div>
                  <div className="flex gap-3 mt-1 text-xs text-slate-500">
                    <span>Decision body: <strong className="text-slate-700">{step.body}</strong></span>
                    <span className="text-slate-300">|</span>
                    <span>Depends on: {step.dep}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Callout color="slate" label="The Critical Path">
            The Staff Accountant hire accelerates every other initiative. Without it: ERP can move forward but will experience delays in operational task completion; regional services can begin but will take longer to scale; EMS billing transition is feasible but adds workload pressure on the FD. The Select Board's authorization to recruit is the most important near-term decision to accelerate the full plan.
          </Callout>
        </Section>

        {/* Footer */}
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-5 text-xs text-slate-500 leading-relaxed space-y-2">
          <p className="font-semibold text-slate-700 text-sm">Document Notes</p>
          <p><strong>Value categories:</strong> "Total Value" includes: (1) cash revenue — regional contracts, EMS billing improvement, avoided Comstar fees, stipend savings, Transfer Station; (2) budget impact — enterprise overhead, airport savings; (3) capacity value — FD/TM time recovered and control risk mitigation. Only Category 1 represents new dollars deposited.</p>
          <p><strong>Live model:</strong> All figures in this document reflect current model settings. Use the Model Settings page to adjust assumptions — every table and calculation will update automatically.</p>
          <p><strong>Wage escalation:</strong> All position costs escalate at {pct(s.wage_growth_rate)}/yr. Enterprise overhead transfers escalate at {pct(s.enterprise_growth_rate)}/yr.</p>
          <p><strong>Conservative floor:</strong> The "5-Year Cash Net" figure on the Dashboard ({fmtK(cashOnly5yr)}) uses only Category 1 cash revenues minus all costs — the most skeptical reasonable reading of this plan's financial return.</p>
        </div>

      </div>
    </div>
  );
}