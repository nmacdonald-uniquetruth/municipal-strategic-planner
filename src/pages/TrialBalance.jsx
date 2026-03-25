/**
 * TrialBalance — FY2026 Trial Balance as of 03/24/2026
 * Full expense AND revenue lines for all departments.
 * Source: Machias Trial Balance report + FY2027 budget worksheet data.
 */
import React, { useState, useMemo } from 'react';
import SectionHeader from '@/components/machias/SectionHeader';
import { BarChart2, AlertTriangle, Search, ChevronDown, ChevronRight, TrendingDown, TrendingUp } from 'lucide-react';

const fmt = n => `$${Math.round(Math.abs(n || 0)).toLocaleString()}`;
const fmtSigned = n => n >= 0 ? `+$${Math.round(n).toLocaleString()}` : `-$${Math.round(Math.abs(n)).toLocaleString()}`;
const pctUsed = (spent, budget) => budget > 0 ? Math.min(((spent / budget) * 100), 999).toFixed(1) : '—';

// ── type: 'E' = expense, 'R' = revenue ──────────────────────────────────────
const TB = [
  // ── REVENUE ─────────────────────────────────────────────────────────────────
  // General Fund Revenue
  { dept:'Revenue — General Fund',   dept_code:'R01', type:'R', account:'R 01-100-01', name:'PROPERTY TAX LEVY',               category:'TAX',           budget:2871000,  ytd:2871000,   balance:0 },
  { dept:'Revenue — General Fund',   dept_code:'R01', type:'R', account:'R 01-100-02', name:'EXCISE TAX — MOTOR VEHICLE',       category:'TAX',           budget:420000,   ytd:390000,    balance:30000 },
  { dept:'Revenue — General Fund',   dept_code:'R01', type:'R', account:'R 01-100-03', name:'EXCISE TAX — BOATS',               category:'TAX',           budget:12000,    ytd:10200,     balance:1800 },
  { dept:'Revenue — General Fund',   dept_code:'R01', type:'R', account:'R 01-200-01', name:'STATE REVENUE SHARING',            category:'STATE AID',     budget:280000,   ytd:183740,    balance:96260 },
  { dept:'Revenue — General Fund',   dept_code:'R01', type:'R', account:'R 01-200-02', name:'HOMESTEAD EXEMPTION',              category:'STATE AID',     budget:142000,   ytd:0,         balance:142000 },
  { dept:'Revenue — General Fund',   dept_code:'R01', type:'R', account:'R 01-200-03', name:'BETE REIMBURSEMENT',               category:'STATE AID',     budget:48000,    ytd:0,         balance:48000 },
  { dept:'Revenue — General Fund',   dept_code:'R01', type:'R', account:'R 01-200-04', name:'LRAP STATE AID — ROADS',           category:'STATE AID',     budget:20724,    ytd:0,         balance:20724 },
  { dept:'Revenue — General Fund',   dept_code:'R01', type:'R', account:'R 01-200-05', name:'TREE GROWTH REIMBURSEMENT',        category:'STATE AID',     budget:8000,     ytd:0,         balance:8000 },
  { dept:'Revenue — General Fund',   dept_code:'R01', type:'R', account:'R 01-300-01', name:'INTEREST ON INVESTMENTS',          category:'INVESTMENT',    budget:180000,   ytd:141903,    balance:38097 },
  { dept:'Revenue — General Fund',   dept_code:'R01', type:'R', account:'R 01-400-01', name:'PERMITS & FEES',                   category:'FEES',          budget:15000,    ytd:12500,     balance:2500 },
  { dept:'Revenue — General Fund',   dept_code:'R01', type:'R', account:'R 01-400-02', name:'CODE ENFORCEMENT FEES',            category:'FEES',          budget:8000,     ytd:6300,      balance:1700 },
  { dept:'Revenue — General Fund',   dept_code:'R01', type:'R', account:'R 01-400-03', name:'RECORDING FEES',                   category:'FEES',          budget:2500,     ytd:1800,      balance:700 },
  { dept:'Revenue — General Fund',   dept_code:'R01', type:'R', account:'R 01-500-01', name:'PLUMBING PERMIT FEES',             category:'FEES',          budget:4000,     ytd:3200,      balance:800 },
  { dept:'Revenue — General Fund',   dept_code:'R01', type:'R', account:'R 01-600-01', name:'POLICE — SCHOOL RESOURCE OFFICER', category:'CONTRACTS',     budget:20000,    ytd:11595,     balance:8405 },
  { dept:'Revenue — General Fund',   dept_code:'R01', type:'R', account:'R 01-600-02', name:'POLICE — MACHIASPORT CONTRACT',    category:'CONTRACTS',     budget:20000,    ytd:14520,     balance:5480 },
  { dept:'Revenue — General Fund',   dept_code:'R01', type:'R', account:'R 01-700-01', name:'MISC REVENUE',                     category:'MISC',          budget:25000,    ytd:18400,     balance:6600 },
  { dept:'Revenue — General Fund',   dept_code:'R01', type:'R', account:'R 01-700-02', name:'GRANTS / POLICE DEPT',             category:'GRANTS',        budget:0,        ytd:15000,     balance:-15000 },
  { dept:'Revenue — General Fund',   dept_code:'R01', type:'R', account:'R 01-700-03', name:'GRANTS / ADMINISTRATION',          category:'GRANTS',        budget:0,        ytd:38163.63,  balance:-38163.63 },

  // Ambulance Fund Revenue
  { dept:'Revenue — Ambulance Fund', dept_code:'R06', type:'R', account:'R 06-001-01', name:'EMS BILLING — COMSTAR',            category:'EMS BILLING',   budget:1085000,  ytd:852300,    balance:232700 },
  { dept:'Revenue — Ambulance Fund', dept_code:'R06', type:'R', account:'R 06-001-02', name:'EMS BILLING — DIRECT PAY',         category:'EMS BILLING',   budget:35000,    ytd:28200,     balance:6800 },
  { dept:'Revenue — Ambulance Fund', dept_code:'R06', type:'R', account:'R 06-200-01', name:'STATE EMS SUBSIDY',                category:'STATE AID',     budget:12000,    ytd:9200,      balance:2800 },
  { dept:'Revenue — Ambulance Fund', dept_code:'R06', type:'R', account:'R 06-300-01', name:'TOWN OF MACHIASPORT — CONTRACT',   category:'CONTRACTS',     budget:20000,    ytd:20000,     balance:0 },
  { dept:'Revenue — Ambulance Fund', dept_code:'R06', type:'R', account:'R 06-300-02', name:'OTHER TOWN CONTRACTS',             category:'CONTRACTS',     budget:30000,    ytd:22000,     balance:8000 },
  { dept:'Revenue — Ambulance Fund', dept_code:'R06', type:'R', account:'R 06-400-01', name:'TRANSFER FROM GENERAL FUND',       category:'TRANSFER',      budget:45000,    ytd:45000,     balance:0 },

  // Sewer Fund Revenue
  { dept:'Revenue — Sewer Fund',     dept_code:'R05', type:'R', account:'R 05-001-01', name:'SEWER USER FEES',                  category:'USER FEES',     budget:595000,   ytd:456800,    balance:138200 },
  { dept:'Revenue — Sewer Fund',     dept_code:'R05', type:'R', account:'R 05-001-02', name:'CONNECTION FEES',                  category:'USER FEES',     budget:5000,     ytd:3200,      balance:1800 },
  { dept:'Revenue — Sewer Fund',     dept_code:'R05', type:'R', account:'R 05-200-01', name:'DEP / SRF GRANT',                  category:'GRANTS',        budget:0,        ytd:0,         balance:0 },
  { dept:'Revenue — Sewer Fund',     dept_code:'R05', type:'R', account:'R 05-300-01', name:'INTEREST ON INVESTMENTS',          category:'INVESTMENT',    budget:8000,     ytd:5800,      balance:2200 },

  // Solid Waste Revenue
  { dept:'Revenue — Solid Waste',    dept_code:'R14', type:'R', account:'R 14-001-01', name:'TIPPING FEES — COMMERCIAL',        category:'FEES',          budget:42000,    ytd:32100,     balance:9900 },
  { dept:'Revenue — Solid Waste',    dept_code:'R14', type:'R', account:'R 14-001-02', name:'RECYCLABLES REVENUE',              category:'FEES',          budget:8000,     ytd:4800,      balance:3200 },
  { dept:'Revenue — Solid Waste',    dept_code:'R14', type:'R', account:'R 14-200-01', name:'TRANSFER FROM GF',                 category:'TRANSFER',      budget:21000,    ytd:21000,     balance:0 },

  // Tel Center Revenue
  { dept:'Revenue — Tel Center',     dept_code:'R20', type:'R', account:'R 20-001-01', name:'TELEBUSINESS TENANT RENT',         category:'RENT',          budget:60000,    ytd:45200,     balance:14800 },
  { dept:'Revenue — Tel Center',     dept_code:'R20', type:'R', account:'R 20-001-02', name:'COMMON AREA FEES',                 category:'RENT',          budget:8000,     ytd:5800,      balance:2200 },
  { dept:'Revenue — Tel Center',     dept_code:'R20', type:'R', account:'R 20-200-01', name:'TRANSFER FROM GF',                 category:'TRANSFER',      budget:18525,    ytd:18525,     balance:0 },

  // ── EXPENSES ─────────────────────────────────────────────────────────────────
  // ADMINISTRATION (01)
  { dept:'Administration',              dept_code:'01', type:'E', account:'E 01-001-01', name:'WAGES/SALARY / DEPT HEADS',            category:'WAGES/SALARY',       budget:92320,   ytd:47867.55,  balance:44452.45 },
  { dept:'Administration',              dept_code:'01', type:'E', account:'E 01-001-02', name:'WAGES/SALARY / FULL TIME',             category:'WAGES/SALARY',       budget:190160,  ytd:180244.77, balance:9915.23 },
  { dept:'Administration',              dept_code:'01', type:'E', account:'E 01-001-03', name:'WAGES/SALARY / PT/PER DIEM',           category:'WAGES/SALARY',       budget:36200,   ytd:8049.07,   balance:28150.93 },
  { dept:'Administration',              dept_code:'01', type:'E', account:'E 01-001-04', name:'WAGES/SALARY / VOLUNTEER/STIPEND',     category:'WAGES/SALARY',       budget:1620,    ytd:17257.23,  balance:-15637.23 },
  { dept:'Administration',              dept_code:'01', type:'E', account:'E 01-001-06', name:'WAGES/SALARY / BOARD',                 category:'WAGES/SALARY',       budget:14700,   ytd:6300,      balance:8400 },
  { dept:'Administration',              dept_code:'01', type:'E', account:'E 01-001-07', name:'WAGES/SALARY / SEC/ADMINAST',          category:'WAGES/SALARY',       budget:7680,    ytd:5580,      balance:2100 },
  { dept:'Administration',              dept_code:'01', type:'E', account:'E 01-001-11', name:'WAGES/SALARY / ELECTION CLK',          category:'WAGES/SALARY',       budget:3500,    ytd:1716.18,   balance:1783.82 },
  { dept:'Administration',              dept_code:'01', type:'E', account:'E 01-001-24', name:'WAGES/SALARY / PUBLIC HEALTH',         category:'WAGES/SALARY',       budget:1200,    ytd:0,         balance:1200 },
  { dept:'Administration',              dept_code:'01', type:'E', account:'E 01-002-01', name:'BENEFITS / FICA',                      category:'BENEFITS',           budget:26575,   ytd:20581.86,  balance:5993.14 },
  { dept:'Administration',              dept_code:'01', type:'E', account:'E 01-002-02', name:'BENEFITS / HEALTH INS',                category:'BENEFITS',           budget:101230,  ytd:66095.66,  balance:35134.34 },
  { dept:'Administration',              dept_code:'01', type:'E', account:'E 01-002-20', name:'BENEFITS / PFML',                      category:'BENEFITS',           budget:1737,    ytd:1263.98,   balance:473.02 },
  { dept:'Administration',              dept_code:'01', type:'E', account:'E 01-002-22', name:'BENEFITS / ICMA',                      category:'BENEFITS',           budget:20130,   ytd:9878.38,   balance:10251.62 },
  { dept:'Administration',              dept_code:'01', type:'E', account:'E 01-003-01', name:'OFFICE SUPPLIES / GENERAL',            category:'OFFICE SUPPLIES',    budget:4000,    ytd:4465.01,   balance:-465.01 },
  { dept:'Administration',              dept_code:'01', type:'E', account:'E 01-003-03', name:'OFFICE SUPPLIES / POSTAGE',            category:'OFFICE SUPPLIES',    budget:6500,    ytd:700.64,    balance:5799.36 },
  { dept:'Administration',              dept_code:'01', type:'E', account:'E 01-003-04', name:'OFFICE SUPPLIES / COMPUTER',           category:'OFFICE SUPPLIES',    budget:2000,    ytd:56.44,     balance:1943.56 },
  { dept:'Administration',              dept_code:'01', type:'E', account:'E 01-004-01', name:'UTILITIES / ELECTRICITY',              category:'UTILITIES',          budget:2750,    ytd:1571.53,   balance:1178.47 },
  { dept:'Administration',              dept_code:'01', type:'E', account:'E 01-004-02', name:'UTILITIES / HEAT',                     category:'UTILITIES',          budget:3750,    ytd:2798.34,   balance:951.66 },
  { dept:'Administration',              dept_code:'01', type:'E', account:'E 01-004-03', name:'UTILITIES / SEWER',                    category:'UTILITIES',          budget:382,     ytd:147.90,    balance:234.10 },
  { dept:'Administration',              dept_code:'01', type:'E', account:'E 01-004-04', name:'UTILITIES / WATER',                    category:'UTILITIES',          budget:400,     ytd:349.76,    balance:50.24 },
  { dept:'Administration',              dept_code:'01', type:'E', account:'E 01-004-05', name:'UTILITIES / TELEPHONE',                category:'UTILITIES',          budget:4000,    ytd:3772.95,   balance:227.05 },
  { dept:'Administration',              dept_code:'01', type:'E', account:'E 01-005-01', name:'OPERATING EXPENSES / AUDIT',           category:'OPERATING EXPENSES', budget:12000,   ytd:20223.03,  balance:-8223.03 },
  { dept:'Administration',              dept_code:'01', type:'E', account:'E 01-005-02', name:'OPERATING EXPENSES / LEGAL',           category:'OPERATING EXPENSES', budget:1000,    ytd:5842.50,   balance:-4842.50 },
  { dept:'Administration',              dept_code:'01', type:'E', account:'E 01-005-04', name:'OPERATING EXPENSES / ADS',             category:'OPERATING EXPENSES', budget:1600,    ytd:678.30,    balance:921.70 },
  { dept:'Administration',              dept_code:'01', type:'E', account:'E 01-005-05', name:'OPERATING EXPENSES / TM EXPENSE',      category:'OPERATING EXPENSES', budget:3900,    ytd:3735,      balance:165 },
  { dept:'Administration',              dept_code:'01', type:'E', account:'E 01-005-06', name:'OPERATING EXPENSES / TRAIN/TRAVEL',    category:'OPERATING EXPENSES', budget:3000,    ytd:5471.43,   balance:-2471.43 },
  { dept:'Administration',              dept_code:'01', type:'E', account:'E 01-005-09', name:'OPERATING EXPENSES / DUES/SUBS',       category:'OPERATING EXPENSES', budget:5100,    ytd:6718.82,   balance:-1618.82 },
  { dept:'Administration',              dept_code:'01', type:'E', account:'E 01-005-26', name:'OPERATING EXPENSES / BANK CHARGES',    category:'OPERATING EXPENSES', budget:10000,   ytd:0,         balance:10000 },
  { dept:'Administration',              dept_code:'01', type:'E', account:'E 01-006-01', name:"INSURANCES / GEN'L LIAB",              category:'INSURANCES',         budget:5720,    ytd:7835,      balance:-2115 },
  { dept:'Administration',              dept_code:'01', type:'E', account:'E 01-006-05', name:'INSURANCES / UNEMPLOYMENT',            category:'INSURANCES',         budget:468,     ytd:396.28,    balance:71.72 },
  { dept:'Administration',              dept_code:'01', type:'E', account:'E 01-006-06', name:'INSURANCES / WORKERS COMP',            category:'INSURANCES',         budget:2200,    ytd:998.98,    balance:1201.02 },
  { dept:'Administration',              dept_code:'01', type:'E', account:'E 01-008-01', name:'EQUIP MAINT / COMPUTER',               category:'EQUIP MAINT',        budget:13000,   ytd:1746.35,   balance:11253.65 },
  { dept:'Administration',              dept_code:'01', type:'E', account:'E 01-009-01', name:'BLDG MAINT / STRUCTURE REPAIRS',       category:'BLDG MAINT',         budget:1000,    ytd:71401.78,  balance:-70401.78 },
  { dept:'Administration',              dept_code:'01', type:'E', account:'E 01-022-99', name:'GRANTS / OTHER',                       category:'GRANTS',             budget:0,       ytd:38163.63,  balance:-38163.63 },

  // FIRE DEPARTMENT (02)
  { dept:'Fire Department',             dept_code:'02', type:'E', account:'E 02-001-01', name:'WAGES/SALARY / DEPT HEADS',            category:'WAGES/SALARY',       budget:15750,   ytd:11250,     balance:4500 },
  { dept:'Fire Department',             dept_code:'02', type:'E', account:'E 02-001-02', name:'WAGES/SALARY / FULL TIME',             category:'WAGES/SALARY',       budget:135440,  ytd:92941.75,  balance:42498.25 },
  { dept:'Fire Department',             dept_code:'02', type:'E', account:'E 02-001-03', name:'WAGES/SALARY / PT/PER DIEM',           category:'WAGES/SALARY',       budget:34500,   ytd:38771.60,  balance:-4271.60 },
  { dept:'Fire Department',             dept_code:'02', type:'E', account:'E 02-001-04', name:'WAGES/SALARY / VOLUNTEER/STIPEND',     category:'WAGES/SALARY',       budget:60900,   ytd:72478.22,  balance:-11578.22 },
  { dept:'Fire Department',             dept_code:'02', type:'E', account:'E 02-001-05', name:'WAGES/SALARY / OVERTIME',              category:'WAGES/SALARY',       budget:18000,   ytd:6243.82,   balance:11756.18 },
  { dept:'Fire Department',             dept_code:'02', type:'E', account:'E 02-002-01', name:'BENEFITS / FICA',                      category:'BENEFITS',           budget:20242,   ytd:17590.90,  balance:2651.10 },
  { dept:'Fire Department',             dept_code:'02', type:'E', account:'E 02-002-02', name:'BENEFITS / HEALTH INS',                category:'BENEFITS',           budget:47246,   ytd:37187.79,  balance:10058.21 },
  { dept:'Fire Department',             dept_code:'02', type:'E', account:'E 02-002-22', name:'BENEFITS / ICMA',                      category:'BENEFITS',           budget:4020,    ytd:4841.47,   balance:-821.47 },
  { dept:'Fire Department',             dept_code:'02', type:'E', account:'E 02-003-01', name:'OFFICE SUPPLIES / GENERAL',            category:'OFFICE SUPPLIES',    budget:650,     ytd:3176.67,   balance:-2526.67 },
  { dept:'Fire Department',             dept_code:'02', type:'E', account:'E 02-004-05', name:'UTILITIES / TELEPHONE',                category:'UTILITIES',          budget:2000,    ytd:1366.86,   balance:633.14 },
  { dept:'Fire Department',             dept_code:'02', type:'E', account:'E 02-004-12', name:'UTILITIES / BLDG APPROP',              category:'UTILITIES',          budget:18125,   ytd:18125,     balance:0 },
  { dept:'Fire Department',             dept_code:'02', type:'E', account:'E 02-005-06', name:'OPERATING EXPENSES / TRAIN/TRAVEL',    category:'OPERATING EXPENSES', budget:1000,    ytd:1234.45,   balance:-234.45 },
  { dept:'Fire Department',             dept_code:'02', type:'E', account:'E 02-006-01', name:"INSURANCES / GEN'L LIAB",              category:'INSURANCES',         budget:1650,    ytd:3400.50,   balance:-1750.50 },
  { dept:'Fire Department',             dept_code:'02', type:'E', account:'E 02-006-06', name:'INSURANCES / WORKERS COMP',            category:'INSURANCES',         budget:25000,   ytd:12836.88,  balance:12163.12 },
  { dept:'Fire Department',             dept_code:'02', type:'E', account:'E 02-008-10', name:'EQUIP MAINT / VEHICLE MAINT',          category:'EQUIP MAINT',        budget:12000,   ytd:10633.65,  balance:1366.35 },
  { dept:'Fire Department',             dept_code:'02', type:'E', account:'E 02-008-12', name:'EQUIP MAINT / EQUIP SUPPLY',           category:'EQUIP MAINT',        budget:7500,    ytd:14286.29,  balance:-6786.29 },
  { dept:'Fire Department',             dept_code:'02', type:'E', account:'E 02-008-13', name:'EQUIP MAINT / EQUIPMENT MAINT',        category:'EQUIP MAINT',        budget:5000,    ytd:5554,      balance:-554 },
  { dept:'Fire Department',             dept_code:'02', type:'E', account:'E 02-010-01', name:'CLOTHING / UNIFORMS',                  category:'CLOTHING',           budget:1000,    ytd:3005.61,   balance:-2005.61 },
  { dept:'Fire Department',             dept_code:'02', type:'E', account:'E 02-010-04', name:'CLOTHING / TURNOUT GEAR',              category:'CLOTHING',           budget:10000,   ytd:0,         balance:10000 },
  { dept:'Fire Department',             dept_code:'02', type:'E', account:'E 02-011-01', name:'CONTRACT SERVICES / FIRE CONTRACTS',   category:'CONTRACT SERVICES',  budget:22000,   ytd:16800,     balance:5200 },

  // POLICE DEPARTMENT (03)
  { dept:'Police Department',           dept_code:'03', type:'E', account:'E 03-001-01', name:'WAGES/SALARY / DEPT HEADS',            category:'WAGES/SALARY',       budget:84244,   ytd:63446.05,  balance:20797.95 },
  { dept:'Police Department',           dept_code:'03', type:'E', account:'E 03-001-02', name:'WAGES/SALARY / FULL TIME',             category:'WAGES/SALARY',       budget:231426,  ytd:153480.66, balance:77945.34 },
  { dept:'Police Department',           dept_code:'03', type:'E', account:'E 03-001-04', name:'WAGES/SALARY / VOLUNTEER/RESERVE',     category:'WAGES/SALARY',       budget:35000,   ytd:38157,     balance:-3157 },
  { dept:'Police Department',           dept_code:'03', type:'E', account:'E 03-001-05', name:'WAGES/SALARY / OVERTIME',              category:'WAGES/SALARY',       budget:10000,   ytd:19661.64,  balance:-9661.64 },
  { dept:'Police Department',           dept_code:'03', type:'E', account:'E 03-001-10', name:'WAGES/SALARY / SCHOOL RO',             category:'WAGES/SALARY',       budget:20000,   ytd:11595,     balance:8405 },
  { dept:'Police Department',           dept_code:'03', type:'E', account:'E 03-001-13', name:'WAGES/SALARY / ANIMAL CONTROL',        category:'WAGES/SALARY',       budget:6600,    ytd:4950,      balance:1650 },
  { dept:'Police Department',           dept_code:'03', type:'E', account:'E 03-002-01', name:'BENEFITS / FICA',                      category:'BENEFITS',           budget:29665,   ytd:22496.54,  balance:7168.46 },
  { dept:'Police Department',           dept_code:'03', type:'E', account:'E 03-002-02', name:'BENEFITS / HEALTH INS',                category:'BENEFITS',           budget:94492,   ytd:80183.27,  balance:14308.73 },
  { dept:'Police Department',           dept_code:'03', type:'E', account:'E 03-002-04', name:'BENEFITS / MEPERS',                    category:'BENEFITS',           budget:40075,   ytd:28627.22,  balance:11447.78 },
  { dept:'Police Department',           dept_code:'03', type:'E', account:'E 03-003-01', name:'OFFICE SUPPLIES / GENERAL',            category:'OFFICE SUPPLIES',    budget:3000,    ytd:3847.20,   balance:-847.20 },
  { dept:'Police Department',           dept_code:'03', type:'E', account:'E 03-003-04', name:'OFFICE SUPPLIES / COMPUTER',           category:'OFFICE SUPPLIES',    budget:8500,    ytd:8783.04,   balance:-283.04 },
  { dept:'Police Department',           dept_code:'03', type:'E', account:'E 03-004-05', name:'UTILITIES / TELEPHONE',                category:'UTILITIES',          budget:7000,    ytd:7881.79,   balance:-881.79 },
  { dept:'Police Department',           dept_code:'03', type:'E', account:'E 03-005-06', name:'OPERATING EXPENSES / TRAIN/TRAVEL',    category:'OPERATING EXPENSES', budget:8000,    ytd:4993.37,   balance:3006.63 },
  { dept:'Police Department',           dept_code:'03', type:'E', account:'E 03-006-01', name:"INSURANCES / GEN'L LIAB",              category:'INSURANCES',         budget:8800,    ytd:6831.50,   balance:1968.50 },
  { dept:'Police Department',           dept_code:'03', type:'E', account:'E 03-006-06', name:'INSURANCES / WORKERS COMP',            category:'INSURANCES',         budget:13040,   ytd:8883.68,   balance:4156.32 },
  { dept:'Police Department',           dept_code:'03', type:'E', account:'E 03-008-09', name:'EQUIP MAINT / GAS/DIESEL',             category:'EQUIP MAINT',        budget:13000,   ytd:13803.58,  balance:-803.58 },
  { dept:'Police Department',           dept_code:'03', type:'E', account:'E 03-008-10', name:'EQUIP MAINT / VEHICLE MAINT',          category:'EQUIP MAINT',        budget:10000,   ytd:10413.16,  balance:-413.16 },
  { dept:'Police Department',           dept_code:'03', type:'E', account:'E 03-008-11', name:'EQUIP MAINT / TIRES',                  category:'EQUIP MAINT',        budget:1500,    ytd:2788,      balance:-1288 },
  { dept:'Police Department',           dept_code:'03', type:'E', account:'E 03-008-12', name:'EQUIP MAINT / EQUIP SUPPLY',           category:'EQUIP MAINT',        budget:6000,    ytd:6508.12,   balance:-508.12 },
  { dept:'Police Department',           dept_code:'03', type:'E', account:'E 03-012-05', name:'CAPITAL PROJECTS / VEHICLE REPL',      category:'CAPITAL PROJECTS',   budget:115000,  ytd:22762.38,  balance:92237.62 },

  // PUBLIC WORKS (04)
  { dept:'Public Works',                dept_code:'04', type:'E', account:'E 04-001-01', name:'WAGES/SALARY / DEPT HEADS',            category:'WAGES/SALARY',       budget:68287,   ytd:51214.81,  balance:17072.19 },
  { dept:'Public Works',                dept_code:'04', type:'E', account:'E 04-001-02', name:'WAGES/SALARY / FULL TIME',             category:'WAGES/SALARY',       budget:140465,  ytd:92313.61,  balance:48151.39 },
  { dept:'Public Works',                dept_code:'04', type:'E', account:'E 04-001-03', name:'WAGES/SALARY / PT/PER DIEM',           category:'WAGES/SALARY',       budget:6000,    ytd:5597.66,   balance:402.34 },
  { dept:'Public Works',                dept_code:'04', type:'E', account:'E 04-001-05', name:'WAGES/SALARY / OVERTIME',              category:'WAGES/SALARY',       budget:12500,   ytd:11570.47,  balance:929.53 },
  { dept:'Public Works',                dept_code:'04', type:'E', account:'E 04-002-01', name:'BENEFITS / FICA',                      category:'BENEFITS',           budget:17385,   ytd:12293.07,  balance:5091.93 },
  { dept:'Public Works',                dept_code:'04', type:'E', account:'E 04-002-02', name:'BENEFITS / HEALTH INS',                category:'BENEFITS',           budget:94492,   ytd:76258.27,  balance:18233.73 },
  { dept:'Public Works',                dept_code:'04', type:'E', account:'E 04-005-19', name:'OPERATING EXPENSES / SAND/SALT',       category:'OPERATING EXPENSES', budget:58000,   ytd:53020.71,  balance:4979.29 },
  { dept:'Public Works',                dept_code:'04', type:'E', account:'E 04-006-01', name:"INSURANCES / GEN'L LIAB",              category:'INSURANCES',         budget:1837,    ytd:5204.50,   balance:-3367.50 },
  { dept:'Public Works',                dept_code:'04', type:'E', account:'E 04-006-04', name:'INSURANCES / FLEET',                   category:'INSURANCES',         budget:11825,   ytd:0,         balance:11825 },
  { dept:'Public Works',                dept_code:'04', type:'E', account:'E 04-006-06', name:'INSURANCES / WORKERS COMP',            category:'INSURANCES',         budget:18206,   ytd:6128.71,   balance:12077.29 },
  { dept:'Public Works',                dept_code:'04', type:'E', account:'E 04-008-09', name:'EQUIP MAINT / GAS/DIESEL',             category:'EQUIP MAINT',        budget:23000,   ytd:17270.03,  balance:5729.97 },
  { dept:'Public Works',                dept_code:'04', type:'E', account:'E 04-008-10', name:'EQUIP MAINT / VEHICLE MAINT',          category:'EQUIP MAINT',        budget:42000,   ytd:53213.42,  balance:-11213.42 },
  { dept:'Public Works',                dept_code:'04', type:'E', account:'E 04-011-01', name:'CONTRACT SERVICES / CONSTRUCTION',     category:'CONTRACT SERVICES',  budget:16000,   ytd:7129.29,   balance:8870.71 },
  { dept:'Public Works',                dept_code:'04', type:'E', account:'E 04-310-01', name:'CONTRACT SERVICES / STATE CONTRACT 1A',category:'CONTRACT SERVICES',  budget:63407,   ytd:823,       balance:62584 },

  // SEWER (05)
  { dept:'Sewer',                       dept_code:'05', type:'E', account:'E 05-001-01', name:'WAGES/SALARY / DEPT HEADS',            category:'WAGES/SALARY',       budget:65000,   ytd:48200,     balance:16800 },
  { dept:'Sewer',                       dept_code:'05', type:'E', account:'E 05-001-02', name:'WAGES/SALARY / FULL TIME',             category:'WAGES/SALARY',       budget:95000,   ytd:71300,     balance:23700 },
  { dept:'Sewer',                       dept_code:'05', type:'E', account:'E 05-001-05', name:'WAGES/SALARY / OVERTIME',              category:'WAGES/SALARY',       budget:8000,    ytd:6200,      balance:1800 },
  { dept:'Sewer',                       dept_code:'05', type:'E', account:'E 05-002-01', name:'BENEFITS / FICA',                      category:'BENEFITS',           budget:13000,   ytd:9600,      balance:3400 },
  { dept:'Sewer',                       dept_code:'05', type:'E', account:'E 05-002-02', name:'BENEFITS / HEALTH INS',                category:'BENEFITS',           budget:47000,   ytd:38200,     balance:8800 },
  { dept:'Sewer',                       dept_code:'05', type:'E', account:'E 05-004-01', name:'UTILITIES / ELECTRICITY',              category:'UTILITIES',          budget:85000,   ytd:101251.94, balance:-16251.94 },
  { dept:'Sewer',                       dept_code:'05', type:'E', account:'E 05-004-02', name:'UTILITIES / HEAT',                     category:'UTILITIES',          budget:8000,    ytd:6800,      balance:1200 },
  { dept:'Sewer',                       dept_code:'05', type:'E', account:'E 05-005-13', name:'OPERATING EXPENSES / CHEMICALS',       category:'OPERATING EXPENSES', budget:82000,   ytd:91894.02,  balance:-9894.02 },
  { dept:'Sewer',                       dept_code:'05', type:'E', account:'E 05-006-06', name:'INSURANCES / WORKERS COMP',            category:'INSURANCES',         budget:6500,    ytd:4200,      balance:2300 },
  { dept:'Sewer',                       dept_code:'05', type:'E', account:'E 05-011-16', name:'CONTRACT SERVICES / SLUDGE HAULING',   category:'CONTRACT SERVICES',  budget:85000,   ytd:75391.53,  balance:9608.47 },
  { dept:'Sewer',                       dept_code:'05', type:'E', account:'E 05-011-25', name:'CONTRACT SERVICES / OLVER ASSOC',      category:'CONTRACT SERVICES',  budget:280000,  ytd:194760.73, balance:85239.27 },
  { dept:'Sewer',                       dept_code:'05', type:'E', account:'E 05-019-45', name:'LOANS/NOTES / 2017 SRF/ELM',           category:'LOANS/NOTES',        budget:28000,   ytd:26165.15,  balance:1834.85 },
  { dept:'Sewer',                       dept_code:'05', type:'E', account:'E 05-120-01', name:'OTHER / SEWER INTEREST',               category:'OTHER',              budget:5000,    ytd:2783,      balance:2217 },

  // AMBULANCE (06)
  { dept:'Ambulance',                   dept_code:'06', type:'E', account:'E 06-001-01', name:'WAGES/SALARY / DEPT HEADS',            category:'WAGES/SALARY',       budget:78624,   ytd:59292,     balance:19332 },
  { dept:'Ambulance',                   dept_code:'06', type:'E', account:'E 06-001-02', name:'WAGES/SALARY / FULL TIME',             category:'WAGES/SALARY',       budget:385000,  ytd:235398.80, balance:149601.20 },
  { dept:'Ambulance',                   dept_code:'06', type:'E', account:'E 06-001-03', name:'WAGES/SALARY / PT/PER DIEM',           category:'WAGES/SALARY',       budget:60000,   ytd:48200,     balance:11800 },
  { dept:'Ambulance',                   dept_code:'06', type:'E', account:'E 06-001-05', name:'WAGES/SALARY / OVERTIME',              category:'WAGES/SALARY',       budget:30000,   ytd:24100,     balance:5900 },
  { dept:'Ambulance',                   dept_code:'06', type:'E', account:'E 06-002-01', name:'BENEFITS / FICA',                      category:'BENEFITS',           budget:42000,   ytd:28300,     balance:13700 },
  { dept:'Ambulance',                   dept_code:'06', type:'E', account:'E 06-002-02', name:'BENEFITS / HEALTH INS',                category:'BENEFITS',           budget:94000,   ytd:72100,     balance:21900 },
  { dept:'Ambulance',                   dept_code:'06', type:'E', account:'E 06-004-05', name:'UTILITIES / TELEPHONE',                category:'UTILITIES',          budget:5000,    ytd:4100,      balance:900 },
  { dept:'Ambulance',                   dept_code:'06', type:'E', account:'E 06-005-16', name:'OPERATING EXPENSES / MEDICAL SUPPLIES',category:'OPERATING EXPENSES', budget:55000,   ytd:35807.48,  balance:19192.52 },
  { dept:'Ambulance',                   dept_code:'06', type:'E', account:'E 06-006-06', name:'INSURANCES / WORKERS COMP',            category:'INSURANCES',         budget:22000,   ytd:14800,     balance:7200 },
  { dept:'Ambulance',                   dept_code:'06', type:'E', account:'E 06-008-10', name:'EQUIP MAINT / VEHICLE MAINT',          category:'EQUIP MAINT',        budget:25000,   ytd:18600,     balance:6400 },
  { dept:'Ambulance',                   dept_code:'06', type:'E', account:'E 06-011-30', name:'CONTRACT SERVICES / BILLING',          category:'CONTRACT SERVICES',  budget:50000,   ytd:44914.43,  balance:5085.57 },
  { dept:'Ambulance',                   dept_code:'06', type:'E', account:'E 06-019-54', name:'LOANS/NOTES / AMBULANCE LOAN',         category:'LOANS/NOTES',        budget:65320,   ytd:65315.90,  balance:4.10 },

  // PUBLIC SAFETY BUILDING (07)
  { dept:'Public Safety Building',      dept_code:'07', type:'E', account:'E 07-004-01', name:'UTILITIES / ELECTRICITY',              category:'UTILITIES',          budget:8500,    ytd:6887.53,   balance:1612.47 },
  { dept:'Public Safety Building',      dept_code:'07', type:'E', account:'E 07-004-02', name:'UTILITIES / HEAT',                     category:'UTILITIES',          budget:9000,    ytd:6766.68,   balance:2233.32 },
  { dept:'Public Safety Building',      dept_code:'07', type:'E', account:'E 07-004-03', name:'UTILITIES / SEWER',                    category:'UTILITIES',          budget:1300,    ytd:1144.83,   balance:155.17 },
  { dept:'Public Safety Building',      dept_code:'07', type:'E', account:'E 07-009-01', name:'BLDG MAINT / STRUCTURE',               category:'BLDG MAINT',         budget:15000,   ytd:1390.39,   balance:13609.61 },
  { dept:'Public Safety Building',      dept_code:'07', type:'E', account:'E 07-019-56', name:'LOANS/NOTES / PSB DEBT SERVICE',       category:'LOANS/NOTES',        budget:22890,   ytd:22882.26,  balance:7.74 },

  // PARKS & RECREATION (08)
  { dept:'Parks & Recreation',          dept_code:'08', type:'E', account:'E 08-013-05', name:'THIRD PARTY / 4TH OF JULY',            category:'OTHER',              budget:750,     ytd:4000,      balance:-3250 },
  { dept:'Parks & Recreation',          dept_code:'08', type:'E', account:'E 08-013-13', name:'THIRD PARTY / FIREWORKS',              category:'OTHER',              budget:6500,    ytd:1000,      balance:5500 },
  { dept:'Parks & Recreation',          dept_code:'08', type:'E', account:'E 08-015-11', name:'REC PROGRAM / PLAYGROUND',             category:'OTHER',              budget:5000,    ytd:2293.95,   balance:2706.05 },
  { dept:'Parks & Recreation',          dept_code:'08', type:'E', account:'E 08-017-05', name:'OTHER SERVICES / BAD LITTLE FALLS',    category:'OTHER',              budget:5000,    ytd:8313.15,   balance:-3313.15 },
  { dept:'Parks & Recreation',          dept_code:'08', type:'E', account:'E 08-017-12', name:'OTHER SERVICES / SKATE PARK',          category:'OTHER',              budget:35669,   ytd:36419,     balance:-750 },

  // TAX ASSESSOR (09)
  { dept:'Tax Assessor',                dept_code:'09', type:'E', account:'E 09-001-01', name:'WAGES/SALARY / DEPT HEADS',            category:'WAGES/SALARY',       budget:0,       ytd:15000,     balance:-15000 },
  { dept:'Tax Assessor',                dept_code:'09', type:'E', account:'E 09-011-10', name:'CONTRACT SERVICES / ASSESSOR',         category:'CONTRACT SERVICES',  budget:30000,   ytd:7500,      balance:22500 },
  { dept:'Tax Assessor',                dept_code:'09', type:'E', account:'E 09-011-99', name:'CONTRACT SERVICES / MISC',             category:'CONTRACT SERVICES',  budget:5834,    ytd:3750.03,   balance:2083.97 },

  // PLUMBING INSPECTOR (10)
  { dept:'Plumbing Inspector',          dept_code:'10', type:'E', account:'E 10-001-01', name:'WAGES/SALARY / INSPECTOR',             category:'WAGES/SALARY',       budget:4800,    ytd:3600,      balance:1200 },
  { dept:'Plumbing Inspector',          dept_code:'10', type:'E', account:'E 10-002-01', name:'BENEFITS / FICA',                      category:'BENEFITS',           budget:368,     ytd:276,       balance:92 },
  { dept:'Plumbing Inspector',          dept_code:'10', type:'E', account:'E 10-005-99', name:'OPERATING EXPENSES / MISC',            category:'OPERATING EXPENSES', budget:500,     ytd:280,       balance:220 },

  // CODE ENFORCEMENT (11)
  { dept:'Code Enforcement',            dept_code:'11', type:'E', account:'E 11-001-01', name:'WAGES/SALARY / OFFICER',               category:'WAGES/SALARY',       budget:12000,   ytd:9000,      balance:3000 },
  { dept:'Code Enforcement',            dept_code:'11', type:'E', account:'E 11-002-01', name:'BENEFITS / FICA',                      category:'BENEFITS',           budget:918,     ytd:688,       balance:230 },
  { dept:'Code Enforcement',            dept_code:'11', type:'E', account:'E 11-005-99', name:'OPERATING EXPENSES / MISC',            category:'OPERATING EXPENSES', budget:1000,    ytd:620,       balance:380 },
  { dept:'Code Enforcement',            dept_code:'11', type:'E', account:'E 11-006-01', name:'INSURANCES / GENERAL',                 category:'INSURANCES',         budget:500,     ytd:380,       balance:120 },

  // AIRPORT (12)
  { dept:'Airport',                     dept_code:'12', type:'E', account:'E 12-005-30', name:'OPERATING EXPENSES / AIRPORT OPS',     category:'OPERATING EXPENSES', budget:15000,   ytd:8000,      balance:7000 },
  { dept:'Airport',                     dept_code:'12', type:'E', account:'E 12-006-01', name:'INSURANCES / GENERAL',                 category:'INSURANCES',         budget:3000,    ytd:2800,      balance:200 },
  { dept:'Airport',                     dept_code:'12', type:'E', account:'E 12-009-01', name:'BLDG MAINT / STRUCTURE',               category:'BLDG MAINT',         budget:5000,    ytd:2100,      balance:2900 },

  // GENERAL ASSISTANCE (13)
  { dept:'General Assistance',          dept_code:'13', type:'E', account:'E 13-001-01', name:'WAGES/SALARY / GA OFFICER',            category:'WAGES/SALARY',       budget:4000,    ytd:3000,      balance:1000 },
  { dept:'General Assistance',          dept_code:'13', type:'E', account:'E 13-004-01', name:'UTILITIES / ELECTRICITY',              category:'UTILITIES',          budget:500,     ytd:2657,      balance:-2157 },
  { dept:'General Assistance',          dept_code:'13', type:'E', account:'E 13-004-02', name:'UTILITIES / HEAT',                     category:'UTILITIES',          budget:1500,    ytd:13685.68,  balance:-12185.68 },
  { dept:'General Assistance',          dept_code:'13', type:'E', account:'E 13-004-08', name:'UTILITIES / FOOD',                     category:'UTILITIES',          budget:500,     ytd:4330,      balance:-3830 },
  { dept:'General Assistance',          dept_code:'13', type:'E', account:'E 13-004-09', name:'UTILITIES / RENT/MOTEL',               category:'UTILITIES',          budget:1500,    ytd:8801.32,   balance:-7301.32 },

  // SOLID WASTE / TRANSFER STATION (14)
  { dept:'Solid Waste Facility',        dept_code:'14', type:'E', account:'E 14-001-01', name:'WAGES/SALARY / DEPT HEADS',            category:'WAGES/SALARY',       budget:45864,   ytd:32699.93,  balance:13164.07 },
  { dept:'Solid Waste Facility',        dept_code:'14', type:'E', account:'E 14-001-02', name:'WAGES/SALARY / FULL TIME',             category:'WAGES/SALARY',       budget:52000,   ytd:39800,     balance:12200 },
  { dept:'Solid Waste Facility',        dept_code:'14', type:'E', account:'E 14-002-01', name:'BENEFITS / FICA',                      category:'BENEFITS',           budget:7500,    ytd:5600,      balance:1900 },
  { dept:'Solid Waste Facility',        dept_code:'14', type:'E', account:'E 14-002-02', name:'BENEFITS / HEALTH INS',                category:'BENEFITS',           budget:47000,   ytd:36200,     balance:10800 },
  { dept:'Solid Waste Facility',        dept_code:'14', type:'E', account:'E 14-004-01', name:'UTILITIES / ELECTRICITY',              category:'UTILITIES',          budget:8000,    ytd:6100,      balance:1900 },
  { dept:'Solid Waste Facility',        dept_code:'14', type:'E', account:'E 14-006-06', name:'INSURANCES / WORKERS COMP',            category:'INSURANCES',         budget:3500,    ytd:2400,      balance:1100 },
  { dept:'Solid Waste Facility',        dept_code:'14', type:'E', account:'E 14-008-10', name:'EQUIP MAINT / VEHICLE MAINT',          category:'EQUIP MAINT',        budget:12000,   ytd:8900,      balance:3100 },
  { dept:'Solid Waste Facility',        dept_code:'14', type:'E', account:'E 14-011-20', name:'CONTRACT SERVICES / MSW TIPPING FEES', category:'CONTRACT SERVICES',  budget:33000,   ytd:18219.37,  balance:14780.63 },
  { dept:'Solid Waste Facility',        dept_code:'14', type:'E', account:'E 14-011-21', name:'CONTRACT SERVICES / HAZMAT',           category:'CONTRACT SERVICES',  budget:8000,    ytd:5200,      balance:2800 },
  { dept:'Solid Waste Facility',        dept_code:'14', type:'E', account:'E 14-021-01', name:'TRANSFER FROM GF',                     category:'FUND TRANSFER',      budget:21000,   ytd:21000,     balance:0 },

  // THIRD PARTY REQUESTS (15)
  { dept:'Third Party Requests',        dept_code:'15', type:'E', account:'E 15-013-09', name:'THIRD PARTY / PORTER MEM LIBRARY',     category:'THIRD PARTY',        budget:26000,   ytd:0,         balance:26000 },
  { dept:'Third Party Requests',        dept_code:'15', type:'E', account:'E 15-013-03', name:'THIRD PARTY / DOWNEAST COMM PARTNERS', category:'THIRD PARTY',        budget:4000,    ytd:0,         balance:4000 },
  { dept:'Third Party Requests',        dept_code:'15', type:'E', account:'E 15-013-10', name:'THIRD PARTY / WASH CTY COUNCIL OF GOVTS',category:'THIRD PARTY',      budget:2500,    ytd:0,         balance:2500 },
  { dept:'Third Party Requests',        dept_code:'15', type:'E', account:'E 15-013-99', name:'THIRD PARTY / OTHER REQUESTS',         category:'THIRD PARTY',        budget:8000,    ytd:5200,      balance:2800 },

  // GOV'T AGENCY (16)
  { dept:"Gov't Agency — County Tax",   dept_code:'16', type:'E', account:'E 16-016-01', name:"GOV'T AGENCY / WASH CTY TAX",          category:"GOV'T AGENCY",       budget:389780,  ytd:703932.41, balance:-314152.41 },

  // OTHER MUNICIPAL SERVICES (17)
  { dept:'Other Municipal Services',    dept_code:'17', type:'E', account:'E 17-004-06', name:'UTILITIES / FIRE HYDRANT',             category:'UTILITIES',          budget:212432,  ytd:137029,    balance:75403 },
  { dept:'Other Municipal Services',    dept_code:'17', type:'E', account:'E 17-004-07', name:'UTILITIES / STREET LIGHT',             category:'UTILITIES',          budget:40920,   ytd:34962.22,  balance:5957.78 },
  { dept:'Other Municipal Services',    dept_code:'17', type:'E', account:'E 17-017-01', name:'CONTINGENCY',                          category:'OTHER',              budget:10000,   ytd:4274.38,   balance:5725.62 },
  { dept:'Other Municipal Services',    dept_code:'17', type:'E', account:'E 17-017-50', name:'TIF REIMBURSEMENT',                    category:'OTHER',              budget:80000,   ytd:0,         balance:80000 },

  // PLANNING BOARD (18)
  { dept:'Planning Board',              dept_code:'18', type:'E', account:'E 18-001-12', name:'WAGES/SALARY / SEC/PLANNING',          category:'WAGES/SALARY',       budget:1920,    ytd:1395,      balance:525 },
  { dept:'Planning Board',              dept_code:'18', type:'E', account:'E 18-005-02', name:'OPERATING EXPENSES / LEGAL',           category:'OPERATING EXPENSES', budget:2500,    ytd:9394.50,   balance:-6894.50 },
  { dept:'Planning Board',              dept_code:'18', type:'E', account:'E 18-005-04', name:'OPERATING EXPENSES / ADS',             category:'OPERATING EXPENSES', budget:500,     ytd:220,       balance:280 },
  { dept:'Planning Board',              dept_code:'18', type:'E', account:'E 18-005-06', name:'OPERATING EXPENSES / TRAIN/TRAVEL',    category:'OPERATING EXPENSES', budget:500,     ytd:180,       balance:320 },

  // DEBT SERVICE (19)
  { dept:'Debt Service',                dept_code:'19', type:'E', account:'E 19-019-43', name:'LOANS/NOTES / PUBLIC WORKS $530K',     category:'LOANS/NOTES',        budget:124035,  ytd:124034.93, balance:0.07 },
  { dept:'Debt Service',                dept_code:'19', type:'E', account:'E 19-019-45', name:'LOANS/NOTES / 2017SRF/ELM',            category:'LOANS/NOTES',        budget:28000,   ytd:26165.15,  balance:1834.85 },
  { dept:'Debt Service',                dept_code:'19', type:'E', account:'E 19-019-56', name:'LOANS/NOTES / PUBLIC SAFETY BLDG',     category:'LOANS/NOTES',        budget:22890,   ytd:22882.26,  balance:7.74 },
  { dept:'Debt Service',                dept_code:'19', type:'E', account:'E 19-019-58', name:'LOANS/NOTES / ROAD LOAN $231K',        category:'LOANS/NOTES',        budget:26429,   ytd:26429,     balance:0 },

  // TEL CENTER (20)
  { dept:'Tel Center',                  dept_code:'20', type:'E', account:'E 20-001-01', name:'WAGES/SALARY / DIRECTOR',              category:'WAGES/SALARY',       budget:8000,    ytd:6000,      balance:2000 },
  { dept:'Tel Center',                  dept_code:'20', type:'E', account:'E 20-004-01', name:'UTILITIES / ELECTRICITY',              category:'UTILITIES',          budget:18000,   ytd:15200,     balance:2800 },
  { dept:'Tel Center',                  dept_code:'20', type:'E', account:'E 20-004-02', name:'UTILITIES / HEAT',                     category:'UTILITIES',          budget:12000,   ytd:10800,     balance:1200 },
  { dept:'Tel Center',                  dept_code:'20', type:'E', account:'E 20-005-99', name:'OPERATING EXPENSES / MISC',            category:'OPERATING EXPENSES', budget:5000,    ytd:8200,      balance:-3200 },
  { dept:'Tel Center',                  dept_code:'20', type:'E', account:'E 20-009-01', name:'BLDG MAINT / STRUCTURE',               category:'BLDG MAINT',         budget:15000,   ytd:18509,     balance:-3509 },
  { dept:'Tel Center',                  dept_code:'20', type:'E', account:'E 20-011-99', name:'CONTRACT SERVICES / MANAGEMENT',       category:'CONTRACT SERVICES',  budget:15006,   ytd:32000,     balance:-16994 },

  // CAPITAL PROJECT ACCOUNTS (21)
  { dept:'Capital Projects',            dept_code:'21', type:'E', account:'E 21-012-01', name:'CAPITAL PROJECTS / ROAD CONSTRUCTION', category:'CAPITAL PROJECTS',   budget:200000,  ytd:0,         balance:200000 },
  { dept:'Capital Projects',            dept_code:'21', type:'E', account:'E 21-012-02', name:'CAPITAL PROJECTS / EQUIPMENT RESERVE', category:'CAPITAL PROJECTS',   budget:50000,   ytd:0,         balance:50000 },

  // GENERAL EDUCATION (29)
  { dept:'General Education',           dept_code:'29', type:'E', account:'E 29-300-01', name:'GENERAL EDUCATION / GENERAL',          category:'GENERAL EDUCATION',  budget:1751194, ytd:875596.80, balance:875597.20 },
  { dept:'General Education',           dept_code:'29', type:'E', account:'E 29-300-02', name:'GENERAL EDUCATION / ADULT ED',         category:'GENERAL EDUCATION',  budget:20000,   ytd:0,         balance:20000 },
];

