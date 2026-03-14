import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useModel } from './ModelContext';
import { Copy, Plus, Trash2, Edit2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ScenarioManager() {
  const { settings, updateSettings } = useModel();
  const [scenarios, setScenarios] = useState([]);
  const [activeScenarioId, setActiveScenarioId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingScenario, setEditingScenario] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load scenarios
  useEffect(() => {
    base44.entities.Scenario.list().then(data => {
      setScenarios(data || []);
      const active = data?.find(s => s.is_active);
      if (active) setActiveScenarioId(active.id);
      setLoading(false);
    });
  }, []);

  const handleCreateScenario = async (templateType = null) => {
    const baseScenario = {
      name: templateType ? `${templateType.charAt(0).toUpperCase() + templateType.slice(1)} Scenario` : 'New Scenario',
      type: templateType || 'custom',
      description: '',
      is_active: false,
      is_baseline: false,
      staffing_assumptions: {
        y1_staffing_model: settings.y1_staffing_model || 'fulltime_sa',
        y5_senior_hire: settings.y5_senior_hire || 'staff_accountant',
        police_admin_enabled: settings.police_admin_enabled || false,
        regional_services_enabled: true,
      },
      financial_assumptions: {
        wage_growth_rate: settings.wage_growth_rate || 0.04,
        health_tier: settings.health_tier || 'family',
        transport_growth_rate: settings.transport_growth_rate || 0.02,
        inhouse_collection_rate: settings.inhouse_steady_rate || 0.9,
      },
      operational_assumptions: {
        erp_implementation: true,
        transfer_station_expansion: true,
        ems_external_billing: true,
      },
      risks: [],
      recommendations: [],
      created_from_template: !!templateType,
    };

    const created = await base44.entities.Scenario.create(baseScenario);
    setScenarios([...scenarios, created]);
  };

  const handleDuplicateScenario = async (scenario) => {
    const duplicate = {
      ...scenario,
      id: undefined,
      name: `${scenario.name} (Copy)`,
      is_active: false,
      parent_scenario_id: scenario.id,
    };
    const created = await base44.entities.Scenario.create(duplicate);
    setScenarios([...scenarios, created]);
  };

  const handleActivateScenario = async (scenarioId) => {
    // Deactivate all others
    await Promise.all(
      scenarios
        .filter(s => s.is_active)
        .map(s => base44.entities.Scenario.update(s.id, { is_active: false }))
    );

    // Activate selected
    await base44.entities.Scenario.update(scenarioId, { is_active: true });

    // Update local state
    setScenarios(scenarios.map(s => ({
      ...s,
      is_active: s.id === scenarioId,
    })));
    setActiveScenarioId(scenarioId);

    // Load scenario into model
    const scenario = scenarios.find(s => s.id === scenarioId);
    if (scenario?.staffing_assumptions) {
      await updateSettings({
        y1_staffing_model: scenario.staffing_assumptions.y1_staffing_model,
        y5_senior_hire: scenario.staffing_assumptions.y5_senior_hire,
        police_admin_enabled: scenario.staffing_assumptions.police_admin_enabled,
      });
    }
    if (scenario?.financial_assumptions) {
      await updateSettings({
        wage_growth_rate: scenario.financial_assumptions.wage_growth_rate,
        health_tier: scenario.financial_assumptions.health_tier,
        transport_growth_rate: scenario.financial_assumptions.transport_growth_rate,
      });
    }
  };

  const handleDeleteScenario = async (scenarioId) => {
    if (window.confirm('Delete this scenario?')) {
      await base44.entities.Scenario.delete(scenarioId);
      setScenarios(scenarios.filter(s => s.id !== scenarioId));
    }
  };

  const handleSaveScenario = async (updates) => {
    if (editingScenario) {
      await base44.entities.Scenario.update(editingScenario.id, updates);
      setScenarios(scenarios.map(s => s.id === editingScenario.id ? { ...s, ...updates } : s));
    }
    setEditingScenario(null);
  };

  if (loading) return <div className="text-sm text-slate-500">Loading scenarios...</div>;

  const activeScenario = scenarios.find(s => s.is_active);

  return (
    <div className="space-y-4">
      {/* Active Scenario Badge */}
      {activeScenario && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <div>
                <p className="text-xs font-semibold text-emerald-900 uppercase">Active Scenario</p>
                <p className="text-sm font-bold text-emerald-900">{activeScenario.name}</p>
              </div>
            </div>
            <button
              onClick={() => setEditingScenario(activeScenario)}
              className="text-emerald-600 hover:text-emerald-800 text-xs font-medium"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Scenario List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-700 uppercase">All Scenarios</h4>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-400 rounded px-2 py-1 transition-all"
          >
            <Plus className="h-3 w-3" />
            New
          </button>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white divide-y">
          {scenarios.map(scenario => (
            <div
              key={scenario.id}
              className={`p-3 flex items-center justify-between hover:bg-slate-50 ${scenario.is_active ? 'bg-slate-50' : ''}`}
            >
              <div
                onClick={() => !scenario.is_active && handleActivateScenario(scenario.id)}
                className={`flex-1 cursor-pointer ${scenario.is_active ? 'pointer-events-none' : ''}`}
              >
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${scenario.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  <span className={`text-sm font-medium ${scenario.is_active ? 'text-slate-900' : 'text-slate-700'}`}>
                    {scenario.name}
                  </span>
                  <span className="text-[10px] text-slate-500">{scenario.type}</span>
                  {scenario.is_baseline && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">BASELINE</span>}
                </div>
                {scenario.description && (
                  <p className="text-xs text-slate-500 mt-1">{scenario.description}</p>
                )}
              </div>

              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => handleDuplicateScenario(scenario)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                  title="Duplicate scenario"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setEditingScenario(scenario)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                  title="Edit scenario"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
                {!scenario.is_baseline && (
                  <button
                    onClick={() => handleDeleteScenario(scenario.id)}
                    className="text-slate-400 hover:text-red-600 p-1"
                    title="Delete scenario"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Template buttons */}
      <div className="pt-2 border-t border-slate-200">
        <p className="text-xs font-semibold text-slate-600 mb-2">Quick Templates</p>
        <div className="grid grid-cols-2 gap-2">
          {['conservative', 'moderate', 'aggressive'].map(type => (
            <button
              key={type}
              onClick={() => handleCreateScenario(type)}
              className="text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-400 rounded px-3 py-1.5 transition-all"
            >
              + {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Edit form modal (simplified) */}
      {editingScenario && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Edit Scenario: {editingScenario.name}</h3>

            <div>
              <label className="text-xs font-semibold text-slate-700">Name</label>
              <input
                type="text"
                defaultValue={editingScenario.name}
                onChange={(e) => setEditingScenario({ ...editingScenario, name: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Description</label>
              <textarea
                defaultValue={editingScenario.description}
                onChange={(e) => setEditingScenario({ ...editingScenario, description: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm h-24"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Notes</label>
              <textarea
                defaultValue={editingScenario.notes}
                onChange={(e) => setEditingScenario({ ...editingScenario, notes: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm h-20"
              />
            </div>

            <div className="flex items-center gap-2 pt-4 border-t">
              <button
                onClick={() => setEditingScenario(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveScenario({ name: editingScenario.name, description: editingScenario.description, notes: editingScenario.notes })}
                className="px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}