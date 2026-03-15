/**
 * RegionalOptimizerPanel
 * Self-contained panel that lets users select towns + services,
 * see coverage estimates, cost/resident calculations, contract revenue,
 * staffing impacts, and a with/without-regionalization comparison.
 *
 * Used on RegionalServices page and as a side panel on RegionalMap.
 */

import React, { useState, useMemo } from 'react';
import { useModel } from '@/components/machias/ModelContext';
import {
  MACHIAS_SERVICES,
  estimateCoverageArea,
  compareRegionalizationScenarios,
  costPerResident,
} from './serviceOptimizer';

const fmt = n => `$${Math.round(Math.abs(n || 0)).toLocaleString()}`;
const fmtK = n => `$${Math.round(Math.abs(n || 0) / 1000)}K`;

// Static town list (matches seeded Town records + RegionalServices page)
const TOWNS = [
  { name: 'Machiasport', population: 952,  distance_from_machias_miles: 5.2  },
  { name: 'Roque Bluffs', population: 294,  distance_from_machias_miles: 8.4  },
  { name: 'Marshfield',  population: 1419, distance_from_machias_miles: 6.1  },
  { name: 'Whitneyville', population: 381,  distance_from_machias_miles: 3.9  },
  { name: 'Northfield',  population: 481,  distance_from_machias_miles: 11.2 },
  { name: 'East Machias', population: 1218, distance_from_machias_miles: 4.7  },
  { name: 'Jonesboro',   population: 585,  distance_from_machias_miles: 14.3 },
  { name: 'Wesley',      population: 481,  distance_from_machias_miles: 17.8 },
  { name: 'Cutler',      population: 457,  distance_from_machias_miles: 21.4 },
];

const SERVICE_COLORS = {
  financial_administration: '#344A60',
  ems_billing: '#2A7F7F',
  transfer_station: '#9C5334',
  ambulance_coverage: '#6B5EA8',
  code_enforcement: '#2D7D46',
  assessing: '#B5691E',
};

