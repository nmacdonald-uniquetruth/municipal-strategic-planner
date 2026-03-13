import React, { useState } from 'react';
import SectionHeader from '../components/machias/SectionHeader';
import { MessageSquare, ChevronDown, ChevronUp, BookMarked } from 'lucide-react';
import { useModel } from '../components/machias/ModelContext';
import { runProFormaFromSettings } from '../components/machias/FinancialModelV2';

const GLOSSARY = [
  { term: 'AP', def: 'Accounts Payable — money the Town owes to vendors and suppliers' },
  { term: 'AR', def: 'Accounts Receivable — money owed to the Town (billings, fees, EMS collections)' },
  { term: 'AOS', def: 'Auditor of State — Maine State Auditor; sets Chart of Accounts standards for municipalities' },
  { term: 'BLS', def: 'Bureau of Labor Statistics — federal agency; source of occupational wage data' },
  { term: 'BS', def: 'Billing Specialist — proposed in-house EMS and AR billing position' },
  { term: 'CAFR', def: 'Comprehensive Annual Financial Report — full audited financial report; now often called ACFR' },
  { term: 'CDBG', def: 'Community Development Block Grant — federal HUD grant program' },
  { term: 'COA', def: 'Chart of Accounts — the numbered coding structure for all financial transactions' },
  { term: 'EMS', def: 'Emergency Medical Services — the Town\'s ambulance operation' },
  { term: 'ERP', def: 'Enterprise Resource Planning — integrated municipal financial and operational software (e.g., Tyler, Edmunds)' },
  { term: 'FD', def: 'Finance Director — the Town\'s chief financial officer' },
  { term: 'FD/TM', def: 'Finance Director / Town Manager — used together when referencing shared administrative capacity' },
  { term: 'FY', def: 'Fiscal Year — Machias operates July 1 – June 30; FY2027 = July 2026 – June 2027' },
  { term: 'GA', def: 'General Assistance — state-mandated municipal welfare program; also GA Coordinator position' },
  { term: 'GASB', def: 'Governmental Accounting Standards Board — sets GAAP standards for state and local governments' },
  { term: 'GF', def: 'General Fund — the Town\'s primary operating fund, financed by property taxes and other revenues' },
  { term: 'GL', def: 'General Ledger — the master record of all financial transactions' },
  { term: 'HRIS', def: 'Human Resources Information System — HR and benefits management software' },
  { term: 'ICMA', def: 'International City/County Management Association — professional body for local government managers; also administers the 403(b) retirement plan used for some Town positions' },
  { term: 'MMA', def: 'Maine Municipal Association — state association providing training, legal, and policy resources to municipalities' },
  { term: 'MEFIRS', def: 'Maine Emergency Medical Services Incident Reporting System — state EMS run-reporting database; EMS billing software must integrate with it' },
  { term: 'NAEMSE', def: 'National Association of EMS Educators — provides billing and coding training for EMS billing specialists' },
  { term: 'PERS', def: 'Public Employees Retirement System — Maine PERS; the state retirement plan for municipal employees' },
  { term: 'PCR', def: 'Patient Care Report — the EMS run record; source document for billing' },
  { term: 'RC', def: 'Revenue Coordinator — trigger-based hire in Year 3 to manage regional services relationships' },
  { term: 'RFP', def: 'Request for Proposals — procurement document used to solicit competitive bids for the ERP system' },
  { term: 'SA', def: 'Staff Accountant — the primary proposed Phase 1 hire; takes over AP, payroll, reconciliation, and grant reporting from the FD' },
  { term: 'SOC', def: 'Standard Occupational Classification — BLS code system for occupational wage benchmarking' },
  { term: 'TM', def: 'Town Manager — chief executive officer of the Town of Machias' },
  { term: 'TS', def: 'Transfer Station — the Town\'s solid waste enterprise fund' },
  { term: 'TRIO', def: 'The Town\'s current legacy municipal financial software platform' },
  { term: 'USDA', def: 'U.S. Department of Agriculture — administers Rural Development grants relevant to Washington County municipalities' },
];

