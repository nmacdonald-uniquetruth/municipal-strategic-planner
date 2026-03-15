/**
 * complianceConfig.js
 *
 * Central compliance configuration for the Machias Strategic Planner.
 *
 * THREE THINGS IN THIS FILE:
 *   1. COMPLIANCE_CONFIG  — the full machine-readable configuration object
 *   2. validateScenario() — rule engine; returns an array of ComplianceViolation objects
 *   3. getViolationSummary() — helper that buckets violations by severity
 *
 * Items marked legalReview: true are structural placeholders that MUST be
 * validated by municipal counsel before enforcement.
 *
 * References:
 *   GASB 34, 54, 77, 87
 *   Maine MRS Title 30-A (municipal finance & interlocal cooperation)
 *   Maine MRS Title 1 §400+ (FOAA / public records)
 *   Maine MRS Title 10 Ch. 210-B (data security)
 *   Maine Model Procurement Ordinance
 */

// ─── 1. CENTRAL CONFIGURATION OBJECT ───────────────────────────────────────

export const COMPLIANCE_CONFIG = {
  _meta: {
    version: '2.0.0',
    generated: '2026-03-15',
    municipality: 'Town of Machias, ME',
    legalDisclaimer:
      'Structural defaults only. Items with legalReview:true require counsel sign-off before enforcement.',
  },

  // ── Fiscal Year ──────────────────────────────────────────────────────────
  fiscalYear: {
    start_month: 7,           // July 1 (Maine standard)
    start_day: 1,
    end_month: 6,
    end_day: 30,
    current_fy: 'FY2027',
    budget_submission_deadline_weeks_before_fy: 8,
    legalReview: false,
    reference: 'Maine MRS Title 30-A §2151',
    note: 'Maine municipal fiscal year is July 1 – June 30 per statute.',
  },

  // ── Fund Accounting Structure ────────────────────────────────────────────
  fundAccounting: {
    gasbStandard: 'GASB 34',          // Basic financial statements for state/local govts
    basisOfAccounting: 'modified_accrual', // 'modified_accrual' | 'full_accrual'
    funds: [
      { id: 'general_fund',      name: 'General Fund',       type: 'governmental', restricted: false },
      { id: 'ambulance_fund',    name: 'Ambulance Fund',     type: 'enterprise',   restricted: false },
      { id: 'sewer_fund',        name: 'Sewer Fund',         type: 'enterprise',   restricted: false },
      { id: 'transfer_station',  name: 'Transfer Station',   type: 'enterprise',   restricted: false },
      { id: 'airport',           name: 'Airport Fund',       type: 'enterprise',   restricted: false },
      { id: 'school',            name: 'School Fund',        type: 'governmental', restricted: true  },
      { id: 'grant',             name: 'Grant Fund',         type: 'governmental', restricted: true  },
    ],
    fundBalanceClassification: 'gasb_54',  // GASB 54 categories: non-spendable, restricted, committed, assigned, unassigned
    legalReview: true,
    note: 'Basis of accounting must be confirmed with external auditor for each fund type.',
  },

  // ── Capital Project Accounting Rules ────────────────────────────────────
  capital: {
    capitalization_threshold: 5000,       // Items ≥ $5,000 capitalized (placeholder)
    useful_life_min_years: 3,
    depreciation_method: 'straight_line',
    infrastructure_reporting: true,       // GASB 34 modified approach
    gasbStandard: 'GASB 34 §20-23',
    erp_capitalization: true,             // ERP implementation costs capitalized as intangible asset
    erp_useful_life_years: 7,
    legalReview: true,
    note: 'Capitalization threshold and useful life must be confirmed in Town\'s adopted capital asset policy. GASB 34 §20-23 applies to infrastructure reporting.',
  },

  // ── Debt & Bond Modeling Constraints ─────────────────────────────────────
  debt: {
    max_debt_service_pct_of_levy: 0.10,   // 10% of annual tax levy — conservative ceiling
    bond_authorization_requires: 'town_meeting_vote',
    statutory_debt_limit_pct_of_assessed_value: 0.15,  // Maine MRS Title 30-A §5702
    current_outstanding_debt: 130000,     // Ambulance fund loan payoff
    require_select_board_approval_above: 25000,
    legalReview: true,
    reference: 'Maine MRS Title 30-A §5702',
    note: 'Statutory debt limit and bond authorization process must be confirmed with Town Counsel and State Treasurer.',
  },

  // ── Procurement Thresholds ───────────────────────────────────────────────
  procurement: {
    informal_quote_threshold: 5000,        // Below $5K: no formal quotes required
    three_quote_threshold: 5000,           // $5K–$20K: 3 informal quotes
    formal_bid_threshold: 20000,           // Above $20K: formal sealed bid / RFP
    professional_services_threshold: 10000, // Professional services: $10K triggers RFP
    emergency_procurement_allowed: true,
    cooperative_purchasing_allowed: true,  // Maine Cooperative Purchasing Program
    erp_requires_rfp: true,               // ERP cost ($47K) exceeds formal bid threshold
    reference: 'Maine Model Procurement Ordinance (placeholder)',
    legalReview: true,
    note: 'Thresholds are defaults from Maine Model Procurement Ordinance. Confirm against Town\'s adopted ordinance — these may differ.',
  },

  // ── Public Transparency Requirements ────────────────────────────────────
  transparency: {
    budget_posting_required: true,
    warrant_article_posting_days_before_meeting: 7,
    financial_report_posting_required: true,
    foaa_response_days: 5,                 // Maine FOAA: 5 business days
    annual_audit_public_posting: true,
    interlocal_agreement_posting: true,
    reference: 'Maine MRS Title 1 §408-A (FOAA), Title 30-A §2601',
    legalReview: true,
    note: 'FOAA applicability to planning software outputs must be confirmed with counsel. Warrant posting timelines are per Maine statute.',
  },

  // ── Record Retention Policies ────────────────────────────────────────────
  retention: {
    financial_records_years: 7,           // Maine MRS Title 30-A §2601
    audit_log_years: 7,
    contract_retention: 'term_plus_7_years',
    scenario_retention_years: 7,
    snapshot_retention_months: 36,
    export_formats: ['CSV', 'JSON', 'PDF'],
    encryption_at_rest: true,
    reference: 'Maine MRS Title 30-A §2601, Title 10 Ch. 210-B',
    legalReview: true,
    note: 'Contract retention period for interlocal agreements must be individually confirmed.',
  },

  // ── Audit Trail Requirements ──────────────────────────────────────────────
  audit: {
    enabled: true,
    log_financial_changes: true,
    log_exports: true,
    log_user_logins: true,
    require_approval_above_levy_change_pct: 0.02,  // 2% levy change triggers approval
    require_legal_review_above_levy_change_pct: 0.05, // 5% requires legal review
    retention_years: 7,
    legalReview: false,
    note: 'Audit trail is required for compliance with Maine municipal records statute.',
  },

  // ── GASB Compliance Targets ───────────────────────────────────────────────
  gasb: {
    primary_standard: 'GASB 34',
    fund_balance: 'GASB 54',
    tax_abatement: 'GASB 77',
    leases: 'GASB 87',
    legalReview: true,
    note: 'Applicable GASB standards must be confirmed annually with external auditor.',
  },

  // ── State Municipal Finance Statutes (Maine Title 30-A) ──────────────────
  maine30A: {
    budget_submission: { statute: 'MRS Title 30-A §2151', compliant: true },
    interlocal_cooperation: { statute: 'MRS Title 30-A §2201', compliant: 'partial', legalReview: true },
    warrant_requirements: { statute: 'MRS Title 30-A §2523', compliant: 'placeholder', legalReview: true },
    debt_limit: { statute: 'MRS Title 30-A §5702', compliant: 'partial', legalReview: true },
    public_records: { statute: 'MRS Title 1 §408-A', compliant: 'partial', legalReview: true },
  },

  // ── Municipal Budgeting Standards ────────────────────────────────────────
  budgeting: {
    balanced_budget_required: true,
    undesignated_fund_balance_min_pct: 0.08,  // 8% of annual levy minimum (GFOA recommendation)
    undesignated_fund_balance_target_pct: 0.12, // 12% target (GFOA best practice)
    multi_year_projection_required: true,
    projection_years: 5,
    legalReview: false,
    reference: 'GFOA Best Practices; Maine MRS Title 30-A §2151',
    note: 'Fund balance minimums are GFOA recommendations, not Maine statutory requirements.',
  },

  // ── Approval Workflow ────────────────────────────────────────────────────
  approvals: {
    workflow: [
      { role: 'Finance Admin', required: true, triggers: 'any_financial_change' },
      { role: 'Auditor', required: true, triggers: 'annual_review' },
      { role: 'Legal Reviewer', required: false, triggers: 'levy_change_above_2pct' },
      { role: 'Select Board', required: true, triggers: 'budget_warrant_submission' },
    ],
    legalReview: true,
  },

  // ── Contacts ─────────────────────────────────────────────────────────────
  contacts: {
    financeAdmin: '',
    auditor: '',
    legalReviewer: '',
    localOrdinanceRef: 'Town of Machias Ordinance §__ (placeholder — legal team must insert)',
  },

  // ── Local Ordinance Placeholders ─────────────────────────────────────────
  localOrdinances: [
    {
      id: 'planning_software_auth',
      label: 'Financial Planning Software Authorization',
      citation: 'Placeholder — legal team to insert',
      status: 'placeholder',
      legalReview: true,
    },
    {
      id: 'data_governance',
      label: 'Data Governance & Acceptable Use Policy',
      citation: 'Placeholder — legal team to insert',
      status: 'placeholder',
      legalReview: true,
    },
    {
      id: 'regional_pricing_authority',
      label: 'Regional Service Pricing Authority',
      citation: 'Placeholder — confirm in Town Charter or ordinance',
      status: 'placeholder',
      legalReview: true,
    },
  ],
};

