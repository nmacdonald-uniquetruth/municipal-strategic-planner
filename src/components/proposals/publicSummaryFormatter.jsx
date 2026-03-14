/**
 * Converts proposal data into plain-language public summaries
 */

export const formatProposalSummary = (proposal) => {
  return {
    title: proposal.title,
    summary: generateExecutiveSummary(proposal),
    whatIsChanging: generateWhatIsChanging(proposal),
    whyProposed: generateWhyProposed(proposal),
    benefits: generateBenefits(proposal),
    costs: generateCosts(proposal),
    nextSteps: generateNextSteps(proposal),
    timeline: proposal.implementationTimeline,
  };
};

const generateExecutiveSummary = (proposal) => {
  const categoryLabels = {
    staffing: 'staffing change',
    shared_services: 'shared services initiative',
    regional_revenue: 'regional partnership',
    capital: 'capital improvement project',
    governance: 'governance update',
    administration: 'administrative change',
  };

  const department = proposal.departments?.[0] || 'the municipality';
  const action = categoryLabels[proposal.category] || 'initiative';

  return `This is a proposal for a ${action} affecting ${department}. ${proposal.description}`;
};

const generateWhatIsChanging = (proposal) => {
  const changes = [];

  // For staffing changes
  if (proposal.category === 'staffing') {
    if (proposal.departments?.includes('Police')) {
      changes.push('The Police Department organizational structure will be restructured');
      changes.push('New roles focused on community engagement will be added');
    }
  }

  // For shared services
  if (proposal.category === 'shared_services') {
    changes.push(`${proposal.departments?.join(', ') || 'Department'} services will be consolidated`);
    changes.push(`Shared arrangement with ${proposal.towns?.slice(1).join(', ') || 'partner organizations'}`);
  }

  // For regional initiatives
  if (proposal.category === 'regional_revenue') {
    changes.push(`A regional partnership will be established involving ${proposal.towns?.length || 'multiple'} communities`);
  }

  // For capital projects
  if (proposal.category === 'capital') {
    changes.push('A capital improvement project will be undertaken');
    changes.push(proposal.description);
  }

  return changes.length > 0 ? changes : [proposal.description];
};

const generateWhyProposed = (proposal) => {
  const reasons = [];

  // Financial reasons
  if (proposal.estimatedAnnualSavings > 0 || proposal.estimatedAnnualRevenue > 0) {
    const total = (proposal.estimatedAnnualSavings || 0) + (proposal.estimatedAnnualRevenue || 0);
    if (total > 0) {
      reasons.push(`This proposal is expected to generate approximately $${(total / 1000).toFixed(0)}k in annual financial benefit.`);
    }
  }

  // Strategic reasons
  if (proposal.keyBenefits?.length > 0) {
    reasons.push('This proposal will provide the following strategic advantages:');
    reasons.push(`• ${proposal.keyBenefits[0]}`);
    if (proposal.keyBenefits[1]) {
      reasons.push(`• ${proposal.keyBenefits[1]}`);
    }
  }

  if (reasons.length === 0) {
    reasons.push('This proposal aligns with municipal strategic priorities.');
  }

  return reasons;
};

const generateBenefits = (proposal) => {
  const benefits = [];

  // Financial benefits
  if (proposal.estimatedAnnualSavings > 0) {
    benefits.push(`Reduce annual costs by approximately $${(proposal.estimatedAnnualSavings / 1000).toFixed(0)}k`);
  }

  if (proposal.estimatedAnnualRevenue > 0) {
    benefits.push(`Generate approximately $${(proposal.estimatedAnnualRevenue / 1000).toFixed(0)}k in annual revenue`);
  }

  // Service benefits
  if (proposal.keyBenefits?.length > 0) {
    benefits.push(...proposal.keyBenefits.map(b => `• ${b}`));
  }

  if (benefits.length === 0) {
    benefits.push('Improved municipal services and operations');
  }

  return benefits;
};

