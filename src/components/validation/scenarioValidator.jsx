/**
 * Scenario Integrity Validator
 * Ensures proposals have financial impacts, service changes propagate to cost models,
 * and scenario projections are internally consistent.
 */

import { SEVERITY } from './financialValidator';

/**
 * Validate a single proposal for completeness and integrity
 */
export function validateProposal(proposal) {
  const results = [];
  const name = proposal.title || 'Unnamed Proposal';

  // Financial impact must be defined
  const hasFinancial = (
    proposal.estimatedAnnualSavings > 0 ||
    proposal.estimatedAnnualRevenue > 0 ||
    proposal.implementationCost > 0
  );
  if (!hasFinancial) {
    results.push({
      id: 'PROPOSAL_NO_FINANCIAL_IMPACT',
      severity: SEVERITY.ERROR,
      category: 'proposal_integrity',
      message: `Proposal "${name}" has no financial impact defined.`,
      detail: 'At least one of: estimatedAnnualSavings, estimatedAnnualRevenue, or implementationCost must be set.',
      remediation: 'Complete the financial impact section before moving to In Development.',
    });
  }

  // Implementation cost without timeline
  if (proposal.implementationCost > 0 && !proposal.implementationTimeline) {
    results.push({
      id: 'PROPOSAL_NO_TIMELINE',
      severity: SEVERITY.WARNING,
      category: 'proposal_integrity',
      message: `Proposal "${name}" has an implementation cost but no timeline.`,
      remediation: 'Define an implementation timeline so cost can be spread across fiscal years.',
    });
  }

  // Staffing changes require department
  if (
    proposal.staffingImpact &&
    (proposal.staffingImpact.fteChange !== 0 || (proposal.staffingImpact.positionsEliminated || []).length > 0) &&
    (!proposal.departments || proposal.departments.length === 0)
  ) {
    results.push({
      id: 'PROPOSAL_STAFFING_NO_DEPT',
      severity: SEVERITY.WARNING,
      category: 'proposal_integrity',
      message: `Proposal "${name}" includes staffing changes but no department is specified.`,
      remediation: 'Assign at least one affected department.',
    });
  }

  // Regional proposals must name partner towns
  if (proposal.category === 'regional_revenue' && (!proposal.towns || proposal.towns.length === 0)) {
    results.push({
      id: 'PROPOSAL_REGIONAL_NO_TOWNS',
      severity: SEVERITY.WARNING,
      category: 'proposal_integrity',
      message: `Regional revenue proposal "${name}" does not identify partner towns.`,
      remediation: 'Specify the towns involved in the regional arrangement.',
    });
  }

  // Approved proposals need a fiscal year
  if (['approved', 'implemented'].includes(proposal.status) && !proposal.fiscalYear) {
    results.push({
      id: 'PROPOSAL_NO_FISCAL_YEAR',
      severity: SEVERITY.WARNING,
      category: 'proposal_integrity',
      message: `Approved proposal "${name}" does not have a fiscal year assigned.`,
      remediation: 'Assign a fiscal year so it can be mapped to projections.',
    });
  }

  // Unrealistically large savings
  if (proposal.estimatedAnnualSavings > 500000) {
    results.push({
      id: 'PROPOSAL_SAVINGS_HIGH',
      severity: SEVERITY.WARNING,
      category: 'proposal_integrity',
      message: `Proposal "${name}" claims savings of ${fmt(proposal.estimatedAnnualSavings)} — verify this figure.`,
      detail: 'Savings exceeding $500K for a single municipal proposal warrant additional scrutiny.',
      remediation: 'Document assumptions and provide supporting analysis.',
    });
  }

  return results;
}

/**
 * Validate a scenario for completeness and projection integrity
 */
export function validateScenario(scenario, projectionData = []) {
  const results = [];
  const name = scenario.name || 'Unnamed Scenario';

  // Must have financial assumptions
  if (!scenario.financial_assumptions || Object.keys(scenario.financial_assumptions).length === 0) {
    results.push({
      id: 'SCENARIO_NO_FINANCIAL_ASSUMPTIONS',
      severity: SEVERITY.WARNING,
      category: 'scenario_integrity',
      message: `Scenario "${name}" has no financial assumptions — will use global defaults.`,
      remediation: 'Define financial assumptions to differentiate scenarios.',
    });
  }

  // Projection data cross-checks
  projectionData.forEach(yr => {
    // Net negative every year is a red flag
    if (yr.net < -100000) {
      results.push({
        id: `SCENARIO_PERSISTENT_DEFICIT_Y${yr.year}`,
        severity: SEVERITY.ERROR,
        category: 'scenario_integrity',
        message: `Scenario "${name}" — ${yr.label} projects a deficit of ${fmt(Math.abs(yr.net))}.`,
        remediation: 'Adjust revenue assumptions or phase expenditure increases.',
      });
    }

    // Sudden revenue spike (>40% YoY)
    if (yr.year > 1 && projectionData[yr.year - 2]) {
      const prev = projectionData[yr.year - 2].revenue.total;
      const curr = yr.revenue.total;
      if (prev > 0 && (curr - prev) / prev > 0.40) {
        results.push({
          id: `SCENARIO_REVENUE_SPIKE_Y${yr.year}`,
          severity: SEVERITY.WARNING,
          category: 'scenario_integrity',
          message: `Scenario "${name}" — ${yr.label} revenue grows >40% YoY. Verify regional contract ramp-up.`,
          remediation: 'Confirm adoption rates and contract start dates are realistic.',
        });
      }
    }

    // Mill rate sanity
    if (yr.tax?.millRate > 25) {
      results.push({
        id: `SCENARIO_MILL_HIGH_Y${yr.year}`,
        severity: SEVERITY.WARNING,
        category: 'scenario_integrity',
        message: `Scenario "${name}" — ${yr.label} mill rate of ${yr.tax.millRate.toFixed(2)} is very high.`,
        remediation: 'Revisit expenditure growth and tax base assumptions.',
      });
    }
  });

  // Aggressive scenario without risk documentation
  if (scenario.type === 'aggressive' && (!scenario.risks || scenario.risks.length === 0)) {
    results.push({
      id: 'SCENARIO_AGGRESSIVE_NO_RISKS',
      severity: SEVERITY.WARNING,
      category: 'scenario_integrity',
      message: `Aggressive scenario "${name}" has no documented risks.`,
      remediation: 'Document at least 3 key risks with mitigation strategies.',
    });
  }

  return results;
}

/**
 * Check that service changes in proposals update related cost model fields
 */
export function validateServiceCostPropagation(proposal, services = []) {
  const results = [];

  if (proposal.serviceTypes && proposal.serviceTypes.length > 0) {
    proposal.serviceTypes.forEach(serviceType => {
      const matchedService = services.find(s => s.type === serviceType || s.name.toLowerCase().includes(serviceType.toLowerCase()));
      if (!matchedService) {
        results.push({
          id: `SERVICE_NOT_FOUND_${serviceType.toUpperCase()}`,
          severity: SEVERITY.INFO,
          category: 'cost_propagation',
          message: `Proposal references service type "${serviceType}" but no matching Service record exists.`,
          remediation: `Create a Service record for "${serviceType}" to enable cost model integration.`,
        });
      }
    });
  }

  return results;
}

const fmt = n => `$${Math.round(n).toLocaleString()}`;