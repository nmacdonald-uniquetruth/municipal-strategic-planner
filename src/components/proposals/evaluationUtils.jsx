/**
 * Evaluation Framework Utilities
 * Reusable functions for integrating proposal evaluations across the platform
 */

export const PROPOSAL_TYPES = {
  departmental: 'Departmental',
  capital_project: 'Capital Project',
  shared_service: 'Shared Service',
  restructuring: 'Restructuring',
  regional_service: 'Regional Service',
  initiative: 'Initiative',
};

export const RECOMMENDATIONS = {
  recommended: 'Recommended',
  recommended_with_conditions: 'Recommended with Conditions',
  further_study_needed: 'Further Study Needed',
  not_recommended: 'Not Recommended',
};

/**
 * Calculate overall score from criterion scores and weights
 */
export function calculateOverallScore(data, weights) {
  const criteria = [
    'financial_impact',
    'tax_impact',
    'service_impact',
    'operational_feasibility',
    'staffing_impact',
    'implementation_complexity',
    'political_community_feasibility',
    'regional_collaboration_potential',
    'long_term_sustainability',
    'risk_level',
  ];

  let totalScore = 0;
  let totalWeight = 0;

  criteria.forEach(criterion => {
    const score = data[criterion]?.score || 0;
    const weight = weights?.[`${criterion}_weight`] || 0;
    // Invert scores for complexity and risk (lower is better)
    const adjustedScore =
      criterion === 'implementation_complexity' || criterion === 'risk_level'
        ? 10 - score
        : score;
    totalScore += adjustedScore * weight;
    totalWeight += weight;
  });

  return totalWeight > 0 ? totalScore / totalWeight : 0;
}

/**
 * Get rating based on score
 */
export function getRating(score) {
  if (score >= 8.5) return 'excellent';
  if (score >= 7) return 'good';
  if (score >= 5) return 'acceptable';
  if (score >= 2.5) return 'marginal';
  return 'poor';
}

/**
 * Get recommendation based on score
 */
export function getRecommendation(score) {
  if (score >= 8) return 'recommended';
  if (score >= 6.5) return 'recommended_with_conditions';
  if (score >= 4.5) return 'further_study_needed';
  return 'not_recommended';
}

/**
 * Get color class for rating display
 */
export function getRatingColorClass(rating) {
  switch (rating) {
    case 'excellent':
      return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    case 'good':
      return 'text-blue-700 bg-blue-50 border-blue-200';
    case 'acceptable':
      return 'text-amber-700 bg-amber-50 border-amber-200';
    case 'marginal':
      return 'text-orange-700 bg-orange-50 border-orange-200';
    case 'poor':
      return 'text-red-700 bg-red-50 border-red-200';
    default:
      return 'text-slate-700 bg-slate-50 border-slate-200';
  }
}

/**
 * Get color class for recommendation display
 */
export function getRecommendationColorClass(recommendation) {
  switch (recommendation) {
    case 'recommended':
      return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    case 'recommended_with_conditions':
      return 'text-blue-700 bg-blue-50 border-blue-200';
    case 'further_study_needed':
      return 'text-amber-700 bg-amber-50 border-amber-200';
    case 'not_recommended':
      return 'text-red-700 bg-red-50 border-red-200';
    default:
      return 'text-slate-700 bg-slate-50 border-slate-200';
  }
}

/**
 * Format recommendation text for display
 */
export function formatRecommendation(recommendation) {
  return RECOMMENDATIONS[recommendation] || recommendation.replace(/_/g, ' ');
}

/**
 * Create a new evaluation object with default values
 */
export function createDefaultEvaluation(proposalType, proposalName) {
  return {
    proposal_type: proposalType,
    proposal_name: proposalName,
    evaluated_by: '',
    evaluation_date: new Date().toISOString().split('T')[0],
    financial_impact: { score: 5, rationale: '' },
    tax_impact: { score: 5, rationale: '' },
    service_impact: { score: 5, rationale: '' },
    operational_feasibility: { score: 5, rationale: '' },
    staffing_impact: { score: 5, rationale: '' },
    implementation_complexity: { score: 5, rationale: '' },
    political_community_feasibility: { score: 5, rationale: '' },
    regional_collaboration_potential: { score: 5, rationale: '' },
    long_term_sustainability: { score: 5, rationale: '' },
    risk_level: { score: 5, overall_risk: 'moderate', rationale: '' },
    scoring_weights: {
      financial_impact_weight: 12,
      tax_impact_weight: 10,
      service_impact_weight: 12,
      operational_feasibility_weight: 10,
      staffing_impact_weight: 10,
      implementation_complexity_weight: 8,
      political_community_feasibility_weight: 12,
      regional_collaboration_potential_weight: 8,
      long_term_sustainability_weight: 12,
      risk_level_weight: 6,
    },
    overall_score: 5,
    overall_rating: 'acceptable',
    recommendation: 'further_study_needed',
    recommendation_summary: '',
    evaluator_comments: '',
    assumptions: [],
    dependencies: [],
    mitigation_actions: [],
    status: 'draft',
  };
}

/**
 * Validate evaluation data
 */
export function validateEvaluation(data) {
  const errors = [];

  if (!data.proposal_name?.trim()) {
    errors.push('Proposal name is required');
  }

  if (!data.proposal_type) {
    errors.push('Proposal type is required');
  }

  if (!data.evaluated_by?.trim()) {
    errors.push('Evaluator name is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}