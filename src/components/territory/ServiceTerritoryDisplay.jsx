import React from 'react';
import { Users, TrendingUp, AlertCircle } from 'lucide-react';

export default function ServiceTerritoryDisplay({ territory }) {
  if (!territory) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center">
        <p className="text-sm text-slate-600">No territory selected</p>
      </div>
    );
  }

  const currentCount = territory.current_service_recipients?.length || 0;
  const candidateCount = territory.likely_candidates?.length || 0;
  const prospectiveCount = territory.prospective_long_term?.length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <div>
          <h3 className="text-xl font-bold text-slate-900">{territory.territory_name || territory.service_type}</h3>
          {territory.proposal_title && (
            <p className="text-sm text-slate-600 mt-1">From: {territory.proposal_title}</p>
          )}
        </div>
        {territory.description && (
          <p className="text-sm text-slate-700 mt-3 leading-relaxed">{territory.description}</p>
        )}
        <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-200">
          <div>
            <p className="text-xs font-bold text-slate-600">Current Recipients</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{currentCount}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-600">Likely Candidates</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{candidateCount}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-600">Prospective</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{prospectiveCount}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-600">Penetration</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{territory.penetration_rate?.toFixed(0) || '—'}%</p>
          </div>
        </div>
      </div>

      {/* Population & Geography */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Population Coverage
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Current served:</span>
              <span className="font-bold text-slate-900">{territory.total_current_population?.toLocaleString() || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Total potential:</span>
              <span className="font-bold text-slate-900">{territory.total_potential_population?.toLocaleString() || '—'}</span>
            </div>
            {territory.penetration_rate && (
              <div className="pt-2 border-t border-slate-200 flex justify-between">
                <span className="text-slate-600">Market penetration:</span>
                <span className="font-bold text-emerald-600">{territory.penetration_rate.toFixed(1)}%</span>
              </div>
            )}
          </div>
        </div>

        {territory.geographic_service_area && (
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h4 className="font-bold text-slate-900 mb-3">Geographic Service Area</h4>
            <div className="space-y-2 text-sm">
              {territory.geographic_service_area.description && (
                <div>
                  <p className="text-xs font-bold text-slate-600">Coverage</p>
                  <p className="text-slate-700">{territory.geographic_service_area.description}</p>
                </div>
              )}
              {territory.geographic_service_area.response_time_standard && (
                <div className="pt-2 border-t border-slate-200">
                  <p className="text-xs font-bold text-slate-600">Response Standard</p>
                  <p className="text-slate-700">{territory.geographic_service_area.response_time_standard}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Current Service Recipients */}
      {territory.current_service_recipients && territory.current_service_recipients.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h4 className="font-bold text-slate-900 mb-4">Current Service Recipients ({currentCount})</h4>
          <div className="space-y-2">
            {territory.current_service_recipients.map((town, idx) => (
              <div key={idx} className="p-3 bg-emerald-50 rounded border border-emerald-200">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-emerald-900">{town.municipality}</p>
                    {town.population && (
                      <p className="text-xs text-emerald-700 mt-0.5">Pop: {town.population.toLocaleString()}</p>
                    )}
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                    town.contract_status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {town.contract_status}
                  </span>
                </div>
                {town.service_start_year && (
                  <p className="text-xs text-emerald-700 mt-1">Since: {town.service_start_year}</p>
                )}
                {town.notes && (
                  <p className="text-xs text-emerald-800 mt-1">{town.notes}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Likely Candidates */}
      {territory.likely_candidates && territory.likely_candidates.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h4 className="font-bold text-slate-900 mb-4">Likely Candidates ({candidateCount})</h4>
          <div className="space-y-2">
            {territory.likely_candidates.map((town, idx) => (
              <div key={idx} className="p-3 bg-amber-50 rounded border border-amber-200">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-amber-900">{town.municipality}</p>
                    {town.population && (
                      <p className="text-xs text-amber-700 mt-0.5">Pop: {town.population.toLocaleString()}</p>
                    )}
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                    town.adoption_probability === 'high' ? 'bg-emerald-100 text-emerald-700' :
                    town.adoption_probability === 'medium' ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {town.adoption_probability}
                  </span>
                </div>
                <p className="text-xs text-amber-800 mt-1 font-semibold">{town.engagement_status?.replace(/_/g, ' ')}</p>
                {town.barriers_to_adoption && (
                  <p className="text-xs text-amber-700 mt-1">
                    <span className="font-bold">Barriers:</span> {town.barriers_to_adoption}
                  </p>
                )}
                {town.estimated_timeline && (
                  <p className="text-xs text-amber-700 mt-1">
                    <span className="font-bold">Timeline:</span> {town.estimated_timeline}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Prospective Long-term */}
      {territory.prospective_long_term && territory.prospective_long_term.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h4 className="font-bold text-slate-900 mb-4">Prospective Long-Term ({prospectiveCount})</h4>
          <div className="space-y-2">
            {territory.prospective_long_term.map((town, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded border border-slate-200">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-slate-900">{town.municipality}</p>
                    {town.population && (
                      <p className="text-xs text-slate-600 mt-0.5">Pop: {town.population.toLocaleString()}</p>
                    )}
                  </div>
                  {town.target_year && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                      Target: {town.target_year}
                    </span>
                  )}
                </div>
                {town.rationale && (
                  <p className="text-xs text-slate-700 mt-1">{town.rationale}</p>
                )}
                {town.prerequisites && (
                  <p className="text-xs text-slate-600 mt-1">
                    <span className="font-bold">Prerequisites:</span> {town.prerequisites}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Financial Summary */}
      {(territory.revenue_assumptions || territory.cost_assumptions) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {territory.revenue_assumptions && (
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <h4 className="font-bold text-slate-900 mb-3">Revenue Assumptions</h4>
              <div className="space-y-2 text-sm">
                {territory.revenue_assumptions.revenue_model && (
                  <div>
                    <p className="text-xs font-bold text-slate-600">Model</p>
                    <p className="text-slate-700 capitalize">{territory.revenue_assumptions.revenue_model.replace(/_/g, ' ')}</p>
                  </div>
                )}
                {territory.revenue_assumptions.total_projected_revenue && (
                  <div className="pt-2 border-t border-slate-200">
                    <p className="text-xs font-bold text-slate-600">Total Projected Annual</p>
                    <p className="text-lg font-bold text-emerald-600">
                      ${(territory.revenue_assumptions.total_projected_revenue / 1000).toFixed(0)}K
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {territory.cost_assumptions && (
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <h4 className="font-bold text-slate-900 mb-3">Cost Assumptions</h4>
              <div className="space-y-2 text-sm">
                {territory.cost_assumptions.cost_model && (
                  <div>
                    <p className="text-xs font-bold text-slate-600">Model</p>
                    <p className="text-slate-700 capitalize">{territory.cost_assumptions.cost_model.replace(/_/g, ' ')}</p>
                  </div>
                )}
                {territory.cost_assumptions.annual_delivery_cost && (
                  <div className="pt-2 border-t border-slate-200">
                    <p className="text-xs font-bold text-slate-600">Annual Delivery Cost</p>
                    <p className="text-lg font-bold text-orange-600">
                      ${(territory.cost_assumptions.annual_delivery_cost / 1000).toFixed(0)}K
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Staffing & Governance */}
      {(territory.staffing_assumptions || territory.governance_model) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {territory.staffing_assumptions && (
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <h4 className="font-bold text-slate-900 mb-3">Staffing Model</h4>
              <div className="space-y-2 text-sm">
                {territory.staffing_assumptions.dedicated_fte && (
                  <div>
                    <p className="text-xs font-bold text-slate-600">Dedicated FTE</p>
                    <p className="text-lg font-bold text-slate-900">{territory.staffing_assumptions.dedicated_fte}</p>
                  </div>
                )}
                {territory.staffing_assumptions.shared_staff_percentage && (
                  <div>
                    <p className="text-xs font-bold text-slate-600">Shared Staff</p>
                    <p className="text-slate-700">{territory.staffing_assumptions.shared_staff_percentage}% of time</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {territory.governance_model && (
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <h4 className="font-bold text-slate-900 mb-3">Governance Model</h4>
              <div className="space-y-2 text-sm">
                {territory.governance_model.agreement_type && (
                  <div>
                    <p className="text-xs font-bold text-slate-600">Agreement Type</p>
                    <p className="text-slate-700 capitalize">{territory.governance_model.agreement_type.replace(/_/g, ' ')}</p>
                  </div>
                )}
                {territory.governance_model.machias_control_level && (
                  <div className="pt-2 border-t border-slate-200">
                    <p className="text-xs font-bold text-slate-600">Machias Control</p>
                    <p className="text-slate-700 capitalize">{territory.governance_model.machias_control_level.replace(/_/g, ' ')}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Growth Strategy & Competitive Threats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {territory.growth_strategy && (
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Growth Strategy
            </h4>
            <p className="text-sm text-slate-700">{territory.growth_strategy}</p>
          </div>
        )}

        {territory.competitive_threats && territory.competitive_threats.length > 0 && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <h4 className="font-bold text-red-900 mb-2 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Competitive Threats ({territory.competitive_threats.length})
            </h4>
            <ul className="space-y-1">
              {territory.competitive_threats.map((threat, idx) => (
                <li key={idx} className="text-xs text-red-800">
                  <p className="font-bold">{threat.threat}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}