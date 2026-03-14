import React, { useState } from 'react';
import DepartmentModelSelector from './DepartmentModelSelector';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function DepartmentRestructuringPanel({ department, onChange }) {
  const [expanded, setExpanded] = useState(false);

  const budgetChange = (department.proposed_budget || 0) - (department.current_budget || 0);
  const fteChange = (department.proposed_fte || 0) - (department.current_fte || 0);
  const taxImpact = department.tax_impact_annual || 0;

  const getModelColor = (model) => {
    const colors = {
      current_structure: 'bg-slate-100 text-slate-700',
      expanded_staffing: 'bg-emerald-100 text-emerald-700',
      reduced_staffing: 'bg-amber-100 text-amber-700',
      shared_service: 'bg-blue-100 text-blue-700',
      regional_delivery: 'bg-purple-100 text-purple-700',
      outsourced: 'bg-red-100 text-red-700',
    };
    return colors[model] || 'bg-slate-100 text-slate-700';
  };

  const getModelLabel = (model) => {
    const labels = {
      current_structure: 'Current',
      expanded_staffing: 'Expanded',
      reduced_staffing: 'Reduced',
      shared_service: 'Shared',
      regional_delivery: 'Regional',
      outsourced: 'Outsourced',
    };
    return labels[model] || model;
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
      >
        <div className="flex-1 text-left">
          <h3 className="text-sm font-bold text-slate-900">{department.department_name}</h3>
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-[10px] font-bold px-2 py-1 rounded ${getModelColor(department.proposed_model || department.current_model)}`}>
              {getModelLabel(department.proposed_model || department.current_model)}
            </span>
            {fteChange !== 0 && (
              <span className={`text-[10px] font-bold px-2 py-1 rounded ${fteChange > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                {fteChange > 0 ? '+' : ''}{fteChange} FTE
              </span>
            )}
            {budgetChange !== 0 && (
              <span className={`text-[10px] font-bold px-2 py-1 rounded ${budgetChange > 0 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                {budgetChange > 0 ? '+' : ''}${(budgetChange / 1000).toFixed(0)}k
              </span>
            )}
          </div>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t border-slate-200 p-4 space-y-6 bg-slate-50">
          {/* Model Selection */}
          <div>
            <DepartmentModelSelector
              value={department.proposed_model || department.current_model}
              onChange={(model) => onChange({ ...department, proposed_model: model })}
            />
          </div>

          {/* Staffing */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Current FTE</label>
              <input
                type="number"
                value={department.current_fte || ''}
                onChange={(e) => onChange({ ...department, current_fte: parseFloat(e.target.value) })}
                className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:border-slate-400 focus:outline-none"
                step="0.5"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Proposed FTE</label>
              <input
                type="number"
                value={department.proposed_fte || ''}
                onChange={(e) => onChange({ ...department, proposed_fte: parseFloat(e.target.value) })}
                className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:border-slate-400 focus:outline-none"
                step="0.5"
              />
            </div>
          </div>

          {/* Budget */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Current Budget</label>
              <input
                type="number"
                value={department.current_budget || ''}
                onChange={(e) => onChange({ ...department, current_budget: parseFloat(e.target.value) })}
                className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:border-slate-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Proposed Budget</label>
              <input
                type="number"
                value={department.proposed_budget || ''}
                onChange={(e) => onChange({ ...department, proposed_budget: parseFloat(e.target.value) })}
                className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:border-slate-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Workload */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Workload Metric (e.g., "calls per year")</label>
            <input
              type="text"
              value={department.workload_metric || ''}
              onChange={(e) => onChange({ ...department, workload_metric: e.target.value })}
              className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:border-slate-400 focus:outline-none"
              placeholder="e.g., Calls, Tonnage, Population"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Current</label>
              <input
                type="number"
                value={department.current_workload || ''}
                onChange={(e) => onChange({ ...department, current_workload: parseFloat(e.target.value) })}
                className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:border-slate-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Projected</label>
              <input
                type="number"
                value={department.projected_workload || ''}
                onChange={(e) => onChange({ ...department, projected_workload: parseFloat(e.target.value) })}
                className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:border-slate-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Growth Rate %</label>
              <input
                type="number"
                value={(department.workload_growth_rate || 0) * 100}
                onChange={(e) => onChange({ ...department, workload_growth_rate: parseFloat(e.target.value) / 100 })}
                className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:border-slate-400 focus:outline-none"
                step="0.1"
              />
            </div>
          </div>

          {/* Service Impact */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Service Impact Level</label>
            <div className="flex gap-2">
              {['positive', 'neutral', 'negative'].map((level) => (
                <button
                  key={level}
                  onClick={() => onChange({ ...department, service_impact_level: level })}
                  className={`flex-1 px-2 py-1.5 text-xs font-bold rounded-lg border-2 transition-all ${
                    department.service_impact_level === level
                      ? level === 'positive'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                        : level === 'negative'
                        ? 'border-red-600 bg-red-50 text-red-700'
                        : 'border-slate-600 bg-slate-100 text-slate-700'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  {level === 'positive' ? '✓' : level === 'negative' ? '✗' : '○'} {level}
                </button>
              ))}
            </div>
          </div>

          {/* Descriptions */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Staffing Rationale</label>
            <textarea
              value={department.staffing_rationale || ''}
              onChange={(e) => onChange({ ...department, staffing_rationale: e.target.value })}
              className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:border-slate-400 focus:outline-none"
              rows="2"
              placeholder="Why are these staffing changes needed?"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Service Impact Description</label>
            <textarea
              value={department.service_impact_description || ''}
              onChange={(e) => onChange({ ...department, service_impact_description: e.target.value })}
              className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:border-slate-400 focus:outline-none"
              rows="2"
              placeholder="How does this change affect service delivery?"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Leadership Capacity Impact</label>
            <input
              type="text"
              value={department.leadership_capacity_change || ''}
              onChange={(e) => onChange({ ...department, leadership_capacity_change: e.target.value })}
              className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:border-slate-400 focus:outline-none"
              placeholder="e.g., '5 hours/week freed for strategic planning'"
            />
          </div>

          {/* Tax Impact */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Tax Impact (Annual $)</label>
            <input
              type="number"
              value={department.tax_impact_annual || ''}
              onChange={(e) => onChange({ ...department, tax_impact_annual: parseFloat(e.target.value) })}
              className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:border-slate-400 focus:outline-none"
              placeholder="Annual impact on municipal tax levy"
            />
          </div>

          {/* Implementation */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Implementation Timeline</label>
            <input
              type="text"
              value={department.implementation_timeline || ''}
              onChange={(e) => onChange({ ...department, implementation_timeline: e.target.value })}
              className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:border-slate-400 focus:outline-none"
              placeholder="e.g., 'Q2 2026', 'Fiscal Year 2027'"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Notes</label>
            <textarea
              value={department.notes || ''}
              onChange={(e) => onChange({ ...department, notes: e.target.value })}
              className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:border-slate-400 focus:outline-none"
              rows="2"
              placeholder="Additional planning notes and considerations"
            />
          </div>
        </div>
      )}
    </div>
  );
}