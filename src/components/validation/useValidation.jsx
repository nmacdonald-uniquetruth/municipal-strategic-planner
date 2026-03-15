/**
 * useValidation — React hook
 * Runs all validation layers (financial, compliance, scenario) and returns
 * a unified results object with severity-bucketed violations and helpers.
 */

import { useMemo } from 'react';
import { validateProjectionYear } from './financialValidator';
import { validateProcurement, validateDebtLimit, validateFundBalance, validateInterlocalAgreement } from './complianceValidator';
import { validateProposal, validateScenario } from './scenarioValidator';

/**
 * @param {object} opts
 * @param {Array}  opts.projectionYears  - array from runScenarioProjection()
 * @param {object} opts.settings         - ModelSettings
 * @param {Array}  opts.proposals        - RestructuringProposal records
 * @param {Array}  opts.services         - Service records
 * @param {object} opts.scenario         - active Scenario record
 */
export function useValidation({ projectionYears = [], settings = {}, proposals = [], services = [], scenario = null } = {}) {
  const violations = useMemo(() => {
    const all = [];

    // Financial checks — each projection year
    projectionYears.forEach(yr => {
      const yrViolations = validateProjectionYear(yr, settings);
      yrViolations.forEach(v => all.push({ ...v, context: `Year ${yr.year} (${yr.label})` }));
    });

    // Debt compliance
    const totalDebt = settings.ambulance_loan_payoff || 130000;
    const debtViolations = validateDebtLimit({
      totalDebt,
      totalAssessedValue: settings.total_assessed_value || 198000000,
    });
    debtViolations.forEach(v => all.push({ ...v, context: 'Debt Compliance' }));

    // Fund balance
    const annualRevenue = settings.annual_tax_levy || 2871000;
    const fundBalance = settings.gf_undesignated_balance || 0;
    const fbViolations = validateFundBalance({ fundBalance, annualRevenue });
    fbViolations.forEach(v => all.push({ ...v, context: 'Fund Balance' }));

    // Proposal integrity
    proposals.forEach(p => {
      validateProposal(p).forEach(v => all.push({ ...v, context: `Proposal: ${p.title}` }));
      validateProcurement(p).forEach(v => all.push({ ...v, context: `Proposal: ${p.title}` }));
    });

    // Service compliance
    services.forEach(s => {
      validateInterlocalAgreement(s).forEach(v => all.push({ ...v, context: `Service: ${s.name}` }));
    });

    // Scenario integrity
    if (scenario) {
      validateScenario(scenario, projectionYears).forEach(v => all.push({ ...v, context: `Scenario: ${scenario.name}` }));
    }

    return all;
  }, [projectionYears, settings, proposals, services, scenario]);

  const errors   = violations.filter(v => v.severity === 'error');
  const warnings = violations.filter(v => v.severity === 'warning');
  const info     = violations.filter(v => v.severity === 'info');
  const hasErrors = errors.length > 0;
  const hasWarnings = warnings.length > 0;
  const legalItems = violations.filter(v => v.legalReview);

  const byCategory = violations.reduce((acc, v) => {
    acc[v.category] = acc[v.category] || [];
    acc[v.category].push(v);
    return acc;
  }, {});

  return {
    violations,
    errors,
    warnings,
    info,
    byCategory,
    legalItems,
    hasErrors,
    hasWarnings,
    isClean: violations.length === 0,
    summary: `${errors.length} error${errors.length !== 1 ? 's' : ''}, ${warnings.length} warning${warnings.length !== 1 ? 's' : ''}`,
  };
}