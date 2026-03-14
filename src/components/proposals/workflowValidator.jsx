/**
 * Validates proposal workflow state and enforces required steps
 */

export const WORKFLOW_STAGES = {
  DRAFT: 'draft',
  UNDER_REVIEW: 'under_review',
  EVALUATED: 'evaluated',
  RECOMMENDED: 'recommended',
  APPROVED_CONCEPTUALLY: 'approved_conceptually',
  IMPLEMENTATION_PLANNING: 'implementation_planning',
  ARCHIVED: 'archived',
};

export const WORKFLOW_STAGE_LABELS = {
  draft: 'Draft',
  under_review: 'Under Review',
  evaluated: 'Evaluated',
  recommended: 'Recommended',
  approved_conceptually: 'Approved Conceptually',
  implementation_planning: 'Implementation Planning',
  archived: 'Archived',
};

export const WORKFLOW_STAGE_DESCRIPTIONS = {
  draft: 'Initial proposal development',
  under_review: 'Being reviewed by stakeholders',
  evaluated: 'Formal evaluation completed',
  recommended: 'Recommended for approval',
  approved_conceptually: 'Approved in concept by decision body',
  implementation_planning: 'Active implementation planning',
  archived: 'Proposal archived or superseded',
};

/**
 * Check what completion requirements are needed for a proposal to advance
 */
export const getWorkflowRequirements = (currentStatus) => {
  const requirements = {
    draft: [],
    under_review: ['Submit for review'],
    evaluated: [
      'Complete formal evaluation',
      'Document risks and assumptions',
      'Analyze tax impact',
    ],
    recommended: [
      'Evaluation scorecard completed',
      'Risk assessment documented',
      'Tax impact analysis complete',
      'Stakeholder review completed',
    ],
    approved_conceptually: [
      'All recommended requirements',
      'Conceptual approval from decision body',
    ],
    implementation_planning: [
      'All approval requirements',
      'Implementation timeline defined',
      'Resource allocation planned',
    ],
    archived: ['Archival reason documented'],
  };

  return requirements[currentStatus] || [];
};

/**
 * Validate if proposal can advance to next stage
 */
export const validateWorkflowAdvance = (proposal, evaluation, nextStatus) => {
  const validationErrors = [];

  // Can always move to draft or under_review
  if (nextStatus === WORKFLOW_STAGES.DRAFT || nextStatus === WORKFLOW_STAGES.UNDER_REVIEW) {
    return { valid: true, errors: [] };
  }

  // Moving to evaluated requires evaluation data
  if (nextStatus === WORKFLOW_STAGES.EVALUATED) {
    if (!evaluation) {
      validationErrors.push('Formal evaluation must be completed before marking as Evaluated');
    }
  }

  // Moving to recommended requires evaluation, risks, and tax analysis
  if (nextStatus === WORKFLOW_STAGES.RECOMMENDED) {
    if (!evaluation) {
      validationErrors.push('A formal evaluation scorecard is required to recommend a proposal');
    }
    if (!proposal.risks || proposal.risks.length === 0) {
      validationErrors.push('Risks must be documented before recommendation');
    }
    if (!evaluation?.assumptions || Object.keys(evaluation.assumptions || {}).length === 0) {
      validationErrors.push('Assumptions must be documented before recommendation');
    }
  }

  // Moving to approved conceptually requires recommendation status first
  if (nextStatus === WORKFLOW_STAGES.APPROVED_CONCEPTUALLY) {
    if (proposal.status !== WORKFLOW_STAGES.RECOMMENDED) {
      validationErrors.push('Proposal must be recommended before conceptual approval');
    }
  }

  // Moving to implementation planning requires approval first
  if (nextStatus === WORKFLOW_STAGES.IMPLEMENTATION_PLANNING) {
    if (proposal.status !== WORKFLOW_STAGES.APPROVED_CONCEPTUALLY) {
      validationErrors.push('Proposal must be approved conceptually before implementation planning');
    }
    if (!proposal.implementationTimeline) {
      validationErrors.push('Implementation timeline must be defined');
    }
  }

  return {
    valid: validationErrors.length === 0,
    errors: validationErrors,
  };
};

