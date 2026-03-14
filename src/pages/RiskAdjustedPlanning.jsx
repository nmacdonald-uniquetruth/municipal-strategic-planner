import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { AlertTriangle, TrendingDown } from 'lucide-react';
import SectionHeader from '@/components/machias/SectionHeader';
import RiskProfileDisplay from '@/components/risk/RiskProfileDisplay';

const LIKELIHOOD_MAP = { low: 1, medium: 2, high: 3 };
const SEVERITY_MAP = { low: 1, medium: 2, high: 3, critical: 4 };

const calculateRiskScore = (likelihood, severity) => {
  if (!likelihood || !severity) return 0;
  return (LIKELIHOOD_MAP[likelihood] * SEVERITY_MAP[severity] / 12) * 100;
};

const getRiskLevel = (score) => {
  if (score < 25) return 'low';
  if (score < 50) return 'moderate';
  if (score < 75) return 'high';
  return 'critical';
};

export default function RiskAdjustedPlanning() {
  const { data: proposals = [] } = useQuery({
    queryKey: ['proposals'],
    queryFn: () => base44.entities.Proposal.list('-updated_date', 100),
  });

  const { data: riskProfiles = [] } = useQuery({
    queryKey: ['riskProfiles'],
    queryFn: () => base44.entities.RiskProfile.list('-last_risk_review', 100),
  });

  // Calculate proposal risk metrics
  const proposalRiskMetrics = useMemo(() => {
    return proposals.map((proposal) => {
      const risk = riskProfiles.find((r) => r.proposal_id === proposal.id);

      if (!risk || !risk.risks || risk.risks.length === 0) {
        return { proposal, risk: null, overallScore: 0, overallLevel: 'low', riskCount: 0 };
      }

      const scores = risk.risks.map((r) => calculateRiskScore(r.likelihood, r.severity));
      const overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      const overallLevel = getRiskLevel(overallScore);

      const highRisks = risk.risks.filter((r) => getRiskLevel(calculateRiskScore(r.likelihood, r.severity)) === 'high' || getRiskLevel(calculateRiskScore(r.likelihood, r.severity)) === 'critical').length;

      return {
        proposal,
        risk,
        overallScore,
        overallLevel,
        riskCount: risk.risks.length,
        highRisks,
      };
    });
  }, [proposals, riskProfiles]);

  // Sort by risk level
  const sortedByRisk = [...proposalRiskMetrics].sort((a, b) => {
    const levelOrder = { critical: 0, high: 1, moderate: 2, low: 3 };
    return levelOrder[a.overallLevel] - levelOrder[b.overallLevel];
  });

  const criticalProposals = sortedByRisk.filter((m) => m.overallLevel === 'critical');
  const highRiskProposals = sortedByRisk.filter((m) => m.overallLevel === 'high');
  const moderateProposals = sortedByRisk.filter((m) => m.overallLevel === 'moderate');
  const lowRiskProposals = sortedByRisk.filter((m) => m.overallLevel === 'low');

  const ProposalRiskCard = ({ metric }) => {
    const { proposal, risk, overallScore, overallLevel, riskCount, highRisks } = metric;
    const levelColor = {
      critical: 'border-red-200 bg-red-50',
      high: 'border-orange-200 bg-orange-50',
      moderate: 'border-amber-200 bg-amber-50',
      low: 'border-emerald-200 bg-emerald-50',
    };

    const levelTextColor = {
      critical: 'text-red-900',
      high: 'text-orange-900',
      moderate: 'text-amber-900',
      low: 'text-emerald-900',
    };

    return (
      <div className={`rounded-lg border p-4 ${levelColor[overallLevel]}`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h4 className={`font-bold ${levelTextColor[overallLevel]}`}>{proposal.title}</h4>
            <p className="text-xs opacity-75 mt-1">{proposal.proposal_type}</p>
          </div>
          <div className={`px-2.5 py-1 rounded-lg font-bold text-sm ${levelTextColor[overallLevel]}`}>
            {overallScore.toFixed(0)}
          </div>
        </div>

        {risk && riskCount > 0 && (
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="opacity-75">Identified Risks:</span>
              <span className="font-bold">{riskCount} total</span>
            </div>
            {highRisks > 0 && (
              <div className="flex items-center justify-between p-1.5 bg-red-100 rounded border border-red-300">
                <span className="text-red-900 font-bold">High/Critical:</span>
                <span className="font-bold text-red-900">{highRisks}</span>
              </div>
            )}

            {/* Risk Categories */}
            <div className="grid grid-cols-2 gap-2 mt-2">
              {['financial', 'operational', 'staffing', 'governance', 'legal', 'public_acceptance'].map((cat) => {
                const count = risk.risks.filter((r) => r.category === cat).length;
                if (count === 0) return null;
                return (
                  <div key={cat} className="text-[10px] p-1 rounded bg-white bg-opacity-50 border border-current border-opacity-20">
                    <p className="font-bold capitalize">{cat.replace(/_/g, ' ')}</p>
                    <p className="opacity-75">{count} risks</p>
                  </div>
                );
              })}
            </div>

            {/* Mitigation Status */}
            {risk.risks.some((r) => r.mitigation_actions?.length > 0) && (
              <div className="mt-2 pt-2 border-t border-current border-opacity-20">
                <p className="font-bold opacity-75">Mitigation Actions Defined</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Risk-Adjusted Planning View"
        subtitle="Analyze proposals by identified risks, dependencies, and mitigations"
        icon={AlertTriangle}
      />

      {/* Risk Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-lg border-2 border-red-200 bg-red-50 p-4">
          <p className="text-xs font-bold text-red-700 uppercase">Critical Risk</p>
          <p className="text-3xl font-bold text-red-900 mt-2">{criticalProposals.length}</p>
          <p className="text-xs text-red-700 mt-1">proposals</p>
        </div>
        <div className="rounded-lg border-2 border-orange-200 bg-orange-50 p-4">
          <p className="text-xs font-bold text-orange-700 uppercase">High Risk</p>
          <p className="text-3xl font-bold text-orange-900 mt-2">{highRiskProposals.length}</p>
          <p className="text-xs text-orange-700 mt-1">proposals</p>
        </div>
        <div className="rounded-lg border-2 border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-bold text-amber-700 uppercase">Moderate Risk</p>
          <p className="text-3xl font-bold text-amber-900 mt-2">{moderateProposals.length}</p>
          <p className="text-xs text-amber-700 mt-1">proposals</p>
        </div>
        <div className="rounded-lg border-2 border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs font-bold text-emerald-700 uppercase">Low Risk</p>
          <p className="text-3xl font-bold text-emerald-900 mt-2">{lowRiskProposals.length}</p>
          <p className="text-xs text-emerald-700 mt-1">proposals</p>
        </div>
      </div>

      {/* Critical Risk Proposals */}
      {criticalProposals.length > 0 && (
        <div className="rounded-lg border border-red-300 bg-white p-6">
          <h3 className="text-lg font-bold text-red-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Critical Risk Proposals ({criticalProposals.length})
          </h3>
          <div className="space-y-3">
            {criticalProposals.map((metric) => (
              <div key={metric.proposal.id} className="border-l-4 border-red-500 pl-4 py-2">
                <h4 className="font-bold text-slate-900">{metric.proposal.title}</h4>
                <p className="text-sm text-slate-600 mt-1">
                  Risk Score: <span className="font-bold text-red-600">{metric.overallScore.toFixed(0)}/100</span>
                </p>
                {metric.risk && (
                  <p className="text-xs text-slate-600 mt-1">
                    {metric.riskCount} risks identified • {metric.highRisks} high/critical
                  </p>
                )}
                {metric.risk?.risk_owner && (
                  <p className="text-xs text-slate-600 mt-1">
                    <span className="font-bold">Risk Owner:</span> {metric.risk.risk_owner}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* By Risk Level */}
      {highRiskProposals.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-4">High Risk Proposals ({highRiskProposals.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {highRiskProposals.map((metric) => (
              <ProposalRiskCard key={metric.proposal.id} metric={metric} />
            ))}
          </div>
        </div>
      )}

      {moderateProposals.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-4">Moderate Risk Proposals ({moderateProposals.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {moderateProposals.map((metric) => (
              <ProposalRiskCard key={metric.proposal.id} metric={metric} />
            ))}
          </div>
        </div>
      )}

      {lowRiskProposals.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-4">Low Risk Proposals ({lowRiskProposals.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {lowRiskProposals.map((metric) => (
              <ProposalRiskCard key={metric.proposal.id} metric={metric} />
            ))}
          </div>
        </div>
      )}

      {/* Best Practices */}
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-6">
        <h3 className="font-bold text-slate-900 mb-3">Risk Management Best Practices</h3>
        <ul className="space-y-2 text-sm text-slate-700">
          <li>• Review risks quarterly and update mitigation status</li>
          <li>• Identify early warning indicators for each risk</li>
          <li>• Assign a risk owner to each proposal</li>
          <li>• Develop specific, actionable mitigation actions</li>
          <li>• Define fallback options for critical dependencies</li>
          <li>• Communicate high-risk items to leadership</li>
        </ul>
      </div>
    </div>
  );
}