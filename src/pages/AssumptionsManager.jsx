import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ChevronDown, ChevronUp, Check, AlertCircle, Trash2 } from 'lucide-react';
import SectionHeader from '@/components/machias/SectionHeader';

const AssumptionCategory = ({ title, assumptions, onChange, readOnly = false }) => {
  const [expanded, setExpanded] = useState(false);

  const handleChange = (key, value) => {
    if (!readOnly) {
      onChange({ ...assumptions, [key]: value });
    }
  };

  const entries = Object.entries(assumptions || {}).filter(([k]) => k !== 'notes');

  return (
    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
      >
        <h3 className="font-bold text-slate-900">{title}</h3>
        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {expanded && (
        <div className="border-t border-slate-200 p-4 space-y-3 bg-slate-50">
          {entries.map(([key, value]) => (
            <div key={key} className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
              <label className="text-sm font-semibold text-slate-700">
                {key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
              </label>
              <div>
                {typeof value === 'boolean' ? (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => handleChange(key, e.target.checked)}
                      disabled={readOnly}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-slate-700">{value ? 'Yes' : 'No'}</span>
                  </label>
                ) : typeof value === 'number' ? (
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => handleChange(key, parseFloat(e.target.value))}
                    disabled={readOnly}
                    step="0.01"
                    className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none disabled:bg-slate-100"
                  />
                ) : (
                  <input
                    type="text"
                    value={value || ''}
                    onChange={(e) => handleChange(key, e.target.value)}
                    disabled={readOnly}
                    className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none disabled:bg-slate-100"
                  />
                )}
              </div>
            </div>
          ))}
          {assumptions?.notes && (
            <div className="p-2 bg-blue-50 rounded border border-blue-200">
              <p className="text-xs text-blue-700">
                <span className="font-bold">Notes: </span>{assumptions.notes}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default function AssumptionsManager() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState(null);
  const [editData, setEditData] = useState(null);
  const [showWarning, setShowWarning] = useState(false);
  const [affectedItems, setAffectedItems] = useState([]);

  const { data: assumptionSets = [] } = useQuery({
    queryKey: ['assumptionSets'],
    queryFn: () => base44.entities.AssumptionSet.list('-last_modified', 50),
  });

  const { data: scenarios = [] } = useQuery({
    queryKey: ['scenarios'],
    queryFn: () => base44.entities.Scenario.list('-created_date', 100),
  });

  const { data: proposals = [] } = useQuery({
    queryKey: ['proposals'],
    queryFn: () => base44.entities.Proposal.list('-created_date', 100),
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.AssumptionSet.update(selectedId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assumptionSets'] });
      setShowWarning(false);
      setEditData(null);
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.AssumptionSet.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assumptionSets'] });
      setEditData(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.AssumptionSet.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assumptionSets'] });
      setSelectedId(null);
    },
  });

  const selected = selectedId ? assumptionSets.find((a) => a.id === selectedId) : null;

  const handleSelectSet = (id) => {
    setSelectedId(id);
    setEditData(assumptionSets.find((a) => a.id === id));
  };

  const handleSave = () => {
    if (selectedId) {
      updateMutation.mutate(editData);
    } else {
      createMutation.mutate({ ...editData, status: 'draft' });
    }
  };

  const countAffected = (field) => {
    const count =
      scenarios.filter((s) => {
        if (!s.staffing_assumptions) return false;
        return JSON.stringify(s.staffing_assumptions).includes(field);
      }).length +
      proposals.filter((p) => {
        if (!p.staffing_implications) return false;
        return JSON.stringify(p.staffing_implications).includes(field);
      }).length;
    return count;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <SectionHeader
        title="Assumptions Manager"
        subtitle="Centralize and track all strategic planning assumptions used across scenarios and proposals"
      />

      {/* Assumption Sets List */}
      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
        <div className="bg-slate-900 text-white px-4 py-3">
          <h3 className="font-bold">Assumption Sets</h3>
        </div>
        <div className="divide-y divide-slate-200">
          {assumptionSets.length === 0 ? (
            <div className="p-4 text-center text-slate-600">
              <p className="text-sm">No assumption sets created yet</p>
              <button
                onClick={() => setEditData({})}
                className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                Create First Set
              </button>
            </div>
          ) : (
            assumptionSets.map((set) => (
              <button
                key={set.id}
                onClick={() => handleSelectSet(set.id)}
                className={`w-full text-left p-4 hover:bg-slate-50 transition-colors flex items-start justify-between ${
                  selectedId === set.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-slate-900">{set.name}</h4>
                    {set.is_active && (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-bold">
                        Active
                      </span>
                    )}
                  </div>
                  {set.description && <p className="text-xs text-slate-600 mt-1">{set.description}</p>}
                </div>
                <div className="text-right text-xs text-slate-500">
                  <p>{set.status}</p>
                </div>
              </button>
            ))
          )}
        </div>
        {!editData && (
          <div className="border-t border-slate-200 p-4 bg-slate-50">
            <button
              onClick={() => setEditData({})}
              className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors"
            >
              + New Assumption Set
            </button>
          </div>
        )}
      </div>

      {/* Edit Panel */}
      {editData && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">
            {selectedId ? 'Edit Assumption Set' : 'Create New Assumption Set'}
          </h3>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Name</label>
              <input
                type="text"
                value={editData.name || ''}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none"
                placeholder="e.g., Base Case 2026"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
              <textarea
                value={editData.description || ''}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none"
                rows="2"
                placeholder="Rationale and context for this assumption set"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={editData.is_active || false}
                onChange={(e) => setEditData({ ...editData, is_active: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm font-semibold text-slate-700">Set as active assumption set</span>
            </label>
          </div>

          {/* Category Editors */}
          <div className="space-y-4 mb-6">
            <AssumptionCategory
              title="Salary Assumptions"
              assumptions={editData.salary_assumptions || {}}
              onChange={(data) => setEditData({ ...editData, salary_assumptions: data })}
            />
            <AssumptionCategory
              title="Benefit Assumptions"
              assumptions={editData.benefit_assumptions || {}}
              onChange={(data) => setEditData({ ...editData, benefit_assumptions: data })}
            />
            <AssumptionCategory
              title="Inflation Assumptions"
              assumptions={editData.inflation_assumptions || {}}
              onChange={(data) => setEditData({ ...editData, inflation_assumptions: data })}
            />
            <AssumptionCategory
              title="Service Demand Assumptions"
              assumptions={editData.service_demand_assumptions || {}}
              onChange={(data) => setEditData({ ...editData, service_demand_assumptions: data })}
            />
            <AssumptionCategory
              title="Tax Base Assumptions"
              assumptions={editData.tax_base_assumptions || {}}
              onChange={(data) => setEditData({ ...editData, tax_base_assumptions: data })}
            />
            <AssumptionCategory
              title="Grant Assumptions"
              assumptions={editData.grant_assumptions || {}}
              onChange={(data) => setEditData({ ...editData, grant_assumptions: data })}
            />
            <AssumptionCategory
              title="Regional Revenue Assumptions"
              assumptions={editData.regional_revenue_assumptions || {}}
              onChange={(data) => setEditData({ ...editData, regional_revenue_assumptions: data })}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4 border-t border-blue-200">
            <button
              onClick={handleSave}
              disabled={updateMutation.isPending || createMutation.isPending}
              className="px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              Save Changes
            </button>
            <button
              onClick={() => {
                setEditData(null);
                setSelectedId(null);
              }}
              className="px-4 py-2 bg-slate-200 text-slate-900 text-sm font-bold rounded-lg hover:bg-slate-300 transition-colors"
            >
              Cancel
            </button>
            {selectedId && (
              <button
                onClick={() => {
                  if (confirm('Delete this assumption set? This cannot be undone.')) {
                    deleteMutation.mutate(selectedId);
                  }
                }}
                className="ml-auto px-4 py-2 text-red-600 hover:text-red-700 font-bold text-sm"
              >
                <Trash2 className="h-4 w-4 inline mr-1" />
                Delete
              </button>
            )}
          </div>

          {/* Impact Warning */}
          {selectedId && (
            <div className="mt-4 p-3 bg-amber-100 rounded border border-amber-300">
              <p className="text-xs text-amber-800 font-semibold flex items-center gap-2">
                <AlertCircle className="h-3 w-3" />
                Changes to this assumption set will affect {countAffected('assumption')} active scenarios and proposals
              </p>
            </div>
          )}
        </div>
      )}

      {/* Usage Reference */}
      {!editData && (
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h3 className="font-bold text-slate-900 mb-4">Assumption Usage Reference</h3>
          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                <p className="font-bold text-slate-900 mb-2">Scenarios Using Active Assumptions</p>
                <p className="text-slate-700">{scenarios.length} total scenarios</p>
                <p className="text-slate-600 mt-1">{scenarios.filter((s) => s.is_active).length} currently active</p>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                <p className="font-bold text-slate-900 mb-2">Proposals Using Active Assumptions</p>
                <p className="text-slate-700">{proposals.length} total proposals</p>
                <p className="text-slate-600 mt-1">{proposals.filter((p) => p.status === 'approved').length} approved</p>
              </div>
            </div>

            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="font-bold text-blue-900 mb-2">Best Practices</p>
              <ul className="space-y-1 text-blue-800">
                <li>• Create separate assumption sets for each planning scenario</li>
                <li>• Mark conservative and aggressive sets explicitly in the name</li>
                <li>• Document rationale in the description field</li>
                <li>• Update assumptions annually before budget planning</li>
                <li>• Archive old assumption sets rather than deleting</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}