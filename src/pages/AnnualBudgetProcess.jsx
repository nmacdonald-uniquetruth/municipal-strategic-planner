/**
 * AnnualBudgetProcess — Annual Municipal Budget Process Module
 *
 * Tabs:
 *  1. Calendar      — phase workflow with deadlines & owners
 *  2. Departments   — per-department budget entry & review
 *  3. Summary       — public/board/BETE rollup views
 *  4. Variance      — post-adoption control & tracking
 *  5. Validation    — cross-checks and process warnings
 */
import React, { useState, useMemo, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import SectionHeader from '../components/machias/SectionHeader';
import BudgetCalendar from '../components/budgetprocess/BudgetCalendar';
import DepartmentBudgetTable from '../components/budgetprocess/DepartmentBudgetTable';
import DepartmentBudgetForm from '../components/budgetprocess/DepartmentBudgetForm';
import BudgetVarianceTracker from '../components/budgetprocess/BudgetVarianceTracker';
import BudgetSummaryPanel from '../components/budgetprocess/BudgetSummaryPanel';
import {
  PHASES, PHASE_ORDER, FUND_LABELS, resolveActiveColumn, getColumnLabel,
  aggregateBudget, cloneForNextYear, validateBudgetProcess,
} from '../components/budgetprocess/budgetProcessEngine';
import { calculateTaxCommitment } from '../components/budget/budgetEngine';
import { useModel } from '../components/machias/ModelContext';
import {
  CalendarDays, Building2, BarChart2, Activity, AlertTriangle,
  Plus, Copy, CheckCircle, XCircle, Info, ClipboardList
} from 'lucide-react';

const fmt = n => `$${Math.round(Math.abs(n || 0)).toLocaleString()}`;
const mr  = n => (n || 0).toFixed(3);

// ── Seed data ─────────────────────────────────────────────────────────────────
function buildSeedDepts(settings, fiscalYear) {
  const ents = (settings.ambulance_transfer || 45000) + (settings.sewer_transfer || 21110) + (settings.ts_transfer || 21000) + (settings.telebusiness_transfer || 18525) + (settings.court_st_transfer || 15600);
  return [
    { id: 's1', fiscal_year: fiscalYear, department: 'Administration', fund: 'general_fund', fund_type: 'governmental', article_number: 'Article 4', bete_mapping: 'municipalAppropriations', sort_order: 1, prior_year_budget: 710000, prior_year_actual: 698000, current_year_budget: 730000, ytd_actual: 362000, projected_year_end: 728000, dept_request: 745500, finance_recommendation: 745500, manager_recommendation: 745500, budget_committee_recommendation: 745500, select_board_recommendation: 745500, adopted_budget: 745500, enterprise_transfer: 0, carryforward_amount: 0, justification_tags: ['staffing','contractual'], justification_narrative: 'Includes new Staff Accountant position (FY2027 hire).', manager_approved: true, budget_committee_approved: true, select_board_approved: true },
    { id: 's2', fiscal_year: fiscalYear, department: 'Police', fund: 'general_fund', fund_type: 'governmental', article_number: 'Article 5', bete_mapping: 'municipalAppropriations', sort_order: 2, prior_year_budget: 420000, prior_year_actual: 415000, current_year_budget: 430000, ytd_actual: 215000, projected_year_end: 432000, dept_request: 445000, finance_recommendation: 440000, manager_recommendation: 438000, budget_committee_recommendation: 435000, select_board_recommendation: 435000, adopted_budget: 435000, enterprise_transfer: 0, carryforward_amount: 0, justification_tags: ['contractual','inflationary'], justification_narrative: 'Union contract CPI adjustment.', manager_approved: true, budget_committee_approved: true, select_board_approved: true },
    { id: 's3', fiscal_year: fiscalYear, department: 'Fire Department', fund: 'general_fund', fund_type: 'governmental', article_number: 'Article 6', bete_mapping: 'municipalAppropriations', sort_order: 3, prior_year_budget: 95000, prior_year_actual: 92000, current_year_budget: 96000, ytd_actual: 48000, projected_year_end: 95000, dept_request: 100000, finance_recommendation: 98000, manager_recommendation: 98000, budget_committee_recommendation: 98000, select_board_recommendation: 98000, adopted_budget: 98000, enterprise_transfer: 0, carryforward_amount: 0, justification_tags: ['inflationary','capital_need'], justification_narrative: 'Equipment maintenance increase.', manager_approved: true, budget_committee_approved: true, select_board_approved: true },
    { id: 's4', fiscal_year: fiscalYear, department: 'Ambulance Service', fund: 'enterprise', fund_type: 'enterprise', article_number: 'Article 7', bete_mapping: 'enterpriseOffsets', sort_order: 4, prior_year_budget: 480000, prior_year_actual: 475000, current_year_budget: 490000, ytd_actual: 245000, projected_year_end: 488000, dept_request: 500000, finance_recommendation: 498000, manager_recommendation: 498000, budget_committee_recommendation: 498000, select_board_recommendation: 498000, adopted_budget: 498000, enterprise_transfer: ents, carryforward_amount: 0, justification_tags: ['staffing','contractual'], justification_narrative: 'EMS transport billing transition mid-year.', manager_approved: true, budget_committee_approved: true, select_board_approved: true },
    { id: 's5', fiscal_year: fiscalYear, department: 'Public Works', fund: 'general_fund', fund_type: 'governmental', article_number: 'Article 8', bete_mapping: 'municipalAppropriations', sort_order: 5, prior_year_budget: 380000, prior_year_actual: 372000, current_year_budget: 388000, ytd_actual: 194000, projected_year_end: 390000, dept_request: 400000, finance_recommendation: 395000, manager_recommendation: 392000, budget_committee_recommendation: 392000, select_board_recommendation: 392000, adopted_budget: 392000, enterprise_transfer: 0, carryforward_amount: 0, justification_tags: ['inflationary','capital_need'], justification_narrative: 'Road maintenance materials inflation +8%.', manager_approved: true, budget_committee_approved: true, select_board_approved: true },
    { id: 's6', fiscal_year: fiscalYear, department: 'School (RSU Share)', fund: 'school', fund_type: 'governmental', article_number: 'Article 10', bete_mapping: 'schoolAppropriations', sort_order: 10, prior_year_budget: 1880000, prior_year_actual: 1880000, current_year_budget: 1915000, ytd_actual: 960000, projected_year_end: 1915000, dept_request: 1950000, finance_recommendation: 1950000, manager_recommendation: 1950000, budget_committee_recommendation: 1950000, select_board_recommendation: 1950000, adopted_budget: 1950000, enterprise_transfer: 0, carryforward_amount: 0, justification_tags: ['statutory'], justification_narrative: 'RSU-level assessment — statutory requirement.', manager_approved: true, budget_committee_approved: true, select_board_approved: true },
    { id: 's7', fiscal_year: fiscalYear, department: 'County Assessment', fund: 'county', fund_type: 'governmental', article_number: 'Article 3', bete_mapping: 'countyAssessment', sort_order: 11, prior_year_budget: 278000, prior_year_actual: 278000, current_year_budget: 280000, ytd_actual: 0, projected_year_end: 285000, dept_request: 285000, finance_recommendation: 285000, manager_recommendation: 285000, budget_committee_recommendation: 285000, select_board_recommendation: 285000, adopted_budget: 285000, enterprise_transfer: 0, carryforward_amount: 0, justification_tags: ['statutory'], justification_narrative: 'Washington County apportionment.', manager_approved: true, budget_committee_approved: true, select_board_approved: true },
  ];
}

function buildSeedPhases(fiscalYear) {
  return PHASES.map((p, i) => ({
    id: `sp_${p.id}`,
    fiscal_year: fiscalYear,
    phase_id: p.id,
    label: p.label,
    owner: p.owner,
    status: i < 3 ? 'complete' : i === 3 ? 'in_progress' : 'not_started',
    deadline: null, completed_date: null, notes: '',
  }));
}

// ── Validation panel ──────────────────────────────────────────────────────────
function ValidationView({ validation }) {
  const { errors, warnings, info } = validation;
  const total = errors.length + warnings.length;
  if (total === 0 && info.length === 0) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 flex items-center gap-2">
        <CheckCircle className="h-4 w-4 text-emerald-600" />
        <p className="text-xs font-semibold text-emerald-800">Budget process validation — no issues found.</p>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {errors.map((e, i) => <div key={i} className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 flex items-start gap-2"><XCircle className="h-3.5 w-3.5 text-red-600 mt-0.5 flex-shrink-0" /><p className="text-[11px] font-semibold text-red-800">{e.msg}</p></div>)}
      {warnings.map((w, i) => <div key={i} className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 flex items-start gap-2"><AlertTriangle className="h-3.5 w-3.5 text-amber-600 mt-0.5 flex-shrink-0" /><p className="text-[11px] text-amber-800">{w.msg}</p></div>)}
      {info.map((inf, i) => <div key={i} className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 flex items-start gap-2"><Info className="h-3.5 w-3.5 text-blue-500 mt-0.5 flex-shrink-0" /><p className="text-[11px] text-blue-700">{inf.msg}</p></div>)}
    </div>
  );
}

const TABS = [
  { id: 'calendar',    label: 'Calendar',     icon: CalendarDays },
  { id: 'departments', label: 'Departments',  icon: Building2 },
  { id: 'summary',     label: 'Summary',      icon: BarChart2 },
  { id: 'variance',    label: 'Variance',     icon: Activity },
  { id: 'validation',  label: 'Validation',   icon: AlertTriangle },
];

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AnnualBudgetProcess() {
  const { settings } = useModel();
  const [fiscalYear, setFiscalYear] = useState('FY2027');
  const [activeTab, setActiveTab] = useState('departments');
  const [depts, setDepts] = useState(() => buildSeedDepts(settings, 'FY2027'));
  const [phases, setPhases] = useState(() => buildSeedPhases('FY2027'));
  const [editingDept, setEditingDept] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [showHistory, setShowHistory] = useState(true);
  const [activePhase, setActivePhase] = useState('manager_recommendation');

  const activeColumn = resolveActiveColumn(activePhase);
  const totals = useMemo(() => aggregateBudget(depts, activeColumn), [depts, activeColumn]);

  // BETE calc for KPI
  const calc = useMemo(() => {
    const muniApprops = depts.filter(d => d.bete_mapping === 'municipalAppropriations').reduce((s, d) => s + (d[activeColumn] || 0), 0);
    const schoolApprops = depts.filter(d => d.bete_mapping === 'schoolAppropriations').reduce((s, d) => s + (d[activeColumn] || 0), 0);
    const countyAssess = depts.filter(d => d.bete_mapping === 'countyAssessment').reduce((s, d) => s + (d[activeColumn] || 0), 0);
    const entOffsets = depts.filter(d => d.bete_mapping === 'enterpriseOffsets').reduce((s, d) => s + (d.enterprise_transfer || 0), 0);
    return calculateTaxCommitment({
      municipalAppropriations: muniApprops,
      schoolAppropriations: schoolApprops,
      countyAssessment: countyAssess,
      enterpriseOffsets: entOffsets || 121235,
      stateRevenueSharing: 165000,
      localRevenues: 320000,
      totalAssessedValue: settings.total_assessed_value || 198000000,
      overlayPercent: 1.0,
    });
  }, [depts, activeColumn, settings]);

  const validation = useMemo(() => validateBudgetProcess({ current_phase: activePhase }, phases, depts), [activePhase, phases, depts]);
  const issueCount = validation.errors.length + validation.warnings.length;
  const errorCount = validation.errors.length;

  // Handlers
  const handleSaveDept = useCallback(form => {
    if (editingDept) {
      setDepts(prev => prev.map(d => d.id === editingDept.id ? { ...form, id: editingDept.id } : d));
    } else {
      setDepts(prev => [...prev, { ...form, id: `d_${Date.now()}`, fiscal_year: fiscalYear }]);
    }
    setEditingDept(null);
    setIsAdding(false);
  }, [editingDept, fiscalYear]);

  const handleUpdatePhase = useCallback((phaseId, updates) => {
    setPhases(prev => prev.map(p => p.phase_id === phaseId ? { ...p, ...updates } : p));
  }, []);

  const handleCloneYear = useCallback(() => {
    const nextFY = `FY${parseInt(fiscalYear.replace('FY', '')) + 1}`;
    const cloned = cloneForNextYear(depts, fiscalYear, nextFY);
    setDepts(cloned);
    setPhases(buildSeedPhases(nextFY));
    setFiscalYear(nextFY);
    setActiveTab('departments');
  }, [depts, fiscalYear]);

  const processObj = { fiscal_year: fiscalYear, current_phase: activePhase, net_to_be_raised: calc.netToBeRaised, adopted_mill_rate: calc.selectedMillRate };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <SectionHeader
          title="Annual Budget Process"
          subtitle={`${fiscalYear} — Budget calendar through adoption, tax commitment, and variance tracking`}
          icon={ClipboardList}
        />
        <div className="flex items-center gap-2 flex-wrap">
          <select value={fiscalYear} onChange={e => setFiscalYear(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-400">
            {['FY2025','FY2026','FY2027','FY2028','FY2029'].map(fy => <option key={fy} value={fy}>{fy}</option>)}
          </select>
          <select value={activePhase} onChange={e => setActivePhase(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-400">
            {PHASES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
          <button onClick={handleCloneYear}
            className="flex items-center gap-1.5 text-xs font-semibold border border-slate-200 text-slate-600 hover:border-slate-500 hover:text-slate-900 px-3 py-1.5 rounded-lg transition-colors">
            <Copy className="h-3.5 w-3.5" /> Clone to Next Year
          </button>
          <button onClick={() => { setIsAdding(true); setEditingDept(null); setActiveTab('departments'); }}
            className="flex items-center gap-1.5 text-xs font-semibold bg-slate-900 text-white px-3 py-1.5 rounded-lg hover:bg-slate-700 transition-colors">
            <Plus className="h-3.5 w-3.5" /> Add Department
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {[
          { label: 'Total Appropriations', value: fmt(totals.active), sub: getColumnLabel(activeColumn), color: 'text-slate-900' },
          { label: 'Prior Year', value: fmt(totals.prior_year_budget), sub: 'prior year budget', color: 'text-slate-600' },
          { label: 'Net to Be Raised', value: fmt(calc.netToBeRaised), sub: 'after deductions', color: 'text-slate-900' },
          { label: 'Mill Rate', value: `${mr(calc.selectedMillRate)} mills`, sub: `${calc.selectedMillRate > (settings.current_mill_rate || 14.5) ? '+' : ''}${(calc.selectedMillRate - (settings.current_mill_rate || 14.5)).toFixed(3)} vs prior`, color: calc.selectedMillRate > (settings.current_mill_rate || 14.5) + 0.5 ? 'text-red-700' : 'text-emerald-700' },
          { label: 'Validation', value: issueCount === 0 ? '✓ Clean' : `${issueCount} issue${issueCount !== 1 ? 's' : ''}`, sub: issueCount === 0 ? 'no issues' : `${errorCount} errors`, color: issueCount === 0 ? 'text-emerald-700' : errorCount > 0 ? 'text-red-700' : 'text-amber-700' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-3">
            <p className={`text-base font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] font-medium text-slate-600 mt-0.5">{s.label}</p>
            <p className="text-[9px] text-slate-400">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Active phase banner */}
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 flex items-center gap-3">
        <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-slate-900">Active Phase: {PHASES.find(p => p.id === activePhase)?.label}</p>
          <p className="text-[10px] text-slate-500">{PHASES.find(p => p.id === activePhase)?.description} · Showing: <span className="font-semibold">{getColumnLabel(activeColumn)}</span> column</p>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          {PHASE_ORDER.map((id, i) => {
            const done = PHASE_ORDER.indexOf(activePhase) > i;
            const active = id === activePhase;
            return <div key={id} className={`h-2 w-3 rounded-sm transition-colors ${active ? 'bg-slate-900' : done ? 'bg-emerald-400' : 'bg-slate-200'}`} title={id} />;
          })}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 overflow-x-auto">
        {TABS.map(({ id, label, icon: TabIcon }) => {
          const badge = id === 'validation' && issueCount > 0 ? issueCount : null;
          return (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${activeTab === id ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-700'}`}>
              <TabIcon className="h-3.5 w-3.5 flex-shrink-0" />
              {label}
              {badge && <span className={`ml-1 text-[9px] px-1.5 py-0.5 rounded-full font-bold ${errorCount > 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{badge}</span>}
            </button>
          );
        })}
      </div>

      {/* ── Calendar ── */}
      {activeTab === 'calendar' && (
        <BudgetCalendar
          phases={phases}
          currentPhase={activePhase}
          onUpdatePhase={handleUpdatePhase}
          onSetCurrentPhase={setActivePhase}
        />
      )}

      {/* ── Departments ── */}
      {activeTab === 'departments' && (
        <div className="space-y-4">
          {(isAdding || editingDept) ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-bold text-slate-700 mb-4">{editingDept ? `Editing: ${editingDept.department}` : 'New Department'}</p>
              <DepartmentBudgetForm
                dept={editingDept}
                fiscalYear={fiscalYear}
                onSave={handleSaveDept}
                onCancel={() => { setEditingDept(null); setIsAdding(false); }}
              />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  {[true, false].map(v => (
                    <button key={String(v)} onClick={() => setShowHistory(v)}
                      className={`text-[10px] px-2.5 py-1 rounded-full font-medium transition-colors ${showHistory === v ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                      {v ? 'Full History' : 'Compact'}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400">Click any department row to expand detail · Use pencil to edit</p>
              </div>
              <DepartmentBudgetTable
                depts={depts}
                activePhase={activePhase}
                showHistory={showHistory}
                onEdit={d => { setEditingDept(d); setActiveTab('departments'); }}
              />
            </div>
          )}
        </div>
      )}

      {/* ── Summary ── */}
      {activeTab === 'summary' && (
        <BudgetSummaryPanel process={processObj} depts={depts} activePhase={activePhase} />
      )}

      {/* ── Variance ── */}
      {activeTab === 'variance' && (
        <BudgetVarianceTracker depts={depts} />
      )}

      {/* ── Validation ── */}
      {activeTab === 'validation' && (
        <ValidationView validation={validation} />
      )}
    </div>
  );
}