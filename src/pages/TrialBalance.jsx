/**
 * TrialBalance — FY2026 Trial Balance as of 03/24/2026
 * Shows budget vs YTD actuals with variance analysis by department.
 * Data sourced from the uploaded Machias Trial Balance report.
 */
import React, { useState, useMemo } from 'react';
import SectionHeader from '@/components/machias/SectionHeader';
import { BarChart2, AlertTriangle, Search, ChevronDown, ChevronRight } from 'lucide-react';

const fmt = n => `$${Math.round(Math.abs(n || 0)).toLocaleString()}`;
const fmtSigned = n => n >= 0 ? `+$${Math.round(n).toLocaleString()}` : `-$${Math.round(Math.abs(n)).toLocaleString()}`;
const pctUsed = (spent, budget) => budget > 0 ? Math.min(((spent / budget) * 100), 999).toFixed(1) : '—';

const TRIAL_BALANCE_DATA = [
  // ADMINISTRATION
  { dept: 'Administration', dept_code: '01', account: 'E 01-001-01', name: 'WAGES/SALARY / DEPT HEADS',          category: 'WAGES/SALARY',      budget: 92320,   net_change: 47867.55,  balance: 44452.45 },
  { dept: 'Administration', dept_code: '01', account: 'E 01-001-02', name: 'WAGES/SALARY / FULL TIME',           category: 'WAGES/SALARY',      budget: 190160,  net_change: 180244.77, balance: 9915.23 },
  { dept: 'Administration', dept_code: '01', account: 'E 01-001-03', name: 'WAGES/SALARY / PT/PER DIEM',         category: 'WAGES/SALARY',      budget: 36200,   net_change: 8049.07,   balance: 28150.93 },
  { dept: 'Administration', dept_code: '01', account: 'E 01-001-04', name: 'WAGES/SALARY / VOLUNTEER/STIPEND',   category: 'WAGES/SALARY',      budget: 1620,    net_change: 17257.23,  balance: -15637.23 },
  { dept: 'Administration', dept_code: '01', account: 'E 01-001-06', name: 'WAGES/SALARY / BOARD',               category: 'WAGES/SALARY',      budget: 14700,   net_change: 6300,      balance: 8400 },
  { dept: 'Administration', dept_code: '01', account: 'E 01-001-07', name: 'WAGES/SALARY / SEC/ADMINAST',        category: 'WAGES/SALARY',      budget: 7680,    net_change: 5580,      balance: 2100 },
  { dept: 'Administration', dept_code: '01', account: 'E 01-001-11', name: 'WAGES/SALARY / ELECTION CLK',        category: 'WAGES/SALARY',      budget: 3500,    net_change: 1716.18,   balance: 1783.82 },
  { dept: 'Administration', dept_code: '01', account: 'E 01-001-24', name: 'WAGES/SALARY / PUBLIC HEALTH',       category: 'WAGES/SALARY',      budget: 1200,    net_change: 0,         balance: 1200 },
  { dept: 'Administration', dept_code: '01', account: 'E 01-002-01', name: 'BENEFITS / FICA',                    category: 'BENEFITS',          budget: 26575,   net_change: 20581.86,  balance: 5993.14 },
  { dept: 'Administration', dept_code: '01', account: 'E 01-002-02', name: 'BENEFITS / HEALTH INS',              category: 'BENEFITS',          budget: 101230,  net_change: 66095.66,  balance: 35134.34 },
  { dept: 'Administration', dept_code: '01', account: 'E 01-002-20', name: 'BENEFITS / PFML',                    category: 'BENEFITS',          budget: 1737,    net_change: 1263.98,   balance: 473.02 },
  { dept: 'Administration', dept_code: '01', account: 'E 01-002-22', name: 'BENEFITS / ICMA',                    category: 'BENEFITS',          budget: 20130,   net_change: 9878.38,   balance: 10251.62 },
  { dept: 'Administration', dept_code: '01', account: 'E 01-003-01', name: 'OFFICE SUPPLIES / GENERAL',          category: 'OFFICE SUPPLIES',   budget: 4000,    net_change: 4465.01,   balance: -465.01 },
  { dept: 'Administration', dept_code: '01', account: 'E 01-003-03', name: 'OFFICE SUPPLIES / POSTAGE',          category: 'OFFICE SUPPLIES',   budget: 6500,    net_change: 700.64,    balance: 5799.36 },
  { dept: 'Administration', dept_code: '01', account: 'E 01-003-04', name: 'OFFICE SUPPLIES / COMPUTER',         category: 'OFFICE SUPPLIES',   budget: 2000,    net_change: 56.44,     balance: 1943.56 },
  { dept: 'Administration', dept_code: '01', account: 'E 01-004-01', name: 'UTILITIES / ELECTRICITY',            category: 'UTILITIES',         budget: 2750,    net_change: 1571.53,   balance: 1178.47 },
  { dept: 'Administration', dept_code: '01', account: 'E 01-004-02', name: 'UTILITIES / HEAT',                   category: 'UTILITIES',         budget: 3750,    net_change: 2798.34,   balance: 951.66 },
  { dept: 'Administration', dept_code: '01', account: 'E 01-004-03', name: 'UTILITIES / SEWER',                  category: 'UTILITIES',         budget: 382,     net_change: 147.90,    balance: 234.10 },
  { dept: 'Administration', dept_code: '01', account: 'E 01-004-04', name: 'UTILITIES / WATER',                  category: 'UTILITIES',         budget: 400,     net_change: 349.76,    balance: 50.24 },
  { dept: 'Administration', dept_code: '01', account: 'E 01-004-05', name: 'UTILITIES / TELEPHONE',              category: 'UTILITIES',         budget: 4000,    net_change: 3772.95,   balance: 227.05 },
  { dept: 'Administration', dept_code: '01', account: 'E 01-005-01', name: 'OPERATING EXPENSES / AUDIT',         category: 'OPERATING EXPENSES',budget: 12000,   net_change: 20223.03,  balance: -8223.03 },
  { dept: 'Administration', dept_code: '01', account: 'E 01-005-02', name: 'OPERATING EXPENSES / LEGAL',         category: 'OPERATING EXPENSES',budget: 1000,    net_change: 5842.50,   balance: -4842.50 },
  { dept: 'Administration', dept_code: '01', account: 'E 01-005-04', name: 'OPERATING EXPENSES / ADS',           category: 'OPERATING EXPENSES',budget: 1600,    net_change: 678.30,    balance: 921.70 },
  { dept: 'Administration', dept_code: '01', account: 'E 01-005-05', name: 'OPERATING EXPENSES / TM EXPENSE',    category: 'OPERATING EXPENSES',budget: 3900,    net_change: 3735,      balance: 165 },
  { dept: 'Administration', dept_code: '01', account: 'E 01-005-06', name: 'OPERATING EXPENSES / TRAIN/TRAVEL',  category: 'OPERATING EXPENSES',budget: 3000,    net_change: 5471.43,   balance: -2471.43 },
  { dept: 'Administration', dept_code: '01', account: 'E 01-005-09', name: 'OPERATING EXPENSES / DUES/SUBS',     category: 'OPERATING EXPENSES',budget: 5100,    net_change: 6718.82,   balance: -1618.82 },
  { dept: 'Administration', dept_code: '01', account: 'E 01-005-26', name: 'OPERATING EXPENSES / BANK CHARGES',  category: 'OPERATING EXPENSES',budget: 10000,   net_change: 0,         balance: 10000 },
  { dept: 'Administration', dept_code: '01', account: 'E 01-006-01', name: "INSURANCES / GEN'L LIAB",            category: 'INSURANCES',        budget: 5720,    net_change: 7835,      balance: -2115 },
  { dept: 'Administration', dept_code: '01', account: 'E 01-006-05', name: 'INSURANCES / UNEMPLOYMENT',          category: 'INSURANCES',        budget: 468,     net_change: 396.28,    balance: 71.72 },
  { dept: 'Administration', dept_code: '01', account: 'E 01-006-06', name: 'INSURANCES / WORKERS COMP',          category: 'INSURANCES',        budget: 2200,    net_change: 998.98,    balance: 1201.02 },
  { dept: 'Administration', dept_code: '01', account: 'E 01-008-01', name: 'EQUIP MAINT / COMPUTER',             category: 'EQUIP MAINT',       budget: 13000,   net_change: 1746.35,   balance: 11253.65 },
  { dept: 'Administration', dept_code: '01', account: 'E 01-009-01', name: 'BLDG MAINT / STRUCTURE REPAIRS',     category: 'BLDG MAINT',        budget: 1000,    net_change: 71401.78,  balance: -70401.78 },
  { dept: 'Administration', dept_code: '01', account: 'E 01-022-99', name: 'GRANTS / OTHER',                     category: 'GRANTS',            budget: 0,       net_change: 38163.63,  balance: -38163.63 },

  // FIRE DEPT
  { dept: 'Fire Department', dept_code: '02', account: 'E 02-001-01', name: 'WAGES/SALARY / DEPT HEADS',         category: 'WAGES/SALARY',      budget: 15750,   net_change: 11250,     balance: 4500 },
  { dept: 'Fire Department', dept_code: '02', account: 'E 02-001-02', name: 'WAGES/SALARY / FULL TIME',          category: 'WAGES/SALARY',      budget: 135440,  net_change: 92941.75,  balance: 42498.25 },
  { dept: 'Fire Department', dept_code: '02', account: 'E 02-001-03', name: 'WAGES/SALARY / PT/PER DIEM',        category: 'WAGES/SALARY',      budget: 34500,   net_change: 38771.60,  balance: -4271.60 },
  { dept: 'Fire Department', dept_code: '02', account: 'E 02-001-04', name: 'WAGES/SALARY / VOLUNTEER/STIPEND',  category: 'WAGES/SALARY',      budget: 60900,   net_change: 72478.22,  balance: -11578.22 },
  { dept: 'Fire Department', dept_code: '02', account: 'E 02-001-05', name: 'WAGES/SALARY / OVERTIME',           category: 'WAGES/SALARY',      budget: 18000,   net_change: 6243.82,   balance: 11756.18 },
  { dept: 'Fire Department', dept_code: '02', account: 'E 02-002-01', name: 'BENEFITS / FICA',                   category: 'BENEFITS',          budget: 20242,   net_change: 17590.90,  balance: 2651.10 },
  { dept: 'Fire Department', dept_code: '02', account: 'E 02-002-02', name: 'BENEFITS / HEALTH INS',             category: 'BENEFITS',          budget: 47246,   net_change: 37187.79,  balance: 10058.21 },
  { dept: 'Fire Department', dept_code: '02', account: 'E 02-002-22', name: 'BENEFITS / ICMA',                   category: 'BENEFITS',          budget: 4020,    net_change: 4841.47,   balance: -821.47 },
  { dept: 'Fire Department', dept_code: '02', account: 'E 02-003-01', name: 'OFFICE SUPPLIES / GENERAL',         category: 'OFFICE SUPPLIES',   budget: 650,     net_change: 3176.67,   balance: -2526.67 },
  { dept: 'Fire Department', dept_code: '02', account: 'E 02-004-05', name: 'UTILITIES / TELEPHONE',             category: 'UTILITIES',         budget: 2000,    net_change: 1366.86,   balance: 633.14 },
  { dept: 'Fire Department', dept_code: '02', account: 'E 02-004-12', name: 'UTILITIES / BLDG APPROP',           category: 'UTILITIES',         budget: 18125,   net_change: 18125,     balance: 0 },
  { dept: 'Fire Department', dept_code: '02', account: 'E 02-005-06', name: 'OPERATING EXPENSES / TRAIN/TRAVEL', category: 'OPERATING EXPENSES',budget: 1000,    net_change: 1234.45,   balance: -234.45 },
  { dept: 'Fire Department', dept_code: '02', account: 'E 02-006-01', name: "INSURANCES / GEN'L LIAB",           category: 'INSURANCES',        budget: 1650,    net_change: 3400.50,   balance: -1750.50 },
  { dept: 'Fire Department', dept_code: '02', account: 'E 02-006-06', name: 'INSURANCES / WORKERS COMP',         category: 'INSURANCES',        budget: 25000,   net_change: 12836.88,  balance: 12163.12 },
  { dept: 'Fire Department', dept_code: '02', account: 'E 02-008-10', name: 'EQUIP MAINT / VEHICLE MAINT',       category: 'EQUIP MAINT',       budget: 12000,   net_change: 10633.65,  balance: 1366.35 },
  { dept: 'Fire Department', dept_code: '02', account: 'E 02-008-12', name: 'EQUIP MAINT / EQUIP SUPPLY',        category: 'EQUIP MAINT',       budget: 7500,    net_change: 14286.29,  balance: -6786.29 },
  { dept: 'Fire Department', dept_code: '02', account: 'E 02-008-13', name: 'EQUIP MAINT / EQUIPMENT MAINT',     category: 'EQUIP MAINT',       budget: 5000,    net_change: 5554,      balance: -554 },
  { dept: 'Fire Department', dept_code: '02', account: 'E 02-010-01', name: 'CLOTHING / UNIFORMS',               category: 'CLOTHING',          budget: 1000,    net_change: 3005.61,   balance: -2005.61 },
  { dept: 'Fire Department', dept_code: '02', account: 'E 02-010-04', name: 'CLOTHING / TURNOUT GEAR',           category: 'CLOTHING',          budget: 10000,   net_change: 0,         balance: 10000 },

  // POLICE
  { dept: 'Police Department', dept_code: '03', account: 'E 03-001-01', name: 'WAGES/SALARY / DEPT HEADS',       category: 'WAGES/SALARY',      budget: 84244,   net_change: 63446.05,  balance: 20797.95 },
  { dept: 'Police Department', dept_code: '03', account: 'E 03-001-02', name: 'WAGES/SALARY / FULL TIME',        category: 'WAGES/SALARY',      budget: 231426,  net_change: 153480.66, balance: 77945.34 },
  { dept: 'Police Department', dept_code: '03', account: 'E 03-001-04', name: 'WAGES/SALARY / VOLUNTEER/RESERVE',category: 'WAGES/SALARY',      budget: 35000,   net_change: 38157,     balance: -3157 },
  { dept: 'Police Department', dept_code: '03', account: 'E 03-001-05', name: 'WAGES/SALARY / OVERTIME',         category: 'WAGES/SALARY',      budget: 10000,   net_change: 19661.64,  balance: -9661.64 },
  { dept: 'Police Department', dept_code: '03', account: 'E 03-001-10', name: 'WAGES/SALARY / SCHOOL RO',        category: 'WAGES/SALARY',      budget: 20000,   net_change: 11595,     balance: 8405 },
  { dept: 'Police Department', dept_code: '03', account: 'E 03-001-13', name: 'WAGES/SALARY / ANIMAL CONTROL',   category: 'WAGES/SALARY',      budget: 6600,    net_change: 4950,      balance: 1650 },
  { dept: 'Police Department', dept_code: '03', account: 'E 03-002-01', name: 'BENEFITS / FICA',                 category: 'BENEFITS',          budget: 29665,   net_change: 22496.54,  balance: 7168.46 },
  { dept: 'Police Department', dept_code: '03', account: 'E 03-002-02', name: 'BENEFITS / HEALTH INS',           category: 'BENEFITS',          budget: 94492,   net_change: 80183.27,  balance: 14308.73 },
  { dept: 'Police Department', dept_code: '03', account: 'E 03-002-04', name: 'BENEFITS / MEPERS',               category: 'BENEFITS',          budget: 40075,   net_change: 28627.22,  balance: 11447.78 },
  { dept: 'Police Department', dept_code: '03', account: 'E 03-003-01', name: 'OFFICE SUPPLIES / GENERAL',       category: 'OFFICE SUPPLIES',   budget: 3000,    net_change: 3847.20,   balance: -847.20 },
  { dept: 'Police Department', dept_code: '03', account: 'E 03-003-04', name: 'OFFICE SUPPLIES / COMPUTER',      category: 'OFFICE SUPPLIES',   budget: 8500,    net_change: 8783.04,   balance: -283.04 },
  { dept: 'Police Department', dept_code: '03', account: 'E 03-004-05', name: 'UTILITIES / TELEPHONE',           category: 'UTILITIES',         budget: 7000,    net_change: 7881.79,   balance: -881.79 },
  { dept: 'Police Department', dept_code: '03', account: 'E 03-005-06', name: 'OPERATING EXPENSES / TRAIN/TRAVEL',category:'OPERATING EXPENSES', budget: 8000,   net_change: 4993.37,   balance: 3006.63 },
  { dept: 'Police Department', dept_code: '03', account: 'E 03-006-01', name: "INSURANCES / GEN'L LIAB",         category: 'INSURANCES',        budget: 8800,    net_change: 6831.50,   balance: 1968.50 },
  { dept: 'Police Department', dept_code: '03', account: 'E 03-006-06', name: 'INSURANCES / WORKERS COMP',       category: 'INSURANCES',        budget: 13040,   net_change: 8883.68,   balance: 4156.32 },
  { dept: 'Police Department', dept_code: '03', account: 'E 03-008-09', name: 'EQUIP MAINT / GAS/DIESEL',        category: 'EQUIP MAINT',       budget: 13000,   net_change: 13803.58,  balance: -803.58 },
  { dept: 'Police Department', dept_code: '03', account: 'E 03-008-10', name: 'EQUIP MAINT / VEHICLE MAINT',     category: 'EQUIP MAINT',       budget: 10000,   net_change: 10413.16,  balance: -413.16 },
  { dept: 'Police Department', dept_code: '03', account: 'E 03-008-11', name: 'EQUIP MAINT / TIRES',             category: 'EQUIP MAINT',       budget: 1500,    net_change: 2788,      balance: -1288 },
  { dept: 'Police Department', dept_code: '03', account: 'E 03-008-12', name: 'EQUIP MAINT / EQUIP SUPPLY',      category: 'EQUIP MAINT',       budget: 6000,    net_change: 6508.12,   balance: -508.12 },
  { dept: 'Police Department', dept_code: '03', account: 'E 03-012-05', name: 'CAPITAL PROJECTS / VEHICLE REPL', category: 'CAPITAL PROJECTS',  budget: 115000,  net_change: 22762.38,  balance: 92237.62 },

  // PUBLIC WORKS
  { dept: 'Public Works', dept_code: '04', account: 'E 04-001-01', name: 'WAGES/SALARY / DEPT HEADS',            category: 'WAGES/SALARY',      budget: 68287,   net_change: 51214.81,  balance: 17072.19 },
  { dept: 'Public Works', dept_code: '04', account: 'E 04-001-02', name: 'WAGES/SALARY / FULL TIME',             category: 'WAGES/SALARY',      budget: 140465,  net_change: 92313.61,  balance: 48151.39 },
  { dept: 'Public Works', dept_code: '04', account: 'E 04-001-03', name: 'WAGES/SALARY / PT/PER DIEM',           category: 'WAGES/SALARY',      budget: 6000,    net_change: 5597.66,   balance: 402.34 },
  { dept: 'Public Works', dept_code: '04', account: 'E 04-001-05', name: 'WAGES/SALARY / OVERTIME',              category: 'WAGES/SALARY',      budget: 12500,   net_change: 11570.47,  balance: 929.53 },
  { dept: 'Public Works', dept_code: '04', account: 'E 04-002-01', name: 'BENEFITS / FICA',                      category: 'BENEFITS',          budget: 17385,   net_change: 12293.07,  balance: 5091.93 },
  { dept: 'Public Works', dept_code: '04', account: 'E 04-002-02', name: 'BENEFITS / HEALTH INS',                category: 'BENEFITS',          budget: 94492,   net_change: 76258.27,  balance: 18233.73 },
  { dept: 'Public Works', dept_code: '04', account: 'E 04-005-19', name: 'OPERATING EXPENSES / SAND/SALT',       category: 'OPERATING EXPENSES',budget: 58000,   net_change: 53020.71,  balance: 4979.29 },
  { dept: 'Public Works', dept_code: '04', account: 'E 04-006-01', name: "INSURANCES / GEN'L LIAB",              category: 'INSURANCES',        budget: 1837,    net_change: 5204.50,   balance: -3367.50 },
  { dept: 'Public Works', dept_code: '04', account: 'E 04-006-04', name: 'INSURANCES / FLEET',                   category: 'INSURANCES',        budget: 11825,   net_change: 0,         balance: 11825 },
  { dept: 'Public Works', dept_code: '04', account: 'E 04-006-06', name: 'INSURANCES / WORKERS COMP',            category: 'INSURANCES',        budget: 18206,   net_change: 6128.71,   balance: 12077.29 },
  { dept: 'Public Works', dept_code: '04', account: 'E 04-008-09', name: 'EQUIP MAINT / GAS/DIESEL',             category: 'EQUIP MAINT',       budget: 23000,   net_change: 17270.03,  balance: 5729.97 },
  { dept: 'Public Works', dept_code: '04', account: 'E 04-008-10', name: 'EQUIP MAINT / VEHICLE MAINT',          category: 'EQUIP MAINT',       budget: 42000,   net_change: 53213.42,  balance: -11213.42 },
  { dept: 'Public Works', dept_code: '04', account: 'E 04-011-01', name: 'CONTRACT SERVICES / CONSTRUCTION',     category: 'CONTRACT SERVICES', budget: 16000,   net_change: 7129.29,   balance: 8870.71 },

  // PUBLIC SAFETY BUILDING
  { dept: 'Public Safety Building', dept_code: '07', account: 'E 07-004-01', name: 'UTILITIES / ELECTRICITY',   category: 'UTILITIES',         budget: 8500,    net_change: 6887.53,   balance: 1612.47 },
  { dept: 'Public Safety Building', dept_code: '07', account: 'E 07-004-02', name: 'UTILITIES / HEAT',          category: 'UTILITIES',         budget: 9000,    net_change: 6766.68,   balance: 2233.32 },
  { dept: 'Public Safety Building', dept_code: '07', account: 'E 07-004-03', name: 'UTILITIES / SEWER',         category: 'UTILITIES',         budget: 1300,    net_change: 1144.83,   balance: 155.17 },
  { dept: 'Public Safety Building', dept_code: '07', account: 'E 07-009-01', name: 'BLDG MAINT / STRUCTURE',    category: 'BLDG MAINT',        budget: 15000,   net_change: 1390.39,   balance: 13609.61 },

  // PARKS & RECREATION
  { dept: 'Parks & Recreation', dept_code: '08', account: 'E 08-013-05', name: 'THIRD PARTY / 4TH OF JULY',     category: 'OTHER',             budget: 750,     net_change: 4000,      balance: -3250 },
  { dept: 'Parks & Recreation', dept_code: '08', account: 'E 08-013-13', name: 'THIRD PARTY / FIREWORKS',       category: 'OTHER',             budget: 6500,    net_change: 1000,      balance: 5500 },
  { dept: 'Parks & Recreation', dept_code: '08', account: 'E 08-015-11', name: 'REC PROGRAM / PLAYGROUND',      category: 'OTHER',             budget: 5000,    net_change: 2293.95,   balance: 2706.05 },
  { dept: 'Parks & Recreation', dept_code: '08', account: 'E 08-017-05', name: 'OTHER SERVICES / BAD LITTLE FALLS',category:'OTHER',           budget: 5000,    net_change: 8313.15,   balance: -3313.15 },
  { dept: 'Parks & Recreation', dept_code: '08', account: 'E 08-017-12', name: 'OTHER SERVICES / SKATE PARK',   category: 'OTHER',             budget: 35669,   net_change: 36419,     balance: -750 },

  // TAX ASSESSOR
  { dept: 'Tax Assessor', dept_code: '09', account: 'E 09-001-01', name: 'WAGES/SALARY / DEPT HEADS',           category: 'WAGES/SALARY',      budget: 0,       net_change: 15000,     balance: -15000 },
  { dept: 'Tax Assessor', dept_code: '09', account: 'E 09-011-10', name: 'CONTRACT SERVICES',                   category: 'CONTRACT SERVICES', budget: 30000,   net_change: 7500,      balance: 22500 },
  { dept: 'Tax Assessor', dept_code: '09', account: 'E 09-011-99', name: 'CONTRACT SERVICES / MISC',            category: 'CONTRACT SERVICES', budget: 5834,    net_change: 3750.03,   balance: 2083.97 },

  // PLANNING BOARD
  { dept: 'Planning Board', dept_code: '18', account: 'E 18-001-12', name: 'WAGES/SALARY / SEC/PLANNING',       category: 'WAGES/SALARY',      budget: 1920,    net_change: 1395,      balance: 525 },
  { dept: 'Planning Board', dept_code: '18', account: 'E 18-005-02', name: 'OPERATING EXPENSES / LEGAL',        category: 'OPERATING EXPENSES',budget: 2500,    net_change: 9394.50,   balance: -6894.50 },

  // GENERAL ASSISTANCE
  { dept: 'General Assistance', dept_code: '13', account: 'E 13-004-01', name: 'UTILITIES / ELECTRICITY',       category: 'UTILITIES',         budget: 500,     net_change: 2657,      balance: -2157 },
  { dept: 'General Assistance', dept_code: '13', account: 'E 13-004-02', name: 'UTILITIES / HEAT',              category: 'UTILITIES',         budget: 1500,    net_change: 13685.68,  balance: -12185.68 },
  { dept: 'General Assistance', dept_code: '13', account: 'E 13-004-08', name: 'UTILITIES / FOOD',              category: 'UTILITIES',         budget: 500,     net_change: 4330,      balance: -3830 },
  { dept: 'General Assistance', dept_code: '13', account: 'E 13-004-09', name: 'UTILITIES / RENT/MOTEL',        category: 'UTILITIES',         budget: 1500,    net_change: 8801.32,   balance: -7301.32 },

  // OTHER MUNICIPAL SERVICES
  { dept: 'Other Municipal Services', dept_code: '17', account: 'E 17-004-06', name: 'UTILITIES / FIRE HYDRANT', category: 'UTILITIES',        budget: 212432,  net_change: 137029,    balance: 75403 },
  { dept: 'Other Municipal Services', dept_code: '17', account: 'E 17-004-07', name: 'UTILITIES / STREET LIGHT', category: 'UTILITIES',        budget: 40920,   net_change: 34962.22,  balance: 5957.78 },
  { dept: 'Other Municipal Services', dept_code: '17', account: 'E 17-017-01', name: 'CONTINGENCY',              category: 'OTHER',            budget: 10000,   net_change: 4274.38,   balance: 5725.62 },
  { dept: 'Other Municipal Services', dept_code: '17', account: 'E 17-017-50', name: 'TIF REIMBURSEMENT',        category: 'OTHER',            budget: 80000,   net_change: 0,         balance: 80000 },

  // COUNTY ASSESSMENT
  { dept: 'Washington County Tax', dept_code: '16', account: 'E 16-016-01', name: "GOV'T AGENCY / WASH CTY TAX", category: "GOV'T AGENCY",    budget: 389780,  net_change: 703932.41, balance: -314152.41 },

  // DEBT SERVICE
  { dept: 'Debt Service', dept_code: '19', account: 'E 19-019-43', name: 'LOANS/NOTES / PUBLIC WORKS $530K',    category: 'LOANS/NOTES',       budget: 124035,  net_change: 124034.93, balance: 0.07 },
  { dept: 'Debt Service', dept_code: '19', account: 'E 19-019-45', name: 'LOANS/NOTES / 2017SRF/ELM',          category: 'LOANS/NOTES',       budget: 28000,   net_change: 26165.15,  balance: 1834.85 },
  { dept: 'Debt Service', dept_code: '19', account: 'E 19-019-56', name: 'LOANS/NOTES / PUBLIC SAFETY BLDG',   category: 'LOANS/NOTES',       budget: 22890,   net_change: 22882.26,  balance: 7.74 },
  { dept: 'Debt Service', dept_code: '19', account: 'E 19-019-58', name: 'LOANS/NOTES / ROAD LOAN $231K',      category: 'LOANS/NOTES',       budget: 26429,   net_change: 26429,     balance: 0 },

  // GENERAL EDUCATION
  { dept: 'General Education', dept_code: '29', account: 'E 29-300-01', name: 'GENERAL EDUCATION / GENERAL',    category: 'GENERAL EDUCATION', budget: 1751194, net_change: 875596.80, balance: 875597.20 },
  { dept: 'General Education', dept_code: '29', account: 'E 29-300-02', name: 'GENERAL EDUCATION / ADULT ED',   category: 'GENERAL EDUCATION', budget: 20000,   net_change: 0,         balance: 20000 },
];

