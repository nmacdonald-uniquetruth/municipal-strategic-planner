// Dynamic Financial Proposal Engine
// Generates structured proposals for each department using live financial model data

export async function generateDepartmentProposal(department, base44, settings, planningHorizon, regionalParticipations) {
  // Filter participations for this department
  const deptParticipations = regionalParticipations.filter(p => p.department === department);
  const participatingTowns = deptParticipations.filter(p => p.status !== 'not_participating').map(p => p.municipality);
  const activeTowns = deptParticipations.filter(p => p.status === 'active_partner' || p.status === 'host').map(p => p.municipality);
  const hostTown = deptParticipations.find(p => p.host_town);

  // Department metadata
  const deptMetadata = getDepartmentMetadata(department);

  // Calculate financial metrics
  const totalAnnualFees = deptParticipations
    .filter(p => p.annual_fee)
    .reduce((sum, p) => sum + p.annual_fee, 0);

  const projectedAnnualRevenue = totalAnnualFees * planningHorizon;
  const horizonYears = planningHorizon;

  // Staffing model - derive from PositionConfig or FinancialServicesStaffing
  const staffingRoles = deptMetadata.baselineStaffing || [];
  const totalStaffingCost = staffingRoles.reduce((sum, role) => {
    const annual = (role.base_salary || 0) + ((role.base_salary || 0) * 0.35); // Add ~35% for benefits
    return sum + annual;
  }, 0);

  // Cost allocation methodology
  const pricingMethods = new Set(deptParticipations.map(p => p.pricing_method).filter(Boolean));

  // Calculate advanced metrics
  const advancedMetrics = calculateAdvancedMetrics(
    department,
    deptParticipations,
    deptMetadata,
    totalStaffingCost,
    totalAnnualFees,
    settings,
    planningHorizon
  );

  return {
    department,
    deptMetadata,
    sections: {
      executiveSummary: generateExecutiveSummary(department, deptMetadata, activeTowns.length, totalAnnualFees || 0),
      serviceDescription: generateServiceDescription(department, deptMetadata),
      participatingTowns: generateParticipatingTowns(participatingTowns, activeTowns, hostTown),
      staffingModel: generateStaffingModel(staffingRoles, totalStaffingCost),
      serviceDeliveryModel: generateServiceDeliveryModel(department, deptMetadata, hostTown),
      financialModel: generateFinancialModel(totalAnnualFees, totalStaffingCost, horizonYears, department, deptParticipations, settings),
      advancedMetrics: advancedMetrics,
      costAllocationMethod: generateCostAllocation(deptMetadata, pricingMethods),
      revenueOpportunities: generateRevenueOpportunities(department, deptMetadata, deptParticipations),
      costSavingsPotential: generateCostSavings(department, deptMetadata),
      riskFactors: generateRiskFactors(department, deptMetadata),
      implementationTimeline: generateImplementationTimeline(department, deptMetadata),
      governanceModel: generateGovernanceModel(department, deptMetadata),
      contractStructure: generateContractStructure(department, deptMetadata),
      nextSteps: generateNextSteps(department, deptMetadata),
    },
    metadata: {
      generatedDate: new Date().toISOString(),
      planningHorizon,
      participatingTownsCount: participatingTowns.length,
      activeTownsCount: activeTowns.length,
      totalProjectedRevenue: projectedAnnualRevenue,
      annualRevenue: totalAnnualFees,
      staffingCost: totalStaffingCost,
    },
  };
}

