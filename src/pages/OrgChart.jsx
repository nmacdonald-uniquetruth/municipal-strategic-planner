import React, { useState, useMemo, useCallback } from 'react';
import { Network, ChevronDown } from 'lucide-react';
import SectionHeader from '../components/machias/SectionHeader';
import OrgTreeCanvas from '../components/orgchart/OrgTreeCanvas';
import {
  getAllPositions, buildOrgTree, DEPT_COLORS,
} from '../components/orgchart/OrgChartData';
import OrgChartSettings from '../components/orgchart/OrgChartSettings.jsx';

// ─── Legend ───────────────────────────────────────────────────────────────────
function Legend() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm flex items-center gap-5 flex-wrap">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Legend</p>
      {[
        { color: '#22c55e', label: 'Filled position' },
        { color: '#f59e0b', label: 'Vacant position' },
        { color: '#344A60', label: 'Structural / Governance node' },
      ].map(({ color, label }) => (
        <div key={label} className="flex items-center gap-1.5 text-xs text-slate-600">
          <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
          {label}
        </div>
      ))}
      <p className="text-[10px] text-slate-400 ml-auto">
        Drag to pan · Scroll to zoom · Click node for details
      </p>
    </div>
  );
}

// ─── Stats bar ────────────────────────────────────────────────────────────────
function StatsBar({ positions, view, onViewChange }) {
  // Only count actual position nodes for stats
  const positionNodes = positions.filter(p => p.nodeType === 'position');
  const filled = positionNodes.filter(p => p.status === 'filled').length;
  const vacant = positionNodes.filter(p => p.status === 'vacant').length;

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex gap-2">
        {[
          { label: 'Positions', value: positionNodes.length, cls: 'text-slate-900' },
          { label: 'Filled',    value: filled,                cls: 'text-emerald-700' },
          { label: 'Vacant',    value: vacant,                cls: 'text-amber-600' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-center min-w-16 shadow-sm">
            <p className={`text-lg font-bold leading-none ${s.cls}`}>{s.value}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="ml-auto flex rounded-xl border border-slate-200 bg-white p-1 gap-1 shadow-sm">
        {[{ id: 'tree', label: '⬛ Tree' }, { id: 'dept', label: '☰ Departments' }].map(v => (
          <button key={v.id} onClick={() => onViewChange(v.id)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              view === v.id ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
            }`}>
            {v.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Dept list view ───────────────────────────────────────────────────────────
function DeptListView({ positions, selectedId, onSelect }) {
  const [open, setOpen] = useState({});

  // Only show position nodes in dept view, grouped by dept
  const byDept = useMemo(() => {
    const d = {};
    positions
      .filter(p => p.nodeType === 'position')
      .forEach(p => {
        if (!d[p.dept]) d[p.dept] = [];
        d[p.dept].push(p);
      });
    return d;
  }, [positions]);

  return (
    <div className="p-4 space-y-2">
      {Object.entries(byDept).map(([dept, pos]) => {
        const color = DEPT_COLORS[dept] || '#344A60';
        const isOpen = open[dept] !== false;
        return (
          <div key={dept} className="rounded-xl border border-slate-200 overflow-hidden">
            <button onClick={() => setOpen(o => ({ ...o, [dept]: !isOpen }))}
              className="w-full flex items-center justify-between px-4 py-2.5 text-white text-sm font-bold"
              style={{ background: color }}>
              <span>{dept}</span>
              <div className="flex items-center gap-2 text-[10px]">
                <span className="bg-white/20 px-2 py-0.5 rounded-full">{pos.length}</span>
                <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </div>
            </button>
            {isOpen && (
              <div className="bg-white">
                {pos.map(p => (
                  <div key={p.id} onClick={() => onSelect(p)}
                    className={`flex items-center gap-3 px-4 py-2 border-b border-slate-50 last:border-0 cursor-pointer hover:bg-slate-50 transition-colors ${selectedId === p.id ? 'bg-blue-50' : ''}`}>
                    <span className={`h-2 w-2 rounded-full flex-shrink-0 ${p.status === 'filled' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-800 truncate">{p.title}</p>
                      {p.employee && <p className="text-[10px] text-slate-500 truncate">{p.employee}</p>}
                    </div>
                    {!p.fullTime && <span className="text-[9px] text-slate-400">PT</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Detail panel ─────────────────────────────────────────────────────────────
function DetailPanel({ node, allPositions, onClose }) {
  if (!node) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white h-full flex flex-col items-center justify-center p-6 text-center shadow-sm">
        <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
          <Network className="h-6 w-6 text-slate-300" />
        </div>
        <p className="text-sm font-semibold text-slate-500">Select a node</p>
        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
          Click any node in the chart to view details, reporting lines, and status.
        </p>
      </div>
    );
  }

  const isStructural = node.nodeType === 'structural';
  const color = DEPT_COLORS[node.dept] || '#344A60';
  const supervisor = allPositions.find(p => p.id === node.reportsTo);
  const reports = allPositions.filter(p => p.reportsTo === node.id);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm h-full flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 text-white relative flex-shrink-0" style={{ background: color }}>
        <button onClick={onClose}
          className="absolute top-3 right-3 h-6 w-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-base leading-none transition-colors">
          ×
        </button>
        <p className="text-sm font-bold pr-8 leading-snug">{node.title}</p>
        <p className="text-[11px] opacity-75 mt-0.5">{node.dept}</p>

        {isStructural ? (
          <div className="mt-2.5">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 font-medium">
              Governance Body
            </span>
          </div>
        ) : (
          <div className="mt-2.5 flex gap-1.5 flex-wrap">
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              node.status === 'filled' ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-200 text-amber-900'
            }`}>
              {node.status === 'filled' ? 'Filled' : 'Vacant'}
            </span>
            {!node.fullTime && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 font-medium">Part-Time</span>
            )}
            {node.isUnion && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-200 text-purple-900 font-bold">Union</span>
            )}
            {node.contracted && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 font-medium">Contracted</span>
            )}
          </div>
        )}
      </div>

      {/* Employee — only for position nodes */}
      {!isStructural && (
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex-shrink-0">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Employee</p>
          {node.employee
            ? <p className="text-sm font-semibold text-slate-900">{node.employee}</p>
            : <p className="text-sm italic text-amber-600">Position Vacant</p>}
        </div>
      )}

      {/* Details */}
      <div className="px-5 py-4 space-y-3 text-xs flex-1 overflow-y-auto">
        {isStructural && (
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Node Type</p>
            <p className="text-slate-700">Governance / Structural Body — no vacancy or employment status applies.</p>
          </div>
        )}
        {supervisor && (
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Reports To</p>
            <p className="font-medium text-slate-800">{supervisor.title}</p>
          </div>
        )}
        {reports.length > 0 && (
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Direct Reports ({reports.length})
            </p>
            <div className="space-y-1.5">
              {reports.map(r => (
                <div key={r.id} className="flex items-center gap-2">
                  <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${
                    r.nodeType === 'structural' ? 'bg-slate-400' :
                    r.status === 'filled' ? 'bg-emerald-500' : 'bg-amber-400'
                  }`} />
                  <span className="text-slate-700 leading-snug">{r.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function OrgChart() {
  const [orgSettings, setOrgSettings] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [view, setView] = useState('tree');

  // Load settings from OrgChartSettings component via callback
  const handleSettingsLoad = useCallback((s) => setOrgSettings(s), []);

  const positions = useMemo(() => {
    if (!orgSettings) return [];
    return getAllPositions(orgSettings);
  }, [orgSettings]);

  const tree = useMemo(() => buildOrgTree(positions), [positions]);

  const handleSelect = useCallback((node) => {
    setSelectedNode(prev => !node || prev?.id === node.id ? null : node);
  }, []);

  const canvasStyle = {
    height: 'clamp(520px, calc(100vh - 260px), 860px)',
  };

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto">
      {/* Header */}
      <SectionHeader
        title="Municipal Organizational Chart"
        subtitle="Town of Machias — organizational structure and reporting hierarchy"
        icon={Network}
      />

      {/* Settings loader (hidden — just reads settings and calls back) */}
      <OrgChartSettings onLoad={handleSettingsLoad} />

      {/* Stats + view toggle */}
      <StatsBar positions={positions} view={view} onViewChange={setView} />

      {/* Legend */}
      <Legend />

      {/* Main chart area + detail panel */}
      <div className="flex gap-4 items-start">
        {/* Chart canvas */}
        <div
          className="flex-1 min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden"
          style={{ ...canvasStyle, position: 'relative', minWidth: '500px' }}
        >
          {view === 'tree' && positions.length > 0 && (
            <OrgTreeCanvas
              roots={tree}
              selectedId={selectedNode?.id}
              onSelect={handleSelect}
            />
          )}
          {view === 'dept' && (
            <div className="absolute inset-0 overflow-y-auto">
              <DeptListView positions={positions} selectedId={selectedNode?.id} onSelect={handleSelect} />
            </div>
          )}
          {positions.length === 0 && (
            <div className="flex items-center justify-center h-full text-slate-400 text-sm">
              Loading chart…
            </div>
          )}
        </div>

        {/* Detail panel */}
        <div className="flex-shrink-0" style={{ width: '300px', ...canvasStyle }}>
          <DetailPanel node={selectedNode} allPositions={positions} onClose={() => setSelectedNode(null)} />
        </div>
      </div>
    </div>
  );
}