const generateCosts = (proposal) => {
  const costs = [];

  if (proposal.implementationCost && proposal.implementationCost > 0) {
    costs.push(`Upfront implementation cost: $${(proposal.implementationCost / 1000).toFixed(0)}k`);
  }

  // Calculate net impact
  const annualBenefit = (proposal.estimatedAnnualSavings || 0) + (proposal.estimatedAnnualRevenue || 0);
  const annualCost = proposal.implementationCost ? 0 : 0; // One-time cost

  if (proposal.implementationCost && annualBenefit > 0) {
    const paybackYears = (proposal.implementationCost / annualBenefit).toFixed(1);
    costs.push(`Expected to pay for itself in approximately ${paybackYears} years`);
  }

  // Tax impact messaging
  if (annualBenefit > 0) {
    costs.push(`This proposal is expected to reduce pressure on the municipal tax levy`);
  } else if (annualBenefit < 0) {
    costs.push(`This proposal may have a cost to the municipality`);
  }

  return costs.length > 0 ? costs : ['Implementation will require municipal resources'];
};

const generateNextSteps = (proposal) => {
  const steps = [];

  switch (proposal.status) {
    case 'concept':
      steps.push('This proposal is in the early concept phase');
      steps.push('Initial community and stakeholder feedback is being gathered');
      steps.push('Further study is underway to refine details');
      break;
    case 'in_development':
      steps.push('This proposal is being actively developed');
      steps.push('Department heads and stakeholders are refining the plan');
      steps.push('A formal review and presentation will follow');
      break;
    case 'ready_for_review':
      steps.push('This proposal is ready for formal review');
      steps.push('It will be presented to town leadership and budget committees');
      steps.push('Public comment period may be scheduled');
      break;
    case 'approved':
      steps.push('This proposal has been approved');
      steps.push('Implementation is underway');
      break;
    case 'implemented':
      steps.push('This proposal has been implemented');
      break;
    default:
      steps.push('Further details on next steps will be shared as they become available');
  }

  return steps;
};

export const formatScenarioSummary = (scenario) => {
  return {
    name: scenario.name,
    summary: scenario.description || 'A strategic planning scenario',
    keyAssumptions: formatAssumptions(scenario),
    fiveYearOutlook: generateOutlook(scenario),
    tradeoffs: generateTradeoffs(scenario),
  };
};

const formatAssumptions = (scenario) => {
  const assumptions = [];

  if (scenario.financial_assumptions) {
    const fa = scenario.financial_assumptions;
    if (fa.wage_growth_rate) {
      assumptions.push(`Wage growth: ${(fa.wage_growth_rate * 100).toFixed(1)}% annually`);
    }
    if (fa.transport_growth_rate) {
      assumptions.push(`Service volume growth: ${(fa.transport_growth_rate * 100).toFixed(1)}% annually`);
    }
  }

  if (scenario.staffing_assumptions?.y1_staffing_model) {
    assumptions.push(`Year 1 approach: ${scenario.staffing_assumptions.y1_staffing_model.replace('_', ' ')}`);
  }

  return assumptions.length > 0 ? assumptions : ['Standard municipal planning assumptions'];
};

const generateOutlook = (scenario) => {
  return `This scenario projects municipal operations over a five-year period with ${scenario.type || 'moderate'} strategic initiatives. It is designed to inform long-term planning decisions.`;
};

const generateTradeoffs = (scenario) => {
  const tradeoffs = [];

  if (scenario.staffing_assumptions?.regional_services_enabled) {
    tradeoffs.push('Pursuing regional services will require coordination with partner communities but offers potential cost savings');
  }

  if (scenario.operational_assumptions?.erp_implementation) {
    tradeoffs.push('ERP implementation requires upfront investment but improves long-term operational efficiency');
  }

  return tradeoffs.length > 0
    ? tradeoffs
    : ['This scenario balances fiscal responsibility with service quality'];
};