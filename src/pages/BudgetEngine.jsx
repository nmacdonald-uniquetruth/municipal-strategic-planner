/**
 * BudgetEngine page — Machias Municipal Budget & Tax Commitment Engine
 *
 * Tabs:
 *  1. BETE Form        — full tax commitment calculation + reconciliation
 *  2. Mill Rate What-If — scenario table
 *  3. Worksheet        — line-item department/article budget editor
 *  4. Prior Year       — side-by-side comparison
 *  5. Reconciliation   — cross-check and warnings
 */

import React, { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useModel } from '../components/machias/ModelContext';
import SectionHeader from '../components/machias/SectionHeader';
import BudgetInputsPanel from '../components/budget/BudgetInputsPanel';
import BETEFormView from '../components/budget/BETEFormView';
import MillRateScenarioTable from '../components/budget/MillRateScenarioTable';
import BudgetWorksheetTable from '../components/budget/BudgetWorksheetTable';
import COADrivenBudgetSummary from '../components/budget/COADrivenBudgetSummary';
import COADrivenDepartmentBudget from '../components/budget/COADrivenDepartmentBudget';
import { calculateTaxCommitment, reconcile, compareToPriorYear, groupByDepartment } from '../components/budget/budgetEngine';
import { Calculator, FileText, Table, BarChart2, GitCompare, AlertTriangle, GitMerge } from 'lucide-react';

const fmt = n => `$${Math.round(Math.abs(n || 0)).toLocaleString()}`;
const mr = n => (n || 0).toFixed(3);

// ── Default seed from ModelSettings ──────────────────────────────────────────
function seedInputs(settings) {
  const enterpriseOffsets =
    (settings.ambulance_transfer || 45000) +
    (settings.sewer_transfer || 21110) +
    (settings.ts_transfer || 21000) +
    (settings.telebusiness_transfer || 18525) +
    (settings.court_st_transfer || 15600);

  return {
    municipalAppropriations: settings.annual_tax_levy ? Math.round(settings.annual_tax_levy * 1.35) : 3880000,
    schoolAppropriations: 1950000,
    countyAssessment: 285000,
    tifFinancingPlan: 0,
    enterpriseOffsets,
    stateRevenueSharing: 165000,
    localRevenues: 320000,
    fundBalanceUse: 0,
    grantsAndReimbursements: 45000,
    beteReimbursement: 12000,
    homesteadExemptionValue: 0,
    totalAssessedValue: settings.total_assessed_value || 198000000,
    overlayPercent: 1.0,
    priorYearNetRaised: settings.annual_tax_levy || 2871000,
    priorYearMillRate: settings.current_mill_rate || 14.5,
    priorYearLevy: settings.annual_tax_levy || 2871000,
    fiscalYear: 'FY2027',
  };
}

