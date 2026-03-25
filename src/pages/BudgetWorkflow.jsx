/**
 * BudgetWorkflow — Multi-stage FY2027 budget with full FY23–FY26 budget vs actual history.
 * Stages: Initial (Dept Head) → Manager → Budget Committee → Select Board → Approved
 * Select Board requires 3 of 5 votes for approval.
 */
import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users, DollarSign, FileText, CheckCircle2,
  AlertTriangle, Printer, Plus, Search, RefreshCw, ThumbsUp
} from 'lucide-react';
import BudgetWorkflowStageBar from '../components/budget/BudgetWorkflowStageBar';
import BudgetLineEditor from '../components/budget/BudgetLineEditor';
import SectionHeader from '../components/machias/SectionHeader';

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

// ── Seed data with FY23/24/25/26 budgets & actuals from uploaded budget report ─
const SEED_LINES = [
  // ADMINISTRATION (01)
  { department_code:'01', department_name:'Administration', account_code:'001-01', account_name:'DEPT HEADS - WAGES', category:'WAGES/SALARY',
    fy23_budget:90068, fy23_actual:62999, fy24_budget:90068, fy24_actual:75420, fy25_budget:90068, fy25_actual:62999.15, fy26_budget:92320, fy26_ytd:47867.55, manager_amount:95000 },
  { department_code:'01', department_name:'Administration', account_code:'001-02', account_name:'FULL TIME WAGES', category:'WAGES/SALARY',
    fy23_budget:241083, fy23_actual:210450, fy24_budget:241083, fy24_actual:228000, fy25_budget:241083, fy25_actual:222609.96, fy26_budget:190160, fy26_ytd:180244.77, manager_amount:195000 },
  { department_code:'01', department_name:'Administration', account_code:'002-01', account_name:'FICA', category:'BENEFITS',
    fy23_budget:27715, fy23_actual:23100, fy24_budget:27715, fy24_actual:25600, fy25_budget:27715, fy25_actual:24173.94, fy26_budget:26575, fy26_ytd:20581.86, manager_amount:27500 },
  { department_code:'01', department_name:'Administration', account_code:'002-02', account_name:'HEALTH INSURANCE', category:'BENEFITS',
    fy23_budget:108660, fy23_actual:86000, fy24_budget:108660, fy24_actual:97000, fy25_budget:108660, fy25_actual:76086.24, fy26_budget:101230, fy26_ytd:66095.66, manager_amount:105000 },
  { department_code:'01', department_name:'Administration', account_code:'005-01', account_name:'AUDIT', category:'OPERATING EXPENSES',
    fy23_budget:12000, fy23_actual:8700, fy24_budget:12000, fy24_actual:8700, fy25_budget:12000, fy25_actual:8700, fy26_budget:12000, fy26_ytd:20223.03, manager_amount:22000 },
  { department_code:'01', department_name:'Administration', account_code:'005-26', account_name:'BANK CHARGES', category:'OPERATING EXPENSES',
    fy23_budget:10000, fy23_actual:7500, fy24_budget:10000, fy24_actual:7200, fy25_budget:10000, fy25_actual:7500.49, fy26_budget:10000, fy26_ytd:0, manager_amount:10000 },
  { department_code:'01', department_name:'Administration', account_code:'008-01', account_name:'COMPUTER MAINTENANCE', category:'EQUIP MAINT',
    fy23_budget:13000, fy23_actual:16391, fy24_budget:13000, fy24_actual:15000, fy25_budget:13000, fy25_actual:16391.17, fy26_budget:13000, fy26_ytd:1746.35, manager_amount:15000 },
  { department_code:'01', department_name:'Administration', account_code:'100-00', account_name:'BANK INTEREST', category:'OTHER',
    fy23_budget:38000, fy23_actual:57795, fy24_budget:40000, fy24_actual:101156, fy25_budget:65000, fy25_actual:141903, fy26_budget:0, fy26_ytd:0, manager_amount:180000 },

  // FIRE DEPARTMENT (02)
  { department_code:'02', department_name:'Fire Department', account_code:'001-02', account_name:'FULL TIME WAGES', category:'WAGES/SALARY',
    fy23_budget:130167, fy23_actual:108000, fy24_budget:130167, fy24_actual:112000, fy25_budget:130167, fy25_actual:110494.83, fy26_budget:135440, fy26_ytd:92941.75, manager_amount:139000 },
  { department_code:'02', department_name:'Fire Department', account_code:'001-04', account_name:'VOLUNTEER/STIPEND', category:'WAGES/SALARY',
    fy23_budget:58000, fy23_actual:54000, fy24_budget:58000, fy24_actual:56000, fy25_budget:58000, fy25_actual:57999.86, fy26_budget:60900, fy26_ytd:72478.22, manager_amount:63000 },
  { department_code:'02', department_name:'Fire Department', account_code:'002-02', account_name:'HEALTH INSURANCE', category:'BENEFITS',
    fy23_budget:43350, fy23_actual:40000, fy24_budget:43350, fy24_actual:41000, fy25_budget:43350, fy25_actual:43671.39, fy26_budget:47246, fy26_ytd:37187.79, manager_amount:49000 },
  { department_code:'02', department_name:'Fire Department', account_code:'006-06', account_name:'WORKERS COMP', category:'INSURANCES',
    fy23_budget:25000, fy23_actual:18000, fy24_budget:25000, fy24_actual:17000, fy25_budget:25000, fy25_actual:18330.98, fy26_budget:25000, fy26_ytd:12836.88, manager_amount:25000 },
  { department_code:'02', department_name:'Fire Department', account_code:'008-10', account_name:'VEHICLE MAINTENANCE', category:'EQUIP MAINT',
    fy23_budget:12000, fy23_actual:9800, fy24_budget:12000, fy24_actual:10500, fy25_budget:12000, fy25_actual:11362.35, fy26_budget:12000, fy26_ytd:10633.65, manager_amount:14000 },
  { department_code:'02', department_name:'Fire Department', account_code:'010-04', account_name:'TURNOUT GEAR', category:'CLOTHING',
    fy23_budget:10000, fy23_actual:9200, fy24_budget:10000, fy24_actual:12000, fy25_budget:10000, fy25_actual:14649.42, fy26_budget:10000, fy26_ytd:0, manager_amount:22000 },
  { department_code:'02', department_name:'Fire Department', account_code:'200-01', account_name:'CONTRACTS', category:'CONTRACT SERVICES',
    fy23_budget:14000, fy23_actual:16000, fy24_budget:18000, fy24_actual:18000, fy25_budget:18000, fy25_actual:22000, fy26_budget:0, fy26_ytd:0, manager_amount:22000 },

  // POLICE (03)
  { department_code:'03', department_name:'Police', account_code:'001-01', account_name:'DEPT HEADS', category:'WAGES/SALARY',
    fy23_budget:80232, fy23_actual:76000, fy24_budget:80232, fy24_actual:78000, fy25_budget:80232, fy25_actual:80246.40, fy26_budget:84244, fy26_ytd:63446.05, manager_amount:87000 },
  { department_code:'03', department_name:'Police', account_code:'001-02', account_name:'FULL TIME WAGES', category:'WAGES/SALARY',
    fy23_budget:214980, fy23_actual:190000, fy24_budget:214980, fy24_actual:200000, fy25_budget:214980, fy25_actual:198126.96, fy26_budget:231426, fy26_ytd:153480.66, manager_amount:238000 },
  { department_code:'03', department_name:'Police', account_code:'002-04', account_name:'MEPERS RETIREMENT', category:'BENEFITS',
    fy23_budget:36075, fy23_actual:34000, fy24_budget:36075, fy24_actual:35000, fy25_budget:36075, fy25_actual:34825.85, fy26_budget:40075, fy26_ytd:28627.22, manager_amount:41000 },
  { department_code:'03', department_name:'Police', account_code:'008-09', account_name:'GAS/DIESEL', category:'EQUIP MAINT',
    fy23_budget:12000, fy23_actual:10141, fy24_budget:12000, fy24_actual:11000, fy25_budget:12000, fy25_actual:10141.60, fy26_budget:13000, fy26_ytd:13803.58, manager_amount:14000 },
  { department_code:'03', department_name:'Police', account_code:'012-05', account_name:'VEHICLE REPLACEMENT', category:'CAPITAL PROJECTS',
    fy23_budget:0, fy23_actual:0, fy24_budget:0, fy24_actual:49795, fy25_budget:0, fy25_actual:49795.71, fy26_budget:115000, fy26_ytd:22762.38, manager_amount:50000 },

  // PUBLIC WORKS (04)
  { department_code:'04', department_name:'Public Works', account_code:'001-01', account_name:'DEPT HEADS', category:'WAGES/SALARY',
    fy23_budget:65035, fy23_actual:72000, fy24_budget:65035, fy24_actual:74000, fy25_budget:65035, fy25_actual:75041.21, fy26_budget:68287, fy26_ytd:51214.81, manager_amount:70000 },
  { department_code:'04', department_name:'Public Works', account_code:'001-02', account_name:'FULL TIME WAGES', category:'WAGES/SALARY',
    fy23_budget:132531, fy23_actual:115000, fy24_budget:132531, fy24_actual:120000, fy25_budget:132531, fy25_actual:119933.63, fy26_budget:140465, fy26_ytd:92313.61, manager_amount:145000 },
  { department_code:'04', department_name:'Public Works', account_code:'005-19', account_name:'SAND/SALT', category:'OPERATING EXPENSES',
    fy23_budget:55000, fy23_actual:48902, fy24_budget:55000, fy24_actual:51000, fy25_budget:55000, fy25_actual:48902.20, fy26_budget:58000, fy26_ytd:53020.71, manager_amount:62000 },
  { department_code:'04', department_name:'Public Works', account_code:'008-09', account_name:'GAS/DIESEL', category:'EQUIP MAINT',
    fy23_budget:23000, fy23_actual:14611, fy24_budget:23000, fy24_actual:16000, fy25_budget:23000, fy25_actual:14611.04, fy26_budget:23000, fy26_ytd:17270.03, manager_amount:25000 },
  { department_code:'04', department_name:'Public Works', account_code:'008-10', account_name:'VEHICLE MAINTENANCE', category:'EQUIP MAINT',
    fy23_budget:37000, fy23_actual:52122, fy24_budget:37000, fy24_actual:48000, fy25_budget:37000, fy25_actual:52122.22, fy26_budget:42000, fy26_ytd:53213.42, manager_amount:50000 },
  { department_code:'04', department_name:'Public Works', account_code:'310-01', account_name:'STATE CONTRACT 1A', category:'CONTRACT SERVICES',
    fy23_budget:51000, fy23_actual:59750, fy24_budget:51000, fy24_actual:60945, fy25_budget:62194, fy25_actual:62164, fy26_budget:63407, fy26_ytd:823, manager_amount:65000 },

  // AMBULANCE (06)
  { department_code:'06', department_name:'Ambulance', account_code:'001-01', account_name:'DEPT HEADS', category:'WAGES/SALARY',
    fy23_budget:74880, fy23_actual:48000, fy24_budget:74880, fy24_actual:50000, fy25_budget:74880, fy25_actual:51080, fy26_budget:78624, fy26_ytd:59292, manager_amount:81000 },
  { department_code:'06', department_name:'Ambulance', account_code:'001-02', account_name:'FULL TIME WAGES', category:'WAGES/SALARY',
    fy23_budget:189696, fy23_actual:120000, fy24_budget:189696, fy24_actual:130000, fy25_budget:189696, fy25_actual:129403.56, fy26_budget:385000, fy26_ytd:235398.80, manager_amount:395000 },
  { department_code:'06', department_name:'Ambulance', account_code:'005-16', account_name:'MEDICAL SUPPLIES', category:'OPERATING EXPENSES',
    fy23_budget:50000, fy23_actual:44000, fy24_budget:50000, fy24_actual:47000, fy25_budget:50000, fy25_actual:49901.06, fy26_budget:55000, fy26_ytd:35807.48, manager_amount:57000 },
  { department_code:'06', department_name:'Ambulance', account_code:'011-30', account_name:'AMBULANCE BILLING', category:'CONTRACT SERVICES',
    fy23_budget:45000, fy23_actual:50000, fy24_budget:45000, fy24_actual:51000, fy25_budget:45000, fy25_actual:52898.07, fy26_budget:50000, fy26_ytd:44914.43, manager_amount:53000 },
  { department_code:'06', department_name:'Ambulance', account_code:'019-54', account_name:'AMBULANCE LOAN', category:'LOANS/NOTES',
    fy23_budget:33000, fy23_actual:0, fy24_budget:33000, fy24_actual:0, fy25_budget:33000, fy25_actual:0, fy26_budget:65320, fy26_ytd:65315.90, manager_amount:175100 },

  // SEWER (05)
  { department_code:'05', department_name:'Sewer', account_code:'004-01', account_name:'ELECTRICITY', category:'UTILITIES',
    fy23_budget:85000, fy23_actual:80000, fy24_budget:85000, fy24_actual:83000, fy25_budget:85000, fy25_actual:84975.31, fy26_budget:85000, fy26_ytd:101251.94, manager_amount:110000 },
  { department_code:'05', department_name:'Sewer', account_code:'005-13', account_name:'CHEMICALS', category:'OPERATING EXPENSES',
    fy23_budget:94000, fy23_actual:65000, fy24_budget:94000, fy24_actual:70000, fy25_budget:94000, fy25_actual:69419.33, fy26_budget:82000, fy26_ytd:91894.02, manager_amount:95000 },
  { department_code:'05', department_name:'Sewer', account_code:'011-25', account_name:'OLVER ASSOCIATES', category:'CONTRACT SERVICES',
    fy23_budget:260000, fy23_actual:252000, fy24_budget:260000, fy24_actual:255000, fy25_budget:260000, fy25_actual:257000.04, fy26_budget:280000, fy26_ytd:194760.73, manager_amount:290000 },
  { department_code:'05', department_name:'Sewer', account_code:'011-16', account_name:'SLUDGE HAULING', category:'CONTRACT SERVICES',
    fy23_budget:90000, fy23_actual:80000, fy24_budget:90000, fy24_actual:82000, fy25_budget:90000, fy25_actual:82999, fy26_budget:85000, fy26_ytd:75391.53, manager_amount:90000 },
  { department_code:'05', department_name:'Sewer', account_code:'120-01', account_name:'SEWER INTEREST', category:'OTHER',
    fy23_budget:5000, fy23_actual:2819, fy24_budget:5000, fy24_actual:5139, fy25_budget:5000, fy25_actual:3761, fy26_budget:5000, fy26_ytd:2783, manager_amount:5500 },

  // SOLID WASTE (14)
  { department_code:'14', department_name:'Solid Waste Facility', account_code:'001-01', account_name:'DEPT HEADS', category:'WAGES/SALARY',
    fy23_budget:47482, fy23_actual:25000, fy24_budget:47482, fy24_actual:26000, fy25_budget:47482, fy25_actual:27176.73, fy26_budget:45864, fy26_ytd:32699.93, manager_amount:47000 },
  { department_code:'14', department_name:'Solid Waste Facility', account_code:'011-20', account_name:'MSW TIPPING FEES', category:'CONTRACT SERVICES',
    fy23_budget:33000, fy23_actual:18000, fy24_budget:33000, fy24_actual:19000, fy25_budget:33000, fy25_actual:18391.65, fy26_budget:33000, fy26_ytd:18219.37, manager_amount:35000 },

  // GENERAL EDUCATION (29)
  { department_code:'29', department_name:'General Education', account_code:'300-01', account_name:'GENERAL EDUCATION', category:'GENERAL EDUCATION',
    fy23_budget:1674791, fy23_actual:1674791, fy24_budget:1674791, fy24_actual:1674791, fy25_budget:1674791, fy25_actual:1674790.64, fy26_budget:1781194, fy26_ytd:875596.80, manager_amount:1781194 },

  // GOV'T AGENCY (16)
  { department_code:'16', department_name:"Gov't Agency", account_code:'016-01', account_name:'WASH CTY TAX', category:"GOV'T AGENCY",
    fy23_budget:315116, fy23_actual:315116, fy24_budget:315116, fy24_actual:315116, fy25_budget:315116, fy25_actual:315116, fy26_budget:389780, fy26_ytd:703932.41, manager_amount:389780 },

  // OTHER MUNICIPAL SERVICES (17)
  { department_code:'17', department_name:'Other Municipal Services', account_code:'004-06', account_name:'FIRE HYDRANT', category:'UTILITIES',
    fy23_budget:156200, fy23_actual:156200, fy24_budget:156200, fy24_actual:156200, fy25_budget:156200, fy25_actual:156200, fy26_budget:212432, fy26_ytd:137029, manager_amount:212432 },
  { department_code:'17', department_name:'Other Municipal Services', account_code:'017-50', account_name:'TIF REIMBURSEMENT', category:'OTHER',
    fy23_budget:255000, fy23_actual:37347, fy24_budget:255000, fy24_actual:40000, fy25_budget:255000, fy25_actual:37347.75, fy26_budget:80000, fy26_ytd:0, manager_amount:80000 },

  // MUNICIPALITY DEBT SERVICE (19)
  { department_code:'19', department_name:'Municipality Debt Service', account_code:'019-43', account_name:'PUBLIC WORKS LOAN $530K', category:'LOANS/NOTES',
    fy23_budget:0, fy23_actual:0, fy24_budget:0, fy24_actual:0, fy25_budget:0, fy25_actual:0, fy26_budget:124035, fy26_ytd:124034.93, manager_amount:124035 },
  { department_code:'19', department_name:'Municipality Debt Service', account_code:'019-56', account_name:'PUBLIC SAFETY BLDG LOAN', category:'LOANS/NOTES',
    fy23_budget:22890, fy23_actual:22882, fy24_budget:22890, fy24_actual:22882, fy25_budget:22890, fy25_actual:22882.26, fy26_budget:22890, fy26_ytd:22882.26, manager_amount:22890 },
  { department_code:'19', department_name:'Municipality Debt Service', account_code:'019-58', account_name:'ROAD LOAN $231K', category:'LOANS/NOTES',
    fy23_budget:26429, fy23_actual:26429, fy24_budget:26429, fy24_actual:26429, fy25_budget:26429, fy25_actual:26429, fy26_budget:26429, fy26_ytd:26429, manager_amount:26429 },

  // THIRD PARTY (15)
  { department_code:'15', department_name:'Third Party Requests', account_code:'013-09', account_name:'PORTER MEMORIAL LIBRARY', category:'THIRD PARTY',
    fy23_budget:26000, fy23_actual:26000, fy24_budget:26000, fy24_actual:26000, fy25_budget:26000, fy25_actual:26000, fy26_budget:26000, fy26_ytd:0, manager_amount:26000 },
  { department_code:'15', department_name:'Third Party Requests', account_code:'013-03', account_name:'DOWNEAST COMMUNITY PARTNERS', category:'THIRD PARTY',
    fy23_budget:4000, fy23_actual:4000, fy24_budget:4000, fy24_actual:4000, fy25_budget:4000, fy25_actual:4000, fy26_budget:4000, fy26_ytd:0, manager_amount:4000 },
  { department_code:'15', department_name:'Third Party Requests', account_code:'013-10', account_name:'WASHINGTON CO COUNCIL OF GOVTS', category:'THIRD PARTY',
    fy23_budget:2500, fy23_actual:2500, fy24_budget:2500, fy24_actual:2500, fy25_budget:2500, fy25_actual:2500, fy26_budget:2500, fy26_ytd:0, manager_amount:2500 },

  // AIRPORT (12)
  { department_code:'12', department_name:'Airport', account_code:'190-01', account_name:'RENTAL/LEASE INCOME', category:'OTHER',
    fy23_budget:0, fy23_actual:0, fy24_budget:0, fy24_actual:0, fy25_budget:0, fy25_actual:0, fy26_budget:0, fy26_ytd:0, manager_amount:0 },
  { department_code:'12', department_name:'Airport', account_code:'005-30', account_name:'AIRPORT OPERATING', category:'OPERATING EXPENSES',
    fy23_budget:15000, fy23_actual:12000, fy24_budget:15000, fy24_actual:13000, fy25_budget:15000, fy25_actual:14000, fy26_budget:15000, fy26_ytd:8000, manager_amount:12473 },

  // PUBLIC SAFETY BUILDING (07)
  { department_code:'07', department_name:'Public Safety Building', account_code:'001-00', account_name:'PSB DEBT SERVICE', category:'LOANS/NOTES',
    fy23_budget:36250, fy23_actual:36250, fy24_budget:36250, fy24_actual:36250, fy25_budget:36250, fy25_actual:36250, fy26_budget:36250, fy26_ytd:0, manager_amount:36250 },

  // COUNTY TAX (851 / 16)
  { department_code:'16', department_name:"Gov't Agency", account_code:'851-01', account_name:'COUNTY TAX ASSESSMENT', category:"GOV'T AGENCY",
    fy23_budget:0, fy23_actual:0, fy24_budget:378000, fy24_actual:378000, fy25_budget:380000, fy25_actual:381000, fy26_budget:389780, fy26_ytd:389780, manager_amount:389780 },
];

