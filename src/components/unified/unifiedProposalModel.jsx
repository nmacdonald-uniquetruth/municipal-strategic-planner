/**
 * Unified Proposal Data Model
 * 
 * Normalizes all proposal-related data structures so that:
 * - Scenarios contain proposals
 * - Proposals contain evaluations and impacts
 * - All calculations reference shared assumptions
 * - Regional service revenue feeds into financial impact
 * - Implementation roadmaps are generated from proposal data
 * - Board summaries are generated from proposal data
 */

/**
 * Proposal data structure unified across all modules
 */
export const createUnifiedProposal = ({
  id,
  title,
  description,
  category,
  priority = 'medium',
  status = 'concept',
  scenario_id = null,
  
  // Basic info
  departments = [],
  services = [],
  towns = [],
  fiscal_year = '',
  
  // Financial impact (normalized)
  financialImpact = {
    annualSavings: 0,
    annualRevenue: 0,
    implementationCost: 0,
    paybackPeriodYears: 0,
    fiveYearNet: 0,
    assumptions: []
  },
  
  // Tax impact (normalized)
  taxImpact = {
    millRateChange: 0,
    taxLevyChange: 0,
    assumptions: []
  },
  
  // Staffing impact (normalized)
  staffingImpact = {
    fteChange: 0,
    positionsAdded: [],
    positionsEliminated: [],
    skillGaps: [],
    assumptions: []
  },
  
  // Service impact (normalized)
  serviceImpact = {
    areasAffected: [],
    expectedImprovements: [],
    assumptions: []
  },
  
  // Risk tracking (normalized)
  risks = [],
  
  // Assumptions (shared across all impacts)
  assumptions = [],
  
  // Regional services (if applicable)
  regionalServices = {
    targetTowns: [],
    adoptionRate: 0,
    projectedRevenue: 0,
    assumptions: []
  },
  
  // Implementation roadmap (generated from proposal)
  implementationRoadmap = null,
  
  // Evaluation reference
  evaluation_id = null,
  
  // Board summary (generated from proposal)
  boardSummary = null,
  
  // Metadata
  relatedProposals = [],
  notes = ''
} = {}) => ({
  id,
  title,
  description,
  category,
  priority,
  status,
  scenario_id,
  departments,
  services,
  towns,
  fiscal_year,
  financialImpact,
  taxImpact,
  staffingImpact,
  serviceImpact,
  risks,
  assumptions,
  regionalServices,
  implementationRoadmap,
  evaluation_id,
  boardSummary,
  relatedProposals,
  notes
});

/**
 * Calculate unified financial impact
 * References shared assumptions for consistency
 */
export const calculateFinancialImpact = (proposal, sharedAssumptions = {}) => {
  const {
    financialImpact = {},
    staffingImpact = {},
    regionalServices = {},
    taxImpact = {}
  } = proposal;

  // Sum direct annual impact
  const directAnnualImpact =
    (financialImpact.annualSavings || 0) +
    (financialImpact.annualRevenue || 0);

  // Add regional service revenue
  const regionalRevenue = regionalServices.projectedRevenue || 0;

  // Total annual benefit
  const totalAnnualBenefit = directAnnualImpact + regionalRevenue;

  // Implementation cost
  const implementationCost = financialImpact.implementationCost || 0;

  // Payback period
  const paybackPeriodYears =
    implementationCost > 0 && totalAnnualBenefit > 0
      ? implementationCost / totalAnnualBenefit
      : 0;

  // Five-year net impact
  const fiveYearNet = totalAnnualBenefit * 5 - implementationCost;

  return {
    ...financialImpact,
    annualSavings: directAnnualImpact,
    annualRevenue: regionalRevenue,
    totalAnnualBenefit,
    implementationCost,
    paybackPeriodYears,
    fiveYearNet
  };
};

/**
 * Calculate unified tax impact
 * References shared assumptions and financial impact
 */
export const calculateTaxImpact = (proposal, sharedAssumptions = {}) => {
  const financialImpact = calculateFinancialImpact(proposal, sharedAssumptions);
  const totalAssessedValue = sharedAssumptions.totalAssessedValue || 198000000;
  const currentMillRate = sharedAssumptions.currentMillRate || 14.5;

  // Calculate mill rate change based on net impact
  const annualImpact = financialImpact.totalAnnualBenefit;
  const millRateAdjustment = (annualImpact / totalAssessedValue) * 1000;

  return {
    ...proposal.taxImpact,
    millRateChange: -millRateAdjustment,
    taxLevyChange: annualImpact,
    newMillRate: currentMillRate + millRateAdjustment,
    assumptions: [
      `Total assessed value: $${totalAssessedValue.toLocaleString()}`,
      `Current mill rate: ${currentMillRate}`
    ]
  };
};

/**
 * Generate implementation roadmap from proposal
 */
