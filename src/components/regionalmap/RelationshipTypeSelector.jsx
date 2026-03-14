import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const RELATIONSHIP_CATEGORIES = [
  { id: 'ambulance_ems', label: 'Ambulance / EMS', group: 'Emergency Services' },
  { id: 'fire_mutual_aid', label: 'Fire / Mutual Aid', group: 'Emergency Services' },
  { id: 'law_enforcement', label: 'Law Enforcement', group: 'Emergency Services' },
  { id: 'dispatch_communications', label: 'Dispatch / Communications', group: 'Emergency Services' },
  { id: 'emergency_management', label: 'Emergency Management', group: 'Emergency Services' },
  
  { id: 'transfer_station', label: 'Transfer Station / Solid Waste', group: 'Infrastructure & Utilities' },
  { id: 'public_works', label: 'Public Works', group: 'Infrastructure & Utilities' },
  { id: 'road_maintenance', label: 'Road Maintenance / Winter Ops', group: 'Infrastructure & Utilities' },
  { id: 'broadband_technology', label: 'Broadband / Technology', group: 'Infrastructure & Utilities' },
  
  { id: 'animal_control', label: 'Animal Control', group: 'Municipal Services' },
  { id: 'general_assistance', label: 'General Assistance / Welfare', group: 'Municipal Services' },
  { id: 'code_enforcement', label: 'Code Enforcement', group: 'Municipal Services' },
  { id: 'planning_economic_dev', label: 'Planning / Economic Dev', group: 'Municipal Services' },
  
  { id: 'tax_collection_finance', label: 'Tax Collection / Finance', group: 'Administrative' },
  { id: 'shared_staffing', label: 'Shared Staffing / Contracts', group: 'Administrative' },
  { id: 'purchasing_procurement', label: 'Purchasing / Procurement', group: 'Administrative' },
  
  { id: 'school_education', label: 'School / Education', group: 'Community Services' },
  { id: 'recreation_programming', label: 'Recreation / Programming', group: 'Community Services' },
  { id: 'facilities_shared_space', label: 'Facilities / Shared Space', group: 'Community Services' },
  
  { id: 'harbor_marine', label: 'Harbor / Marine / Waterfront', group: 'Regional Development' },
  { id: 'other_strategic', label: 'Other Strategic', group: 'Regional Development' },
];

const GROUPED_CATEGORIES = RELATIONSHIP_CATEGORIES.reduce((acc, cat) => {
  if (!acc[cat.group]) acc[cat.group] = [];
  acc[cat.group].push(cat);
  return acc;
}, {});

export default function RelationshipTypeSelector({ selectedTypes, onTypeChange }) {
  const [expandedGroups, setExpandedGroups] = useState(Object.keys(GROUPED_CATEGORIES));

  const toggleGroup = (group) => {
    setExpandedGroups(prev =>
      prev.includes(group)
        ? prev.filter(g => g !== group)
        : [...prev, group]
    );
  };

  const toggleType = (typeId) => {
    onTypeChange(
      selectedTypes.includes(typeId)
        ? selectedTypes.filter(t => t !== typeId)
        : [...selectedTypes, typeId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedTypes.length === RELATIONSHIP_CATEGORIES.length) {
      onTypeChange([]);
    } else {
      onTypeChange(RELATIONSHIP_CATEGORIES.map(c => c.id));
    }
  };

  return (
    <div className="space-y-3">
      {/* Select All toggle */}
      <button
        onClick={toggleSelectAll}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors text-xs font-medium text-slate-700"
      >
        <input
          type="checkbox"
          checked={selectedTypes.length === RELATIONSHIP_CATEGORIES.length}
          readOnly
          className="cursor-pointer"
        />
        {selectedTypes.length > 0
          ? `${selectedTypes.length} of ${RELATIONSHIP_CATEGORIES.length} selected`
          : 'Select all relationship types'}
      </button>

      {/* Grouped Categories */}
      <div className="space-y-2">
        {Object.entries(GROUPED_CATEGORIES).map(([group, items]) => (
          <div key={group} className="border border-slate-200 rounded-lg overflow-hidden bg-white">
            <button
              onClick={() => toggleGroup(group)}
              className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <span className="text-xs font-semibold text-slate-700">{group}</span>
              {expandedGroups.includes(group) ? (
                <ChevronUp className="h-4 w-4 text-slate-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-slate-400" />
              )}
            </button>
            {expandedGroups.includes(group) && (
              <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
                {items.map(item => (
                  <label
                    key={item.id}
                    className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTypes.includes(item.id)}
                      onChange={() => toggleType(item.id)}
                      className="rounded cursor-pointer"
                    />
                    <span className="text-xs text-slate-700 flex-1">{item.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}