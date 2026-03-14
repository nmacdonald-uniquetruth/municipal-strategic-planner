import React, { useState, useMemo } from 'react';
import { X, Map, Table, Info } from 'lucide-react';
import RelationshipTypeSelector from './RelationshipTypeSelector';
import RelationshipMatrix from './RelationshipMatrix';
import RelationshipLegend from './RelationshipLegend';

const STATUS_COLORS = {
  existing: '#10b981',
  existing_limited: '#84cc16',
  candidate_expansion: '#f59e0b',
  prospective: '#3b82f6',
  long_term_strategic: '#8b5cf6',
  not_recommended: '#ef4444',
};

export default function RelationshipPlanningPanel({
  relationships,
  selectedTypes,
  onTypeChange,
  highlightedTowns,
  onClose,
}) {
  const [activeTab, setActiveTab] = useState('selector');
  const [selectedTown, setSelectedTown] = useState(null);

  // Filter relationships by selected types
  const filteredRelationships = useMemo(() => {
    if (!relationships || selectedTypes.length === 0) return [];
    return relationships.filter(rel => selectedTypes.includes(rel.relationship_type));
  }, [relationships, selectedTypes]);

  // Get unique towns in filtered relationships
  const townsInView = useMemo(() => {
    return [...new Set(filteredRelationships.map(r => r.municipality))];
  }, [filteredRelationships]);

  // Get selected town details
  const selectedTownData = useMemo(() => {
    if (!selectedTown || !filteredRelationships) return null;
    return filteredRelationships.filter(r => r.municipality === selectedTown);
  }, [selectedTown, filteredRelationships]);

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900 text-white">
        <div>
          <h3 className="text-sm font-bold">Regional Relationship Types</h3>
          <p className="text-[10px] text-slate-300 mt-0.5">Strategic planning for interlocal collaboration</p>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-slate-700 transition-colors text-slate-300 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-slate-50">
        <button
          onClick={() => setActiveTab('selector')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${
            activeTab === 'selector'
              ? 'text-slate-900 border-b-2 border-slate-900 bg-white'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Map className="h-3.5 w-3.5" />
          Select Types
        </button>
        <button
          onClick={() => setActiveTab('matrix')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${
            activeTab === 'matrix'
              ? 'text-slate-900 border-b-2 border-slate-900 bg-white'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Table className="h-3.5 w-3.5" />
          Matrix View
        </button>
        <button
          onClick={() => setActiveTab('legend')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${
            activeTab === 'legend'
              ? 'text-slate-900 border-b-2 border-slate-900 bg-white'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Info className="h-3.5 w-3.5" />
          Legend
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Selector Tab */}
        {activeTab === 'selector' && (
          <div className="p-4 space-y-4">
            <RelationshipTypeSelector
              selectedTypes={selectedTypes}
              onTypeChange={onTypeChange}
            />
            {selectedTypes.length > 0 && (
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                <p className="text-xs font-medium text-slate-700 mb-2">Coverage</p>
                <p className="text-sm font-bold text-slate-900">{townsInView.length} Towns</p>
                <p className="text-xs text-slate-600 mt-1">
                  {filteredRelationships.length} relationship(s) for selected type(s)
                </p>
              </div>
            )}
          </div>
        )}

        {/* Matrix Tab */}
        {activeTab === 'matrix' && (
          <div className="p-4">
            <RelationshipMatrix
              relationships={filteredRelationships}
              selectedTown={selectedTown}
              onSelectTown={setSelectedTown}
            />
          </div>
        )}

        {/* Legend Tab */}
        {activeTab === 'legend' && (
          <div className="p-4">
            <RelationshipLegend />
          </div>
        )}
      </div>

      {/* Town Detail Panel (when selected in matrix) */}
      {selectedTown && selectedTownData && selectedTownData.length > 0 && (
        <div className="border-t border-slate-200 bg-slate-50 p-4 max-h-64 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-slate-900">{selectedTown}</h4>
            <button
              onClick={() => setSelectedTown(null)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Show all relationships for this town */}
          <div className="space-y-3">
            {selectedTownData.map((rel, idx) => (
              <div key={idx} className="bg-white rounded-lg p-2.5 border border-slate-200">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-700">{formatType(rel.relationship_type)}</p>
                    <span
                      className="inline-flex items-center px-1.5 py-0.5 rounded text-white text-[8px] font-bold mt-1"
                      style={{ background: STATUS_COLORS[rel.status] }}
                    >
                      {formatStatus(rel.status)}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-semibold text-slate-600">{rel.machias_role}</p>
                  </div>
                </div>
                {rel.notes && (
                  <p className="text-[9px] text-slate-600 mt-2 border-t border-slate-100 pt-2">
                    {rel.notes}
                  </p>
                )}
                {rel.next_steps && (
                  <p className="text-[9px] text-emerald-700 font-medium mt-1">
                    Next: {rel.next_steps}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function formatType(type) {
  const labels = {
    ambulance_ems: 'Ambulance / EMS',
    fire_mutual_aid: 'Fire / Mutual Aid',
    law_enforcement: 'Law Enforcement',
    transfer_station: 'Transfer Station',
    public_works: 'Public Works',
    road_maintenance: 'Road Maintenance',
    dispatch_communications: 'Dispatch',
    animal_control: 'Animal Control',
    general_assistance: 'General Assistance',
    code_enforcement: 'Code Enforcement',
    planning_economic_dev: 'Planning / Econ Dev',
    recreation_programming: 'Recreation',
    school_education: 'School / Education',
    tax_collection_finance: 'Finance',
    shared_staffing: 'Shared Staffing',
    broadband_technology: 'Broadband',
    facilities_shared_space: 'Facilities',
    purchasing_procurement: 'Purchasing',
    harbor_marine: 'Harbor / Marine',
    emergency_management: 'Emergency Mgmt',
    other_strategic: 'Other Strategic',
  };
  return labels[type] || type;
}

function formatStatus(status) {
  const labels = {
    existing: 'Existing',
    existing_limited: 'Limited',
    candidate_expansion: 'Candidate',
    prospective: 'Prospective',
    long_term_strategic: 'Long-Term',
    not_recommended: 'Not Recommended',
  };
  return labels[status] || status;
}