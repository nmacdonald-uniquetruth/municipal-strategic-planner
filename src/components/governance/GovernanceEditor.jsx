import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';

const AGREEMENT_OPTIONS = {
  interlocal_agreement: 'Interlocal Agreement',
  mou: 'Memorandum of Understanding',
  service_contract: 'Service Contract',
  joint_powers: 'Joint Powers Board',
  regional_authority: 'Regional Authority',
};

const CONTROL_OPTIONS = {
  full_control: 'Full Control - Machias has final decision authority',
  majority_control: 'Majority Control - Machias voting member with majority protection',
  shared_control: 'Shared Control - Equal partnership with all parties',
  advisory_only: 'Advisory Only - Can make recommendations but not decisions',
  subservient: 'Subservient - Must follow partner town decisions',
};

export default function GovernanceEditor({ governance, onChange }) {
  const [expanded, setExpanded] = useState(false);

  const addRisk = (field) => {
    const items = governance[field] || [];
    items.push({});
    onChange({ ...governance, [field]: items });
  };

  const updateRisk = (field, index, data) => {
    const items = [...governance[field]];
    items[index] = { ...items[index], ...data };
    onChange({ ...governance, [field]: items });
  };

  const removeRisk = (field, index) => {
    const items = governance[field].filter((_, i) => i !== index);
    onChange({ ...governance, [field]: items });
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
      >
        <div className="text-left">
          <h3 className="text-sm font-bold text-slate-900">Governance & Interlocal Framework</h3>
          <p className="text-xs text-slate-500 mt-1">
            {governance?.agreement_type ? `${AGREEMENT_OPTIONS[governance.agreement_type]} • ${governance.machias_control_level}` : 'Configure governance'}
          </p>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
      </button>

      {expanded && (
        <div className="border-t border-slate-200 p-4 space-y-6 bg-slate-50">
          {/* Agreement Type */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Agreement Type</label>
            <select
              value={governance?.agreement_type || ''}
              onChange={(e) => onChange({ ...governance, agreement_type: e.target.value })}
              className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none"
            >
              <option value="">Select agreement type...</option>
              {Object.entries(AGREEMENT_OPTIONS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Agreement Description</label>
            <textarea
              value={governance?.agreement_description || ''}
              onChange={(e) => onChange({ ...governance, agreement_description: e.target.value })}
              className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none"
              rows="2"
              placeholder="Explain the agreement structure and key characteristics"
            />
          </div>

          {/* Control Level */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Machias Control Level</label>
            <select
              value={governance?.machias_control_level || ''}
              onChange={(e) => onChange({ ...governance, machias_control_level: e.target.value })}
              className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none"
            >
              <option value="">Select control level...</option>
              {Object.entries(CONTROL_OPTIONS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Control Details</label>
            <textarea
              value={governance?.control_details || ''}
              onChange={(e) => onChange({ ...governance, control_details: e.target.value })}
              className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none"
              rows="2"
              placeholder="Specific decision-making authority and voting rights"
            />
          </div>

          {/* Cost Sharing */}
          <div className="border-t border-slate-200 pt-4">
            <h4 className="text-xs font-bold text-slate-900 mb-3">Cost Sharing Structure</h4>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cost Sharing Model</label>
                  <select
                    value={governance?.cost_sharing_structure?.model || ''}
                    onChange={(e) =>
                      onChange({
                        ...governance,
                        cost_sharing_structure: { ...governance.cost_sharing_structure, model: e.target.value },
                      })
                    }
                    className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none"
                  >
                    <option value="">Select model...</option>
                    <option value="fixed_fee">Fixed Fee</option>
                    <option value="per_capita">Per Capita</option>
                    <option value="call_volume">Call Volume</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="equal_share">Equal Share</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Machias Share %</label>
                  <input
                    type="number"
                    value={governance?.cost_sharing_structure?.machias_share_percent || ''}
                    onChange={(e) =>
                      onChange({
                        ...governance,
                        cost_sharing_structure: { ...governance.cost_sharing_structure, machias_share_percent: parseFloat(e.target.value) },
                      })
                    }
                    className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none"
                    min="0"
                    max="100"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={governance?.cost_sharing_structure?.revenue_sharing || false}
                  onChange={(e) =>
                    onChange({
                      ...governance,
                      cost_sharing_structure: { ...governance.cost_sharing_structure, revenue_sharing: e.target.checked },
                    })
                  }
                  className="w-3 h-3"
                />
                <span className="text-xs font-semibold text-slate-700">Machias shares in surpluses/revenue</span>
              </label>

              <textarea
                value={governance?.cost_sharing_structure?.adjustment_mechanism || ''}
                onChange={(e) =>
                  onChange({
                    ...governance,
                    cost_sharing_structure: { ...governance.cost_sharing_structure, adjustment_mechanism: e.target.value },
                  })
                }
                className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none"
                rows="2"
                placeholder="How costs are adjusted annually (e.g., inflation-based, annual review)"
              />
            </div>
          </div>

          {/* Staffing Oversight */}
          <div className="border-t border-slate-200 pt-4">
            <h4 className="text-xs font-bold text-slate-900 mb-3">Staffing Oversight</h4>
            <div className="space-y-3">
              <input
                type="text"
                value={governance?.staffing_oversight?.hiring_authority || ''}
                onChange={(e) =>
                  onChange({
                    ...governance,
                    staffing_oversight: { ...governance.staffing_oversight, hiring_authority: e.target.value },
                  })
                }
                className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none"
                placeholder="Who has hiring/firing authority for shared staff"
              />
              <input
                type="text"
                value={governance?.staffing_oversight?.compensation_decisions || ''}
                onChange={(e) =>
                  onChange({
                    ...governance,
                    staffing_oversight: { ...governance.staffing_oversight, compensation_decisions: e.target.value },
                  })
                }
                className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none"
                placeholder="Who determines salaries and benefits"
              />
              <input
                type="text"
                value={governance?.staffing_oversight?.performance_oversight || ''}
                onChange={(e) =>
                  onChange({
                    ...governance,
                    staffing_oversight: { ...governance.staffing_oversight, performance_oversight: e.target.value },
                  })
                }
                className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none"
                placeholder="Who evaluates staff performance"
              />
              <textarea
                value={governance?.staffing_oversight?.union_implications || ''}
                onChange={(e) =>
                  onChange({
                    ...governance,
                    staffing_oversight: { ...governance.staffing_oversight, union_implications: e.target.value },
                  })
                }
                className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none"
                rows="2"
                placeholder="Any union contract complications"
              />
            </div>
          </div>

          {/* Rationales */}
          <div className="border-t border-slate-200 pt-4 space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Operational Rationale</label>
              <textarea
                value={governance?.operational_rationale || ''}
                onChange={(e) => onChange({ ...governance, operational_rationale: e.target.value })}
                className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none"
                rows="2"
                placeholder="Why this governance structure makes operational sense"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Governance Rationale</label>
              <textarea
                value={governance?.governance_rationale || ''}
                onChange={(e) => onChange({ ...governance, governance_rationale: e.target.value })}
                className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none"
                rows="2"
                placeholder="How governance serves Machias and regional fairness"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Financial Rationale</label>
              <textarea
                value={governance?.financial_rationale || ''}
                onChange={(e) => onChange({ ...governance, financial_rationale: e.target.value })}
                className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none"
                rows="2"
                placeholder="Financial justification for cost sharing arrangement"
              />
            </div>
          </div>

          {/* Partner Withdrawal Risks */}
          <div className="border-t border-slate-200 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-900">Partner Withdrawal Risks</h4>
              <button
                onClick={() => addRisk('partner_withdrawal_risks')}
                className="p-1 text-slate-500 hover:text-slate-700 transition-colors"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
            <div className="space-y-2">
              {(governance?.partner_withdrawal_risks || []).map((risk, idx) => (
                <div key={idx} className="space-y-2 p-3 bg-white rounded-lg border border-slate-200">
                  <textarea
                    value={risk.risk || ''}
                    onChange={(e) => updateRisk('partner_withdrawal_risks', idx, { risk: e.target.value })}
                    className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded focus:outline-none"
                    rows="1"
                    placeholder="What happens if partner withdraws"
                  />
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Impact</label>
                      <select
                        value={risk.impact_on_machias || ''}
                        onChange={(e) => updateRisk('partner_withdrawal_risks', idx, { impact_on_machias: e.target.value })}
                        className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded focus:outline-none"
                      >
                        <option value="">Select...</option>
                        <option value="minimal">Minimal</option>
                        <option value="moderate">Moderate</option>
                        <option value="severe">Severe</option>
                      </select>
                    </div>
                    <button
                      onClick={() => removeRisk('partner_withdrawal_risks', idx)}
                      className="p-1 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                  <textarea
                    value={risk.mitigation || ''}
                    onChange={(e) => updateRisk('partner_withdrawal_risks', idx, { mitigation: e.target.value })}
                    className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded focus:outline-none"
                    rows="2"
                    placeholder="How to mitigate this risk"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Implementation Risks */}
          <div className="border-t border-slate-200 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-900">Implementation Risks</h4>
              <button
                onClick={() => addRisk('implementation_risks')}
                className="p-1 text-slate-500 hover:text-slate-700 transition-colors"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
            <div className="space-y-2">
              {(governance?.implementation_risks || []).map((risk, idx) => (
                <div key={idx} className="space-y-2 p-3 bg-white rounded-lg border border-slate-200">
                  <textarea
                    value={risk.risk || ''}
                    onChange={(e) => updateRisk('implementation_risks', idx, { risk: e.target.value })}
                    className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded focus:outline-none"
                    rows="1"
                    placeholder="Risk description"
                  />
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Probability</label>
                      <select
                        value={risk.probability || ''}
                        onChange={(e) => updateRisk('implementation_risks', idx, { probability: e.target.value })}
                        className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded focus:outline-none"
                      >
                        <option value="">Select...</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                    <button
                      onClick={() => removeRisk('implementation_risks', idx)}
                      className="p-1 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                  <textarea
                    value={risk.mitigation || ''}
                    onChange={(e) => updateRisk('implementation_risks', idx, { mitigation: e.target.value })}
                    className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded focus:outline-none"
                    rows="2"
                    placeholder="Mitigation strategy"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Terms */}
          <div className="border-t border-slate-200 pt-4 space-y-3">
            <textarea
              value={governance?.termination_provisions || ''}
              onChange={(e) => onChange({ ...governance, termination_provisions: e.target.value })}
              className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none"
              rows="2"
              placeholder="Termination Provisions - How and when the agreement can be ended"
            />
            <textarea
              value={governance?.amendment_process || ''}
              onChange={(e) => onChange({ ...governance, amendment_process: e.target.value })}
              className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none"
              rows="2"
              placeholder="Amendment Process - How the agreement can be modified"
            />
          </div>

          {/* Notes */}
          <div className="border-t border-slate-200 pt-4">
            <textarea
              value={governance?.notes || ''}
              onChange={(e) => onChange({ ...governance, notes: e.target.value })}
              className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none"
              rows="2"
              placeholder="General notes"
            />
          </div>
        </div>
      )}
    </div>
  );
}