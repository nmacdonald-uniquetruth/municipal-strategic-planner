import React from 'react';
import { Card } from '@/components/ui/card';

const MODELS = {
  current_structure: {
    label: 'Current Structure',
    description: 'Maintain existing department operations',
    icon: '📋',
    color: 'slate',
  },
  expanded_staffing: {
    label: 'Expanded Staffing',
    description: 'Add positions to improve service capacity',
    icon: '📈',
    color: 'emerald',
  },
  reduced_staffing: {
    label: 'Reduced Staffing',
    description: 'Streamline operations with fewer positions',
    icon: '📉',
    color: 'amber',
  },
  shared_service: {
    label: 'Shared Service',
    description: 'Partner with other town departments',
    icon: '🤝',
    color: 'blue',
  },
  regional_delivery: {
    label: 'Regional Delivery',
    description: 'Machias provides service to regional towns',
    icon: '🌍',
    color: 'purple',
  },
  outsourced: {
    label: 'Outsourced Support',
    description: 'Contract services to external provider',
    icon: '🏢',
    color: 'red',
  },
};

export default function DepartmentModelSelector({ value, onChange, allowedModels }) {
  const models = allowedModels || Object.keys(MODELS);

  return (
    <div>
      <label className="block text-xs font-bold text-slate-700 mb-3">Service Delivery Model</label>
      <div className="grid grid-cols-2 gap-2">
        {models.map((modelKey) => {
          const model = MODELS[modelKey];
          const isSelected = value === modelKey;
          const colorClasses = {
            slate: isSelected ? 'border-slate-800 bg-slate-100' : 'border-slate-200 hover:border-slate-300',
            emerald: isSelected ? 'border-emerald-600 bg-emerald-50' : 'border-slate-200 hover:border-emerald-300',
            amber: isSelected ? 'border-amber-600 bg-amber-50' : 'border-slate-200 hover:border-amber-300',
            blue: isSelected ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-blue-300',
            purple: isSelected ? 'border-purple-600 bg-purple-50' : 'border-slate-200 hover:border-purple-300',
            red: isSelected ? 'border-red-600 bg-red-50' : 'border-slate-200 hover:border-red-300',
          };

          return (
            <button
              key={modelKey}
              onClick={() => onChange(modelKey)}
              className={`rounded-lg border-2 p-3 text-left transition-all ${colorClasses[model.color]}`}
            >
              <div className="text-lg mb-1">{model.icon}</div>
              <h4 className="text-xs font-bold text-slate-900">{model.label}</h4>
              <p className="text-[10px] text-slate-600 mt-0.5">{model.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}