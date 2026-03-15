/**
 * useUnifiedProposalSystem Hook
 * 
 * Provides a unified interface to work with proposals, evaluations,
 * scenarios, tax impacts, and related calculations as a coherent system
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { loadSharedAssumptions } from './sharedAssumptions';
import {
  loadScenarioProposals,
  compareScenarios,
  generateScenarioSummary
} from './scenarioProposalIntegration';
import {
  calculateAllImpacts,
  compareProposalsForScenario,
  aggregateProposalImpacts
} from './calculationEngine';

/**
 * Main hook for unified proposal system
 */
export const useUnifiedProposalSystem = () => {
  const queryClient = useQueryClient();

  // Load shared assumptions
  const { data: sharedAssumptions, isLoading: loadingAssumptions } = useQuery({
    queryKey: ['sharedAssumptions'],
    queryFn: () => loadSharedAssumptions(base44),
    staleTime: 1000 * 60 * 5 // 5 minutes
  });

  // Load all scenarios
  const { data: scenarios = [], isLoading: loadingScenarios } = useQuery({
    queryKey: ['scenarios'],
    queryFn: () => base44.entities.Scenario.list()
  });

  // Load all proposals
  const { data: proposals = [], isLoading: loadingProposals } = useQuery({
    queryKey: ['restructuringProposals'],
    queryFn: () => base44.entities.RestructuringProposal.list()
  });

  // Load all evaluations
  const { data: evaluations = [], isLoading: loadingEvaluations } = useQuery({
    queryKey: ['proposalEvaluations'],
    queryFn: () => base44.entities.ProposalEvaluation.list()
  });

  // Mutations
  const createProposalMutation = useMutation({
    mutationFn: (data) => base44.entities.RestructuringProposal.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restructuringProposals'] });
    }
  });

  const updateProposalMutation = useMutation({
    mutationFn: ({ id, data }) =>
      base44.entities.RestructuringProposal.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restructuringProposals'] });
    }
  });

  const deleteProposalMutation = useMutation({
    mutationFn: (id) => base44.entities.RestructuringProposal.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restructuringProposals'] });
    }
  });

  const createEvaluationMutation = useMutation({
    mutationFn: (data) => base44.entities.ProposalEvaluation.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposalEvaluations'] });
    }
  });

  const updateEvaluationMutation = useMutation({
    mutationFn: ({ id, data }) =>
      base44.entities.ProposalEvaluation.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposalEvaluations'] });
    }
  });

  // Derived data methods
  const getProposalsForScenario = (scenarioId) => {
    return proposals.filter(p => p.scenario_id === scenarioId);
  };

  const getEvaluationForProposal = (proposalId) => {
    return evaluations.find(e => e.proposal_id === proposalId);
  };

  const getImpactsForProposal = (proposalId) => {
    const proposal = proposals.find(p => p.id === proposalId);
    if (!proposal || !sharedAssumptions) return null;
    return calculateAllImpacts(proposal, sharedAssumptions);
  };

  const getScenarioSummary = (scenarioId) => {
    const scenario = scenarios.find(s => s.id === scenarioId);
    const scenarioProposals = getProposalsForScenario(scenarioId);
    
    if (!scenario || !sharedAssumptions) return null;

    const compared = compareProposalsForScenario(
      scenarioProposals,
      sharedAssumptions
    );

    const aggregate = aggregateProposalImpacts(
      scenarioProposals,
      sharedAssumptions
    );

    return {
      scenario,
      proposals: scenarioProposals,
      evaluations: evaluations.filter(e =>
        scenarioProposals.some(p => p.id === e.proposal_id)
      ),
      impacts: aggregate,
      summary: generateScenarioSummary({
        scenario,
        proposals: scenarioProposals,
        evaluations
      })
    };
  };

  const compareMultipleScenarios = async (scenarioIds) => {
    try {
      return await compareScenarios(base44, scenarioIds);
    } catch (error) {
      console.error('Error comparing scenarios:', error);
      return [];
    }
  };

  return {
    // Data
    scenarios,
    proposals,
    evaluations,
    sharedAssumptions,

    // Loading states
    isLoading: loadingAssumptions ||
               loadingScenarios ||
               loadingProposals ||
               loadingEvaluations,

    // Mutations
    createProposal: createProposalMutation.mutate,
    updateProposal: updateProposalMutation.mutate,
    deleteProposal: deleteProposalMutation.mutate,
    createEvaluation: createEvaluationMutation.mutate,
    updateEvaluation: updateEvaluationMutation.mutate,

    // Derived data
    getProposalsForScenario,
    getEvaluationForProposal,
    getImpactsForProposal,
    getScenarioSummary,
    compareMultipleScenarios
  };
};

/**
 * Hook for single proposal with all related data
 */
export const useProposalWithImpacts = (proposalId) => {
  const {
    proposals,
    evaluations,
    sharedAssumptions,
    getImpactsForProposal,
    getEvaluationForProposal
  } = useUnifiedProposalSystem();

  const proposal = proposals.find(p => p.id === proposalId);
  const evaluation = getEvaluationForProposal(proposalId);
  const impacts = getImpactsForProposal(proposalId);

  return {
    proposal,
    evaluation,
    impacts,
    isLoading: !proposal || !sharedAssumptions
  };
};

/**
 * Hook for scenario with all proposals and impacts
 */
export const useScenarioWithProposals = (scenarioId) => {
  const { scenarios, isLoading, getScenarioSummary } = useUnifiedProposalSystem();

  const scenarioData = getScenarioSummary(scenarioId);

  return {
    scenario: scenarioData?.scenario,
    proposals: scenarioData?.proposals,
    evaluations: scenarioData?.evaluations,
    impacts: scenarioData?.impacts,
    summary: scenarioData?.summary,
    isLoading
  };
};