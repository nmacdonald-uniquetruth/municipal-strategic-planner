import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Network, List, Settings, RotateCcw, Download, Info, ChevronRight } from 'lucide-react';
import SectionHeader from '../components/machias/SectionHeader';
import OrgChartNode from '../components/orgchart/OrgChartNode';
import OrgScenarioPanel from '../components/orgchart/OrgScenarioPanel';
import OrgDetailPanel from '../components/orgchart/OrgDetailPanel';
import OrgDeptView from '../components/orgchart/OrgDeptView';
import OrgBudgetSummary from '../components/orgchart/OrgBudgetSummary';
import {
  SEED_POSITIONS, SEED_EMPLOYEES, SEED_SCENARIOS,
  getVisiblePositions, buildTree
} from '../components/orgchart/OrgData';

// ─── View mode toggle ────────────────────────────────────────────────────────
function ViewToggle({ view, onChange }) {
  return (
    <div className="flex rounded-lg border border-slate-200 bg-white p-1 gap-1">
      {[
        { id: 'tree', icon: Network, label: 'Tree' },
        { id: 'dept', icon: List, label: 'Department' },
      ].map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            view === id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Icon className="h-3.5 w-3.5" />
          {label}
        </button>
      ))}
    </div>
  );
}

// ─── Seeding logic ────────────────────────────────────────────────────────────
async function seedIfEmpty() {
  const [positions, employees, scenarios] = await Promise.all([
    base44.entities.OrgPosition.list(),
    base44.entities.OrgEmployee.list(),
    base44.entities.OrgScenario.list(),
  ]);

  const ops = [];
  if (!positions || positions.length === 0) {
    ops.push(base44.entities.OrgPosition.bulkCreate(SEED_POSITIONS));
  }
  if (!employees || employees.length === 0) {
    ops.push(base44.entities.OrgEmployee.bulkCreate(SEED_EMPLOYEES));
  }
  if (!scenarios || scenarios.length === 0) {
    ops.push(base44.entities.OrgScenario.bulkCreate(SEED_SCENARIOS));
  }
  if (ops.length > 0) await Promise.all(ops);
}