const FUND_SUMMARIES = [
  { fund: '01', name: 'General Fund',    expense_budget: 5628700,  expense_ytd: 4731935 },
  { fund: '02', name: 'Sewer Fund',      expense_budget: 702546,   expense_ytd: 1307064 },
  { fund: '03', name: 'Ambulance Fund',  expense_budget: 1568460,  expense_ytd: 1282131 },
  { fund: '08', name: 'Solid Waste',     expense_budget: 307730,   expense_ytd: 179124 },
  { fund: '06', name: 'Telecenter',      expense_budget: 73006,    expense_ytd: 90709 },
];

function buildDeptSummaries(data) {
  const map = {};
  data.forEach(r => {
    if (!map[r.dept]) map[r.dept] = { dept: r.dept, dept_code: r.dept_code, budget: 0, ytd: 0, balance: 0 };
    map[r.dept].budget  += r.budget || 0;
    map[r.dept].ytd     += r.net_change || 0;
    map[r.dept].balance += r.balance || 0;
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
  const pct = dept.budget > 0 ? ((dept.ytd / dept.budget) * 100).toFixed(1) : '—';
  const over = dept.balance < 0;
  return (
    <div className="border-b border-slate-100 last:border-0">
      <div className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-slate-50 transition-colors ${over ? 'bg-red-50/40' : ''}`} onClick={() => setOpen(v => !v)}>
        <div className="flex-shrink-0 text-slate-300">{open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-xs font-bold text-slate-800">{dept.dept}</p>
            {over && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 font-bold">OVER BUDGET</span>}
            {!over && dept.budget > 0 && parseFloat(pct) > 85 && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold">NEAR LIMIT</span>}
          </div>
          <SpendBar ytd={dept.ytd} budget={dept.budget} />
        </div>
        <div className="flex gap-6 text-[10px] flex-shrink-0 ml-4">
          <span className="text-slate-500">Budget: <span className="font-semibold text-slate-800">{fmt(dept.budget)}</span></span>
          <span className="text-slate-500">YTD: <span className="font-semibold text-slate-800">{fmt(dept.ytd)}</span></span>
          <span className={`font-bold ${over ? 'text-red-600' : 'text-slate-600'}`}>{pct}% used</span>
          <span className={`font-mono font-bold ${over ? 'text-red-600' : 'text-emerald-700'}`}>{over ? '-' : ''}{fmt(dept.balance)}</span>
        </div>
      </div>
      {open && (
        <div className="bg-slate-50 border-t border-slate-100">
          <div className="grid grid-cols-6 text-[9px] font-bold uppercase tracking-wider text-slate-400 px-8 py-1.5 bg-slate-100">
            <span className="col-span-2">Account</span>
            <span className="text-right">Budget</span>
            <span className="text-right">YTD Spent</span>
            <span className="text-right">Balance</span>
            <span className="text-right">% Used</span>
          </div>
          {lines.map(l => {
            const lineOver = l.balance < 0 && l.budget > 0;
            return (
              <div key={l.account} className={`grid grid-cols-6 text-[10px] px-8 py-1.5 border-b border-slate-100 last:border-0 ${lineOver ? 'bg-red-50/50' : ''}`}>
                <div className="col-span-2 text-slate-600 truncate pr-2">
                  <span className="font-mono text-[9px] text-slate-400 mr-1">{l.account}</span>
                  {l.name}
                  {lineOver && <span className="ml-1 text-[8px] text-red-600 font-bold">▲OVER</span>}
                </div>
                <span className="text-right tabular-nums text-slate-700">{l.budget > 0 ? fmt(l.budget) : '—'}</span>
                <span className="text-right tabular-nums text-slate-700">{fmt(l.net_change)}</span>
                <span className={`text-right tabular-nums font-semibold ${lineOver ? 'text-red-600' : 'text-slate-700'}`}>{lineOver ? '-' : ''}{fmt(l.balance)}</span>
                <span className={`text-right tabular-nums ${lineOver ? 'text-red-600 font-bold' : 'text-slate-500'}`}>{pctUsed(l.net_change, l.budget)}%</span>
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

  const deptSummaries = useMemo(() => buildDeptSummaries(TRIAL_BALANCE_DATA), []);

  const filteredDepts = useMemo(() => deptSummaries.filter(d => {
    const matchSearch = !search || d.dept.toLowerCase().includes(search.toLowerCase());
    const matchOver   = !filterOver || d.balance < 0;
    return matchSearch && matchOver;
  }), [deptSummaries, search, filterOver]);

  const overBudgetLines = TRIAL_BALANCE_DATA.filter(l => l.balance < 0 && l.budget > 0);
  const totalBudget = TRIAL_BALANCE_DATA.reduce((s, l) => s + (l.budget || 0), 0);
  const totalYTD    = TRIAL_BALANCE_DATA.reduce((s, l) => s + (l.net_change || 0), 0);

  return (
    <div className="space-y-6">
      <SectionHeader title="Trial Balance — FY2026" subtitle="As of March 24, 2026 · Town of Machias · All Funds" icon={BarChart2} />

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
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500 font-semibold">Tracked Budget</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{fmt(totalBudget)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500 font-semibold">YTD Expenditures</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{fmt(totalYTD)}</p>
          <p className="text-[10px] text-slate-400 mt-1">{pctUsed(totalYTD, totalBudget)}% of budget</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500 font-semibold">General Fund Total Budget</p>
          <p className="text-xl font-bold text-slate-900 mt-1">$5,628,700</p>
          <p className="text-[10px] text-slate-400 mt-1">84.1% spent YTD</p>
        </div>
        <div className={`rounded-xl border p-4 ${overBudgetLines.length > 0 ? 'border-red-200 bg-red-50' : 'border-emerald-200 bg-emerald-50'}`}>
          <p className="text-xs text-slate-500 font-semibold">Over-Budget Lines</p>
          <p className={`text-xl font-bold mt-1 ${overBudgetLines.length > 0 ? 'text-red-700' : 'text-emerald-700'}`}>{overBudgetLines.length}</p>
          <p className="text-[10px] text-slate-400 mt-1">accounts exceeding budget</p>
        </div>
      </div>

      {/* Over-budget alert */}
      {overBudgetLines.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
            <p className="text-xs font-bold text-red-800">{overBudgetLines.length} Line Items Over Budget</p>
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
          <p className="text-xs font-bold uppercase tracking-wider">Department Expenditure Detail</p>
          <p className="text-[10px] text-slate-400">Click department to expand line items</p>
        </div>
        {filteredDepts.map(d => (
          <DeptRow key={d.dept} dept={d} lines={TRIAL_BALANCE_DATA.filter(l => l.dept === d.dept)} />
        ))}
      </div>

      <p className="text-[9px] text-slate-400 text-center italic">
        Source: Machias Trial Balance as of 03/24/2026 · Prepared by Nicholas MacDonald · For internal planning use only.
      </p>
    </div>
  );
}