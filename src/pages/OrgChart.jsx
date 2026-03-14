import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Network } from 'lucide-react';
import SectionHeader from '../components/machias/SectionHeader';
import OrgSVGCanvas from '../components/orgchart/OrgSVGCanvas';
import OrgDetailPanel from '../components/orgchart/OrgDetailPanel';
import OrgBudgetSummary from '../components/orgchart/OrgBudgetSummary';
import OrgDeptView from '../components/orgchart/OrgDeptView';
import { SEED_POSITIONS, SEED_EMPLOYEES, getVisiblePositions, buildTree } from '../components/orgchart/OrgData';
import { useModel } from '../components/machias/ModelContext';

// ─── Seed data if empty ───────────────────────────────────────────────────────
async function seedIfEmpty() {
  const [pos, emp] = await Promise.all([
    base44.entities.OrgPosition.list(),
    base44.entities.OrgEmployee.list(),
  ]);
  const ops = [];
  if (!pos || pos.length === 0) ops.push(base44.entities.OrgPosition.bulkCreate(SEED_POSITIONS));
  if (!emp || emp.length === 0) ops.push(base44.entities.OrgEmployee.bulkCreate(SEED_EMPLOYEES));
  if (ops.length > 0) await Promise.all(ops);
}

// ─── Map ModelSettings → scenario config for getVisiblePositions ──────────────
function buildScenarioFromSettings(settings) {
  // y1_staffing_model: 'fulltime_sa' → two_sa, 'parttime_stipend' → sa_ptsa
  // y5_senior_hire: 'controller' → controller_sa, 'staff_accountant' → two_sa
  let finance_structure = 'two_sa';
  if (settings.y5_senior_hire === 'controller') {
    finance_structure = 'controller_sa';
  } else if (settings.y1_staffing_model === 'parttime_stipend') {
    finance_structure = 'sa_ptsa';
  }

  return {
    name: 'Current Model Settings',
    finance_structure,
    billing_structure: 'bs_rc', // show all billing/revenue positions
    ga_reporting: 'finance_director',
    show_vacant: true,
    show_part_time: true,
    enable_regional: true,
    color: '#344A60',
  };
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function OrgChart() {
  const { settings, loading: modelLoading } = useModel();
  const [positions, setPositions] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [view, setView] = useState('tree'); // 'tree' | 'dept'
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    await seedIfEmpty();
    const [pos, emp] = await Promise.all([
      base44.entities.OrgPosition.list('sort_order', 200),
      base44.entities.OrgEmployee.list('created_date', 200),
    ]);
    setPositions(pos || []);
    setEmployees(emp || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const employeeMap = useMemo(() => {
    const map = {};
    employees.forEach(e => { map[e.position_id] = e; });
    return map;
  }, [employees]);

  const scenario = useMemo(() => buildScenarioFromSettings(settings), [settings]);

  const enrichedPositions = useMemo(() => {
    if (!positions.length) return [];
    return getVisiblePositions(positions, scenario)
      .map(p => ({ ...p, employee: employeeMap[p.position_id] || null }));
  }, [positions, scenario, employeeMap]);

  const tree = useMemo(() => buildTree(enrichedPositions, employeeMap), [enrichedPositions, employeeMap]);

  const handleSelectNode = useCallback((node) => {
    setSelectedNode(prev => !node || prev?.position_id === node.position_id ? null : node);
  }, []);

  const stats = useMemo(() => {
    const vis = enrichedPositions.filter(p => !p._hidden);
    return {
      total: vis.length,
      filled: vis.filter(p => p.status === 'filled').length,
      vacant: vis.filter(p => p.status === 'vacant').length,
    };
  }, [enrichedPositions]);

  if (loading || modelLoading) {
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
      {/* Header */}
      <div className="flex-shrink-0 space-y-3 pb-3">
        <SectionHeader
          title="Municipal Organizational Chart"
          subtitle="Driven by Model Settings — zoom/pan to explore, click any node for details"
          icon={Network}
        />

        {/* Stats + view toggle */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex gap-2">
            {[
              { label: 'Positions', value: stats.total, color: 'text-slate-900' },
              { label: 'Filled', value: stats.filled, color: 'text-emerald-700' },
              { label: 'Vacant', value: stats.vacant, color: 'text-amber-600' },
            ].map(s => (
              <div key={s.label} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center min-w-16">
                <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>

          {/* View toggle */}
          <div className="flex rounded-lg border border-slate-200 bg-white p-1 gap-1">
            {[
              { id: 'tree', label: '⬛ Tree' },
              { id: 'dept', label: '☰ Departments' },
            ].map(v => (
              <button key={v.id} onClick={() => setView(v.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${view === v.id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
                {v.label}
              </button>
            ))}
          </div>

          <div className="ml-auto text-[10px] text-slate-400 bg-white border border-slate-200 px-3 py-1.5 rounded-lg">
            Staffing model: <span className="font-semibold text-slate-600">{scenario.finance_structure.replace(/_/g, ' ')}</span>
            &nbsp;·&nbsp;configured in <a href="/ModelSettings" className="text-blue-600 hover:underline">Model Settings</a>
          </div>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex gap-3" style={{ flex: 1, minHeight: 0 }}>
        {/* Center — chart */}
        <div className="flex-1 min-w-0 rounded-xl border border-slate-200 bg-white overflow-hidden" style={{ position: 'relative', minHeight: '500px' }}>
          {view === 'tree' && (
            <OrgSVGCanvas
              tree={tree}
              onSelect={handleSelectNode}
              selectedId={selectedNode?.position_id}
            />
          )}
          {view === 'dept' && (
            <div className="absolute inset-0 overflow-y-auto p-4">
              <OrgDeptView
                positions={enrichedPositions}
                onSelect={handleSelectNode}
                selectedId={selectedNode?.position_id}
              />
            </div>
          )}
        </div>

        {/* Right — detail + budget */}
        <div className="w-72 flex-shrink-0 overflow-y-auto space-y-3">
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
                <p className="text-[10px] text-slate-400 pt-2">Scroll/pinch to zoom · drag to pan · click ＋/− to collapse subtrees</p>
              </div>
            </div>
          )}
          <OrgBudgetSummary positions={enrichedPositions} scenario={scenario} />
        </div>
      </div>
    </div>
  );
}