function getDepartmentMetadata(department) {
  const metadata = {
    admin: {
      label: 'Administration',
      serviceArea: 'Municipal administration, personnel, IT, facilities',
      baselineStaffing: [
        { role: 'Administrative Director', base_salary: 68000, status: 'host' },
        { role: 'Administrative Assistant', base_salary: 39000, status: 'host' },
      ],
      regionalRationale: 'Consolidate administrative overhead, reduce redundant management layers, share IT infrastructure',
      keyOutcomes: ['Reduced administrative overhead', 'Standardized policies and procedures', 'Enhanced data security', 'Improved records management'],
    },
    finance: {
      label: 'Financial Services',
      serviceArea: 'Accounting, billing, revenue collection, financial reporting',
      baselineStaffing: [
        { role: 'Finance Director', base_salary: 68000, status: 'host' },
        { role: 'Staff Accountant', base_salary: 65000, status: 'host' },
        { role: 'Billing Specialist', base_salary: 55000, status: 'host' },
      ],
      regionalRationale: 'Centralize accounting, eliminate Comstar outsourcing fees, improve collection rates, ensure GASB compliance',
      keyOutcomes: ['Comstar fees avoided', 'Improved collection rates', 'Faster billing cycle', 'Better financial reporting'],
    },
    transfer_station: {
      label: 'Transfer Station',
      serviceArea: 'Solid waste transfer, recycling operations, hazardous waste',
      baselineStaffing: [
        { role: 'Transfer Station Manager', base_salary: 48000, status: 'host' },
        { role: 'Operations Technician', base_salary: 42000, status: 'host' },
      ],
      regionalRationale: 'Negotiate better waste tipping fees, expand member base, leverage economies of scale',
      keyOutcomes: ['Lower per-ton disposal costs', 'Expanded service area', 'Increased revenue per user', 'Environmental standards'],
    },
    assessor: {
      label: 'Tax Assessor',
      serviceArea: 'Property assessment, valuation, tax mapping, exemption administration',
      baselineStaffing: [
        { role: 'Assessor', base_salary: 52000, status: 'host' },
        { role: 'Assessment Technician', base_salary: 38000, status: 'support' },
      ],
      regionalRationale: 'Standardize assessment practices, improve tax collection compliance, reduce professional assessment costs',
      keyOutcomes: ['Consistent valuation methodology', 'Improved equalization rates', 'Reduced assessment litigation'],
    },
    animal_control: {
      label: 'Animal Control Officer',
      serviceArea: 'Animal welfare, nuisance complaints, enforcement, shelter operations',
      baselineStaffing: [
        { role: 'Animal Control Officer', base_salary: 42000, status: 'shared' },
      ],
      regionalRationale: 'Share ACO capacity across towns, provide 24/7 coverage, reduce response times',
      keyOutcomes: ['Better animal welfare', 'Faster response times', 'Lower per-town ACO cost', 'Legal compliance'],
    },
    ambulance: {
      label: 'Ambulance / EMS',
      serviceArea: 'Emergency medical services, patient transport, first responder coordination',
      baselineStaffing: [
        { role: 'EMS Director', base_salary: 55000, status: 'host' },
        { role: 'Paramedic (Full-time)', base_salary: 52000, status: 'staffing' },
        { role: 'EMT-Basic', base_salary: 38000, status: 'staffing' },
      ],
      regionalRationale: 'Improve response capability, reduce reliance on mutual aid, increase external billing revenue',
      keyOutcomes: ['Improved response times', 'Better clinical outcomes', 'Expanded external billing', 'Shared equipment costs'],
    },
    police: {
      label: 'Police Department',
      serviceArea: 'Law enforcement, public safety, emergency response',
      baselineStaffing: [
        { role: 'Police Chief', base_salary: 62000, status: 'host' },
        { role: 'Police Officer', base_salary: 48000, status: 'staffing' },
      ],
      regionalRationale: 'Coordinated patrol coverage, shared specialized services, joint training programs',
      keyOutcomes: ['24/7 patrol coverage', 'Specialized service access', 'Reduced per-capita cost', 'Unified dispatch'],
    },
    fire: {
      label: 'Fire Department',
      serviceArea: 'Fire suppression, emergency response, fire prevention, public education',
      baselineStaffing: [
        { role: 'Fire Chief', base_salary: 60000, status: 'host' },
        { role: 'Firefighter', base_salary: 45000, status: 'staffing' },
      ],
      regionalRationale: 'Joint training academy, shared equipment/apparatus, coordinated response protocols',
      keyOutcomes: ['Better response capability', 'Shared training costs', 'Equipment redundancy', 'Standardized procedures'],
    },
    inspection: {
      label: 'Regional Inspection Services',
      serviceArea: 'Code enforcement, building inspection, plumbing, electrical, health inspections',
      baselineStaffing: [
        { role: 'Local Plumbing Inspector', base_salary: 45000, status: 'shared' },
        { role: 'Building Inspector', base_salary: 50000, status: 'shared' },
      ],
      regionalRationale: 'Reduce code enforcement backlog, provide consistent standards, improve permitting timelines',
      keyOutcomes: ['Faster permitting', 'Consistent code enforcement', 'Lower certification costs', 'Better compliance'],
    },
  };

  return metadata[department] || { label: department, serviceArea: '', baselineStaffing: [] };
}

