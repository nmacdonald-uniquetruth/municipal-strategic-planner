/**
 * Scenario-Proposal Integration
 * 
 * Handles bidirectional relationships between scenarios and proposals:
 * - Scenarios contain proposals
 * - Proposals reference scenario assumptions
 * - Scenario comparisons aggregate proposal data
 * - Proposal changes update scenario financial projections
 */

import {
  createUnifiedProposal,
  calculateFinancialImpact,
  calculateTaxImpact,
  generateImplementationRoadmap,
  generateBoardSummary,
  buildScenarioProposals,
  compareProposals
} from './unifiedProposalModel';

/**
 * Load all proposals for a scenario
 */
export const loadScenarioProposals = async (base44, scenario_id) => {
  try {
    // Get scenario
    const scenario = await base44.entities.Scenario.filter({ id: scenario_id });
    if (!scenario || scenario.length === 0) return null;

    // Get proposals linked to this scenario
    const proposals = await base44.entities.RestructuringProposal.filter({
      // Note: depends on scenarios_id field being added to RestructuringProposal
    });

    // Get evaluations
    const evaluations = await base44.entities.ProposalEvaluation.list();
    const evaluationMap = {};
    evaluations.forEach(e => {
      evaluationMap[e.proposal_id] = e;
    });

    // Build unified proposal objects
    const unifiedProposals = proposals.map(p => {
      const unified = createUnifiedProposal({
        id: p.id,
        title: p.title,
        description: p.description,
        category: p.category,
        priority: p.priority,
        status: p.status,
        scenario_id: scenario_id,
        departments: p.departments || [],
        services: p.serviceTypes || [],
        towns: p.towns || [],
        fiscal_year: p.fiscalYear || '',
        financialImpact: {
          annualSavings: p.estimatedAnnualSavings || 0,
          annualRevenue: p.estimatedAnnualRevenue || 0,
          implementationCost: p.implementationCost || 0,
          assumptions: []
        },
        risks: (p.risks || []).map(r => ({
          risk: r,
          probability: 'medium',
          impact: 'medium'
        })),
        relatedProposals: p.relatedProposals || [],
        notes: p.notes || ''
      });

      // Attach evaluation if it exists
      const evaluation = evaluationMap[p.id];
      if (evaluation) {
        unified.evaluation_id = evaluation.id;
      }

      // Generate derived data
      unified.implementationRoadmap = generateImplementationRoadmap(unified);
      unified.boardSummary = generateBoardSummary(unified, evaluation);

      return unified;
    });

    return {
      scenario: scenario[0],
      proposals: unifiedProposals,
      evaluations: evaluationMap
    };
  } catch (error) {
    console.error('Failed to load scenario proposals:', error);
    return null;
  }
};

/**
 * Create proposal for scenario
 */
export const createProposalForScenario = async (
  base44,
  scenario_id,
  proposalData
) => {
  try {
    // Create RestructuringProposal
    const created = await base44.entities.RestructuringProposal.create({
      ...proposalData,
      scenario_id // Store reference if schema supports it
    });

    // Return as unified proposal
    return createUnifiedProposal({
      id: created.id,
      ...proposalData,
      scenario_id
    });
  } catch (error) {
    console.error('Failed to create proposal:', error);
    throw error;
  }
};

/**
 * Update proposal and sync scenario
 */
export const updateProposalAndScenario = async (
  base44,
  proposal_id,
  scenario_id,
  updateData
) => {
  try {
    // Update proposal
    await base44.entities.RestructuringProposal.update(proposal_id, updateData);

    // Reload scenario data to get updated aggregates
    return loadScenarioProposals(base44, scenario_id);
  } catch (error) {
    console.error('Failed to update proposal:', error);
    throw error;
  }
};

/**
 * Compare scenarios based on proposals
 */
export const compareScenarios = async (base44, scenario_ids) => {
  try {
    const scenarioData = await Promise.all(
      scenario_ids.map(id => loadScenarioProposals(base44, id))
    );

    return scenarioData.map(data => {
      if (!data) return null;

      const { scenario, proposals, evaluations } = data;

      // Aggregate financial impact
      const totalAnnualBenefit = proposals.reduce((sum, p) => {
        const financial = calculateFinancialImpact(p);
        return sum + (financial.totalAnnualBenefit || 0);
      }, 0);

      const totalImplementationCost = proposals.reduce((sum, p) => {
        return sum + (p.financialImpact?.implementationCost || 0);
      }, 0);

      // Aggregate tax impact
      const totalTaxImpact = proposals.reduce((sum, p) => {
        const tax = calculateTaxImpact(p);
        return sum + (tax.taxLevyChange || 0);
      }, 0);

      // Aggregate staffing impact
      const totalFTEChange = proposals.reduce((sum, p) => {
        return sum + (p.staffingImpact?.fteChange || 0);
      }, 0);

      // Count risks
      const totalRisks = proposals.reduce((sum, p) => {
        return sum + (p.risks?.length || 0);
      }, 0);

      // Calculate average evaluation score
      const evaluationScores = proposals
        .map(p => evaluations[p.id]?.overall_score)
        .filter(s => s !== undefined);
      const avgEvaluationScore = evaluationScores.length > 0
        ? evaluationScores.reduce((a, b) => a + b, 0) / evaluationScores.length
        : null;

      return {
        scenario_id: scenario.id,
        scenario_name: scenario.name,
        scenario_type: scenario.type,
        proposal_count: proposals.length,
        total_annual_benefit: totalAnnualBenefit,
        total_implementation_cost: totalImplementationCost,
        payback_period: totalImplementationCost > 0 && totalAnnualBenefit > 0
          ? totalImplementationCost / totalAnnualBenefit
          : 0,
        five_year_net: totalAnnualBenefit * 5 - totalImplementationCost,
        total_tax_impact: totalTaxImpact,
        total_fte_change: totalFTEChange,
        total_risks: totalRisks,
        avg_evaluation_score: avgEvaluationScore,
        proposals: compareProposals(proposals, evaluations)
      };
    }).filter(s => s !== null);
  } catch (error) {
    console.error('Failed to compare scenarios:', error);
    throw error;
  }
};

