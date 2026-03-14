import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import SectionHeader from '../components/machias/SectionHeader';
import RegionalServiceConfig from '../components/regionalservices/RegionalServiceConfig';
import RegionalServiceAnalysis from '../components/regionalservices/RegionalServiceAnalysis';
import { calculatePortfolioRevenue, formatCurrency, formatServiceType } from '../components/utils/regionalRevenueCalculator';
import { Plus, Trash2 } from 'lucide-react';

export default function RegionalServiceRevenue() {
  const [contracts, setContracts] = useState([]);
  const [selectedContract, setSelectedContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);

  useEffect(() => {
    loadContracts();
  }, []);

  const loadContracts = async () => {
    try {
      const data = await base44.entities.RegionalServiceContract.list();
      setContracts(data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading contracts:', error);
      setLoading(false);
    }
  };

  const handleSaveContract = async (contract) => {
    try {
      if (contract.id) {
        await base44.entities.RegionalServiceContract.update(contract.id, contract);
      } else {
        const created = await base44.entities.RegionalServiceContract.create(contract);
        setSelectedContract(created);
      }
      await loadContracts();
      setShowNewForm(false);
    } catch (error) {
      console.error('Error saving contract:', error);
    }
  };

  const handleDeleteContract = async (id) => {
    if (window.confirm('Delete this service contract?')) {
      try {
        await base44.entities.RegionalServiceContract.delete(id);
        if (selectedContract?.id === id) setSelectedContract(null);
        await loadContracts();
      } catch (error) {
        console.error('Error deleting contract:', error);
      }
    }
  };

  const portfolio = calculatePortfolioRevenue(contracts.filter((c) => c.status === 'active'));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs text-slate-500">Loading contracts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Regional Service Revenue Model"
        subtitle="Configure and analyze revenue from providing services to neighboring towns. Track costs, set pricing, and measure net contribution to Machias."
        icon={() => <span className="text-xl">🌍</span>}
      />

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold text-slate-600 uppercase mb-2">Active Services</p>
          <p className="text-2xl font-bold text-slate-900">{contracts.filter((c) => c.status === 'active').length}</p>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs font-semibold text-emerald-700 uppercase mb-2">Gross Revenue</p>
          <p className="text-2xl font-bold text-emerald-700">{formatCurrency(portfolio.total_gross_revenue)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold text-slate-600 uppercase mb-2">Service Costs</p>
          <p className="text-2xl font-bold text-slate-900">{formatCurrency(portfolio.total_service_cost)}</p>
        </div>
        <div className={`rounded-lg border p-4 ${portfolio.total_net_contribution >= 0 ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
          <p className={`text-xs font-semibold uppercase mb-2 ${portfolio.total_net_contribution >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
            Net Contribution
          </p>
          <p className={`text-2xl font-bold ${portfolio.total_net_contribution >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
            {portfolio.total_net_contribution >= 0 ? '+' : '−'}{formatCurrency(Math.abs(portfolio.total_net_contribution))}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contract List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Service Contracts</h2>
            <button
              onClick={() => setShowNewForm(true)}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-2">
            {contracts.length === 0 ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center">
                <p className="text-xs text-slate-600">No contracts configured</p>
              </div>
            ) : (
              contracts.map((contract) => (
                <button
                  key={contract.id}
                  onClick={() => setSelectedContract(contract)}
                  className={`w-full rounded-lg border p-3 text-left transition-all ${
                    selectedContract?.id === contract.id
                      ? 'border-slate-800 bg-slate-50'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs font-bold text-slate-900 truncate">{contract.service_name}</h3>
                      <p className="text-[10px] text-slate-500 mt-0.5">{formatServiceType(contract.service_type)}</p>
                    </div>
                    {contract.status === 'active' && (
                      <span className="ml-2 px-2 py-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-700 rounded">
                        Active
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Main Panel */}
        <div className="lg:col-span-2">
          {showNewForm ? (
            <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900">New Service Contract</h2>
                <button
                  onClick={() => setShowNewForm(false)}
                  className="text-slate-400 hover:text-slate-600 text-xl"
                >
                  ✕
                </button>
              </div>
              <RegionalServiceConfig
                contract={{ status: 'concept', pricing_model: 'fixed_fee', participating_towns: [] }}
                onChange={(contract) => handleSaveContract(contract)}
              />
            </div>
          ) : selectedContract ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900">Contract Details</h2>
                <button
                  onClick={() => handleDeleteContract(selectedContract.id)}
                  className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <RegionalServiceConfig
                contract={selectedContract}
                onChange={(contract) => {
                  setSelectedContract(contract);
                  handleSaveContract(contract);
                }}
              />
              <RegionalServiceAnalysis contract={selectedContract} />
            </div>
          ) : (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-12 text-center">
              <p className="text-sm text-slate-600 mb-4">Select a contract or create a new one</p>
              <button
                onClick={() => setShowNewForm(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800"
              >
                Create New Service
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Portfolio Breakdown */}
      {portfolio.by_service.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">Portfolio Breakdown</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700">Service</th>
                  <th className="px-3 py-2 text-right font-semibold text-slate-700">Gross Revenue</th>
                  <th className="px-3 py-2 text-right font-semibold text-slate-700">Cost</th>
                  <th className="px-3 py-2 text-right font-semibold text-slate-700">Net</th>
                  <th className="px-3 py-2 text-right font-semibold text-slate-700">Margin %</th>
                </tr>
              </thead>
              <tbody>
                {portfolio.by_service.map((service, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="px-3 py-2 font-semibold text-slate-900">{service.service_name}</td>
                    <td className="px-3 py-2 text-right text-slate-700">{formatCurrency(service.gross_revenue)}</td>
                    <td className="px-3 py-2 text-right text-slate-700">{formatCurrency(service.service_cost)}</td>
                    <td className={`px-3 py-2 text-right font-semibold ${service.net_contribution >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                      {service.net_contribution >= 0 ? '+' : '−'}{formatCurrency(Math.abs(service.net_contribution))}
                    </td>
                    <td className="px-3 py-2 text-right text-slate-700">
                      {service.margin_percentage > 0 ? '+' : ''}{service.margin_percentage.toFixed(1)}%
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-100 border-t-2 border-slate-300">
                  <td className="px-3 py-2 font-bold text-slate-900">TOTAL</td>
                  <td className="px-3 py-2 text-right font-bold text-slate-900">{formatCurrency(portfolio.total_gross_revenue)}</td>
                  <td className="px-3 py-2 text-right font-bold text-slate-900">{formatCurrency(portfolio.total_service_cost)}</td>
                  <td className={`px-3 py-2 text-right font-bold ${portfolio.total_net_contribution >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                    {portfolio.total_net_contribution >= 0 ? '+' : '−'}{formatCurrency(Math.abs(portfolio.total_net_contribution))}
                  </td>
                  <td className="px-3 py-2 text-right font-bold text-slate-900">
                    {portfolio.net_margin_percentage > 0 ? '+' : ''}{portfolio.net_margin_percentage.toFixed(1)}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <h4 className="text-sm font-bold text-blue-900 mb-2">Integration with Tax Impact</h4>
        <p className="text-xs text-blue-900">
          Regional service revenue is automatically available as an offset in the Tax Impact Engine. As you increase adopted towns or expand services, the net contribution can reduce municipal tax impact.
        </p>
      </div>
    </div>
  );
}