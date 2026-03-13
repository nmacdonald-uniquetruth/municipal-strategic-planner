import React, { useMemo, useState } from 'react';
import { useModel } from '../components/machias/ModelContext';
import { runProFormaFromSettings } from '../components/machias/FinancialModelV2';
import SectionHeader from '../components/machias/SectionHeader';
import { Target, AlertTriangle, CheckCircle2, TrendingUp, DollarSign, Users, Building2, Scale, ExternalLink } from 'lucide-react';

const fmt = (n) => n == null ? '—' : `$${Math.abs(Math.round(n)).toLocaleString()}`;
const pct = (n) => `${(n * 100).toFixed(1)}%`;

// ── Town Financial Profiles (from Maine Revenue Services 2024 MVR & Washington County Tax Data) ──
const TOWN_PROFILES = [
  {
    name: 'Roque Bluffs',
    population: 306,
    stateValuation: 121550000,
    municipalValuation: 73121453,
    millRate: 11.75,
    taxCommitment: 859177,
    countyTax: 209575,
    auditFirm: 'James W. Wadman, CPA',
    auditCost_est: 6500,
    adminStaffing: 'Part-time Town Clerk, elected Treasurer (stipend), no finance staff',
    fiscalYear: 'December',
    hasEnterpriseFunds: false,
    currentFinancialMgmt: 'Treasurer stipend (~$3,000–$5,000/yr); bookkeeper contract (~$5,000–$8,000/yr estimated)',
    knownIssues: 'Very small operation; single-person financial processing creates separation-of-duties risk identical to Machias pattern. Audit findings typical for towns of this size.',
    confirmationStatus: 'Confirmed interest — active conversations',
    sourceNote: 'Maine Revenue Services 2024 MVR; Washington County 2024 Tax by Town; US Census 2023',
  },
  {
    name: 'Machiasport',
    population: 1250,
    stateValuation: 189000000,
    municipalValuation: 148642703,
    millRate: 15.30,
    taxCommitment: 1932355,
    countyTax: 325871,
    auditFirm: 'James W. Wadman, CPA',
    auditCost_est: 9000,
    adminStaffing: 'Admin Asst/Town Clerk ($43K), Deputy Town Clerk ($31.6K), stipend Treasurer ($5.5K), stipend Selectpersons/Assessors ($12K total)',
    fiscalYear: 'June',
    hasEnterpriseFunds: false,
    currentFinancialMgmt: 'Stipend-based Treasurer ($5,459); no professional finance staff; Admin Asst handles most financial processing; audit/accounting contracted out (~$5,000–$9,000/yr)',
    knownIssues: 'School budget ($1.56M) represents significant complexity. Town meeting minutes show increasing budget pressures. Legal fees budgeted at $15,000 (3× prior year) — signals governance complexity.',
    confirmationStatus: 'Confirmed interest',
    sourceNote: 'Maine Revenue Services 2024 MVR; Machiasport 2022 Town Meeting Minutes; Machiasport.org mill rate page',
  },
  {
    name: 'Marshfield',
    population: 450,
    stateValuation: 47500000,
    municipalValuation: 35000000,  // estimated at ~74% ratio
    millRate: 14.0,  // estimated
    taxCommitment: 490000,  // estimated
    countyTax: 81899,
    auditFirm: 'Unknown — likely James W. Wadman, CPA',
    auditCost_est: 5500,
    adminStaffing: 'Part-time Town Clerk, elected Treasurer (stipend), no finance staff',
    fiscalYear: 'June (est.)',
    hasEnterpriseFunds: false,
    currentFinancialMgmt: 'Stipend-based Treasurer; minimal professional financial oversight; audit contracted out (~$4,000–$6,000/yr)',
    knownIssues: 'Very small municipal operation. Limited assessed value base ($47.5M state valuation). Budget constraints are severe — any service contract must clearly demonstrate value vs. cost.',
    confirmationStatus: 'Prospective — Year 2 target',
    sourceNote: 'Washington County 2024 Tax by Town; US Census 2023 est.; municipal valuation and mill rate estimated',
  },
  {
    name: 'Whitneyville',
    population: 160,
    stateValuation: 16850000,
    municipalValuation: 12682760,
    millRate: 24.00,
    taxCommitment: 304386,
    countyTax: 29053,
    auditFirm: 'Unknown',
    auditCost_est: 4500,
    adminStaffing: 'Part-time Town Clerk, elected Treasurer (stipend), minimal staff',
    fiscalYear: 'Unknown',
    hasEnterpriseFunds: false,
    currentFinancialMgmt: 'Stipend-based; likely under $5,000/yr total financial management cost',
    knownIssues: 'Smallest municipality in the target group. Extremely high mill rate (24.0 mills — highest in Washington County target towns) signals very limited tax base and high per-capita tax burden. Any new expenditure faces intense taxpayer scrutiny.',
    confirmationStatus: 'Prospective — Year 3 target',
    sourceNote: 'Maine Revenue Services 2024 MVR; Washington County 2024 Tax by Town; US Census 2023',
  },
  {
    name: 'Northfield',
    population: 150,
    stateValuation: 62700000,
    municipalValuation: 50000000,  // estimated
    millRate: 7.70,
    taxCommitment: 385000,  // estimated from prior year data
    countyTax: 108106,
    auditFirm: 'Unknown',
    auditCost_est: 4500,
    adminStaffing: 'Part-time Town Clerk, elected Treasurer (stipend), tax collector stipend',
    fiscalYear: 'June',
    hasEnterpriseFunds: false,
    currentFinancialMgmt: 'Stipend-based. Uses same assessor as Machias (Doug Guy). Mill rate dropped from $10.80 to $7.70 — suggests revaluation or reduced budget.',
    knownIssues: 'Surprising state valuation ($62.7M) relative to population (150) — likely driven by large land parcels, waterfront, or resource properties. Low mill rate (7.70) indicates relatively low municipal spending per dollar of valuation, but population is tiny.',
    confirmationStatus: 'Prospective — Year 3 target',
    sourceNote: 'Northfield ME town website; Washington County 2024 Tax by Town; US Census 2023',
  },
];

