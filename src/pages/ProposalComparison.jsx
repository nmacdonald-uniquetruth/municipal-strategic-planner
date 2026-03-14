import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Trash2, Check, X, AlertCircle } from 'lucide-react';
import SectionHeader from '@/components/machias/SectionHeader';

const MetricRow = ({ label, proposals, getMetric, formatValue, compareDirection = 'higher' }) => {
  const values = proposals.map((p) => getMetric(p));
  const maxVal = Math.max(...values.filter((v) => v !== null && v !== undefined));
  const minVal = Math.min(...values.filter((v) => v !== null && v !== undefined));

  return (
    <div className="border-t border-slate-200 p-3">
      <div className="grid gap-4" style={{ gridTemplateColumns: `200px repeat(${proposals.length}, 1fr)` }}>
        <div className="font-semibold text-sm text-slate-700">{label}</div>
        {values.map((val, idx) => {
          const isHighlight = val !== null && val !== undefined && (
            (compareDirection === 'higher' && val === maxVal) ||
            (compareDirection === 'lower' && val === minVal)
          );
          const isWorst = val !== null && val !== undefined && (
            (compareDirection === 'higher' && val === minVal) ||
            (compareDirection === 'lower' && val === maxVal)
          );

          return (
            <div
              key={idx}
              className={`text-sm p-2 rounded ${
                isHighlight
                  ? 'bg-emerald-100 text-emerald-900 font-semibold'
                  : isWorst
                  ? 'bg-red-50 text-red-900'
                  : 'bg-white text-slate-700'
              }`}
            >
              {val !== null && val !== undefined ? formatValue(val) : '—'}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function ProposalComparison() {
  const [selectedIds, setSelectedIds] = useState([]);
  const [expanded, setExpanded] = useState(true);

  const { data: allProposals = [] } = useQuery({
    queryKey: ['proposals'],
    queryFn: () => base44.entities.Proposal.list('-updated_date', 100),
  });

  const selectedProposals = allProposals.filter((p) => selectedIds.includes(p.id));

  const toggleProposal = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  // Scoring helpers
  const getScore = (proposal, field) => {
    if (!proposal) return null;
    if (field === 'cost') return proposal.budget_impact?.annual_cost || 0;
    if (field === 'benefit') return proposal.budget_impact?.annual_benefit || 0;
    if (field === 'net_impact') return (proposal.budget_impact?.net_annual_impact || 0);
    if (field === 'tax_change') return Math.abs(proposal.tax_impact?.tax_levy_change || 0);
    if (field === 'fte_change') return proposal.staffing_implications?.fte_change || 0;
    if (field === 'regional_potential') return proposal.regional_opportunities?.length || 0;
    if (field === 'payback_years') return proposal.budget_impact?.payback_period_years || 999;
    if (field === 'implementation_steps') return proposal.implementation_steps?.length || 0;
    if (field === 'risks') return proposal.risks_and_mitigation?.length || 0;
    return null;
  };

  const getCategoryScore = (proposal, category) => {
    if (category === 'simplicity') {
      const steps = proposal.implementation_steps?.length || 0;
      const risks = proposal.risks_and_mitigation?.length || 0;
      return 10 - Math.min((steps + risks * 0.5) / 2, 10);
    }
    if (category === 'sustainability') {
      const risks = proposal.risks_and_mitigation || [];
      const highRisks = risks.filter((r) => r.impact === 'high').length;
      return 10 - highRisks;
    }
    if (category === 'political') {
      return 7; // Placeholder - would come from evaluation
    }
    return 5;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <SectionHeader title="Proposal Comparison Tool" subtitle="Select 2 or more proposals to compare metrics side-by-side" />
      </div>

      {/* Proposal Selector */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900">Select Proposals</h3>
          {selectedIds.length > 0 && (
            <button
              onClick={clearSelection}
              className="text-xs font-semibold text-red-600 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50"
            >
              Clear Selection ({selectedIds.length})
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
          {allProposals.length === 0 ? (
            <p className="text-xs text-slate-600 col-span-full">No proposals found</p>
          ) : (
            allProposals.map((proposal) => (
              <label
                key={proposal.id}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedIds.includes(proposal.id)
                    ? 'border-blue-300 bg-blue-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedIds.includes(proposal.id)}
                  onChange={() => toggleProposal(proposal.id)}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-slate-900 truncate">{proposal.title}</p>
                  <p className="text-xs text-slate-600 mt-1">
                    {proposal.proposal_type} • {proposal.status}
                  </p>
                  {proposal.budget_impact?.net_annual_impact && (
                    <p className={`text-xs mt-1 font-semibold ${proposal.budget_impact.net_annual_impact > 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                      Net: ${(proposal.budget_impact.net_annual_impact / 1000).toFixed(0)}K
                    </p>
                  )}
                </div>
              </label>
            ))
          )}
        </div>
      </div>

      {/* Comparison Grid */}
      {selectedProposals.length >= 2 && (
        <div className="space-y-4">
          {/* Header Row */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 overflow-hidden">
            <div className="grid gap-4 p-4" style={{ gridTemplateColumns: `200px repeat(${selectedProposals.length}, 1fr)` }}>
              <div className="font-bold text-slate-900">Proposal</div>
              {selectedProposals.map((p) => (
                <div key={p.id} className="text-sm font-bold text-slate-900">
                  <p className="truncate">{p.title}</p>
                  <p className="text-xs text-slate-600 mt-1">{p.proposal_type}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Impact */}
          <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
            <div className="bg-slate-900 text-white px-4 py-2">
              <h4 className="text-sm font-bold">Financial Impact</h4>
            </div>
            <MetricRow
              label="Annual Benefit"
              proposals={selectedProposals}
              getMetric={(p) => p.budget_impact?.annual_benefit || 0}
              formatValue={(v) => `$${(v / 1000).toFixed(0)}K`}
              compareDirection="higher"
            />
            <MetricRow
              label="Annual Cost"
              proposals={selectedProposals}
              getMetric={(p) => p.budget_impact?.annual_cost || 0}
              formatValue={(v) => `$${(v / 1000).toFixed(0)}K`}
              compareDirection="lower"
            />
            <MetricRow
              label="Net Annual Impact"
              proposals={selectedProposals}
              getMetric={(p) => p.budget_impact?.net_annual_impact || 0}
              formatValue={(v) => `$${(v / 1000).toFixed(0)}K`}
              compareDirection="higher"
            />
            <MetricRow
              label="5-Year Total"
              proposals={selectedProposals}
              getMetric={(p) => p.budget_impact?.five_year_total || 0}
              formatValue={(v) => `$${(v / 1000).toFixed(0)}K`}
              compareDirection="higher"
            />
            <MetricRow
              label="Payback Period"
              proposals={selectedProposals}
              getMetric={(p) => p.budget_impact?.payback_period_years || null}
              formatValue={(v) => `${v.toFixed(1)} yrs`}
              compareDirection="lower"
            />
          </div>

          {/* Tax & Staffing */}
          <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
            <div className="bg-slate-900 text-white px-4 py-2">
              <h4 className="text-sm font-bold">Tax & Staffing Impact</h4>
            </div>
            <MetricRow
              label="Tax Levy Change"
              proposals={selectedProposals}
              getMetric={(p) => p.tax_impact?.tax_levy_change || 0}
              formatValue={(v) => `$${(v / 1000).toFixed(0)}K`}
              compareDirection="lower"
            />
            <MetricRow
              label="Mill Rate Change"
              proposals={selectedProposals}
              getMetric={(p) => p.tax_impact?.mill_rate_change || 0}
              formatValue={(v) => v.toFixed(3)}
              compareDirection="lower"
            />
            <MetricRow
              label="FTE Change"
              proposals={selectedProposals}
              getMetric={(p) => p.staffing_implications?.fte_change || 0}
              formatValue={(v) => `${v > 0 ? '+' : ''}${v.toFixed(1)}`}
              compareDirection="higher"
            />
            <MetricRow
              label="Positions Added"
              proposals={selectedProposals}
              getMetric={(p) => p.staffing_implications?.positions_added?.length || 0}
              formatValue={(v) => `${v} positions`}
              compareDirection="higher"
            />
            <MetricRow
              label="Positions Eliminated"
              proposals={selectedProposals}
              getMetric={(p) => p.staffing_implications?.positions_eliminated?.length || 0}
              formatValue={(v) => `${v} positions`}
              compareDirection="lower"
            />
          </div>

          {/* Implementation & Complexity */}
          <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
            <div className="bg-slate-900 text-white px-4 py-2">
              <h4 className="text-sm font-bold">Implementation & Risk</h4>
            </div>
            <MetricRow
              label="Implementation Steps"
              proposals={selectedProposals}
              getMetric={(p) => p.implementation_steps?.length || 0}
              formatValue={(v) => `${v} steps`}
              compareDirection="lower"
            />
            <MetricRow
              label="Identified Risks"
              proposals={selectedProposals}
              getMetric={(p) => p.risks_and_mitigation?.length || 0}
              formatValue={(v) => `${v} risks`}
              compareDirection="lower"
            />
            <MetricRow
              label="Implementation Complexity"
              proposals={selectedProposals}
              getMetric={(p) => getCategoryScore(p, 'simplicity')}
              formatValue={(v) => `${v.toFixed(1)}/10`}
              compareDirection="higher"
            />
            <MetricRow
              label="Sustainability Score"
              proposals={selectedProposals}
              getMetric={(p) => getCategoryScore(p, 'sustainability')}
              formatValue={(v) => `${v.toFixed(1)}/10`}
              compareDirection="higher"
            />
          </div>

          {/* Strategic Dimensions */}
          <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
            <div className="bg-slate-900 text-white px-4 py-2">
              <h4 className="text-sm font-bold">Strategic Dimensions</h4>
            </div>
            <MetricRow
              label="Affected Departments"
              proposals={selectedProposals}
              getMetric={(p) => p.departments_affected?.length || 0}
              formatValue={(v) => `${v} departments`}
            />
            <MetricRow
              label="Regional Opportunities"
              proposals={selectedProposals}
              getMetric={(p) => p.regional_opportunities?.length || 0}
              formatValue={(v) => `${v} opportunities`}
              compareDirection="higher"
            />
            <div className="border-t border-slate-200 p-3">
              <div className="grid gap-4" style={{ gridTemplateColumns: `200px repeat(${selectedProposals.length}, 1fr)` }}>
                <div className="font-semibold text-sm text-slate-700">Service Impact</div>
                {selectedProposals.map((p) => (
                  <div key={p.id} className="text-xs p-2 rounded bg-slate-50">
                    {p.service_implications ? p.service_implications.substring(0, 80) + '...' : '—'}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recommendation Summary */}
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6">
            <h3 className="text-lg font-bold text-emerald-900 mb-4">Comparative Analysis Summary</h3>
            <div className="space-y-3">
              {selectedProposals.map((p) => {
                const netImpact = p.budget_impact?.net_annual_impact || 0;
                const complexity = getCategoryScore(p, 'simplicity');
                const sustainability = getCategoryScore(p, 'sustainability');
                const regionalOpps = p.regional_opportunities?.length || 0;

                return (
                  <div key={p.id} className="bg-white rounded-lg p-4 border border-emerald-100">
                    <h4 className="font-bold text-slate-900 mb-2">{p.title}</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-slate-600">Financial Impact</span>
                        <p className={`font-bold mt-1 ${netImpact > 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                          ${(netImpact / 1000).toFixed(0)}K
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-600">Complexity</span>
                        <p className="font-bold mt-1 text-slate-900">{complexity.toFixed(1)}/10</p>
                      </div>
                      <div>
                        <span className="text-slate-600">Sustainability</span>
                        <p className="font-bold mt-1 text-slate-900">{sustainability.toFixed(1)}/10</p>
                      </div>
                      <div>
                        <span className="text-slate-600">Regional Opportunity</span>
                        <p className="font-bold mt-1 text-slate-900">{regionalOpps} options</p>
                      </div>
                    </div>
                    {p.recommendation && (
                      <div className="mt-3 p-2 bg-slate-50 rounded border border-slate-200">
                        <p className="text-[10px] font-bold text-slate-600 mb-1">Recommendation:</p>
                        <p className="text-xs text-slate-700">{p.recommendation}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {selectedProposals.length === 0 && (
        <div className="rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-12 text-center">
          <AlertCircle className="h-8 w-8 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-700 font-semibold mb-1">Select 2 or more proposals to compare</p>
          <p className="text-sm text-slate-600">Use the selector above to choose proposals for side-by-side analysis</p>
        </div>
      )}

      {selectedProposals.length === 1 && (
        <div className="rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-12 text-center">
          <AlertCircle className="h-8 w-8 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-700 font-semibold mb-1">Select at least one more proposal</p>
          <p className="text-sm text-slate-600">Choose another proposal to enable comparison</p>
        </div>
      )}
    </div>
  );
}