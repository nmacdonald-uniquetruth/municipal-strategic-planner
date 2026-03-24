/**
 * WarrantBuilder — Annual Town Warrant Builder
 *
 * Tabs:
 *  1. Articles       — list, add, edit, reorder
 *  2. Draft Packet   — 3-mode text preview + export
 *  3. Rollup / BETE  — article totals vs adopted budget + BETE reconciliation
 *  4. Validation     — errors, warnings, numbering gaps
 *  5. History        — per-article multi-year history viewer
 */
import React, { useState, useMemo, useCallback } from 'react';
import { useModel } from '../components/machias/ModelContext';
import { calculateTaxCommitment } from '../components/budget/budgetEngine';
import {
  validateArticles, buildArticleRollup, findNumberingGaps,
  generateDraftText, ARTICLE_CATEGORIES, VOTING_LABELS,
} from '../components/warrant/warrantEngine';
import WarrantBuilderArticleForm from '../components/warrant/WarrantBuilderArticleForm';
import WarrantPacketGenerator from '../components/warrant/WarrantPacketGenerator';
import ArticleRollupPanel from '../components/warrant/ArticleRollupPanel';
import WarrantValidationPanel from '../components/warrant/WarrantValidationPanel';
import ArticleHistoryPanel from '../components/warrant/ArticleHistoryPanel';
import SectionHeader from '../components/machias/SectionHeader';
import ArticleMappingTable from '../components/warrant/ArticleMappingTable';
import MappingExceptionsReport from '../components/warrant/MappingExceptionsReport';
import {
  buildDefaultLineItems, applyAllSuggestedMappings,
  rollupByBeteLine, findMappingExceptions, checkAdoptionReadiness,
} from '../components/warrant/articleMappingEngine';
import {
  FileText, Plus, AlertTriangle, BarChart2, Clock, ChevronUp, ChevronDown,
  Trash2, Pencil, Copy, Scroll, CheckCircle, GitMerge,
} from 'lucide-react';

const fmt = n => `$${Math.round(Math.abs(n || 0)).toLocaleString()}`;

