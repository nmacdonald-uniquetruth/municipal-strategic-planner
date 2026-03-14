import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Sparkles, Loader } from 'lucide-react';

export default function RoadmapGenerator({ sourceType, sourceId, sourceTitle, department, onGenerated }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch source document for context
      let sourceData = null;
      if (sourceType === 'proposal') {
        const proposals = await base44.entities.Proposal.filter({ id: sourceId });
        sourceData = proposals[0];
      } else if (sourceType === 'scenario') {
        const scenarios = await base44.entities.Scenario.filter({ id: sourceId });
        sourceData = scenarios[0];
      } else if (sourceType === 'restructuring') {
        const restructurings = await base44.entities.DepartmentRestructuring.filter({ id: sourceId });
        sourceData = restructurings[0];
      }

      // Build context for LLM
      const contextPrompt = `
Generate a detailed implementation roadmap for the following ${sourceType}:

Title: ${sourceTitle}
Department: ${department || 'Multi-department'}

Source Data:
${JSON.stringify(sourceData, null, 2)}

Create a structured roadmap with action items organized by phase (immediate, short_term, medium_term, long_term).

For each action item, include:
- Clear, actionable title
- Description of what needs to be done
- Owner/responsible role
- Start and end dates (estimate based on context)
- Dependencies on other action items
- Cost estimate
- Whether policy action is needed
- Whether stakeholder communication is needed

Return as JSON array of action items with this structure:
{
  "action_items": [
    {
      "id": "unique_id",
      "title": "Action title",
      "description": "What needs to be done",
      "phase": "immediate|short_term|medium_term|long_term",
      "owner": "Role or person",
      "start_date": "YYYY-MM-DD",
      "end_date": "YYYY-MM-DD",
      "dependencies": [],
      "cost_estimate": 0,
      "policy_action_needed": false,
      "policy_description": "What policy action",
      "communication_need": false,
      "communication_audience": "Who to communicate with",
      "status": "not_started"
    }
  ],
  "total_cost_estimate": 0
}

Make the roadmap practical, detailed, and leadership-ready.
      `;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: contextPrompt,
        response_json_schema: {
          type: 'object',
          properties: {
            action_items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  title: { type: 'string' },
                  description: { type: 'string' },
                  phase: { type: 'string' },
                  owner: { type: 'string' },
                  start_date: { type: 'string' },
                  end_date: { type: 'string' },
                  dependencies: { type: 'array', items: { type: 'string' } },
                  cost_estimate: { type: 'number' },
                  policy_action_needed: { type: 'boolean' },
                  policy_description: { type: 'string' },
                  communication_need: { type: 'boolean' },
                  communication_audience: { type: 'string' },
                  status: { type: 'string' },
                },
              },
            },
            total_cost_estimate: { type: 'number' },
          },
        },
      });

      const generatedData = response.data;

      // Compute metadata
      const actionItems = generatedData.action_items || [];
      const policyCount = actionItems.filter((item) => item.policy_action_needed).length;
      const commCount = actionItems.filter((item) => item.communication_need).length;

      const dates = actionItems.flatMap((item) => [item.start_date, item.end_date]).filter(Boolean);
      const startDate = dates.length > 0 ? new Date(Math.min(...dates.map((d) => new Date(d)))) : new Date();
      const endDate = dates.length > 0 ? new Date(Math.max(...dates.map((d) => new Date(d)))) : new Date();

      // Create roadmap record
      const roadmap = {
        title: `Implementation Roadmap: ${sourceTitle}`,
        source_type: sourceType,
        source_id: sourceId,
        source_title: sourceTitle,
        department: department,
        action_items: actionItems,
        total_cost_estimate: generatedData.total_cost_estimate || 0,
        policy_items_count: policyCount,
        communication_items_count: commCount,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        status: 'planning',
        priority: 'high',
      };

      const created = await base44.entities.ImplementationRoadmap.create(roadmap);
      onGenerated(created);
    } catch (err) {
      console.error('Error generating roadmap:', err);
      setError(err.message || 'Failed to generate roadmap');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="text-sm font-bold text-blue-900 mb-1">Generate Implementation Roadmap</h4>
          <p className="text-xs text-blue-800">
            Create a detailed action plan with phases, owners, dependencies, and costs
          </p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 bg-blue-900 text-white text-xs font-bold rounded-lg hover:bg-blue-800 disabled:opacity-50 transition-colors"
        >
          {loading ? <Loader className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
          {loading ? 'Generating...' : 'Generate'}
        </button>
      </div>
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
    </div>
  );
}