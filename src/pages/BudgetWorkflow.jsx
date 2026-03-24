/**
 * BudgetWorkflow — Multi-stage municipal budget approval process
 * Dept Head → Finance Director → Town Manager → Budget Committee → Select Board → Print
 * Based on Machias FY2023-2026 Custom Budget Report data
 */
import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users, DollarSign, FileText, ChevronRight, CheckCircle2,
  AlertTriangle, Printer, Plus, Filter, Search, RefreshCw, ArrowRight
} from 'lucide-react';
import BudgetWorkflowStageBar from '../components/budget/BudgetWorkflowStageBar';
import BudgetLineEditor from '../components/budget/BudgetLineEditor';
import SectionHeader from '../components/machias/SectionHeader';

// ── Real Machias departments from budget PDF ─────────────────────────────────
const DEPARTMENTS = [
  { code: '01', name: 'Administration' },
  { code: '02', name: 'Fire Department' },
  { code: '03', name: 'Police' },
  { code: '04', name: 'Public Works' },
  { code: '05', name: 'Sewer' },
  { code: '06', name: 'Ambulance' },
  { code: '07', name: 'Public Safety Building' },
  { code: '08', name: 'Parks & Recreation' },
  { code: '09', name: 'Tax Assessor' },
  { code: '10', name: 'Plumbing Inspector' },
  { code: '11', name: 'Code Enforcement' },
  { code: '12', name: 'Airport' },
  { code: '13', name: 'General Assistance' },
  { code: '14', name: 'Solid Waste Facility' },
  { code: '15', name: 'Third Party Requests' },
  { code: '16', name: "Gov't Agency" },
  { code: '17', name: 'Other Municipal Services' },
  { code: '18', name: 'Planning Board' },
  { code: '19', name: 'Municipality Debt Service' },
  { code: '20', name: 'Tel Center' },
  { code: '21', name: 'Capital Project Accounts' },
  { code: '29', name: 'General Education' },
];