// ── FY26 Actual Article Data (from 2025 Annual Town Meeting Warrant) ──────────
// Used as FY26 seed and as prior-year template for FY27
const FY26_ARTICLES = [
  // --- Administrative / Procedural ---
  { article_number: 'Article 1', sort_order: 1, title: 'Elect Moderator', category: 'other', legal_type: 'information', voting_method: 'n_a', financial_amount: 0, prior_year_amount: 0, bete_mapping: '', linked_departments: [],
    draft_text: 'To elect a Moderator to preside at said meeting.',
    pub_purpose: 'Elects a Moderator to run the town meeting.', pub_key_change: 'Routine procedural article.', pub_recurring: true },
  { article_number: 'Article 2', sort_order: 2, title: 'Elect Town Officials', category: 'policy_authorization', legal_type: 'authorization', voting_method: 'secret_ballot', financial_amount: 0, prior_year_amount: 0, bete_mapping: '', linked_departments: ['Administration'],
    draft_text: 'To elect the following town officials: One Selectperson to serve until the 2028 Annual Town Meeting, One School Board Member to serve until the 2028 Annual Town Meeting, Two Budget Committee Members, to serve until the 2028 Annual Town Meeting.',
    pub_purpose: 'Elects Select Board and other officers.', pub_key_change: 'Routine annual election.', pub_recurring: true },

  // --- Municipal Departments ---
  { article_number: 'Article 3', sort_order: 3, title: 'Administration', category: 'municipal_appropriation', legal_type: 'appropriation', voting_method: 'majority_voice', financial_amount: 596972, prior_year_amount: 635553, bete_mapping: 'municipalAppropriations', linked_departments: ['Administration'],
    draft_text: 'To see if the Town will vote to raise and appropriate the sum of $492,237.00 through taxation and to appropriate an additional $104,735.00 from the enterprise accounts listed below, for a total appropriation of $596,972.00 for the Administration Account. The Machias Select Board and the Budget Committee recommend.',
    line_items: [
      { section: 'Personnel', items: [{ name: 'Town Manager', fy25: 90068, fy26: 92320 },{ name: 'Full Time', fy25: 241083, fy26: 190160 },{ name: 'PT/Per Diem', fy25: 2000, fy26: 36200 },{ name: 'Public Health Officer', fy25: 1200, fy26: 1200 },{ name: 'Northfield Stipend', fy25: 1540, fy26: 1620 },{ name: 'Elections', fy25: 4000, fy26: 3500 },{ name: 'BD of Select-People Secretary', fy25: 7680, fy26: 7680 },{ name: 'Board of Select-People', fy25: 14700, fy26: 14700 }] },
      { section: 'Benefits', items: [{ name: 'FICA/Medicare', fy25: 27715, fy26: 26575 },{ name: 'Health Insurance', fy25: 108660, fy26: 101230 },{ name: 'PFML', fy25: 0, fy26: 1737 },{ name: "Worker's Compensation", fy25: 2000, fy26: 2200 },{ name: 'Unemployment Compensation', fy25: 425, fy26: 468 },{ name: 'Retirement', fy25: 22900, fy26: 20130 }] },
      { section: 'Supplies & Maintenance', items: [{ name: 'Office Supplies', fy25: 4000, fy26: 4000 },{ name: 'Equipment Maintenance', fy25: 1500, fy26: 1500 },{ name: 'Equipment Rental/Supplies', fy25: 600, fy26: 600 }] },
      { section: 'Technology', items: [{ name: 'Computer Equipment/Supplies', fy25: 5000, fy26: 2000 },{ name: 'Computer Licensing', fy25: 13000, fy26: 13000 }] },
      { section: 'Utilities', items: [{ name: 'Cleaning Supp.', fy25: 500, fy26: 500 },{ name: 'Structure Repairs', fy25: 1000, fy26: 1000 },{ name: 'Electricity', fy25: 4000, fy26: 2750 },{ name: 'Heating Fuel', fy25: 6000, fy26: 3750 },{ name: 'Sewer', fy25: 382, fy26: 382 },{ name: 'Water', fy25: 400, fy26: 400 },{ name: 'Telephone/Cell', fy25: 4000, fy26: 4000 }] },
      { section: 'Other', items: [{ name: 'Audit', fy25: 12000, fy26: 12000 },{ name: 'Advertising', fy25: 1500, fy26: 1600 },{ name: 'Drug Testing', fy25: 550, fy26: 550 },{ name: 'Bank Charges', fy25: 10000, fy26: 10000 },{ name: 'Legal', fy25: 1000, fy26: 1000 },{ name: 'Printing/Town Report', fy25: 1500, fy26: 1050 },{ name: 'Tax/Sewer Bills', fy25: 350, fy26: 350 },{ name: 'Professional Dues', fy25: 5100, fy26: 5100 },{ name: 'Training', fy25: 700, fy26: 3000 },{ name: 'Postage', fy25: 6500, fy26: 6500 },{ name: 'Town Manager Expense', fy25: 3900, fy26: 3900 }] },
      { section: 'Insurance', items: [{ name: 'Bldg./Gen Liability', fy25: 5200, fy26: 5720 },{ name: 'Public Officials Liability', fy25: 1500, fy26: 1650 },{ name: 'Blanket Bond', fy25: 500, fy26: 550 }] },
      { section: 'Contract Services', items: [{ name: 'Cleaning', fy25: 2400, fy26: 2400 },{ name: 'Contract Services', fy25: 6000, fy26: 3000 }] },
      { section: 'Capital Projects', items: [{ name: 'Capital Projects', fy25: 5000, fy26: 5000 },{ name: 'Computer/Software', fy25: 7500, fy26: 0 }] },
      { section: 'Enterprise Acct Fund Transfers', items: [{ name: 'Tel-Center', fy25: 18525, fy26: 18525 },{ name: 'Sewer Account', fy25: 21110, fy26: 21110 },{ name: 'Ambulance', fy25: 45000, fy26: 45000 },{ name: 'Transfer Station', fy25: 20100, fy26: 20100 }] },
    ],
    pub_purpose: 'Funds all administration, town manager, staff, and general government operations.', pub_key_change: '$596,972 total including enterprise offsets of $104,735.', pub_recurring: true },

  { article_number: 'Article 4', sort_order: 4, title: 'Public Safety Building', category: 'municipal_appropriation', legal_type: 'appropriation', voting_method: 'majority_voice', financial_amount: 36250, prior_year_amount: 37300, bete_mapping: 'municipalAppropriations', linked_departments: ['Public Safety Building'],
    draft_text: 'To see if the Town will vote to raise and appropriate the sum of $18,125.00 through taxation and to appropriate an additional $18,125.00 from the ambulance enterprise account for a total appropriation of $36,250.00 for the Public Safety Building. The Machias Select Board and the Budget Committee recommend.',
    line_items: [
      { section: 'Utilities', items: [{ name: 'Electricity', fy25: 8500, fy26: 8500 },{ name: 'Heat', fy25: 10500, fy26: 9000 },{ name: 'Sewer', fy25: 1200, fy26: 1300 },{ name: 'Water', fy25: 900, fy26: 1100 },{ name: 'Building Maintenance', fy25: 15000, fy26: 15000 }] },
      { section: 'Insurance', items: [{ name: 'Building', fy25: 1200, fy26: 1350 }] },
    ],
    pub_purpose: 'Maintains the Public Safety Building shared by Fire and Ambulance.', pub_recurring: true },

  { article_number: 'Article 5', sort_order: 5, title: 'Fire Department', category: 'municipal_appropriation', legal_type: 'appropriation', voting_method: 'majority_voice', financial_amount: 439598, prior_year_amount: 423452, bete_mapping: 'municipalAppropriations', linked_departments: ['Fire Department'],
    draft_text: 'To see if the Town will vote to raise and appropriate $391,473.00 through taxation and to appropriate an additional $30,000.00 from the Ambulance Enterprise Account for a total appropriation of $439,598.00 for the Fire Department. The Machias Select Board and the Budget Committee recommend.',
    line_items: [
      { section: 'Personnel', items: [{ name: 'Fire Chief', fy25: 15000, fy26: 15750 },{ name: 'Part-time Personnel', fy25: 32000, fy26: 34500 },{ name: 'Stipends for Volunteers', fy25: 58000, fy26: 60900 },{ name: 'Dispatchers', fy25: 130167, fy26: 135440 },{ name: 'Overtime', fy25: 20000, fy26: 18000 }] },
      { section: 'Benefits', items: [{ name: 'FICA/Medicare', fy25: 19525, fy26: 20242 },{ name: 'Health Insurance', fy25: 43350, fy26: 47246 },{ name: 'PFML', fy25: 0, fy26: 1325 },{ name: "Worker's Compensation", fy25: 25000, fy26: 25000 },{ name: 'Retirement', fy25: 3860, fy26: 4020 }] },
      { section: 'Supplies & Maintenance', items: [{ name: 'Office Supplies', fy25: 650, fy26: 650 },{ name: 'Vehicle Maintenance', fy25: 12000, fy26: 12000 },{ name: 'Equipment Maintenance', fy25: 5000, fy26: 5000 },{ name: 'Gas', fy25: 5000, fy26: 5000 },{ name: 'Equipment Rental/Supplies', fy25: 7500, fy26: 7500 },{ name: 'Personal Protective Equip.', fy25: 10000, fy26: 10000 },{ name: 'Airpacks', fy25: 2000, fy26: 2000 }] },
      { section: 'Utilities', items: [{ name: 'Telephone', fy25: 2000, fy26: 2000 },{ name: 'Heat', fy25: 3200, fy26: 3200 },{ name: '911 Lines', fy25: 1100, fy26: 1100 },{ name: 'Building Appropriations', fy25: 18650, fy26: 18125 }] },
      { section: 'Other', items: [{ name: 'Training/Travel', fy25: 1000, fy26: 1000 },{ name: 'Drug Testing', fy25: 400, fy26: 450 },{ name: 'Ads/Notices', fy25: 200, fy26: 200 },{ name: 'Boot Allowance', fy25: 500, fy26: 600 },{ name: 'Uniforms/Clothing', fy25: 750, fy26: 1000 }] },
      { section: 'Insurance', items: [{ name: 'General Liability', fy25: 1500, fy26: 1650 },{ name: 'Fleet', fy25: 4500, fy26: 4950 },{ name: 'Building', fy25: 150, fy26: 300 }] },
    ],
    pub_purpose: 'Funds volunteer fire department, dispatchers, training, and equipment.', pub_key_change: '$439,598 total; $30,000 offset from Ambulance Enterprise.', pub_recurring: true },

  { article_number: 'Article 6', sort_order: 6, title: 'Fire Dept — Carry Forward Balances', category: 'other', legal_type: 'authorization', voting_method: 'majority_voice', financial_amount: 0, prior_year_amount: 0, bete_mapping: '', linked_departments: ['Fire Department'],
    draft_text: 'To see if the Town will vote to carry forward any remaining balances under the 2024-2025 Fire Department budget from the following accounts: Personal Protective Equipment and Airpacks to be added to the Committed for Capital Projects: Fire Truck Replacement Account, and expend said funds for this purpose. The Machias Select Board and Budget Committee recommend.',
    pub_purpose: 'Carries forward unspent fire equipment funds to the Fire Truck Replacement capital account.', pub_recurring: false },

  { article_number: 'Article 7', sort_order: 7, title: 'Police Department', category: 'municipal_appropriation', legal_type: 'appropriation', voting_method: 'majority_voice', financial_amount: 767482, prior_year_amount: 595777, bete_mapping: 'municipalAppropriations', linked_departments: ['Police'],
    draft_text: 'To see if the Town will vote to raise and appropriate the sum of $767,482.00 through taxation for the Police Department. The Machias Select Board and The Budget Committee recommend.',
    line_items: [
      { section: 'Personnel', items: [{ name: 'Police Chief', fy25: 80232, fy26: 84244 },{ name: 'Officers', fy25: 214980, fy26: 231426 },{ name: 'Reserve Officers', fy25: 15000, fy26: 35000 },{ name: 'Animal Control Officer', fy25: 6600, fy26: 6600 },{ name: 'School Resource Officer', fy25: 20000, fy26: 20000 },{ name: 'Court Time', fy25: 500, fy26: 500 },{ name: 'Overtime', fy25: 10000, fy26: 10000 }] },
      { section: 'Benefits', items: [{ name: 'FICA/Medicare', fy25: 26570, fy26: 29665 },{ name: 'Health Insurance', fy25: 86700, fy26: 94492 },{ name: 'Maine State Retirement', fy25: 36075, fy26: 40075 },{ name: 'PFML', fy25: 0, fy26: 1940 },{ name: "Worker's Compensation", fy25: 11650, fy26: 13040 },{ name: 'Unemployment Compensation', fy25: 670, fy26: 500 }] },
      { section: 'Supplies & Maintenance', items: [{ name: 'Office Supplies', fy25: 2000, fy26: 3000 },{ name: 'Postage', fy25: 100, fy26: 100 },{ name: 'Vehicle Maintenance', fy25: 10000, fy26: 10000 },{ name: 'Gas', fy25: 12000, fy26: 13000 },{ name: 'Equip & Supply', fy25: 4500, fy26: 6000 },{ name: 'Equipment Maintenance', fy25: 500, fy26: 500 },{ name: 'Tires', fy25: 1500, fy26: 1500 }] },
      { section: 'Technology', items: [{ name: 'Computer Equip/Supplies', fy25: 2500, fy26: 8500 },{ name: 'Software Licensing', fy25: 1000, fy26: 1000 },{ name: 'Software Purchase', fy25: 500, fy26: 500 }] },
      { section: 'Utility', items: [{ name: 'Telephone', fy25: 7000, fy26: 7000 },{ name: 'Building Repairs', fy25: 1000, fy26: 0 },{ name: 'Building Appropriations', fy25: 10000, fy26: 0 }] },
      { section: 'Other', items: [{ name: 'Advertising', fy25: 1500, fy26: 500 },{ name: 'Community Policing', fy25: 500, fy26: 500 },{ name: 'Legal', fy25: 1000, fy26: 1000 },{ name: 'Prof Dues', fy25: 500, fy26: 500 },{ name: 'Training/Travel', fy25: 7500, fy26: 8000 },{ name: 'Evidence Collection Kits', fy25: 1000, fy26: 1000 },{ name: 'Uniforms', fy25: 3000, fy26: 3500 },{ name: 'Shoes/Boots', fy25: 1000, fy26: 1300 }] },
      { section: 'Insurance', items: [{ name: 'General Liability', fy25: 8000, fy26: 8800 },{ name: 'Fleet', fy25: 3500, fy26: 3850 }] },
      { section: 'Capital Projects', items: [{ name: 'Vehicle Replacement', fy25: 0, fy26: 115000 }] },
      { section: 'Animal Control', items: [{ name: 'Animal Control', fy25: 4000, fy26: 2250 }] },
    ],
    pub_purpose: 'Funds Police Chief, officers, dispatch, equipment, and vehicle replacement.', pub_key_change: 'Includes $115,000 vehicle replacement. +$171,705 over FY25.', pub_recurring: true },

  { article_number: 'Article 8', sort_order: 8, title: 'Public Works Department', category: 'municipal_appropriation', legal_type: 'appropriation', voting_method: 'majority_voice', financial_amount: 560556, prior_year_amount: 520093, bete_mapping: 'municipalAppropriations', linked_departments: ['Public Works'],
    draft_text: 'To see if the Town will vote to raise and appropriate the sum of $560,556.00 through taxation for the Public Works Department. The Machias Select Board and the Budget Committee recommend.',
    line_items: [
      { section: 'Personnel', items: [{ name: 'Director', fy25: 65035, fy26: 68287 },{ name: 'Fulltime', fy25: 132531, fy26: 140465 },{ name: 'Overtime', fy25: 11000, fy26: 12500 },{ name: 'Part-time', fy25: 3000, fy26: 6000 }] },
      { section: 'Benefits', items: [{ name: 'FICA/Medicare', fy25: 16185, fy26: 17385 },{ name: 'Health Insurance', fy25: 86700, fy26: 94492 },{ name: 'PFML', fy25: 0, fy26: 1137 },{ name: "Worker's Compensation", fy25: 16510, fy26: 18206 },{ name: 'Unemployment Compensation', fy25: 432, fy26: 475 },{ name: 'Retirement', fy25: 9430, fy26: 9982 }] },
      { section: 'Supplies & Maintenance', items: [{ name: 'Office Supplies', fy25: 100, fy26: 150 },{ name: 'Vehicle Maintenance', fy25: 37000, fy26: 42000 },{ name: 'Fuel & Oil', fy25: 23000, fy26: 23000 },{ name: 'Antique Street Lights', fy25: 1500, fy26: 2500 },{ name: 'Equip Rental/Supplies', fy25: 6500, fy26: 6500 },{ name: 'Tires', fy25: 2500, fy26: 2500 }] },
      { section: 'Other', items: [{ name: 'Contract Services', fy25: 16000, fy26: 16000 },{ name: 'Advertising', fy25: 250, fy26: 250 },{ name: 'Training/Travel', fy25: 350, fy26: 350 },{ name: 'Testing', fy25: 500, fy26: 915 },{ name: 'Boot Allowance', fy25: 1000, fy26: 1200 },{ name: 'Clothing Allowance', fy25: 1600, fy26: 2000 }] },
      { section: 'Utilities', items: [{ name: 'Electricity', fy25: 2250, fy26: 2250 },{ name: 'Heat', fy25: 4000, fy26: 4250 },{ name: 'Telephone', fy25: 2200, fy26: 2500 },{ name: 'Building Maintenance', fy25: 2000, fy26: 2000 }] },
      { section: 'Insurance', items: [{ name: 'Liability', fy25: 1670, fy26: 1837 },{ name: 'Public Official Liability', fy25: 1000, fy26: 1100 },{ name: 'Fleet', fy25: 10750, fy26: 11825 }] },
      { section: 'Technology', items: [{ name: 'Computer Supplies', fy25: 100, fy26: 500 }] },
      { section: 'Highway Maintenance', items: [{ name: 'Culverts', fy25: 3500, fy26: 3500 },{ name: 'Cold Patch', fy25: 3000, fy26: 3000 },{ name: 'Sand/Salt', fy25: 55000, fy26: 58000 },{ name: 'Sidewalk', fy25: 1000, fy26: 1000 },{ name: 'Sewer & Storm Drain R&M', fy25: 1000, fy26: 1000 }] },
      { section: 'Capital Projects', items: [{ name: '911 Signs', fy25: 1500, fy26: 1500 }] },
    ],
    pub_purpose: 'Funds roads, equipment, winter maintenance, and public works operations.', pub_recurring: true },

  { article_number: 'Article 9', sort_order: 9, title: 'Assessing Department', category: 'municipal_appropriation', legal_type: 'appropriation', voting_method: 'majority_voice', financial_amount: 39584, prior_year_amount: 28950, bete_mapping: 'municipalAppropriations', linked_departments: ['Tax Assessor'],
    draft_text: 'To see if the Town will vote to raise and appropriate the sum of $39,584.00 through taxation for the Assessing Department. The Machias Select Board and the Budget Committee recommend.',
    line_items: [
      { section: 'Personnel', items: [{ name: 'Assessor Contract', fy25: 25200, fy26: 35834 },{ name: 'Tax File Update', fy25: 0, fy26: 5834 }] },
      { section: 'Supplies & Maintenance', items: [{ name: 'Office Supplies', fy25: 250, fy26: 250 }] },
      { section: 'Technology', items: [{ name: 'Trio Software', fy25: 1500, fy26: 1500 }] },
      { section: 'Other', items: [{ name: 'Professional Dues', fy25: 700, fy26: 700 },{ name: 'Tax Maps', fy25: 600, fy26: 600 },{ name: 'Postage', fy25: 700, fy26: 700 }] },
    ],
    pub_purpose: 'Funds the assessing contract and property tax administration.', pub_recurring: true },

  { article_number: 'Article 10', sort_order: 10, title: 'Machias Valley Airport', category: 'municipal_appropriation', legal_type: 'appropriation', voting_method: 'majority_voice', financial_amount: 52450, prior_year_amount: 51825, bete_mapping: 'municipalAppropriations', linked_departments: ['Airport'],
    draft_text: 'To see if the Town will vote to raise and appropriate the sum of $23,119.00 through taxation, and to appropriate an additional $29,331.00 from funds committed for capital project: the Marijuana Licenses for total appropriation of $52,450.00 for the Machias Valley Airport. The Machias Select Board and the Budget Committee recommend.',
    pub_purpose: 'Funds the Machias Valley Airport operations.', pub_recurring: true },

  { article_number: 'Article 11', sort_order: 11, title: 'Airport — Carry Forward Funds', category: 'other', legal_type: 'authorization', voting_method: 'majority_voice', financial_amount: 0, prior_year_amount: 0, bete_mapping: '', linked_departments: ['Airport'],
    draft_text: 'To see if the Town will vote to carry forward any remaining funds from the 2024-2025 Airport budget to the Capital Projects - Airport Improvements Reserve account and to authorize the Board of Selectpeople to expend the funds for airport improvements. The Machias Select Board and the Budget Committee recommend.',
    pub_purpose: 'Carries forward unspent airport funds to the Airport Improvements Reserve.', pub_recurring: false },

  { article_number: 'Article 12', sort_order: 12, title: 'Town Activities & Facilities', category: 'municipal_appropriation', legal_type: 'appropriation', voting_method: 'majority_voice', financial_amount: 60889, prior_year_amount: 34700, bete_mapping: 'municipalAppropriations', linked_departments: ['Parks & Recreation'],
    draft_text: 'To see if the Town will vote to raise and appropriate the sum of $20,220.00 through taxation, and to appropriate an additional $40,669.00 from funds committed for capital project: the Marijuana Licenses for total appropriation of $60,889.00 for the Town Activities and Facilities. The Machias Select Board and the Budget Committee recommend.',
    line_items: [
      { section: 'Activities', items: [{ name: 'Town Planters', fy25: 2750, fy26: 2750 },{ name: 'Christmas Lighting', fy25: 11500, fy26: 0 },{ name: 'Fall Festival', fy25: 250, fy26: 0 },{ name: 'Wild Blueberry Ball', fy25: 0, fy26: 1000 },{ name: 'Fireworks', fy25: 7500, fy26: 6500 },{ name: '4th of July', fy25: 750, fy26: 750 }] },
      { section: 'Facilities', items: [{ name: 'Bad Little Falls', fy25: 5000, fy26: 5000 },{ name: 'Norman Nelson Park', fy25: 500, fy26: 1000 },{ name: 'Station 1898', fy25: 100, fy26: 100 },{ name: 'Playground', fy25: 2300, fy26: 5000 },{ name: 'Skate Park', fy25: 1000, fy26: 35669 },{ name: 'Boat Dock', fy25: 500, fy26: 500 },{ name: 'Cemetery', fy25: 1000, fy26: 1000 },{ name: 'South Side Field', fy25: 1000, fy26: 1000 }] },
    ],
    pub_purpose: 'Funds town recreation, community events, and public facilities maintenance.', pub_recurring: true },

  { article_number: 'Article 13', sort_order: 13, title: 'Town Utilities', category: 'municipal_appropriation', legal_type: 'appropriation', voting_method: 'majority_voice', financial_amount: 253852, prior_year_amount: 197620, bete_mapping: 'municipalAppropriations', linked_departments: ['Other Municipal Services'],
    draft_text: 'To see if the Town will vote to raise and appropriate the sum of $253,852.00 for the operation and maintenance of Town Utilities. The Machias Select Board and the Budget Committee recommend.',
    line_items: [
      { section: 'Town Utilities', items: [{ name: 'Fire Hydrants', fy25: 156200, fy26: 212432 },{ name: 'Street Lighting', fy25: 40920, fy26: 40920 },{ name: 'Antique Lights Insurance', fy25: 250, fy26: 250 },{ name: 'E-911 Signs', fy25: 250, fy26: 250 }] },
    ],
    pub_purpose: 'Funds fire hydrant service, street lighting, and E-911 signage.', pub_recurring: true },

  // --- County & Notifications ---
  { article_number: 'Article 13b', sort_order: 14, title: 'County Tax Assessment (Notification)', category: 'county_assessment', legal_type: 'assessment', voting_method: 'n_a', financial_amount: 389780, prior_year_amount: 315116, bete_mapping: 'countyAssessment', linked_departments: [],
    draft_text: 'To notify the residents of the Town of Machias that the sum of $389,780.00 will be required to be raised in order to pay the Washington County Tax Assessment.',
    pub_purpose: 'Notification of Washington County tax assessment.', pub_recurring: true },

  // --- General Assistance ---
  { article_number: 'Article 14', sort_order: 15, title: 'General Assistance Program', category: 'municipal_appropriation', legal_type: 'appropriation', voting_method: 'majority_voice', financial_amount: 5850, prior_year_amount: 5850, bete_mapping: 'municipalAppropriations', linked_departments: ['General Assistance'],
    draft_text: 'To see if the Town will vote to raise and appropriate the sum of $5,850.00 for the General Assistance Program. State law mandates the Town assist individuals who meet the eligibility guidelines and income limits. The Machias Select Board and the Budget Committee recommend.',
    pub_purpose: 'State-mandated assistance for eligible residents in need.', pub_recurring: true },

  // --- Third Party Requests ---
  { article_number: 'Article 15', sort_order: 16, title: 'Third Party — Burnham Tavern', category: 'other', legal_type: 'appropriation', voting_method: 'majority_voice', financial_amount: 300, prior_year_amount: 300, bete_mapping: 'municipalAppropriations', linked_departments: [],
    draft_text: 'To see if the Town will vote to raise and appropriate the sum of $300.00 for a Third Party Request for the Burnham Tavern. The Machias Select Board and the Budget Committee recommend.',
    pub_purpose: 'Third party request for Burnham Tavern historic site.', pub_recurring: true },
  { article_number: 'Article 16', sort_order: 17, title: 'Third Party — WIC Nutrition Program', category: 'other', legal_type: 'appropriation', voting_method: 'majority_voice', financial_amount: 1200, prior_year_amount: 1200, bete_mapping: 'municipalAppropriations', linked_departments: [],
    draft_text: 'To see if the Town will vote to raise and appropriate the sum of $1,200.00 for a Third Party Request for WIC - Nutrition Program. The Machias Select Board and the Budget Committee recommend.',
    pub_purpose: 'Supports WIC nutrition services for Machias residents.', pub_recurring: true },
  { article_number: 'Article 17', sort_order: 18, title: 'Third Party — Downeast Community Partners', category: 'other', legal_type: 'appropriation', voting_method: 'majority_voice', financial_amount: 4000, prior_year_amount: 4000, bete_mapping: 'municipalAppropriations', linked_departments: [],
    draft_text: 'To see if the Town will vote to raise and appropriate the sum of $4,000.00 for a Third Party Request for Downeast Community Partners, formerly the Washington Hancock Community Agency. The Machias Select Board and the Budget Committee recommend.',
    pub_purpose: 'Supports Downeast Community Partners social services.', pub_recurring: true },
  { article_number: 'Article 18', sort_order: 19, title: 'Third Party — Machias Area Little League', category: 'other', legal_type: 'appropriation', voting_method: 'majority_voice', financial_amount: 500, prior_year_amount: 500, bete_mapping: 'municipalAppropriations', linked_departments: [],
    draft_text: 'To see if the Town will vote to raise and appropriate the sum of $500.00 for a Third Party Request for Machias Area Little League. The Machias Select Board and the Budget Committee recommend.',
    pub_purpose: 'Supports Machias Area Little League youth baseball.', pub_recurring: true },
  { article_number: 'Article 19', sort_order: 20, title: 'Third Party — Porter Memorial Library', category: 'other', legal_type: 'appropriation', voting_method: 'majority_voice', financial_amount: 26000, prior_year_amount: 26000, bete_mapping: 'municipalAppropriations', linked_departments: [],
    draft_text: 'To see if the Town will vote to raise and appropriate the sum of $26,000.00 for a Third Party Request for Porter Memorial Library. The Machias Select Board and the Budget Committee recommend.',
    pub_purpose: 'Funds the Porter Memorial Library public library services.', pub_recurring: true },
  { article_number: 'Article 20', sort_order: 21, title: "Third Party — Veteran's Graves", category: 'other', legal_type: 'appropriation', voting_method: 'majority_voice', financial_amount: 200, prior_year_amount: 200, bete_mapping: 'municipalAppropriations', linked_departments: [],
    draft_text: "To see if the Town will vote to raise and appropriate the sum of $200.00 for a Third Party Request for Veteran's Graves. The Machias Select Board and the Budget Committee recommend.",
    pub_purpose: "Maintains veteran's grave markers and memorials.", pub_recurring: true },
  { article_number: 'Article 21', sort_order: 22, title: 'Third Party — Eastern Area Agency on Aging', category: 'other', legal_type: 'appropriation', voting_method: 'majority_voice', financial_amount: 750, prior_year_amount: 750, bete_mapping: 'municipalAppropriations', linked_departments: [],
    draft_text: 'To see if the Town will vote to raise and appropriate the sum of $750.00 for a Third Party Request for Eastern Area Agency on Aging. The Machias Select Board and the Budget Committee recommend.',
    pub_purpose: 'Supports Eastern Area Agency on Aging services.', pub_recurring: true },
  { article_number: 'Article 22', sort_order: 23, title: 'Third Party — LifeFlight of Maine', category: 'other', legal_type: 'appropriation', voting_method: 'majority_voice', financial_amount: 555, prior_year_amount: 555, bete_mapping: 'municipalAppropriations', linked_departments: [],
    draft_text: 'To see if the Town will vote to raise and appropriate the sum of $555.00 for a Third Party Request for LifeFlight of Maine. The Machias Select Board and the Budget Committee recommend.',
    pub_purpose: 'Supports LifeFlight of Maine air medical transport services.', pub_recurring: true },
  { article_number: 'Article 23', sort_order: 24, title: 'Third Party — Community Health & Counseling', category: 'other', legal_type: 'appropriation', voting_method: 'majority_voice', financial_amount: 300, prior_year_amount: 300, bete_mapping: 'municipalAppropriations', linked_departments: [],
    draft_text: 'To see if the Town will vote to raise and appropriate the sum of $300.00 for a Third Party Request for Community Health & Counseling. The Machias Select Board and the Budget Committee recommend.',
    pub_purpose: 'Supports Community Health & Counseling Services.', pub_recurring: true },

  // --- Other / Small Departments ---
  { article_number: 'Article 24', sort_order: 25, title: 'All Other Departments', category: 'municipal_appropriation', legal_type: 'appropriation', voting_method: 'majority_voice', financial_amount: 22704, prior_year_amount: 18832, bete_mapping: 'municipalAppropriations', linked_departments: ['Plumbing Inspector','Code Enforcement','Planning Board'],
    draft_text: 'To see if the Town will vote to raise and appropriate the sum of $22,704.00 for all Other Departments. The Machias Select Board and the Budget Committee recommend.',
    line_items: [
      { section: 'All Other Town Departments', items: [{ name: 'Plumbing Insp.', fy25: 2375, fy26: 2375 },{ name: 'Code Enforcement', fy25: 11495, fy26: 12157 },{ name: 'Planning Board', fy25: 4962, fy26: 8172 }] },
    ],
    pub_purpose: 'Funds plumbing inspection, code enforcement, and planning board.', pub_recurring: true },

  // --- Debt Service ---
  { article_number: 'Article 25', sort_order: 26, title: 'Debt Service Account', category: 'debt_service', legal_type: 'appropriation', voting_method: 'majority_voice', financial_amount: 268284, prior_year_amount: 144249, bete_mapping: 'municipalAppropriations', linked_departments: [],
    draft_text: 'To see if the Town will vote to raise and appropriate the sum of $268,284.00 for the Debt Service Account. The Machias Select Board and the Budget Committee recommend.',
    line_items: [
      { section: 'Debt Service', items: [{ name: 'Dump Body - 60K (2024)', fy25: 22150, fy26: 22150 },{ name: 'Public Works 530K (2025)', fy25: 0, fy26: 124035 },{ name: 'Phase III Sewer Project', fy25: 20515, fy26: 20515 },{ name: 'Sewer Elm/Grove (2019)', fy25: 28000, fy26: 28000 },{ name: 'Sewer Improve', fy25: 24265, fy26: 24265 },{ name: 'Public Safety Building (2016)', fy25: 22890, fy26: 22890 },{ name: 'Road Loan - $231K (2016)', fy25: 26429, fy26: 26429 }] },
    ],
    pub_purpose: 'Funds all municipal debt payments including loans for PW equipment, sewer, and roads.', pub_recurring: true },

  // --- Capital Projects ---
  { article_number: 'Article 26', sort_order: 27, title: 'Contingency Account', category: 'capital_project', legal_type: 'appropriation', voting_method: 'majority_voice', financial_amount: 10000, prior_year_amount: 10000, bete_mapping: 'municipalAppropriations', linked_departments: [],
    draft_text: 'To see if the Town will vote to raise and appropriate a sum of $10,000.00 for a Contingency Account, and to authorize the Select Board to expend funds from this account as deemed necessary and to carry forward any and all unexpended funds from 2024-2025 to be used in the 2025-2026 budget. The Machias Select Board and the Budget Committee recommend.',
    pub_purpose: 'Emergency/contingency reserve authorized for Select Board use.', pub_recurring: true },
  { article_number: 'Article 27', sort_order: 28, title: 'Downtown Revitalization', category: 'capital_project', legal_type: 'appropriation', voting_method: 'majority_voice', financial_amount: 5000, prior_year_amount: 5000, bete_mapping: 'municipalAppropriations', linked_departments: [],
    draft_text: 'To see if the Town will vote to raise and appropriate a sum not to exceed $5,000.00 for Downtown Revitalization work and to carry forward any and all unexpended funds from the 2024/2025 appropriation and authorize the Select Board to expend said funds in the 2025/2026 Budget. The Machias Select Board and Budget Committee recommend.',
    pub_purpose: 'Funds downtown revitalization and streetscape improvements.', pub_recurring: true },
  { article_number: 'Article 28', sort_order: 29, title: 'Sidewalks Repair & Maintenance', category: 'capital_project', legal_type: 'appropriation', voting_method: 'majority_voice', financial_amount: 9000, prior_year_amount: 9000, bete_mapping: 'municipalAppropriations', linked_departments: ['Public Works'],
    draft_text: 'To see if the Town will vote to raise and appropriate a sum not to exceed $9,000.00 for sidewalks repair and maintenance and to carry forward any and all unexpended funds from the 2024/2025 Sidewalk Repair Account and to authorize the Board of Selectpeople to expend said funds in the 2025/2026 Budget. The Machias Select Board and Budget Committee recommend.',
    pub_purpose: 'Funds sidewalk repair and accessibility improvements.', pub_recurring: true },

  // --- State Revenues ---
  { article_number: 'Article 29', sort_order: 30, title: 'Accept State Revenues', category: 'revenue', legal_type: 'authorization', voting_method: 'majority_voice', financial_amount: 800620, prior_year_amount: 725620, bete_mapping: 'localRevenues', linked_departments: [],
    draft_text: 'To see if the Town will vote to accept and expend the monies received in the categories of funds listed below as provided by the Maine State Legislature. The Machias Select Board and the Budget Committee recommend.',
    line_items: [
      { section: 'Revenues', items: [{ name: 'Gen Asst. Reimbursement', fy25: 3990, fy26: 3990 },{ name: 'Local Road Assistance', fy25: 18000, fy26: 20000 },{ name: 'Snowmobile Fees', fy25: 250, fy26: 250 },{ name: 'State Revenue Sharing', fy25: 605000, fy26: 675000 },{ name: 'State BETE Reimbursement', fy25: 98380, fy26: 101380 }] },
    ],
    pub_purpose: 'Accepts and appropriates state-allocated revenues to reduce tax levy.', pub_recurring: true },

  // --- Local Revenues ---
  { article_number: 'Article 30', sort_order: 31, title: 'Apply Anticipated Local Revenues', category: 'revenue', legal_type: 'authorization', voting_method: 'majority_voice', financial_amount: 545647, prior_year_amount: 577738, bete_mapping: 'localRevenues', linked_departments: [],
    draft_text: 'To see if the Town will vote to apply the anticipated revenues in the amount of $545,647.00 from the General Fund Appropriations to offset taxes. The Machias Select Board and the Budget Committee recommend.',
    line_items: [
      { section: 'Revenues', items: [{ name: 'Airport Income', fy25: 28445, fy26: 28445 },{ name: 'Automobile Excise Tax', fy25: 325000, fy26: 300000 },{ name: 'Bank Interest', fy25: 65000, fy26: 65000 },{ name: 'Boat Excise', fy25: 1400, fy26: 1400 },{ name: 'Building Permits', fy25: 4000, fy26: 2000 },{ name: 'Clerk Fees', fy25: 11330, fy26: 11125 },{ name: 'Fire Department Revenues', fy25: 18000, fy26: 18000 },{ name: 'Northfield Excise Contract', fy25: 2255, fy26: 2370 },{ name: 'Police Department Revenues', fy25: 22750, fy26: 21000 },{ name: 'Public Works', fy25: 62194, fy26: 63407 },{ name: 'Registration Fees', fy25: 8400, fy26: 8400 },{ name: 'Rental Income', fy25: 2964, fy26: 0 },{ name: 'CC Service Fee', fy25: 6500, fy26: 5000 },{ name: 'Tax Interest', fy25: 12000, fy26: 12000 },{ name: 'In Lieu of Tax', fy25: 7500, fy26: 7500 }] },
    ],
    pub_purpose: 'Applies local fee and excise revenues to reduce the property tax levy.', pub_recurring: true },

  // --- Homestead / Tree Growth ---
  { article_number: 'Article 31', sort_order: 32, title: 'Accept State Reimbursements (Homestead/Tree Growth)', category: 'revenue', legal_type: 'authorization', voting_method: 'majority_voice', financial_amount: 163780, prior_year_amount: 160000, bete_mapping: 'localRevenues', linked_departments: [],
    draft_text: 'To see if the Town will vote to accept any and all funds received from the State of Maine (approximately $163,780.00). Reimbursement from the Homestead Exemption Program (approximately $155,780.00), Tree Growth Reimbursement (approximately $5,000.00), and Veteran\'s Exemption Reimbursement (approximately $3,000.00). The Machias Select Board and Budget Committee recommend.',
    pub_purpose: 'Accepts Homestead, Tree Growth, and Veteran Exemption state reimbursements.', pub_recurring: true },

  // --- Enterprise Funds ---
  { article_number: 'Article 32', sort_order: 33, title: 'Bay Area Transfer Station Offset', category: 'enterprise_appropriation', legal_type: 'appropriation', voting_method: 'majority_voice', financial_amount: 65000, prior_year_amount: 65000, bete_mapping: 'enterpriseOffsets', linked_departments: ['Transfer Station'],
    draft_text: 'To see if the Town will vote to raise and appropriate a sum not to exceed $65,000.00 to offset the Machias share of the Bay Area Transfer Station operating budget. The Machias Select Board and Budget Committee recommend.',
    pub_purpose: 'Funds Machias share of Bay Area Transfer Station.', pub_recurring: true },
  { article_number: 'Article 33', sort_order: 34, title: 'Ambulance Dept Operating Budget', category: 'enterprise_appropriation', legal_type: 'appropriation', voting_method: 'majority_voice', financial_amount: 142450, prior_year_amount: 142450, bete_mapping: 'enterpriseOffsets', linked_departments: ['Ambulance'],
    draft_text: 'To see if the Town will vote to raise and appropriate a sum not to exceed $142,450.00 to offset the Ambulance Dept operating budget. The Machias Select Board and Budget Committee recommend.',
    pub_purpose: 'Offsets the Ambulance Enterprise Fund operating budget.', pub_recurring: true },

  // --- Interfund Transfers ---
  { article_number: 'Article 34', sort_order: 35, title: 'Authorize Interfund Transfers', category: 'enterprise_appropriation', legal_type: 'authorization', voting_method: 'majority_voice', financial_amount: 152860, prior_year_amount: 139935, bete_mapping: 'enterpriseOffsets', linked_departments: [],
    draft_text: 'To see if the Town will vote to authorize the following interfund transfers to offset taxes. The Machias Select Board and Budget Committee recommend.',
    line_items: [
      { section: 'Interfunds', items: [{ name: 'Ambulance Department', fy25: 80200, fy26: 93125 },{ name: 'Sewer Department', fy25: 21110, fy26: 21110 },{ name: 'Telecommunications Department', fy25: 18525, fy26: 18525 },{ name: 'Transfer Station', fy25: 20100, fy26: 20100 }] },
    ],
    pub_purpose: 'Authorizes enterprise fund transfers to offset general fund taxes.', pub_recurring: true },

  // --- Fund Balance ---
  { article_number: 'Article 35', sort_order: 36, title: 'Appropriate from Undesignated Fund Balance', category: 'revenue', legal_type: 'authorization', voting_method: 'majority_voice', financial_amount: 400000, prior_year_amount: 400000, bete_mapping: 'localRevenues', linked_departments: [],
    draft_text: 'To see if the Town will vote to appropriate from the Undesignated Fund Balance the sum of $400,000.00 to offset the amount to be raised through taxation for the 2025/2026 fiscal year. The Machias Select Board and Budget Committee recommend.',
    pub_purpose: 'Uses undesignated fund balance surplus to reduce tax levy.', pub_recurring: true },

  // --- Tax Administration ---
  { article_number: 'Article 36', sort_order: 37, title: 'Tax Due Dates & Interest Rate', category: 'policy_authorization', legal_type: 'authorization', voting_method: 'majority_voice', financial_amount: 0, prior_year_amount: 0, bete_mapping: '', linked_departments: [],
    draft_text: 'To see if the Town will vote to have the fiscal year 2025/2026 taxes due in two increments: one-half to be due 30 days from commitment date, and one-half on or before March 13, 2026; and to have interest charges at the annual rate of 7.5% on any taxes paid after the due dates. The Machias Select Board and the Budget Committee recommend.',
    pub_purpose: 'Sets tax due dates and 7.5% interest rate on late payments.', pub_recurring: true },
  { article_number: 'Article 37', sort_order: 38, title: 'Early Payment Discount (2%)', category: 'policy_authorization', legal_type: 'authorization', voting_method: 'majority_voice', financial_amount: 0, prior_year_amount: 0, bete_mapping: '', linked_departments: [],
    draft_text: 'To see if the Town will vote to grant a 2% discount on any taxpayer\'s annual tax obligation when said taxpayer remits payment of his/her entire 2025 annual tax obligation with cash or check only (not available with credit card) by 30 days from the tax committment date and to raise and appropriate a sufficient amount to cover the discount amount, which was $41,882.70 last year. The Machias Select Board and the Budget Committee recommend.',
    pub_purpose: 'Offers 2% discount for taxpayers who pay in full within 30 days.', pub_recurring: true },
  { article_number: 'Article 38', sort_order: 39, title: 'Tax Prepayment Authorization', category: 'policy_authorization', legal_type: 'authorization', voting_method: 'majority_voice', financial_amount: 0, prior_year_amount: 0, bete_mapping: '', linked_departments: [],
    draft_text: 'To see if the Town will authorize the Tax Collector to accept prepayment (i.e. prior to the date of commitment) of taxes and to vote to pay 0% interest on said payments. The Machias Select Board and the Budget Committee recommend.',
    pub_purpose: 'Authorizes early tax prepayment at 0% interest.', pub_recurring: true },
  { article_number: 'Article 39', sort_order: 40, title: 'Overpayment Interest (4%)', category: 'policy_authorization', legal_type: 'authorization', voting_method: 'majority_voice', financial_amount: 0, prior_year_amount: 0, bete_mapping: '', linked_departments: [],
    draft_text: 'To see if the Town will authorize the Tax Collector to pay interest to any taxpayer who makes an overpayment of taxes, pursuant to 36 M.R.S.A. Chapter 105 Section 506-A, at a rate of 4% per annum. The Machias Select Board and the Budget Committee recommend.',
    pub_purpose: 'Authorizes 4% interest payment on tax overpayments.', pub_recurring: true },
  { article_number: 'Article 40', sort_order: 41, title: 'Non-Property Account Interest (7.5%)', category: 'policy_authorization', legal_type: 'authorization', voting_method: 'majority_voice', financial_amount: 0, prior_year_amount: 0, bete_mapping: '', linked_departments: [],
    draft_text: 'To see if the Town will vote to charge interest at a rate of 7.5% per annum, on all unpaid non-property tax accounts (i.e. sewer bills, airport tie-downs, miscellaneous fees, legally binding contract agreements, etc.) owed to the Town of Machias. The Machias Select Board and the Budget Committee recommend.',
    pub_purpose: 'Sets 7.5% interest rate on unpaid non-property accounts.', pub_recurring: true },

  // --- Board Authority ---
  { article_number: 'Article 41', sort_order: 42, title: 'Accept Gifts of Property', category: 'policy_authorization', legal_type: 'authorization', voting_method: 'majority_voice', financial_amount: 0, prior_year_amount: 0, bete_mapping: '', linked_departments: [],
    draft_text: 'To see if the Town will vote to authorize the Select Board to accept, on behalf of the Town, for the general account, and any and all enterprise accounts, unconditional gifts of property, money, and/or donations, which they feel, are in the Town\'s best interest to accept. The Machias Select Board and the Budget Committee recommend.',
    pub_purpose: 'Authorizes Select Board to accept gifts and donations on behalf of the town.', pub_recurring: true },
  { article_number: 'Article 42', sort_order: 43, title: 'Dispose of Tax-Acquired Real Estate', category: 'policy_authorization', legal_type: 'authorization', voting_method: 'majority_voice', financial_amount: 0, prior_year_amount: 0, bete_mapping: '', linked_departments: [],
    draft_text: 'To see if the Town will vote to authorize the Select Board, on behalf of the Town, to sell, lease, or otherwise dispose of real estate acquired by the Town for non-payment of taxes thereon, on such terms as they deem advisable, unless state law determines the disposal process, and to execute quit-claim deeds for such property. The Machias Select Board and the Budget Committee recommend.',
    pub_purpose: 'Authorizes Select Board to sell tax-acquired real estate.', pub_recurring: true },
  { article_number: 'Article 43', sort_order: 44, title: 'Dispose of Town Personal Property', category: 'policy_authorization', legal_type: 'authorization', voting_method: 'majority_voice', financial_amount: 0, prior_year_amount: 0, bete_mapping: '', linked_departments: [],
    draft_text: 'To see if the Town will vote to authorize the Select Board to dispose of Town owned personal property on such terms they deem advisable. The Machias Select Board and the Budget Committee recommend.',
    pub_purpose: 'Authorizes Select Board to dispose of surplus town personal property.', pub_recurring: true },
  { article_number: 'Article 44', sort_order: 45, title: 'Close or Post Roads', category: 'policy_authorization', legal_type: 'authorization', voting_method: 'majority_voice', financial_amount: 0, prior_year_amount: 0, bete_mapping: '', linked_departments: [],
    draft_text: 'To see if the Town will vote to authorize the Select Board to close streets/roads or to post streets/roads, when appropriate or necessary. The Machias Select Board and the Budget Committee recommend.',
    pub_purpose: 'Authorizes Select Board to close or post public roads as needed.', pub_recurring: true },
  { article_number: 'Article 45', sort_order: 46, title: 'TIF District Appropriation', category: 'municipal_appropriation', legal_type: 'appropriation', voting_method: 'majority_voice', financial_amount: 80000, prior_year_amount: 80000, bete_mapping: 'municipalAppropriations', linked_departments: [],
    draft_text: 'To see if the Town will vote to raise and appropriate a sum not to exceed $80,000.00 for the Machias Revitalization Omnibus Municipal Tax Increment Financing District and Development Program, as agreed on at the Special Town Meeting held on February 7, 2019.',
    pub_purpose: 'Funds the TIF district program for downtown development.', pub_recurring: true },
  { article_number: 'Article 46', sort_order: 47, title: 'Repeal Residency Requirements Ordinance', category: 'policy_authorization', legal_type: 'authorization', voting_method: 'majority_voice', financial_amount: 0, prior_year_amount: 0, bete_mapping: '', linked_departments: [],
    draft_text: 'To see if the Town will vote to repeal the Residency Requirements Ordinance of 1979, which stipulates all full-time public safety and public works employees must live "within the corporate limits of Machias, or a 5-mile radius from the concrete bridge."',
    pub_purpose: 'Repeals the 1979 residency requirement for public safety and PW employees.', pub_recurring: false },
  { article_number: 'Article 47', sort_order: 48, title: 'Waive Foreclosure', category: 'policy_authorization', legal_type: 'authorization', voting_method: 'majority_voice', financial_amount: 0, prior_year_amount: 0, bete_mapping: '', linked_departments: [],
    draft_text: 'To see if the Town will vote to authorize the Treasurer to waive foreclosure on property in any manner in which the Machias Select Board deem to be in the best interest of the Town.',
    pub_purpose: 'Authorizes Treasurer to waive foreclosure on properties when in town\'s best interest.', pub_recurring: true },
];

