/**
 * BudgetControl — Budget Control & Reconciliation Module
 *
 * Tabs:
 *  1. Control Board   — full budget control table (budget/actual/YTD/encumb/proj/variance)
 *  2. Alerts          — auto-generated alerts for overspend, low execution, broken rollups
 *  3. Reconciliation  — 3-layer reconciliation + GAAP recon
 *  4. Projections     — manager-facing year-end projection tool with seasonality
 *  5. Audit Trail     — adjustment log with export
 */
import React, { useState, useMemo, useCallback } from 'react';
import SectionHeader from '../components/machias/SectionHeader';
import BudgetControlTable from '../components/budgetcontrol/BudgetControlTable';
import ReconciliationPanel from '../components/budgetcontrol/ReconciliationPanel';
import ProjectionTool from '../components/budgetcontrol/ProjectionTool';
import AuditTrailLog from '../components/budgetcontrol/AuditTrailLog';
import { generateAlerts, computeControlMetrics, ALERT_TYPES } from '../components/budgetcontrol/budgetControlEngine';
import { useModel } from '../components/machias/ModelContext';
import { ShieldCheck, AlertTriangle, BarChart2, TrendingUp, ScrollText, Info, XCircle, Plus, ChevronRight } from 'lucide-react';

const fmt = n => `$${Math.round(Math.abs(n || 0)).toLocaleString()}`;

// ── Seed data from AnnualBudgetProcess ────────────────────────────────────────
function buildSeedRecords(settings, fiscalYear) {
  const ents = (settings.ambulance_transfer || 45000) + (settings.sewer_transfer || 21110) +
               (settings.ts_transfer || 21000) + (settings.telebusiness_transfer || 18525) + (settings.court_st_transfer || 15600);
  return [
    { id: 'bc1', fiscal_year: fiscalYear, department: 'Administration', fund: 'general_fund', article_number: 'Article 4', bete_mapping: 'municipalAppropriations', record_type: 'appropriation', adopted_budget: 745500, revised_budget: 0, encumbrances: 12000, ytd_actual: 362000, projected_year_end: 0, gaap_adjustment: 0, seasonality_profile: 'flat', variance_threshold_pct: 5, low_execution_threshold_pct: 15 },
    { id: 'bc2', fiscal_year: fiscalYear, department: 'Police', fund: 'general_fund', article_number: 'Article 5', bete_mapping: 'municipalAppropriations', record_type: 'appropriation', adopted_budget: 435000, revised_budget: 0, encumbrances: 8000, ytd_actual: 215000, projected_year_end: 432000, gaap_adjustment: 0, seasonality_profile: 'flat', variance_threshold_pct: 5, low_execution_threshold_pct: 15 },
    { id: 'bc3', fiscal_year: fiscalYear, department: 'Fire Department', fund: 'general_fund', article_number: 'Article 6', bete_mapping: 'municipalAppropriations', record_type: 'appropriation', adopted_budget: 98000, revised_budget: 0, encumbrances: 5000, ytd_actual: 48000, projected_year_end: 0, gaap_adjustment: 0, seasonality_profile: 'flat', variance_threshold_pct: 5, low_execution_threshold_pct: 15 },
    { id: 'bc4', fiscal_year: fiscalYear, department: 'Ambulance Service', fund: 'enterprise', article_number: 'Article 7', bete_mapping: 'enterpriseOffsets', record_type: 'appropriation', adopted_budget: 498000, revised_budget: 0, encumbrances: 14000, ytd_actual: 245000, projected_year_end: 510000, gaap_adjustment: 8500, seasonality_profile: 'flat', variance_threshold_pct: 5, low_execution_threshold_pct: 15 },
    { id: 'bc5', fiscal_year: fiscalYear, department: 'Public Works', fund: 'general_fund', article_number: 'Article 8', bete_mapping: 'municipalAppropriations', record_type: 'appropriation', adopted_budget: 392000, revised_budget: 0, encumbrances: 20000, ytd_actual: 194000, projected_year_end: 0, gaap_adjustment: 0, seasonality_profile: 'seasonal_summer', variance_threshold_pct: 5, low_execution_threshold_pct: 15 },
    { id: 'bc6', fiscal_year: fiscalYear, department: 'School (RSU Share)', fund: 'school', article_number: 'Article 10', bete_mapping: 'schoolAppropriations', record_type: 'appropriation', adopted_budget: 1950000, revised_budget: 0, encumbrances: 0, ytd_actual: 960000, projected_year_end: 1950000, gaap_adjustment: 0, seasonality_profile: 'flat', variance_threshold_pct: 2, low_execution_threshold_pct: 10 },
    { id: 'bc7', fiscal_year: fiscalYear, department: 'County Assessment', fund: 'county', article_number: 'Article 3', bete_mapping: 'countyAssessment', record_type: 'appropriation', adopted_budget: 285000, revised_budget: 0, encumbrances: 0, ytd_actual: 0, projected_year_end: 285000, gaap_adjustment: 0, seasonality_profile: 'back_loaded', variance_threshold_pct: 2, low_execution_threshold_pct: 5 },
    // Revenue line
    { id: 'bc8', fiscal_year: fiscalYear, department: 'General Fund Revenue', fund: 'general_fund', article_number: 'N/A', bete_mapping: 'localRevenues', record_type: 'revenue', adopted_budget: 485000, revised_budget: 0, encumbrances: 0, ytd_actual: 210000, projected_year_end: 0, gaap_adjustment: 0, seasonality_profile: 'flat', variance_threshold_pct: 5, low_execution_threshold_pct: 15 },
  ];
}