// ── Seed worksheet lines ──────────────────────────────────────────────────────
const SEED_LINES = [
  { fiscal_year: 'FY2027', department: 'Administration', fund: 'general_fund', account_code: '01-110', account_name: 'Town Manager', account_type: 'appropriation', article_number: 'Art. 4', prior_year_budget: 75000, manager_request: 78000, budget_committee: 77500, select_board: 77500, adopted: 77500 },
  { fiscal_year: 'FY2027', department: 'Administration', fund: 'general_fund', account_code: '01-120', account_name: 'Finance Director', account_type: 'appropriation', article_number: 'Art. 4', prior_year_budget: 65000, manager_request: 68000, budget_committee: 68000, select_board: 68000, adopted: 68000 },
  { fiscal_year: 'FY2027', department: 'Administration', fund: 'general_fund', account_code: '01-130', account_name: 'Staff Accountant (new)', account_type: 'appropriation', article_number: 'Art. 5', prior_year_budget: 0, manager_request: 65000, budget_committee: 65000, select_board: 65000, adopted: 65000 },
  { fiscal_year: 'FY2027', department: 'Police', fund: 'general_fund', account_code: '02-110', account_name: 'Police Chief & Staff', account_type: 'appropriation', article_number: 'Art. 6', prior_year_budget: 420000, manager_request: 438000, budget_committee: 435000, select_board: 435000, adopted: 435000 },
  { fiscal_year: 'FY2027', department: 'Public Works', fund: 'general_fund', account_code: '03-110', account_name: 'Public Works', account_type: 'appropriation', article_number: 'Art. 7', prior_year_budget: 380000, manager_request: 395000, budget_committee: 392000, select_board: 392000, adopted: 392000 },
  { fiscal_year: 'FY2027', department: 'Fire / EMS', fund: 'general_fund', account_code: '04-110', account_name: 'Fire Department', account_type: 'appropriation', article_number: 'Art. 8', prior_year_budget: 95000, manager_request: 98000, budget_committee: 98000, select_board: 98000, adopted: 98000 },
  { fiscal_year: 'FY2027', department: 'Fire / EMS', fund: 'ambulance_fund', account_code: '04-200', account_name: 'Ambulance Service', account_type: 'appropriation', article_number: 'Art. 8', prior_year_budget: 480000, manager_request: 498000, budget_committee: 498000, select_board: 498000, adopted: 498000 },
  { fiscal_year: 'FY2027', department: 'Revenue', fund: 'general_fund', account_code: '05-001', account_name: 'Excise Tax', account_type: 'deduction', article_number: 'Revenues', prior_year_budget: 280000, manager_request: 295000, budget_committee: 295000, select_board: 295000, adopted: 295000 },
  { fiscal_year: 'FY2027', department: 'Revenue', fund: 'general_fund', account_code: '05-002', account_name: 'State Revenue Sharing', account_type: 'deduction', article_number: 'Revenues', prior_year_budget: 160000, manager_request: 165000, budget_committee: 165000, select_board: 165000, adopted: 165000 },
];

// ── KPI Strip ─────────────────────────────────────────────────────────────────
function KPIStrip({ calc, priorYearLevy, priorYearMR }) {
  const levyChange = calc.taxForCommitment - (priorYearLevy || 0);
  const mrChange = calc.selectedMillRate - (priorYearMR || 0);
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {[
        { label: 'Net to Be Raised', value: fmt(calc.netToBeRaised), sub: 'After all deductions', color: 'text-slate-900' },
        { label: 'Tax for Commitment', value: fmt(calc.taxForCommitment), sub: `Overlay: ${fmt(calc.overlayDollars)}`, color: 'text-slate-900' },
        {
          label: 'Selected Mill Rate',
          value: `${mr(calc.selectedMillRate)} mills`,
          sub: priorYearMR ? `${mrChange >= 0 ? '+' : ''}${mrChange.toFixed(3)} vs prior year` : 'Mills per $1,000 AV',
          color: mrChange > 0.5 ? 'text-red-700' : mrChange < 0 ? 'text-emerald-700' : 'text-slate-900',
        },
        {
          label: 'Levy Change',
          value: `${levyChange >= 0 ? '+' : ''}${fmt(levyChange)}`,
          sub: priorYearLevy ? `${((levyChange / priorYearLevy) * 100).toFixed(1)}% change` : 'vs prior year',
          color: levyChange > 0 ? 'text-amber-700' : 'text-emerald-700',
        },
      ].map(s => (
        <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-3">
          <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
          <p className="text-xs font-medium text-slate-600 mt-0.5">{s.label}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">{s.sub}</p>
        </div>
      ))}
    </div>
  );
}