// ── Build seed articles for a given fiscal year ─────────────────────────────
function buildSeedArticles(settings, fy) {
  // For FY26, use the actual warrant. For FY27+, carry FY26 as prior year and bump amounts slightly.
  const isFY26 = fy === 'FY2026';
  const priorFY = `FY${parseInt(fy.replace('FY', '')) - 1}`;
  return FY26_ARTICLES.map((a, i) => ({
    ...a,
    id: `wa_${fy}_${i}`,
    fiscal_year: fy,
    status: 'draft',
    legal_review_status: 'not_reviewed',
    text_frozen: false,
    // For FY27, shift amounts: prior = FY26 actual, current = placeholder (same as FY26 until edited)
    prior_year_amount: isFY26 ? (a.prior_year_amount || 0) : (a.financial_amount || 0),
    financial_amount:  isFY26 ? (a.financial_amount || 0) : (a.financial_amount || 0),
    draft_text: a.draft_text || '',
    board_text: '',
    public_text: '',
  }));
}

// ── Build article history across multiple years ───────────────────────────────
function buildHistory(allYearArticles, title) {
  return allYearArticles
    .filter(a => a.title === title || a.article_number === title)
    .map(a => ({ fiscal_year: a.fiscal_year, financial_amount: a.financial_amount, status: a.status, notes: a.explanatory_notes }));
}

