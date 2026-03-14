import React, { useState } from 'react';
import { Download, FileText, Eye } from 'lucide-react';

export default function ProposalDisplay({ proposal, viewMode = 'full' }) {
  const [view, setView] = useState(viewMode);
  const [audienceType, setAudienceType] = useState('board'); // board or internal

  if (!proposal) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center">
        <p className="text-sm text-slate-600">No proposal selected</p>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const getDisplayContent = () => {
    if (audienceType === 'board') {
      return view === 'short' ? proposal.board_summary : getFullProposal();
    } else {
      return view === 'short' ? proposal.board_summary : getFullProposal();
    }
  };

  const getFullProposal = () => {
    return (
      <div className="space-y-8">
        {/* Background */}
        {proposal.background && (
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">Background</h2>
            <p className="text-sm text-slate-700 leading-relaxed">{proposal.background}</p>
          </section>
        )}

        {/* Problem Statement */}
        {proposal.problem_statement && (
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">Problem Statement</h2>
            <p className="text-sm text-slate-700 leading-relaxed">{proposal.problem_statement}</p>
          </section>
        )}

        {/* Proposed Solution */}
        {proposal.proposed_solution && (
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">Proposed Solution</h2>
            <p className="text-sm text-slate-700 leading-relaxed">{proposal.proposed_solution}</p>
          </section>
        )}

        {/* Service Implications */}
        {proposal.service_implications && (
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">Service Implications</h2>
            <p className="text-sm text-slate-700 leading-relaxed">{proposal.service_implications}</p>
          </section>
        )}

        {/* Staffing Implications */}
        {proposal.staffing_implications && (
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">Staffing Implications</h2>
            {proposal.staffing_implications.fte_change !== undefined && (
              <p className="text-sm font-semibold text-slate-900 mb-2">
                FTE Change: {proposal.staffing_implications.fte_change > 0 ? '+' : ''}{proposal.staffing_implications.fte_change}
              </p>
            )}
            {proposal.staffing_implications.positions_added?.length > 0 && (
              <div className="mb-3">
                <p className="text-sm font-semibold text-emerald-700 mb-1">Positions Added:</p>
                <ul className="text-sm text-slate-700 ml-4">
                  {proposal.staffing_implications.positions_added.map((p, i) => (
                    <li key={i}>• {p}</li>
                  ))}
                </ul>
              </div>
            )}
            {proposal.staffing_implications.description && (
              <p className="text-sm text-slate-700 leading-relaxed">{proposal.staffing_implications.description}</p>
            )}
          </section>
        )}

        {/* Budget Impact */}
        {proposal.budget_impact && (
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">Budget Impact</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              {proposal.budget_impact.annual_cost !== undefined && (
                <div className="rounded-lg border border-slate-200 p-3">
                  <p className="text-xs text-slate-600 font-semibold">Annual Cost</p>
                  <p className="text-lg font-bold text-slate-900">${proposal.budget_impact.annual_cost?.toLocaleString()}</p>
                </div>
              )}
              {proposal.budget_impact.annual_benefit !== undefined && (
                <div className="rounded-lg border border-emerald-200 p-3">
                  <p className="text-xs text-emerald-700 font-semibold">Annual Benefit</p>
                  <p className="text-lg font-bold text-emerald-700">${proposal.budget_impact.annual_benefit?.toLocaleString()}</p>
                </div>
              )}
            </div>
            {proposal.budget_impact.net_annual_impact !== undefined && (
              <div className={`rounded-lg border p-3 mb-3 ${proposal.budget_impact.net_annual_impact >= 0 ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
                <p className={`text-xs font-semibold ${proposal.budget_impact.net_annual_impact >= 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                  Net Annual Impact
                </p>
                <p className={`text-lg font-bold ${proposal.budget_impact.net_annual_impact >= 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {proposal.budget_impact.net_annual_impact >= 0 ? '+' : ''} ${proposal.budget_impact.net_annual_impact?.toLocaleString()}
                </p>
              </div>
            )}
            {proposal.budget_impact.description && (
              <p className="text-sm text-slate-700 leading-relaxed">{proposal.budget_impact.description}</p>
            )}
          </section>
        )}

        {/* Tax Impact */}
        {proposal.tax_impact && (
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">Tax Impact</h2>
            {proposal.tax_impact.mill_rate_change !== undefined && (
              <p className="text-sm font-semibold text-slate-900 mb-2">
                Mill Rate Change: {proposal.tax_impact.mill_rate_change > 0 ? '+' : ''}{proposal.tax_impact.mill_rate_change?.toFixed(3)}M
              </p>
            )}
            {proposal.tax_impact.description && (
              <p className="text-sm text-slate-700 leading-relaxed">{proposal.tax_impact.description}</p>
            )}
          </section>
        )}

        {/* Implementation Steps */}
        {proposal.implementation_steps?.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">Implementation Steps</h2>
            <div className="space-y-3">
              {proposal.implementation_steps.map((step, i) => (
                <div key={i} className="rounded-lg border border-slate-200 p-4">
                  <h3 className="text-sm font-bold text-slate-900 mb-2">Phase {step.phase}: {step.description}</h3>
                  {step.timeline && (
                    <p className="text-xs text-slate-600 mb-1">
                      <span className="font-semibold">Timeline:</span> {step.timeline}
                    </p>
                  )}
                  {step.responsible_party && (
                    <p className="text-xs text-slate-600">
                      <span className="font-semibold">Responsible:</span> {step.responsible_party}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Risks and Mitigation */}
        {proposal.risks_and_mitigation?.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">Risks and Mitigation</h2>
            <div className="space-y-3">
              {proposal.risks_and_mitigation.map((item, i) => (
                <div key={i} className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <p className="text-sm font-semibold text-amber-900 mb-1">{item.risk}</p>
                  <p className="text-xs text-amber-800 mb-1">
                    <span className="font-semibold">Probability:</span> {item.probability} • <span className="font-semibold">Impact:</span> {item.impact}
                  </p>
                  {item.mitigation && (
                    <p className="text-xs text-amber-900"><span className="font-semibold">Mitigation:</span> {item.mitigation}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Regional Opportunities */}
        {proposal.regional_opportunities?.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">Regional Opportunities</h2>
            <ul className="space-y-2">
              {proposal.regional_opportunities.map((opp, i) => (
                <li key={i} className="text-sm text-slate-700">• {opp}</li>
              ))}
            </ul>
          </section>
        )}

        {/* Recommendation */}
        {proposal.recommendation && (
          <section className="rounded-lg border-2 border-slate-900 bg-slate-50 p-4">
            <h2 className="text-lg font-bold text-slate-900 mb-2">Recommendation</h2>
            <p className="text-sm text-slate-700 leading-relaxed">{proposal.recommendation}</p>
          </section>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-slate-600" />
          <select
            value={view}
            onChange={(e) => setView(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded text-xs font-medium bg-white"
          >
            <option value="short">Summary View</option>
            <option value="full">Full Proposal</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-slate-600" />
          <select
            value={audienceType}
            onChange={(e) => setAudienceType(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded text-xs font-medium bg-white"
          >
            <option value="board">Board Version</option>
            <option value="internal">Internal Version</option>
          </select>
        </div>

        <button
          onClick={handlePrint}
          className="ml-auto px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded hover:bg-slate-100 transition-colors flex items-center gap-1.5"
        >
          <Download className="h-3.5 w-3.5" />
          Print / Export
        </button>
      </div>

      {/* Content */}
      <div className="rounded-lg border border-slate-200 bg-white p-8 prose prose-sm max-w-none print:prose-base">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">{proposal.title}</h1>
        <p className="text-xs text-slate-500 mb-6">
          Proposal Type: {proposal.proposal_type.replace(/_/g, ' ').toUpperCase()} • Status: {proposal.status}
        </p>

        <div className="border-t border-slate-200 pt-6">
          {view === 'short' && proposal.board_summary ? (
            <div className="text-sm text-slate-700 leading-relaxed">
              {proposal.board_summary}
            </div>
          ) : (
            getFullProposal()
          )}
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body { background: white; }
          .no-print { display: none; }
          .prose { font-size: 11pt; line-height: 1.5; }
          .prose h1 { page-break-after: avoid; }
          .prose section { page-break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}