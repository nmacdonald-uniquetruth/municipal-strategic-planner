import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader, AlertCircle } from 'lucide-react';

export default function ProposalGenerator({ source, sourceType, onProposalGenerated }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [title, setTitle] = useState('');

  const generateProposal = async () => {
    if (!title.trim()) {
      setError('Please enter a proposal title');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Generate proposal content using LLM
      const prompt = buildPrompt(source, sourceType, title);

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            background: { type: 'string' },
            problem_statement: { type: 'string' },
            proposed_solution: { type: 'string' },
            service_implications: { type: 'string' },
            staffing_implications: {
              type: 'object',
              properties: {
                fte_change: { type: 'number' },
                positions_added: { type: 'array', items: { type: 'string' } },
                positions_eliminated: { type: 'array', items: { type: 'string' } },
                description: { type: 'string' },
              },
            },
            budget_impact: {
              type: 'object',
              properties: {
                annual_cost: { type: 'number' },
                annual_benefit: { type: 'number' },
                net_annual_impact: { type: 'number' },
                description: { type: 'string' },
              },
            },
            tax_impact: {
              type: 'object',
              properties: {
                mill_rate_change: { type: 'number' },
                description: { type: 'string' },
              },
            },
            implementation_steps: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  phase: { type: 'number' },
                  description: { type: 'string' },
                  timeline: { type: 'string' },
                  responsible_party: { type: 'string' },
                },
              },
            },
            risks_and_mitigation: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  risk: { type: 'string' },
                  probability: { type: 'string' },
                  impact: { type: 'string' },
                  mitigation: { type: 'string' },
                },
              },
            },
            regional_opportunities: {
              type: 'array',
              items: { type: 'string' },
            },
            recommendation: { type: 'string' },
            board_summary: { type: 'string' },
          },
        },
      });

      // Create proposal in database
      const proposalData = {
        title,
        proposal_type: sourceType === 'Scenario' ? 'scenario' : 'staffing_change',
        source_id: source?.id,
        source_type: sourceType,
        status: 'draft',
        departments_affected: source?.departments_affected || [],
        ...response,
      };

      const created = await base44.entities.Proposal.create(proposalData);

      if (onProposalGenerated) {
        onProposalGenerated(created);
      }
    } catch (err) {
      console.error('Error generating proposal:', err);
      setError(err.message || 'Failed to generate proposal');
    } finally {
      setLoading(false);
    }
  };

  const buildPrompt = (source, sourceType, title) => {
    let context = `You are a municipal government consultant writing professional proposals for town leadership and boards. Write a formal proposal with the following structure:\n\n`;

    if (sourceType === 'Scenario') {
      context += `Source: Strategic Planning Scenario - "${source?.name}"\n`;
      context += `Description: ${source?.description || 'N/A'}\n`;
      context += `Type: ${source?.type || 'custom'}\n`;

      if (source?.staffing_assumptions) {
        context += `Staffing: ${JSON.stringify(source.staffing_assumptions)}\n`;
      }
      if (source?.financial_assumptions) {
        context += `Financial: ${JSON.stringify(source.financial_assumptions)}\n`;
      }
      if (source?.operational_assumptions) {
        context += `Operational: ${JSON.stringify(source.operational_assumptions)}\n`;
      }
    } else {
      context += `Source: ${sourceType}\n`;
      context += `Details: ${JSON.stringify(source)}\n`;
    }

    context += `\nGenerate a comprehensive municipal proposal titled "${title}" that includes:
1. Background and context
2. Problem statement being addressed
3. Detailed proposed solution
4. Service implications and improvements
5. Staffing implications (positions, FTE changes)
6. Budget impact (annual costs, benefits, net impact)
7. Tax impact (mill rate, levy changes)
8. Implementation steps with phases and timeline
9. Risks and mitigation strategies
10. Regional collaboration opportunities
11. Final recommendation

Write in professional municipal government style, appropriate for presentation to a Select Board. Be specific with numbers and metrics where relevant. The tone should be informative but accessible to non-expert readers.`;

    return context;
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-slate-900 mb-2">Proposal Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Comprehensive Administrative Restructuring Proposal"
          className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm"
          disabled={loading}
        />
      </div>

      {error && (
        <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
          <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <button
        onClick={generateProposal}
        disabled={loading || !title.trim()}
        className="w-full px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 disabled:bg-slate-400 transition-colors flex items-center justify-center gap-2"
      >
        {loading && <Loader className="h-4 w-4 animate-spin" />}
        {loading ? 'Generating Proposal...' : 'Generate Proposal'}
      </button>
    </div>
  );
}