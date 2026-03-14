import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

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

const getRatingColor = (rating) => {
  switch(rating) {
    case 'excellent': return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    case 'good': return 'text-blue-700 bg-blue-50 border-blue-200';
    case 'acceptable': return 'text-amber-700 bg-amber-50 border-amber-200';
    case 'marginal': return 'text-orange-700 bg-orange-50 border-orange-200';
    case 'poor': return 'text-red-700 bg-red-50 border-red-200';
    default: return 'text-slate-700 bg-slate-50 border-slate-200';
  }
};

const getRecommendationIcon = (recommendation) => {
  switch(recommendation) {
    case 'recommended': return <CheckCircle2 className="h-4 w-4" />;
    case 'recommended_with_conditions': return <Info className="h-4 w-4" />;
    case 'further_study_needed': return <AlertTriangle className="h-4 w-4" />;
    case 'not_recommended': return <AlertCircle className="h-4 w-4" />;
    default: return null;
  }
};

const getRecommendationColor = (recommendation) => {
  switch(recommendation) {
    case 'recommended': return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    case 'recommended_with_conditions': return 'text-blue-700 bg-blue-50 border-blue-200';
    case 'further_study_needed': return 'text-amber-700 bg-amber-50 border-amber-200';
    case 'not_recommended': return 'text-red-700 bg-red-50 border-red-200';
    default: return 'text-slate-700 bg-slate-50 border-slate-200';
  }
};

export default function ProposalEvaluationDisplay({ evaluation }) {
  if (!evaluation) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center">
        <p className="text-sm text-slate-600">No evaluation data available</p>
      </div>
    );
  }

  const criteriaScores = Object.keys(CRITERION_LABELS).map(criterion => ({
    key: criterion,
    label: CRITERION_LABELS[criterion],
    score: evaluation[criterion]?.score,
    rationale: evaluation[criterion]?.rationale,
  })).filter(c => c.score !== undefined);

  return (
    <div className="space-y-6">
      {/* Header with Overall Score */}
      <div className={`rounded-lg border ${getRatingColor(evaluation.overall_rating)} p-6`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold mb-1">{evaluation.proposal_name}</h3>
            <p className="text-sm opacity-75">Evaluated by {evaluation.evaluated_by}</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{evaluation.overall_score?.toFixed(1)}/10</div>
            <p className="text-xs font-semibold uppercase mt-1">{evaluation.overall_rating}</p>
          </div>
        </div>
        <div className={`flex items-center gap-2 rounded px-3 py-2 ${getRecommendationColor(evaluation.recommendation)}`}>
          {getRecommendationIcon(evaluation.recommendation)}
          <span className="text-sm font-bold">{evaluation.recommendation.replace(/_/g, ' ').toUpperCase()}</span>
        </div>
      </div>

      {/* Recommendation Summary */}
      {evaluation.recommendation_summary && (
        <div className="rounded-lg border border-slate-200 p-4">
          <h4 className="text-sm font-bold text-slate-900 mb-2">Recommendation Summary</h4>
          <p className="text-sm text-slate-700">{evaluation.recommendation_summary}</p>
        </div>
      )}

      {/* Criterion Scores */}
      <div className="space-y-3">
        <h4 className="text-sm font-bold text-slate-900">Evaluation Criteria</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {criteriaScores.map(criterion => (
            <div key={criterion.key} className="rounded-lg border border-slate-200 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <h5 className="text-sm font-semibold text-slate-900">{criterion.label}</h5>
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center">
                    <span className="text-lg font-bold text-emerald-700">{criterion.score}</span>
                  </div>
                  <span className="text-xs text-slate-500">/10</span>
                </div>
              </div>
              {criterion.rationale && (
                <p className="text-xs text-slate-600">{criterion.rationale}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Risk Assessment */}
      {evaluation.risk_level && (
        <div className="rounded-lg border border-slate-200 p-4 space-y-3">
          <h4 className="text-sm font-bold text-slate-900">Risk Assessment</h4>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-slate-700">Overall Risk Level:</p>
            <span className={`text-xs font-bold px-3 py-1 rounded ${
              evaluation.risk_level.overall_risk === 'critical' ? 'bg-red-100 text-red-700' :
              evaluation.risk_level.overall_risk === 'high' ? 'bg-orange-100 text-orange-700' :
              evaluation.risk_level.overall_risk === 'moderate' ? 'bg-amber-100 text-amber-700' :
              'bg-emerald-100 text-emerald-700'
            }`}>
              {evaluation.risk_level.overall_risk?.toUpperCase()}
            </span>
          </div>
          {evaluation.risk_level.key_risks?.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-600">Key Risks:</p>
              {evaluation.risk_level.key_risks.map((risk, i) => (
                <div key={i} className="text-xs text-slate-700 p-2 bg-slate-50 rounded">
                  • {risk.risk}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Mitigation Actions */}
      {evaluation.mitigation_actions?.length > 0 && (
        <div className="rounded-lg border border-slate-200 p-4 space-y-3">
          <h4 className="text-sm font-bold text-slate-900">Mitigation Actions</h4>
          <div className="space-y-2">
            {evaluation.mitigation_actions.map((action, i) => (
              <div key={i} className="text-xs text-slate-700 p-2 bg-slate-50 rounded border-l-2 border-slate-400">
                <p className="font-semibold">{action.action}</p>
                {action.responsible_party && <p className="text-slate-500">Responsible: {action.responsible_party}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assumptions & Dependencies */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {evaluation.assumptions?.length > 0 && (
          <div className="rounded-lg border border-slate-200 p-4 space-y-2">
            <h4 className="text-sm font-bold text-slate-900">Key Assumptions</h4>
            <ul className="space-y-1">
              {evaluation.assumptions.map((assumption, i) => (
                <li key={i} className="text-xs text-slate-700">• {assumption}</li>
              ))}
            </ul>
          </div>
        )}

        {evaluation.dependencies?.length > 0 && (
          <div className="rounded-lg border border-slate-200 p-4 space-y-2">
            <h4 className="text-sm font-bold text-slate-900">Critical Dependencies</h4>
            <ul className="space-y-1">
              {evaluation.dependencies.map((dep, i) => (
                <li key={i} className="text-xs text-slate-700">• {dep}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Evaluator Comments */}
      {evaluation.evaluator_comments && (
        <div className="rounded-lg border border-slate-200 p-4">
          <h4 className="text-sm font-bold text-slate-900 mb-2">Evaluator Comments</h4>
          <p className="text-sm text-slate-700">{evaluation.evaluator_comments}</p>
        </div>
      )}
    </div>
  );
}