import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { AlertCircle, Plus, Trash2 } from 'lucide-react';

const CRITERIA = [
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

const CRITERION_LABELS = {
  financial_impact: 'Financial Impact',
  tax_impact: 'Tax Impact',
  service_impact: 'Service Quality Impact',
  operational_feasibility: 'Operational Feasibility',
  staffing_impact: 'Staffing Impact',
  implementation_complexity: 'Implementation Complexity',
  political_community_feasibility: 'Political/Community Feasibility',
  regional_collaboration_potential: 'Regional Collaboration Potential',
  long_term_sustainability: 'Long-term Sustainability',
  risk_level: 'Risk Level',
};

export default function ProposalEvaluationForm({ evaluation, onSave, proposalType = 'departmental' }) {
  const [data, setData] = useState(evaluation || { proposal_type: proposalType });
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load default scoring config
    base44.entities.ProposalScoringConfig.filter({ is_default: true }).then(records => {
      if (records?.length > 0) {
        setConfig(records[0]);
        if (!evaluation) {
          setData(prev => ({
            ...prev,
            scoring_weights: records[0].weights,
          }));
        }
      }
      setLoading(false);
    });
  }, [evaluation]);

  const handleScoreChange = (criterion, score) => {
    setData(prev => ({
      ...prev,
      [criterion]: {
        ...(prev[criterion] || {}),
        score: Math.min(10, Math.max(0, Number(score))),
      },
    }));
  };

  const handleRationaleChange = (criterion, rationale) => {
    setData(prev => ({
      ...prev,
      [criterion]: {
        ...(prev[criterion] || {}),
        rationale,
      },
    }));
  };

  const handleWeightChange = (criterion, weight) => {
    setData(prev => ({
      ...prev,
      scoring_weights: {
        ...(prev.scoring_weights || {}),
        [`${criterion}_weight`]: Number(weight),
      },
    }));
  };

  const calculateOverallScore = () => {
    const weights = data.scoring_weights || {};
    let totalScore = 0;
    let totalWeight = 0;

    CRITERIA.forEach(criterion => {
      const score = data[criterion]?.score || 0;
      const weight = weights[`${criterion}_weight`] || 0;
      // For implementation_complexity and risk_level, invert the score (lower is better)
      const adjustedScore = (criterion === 'implementation_complexity' || criterion === 'risk_level') 
        ? (10 - score) 
        : score;
      totalScore += adjustedScore * weight;
      totalWeight += weight;
    });

    return totalWeight > 0 ? totalScore / totalWeight : 0;
  };

  const getRatingColor = (score) => {
    if (score >= 8.5) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (score >= 7) return 'text-blue-700 bg-blue-50 border-blue-200';
    if (score >= 5) return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-red-700 bg-red-50 border-red-200';
  };

  const getRating = (score) => {
    if (score >= 8.5) return 'excellent';
    if (score >= 7) return 'good';
    if (score >= 5) return 'acceptable';
    if (score >= 2.5) return 'marginal';
    return 'poor';
  };

  const getRecommendation = (score) => {
    if (score >= 8) return 'recommended';
    if (score >= 6.5) return 'recommended_with_conditions';
    if (score >= 4.5) return 'further_study_needed';
    return 'not_recommended';
  };

  const overallScore = calculateOverallScore();

  if (loading) return <div className="text-xs text-slate-500">Loading configuration...</div>;

  return (
    <form className="space-y-6" onSubmit={(e) => {
      e.preventDefault();
      const updatedData = {
        ...data,
        overall_score: overallScore,
        overall_rating: getRating(overallScore),
        recommendation: getRecommendation(overallScore),
      };
      onSave(updatedData);
    }}>
      {/* Header */}
      <div className="space-y-3 border-b border-slate-200 pb-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Proposal Name</label>
            <input
              type="text"
              value={data.proposal_name || ''}
              onChange={(e) => setData({ ...data, proposal_name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              placeholder="Name of proposal"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Evaluated By</label>
            <input
              type="text"
              value={data.evaluated_by || ''}
              onChange={(e) => setData({ ...data, evaluated_by: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              placeholder="Evaluator name"
            />
          </div>
        </div>
      </div>

      {/* Scoring Sections */}
      <div className="space-y-4">
        {CRITERIA.map(criterion => (
          <div key={criterion} className="rounded-lg border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-900">
                {CRITERION_LABELS[criterion]}
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.5"
                  value={data[criterion]?.score || 0}
                  onChange={(e) => handleScoreChange(criterion, e.target.value)}
                  className="w-16 px-2 py-1 border border-slate-200 rounded text-sm font-semibold text-center"
                />
                <span className="text-xs text-slate-500">/10</span>
              </div>
            </div>

            <textarea
              value={data[criterion]?.rationale || ''}
              onChange={(e) => handleRationaleChange(criterion, e.target.value)}
              placeholder="Rationale for this score"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs h-16"
            />

            <div>
              <label className="text-xs font-semibold text-slate-600">Weight</label>
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                value={data.scoring_weights?.[`${criterion}_weight`] || 0}
                onChange={(e) => handleWeightChange(criterion, e.target.value)}
                className="w-20 px-2 py-1 border border-slate-200 rounded text-xs"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Overall Score */}
      <div className={`rounded-lg border ${getRatingColor(overallScore)} p-4`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold">Overall Score</h3>
          <div className="text-2xl font-bold">{overallScore.toFixed(1)}/10</div>
        </div>
        <p className="text-xs font-semibold uppercase mb-2">{getRating(overallScore)}</p>
        <p className="text-xs font-semibold uppercase">{getRecommendation(overallScore).replace(/_/g, ' ')}</p>
      </div>

      {/* Risk Assessment */}
      <div className="rounded-lg border border-slate-200 p-4 space-y-3">
        <h3 className="text-sm font-bold text-slate-900">Risk Assessment</h3>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">Overall Risk Level</label>
          <select
            value={data.risk_level?.overall_risk || 'moderate'}
            onChange={(e) => setData({
              ...data,
              risk_level: { ...(data.risk_level || {}), overall_risk: e.target.value }
            })}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
          >
            <option value="low">Low</option>
            <option value="moderate">Moderate</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">Key Risks</label>
          <div className="space-y-2">
            {(data.risk_level?.key_risks || []).map((risk, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  value={risk.risk}
                  onChange={(e) => {
                    const updated = [...(data.risk_level?.key_risks || [])];
                    updated[i] = { ...updated[i], risk: e.target.value };
                    setData({
                      ...data,
                      risk_level: { ...data.risk_level, key_risks: updated }
                    });
                  }}
                  className="flex-1 px-2 py-1 border border-slate-200 rounded text-xs"
                  placeholder="Risk description"
                />
                <button
                  type="button"
                  onClick={() => {
                    const updated = (data.risk_level?.key_risks || []).filter((_, idx) => idx !== i);
                    setData({
                      ...data,
                      risk_level: { ...data.risk_level, key_risks: updated }
                    });
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                const updated = [...(data.risk_level?.key_risks || []), { risk: '', probability: 'medium', impact: 'medium', mitigation: '' }];
                setData({
                  ...data,
                  risk_level: { ...data.risk_level, key_risks: updated }
                });
              }}
              className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1"
            >
              <Plus className="h-3 w-3" /> Add Risk
            </button>
          </div>
        </div>
      </div>

      {/* Mitigation Actions */}
      <div className="rounded-lg border border-slate-200 p-4 space-y-3">
        <h3 className="text-sm font-bold text-slate-900">Mitigation Actions</h3>
        <div className="space-y-2">
          {(data.mitigation_actions || []).map((action, i) => (
            <div key={i} className="p-3 border border-slate-200 rounded-lg space-y-2 text-xs">
              <input
                type="text"
                value={action.action || ''}
                onChange={(e) => {
                  const updated = [...(data.mitigation_actions || [])];
                  updated[i] = { ...updated[i], action: e.target.value };
                  setData({ ...data, mitigation_actions: updated });
                }}
                className="w-full px-2 py-1 border border-slate-200 rounded"
                placeholder="Mitigation action"
              />
              <button
                type="button"
                onClick={() => {
                  const updated = (data.mitigation_actions || []).filter((_, idx) => idx !== i);
                  setData({ ...data, mitigation_actions: updated });
                }}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => {
              const updated = [...(data.mitigation_actions || []), { action: '', target_risk: '', responsible_party: '', timeline: '' }];
              setData({ ...data, mitigation_actions: updated });
            }}
            className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1"
          >
            <Plus className="h-3 w-3" /> Add Action
          </button>
        </div>
      </div>

      {/* Comments and Metadata */}
      <div className="rounded-lg border border-slate-200 p-4 space-y-3">
        <h3 className="text-sm font-bold text-slate-900">Additional Information</h3>
        
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Evaluator Comments</label>
          <textarea
            value={data.evaluator_comments || ''}
            onChange={(e) => setData({ ...data, evaluator_comments: e.target.value })}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs h-20"
            placeholder="Additional commentary and observations"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Key Assumptions</label>
          <textarea
            value={(data.assumptions || []).join('\n')}
            onChange={(e) => setData({ ...data, assumptions: e.target.value.split('\n').filter(Boolean) })}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs h-16"
            placeholder="One assumption per line"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Critical Dependencies</label>
          <textarea
            value={(data.dependencies || []).join('\n')}
            onChange={(e) => setData({ ...data, dependencies: e.target.value.split('\n').filter(Boolean) })}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs h-16"
            placeholder="One dependency per line"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Recommendation Summary</label>
          <textarea
            value={data.recommendation_summary || ''}
            onChange={(e) => setData({ ...data, recommendation_summary: e.target.value })}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs h-16"
            placeholder="Executive summary of recommendation"
          />
        </div>
      </div>

      <div className="flex gap-2 pt-4 border-t border-slate-200">
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800"
        >
          Save Evaluation
        </button>
      </div>
    </form>
  );
}