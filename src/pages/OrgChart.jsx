import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Network, List, Settings, RotateCcw, Columns, ChevronDown, ChevronUp, SplitSquareHorizontal } from 'lucide-react';
import SectionHeader from '../components/machias/SectionHeader';
import OrgSVGCanvas from '../components/orgchart/OrgSVGCanvas';
import OrgScenarioPanel from '../components/orgchart/OrgScenarioPanel';
import OrgDetailPanel from '../components/orgchart/OrgDetailPanel';
import OrgDeptView from '../components/orgchart/OrgDeptView';
import OrgBudgetSummary from '../components/orgchart/OrgBudgetSummary';
import {
  SEED_POSITIONS, SEED_EMPLOYEES, SEED_SCENARIOS,
  getVisiblePositions, buildTree
} from '../components/orgchart/OrgData';

// ─── Seeding ──────────────────────────────────────────────────────────────────
async function seedIfEmpty() {
  const [pos, emp, scen] = await Promise.all([
    base44.entities.OrgPosition.list(),
    base44.entities.OrgEmployee.list(),
    base44.entities.OrgScenario.list(),
  ]);
  const ops = [];
  if (!pos || pos.length === 0) ops.push(base44.entities.OrgPosition.bulkCreate(SEED_POSITIONS));
  if (!emp || emp.length === 0) ops.push(base44.entities.OrgEmployee.bulkCreate(SEED_EMPLOYEES));
  if (!scen || scen.length === 0) ops.push(base44.entities.OrgScenario.bulkCreate(SEED_SCENARIOS));
  if (ops.length > 0) await Promise.all(ops);
}

// ─── Mini settings panel (collapsible) ────────────────────────────────────────
const FINANCE_OPTIONS = [
  { value: 'controller_sa', label: 'Controller + SA' },
  { value: 'controller_2sa', label: 'Controller + 2 SAs' },
  { value: 'two_sa', label: 'Two SAs (no Controller)' },
  { value: 'sa_ptsa', label: 'SA + Part-Time SA' },
  { value: 'controller_sa_ptsa', label: 'Controller + SA + PT SA' },
];
const BILLING_OPTIONS = [
  { value: 'one_bs', label: 'One Billing Specialist' },
  { value: 'two_bs', label: 'Two Billing Specialists' },
  { value: 'bs_rc', label: 'BS + Revenue Coordinator' },
];
const GA_OPTIONS = [
  { value: 'town_manager', label: 'Town Manager' },
  { value: 'finance_director', label: 'Finance Director' },
];

