import React from 'react';
import { AlertTriangle, TrendingUp, Zap, Calendar } from 'lucide-react';

const URGENCY_COLORS = {
  critical: 'border-red-200 bg-red-50 text-red-900',
  high: 'border-orange-200 bg-orange-50 text-orange-900',
  medium: 'border-amber-200 bg-amber-50 text-amber-900',
  low: 'border-emerald-200 bg-emerald-50 text-emerald-900',
};

export default function CapitalProjectDisplay({ project }) {
  if (!project) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center">
        <p className="text-sm text-slate-600">No project selected</p>
      </div>
    );
  }

  const totalFundingIdentified = project.funding_sources?.reduce((sum, f) => sum + (f.amount || 0), 0) || 0;
  const fundingGap = project.project_cost - totalFundingIdentified;
  const fundingPercentage = totalFundingIdentified > 0 ? (totalFundingIdentified / project.project_cost * 100).toFixed(1) : 0;

  const annualCost = (project.annual_operating_impact || 0) + (project.annual_maintenance_impact || 0);
  const lifeTimeCost = annualCost * (project.useful_life_years || 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900">{project.title}</h3>
            <p className="text-sm text-slate-600 mt-1">{project.description}</p>
          </div>
          <div className={`px-3 py-1.5 rounded-lg font-bold text-sm border ${URGENCY_COLORS[project.urgency] || URGENCY_COLORS.medium}`}>
            {project.urgency?.charAt(0).toUpperCase() + project.urgency?.slice(1)} Priority
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-200">
          <div>
            <p className="text-xs font-bold text-slate-600">Project Cost</p>
            <p className="text-lg font-bold text-slate-900 mt-1">${(project.project_cost / 1000000).toFixed(2)}M</p>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-600">Useful Life</p>
            <p className="text-lg font-bold text-slate-900 mt-1">{project.useful_life_years} years</p>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-600">Status</p>
            <p className="text-sm font-bold text-slate-900 mt-1 capitalize">{project.status}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-600">Department</p>
            <p className="text-sm font-bold text-slate-900 mt-1">{project.department || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Regulatory Requirement Alert */}
      {project.regulatory_necessity && (
        <div className="rounded-lg border-2 border-red-300 bg-red-50 p-4">
          <p className="font-bold text-red-900 flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4" />
            Regulatory Requirement
          </p>
          <p className="text-sm text-red-800">{project.regulatory_requirement}</p>
          {project.regulatory_deadline && (
            <p className="text-xs text-red-700 mt-2 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Compliance required by {project.regulatory_deadline}
            </p>
          )}
        </div>
      )}

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Funding Plan */}
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h4 className="font-bold text-slate-900 mb-4">Funding Plan</h4>
          <div className="space-y-3">
            {project.funding_sources && project.funding_sources.length > 0 ? (
              <>
                {project.funding_sources.map((source, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900 capitalize">{source.source.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-slate-600">{source.status}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900">${(source.amount / 1000).toFixed(0)}K</p>
                      <p className="text-xs text-slate-600">{source.percentage}%</p>
                    </div>
                  </div>
                ))}
                <div className="pt-3 border-t border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-bold text-slate-900">Total Identified</p>
                    <p className="font-bold text-emerald-600">${(totalFundingIdentified / 1000).toFixed(0)}K ({fundingPercentage}%)</p>
                  </div>
                  {fundingGap > 0 && (
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-slate-900">Funding Gap</p>
                      <p className="font-bold text-orange-600">${(fundingGap / 1000).toFixed(0)}K</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-600">No funding sources defined</p>
            )}

            {/* Grant Information */}
            {project.grant_information?.grant_available && (
              <div className="mt-4 pt-4 border-t border-slate-200">
                <p className="font-bold text-slate-900 mb-2">Grant Opportunity</p>
                <div className="space-y-1 text-xs">
                  <p><span className="font-bold">Source:</span> {project.grant_information.grant_source}</p>
                  <p><span className="font-bold">Amount:</span> ${(project.grant_information.grant_amount / 1000).toFixed(0)}K</p>
                  <p><span className="font-bold">Match Required:</span> {project.grant_information.match_percentage}%</p>
                  <p><span className="font-bold">Probability:</span> {project.grant_information.probability_of_award}</p>
                  {project.grant_information.application_deadline && (
                    <p><span className="font-bold">Deadline:</span> {project.grant_information.application_deadline}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Operating & Maintenance Impact */}
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h4 className="font-bold text-slate-900 mb-4">Operational Impact</h4>
          <div className="space-y-3">
            <div className="p-3 bg-slate-50 rounded">
              <p className="text-xs font-bold text-slate-600">Annual Operating Cost</p>
              <p className="text-lg font-bold text-slate-900 mt-1">
                ${(project.annual_operating_impact || 0).toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded">
              <p className="text-xs font-bold text-slate-600">Annual Maintenance</p>
              <p className="text-lg font-bold text-slate-900 mt-1">
                ${(project.annual_maintenance_impact || 0).toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-emerald-50 rounded border border-emerald-200">
              <p className="text-xs font-bold text-emerald-700">Useful Life Cost</p>
              <p className="text-lg font-bold text-emerald-900 mt-1">
                ${(lifeTimeCost / 1000).toFixed(0)}K ({project.useful_life_years} years)
              </p>
            </div>
            {project.operating_impact_description && (
              <p className="text-xs text-slate-600 pt-2 border-t border-slate-200">
                {project.operating_impact_description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ROI & Community Value */}
      {project.roi_community_value && (
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Return on Investment & Community Value
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {project.roi_community_value.roi_percentage && (
              <div className="p-4 bg-emerald-50 rounded border border-emerald-200">
                <p className="text-xs font-bold text-emerald-700">ROI</p>
                <p className="text-2xl font-bold text-emerald-900 mt-1">
                  {project.roi_community_value.roi_percentage}%
                </p>
              </div>
            )}
            {project.roi_community_value.payback_period_years && (
              <div className="p-4 bg-blue-50 rounded border border-blue-200">
                <p className="text-xs font-bold text-blue-700">Payback Period</p>
                <p className="text-2xl font-bold text-blue-900 mt-1">
                  {project.roi_community_value.payback_period_years} years
                </p>
              </div>
            )}
          </div>

          {project.roi_community_value.quantifiable_benefits && (
            <div className="mt-4 p-3 bg-slate-50 rounded">
              <p className="text-xs font-bold text-slate-700 mb-1">Quantifiable Benefits</p>
              <p className="text-sm text-slate-800">{project.roi_community_value.quantifiable_benefits}</p>
              {project.roi_community_value.benefit_amount_annual && (
                <p className="text-xs text-emerald-700 font-bold mt-1">
                  Annual benefit: ${(project.roi_community_value.benefit_amount_annual / 1000).toFixed(0)}K
                </p>
              )}
            </div>
          )}

          {project.roi_community_value.intangible_benefits && project.roi_community_value.intangible_benefits.length > 0 && (
            <div className="mt-3 p-3 bg-purple-50 rounded">
              <p className="text-xs font-bold text-purple-700 mb-2">Intangible Benefits</p>
              <ul className="space-y-1">
                {project.roi_community_value.intangible_benefits.map((benefit, idx) => (
                  <li key={idx} className="text-xs text-purple-800">• {benefit}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Phased Delivery */}
      {project.phased_delivery && project.phased_delivery.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h4 className="font-bold text-slate-900 mb-4">Phased Delivery Plan</h4>
          <div className="space-y-3">
            {project.phased_delivery.map((phase, idx) => (
              <div key={idx} className="p-4 bg-slate-50 rounded border border-slate-200">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-bold text-slate-900">Phase {phase.phase}</p>
                    <p className="text-sm text-slate-700 mt-1">{phase.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">${(phase.cost / 1000).toFixed(0)}K</p>
                    <p className="text-xs text-slate-600">Year {phase.year}</p>
                  </div>
                </div>
                {phase.dependencies && (
                  <p className="text-xs text-slate-600 mt-2">
                    <span className="font-bold">Depends on:</span> {phase.dependencies}
                  </p>
                )}
                {phase.can_proceed_independently && (
                  <p className="text-xs text-emerald-700 mt-2 font-bold">Can proceed independently</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tax Impact */}
      {project.tax_impact && (
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h4 className="font-bold text-slate-900 mb-4">Tax Impact</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {project.tax_impact.debt_service_annual && (
              <div className="p-3 bg-slate-50 rounded">
                <p className="text-xs font-bold text-slate-600">Annual Debt Service</p>
                <p className="text-lg font-bold text-slate-900 mt-1">${(project.tax_impact.debt_service_annual / 1000).toFixed(0)}K</p>
              </div>
            )}
            {project.tax_impact.mill_rate_impact && (
              <div className="p-3 bg-slate-50 rounded">
                <p className="text-xs font-bold text-slate-600">Mill Rate Impact</p>
                <p className="text-lg font-bold text-slate-900 mt-1">{project.tax_impact.mill_rate_impact.toFixed(3)}</p>
              </div>
            )}
            {project.tax_impact.household_impact && (
              <div className="p-3 bg-slate-50 rounded">
                <p className="text-xs font-bold text-slate-600">Typical Household</p>
                <p className="text-lg font-bold text-slate-900 mt-1">${project.tax_impact.household_impact.toFixed(0)}/yr</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Risks */}
      {project.risks && project.risks.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h4 className="font-bold text-slate-900 mb-4">Project Risks</h4>
          <div className="space-y-3">
            {project.risks.map((risk, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded border border-slate-200">
                <div className="flex items-start justify-between">
                  <p className="font-semibold text-slate-900">{risk.risk}</p>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                    risk.probability === 'high' ? 'bg-red-100 text-red-700' :
                    risk.probability === 'medium' ? 'bg-amber-100 text-amber-700' :
                    'bg-emerald-100 text-emerald-700'
                  }`}>
                    {risk.probability}
                  </span>
                </div>
                {risk.cost_impact && (
                  <p className="text-sm text-slate-600 mt-1">
                    <span className="font-bold">Cost impact:</span> ${(risk.cost_impact / 1000).toFixed(0)}K
                  </p>
                )}
                {risk.mitigation && (
                  <p className="text-sm text-slate-600 mt-1">
                    <span className="font-bold">Mitigation:</span> {risk.mitigation}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}