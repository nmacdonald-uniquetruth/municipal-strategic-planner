import React, { useMemo } from 'react';
import { AlertTriangle, AlertCircle, Zap, TrendingDown } from 'lucide-react';

const CATEGORY_COLORS = {
  financial: 'text-red-700 bg-red-50 border-red-200',
  operational: 'text-orange-700 bg-orange-50 border-orange-200',
  staffing: 'text-blue-700 bg-blue-50 border-blue-200',
  governance: 'text-purple-700 bg-purple-50 border-purple-200',
  legal: 'text-amber-700 bg-amber-50 border-amber-200',
  public_acceptance: 'text-pink-700 bg-pink-50 border-pink-200',
  partner_participation: 'text-indigo-700 bg-indigo-50 border-indigo-200',
};

const LIKELIHOOD_MAP = { low: 1, medium: 2, high: 3 };
const SEVERITY_MAP = { low: 1, medium: 2, high: 3, critical: 4 };

const calculateRiskScore = (likelihood, severity) => {
  return (LIKELIHOOD_MAP[likelihood] * SEVERITY_MAP[severity] / 12) * 100;
};

const getRiskLevel = (score) => {
  if (score < 25) return 'low';
  if (score < 50) return 'moderate';
  if (score < 75) return 'high';
  return 'critical';
};

const RiskIndicator = ({ likelihood, severity }) => {
  const score = calculateRiskScore(likelihood, severity);
  const level = getRiskLevel(score);

  const colors = {
    low: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    moderate: 'bg-amber-100 text-amber-700 border-amber-200',
    high: 'bg-orange-100 text-orange-700 border-orange-200',
    critical: 'bg-red-100 text-red-700 border-red-200',
  };

  return (
    <span className={`inline-block px-2 py-1 rounded text-xs font-bold border ${colors[level]}`}>
      {level.charAt(0).toUpperCase() + level.slice(1)}
    </span>
  );
};