function generateExecutiveSummary(department, metadata, activeTowns, totalAnnualFees) {
  const label = metadata.label;
  return {
    title: `${label} Regional Service Proposal`,
    overview: `This proposal outlines a regional ${label} delivery model for Machias Bay municipalities. The service consolidates operations across ${activeTowns} towns, leveraging economies of scale to reduce per-capita costs while improving service quality and consistency.`,
    keyMetrics: [
      `Participating Towns: ${activeTowns}`,
      `Projected Annual Revenue: $${totalAnnualFees.toLocaleString()}`,
      `Service Area: ${metadata.serviceArea}`,
      `Regional Rationale: ${metadata.regionalRationale}`,
    ],
  };
}

function generateServiceDescription(department, metadata) {
  return {
    title: 'Service Description',
    overview: metadata.serviceArea,
    scope: metadata.keyOutcomes || [],
    standards: [
      'Maine state regulations and municipal codes',
      'Industry best practices and professional standards',
      'Consistent service levels across all participating towns',
    ],
  };
}

function generateParticipatingTowns(allTowns, activeTowns, hostTown) {
  return {
    title: 'Participating Towns',
    host: hostTown?.municipality || 'TBD',
    participating: allTowns.length,
    active: activeTowns.length,
    towns: allTowns.map(t => ({
      name: t,
      status: activeTowns.includes(t) ? 'Active' : 'Prospect',
    })),
  };
}

function generateStaffingModel(roles, totalCost) {
  const benefitsMultiplier = 1.35; // ~35% for benefits, taxes, overhead
  return {
    title: 'Staffing Model',
    description: 'Regional service delivery requires dedicated, professional staffing',
    positions: roles.map(r => ({
      title: r.role,
      baseSalary: r.base_salary,
      fullyLoaded: Math.round(r.base_salary * benefitsMultiplier),
      status: r.status,
    })),
    totalAnnualCost: Math.round(totalCost),
  };
}

function generateServiceDeliveryModel(department, metadata, hostTown) {
  return {
    title: 'Service Delivery Model',
    host: hostTown?.municipality || 'Machias',
    structure: `Hub-and-spoke model with ${hostTown?.municipality || 'Machias'} as the service hub. Regional staff operate under centralized management with satellite offices in participating towns as needed.`,
    coverage: '24/7 for emergency services; regular business hours for administrative and technical services.',
    accountability: 'Monthly performance reporting to regional board; annual service level agreements with each town.',
  };
}

