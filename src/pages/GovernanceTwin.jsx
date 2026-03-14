import React, { useState, useMemo } from 'react';
import {
  TWIN_NODES, NODE_MAP, TYPE_CONFIG, BRANCH_COLORS,
  STRATEGIC_INSIGHTS, SEVERITY_CONFIG, computeGovernanceComplexity,
  MACHIAS_POPULATION, SCHOOL_ENROLLMENT,
} from '../components/twin/twinData';
import GovernanceMap from '../components/twin/GovernanceMap';
import NodeDetailPanel from '../components/twin/NodeDetailPanel';
import InsightsLayer from '../components/twin/InsightsLayer';
import ComplexityScore from '../components/twin/ComplexityScore';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { Network, Layers, Lightbulb, BarChart2, Download, Users, DollarSign, Building2, BookOpen } from 'lucide-react';

const fmt = n => n ? `$${Math.round(n).toLocaleString()}` : '—';

// ── Export org chart as printable HTML ─────────────────────────────────────────
function exportGovernanceMap() {
  const rows = TWIN_NODES.map(n => `<tr><td>${n.icon} ${n.label}</td><td>${n.type}</td><td>${n.branch}</td><td>${n.role || ''}</td><td>${n.fte || ''}</td><td>${n.budget ? '$' + n.budget.toLocaleString() : ''}</td></tr>`).join('');
  const html = `<!DOCTYPE html><html><head><title>Machias Governance Map</title>
    <style>body{font-family:sans-serif;padding:24px}h1{font-size:20px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:8px;font-size:12px}th{background:#344A60;color:#fff}</style></head>
    <body><h1>Town of Machias — Governance Map</h1><p>Generated ${new Date().toLocaleDateString()}</p>
    <table><thead><tr><th>Entity</th><th>Type</th><th>Branch</th><th>Leader</th><th>FTE</th><th>Budget</th></tr></thead>
    <tbody>${rows}</tbody></table></body></html>`;
  const blob = new Blob([html], { type: 'text/html' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'machias-governance-map.html';
  a.click();
}

// ── Tabs ──────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'map',       label: 'Governance Map',   icon: Network },
  { id: 'insights',  label: 'Strategic Insights', icon: Lightbulb },
  { id: 'metrics',   label: 'Metrics & Scores',  icon: BarChart2 },
  { id: 'scenarios', label: 'Scenarios',          icon: Layers },
];

const VIEW_MODES = [
  { id: 'both',      label: 'All Branches' },
  { id: 'municipal', label: 'Municipal Only' },
  { id: 'school',    label: 'School Only' },
];

const SCENARIOS = [
  {
    id: 'current',
    label: 'Current Structure',
    description: 'As-is governance structure of Machias and AOS 96.',
    changes: [],
    color: '#344A60',
  },
  {
    id: 'restructuring',
    label: 'Phase 1 Restructuring',
    description: 'Add Staff Accountant, Billing Specialist (to Finance & HR), GA Coordinator. Separate EMS billing in-house. FD role evolves to strategic finance.',
    changes: [
      { dept: 'finance_hr', label: '+ Staff Accountant', type: 'new' },
      { dept: 'finance_hr', label: '+ GA Coordinator (stipend)', type: 'new' },
      { dept: 'ambulance',  label: '+ Billing Specialist', type: 'new' },
    ],
    color: '#2A7F7F',
  },
  {
    id: 'shared_services',
    label: 'Regional Shared Services',
    description: 'Add Revenue Coordinator to manage formal interlocal service agreements with Roque Bluffs, Machiasport, Marshfield, Whitneyville, Northfield.',
    changes: [
      { dept: 'finance_hr', label: '+ Revenue Coordinator', type: 'new' },
      { dept: 'finance_hr', label: '+ Roque Bluffs contract', type: 'revenue' },
      { dept: 'finance_hr', label: '+ Machiasport contract', type: 'revenue' },
    ],
    color: '#4A6741',
  },
  {
    id: 'consolidated',
    label: 'Emergency Services Consolidation',
    description: 'Merge Fire and Ambulance administrative functions under a shared Emergency Services Director. Saves ~$45K/yr in overhead.',
    changes: [
      { dept: 'fire',      label: 'Shared Emergency Services Director', type: 'merge' },
      { dept: 'ambulance', label: 'Merged admin overhead', type: 'merge' },
    ],
    color: '#8B6914',
  },
];

// ── Metrics data ──────────────────────────────────────────────────────────────
const DEPT_SCORES = TWIN_NODES
  .filter(n => n.type === 'department' && n.efficiencyScore != null)
  .map(n => ({ name: n.label.replace(' Dept.', '').replace(' & HR', '').replace(' / EMS', ''), score: n.efficiencyScore, color: n.efficiencyScore >= 80 ? '#2A7F7F' : n.efficiencyScore >= 60 ? '#F6C85F' : '#e05c3a' }))
  .sort((a, b) => a.score - b.score);

const RADAR_DATA = [
  { axis: 'Admin Efficiency',   value: 62 },
  { axis: 'Public Safety',      value: 86 },
  { axis: 'Utilities',          value: 65 },
  { axis: 'Community Svcs',     value: 76 },
  { axis: 'Financial Controls', value: 48 },
  { axis: 'Governance Clarity', value: 80 },
];

export default function GovernanceTwin() {
  const [activeTab,    setActiveTab]    = useState('map');
  const [selectedNode, setSelectedNode] = useState(null);
  const [viewMode,     setViewMode]     = useState('both');
  const [activeScenario, setActiveScenario] = useState('current');

  const complexity = useMemo(() => computeGovernanceComplexity(TWIN_NODES), []);

  const totalFTE    = TWIN_NODES.filter(n => n.fte).reduce((s, n) => s + n.fte, 0);
  const totalBudget = TWIN_NODES.filter(n => n.budget).reduce((s, n) => s + n.budget, 0);
  const deptCount   = TWIN_NODES.filter(n => n.type === 'department').length;
  const boardCount  = TWIN_NODES.filter(n => n.type === 'committee').length;

  const scenario = SCENARIOS.find(s => s.id === activeScenario);

  return (
    <div className="space-y-5 pb-16">

      {/* ── Hero ── */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 text-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Network className="h-4 w-4 text-slate-400" />
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Community Governance Digital Twin — Machias, ME</span>
            </div>
            <h1 className="text-xl font-bold mb-1">Governance Digital Twin</h1>
            <p className="text-sm text-slate-400 max-w-2xl">
              Live interactive model of Machias municipal and school governance — organizational structure, budgets, staffing, strategic insights, and restructuring scenarios.
            </p>
          </div>
          <button onClick={exportGovernanceMap}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/20 text-xs font-medium hover:bg-white/10 transition-colors flex-shrink-0">
            <Download className="h-3.5 w-3.5" /> Export Map
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-5">
          {[
            { label: 'Departments',     value: deptCount,                icon: Building2 },
            { label: 'Boards/Committees', value: boardCount,             icon: Users },
            { label: 'Total FTE',       value: totalFTE,                 icon: Users },
            { label: 'Budgeted Funds',  value: '$' + Math.round(totalBudget/1000) + 'K', icon: DollarSign },
            { label: 'Complexity Score',value: complexity.score,         icon: Layers },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label}>
              <p className="text-xl font-bold text-white">{value}</p>
              <p className="text-[10px] text-slate-400">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 flex-wrap">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === id ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>
            <Icon className="h-3.5 w-3.5" />{label}
          </button>
        ))}
      </div>

      {/* ═══════════════════════ MAP TAB ═══════════════════════════════════════ */}
      {activeTab === 'map' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left: controls + map */}
          <div className="lg:col-span-2 space-y-4">
            {/* View mode toggle */}
            <div className="flex items-center gap-2">
              <p className="text-xs font-medium text-slate-500 mr-1">View:</p>
              {VIEW_MODES.map(m => (
                <button key={m.id} onClick={() => setViewMode(m.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all border ${viewMode === m.id ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200 text-slate-600 hover:border-slate-400'}`}>
                  {m.label}
                </button>
              ))}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-2">
              {Object.entries(TYPE_CONFIG).filter(([k]) => ['governance','executive','department','committee','school','contracted'].includes(k)).map(([k, v]) => (
                <div key={k} className="flex items-center gap-1.5 text-[10px] text-slate-500">
                  <div className="h-2.5 w-2.5 rounded-sm border" style={{ background: v.bg, borderColor: v.border }} />
                  {v.label}
                </div>
              ))}
              <div className="flex items-center gap-1.5 text-[10px] text-amber-600">
                <span className="h-3 w-3 rounded-full bg-amber-400 text-[8px] font-bold text-white flex items-center justify-center">!</span>
                Has strategic insight
              </div>
            </div>

            {/* Map */}
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <GovernanceMap selectedId={selectedNode} onSelect={setSelectedNode} viewMode={viewMode} />
            </div>
          </div>

          {/* Right: detail panel + complexity */}
          <div className="space-y-4">
            <ComplexityScore />
            {selectedNode
              ? <NodeDetailPanel nodeId={selectedNode} onClose={() => setSelectedNode(null)} />
              : (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                  <Network className="h-8 w-8 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-medium text-slate-500">Select any node</p>
                  <p className="text-xs text-slate-400 mt-1">Click a department, board, or role to view its details, reporting relationships, staff, budget, and strategic insights.</p>
                </div>
              )
            }
          </div>
        </div>
      )}

      {/* ═══════════════════════ INSIGHTS TAB ══════════════════════════════════ */}
      {activeTab === 'insights' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                <p className="text-sm font-bold text-slate-900">Strategic Insights Layer</p>
              </div>
              <InsightsLayer onSelectNode={(id) => { setSelectedNode(id); setActiveTab('map'); }} />
            </div>
          </div>
          <div className="space-y-4">
            <ComplexityScore />
            {selectedNode && <NodeDetailPanel nodeId={selectedNode} onClose={() => setSelectedNode(null)} />}
            {/* Insight summary */}
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-bold text-slate-700 mb-3">Insight Summary</p>
              {Object.entries({ critical: 'red', high: 'amber', medium: 'blue', opportunity: 'emerald' }).map(([sev, c]) => {
                const count = STRATEGIC_INSIGHTS.filter(i => i.severity === sev).length;
                return (
                  <div key={sev} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 last:border-0">
                    <span className="text-slate-600 capitalize">{sev}</span>
                    <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] bg-${c}-100 text-${c}-800`}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════ METRICS TAB ══════════════════════════════════ */}
      {activeTab === 'metrics' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Governance Complexity', value: complexity.score, sub: 'out of 100', color: '#e05c3a' },
              { label: 'Reporting Layers', value: complexity.layers, sub: 'from voters to staff', color: '#344A60' },
              { label: 'Total Governance FTE', value: totalFTE, sub: 'all departments + schools', color: '#2A7F7F' },
              { label: 'Cost per Resident', value: '$' + Math.round(totalBudget / MACHIAS_POPULATION), sub: 'municipal budgeted funds', color: '#4A6741' },
            ].map((s, i) => (
              <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 text-center">
                <p className="text-3xl font-bold" style={{ color: s.color }}>{s.value}</p>
                <p className="text-xs font-semibold text-slate-700 mt-1">{s.label}</p>
                <p className="text-[10px] text-slate-400">{s.sub}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Dept efficiency bar */}
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-sm font-bold text-slate-900 mb-4">Department Efficiency Scores</p>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={DEPT_SCORES} layout="vertical" margin={{ left: 90, right: 30 }}>
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={88} />
                  <Tooltip formatter={v => [`${v} / 100`]} />
                  <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                    {DEPT_SCORES.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Radar */}
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-sm font-bold text-slate-900 mb-4">Service Coverage Radar</p>
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart data={RADAR_DATA}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="axis" tick={{ fontSize: 9, fill: '#475569' }} />
                  <Radar dataKey="value" stroke="#344A60" fill="#344A60" fillOpacity={0.25} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Structure breakdown table */}
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100">
              <p className="text-sm font-bold text-slate-900">Governance Structure Breakdown</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white">
                    {['Entity', 'Type', 'Branch', 'Leader / Contact', 'FTE', 'Budget', 'Efficiency'].map((h, i) => (
                      <th key={i} className="px-3 py-2 text-left text-[10px] uppercase tracking-wider font-semibold whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TWIN_NODES.filter(n => n.type !== 'root').map((n, i) => {
                    const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.department;
                    const scoreColor = n.efficiencyScore ? (n.efficiencyScore >= 80 ? '#2A7F7F' : n.efficiencyScore >= 60 ? '#B45309' : '#DC2626') : null;
                    return (
                      <tr key={n.id} className={`cursor-pointer ${i % 2 === 1 ? 'bg-slate-50' : 'bg-white'} hover:bg-blue-50`}
                        onClick={() => { setSelectedNode(n.id); setActiveTab('map'); }}>
                        <td className="px-3 py-2 font-medium text-slate-800 whitespace-nowrap">{n.icon} {n.label}</td>
                        <td className="px-3 py-2">
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                            style={{ background: cfg.bg === '#ffffff' ? '#f1f5f9' : cfg.bg + '33', color: cfg.bg === '#ffffff' ? '#475569' : cfg.bg }}>
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                            style={{ background: (BRANCH_COLORS[n.branch] || '#666') + '22', color: BRANCH_COLORS[n.branch] || '#666' }}>
                            {n.branch}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-slate-600">{n.role || '—'}</td>
                        <td className="px-3 py-2 font-mono text-slate-700">{n.fte || '—'}</td>
                        <td className="px-3 py-2 font-mono text-slate-700">{n.budget ? fmt(n.budget) : '—'}</td>
                        <td className="px-3 py-2">
                          {n.efficiencyScore != null
                            ? <span className="font-bold text-xs" style={{ color: scoreColor }}>{n.efficiencyScore}</span>
                            : <span className="text-slate-300">—</span>
                          }
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════ SCENARIOS TAB ════════════════════════════════ */}
      {activeTab === 'scenarios' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {SCENARIOS.map(s => (
              <button key={s.id} onClick={() => setActiveScenario(s.id)}
                className={`text-left rounded-xl border p-4 transition-all ${activeScenario === s.id ? 'ring-2 shadow-md' : 'hover:shadow-sm'}`}
                style={{
                  borderColor: activeScenario === s.id ? s.color : '#e2d6c4',
                  background: activeScenario === s.id ? s.color + '11' : '#fff',
                  ringColor: s.color,
                  outline: activeScenario === s.id ? `2px solid ${s.color}` : undefined,
                }}>
                <div className="h-3 w-3 rounded-full mb-2" style={{ background: s.color }} />
                <p className="text-xs font-bold text-slate-800">{s.label}</p>
                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{s.description}</p>
              </button>
            ))}
          </div>

          {scenario && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-4 w-4 rounded-full flex-shrink-0" style={{ background: scenario.color }} />
                  <p className="text-sm font-bold text-slate-900">{scenario.label}</p>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed mb-5">{scenario.description}</p>

                {scenario.changes.length > 0 ? (
                  <div>
                    <p className="text-xs font-semibold text-slate-600 mb-3">Proposed Changes</p>
                    <div className="space-y-2">
                      {scenario.changes.map((c, i) => {
                        const node = NODE_MAP[c.dept];
                        const typeColor = c.type === 'new' ? '#2A7F7F' : c.type === 'revenue' ? '#4A6741' : '#8B6914';
                        return (
                          <div key={i} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                            <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: typeColor }} />
                            <span className="text-sm flex-shrink-0">{node?.icon}</span>
                            <span className="text-xs font-semibold text-slate-700">{node?.label}</span>
                            <span className="mx-1 text-slate-300">→</span>
                            <span className="text-xs font-bold" style={{ color: typeColor }}>{c.label}</span>
                            <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-bold capitalize"
                              style={{ background: typeColor + '22', color: typeColor }}>
                              {c.type}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-center text-xs text-slate-500">
                    This is the current as-is structure with no proposed changes.
                  </div>
                )}

                {/* Governance map of current structure for context */}
                <div className="mt-5">
                  <p className="text-xs font-semibold text-slate-600 mb-3">Governance Structure (Municipal)</p>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 max-h-96 overflow-y-auto">
                    <GovernanceMap selectedId={selectedNode} onSelect={setSelectedNode} viewMode="municipal" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <ComplexityScore />

                {/* Scenario impact summary */}
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-bold text-slate-700 mb-3">Scenario Impact</p>
                  <div className="space-y-2 text-xs">
                    {scenario.id === 'current' && (
                      <p className="text-slate-500 italic">Baseline structure. No changes applied.</p>
                    )}
                    {scenario.id === 'restructuring' && (
                      <>
                        <div className="flex justify-between py-1 border-b border-slate-100"><span className="text-slate-600">New positions</span><span className="font-bold text-slate-800">3</span></div>
                        <div className="flex justify-between py-1 border-b border-slate-100"><span className="text-slate-600">GF cost impact (Y1)</span><span className="font-bold text-emerald-700">Levy neutral</span></div>
                        <div className="flex justify-between py-1 border-b border-slate-100"><span className="text-slate-600">Comstar savings (Y1)</span><span className="font-bold text-emerald-700">~$34K</span></div>
                        <div className="flex justify-between py-1"><span className="text-slate-600">5-yr cash net</span><span className="font-bold text-emerald-700">$1.2M+</span></div>
                      </>
                    )}
                    {scenario.id === 'shared_services' && (
                      <>
                        <div className="flex justify-between py-1 border-b border-slate-100"><span className="text-slate-600">New contracts</span><span className="font-bold text-slate-800">5 towns</span></div>
                        <div className="flex justify-between py-1 border-b border-slate-100"><span className="text-slate-600">Y1 contract revenue</span><span className="font-bold text-emerald-700">~$65K</span></div>
                        <div className="flex justify-between py-1"><span className="text-slate-600">5-yr regional revenue</span><span className="font-bold text-emerald-700">~$425K</span></div>
                      </>
                    )}
                    {scenario.id === 'consolidated' && (
                      <>
                        <div className="flex justify-between py-1 border-b border-slate-100"><span className="text-slate-600">Positions merged</span><span className="font-bold text-slate-800">2 admin roles</span></div>
                        <div className="flex justify-between py-1 border-b border-slate-100"><span className="text-slate-600">Annual savings</span><span className="font-bold text-emerald-700">~$45K</span></div>
                        <div className="flex justify-between py-1"><span className="text-slate-600">Risk level</span><span className="font-bold text-amber-700">Medium</span></div>
                      </>
                    )}
                  </div>
                </div>

                {selectedNode && <NodeDetailPanel nodeId={selectedNode} onClose={() => setSelectedNode(null)} />}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}