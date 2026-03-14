import React, { useState } from 'react';
import SectionHeader from '../components/machias/SectionHeader';
import TaxImpactBreakdown from '../components/tax/TaxImpactBreakdown';
import TaxImpactComparison from '../components/tax/TaxImpactComparison';
import TaxImpactAssumptions from '../components/tax/TaxImpactAssumptions';
import MultiYearTaxImpact from '../components/tax/MultiYearTaxImpact';
import { useModel } from '../components/machias/ModelContext';
import { DollarSign, ArrowRightLeft } from 'lucide-react';

export default function TaxImpact() {
  const { settings } = useModel();
  const [mode, setMode] = useState('single'); // single or compare
  const [currentImpact, setCurrentImpact] = useState({
    gross_cost: 0,
    revenue_offsets: 0,
    grant_funding: 0,
    regional_service_revenue: 0,
  });
  const [proposedImpact, setProposedImpact] = useState({
    gross_cost: 150000,
    revenue_offsets: 25000,
    grant_funding: 0,
    regional_service_revenue: 35000,
  });
  const [viewMode, setViewMode] = useState('summary'); // summary or detailed
  const [years, setYears] = useState(5);

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Tax Impact Engine"
        subtitle="Calculate cascading tax effects from operational and staffing changes. Analyze mill rate, levy, and per-household impact with configurable assumptions."
        icon={DollarSign}
      />

      {/* Mode Selection */}
      <div className="flex gap-3 rounded-lg border border-slate-200 bg-white p-3">
        <button
          onClick={() => setMode('single')}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
            mode === 'single'
              ? 'bg-slate-900 text-white'
              : 'text-slate-700 hover:bg-slate-50'
          }`}
        >
          Single Impact Analysis
        </button>
        <button
          onClick={() => setMode('compare')}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 ${
            mode === 'compare'
              ? 'bg-slate-900 text-white'
              : 'text-slate-700 hover:bg-slate-50'
          }`}
        >
          <ArrowRightLeft className="h-4 w-4" />
          Compare States
        </button>
      </div>

      {/* Single Impact Analysis */}
      {mode === 'single' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Panel */}
          <div className="lg:col-span-1">
            <TaxImpactAssumptions
              data={currentImpact}
              onChange={setCurrentImpact}
            />
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-2 space-y-6">
            <TaxImpactBreakdown
              impact={currentImpact}
              modelSettings={settings}
              showDetails={true}
            />

            {/* Multi-Year View */}
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900">Multi-Year Projection</h3>
                <select
                  value={years}
                  onChange={(e) => setYears(parseInt(e.target.value))}
                  className="px-3 py-1.5 border border-slate-200 rounded text-xs font-medium"
                >
                  <option value="3">3 Years</option>
                  <option value="5">5 Years</option>
                  <option value="10">10 Years</option>
                </select>
              </div>
              <MultiYearTaxImpact
                data={currentImpact}
                modelSettings={settings}
                years={years}
              />
            </div>
          </div>
        </div>
      )}

      {/* Comparison Mode */}
      {mode === 'compare' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Current State Input */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-3 pb-2 border-b border-slate-200">Current State Assumptions</h3>
              <TaxImpactAssumptions
                data={currentImpact}
                onChange={setCurrentImpact}
              />
            </div>

            {/* Proposed State Input */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-3 pb-2 border-b border-slate-200">Proposed State Assumptions</h3>
              <TaxImpactAssumptions
                data={proposedImpact}
                onChange={setProposedImpact}
              />
            </div>
          </div>

          {/* Comparison Results */}
          <TaxImpactComparison
            currentData={currentImpact}
            proposedData={proposedImpact}
            modelSettings={settings}
          />
        </div>
      )}

      {/* Info Panel */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <h4 className="text-sm font-bold text-blue-900 mb-2">How This Works</h4>
        <ul className="text-xs text-blue-900 space-y-1 ml-4 list-disc">
          <li><strong>Gross Cost:</strong> Total annual cost of the change (salaries, benefits, operations)</li>
          <li><strong>Revenue Offsets:</strong> User fees, permits, fines, and other local revenue sources</li>
          <li><strong>Grant Funding:</strong> State/federal grants that offset municipal costs</li>
          <li><strong>Regional Service Revenue:</strong> Revenue from contracting services to neighboring towns</li>
          <li><strong>Net Cost:</strong> Gross cost minus all offsets — this is the amount that affects the tax levy</li>
          <li><strong>Mill Rate Impact:</strong> How the tax rate per $1,000 of assessed value will change</li>
          <li><strong>Per Household:</strong> Estimated annual tax change for a typical $250K home</li>
        </ul>
      </div>
    </div>
  );
}