/**
 * Get the next allowed status in workflow
 */
export const getNextWorkflowStage = (currentStatus) => {
  const sequence = [
    WORKFLOW_STAGES.DRAFT,
    WORKFLOW_STAGES.UNDER_REVIEW,
    WORKFLOW_STAGES.EVALUATED,
    WORKFLOW_STAGES.RECOMMENDED,
    WORKFLOW_STAGES.APPROVED_CONCEPTUALLY,
    WORKFLOW_STAGES.IMPLEMENTATION_PLANNING,
  ];

  const currentIndex = sequence.indexOf(currentStatus);
  return currentIndex !== -1 && currentIndex < sequence.length - 1
    ? sequence[currentIndex + 1]
    : null;
};

/**
 * Get allowed status transitions for a proposal
 */
export const getAllowedStatusTransitions = (currentStatus) => {
  const transitions = {
    draft: [WORKFLOW_STAGES.UNDER_REVIEW, WORKFLOW_STAGES.ARCHIVED],
    under_review: [WORKFLOW_STAGES.EVALUATED, WORKFLOW_STAGES.DRAFT, WORKFLOW_STAGES.ARCHIVED],
    evaluated: [WORKFLOW_STAGES.RECOMMENDED, WORKFLOW_STAGES.UNDER_REVIEW, WORKFLOW_STAGES.ARCHIVED],
    recommended: [WORKFLOW_STAGES.APPROVED_CONCEPTUALLY, WORKFLOW_STAGES.EVALUATED, WORKFLOW_STAGES.ARCHIVED],
    approved_conceptually: [WORKFLOW_STAGES.IMPLEMENTATION_PLANNING, WORKFLOW_STAGES.RECOMMENDED, WORKFLOW_STAGES.ARCHIVED],
    implementation_planning: [WORKFLOW_STAGES.ARCHIVED],
    archived: [WORKFLOW_STAGES.DRAFT],
  };

  return transitions[currentStatus] || [];
};

/**
 * Calculate completion percentage for a proposal workflow
 */
export const getWorkflowCompletionPercentage = (proposal, evaluation) => {
  const checklist = getProposalChecklist(proposal, evaluation);
  if (checklist.total === 0) return 0;
  return Math.round((checklist.completed / checklist.total) * 100);
};

/**
 * Generate detailed checklist for proposal requirements
 */
export const getProposalChecklist = (proposal, evaluation) => {
  const items = [
    { name: 'Basic Information', completed: !!proposal.title && !!proposal.description },
    { name: 'Financial Metrics', completed: proposal.estimatedAnnualSavings !== undefined || proposal.estimatedAnnualRevenue !== undefined },
    { name: 'Benefits Documented', completed: proposal.keyBenefits?.length > 0 },
    { name: 'Risks Identified', completed: proposal.risks?.length > 0 },
    { name: 'Mitigation Strategies', completed: proposal.mitigationStrategies?.length > 0 },
    { name: 'Success Metrics Defined', completed: proposal.successMetrics?.length > 0 },
    { name: 'Stakeholders Identified', completed: proposal.stakeholders?.length > 0 },
    { name: 'Implementation Timeline', completed: !!proposal.implementationTimeline },
    { name: 'Formal Evaluation', completed: !!evaluation && !!evaluation.overall_score },
    { name: 'Risk Assessment', completed: !!evaluation && !!evaluation.risk_level },
    { name: 'Tax Impact Analysis', completed: !!evaluation && !!evaluation.tax_impact },
  ];

  const completed = items.filter(item => item.completed).length;
  return {
    items,
    completed,
    total: items.length,
    percentage: Math.round((completed / items.length) * 100),
  };
};