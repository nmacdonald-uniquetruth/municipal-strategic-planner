/**
 * calculationEngine.js
 *
 * All financial, tax, staffing, and impact calculations.
 * Tax/mill-rate math delegates to calculateMillRateImpact() in modelUtils —
 * do NOT inline mill-rate formulas here.
 */

import { calculateMillRateImpact, calculateFullyLoadedCost } from '../machias/modelUtils';

/**
 * Calculate all impacts for a proposal
 */
export const calculateAllImpacts = (proposal, sharedAssumptions) => {
  return {
    financial: calculateFinancialImpact(proposal, sharedAssumptions),
    tax: calculateTaxImpact(proposal, sharedAssumptions),
    staffing: calculateStaffingImpact(proposal, sharedAssumptions),
    service: calculateServiceImpact(proposal, sharedAssumptions),
    risk: calculateRiskMetrics(proposal),
    regional: calculateRegionalServiceImpact(proposal, sharedAssumptions)
  };
};

/**
 * Financial impact calculation
 */
export const calculateFinancialImpact = (proposal, sharedAssumptions) => {
  const {
    financialImpact = {},
    staffingImpact = {},
    regionalServices = {}
  } = proposal;

  // Direct savings and revenue
  const directSavings = financialImpact.annualSavings || 0;
  const directRevenue = financialImpact.annualRevenue || 0;

  // Staffing-related costs (fully loaded)
  const staffingCost = calculateStaffingCost(
    staffingImpact,
    sharedAssumptions
  );

  // Regional service revenue
  const regionalRevenue = regionalServices.projectedRevenue || 0;

  // Net annual benefit
  const totalAnnualBenefit = directSavings + directRevenue + regionalRevenue - staffingCost;

  // Implementation cost
  const implementationCost = financialImpact.implementationCost || 0;

  // Payback period
  const paybackPeriod = totalAnnualBenefit > 0
    ? implementationCost / totalAnnualBenefit
    : 999;

  // Five-year projection
  const fiveYearNet = (totalAnnualBenefit * 5) - implementationCost;

  // Year-by-year projection
  const yearlyProjection = [];
  for (let year = 1; year <= 5; year++) {
    let yearTotal = totalAnnualBenefit * year - implementationCost;
    
    // Account for regional service ramp-up
    if (regionalRevenue > 0) {
      const adoptionRamp = Math.min(1, year / 3); // 3-year ramp
      yearTotal -= implementationCost * (1 - adoptionRamp);
    }
    
    yearlyProjection.push({
      year,
      annual_benefit: totalAnnualBenefit,
      cumulative_net: yearTotal
    });
  }

  return {
    annual_savings: directSavings,
    annual_revenue: directRevenue,
    staffing_cost: staffingCost,
    regional_revenue: regionalRevenue,
    total_annual_benefit: totalAnnualBenefit,
    implementation_cost: implementationCost,
    payback_period_years: paybackPeriod,
    five_year_net: fiveYearNet,
    yearly_projection: yearlyProjection,
    assumptions: financialImpact.assumptions || []
  };
};

/**
 * Calculate staffing cost impact
 */
export const calculateStaffingCost = (staffingImpact, sharedAssumptions) => {
  const { fteChange = 0, positionsAdded = [], positionsEliminated = [] } = staffingImpact;

  // This would need position detail data to calculate actual costs
  // For now, use average cost per FTE
  const averageCostPerFTE = 85000;
  return fteChange * averageCostPerFTE * sharedAssumptions.wage_growth_rate;
};

/**
 * Tax impact calculation — delegates to canonical mill-rate formula.
 * A positive total_annual_benefit reduces levy; negate before passing.
 */
export const calculateTaxImpact = (proposal, sharedAssumptions) => {
  const financial = calculateFinancialImpact(proposal, sharedAssumptions);
  return calculateMillRateImpact(-financial.total_annual_benefit, sharedAssumptions);
};

/**
 * Staffing impact calculation
 */
export const calculateStaffingImpact = (proposal, sharedAssumptions) => {
  const { staffingImpact = {} } = proposal;

  return {
    ...staffingImpact,
    fully_loaded_cost_per_fte: 85000, // Average
    total_annual_cost: (staffingImpact.fteChange || 0) * 85000,
    positions_modified: (staffingImpact.positionsAdded?.length || 0) +
                       (staffingImpact.positionsEliminated?.length || 0)
  };
};

/**
 * Service impact calculation
 */