/**
 * Generate scenario summary with all proposals
 */
export const generateScenarioSummary = (scenarioData) => {
  const { scenario, proposals, evaluations } = scenarioData;

  return {
    scenario_id: scenario.id,
    scenario_name: scenario.name,
    scenario_type: scenario.type,
    description: scenario.description,
    is_active: scenario.is_active,
    is_baseline: scenario.is_baseline,
    
    // Financial aggregate
    financial_aggregate: {
      total_annual_benefit: proposals.reduce((sum, p) => {
        const financial = calculateFinancialImpact(p);
        return sum + (financial.totalAnnualBenefit || 0);
      }, 0),
      total_implementation_cost: proposals.reduce((sum, p) => {
        return sum + (p.financialImpact?.implementationCost || 0);
      }, 0),
      total_five_year_net: proposals.reduce((sum, p) => {
        const financial = calculateFinancialImpact(p);
        return sum + (financial.fiveYearNet || 0);
      }, 0)
    },

    // Tax aggregate
    tax_aggregate: {
      total_mill_rate_impact: proposals.reduce((sum, p) => {
        const tax = calculateTaxImpact(p);
        return sum + (tax.millRateChange || 0);
      }, 0),
      total_levy_impact: proposals.reduce((sum, p) => {
        const tax = calculateTaxImpact(p);
        return sum + (tax.taxLevyChange || 0);
      }, 0)
    },

    // Staffing aggregate
    staffing_aggregate: {
      total_fte_change: proposals.reduce((sum, p) => {
        return sum + (p.staffingImpact?.fteChange || 0);
      }, 0),
      total_positions_added: proposals.reduce((arr, p) => {
        return [...arr, ...(p.staffingImpact?.positionsAdded || [])];
      }, []).length,
      total_positions_eliminated: proposals.reduce((arr, p) => {
        return [...arr, ...(p.staffingImpact?.positionsEliminated || [])];
      }, []).length
    },

    // Risk aggregate
    risk_summary: {
      total_risks: proposals.reduce((sum, p) => {
        return sum + (p.risks?.length || 0);
      }, 0),
      high_probability_risks: proposals.reduce((arr, p) => {
        return [...arr, ...(p.risks?.filter(r => r.probability === 'high') || [])];
      }, []).length,
      high_impact_risks: proposals.reduce((arr, p) => {
        return [...arr, ...(p.risks?.filter(r => r.impact === 'high') || [])];
      }, []).length
    },

    // Evaluation summary
    evaluation_summary: {
      evaluated_proposals: proposals.filter(p => p.evaluation_id).length,
      avg_score: proposals
        .map(p => evaluations[p.id]?.overall_score)
        .filter(s => s !== undefined)
        .reduce((a, b) => a + b, 0) / 
        proposals.filter(p => evaluations[p.id]?.overall_score).length || 0,
      recommended: proposals.filter(p => {
        const eval = evaluations[p.id];
        return eval?.recommendation === 'recommended' ||
               eval?.recommendation === 'recommended_with_conditions';
      }).length
    },

    // Proposal list
    proposals: proposals.map(p => ({
      id: p.id,
      title: p.title,
      category: p.category,
      priority: p.priority,
      status: p.status
    })),

    generated_date: new Date().toISOString()
  };
};

/**
 * Sync proposal changes across related entities
 */
export const syncProposalChanges = async (base44, proposal_id, changes) => {
  try {
    // Update proposal
    await base44.entities.RestructuringProposal.update(proposal_id, changes);

    // If evaluation exists, regenerate board summary
    const evaluations = await base44.entities.ProposalEvaluation.filter({
      proposal_id
    });

    if (evaluations.length > 0) {
      const evaluation = evaluations[0];
      // Evaluation data would be regenerated on next load
    }

    return true;
  } catch (error) {
    console.error('Failed to sync proposal changes:', error);
    throw error;
  }
};