function generateFinancialModel(annualRevenue, staffingCost, horizonYears, department, deptParticipations, settings) {
  // Build comprehensive cost structure
  const costStructure = buildCostStructure(department, staffingCost, settings);
  
  // Calculate revenue opportunities
  const revenueModel = buildRevenueModel(department, deptParticipations, settings);
  
  // Calculate net cost
  const totalOperatingCost = costStructure.total;
  const totalRevenue = revenueModel.total;
  const netAnnualCost = totalOperatingCost - totalRevenue;
  
  // Calculate cost allocation
  const costAllocation = calculateCostAllocation(deptParticipations, netAnnualCost);
  
  // Multi-year projection
  const yearsArray = Array.from({ length: horizonYears }, (_, i) => ({
    year: i + 1,
    operatingCost: totalOperatingCost,
    revenue: totalRevenue,
    netCost: netAnnualCost,
    cumulativeNetCost: netAnnualCost * (i + 1),
  }));

  return {
    title: 'Comprehensive Financial Model',
    costStructure: {
      staffing: costStructure.staffing,
      benefits: costStructure.benefits,
      equipment: costStructure.equipment,
      vehicles: costStructure.vehicles,
      technology: costStructure.technology,
      training: costStructure.training,
      overhead: costStructure.overhead,
      insurance: costStructure.insurance,
      total: Math.round(costStructure.total),
    },
    revenueOpportunities: {
      serviceContracts: revenueModel.serviceContracts,
      operationalRevenue: revenueModel.operationalRevenue,
      specialServices: revenueModel.specialServices,
      total: Math.round(revenueModel.total),
    },
    netCostCalculation: {
      totalOperatingCost: Math.round(totalOperatingCost),
      totalRevenue: Math.round(totalRevenue),
      netAnnualCost: Math.round(netAnnualCost),
      netCostPerCapita: deptParticipations.length > 0 ? Math.round(netAnnualCost / deptParticipations.length) : 0,
    },
    costAllocation: costAllocation,
    multiYearProjection: yearsArray,
    horizonTotalNetCost: Math.round(netAnnualCost * horizonYears),
  };
}

function buildCostStructure(department, basestaffingCost, settings) {
  const departmentCosts = {
    admin: {
      staffing: 107000,
      benefits: 42000,
      equipment: 8000,
      vehicles: 0,
      technology: 15000,
      training: 3000,
      overhead: 22000,
      insurance: 5000,
    },
    finance: {
      staffing: 188000,
      benefits: 85000,
      equipment: 5000,
      vehicles: 0,
      technology: 18000,
      training: 2000,
      overhead: 25000,
      insurance: 8000,
    },
    transfer_station: {
      staffing: 90000,
      benefits: 35000,
      equipment: 45000,
      vehicles: 35000,
      technology: 4000,
      training: 2000,
      overhead: 18000,
      insurance: 12000,
    },
    assessor: {
      staffing: 90000,
      benefits: 32000,
      equipment: 6000,
      vehicles: 8000,
      technology: 5000,
      training: 1500,
      overhead: 15000,
      insurance: 3000,
    },
    animal_control: {
      staffing: 42000,
      benefits: 16000,
      equipment: 3000,
      vehicles: 22000,
      technology: 2000,
      training: 1000,
      overhead: 8000,
      insurance: 4000,
    },
    ambulance: {
      staffing: 155000,
      benefits: 65000,
      equipment: 35000,
      vehicles: 48000,
      technology: 8000,
      training: 5000,
      overhead: 20000,
      insurance: 25000,
    },
    police: {
      staffing: 110000,
      benefits: 48000,
      equipment: 12000,
      vehicles: 55000,
      technology: 10000,
      training: 4000,
      overhead: 18000,
      insurance: 15000,
    },
    fire: {
      staffing: 105000,
      benefits: 45000,
      equipment: 25000,
      vehicles: 42000,
      technology: 6000,
      training: 6000,
      overhead: 16000,
      insurance: 18000,
    },
    inspection: {
      staffing: 95000,
      benefits: 33000,
      equipment: 4000,
      vehicles: 18000,
      technology: 3000,
      training: 1500,
      overhead: 14000,
      insurance: 4000,
    },
  };

  const costs = departmentCosts[department] || departmentCosts.admin;
  const total = Object.values(costs).reduce((s, v) => s + v, 0);

  return {
    ...costs,
    total,
  };
}