export default function RiskProfileDisplay({ riskProfile, readOnly = true }) {
  if (!riskProfile || !riskProfile.risks || riskProfile.risks.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center">
        <p className="text-sm text-slate-600">No risks identified</p>
      </div>
    );
  }

  const overallScore = useMemo(() => {
    if (!riskProfile.risks || riskProfile.risks.length === 0) return 0;
    const scores = riskProfile.risks.map((r) => calculateRiskScore(r.likelihood, r.severity));
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }, [riskProfile.risks]);

  const overallLevel = getRiskLevel(overallScore);

  return (
    <div className="space-y-6">
      {/* Overall Risk Summary */}
      <div className={`rounded-lg border-2 p-4 ${CATEGORY_COLORS.financial}`}>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-bold text-lg">Overall Risk Level</h3>
            <p className="text-sm opacity-75 mt-1">{riskProfile.risks.length} identified risks</p>
          </div>
          <RiskIndicator likelihood="medium" severity={overallLevel === 'low' ? 'low' : overallLevel === 'moderate' ? 'medium' : 'high'} />
        </div>
        {riskProfile.risk_owner && (
          <p className="text-xs mt-3 opacity-75">
            <strong>Risk Owner:</strong> {riskProfile.risk_owner}
          </p>
        )}
      </div>

      {/* Risk Matrix */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="font-bold text-slate-900 mb-4">Risk Distribution</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          {['financial', 'operational', 'staffing', 'governance', 'legal', 'public_acceptance', 'partner_participation'].map((cat) => {
            const count = riskProfile.risks.filter((r) => r.category === cat).length;
            return (
              <div
                key={cat}
                className={`p-3 rounded-lg border ${count > 0 ? CATEGORY_COLORS[cat] : 'bg-slate-50 border-slate-200'}`}
              >
                <p className="font-bold">{count}</p>
                <p className="opacity-75 capitalize">{cat.replace(/_/g, ' ')}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Individual Risks */}
      <div className="space-y-3">
        {riskProfile.risks.map((risk, idx) => {
          const score = calculateRiskScore(risk.likelihood, risk.severity);

          return (
            <div key={risk.id || idx} className="rounded-lg border border-slate-200 bg-white overflow-hidden">
              {/* Risk Header */}
              <div className={`p-4 border-l-4 ${CATEGORY_COLORS[risk.category]}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900">{risk.title}</h4>
                    <p className="text-xs opacity-75 mt-1 capitalize">{risk.category.replace(/_/g, ' ')}</p>
                  </div>
                  <RiskIndicator likelihood={risk.likelihood} severity={risk.severity} />
                </div>
                {risk.description && <p className="text-sm opacity-90">{risk.description}</p>}
              </div>

              {/* Risk Details */}
              <div className="p-4 space-y-3 bg-slate-50">
                {/* Likelihood & Severity */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-bold text-slate-600 mb-1">Likelihood</p>
                    <p className="text-sm capitalize font-semibold text-slate-900">{risk.likelihood}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-600 mb-1">Severity</p>
                    <p className="text-sm capitalize font-semibold text-slate-900">{risk.severity}</p>
                  </div>
                </div>

                {/* Mitigation Actions */}
                {risk.mitigation_actions && risk.mitigation_actions.length > 0 && (
                  <div className="pt-2 border-t border-slate-200">
                    <p className="text-xs font-bold text-slate-700 mb-2">Mitigation Actions</p>
                    <div className="space-y-2">
                      {risk.mitigation_actions.map((action, aidx) => (
                        <div key={aidx} className="text-xs p-2 bg-white rounded border border-emerald-200">
                          <p className="font-semibold text-emerald-900">{action.action}</p>
                          {action.owner && (
                            <p className="text-emerald-700 mt-1">
                              <span className="font-bold">Owner:</span> {action.owner}
                            </p>
                          )}
                          {action.timeline && (
                            <p className="text-emerald-700">
                              <span className="font-bold">Timeline:</span> {action.timeline}
                            </p>
                          )}
                          {action.status && (
                            <p className="text-emerald-600 mt-1">
                              Status: <span className="font-bold capitalize">{action.status}</span>
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Fallback Options */}
                {risk.fallback_options && risk.fallback_options.length > 0 && (
                  <div className="pt-2 border-t border-slate-200">
                    <p className="text-xs font-bold text-slate-700 mb-2">Fallback Options</p>
                    <div className="space-y-2">
                      {risk.fallback_options.map((fallback, fidx) => (
                        <div key={fidx} className="text-xs p-2 bg-white rounded border border-amber-200">
                          <p className="font-semibold text-amber-900">{fallback.option}</p>
                          {fallback.impact_on_proposal && (
                            <p className="text-amber-700 mt-1">{fallback.impact_on_proposal}</p>
                          )}
                          {fallback.additional_cost && (
                            <p className="text-amber-700 mt-1">
                              <span className="font-bold">Additional Cost:</span> ${(fallback.additional_cost / 1000).toFixed(0)}K
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Monitoring Indicator */}
                {risk.monitoring_indicator && (
                  <div className="pt-2 border-t border-slate-200">
                    <p className="text-xs font-bold text-slate-700 mb-1">Early Warning Indicator</p>
                    <p className="text-xs text-slate-600">{risk.monitoring_indicator}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Dependencies */}
      {riskProfile.dependencies && riskProfile.dependencies.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="font-bold text-slate-900 mb-3">Critical Dependencies</h3>
          <div className="space-y-2">
            {riskProfile.dependencies.map((dep, idx) => (
              <div key={idx} className="text-xs p-2 bg-slate-50 rounded border border-slate-200">
                <div className="flex items-start justify-between">
                  <p className="font-semibold text-slate-900">{dep.dependency_on}</p>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    dep.criticality === 'must_have' ? 'bg-red-100 text-red-700' :
                    dep.criticality === 'preferred' ? 'bg-amber-100 text-amber-700' :
                    'bg-emerald-100 text-emerald-700'
                  }`}>
                    {dep.criticality?.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-slate-600 mt-1 capitalize">{dep.type}</p>
                {dep.timeline && <p className="text-slate-600 mt-1"><span className="font-bold">Timeline:</span> {dep.timeline}</p>}
                {dep.contingency && <p className="text-amber-700 mt-1"><span className="font-bold">Contingency:</span> {dep.contingency}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}