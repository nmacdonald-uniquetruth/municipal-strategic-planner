/**
 * Budget & Tax Commitment Engine
 * Pure calculation functions — no React dependencies.
 * Implements the Maine municipal budget cycle:
 *   1. Department appropriations (by fund)
 *   2. Revenue deductions
 *   3. Net to be raised through taxation
 *   4. Mill rate selection
 *   5. Overlay & tax for commitment
 */

// ─── Appropriation totals ──────────────────────────────────────────────────────

/**
 * Sum a category of budget lines, using whichever column is most authoritative
 * (adopted > select_board > budget_committee > manager_request > 0)
 */
export function resolveAmount(line) {
  return (
    line.adopted ??
    line.select_board ??
    line.budget_committee ??
    line.manager_request ??
    0
  );
}

export function sumLines(lines, accountType) {
  return lines
    .filter(l => !accountType || l.account_type === accountType)
    .reduce((s, l) => s + (resolveAmount(l) || 0), 0);
}

export function sumByFund(lines, fund, accountType) {
  return lines
    .filter(l => l.fund === fund && (!accountType || l.account_type === accountType))
    .reduce((s, l) => s + (resolveAmount(l) || 0), 0);
}

// ─── BETE-style tax rate calculation ─────────────────────────────────────────

/**
 * Full Maine municipal tax commitment calculation.
 *
 * Mirrors the Maine State Assessor's BETE form / LD 534 commitment process:
 *   total appropriations
 *   - total deductions
 *   = net to be raised through taxation
 *   + overlay
 *   = tax for commitment
 *   tax for commitment / total assessed value × 1000 = mill rate
 *
 * @param {object} p
 * @param {number} p.municipalAppropriations
 * @param {number} p.schoolAppropriations
 * @param {number} p.countyAssessment
 * @param {number} p.tifFinancingPlan           - TIF amount retained in district (reduces taxation)
 * @param {number} p.enterpriseOffsets          - Enterprise fund contributions to GF
 * @param {number} p.stateRevenueSharing
 * @param {number} p.localRevenues              - Fees, excise, misc non-tax revenue
 * @param {number} p.fundBalanceUse             - Undesignated fund balance applied to reduce levy
 * @param {number} p.grantsAndReimbursements
 * @param {number} p.beteReimbursement          - Business Equipment Tax Exemption state reimbursement
 * @param {number} p.homesteadExemptionValue    - Homestead exemption total value reduction
 * @param {number} p.totalAssessedValue         - Before exemptions
 * @param {number} p.overlayPercent             - Overlay as % of net to be raised (default 1%)
 * @param {number} [p.selectedMillRate]         - If provided, back-calculate commitment
 * @returns {BudgetCalcResult}
 */
export function calculateTaxCommitment({
  municipalAppropriations = 0,
  schoolAppropriations = 0,
  countyAssessment = 0,
  tifFinancingPlan = 0,
  enterpriseOffsets = 0,
  stateRevenueSharing = 0,
  localRevenues = 0,
  fundBalanceUse = 0,
  grantsAndReimbursements = 0,
  beteReimbursement = 0,
  homesteadExemptionValue = 0,
  totalAssessedValue = 0,
  overlayPercent = 1.0,
  selectedMillRate = null,
}) {
  // Step 1: Total appropriations
  const totalAppropriations = municipalAppropriations + schoolAppropriations + countyAssessment;

  // Step 2: Total deductions (all non-tax revenue sources)
  const totalDeductions =
    enterpriseOffsets +
    stateRevenueSharing +
    localRevenues +
    fundBalanceUse +
    grantsAndReimbursements +
    beteReimbursement +
    tifFinancingPlan;

  // Step 3: Net to be raised through taxation
  const netToBeRaised = Math.max(0, totalAppropriations - totalDeductions);

  // Step 4: Overlay
  const overlayDollars = Math.round(netToBeRaised * (overlayPercent / 100));
  const taxForCommitment = netToBeRaised + overlayDollars;

  // Step 5: Taxable value (net of homestead exemptions)
  const taxableValue = Math.max(0, totalAssessedValue - homesteadExemptionValue);

  // Step 6: Calculated mill rate
  const calculatedMillRate = taxableValue > 0 ? (taxForCommitment / taxableValue) * 1000 : 0;

  // Step 7: If a specific mill rate is selected, recalculate commitment accordingly
  const effectiveMillRate = selectedMillRate ?? calculatedMillRate;
  const selectedCommitment = taxableValue > 0 ? Math.round((effectiveMillRate / 1000) * taxableValue) : taxForCommitment;
  const millRateDelta = effectiveMillRate - calculatedMillRate;

  return {
    // Appropriations
    municipalAppropriations,
    schoolAppropriations,
    countyAssessment,
    tifFinancingPlan,
    totalAppropriations,

    // Deductions
    enterpriseOffsets,
    stateRevenueSharing,
    localRevenues,
    fundBalanceUse,
    grantsAndReimbursements,
    beteReimbursement,
    totalDeductions,

    // Net raised
    netToBeRaised,
    overlayDollars,
    overlayPercent,
    taxForCommitment,

    // Mill rate
    totalAssessedValue,
    homesteadExemptionValue,
    taxableValue,
    calculatedMillRate: parseFloat(calculatedMillRate.toFixed(4)),
    selectedMillRate: parseFloat(effectiveMillRate.toFixed(4)),
    selectedCommitment,
    millRateDelta: parseFloat(millRateDelta.toFixed(4)),

    // Verification
    reconciled: Math.abs(taxForCommitment - selectedCommitment) < 100,
  };
}

