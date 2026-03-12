import React, { useState } from 'react';
import { useModel } from '../components/machias/ModelContext';
import { runProFormaFromSettings } from '../components/machias/FinancialModelV2';
import SectionHeader from '../components/machias/SectionHeader';
import { BarChart2, CheckCircle2, Circle, AlertCircle } from 'lucide-react';

const fmt = (n) => n == null ? '—' : `$${Math.abs(Math.round(n)).toLocaleString()}`;

const STATUS_ICONS = {
  on_track: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />,
  not_started: <Circle className="h-3.5 w-3.5 text-slate-300" />,
  at_risk: <AlertCircle className="h-3.5 w-3.5 text-amber-500" />,
  complete: <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />,
};

function MetricRow({ metric, target, actual, unit, status, note, frequency }) {
  const statusStyle = {
    on_track: 'text-emerald-700 bg-emerald-50',
    not_started: 'text-slate-500 bg-slate-50',
    at_risk: 'text-amber-700 bg-amber-50',
    complete: 'text-blue-700 bg-blue-50',
  };
  return (
    <div className="px-4 py-3 grid grid-cols-5 text-xs border-t border-slate-100 items-center gap-2">
      <span className="font-medium text-slate-800 col-span-1">{metric}</span>
      <span className="font-mono text-slate-600">{target}</span>
      <span className={`font-mono font-semibold ${actual === '—' || actual === 'TBD' ? 'text-slate-400' : 'text-slate-800'}`}>{actual}</span>
      <div className="flex items-center gap-1.5">
        {STATUS_ICONS[status]}
        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${statusStyle[status]}`}>
          {status.replace('_', ' ')}
        </span>
      </div>
      <span className="text-slate-400 text-[10px]">{frequency} · {note}</span>
    </div>
  );
}

export default function PerformanceMetrics() {
  const { settings } = useModel();
  const data = runProFormaFromSettings(settings);
  const d1 = data[0];
  const [activeCategory, setActiveCategory] = useState('financial');

  const CATEGORIES = [
    { id: 'financial', label: 'Financial' },
    { id: 'staffing', label: 'Staffing & Capacity' },
    { id: 'ems', label: 'EMS Billing' },
    { id: 'regional', label: 'Regional Services' },
    { id: 'erp', label: 'ERP Implementation' },
    { id: 'ts', label: 'Transfer Station' },
    { id: 'risk', label: 'Risk & Controls' },
  ];

  const METRICS = {
    financial: [
      { metric: 'Y1 GF Levy Impact', target: '≤ $0 (levy neutral)', actual: `${d1.gf.gfNetLevyImpact <= 0 ? `(${fmt(Math.abs(d1.gf.gfNetLevyImpact))}) surplus` : fmt(d1.gf.gfNetLevyImpact)}`, unit: '$', status: d1.gf.gfNetLevyImpact <= 0 ? 'on_track' : 'at_risk', note: 'Model projection', frequency: 'Annual' },
      { metric: 'Undesignated Fund Draw Y1', target: '$0', actual: d1.gf.undesignatedDraw === 0 ? '$0' : fmt(d1.gf.undesignatedDraw), unit: '$', status: d1.gf.undesignatedDraw === 0 ? 'on_track' : 'at_risk', note: 'Model projection', frequency: 'Annual' },
      { metric: '5-Year Cash Net', target: '> $0', actual: fmt(data.reduce((s,d)=>{const c=d.value.comstarAvoided+d.value.collectionImprovement+d.value.stipendSavings+d.value.airportSavings+d.value.regionalServices+d.value.emsExternal+d.value.transferStation;return s+c-d.costs.total;},0)), unit: '$', status: 'not_started', note: 'Cumulative actual vs. projected', frequency: 'Annual' },
      { metric: 'Enterprise overhead recovered Y1', target: fmt(d1.value.enterpriseOverhead), actual: 'TBD', unit: '$', status: 'not_started', note: 'Actual transfers from enterprise funds', frequency: 'Annual' },
      { metric: 'Stipend savings realized', target: fmt(settings.stipend_elimination) + '/yr', actual: 'TBD', unit: '$', status: 'not_started', note: 'Upon SA hire', frequency: 'Annual' },
      { metric: 'Mill rate impact', target: '< +0.05 mills', actual: `${d1.gf.millRateImpact.toFixed(4)} mills`, unit: 'mills', status: d1.gf.millRateImpact <= 0.05 ? 'on_track' : 'at_risk', note: 'Model projection', frequency: 'Annual' },
    ],
    staffing: [
      { metric: 'SA hire completion', target: 'Month 1–3', actual: 'Not started', unit: 'date', status: 'not_started', note: 'Critical path', frequency: 'One-time' },
      { metric: 'Billing Specialist hire', target: 'Month 7', actual: 'Not started', unit: 'date', status: 'not_started', note: 'Depends on SA operational', frequency: 'One-time' },
      { metric: 'GA Coordinator in place', target: 'Month 9', actual: 'Not started', unit: 'date', status: 'not_started', note: 'Stipend arrangement', frequency: 'One-time' },
      { metric: 'FD capacity freed Y1', target: '≥ 45%', actual: 'TBD', unit: '%', status: 'not_started', note: 'Self-reported time analysis', frequency: 'Semi-annual' },
      { metric: 'TM capacity freed Y1', target: '≥ 18%', actual: 'TBD', unit: '%', status: 'not_started', note: 'Self-reported time analysis', frequency: 'Semi-annual' },
      { metric: 'SA 90-day performance review', target: 'Satisfactory', actual: 'TBD', unit: 'rating', status: 'not_started', note: 'Process reconciliation, COA progress', frequency: 'One-time' },
      { metric: 'Procedures manual completion', target: 'Month 6 (SA)', actual: 'Not started', unit: 'date', status: 'not_started', note: 'Key retention/succession tool', frequency: 'One-time' },
    ],
    ems: [
      { metric: 'Comstar parallel run start', target: 'Month 7', actual: 'Not started', unit: 'date', status: 'not_started', note: 'BS hire date', frequency: 'One-time' },
      { metric: 'Comstar cutover complete', target: 'Month 10', actual: 'Not started', unit: 'date', status: 'not_started', note: 'Full in-house billing', frequency: 'One-time' },
      { metric: 'Y1 collection rate', target: `≥ ${(settings.inhouse_y1_rate*100).toFixed(1)}%`, actual: 'TBD', unit: '%', status: 'not_started', note: 'In-house vs. Comstar rate', frequency: 'Monthly' },
      { metric: 'Steady-state collection rate', target: `≥ ${(settings.inhouse_steady_rate*100).toFixed(0)}%`, actual: 'TBD', unit: '%', status: 'not_started', note: 'Y2+ target', frequency: 'Monthly' },
      { metric: 'Comstar fee avoided Y1', target: fmt(d1.value.comstarAvoided), actual: 'TBD', unit: '$', status: 'not_started', note: 'Credited to Ambulance Fund', frequency: 'Annual' },
      { metric: 'Denial rate', target: '< 8%', actual: 'TBD', unit: '%', status: 'not_started', note: 'Industry benchmark: 5–10%', frequency: 'Monthly' },
      { metric: 'Days-to-bill (transport to claim)', target: '< 5 business days', actual: 'TBD', unit: 'days', status: 'not_started', note: 'Timeliness metric', frequency: 'Monthly' },
      { metric: 'External EMS billing client 1', target: 'Year 2', actual: 'Not started', unit: 'date', status: 'not_started', note: 'Jonesport or Harrington', frequency: 'Annual' },
    ],
    regional: [
      { metric: 'Roque Bluffs contract signed', target: 'Month 6–9', actual: 'Not started', unit: 'date', status: 'not_started', note: 'Confirmed interest', frequency: 'One-time' },
      { metric: 'Machiasport contract signed', target: 'Month 6–9', actual: 'Not started', unit: 'date', status: 'not_started', note: 'Confirmed interest', frequency: 'One-time' },
      { metric: 'Y1 regional revenue actual', target: fmt(d1.value.regionalServices), actual: 'TBD', unit: '$', status: 'not_started', note: '4-month partial year', frequency: 'Annual' },
      { metric: 'Marshfield outreach complete', target: 'Year 1', actual: 'Not started', unit: 'date', status: 'not_started', note: 'For Y2 contract', frequency: 'Annual' },
      { metric: 'Monthly deliverable on-time rate', target: '≥ 95%', actual: 'TBD', unit: '%', status: 'not_started', note: 'Per interlocal agreement', frequency: 'Monthly' },
      { metric: 'Revenue Coordinator trigger reached', target: 'Year 3', actual: 'Not started', unit: 'date', status: 'not_started', note: 'When regional revenue ≥ RC loaded cost', frequency: 'Annual' },
      { metric: 'Client satisfaction (annual survey)', target: '≥ 4/5', actual: 'TBD', unit: 'rating', status: 'not_started', note: 'Annual client survey', frequency: 'Annual' },
    ],
    erp: [
      { metric: 'COA gap analysis complete', target: 'Month 3–6 post SA hire', actual: 'Not started', unit: 'date', status: 'not_started', note: 'Phase 0 deliverable', frequency: 'One-time' },
      { metric: 'ERP RFP issued', target: 'Month 6–9 post SA hire', actual: 'Not started', unit: 'date', status: 'not_started', note: 'Phase 1', frequency: 'One-time' },
      { metric: 'Vendor selected', target: 'Month 9–12 post SA hire', actual: 'Not started', unit: 'date', status: 'not_started', note: 'Phase 1 complete', frequency: 'One-time' },
      { metric: 'Town Meeting ERP appropriation', target: `${fmt(settings.erp_y1_cost)} approved`, actual: 'Not started', unit: '$', status: 'not_started', note: 'Budget phase', frequency: 'One-time' },
      { metric: 'COA rebuild complete', target: 'FY2028 Q1-Q2', actual: 'Not started', unit: 'date', status: 'not_started', note: 'Phase 2', frequency: 'One-time' },
      { metric: 'ERP go-live', target: 'FY2028 Q3-Q4', actual: 'Not started', unit: 'date', status: 'not_started', note: 'Phase 4', frequency: 'One-time' },
      { metric: 'Parallel period complete', target: '60–90 days post go-live', actual: 'Not started', unit: 'date', status: 'not_started', note: 'Validation period', frequency: 'One-time' },
      { metric: 'Annual ERP value realized', target: fmt(settings.erp_annual_value) + '/yr (Y2+)', actual: 'TBD', unit: '$', status: 'not_started', note: 'Reconciliation time + audit efficiency', frequency: 'Annual' },
    ],
    ts: [
      { metric: 'TS cost study complete', target: 'Year 1', actual: 'Not started', unit: 'date', status: 'not_started', note: 'SA deliverable', frequency: 'One-time' },
      { metric: 'Member agreement renegotiations', target: 'Y1 Q3–Q4', actual: 'Not started', unit: 'date', status: 'not_started', note: 'Based on cost study', frequency: 'Annual' },
      { metric: 'Fund deficit trend', target: 'Reduce ≥ $30K/yr', actual: '($296K) current', unit: '$', status: 'at_risk', note: 'Enterprise fund balance', frequency: 'Annual' },
      { metric: 'Cost recovery ratio', target: '≥ 95% by Y3', actual: 'TBD', unit: '%', status: 'not_started', note: 'Revenue / operating costs', frequency: 'Annual' },
      { metric: 'New member towns', target: '2 by Year 3', actual: '0 currently', unit: 'count', status: 'not_started', note: 'Wesley, Beddington targets', frequency: 'Annual' },
      { metric: 'Tonnage tracking implemented', target: 'Year 1', actual: 'Not started', unit: 'date', status: 'not_started', note: 'Required for cost allocation', frequency: 'One-time' },
    ],
    risk: [
      { metric: 'Separation of duties remediated', target: 'Upon SA hire', actual: 'Not remediated', unit: 'date', status: 'at_risk', note: 'Auditor finding', frequency: 'Annual audit' },
      { metric: 'Annual audit finding count', target: '< 3 material findings', actual: 'TBD', unit: 'count', status: 'not_started', note: 'Track year-over-year', frequency: 'Annual' },
      { metric: 'Grant compliance incidents', target: '0', actual: 'TBD', unit: 'count', status: 'not_started', note: 'Disallowances or findings', frequency: 'Annual' },
      { metric: 'Monthly close completion', target: '≤ 15th of following month', actual: 'Not tracked', unit: 'date', status: 'not_started', note: 'Financial management discipline', frequency: 'Monthly' },
      { metric: 'Budget variance', target: '< 5% actual vs. budget', actual: 'TBD', unit: '%', status: 'not_started', note: 'Annual GF budget', frequency: 'Annual' },
      { metric: 'Insurance coverage adequate', target: 'Annual review', actual: 'TBD', unit: 'date', status: 'not_started', note: 'Including interlocal E&O', frequency: 'Annual' },
    ],
  };

  const active = METRICS[activeCategory] || [];

  return (
    <div className="space-y-8">
      <SectionHeader title="Performance Metrics Dashboard" subtitle="Track actual vs. projected across all restructuring initiatives" icon={BarChart2} />

      <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 text-xs text-amber-800">
        <strong>About this dashboard:</strong> Metrics marked "Not started" or "TBD" represent targets that will be trackable once implementation begins. The Select Board and Town Manager should review this dashboard quarterly and update actual values as they become available.
      </div>

      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map(cat => (
          <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${activeCategory === cat.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            {cat.label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 text-white px-4 py-2 text-[10px] font-semibold uppercase tracking-wider grid grid-cols-5 gap-2">
          <span>Metric</span><span>Target</span><span>Actual</span><span>Status</span><span>Freq · Note</span>
        </div>
        {active.map((m, i) => <MetricRow key={i} {...m} />)}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(METRICS).map(([key, metrics]) => {
          const onTrack = metrics.filter(m => m.status === 'on_track').length;
          const atRisk = metrics.filter(m => m.status === 'at_risk').length;
          const total = metrics.length;
          const cat = CATEGORIES.find(c => c.id === key);
          return (
            <button key={key} onClick={() => setActiveCategory(key)}
              className="rounded-xl border border-slate-200 bg-white p-4 text-left hover:border-slate-400 transition-colors">
              <p className="text-xs font-semibold text-slate-700">{cat?.label}</p>
              <p className="text-lg font-bold text-slate-900 mt-1">{total} metrics</p>
              <div className="flex gap-2 mt-1">
                {onTrack > 0 && <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 rounded">{onTrack} on track</span>}
                {atRisk > 0 && <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 rounded">{atRisk} at risk</span>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}