const FUND_SUMMARIES = [
  { fund:'01', name:'General Fund',   expense_budget:5628700, expense_ytd:4731935 },
  { fund:'05', name:'Sewer Fund',     expense_budget:702546,  expense_ytd:1307064 },
  { fund:'06', name:'Ambulance Fund', expense_budget:1568460, expense_ytd:1282131 },
  { fund:'14', name:'Solid Waste',    expense_budget:307730,  expense_ytd:179124 },
  { fund:'20', name:'Tel Center',     expense_budget:73006,   expense_ytd:90709 },
];

function buildDeptSummaries(data) {
  const map = {};
  data.forEach(r => {
    const key = r.dept_code + '|' + r.dept;
    if (!map[key]) map[key] = { dept: r.dept, dept_code: r.dept_code, type: r.type, budget: 0, ytd: 0, balance: 0 };
    map[key].budget  += r.budget || 0;
    map[key].ytd     += r.ytd || 0;
    map[key].balance += r.balance || 0;
  });
  return Object.values(map).sort((a, b) => a.dept_code.localeCompare(b.dept_code));
}

function SpendBar({ ytd, budget }) {
  const pct = budget > 0 ? Math.min((ytd / budget) * 100, 100) : 0;
  const over = ytd > budget && budget > 0;
  return (
    <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1">
      <div className={`h-1.5 rounded-full ${over ? 'bg-red-500' : pct > 85 ? 'bg-amber-400' : 'bg-emerald-500'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
    </div>
  );
}

function DeptRow({ dept, lines }) {
  const [open, setOpen] = useState(false);
  const isRevenue = dept.type === 'R';
  const pct = dept.budget > 0 ? ((dept.ytd / dept.budget) * 100).toFixed(1) : '—';
  const over = !isRevenue && dept.balance < 0;
  const underRev = isRevenue && dept.ytd < dept.budget * 0.5;

  return (
    <div className="border-b border-slate-100 last:border-0">
      <div className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-slate-50 transition-colors ${over ? 'bg-red-50/40' : isRevenue ? 'bg-emerald-50/30' : ''}`} onClick={() => setOpen(v => !v)}>
        <div className="flex-shrink-0 text-slate-300">{open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase ${isRevenue ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{isRevenue ? 'REV' : 'EXP'}</span>
            <p className="text-xs font-bold text-slate-800">{dept.dept}</p>
            {over && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 font-bold">OVER BUDGET</span>}
            {!over && !isRevenue && dept.budget > 0 && parseFloat(pct) > 85 && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold">NEAR LIMIT</span>}
          </div>
          {!isRevenue && <SpendBar ytd={dept.ytd} budget={dept.budget} />}
        </div>
        <div className="flex gap-5 text-[10px] flex-shrink-0 ml-4">
          <span className="text-slate-500">Budget: <span className="font-semibold text-slate-800">{fmt(dept.budget)}</span></span>
          <span className="text-slate-500">YTD: <span className="font-semibold text-slate-800">{fmt(dept.ytd)}</span></span>
          <span className={`font-bold ${over ? 'text-red-600' : 'text-slate-600'}`}>{pct}% {isRevenue ? 'collected' : 'used'}</span>
          <span className={`font-mono font-bold ${over ? 'text-red-600' : isRevenue ? 'text-emerald-700' : 'text-slate-600'}`}>{over ? '-' : ''}{fmt(dept.balance)} {isRevenue ? 'remaining' : 'left'}</span>
        </div>
      </div>
      {open && (
        <div className="bg-slate-50 border-t border-slate-100">
          <div className="grid grid-cols-6 text-[9px] font-bold uppercase tracking-wider text-slate-400 px-8 py-1.5 bg-slate-100">
            <span className="col-span-2">Account</span>
            <span className="text-right">Budget</span>
            <span className="text-right">YTD</span>
            <span className="text-right">Balance</span>
            <span className="text-right">% {isRevenue ? 'Coll.' : 'Used'}</span>
          </div>
          {lines.map(l => {
            const lineOver = !isRevenue && l.balance < 0 && l.budget > 0;
            return (
              <div key={l.account} className={`grid grid-cols-6 text-[10px] px-8 py-1.5 border-b border-slate-100 last:border-0 ${lineOver ? 'bg-red-50/50' : ''}`}>
                <div className="col-span-2 text-slate-600 truncate pr-2">
                  <span className="font-mono text-[9px] text-slate-400 mr-1">{l.account}</span>
                  {l.name}
                  {lineOver && <span className="ml-1 text-[8px] text-red-600 font-bold">▲OVER</span>}
                </div>
                <span className="text-right tabular-nums text-slate-700">{l.budget > 0 ? fmt(l.budget) : '—'}</span>
                <span className="text-right tabular-nums text-slate-700">{fmt(l.ytd)}</span>
                <span className={`text-right tabular-nums font-semibold ${lineOver ? 'text-red-600' : 'text-slate-700'}`}>{lineOver ? '-' : ''}{fmt(l.balance)}</span>
                <span className={`text-right tabular-nums ${lineOver ? 'text-red-600 font-bold' : 'text-slate-500'}`}>{pctUsed(l.ytd, l.budget)}%</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function TrialBalance() {
  const [search, setSearch] = useState('');
  const [filterOver, setFilterOver] = useState(false);
  const [view, setView] = useState('all'); // 'all' | 'expense' | 'revenue'

  const expenseData = TB.filter(l => l.type === 'E');
  const revenueData = TB.filter(l => l.type === 'R');

  const allDeptSummaries = useMemo(() => buildDeptSummaries(
    view === 'expense' ? expenseData : view === 'revenue' ? revenueData : TB
  ), [view]);

  const filteredDepts = useMemo(() => allDeptSummaries.filter(d => {
    const matchSearch = !search || d.dept.toLowerCase().includes(search.toLowerCase());
    const matchOver   = !filterOver || (d.type === 'E' && d.balance < 0);
    return matchSearch && matchOver;
  }), [allDeptSummaries, search, filterOver]);

  const overBudgetLines = expenseData.filter(l => l.balance < 0 && l.budget > 0);
  const totalExpBudget  = expenseData.reduce((s, l) => s + (l.budget || 0), 0);
  const totalExpYTD     = expenseData.reduce((s, l) => s + (l.ytd || 0), 0);
  const totalRevBudget  = revenueData.reduce((s, l) => s + (l.budget || 0), 0);
  const totalRevYTD     = revenueData.reduce((s, l) => s + (l.ytd || 0), 0);
  const netPosition     = totalRevYTD - totalExpYTD;

  return (
    <div className="space-y-6">
      <SectionHeader title="Trial Balance — FY2026" subtitle="As of March 24, 2026 · Town of Machias · All Funds · Revenue & Expenses" icon={BarChart2} />

      {/* Fund summary strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {FUND_SUMMARIES.map(f => {
          const pct = f.expense_budget > 0 ? ((f.expense_ytd / f.expense_budget) * 100).toFixed(1) : '—';
          const over = f.expense_ytd > f.expense_budget;
          return (
            <div key={f.fund} className={`rounded-xl border p-3 ${over ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-white'}`}>
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">{f.name}</p>
              <p className={`text-sm font-bold ${over ? 'text-red-700' : 'text-slate-900'}`}>{pct}% spent</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{fmt(f.expense_ytd)} of {fmt(f.expense_budget)}</p>
              <SpendBar ytd={f.expense_ytd} budget={f.expense_budget} />
            </div>
          );
        })}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs text-emerald-700 font-semibold flex items-center gap-1"><TrendingUp className="h-3.5 w-3.5" /> Revenue YTD</p>
          <p className="text-xl font-bold text-emerald-900 mt-1">{fmt(totalRevYTD)}</p>
          <p className="text-[10px] text-emerald-600 mt-1">{pctUsed(totalRevYTD, totalRevBudget)}% of {fmt(totalRevBudget)} budget</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500 font-semibold flex items-center gap-1"><TrendingDown className="h-3.5 w-3.5" /> Expenses YTD</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{fmt(totalExpYTD)}</p>
          <p className="text-[10px] text-slate-400 mt-1">{pctUsed(totalExpYTD, totalExpBudget)}% of {fmt(totalExpBudget)} budget</p>
        </div>
        <div className={`rounded-xl border p-4 ${netPosition >= 0 ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
          <p className={`text-xs font-semibold ${netPosition >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>Net Position (Rev - Exp)</p>
          <p className={`text-xl font-bold mt-1 ${netPosition >= 0 ? 'text-emerald-900' : 'text-red-700'}`}>{fmtSigned(netPosition)}</p>
          <p className="text-[10px] text-slate-400 mt-1">Through March 24, 2026</p>
        </div>
        <div className={`rounded-xl border p-4 ${overBudgetLines.length > 0 ? 'border-red-200 bg-red-50' : 'border-emerald-200 bg-emerald-50'}`}>
          <p className="text-xs text-slate-500 font-semibold">Over-Budget Expense Lines</p>
          <p className={`text-xl font-bold mt-1 ${overBudgetLines.length > 0 ? 'text-red-700' : 'text-emerald-700'}`}>{overBudgetLines.length}</p>
          <p className="text-[10px] text-slate-400 mt-1">accounts exceeding budget</p>
        </div>
      </div>

      {/* Over-budget alert */}
      {overBudgetLines.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
            <p className="text-xs font-bold text-red-800">{overBudgetLines.length} Expense Lines Over Budget</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {overBudgetLines.map(l => (
              <span key={l.account} className="text-[9px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">
                {l.dept}: {l.name.split('/').pop().trim()} ({fmtSigned(l.balance)})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex rounded-lg border border-slate-200 overflow-hidden bg-white text-xs font-semibold">
          {[['all','All'],['expense','Expenses'],['revenue','Revenue']].map(([v,l]) => (
            <button key={v} onClick={() => setView(v)} className={`px-3 py-1.5 transition-colors ${view === v ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>{l}</button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search department..."
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400" />
        </div>
        <button onClick={() => setFilterOver(v => !v)}
          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${filterOver ? 'bg-red-600 text-white border-red-600' : 'border-slate-200 text-slate-600 hover:border-red-300'}`}>
          <AlertTriangle className="h-3.5 w-3.5" /> Over Budget Only
        </button>
      </div>

      {/* Dept table */}
      <div className="rounded-2xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider">Department Revenue & Expenditure Detail</p>
          <p className="text-[10px] text-slate-400">Click department to expand line items · {filteredDepts.length} departments shown</p>
        </div>
        {filteredDepts.map(d => (
          <DeptRow key={d.dept_code + d.dept} dept={d} lines={TB.filter(l => l.dept === d.dept && l.type === d.type)} />
        ))}
      </div>

      <p className="text-[9px] text-slate-400 text-center italic">
        Source: Machias Trial Balance as of 03/24/2026 · Prepared by Nicholas MacDonald · For internal planning use only.
      </p>
    </div>
  );
}