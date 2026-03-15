import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useModel } from '@/components/machias/ModelContext';
import { runProFormaFromSettings } from '@/components/machias/FinancialModelV2';
import DashboardKPIRow from '@/components/dashboard/DashboardKPIRow';
import DashboardERPTimeline from '@/components/dashboard/DashboardERPTimeline';
import DashboardAlertsPanel from '@/components/dashboard/DashboardAlertsPanel';
import DashboardProjectCards from '@/components/dashboard/DashboardProjectCards';
import FinancialHealthPanel from '@/components/dashboard/FinancialHealthPanel';
import TaxRateProjectionChart from '@/components/dashboard/TaxRateProjectionChart';
import ScenarioComparisonStrip from '@/components/dashboard/ScenarioComparisonStrip';
import { Download, SlidersHorizontal, RefreshCw, Map } from 'lucide-react';

const DEPT_OPTIONS = ['All Departments', 'Finance', 'Ambulance/EMS', 'Transfer Station', 'Administration', 'Public Works'];
const RANGE_OPTIONS = ['FY2027', 'FY2027–28', 'FY2027–31 (5-Year)'];

export default function Dashboard() {
  const { settings } = useModel();
  const [dept, setDept] = useState('All Departments');
  const [range, setRange] = useState('FY2027–31 (5-Year)');
  const [showFilters, setShowFilters] = useState(false);

  const projections = useMemo(() => {
    try { return runProFormaFromSettings(settings); } catch { return []; }
  }, [settings]);

  const handleExport = () => {
    const rows = [
      ['Year', 'Total Cost', 'Total Revenue', 'Net Impact'],
      ...(projections || []).map(y => [
        `Year ${y.year}`,
        y.costs?.total ?? '',
        y.value?.total ?? '',
        y.net ?? '',
      ]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'machias_financial_model.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">

      {/* ── Page Header ───────────────────────────────────────────── */}
      <div className="rounded-2xl p-5 sm:p-7" style={{ background: 'linear-gradient(135deg, #344A60 0%, #2a3c4f 100%)' }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: '#F6C85F' }}>
              Town of Machias · Strategic Plan FY2027–31
            </p>
            <h1 className="text-xl sm:text-2xl font-bold" style={{ color: '#E7D0B1' }}>
              Strategic Dashboard
            </h1>
            <p className="text-sm mt-1" style={{ color: '#B3C6C8' }}>
              Financial health · tax projections · restructuring progress
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowFilters(v => !v)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-400"
              style={{ borderColor: 'rgba(179,198,200,0.4)', color: '#E7D0B1', background: 'rgba(255,255,255,0.08)' }}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filters
            </button>
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-400"
              style={{ borderColor: 'rgba(179,198,200,0.4)', color: '#E7D0B1', background: 'rgba(255,255,255,0.08)' }}
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </button>
            <Link
              to="/RegionalMap"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-400"
              style={{ background: '#F6C85F', color: '#2F2F30' }}
            >
              <Map className="h-3.5 w-3.5" />
              Regional Map
            </Link>
          </div>
        </div>
      </div>

      {/* ── Global Filters ────────────────────────────────────────── */}
      {showFilters && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1">Date Range</label>
            <select value={range} onChange={e => setRange(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400">
              {RANGE_OPTIONS.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1">Department</label>
            <select value={dept} onChange={e => setDept(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400">
              {DEPT_OPTIONS.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <button
            onClick={() => { setDept('All Departments'); setRange('FY2027–31 (5-Year)'); }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <RefreshCw className="h-3 w-3" />
            Reset
          </button>
        </div>
      )}

      {/* ── Financial Health ──────────────────────────────────────── */}
      <FinancialHealthPanel projections={projections} settings={settings} />

      {/* ── KPI Row ───────────────────────────────────────────────── */}
      <DashboardKPIRow projections={projections} settings={settings} dept={dept} />

      {/* ── Tax Rate Projections + Scenario Strip ────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        <div className="xl:col-span-3">
          <TaxRateProjectionChart projections={projections} settings={settings} />
        </div>
        <div className="xl:col-span-2">
          <ScenarioComparisonStrip settings={settings} />
        </div>
      </div>

      {/* ── Bento Grid: Timeline + Alerts ────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2">
          <DashboardERPTimeline settings={settings} />
        </div>
        <div className="xl:col-span-1">
          <DashboardAlertsPanel projections={projections} settings={settings} />
        </div>
      </div>

      {/* ── Project Cards ─────────────────────────────────────────── */}
      <DashboardProjectCards projections={projections} settings={settings} dept={dept} />

      {/* ── Quick-Action Row ──────────────────────────────────────── */}
      <QuickActionRow />

      {/* ── Footer ────────────────────────────────────────────────── */}
      <div className="rounded-lg border border-slate-200 bg-white/60 p-3 text-[10px] text-slate-500 flex items-start gap-2">
        <span>ⓘ</span>
        <span>
          All figures are model projections based on current{' '}
          <Link to="/ModelSettings" className="underline hover:text-slate-700">Model Settings</Link>.
          Changes must be approved per the{' '}
          <Link to="/ComplianceSettings" className="underline hover:text-slate-700">Compliance workflow</Link>.
          Last model sync: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}.
        </span>
      </div>
    </div>
  );
}

// ── Quick-Action Row ─────────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { label: 'Create Proposal', desc: 'Draft a new restructuring proposal', to: '/Proposals', color: '#344A60', textColor: '#E7D0B1' },
  { label: 'Build Scenario', desc: 'Combine proposals into a budget scenario', to: '/Scenarios', color: '#2A7F7F', textColor: '#ffffff' },
  { label: 'View Regional Map', desc: 'See service relationships with nearby towns', to: '/RegionalMap', color: '#9C5334', textColor: '#ffffff' },
  { label: 'Review Milestones', desc: 'Track implementation progress', to: '/Milestones', color: '#4a5568', textColor: '#ffffff' },
];

function QuickActionRow() {
  return (
    <div>
      <h2 className="text-sm font-bold text-slate-700 mb-3">Quick Actions</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {QUICK_ACTIONS.map(a => (
          <Link
            key={a.to}
            to={a.to}
            className="rounded-xl p-4 flex flex-col gap-1 hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-indigo-400"
            style={{ background: a.color }}
          >
            <p className="text-xs font-bold" style={{ color: a.textColor }}>{a.label}</p>
            <p className="text-[11px] leading-snug opacity-80" style={{ color: a.textColor }}>{a.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}