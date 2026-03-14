import React, { useState } from 'react';
import { ChevronDown, Plus, Trash2 } from 'lucide-react';

const SERVICE_TYPES = {
  ambulance_ems: 'Ambulance / EMS',
  policing: 'Policing',
  administrative_support: 'Administrative Support',
  public_works_support: 'Public Works Support',
  code_enforcement: 'Code Enforcement',
  shared_staffing: 'Shared Staffing',
  transfer_station: 'Transfer Station / Solid Waste',
  dispatch_communications: 'Dispatch / Communications',
};

const PRICING_MODELS = {
  fixed_fee: 'Fixed Annual Fee',
  per_capita: 'Per Capita',
  call_volume: 'Call/Service Volume',
  hourly: 'Hourly Rate',
  hybrid: 'Hybrid Model',
};

export default function RegionalServiceConfig({ contract, onChange }) {
  const [expanded, setExpanded] = useState(false);
  const [showTowns, setShowTowns] = useState(false);
  const [newTown, setNewTown] = useState({ town_name: '', status: 'prospect', population: 0 });

  const handleChange = (field, value) => {
    onChange({ ...contract, [field]: value });
  };

  const addTown = () => {
    if (newTown.town_name.trim()) {
      const towns = contract.participating_towns || [];
      onChange({
        ...contract,
        participating_towns: [...towns, newTown],
      });
      setNewTown({ town_name: '', status: 'prospect', population: 0 });
    }
  };

  const removeTown = (index) => {
    const towns = contract.participating_towns || [];
    onChange({
      ...contract,
      participating_towns: towns.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 border-b border-slate-200"
      >
        <div className="flex-1 text-left">
          <h3 className="text-sm font-bold text-slate-900">{contract.service_name || 'New Service'}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{SERVICE_TYPES[contract.service_type]}</p>
        </div>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {/* Content */}
      {expanded && (
        <div className="p-4 space-y-4 border-t border-slate-200">
          {/* Basic Info */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Service Name</label>
              <input
                type="text"
                value={contract.service_name || ''}
                onChange={(e) => handleChange('service_name', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded text-sm"
                placeholder="e.g., Machias EMS Services"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Service Type</label>
              <select
                value={contract.service_type || ''}
                onChange={(e) => handleChange('service_type', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded text-sm"
              >
                <option value="">Select service type</option>
                {Object.entries(SERVICE_TYPES).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
              <textarea
                value={contract.description || ''}
                onChange={(e) => handleChange('description', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded text-sm h-20"
                placeholder="What's included in this service..."
              />
            </div>
          </div>

          {/* Pricing Model */}
          <div className="border-t border-slate-200 pt-4">
            <h4 className="text-xs font-bold text-slate-900 mb-3">Pricing Model</h4>
            <select
              value={contract.pricing_model || 'fixed_fee'}
              onChange={(e) => handleChange('pricing_model', e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded text-sm mb-3"
            >
              {Object.entries(PRICING_MODELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>

            {/* Pricing Details */}
            <div className="space-y-3">
              {contract.pricing_model === 'fixed_fee' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Annual Fee per Town</label>
                  <input
                    type="number"
                    value={contract.fixed_fee || 0}
                    onChange={(e) => handleChange('fixed_fee', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded text-sm"
                  />
                </div>
              )}

              {contract.pricing_model === 'per_capita' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Annual Fee per Capita</label>
                  <input
                    type="number"
                    value={contract.per_capita_fee || 0}
                    onChange={(e) => handleChange('per_capita_fee', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded text-sm"
                  />
                </div>
              )}

              {contract.pricing_model === 'call_volume' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Fee per Call/Request</label>
                    <input
                      type="number"
                      value={contract.call_volume_rate || 0}
                      onChange={(e) => handleChange('call_volume_rate', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Estimated Annual Calls</label>
                    <input
                      type="number"
                      value={contract.estimated_annual_calls || 0}
                      onChange={(e) => handleChange('estimated_annual_calls', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 rounded text-sm"
                    />
                  </div>
                </>
              )}

              {contract.pricing_model === 'hourly' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Hourly Rate</label>
                    <input
                      type="number"
                      value={contract.hourly_rate || 0}
                      onChange={(e) => handleChange('hourly_rate', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Estimated Annual Hours</label>
                    <input
                      type="number"
                      value={contract.estimated_annual_hours || 0}
                      onChange={(e) => handleChange('estimated_annual_hours', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 rounded text-sm"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Service Delivery Cost */}
          <div className="border-t border-slate-200 pt-4">
            <h4 className="text-xs font-bold text-slate-900 mb-3">Service Cost</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Annual Service Delivery Cost</label>
                <input
                  type="number"
                  value={contract.service_delivery_cost || 0}
                  onChange={(e) => handleChange('service_delivery_cost', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded text-sm"
                />
                <p className="text-xs text-slate-500 mt-1">Total cost to deliver this service (salaries, equipment, overhead)</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Cost Assumptions</label>
                <textarea
                  value={contract.cost_assumptions || ''}
                  onChange={(e) => handleChange('cost_assumptions', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded text-sm h-12"
                  placeholder="e.g., 1.5 FTE, vehicle depreciation, equipment costs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">One-Time Startup Cost</label>
                <input
                  type="number"
                  value={contract.startup_cost || 0}
                  onChange={(e) => handleChange('startup_cost', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Implementation Year</label>
                <select
                  value={contract.startup_year || 1}
                  onChange={(e) => handleChange('startup_year', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded text-sm"
                >
                  {[1, 2, 3, 4, 5].map((year) => (
                    <option key={year} value={year}>
                      Year {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Participating Towns */}
          <div className="border-t border-slate-200 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-900">Participating Towns</h4>
              <button
                onClick={() => setShowTowns(!showTowns)}
                className="text-xs font-semibold text-blue-700 hover:text-blue-900"
              >
                {showTowns ? 'Hide' : 'Add'}
              </button>
            </div>

            {showTowns && (
              <div className="rounded-lg border border-slate-200 p-3 mb-3 space-y-2 bg-slate-50">
                <input
                  type="text"
                  value={newTown.town_name}
                  onChange={(e) => setNewTown({ ...newTown, town_name: e.target.value })}
                  placeholder="Town name"
                  className="w-full px-2 py-1 border border-slate-200 rounded text-xs"
                />
                <select
                  value={newTown.status}
                  onChange={(e) => setNewTown({ ...newTown, status: e.target.value })}
                  className="w-full px-2 py-1 border border-slate-200 rounded text-xs"
                >
                  <option value="prospect">Prospect</option>
                  <option value="negotiating">Negotiating</option>
                  <option value="active">Active</option>
                </select>
                <input
                  type="number"
                  value={newTown.population || 0}
                  onChange={(e) => setNewTown({ ...newTown, population: parseFloat(e.target.value) })}
                  placeholder="Population (for per capita)"
                  className="w-full px-2 py-1 border border-slate-200 rounded text-xs"
                />
                <button
                  onClick={addTown}
                  className="w-full px-2 py-1 bg-blue-600 text-white text-xs font-semibold rounded hover:bg-blue-700"
                >
                  Add Town
                </button>
              </div>
            )}

            <div className="space-y-1">
              {(contract.participating_towns || []).map((town, idx) => (
                <div key={idx} className="flex items-center justify-between rounded border border-slate-200 p-2 bg-slate-50">
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-slate-900">{town.town_name}</p>
                    <p className="text-[10px] text-slate-500">{town.status} • Pop: {town.population?.toLocaleString()}</p>
                  </div>
                  <button
                    onClick={() => removeTown(idx)}
                    className="text-slate-400 hover:text-red-600 p-1"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Status & Priority */}
          <div className="border-t border-slate-200 pt-4 grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={contract.status || 'concept'}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded text-sm"
              >
                <option value="concept">Concept</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="discontinued">Discontinued</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
              <select
                value={contract.priority || 'medium'}
                onChange={(e) => handleChange('priority', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded text-sm"
              >
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div className="border-t border-slate-200 pt-4">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Notes</label>
            <textarea
              value={contract.notes || ''}
              onChange={(e) => handleChange('notes', e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded text-sm h-12"
              placeholder="Implementation notes, risks, opportunities..."
            />
          </div>
        </div>
      )}
    </div>
  );
}