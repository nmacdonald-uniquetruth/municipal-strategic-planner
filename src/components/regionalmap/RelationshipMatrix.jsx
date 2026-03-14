import React from 'react';
import { ChevronRight } from 'lucide-react';

const STATUS_COLORS = {
  existing: '#10b981',
  existing_limited: '#84cc16',
  candidate_expansion: '#f59e0b',
  prospective: '#3b82f6',
  long_term_strategic: '#8b5cf6',
  not_recommended: '#ef4444',
};

const PRIORITY_ICONS = {
  critical: '⚠️',
  high: '📌',
  medium: '◆',
  low: '○',
  exploratory: '?',
};

export default function RelationshipMatrix({ relationships, selectedTown, onSelectTown }) {
  if (!relationships || relationships.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-sm text-slate-500">No relationships selected.</p>
        <p className="text-xs text-slate-400 mt-1">Choose relationship types to view details.</p>
      </div>
    );
  }

  // Group by municipality
  const byMunicipality = relationships.reduce((acc, rel) => {
    if (!acc[rel.municipality]) acc[rel.municipality] = [];
    acc[rel.municipality].push(rel);
    return acc;
  }, {});

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="px-2 py-2 text-left font-semibold text-slate-700">Town</th>
            <th className="px-2 py-2 text-left font-semibold text-slate-700">Relationship</th>
            <th className="px-2 py-2 text-left font-semibold text-slate-700">Status</th>
            <th className="px-2 py-2 text-center font-semibold text-slate-700">Priority</th>
            <th className="px-2 py-2 text-left font-semibold text-slate-700 truncate">Notes</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {Object.entries(byMunicipality).map(([town, rels]) =>
            rels.map((rel, idx) => (
              <tr
                key={`${town}-${idx}`}
                className={`border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors ${
                  selectedTown === town ? 'bg-slate-100' : ''
                }`}
                onClick={() => onSelectTown(town)}
              >
                {idx === 0 && (
                  <td rowSpan={rels.length} className="px-2 py-2 font-medium text-slate-700 bg-slate-50 align-top">
                    <div className="flex items-center gap-1">
                      <ChevronRight className="h-3 w-3 text-slate-400" />
                      {town}
                    </div>
                  </td>
                )}
                <td className="px-2 py-2 text-slate-600">{formatRelationshipType(rel.relationship_type)}</td>
                <td className="px-2 py-2">
                  <span
                    className="inline-flex items-center px-2 py-1 rounded text-white text-[9px] font-bold"
                    style={{ background: STATUS_COLORS[rel.status] || '#9ca3af' }}
                  >
                    {formatStatus(rel.status)}
                  </span>
                </td>
                <td className="px-2 py-2 text-center">
                  <span title={rel.priority_level}>{PRIORITY_ICONS[rel.priority_level] || '—'}</span>
                </td>
                <td className="px-2 py-2 text-slate-600 truncate max-w-xs" title={rel.notes}>
                  {rel.notes ? rel.notes.substring(0, 30) + '...' : '—'}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function formatRelationshipType(type) {
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
    candidate_expansion: 'Expand',
    prospective: 'Future',
    long_term_strategic: 'Long-term',
    not_recommended: 'Not Rec.',
  };
  return labels[status] || status;
}