export default function RegionalOptimizerPanel({ compact = false }) {
  const { settings } = useModel();
  const [selectedTownNames, setSelectedTownNames] = useState(['Machiasport', 'Roque Bluffs']);
  const [selectedServices, setSelectedServices] = useState(['financial_administration', 'transfer_station']);
  const [activeTab, setActiveTab] = useState('coverage');

  const selectedTowns = TOWNS.filter(t => selectedTownNames.includes(t.name));

  const coverageByService = useMemo(() =>
    selectedServices.map(sid => ({
      service: MACHIAS_SERVICES[sid],
      towns: estimateCoverageArea(TOWNS, sid),
    })),
    [selectedServices]
  );

  const comparison = useMemo(() =>
    compareRegionalizationScenarios(settings, selectedTowns, selectedServices),
    [settings, selectedTowns, selectedServices]
  );

  const toggleTown = name => setSelectedTownNames(prev =>
    prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
  );
  const toggleService = id => setSelectedServices(prev =>
    prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100" style={{ background: '#344A60' }}>
        <h3 className="text-sm font-bold text-white">Regional Service Optimizer</h3>
        <p className="text-[10px] mt-0.5" style={{ color: '#B3C6C8' }}>
          Select towns and services to model regionalization impact
        </p>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
        {[
          { label: '5-yr Revenue', value: fmtK(comparison.summary.totalRevenue5yr), color: 'text-emerald-700' },
          { label: 'Net Benefit', value: fmtK(comparison.summary.netBenefit5yr), color: 'text-emerald-700' },
          { label: 'Mill Δ /yr', value: `${comparison.millRateReduction > 0 ? '-' : '+'}${Math.abs(comparison.millRateReduction).toFixed(3)}`, color: comparison.millRateReduction > 0 ? 'text-emerald-700' : 'text-red-600' },
        ].map(s => (
          <div key={s.label} className="px-3 py-2 text-center">
            <p className={`text-sm font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[9px] text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Town + service selectors */}
      <div className="px-3 pt-3 pb-2 space-y-2">
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Partner Towns</p>
          <div className="flex flex-wrap gap-1.5">
            {TOWNS.map(t => (
              <button key={t.name} onClick={() => toggleTown(t.name)}
                className={`text-[10px] px-2 py-1 rounded-full border font-medium transition-all ${
                  selectedTownNames.includes(t.name)
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                }`}>
                {t.name}
                <span className="opacity-60 ml-1">{t.population}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Services</p>
          <div className="flex flex-wrap gap-1.5">
            {Object.values(MACHIAS_SERVICES).map(svc => (
              <button key={svc.id} onClick={() => toggleService(svc.id)}
                className={`text-[10px] px-2 py-1 rounded-full border font-medium transition-all flex items-center gap-1 ${
                  selectedServices.includes(svc.id)
                    ? 'text-white border-transparent'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                }`}
                style={selectedServices.includes(svc.id) ? { background: SERVICE_COLORS[svc.id] } : {}}>
                <span>{svc.icon}</span>
                {svc.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-3 flex gap-1 border-b border-slate-100 pb-0 overflow-x-auto">
        {[['coverage','Coverage'], ['revenue','Revenue'], ['staffing','Staffing'], ['compare','Compare']].map(([id, label]) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`text-[10px] px-3 py-2 font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === id ? 'border-slate-800 text-slate-800' : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}>
            {label}
          </button>
        ))}
      </div>

      <div className="p-3 space-y-3 max-h-96 overflow-y-auto">

        {/* ── Coverage tab ── */}
        {activeTab === 'coverage' && (
          <div className="space-y-3">
            {selectedServices.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-4">Select at least one service above</p>
            )}
            {coverageByService.map(({ service, towns }) => (
              <div key={service.id} className="rounded-xl border border-slate-100 overflow-hidden">
                <div className="px-3 py-2 flex items-center gap-2"
                  style={{ background: SERVICE_COLORS[service.id] + '18', borderBottom: `2px solid ${SERVICE_COLORS[service.id]}30` }}>
                  <span>{service.icon}</span>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-800">{service.label}</p>
                    <p className="text-[9px] text-slate-500">Radius: {service.coverageRadiusMiles} mi · Marginal cost: {fmt(service.marginalCostPerTown)}/town/yr</p>
                  </div>
                  <span className="text-[10px] font-bold" style={{ color: SERVICE_COLORS[service.id] }}>
                    {towns.length} towns in range
                  </span>
                </div>
                <div className="divide-y divide-slate-50">
                  {towns.slice(0, 6).map(t => {
                    const inSelected = selectedTownNames.includes(t.name);
                    return (
                      <div key={t.name} className={`px-3 py-1.5 grid grid-cols-4 text-[10px] ${inSelected ? 'bg-emerald-50' : ''}`}>
                        <span className={`font-medium ${inSelected ? 'text-emerald-800' : 'text-slate-700'}`}>
                          {inSelected ? '✓ ' : ''}{t.name}
                        </span>
                        <span className="text-slate-500">{t.distance_from_machias_miles} mi</span>
                        <span className="font-mono text-slate-700">{fmt(t.estimatedFee)}/yr</span>
                        <span className="font-mono text-emerald-700">{fmt(t.netBenefit)} net</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Revenue tab ── */}
        {activeTab === 'revenue' && (
          <div className="space-y-3">
            {/* Per-town breakdown */}
            <div className="rounded-xl border border-slate-100 overflow-hidden">
              <div className="bg-slate-50 px-3 py-1.5 grid grid-cols-5 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                <span>Town</span><span>Population</span><span>Fee/yr</span><span>Cost/yr</span><span>$/resident</span>
              </div>
              {selectedTowns.map(town => {
                const totalFee = selectedServices.reduce((s, sid) => {
                  const svc = MACHIAS_SERVICES[sid];
                  if (!svc) return s;
                  const settingKey = `${town.name.toLowerCase().replace(/ /g, '')}_annual_contract`;
                  return s + (settings[settingKey] || svc.baseAnnualFee);
                }, 0);
                const totalCost = selectedServices.reduce((s, sid) => s + (MACHIAS_SERVICES[sid]?.marginalCostPerTown || 0), 0);
                const net = totalFee - totalCost;
                const cpr = costPerResident(totalFee, town.population);
                return (
                  <div key={town.name} className="px-3 py-1.5 grid grid-cols-5 text-[10px] border-t border-slate-50">
                    <span className="font-medium text-slate-800">{town.name}</span>
                    <span className="text-slate-500">{town.population.toLocaleString()}</span>
                    <span className="font-mono text-emerald-700">{fmt(totalFee)}</span>
                    <span className="font-mono text-red-500">{fmt(totalCost)}</span>
                    <span className="font-mono text-slate-700">${cpr}</span>
                  </div>
                );
              })}
              {selectedTowns.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-3">Select partner towns above</p>
              )}
            </div>

            {/* 5-year projection table */}
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">5-Year Projection</p>
              <div className="rounded-xl border border-slate-100 overflow-hidden">
                <div className="bg-slate-50 px-3 py-1.5 grid grid-cols-4 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                  <span>Year</span><span>Revenue</span><span>Cost</span><span>Net</span>
                </div>
                {comparison.withRegional.map(yr => (
                  <div key={yr.year} className="px-3 py-1.5 grid grid-cols-4 text-[10px] border-t border-slate-50">
                    <span className="font-medium text-slate-700">{yr.label}</span>
                    <span className="font-mono text-emerald-700">{fmt(yr.revenue)}</span>
                    <span className="font-mono text-red-500">{fmt(yr.cost)}</span>
                    <span className={`font-mono font-semibold ${yr.net >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>{fmt(yr.net)}</span>
                  </div>
                ))}
                <div className="px-3 py-1.5 grid grid-cols-4 text-[10px] border-t border-slate-200 bg-slate-50 font-semibold">
                  <span className="text-slate-700">5-yr Total</span>
                  <span className="font-mono text-emerald-700">{fmt(comparison.summary.totalRevenue5yr)}</span>
                  <span className="font-mono text-red-500">{fmt(comparison.summary.totalCost5yr)}</span>
                  <span className="font-mono text-emerald-700">{fmt(comparison.summary.netBenefit5yr)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Staffing tab ── */}
        {activeTab === 'staffing' && (
          <div className="space-y-3">
            <div className={`rounded-xl border p-3 ${
              comparison.staffingImpact.canHandleWithCurrent ? 'border-emerald-200 bg-emerald-50' :
              comparison.staffingImpact.requiresNewHire ? 'border-amber-200 bg-amber-50' : 'border-blue-200 bg-blue-50'
            }`}>
              <p className={`text-xs font-bold mb-1 ${
                comparison.staffingImpact.canHandleWithCurrent ? 'text-emerald-800' :
                comparison.staffingImpact.requiresNewHire ? 'text-amber-800' : 'text-blue-800'
              }`}>
                {comparison.staffingImpact.canHandleWithCurrent ? '✓ Within Capacity' :
                 comparison.staffingImpact.requiresNewHire ? '⚠ New Hire Required' : '→ Near Capacity'}
              </p>
              <p className="text-[11px] text-slate-700">{comparison.staffingImpact.note}</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Additional Hours/Month', value: comparison.staffingImpact.additionalHoursPerMonth },
                { label: 'FTEs Needed', value: comparison.staffingImpact.additionalFTEsNeeded.toFixed(2) },
              ].map(s => (
                <div key={s.label} className="rounded-lg border border-slate-100 bg-slate-50 p-2.5 text-center">
                  <p className="text-base font-bold text-slate-900">{s.value}</p>
                  <p className="text-[9px] text-slate-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Per-service staffing breakdown */}
            <div className="space-y-1.5">
              {selectedServices.map(sid => {
                const svc = MACHIAS_SERVICES[sid];
                const totalHrs = svc.hoursPerTownPerMonth * selectedTowns.length;
                return (
                  <div key={sid} className="rounded-lg border border-slate-100 px-3 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span>{svc.icon}</span>
                      <div>
                        <p className="text-[10px] font-semibold text-slate-800">{svc.label}</p>
                        <p className="text-[9px] text-slate-500">{svc.hoursPerTownPerMonth} hrs/town/mo · {svc.machinasCapacityNeeded}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-800">{totalHrs} hrs/mo</p>
                      <p className="text-[9px] text-slate-500">{selectedTowns.length} towns</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {comparison.staffingImpact.triggers.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5">
                <p className="text-[10px] font-bold text-amber-800 mb-1">Hiring Triggers</p>
                {comparison.staffingImpact.triggers.map((t, i) => (
                  <p key={i} className="text-[10px] text-amber-700">→ {t.replace(/_/g, ' ')}</p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Compare tab ── */}
        {activeTab === 'compare' && (
          <div className="space-y-3">
            <div className="rounded-xl border border-slate-100 overflow-hidden">
              <div className="grid grid-cols-3 divide-x divide-slate-100 bg-slate-50">
                <div className="px-3 py-2 text-center">
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Metric</p>
                </div>
                <div className="px-3 py-2 text-center">
                  <p className="text-[9px] font-bold text-emerald-600 uppercase">With Regional</p>
                </div>
                <div className="px-3 py-2 text-center">
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Without</p>
                </div>
              </div>
              {[
                { label: 'Y1 Revenue', with: fmt(comparison.summary.yr1Revenue), without: '—' },
                { label: 'Y3 Revenue', with: fmt(comparison.summary.yr3Revenue), without: '—' },
                { label: 'Y5 Revenue', with: fmt(comparison.summary.yr5Revenue), without: '—' },
                { label: '5-yr Net Benefit', with: fmt(comparison.summary.netBenefit5yr), without: '$0' },
                { label: 'Mill Rate Impact/yr', with: `-${Math.abs(comparison.millRateReduction).toFixed(3)}`, without: '0.000' },
                { label: 'Towns Served', with: comparison.summary.townsServed, without: '0' },
                { label: 'New FTEs Needed', with: comparison.staffingImpact.additionalFTEsNeeded.toFixed(2), without: '0' },
              ].map((row, i) => (
                <div key={i} className="grid grid-cols-3 divide-x divide-slate-50 border-t border-slate-50">
                  <div className="px-3 py-1.5">
                    <p className="text-[10px] text-slate-600">{row.label}</p>
                  </div>
                  <div className="px-3 py-1.5 text-center">
                    <p className="text-[10px] font-bold text-emerald-700">{row.with}</p>
                  </div>
                  <div className="px-3 py-1.5 text-center">
                    <p className="text-[10px] text-slate-400">{row.without}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-blue-100 bg-blue-50/40 p-2.5">
              <p className="text-[10px] font-semibold text-blue-800 mb-1">Interpretation</p>
              <p className="text-[10px] text-blue-700">
                Regionalization with {comparison.summary.townsServed} town{comparison.summary.townsServed !== 1 ? 's' : ''} and {comparison.summary.servicesOffered} service{comparison.summary.servicesOffered !== 1 ? 's' : ''} generates {fmt(comparison.summary.netBenefit5yr)} net over 5 years — enough to offset ~{comparison.millRateReduction.toFixed(3)} mills annually.
                {comparison.staffingImpact.requiresNewHire ? ' A Revenue Coordinator hire is needed to sustain this program.' : ' Current staff can absorb this workload.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}