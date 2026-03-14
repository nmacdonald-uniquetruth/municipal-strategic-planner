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
  const sel = (key, options) => (
    <div key={key} className="space-y-1">
      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
        {key.replace(/_/g, ' ')}
      </label>
      <select
        value={settings[key]}
        onChange={e => onChange({ ...settings, [key]: e.target.value })}
        className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400"
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  const tog = (key, label) => (
    <label key={key} className="flex items-center gap-2 cursor-pointer">
      <input type="checkbox" checked={settings[key]}
        onChange={e => onChange({ ...settings, [key]: e.target.checked })}
        className="rounded" />
      <span className="text-xs text-slate-700">{label}</span>
    </label>
  );

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="bg-slate-900 px-4 py-3 flex items-center gap-2">
        <Settings2 className="h-4 w-4 text-slate-300" />
        <span className="text-sm font-bold text-white">Chart Settings</span>
      </div>
      <div className="p-4 space-y-4">
        {sel('FINANCE_DEPARTMENT_STRUCTURE', FINANCE_STRUCTURES)}
        {sel('UTILITY_BILLING_STRUCTURE', BILLING_STRUCTURES)}
        {sel('GA_REPORTING_STRUCTURE', GA_STRUCTURES)}
        <div className="space-y-2 border-t border-slate-100 pt-3">
          {tog('SHOW_VACANT_POSITIONS', 'Show Vacant Positions')}
          {tog('SHOW_PART_TIME_POSITIONS', 'Show Part-Time Positions')}
        </div>
      </div>
    </div>
  );
}

// ─── Node detail panel ────────────────────────────────────────────────────────
function DetailPanel({ node, allPositions, onClose }) {
  if (!node) return null;
  const color = DEPT_COLORS[node.dept] || '#344A60';
  const supervisor = allPositions.find(p => p.id === node.reportsTo);
  const reports = allPositions.filter(p => p.reportsTo === node.id);

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="px-4 py-4 text-white relative" style={{ background: color }}>
        <button onClick={onClose}
          className="absolute top-3 right-3 text-white/70 hover:text-white text-lg leading-none">×</button>
        <p className="text-sm font-bold pr-6">{node.title}</p>
        <p className="text-[11px] opacity-80 mt-0.5">{node.dept}</p>
        <div className="mt-2 flex gap-1.5 flex-wrap">
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${node.status === 'filled' ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-200 text-amber-900'}`}>
            {node.status}
          </span>
          {!node.fullTime && <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20">Part-Time</span>}
          {node.isUnion && <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-200 text-purple-900 font-bold">Union</span>}
          {node.contracted && <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20">Contracted</span>}
        </div>
      </div>

      <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Employee</p>
        {node.employee
          ? <p className="text-sm font-semibold text-slate-900">{node.employee}</p>
          : <p className="text-sm italic text-amber-600">Position Vacant</p>}
      </div>

      <div className="px-4 py-3 space-y-2 text-xs">
        {supervisor && (
          <div className="flex justify-between">
            <span className="text-slate-500">Reports To</span>
            <span className="font-medium text-slate-800 text-right max-w-40">{supervisor.title}</span>
          </div>
        )}
        {reports.length > 0 && (
          <div>
            <p className="text-slate-500 mb-1">Direct Reports ({reports.length})</p>
            <div className="space-y-1">
              {reports.map(r => (
                <div key={r.id} className="flex items-center gap-2">
                  <span className={`h-1.5 w-1.5 rounded-full ${r.status === 'filled' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                  <span className="text-slate-700">{r.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}
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
                    className={`flex items-center gap-3 px-4 py-2 border-b border-slate-50 last:border-0 cursor-pointer hover:bg-slate-50 ${selectedId === p.id ? 'bg-blue-50' : ''}`}>
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

// ─── Stats bar ────────────────────────────────────────────────────────────────
function StatsBar({ positions }) {
  const filled = positions.filter(p => p.status === 'filled').length;
  const vacant = positions.filter(p => p.status === 'vacant').length;
  return (
    <div className="flex gap-2">
      {[
        { label: 'Positions', value: positions.length, cls: 'text-slate-900' },
        { label: 'Filled',    value: filled,            cls: 'text-emerald-700' },
        { label: 'Vacant',    value: vacant,            cls: 'text-amber-600' },
      ].map(s => (
        <div key={s.label} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center min-w-14">
          <p className={`text-base font-bold ${s.cls}`}>{s.value}</p>
          <p className="text-[10px] text-slate-500">{s.label}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Legend ───────────────────────────────────────────────────────────────────
function Legend() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Legend</p>
      <div className="space-y-1.5">
        {[
          { color: '#22c55e', label: 'Filled position' },
          { color: '#f59e0b', label: 'Vacant position' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-2 text-[11px] text-slate-600">
            <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
            {label}
          </div>
        ))}
      </div>
      <p className="text-[10px] text-slate-400 mt-3">Drag to pan · scroll to zoom · click +/− to collapse</p>
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

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 96px)', minHeight: '600px' }}>
      {/* Header */}
      <div className="flex-shrink-0 pb-3 space-y-3">
        <SectionHeader
          title="Municipal Organizational Chart"
          subtitle="Settings-driven — changes below update the chart instantly"
          icon={Network}
        />
        <div className="flex items-center gap-3 flex-wrap">
          <StatsBar positions={positions} />
          <div className="flex rounded-lg border border-slate-200 bg-white p-1 gap-1">
            {[{ id: 'tree', label: '⬛ Tree' }, { id: 'dept', label: '☰ Departments' }].map(v => (
              <button key={v.id} onClick={() => setView(v.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${view === v.id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
                {v.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex gap-3 min-h-0" style={{ flex: 1 }}>
        {/* Left sidebar — settings */}
        <div className="w-64 flex-shrink-0 overflow-y-auto space-y-3">
          <SettingsPanel settings={orgSettings} onChange={setOrgSettings} />
          <Legend />
        </div>

        {/* Center — chart */}
        <div className="flex-1 min-w-0 rounded-xl border border-slate-200 bg-white"
          style={{ position: 'relative', minHeight: '500px' }}>
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

        {/* Right — detail */}
        <div className="w-64 flex-shrink-0 overflow-y-auto">
          {selectedNode ? (
            <DetailPanel node={selectedNode} allPositions={positions} onClose={() => setSelectedNode(null)} />
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white p-5 text-center">
              <Network className="h-8 w-8 mx-auto mb-2 text-slate-200" />
              <p className="text-xs font-medium text-slate-500">Click any node for details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}