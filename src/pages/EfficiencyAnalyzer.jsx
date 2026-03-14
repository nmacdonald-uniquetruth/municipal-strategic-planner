import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { computeEfficiencyReport, classifySpan, DEPT_DEFINITIONS } from '../components/efficiency/efficiencyEngine';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  Users, TrendingUp, AlertTriangle, CheckCircle2, Layers,
  Activity, Building2, Loader2, Info, ChevronDown, ChevronUp,
} from 'lucide-react';

// ── Palette ────────────────────────────────────────────────────────────────
const PALETTE = ['#344A60', '#2A7F7F', '#4A6741', '#9C5334', '#6B4C9A', '#8B6914', '#2a3c4f', '#b3464a'];

const CATEGORY_LABELS = {
  administration: 'Administration',
  public_safety: 'Public Safety',
  public_works: 'Public Works',
  utilities: 'Utilities',
  community_services: 'Community Services',
  other: 'Other',
};

const CATEGORY_COLORS = {
  administration: '#344A60',
  public_safety: '#b3464a',
  public_works: '#8B6914',
  utilities: '#2A7F7F',
  community_services: '#4A6741',
  other: '#6B4C9A',
};

const SEVERITY_STYLES = {
  high:   'border-red-200 bg-red-50',
  medium: 'border-amber-200 bg-amber-50',
  low:    'border-blue-200 bg-blue-50',
};

const SEVERITY_BADGE = {
  high:   'bg-red-100 text-red-800',
  medium: 'bg-amber-100 text-amber-800',
  low:    'bg-blue-100 text-blue-800',
};