const TABS = [
  { id: 'control',        label: 'Control Board',   icon: ShieldCheck },
  { id: 'alerts',         label: 'Alerts',          icon: AlertTriangle },
  { id: 'reconciliation', label: 'Reconciliation',  icon: BarChart2 },
  { id: 'projections',    label: 'Projections',     icon: TrendingUp },
  { id: 'audit',          label: 'Audit Trail',     icon: ScrollText },
];

function AlertCard({ alert }) {
  const cfg = ALERT_TYPES[alert.type];
  const Icon = alert.type === 'overspend' ? XCircle : alert.type === 'broken_rollup' ? XCircle : alert.type === 'unmapped_transfer' ? XCircle : Info;
  return (
    <div className={`rounded-xl border ${cfg.border} ${cfg.bg} px-4 py-3 flex items-start gap-3`}>
      <Icon className={`h-4 w-4 flex-shrink-0 mt-0.5 ${cfg.color}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color} ${cfg.border}`}>{cfg.label}</span>
          <span className="text-[10px] text-slate-500">{alert.dept} · {alert.fund}</span>
        </div>
        <p className={`text-xs ${cfg.color}`}>{alert.msg}</p>
      </div>
    </div>
  );
}

export default function BudgetControl() {
  const { settings } = useModel();
  const [fiscalYear, setFiscalYear] = useState('FY2027');
  const [currentMonth, setCurrentMonth] = useState(9);
  const [activeTab, setActiveTab] = useState('control');
  const [records, setRecords] = useState(() => buildSeedRecords(settings, 'FY2027'));
  const [logs, setLogs] = useState([]);

  const alerts = useMemo(() => generateAlerts(records, currentMonth), [records, currentMonth]);
  const errorAlerts  = alerts.filter(a => ALERT_TYPES[a.type]?.severity === 'error');
  const warnAlerts   = alerts.filter(a => ALERT_TYPES[a.type]?.severity === 'warning');
  const infoAlerts   = alerts.filter(a => ALERT_TYPES[a.type]?.severity === 'info');

  const departments = useMemo(() => [...new Set(records.map(r => r.department))], [records]);

  // Aggregate KPIs
  const kpis = useMemo(() => records.reduce((acc, r) => {
    const m = computeControlMetrics(r, currentMonth);
    acc.budget    += m.budget;
    acc.ytd       += m.ytd;
    acc.encumb    += m.encumb;
    acc.obligated += m.obligated;
    acc.remaining += m.remaining;
    acc.projected += m.projected;
    return acc;
  }, { budget: 0, ytd: 0, encumb: 0, obligated: 0, remaining: 0, projected: 0 }), [records, currentMonth]);

  const overallPctSpent = kpis.budget > 0 ? (kpis.ytd / kpis.budget * 100).toFixed(1) : '0.0';
  const projVariance = kpis.budget - kpis.projected;

  const handleRecordUpdate = useCallback((updated) => {
    setRecords(prev => prev.map(r => r.id === updated.id ? updated : r));
  }, []);

  const handleAddLog = useCallback((entry) => {
    setLogs(prev => [entry, ...prev]);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <SectionHeader
          title="Budget Control & Reconciliation"
          subtitle={`${fiscalYear} — Post-adoption budget monitoring, reconciliation, and audit trail`}
          icon={ShieldCheck}
        />
        <div className="flex items-center gap-2 flex-wrap">
          <select value={fiscalYear} onChange={e => { setFiscalYear(e.target.value); setRecords(buildSeedRecords(settings, e.target.value)); }}
            className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none">
            {['FY2025','FY2026','FY2027','FY2028'].map(fy => <option key={fy} value={fy}>{fy}</option>)}
          </select>
          <div className="flex items-center gap-1.5">
            <label className="text-[10px] text-slate-500 font-semibold">Fiscal Month:</label>
            <input type="range" min={1} max={12} value={currentMonth} onChange={e => setCurrentMonth(+e.target.value)} className="w-24 accent-slate-800" />
            <span className="text-xs font-bold text-slate-700 w-4">{currentMonth}</span>
          </div>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
        {[
          { label: 'Adopted Budget',   value: fmt(kpis.budget),    sub: 'total adopted',                     color: 'text-slate-900' },
          { label: 'YTD Actual',       value: fmt(kpis.ytd),       sub: `Month ${currentMonth}`,             color: 'text-slate-800' },
          { label: 'Encumbrances',     value: fmt(kpis.encumb),    sub: 'outstanding commitments',           color: 'text-slate-600' },
          { label: 'Total Obligated',  value: fmt(kpis.obligated), sub: 'YTD + encumbrances',               color: 'text-slate-800' },
          { label: 'Remaining',        value: fmt(kpis.remaining), sub: `${(100 - parseFloat(overallPctSpent)).toFixed(1)}% unspent`, color: kpis.remaining < kpis.budget * 0.1 ? 'text-red-700' : 'text-emerald-700' },
          { label: 'Proj. Variance',   value: `${projVariance >= 0 ? '+' : ''}${fmt(projVariance)}`, sub: 'projected vs adopted', color: projVariance >= 0 ? 'text-emerald-700' : 'text-red-700' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-3">
            <p className={`text-sm font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] font-medium text-slate-600 mt-0.5">{s.label}</p>
            <p className="text-[9px] text-slate-400">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Alert strip */}
      {(errorAlerts.length > 0 || warnAlerts.length > 0) && (
        <div className={`rounded-xl border px-4 py-2.5 flex items-center gap-3 cursor-pointer ${errorAlerts.length > 0 ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'}`}
          onClick={() => setActiveTab('alerts')}>
          <AlertTriangle className={`h-4 w-4 flex-shrink-0 ${errorAlerts.length > 0 ? 'text-red-600' : 'text-amber-600'}`} />
          <p className="text-xs font-semibold text-slate-800 flex-1">
            {errorAlerts.length > 0 && `${errorAlerts.length} error${errorAlerts.length !== 1 ? 's' : ''} `}
            {warnAlerts.length > 0 && `${warnAlerts.length} warning${warnAlerts.length !== 1 ? 's' : ''} `}
            require attention.
          </p>
          <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 overflow-x-auto">
        {TABS.map(({ id, label, icon: TabIcon }) => {
          const badge = id === 'alerts' && alerts.length > 0 ? alerts.length : null;
          return (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${activeTab === id ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-700'}`}>
              <TabIcon className="h-3.5 w-3.5 flex-shrink-0" />
              {label}
              {badge && <span className={`ml-1 text-[9px] px-1.5 py-0.5 rounded-full font-bold ${errorAlerts.length > 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{badge}</span>}
            </button>
          );
        })}
      </div>

      {/* ── Control Board ── */}
      {activeTab === 'control' && (
        <BudgetControlTable records={records} currentMonth={currentMonth} onEdit={r => console.log('edit', r)} />
      )}

      {/* ── Alerts ── */}
      {activeTab === 'alerts' && (
        <div className="space-y-3">
          {alerts.length === 0 ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              <p className="text-xs font-semibold text-emerald-800">No alerts. All departments are within thresholds at month {currentMonth}.</p>
            </div>
          ) : (
            <>
              {errorAlerts.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-red-700 uppercase tracking-wider">Errors — Require Immediate Action</p>
                  {errorAlerts.map((a, i) => <AlertCard key={i} alert={a} />)}
                </div>
              )}
              {warnAlerts.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mt-2">Warnings — Monitor Closely</p>
                  {warnAlerts.map((a, i) => <AlertCard key={i} alert={a} />)}
                </div>
              )}
              {infoAlerts.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mt-2">Informational</p>
                  {infoAlerts.map((a, i) => <AlertCard key={i} alert={a} />)}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Reconciliation ── */}
      {activeTab === 'reconciliation' && (
        <ReconciliationPanel records={records} />
      )}

      {/* ── Projections ── */}
      {activeTab === 'projections' && (
        <ProjectionTool records={records} currentMonth={currentMonth} onRecordUpdate={handleRecordUpdate} />
      )}

      {/* ── Audit Trail ── */}
      {activeTab === 'audit' && (
        <AuditTrailLog logs={logs} onAddLog={handleAddLog} departments={departments} />
      )}
    </div>
  );
}