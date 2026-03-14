import React from 'react';
import { Edit2, Trash2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function FiscalFeasibilityTable({ records, onEdit, onDelete }) {
  const feasibilityColors = {
    high: 'bg-emerald-50 text-emerald-900',
    moderate: 'bg-amber-50 text-amber-900',
    low: 'bg-red-50 text-red-900',
  };

  const confidenceColors = {
    high: 'text-emerald-600',
    moderate: 'text-amber-600',
    low: 'text-red-600',
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-900 text-white border-b border-slate-200">
              <th className="px-3 py-2.5 text-left font-bold">Municipality</th>
              <th className="px-3 py-2.5 text-left font-bold">Financial Admin Structure</th>
              <th className="px-3 py-2.5 text-right font-bold">Annual Cost</th>
              <th className="px-3 py-2.5 text-left font-bold">Source</th>
              <th className="px-3 py-2.5 text-center font-bold">Feasibility</th>
              <th className="px-3 py-2.5 text-right font-bold">Est. Service Price</th>
              <th className="px-3 py-2.5 text-right font-bold">Net Impact</th>
              <th className="px-3 py-2.5 text-left font-bold">Relationships</th>
              <th className="px-3 py-2.5 text-center font-bold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records.map(record => {
              const midpointPrice = ((record.estimated_regional_service_price_low || 0) + 
                (record.estimated_regional_service_price_high || 0)) / 2;
              
              return (
                <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-3 py-2.5 font-bold text-slate-900">{record.municipality}</td>
                  <td className="px-3 py-2.5 text-slate-700">{record.financial_admin_structure || '—'}</td>
                  <td className="px-3 py-2.5 text-right text-slate-700">
                    {record.total_annual_cost ? `$${record.total_annual_cost.toLocaleString()}` : '—'}
                  </td>
                  <td className="px-3 py-2.5 text-slate-600">
                    <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded">
                      {record.source_document ? record.source_document.replace('_', ' ') : '—'}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`px-2 py-1 rounded-full text-[9px] font-bold ${feasibilityColors[record.fiscal_feasibility] || 'bg-slate-100'}`}>
                      {record.fiscal_feasibility ? record.fiscal_feasibility.charAt(0).toUpperCase() + record.fiscal_feasibility.slice(1) : '—'}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right text-slate-700">
                    {record.estimated_regional_service_price_low ? 
                      `$${record.estimated_regional_service_price_low.toLocaleString()}–$${record.estimated_regional_service_price_high.toLocaleString()}` : 
                      '—'}
                  </td>
                  <td className={`px-3 py-2.5 text-right font-bold ${record.potential_net_fiscal_impact > 0 ? 'text-emerald-700' : record.potential_net_fiscal_impact < 0 ? 'text-red-700' : 'text-slate-700'}`}>
                    {record.potential_net_fiscal_impact ? 
                      `${record.potential_net_fiscal_impact > 0 ? '+' : ''}$${record.potential_net_fiscal_impact.toLocaleString()}` : 
                      '—'}
                  </td>
                  <td className="px-3 py-2.5 text-slate-600 text-[9px]">
                    {record.existing_relationships ? (
                      <span className="truncate block">{record.existing_relationships}</span>
                    ) : '—'}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <div className="flex gap-1 justify-center">
                      <button
                        onClick={() => onEdit(record)}
                        className="p-1 rounded hover:bg-slate-100 transition-colors text-slate-600 hover:text-slate-900"
                        title="Edit"
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => onDelete(record.id)}
                        className="p-1 rounded hover:bg-red-100 transition-colors text-slate-600 hover:text-red-700"
                        title="Delete"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}