// ─── 2. SCENARIO VALIDATION ENGINE ──────────────────────────────────────────
//
// validateScenario(settings) → ComplianceViolation[]
//
// Each violation has:
//   id         — unique stable key
//   severity   — 'error' | 'warning' | 'info'
//   rule       — short rule name
//   message    — human-readable description
//   reference  — applicable statute/standard
//   remediation — suggested corrective action
//   legalReview — boolean

export function validateScenario(settings) {
  const violations = [];
  const cfg = COMPLIANCE_CONFIG;
  if (!settings) return violations;

  const levy = settings.annual_tax_levy || 2871000;
  const assessedValue = settings.total_assessed_value || 198000000;
  const gfBalance = settings.gf_undesignated_balance || 2500000;
  const erpY1 = settings.erp_y1_cost || 47000;

  // ── GASB 54: Fund balance ratio ──────────────────────────────────────────
  const fundBalancePct = levy > 0 ? gfBalance / levy : 0;
  if (fundBalancePct < cfg.budgeting.undesignated_fund_balance_min_pct) {
    violations.push({
      id: 'fund_balance_below_minimum',
      severity: 'error',
      rule: 'Fund Balance Minimum (GFOA)',
      message: `Undesignated fund balance is ${(fundBalancePct * 100).toFixed(1)}% of levy — below the recommended 8% minimum. Current balance: $${gfBalance.toLocaleString()}.`,
      reference: 'GFOA Best Practices; GASB 54',
      remediation: 'Increase undesignated fund balance or reduce proposed draws before submitting budget.',
      legalReview: false,
    });
  } else if (fundBalancePct < cfg.budgeting.undesignated_fund_balance_target_pct) {
    violations.push({
      id: 'fund_balance_below_target',
      severity: 'warning',
      rule: 'Fund Balance Target (GFOA)',
      message: `Undesignated fund balance is ${(fundBalancePct * 100).toFixed(1)}% of levy — below the 12% GFOA target. Current balance: $${gfBalance.toLocaleString()}.`,
      reference: 'GFOA Best Practices; GASB 54',
      remediation: 'Consider a fund balance replenishment plan in the 5-year model.',
      legalReview: false,
    });
  }

  // ── Debt limit: Maine MRS Title 30-A §5702 ───────────────────────────────
  const maxDebt = assessedValue * cfg.debt.statutory_debt_limit_pct_of_assessed_value;
  const currentDebt = cfg.debt.current_outstanding_debt;
  if (currentDebt > maxDebt) {
    violations.push({
      id: 'debt_limit_exceeded',
      severity: 'error',
      rule: 'Statutory Debt Limit (Maine 30-A §5702)',
      message: `Outstanding debt ($${currentDebt.toLocaleString()}) exceeds 15% of assessed value ceiling ($${Math.round(maxDebt).toLocaleString()}).`,
      reference: 'Maine MRS Title 30-A §5702',
      remediation: 'Consult Town Counsel and State Treasurer before issuing additional debt.',
      legalReview: true,
    });
  }

  // ── ERP procurement threshold ────────────────────────────────────────────
  if (erpY1 > cfg.procurement.formal_bid_threshold && !cfg.procurement.erp_requires_rfp) {
    violations.push({
      id: 'erp_rfp_required',
      severity: 'error',
      rule: 'Procurement Threshold (Formal Bid)',
      message: `ERP Year 1 cost ($${erpY1.toLocaleString()}) exceeds the $${cfg.procurement.formal_bid_threshold.toLocaleString()} formal bid threshold. A competitive RFP is required.`,
      reference: 'Maine Model Procurement Ordinance',
      remediation: 'Issue a formal RFP before vendor selection. Document in procurement file.',
      legalReview: true,
    });
  } else if (erpY1 > cfg.procurement.formal_bid_threshold) {
    violations.push({
      id: 'erp_rfp_noted',
      severity: 'info',
      rule: 'Procurement: ERP RFP Required',
      message: `ERP cost ($${erpY1.toLocaleString()}) exceeds formal bid threshold. RFP process is flagged as required in configuration.`,
      reference: 'Maine Model Procurement Ordinance',
      remediation: 'Confirm RFP is issued and documented before contract award.',
      legalReview: false,
    });
  }

  // ── Fiscal year start ───────────────────────────────────────────────────
  const startDate = settings.start_date || '2026-07-01';
  const startMonth = new Date(startDate).getMonth() + 1; // 1-indexed
  if (startMonth !== cfg.fiscalYear.start_month) {
    violations.push({
      id: 'fiscal_year_start_mismatch',
      severity: 'warning',
      rule: 'Fiscal Year Definition (Maine MRS 30-A §2151)',
      message: `Model start date (${startDate}) does not align with the July 1 Maine municipal fiscal year start.`,
      reference: 'Maine MRS Title 30-A §2151',
      remediation: 'Update the model start date in Model Settings to July 1 of the applicable year.',
      legalReview: false,
    });
  }

  // ── Wage growth rate reasonableness ─────────────────────────────────────
  const wageGrowth = settings.wage_growth_rate || 0.04;
  if (wageGrowth > 0.08) {
    violations.push({
      id: 'wage_growth_high',
      severity: 'warning',
      rule: 'Budgeting Standard: Wage Growth Assumption',
      message: `Wage growth rate (${(wageGrowth * 100).toFixed(1)}%) is above 8%. This is aggressive for municipal budgeting and may overstate future costs.`,
      reference: 'GFOA Multi-Year Budgeting Best Practices',
      remediation: 'Review wage growth assumption with Finance Director. Consider 3–5% as a conservative range.',
      legalReview: false,
    });
  }

  // ── EMS collection rate ──────────────────────────────────────────────────
  const inhouseRate = settings.inhouse_steady_rate || 0.90;
  if (inhouseRate > 0.95) {
    violations.push({
      id: 'ems_collection_rate_aggressive',
      severity: 'warning',
      rule: 'Revenue Assumption: EMS Collection Rate',
      message: `In-house EMS collection rate (${(inhouseRate * 100).toFixed(1)}%) exceeds 95%. Industry benchmarks for municipal EMS billing are typically 85–92%.`,
      reference: 'GFOA Revenue Forecasting Best Practices',
      remediation: 'Reduce collection rate assumption to 90% or below for conservative budgeting.',
      legalReview: false,
    });
  }

  // ── Warrant / Select Board approval for large scenarios ──────────────────
  const erpTotal = erpY1 + (settings.erp_ongoing_cost || 5000);
  if (erpTotal > cfg.debt.require_select_board_approval_above) {
    violations.push({
      id: 'select_board_approval_required',
      severity: 'info',
      rule: 'Governance: Select Board Approval',
      message: `ERP expenditure ($${erpTotal.toLocaleString()}) exceeds $${cfg.debt.require_select_board_approval_above.toLocaleString()} — Select Board approval and town meeting warrant article required.`,
      reference: 'Maine MRS Title 30-A §2523; Town Charter',
      remediation: 'Include ERP appropriation as a specific warrant article at town meeting.',
      legalReview: true,
    });
  }

  // ── Interlocal agreements ─────────────────────────────────────────────────
  const hasRegional = (settings.rb_annual_contract || 0) + (settings.machiasport_annual_contract || 0) > 0;
  if (hasRegional) {
    violations.push({
      id: 'interlocal_legal_review',
      severity: 'info',
      rule: 'Interlocal Agreement Authorization (Maine 30-A §2201)',
      message: 'Regional service contracts are modeled. Each requires a formally executed interlocal agreement authorized under Maine MRS Title 30-A §2201.',
      reference: 'Maine MRS Title 30-A §2201',
      remediation: 'Ensure each regional contract has a signed interlocal agreement reviewed by Town Counsel before revenue is budgeted.',
      legalReview: true,
    });
  }

  // ── Tax abatement disclosure (GASB 77) ───────────────────────────────────
  violations.push({
    id: 'gasb77_tif_check',
    severity: 'info',
    rule: 'GASB 77: Tax Abatement Disclosure',
    message: 'If any TIF districts or tax abatement agreements exist, they must be disclosed in levy calculations and financial statements.',
    reference: 'GASB Statement No. 77',
    remediation: 'Confirm with Finance Director whether any TIF districts or abatements apply. Document in audit notes.',
    legalReview: true,
  });

  return violations;
}

// ─── 3. VIOLATION SUMMARY HELPER ────────────────────────────────────────────

export function getViolationSummary(violations) {
  return {
    errors:   violations.filter(v => v.severity === 'error'),
    warnings: violations.filter(v => v.severity === 'warning'),
    info:     violations.filter(v => v.severity === 'info'),
    total:    violations.length,
    hasErrors: violations.some(v => v.severity === 'error'),
    hasWarnings: violations.some(v => v.severity === 'warning'),
    legalReviewRequired: violations.filter(v => v.legalReview),
  };
}

export default COMPLIANCE_CONFIG;