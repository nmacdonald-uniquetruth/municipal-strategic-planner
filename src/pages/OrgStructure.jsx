import React, { useState, useEffect, useMemo, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { buildTree, NODE_TYPE_CONFIG, RESTRUCTURING_STATUS_CONFIG } from '../components/org/orgUtils';
import { MACHIAS_ORG_SEED } from '../components/org/orgData';
import { applySettingsOverlay } from '../components/org/orgSettingsOverlay';
import { useModel } from '../components/machias/ModelContext';
import OrgTree from '../components/org/OrgTree';
import OrgNodeDetail from '../components/org/OrgNodeDetail';
import OrgLegend from '../components/org/OrgLegend';
import {
  Building2, GraduationCap, Globe, ZoomIn, ZoomOut, RotateCcw,
  Filter, Eye, EyeOff, Download, Layers, AlertTriangle, CheckCircle2,
  Plus, Loader2, Users
} from 'lucide-react';

const VIEW_MODES = [
  { id: 'municipal', label: 'Municipal Government', icon: Building2, branch: 'municipal' },
  { id: 'school',    label: 'School Governance',    icon: GraduationCap, branch: 'school' },
  { id: 'full',      label: 'Full Community Map',   icon: Globe, branch: null },
];

const NODE_TYPE_LABELS = Object.entries(NODE_TYPE_CONFIG)
  .filter(([k]) => k !== 'root')
  .map(([k, v]) => ({ key: k, label: v.label }));

export default function OrgStructure() {
  const { settings } = useModel();
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [viewMode, setViewMode] = useState('municipal');
  const [showRestructuring, setShowRestructuring] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef(null);
  const containerRef = useRef(null);

  // Load nodes
  useEffect(() => {
    loadNodes();
  }, []);

  async function loadNodes() {
    setLoading(true);
    const data = await base44.entities.OrgNode.list('sort_order', 500);
    if (data.length === 0) {
      await seedData();
    } else {
      // Live-patch: if SA/BS/RC/GA/Controller are still parented to finance_hr dept
      // (old seed), update them to point to finance_dir in the DB once.
      const financeDir = data.find(n => n.name && n.name.includes('Finance Director'));
      if (financeDir) {
        const needsPatch = data.filter(n =>
          ['Staff Accountant','Billing Specialist','Revenue Coordinator','GA Coordinator','Controller'].includes(n.name) &&
          n.parent_id !== financeDir.id
        );
        if (needsPatch.length > 0) {
          await Promise.all(needsPatch.map(n => base44.entities.OrgNode.update(n.id, { parent_id: financeDir.id })));
          const refreshed = await base44.entities.OrgNode.list('sort_order', 500);
          setNodes(refreshed);
          setLoading(false);
          return;
        }
      }
      setNodes(data);
    }
    setLoading(false);
  }

  async function seedData() {
    setSeeding(true);
    // Create all seed nodes; build id map from _key
    const keyToId = {};
    // First pass: create roots and top-level (no parent)
    const sorted = [...MACHIAS_ORG_SEED].sort((a, b) => {
      const aHasParent = !!a.parent_id;
      const bHasParent = !!b.parent_id;
      return aHasParent - bHasParent || (a.sort_order || 0) - (b.sort_order || 0);
    });

    // Multi-pass to resolve parent IDs
    const maxPasses = 6;
    let remaining = [...sorted];
    for (let pass = 0; pass < maxPasses && remaining.length > 0; pass++) {
      const nextRound = [];
      for (const seed of remaining) {
        const parentResolved = !seed.parent_id || keyToId[seed.parent_id];
        if (parentResolved) {
          const { _key, parent_id, ...rest } = seed;
          const payload = { ...rest };
          if (parent_id && keyToId[parent_id]) payload.parent_id = keyToId[parent_id];
          const created = await base44.entities.OrgNode.create(payload);
          keyToId[_key] = created.id;
        } else {
          nextRound.push(seed);
        }
      }
      remaining = nextRound;
    }

    const data = await base44.entities.OrgNode.list('sort_order', 500);
    setNodes(data);
    setSeeding(false);
  }

  // Build filtered tree — apply model settings overlay first
  const tree = useMemo(() => {
    if (!nodes.length) return [];
    // Apply dynamic settings overlay (GA reporting, SA/BS/RC under FD, Y5 label)
    const patched = applySettingsOverlay(nodes, settings);
    let filtered = patched;
    if (filterType !== 'all') filtered = filtered.filter(n => n.node_type === filterType);

    const currentBranch = VIEW_MODES.find(v => v.id === viewMode)?.branch;
    if (viewMode === 'full') {
      // Include all nodes
    } else if (currentBranch) {
      // Include only the branch nodes + the root
      filtered = filtered.filter(n => n.branch === currentBranch || n.branch === 'root');
    }

    return buildTree(filtered);
  }, [nodes, viewMode, filterType, settings]);

  // Filter roots by view
  const displayRoots = useMemo(() => {
    if (viewMode === 'full') return tree;
    const currentBranch = VIEW_MODES.find(v => v.id === viewMode)?.branch;
    // For municipal: top-level is Select Board; for school: School Committee
    return tree.filter(r => {
      if (r.branch === 'root') return false; // root is handled specially in OrgTree full mode
      return r.branch === currentBranch || (!r.parent_id && r.branch === currentBranch);
    });
  }, [tree, viewMode]);

  // Stats
  const stats = useMemo(() => {
    const municipal = nodes.filter(n => n.branch === 'municipal').length;
    const school = nodes.filter(n => n.branch === 'school').length;
    const restructuring = nodes.filter(n => n.restructuring_status !== 'unchanged').length;
    const proposed_new = nodes.filter(n => n.restructuring_status === 'proposed_new').length;
    return { municipal, school, restructuring, proposed_new, total: nodes.length };
  }, [nodes]);

  // Pan handlers
  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    setIsPanning(true);
    panStart.current = { x: e.clientX - panX, y: e.clientY - panY };
  };
  const handleMouseMove = (e) => {
    if (!isPanning || !panStart.current) return;
    setPanX(e.clientX - panStart.current.x);
    setPanY(e.clientY - panStart.current.y);
  };
  const handleMouseUp = () => setIsPanning(false);

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(z => Math.max(0.3, Math.min(2.5, z + delta)));
  };

  const resetView = () => { setZoom(1); setPanX(0); setPanY(0); };

  const exportPrint = () => {
    window.print();
  };

  if (loading || seeding) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3 text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        <p className="text-sm">{seeding ? 'Building organizational structure…' : 'Loading…'}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] overflow-hidden -m-4 md:-m-6 lg:-m-8">

      {/* ── Top toolbar ── */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-slate-200 bg-white flex flex-wrap items-center gap-3">
        {/* Title */}
        <div className="mr-2">
          <h1 className="text-sm font-bold text-slate-900 leading-none">Org Structure</h1>
          <p className="text-[10px] text-slate-500">Town of Machias + AOS 96</p>
        </div>

        {/* View mode tabs */}
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
          {VIEW_MODES.map(vm => {
            const Icon = vm.icon;
            return (
              <button
                key={vm.id}
                onClick={() => setViewMode(vm.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  viewMode === vm.id ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className="h-3 w-3" />
                <span className="hidden sm:inline">{vm.label}</span>
              </button>
            );
          })}
        </div>

        {/* Node type filter */}
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-700 focus:outline-none"
        >
          <option value="all">All Types</option>
          {NODE_TYPE_LABELS.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
        </select>

        {/* Restructuring toggle */}
        <button
          onClick={() => setShowRestructuring(!showRestructuring)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
            showRestructuring ? 'bg-amber-50 border-amber-300 text-amber-800' : 'bg-slate-100 border-slate-200 text-slate-600'
          }`}
        >
          <AlertTriangle className="h-3 w-3" />
          Restructuring
        </button>

        {/* Stats */}
        <div className="hidden md:flex items-center gap-3 ml-auto">
          <span className="text-xs text-slate-500"><strong className="text-slate-800">{stats.municipal}</strong> municipal nodes</span>
          <span className="text-xs text-slate-500"><strong className="text-slate-800">{stats.school}</strong> school nodes</span>
          {showRestructuring && <span className="text-xs text-amber-700"><strong>{stats.restructuring}</strong> changes flagged</span>}
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-1 ml-auto md:ml-0 border border-slate-200 rounded-lg bg-white">
          <button onClick={() => setZoom(z => Math.min(2.5, z + 0.15))} className="p-1.5 hover:bg-slate-50 text-slate-600 rounded-l-lg transition-colors">
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          <span className="text-[10px] text-slate-500 px-1 font-mono w-10 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.max(0.3, z - 0.15))} className="p-1.5 hover:bg-slate-50 text-slate-600 transition-colors">
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <button onClick={resetView} className="p-1.5 hover:bg-slate-50 text-slate-600 rounded-r-lg transition-colors border-l border-slate-200">
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>

        <button onClick={exportPrint} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 text-white hover:bg-slate-700 transition-colors">
          <Download className="h-3 w-3" />
          Export
        </button>
      </div>

      {/* ── Main content area ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Chart area */}
        <div
          ref={containerRef}
          className={`flex-1 overflow-hidden relative bg-slate-50 ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          {/* Grid background */}
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: 'radial-gradient(circle, #94a3b8 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          {/* Zoomable / pannable container */}
          <div
            className="absolute"
            style={{
              transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
              transformOrigin: 'top center',
              top: '20px',
              left: '50%',
              marginLeft: '-50%',
              width: '100%',
            }}
          >
            {viewMode === 'full' ? (
              <OrgTree
                roots={tree}
                onSelect={setSelectedNode}
                selected={selectedNode}
                showRestructuring={showRestructuring}
                viewMode="full"
              />
            ) : (
              <OrgTree
                roots={displayRoots}
                onSelect={setSelectedNode}
                selected={selectedNode}
                showRestructuring={showRestructuring}
                viewMode={viewMode}
              />
            )}
          </div>

          {/* Hint overlay when empty */}
          {displayRoots.length === 0 && !loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-slate-400">
                <Layers className="h-10 w-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No nodes match current filters</p>
              </div>
            </div>
          )}

          {/* Legend — bottom left overlay */}
          <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm rounded-xl border border-slate-200 p-3 shadow-sm max-w-md">
            <OrgLegend showRestructuring={showRestructuring} />
          </div>
        </div>

        {/* Detail panel */}
        {selectedNode && (
          <div className="w-72 flex-shrink-0 border-l border-slate-200 bg-white overflow-hidden flex flex-col">
            <OrgNodeDetail
              node={selectedNode}
              onClose={() => setSelectedNode(null)}
            />
          </div>
        )}
      </div>

      {/* ── Restructuring summary bar ── */}
      {showRestructuring && (
        <div className="flex-shrink-0 border-t border-slate-200 bg-white px-4 py-2 flex items-center gap-4 flex-wrap">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Restructuring Summary:</span>
          {Object.entries(RESTRUCTURING_STATUS_CONFIG).map(([key, cfg]) => {
            const count = nodes.filter(n => n.restructuring_status === key).length;
            if (count === 0) return null;
            return (
              <div key={key} className="flex items-center gap-1.5 text-xs">
                <div className={`h-2 w-2 rounded-full ${cfg.dot}`} />
                <span className="text-slate-700">{cfg.label}:</span>
                <strong className="text-slate-900">{count}</strong>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}