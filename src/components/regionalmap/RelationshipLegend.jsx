import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

const STATUS_COLORS = {
  existing: { bg: '#10b981', text: '#065f46', label: 'Existing' },
  existing_limited: { bg: '#84cc16', text: '#365314', label: 'Existing (Limited)' },
  candidate_expansion: { bg: '#f59e0b', text: '#78350f', label: 'Candidate for Expansion' },
  prospective: { bg: '#3b82f6', text: '#1e40af', label: 'Prospective' },
  long_term_strategic: { bg: '#8b5cf6', text: '#4c1d95', label: 'Long-Term Strategic' },
  not_recommended: { bg: '#ef4444', text: '#7f1d1d', label: 'Not Recommended' },
};

const RELATIONSHIP_TYPES = [
  { id: 'ambulance_ems', label: 'Ambulance / EMS' },
  { id: 'fire_mutual_aid', label: 'Fire / Mutual Aid' },
  { id: 'law_enforcement', label: 'Law Enforcement' },
  { id: 'transfer_station', label: 'Transfer Station / Solid Waste' },
  { id: 'public_works', label: 'Public Works' },
  { id: 'road_maintenance', label: 'Road Maintenance / Winter Ops' },
  { id: 'dispatch_communications', label: 'Dispatch / Communications' },
  { id: 'animal_control', label: 'Animal Control' },
  { id: 'general_assistance', label: 'General Assistance / Welfare' },
  { id: 'code_enforcement', label: 'Code Enforcement' },
  { id: 'planning_economic_dev', label: 'Planning / Economic Dev' },
  { id: 'recreation_programming', label: 'Recreation / Programming' },
  { id: 'school_education', label: 'School / Education' },
  { id: 'tax_collection_finance', label: 'Tax Collection / Finance' },
  { id: 'shared_staffing', label: 'Shared Staffing / Contracts' },
  { id: 'broadband_technology', label: 'Broadband / Technology' },
  { id: 'facilities_shared_space', label: 'Facilities / Shared Space' },
  { id: 'purchasing_procurement', label: 'Purchasing / Procurement' },
  { id: 'harbor_marine', label: 'Harbor / Marine / Waterfront' },
  { id: 'emergency_management', label: 'Emergency Management' },
  { id: 'other_strategic', label: 'Other Strategic' },
];

export default function RelationshipLegend() {
  const [expandedSection, setExpandedSection] = useState('status');

  return (
    <div className="space-y-4">
      {/* Status Legend */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <button
          onClick={() => setExpandedSection(expandedSection === 'status' ? null : 'status')}
          className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors border-b border-slate-200"
        >
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Relationship Status</h3>
          {expandedSection === 'status' ? (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-slate-400" />
          )}
        </button>
        {expandedSection === 'status' && (
          <div className="p-3 space-y-2.5">
            {Object.entries(STATUS_COLORS).map(([key, { bg, label }]) => (
              <div key={key} className="flex items-center gap-2.5">
                <div className="h-3 w-3 rounded-sm flex-shrink-0" style={{ background: bg }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-700">{label}</p>
                  <p className="text-[10px] text-slate-500">
                    {key === 'existing' && 'Active service relationship in place'}
                    {key === 'existing_limited' && 'Currently operational but limited in scope'}
                    {key === 'candidate_expansion' && 'Existing relationship ready to expand'}
                    {key === 'prospective' && 'Potential future relationship'}
                    {key === 'long_term_strategic' && 'Long-term planning option'}
                    {key === 'not_recommended' && 'Not advised under current conditions'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Machias Role Legend */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <button
          onClick={() => setExpandedSection(expandedSection === 'role' ? null : 'role')}
          className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors border-b border-slate-200"
        >
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Machias Role</h3>
          {expandedSection === 'role' ? (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-slate-400" />
          )}
        </button>
        {expandedSection === 'role' && (
          <div className="p-3 space-y-2.5">
            {[
              { id: 'direct_provider', label: 'Direct Service Provider', desc: 'Machias delivers service to other towns' },
              { id: 'regional_hub', label: 'Regional Hub', desc: 'Machias serves as coordination center' },
              { id: 'shared_partner', label: 'Shared Partner', desc: 'Joint service delivery arrangement' },
              { id: 'contracted_admin', label: 'Contracted Admin', desc: 'Machias provides administrative support' },
              { id: 'reciprocal_agreement', label: 'Reciprocal Agreement', desc: 'Mutual exchange of services' },
              { id: 'tbd', label: 'To Be Determined', desc: 'Role under discussion' },
            ].map(({ id, label, desc }) => (
              <div key={id} className="border-l-2 border-slate-200 pl-2.5">
                <p className="text-xs font-medium text-slate-700">{label}</p>
                <p className="text-[10px] text-slate-500">{desc}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Relationship Types Summary */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <button
          onClick={() => setExpandedSection(expandedSection === 'types' ? null : 'types')}
          className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors border-b border-slate-200"
        >
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">{RELATIONSHIP_TYPES.length} Relationship Types</h3>
          {expandedSection === 'types' ? (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-slate-400" />
          )}
        </button>
        {expandedSection === 'types' && (
          <div className="p-3 grid grid-cols-1 gap-1.5 max-h-64 overflow-y-auto">
            {RELATIONSHIP_TYPES.map(({ id, label }) => (
              <div key={id} className="text-[10px] text-slate-600 flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-slate-300 flex-shrink-0" />
                {label}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}