import React from 'react';
import { Search, X } from 'lucide-react';

const CATEGORIES = [
  { value: 'staffing', label: 'Staffing' },
  { value: 'shared_services', label: 'Shared Services' },
  { value: 'regional_revenue', label: 'Regional Revenue' },
  { value: 'capital', label: 'Capital' },
  { value: 'governance', label: 'Governance' },
  { value: 'administration', label: 'Administration' }
];

const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' }
];

const STATUSES = [
  { value: 'concept', label: 'Concept' },
  { value: 'in_development', label: 'In Development' },
  { value: 'ready_for_review', label: 'Ready for Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'implemented', label: 'Implemented' }
];

export default function ProposalFilters({ filters, onFiltersChange, departments, serviceTypes, towns, fiscalYears }) {
  const handleTextChange = (value) => {
    onFiltersChange({ ...filters, search: value });
  };

  const handleFilterChange = (key, value) => {
    const current = filters[key] || [];
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    onFiltersChange({ ...filters, [key]: updated });
  };

  const handleMinSavings = (value) => {
    onFiltersChange({ ...filters, minAnnualImpact: value ? parseInt(value) : 0 });
  };

  const hasFilters = Object.values(filters).some(v => {
    if (Array.isArray(v)) return v.length > 0;
    return v !== undefined && v !== '' && v !== 0;
  });

  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-lg border">
      {/* Search */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={filters.search || ''}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="Search proposals by title or description..."
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>
      </div>

      {/* Categories */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Categories</label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => handleFilterChange('categories', cat.value)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                (filters.categories || []).includes(cat.value)
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Priorities */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
        <div className="flex flex-wrap gap-2">
          {PRIORITIES.map(pri => (
            <button
              key={pri.value}
              onClick={() => handleFilterChange('priorities', pri.value)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                (filters.priorities || []).includes(pri.value)
                  ? 'bg-orange-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {pri.label}
            </button>
          ))}
        </div>
      </div>

      {/* Status */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map(stat => (
            <button
              key={stat.value}
              onClick={() => handleFilterChange('statuses', stat.value)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                (filters.statuses || []).includes(stat.value)
                  ? 'bg-green-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {stat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Departments */}
      {departments.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Departments</label>
          <div className="flex flex-wrap gap-2">
            {departments.map(dept => (
              <button
                key={dept}
                onClick={() => handleFilterChange('departments', dept)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  (filters.departments || []).includes(dept)
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {dept}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Service Types */}
      {serviceTypes.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Service Types</label>
          <div className="flex flex-wrap gap-2">
            {serviceTypes.map(service => (
              <button
                key={service}
                onClick={() => handleFilterChange('serviceTypes', service)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  (filters.serviceTypes || []).includes(service)
                    ? 'bg-purple-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {service}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Fiscal Years */}
      {fiscalYears.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Fiscal Year</label>
          <div className="flex flex-wrap gap-2">
            {fiscalYears.map(year => (
              <button
                key={year}
                onClick={() => handleFilterChange('fiscalYears', year)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  (filters.fiscalYears || []).includes(year)
                    ? 'bg-teal-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {year}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Minimum Annual Impact */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Minimum Annual Impact (Savings + Revenue)
        </label>
        <div className="flex gap-2">
          <select
            value={filters.minAnnualImpact || 0}
            onChange={(e) => handleMinSavings(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="0">Any amount</option>
            <option value="25000">$25k+</option>
            <option value="50000">$50k+</option>
            <option value="100000">$100k+</option>
            <option value="250000">$250k+</option>
          </select>
        </div>
      </div>

      {/* Clear Filters */}
      {hasFilters && (
        <button
          onClick={() => onFiltersChange({})}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
        >
          <X className="w-4 h-4" /> Clear All Filters
        </button>
      )}
    </div>
  );
}