import React, { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

export default function RiskProfileEditor({ riskProfile, onChange }) {
  const [expandedRisk, setExpandedRisk] = useState(null);
  const [expandedDep, setExpandedDep] = useState(null);

  const addRisk = () => {
    const risks = riskProfile?.risks || [];
    risks.push({ id: `risk_${Date.now()}` });
    onChange({ ...riskProfile, risks });
  };

  const updateRisk = (idx, field, value) => {
    const risks = [...(riskProfile?.risks || [])];
    risks[idx] = { ...risks[idx], [field]: value };
    onChange({ ...riskProfile, risks });
  };

  const addMitigationAction = (riskIdx) => {
    const risks = [...(riskProfile?.risks || [])];
    if (!risks[riskIdx].mitigation_actions) risks[riskIdx].mitigation_actions = [];
    risks[riskIdx].mitigation_actions.push({});
    onChange({ ...riskProfile, risks });
  };

  const updateMitigationAction = (riskIdx, actionIdx, field, value) => {
    const risks = [...(riskProfile?.risks || [])];
    risks[riskIdx].mitigation_actions[actionIdx] = { ...risks[riskIdx].mitigation_actions[actionIdx], [field]: value };
    onChange({ ...riskProfile, risks });
  };

  const removeMitigationAction = (riskIdx, actionIdx) => {
    const risks = [...(riskProfile?.risks || [])];
    risks[riskIdx].mitigation_actions.splice(actionIdx, 1);
    onChange({ ...riskProfile, risks });
  };

  const removeRisk = (idx) => {
    const risks = (riskProfile?.risks || []).filter((_, i) => i !== idx);
    onChange({ ...riskProfile, risks });
  };

  const addFallbackOption = (riskIdx) => {
    const risks = [...(riskProfile?.risks || [])];
    if (!risks[riskIdx].fallback_options) risks[riskIdx].fallback_options = [];
    risks[riskIdx].fallback_options.push({});
    onChange({ ...riskProfile, risks });
  };

  const updateFallbackOption = (riskIdx, optIdx, field, value) => {
    const risks = [...(riskProfile?.risks || [])];
    risks[riskIdx].fallback_options[optIdx] = { ...risks[riskIdx].fallback_options[optIdx], [field]: value };
    onChange({ ...riskProfile, risks });
  };

  const removeFallbackOption = (riskIdx, optIdx) => {
    const risks = [...(riskProfile?.risks || [])];
    risks[riskIdx].fallback_options.splice(optIdx, 1);
    onChange({ ...riskProfile, risks });
  };

  const addDependency = () => {
    const deps = riskProfile?.dependencies || [];
    deps.push({});
    onChange({ ...riskProfile, dependencies: deps });
  };

  const updateDependency = (idx, field, value) => {
    const deps = [...(riskProfile?.dependencies || [])];
    deps[idx] = { ...deps[idx], [field]: value };
    onChange({ ...riskProfile, dependencies: deps });
  };

  const removeDependency = (idx) => {
    const deps = (riskProfile?.dependencies || []).filter((_, i) => i !== idx);
    onChange({ ...riskProfile, dependencies: deps });
  };

  return (
    <div className="space-y-6">
      {/* Overall Risk Settings */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="font-bold text-slate-900 mb-4">Risk Management Settings</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Risk Owner</label>
              <input
                type="text"
                value={riskProfile?.risk_owner || ''}
                onChange={(e) => onChange({ ...riskProfile, risk_owner: e.target.value })}
                className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none"
                placeholder="Name of person accountable"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Risk Tolerance</label>
              <select
                value={riskProfile?.risk_tolerance || 'moderate'}
                onChange={(e) => onChange({ ...riskProfile, risk_tolerance: e.target.value })}
                className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none"
              >
                <option value="low">Low</option>
                <option value="moderate">Moderate</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Review Frequency</label>
            <select
              value={riskProfile?.review_frequency || 'quarterly'}
              onChange={(e) => onChange({ ...riskProfile, review_frequency: e.target.value })}
              className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none"
            >
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="annually">Annually</option>
            </select>
          </div>
        </div>
      </div>

      {/* Risks */}
      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
        <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
          <h3 className="font-bold">Identified Risks</h3>
          <button
            onClick={addRisk}
            className="p-1 text-slate-300 hover:text-white transition-colors"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <div className="divide-y divide-slate-200">
          {(riskProfile?.risks || []).map((risk, idx) => (
            <div key={risk.id || idx} className="p-4">
              {/* Risk Header */}
              <button
                onClick={() => setExpandedRisk(expandedRisk === idx ? null : idx)}
                className="w-full flex items-start justify-between hover:bg-slate-50 p-2 -m-2 rounded transition-colors"
              >
                <div className="text-left flex-1">
                  <input
                    type="text"
                    value={risk.title || ''}
                    onChange={(e) => updateRisk(idx, 'title', e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full font-bold text-sm text-slate-900 border-b border-transparent hover:border-slate-300 focus:outline-none"
                    placeholder="Risk title"
                  />
                  <div className="flex gap-2 mt-2">
                    <select
                      value={risk.category || ''}
                      onChange={(e) => updateRisk(idx, 'category', e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs border border-slate-200 rounded px-2 py-1 focus:outline-none"
                    >
                      <option value="">Category...</option>
                      <option value="financial">Financial</option>
                      <option value="operational">Operational</option>
                      <option value="staffing">Staffing</option>
                      <option value="governance">Governance</option>
                      <option value="legal">Legal</option>
                      <option value="public_acceptance">Public Acceptance</option>
                      <option value="partner_participation">Partner Participation</option>
                    </select>
                    <select
                      value={risk.likelihood || ''}
                      onChange={(e) => updateRisk(idx, 'likelihood', e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs border border-slate-200 rounded px-2 py-1 focus:outline-none"
                    >
                      <option value="">Likelihood...</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                    <select
                      value={risk.severity || ''}
                      onChange={(e) => updateRisk(idx, 'severity', e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs border border-slate-200 rounded px-2 py-1 focus:outline-none"
                    >
                      <option value="">Severity...</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {expandedRisk === idx ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  <button
                    onClick={(e) => { e.stopPropagation(); removeRisk(idx); }}
                    className="p-1 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </button>

              {/* Expanded Details */}
              {expandedRisk === idx && (
                <div className="mt-4 pt-4 border-t border-slate-200 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Description</label>
                    <textarea
                      value={risk.description || ''}
                      onChange={(e) => updateRisk(idx, 'description', e.target.value)}
                      className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded focus:outline-none"
                      rows="2"
                      placeholder="Detailed risk description"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Monitoring Indicator</label>
                    <input
                      type="text"
                      value={risk.monitoring_indicator || ''}
                      onChange={(e) => updateRisk(idx, 'monitoring_indicator', e.target.value)}
                      className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded focus:outline-none"
                      placeholder="What to monitor to detect this risk early"
                    />
                  </div>

                  {/* Mitigation Actions */}
                  <div className="pt-2 border-t border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold text-slate-700">Mitigation Actions</p>
                      <button
                        onClick={() => addMitigationAction(idx)}
                        className="text-xs text-blue-600 hover:text-blue-700 font-bold"
                      >
                        + Add
                      </button>
                    </div>
                    <div className="space-y-2">
                      {(risk.mitigation_actions || []).map((action, aidx) => (
                        <div key={aidx} className="p-2 bg-slate-50 rounded border border-slate-200 space-y-1">
                          <input
                            type="text"
                            value={action.action || ''}
                            onChange={(e) => updateMitigationAction(idx, aidx, 'action', e.target.value)}
                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:outline-none"
                            placeholder="Mitigation action"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={action.owner || ''}
                              onChange={(e) => updateMitigationAction(idx, aidx, 'owner', e.target.value)}
                              className="px-2 py-1 text-xs border border-slate-200 rounded focus:outline-none"
                              placeholder="Owner"
                            />
                            <input
                              type="text"
                              value={action.timeline || ''}
                              onChange={(e) => updateMitigationAction(idx, aidx, 'timeline', e.target.value)}
                              className="px-2 py-1 text-xs border border-slate-200 rounded focus:outline-none"
                              placeholder="Timeline"
                            />
                          </div>
                          <button
                            onClick={() => removeMitigationAction(idx, aidx)}
                            className="text-xs text-red-600 hover:text-red-700 font-bold"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Fallback Options */}
                  <div className="pt-2 border-t border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold text-slate-700">Fallback Options</p>
                      <button
                        onClick={() => addFallbackOption(idx)}
                        className="text-xs text-blue-600 hover:text-blue-700 font-bold"
                      >
                        + Add
                      </button>
                    </div>
                    <div className="space-y-2">
                      {(risk.fallback_options || []).map((option, oidx) => (
                        <div key={oidx} className="p-2 bg-slate-50 rounded border border-slate-200 space-y-1">
                          <input
                            type="text"
                            value={option.option || ''}
                            onChange={(e) => updateFallbackOption(idx, oidx, 'option', e.target.value)}
                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:outline-none"
                            placeholder="Fallback option"
                          />
                          <textarea
                            value={option.impact_on_proposal || ''}
                            onChange={(e) => updateFallbackOption(idx, oidx, 'impact_on_proposal', e.target.value)}
                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:outline-none"
                            rows="1"
                            placeholder="Impact on original proposal"
                          />
                          <input
                            type="number"
                            value={option.additional_cost || ''}
                            onChange={(e) => updateFallbackOption(idx, oidx, 'additional_cost', parseFloat(e.target.value))}
                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:outline-none"
                            placeholder="Additional cost"
                          />
                          <button
                            onClick={() => removeFallbackOption(idx, oidx)}
                            className="text-xs text-red-600 hover:text-red-700 font-bold"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Dependencies */}
      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
        <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
          <h3 className="font-bold">Dependencies</h3>
          <button
            onClick={addDependency}
            className="p-1 text-slate-300 hover:text-white transition-colors"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <div className="divide-y divide-slate-200">
          {(riskProfile?.dependencies || []).map((dep, idx) => (
            <div key={idx} className="p-4 space-y-3">
              <input
                type="text"
                value={dep.dependency_on || ''}
                onChange={(e) => updateDependency(idx, 'dependency_on', e.target.value)}
                className="w-full px-2 py-1.5 text-sm font-bold border border-slate-200 rounded focus:outline-none"
                placeholder="What this proposal depends on"
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <select
                  value={dep.type || ''}
                  onChange={(e) => updateDependency(idx, 'type', e.target.value)}
                  className="text-xs border border-slate-200 rounded px-2 py-1.5 focus:outline-none"
                >
                  <option value="">Type...</option>
                  <option value="proposal">Other Proposal</option>
                  <option value="other_initiative">Other Initiative</option>
                  <option value="external_factor">External Factor</option>
                  <option value="policy_decision">Policy Decision</option>
                  <option value="infrastructure">Infrastructure</option>
                </select>
                <select
                  value={dep.criticality || ''}
                  onChange={(e) => updateDependency(idx, 'criticality', e.target.value)}
                  className="text-xs border border-slate-200 rounded px-2 py-1.5 focus:outline-none"
                >
                  <option value="">Criticality...</option>
                  <option value="must_have">Must Have</option>
                  <option value="preferred">Preferred</option>
                  <option value="nice_to_have">Nice to Have</option>
                </select>
                <input
                  type="text"
                  value={dep.timeline || ''}
                  onChange={(e) => updateDependency(idx, 'timeline', e.target.value)}
                  className="text-xs border border-slate-200 rounded px-2 py-1.5 focus:outline-none"
                  placeholder="When needed"
                />
              </div>
              <textarea
                value={dep.contingency || ''}
                onChange={(e) => updateDependency(idx, 'contingency', e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded focus:outline-none"
                rows="1"
                placeholder="What if this dependency cannot be met"
              />
              <button
                onClick={() => removeDependency(idx)}
                className="text-xs text-red-600 hover:text-red-700 font-bold"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* General Notes */}
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-2">Risk Register Notes</label>
        <textarea
          value={riskProfile?.risk_register_notes || ''}
          onChange={(e) => onChange({ ...riskProfile, risk_register_notes: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none"
          rows="3"
          placeholder="General observations and notes"
        />
      </div>
    </div>
  );
}