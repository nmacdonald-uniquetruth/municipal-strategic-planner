import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, Edit2 } from 'lucide-react';

export default function ProposalEvaluationSummary({ evaluation, onEdit, compact = false }) {
  if (!evaluation) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
        <p className="text-xs text-slate-600">Not evaluated</p>
      </div>
    );
  }

  const getRecommendationConfig = (recommendation) => {
    switch(recommendation) {
      case 'recommended':
        return { icon: CheckCircle2, color: 'text-emerald-700 bg-emerald-50 border-emerald-200', label: 'Recommended' };
      case 'recommended_with_conditions':
        return { icon: Info, color: 'text-blue-700 bg-blue-50 border-blue-200', label: 'Recommended with Conditions' };
      case 'further_study_needed':
        return { icon: AlertTriangle, color: 'text-amber-700 bg-amber-50 border-amber-200', label: 'Further Study Needed' };
      case 'not_recommended':
        return { icon: AlertCircle, color: 'text-red-700 bg-red-50 border-red-200', label: 'Not Recommended' };
      default:
        return { icon: Info, color: 'text-slate-700 bg-slate-50 border-slate-200', label: 'Unknown' };
    }
  };

  const config = getRecommendationConfig(evaluation.recommendation);
  const Icon = config.icon;

  if (compact) {
    return (
      <div className={`rounded-lg border ${config.color} p-3`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4" />
            <div>
              <p className="text-xs font-bold uppercase">{config.label}</p>
              <p className="text-[10px] font-semibold">{evaluation.overall_score?.toFixed(1)}/10</p>
            </div>
          </div>
          {onEdit && (
            <button
              onClick={onEdit}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <Edit2 className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border ${config.color} p-4 space-y-3`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold">{config.label}</h3>
            <p className="text-xs opacity-75 mt-1">{evaluation.proposal_name}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">{evaluation.overall_score?.toFixed(1)}</div>
          <p className="text-[10px] font-semibold uppercase opacity-75">/ 10</p>
        </div>
      </div>

      {evaluation.recommendation_summary && (
        <p className="text-xs">{evaluation.recommendation_summary}</p>
      )}

      {evaluation.risk_level?.overall_risk && (
        <div className="text-xs">
          <span className="font-semibold">Risk Level:</span> {evaluation.risk_level.overall_risk}
        </div>
      )}

      {onEdit && (
        <button
          onClick={onEdit}
          className="w-full text-xs font-medium py-1.5 rounded border border-current/20 hover:bg-black/5 transition-colors"
        >
          Edit Evaluation
        </button>
      )}
    </div>
  );
}