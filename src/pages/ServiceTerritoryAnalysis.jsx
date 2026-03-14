import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus } from 'lucide-react';
import SectionHeader from '@/components/machias/SectionHeader';
import ServiceTerritoryDisplay from '@/components/territory/ServiceTerritoryDisplay';

const SERVICE_COLORS = {
  ambulance_ems: 'border-red-200 bg-red-50 text-red-900',
  police: 'border-blue-200 bg-blue-50 text-blue-900',
  transfer_station: 'border-orange-200 bg-orange-50 text-orange-900',
  public_works: 'border-green-200 bg-green-50 text-green-900',
  administrative_support: 'border-purple-200 bg-purple-50 text-purple-900',
  code_enforcement: 'border-amber-200 bg-amber-50 text-amber-900',
  dispatch_communications: 'border-indigo-200 bg-indigo-50 text-indigo-900',
};

export default function ServiceTerritoryAnalysis() {
  const [selectedTerritoryId, setSelectedTerritoryId] = useState(null);
  const [filterService, setFilterService] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const { data: territories = [] } = useQuery({
    queryKey: ['serviceTerritories'],
    queryFn: () => base44.entities.ServiceTerritory.list('-modified_date', 100),
  });

  const filtered = useMemo(() => {
    return territories.filter((t) => {
      if (filterService !== 'all' && t.service_type !== filterService) return false;
      if (filterStatus !== 'all' && t.status !== filterStatus) return false;
      return true;
    });
  }, [territories, filterService, filterStatus]);

  const selected = selectedTerritoryId ? territories.find((t) => t.id === selectedTerritoryId) : null;

  // Calculate portfolio metrics
  const portfolioMetrics = useMemo(() => {
    const serviceTypes = new Set(territories.map((t) => t.service_type));
    const totalCurrentPopulation = territories.reduce((sum, t) => sum + (t.total_current_population || 0), 0);
    const totalPotentialPopulation = territories.reduce((sum, t) => sum + (t.total_potential_population || 0), 0);
    const totalRevenueProjection = territories.reduce((sum, t) => sum + (t.revenue_assumptions?.total_projected_revenue || 0), 0);

    return {
      serviceCount: serviceTypes.size,
      totalCurrentPopulation,
      totalPotentialPopulation,
      totalRevenueProjection,
      averagePenetration: totalPotentialPopulation > 0 ? (totalCurrentPopulation / totalPotentialPopulation * 100).toFixed(1) : 0,
    };
  }, [territories]);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Service Territory Analysis"
        subtitle="Map Machias service offerings across region and track adoption by towns"
      />

      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-bold text-slate-600">Service Types</p>
          <p className="text-2xl font-bold text-slate-900 mt-2">{portfolioMetrics.serviceCount}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-bold text-slate-600">Territory Definitions</p>
          <p className="text-2xl font-bold text-slate-900 mt-2">{territories.length}</p>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs font-bold text-emerald-700">Currently Served</p>
          <p className="text-2xl font-bold text-emerald-900 mt-2">
            {(portfolioMetrics.totalCurrentPopulation / 1000).toFixed(0)}K
          </p>
        </div>
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-xs font-bold text-blue-700">Market Potential</p>
          <p className="text-2xl font-bold text-blue-900 mt-2">
            {(portfolioMetrics.totalPotentialPopulation / 1000).toFixed(0)}K
          </p>
        </div>
        <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
          <p className="text-xs font-bold text-purple-700">Projected Revenue</p>
          <p className="text-2xl font-bold text-purple-900 mt-2">
            ${(portfolioMetrics.totalRevenueProjection / 1000000).toFixed(1)}M
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Territory List */}
        <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
          <div className="bg-slate-900 text-white px-4 py-3">
            <h3 className="font-bold">Service Territories</h3>
          </div>

          {/* Filters */}
          <div className="p-4 space-y-3 border-b border-slate-200">
            <select
              value={filterService}
              onChange={(e) => setFilterService(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded px-2 py-1.5 focus:outline-none"
            >
              <option value="all">All Services</option>
              <option value="ambulance_ems">Ambulance / EMS</option>
              <option value="police">Police</option>
              <option value="transfer_station">Transfer Station</option>
              <option value="public_works">Public Works</option>
              <option value="administrative_support">Administrative Support</option>
              <option value="code_enforcement">Code Enforcement</option>
              <option value="dispatch_communications">Dispatch</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded px-2 py-1.5 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="concept">Concept</option>
              <option value="active">Active</option>
              <option value="mature">Mature</option>
              <option value="declining">Declining</option>
            </select>
          </div>

          {/* Territory Items */}
          <div className="divide-y divide-slate-200 max-h-96 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="p-4 text-center text-slate-600 text-xs">
                <p>No territories match filters</p>
              </div>
            ) : (
              filtered.map((territory) => {
                const colorClass = SERVICE_COLORS[territory.service_type] || SERVICE_COLORS.administrative_support;
                return (
                  <button
                    key={territory.id}
                    onClick={() => setSelectedTerritoryId(territory.id)}
                    className={`w-full text-left p-4 hover:bg-slate-50 transition-colors border-l-4 ${
                      selectedTerritoryId === territory.id ? 'border-blue-600 bg-blue-50' : 'border-transparent'
                    }`}
                  >
                    <h4 className="font-bold text-slate-900 text-sm">
                      {territory.territory_name || territory.service_type}
                    </h4>
                    <p className="text-xs text-slate-600 mt-1 capitalize">{territory.service_type.replace(/_/g, ' ')}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${colorClass}`}>
                        {territory.status}
                      </span>
                      {territory.penetration_rate && (
                        <span className="text-xs font-bold text-emerald-600">
                          {territory.penetration_rate.toFixed(0)}% penetration
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Add New Button */}
          <div className="p-3 border-t border-slate-200 bg-slate-50">
            <button className="w-full px-3 py-2 text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center justify-center gap-1 transition-colors">
              <Plus className="h-3 w-3" />
              Add Territory
            </button>
          </div>
        </div>

        {/* Territory Details */}
        <div className="lg:col-span-2">
          {selected ? (
            <ServiceTerritoryDisplay territory={selected} />
          ) : (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center">
              <p className="text-slate-600">Select a territory to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Service Type Summary */}
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h3 className="font-bold text-slate-900 mb-4">Services by Type</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { type: 'ambulance_ems', label: 'Ambulance / EMS' },
            { type: 'police', label: 'Police' },
            { type: 'transfer_station', label: 'Transfer Station' },
            { type: 'public_works', label: 'Public Works' },
            { type: 'administrative_support', label: 'Administrative Support' },
            { type: 'code_enforcement', label: 'Code Enforcement' },
            { type: 'dispatch_communications', label: 'Dispatch' },
          ].map((service) => {
            const count = territories.filter((t) => t.service_type === service.type).length;
            return (
              <div
                key={service.type}
                className={`p-4 rounded-lg border ${SERVICE_COLORS[service.type]}`}
              >
                <p className="font-bold text-sm">{service.label}</p>
                <p className="text-2xl font-bold mt-2">{count}</p>
                <p className="text-xs opacity-75 mt-1">
                  {count === 1 ? 'territory' : 'territories'}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Market Expansion Opportunities */}
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h3 className="font-bold text-slate-900 mb-4">Expansion Opportunities</h3>
        <div className="space-y-3 text-sm">
          {territories
            .filter((t) => t.likely_candidates && t.likely_candidates.length > 0)
            .slice(0, 3)
            .map((territory) => (
              <div key={territory.id} className="p-3 bg-slate-50 rounded border border-slate-200">
                <p className="font-bold text-slate-900">{territory.territory_name || territory.service_type}</p>
                <p className="text-xs text-slate-600 mt-1">
                  {territory.likely_candidates.length} likely candidates
                </p>
                {territory.growth_strategy && (
                  <p className="text-xs text-slate-700 mt-2">{territory.growth_strategy}</p>
                )}
              </div>
            ))}
        </div>
      </div>

      {/* Best Practices */}
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-6">
        <h3 className="font-bold text-slate-900 mb-3">Service Territory Strategy</h3>
        <ul className="space-y-1 text-sm text-slate-700">
          <li>• Map geographic coverage and response standards</li>
          <li>• Define revenue and cost models for each service</li>
          <li>• Identify governance structure (agreements, control levels)</li>
          <li>• Stage outreach: current recipients → candidates → prospects</li>
          <li>• Track staffing and governance assumptions by territory</li>
          <li>• Monitor penetration rate and market expansion</li>
          <li>• Assess competitive threats and mitigation</li>
        </ul>
      </div>
    </div>
  );
}