// Seed data extracted from the PDF — FY2026 budgets by dept total
const SEED_LINES = [
  // Admin
  { department_code:'01', department_name:'Administration', account_code:'001-01', account_name:'DEPT HEADS - WAGES', category:'WAGES/SALARY', prior_year_actual:62999.15, prior_year_budget:90068.00, current_year_budget:92320.00, current_year_ytd:47867.55 },
  { department_code:'01', department_name:'Administration', account_code:'001-02', account_name:'FULL TIME WAGES', category:'WAGES/SALARY', prior_year_actual:222609.96, prior_year_budget:241083.00, current_year_budget:190160.00, current_year_ytd:180244.77 },
  { department_code:'01', department_name:'Administration', account_code:'002-01', account_name:'FICA', category:'BENEFITS', prior_year_actual:24173.94, prior_year_budget:27715.00, current_year_budget:26575.00, current_year_ytd:20581.86 },
  { department_code:'01', department_name:'Administration', account_code:'002-02', account_name:'HEALTH INSURANCE', category:'BENEFITS', prior_year_actual:76086.24, prior_year_budget:108660.00, current_year_budget:101230.00, current_year_ytd:66095.66 },
  { department_code:'01', department_name:'Administration', account_code:'005-01', account_name:'AUDIT', category:'OPERATING EXPENSES', prior_year_actual:8700.00, prior_year_budget:12000.00, current_year_budget:12000.00, current_year_ytd:20223.03 },
  { department_code:'01', department_name:'Administration', account_code:'005-26', account_name:'BANK CHARGES', category:'OPERATING EXPENSES', prior_year_actual:7500.49, prior_year_budget:10000.00, current_year_budget:10000.00, current_year_ytd:0.00 },
  { department_code:'01', department_name:'Administration', account_code:'008-01', account_name:'COMPUTER MAINTENANCE', category:'EQUIP MAINT', prior_year_actual:16391.17, prior_year_budget:13000.00, current_year_budget:13000.00, current_year_ytd:1746.35 },
  // Fire
  { department_code:'02', department_name:'Fire Department', account_code:'001-02', account_name:'FULL TIME WAGES', category:'WAGES/SALARY', prior_year_actual:110494.83, prior_year_budget:130167.00, current_year_budget:135440.00, current_year_ytd:92941.75 },
  { department_code:'02', department_name:'Fire Department', account_code:'001-04', account_name:'VOLUNTEER/STIPEND', category:'WAGES/SALARY', prior_year_actual:57999.86, prior_year_budget:58000.00, current_year_budget:60900.00, current_year_ytd:72478.22 },
  { department_code:'02', department_name:'Fire Department', account_code:'002-02', account_name:'HEALTH INSURANCE', category:'BENEFITS', prior_year_actual:43671.39, prior_year_budget:43350.00, current_year_budget:47246.00, current_year_ytd:37187.79 },
  { department_code:'02', department_name:'Fire Department', account_code:'006-06', account_name:'WORKERS COMP', category:'INSURANCES', prior_year_actual:18330.98, prior_year_budget:25000.00, current_year_budget:25000.00, current_year_ytd:12836.88 },
  { department_code:'02', department_name:'Fire Department', account_code:'008-10', account_name:'VEHICLE MAINTENANCE', category:'EQUIP MAINT', prior_year_actual:11362.35, prior_year_budget:12000.00, current_year_budget:12000.00, current_year_ytd:10633.65 },
  { department_code:'02', department_name:'Fire Department', account_code:'010-04', account_name:'TURNOUT GEAR', category:'CLOTHING', prior_year_actual:14649.42, prior_year_budget:10000.00, current_year_budget:10000.00, current_year_ytd:0.00 },
  // Police
  { department_code:'03', department_name:'Police', account_code:'001-01', account_name:'DEPT HEADS', category:'WAGES/SALARY', prior_year_actual:80246.40, prior_year_budget:80232.00, current_year_budget:84244.00, current_year_ytd:63446.05 },
  { department_code:'03', department_name:'Police', account_code:'001-02', account_name:'FULL TIME WAGES', category:'WAGES/SALARY', prior_year_actual:198126.96, prior_year_budget:214980.00, current_year_budget:231426.00, current_year_ytd:153480.66 },
  { department_code:'03', department_name:'Police', account_code:'002-04', account_name:'MEPERS RETIREMENT', category:'BENEFITS', prior_year_actual:34825.85, prior_year_budget:36075.00, current_year_budget:40075.00, current_year_ytd:28627.22 },
  { department_code:'03', department_name:'Police', account_code:'008-09', account_name:'GAS/DIESEL', category:'EQUIP MAINT', prior_year_actual:10141.60, prior_year_budget:12000.00, current_year_budget:13000.00, current_year_ytd:13803.58 },
  { department_code:'03', department_name:'Police', account_code:'012-05', account_name:'VEHICLE REPLACEMENT', category:'CAPITAL PROJECTS', prior_year_actual:49795.71, prior_year_budget:0.00, current_year_budget:115000.00, current_year_ytd:22762.38 },
  // Public Works
  { department_code:'04', department_name:'Public Works', account_code:'001-01', account_name:'DEPT HEADS', category:'WAGES/SALARY', prior_year_actual:75041.21, prior_year_budget:65035.00, current_year_budget:68287.00, current_year_ytd:51214.81 },
  { department_code:'04', department_name:'Public Works', account_code:'001-02', account_name:'FULL TIME WAGES', category:'WAGES/SALARY', prior_year_actual:119933.63, prior_year_budget:132531.00, current_year_budget:140465.00, current_year_ytd:92313.61 },
  { department_code:'04', department_name:'Public Works', account_code:'005-19', account_name:'SAND/SALT', category:'OPERATING EXPENSES', prior_year_actual:48902.20, prior_year_budget:55000.00, current_year_budget:58000.00, current_year_ytd:53020.71 },
  { department_code:'04', department_name:'Public Works', account_code:'008-09', account_name:'GAS/DIESEL', category:'EQUIP MAINT', prior_year_actual:14611.04, prior_year_budget:23000.00, current_year_budget:23000.00, current_year_ytd:17270.03 },
  { department_code:'04', department_name:'Public Works', account_code:'008-10', account_name:'VEHICLE MAINTENANCE', category:'EQUIP MAINT', prior_year_actual:52122.22, prior_year_budget:37000.00, current_year_budget:42000.00, current_year_ytd:53213.42 },
  // Ambulance
  { department_code:'06', department_name:'Ambulance', account_code:'001-01', account_name:'DEPT HEADS', category:'WAGES/SALARY', prior_year_actual:51080.00, prior_year_budget:74880.00, current_year_budget:78624.00, current_year_ytd:59292.00 },
  { department_code:'06', department_name:'Ambulance', account_code:'001-02', account_name:'FULL TIME WAGES', category:'WAGES/SALARY', prior_year_actual:129403.56, prior_year_budget:189696.00, current_year_budget:385000.00, current_year_ytd:235398.80 },
  { department_code:'06', department_name:'Ambulance', account_code:'005-16', account_name:'MEDICAL SUPPLIES', category:'OPERATING EXPENSES', prior_year_actual:49901.06, prior_year_budget:50000.00, current_year_budget:55000.00, current_year_ytd:35807.48 },
  { department_code:'06', department_name:'Ambulance', account_code:'011-30', account_name:'AMBULANCE BILLING', category:'CONTRACT SERVICES', prior_year_actual:52898.07, prior_year_budget:45000.00, current_year_budget:50000.00, current_year_ytd:44914.43 },
  { department_code:'06', department_name:'Ambulance', account_code:'019-54', account_name:'AMBULANCE LOAN', category:'LOANS/NOTES', prior_year_actual:0.00, prior_year_budget:33000.00, current_year_budget:65320.00, current_year_ytd:65315.90 },
  // Sewer
  { department_code:'05', department_name:'Sewer', account_code:'004-01', account_name:'ELECTRICITY', category:'UTILITIES', prior_year_actual:84975.31, prior_year_budget:85000.00, current_year_budget:85000.00, current_year_ytd:101251.94 },
  { department_code:'05', department_name:'Sewer', account_code:'005-13', account_name:'CHEMICALS', category:'OPERATING EXPENSES', prior_year_actual:69419.33, prior_year_budget:94000.00, current_year_budget:82000.00, current_year_ytd:91894.02 },
  { department_code:'05', department_name:'Sewer', account_code:'011-25', account_name:'OLVER ASSOCIATES', category:'CONTRACT SERVICES', prior_year_actual:257000.04, prior_year_budget:260000.00, current_year_budget:280000.00, current_year_ytd:194760.73 },
  { department_code:'05', department_name:'Sewer', account_code:'011-16', account_name:'SLUDGE HAULING', category:'CONTRACT SERVICES', prior_year_actual:82999.00, prior_year_budget:90000.00, current_year_budget:85000.00, current_year_ytd:75391.53 },
  // Solid Waste
  { department_code:'14', department_name:'Solid Waste Facility', account_code:'001-01', account_name:'DEPT HEADS', category:'WAGES/SALARY', prior_year_actual:27176.73, prior_year_budget:47482.00, current_year_budget:45864.00, current_year_ytd:32699.93 },
  { department_code:'14', department_name:'Solid Waste Facility', account_code:'011-20', account_name:'MSW TIPPING FEES', category:'CONTRACT SERVICES', prior_year_actual:18391.65, prior_year_budget:33000.00, current_year_budget:33000.00, current_year_ytd:18219.37 },
  // Education
  { department_code:'29', department_name:'General Education', account_code:'300-01', account_name:'GENERAL EDUCATION', category:'GENERAL EDUCATION', prior_year_actual:1674790.64, prior_year_budget:1674791.00, current_year_budget:1751194.00, current_year_ytd:875596.80 },
  // Gov't Agency
  { department_code:'16', department_name:"Gov't Agency", account_code:'016-01', account_name:'WASH CTY TAX', category:"GOV'T AGENCY", prior_year_actual:315116.00, prior_year_budget:315116.00, current_year_budget:389780.00, current_year_ytd:703932.41 },
  // Other Muni Services
  { department_code:'17', department_name:'Other Municipal Services', account_code:'004-06', account_name:'FIRE HYDRANT', category:'UTILITIES', prior_year_actual:156200.00, prior_year_budget:156200.00, current_year_budget:212432.00, current_year_ytd:137029.00 },
  { department_code:'17', department_name:'Other Municipal Services', account_code:'017-50', account_name:'TIF REIMBURSEMENT', category:'OTHER', prior_year_actual:37347.75, prior_year_budget:255000.00, current_year_budget:80000.00, current_year_ytd:0.00 },
  // Debt Service
  { department_code:'19', department_name:'Municipality Debt Service', account_code:'019-43', account_name:'PUBLIC WORKS LOAN $530K', category:'LOANS/NOTES', prior_year_actual:0.00, prior_year_budget:0.00, current_year_budget:124035.00, current_year_ytd:124034.93 },
  { department_code:'19', department_name:'Municipality Debt Service', account_code:'019-56', account_name:'PUBLIC SAFETY BLDG LOAN', category:'LOANS/NOTES', prior_year_actual:22882.26, prior_year_budget:22890.00, current_year_budget:22890.00, current_year_ytd:22882.26 },
  { department_code:'19', department_name:'Municipality Debt Service', account_code:'019-58', account_name:'ROAD LOAN $231K', category:'LOANS/NOTES', prior_year_actual:26429.00, prior_year_budget:26429.00, current_year_budget:26429.00, current_year_ytd:26429.00 },
  // Third Party
  { department_code:'15', department_name:'Third Party Requests', account_code:'013-09', account_name:'PORTER MEMORIAL LIBRARY', category:'THIRD PARTY', prior_year_actual:26000.00, prior_year_budget:26000.00, current_year_budget:26000.00, current_year_ytd:0.00 },
  { department_code:'15', department_name:'Third Party Requests', account_code:'013-03', account_name:'DOWNEAST COMMUNITY PARTNERS', category:'THIRD PARTY', prior_year_actual:4000.00, prior_year_budget:4000.00, current_year_budget:4000.00, current_year_ytd:0.00 },
];