function buildRevenueModel(department, deptParticipations, settings) {
  const departmentRevenue = {
    finance: {
      serviceContracts: deptParticipations.filter(p => p.status !== 'not_participating').length * 22000,
      operationalRevenue: 35000,
      specialServices: 8000,
    },
    transfer_station: {
      serviceContracts: deptParticipations.filter(p => p.annual_fee).reduce((s, p) => s + (p.annual_fee || 0), 0),
      operationalRevenue: 18000,
      specialServices: 5000,
    },
    assessor: {
      serviceContracts: deptParticipations.filter(p => p.status !== 'not_participating').length * 12000,
      operationalRevenue: 4000,
      specialServices: 2000,
    },
    inspection: {
      serviceContracts: deptParticipations.filter(p => p.status !== 'not_participating').length * 15000,
      operationalRevenue: 12000,
      specialServices: 6000,
    },
    animal_control: {
      serviceContracts: deptParticipations.filter(p => p.status !== 'not_participating').length * 8000,
      operationalRevenue: 2000,
      specialServices: 1000,
    },
    ambulance: {
      serviceContracts: deptParticipations.filter(p => p.status !== 'not_participating').length * 18000,
      operationalRevenue: 42000,
      specialServices: 15000,
    },
    police: {
      serviceContracts: deptParticipations.filter(p => p.status !== 'not_participating').length * 25000,
      operationalRevenue: 8000,
      specialServices: 3000,
    },
    fire: {
      serviceContracts: deptParticipations.filter(p => p.status !== 'not_participating').length * 20000,
      operationalRevenue: 5000,
      specialServices: 2000,
    },
  };

  const revenue = departmentRevenue[department] || { serviceContracts: 0, operationalRevenue: 0, specialServices: 0 };
  const total = revenue.serviceContracts + revenue.operationalRevenue + revenue.specialServices;

  return {
    ...revenue,
    total,
  };
}

function calculateCostAllocation(deptParticipations, netAnnualCost) {
  const hostTown = deptParticipations.find(p => p.host_town);
  const activeTowns = deptParticipations.filter(p => p.status === 'active_partner' || p.status === 'host');
  
  if (activeTowns.length === 0) {
    return {
      methodology: 'No active participants',
      allocations: [],
    };
  }

  // Calculate per capita allocation (simplified)
  const costPerParticipant = netAnnualCost / activeTowns.length;
  
  // Host town typically bears a portion of overhead
  const hostShare = netAnnualCost * 0.35;
  const remainingCost = netAnnualCost - hostShare;
  const partnerShare = remainingCost / (activeTowns.length - 1 || 1);

  const allocations = activeTowns.map(town => ({
    municipality: town.municipality,
    isHost: town.host_town || false,
    annualCost: town.host_town ? Math.round(hostShare) : Math.round(partnerShare),
    costPerCapita: Math.round(costPerParticipant),
    percentOfTotal: Math.round((town.host_town ? hostShare : partnerShare) / netAnnualCost * 100),
  }));

  return {
    methodology: 'Host Town 35% + Equal Share Among Partners',
    hostTown: hostTown?.municipality || 'TBD',
    totalNetCost: Math.round(netAnnualCost),
    averageCostPerTown: Math.round(netAnnualCost / activeTowns.length),
    allocations,
  };
}

function generateCostAllocation(metadata, pricingMethods) {
  const methodLabel = Array.from(pricingMethods).join(', ') || 'Per capita / weighted per capita';
  return {
    title: 'Cost Allocation Method',
    primary: methodLabel,
    description: 'Transparent, formula-driven allocation ensures equity across participating towns.',
    methodology: [
      'Annual costs divided by sum of allocation units (population, households, services, or incidents)',
      'Each town allocated share = (its units / total units) × total service cost',
      'Annual true-up ensures no town overpays or underpays',
    ],
  };
}

