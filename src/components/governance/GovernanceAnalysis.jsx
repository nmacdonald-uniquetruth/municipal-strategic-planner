import React from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';

const AGREEMENT_LABELS = {
  interlocal_agreement: 'Interlocal Agreement',
  mou: 'Memorandum of Understanding',
  service_contract: 'Service Contract',
  joint_powers: 'Joint Powers Board',
  regional_authority: 'Regional Authority',
};

const CONTROL_LABELS = {
  full_control: 'Full Control',
  majority_control: 'Majority Control',
  shared_control: 'Shared Control',
  advisory_only: 'Advisory Only',
  subservient: 'Subservient',
};

const CONTROL_COLORS = {
  full_control: 'emerald',
  majority_control: 'blue',
  shared_control: 'slate',
  advisory_only: 'amber',
  subservient: 'red',
};

export default function GovernanceAnalysis({ governance, readOnly = false, onChange }) {
  if (!governance) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center">
        <p className="text-sm text-slate-600">No governance framework configured</p>
      </div>
    );
  }

  const controlColor = CONTROL_COLORS[governance.machias_control_level] || 'slate';
  const colorMap = {
    emerald: 'border-emerald-200 bg-emerald-50',
    blue: 'border-blue-200 bg-blue-50',
    slate: 'border-slate-200 bg-slate-50',
    amber: 'border-amber-200 bg-amber-50',
    red: 'border-red-200 bg-red-50',
  };

  return (
    <div className="space-y-6">
      {/* Agreement Type & Control */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase mb-3">Agreement Type</h3>
          <p className="text-sm font-semibold text-slate-700 mb-2">
            {AGREEMENT_LABELS[governance.agreement_type]}
          </p>
          {governance.agreement_description && (
            <p className="text-xs text-slate-600">{governance.agreement_description}</p>
          )}
        </div>

        <div className={`rounded-lg border p-4 ${colorMap[controlColor]}`}>
          <h3 className={`text-xs font-bold uppercase mb-3 ${
            controlColor === 'emerald' ? 'text-emerald-700' :
            controlColor === 'blue' ? 'text-blue-700' :
            controlColor === 'amber' ? 'text-amber-700' :
            controlColor === 'red' ? 'text-red-700' :
            'text-slate-700'
          }`}>
            Machias Control Level
          </h3>
          <p className={`text-sm font-semibold ${
            controlColor === 'emerald' ? 'text-emerald-700' :
            controlColor === 'blue' ? 'text-blue-700' :
            controlColor === 'amber' ? 'text-amber-700' :
            controlColor === 'red' ? 'text-red-700' :
            'text-slate-700'
          }`}>
            {CONTROL_LABELS[governance.machias_control_level]}
          </p>
          {governance.control_details && (
            <p className={`text-xs mt-2 ${
              controlColor === 'emerald' ? 'text-emerald-600' :
              controlColor === 'blue' ? 'text-blue-600' :
              controlColor === 'amber' ? 'text-amber-600' :
              controlColor === 'red' ? 'text-red-600' :
              'text-slate-600'
            }`}>
              {governance.control_details}
            </p>
          )}
        </div>
      </div>

      {/* Cost Sharing */}
      {governance.cost_sharing_structure && (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase mb-3">Cost Sharing Structure</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-bold text-slate-600 mb-1">Model</p>
              <p className="text-sm font-semibold text-slate-900">{governance.cost_sharing_structure.model}</p>
            </div>
            {governance.cost_sharing_structure.machias_share_percent !== undefined && (
              <div>
                <p className="text-[10px] font-bold text-slate-600 mb-1">Machias Share</p>
                <p className="text-sm font-semibold text-slate-900">{governance.cost_sharing_structure.machias_share_percent}%</p>
              </div>
            )}
          </div>
          {governance.cost_sharing_structure.revenue_sharing && (
            <div className="mt-3 p-2 bg-emerald-50 rounded border border-emerald-200">
              <p className="text-xs text-emerald-700 font-semibold">✓ Machias shares in surpluses/revenue</p>
            </div>
          )}
          {governance.cost_sharing_structure.adjustment_mechanism && (
            <p className="text-xs text-slate-600 mt-3">
              <span className="font-bold">Adjustment: </span>{governance.cost_sharing_structure.adjustment_mechanism}
            </p>
          )}
          {governance.cost_sharing_structure.details && (
            <p className="text-xs text-slate-600 mt-2">{governance.cost_sharing_structure.details}</p>
          )}
        </div>
      )}

      {/* Staffing Oversight */}
      {governance.staffing_oversight && (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase mb-3">Staffing Oversight</h3>
          <div className="space-y-2 text-xs">
            {governance.staffing_oversight.hiring_authority && (
              <div>
                <span className="font-bold text-slate-700">Hiring Authority: </span>
                <span className="text-slate-600">{governance.staffing_oversight.hiring_authority}</span>
              </div>
            )}
            {governance.staffing_oversight.compensation_decisions && (
              <div>
                <span className="font-bold text-slate-700">Compensation: </span>
                <span className="text-slate-600">{governance.staffing_oversight.compensation_decisions}</span>
              </div>
            )}
            {governance.staffing_oversight.performance_oversight && (
              <div>
                <span className="font-bold text-slate-700">Performance: </span>
                <span className="text-slate-600">{governance.staffing_oversight.performance_oversight}</span>
              </div>
            )}
            {governance.staffing_oversight.union_implications && (
              <div className="p-2 bg-amber-50 border border-amber-200 rounded mt-2">
                <span className="font-bold text-amber-700">Union Implications: </span>
                <span className="text-amber-600">{governance.staffing_oversight.union_implications}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rationales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {governance.operational_rationale && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <h4 className="text-xs font-bold text-blue-900 mb-2">Operational Rationale</h4>
            <p className="text-xs text-blue-800">{governance.operational_rationale}</p>
          </div>
        )}
        {governance.governance_rationale && (
          <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
            <h4 className="text-xs font-bold text-purple-900 mb-2">Governance Rationale</h4>
            <p className="text-xs text-purple-800">{governance.governance_rationale}</p>
          </div>
        )}
        {governance.financial_rationale && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <h4 className="text-xs font-bold text-emerald-900 mb-2">Financial Rationale</h4>
            <p className="text-xs text-emerald-800">{governance.financial_rationale}</p>
          </div>
        )}
      </div>

      {/* Legal Dependencies */}
      {governance.legal_dependencies && governance.legal_dependencies.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase mb-3">Legal & Policy Dependencies</h3>
          <div className="space-y-2">
            {governance.legal_dependencies.map((dep, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs">
                <AlertCircle className="h-3 w-3 mt-0.5 text-slate-400 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">{dep.item}</p>
                  <p className="text-slate-600 mt-0.5">
                    <span className={`font-bold ${
                      dep.status === 'required_before' ? 'text-red-700' :
                      dep.status === 'can_proceed_with' ? 'text-emerald-700' :
                      'text-amber-700'
                    }`}>
                      {dep.status === 'required_before' ? 'Required Before' : dep.status === 'can_proceed_with' ? 'Can Proceed With' : 'Contingent On'}
                    </span>
                    {dep.timeline && ` • ${dep.timeline}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Partner Withdrawal Risks */}
      {governance.partner_withdrawal_risks && governance.partner_withdrawal_risks.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <h3 className="text-xs font-bold text-red-900 uppercase mb-3">Partner Withdrawal Risks</h3>
          <div className="space-y-3">
            {governance.partner_withdrawal_risks.map((risk, idx) => (
              <div key={idx} className="border-l-2 border-red-300 pl-3">
                <p className="text-xs font-semibold text-red-900">{risk.risk}</p>
                <div className="flex items-center gap-2 mt-1 text-[10px]">
                  <span className={`font-bold px-1.5 py-0.5 rounded ${
                    risk.impact_on_machias === 'minimal' ? 'bg-emerald-100 text-emerald-700' :
                    risk.impact_on_machias === 'moderate' ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {risk.impact_on_machias === 'minimal' ? '◇ Minimal' : risk.impact_on_machias === 'moderate' ? '◈ Moderate' : '◆ Severe'}
                  </span>
                </div>
                {risk.mitigation && (
                  <p className="text-[10px] text-red-800 mt-1">
                    <span className="font-bold">Mitigation: </span>{risk.mitigation}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Implementation Risks */}
      {governance.implementation_risks && governance.implementation_risks.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <h3 className="text-xs font-bold text-amber-900 uppercase mb-3">Implementation Risks</h3>
          <div className="space-y-2">
            {governance.implementation_risks.map((risk, idx) => (
              <div key={idx} className="text-xs">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-3 w-3 text-amber-600" />
                  <span className="font-semibold text-amber-900">{risk.risk}</span>
                  <span className={`ml-auto font-bold px-1.5 py-0.5 rounded text-[10px] ${
                    risk.probability === 'low' ? 'bg-emerald-100 text-emerald-700' :
                    risk.probability === 'medium' ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {risk.probability}
                  </span>
                </div>
                {risk.mitigation && (
                  <p className="text-amber-800 ml-5 mt-1">
                    <span className="font-bold">Mitigation: </span>{risk.mitigation}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Terms & Conditions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {governance.termination_provisions && (
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h4 className="text-xs font-bold text-slate-900 mb-2">Termination Provisions</h4>
            <p className="text-xs text-slate-600">{governance.termination_provisions}</p>
          </div>
        )}
        {governance.amendment_process && (
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h4 className="text-xs font-bold text-slate-900 mb-2">Amendment Process</h4>
            <p className="text-xs text-slate-600">{governance.amendment_process}</p>
          </div>
        )}
      </div>

      {governance.notes && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <h4 className="text-xs font-bold text-slate-900 mb-2">Notes</h4>
          <p className="text-xs text-slate-600">{governance.notes}</p>
        </div>
      )}
    </div>
  );
}