export default function OrgChart() {
  const [positions, setPositions] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [scenarios, setScenarios] = useState([]);
  const [activeScenario, setActiveScenario] = useState(null);
  const [localScenario, setLocalScenario] = useState(null); // unsaved local edits
  const [selectedNode, setSelectedNode] = useState(null);
  const [view, setView] = useState('tree');
  const [loading, setLoading] = useState(true);
  const [showRight, setShowRight] = useState(true);
  const [filterDept, setFilterDept] = useState('all');

  // Load data
  const load = useCallback(async () => {
    setLoading(true);
    await seedIfEmpty();
    const [pos, emp, scen] = await Promise.all([
      base44.entities.OrgPosition.list('sort_order'),
      base44.entities.OrgEmployee.list(),
      base44.entities.OrgScenario.list(),
    ]);
    setPositions(pos || []);
    setEmployees(emp || []);
    const scenList = scen || [];
    setScenarios(scenList);
    const baseline = scenList.find(s => s.is_baseline) || scenList[0];
    setActiveScenario(baseline || null);
    setLocalScenario(baseline || null);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Build employee lookup map
  const employeeMap = useMemo(() => {
    const map = {};
    employees.forEach(e => { map[e.position_id] = e; });
    return map;
  }, [employees]);

  // Apply scenario to positions
  const processedPositions = useMemo(() => {
    if (!localScenario || !positions.length) return [];
    return getVisiblePositions(positions, localScenario);
  }, [positions, localScenario]);

  // Enrich with employee data
  const enrichedPositions = useMemo(() => {
    return processedPositions.map(p => ({ ...p, employee: employeeMap[p.position_id] || null }));
  }, [processedPositions, employeeMap]);

  // Build tree structure
  const tree = useMemo(() => {
    return buildTree(enrichedPositions, employeeMap);
  }, [enrichedPositions, employeeMap]);

  // Dept list for filter
  const departments = useMemo(() => {
    const depts = new Set(enrichedPositions.filter(p => !p._hidden).map(p => p.department));
    return ['all', ...Array.from(depts)];
  }, [enrichedPositions]);

  const handleSelectNode = useCallback((node) => {
    setSelectedNode(prev => prev?.position_id === node.position_id ? null : node);
    setShowRight(true);
  }, []);

  const handleUpdateScenario = useCallback((updates) => {
    setLocalScenario(prev => ({ ...prev, ...updates }));
  }, []);

  const handleSelectScenario = useCallback((s) => {
    setActiveScenario(s);
    setLocalScenario(s);
    setSelectedNode(null);
  }, []);

  const handleSaveScenario = useCallback(async () => {
    if (!localScenario?.id) return;
    await base44.entities.OrgScenario.update(localScenario.id, localScenario);
    await load();
  }, [localScenario, load]);

  const handleResetScenario = useCallback(() => {
    setLocalScenario(activeScenario);
  }, [activeScenario]);

  // Stats for header
  const stats = useMemo(() => {
    const vis = enrichedPositions.filter(p => !p._hidden);
    return {
      total: vis.length,
      filled: vis.filter(p => p.status === 'filled').length,
      vacant: vis.filter(p => p.status === 'vacant').length,
      configurable: vis.filter(p => p.is_configurable).length,
    };
  }, [enrichedPositions]);

  const isDirty = localScenario && activeScenario && JSON.stringify(localScenario) !== JSON.stringify(activeScenario);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-2">
          <div className="h-8 w-8 rounded-full border-4 border-slate-200 border-t-slate-800 animate-spin mx-auto" />
          <p className="text-sm text-slate-500">Loading organizational chart…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-12">
      <SectionHeader
        title="Municipal Organizational Chart"
        subtitle="Dynamic restructuring simulator — scenario-driven reporting relationships and budget impact"
        icon={Network}
      />

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[
          { label: 'Total Positions', value: stats.total, color: 'text-slate-900' },
          { label: 'Filled', value: stats.filled, color: 'text-emerald-700' },
          { label: 'Vacant / Proposed', value: stats.vacant, color: 'text-amber-600' },
          { label: 'Scenario-Driven', value: stats.configurable, color: 'text-blue-700' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-3 text-center">
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <ViewToggle view={view} onChange={setView} />

        {localScenario && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold text-white"
            style={{ background: localScenario.color || '#344A60' }}>
            <span>{localScenario.name}</span>
          </div>
        )}

        {isDirty && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-amber-600 font-medium">Unsaved changes</span>
            <button onClick={handleSaveScenario} className="text-xs px-3 py-1.5 rounded-lg bg-emerald-700 text-white font-medium hover:bg-emerald-800">Save</button>
            <button onClick={handleResetScenario} className="text-xs px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center gap-1">
              <RotateCcw className="h-3 w-3" /> Reset
            </button>
          </div>
        )}

        <button
          onClick={() => setShowRight(v => !v)}
          className="ml-auto text-xs px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center gap-1.5"
        >
          <Settings className="h-3.5 w-3.5" />
          {showRight ? 'Hide' : 'Show'} Controls
        </button>
      </div>

      {/* Main 3-column layout */}
      <div className="flex gap-4 items-start">

        {/* Left: Scenario + Budget panels */}
        <div className="hidden xl:flex flex-col gap-4 w-72 flex-shrink-0">
          <OrgScenarioPanel
            scenario={localScenario}
            scenarios={scenarios}
            onSelectScenario={handleSelectScenario}
            onUpdateScenario={handleUpdateScenario}
            onSaveScenario={handleSaveScenario}
          />
          <OrgBudgetSummary positions={enrichedPositions} scenario={localScenario} />
        </div>

        {/* Center: Chart */}
        <div className="flex-1 min-w-0">
          {view === 'tree' ? (
            <div className="rounded-xl border border-slate-200 bg-white overflow-auto">
              <div className="min-w-max p-8">
                {tree.length === 0 ? (
                  <div className="text-center text-sm text-slate-400 py-16">No positions match current scenario settings.</div>
                ) : (
                  <div className="space-y-8">
                    {tree.map(rootNode => (
                      <OrgChartNode
                        key={rootNode.position_id}
                        node={rootNode}
                        depth={0}
                        onSelect={handleSelectNode}
                        selectedId={selectedNode?.position_id}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <OrgDeptView
              positions={enrichedPositions}
              onSelect={handleSelectNode}
              selectedId={selectedNode?.position_id}
            />
          )}
        </div>

        {/* Right: Detail + mobile scenario panel */}
        {showRight && (
          <div className="flex flex-col gap-4 w-80 flex-shrink-0">
            {/* Mobile-only scenario panel */}
            <div className="xl:hidden">
              <OrgScenarioPanel
                scenario={localScenario}
                scenarios={scenarios}
                onSelectScenario={handleSelectScenario}
                onUpdateScenario={handleUpdateScenario}
                onSaveScenario={handleSaveScenario}
              />
            </div>

            {selectedNode ? (
              <OrgDetailPanel
                node={selectedNode}
                allPositions={enrichedPositions}
                onClose={() => setSelectedNode(null)}
              />
            ) : (
              <div className="rounded-xl border border-slate-200 bg-white p-5 text-center text-sm text-slate-400">
                <Network className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="font-medium">Click any position</p>
                <p className="text-xs mt-1">to view details, reporting lines, and budget data</p>
              </div>
            )}

            {/* Mobile-only budget */}
            <div className="xl:hidden">
              <OrgBudgetSummary positions={enrichedPositions} scenario={localScenario} />
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap text-[10px] text-slate-500 pt-2">
        {[
          { color: 'bg-emerald-500', label: 'Filled' },
          { color: 'bg-amber-400', label: 'Vacant' },
          { color: 'bg-blue-500', label: 'Proposed' },
          { color: 'bg-red-500', label: 'Eliminated' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
            {label}
          </div>
        ))}
        <span className="mx-2 text-slate-300">|</span>
        <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-bold">Union</span>
        <span className="bg-slate-900 text-slate-200 font-mono px-1.5 py-0.5 rounded text-[9px]">GF</span>
        <span className="text-slate-400">= Fund source</span>
        <span className="ml-auto italic">Click collapse button (▼) on any node to expand/collapse its subtree</span>
      </div>
    </div>
  );
}