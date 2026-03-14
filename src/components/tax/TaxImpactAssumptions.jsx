import React, { useState } from 'react';

export default function TaxImpactAssumptions({ data, onChange }) {
  const [showPhasing, setShowPhasing] = useState(false);

  const handleChange = (field, value) => {
    onChange({ ...data, [field]: value });
  };

  const handlePhasingChange = (year, field, value) => {
    const phasing = data.phasing || {};
    const yearData = phasing[year] || {};
    onChange({
      ...data,
      phasing: {
        ...phasing,
        [year]: { ...yearData, [field]: value },
      },
    });
  };

  return (
    <div className="space-y-4">
      {/* Cost Inputs */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-bold text-slate-900 mb-3">Cost & Revenue</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Gross Annual Cost</label>
            <input
              type="number"
              value={data.gross_cost || 0}
              onChange={(e) => handleChange('gross_cost', parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-slate-200 rounded text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Revenue Offsets</label>
            <input
              type="number"
              value={data.revenue_offsets || 0}
              onChange={(e) => handleChange('revenue_offsets', parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-slate-200 rounded text-sm"
            />
            <p className="text-xs text-slate-500 mt-1">User fees, fines, permits, etc.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Grant Funding</label>
            <input
              type="number"
              value={data.grant_funding || 0}
              onChange={(e) => handleChange('grant_funding', parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-slate-200 rounded text-sm"
            />
            <p className="text-xs text-slate-500 mt-1">State/federal grants, one-time or recurring</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Regional Service Revenue</label>
            <input
              type="number"
              value={data.regional_service_revenue || 0}
              onChange={(e) => handleChange('regional_service_revenue', parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-slate-200 rounded text-sm"
            />
            <p className="text-xs text-slate-500 mt-1">Revenue from contracting services to other towns</p>
          </div>
        </div>
      </div>

      {/* Phasing Options */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-900">Phasing Over Multiple Years</h3>
          <button
            onClick={() => setShowPhasing(!showPhasing)}
            className="text-xs font-semibold text-blue-700 hover:text-blue-900"
          >
            {showPhasing ? 'Hide' : 'Show'}
          </button>
        </div>

        {showPhasing && (
          <div className="space-y-3 border-t border-slate-200 pt-3">
            {[1, 2, 3, 4, 5].map((year) => {
              const yearData = data.phasing?.[year] || {};
              return (
                <div key={year} className="rounded border border-slate-200 p-3">
                  <p className="text-xs font-semibold text-slate-900 mb-2">Year {year}</p>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">Implementation %</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={yearData.percentage !== undefined ? yearData.percentage * 100 : 100}
                        onChange={(e) => handlePhasingChange(year, 'percentage', parseFloat(e.target.value) / 100)}
                        className="w-full px-2 py-1 border border-slate-200 rounded text-xs"
                        placeholder="100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">Notes</label>
                      <input
                        type="text"
                        value={yearData.notes || ''}
                        onChange={(e) => handlePhasingChange(year, 'notes', e.target.value)}
                        className="w-full px-2 py-1 border border-slate-200 rounded text-xs"
                        placeholder="e.g., Hire in month 3"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
        <p className="text-xs text-blue-900">
          <span className="font-semibold">Tip:</span> Offsets (revenue, grants, regional services) reduce the net tax impact. Phasing allows you to model gradual implementation across years.
        </p>
      </div>
    </div>
  );
}