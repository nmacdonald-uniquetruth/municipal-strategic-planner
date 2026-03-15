import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useModel } from '@/components/machias/ModelContext';
import { runProFormaFromSettings } from '@/components/machias/FinancialModelV2';
import DashboardKPIRow from '@/components/dashboard/DashboardKPIRow';
import DashboardERPTimeline from '@/components/dashboard/DashboardERPTimeline';
import DashboardAlertsPanel from '@/components/dashboard/DashboardAlertsPanel';
import DashboardProjectCards from '@/components/dashboard/DashboardProjectCards';
import { Download, SlidersHorizontal, RefreshCw } from 'lucide-react';

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
        y.totalCost ?? '',
        y.totalRevenue ?? '',
        y.netImpact ?? '',
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
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: '#2F2F30' }}>
            Financial Model Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Live projections · restructuring metrics · compliance signals — Town of Machias FY2027–31
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setShowFilters(v => !v)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-300 bg-white hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400"
            aria-label="Toggle global filters"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters
          </button>
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-300 bg-white hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400"
            aria-label="Export financial model as CSV"
            title="Download the current model projections as a CSV file"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
          <Link
            to="/ComplianceSettings"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400"
            style={{ background: '#344A60' }}
            title="Open Audit Log and Compliance Settings"
          >
            Open Audit Log
          </Link>
        </div>
      </div>

      {/* ── Global Filters ────────────────────────────────────────── */}
      {showFilters && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-wrap gap-4 items-end animate-in slide-in-from-top-1 duration-150">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1">
              Date Range
            </label>
            <select
              value={range}
              onChange={e => setRange(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              {RANGE_OPTIONS.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1">
              Department
            </label>
            <select
              value={dept}
              onChange={e => setDept(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
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
          <p className="text-[10px] text-slate-400 self-end pb-1">
            Filters apply to KPI row, project cards, and alerts.
          </p>
        </div>
      )}

      {/* ── KPI Row ───────────────────────────────────────────────── */}
      <DashboardKPIRow projections={projections} settings={settings} dept={dept} />

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

      {/* ── Recent Transactions / Model Changes ───────────────────── */}
      <RecentTransactionsTable projections={projections} />

      {/* ── Footer note ───────────────────────────────────────────── */}
      <div className="rounded-lg border border-slate-200 bg-white/60 p-3 text-[10px] text-slate-500 flex items-start gap-2">
        <span>ⓘ</span>
        <span>
          All figures are model projections based on current <Link to="/ModelSettings" className="underline hover:text-slate-700">Model Settings</Link>.
          Changes must be approved per the <Link to="/ComplianceSettings" className="underline hover:text-slate-700">Compliance workflow</Link>.
          Last model sync: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}.
        </span>
      </div>
    </div>
  );
}

// ── Inline Recent Transactions Table (self-contained, lightweight) ──────────
function RecentTransactionsTable({ projections }) {
  const rows = useMemo(() => {
    if (!projections || projections.length === 0) return MOCK_TRANSACTIONS;
    return projections.slice(0, 5).map((y, i) => ({
      id: `proj-y${y.year}`,
      description: `Year ${y.year} Projection Snapshot`,
      category: 'Financial Model',
      amount: y.netImpact ?? 0,
      status: (y.netImpact ?? 0) >= 0 ? 'positive' : 'negative',
      date: `FY20${26 + y.year}`,
    }));
  }, [projections]);

  const handleExportTable = () => {
    const headers = 'ID,Description,Category,Amount,Status,Period\n';
    const csv = headers + rows.map(r =>
      `${r.id},"${r.description}",${r.category},${r.amount},${r.status},${r.date}`
    ).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'machias_transactions.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Recent Model Activity</h3>
          <p className="text-[10px] text-slate-500 mt-0.5">Year-by-year projection snapshots from the active financial model</p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/ModelSettings"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-colors"
            title="Open Model Settings to record a manual adjustment"
          >
            Record Adjustment
          </Link>
          <button
            onClick={handleExportTable}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-colors"
            title="Download this table as CSV"
          >
            <Download className="h-3 w-3" />
            Export
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-100" style={{ background: '#F3EAD6' }}>
              <th className="text-left px-5 py-2.5 font-bold text-slate-600 text-[10px] uppercase tracking-wide">Description</th>
              <th className="text-left px-4 py-2.5 font-bold text-slate-600 text-[10px] uppercase tracking-wide hidden sm:table-cell">Category</th>
              <th className="text-right px-4 py-2.5 font-bold text-slate-600 text-[10px] uppercase tracking-wide">Net Impact</th>
              <th className="text-center px-4 py-2.5 font-bold text-slate-600 text-[10px] uppercase tracking-wide hidden md:table-cell">Period</th>
              <th className="text-center px-4 py-2.5 font-bold text-slate-600 text-[10px] uppercase tracking-wide">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {rows.map(row => (
              <tr key={row.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-5 py-3 font-medium text-slate-800">{row.description}</td>
                <td className="px-4 py-3 text-slate-500 hidden sm:table-cell">{row.category}</td>
                <td className={`px-4 py-3 text-right font-bold tabular-nums ${row.status === 'positive' ? 'text-emerald-700' : 'text-red-600'}`}>
                  {row.status === 'positive' ? '+' : '-'}${Math.abs(row.amount).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-center text-slate-500 hidden md:table-cell">{row.date}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    row.status === 'positive'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {row.status === 'positive' ? 'Benefit' : 'Cost'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const MOCK_TRANSACTIONS = [
  { id: 't1', description: 'Staff Accountant Hire (Year 1)', category: 'Staffing', amount: -68000, status: 'negative', date: 'FY2027' },
  { id: 't2', description: 'EMS In-House Billing Recovery', category: 'Revenue', amount: 42000, status: 'positive', date: 'FY2027' },
  { id: 't3', description: 'ERP Implementation (Y1)', category: 'Capital', amount: -47000, status: 'negative', date: 'FY2027' },
  { id: 't4', description: 'R/B Interlocal Contract', category: 'Regional Revenue', amount: 19000, status: 'positive', date: 'FY2027' },
  { id: 't5', description: 'Stipend Elimination Savings', category: 'Savings', amount: 26000, status: 'positive', date: 'FY2027' },
];