function InlineSettingsBar({ scenario, onUpdate }) {
  if (!scenario) return null;
  return (
    <div className="flex items-center gap-3 flex-wrap px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs">
      <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Finance:</span>
      <select
        value={scenario.finance_structure}
        onChange={e => onUpdate({ finance_structure: e.target.value })}
        className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white text-slate-800 font-medium focus:outline-none"
      >
        {FINANCE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>

      <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Billing:</span>
      <select
        value={scenario.billing_structure}
        onChange={e => onUpdate({ billing_structure: e.target.value })}
        className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white text-slate-800 font-medium focus:outline-none"
      >
        {BILLING_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>

      <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">GA Coordinator:</span>
      <select
        value={scenario.ga_reporting}
        onChange={e => onUpdate({ ga_reporting: e.target.value })}
        className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white text-slate-800 font-medium focus:outline-none"
      >
        {GA_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>

      <label className="flex items-center gap-1.5 cursor-pointer">
        <input type="checkbox" checked={scenario.show_vacant} onChange={e => onUpdate({ show_vacant: e.target.checked })} className="rounded" />
        <span>Show Vacant</span>
      </label>
      <label className="flex items-center gap-1.5 cursor-pointer">
        <input type="checkbox" checked={scenario.show_part_time} onChange={e => onUpdate({ show_part_time: e.target.checked })} className="rounded" />
        <span>Show Part-Time</span>
      </label>
    </div>
  );
}

// ─── Single chart pane ────────────────────────────────────────────────────────
function ChartPane({ scenario, positions, employeeMap, onSelect, selectedId, label }) {
  const processed = useMemo(() => {
    if (!scenario || !positions.length) return [];
    return getVisiblePositions(positions, scenario).map(p => ({ ...p, employee: employeeMap[p.position_id] || null }));
  }, [positions, scenario, employeeMap]);

  const tree = useMemo(() => buildTree(processed, employeeMap), [processed, employeeMap]);

  const stats = useMemo(() => ({
    total: processed.filter(p => !p._hidden).length,
    filled: processed.filter(p => !p._hidden && p.status === 'filled').length,
    vacant: processed.filter(p => !p._hidden && p.status === 'vacant').length,
  }), [processed]);

  return (
    <div className="flex flex-col flex-1 min-w-0 min-h-0">
      {label && (
        <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full" style={{ background: scenario?.color || '#344A60' }} />
            <span className="text-xs font-bold text-slate-800">{label}</span>
          </div>
          <div className="flex gap-3 text-[10px] text-slate-500">
            <span>{stats.total} positions</span>
            <span className="text-emerald-600 font-medium">{stats.filled} filled</span>
            <span className="text-amber-600 font-medium">{stats.vacant} vacant</span>
          </div>
        </div>
      )}
      <div className="flex-1 min-h-0">
        <OrgSVGCanvas tree={tree} onSelect={onSelect} selectedId={selectedId} />
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function OrgChart() {
  const [positions, setPositions] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [scenarios, setScenarios] = useState([]);
  const [activeScenario, setActiveScenario] = useState(null);
  const [localScenario, setLocalScenario] = useState(null);
  const [compareScenario, setCompareScenario] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [view, setView] = useState('tree'); // 'tree' | 'dept' | 'compare'
  const [showSidebar, setShowSidebar] = useState(true);
  const [showDetail, setShowDetail] = useState(true);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    await seedIfEmpty();
    const [pos, emp, scen] = await Promise.all([
      base44.entities.OrgPosition.list('sort_order', 200),
      base44.entities.OrgEmployee.list('created_date', 200),
      base44.entities.OrgScenario.list(),
    ]);
    setPositions(pos || []);
    setEmployees(emp || []);
    const scenList = scen || [];
    setScenarios(scenList);
    const baseline = scenList.find(s => s.is_baseline) || scenList[0];
    setActiveScenario(baseline || null);
    setLocalScenario(baseline || null);
    setCompareScenario(scenList[1] || null);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const employeeMap = useMemo(() => {
    const map = {};
    employees.forEach(e => { map[e.position_id] = e; });
    return map;
  }, [employees]);

  const enrichedPositions = useMemo(() => {
    if (!localScenario || !positions.length) return [];
    return getVisiblePositions(positions, localScenario)
      .map(p => ({ ...p, employee: employeeMap[p.position_id] || null }));
  }, [positions, localScenario, employeeMap]);

  const handleSelectNode = useCallback((node) => {
    setSelectedNode(prev => !node || prev?.position_id === node.position_id ? null : node);
    if (node) setShowDetail(true);
  }, []);

  const handleUpdateScenario = useCallback((updates) => {
    setLocalScenario(prev => ({ ...prev, ...updates }));
  }, []);

  const handleSelectScenario = useCallback((s) => {
    setActiveScenario(s);
    setLocalScenario(s);
    setSelectedNode(null);
  }, []);

  const handleSave = useCallback(async () => {
    if (!localScenario?.id) return;
    await base44.entities.OrgScenario.update(localScenario.id, localScenario);
    setActiveScenario(localScenario);
  }, [localScenario]);

  const handleReset = useCallback(() => setLocalScenario(activeScenario), [activeScenario]);

  const stats = useMemo(() => {
    const vis = enrichedPositions.filter(p => !p._hidden);
    return {
      total: vis.length,
      filled: vis.filter(p => p.status === 'filled').length,
      vacant: vis.filter(p => p.status === 'vacant').length,
      configurable: vis.filter(p => p.is_configurable).length,
    };
  }, [enrichedPositions]);

  const isDirty = localScenario && activeScenario &&
    JSON.stringify({ finance_structure: localScenario.finance_structure, billing_structure: localScenario.billing_structure, ga_reporting: localScenario.ga_reporting, show_vacant: localScenario.show_vacant, show_part_time: localScenario.show_part_time })
    !==
    JSON.stringify({ finance_structure: activeScenario.finance_structure, billing_structure: activeScenario.billing_structure, ga_reporting: activeScenario.ga_reporting, show_vacant: activeScenario.show_vacant, show_part_time: activeScenario.show_part_time });

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height: 'calc(100vh - 120px)' }}>
        <div className="text-center space-y-3">
          <div className="h-10 w-10 rounded-full border-4 border-slate-200 border-t-slate-800 animate-spin mx-auto" />
          <p className="text-sm text-slate-500">Loading organizational chart…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 100px)', minHeight: '600px' }}>
      {/* ── Header ── */}
      <div className="flex-shrink-0 space-y-3 pb-3">
        <SectionHeader
          title="Municipal Organizational Chart"
          subtitle="Live restructuring simulator — settings-driven, zoom/pan SVG canvas with scenario comparison"
          icon={Network}
        />

        {/* Stats bar */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Positions', value: stats.total, color: 'text-slate-900' },
            { label: 'Filled', value: stats.filled, color: 'text-emerald-700' },
            { label: 'Vacant', value: stats.vacant, color: 'text-amber-600' },
            { label: 'Configurable', value: stats.configurable, color: 'text-blue-700' },
          ].map(s => (
            <div key={s.label} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center">
              <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* View tabs */}
          <div className="flex rounded-lg border border-slate-200 bg-white p-1 gap-1">
            {[
              { id: 'tree', icon: '⬛', label: 'Tree View' },
              { id: 'dept', icon: '☰', label: 'Dept List' },
              { id: 'compare', icon: '⧉', label: 'Compare' },
            ].map(v => (
              <button key={v.id} onClick={() => setView(v.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${view === v.id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
                {v.icon} {v.label}
              </button>
            ))}
          </div>

          {/* Scenario badge */}
          {localScenario && (
            <div className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white flex items-center gap-1.5"
              style={{ background: localScenario.color || '#344A60' }}>
              <span className="h-2 w-2 rounded-full bg-white/40" />
              {localScenario.name}
            </div>
          )}

          {/* Dirty state */}
          {isDirty && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-amber-600 font-semibold">● Unsaved</span>
              <button onClick={handleSave} className="text-xs px-2.5 py-1.5 rounded-lg bg-emerald-700 text-white font-medium hover:bg-emerald-800">Save</button>
              <button onClick={handleReset} className="text-xs px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50">Reset</button>
            </div>
          )}

          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => setShowSidebar(v => !v)}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center gap-1">
              <Settings className="h-3.5 w-3.5" /> {showSidebar ? 'Hide' : 'Show'} Scenarios
            </button>
            <button onClick={() => setShowDetail(v => !v)}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center gap-1">
              ⓘ {showDetail ? 'Hide' : 'Show'} Detail
            </button>
          </div>
        </div>

        {/* Inline settings bar — always visible for tree/compare view */}
        {(view === 'tree' || view === 'compare') && (
          <InlineSettingsBar scenario={localScenario} onUpdate={handleUpdateScenario} />
        )}
      </div>

      {/* ── Main layout ── */}
      <div className="flex gap-3 flex-1 min-h-0">

        {/* Left sidebar — scenario panel */}
        {showSidebar && (
          <div className="w-64 flex-shrink-0 overflow-y-auto space-y-3">
            <OrgScenarioPanel
              scenario={localScenario}
              scenarios={scenarios}
              onSelectScenario={handleSelectScenario}
              onUpdateScenario={handleUpdateScenario}
              onSaveScenario={handleSave}
            />
            <OrgBudgetSummary positions={enrichedPositions} scenario={localScenario} />
          </div>
        )}

        {/* Center — chart */}
        <div className="flex-1 min-w-0 rounded-xl border border-slate-200 bg-white overflow-hidden" style={{ minHeight: '500px' }}>
          {view === 'tree' && (
            <ChartPane
              scenario={localScenario}
              positions={positions}
              employeeMap={employeeMap}
              onSelect={handleSelectNode}
              selectedId={selectedNode?.position_id}
            />
          )}

          {view === 'dept' && (
            <div className="h-full overflow-y-auto p-4">
              <OrgDeptView
                positions={enrichedPositions}
                onSelect={handleSelectNode}
                selectedId={selectedNode?.position_id}
              />
            </div>
          )}

          {view === 'compare' && (
            <div className="flex h-full divide-x divide-slate-200">
              <div className="flex-1 min-w-0 flex flex-col">
                {/* Compare scenario A selector */}
                <div className="flex-shrink-0 px-3 py-2 bg-slate-50 border-b border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase mr-2">Scenario A:</span>
                  <select
                    value={localScenario?.name || ''}
                    onChange={e => {
                      const s = scenarios.find(sc => sc.name === e.target.value);
                      if (s) handleSelectScenario(s);
                    }}
                    className="text-xs border border-slate-200 rounded px-2 py-0.5"
                  >
                    {scenarios.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
                <ChartPane
                  scenario={localScenario}
                  positions={positions}
                  employeeMap={employeeMap}
                  onSelect={handleSelectNode}
                  selectedId={selectedNode?.position_id}
                  label={localScenario?.name}
                />
              </div>
              <div className="flex-1 min-w-0 flex flex-col">
                {/* Compare scenario B selector */}
                <div className="flex-shrink-0 px-3 py-2 bg-slate-50 border-b border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase mr-2">Scenario B:</span>
                  <select
                    value={compareScenario?.name || ''}
                    onChange={e => {
                      const s = scenarios.find(sc => sc.name === e.target.value);
                      if (s) setCompareScenario(s);
                    }}
                    className="text-xs border border-slate-200 rounded px-2 py-0.5"
                  >
                    {scenarios.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
                <ChartPane
                  scenario={compareScenario}
                  positions={positions}
                  employeeMap={employeeMap}
                  onSelect={handleSelectNode}
                  selectedId={selectedNode?.position_id}
                  label={compareScenario?.name}
                />
              </div>
            </div>
          )}
        </div>

        {/* Right — detail panel */}
        {showDetail && (
          <div className="w-72 flex-shrink-0 overflow-y-auto">
            {selectedNode ? (
              <OrgDetailPanel
                node={selectedNode}
                allPositions={enrichedPositions}
                onClose={() => setSelectedNode(null)}
              />
            ) : (
              <div className="rounded-xl border border-slate-200 bg-white p-5 text-center">
                <Network className="h-8 w-8 mx-auto mb-2 text-slate-200" />
                <p className="text-xs font-medium text-slate-500">Click any node</p>
                <p className="text-[10px] text-slate-400 mt-1">to see position details, reporting lines, and budget data</p>
                <div className="mt-4 text-left space-y-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Legend</p>
                  {[
                    { color: '#22c55e', label: 'Filled' },
                    { color: '#f59e0b', label: 'Vacant' },
                    { color: '#3b82f6', label: 'Proposed' },
                    { color: '#ef4444', label: 'Eliminated' },
                  ].map(({ color, label }) => (
                    <div key={label} className="flex items-center gap-2 text-[11px] text-slate-600">
                      <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                      {label}
                    </div>
                  ))}
                  <div className="flex items-center gap-2 text-[11px] text-slate-600 pt-1">
                    <span className="text-slate-400">---</span> Contracted role
                  </div>
                  <p className="text-[10px] text-slate-400 pt-2">Scroll/pinch to zoom · drag to pan · click ＋/− to collapse subtrees</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}