// ── Prior Year Comparison ─────────────────────────────────────────────────────
function PriorYearView({ calc, inputs }) {
  const comp = useMemo(() => compareToPriorYear(calc, {
    totalAppropriations: inputs.municipalAppropriations + inputs.schoolAppropriations + inputs.countyAssessment,
    totalDeductions: inputs.enterpriseOffsets + inputs.stateRevenueSharing + inputs.localRevenues + inputs.fundBalanceUse + inputs.grantsAndReimbursements + inputs.beteReimbursement,
    netToBeRaised: inputs.priorYearNetRaised,
    selectedMillRate: inputs.priorYearMillRate,
    taxForCommitment: inputs.priorYearLevy,
  }), [calc, inputs]);

  const rows = [
    ['Total Appropriations', fmt(inputs.municipalAppropriations + inputs.schoolAppropriations + inputs.countyAssessment), fmt(calc.totalAppropriations), comp.appropriationsChange, comp.appropriationsPct],
    ['Total Deductions', fmt(inputs.enterpriseOffsets + inputs.stateRevenueSharing + inputs.localRevenues + inputs.fundBalanceUse + inputs.grantsAndReimbursements + inputs.beteReimbursement), fmt(calc.totalDeductions), comp.deductionsChange, null],
    ['Net to Be Raised', fmt(inputs.priorYearNetRaised), fmt(calc.netToBeRaised), comp.netRaisedChange, comp.netRaisedPct],
    ['Mill Rate', `${mr(inputs.priorYearMillRate)} mills`, `${mr(calc.selectedMillRate)} mills`, comp.millRateChange, null],
    ['Tax for Commitment', fmt(inputs.priorYearLevy), fmt(calc.taxForCommitment), comp.levyChange, comp.levyPct],
  ];

  return (
    <div className="rounded-2xl border border-slate-200 overflow-hidden">
      <div className="bg-slate-900 text-white px-4 py-2 grid grid-cols-4 text-[10px] font-bold uppercase tracking-wider">
        <span>Line Item</span>
        <span className="text-right">Prior Year</span>
        <span className="text-right">Proposed</span>
        <span className="text-right">Change</span>
      </div>
      {rows.map(([label, prior, proposed, change, changePct], i) => (
        <div key={i} className={`px-4 py-2 grid grid-cols-4 text-xs border-t border-slate-100 ${i === rows.length - 1 ? 'bg-slate-50 font-semibold' : ''}`}>
          <span className="text-slate-700">{label}</span>
          <span className="text-right font-mono text-slate-500">{prior}</span>
          <span className="text-right font-mono text-slate-900">{proposed}</span>
          <span className={`text-right font-mono font-semibold ${change >= 0 ? 'text-red-600' : 'text-emerald-700'}`}>
            {change >= 0 ? '+' : ''}{typeof change === 'number' && Math.abs(change) > 0.001 ? (Number.isInteger(change) ? fmt(change) : change.toFixed(3)) : '—'}
            {changePct != null && <span className="text-[10px] ml-1 opacity-70">({changePct.toFixed(1)}%)</span>}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Reconciliation tab ────────────────────────────────────────────────────────
function ReconciliationView({ calc, warnings, lines }) {
  const wsApprop = lines.filter(l => l.account_type === 'appropriation').reduce((s, l) => s + (l.adopted || l.select_board || l.manager_request || 0), 0);
  const wsDeduct = lines.filter(l => ['deduction','enterprise_offset'].includes(l.account_type)).reduce((s, l) => s + (l.adopted || l.select_board || l.manager_request || 0), 0);
  const wsNet = wsApprop - wsDeduct;
  const beteNet = calc.netToBeRaised;
  const diff = Math.abs(wsNet - beteNet);

  const checks = [
    { label: 'BETE form totals reconcile', ok: calc.reconciled, detail: `Commitment: ${fmt(calc.taxForCommitment)} vs selected: ${fmt(calc.selectedCommitment)}` },
    { label: 'Worksheet net matches BETE net', ok: diff < 500, detail: `Worksheet net: ${fmt(wsNet)} | BETE net: ${fmt(beteNet)} | Diff: ${fmt(diff)}` },
    { label: 'Overlay within 0–3%', ok: calc.overlayPercent <= 3, detail: `Current overlay: ${calc.overlayPercent.toFixed(1)}%` },
    { label: 'Fund balance use < 15% of net raised', ok: calc.fundBalanceUse <= calc.netToBeRaised * 0.15, detail: `Fund balance: ${fmt(calc.fundBalanceUse)} | 15% limit: ${fmt(calc.netToBeRaised * 0.15)}` },
    { label: 'Assessed value populated', ok: calc.totalAssessedValue > 1_000_000, detail: `Current: ${fmt(calc.totalAssessedValue)}` },
    { label: 'Mill rate within normal range (5–30)', ok: calc.selectedMillRate >= 5 && calc.selectedMillRate <= 30, detail: `Current: ${mr(calc.selectedMillRate)} mills` },
  ];

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {checks.map((c, i) => (
          <div key={i} className={`rounded-xl border px-3 py-2.5 flex items-center gap-3 ${c.ok ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
            <span className={`text-sm ${c.ok ? 'text-emerald-600' : 'text-red-600'}`}>{c.ok ? '✓' : '✗'}</span>
            <div>
              <p className={`text-xs font-semibold ${c.ok ? 'text-emerald-800' : 'text-red-800'}`}>{c.label}</p>
              <p className="text-[10px] text-slate-500">{c.detail}</p>
            </div>
          </div>
        ))}
      </div>
      {warnings.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Warnings</p>
          {warnings.map((w, i) => (
            <div key={i} className={`rounded-xl border px-3 py-2 flex items-start gap-2 ${w.type === 'error' ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'}`}>
              <AlertTriangle className={`h-3.5 w-3.5 flex-shrink-0 mt-0.5 ${w.type === 'error' ? 'text-red-600' : 'text-amber-600'}`} />
              <p className="text-[11px] text-slate-700">{w.msg}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'summary', label: 'COA Summary', icon: GitMerge },
  { id: 'bete', label: 'BETE Form', icon: FileText },
  { id: 'millrate', label: 'Mill Rate What-If', icon: Calculator },
  { id: 'worksheet', label: 'Worksheet', icon: Table },
  { id: 'comparison', label: 'Prior Year', icon: GitCompare },
  { id: 'reconcile', label: 'Reconciliation', icon: AlertTriangle },
];

export default function BudgetEngine() {
  const { settings } = useModel();
  const [inputs, setInputs] = useState(() => seedInputs(settings));
  const [selectedMillRate, setSelectedMillRate] = useState(null);
  const [lines, setLines] = useState(SEED_LINES);
  const [activeTab, setActiveTab] = useState('summary');
  const [worksheetGroupBy, setWorksheetGroupBy] = useState('department');
  const [selectedDept, setSelectedDept] = useState('Administration');

  // Fetch COA accounts (approved only)
  const { data: accounts = [] } = useQuery({
    queryKey: ['coa'],
    queryFn: () => base44.entities.ChartOfAccounts.filter({ validation_status: 'approved' }, 500),
    initialData: [],
  });

  const calc = useMemo(() => calculateTaxCommitment({
    ...inputs,
    selectedMillRate: selectedMillRate ?? undefined,
  }), [inputs, selectedMillRate]);

  const warnings = useMemo(() => reconcile(calc, lines), [calc, lines]);
  const warnCount = warnings.length;
  const errorCount = warnings.filter(w => w.type === 'error').length;

  const handleSelectMillRate = useCallback((mr) => {
    setSelectedMillRate(mr);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <SectionHeader
          title="Budget & Tax Commitment Engine"
          subtitle={`${inputs.fiscalYear || 'FY2027'} — Municipal appropriations to BETE commitment`}
          icon={Calculator}
        />
        <div className="flex items-center gap-2">
          <select value={inputs.fiscalYear || 'FY2027'}
            onChange={e => setInputs(p => ({ ...p, fiscalYear: e.target.value }))}
            className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-400">
            {['FY2025','FY2026','FY2027','FY2028','FY2029','FY2030'].map(fy => (
              <option key={fy} value={fy}>{fy}</option>
            ))}
          </select>
          {warnCount > 0 && (
            <button onClick={() => setActiveTab('reconcile')}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border ${errorCount > 0 ? 'border-red-200 bg-red-50 text-red-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
              <AlertTriangle className="h-3.5 w-3.5" />
              {warnCount} issue{warnCount !== 1 ? 's' : ''}
            </button>
          )}
        </div>
      </div>

      {/* KPI strip */}
      <KPIStrip calc={calc} priorYearLevy={inputs.priorYearLevy} priorYearMR={inputs.priorYearMillRate} />

      {/* Two-column layout: inputs left, content right */}
      <div className="flex gap-5 items-start">
        {/* Left: inputs */}
        <div className="w-72 flex-shrink-0">
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <div className="px-4 py-2.5 border-b border-slate-100" style={{ background: '#344A60' }}>
              <p className="text-xs font-bold text-white">Budget Inputs</p>
              <p className="text-[9px] mt-0.5" style={{ color: '#B3C6C8' }}>Appropriations, deductions, valuation</p>
            </div>
            <div className="p-4 max-h-[calc(100vh-280px)] overflow-y-auto">
              <BudgetInputsPanel inputs={inputs} onChange={setInputs} />
            </div>
          </div>
        </div>

        {/* Right: tabbed content */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Tabs */}
          <div className="flex gap-1 border-b border-slate-200 overflow-x-auto">
            {TABS.map(({ id, label, icon: TabIcon }) => {
              const hasIssue = id === 'reconcile' && warnCount > 0;
              return (
                <button key={id} onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === id ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-700'
                  }`}>
                  <TabIcon className="h-3.5 w-3.5 flex-shrink-0" />
                  {label}
                  {hasIssue && (
                    <span className={`ml-1 text-[9px] px-1.5 py-0.5 rounded-full font-bold ${errorCount > 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                      {warnCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
           {activeTab === 'summary' && (
             <COADrivenBudgetSummary accounts={accounts} budgetLines={lines} departmentBudgets={[]} articles={[]} />
           )}

           {activeTab === 'bete' && (
             <BETEFormView calc={calc} warnings={warnings} priorYear={inputs} />
           )}

          {activeTab === 'millrate' && (
            <div className="space-y-4">
              <MillRateScenarioTable
                calc={calc}
                selectedMillRate={selectedMillRate}
                onSelectMillRate={handleSelectMillRate}
              />
              {selectedMillRate !== null && (
                <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-blue-900">Override active: {mr(selectedMillRate)} mills</p>
                    <p className="text-[10px] text-blue-700">Commitment adjusted to {fmt(calc.selectedCommitment)} · Overlay: {fmt(calc.overlayDollars)} ({calc.overlayPercent.toFixed(2)}%)</p>
                  </div>
                  <button onClick={() => setSelectedMillRate(null)} className="text-[10px] font-semibold text-blue-600 hover:text-blue-900 border border-blue-300 px-2 py-1 rounded">Clear</button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'worksheet' && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <p className="text-xs text-slate-500">Group by:</p>
                {['department','article'].map(g => (
                  <button key={g} onClick={() => setWorksheetGroupBy(g)}
                    className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${worksheetGroupBy === g ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                    {g.charAt(0).toUpperCase() + g.slice(1)}
                  </button>
                ))}
              </div>
              <BudgetWorksheetTable
                lines={lines}
                onLinesChange={setLines}
                fiscalYear={inputs.fiscalYear}
                groupBy={worksheetGroupBy}
              />
            </div>
          )}

          {activeTab === 'comparison' && (
            <PriorYearView calc={calc} inputs={inputs} />
          )}

          {activeTab === 'reconcile' && (
            <ReconciliationView calc={calc} warnings={warnings} lines={lines} />
          )}
        </div>
      </div>
    </div>
  );
}