export const calculateServiceImpact = (proposal, sharedAssumptions) => {
  const { serviceImpact = {} } = proposal;

  return {
    ...serviceImpact,
    service_areas_count: serviceImpact.areasAffected?.length || 0,
    improvements_expected: serviceImpact.expectedImprovements?.length || 0,
    has_regional_impact: proposal.regionalServices?.targetTowns?.length > 0
  };
};

/**
 * Risk metrics calculation
 */
export const calculateRiskMetrics = (proposal) => {
  const { risks = [] } = proposal;

  const probabilityMap = { low: 1, medium: 2, high: 3 };
  const impactMap = { low: 1, medium: 2, high: 3 };

  const riskScores = risks.map(r => {
    const probability = probabilityMap[r.probability] || 1;
    const impact = impactMap[r.impact] || 1;
    return probability * impact;
  });

  const totalRiskScore = riskScores.reduce((sum, s) => sum + s, 0);
  const avgRiskScore = riskScores.length > 0 ? totalRiskScore / riskScores.length : 0;

  return {
    total_risks: risks.length,
    high_probability: risks.filter(r => r.probability === 'high').length,
    high_impact: risks.filter(r => r.impact === 'high').length,
    critical_risks: risks.filter(
      r => r.probability === 'high' && r.impact === 'high'
    ).length,
    average_risk_score: avgRiskScore,
    risk_score_scale: 'Probability × Impact (1-9 scale)'
  };
};

/**
 * Regional service impact calculation
 */
export const calculateRegionalServiceImpact = (proposal, sharedAssumptions) => {
  const { regionalServices = {} } = proposal;

  return {
    target_towns: regionalServices.targetTowns?.length || 0,
    adoption_rate: regionalServices.adoptionRate || 0,
    projected_revenue: regionalServices.projectedRevenue || 0,
    expected_participants: Math.round(
      (regionalServices.targetTowns?.length || 0) *
      (regionalServices.adoptionRate || 0)
    ),
    revenue_per_participant: regionalServices.targetTowns?.length > 0 &&
                            regionalServices.adoptionRate > 0
      ? regionalServices.projectedRevenue /
        (regionalServices.targetTowns.length * regionalServices.adoptionRate)
      : 0
  };
};

/**
 * Calculate proposal score (used by evaluations)
 */
export const calculateProposalScore = (impacts) => {
  // Scoring factors (0-10 scale)
  const financialScore = Math.min(10, (impacts.financial.total_annual_benefit / 100000) + 5);
  const staffingScore = Math.max(0, 10 - (impacts.staffing.fteChange * 2));
  const riskScore = Math.max(0, 10 - impacts.risk.average_risk_score);
  const serviceScore = Math.min(10, impacts.service.improvements_expected * 2);

  // Weighted average
  const weights = {
    financial: 0.3,
    staffing: 0.2,
    risk: 0.25,
    service: 0.25
  };

  const weightedScore =
    (financialScore * weights.financial) +
    (staffingScore * weights.staffing) +
    (riskScore * weights.risk) +
    (serviceScore * weights.service);

  return {
    overall_score: Math.min(10, Math.max(0, weightedScore)),
    component_scores: {
      financial: financialScore,
      staffing: staffingScore,
      risk: riskScore,
      service: serviceScore
    }
  };
};

/**
 * Compare multiple proposals using same calculation engine
 */
export const compareProposalsForScenario = (proposals, sharedAssumptions) => {
  return proposals.map(p => {
    const allImpacts = calculateAllImpacts(p, sharedAssumptions);
    const score = calculateProposalScore(allImpacts);

    return {
      id: p.id,
      title: p.title,
      category: p.category,
      priority: p.priority,
      status: p.status,
      ...allImpacts,
      proposal_score: score.overall_score,
      score_components: score.component_scores
    };
  });
};

/**
 * Aggregate impacts across multiple proposals
 */
export const aggregateProposalImpacts = (proposals, sharedAssumptions) => {
  const compared = compareProposalsForScenario(proposals, sharedAssumptions);

  return {
    proposal_count: proposals.length,
    total_annual_benefit: compared.reduce((sum, p) => sum + p.financial.total_annual_benefit, 0),
    total_implementation_cost: compared.reduce((sum, p) => sum + p.financial.implementation_cost, 0),
    total_five_year_net: compared.reduce((sum, p) => sum + p.financial.five_year_net, 0),
    total_mill_rate_impact: compared.reduce((sum, p) => sum + p.tax.mill_rate_change, 0),
    total_fte_change: compared.reduce((sum, p) => sum + p.staffing.fteChange, 0),
    total_risks: compared.reduce((sum, p) => sum + p.risk.total_risks, 0),
    average_proposal_score: compared.reduce((sum, p) => sum + p.proposal_score, 0) / compared.length,
    proposals: compared
  };
};