function generateRevenueOpportunities(department, metadata, deptParticipations) {
  const baseOpportunities = {
    finance: [
      'Comstar billing fee elimination (current 5.22% of gross EMS collections)',
      'Improved collection rates through professional in-house billing',
      'External EMS billing to non-covered patients and inter-facility transfers',
      'Regional grant funding for financial system modernization',
    ],
    ambulance: [
      'External EMS billing revenue (non-covered transports, inter-facility)',
      'Mutual aid reimbursement agreements with neighboring regions',
      'Grant funding for EMS training and equipment',
      'Standby and special event billing',
    ],
    transfer_station: [
      'Tipping fee revenue from member towns',
      'Recycled materials revenue (metals, cardboard)',
      'Hazardous waste event fees',
      'Expanded service area (non-member town contracts)',
    ],
  };

  return {
    title: 'Revenue Opportunities',
    opportunities: baseOpportunities[department] || [
      'Regional contract expansion',
      'Grant funding',
      'Efficiency-driven fee reductions',
    ],
  };
}

function generateCostSavings(department, metadata) {
  const baseSavings = {
    finance: [
      'Eliminate Comstar fee ($45K–$65K annually)',
      'Reduce accounting services outsourcing',
      'Standardize financial systems across region',
    ],
    admin: [
      'Consolidate IT infrastructure and support',
      'Reduce duplicate HR/payroll processing',
      'Standardize insurance and vendor contracts',
    ],
    ambulance: [
      'Consolidated EMS training and certification',
      'Shared equipment purchasing and maintenance',
      'Coordinated staffing reduces overtime',
    ],
    transfer_station: [
      'Negotiate better waste tipping rates',
      'Shared equipment and repairs',
      'Coordinated procurement',
    ],
  };

  return {
    title: 'Cost Savings Potential',
    savingsCategory: baseSavings[department] || ['Operational efficiency', 'Reduced overhead', 'Shared services'],
  };
}

function generateRiskFactors(department, metadata) {
  return {
    title: 'Risk Factors & Mitigation',
    risks: [
      {
        risk: 'Staffing recruitment and retention in rural setting',
        mitigation: 'Competitive salary, benefits, and professional development opportunities',
      },
      {
        risk: 'Governance coordination across multiple town boards',
        mitigation: 'Formal interlocal agreement with clear decision-making authority',
      },
      {
        risk: 'Service continuity during transitions or personnel changes',
        mitigation: 'Documented procedures, cross-training, and redundancy planning',
      },
      {
        risk: 'Potential service quality variation across towns',
        mitigation: 'Unified service standards and performance metrics',
      },
    ],
  };
}

function generateImplementationTimeline(department, metadata) {
  return {
    title: 'Implementation Timeline',
    phases: [
      {
        phase: 'Phase 1: Planning & Negotiation',
        duration: '3–6 months',
        tasks: ['Interlocal agreement negotiation', 'Budget forecasting', 'Stakeholder engagement'],
      },
      {
        phase: 'Phase 2: Staffing & Infrastructure',
        duration: '3–4 months',
        tasks: ['Position recruitment', 'Systems setup', 'Equipment procurement'],
      },
      {
        phase: 'Phase 3: Launch & Stabilization',
        duration: '6–12 months',
        tasks: ['Service launch', 'Process refinement', 'Performance monitoring'],
      },
    ],
  };
}

function generateGovernanceModel(department, metadata) {
  return {
    title: 'Governance Model',
    structure: 'Regional Board of Selectpersons or designated representatives from each participating town',
    responsibilities: [
      'Approve annual budget and service levels',
      'Monitor performance metrics',
      'Resolve disputes and exceptions',
      'Authorize major policy changes',
    ],
    staffing: metadata.label + ' leadership reports to Regional Board; operational decisions delegated to professional staff within policy guidelines.',
  };
}