function GlossaryPanel() {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <button className="w-full flex items-center justify-between px-5 py-4 text-left" onClick={() => setOpen(!open)}>
        <div className="flex items-center gap-2">
          <BookMarked className="h-4 w-4 text-slate-500" />
          <span className="text-sm font-semibold text-slate-900">Acronym Glossary</span>
          <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{GLOSSARY.length} terms</span>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
      </button>
      {open && (
        <div className="border-t border-slate-100 px-5 pb-5 pt-3">
          <p className="text-xs text-slate-500 mb-3">Acronyms used throughout the plan, listed alphabetically. First use in each major section is spelled out in full.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5">
            {GLOSSARY.sort((a, b) => a.term.localeCompare(b.term)).map(({ term, def }) => (
              <div key={term} className="flex gap-2 text-xs">
                <span className="font-bold text-slate-800 w-16 flex-shrink-0">{term}</span>
                <span className="text-slate-600">{def}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const fmt = (n) => n == null ? '—' : `$${Math.abs(Math.round(n)).toLocaleString()}`;
const fmtK = (n) => `$${Math.round(Math.abs(n) / 1000)}K`;

function QItem({ q, a, tags }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`rounded-xl border transition-all ${open ? 'border-slate-300 bg-white shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
      <button className="w-full text-left px-5 py-4 flex items-start justify-between gap-3" onClick={() => setOpen(!open)}>
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-900">{q}</p>
          {tags && (
            <div className="flex gap-1.5 mt-1.5 flex-wrap">
              {tags.map((t, i) => <span key={i} className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{t}</span>)}
            </div>
          )}
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-slate-400 flex-shrink-0 mt-0.5" /> : <ChevronDown className="h-4 w-4 text-slate-400 flex-shrink-0 mt-0.5" />}
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-slate-100">
          <div className="text-sm text-slate-700 leading-relaxed space-y-2 pt-3">{a}</div>
        </div>
      )}
    </div>
  );
}

export default function QandA() {
  const { settings } = useModel();
  const data = runProFormaFromSettings(settings);
  const d1 = data[0];
  const [filter, setFilter] = useState('all');
  const healthAnnual = settings.health_tier === 'individual' ? settings.health_individual_annual : settings.health_family_annual;
  const bsFL = Math.round(settings.bs_base_salary * (1 + settings.fica_rate + settings.pers_rate + settings.wc_rate) + healthAnnual);

  const CATEGORIES = ['all', 'Financial', 'Staffing', 'EMS Billing', 'Regional Services', 'ERP', 'Risks', 'Process', 'Political'];

  const QAS = [
    {
      cat: 'Financial',
      q: 'Does this require a tax increase?',
      tags: ['Finance', 'Key Question'],
      a: (<>
        <p>Under the base case model settings, <strong>no tax increase is required</strong>. The restructuring is designed to be levy-neutral from Year 1.</p>
        <p>The key math: GF-funded position costs ({fmt(d1.gf.gfFundedCosts)}) are offset by GF cash inflows — regional contracts, avoided Comstar fees, eliminated stipends, and enterprise overhead transfers ({fmt(d1.gf.gfCashOffsets)}). The net GF levy impact is {d1.gf.gfNetLevyImpact <= 0 ? `a surplus of ${fmt(Math.abs(d1.gf.gfNetLevyImpact))}` : fmt(d1.gf.gfNetLevyImpact)} in Year 1.</p>
        <p>Note: the Billing Specialist is funded by the Ambulance Fund — it never touches the General Fund levy calculation.</p>
        <p className="text-slate-500 text-xs">→ Adjust assumptions in Model Settings to see how changes affect levy neutrality.</p>
      </>),
    },
    {
      cat: 'Financial',
      q: 'What is the most conservative case — worst realistic outcome?',
      tags: ['Finance', 'Risk'],
      a: (<>
        <p>The most conservative case is "structural only" — no regional services, no Transfer Station expansion, no external EMS billing, Comstar fees avoided but no collection improvement. Even in this scenario:</p>
        <ul className="list-disc pl-4 space-y-1 text-xs">
          <li>Comstar fee avoided: {fmt(d1.value.comstarAvoided)}/yr (growing)</li>
          <li>Stipend elimination: {fmt(settings.stipend_elimination)}/yr</li>
          <li>FD/TM capacity recovered: {fmt(d1.value.fdCapacity + d1.value.tmCapacity)}/yr</li>
          <li>Enterprise overhead (pre-existing): {fmt(d1.value.enterpriseOverhead)}/yr</li>
        </ul>
        <p>Total structural value in Year 1: ~{fmt(d1.value.structuralTotal)}. Against costs of {fmt(d1.costs.total)}. The restructuring is value-positive even in a zero-regional-services scenario because the Comstar fee + stipend savings + capacity value exceeds the cost of the SA position.</p>
      </>),
    },
    {
      cat: 'Financial',
      q: 'How do you value the FD and TM time savings? Isn\'t that a soft number?',
      tags: ['Finance', 'Methodology'],
      a: (<>
        <p>Yes — it is the softest component. Here's the methodology: the Finance Director's fully loaded cost is {fmt(settings.fd_loaded_cost)}/year, implying a cost-of-compensation rate of approximately ${Math.round(settings.fd_loaded_cost / 2080)}/hour. 45% of FD time redirected = ${Math.round(settings.fd_loaded_cost * 0.45)}/year in FD capacity.</p>
        <p>This is a <strong>floor value</strong>, not a ceiling. The opportunity value of that time — grants written, capital projects managed, economic development activities pursued — is likely multiples higher. A single successful USDA Rural Development grant could return $100K+ on $5K of FD time.</p>
        <p>For conservative analysis, the Dashboard shows "5-Yr Cash Net" which <strong>excludes all capacity value</strong>. Use that figure for budget planning. The capacity value is a bonus.</p>
      </>),
    },
    {
      cat: 'Staffing',
      q: 'Can Machias recruit a qualified Staff Accountant at $65,000?',
      tags: ['Staffing', 'Salary'],
      a: (<>
        <p>Yes — this is at or slightly above market for Washington County. Benchmarks:</p>
        <ul className="list-disc pl-4 space-y-1 text-xs">
          <li>BLS SOC 13-2011 Maine median: ~$58K; entry-level: $45–55K</li>
          <li>MMA wage survey: Municipal accountants in rural Maine: $52–68K</li>
          <li>Washington County premium: 0–5% above BLS Maine rural median</li>
        </ul>
        <p>At {fmt(settings.sa_base_salary)}, Machias is competitive for a 2–5 year experience candidate with some government accounting background. The fully loaded package ({fmt(Math.round(settings.sa_base_salary * (1 + settings.fica_rate + settings.pers_rate + settings.wc_rate) + settings.health_family_annual))}, including Maine PERS) is strong relative to private sector alternatives in the region.</p>
        <p>Risk mitigation: the Part-Time Y1 model (toggle in Model Settings) provides a fallback if the full-time search takes longer than anticipated.</p>
      </>),
    },
    {
      cat: 'Staffing',
      q: 'What happens if the Staff Accountant leaves after 1-2 years?',
      tags: ['Staffing', 'Risk'],
      a: (<>
        <p>Turnover risk is real in any small-town finance department. Mitigations:</p>
        <ul className="list-disc pl-4 space-y-1 text-xs">
          <li>Document all processes from Day 1 — the SA's first task is building a procedures manual</li>
          <li>Maine PERS vesting schedule creates a 3-year retention incentive</li>
          <li>The ERP (when implemented) reduces key-person risk by documenting workflows in the system</li>
          <li>Regional services relationships provide professional development opportunities that increase retention</li>
          <li>Consider a succession clause in the interlocal agreements: Machias can temporarily reduce client services during transition</li>
        </ul>
        <p>The alternative — keeping all these tasks with the FD — guarantees this problem indefinitely, with a much higher cost-per-task rate.</p>
      </>),
    },
    {
      cat: 'Staffing',
      q: 'Why is the Billing Specialist hired in Month 7, not Month 1?',
      tags: ['Staffing', 'EMS'],
      a: (<>
        <p>The sequence matters. The Billing Specialist cannot operate effectively without:</p>
        <ol className="list-decimal pl-4 space-y-1 text-xs">
          <li>A functional in-house billing operation to hand off to (documentation, systems, processes)</li>
          <li>A Staff Accountant in place to provide accounting support and second-review</li>
          <li>A parallel run period to verify in-house collection rates before cutting Comstar</li>
        </ol>
        <p>Hiring the BS in Month 1 without these foundations would likely result in a messy Comstar transition and lower collection rates in Year 1. Month 7 allows for a clean 3-month parallel run (M7–M9) and a confident cutover in Month 10, while still capturing 6 months of avoided Comstar fees in Year 1.</p>
      </>),
    },
    {
      cat: 'EMS Billing',
      q: 'What if the in-house collection rate doesn\'t reach 90%?',
      tags: ['EMS', 'Risk'],
      a: (<>
        <p>The model uses {(settings.inhouse_steady_rate * 100).toFixed(0)}% steady-state. The Comstar fee avoided ({fmt(d1.value.comstarAvoided)}/yr) covers a significant portion of the Billing Specialist's all-in cost ({fmt(bsFL)}/yr), and even modest collection improvement closes the rest. The collection rate improvement is upside, but not much upside is needed.</p>
        <p>Sensitivity: the Comstar fee avoided ({fmt(d1.value.comstarAvoided)}/yr) covers a significant portion of the BS all-in cost ({fmt(bsFL)}/yr). Even modest collection improvement — well below the 90% target — closes the remaining gap. The position does not need to hit steady-state collection rates to justify itself.</p>
        <p>It's also important to note that the Billing Specialist's value extends well beyond EMS. This position will also handle: airport tie-down and hangar ground lease billing, fire department billing, rental property billing (e.g., Town-owned properties), and any other accounts receivable outside of tax billing and counter transactions at the Town Office or Transfer Station. That breadth of responsibility makes the position's value significantly higher than the EMS line alone.</p>
        <p>Best practice: structure a 90-day performance review with explicit collection rate targets. If rates lag, add denial management training through NAEMSE or a short consulting engagement before the Comstar contract fully terminates. Also ensure that billing software selection includes evaluation of insurance connectivity and MEFIRS integration before committing.</p>
      </>),
    },
    {
      cat: 'EMS Billing',
      q: 'Is there any risk that Comstar refuses to cooperate with the transition?',
      tags: ['EMS', 'Legal'],
      a: (<>
        <p>Minimal risk, but worth managing. Key points:</p>
        <ul className="list-disc pl-4 space-y-1 text-xs">
          <li>Review the Comstar contract for notice periods (typically 30–90 days), auto-renewal clauses, and data export rights</li>
          <li>Maine law generally provides for data portability — Comstar cannot hold your billing data hostage</li>
          <li>A "data export and migration support" clause should be in the transition agreement</li>
          <li>Comstar will likely prefer a clean professional transition to an acrimonious one — they have other Maine municipal clients</li>
        </ul>
        <p>Begin discussions with Comstar during the parallel run period. Frame it as "evaluating billing operations" rather than announcing a transition until the decision is final.</p>
      </>),
    },
    {
      cat: 'Regional Services',
      q: 'What happens if Roque Bluffs or Machiasport backs out?',
      tags: ['Regional', 'Risk'],
      a: (<>
        <p>Year 1 partial-year revenue from Roque Bluffs and Machiasport is {fmt(Math.round(settings.rb_annual_contract * 4/12) + Math.round(settings.machiasport_annual_contract * 4/12))} combined. Losing both in Year 1 would reduce Year 1 GF cash offsets by this amount.</p>
        <p>Under the base case, the plan remains levy-neutral even without these contracts because the Comstar fee savings, stipend elimination, and enterprise overhead are more than sufficient. The regional contracts are the "growth" component, not the "survival" component.</p>
        <p>Mitigation: begin interlocal agreement drafting concurrently with SA recruitment. Signed contracts before the SA is hired create a binding commitment. Include 90-day notice and a minimum 2-year term to provide revenue stability.</p>
      </>),
    },
    {
      cat: 'Regional Services',
      q: 'How do you prevent Machias from subsidizing neighboring towns?',
      tags: ['Regional', 'Finance'],
      a: (<>
        <p>The pricing model is built on fully loaded cost recovery + 25% overhead. At Tier 1 rates (~{fmt(Math.round(settings.sa_base_salary * (1 + settings.fica_rate + settings.pers_rate + settings.wc_rate) + settings.health_family_annual) / 2080 * 10 * 12 * 1.25)}/yr), Machias recoups all direct SA time, benefits, and administrative overhead before counting any margin.</p>
        <p>If contracts are priced below the model rate (as they currently are for most towns), Machias is effectively subsidizing those towns. The Pricing Model tab in Regional Services shows the gap between model prices and current contract values — this should inform the Year 2 renegotiation discussion.</p>
        <p>Long-term: as the Revenue Coordinator is hired and takes ownership of these relationships, they can re-price contracts annually based on actual hours and costs, ensuring full cost recovery.</p>
      </>),
    },
    {
      cat: 'ERP',
      q: 'Can ERP implementation begin without a Staff Accountant?',
      tags: ['ERP', 'Sequencing'],
      a: (<>
        <p>Yes — ERP can move forward without a Staff Accountant, but there will be a delay in operational task completion. Here's why the SA accelerates the timeline:</p>
        <ol className="list-decimal pl-4 space-y-1 text-xs">
          <li><strong>COA gap analysis</strong> — the Chart of Accounts needs to be rebuilt to Maine AOS standards before data migration. This requires further accounting work before the vendor implementation team begins.</li>
          <li><strong>Requirements definition</strong> — the SA will be the primary ERP user and should participate in the RFP and selection process to ensure the system meets day-to-day operational needs.</li>
          <li><strong>Implementation management</strong> — the SA manages the implementation project day-to-day, reducing the burden on the Finance Director.</li>
        </ol>
        <p>In the interim, the Town may need to purchase the Accounts Receivable module from TRIO to get the books accurate — estimated $3,000–$5,000. Also note: a review of EMS billing software for insurance connections and MEFIRS integration is needed before committing to any in-house billing platform.</p>
        <p>The {settings.erp_y1_cost - settings.erp_designated_fund_offset > 0 ? `net ${fmt(settings.erp_y1_cost - settings.erp_designated_fund_offset)} GF cost` : 'ERP implementation cost'} is also appropriate to phase after levy neutrality is established in Year 1.</p>
      </>),
    },
    {
      cat: 'ERP',
      q: 'Should Machias use an integrated suite or best-of-breed point solutions?',
      tags: ['ERP', 'Technology'],
      a: (<>
        <p>A single integrated solution is best <em>if</em> it is a fully functional system that delivers the needed capabilities. One vendor, one training environment, one support relationship, and automated GL posting between modules all reduce administrative burden significantly.</p>
        <p>However, if the integrated suite doesn't deliver the functionality needed — particularly around EMS billing connections to insurance companies, MEFIRS integration, or multi-entity reporting — then a best-of-breed point solution approach is the better path forward for those specific functions.</p>
        <ul className="list-disc pl-4 space-y-1 text-xs">
          <li>Evaluate integrated suites first: Tyler, Edmunds, OpenGov, Black Mountain</li>
          <li>Score against the specific criteria that matter for Machias (see ERP Evaluation criteria)</li>
          <li>If gaps exist in critical areas, identify best-of-breed point solutions for those gaps</li>
          <li>Do not sacrifice a must-have for the sake of keeping everything under one vendor</li>
        </ul>
      </>),
    },
    {
      cat: 'Risks',
      q: 'What is the biggest single risk to this entire plan?',
      tags: ['Risk', 'Critical Path'],
      a: (<>
        <p>The biggest risk is failing to hire a qualified Staff Accountant in a reasonable timeframe. Every other initiative depends on this position:</p>
        <ul className="list-disc pl-4 space-y-1 text-xs">
          <li>ERP: can move forward, but there will be a delay in operational task completion</li>
          <li>Regional services: can begin but will take longer to scale without SA support</li>
          <li>Comstar transition: BS benefits from SA for accounting support and second-review</li>
          <li>Transfer Station: cost accounting work is more difficult without SA capacity</li>
          <li>GA Coordinator: relatively independent — primarily relieves TM time directly, regardless of SA hire</li>
        </ul>
        <p>Mitigation options: (1) use the part-time Y1 model as a bridge; (2) engage a temporary staffing agency for a contract accountant while the permanent search continues; (3) consider a remote part-time arrangement with a Maine CPA firm for the first 6 months.</p>
      </>),
    },
    {
      cat: 'Process',
      q: 'What does the Select Board need to vote on and when?',
      tags: ['Process', 'Governance'],
      a: (<>
        <p>Required Select Board actions, in sequence:</p>
        <ol className="list-decimal pl-4 space-y-1 text-xs">
          <li><strong>Immediate:</strong> Authorize recruitment of Staff Accountant (position creation + salary range)</li>
          <li><strong>Month 1–2:</strong> Authorize stipend elimination upon SA hire (notify Deputy and Clerk)</li>
          <li><strong>Month 3–6:</strong> Authorize interlocal agreement negotiations with Roque Bluffs and Machiasport</li>
          <li><strong>Month 6–9:</strong> Approve and sign interlocal agreements (both parties must vote)</li>
          <li><strong>Month 7:</strong> Authorize Billing Specialist position + Comstar transition timeline</li>
          <li><strong>Town Meeting:</strong> Appropriate ERP implementation budget ($47K, with $24K offset)</li>
          <li><strong>Year 3:</strong> Revenue Coordinator hire (if trigger met)</li>
        </ol>
        <p>The Town Manager and Finance Director should provide monthly updates to the Board on progress against each trigger.</p>
      </>),
    },
    {
      cat: 'Risks',
      q: 'What if the Town Clerk or Deputy Town Clerk leaves when stipends are removed?',
      tags: ['Risk', 'Staffing', 'Retention'],
      a: (<>
        <p>This is a real and specific retention risk that must be planned for proactively. The Town Clerk and Deputy Town Clerk currently receive stipends totaling approximately {fmt(settings.stipend_elimination)} that are proposed for elimination as part of the restructuring. Removing that compensation without a replacement value proposition creates meaningful turnover risk — both positions carry institutional knowledge that is difficult and expensive to replace.</p>
        <p><strong>Likely response scenarios:</strong></p>
        <ul className="list-disc pl-4 space-y-1 text-xs">
          <li><strong>Retention if workload decreases:</strong> If the Staff Accountant absorbs meaningful clerical financial tasks from the Town Clerk (AP support, payroll entry, grant tracking), the net effect may be a reduced workload that partially offsets the stipend loss — but this must be communicated clearly and collaboratively, not assumed.</li>
          <li><strong>Partial replacement:</strong> The Select Board could offer a modest base salary adjustment ($3,000–$6,000/yr) to retain either or both positions, which would still be a net savings vs. the full stipend cost and would preserve institutional knowledge.</li>
          <li><strong>Departure and replacement cost:</strong> Replacing an experienced Town Clerk or Deputy in Washington County carries a realistic recruitment cost (advertising, screening, onboarding) of $8,000–$15,000 plus 3–6 months of reduced productivity during transition — which could exceed the annual stipend value. This risk should factor into the Board's timing and communication strategy around stipend elimination.</li>
        </ul>
        <p><strong>Recommended mitigation:</strong> Before any Board vote on stipend elimination, the Town Manager should hold individual conversations with the Clerk and Deputy to gauge their response, understand what matters to them, and identify whether a partial offset (title change, step increase, or formal role expansion with additional duties) would achieve retention. Stipend elimination should not be announced publicly before those conversations occur.</p>
        <p className="text-xs text-slate-500">→ If either position is at high departure risk, the part-time Y1 model becomes even more important — the SA absorbs workload before stipends are removed, reducing the net impact on the Clerk and Deputy.</p>
      </>),
    },
    {
      cat: 'Political',
      q: 'How do you present this to skeptical taxpayers?',
      tags: ['Political', 'Communication'],
      a: (<>
        <p>Key framing for public communication:</p>
        <ul className="list-disc pl-4 space-y-1 text-xs">
          <li><strong>"We're already paying for this."</strong> The Finance Director is spending 45% of their time on tasks that cost $86K/year to perform. A Staff Accountant costs $108K fully loaded but can do 3x the work at the appropriate level.</li>
          <li><strong>"No tax increase."</strong> The numbers are designed so that new revenue covers all new costs. This is not a request for more money — it's a reallocation of what we already spend.</li>
          <li><strong>"Our neighbors want to pay us."</strong> Roque Bluffs and Machiasport have asked for this service. We're leaving money on the table.</li>
          <li><strong>"The auditors told us to fix this."</strong> The separation-of-duties finding is not optional — it represents real risk to taxpayers.</li>
        </ul>
        <p>See the Communication Strategy section for a full stakeholder messaging plan.</p>
      </>),
    },
  ];

  const filtered = filter === 'all' ? QAS : QAS.filter(q => q.cat === filter);

  return (
    <div className="space-y-8">
      <SectionHeader title="Questions & Answers" subtitle="Anticipated questions from Select Board, Budget Committee, Town Meeting, and taxpayers" icon={MessageSquare} />

      <GlossaryPanel />

      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setFilter(cat)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${filter === cat ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            {cat} {cat === 'all' ? `(${QAS.length})` : `(${QAS.filter(q => q.cat === cat).length})`}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map((item, i) => (
          <QItem key={i} q={item.q} a={item.a} tags={item.tags} />
        ))}
      </div>
    </div>
  );
}