export const generateImplementationRoadmap = (proposal) => {
  const { title, category, implementationRoadmap } = proposal;

  if (implementationRoadmap) {
    return implementationRoadmap;
  }

  // Generate default roadmap based on category
  const phases = {
    staffing: [
      { phase: 1, description: 'Position recruitment and approval', timeline: 'Months 1-2' },
      { phase: 2, description: 'Hiring and onboarding', timeline: 'Months 3-4' },
      { phase: 3, description: 'Training and integration', timeline: 'Months 5-6' },
      { phase: 4, description: 'Operational assessment', timeline: 'Months 7-12' }
    ],
    shared_services: [
      { phase: 1, description: 'Service definition and requirements gathering', timeline: 'Months 1-2' },
      { phase: 2, description: 'Partner engagement and MOU negotiation', timeline: 'Months 3-4' },
      { phase: 3, description: 'System setup and transition planning', timeline: 'Months 5-8' },
      { phase: 4, description: 'Implementation and optimization', timeline: 'Months 9-12' }
    ],
    regional_revenue: [
      { phase: 1, description: 'Market research and pricing analysis', timeline: 'Months 1-3' },
      { phase: 2, description: 'Service offerings and marketing', timeline: 'Months 4-6' },
      { phase: 3, description: 'Launch and customer acquisition', timeline: 'Months 7-9' },
      { phase: 4, description: 'Operations and scaling', timeline: 'Months 10-12' }
    ],
    capital: [
      { phase: 1, description: 'Project planning and design', timeline: 'Months 1-4' },
      { phase: 2, description: 'Procurement and vendor selection', timeline: 'Months 5-6' },
      { phase: 3, description: 'Construction/implementation', timeline: 'Months 7-10' },
      { phase: 4, description: 'Testing and deployment', timeline: 'Months 11-12' }
    ]
  };

  return {
    proposal_id: proposal.id,
    phases: phases[category] || phases.staffing,
    generated_date: new Date().toISOString()
  };
};

/**
 * Generate board-ready summary from proposal
 */
export const generateBoardSummary = (proposal, evaluation = null) => {
  const {
    title,
    description,
    category,
    priority,
    departments,
    financialImpact,
    staffingImpact,
    risks
  } = proposal;

  const financial = calculateFinancialImpact(proposal);
  const tax = calculateTaxImpact(proposal);

  return {
    proposal_id: proposal.id,
    title,
    category,
    priority,
    executive_summary: `${title} proposes ${description}. This initiative affects ${departments.join(', ')} and is categorized as ${category.replace(/_/g, ' ')}.`,
    financial_highlights: [
      `Annual benefit: $${financial.totalAnnualBenefit.toLocaleString()}`,
      `Implementation cost: $${financial.implementationCost.toLocaleString()}`,
      `Payback period: ${financial.paybackPeriodYears.toFixed(1)} years`,
      `5-year net impact: $${financial.fiveYearNet.toLocaleString()}`
    ],
    tax_impact: [
      `Mill rate change: ${tax.millRateChange.toFixed(3)} cents`,
      `Tax levy change: $${tax.taxLevyChange.toLocaleString()}`
    ],
    staffing_impact: [
      `FTE change: ${staffingImpact.fteChange}`,
      `Positions added: ${staffingImpact.positionsAdded.join(', ') || 'None'}`,
      `Positions eliminated: ${staffingImpact.positionsEliminated.join(', ') || 'None'}`
    ],
    key_risks: risks.slice(0, 3).map(r => r.risk || r),
    recommendation: evaluation?.recommendation || 'Pending evaluation',
    evaluation_score: evaluation?.overall_score,
    generated_date: new Date().toISOString()
  };
};

/**
 * Build scenario proposal collection
 * Scenarios contain multiple proposals
 */
export const buildScenarioProposals = (scenario, proposalsData = []) => {
  return {
    scenario_id: scenario.id,
    scenario_name: scenario.name,
    proposals: proposalsData.map(p => createUnifiedProposal(p)),
    total_financial_impact: proposalsData.reduce(
      (sum, p) => sum + calculateFinancialImpact(p).totalAnnualBenefit,
      0
    ),
    total_implementation_cost: proposalsData.reduce(
      (sum, p) => sum + (p.financialImpact?.implementationCost || 0),
      0
    ),
    generated_date: new Date().toISOString()
  };
};

/**
 * Compare multiple proposals
 */
export const compareProposals = (proposals, evaluation_map = {}) => {
  return proposals.map(p => {
    const financial = calculateFinancialImpact(p);
    const tax = calculateTaxImpact(p);
    const evaluation = evaluation_map[p.id];

    return {
      id: p.id,
      title: p.title,
      category: p.category,
      priority: p.priority,
      annual_benefit: financial.totalAnnualBenefit,
      implementation_cost: financial.implementationCost,
      payback_period: financial.paybackPeriodYears,
      five_year_net: financial.fiveYearNet,
      mill_rate_impact: tax.millRateChange,
      fte_change: p.staffingImpact.fteChange,
      risk_count: p.risks.length,
      evaluation_score: evaluation?.overall_score,
      recommendation: evaluation?.recommendation
    };
  });
};