const STAGE_KEYS   = ['initial','manager','budget_committee','select_board','approved'];
const STAGE_LABELS = {
  initial:          'Initial (Dept Head)',
  manager:          'Manager',
  budget_committee: 'Budget Committee',
  select_board:     'Select Board',
  approved:         'Approved',
};
const AMT_FIELD = {
  initial:          'initial_request',
  manager:          'manager_amount',
  budget_committee: 'committee_amount',
  select_board:     'board_amount',
  approved:         'final_approved_amount',
};

const fmt = n => n != null ? `$${Number(n).toLocaleString()}` : '—';

const STAGE_COLORS = {
  initial:          'bg-blue-50 text-blue-800 border-blue-200',
  manager:          'bg-purple-50 text-purple-800 border-purple-200',
  budget_committee: 'bg-orange-50 text-orange-800 border-orange-200',
  select_board:     'bg-emerald-50 text-emerald-800 border-emerald-200',
  approved:         'bg-slate-50 text-slate-700 border-slate-200',
};
const STAGE_HINTS = {
  initial:          '📋 Department heads enter their FY2027 budget request for each line item with justification notes.',
  manager:          '🏛 Town Manager reviews departmental requests and enters manager-recommended amounts.',
  budget_committee: '🔍 Budget Committee reviews and adjusts manager recommendations.',
  select_board:     '⚖️ Select Board votes. Each line needs 3 of 5 yes votes to move to Approved.',
  approved:         '✅ Final approved budget — locked for printing and publication.',
};

