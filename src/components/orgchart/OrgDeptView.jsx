import React, { useState } from 'react';
import { ChevronDown, ChevronRight, User } from 'lucide-react';
import { DEPT_COLORS, FUND_LABELS } from './OrgData';

const STATUS_DOT = {
  filled: 'bg-emerald-500',
  vacant: 'bg-amber-400',
  proposed: 'bg-blue-500',
  eliminated: 'bg-red-500',
  frozen: 'bg-slate-400',
};

function PositionRow({ position, onSelect, selectedId }) {
  return (
    <div
      onClick={() => onSelect(position)}
      className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 ${
        selectedId === position.position_id ? 'bg-blue-50' : ''
      }`}
    >
      <span className={`h-2 w-2 rounded-full flex-shrink-0 ${STATUS_DOT[position.status] || 'bg-slate-400'}`} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-slate-800 truncate">{position.title}</p>
        {position.subtitle && <p className="text-[10px] text-slate-400 truncate">{position.subtitle}</p>}
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {position.employee
          ? <p className="text-[11px] text-slate-600 truncate max-w-24">{position.employee.full_name}</p>
          : <p className="text-[10px] italic text-amber-500">Vacant</p>
        }
        {position.base_salary > 0 && (
          <span className="text-[10px] font-mono text-slate-400">${Math.round(position.base_salary / 1000)}K</span>
        )}
        {position.fund_source && (
          <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-slate-100 text-slate-500">{FUND_LABELS[position.fund_source] || position.fund_source}</span>
        )}
        {position.is_union && (
          <span className="text-[9px] px-1 py-0.5 rounded bg-purple-100 text-purple-700 font-bold">U</span>
        )}
      </div>
    </div>
  );
}

function DeptCard({ deptName, positions, onSelect, selectedId }) {
  const [open, setOpen] = useState(true);
  const color = DEPT_COLORS[deptName] || '#344A60';
  const filled = positions.filter(p => p.status === 'filled').length;
  const vacant = positions.filter(p => p.status === 'vacant').length;

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-white"
        style={{ background: color }}
      >
        <div className="flex items-center gap-2.5">
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          <span className="text-sm font-bold">{deptName}</span>
        </div>
        <div className="flex items-center gap-2 text-[10px]">
          <span className="bg-white/20 px-2 py-0.5 rounded-full">{positions.length} positions</span>
          {vacant > 0 && <span className="bg-amber-400/80 text-amber-900 px-2 py-0.5 rounded-full font-bold">{vacant} vacant</span>}
          {filled > 0 && <span className="bg-emerald-400/80 text-emerald-900 px-2 py-0.5 rounded-full">{filled} filled</span>}
        </div>
      </button>
      {open && (
        <div className="bg-white divide-y divide-slate-50">
          {positions.map(pos => (
            <PositionRow key={pos.position_id} position={pos} onSelect={onSelect} selectedId={selectedId} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function OrgDeptView({ positions, onSelect, selectedId }) {
  // Group by department
  const byDept = {};
  positions.filter(p => !p._hidden).forEach(p => {
    const d = p.department || 'Other';
    if (!byDept[d]) byDept[d] = [];
    byDept[d].push(p);
  });

  // Sort departments
  const deptOrder = ['Governance', 'Select Board', 'Town Manager', 'Finance & Administration', "Clerk's Office", 'Police Department', 'Public Works', 'Fire Department', 'Ambulance Service', 'Wastewater', 'Assessing', 'Code Enforcement', 'School Governance', 'School Administration'];
  const sortedDepts = Object.keys(byDept).sort((a, b) => {
    const ai = deptOrder.indexOf(a);
    const bi = deptOrder.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  return (
    <div className="space-y-3">
      {sortedDepts.map(dept => (
        <DeptCard
          key={dept}
          deptName={dept}
          positions={byDept[dept].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))}
          onSelect={onSelect}
          selectedId={selectedId}
        />
      ))}
    </div>
  );
}