const STAGE_LABELS = {
  dept_head: 'Department Head',
  finance_director: 'Finance Director',
  town_manager: 'Town Manager',
  budget_committee: 'Budget Committee',
  select_board: 'Select Board',
  final: 'Final / Print',
};

const AMT_FIELD = {
  dept_head: 'dept_head_request',
  finance_director: 'fd_amount',
  town_manager: 'tm_amount',
  budget_committee: 'committee_amount',
  select_board: 'board_amount',
  final: 'final_approved_amount',
};

const fmt = n => n != null ? `$${Number(n).toLocaleString()}` : '—';

export default function BudgetWorkflow() {
  const qc = useQueryClient();
  const [activeStage, setActiveStage]   = useState('dept_head');
  const [activeDept, setActiveDept]     = useState('all');
  const [search, setSearch]             = useState('');
  const [seeding, setSeeding]           = useState(false);

  const { data: lines = [], isLoading } = useQuery({
    queryKey: ['budget_requests'],
    queryFn: () => base44.entities.BudgetRequest.filter({ fiscal_year: 'FY2027' }, '-department_code', 200),
  });

  const filtered = useMemo(() => {
    let r = lines;
    if (activeDept !== 'all') r = r.filter(l => l.department_code === activeDept);
    if (search) {
      const q = search.toLowerCase();
      r = r.filter(l => l.account_name?.toLowerCase().includes(q) || l.account_code?.includes(q) || l.department_name?.toLowerCase().includes(q));
    }
    return r;
  }, [lines, activeDept, search]);

  const deptTotals = useMemo(() => {
    const byDept = {};
    filtered.forEach(l => {
      if (!byDept[l.department_code]) byDept[l.department_code] = { name: l.department_name, request: 0, prior: 0 };
      byDept[l.department_code].request += (l[AMT_FIELD[activeStage]] ?? l.current_year_budget ?? 0);
      byDept[l.department_code].prior   += (l.current_year_budget ?? 0);
    });
    return byDept;
  }, [filtered, activeStage]);

  const grandTotal = Object.values(deptTotals).reduce((s, d) => s + d.request, 0);
  const grandPrior = Object.values(deptTotals).reduce((s, d) => s + d.prior, 0);

  // Group filtered lines by department
  const groupedByDept = useMemo(() => {
    const groups = {};
    filtered.forEach(l => {
      if (!groups[l.department_code]) groups[l.department_code] = { name: l.department_name, lines: [] };
      groups[l.department_code].lines.push(l);
    });
    return groups;
  }, [filtered]);

  const handleSeedData = async () => {
    setSeeding(true);
    try {
      const existing = await base44.entities.BudgetRequest.filter({ fiscal_year: 'FY2027' });
      if (existing.length > 0) {
        alert(`Already seeded: ${existing.length} lines exist for FY2027.`);
        return;
      }
      const toCreate = SEED_LINES.map(l => ({ ...l, fiscal_year: 'FY2027', status: 'draft', workflow_stage: 'dept_head' }));
      await base44.entities.BudgetRequest.bulkCreate(toCreate);
      qc.invalidateQueries(['budget_requests']);
    } finally {
      setSeeding(false);
    }
  };

  const STAGE_KEYS = ['dept_head', 'finance_director', 'town_manager', 'budget_committee', 'select_board', 'final'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Budget Workflow — FY2027</h1>
          <p className="text-sm text-slate-500 mt-1">Multi-stage budget approval: Dept Head → FD/TM → Committee → Select Board → Print</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {lines.length === 0 && (
            <button onClick={handleSeedData} disabled={seeding} className="flex items-center gap-2 text-xs font-bold bg-emerald-700 text-white px-3 py-2 rounded-lg hover:bg-emerald-800 disabled:opacity-50">
              <Plus className="h-3.5 w-3.5" />
              {seeding ? 'Seeding...' : 'Load FY2026 Budget Lines'}
            </button>
          )}
          <button className="flex items-center gap-2 text-xs font-bold border border-slate-200 bg-white text-slate-700 px-3 py-2 rounded-lg hover:bg-slate-50">
            <Printer className="h-3.5 w-3.5" /> Print Final Budget
          </button>
        </div>
      </div>

      {/* Workflow stage bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <BudgetWorkflowStageBar currentStage={activeStage} />
        <div className="flex gap-1.5 mt-4 flex-wrap">
          {STAGE_KEYS.map(s => (
            <button key={s} onClick={() => setActiveStage(s)}
              className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                activeStage === s ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
              }`}>
              {STAGE_LABELS[s]}
            </button>
          ))}
        </div>

        {/* Stage instructions */}
        <div className={`mt-3 rounded-lg px-3 py-2 text-xs ${
          activeStage === 'dept_head'        ? 'bg-blue-50 text-blue-800 border border-blue-200' :
          activeStage === 'finance_director' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
          activeStage === 'town_manager'     ? 'bg-purple-50 text-purple-800 border border-purple-200' :
          activeStage === 'budget_committee' ? 'bg-orange-50 text-orange-800 border border-orange-200' :
          activeStage === 'select_board'     ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                                              'bg-slate-50 text-slate-700 border border-slate-200'
        }`}>
          {activeStage === 'dept_head'        && '📋 Department heads enter their FY2027 budget request for each line item with justification notes.'}
          {activeStage === 'finance_director' && '💰 Finance Director reviews each request, applies adjustments, and adds fiscal analysis comments.'}
          {activeStage === 'town_manager'     && '🏛 Town Manager reviews the Finance Director\'s recommendations and finalizes the manager\'s recommended budget.'}
          {activeStage === 'budget_committee' && '🔍 Budget Committee reviews, questions each line, and makes final committee recommendations.'}
          {activeStage === 'select_board'     && '⚖️ Select Board makes final revisions. The approved amounts become the warrant article amounts for town vote.'}
          {activeStage === 'final'            && '🖨 Final approved budget ready for printing and publication to taxpayers.'}
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-[10px] font-bold text-slate-500 uppercase">FY2026 Budget</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{fmt(grandPrior)}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-[10px] font-bold text-slate-500 uppercase">{STAGE_LABELS[activeStage]} Total</p>
          <p className={`text-xl font-bold mt-1 ${grandTotal > grandPrior ? 'text-red-700' : 'text-emerald-700'}`}>{fmt(grandTotal)}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-[10px] font-bold text-slate-500 uppercase">Change</p>
          <p className={`text-xl font-bold mt-1 ${grandTotal - grandPrior > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
            {grandTotal - grandPrior >= 0 ? '+' : ''}{fmt(grandTotal - grandPrior)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-[10px] font-bold text-slate-500 uppercase">Line Items</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{filtered.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search account code, name, department..."
            className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 bg-white" />
        </div>
        <select value={activeDept} onChange={e => setActiveDept(e.target.value)}
          className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none">
          <option value="all">All Departments</option>
          {DEPARTMENTS.map(d => <option key={d.code} value={d.code}>{d.code} — {d.name}</option>)}
        </select>
        <button onClick={() => qc.invalidateQueries(['budget_requests'])} className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500">
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Budget lines grouped by dept */}
      {isLoading ? (
        <div className="text-center py-16 text-slate-400 text-sm">Loading budget lines...</div>
      ) : lines.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-slate-300 rounded-xl">
          <FileText className="h-10 w-10 mx-auto mb-3 text-slate-300" />
          <p className="text-sm font-semibold text-slate-600 mb-1">No FY2027 budget lines yet</p>
          <p className="text-xs text-slate-400 mb-4">Click "Load FY2026 Budget Lines" to seed from the actual budget report data</p>
          <button onClick={handleSeedData} disabled={seeding} className="text-xs font-bold bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-700 disabled:opacity-50">
            {seeding ? 'Loading...' : 'Load Budget Lines from FY2026 Data'}
          </button>
        </div>
      ) : Object.entries(groupedByDept).length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-sm">No lines match your filters.</div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedByDept).map(([deptCode, { name, lines: deptLines }]) => {
            const deptTotal = deptLines.reduce((s, l) => s + (l[AMT_FIELD[activeStage]] ?? l.current_year_budget ?? 0), 0);
            const deptPrior = deptLines.reduce((s, l) => s + (l.current_year_budget ?? 0), 0);
            const delta = deptTotal - deptPrior;
            return (
              <div key={deptCode} className="rounded-xl border border-slate-200 overflow-hidden">
                {/* Dept header */}
                <div className="flex items-center justify-between px-4 py-3 bg-slate-800 text-white">
                  <div>
                    <p className="text-xs font-bold">Dept {deptCode} — {name}</p>
                    <p className="text-[10px] text-slate-400">{deptLines.length} line items</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400">FY2026 Budget</p>
                    <p className="text-sm font-bold">{fmt(deptPrior)}</p>
                    {delta !== 0 && (
                      <p className={`text-[10px] font-semibold ${delta > 0 ? 'text-red-300' : 'text-emerald-300'}`}>
                        {delta > 0 ? '+' : ''}{fmt(delta)}
                      </p>
                    )}
                  </div>
                </div>
                {/* Lines */}
                <div className="divide-y divide-slate-100 bg-white">
                  {deptLines.map(line => (
                    <BudgetLineEditor key={line.id} line={line} activeStage={activeStage} />
                  ))}
                </div>
                {/* Dept total row */}
                <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Department Total ({STAGE_LABELS[activeStage]})</span>
                  <span className={`text-sm font-bold ${deptTotal > deptPrior ? 'text-red-700' : 'text-emerald-700'}`}>{fmt(deptTotal)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Grand total footer */}
      {lines.length > 0 && (
        <div className="rounded-xl bg-slate-900 text-white p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase">Grand Total — {STAGE_LABELS[activeStage]}</p>
            <p className="text-sm text-slate-400 mt-0.5">{filtered.length} line items shown</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{fmt(grandTotal)}</p>
            <p className={`text-xs font-semibold mt-1 ${grandTotal - grandPrior > 0 ? 'text-red-300' : 'text-emerald-300'}`}>
              {grandTotal - grandPrior >= 0 ? '+' : ''}{fmt(grandTotal - grandPrior)} vs FY2026
            </p>
          </div>
        </div>
      )}
    </div>
  );
}