export default function BudgetWorkflow() {
  const qc = useQueryClient();
  const [activeStage, setActiveStage] = useState('manager');
  const [activeDept, setActiveDept]   = useState('all');
  const [search, setSearch]           = useState('');
  const [seeding, setSeeding]         = useState(false);

  const { data: lines = [], isLoading } = useQuery({
    queryKey: ['budget_requests'],
    queryFn:  () => base44.entities.BudgetRequest.filter({ fiscal_year: 'FY2027' }, '-department_code', 300),
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

  const groupedByDept = useMemo(() => {
    const groups = {};
    filtered.forEach(l => {
      if (!groups[l.department_code]) groups[l.department_code] = { name: l.department_name, lines: [] };
      groups[l.department_code].lines.push(l);
    });
    return groups;
  }, [filtered]);

  const getAmt = (l) => l[AMT_FIELD[activeStage]] ?? (activeStage === 'initial' ? (l.fy26_budget ?? l.current_year_budget ?? 0) : null);

  const grandTotal = filtered.reduce((s, l) => s + (getAmt(l) ?? 0), 0);
  const grandFY26  = filtered.reduce((s, l) => s + (l.fy26_budget ?? l.current_year_budget ?? 0), 0);
  const approvedCount = lines.filter(l => l.status === 'approved' || (l.board_votes_yes ?? 0) >= 3).length;

  const handleSeedData = async () => {
    setSeeding(true);
    try {
      const existing = await base44.entities.BudgetRequest.filter({ fiscal_year: 'FY2027' });
      if (existing.length > 0) {
        alert(`Already seeded: ${existing.length} lines exist for FY2027.`);
        return;
      }
      const toCreate = SEED_LINES.map(l => ({
        ...l,
        fiscal_year: 'FY2027',
        status: 'draft',
        workflow_stage: 'initial',
        prior_year_actual:   l.fy25_actual,
        prior_year_budget:   l.fy25_budget,
        current_year_budget: l.fy26_budget,
        current_year_ytd:    l.fy26_ytd,
        tm_amount: l.manager_amount,
      }));
      await base44.entities.BudgetRequest.bulkCreate(toCreate);
      qc.invalidateQueries(['budget_requests']);
    } finally {
      setSeeding(false);
    }
  };

  const handleApplyManagerAmounts = async () => {
    if (!confirm('This will write the Manager FY27 column amounts from the budget spreadsheet into all matching FY2027 budget lines. Continue?')) return;
    setSeeding(true);
    try {
      const existing = await base44.entities.BudgetRequest.filter({ fiscal_year: 'FY2027' });
      if (existing.length === 0) { alert('No FY2027 lines found. Load budget lines first.'); return; }

      // Build a lookup from account_code → manager_amount from SEED_LINES
      const seedMap = {};
      SEED_LINES.forEach(s => { seedMap[s.account_code] = s.manager_amount; });

      let updated = 0;
      await Promise.all(existing.map(async rec => {
        const mgr = seedMap[rec.account_code];
        if (mgr != null) {
          await base44.entities.BudgetRequest.update(rec.id, {
            manager_amount: mgr,
            tm_amount: mgr,
            manager_reviewed_at: new Date().toISOString(),
            workflow_stage: 'manager',
          });
          updated++;
        }
      }));
      qc.invalidateQueries(['budget_requests']);
      alert(`Manager amounts applied to ${updated} line items.`);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Budget Workflow — FY2027</h1>
          <p className="text-sm text-slate-500 mt-1">
            Full FY2023–2026 history with multi-stage FY2027 approval: Initial → Manager → Budget Committee → Select Board (3/5 vote) → Approved
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {lines.length === 0 && (
            <button onClick={handleSeedData} disabled={seeding} className="flex items-center gap-2 text-xs font-bold bg-emerald-700 text-white px-3 py-2 rounded-lg hover:bg-emerald-800 disabled:opacity-50">
              <Plus className="h-3.5 w-3.5" />
              {seeding ? 'Seeding...' : 'Load FY27 Budget Lines'}
            </button>
          )}
          {lines.length > 0 && (
            <button onClick={handleApplyManagerAmounts} disabled={seeding}
              className="flex items-center gap-2 text-xs font-bold border border-purple-300 bg-purple-50 text-purple-800 px-3 py-2 rounded-lg hover:bg-purple-100 disabled:opacity-50">
              <RefreshCw className={`h-3.5 w-3.5 ${seeding ? 'animate-spin' : ''}`} />
              {seeding ? 'Applying...' : 'Apply Manager FY27 Amounts'}
            </button>
          )}
          <button className="flex items-center gap-2 text-xs font-bold border border-slate-200 bg-white text-slate-700 px-3 py-2 rounded-lg hover:bg-slate-50">
            <Printer className="h-3.5 w-3.5" /> Print Final Budget
          </button>
          <button onClick={() => qc.invalidateQueries(['budget_requests'])} className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Stage selector */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Approval Stage</p>
        <div className="flex gap-1.5 flex-wrap">
          {STAGE_KEYS.map(s => (
            <button key={s} onClick={() => setActiveStage(s)}
              className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                activeStage === s ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
              }`}>
              {STAGE_LABELS[s]}
            </button>
          ))}
        </div>
        <div className={`rounded-lg px-3 py-2 text-xs border ${STAGE_COLORS[activeStage]}`}>
          {STAGE_HINTS[activeStage]}
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-3">
          <p className="text-[10px] font-bold text-slate-500 uppercase">FY26 Budget</p>
          <p className="text-lg font-bold text-slate-900 mt-1">{fmt(grandFY26)}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-3">
          <p className="text-[10px] font-bold text-slate-500 uppercase">{STAGE_LABELS[activeStage]}</p>
          <p className={`text-lg font-bold mt-1 ${grandTotal > grandFY26 ? 'text-red-700' : 'text-emerald-700'}`}>{fmt(grandTotal)}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-3">
          <p className="text-[10px] font-bold text-slate-500 uppercase">Change vs FY26</p>
          <p className={`text-lg font-bold mt-1 ${grandTotal - grandFY26 > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
            {grandTotal - grandFY26 >= 0 ? '+' : ''}{fmt(grandTotal - grandFY26)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-3">
          <p className="text-[10px] font-bold text-slate-500 uppercase">Approved Lines</p>
          <p className="text-lg font-bold mt-1 text-emerald-700">{approvedCount} / {lines.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-3">
          <p className="text-[10px] font-bold text-slate-500 uppercase">Line Items Shown</p>
          <p className="text-lg font-bold text-slate-900 mt-1">{filtered.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search account, name, department..."
            className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 bg-white" />
        </div>
        <select value={activeDept} onChange={e => setActiveDept(e.target.value)}
          className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none">
          <option value="all">All Departments</option>
          {DEPARTMENTS.map(d => <option key={d.code} value={d.code}>{d.code} — {d.name}</option>)}
        </select>
      </div>

      {/* Budget lines */}
      {isLoading ? (
        <div className="text-center py-16 text-slate-400 text-sm">Loading budget lines...</div>
      ) : lines.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-slate-300 rounded-xl">
          <FileText className="h-10 w-10 mx-auto mb-3 text-slate-300" />
          <p className="text-sm font-semibold text-slate-600 mb-1">No FY2027 budget lines yet</p>
          <p className="text-xs text-slate-400 mb-4">Click "Load FY27 Budget Lines" to seed from the actual FY23–FY26 budget data</p>
          <button onClick={handleSeedData} disabled={seeding} className="text-xs font-bold bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-700 disabled:opacity-50">
            {seeding ? 'Loading...' : 'Load Budget Lines'}
          </button>
        </div>
      ) : Object.entries(groupedByDept).length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-sm">No lines match your filters.</div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedByDept).map(([deptCode, { name, lines: deptLines }]) => {
            const deptTotal  = deptLines.reduce((s, l) => s + (getAmt(l) ?? 0), 0);
            const deptFY26   = deptLines.reduce((s, l) => s + (l.fy26_budget ?? l.current_year_budget ?? 0), 0);
            const delta      = deptTotal - deptFY26;
            const deptApproved = deptLines.filter(l => l.status === 'approved' || (l.board_votes_yes ?? 0) >= 3).length;

            return (
              <div key={deptCode} className="rounded-xl border border-slate-200 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-slate-800 text-white">
                  <div>
                    <p className="text-xs font-bold">Dept {deptCode} — {name}</p>
                    <p className="text-[10px] text-slate-400">{deptLines.length} line items
                      {deptApproved > 0 && <span className="ml-2 text-emerald-400">· {deptApproved} approved</span>}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400">FY26 Budget → {STAGE_LABELS[activeStage]}</p>
                    <p className="text-sm font-bold">{fmt(deptFY26)} → {fmt(deptTotal)}</p>
                    {delta !== 0 && (
                      <p className={`text-[10px] font-semibold ${delta > 0 ? 'text-red-300' : 'text-emerald-300'}`}>
                        {delta > 0 ? '+' : ''}{fmt(delta)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="bg-white">
                  {deptLines.map(line => (
                    <BudgetLineEditor key={line.id} line={line} activeStage={activeStage} />
                  ))}
                </div>
                <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Dept Total — {STAGE_LABELS[activeStage]}</span>
                  <span className={`text-sm font-bold ${deptTotal > deptFY26 ? 'text-red-700' : 'text-emerald-700'}`}>{fmt(deptTotal)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Grand total */}
      {lines.length > 0 && (
        <div className="rounded-xl bg-slate-900 text-white p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase">Grand Total — {STAGE_LABELS[activeStage]}</p>
            <p className="text-sm text-slate-400 mt-0.5">{filtered.length} line items · {approvedCount} approved</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{fmt(grandTotal)}</p>
            <p className={`text-xs font-semibold mt-1 ${grandTotal - grandFY26 > 0 ? 'text-red-300' : 'text-emerald-300'}`}>
              {grandTotal - grandFY26 >= 0 ? '+' : ''}{fmt(grandTotal - grandFY26)} vs FY26
            </p>
          </div>
        </div>
      )}
    </div>
  );
}