import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { runProFormaFromSettings } from './FinancialModelV2';
import { X, Plus } from 'lucide-react';

const fmt = (n) => n == null ? '—' : `$${Math.abs(Math.round(n)).toLocaleString()}`;
const pct = (n) => `${(n * 100).toFixed(1)}%`;

export default function ScenarioComparison() {
  const [scenarios, setScenarios] = useState([]);
  const [selectedScenarioIds, setSelectedScenarioIds] = useState([]);
  const [allScenarios, setAllScenarios] = useState([]);
  const [modelSettings, setModelSettings] = useState({});

  // Load all scenarios
  React.useEffect(() => {
    base44.entities.Scenario.list().then(setAllScenarios);
    base44.entities.ModelSettings.filter({ key: 'main' }).then(records => {
      if (records?.length > 0) setModelSettings(records[0]);
    });
  }, []);

  // Build comparison data
  const comparisonData = useMemo(() => {
    if (!selectedScenarioIds.length) return null;

    const data = selectedScenarioIds.map(id => {
      const scenario = allScenarios.find(s => s.id === id);
      if (!scenario) return null;

      // Merge scenario settings with base model settings
      const settings = {
        ...modelSettings,
        ...(scenario.staffing_assumptions && {
          y1_staffing_model: scenario.staffing_assumptions.y1_staffing_model,
          y5_senior_hire: scenario.staffing_assumptions.y5_senior_hire,
          police_admin_enabled: scenario.staffing_assumptions.police_admin_enabled,
        }),
        ...(scenario.financial_assumptions && {
          wage_growth_rate: scenario.financial_assumptions.wage_growth_rate,
          health_tier: scenario.financial_assumptions.health_tier,
          transport_growth_rate: scenario.financial_assumptions.transport_growth_rate,
        }),
      };

      const proForma = runProFormaFromSettings(settings);
      const y1 = proForma[0];
      const y5 = proForma[4];
      const y5Total = proForma.reduce((sum, d) => sum + d.net, 0);

      return {
        scenario,
        settings,
        proForma,
        metrics: {
          y1Net: y1.net,
          y1GFDraw: y1.gf?.undesignatedDraw || 0,
          y5Total,
          regionalRevenue: y1.value?.regionalServices || 0,
          staffingFTE: 2 + (scenario.staffing_assumptions?.police_admin_enabled ? 1 : 0),
          taxImpactMills: (y1.net / (modelSettings.total_assessed_value || 198000000)) * 1000,
        }
      };
    }).filter(Boolean);

    return data;
  }, [selectedScenarioIds, allScenarios, modelSettings]);

  const handleAddScenario = (scenarioId) => {
    if (!selectedScenarioIds.includes(scenarioId) && selectedScenarioIds.length < 4) {
      setSelectedScenarioIds([...selectedScenarioIds, scenarioId]);
    }
  };

  const handleRemoveScenario = (scenarioId) => {
    setSelectedScenarioIds(selectedScenarioIds.filter(id => id !== scenarioId));
  };

  if (!comparisonData || comparisonData.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="text-center space-y-3">
          <p className="text-sm font-semibold text-slate-900">Compare Scenarios</p>
          <p className="text-xs text-slate-600">Select 2-4 scenarios to compare side-by-side</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {allScenarios.slice(0, 6).map(s => (
              <button
                key={s.id}
                onClick={() => handleAddScenario(s.id)}
                className="text-xs font-medium px-3 py-1.5 rounded border border-slate-200 hover:border-slate-400 hover:bg-slate-50 transition-all"
              >
                <Plus className="h-3 w-3 inline mr-1" />
                {s.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Selected scenarios */}
      <div className="flex gap-2 flex-wrap">
        {selectedScenarioIds.map(id => {
          const s = allScenarios.find(sc => sc.id === id);
          return (
            <div key={id} className="bg-slate-100 text-slate-900 text-sm font-medium px-3 py-2 rounded-lg flex items-center gap-2">
              {s.name}
              <button
                onClick={() => handleRemoveScenario(id)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
        {selectedScenarioIds.length < 4 && (
          <select
            onChange={(e) => {
              if (e.target.value) handleAddScenario(e.target.value);
              e.target.value = '';
            }}
            className="text-xs font-medium px-3 py-2 rounded border border-slate-200 hover:border-slate-400"
          >
            <option value="">+ Add Scenario</option>
            {allScenarios
              .filter(s => !selectedScenarioIds.includes(s.id))
              .map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
          </select>
        )}
      </div>

      {/* Comparison table */}
      <div className="rounded-lg border border-slate-200 bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-600">Metric</th>
              {comparisonData.map(d => (
                <th key={d.scenario.id} className="px-4 py-3 text-left">
                  <div className="text-xs font-bold text-slate-900">{d.scenario.name}</div>
                  <div className="text-[10px] text-slate-500">{d.scenario.type}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {/* Year 1 Net */}
            <tr>
              <td className="px-4 py-3 text-xs font-semibold text-slate-700">Year 1 Net Impact</td>
              {comparisonData.map(d => (
                <td key={d.scenario.id} className="px-4 py-3">
                  <div className={`text-sm font-bold ${d.metrics.y1Net >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                    {fmt(d.metrics.y1Net)}
                  </div>
                </td>
              ))}
            </tr>

            {/* 5-Year Total */}
            <tr>
              <td className="px-4 py-3 text-xs font-semibold text-slate-700">5-Year Total Value</td>
              {comparisonData.map(d => (
                <td key={d.scenario.id} className="px-4 py-3">
                  <div className={`text-sm font-bold ${d.metrics.y5Total >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                    {fmt(d.metrics.y5Total)}
                  </div>
                </td>
              ))}
            </tr>

            {/* Tax Impact */}
            <tr>
              <td className="px-4 py-3 text-xs font-semibold text-slate-700">Tax Mill Impact (Y1)</td>
              {comparisonData.map(d => (
                <td key={d.scenario.id} className="px-4 py-3">
                  <div className={`text-sm font-bold ${d.metrics.taxImpactMills <= 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {d.metrics.taxImpactMills > 0 ? '+' : ''}{d.metrics.taxImpactMills.toFixed(3)}M
                  </div>
                </td>
              ))}
            </tr>

            {/* GF Undesignated Draw */}
            <tr>
              <td className="px-4 py-3 text-xs font-semibold text-slate-700">GF Undesignated Draw (Y1)</td>
              {comparisonData.map(d => (
                <td key={d.scenario.id} className="px-4 py-3">
                  <div className={`text-sm font-bold ${d.metrics.y1GFDraw === 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {d.metrics.y1GFDraw === 0 ? 'None' : fmt(d.metrics.y1GFDraw)}
                  </div>
                </td>
              ))}
            </tr>

            {/* Staffing */}
            <tr>
              <td className="px-4 py-3 text-xs font-semibold text-slate-700">New Full-Time Staff</td>
              {comparisonData.map(d => (
                <td key={d.scenario.id} className="px-4 py-3">
                  <div className="text-sm font-bold text-slate-900">{d.metrics.staffingFTE} FTE</div>
                </td>
              ))}
            </tr>

            {/* Regional Revenue */}
            <tr>
              <td className="px-4 py-3 text-xs font-semibold text-slate-700">Year 1 Regional Revenue</td>
              {comparisonData.map(d => (
                <td key={d.scenario.id} className="px-4 py-3">
                  <div className="text-sm font-bold text-emerald-700">{fmt(d.metrics.regionalRevenue)}</div>
                </td>
              ))}
            </tr>

            {/* Staffing Model */}
            <tr>
              <td className="px-4 py-3 text-xs font-semibold text-slate-700">Year 1 Staffing Model</td>
              {comparisonData.map(d => (
                <td key={d.scenario.id} className="px-4 py-3">
                  <div className="text-sm text-slate-700">
                    {d.scenario.staffing_assumptions?.y1_staffing_model === 'fulltime_sa' ? 'Full-time SA' : 'Part-time + Stipend'}
                  </div>
                </td>
              ))}
            </tr>

            {/* Police Admin */}
            <tr>
              <td className="px-4 py-3 text-xs font-semibold text-slate-700">Police Admin Coordinator</td>
              {comparisonData.map(d => (
                <td key={d.scenario.id} className="px-4 py-3">
                  <div className="text-sm">
                    {d.scenario.staffing_assumptions?.police_admin_enabled ? (
                      <span className="text-emerald-700 font-medium">Enabled</span>
                    ) : (
                      <span className="text-slate-500">Not included</span>
                    )}
                  </div>
                </td>
              ))}
            </tr>

            {/* Regional Services */}
            <tr>
              <td className="px-4 py-3 text-xs font-semibold text-slate-700">Regional Services Pursuit</td>
              {comparisonData.map(d => (
                <td key={d.scenario.id} className="px-4 py-3">
                  <div className="text-sm">
                    {d.scenario.staffing_assumptions?.regional_services_enabled ? (
                      <span className="text-emerald-700 font-medium">Yes</span>
                    ) : (
                      <span className="text-slate-500">No</span>
                    )}
                  </div>
                </td>
              ))}
            </tr>

            {/* ERP Implementation */}
            <tr>
              <td className="px-4 py-3 text-xs font-semibold text-slate-700">ERP Implementation</td>
              {comparisonData.map(d => (
                <td key={d.scenario.id} className="px-4 py-3">
                  <div className="text-sm">
                    {d.scenario.operational_assumptions?.erp_implementation ? (
                      <span className="text-emerald-700 font-medium">Yes</span>
                    ) : (
                      <span className="text-slate-500">No</span>
                    )}
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Risk summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {comparisonData.map(d => (
          <div key={d.scenario.id} className="rounded-lg border border-slate-200 p-4">
            <h4 className="text-sm font-bold text-slate-900 mb-2">{d.scenario.name} Risks</h4>
            {d.scenario.risks?.length > 0 ? (
              <ul className="space-y-1">
                {d.scenario.risks.slice(0, 3).map((risk, i) => (
                  <li key={i} className="text-xs text-slate-700">
                    <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                      risk.probability === 'high' ? 'bg-red-500' :
                      risk.probability === 'medium' ? 'bg-amber-500' :
                      'bg-blue-500'
                    }`}></span>
                    {risk.risk}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-500 italic">No risks documented</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}