// ── Article row in list ───────────────────────────────────────────────────────
function ArticleRow({ article, onEdit, onDelete, onReorder, errors, isFirst, isLast }) {
  const cat = ARTICLE_CATEGORIES[article.category];
  const hasError = errors.some(e => e.id === article.id);
  return (
    <div className={`rounded-xl border ${hasError ? 'border-red-200 bg-red-50/20' : 'border-slate-200 bg-white'} px-4 py-3 flex items-start gap-3 hover:border-slate-300 transition-colors`}>
      {/* Sort controls */}
      <div className="flex flex-col gap-0.5 mt-0.5 flex-shrink-0">
        <button disabled={isFirst} onClick={() => onReorder(article, -1)} className="p-0.5 rounded text-slate-300 hover:text-slate-600 disabled:opacity-20 transition-colors"><ChevronUp className="h-3.5 w-3.5" /></button>
        <button disabled={isLast}  onClick={() => onReorder(article, +1)} className="p-0.5 rounded text-slate-300 hover:text-slate-600 disabled:opacity-20 transition-colors"><ChevronDown className="h-3.5 w-3.5" /></button>
      </div>

      {/* Color chip */}
      <div className="h-2 w-2 rounded-full mt-2 flex-shrink-0" style={{ background: cat?.color || '#888' }} />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-xs font-bold text-slate-800">{article.article_number}</p>
          <span className="text-xs text-slate-700">{article.title}</span>
          {(article.financial_amount || 0) > 0 && (
            <span className="ml-auto font-mono text-xs font-bold text-slate-900 flex-shrink-0">{fmt(article.financial_amount)}</span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="text-[9px] text-slate-400">{cat?.label}</span>
          {article.prior_year_amount > 0 && (
            <span className="text-[9px] text-slate-400">Prior: {fmt(article.prior_year_amount)}</span>
          )}
          {article.status !== 'draft' && (
            <span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold ${article.status === 'adopted' ? 'bg-emerald-100 text-emerald-700' : article.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'}`}>
              {article.status}
            </span>
          )}
          {article.text_frozen && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-600 font-semibold">🔒 Frozen</span>}
          {article.legal_review_status === 'approved' && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-600 font-semibold">✓ Legal</span>}
          {!article.draft_text && <span className="text-[9px] text-amber-600">⚠ No text</span>}
          {article.pub_purpose && <span className="text-[9px] text-blue-500">📝 Explained</span>}
        </div>
        {article.pub_purpose && (
          <p className="text-[10px] text-slate-400 mt-1 truncate max-w-lg">{article.pub_purpose}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button onClick={() => onEdit(article)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => onDelete(article)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

const TABS = [
  { id: 'articles',   label: 'Articles',     icon: Scroll },
  { id: 'mapping',    label: 'Mapping',      icon: GitMerge },
  { id: 'packet',     label: 'Draft Packet', icon: FileText },
  { id: 'rollup',     label: 'Rollup / BETE',icon: BarChart2 },
  { id: 'validation', label: 'Validation',   icon: AlertTriangle },
  { id: 'history',    label: 'History',      icon: Clock },
];

// ── Mapping sub-tabs (Table + Exceptions) ─────────────────────────────────────
function MappingSubTabs({ lineItems, mappings, articles, onMappingChange, onAutoMap, beteRollup, calc, readiness }) {
  const [sub, setSub] = useState('table');
  return (
    <div className="space-y-3">
      <div className="flex gap-1 border-b border-slate-200">
        {[['table','Mapping Table'],['exceptions','Exceptions & Readiness']].map(([id, label]) => (
          <button key={id} onClick={() => setSub(id)}
            className={`px-3 py-1.5 text-xs font-semibold border-b-2 transition-colors ${sub === id ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-700'}`}>
            {label}
            {id === 'exceptions' && !readiness.ready && (
              <span className="ml-1 text-[9px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 font-bold">{readiness.blockers.length}</span>
            )}
          </button>
        ))}
      </div>
      {sub === 'table' && (
        <ArticleMappingTable
          lineItems={lineItems}
          mappings={mappings}
          articles={articles}
          onMappingChange={onMappingChange}
          onAutoMap={onAutoMap}
        />
      )}
      {sub === 'exceptions' && (
        <MappingExceptionsReport readiness={readiness} beteRollup={beteRollup} budgetCalc={calc} />
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function WarrantBuilder() {
  const { settings } = useModel();
  const [fiscalYear, setFiscalYear] = useState('FY2027');

  // Maintain articles per fiscal year for history — pre-seed both FY26 (actual) and FY27 (template)
  const [articlesByYear, setArticlesByYear] = useState(() => ({
    'FY2026': buildSeedArticles(settings, 'FY2026'),
    'FY2027': buildSeedArticles(settings, 'FY2027'),
  }));
  const articles = articlesByYear[fiscalYear] || [];
  const setArticles = useCallback((updater) => {
    setArticlesByYear(prev => ({ ...prev, [fiscalYear]: typeof updater === 'function' ? updater(prev[fiscalYear] || []) : updater }));
  }, [fiscalYear]);

  const [editingArticle, setEditingArticle] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [activeTab, setActiveTab] = useState('articles');
  const [historyTitle, setHistoryTitle] = useState(null);

  // Mapping state
  const [lineItems] = useState(() => buildDefaultLineItems(settings));
  const [mappings, setMappings] = useState(() => applyAllSuggestedMappings(buildDefaultLineItems(settings)));

  const handleMappingChange = useCallback((lineId, mapping) => {
    setMappings(prev => ({ ...prev, [lineId]: mapping }));
  }, []);

  const handleAutoMap = useCallback(() => {
    setMappings(applyAllSuggestedMappings(lineItems));
  }, [lineItems]);

  const beteRollup = useMemo(() => rollupByBeteLine(lineItems, mappings), [lineItems, mappings]);
  const mappingReadiness = useMemo(() => checkAdoptionReadiness(lineItems, mappings), [lineItems, mappings]);

  const allYearArticles = useMemo(() => Object.values(articlesByYear).flat(), [articlesByYear]);

  const calc = useMemo(() => calculateTaxCommitment({
    municipalAppropriations: articles.filter(a => a.bete_mapping === 'municipalAppropriations').reduce((s, a) => s + (a.financial_amount || 0), 0),
    schoolAppropriations:    articles.filter(a => a.bete_mapping === 'schoolAppropriations').reduce((s, a) => s + (a.financial_amount || 0), 0),
    countyAssessment:        articles.filter(a => a.bete_mapping === 'countyAssessment').reduce((s, a) => s + (a.financial_amount || 0), 0),
    enterpriseOffsets:       (settings.ambulance_transfer || 45000) + (settings.sewer_transfer || 21110) + (settings.ts_transfer || 21000) + (settings.telebusiness_transfer || 18525) + (settings.court_st_transfer || 15600),
    stateRevenueSharing:     165000,
    localRevenues:           articles.filter(a => a.bete_mapping === 'localRevenues').reduce((s, a) => s + (a.financial_amount || 0), 0),
    totalAssessedValue:      settings.total_assessed_value || 198000000,
    overlayPercent:          1.0,
  }), [articles, settings]);

  const validation = useMemo(() => validateArticles(articles, calc), [articles, calc]);
  const gaps = useMemo(() => findNumberingGaps(articles), [articles]);
  const rollup = useMemo(() => buildArticleRollup(articles), [articles]);
  const issueCount = validation.errors.length + validation.warnings.length + gaps.length;
  const errorCount = validation.errors.length;
  const allErrors = [...validation.errors, ...validation.warnings];

  const sorted = useMemo(() => [...articles].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)), [articles]);

  const handleSave = useCallback((form) => {
    if (editingArticle) {
      setArticles(prev => prev.map(a => a.id === editingArticle.id ? { ...a, ...form } : a));
    } else {
      setArticles(prev => [...prev, { ...form, id: `wa_${Date.now()}`, fiscal_year: fiscalYear }]);
    }
    setEditingArticle(null);
    setIsAdding(false);
  }, [editingArticle, fiscalYear, setArticles]);

  const handleDelete = useCallback((a) => {
    if (window.confirm(`Delete "${a.title}"?`)) setArticles(prev => prev.filter(x => x.id !== a.id));
  }, [setArticles]);

  const handleReorder = useCallback((a, dir) => {
    setArticles(prev => {
      const s = [...prev].sort((x, y) => (x.sort_order || 0) - (y.sort_order || 0));
      const idx = s.findIndex(x => x.id === a.id);
      const ni = idx + dir;
      if (ni < 0 || ni >= s.length) return prev;
      const updated = s.map((x, i) => ({ ...x, sort_order: i }));
      const tmp = updated[idx].sort_order;
      updated[idx].sort_order = updated[ni].sort_order;
      updated[ni].sort_order = tmp;
      return updated;
    });
  }, [setArticles]);

  const handleCloneYear = () => {
    const nextFY = `FY${parseInt(fiscalYear.replace('FY', '')) + 1}`;
    const cloned = articles.map(a => ({
      ...a, id: `wa_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      fiscal_year: nextFY, status: 'draft', legal_review_status: 'not_reviewed',
      text_frozen: false, prior_year_amount: a.financial_amount,
      draft_text: '', board_text: '', public_text: '',
    }));
    setArticlesByYear(prev => ({ ...prev, [nextFY]: cloned }));
    setFiscalYear(nextFY);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <SectionHeader
          title="Annual Town Warrant Builder"
          subtitle={`${fiscalYear} — Draft, validate, and publish the annual town meeting warrant`}
          icon={Scroll}
        />
        <div className="flex items-center gap-2 flex-wrap">
          <select value={fiscalYear} onChange={e => setFiscalYear(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none">
            {['FY2025','FY2026','FY2027','FY2028','FY2029'].map(fy => (
              <option key={fy} value={fy}>{fy}{articlesByYear[fy] ? ` (${articlesByYear[fy].length})` : ' —'}</option>
            ))}
          </select>
          <button onClick={handleCloneYear}
            className="flex items-center gap-1.5 text-xs font-semibold border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg hover:border-slate-500 hover:text-slate-900 transition-colors">
            <Copy className="h-3.5 w-3.5" /> Clone to Next Year
          </button>
          <button onClick={() => { setIsAdding(true); setEditingArticle(null); setActiveTab('articles'); }}
            className="flex items-center gap-1.5 text-xs font-semibold bg-slate-900 text-white px-3 py-1.5 rounded-lg hover:bg-slate-700 transition-colors">
            <Plus className="h-3.5 w-3.5" /> New Article
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {[
          { label: 'Articles', value: articles.length, sub: 'in warrant', color: 'text-slate-900' },
          { label: 'Appropriations', value: fmt(rollup.totalAppropriations), sub: 'article rollup total', color: 'text-slate-900' },
          { label: 'Deductions', value: fmt(rollup.totalDeductions), sub: 'revenue + offsets', color: 'text-emerald-700' },
          { label: 'Net to Be Raised', value: fmt(rollup.netToBeRaised), sub: `${(calc.selectedMillRate || 0).toFixed(3)} mills`, color: 'text-slate-900' },
          { label: 'Validation', value: issueCount === 0 ? '✓ Clean' : `${issueCount} issue${issueCount !== 1 ? 's' : ''}`, sub: issueCount === 0 ? 'no errors' : `${errorCount} error${errorCount !== 1 ? 's' : ''}`, color: issueCount === 0 ? 'text-emerald-700' : errorCount > 0 ? 'text-red-700' : 'text-amber-700' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-3">
            <p className={`text-base font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] font-medium text-slate-600 mt-0.5">{s.label}</p>
            <p className="text-[9px] text-slate-400">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 overflow-x-auto">
        {TABS.map(({ id, label, icon: TabIcon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${activeTab === id ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-700'}`}>
            <TabIcon className="h-3.5 w-3.5 flex-shrink-0" />
            {label}
            {id === 'validation' && issueCount > 0 && (
              <span className={`ml-1 text-[9px] px-1.5 py-0.5 rounded-full font-bold ${errorCount > 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{issueCount}</span>
            )}
            {id === 'mapping' && !mappingReadiness.ready && (
              <span className="ml-1 text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-red-100 text-red-700">{mappingReadiness.blockers.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Articles ── */}
      {activeTab === 'articles' && (
        <div className="space-y-3">
          {(isAdding || editingArticle) ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-bold text-slate-700">{editingArticle ? `Editing: ${editingArticle.article_number} — ${editingArticle.title}` : 'New Warrant Article'}</p>
              </div>
              <WarrantBuilderArticleForm
                article={editingArticle}
                onSave={handleSave}
                onCancel={() => { setEditingArticle(null); setIsAdding(false); }}
                calc={calc}
                history={editingArticle ? buildHistory(allYearArticles, editingArticle.title) : []}
              />
            </div>
          ) : (
            <div className="space-y-2">
              {sorted.map((a, i) => (
                <ArticleRow
                  key={a.id}
                  article={a}
                  onEdit={a => { setEditingArticle(a); setIsAdding(false); }}
                  onDelete={handleDelete}
                  onReorder={handleReorder}
                  errors={allErrors}
                  isFirst={i === 0}
                  isLast={i === sorted.length - 1}
                />
              ))}
              {articles.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-300 px-6 py-8 text-center">
                  <p className="text-xs text-slate-400">No articles yet. Click "New Article" to begin building the warrant.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Mapping ── */}
      {activeTab === 'mapping' && (
        <div className="space-y-4">
          {/* Adoption readiness banner */}
          <div className={`rounded-xl border px-4 py-2.5 flex items-center gap-3 ${mappingReadiness.ready ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
            {mappingReadiness.ready
              ? <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              : <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />}
            <p className={`text-xs font-semibold ${mappingReadiness.ready ? 'text-emerald-800' : 'text-red-800'}`}>
              {mappingReadiness.ready
                ? `All ${mappingReadiness.totalLines} line items fully mapped — adoption outputs enabled.`
                : `${mappingReadiness.blockers.length} mapping error${mappingReadiness.blockers.length !== 1 ? 's' : ''} block adoption. ${mappingReadiness.unmappedCount} line${mappingReadiness.unmappedCount !== 1 ? 's' : ''} unassigned.`}
            </p>
            <span className="ml-auto text-[10px] text-slate-500 font-mono">{mappingReadiness.mappingCompletePct}% complete</span>
          </div>

          {/* Sub-tabs for mapping vs exceptions */}
          <MappingSubTabs
            lineItems={lineItems}
            mappings={mappings}
            articles={sorted}
            onMappingChange={handleMappingChange}
            onAutoMap={handleAutoMap}
            beteRollup={beteRollup}
            calc={calc}
            readiness={mappingReadiness}
          />
        </div>
      )}

      {/* ── Draft Packet ── */}
      {activeTab === 'packet' && (
        <WarrantPacketGenerator articles={articles} fiscalYear={fiscalYear} calc={calc} />
      )}

      {/* ── Rollup / BETE ── */}
      {activeTab === 'rollup' && (
        <div className="space-y-4">
          <ArticleRollupPanel articles={articles} calc={calc} />
          <div className="rounded-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white px-4 py-2 grid grid-cols-4 text-[9px] font-bold uppercase tracking-wider">
              <span>Category</span><span className="text-right">Articles</span><span className="text-right">Amount</span><span className="text-right">% of Total</span>
            </div>
            {Object.entries(articles.reduce((acc, a) => {
              const k = a.category;
              if (!acc[k]) acc[k] = { count: 0, total: 0 };
              acc[k].count++; acc[k].total += a.financial_amount || 0;
              return acc;
            }, {})).sort((a, b) => b[1].total - a[1].total).map(([cat, d]) => {
              const grand = rollup.totalAppropriations + rollup.totalDeductions || 1;
              return (
                <div key={cat} className="px-4 py-2 grid grid-cols-4 text-xs border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ background: ARTICLE_CATEGORIES[cat]?.color || '#888' }} />
                    <span className="text-slate-700">{ARTICLE_CATEGORIES[cat]?.label || cat}</span>
                  </div>
                  <span className="text-right text-slate-500">{d.count}</span>
                  <span className="text-right font-mono text-slate-900">{fmt(d.total)}</span>
                  <span className="text-right font-mono text-slate-500">{grand > 0 ? ((d.total / grand) * 100).toFixed(1) : 0}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Validation ── */}
      {activeTab === 'validation' && (
        <WarrantValidationPanel validation={validation} gaps={gaps} />
      )}

      {/* ── History ── */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
            <p className="text-[10px] text-slate-500">Select an article to view its history across all fiscal years. History is preserved when you clone to a new year.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[...new Set(allYearArticles.map(a => a.title))].map(title => (
              <button key={title} onClick={() => setHistoryTitle(title)}
                className={`text-[10px] px-3 py-1.5 rounded-full font-medium border transition-colors ${historyTitle === title ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}>
                {title}
              </button>
            ))}
          </div>
          {historyTitle && (
            <ArticleHistoryPanel historyRecords={buildHistory(allYearArticles, historyTitle)} />
          )}
          {!historyTitle && (
            <div className="rounded-xl border border-dashed border-slate-200 px-6 py-8 text-center">
              <p className="text-xs text-slate-400">Click an article above to view its multi-year history.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}