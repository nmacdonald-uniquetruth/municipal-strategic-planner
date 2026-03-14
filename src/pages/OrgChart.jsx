import React, { useState, useMemo, useCallback } from 'react';
import { Network, Settings2, ChevronDown } from 'lucide-react';
import SectionHeader from '../components/machias/SectionHeader';
import OrgTreeCanvas from '../components/orgchart/OrgTreeCanvas';
import {
  getAllPositions, buildOrgTree,
  DEFAULT_ORG_SETTINGS, FINANCE_STRUCTURES, BILLING_STRUCTURES, GA_STRUCTURES,
  DEPT_COLORS,
} from '../components/orgchart/OrgChartData';

// ─── Settings panel ───────────────────────────────────────────────────────────
function SettingsPanel({ settings, onChange }) {
  const sel = (key, label, options) => (
    <div key={key} className="space-y-1.5">
      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
        {label}
      </label>
      <select
        value={settings[key]}
        onChange={e => onChange({ ...settings, [key]: e.target.value })}
        className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300"
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  const tog = (key, label) => (
    <label key={key} className="flex items-center gap-2.5 cursor-pointer py-1">
      <input type="checkbox" checked={settings[key]}
        onChange={e => onChange({ ...settings, [key]: e.target.checked })}
        className="rounded w-3.5 h-3.5 accent-slate-700" />
      <span className="text-xs text-slate-700">{label}</span>
    </label>
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      <div className="px-5 py-3.5 flex items-center gap-2" style={{ background: '#344A60' }}>
        <Settings2 className="h-4 w-4 text-slate-300" />
        <span className="text-sm font-bold text-white">Chart Settings</span>
      </div>
      <div className="p-5 space-y-4">
        {sel('FINANCE_DEPARTMENT_STRUCTURE', 'Finance Structure', FINANCE_STRUCTURES)}
        {sel('UTILITY_BILLING_STRUCTURE', 'Billing Structure', BILLING_STRUCTURES)}
        {sel('GA_REPORTING_STRUCTURE', 'GA Reporting', GA_STRUCTURES)}
        <div className="border-t border-slate-100 pt-4 space-y-1">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Display</p>
          {tog('SHOW_VACANT_POSITIONS', 'Show Vacant Positions')}
          {tog('SHOW_PART_TIME_POSITIONS', 'Show Part-Time Positions')}
        </div>
      </div>
    </div>
  );
}

// ─── Legend ───────────────────────────────────────────────────────────────────
function Legend() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Legend</p>
      <div className="space-y-2">
        {[
          { color: '#22c55e', label: 'Filled position' },
          { color: '#f59e0b', label: 'Vacant position' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-2.5 text-xs text-slate-600">
            <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
            {label}
          </div>
        ))}
      </div>
      <p className="text-[10px] text-slate-400 mt-3 leading-relaxed">
        Drag to pan · scroll to zoom<br />
        Click +/− to collapse branches
      </p>
    </div>
  );
}

// ─── Stats bar + view toggle ──────────────────────────────────────────────────
function HeaderControls({ positions, view, onViewChange }) {
  const filled = positions.filter(p => p.status === 'filled').length;
  const vacant = positions.filter(p => p.status === 'vacant').length;

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex gap-2">
        {[
          { label: 'Positions', value: positions.length, cls: 'text-slate-900' },
          { label: 'Filled',    value: filled,            cls: 'text-emerald-700' },
          { label: 'Vacant',    value: vacant,            cls: 'text-amber-600' },
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
  const byDept = useMemo(() => {
    const d = {};
    positions.forEach(p => {
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
        <p className="text-sm font-semibold text-slate-500">Select a position</p>
        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
          Click any node in the chart to view role details, reporting lines, and status.
        </p>
      </div>
    );
  }

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
      </div>

      {/* Employee */}
      <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex-shrink-0">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Employee</p>
        {node.employee
          ? <p className="text-sm font-semibold text-slate-900">{node.employee}</p>
          : <p className="text-sm italic text-amber-600">Position Vacant</p>}
      </div>

      {/* Details */}
      <div className="px-5 py-4 space-y-3 text-xs flex-1 overflow-y-auto">
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
                  <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${r.status === 'filled' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
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
  const [orgSettings, setOrgSettings] = useState(DEFAULT_ORG_SETTINGS);
  const [selectedNode, setSelectedNode] = useState(null);
  const [view, setView] = useState('tree');

  const positions = useMemo(() => getAllPositions(orgSettings), [orgSettings]);
  const tree = useMemo(() => buildOrgTree(positions), [positions]);

  const handleSelect = useCallback((node) => {
    setSelectedNode(prev => !node || prev?.id === node.id ? null : node);
  }, []);

  // Canvas height: responsive, clamped
  const canvasStyle = {
    height: 'clamp(520px, calc(100vh - 280px), 820px)',
  };

  return (
    <div className="space-y-5 max-w-[1520px] mx-auto">
      {/* Header */}
      <div className="space-y-4">
        <SectionHeader
          title="Municipal Organizational Chart"
          subtitle="Settings-driven — changes below update the chart instantly"
          icon={Network}
        />
        <HeaderControls positions={positions} view={view} onViewChange={setView} />
      </div>

      {/* 3-column body */}
      <div className="flex gap-5 items-start">

        {/* Left sidebar */}
        <div className="flex-shrink-0 space-y-4" style={{ width: '300px' }}>
          <SettingsPanel settings={orgSettings} onChange={setOrgSettings} />
          <Legend />
        </div>

        {/* Center — chart canvas */}
        <div className="flex-1 min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden"
          style={{ ...canvasStyle, position: 'relative', minWidth: '500px' }}>
          {view === 'tree' && (
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
        </div>

        {/* Right — detail panel */}
        <div className="flex-shrink-0" style={{ width: '300px', ...canvasStyle }}>
          <DetailPanel node={selectedNode} allPositions={positions} onClose={() => setSelectedNode(null)} />
        </div>
      </div>
    </div>
  );
}