// ─── Prior-year comparison ────────────────────────────────────────────────────

export function compareToPriorYear(current, prior) {
  const safeDiv = (a, b) => (b && b !== 0 ? ((a - b) / Math.abs(b)) * 100 : 0);
  return {
    appropriationsChange: current.totalAppropriations - (prior.totalAppropriations ?? 0),
    appropriationsPct: safeDiv(current.totalAppropriations, prior.totalAppropriations),
    deductionsChange: current.totalDeductions - (prior.totalDeductions ?? 0),
    netRaisedChange: current.netToBeRaised - (prior.netToBeRaised ?? 0),
    netRaisedPct: safeDiv(current.netToBeRaised, prior.netToBeRaised),
    millRateChange: current.selectedMillRate - (prior.selectedMillRate ?? 0),
    levyChange: current.taxForCommitment - (prior.taxForCommitment ?? 0),
    levyPct: safeDiv(current.taxForCommitment, prior.taxForCommitment),
  };
}

// ─── Reconciliation checks ───────────────────────────────────────────────────

/**
 * Validates that all totals cross-foot correctly.
 * Returns array of warning messages — empty array means clean.
 */
export function reconcile(calc, worksheetLines = []) {
  const warnings = [];

  if (calc.netToBeRaised < 0) {
    warnings.push({ type: 'error', msg: 'Net to be raised is negative — deductions exceed appropriations.' });
  }
  if (calc.overlayPercent > 5) {
    warnings.push({ type: 'warning', msg: `Overlay is ${calc.overlayPercent.toFixed(1)}% — Maine best practice is ≤3%.` });
  }
  if (!calc.reconciled) {
    warnings.push({ type: 'error', msg: `Selected mill rate commitment ($${calc.selectedCommitment.toLocaleString()}) does not match tax for commitment ($${calc.taxForCommitment.toLocaleString()}).` });
  }
  if (calc.totalAssessedValue < 1_000_000) {
    warnings.push({ type: 'warning', msg: 'Total assessed value appears very low — verify input.' });
  }
  if (calc.selectedMillRate > 30) {
    warnings.push({ type: 'warning', msg: `Mill rate of ${calc.selectedMillRate.toFixed(3)} is high for Maine — verify appropriations.` });
  }
  if (calc.fundBalanceUse > calc.netToBeRaised * 0.15) {
    warnings.push({ type: 'warning', msg: 'Fund balance use exceeds 15% of net raised — GFOA recommends maintaining 2 months of operating expenditures.' });
  }

  // Cross-check worksheet lines if provided
  if (worksheetLines.length > 0) {
    const wsApprop = sumLines(worksheetLines, 'appropriation');
    const wsDeduct = sumLines(worksheetLines, 'deduction') + sumLines(worksheetLines, 'enterprise_offset');
    const diff = Math.abs((wsApprop - wsDeduct) - calc.netToBeRaised);
    if (diff > 500) {
      warnings.push({ type: 'error', msg: `Worksheet totals ($${Math.round(wsApprop - wsDeduct).toLocaleString()}) do not reconcile with BETE form net ($${calc.netToBeRaised.toLocaleString()}). Difference: $${Math.round(diff).toLocaleString()}.` });
    }
  }

  return warnings;
}

// ─── What-if mill rate scenarios ─────────────────────────────────────────────

/**
 * Generate a table of outcomes at different mill rates around the calculated rate.
 */
export function millRateScenarios(calc, steps = 5, stepSize = 0.1) {
  const base = calc.calculatedMillRate;
  const results = [];
  for (let i = -steps; i <= steps; i++) {
    const mr = parseFloat((base + i * stepSize).toFixed(4));
    const commitment = calc.taxableValue > 0 ? Math.round((mr / 1000) * calc.taxableValue) : 0;
    const overlayGenerated = commitment - calc.netToBeRaised;
    const overlayPct = calc.netToBeRaised > 0 ? (overlayGenerated / calc.netToBeRaised) * 100 : 0;
    const perMedianHome = Math.round((mr / 1000) * 150000);
    results.push({
      millRate: mr,
      commitment,
      overlayGenerated,
      overlayPct: parseFloat(overlayPct.toFixed(2)),
      perMedianHome,
      delta: mr - calc.calculatedMillRate,
      isCalculated: i === 0,
    });
  }
  return results;
}

// ─── Article-level appropriations ────────────────────────────────────────────

export function groupByArticle(lines) {
  const groups = {};
  lines.forEach(l => {
    const key = l.article_number || 'Unassigned';
    if (!groups[key]) groups[key] = { article: key, lines: [], total: 0, priorTotal: 0 };
    groups[key].lines.push(l);
    groups[key].total += resolveAmount(l);
    groups[key].priorTotal += l.prior_year_budget ?? 0;
  });
  return Object.values(groups).sort((a, b) => a.article.localeCompare(b.article));
}

export function groupByDepartment(lines) {
  const groups = {};
  lines.forEach(l => {
    const key = l.department || 'General';
    if (!groups[key]) groups[key] = { department: key, lines: [], total: 0, priorTotal: 0 };
    groups[key].lines.push(l);
    groups[key].total += resolveAmount(l);
    groups[key].priorTotal += l.prior_year_budget ?? 0;
  });
  return Object.values(groups).sort((a, b) => a.department.localeCompare(b.department));
}