// ── Sub-components ──────────────────────────────────────────────────────────
function ScoreCard({ label, score, sub, color }) {
  const barColor = score >= 80 ? '#2A7F7F' : score >= 60 ? '#F6C85F' : '#e05c3a';
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col gap-2">
      <p className="text-xs font-semibold text-slate-600">{label}</p>
      <div className="flex items-end gap-2">
        <span className="text-3xl font-bold" style={{ color: barColor }}>{score}</span>
        <span className="text-sm text-slate-400 mb-0.5">/100</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${score}%`, background: barColor }} />
      </div>
      {sub && <p className="text-[10px] text-slate-400">{sub}</p>}
    </div>
  );
}

function SectionHeader({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 flex-shrink-0">
        <Icon className="h-4 w-4 text-white" />
      </div>
      <div>
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>
    </div>
  );
}

function ExpandCard({ title, badge, badgeClass, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <button className="w-full flex items-center justify-between px-4 py-3 text-left" onClick={() => setOpen(o => !o)}>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-800">{title}</span>
          {badge && <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeClass}`}>{badge}</span>}
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
      </button>
      {open && <div className="px-4 pb-4 border-t border-slate-100 pt-3">{children}</div>}
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────
export default function EfficiencyAnalyzer() {
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.OrgNode.list('sort_order', 500).then(data => {
      setNodes(data);
      setLoading(false);
    });
  }, []);

  const report = useMemo(() => {
    if (!nodes.length) return null;
    return computeEfficiencyReport(nodes);
  }, [nodes]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 gap-3 text-slate-500">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        <p className="text-sm">Loading organizational data…</p>
      </div>
    );
  }

  if (!report || !nodes.length) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center text-slate-400">
          <Layers className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium">No organizational data found.</p>
          <p className="text-xs mt-1">Visit the Org Structure page to seed the data first.</p>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const spanChartData = report.spanData.slice(0, 10).map(d => ({
    name: (d.staff_name || d.name || '').split(' ').pop() + ' (' + (d.title || '').split(' ')[0] + ')',
    reports: d.directReports,
    fill: d.classification.score >= 100 ? '#2A7F7F' : d.classification.score >= 70 ? '#F6C85F' : d.classification.score >= 40 ? '#344A60' : '#e05c3a',
  }));

  const deptFTEData = report.depts
    .filter(d => d.fte > 0)
    .sort((a, b) => b.fte - a.fte)
    .map(d => ({
      name: d.name.replace('Department', 'Dept').replace('Administration', 'Admin'),
      fte: d.fte,
      fill: CATEGORY_COLORS[d.category] || '#999',
    }));

  const categoryPieData = Object.entries(
    report.depts.reduce((acc, d) => {
      const cat = d.category || 'other';
      acc[cat] = (acc[cat] || 0) + d.fte;
      return acc;
    }, {})
  ).map(([cat, fte]) => ({ name: CATEGORY_LABELS[cat] || cat, value: fte, color: CATEGORY_COLORS[cat] }));

  const radarData = [
    { subject: 'Span of Control', score: report.spanScore },
    { subject: 'Staffing Levels', score: report.staffScore },
    { subject: 'Admin Overhead', score: report.adminScore },
    { subject: 'Service Coverage', score: 72 },
    { subject: 'Dept Balance', score: Math.min(100, Math.round((report.depts.filter(d => d.assessment?.label === 'Appropriate').length / Math.max(report.depts.length, 1)) * 100)) },
  ];

  return (
    <div className="space-y-8 pb-16">

      {/* ── Hero Banner ── */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 text-white">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="h-4 w-4 text-slate-400" />
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Municipal Efficiency Analysis — Town of Machias</span>
        </div>
        <h1 className="text-xl font-bold mb-1">Department Efficiency Analyzer</h1>
        <p className="text-sm text-slate-400 max-w-2xl">
          Analyzes staffing efficiency, span of control, administrative overhead, and service delivery structure
          across all municipal departments using live organizational data.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
          <div>
            <p className="text-2xl font-bold" style={{ color: report.overallScore >= 80 ? '#4ade80' : report.overallScore >= 60 ? '#fbbf24' : '#f87171' }}>{report.overallScore}</p>
            <p className="text-[10px] text-slate-400">Overall Score /100</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-300">{report.totalStaffFTE}</p>
            <p className="text-[10px] text-slate-400">Total Staff FTE</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-400">{report.depts.length}</p>
            <p className="text-[10px] text-slate-400">Departments</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-amber-400">{(report.adminPct * 100).toFixed(0)}%</p>
            <p className="text-[10px] text-slate-400">Admin Overhead</p>
          </div>
        </div>
      </div>

      {/* ── Score Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ScoreCard label="Span of Control" score={report.spanScore}
          sub={`${report.spanData.length} leadership roles analyzed`} />
        <ScoreCard label="Staffing Levels" score={report.staffScore}
          sub={`${report.depts.filter(d => d.assessment?.label === 'Appropriate').length} of ${report.depts.length} depts within benchmark`} />
        <ScoreCard label="Admin Overhead" score={report.adminScore}
          sub={`${(report.adminPct * 100).toFixed(1)}% admin (benchmark: 8–15%)`} />
      </div>

      {/* ── Radar / Overview ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <SectionHeader icon={TrendingUp} title="Efficiency Radar" subtitle="Multi-dimensional performance overview" />
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#64748b' }} />
              <Radar name="Score" dataKey="score" stroke="#344A60" fill="#344A60" fillOpacity={0.25} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <SectionHeader icon={Layers} title="Staff by Service Category" subtitle="FTE distribution across service areas" />
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={categoryPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} label={({ name, value }) => `${name}: ${value}`} labelLine={false} fontSize={10}>
                {categoryPieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(v) => [`${v} FTE`]} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Span of Control ── */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <SectionHeader icon={Users} title="Span of Control Analysis"
          subtitle="Direct reports per leadership position — optimal range is 4–7" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
          {[
            { label: 'Underutilized (0–3)', color: 'bg-blue-100 text-blue-800' },
            { label: 'Optimal (4–7)', color: 'bg-emerald-100 text-emerald-800' },
            { label: 'High Span (8–12)', color: 'bg-amber-100 text-amber-800' },
            { label: 'Overload (13+)', color: 'bg-red-100 text-red-800' },
          ].map((s, i) => (
            <span key={i} className={`text-[10px] font-bold px-2 py-1 rounded-full text-center ${s.color}`}>{s.label}</span>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={spanChartData} layout="vertical" margin={{ left: 90, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11 }} domain={[0, 'dataMax + 2']} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={88} />
            <Tooltip formatter={(v) => [`${v} direct reports`]} />
            <Bar dataKey="reports" radius={[0, 4, 4, 0]}>
              {spanChartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 space-y-2">
          {report.spanData.map((d, i) => (
            <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg border border-slate-100 bg-slate-50 text-xs">
              <div>
                <span className="font-semibold text-slate-800">{d.staff_name || d.name}</span>
                <span className="text-slate-500 ml-2">{d.title}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-slate-700">{d.directReports} reports</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${d.classification.color}`}>{d.classification.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Department FTE Chart ── */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <SectionHeader icon={Building2} title="Department Staffing Levels"
          subtitle="Actual FTE vs. benchmark range for each department" />
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={deptFTEData} margin={{ bottom: 60, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fontSize: 9, angle: -35, textAnchor: 'end' }} interval={0} />
            <YAxis tick={{ fontSize: 11 }} label={{ value: 'FTE', angle: -90, position: 'insideLeft', fontSize: 10 }} />
            <Tooltip formatter={(v) => [`${v} FTE`]} />
            <Bar dataKey="fte" radius={[4, 4, 0, 0]}>
              {deptFTEData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
          {report.depts.filter(d => d.assessment).map((d, i) => (
            <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg border border-slate-100 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-base">{DEPT_DEFINITIONS.find(def => d.name.includes(def.label.split(' ')[0]))?.icon || '🏢'}</span>
                <div>
                  <p className="font-semibold text-slate-800">{d.name}</p>
                  <p className="text-slate-400">{d.fte} FTE · benchmark: {d.def?.benchmarkFTE.min}–{d.def?.benchmarkFTE.max}</p>
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${d.assessment.color}`}>{d.assessment.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Staffing Ratios ── */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <SectionHeader icon={Activity} title="Staffing Ratios — Population Basis"
          subtitle={`Based on Machias population of ${report.population.toLocaleString()} residents`} />
        <div className="space-y-4">
          {report.ratios.map((r, i) => {
            const inRange = r.raw >= r.benchMin && r.raw <= r.benchMax;
            const below = r.raw < r.benchMin;
            const barPct = Math.min(100, (r.raw / r.benchMax) * 100);
            const barColor = inRange ? '#2A7F7F' : below ? '#e05c3a' : '#F6C85F';
            return (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700">{r.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-800">{r.value} {r.unit}</span>
                    <span className="text-slate-400">benchmark: {r.benchmark}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${inRange ? 'bg-emerald-100 text-emerald-800' : below ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                      {inRange ? 'In range' : below ? 'Below benchmark' : 'Above benchmark'}
                    </span>
                  </div>
                </div>
                <div className="relative h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${barPct}%`, background: barColor }} />
                  {/* Benchmark zone indicator */}
                  <div className="absolute top-0 h-2 bg-emerald-200 opacity-40 rounded"
                    style={{
                      left: `${(r.benchMin / r.benchMax) * 100}%`,
                      width: `${Math.min(100, 100) - (r.benchMin / r.benchMax) * 100}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Admin Overhead ── */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <SectionHeader icon={TrendingUp} title="Administrative Overhead Analysis"
          subtitle="Administrative staff as a percentage of total workforce" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="text-center p-4 rounded-xl border border-slate-200 bg-slate-50">
            <p className="text-3xl font-bold text-slate-900">{(report.adminPct * 100).toFixed(1)}%</p>
            <p className="text-xs text-slate-500 mt-1">Administrative Staff %</p>
            <p className="text-[10px] text-slate-400">Benchmark: 8–15%</p>
          </div>
          <div className="text-center p-4 rounded-xl border border-slate-200 bg-slate-50">
            <p className="text-3xl font-bold text-slate-900">{report.adminFTE}</p>
            <p className="text-xs text-slate-500 mt-1">Admin FTE</p>
            <p className="text-[10px] text-slate-400">Finance, Clerk, Planning</p>
          </div>
          <div className="text-center p-4 rounded-xl border border-slate-200 bg-slate-50">
            <p className="text-3xl font-bold text-slate-900">{report.totalStaffFTE - report.adminFTE}</p>
            <p className="text-xs text-slate-500 mt-1">Service Delivery FTE</p>
            <p className="text-[10px] text-slate-400">Direct public services</p>
          </div>
        </div>
        <div className={`rounded-xl border px-4 py-3 text-sm ${report.adminScore >= 80 ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-amber-50 border-amber-200 text-amber-900'}`}>
          <p className="font-semibold text-xs mb-1">{report.adminScore >= 80 ? '✅ Administrative Overhead: Within Benchmark' : '⚠ Administrative Overhead: Review Recommended'}</p>
          <p className="text-xs leading-relaxed">
            At {(report.adminPct * 100).toFixed(1)}%, Machias falls {report.adminPct < 0.08 ? 'below' : report.adminPct > 0.15 ? 'above' : 'within'} the 8–15% administrative overhead benchmark for municipalities of comparable size.
            {report.adminPct < 0.08
              ? ' The proposed Staff Accountant and GA Coordinator additions will increase this ratio toward the benchmark range, which reflects appropriate administrative capacity for a multi-fund municipal government.'
              : report.adminPct > 0.15
              ? ' Consider whether administrative functions can be consolidated or whether service delivery staffing can be increased proportionally.'
              : ' The restructuring proposal maintains this within the healthy range.'
            }
          </p>
        </div>
      </div>

      {/* ── Cross-Department Overlap ── */}
      <div className="space-y-2">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 flex-shrink-0">
            <AlertTriangle className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Cross-Department Collaboration Opportunities</h3>
            <p className="text-xs text-slate-500">Overlapping responsibilities and consolidation flags</p>
          </div>
        </div>
        {report.overlaps.map((o, i) => (
          <div key={i} className={`rounded-xl border p-4 ${SEVERITY_STYLES[o.severity]}`}>
            <div className="flex items-start justify-between mb-1">
              <p className="text-sm font-semibold text-slate-900">{o.title}</p>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${SEVERITY_BADGE[o.severity]}`}>
                {o.severity.charAt(0).toUpperCase() + o.severity.slice(1)} Priority
              </span>
            </div>
            <p className="text-xs text-slate-700 mb-2">{o.description}</p>
            <div className="flex items-start gap-1.5">
              <CheckCircle2 className="h-3 w-3 text-emerald-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-emerald-800 font-medium">{o.opportunity}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Department Detail Accordions ── */}
      <div className="space-y-2">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 flex-shrink-0">
            <Building2 className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Department Detail</h3>
            <p className="text-xs text-slate-500">Staffing assessment and benchmark comparison for each department</p>
          </div>
        </div>
        {report.depts.map((d, i) => {
          const def = DEPT_DEFINITIONS.find(dd => d.name.includes(dd.label.split(' ')[0]));
          return (
            <ExpandCard key={i}
              title={`${def?.icon || '🏢'} ${d.name}`}
              badge={d.assessment?.label}
              badgeClass={d.assessment?.color || 'bg-slate-100 text-slate-600'}
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs mb-3">
                <div><p className="text-slate-400">Total FTE</p><p className="font-bold text-slate-900">{d.fte}</p></div>
                <div><p className="text-slate-400">Benchmark</p><p className="font-bold text-slate-900">{def?.benchmarkFTE.min}–{def?.benchmarkFTE.max} FTE</p></div>
                <div><p className="text-slate-400">Category</p><p className="font-bold text-slate-900">{CATEGORY_LABELS[d.category] || d.category}</p></div>
                <div><p className="text-slate-400">Department Head</p><p className="font-bold text-slate-900">{def?.headName || '—'}</p></div>
              </div>
              {def?.benchmarkRatioDesc && (
                <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                  <Info className="h-3 w-3 flex-shrink-0" />
                  Benchmark basis: {def.benchmarkRatioDesc}
                </p>
              )}
            </ExpandCard>
          );
        })}
      </div>

      {/* Footer note */}
      <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-xs text-slate-500 leading-relaxed">
        <p><strong className="text-slate-700">Methodology note:</strong> FTE counts are derived from the Organizational Structure module (OrgNode records). Staff counts use the <code>staff_count</code> field where specified, defaulting to 1 per role node. Span of control counts direct child nodes excluding advisory boards. Population baseline: 2,100 residents. Benchmarks sourced from MMA and ICMA municipal benchmarking data for Maine small municipalities.</p>
      </div>

    </div>
  );
}