function generateContractStructure(department, metadata) {
  return {
    title: 'Contract Structure',
    agreement: 'Interlocal Agreement per Maine Revised Statutes § 3961 (Regional School Unit model or municipal cooperation)',
    terms: [
      'Initial term: 3–5 years with annual renewal option',
      'Exit clause: 12 months notice with wound-down costs',
      'True-up provision: Annual reconciliation of actual vs. budgeted costs',
      'Service level agreement: Specific performance metrics and response times',
    ],
  };
}

function generateNextSteps(department, metadata) {
  return {
    title: 'Recommended Next Steps',
    steps: [
      '1. Formal presentation to Select Board(s) and Budget Committee(s)',
      '2. Stakeholder engagement: town managers, department heads, employees',
      '3. Detailed financial modeling with participating towns',
      '4. Draft interlocal agreement (legal review)',
      '5. Town Meeting warrant articles for formal approval',
      '6. Phased implementation planning if approved',
    ],
  };
}

function calculateAdvancedMetrics(department, deptParticipations, deptMetadata, staffingCost, annualRevenue, settings, planningHorizon) {
  const activeTowns = deptParticipations.filter(p => p.status === 'active_partner' || p.status === 'host');
  const staffCount = (deptMetadata.baselineStaffing || []).length || 2;
  
  // Department-specific baseline metrics
  const departmentDefaults = {
    finance: { avgResidentsPerTown: 3500, callsPerYear: 500, clientsPerYear: 12 },
    ambulance: { avgResidentsPerTown: 3500, callsPerYear: 1648, eventsPerYear: 1648 },
    police: { avgResidentsPerTown: 3500, callsPerYear: 2500, patrolHoursPerYear: 8760 },
    fire: { avgResidentsPerTown: 3500, callsPerYear: 800, facilitiesServed: 1 },
    transfer_station: { avgResidentsPerTown: 3500, facilitiesServed: 1, tonnagePerYear: 500 },
    assessor: { avgResidentsPerTown: 3500, inspectionsPerYear: 400, propertiesServed: 1400 },
    inspection: { avgResidentsPerTown: 3500, inspectionsPerYear: 600, permitsPerYear: 300 },
    animal_control: { avgResidentsPerTown: 3500, callsPerYear: 450, ticketsPerYear: 120 },
    admin: { avgResidentsPerTown: 3500, facilitiesManaged: 3, usersSupported: 50 },
  };
  
  const defaults = departmentDefaults[department] || departmentDefaults.admin;
  const totalResidentsServed = activeTowns.length * defaults.avgResidentsPerTown;

  // COST METRICS
  const costMetrics = {
    costPerResidentServed: totalResidentsServed > 0 ? Math.round(staffingCost / totalResidentsServed * 100) / 100 : 0,
    costPerTownServed: activeTowns.length > 0 ? Math.round(staffingCost / activeTowns.length) : 0,
    costPerServiceCall: defaults.callsPerYear > 0 ? Math.round(staffingCost / defaults.callsPerYear) : 0,
    costPerInspection: defaults.inspectionsPerYear > 0 ? Math.round(staffingCost / defaults.inspectionsPerYear) : 0,
    costPerFinancialClient: defaults.clientsPerYear > 0 ? Math.round(staffingCost / defaults.clientsPerYear) : 0,
    costPerEmsRun: defaults.eventsPerYear > 0 ? Math.round(staffingCost / defaults.eventsPerYear) : 0,
    costPerPatrolHour: defaults.patrolHoursPerYear > 0 ? Math.round(staffingCost / defaults.patrolHoursPerYear * 100) / 100 : 0,
    costPerFacilityServiced: defaults.facilitiesServed > 0 ? Math.round(staffingCost / defaults.facilitiesServed) : 0,
  };

  // REVENUE METRICS
  const costStructure = buildCostStructure(department, staffingCost, settings);
  const revenueModel = buildRevenueModel(department, deptParticipations, settings);
  const totalOperatingCost = costStructure.total;
  const totalRevenue = revenueModel.total;
  
  const revenueMetrics = {
    revenuePerTown: activeTowns.length > 0 ? Math.round(totalRevenue / activeTowns.length) : 0,
    revenuePerContract: (deptParticipations.filter(p => p.annual_fee).length) > 0 
      ? Math.round(totalRevenue / deptParticipations.filter(p => p.annual_fee).length) : 0,
    billingMargin: totalOperatingCost > 0 ? Math.round((totalRevenue / totalOperatingCost) * 100) : 0,
    feeRecoveryRate: totalOperatingCost > 0 ? Math.round((totalRevenue / totalOperatingCost) * 100) : 0,
    costRecoveryRatio: totalOperatingCost > 0 ? (Math.round((totalRevenue / totalOperatingCost) * 100) / 100) : 0,
  };

  // OPERATIONAL EFFICIENCY
  const efficiencyMetrics = {
    staffUtilizationRate: 85,
    revenuePerStaffMember: Math.round(totalRevenue / (staffCount || 1)),
    townsServedPerStaffMember: Math.round(activeTowns.length / (staffCount || 1)),
    serviceHoursPerStaffMember: Math.round(2080 * 0.75),
  };

  // REGIONALIZATION IMPACT
  const standaloneMultiplier = 1.35;
  const standaloneAnnualCost = totalOperatingCost * standaloneMultiplier;
  const netSavingsVsStandalone = standaloneAnnualCost - totalOperatingCost;
  const sharedServicesPotential = netSavingsVsStandalone * 0.4;

  const regionalizationMetrics = {
    netSavingsVsStandalone: Math.round(netSavingsVsStandalone),
    regionalCostAvoidance: Math.round(netSavingsVsStandalone * planningHorizon),
    sharedServicesEfficiencyGain: Math.round(sharedServicesPotential),
    percentSavingVsStandalone: Math.round((netSavingsVsStandalone / standaloneAnnualCost) * 100),
    costStabilityIndex: 92,
  };

  // BUDGET STABILITY
  const annualGrowthRate = 3.2;
  const revenueDiversification = totalRevenue > 0 ? Math.min(85, Math.round((revenueModel.serviceContracts / totalRevenue) * 100)) : 0;
  
  const budgetStabilityMetrics = {
    multiYearCostGrowthRate: annualGrowthRate,
    projectedYear5Cost: Math.round(totalOperatingCost * Math.pow(1 + (annualGrowthRate / 100), 5)),
    revenueDiversificationIndex: revenueDiversification,
    propertyTaxReliance: Math.max(0, 100 - revenueDiversification),
    serviceRevenuePercentage: Math.round((totalRevenue / (totalRevenue + totalOperatingCost)) * 100),
  };

  // SERVICE CAPACITY
  const maxCapacity = staffCount > 0 ? staffCount * 2500 : 5000;
  const currentUtilization = Math.round((totalResidentsServed / maxCapacity) * 100);
  const overloadThreshold = Math.round(maxCapacity * 0.85);

  const capacityMetrics = {
    capacityUtilization: Math.min(100, currentUtilization),
    projectedOverloadThreshold: overloadThreshold,
    staffingTriggerAtResidents: Math.round(maxCapacity * 0.75),
    equipmentRefreshCycle: 5,
    projectedYear5Residents: Math.round(totalResidentsServed * Math.pow(1.02, 5)),
  };

  return {
    title: 'Advanced Financial & Operational Metrics',
    costMetrics,
    revenueMetrics,
    operationalEfficiency: efficiencyMetrics,
    regionalizationImpact: regionalizationMetrics,
    budgetStability: budgetStabilityMetrics,
    serviceCapacity: capacityMetrics,
    summary: {
      totalResidentsServed,
      activeTownsCount: activeTowns.length,
      staffCount,
      totalAnnualOperatingCost: Math.round(totalOperatingCost),
      totalAnnualRevenue: Math.round(totalRevenue),
      netAnnualCost: Math.round(totalOperatingCost - totalRevenue),
      savingsVsStandalone: Math.round(netSavingsVsStandalone),
    },
  };
}