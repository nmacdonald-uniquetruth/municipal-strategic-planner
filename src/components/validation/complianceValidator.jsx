/**
 * Compliance Validator
 * Procurement rules, debt legal limits, Maine MRS statutory checks.
 */

import { SEVERITY } from './financialValidator';

// Maine MRS Title 30-A thresholds (municipal procurement)
export const MAINE_PROCUREMENT_THRESHOLDS = {
  informal_quotes: 10000,      // < $10K: no formal process required
  formal_bid: 50000,           // ≥ $50K: formal sealed bid required
  board_approval: 25000,       // > $25K: Select Board approval required
  town_meeting: 500000,        // Capital bond > $500K requires Town Meeting vote
};

// Maine statutory debt limit: municipalities cannot exceed 15% of last known full value
export const MAINE_DEBT_LIMIT_PCT = 0.15;

// GFOA recommended undesignated fund balance floor: 8–17% of annual revenues
export const GFOA_FUND_BALANCE_MIN_PCT = 0.08;
export const GFOA_FUND_BALANCE_REC_PCT = 0.17;

/**
 * Validate procurement compliance for a proposal or capital project
 */
export function validateProcurement(item) {
  const results = [];
  const cost = item.implementationCost || item.totalCost || item.amount || 0;
  const name = item.title || item.name || 'Item';

  if (cost >= MAINE_PROCUREMENT_THRESHOLDS.town_meeting) {
    results.push({
      id: 'PROCUREMENT_TOWN_MEETING',
      severity: SEVERITY.ERROR,
      category: 'procurement',
      message: `"${name}" cost of ${fmt(cost)} requires Town Meeting vote (≥ ${fmt(MAINE_PROCUREMENT_THRESHOLDS.town_meeting)}).`,
      reference: 'Maine MRS Title 30-A § 5721-A',
      remediation: 'Schedule Town Meeting article or phase project to stay below threshold.',
      legalReview: true,
    });
  } else if (cost >= MAINE_PROCUREMENT_THRESHOLDS.formal_bid) {
    results.push({
      id: 'PROCUREMENT_FORMAL_BID',
      severity: SEVERITY.WARNING,
      category: 'procurement',
      message: `"${name}" cost of ${fmt(cost)} requires formal sealed bid process (≥ ${fmt(MAINE_PROCUREMENT_THRESHOLDS.formal_bid)}).`,
      reference: 'Maine MRS Title 30-A § 5701',
      remediation: 'Issue formal RFP/bid documents before contract award.',
    });
  } else if (cost >= MAINE_PROCUREMENT_THRESHOLDS.board_approval) {
    results.push({
      id: 'PROCUREMENT_BOARD_APPROVAL',
      severity: SEVERITY.INFO,
      category: 'procurement',
      message: `"${name}" cost of ${fmt(cost)} requires Select Board approval (> ${fmt(MAINE_PROCUREMENT_THRESHOLDS.board_approval)}).`,
      reference: 'Maine MRS Title 30-A § 2671',
      remediation: 'Bring to Select Board for formal vote before proceeding.',
    });
  }

  return results;
}

/**
 * Validate total debt against Maine statutory limit
 */
export function validateDebtLimit({ totalDebt, totalAssessedValue, proposedNewDebt = 0 }) {
  const results = [];
  const limit = totalAssessedValue * MAINE_DEBT_LIMIT_PCT;
  const projectedDebt = totalDebt + proposedNewDebt;
  const utilizationPct = totalAssessedValue > 0 ? (projectedDebt / totalAssessedValue) * 100 : 0;

  if (projectedDebt > limit) {
    results.push({
      id: 'DEBT_LIMIT_EXCEEDED',
      severity: SEVERITY.ERROR,
      category: 'debt_compliance',
      message: `Projected debt of ${fmt(projectedDebt)} exceeds Maine statutory limit of ${fmt(Math.round(limit))} (15% of AV).`,
      detail: `Assessed Value: ${fmt(totalAssessedValue)} | Limit: ${fmt(Math.round(limit))} | Projected: ${fmt(projectedDebt)}`,
      reference: 'Maine MRS Title 30-A § 5772',
      remediation: 'Reduce proposed borrowing, retire existing debt first, or seek legislative exception.',
      legalReview: true,
    });
  } else if (projectedDebt > limit * 0.80) {
    results.push({
      id: 'DEBT_LIMIT_WARNING',
      severity: SEVERITY.WARNING,
      category: 'debt_compliance',
      message: `Debt utilization at ${utilizationPct.toFixed(1)}% of statutory limit — approaching 15% cap.`,
      detail: `Headroom remaining: ${fmt(Math.round(limit - projectedDebt))}`,
      reference: 'Maine MRS Title 30-A § 5772',
      remediation: 'Monitor debt capacity before issuing additional bonds.',
    });
  }

  return results;
}

/**
 * Validate undesignated fund balance meets GFOA policy floors
 */
export function validateFundBalance({ fundBalance, annualRevenue }) {
  const results = [];
  const minFloor = annualRevenue * GFOA_FUND_BALANCE_MIN_PCT;
  const recFloor = annualRevenue * GFOA_FUND_BALANCE_REC_PCT;
  const pct = annualRevenue > 0 ? (fundBalance / annualRevenue) * 100 : 0;

  if (fundBalance < minFloor) {
    results.push({
      id: 'FUND_BALANCE_BELOW_MIN',
      severity: SEVERITY.ERROR,
      category: 'fund_balance',
      message: `Undesignated fund balance of ${fmt(fundBalance)} (${pct.toFixed(1)}%) is below GFOA minimum floor of 8% (${fmt(Math.round(minFloor))}).`,
      reference: 'GFOA Best Practice: Fund Balance in the General Fund',
      remediation: 'Halt discretionary draws from undesignated reserves until balance is restored.',
    });
  } else if (fundBalance < recFloor) {
    results.push({
      id: 'FUND_BALANCE_BELOW_REC',
      severity: SEVERITY.WARNING,
      category: 'fund_balance',
      message: `Fund balance of ${fmt(fundBalance)} (${pct.toFixed(1)}%) is below GFOA recommended 17% (${fmt(Math.round(recFloor))}).`,
      reference: 'GFOA Best Practice: Fund Balance in the General Fund',
      remediation: 'Consider a fund balance replenishment plan over 3–5 years.',
    });
  }

  return results;
}

/**
 * Validate interlocal agreement compliance
 */
export function validateInterlocalAgreement(service) {
  const results = [];
  if (service.status === 'active' && service.agreement_type === 'none') {
    results.push({
      id: 'INTERLOCAL_MISSING',
      severity: SEVERITY.ERROR,
      category: 'interlocal_compliance',
      message: `Active service "${service.name}" lacks a formal interlocal agreement.`,
      reference: 'Maine MRS Title 30-A § 2204 (Interlocal Cooperation Act)',
      remediation: 'Execute a formal interlocal agreement before continuing service delivery.',
      legalReview: true,
    });
  }
  if (service.renewal_date && new Date(service.renewal_date) < new Date()) {
    results.push({
      id: 'INTERLOCAL_EXPIRED',
      severity: SEVERITY.WARNING,
      category: 'interlocal_compliance',
      message: `Service agreement for "${service.name}" has passed its renewal date.`,
      remediation: 'Renew or renegotiate agreement immediately.',
    });
  }
  return results;
}

const fmt = n => `$${Math.round(n).toLocaleString()}`;