function Badge({ color, children }) {
  const colors = {
    green: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    yellow: 'bg-amber-100 text-amber-800 border-amber-200',
    red: 'bg-red-100 text-red-800 border-red-200',
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
    gray: 'bg-slate-100 text-slate-700 border-slate-200',
  };
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${colors[color]}`}>{children}</span>;
}

function TownCard({ town, contractAmount, settings }) {
  const [expanded, setExpanded] = useState(false);
  
  // Financial analysis
  const contractAsPercentOfCommitment = contractAmount / town.taxCommitment * 100;
  const contractAsPercentOfCountyTax = contractAmount / town.countyTax * 100;
  const perCapitaCost = contractAmount / town.population;
  const currentEstFinanceCost = town.auditCost_est + (town.currentFinancialMgmt.includes('$5,000') ? 7500 : 5000);
  const netNewCost = contractAmount - currentEstFinanceCost * 0.3; // assume 30% of current costs could be reduced
  
  // Affordability assessment
  let affordabilityRating, affordabilityColor, affordabilityNote;
  if (contractAsPercentOfCommitment < 2.5) {
    affordabilityRating = 'AFFORDABLE';
    affordabilityColor = 'green';
    affordabilityNote = `At ${contractAsPercentOfCommitment.toFixed(1)}% of total tax commitment, this is within typical municipal service contract ranges.`;
  } else if (contractAsPercentOfCommitment < 5.0) {
    affordabilityRating = 'MODERATE';
    affordabilityColor = 'yellow';
    affordabilityNote = `At ${contractAsPercentOfCommitment.toFixed(1)}% of total tax commitment, this is a meaningful but justifiable expenditure — comparable to their county tax share.`;
  } else {
    affordabilityRating = 'HIGH BURDEN';
    affordabilityColor = 'red';
    affordabilityNote = `At ${contractAsPercentOfCommitment.toFixed(1)}% of total tax commitment, this represents a significant budget line item. Consider adjusting the contract amount downward.`;
  }

  // Value proposition
  const valueItems = [
    'Professional monthly reconciliation (eliminates separation-of-duties risk)',
    'Budget preparation support (currently done by elected/stipend officials)',
    'Grant financial reporting (access to Machias FD expertise)',
    'Audit preparation support (can reduce audit costs and findings)',
    'Access to ERP platform reporting (when implemented)',
  ];

  // Recommendation
  let recommendation, recColor;
  if (contractAsPercentOfCommitment > 4.0) {
    recommendation = `Consider reducing the proposed contract to ${fmt(Math.round(town.taxCommitment * 0.025 / 1000) * 1000)} (≈2.5% of tax commitment) to improve adoption probability. The current ${fmt(contractAmount)} may face resistance at town meeting.`;
    recColor = 'red';
  } else if (contractAsPercentOfCommitment > 3.0 && town.population < 200) {
    recommendation = `The proposed ${fmt(contractAmount)} is reasonable relative to the budget, but for a town of ${town.population} residents, the per-capita cost of ${fmt(perCapitaCost)} may face scrutiny. Consider a tiered entry: Year 1 at ${fmt(Math.round(contractAmount * 0.75 / 500) * 500)}, scaling to ${fmt(contractAmount)} in Year 2 after demonstrating value.`;
    recColor = 'yellow';
  } else {
    recommendation = `The proposed ${fmt(contractAmount)} is well within the affordability range at ${contractAsPercentOfCommitment.toFixed(1)}% of total tax commitment. This amount is justifiable and competitive vs. alternative options.`;
    recColor = 'green';
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 flex-shrink-0">
              <Building2 className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">{town.name}</h3>
              <p className="text-xs text-slate-500">Pop. {town.population.toLocaleString()} · State Val. ${(town.stateValuation / 1000000).toFixed(1)}M · Mill Rate {town.millRate}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge color={affordabilityColor}>{affordabilityRating}</Badge>
            <Badge color={town.confirmationStatus.includes('Confirmed') ? 'green' : 'gray'}>
              {town.confirmationStatus.includes('Confirmed') ? 'CONFIRMED' : 'PROSPECTIVE'}
            </Badge>
            <span className="text-slate-400 text-sm">{expanded ? '▲' : '▼'}</span>
          </div>
        </div>
        
        {/* Summary row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-3">
          <div className="bg-slate-50 rounded-lg px-3 py-2">
            <p className="text-[10px] text-slate-500 uppercase">Proposed Contract</p>
            <p className="text-sm font-bold text-slate-900">{fmt(contractAmount)}/yr</p>
          </div>
          <div className="bg-slate-50 rounded-lg px-3 py-2">
            <p className="text-[10px] text-slate-500 uppercase">% of Tax Commitment</p>
            <p className="text-sm font-bold text-slate-900">{contractAsPercentOfCommitment.toFixed(1)}%</p>
          </div>
          <div className="bg-slate-50 rounded-lg px-3 py-2">
            <p className="text-[10px] text-slate-500 uppercase">Per Capita Cost</p>
            <p className="text-sm font-bold text-slate-900">{fmt(perCapitaCost)}/resident</p>
          </div>
          <div className="bg-slate-50 rounded-lg px-3 py-2">
            <p className="text-[10px] text-slate-500 uppercase">Tax Commitment</p>
            <p className="text-sm font-bold text-slate-900">{fmt(town.taxCommitment)}</p>
          </div>
          <div className="bg-slate-50 rounded-lg px-3 py-2">
            <p className="text-[10px] text-slate-500 uppercase">County Tax</p>
            <p className="text-sm font-bold text-slate-900">{fmt(town.countyTax)}</p>
          </div>
        </div>
      </div>
      
      {/* Expanded detail */}
      {expanded && (
        <div className="p-4 space-y-4 border-t border-slate-100 bg-slate-50/30">
          {/* Current Admin Situation */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Current Administrative Situation</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <p className="font-semibold text-slate-700 mb-1">Staffing</p>
                <p className="text-slate-600">{town.adminStaffing}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <p className="font-semibold text-slate-700 mb-1">Current Financial Management</p>
                <p className="text-slate-600">{town.currentFinancialMgmt}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <p className="font-semibold text-slate-700 mb-1">Audit Firm</p>
                <p className="text-slate-600">{town.auditFirm} (est. {fmt(town.auditCost_est)}/yr)</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <p className="font-semibold text-slate-700 mb-1">Known Issues</p>
                <p className="text-slate-600">{town.knownIssues}</p>
              </div>
            </div>
          </div>

          {/* Affordability Analysis */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Affordability Analysis</h4>
            <div className={`rounded-xl border-l-4 px-4 py-3 text-xs leading-relaxed ${
              affordabilityColor === 'green' ? 'bg-emerald-50 border-emerald-400 text-emerald-900' :
              affordabilityColor === 'yellow' ? 'bg-amber-50 border-amber-400 text-amber-900' :
              'bg-red-50 border-red-400 text-red-900'
            }`}>
              <p className="font-bold mb-1">{affordabilityNote}</p>
              <div className="mt-2 space-y-1 text-slate-700">
                <p>• Contract as % of total tax commitment: <strong>{contractAsPercentOfCommitment.toFixed(2)}%</strong></p>
                <p>• Contract as % of county tax: <strong>{contractAsPercentOfCountyTax.toFixed(1)}%</strong></p>
                <p>• Per capita cost: <strong>{fmt(perCapitaCost)}</strong>/resident/year ({fmt(Math.round(perCapitaCost / 12))}/resident/month)</p>
                <p>• Estimated current financial mgmt cost: <strong>{fmt(currentEstFinanceCost)}</strong>/yr (audit + bookkeeping)</p>
                <p>• Net incremental cost (after reducing current contracted work): ~<strong>{fmt(Math.max(0, netNewCost))}</strong>/yr</p>
              </div>
            </div>
          </div>
          
          {/* Value Proposition */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">What {town.name} Gets for {fmt(contractAmount)}/yr</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {valueItems.map((item, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-slate-700 rounded-lg border border-slate-200 bg-white px-3 py-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendation */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Recommendation</h4>
            <div className={`rounded-xl border-l-4 px-4 py-3 text-xs leading-relaxed ${
              recColor === 'green' ? 'bg-emerald-50 border-emerald-400 text-emerald-900' :
              recColor === 'yellow' ? 'bg-amber-50 border-amber-400 text-amber-900' :
              'bg-red-50 border-red-400 text-red-900'
            }`}>
              {recommendation}
            </div>
          </div>

          {/* Data source */}
          <p className="text-[10px] text-slate-400 italic">{town.sourceNote}</p>
        </div>
      )}
    </div>
  );
}


export default function RegionalFeasibility() {
  const { settings } = useModel();
  const data = useMemo(() => runProFormaFromSettings(settings), [settings]);
  const s = settings;

  const contracts = [
    { town: 'Roque Bluffs', amount: s.rb_annual_contract },
    { town: 'Machiasport', amount: s.machiasport_annual_contract },
    { town: 'Marshfield', amount: s.marshfield_annual_contract },
    { town: 'Whitneyville', amount: s.whitneyville_annual_contract },
    { town: 'Northfield', amount: s.northfield_annual_contract },
  ];

  const totalProposed = contracts.reduce((s, c) => s + c.amount, 0);

  // Probability assessment
  const probabilities = [
    { town: 'Roque Bluffs', prob: 0.80, rationale: 'Confirmed interest, active conversations, shared assessor (Doug Guy), logical geographic and fiscal fit. Very small town with minimal finance capacity — clear unmet need.' },
    { town: 'Machiasport', prob: 0.75, rationale: 'Confirmed interest. Largest target town with meaningful budget ($1.93M commitment). Already paying $77K+ in general admin costs. However, town has existing admin staff — Machias services are supplemental, not replacement. Political dynamics of two adjacent municipalities sharing finance staff need careful navigation.' },
    { town: 'Marshfield', prob: 0.55, rationale: 'Prospective only. No confirmed interest yet. Very small operation ($490K est. commitment). Geographic proximity to Machias is favorable. Limiting factor: this is a Year 2 target — must demonstrate successful Roque Bluffs/Machiasport execution first.' },
    { town: 'Whitneyville', prob: 0.40, rationale: 'Prospective, Year 3 target. Extremely small ($304K commitment) with the highest mill rate (24.0) of any target town — taxpayers are already heavily burdened. Proposed $11K contract is 3.6% of tax commitment, which is high. Recommend reducing to $8K–$9K for adoption feasibility.' },
    { town: 'Northfield', prob: 0.45, rationale: 'Prospective, Year 3 target. Tiny population (150) but surprisingly high state valuation ($62.7M) suggests resource/land-based tax base. Uses same assessor as Machias. Mill rate drop (10.80→7.70) suggests fiscal conservatism. Contract must be priced attractively.' },
  ];

  const expectedValue = probabilities.reduce((sum, p) => {
    const contract = contracts.find(c => c.town === p.town);
    return sum + (contract?.amount || 0) * p.prob;
  }, 0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <SectionHeader
        title="Regional Services Feasibility Analysis"
        subtitle="Audit-based assessment of target municipality financial capacity and contract pricing"
        icon={Scale}
      />

      {/* Source attribution */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900 flex items-start gap-3">
        <ExternalLink className="h-4 w-4 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-bold mb-1">Data Sources</p>
          <p>Financial data sourced from <a href="https://www.maine.gov/revenue/taxes/property-tax/municipal-services/valuation-return-statistical-summary" target="_blank" rel="noopener noreferrer" className="underline">Maine Revenue Services 2024 Municipal Valuation Return</a>, <a href="http://maine.gov/audit/municipal/annual-audit-reports.html" target="_blank" rel="noopener noreferrer" className="underline">Maine Office of the State Auditor Municipal Audit Reports</a>, <a href="https://washingtoncountymaine.com" target="_blank" rel="noopener noreferrer" className="underline">Washington County 2024 Tax by Town</a>, Machiasport 2022 Town Meeting Minutes, and individual town websites. Population figures from US Census 2023 estimates.</p>
        </div>
      </div>

      {/* Summary metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
          <p className="text-2xl font-bold text-slate-900">{fmt(totalProposed)}</p>
          <p className="text-xs text-slate-500">Total Proposed Contracts</p>
          <p className="text-[10px] text-slate-400">All 5 municipalities at steady state</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
          <p className="text-2xl font-bold text-emerald-700">{fmt(Math.round(expectedValue))}</p>
          <p className="text-xs text-slate-500">Probability-Weighted Value</p>
          <p className="text-[10px] text-slate-400">Expected annual revenue</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
          <p className="text-2xl font-bold text-blue-700">5</p>
          <p className="text-xs text-slate-500">Target Municipalities</p>
          <p className="text-[10px] text-slate-400">2 confirmed, 3 prospective</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
          <p className="text-2xl font-bold text-amber-700">{pct(expectedValue / totalProposed)}</p>
          <p className="text-xs text-slate-500">Weighted Capture Rate</p>
          <p className="text-[10px] text-slate-400">Probability × contract value</p>
        </div>
      </div>

      {/* Probability Summary Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="bg-slate-900 text-white px-4 py-3">
          <h3 className="text-sm font-bold">Adoption Probability Assessment</h3>
          <p className="text-[10px] text-slate-400 mt-0.5">Based on confirmed interest, budget capacity, and political feasibility</p>
        </div>
        <div className="divide-y divide-slate-100">
          <div className="grid grid-cols-7 gap-2 px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50">
            <span className="col-span-1">Municipality</span>
            <span>Proposed</span>
            <span>% of Commitment</span>
            <span>Probability</span>
            <span>Expected Value</span>
            <span>Status</span>
            <span>Pricing Verdict</span>
          </div>
          {probabilities.map((p) => {
            const town = TOWN_PROFILES.find(t => t.name === p.town);
            const contract = contracts.find(c => c.town === p.town);
            const pctCommit = (contract.amount / town.taxCommitment * 100);
            const ev = contract.amount * p.prob;
            const isOverpriced = pctCommit > 3.5;
            const isPricedRight = pctCommit < 2.5;
            return (
              <div key={p.town} className="grid grid-cols-7 gap-2 px-4 py-3 text-xs items-center">
                <span className="font-semibold text-slate-900 col-span-1">{p.town}</span>
                <span className="font-mono">{fmt(contract.amount)}</span>
                <span className="font-mono">{pctCommit.toFixed(1)}%</span>
                <span>
                  <span className={`font-bold ${p.prob >= 0.7 ? 'text-emerald-700' : p.prob >= 0.5 ? 'text-amber-700' : 'text-red-700'}`}>
                    {(p.prob * 100).toFixed(0)}%
                  </span>
                </span>
                <span className="font-mono text-emerald-700">{fmt(Math.round(ev))}</span>
                <span>
                  <Badge color={town.confirmationStatus.includes('Confirmed') ? 'green' : 'gray'}>
                    {town.confirmationStatus.includes('Confirmed') ? 'CONFIRMED' : 'PROSPECTIVE'}
                  </Badge>
                </span>
                <span>
                  <Badge color={isOverpriced ? 'red' : isPricedRight ? 'green' : 'yellow'}>
                    {isOverpriced ? 'CONSIDER REDUCING' : isPricedRight ? 'WELL PRICED' : 'ACCEPTABLE'}
                  </Badge>
                </span>
              </div>
            );
          })}
          <div className="grid grid-cols-7 gap-2 px-4 py-3 text-xs items-center bg-slate-100 font-bold">
            <span className="col-span-1">TOTAL</span>
            <span className="font-mono">{fmt(totalProposed)}</span>
            <span>—</span>
            <span className="text-emerald-700">{pct(expectedValue / totalProposed)} wtd</span>
            <span className="font-mono text-emerald-700">{fmt(Math.round(expectedValue))}</span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>

      {/* Individual Town Cards */}
      <div>
        <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Building2 className="h-4 w-4" /> Municipality-by-Municipality Analysis
          <span className="text-xs font-normal text-slate-500">(click to expand)</span>
        </h2>
        <div className="space-y-3">
          {TOWN_PROFILES.map((town) => {
            const contract = contracts.find(c => c.town === town.name);
            return <TownCard key={town.name} town={town} contractAmount={contract?.amount || 0} settings={s} />;
          })}
        </div>
      </div>

      {/* Rationale Detail */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Probability Rationale Detail</h3>
        <div className="space-y-3">
          {probabilities.map((p) => (
            <div key={p.town} className="flex gap-3 text-xs rounded-lg border border-slate-100 p-3">
              <div className="flex-shrink-0">
                <span className={`font-bold text-sm ${p.prob >= 0.7 ? 'text-emerald-700' : p.prob >= 0.5 ? 'text-amber-700' : 'text-red-700'}`}>
                  {(p.prob * 100).toFixed(0)}%
                </span>
              </div>
              <div>
                <p className="font-semibold text-slate-800">{p.town}</p>
                <p className="text-slate-600 mt-0.5 leading-relaxed">{p.rationale}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing Recommendations */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2"><DollarSign className="h-4 w-4" /> Pricing Adjustment Recommendations</h3>
        <div className="space-y-3 text-xs">
          {[
            {
              town: 'Roque Bluffs', current: s.rb_annual_contract, suggested: s.rb_annual_contract,
              verdict: 'Keep as-is.',
              detail: `At 2.2% of tax commitment, ${fmt(s.rb_annual_contract)} is well-priced. For a town with an $859K commitment and no professional finance staff, this is competitive vs. hiring a part-time bookkeeper ($15K–$20K/yr) and gets them access to a full finance department. Per capita cost of ${fmt(Math.round(s.rb_annual_contract / 306))}/resident/year is modest.`
            },
            {
              town: 'Machiasport', current: s.machiasport_annual_contract, suggested: s.machiasport_annual_contract,
              verdict: 'Keep as-is.',
              detail: `At 1.0% of a $1.93M tax commitment, ${fmt(s.machiasport_annual_contract)} is very affordable. Machiasport already spends ~$80K+ on admin salaries/stipends. This contract provides professional oversight that supplements (not replaces) existing staff. Could potentially increase to $22K–$25K given their budget capacity, but the current price is strategically smart — it makes adoption nearly frictionless at town meeting.`
            },
            {
              town: 'Marshfield', current: s.marshfield_annual_contract, suggested: 12000,
              verdict: 'Consider slight reduction to $12K.',
              detail: `At ~3.1% of an estimated $490K commitment, ${fmt(s.marshfield_annual_contract)} is on the high side for a very small town. County tax alone is $82K. A contract priced at $12K (2.4% of commitment) would be more attractive and still represents meaningful revenue for Machias. This is a prospective client — pricing should incentivize early adoption.`
            },
            {
              town: 'Whitneyville', current: s.whitneyville_annual_contract, suggested: 8000,
              verdict: 'Recommend reducing to $8K.',
              detail: `At 3.6% of a $304K commitment, ${fmt(s.whitneyville_annual_contract)} is the highest-burden contract in the portfolio relative to the client's budget. Whitneyville has the highest mill rate (24.0 mills) of any target town — taxpayers are already pressed. A $8K contract (2.6% of commitment) would be more defensible at town meeting. Revenue impact to Machias: -$3K/yr, but adoption probability likely increases from 40% to 55–60%.`
            },
            {
              town: 'Northfield', current: s.northfield_annual_contract, suggested: 10000,
              verdict: 'Consider slight reduction to $10K.',
              detail: `At ~3.1% of an estimated $385K commitment, ${fmt(s.northfield_annual_contract)} is moderate but could be softened. Northfield's declining mill rate (10.80→7.70) signals fiscal conservatism. A $10K entry point (2.6% of commitment) may improve adoption. Shared assessor (Doug Guy) creates a natural connection point.`
            },
          ].map((rec) => (
            <div key={rec.town} className={`rounded-xl border p-4 ${rec.current !== rec.suggested ? 'border-amber-200 bg-amber-50/30' : 'border-emerald-200 bg-emerald-50/30'}`}>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-slate-900">{rec.town}</h4>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-slate-600">{fmt(rec.current)}</span>
                  {rec.current !== rec.suggested && (
                    <>
                      <span className="text-slate-400">→</span>
                      <span className="font-mono font-bold text-amber-700">{fmt(rec.suggested)}</span>
                    </>
                  )}
                  <Badge color={rec.current === rec.suggested ? 'green' : 'yellow'}>{rec.verdict}</Badge>
                </div>
              </div>
              <p className="text-slate-700 leading-relaxed">{rec.detail}</p>
            </div>
          ))}
        </div>

        {/* Adjusted total */}
        <div className="rounded-xl bg-slate-100 p-4 mt-3">
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div className="text-center">
              <p className="text-lg font-bold text-slate-900">{fmt(totalProposed)}</p>
              <p className="text-slate-500">Current Model Total</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-amber-700">{fmt(s.rb_annual_contract + s.machiasport_annual_contract + 12000 + 8000 + 10000)}</p>
              <p className="text-slate-500">Suggested Adjusted Total</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-emerald-700">{fmt(Math.round(
                s.rb_annual_contract * 0.80 + s.machiasport_annual_contract * 0.75 + 12000 * 0.60 + 8000 * 0.55 + 10000 * 0.50
              ))}</p>
              <p className="text-slate-500">Adjusted Expected Value</p>
              <p className="text-[10px] text-slate-400">With improved probabilities</p>
            </div>
          </div>
        </div>
      </div>

      {/* Competitive Landscape */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Competitive Landscape & Alternatives</h3>
        <p className="text-xs text-slate-700">Each target municipality has alternatives to contracting with Machias. Understanding these alternatives frames the value proposition.</p>
        <div className="space-y-2 text-xs">
          {[
            { option: 'Status quo (stipend officials)', cost: '$3K–$8K/yr', quality: 'Low — no professional oversight, audit findings likely', risk: 'High — separation of duties, compliance gaps, grant risk' },
            { option: 'Hire part-time bookkeeper', cost: '$15K–$25K/yr', quality: 'Moderate — depends on individual skill', risk: 'Medium — still single-person operation, no redundancy' },
            { option: 'Contract with CPA firm', cost: '$12K–$20K/yr (monthly)', quality: 'High — professional, but remote and less responsive', risk: 'Low — but limited municipal government expertise' },
            { option: 'Contract with Machias Finance Dept.', cost: '$8K–$20K/yr', quality: 'High — municipal finance professionals, same-region, shared ERP platform', risk: 'Low — proper oversight, separation of duties, audit support' },
            { option: 'Join with another town (not Machias)', cost: 'Unknown', quality: 'Theoretical — no other Washington County town has surplus finance capacity', risk: 'High — no realistic alternative regional hub exists' },
          ].map((alt, i) => (
            <div key={i} className="grid grid-cols-4 gap-3 rounded-lg border border-slate-100 p-3">
              <span className={`font-semibold ${i === 3 ? 'text-emerald-700' : 'text-slate-700'}`}>{alt.option}</span>
              <span className="font-mono text-slate-600">{alt.cost}</span>
              <span className="text-slate-600">{alt.quality}</span>
              <span className="text-slate-600">{alt.risk}</span>
            </div>
          ))}
        </div>
        <div className="rounded-xl border-l-4 border-emerald-400 bg-emerald-50 px-4 py-3 text-xs text-emerald-900">
          <p className="font-bold mb-1">Key Competitive Advantage</p>
          <p>Machias is the only municipality in Washington County with sufficient finance department capacity to offer professional services to neighbors. There is no realistic competitor. The question is not "Machias vs. someone else" — it's "Machias vs. status quo." This monopoly position justifies the proposed pricing, but should be wielded carefully to build long-term trust rather than extract maximum short-term revenue.</p>
        </div>
      </div>

      {/* Audit reference */}
      <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-[10px] text-slate-500 leading-relaxed">
        <p><strong>Audit reports:</strong> All Maine municipal audits are available at <a href="http://maine.gov/audit/municipal/annual-audit-reports.html" target="_blank" rel="noopener noreferrer" className="underline">maine.gov/audit/municipal/annual-audit-reports.html</a>. Audits for Washington County towns are typically performed by James W. Wadman, CPA (Ellsworth). Washington County's own auditor resigned over deadline concerns (March 2025) — highlighting the regional shortage of municipal finance expertise that makes Machias's service offering timely and valuable.</p>
        <p className="mt-1"><strong>Valuation data:</strong> 2024 Municipal Valuation Return Statistical Summary, Maine Revenue Services. County tax allocations from Washington County 2024 Tax by Town commitment schedule.</p>
      </div>
    </div>
  );
}