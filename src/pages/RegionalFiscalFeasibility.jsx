import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, TrendingUp, DollarSign, AlertCircle, Plus, Edit2, Trash2 } from 'lucide-react';
import SectionHeader from '../components/machias/SectionHeader';
import { Button } from '@/components/ui/button';
import FiscalFeasibilityTable from '../components/regionalfiscal/FiscalFeasibilityTable';
import FiscalResearchForm from '../components/regionalfiscal/FiscalResearchForm';
import FiscalAnalysisSummary from '../components/regionalfiscal/FiscalAnalysisSummary';

const TARGET_MUNICIPALITIES = [
  'Machias', 'Machiasport', 'East Machias', 'Roque Bluffs',
  'Jonesboro', 'Jonesport', 'Beals', 'Cutler', 'Whiting',
  'Marshfield', 'Northfield', 'Deblois', 'Beddington',
  'Addison', 'Columbia', 'Columbia Falls',
];

export default function RegionalFiscalFeasibility() {
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [filterFeasibility, setFilterFeasibility] = useState('all');

  const { data: records = [], isLoading, refetch } = useQuery({
    queryKey: ['MunicipalFinancialAdmin'],
    queryFn: () => base44.entities.MunicipalFinancialAdmin.list(),
  });

  const filteredRecords = filterFeasibility === 'all'
    ? records
    : records.filter(r => r.fiscal_feasibility === filterFeasibility);

  const coverageCount = records.length;
  const coveragePercent = Math.round((coverageCount / TARGET_MUNICIPALITIES.length) * 100);
  const totalRegionalRevenuePotential = records.reduce((sum, r) => 
    sum + ((r.estimated_regional_service_price_low || 0) + (r.estimated_regional_service_price_high || 0)) / 2, 0
  );

  const handleDelete = async (id) => {
    if (window.confirm('Delete this record?')) {
      await base44.entities.MunicipalFinancialAdmin.delete(id);
      refetch();
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingRecord(null);
    refetch();
  };

  return (
    <div className="space-y-4 max-w-[1400px] mx-auto">
      {/* Header */}
      <SectionHeader
        title="Regional Fiscal Feasibility Analysis"
        subtitle="Evaluate financial administration service consolidation across Machias Bay Region municipalities"
        icon={BarChart3}
      />

      {/* Summary metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Data Coverage</p>
          <p className="text-2xl font-bold text-slate-900">{coverageCount}/{TARGET_MUNICIPALITIES.length}</p>
          <p className="text-xs text-slate-500 mt-0.5">{coveragePercent}% municipalities researched</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Avg Annual Cost</p>
          <p className="text-2xl font-bold text-slate-900">
            ${records.length > 0 ? Math.round(records.reduce((s, r) => s + (r.total_annual_cost || 0), 0) / records.length).toLocaleString() : '—'}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Per municipality</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Revenue Potential</p>
          <p className="text-2xl font-bold text-emerald-700">${Math.round(totalRegionalRevenuePotential).toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-0.5">Estimated annual (mid-range)</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">High Feasibility</p>
          <p className="text-2xl font-bold text-blue-700">
            {records.filter(r => r.fiscal_feasibility === 'high').length}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Strong candidates</p>
        </div>
      </div>

      {/* Analysis summary */}
      {records.length > 0 && <FiscalAnalysisSummary records={records} />}

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            onClick={() => { setShowForm(true); setEditingRecord(null); }}
            className="bg-slate-900 hover:bg-slate-800 text-white gap-2"
            size="sm"
          >
            <Plus className="h-4 w-4" />
            Add Research
          </Button>
        </div>
        <div className="flex gap-1.5">
          {['all', 'high', 'moderate', 'low'].map(val => (
            <button
              key={val}
              onClick={() => setFilterFeasibility(val)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterFeasibility === val
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {val === 'all' ? 'All' : val.charAt(0).toUpperCase() + val.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Form modal */}
      {showForm && (
        <FiscalResearchForm
          record={editingRecord}
          onClose={handleFormClose}
        />
      )}

      {/* Data table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-slate-500">Loading research data…</p>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
          <AlertCircle className="h-8 w-8 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-600">No records found</p>
          <p className="text-xs text-slate-500 mt-1">Begin by adding municipal financial administration research.</p>
        </div>
      ) : (
        <FiscalFeasibilityTable
          records={filteredRecords}
          onEdit={(record) => { setEditingRecord(record); setShowForm(true); }}
          onDelete={handleDelete}
        />
      )}

      {/* Research guidance */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <p className="font-bold mb-2">Research Data Sources</p>
        <ul className="text-xs space-y-1 ml-4 list-disc text-amber-800">
          <li>Town meeting warrants (ATM articles listing compensation)</li>
          <li>Town meeting minutes (approved salaries and stipends)</li>
          <li>Municipal budget documents (line items for finance positions)</li>
          <li>Municipal websites and treasurer/selectboard pages</li>
          <li>Regional economic council databases (Sunrise County Economic Council)</li>
        </ul>
      </div>
    </div>
  );
}