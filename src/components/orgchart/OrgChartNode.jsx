import React, { useState } from 'react';
import { ChevronDown, ChevronRight, User, AlertCircle, Briefcase, Clock, Users } from 'lucide-react';
import { DEPT_COLORS, FUND_LABELS } from './OrgData';

const STATUS_STYLES = {
  filled:     { bg: 'bg-white', border: 'border-slate-200', badge: 'bg-emerald-100 text-emerald-800', dot: 'bg-emerald-500' },
  vacant:     { bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-800', dot: 'bg-amber-400' },
  proposed:   { bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-800', dot: 'bg-blue-500' },
  eliminated: { bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-100 text-red-800', dot: 'bg-red-500' },
  frozen:     { bg: 'bg-slate-50', border: 'border-slate-300', badge: 'bg-slate-200 text-slate-700', dot: 'bg-slate-400' },
};

const TYPE_ICONS = {
  full_time: <Briefcase className="h-2.5 w-2.5" />,
  part_time: <Clock className="h-2.5 w-2.5" />,
  stipend: <Clock className="h-2.5 w-2.5" />,
  elected: <Users className="h-2.5 w-2.5" />,
  appointed: <Users className="h-2.5 w-2.5" />,
  contracted: <Briefcase className="h-2.5 w-2.5" />,
  volunteer: <User className="h-2.5 w-2.5" />,
};

function OrgNodeCard({ node, depth, onSelect, selectedId }) {
  const style = STATUS_STYLES[node.status] || STATUS_STYLES.filled;
  const deptColor = DEPT_COLORS[node.department] || '#344A60';
  const isSelected = selectedId === node.position_id;

  return (
    <div
      onClick={(e) => { e.stopPropagation(); onSelect(node); }}
      className={`
        relative rounded-xl border-2 cursor-pointer transition-all duration-150 select-none
        ${style.bg} ${isSelected ? 'border-blue-500 shadow-lg shadow-blue-100 ring-2 ring-blue-300' : style.border + ' hover:shadow-md'}
        min-w-[160px] max-w-[200px]
      `}
      style={{ borderLeftColor: deptColor, borderLeftWidth: 4 }}
    >
      {/* Status dot */}
      <div className="absolute -top-1.5 -right-1.5">
        <span className={`inline-block h-3 w-3 rounded-full border-2 border-white ${style.dot}`} />
      </div>

      <div className="px-3 py-2.5 space-y-1">
        {/* Title */}
        <p className="text-[11px] font-bold text-slate-900 leading-tight">{node.title}</p>
        {node.subtitle && <p className="text-[10px] text-slate-500 leading-tight">{node.subtitle}</p>}

        {/* Employee name */}
        <div className="flex items-center gap-1 mt-1">
          {node.employee
            ? <p className="text-[11px] text-slate-700 font-medium truncate">{node.employee.full_name}</p>
            : <p className="text-[10px] italic text-amber-600">— Vacant —</p>
          }
        </div>

        {/* Badges row */}
        <div className="flex items-center gap-1 flex-wrap mt-1">
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${style.badge}`}>
            {node.status.charAt(0).toUpperCase() + node.status.slice(1)}
          </span>
          {node.employment_type && node.employment_type !== 'full_time' && (
            <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 flex items-center gap-0.5">
              {TYPE_ICONS[node.employment_type]}
              {node.employment_type.replace('_', ' ')}
            </span>
          )}
          {node.is_union && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700">Union</span>
          )}
          {node.fund_source && (
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-200">{FUND_LABELS[node.fund_source] || node.fund_source}</span>
          )}
        </div>

        {/* Salary */}
        {node.base_salary > 0 && (
          <p className="text-[10px] font-mono text-slate-500">${node.base_salary.toLocaleString()}</p>
        )}
      </div>
    </div>
  );
}

export default function OrgChartNode({ node, depth = 0, onSelect, selectedId, defaultCollapsed = false }) {
  const [collapsed, setCollapsed] = useState(depth >= 4 ? true : defaultCollapsed);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="flex flex-col items-center">
      <div className="relative flex flex-col items-center">
        {/* Collapse toggle */}
        {hasChildren && (
          <button
            onClick={(e) => { e.stopPropagation(); setCollapsed(!collapsed); }}
            className="absolute -bottom-3 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-white shadow-md hover:bg-slate-600 transition-colors"
          >
            {collapsed
              ? <ChevronRight className="h-3 w-3" />
              : <ChevronDown className="h-3 w-3" />
            }
          </button>
        )}
        <OrgNodeCard node={node} depth={depth} onSelect={onSelect} selectedId={selectedId} />
      </div>

      {/* Children */}
      {hasChildren && !collapsed && (
        <div className="relative mt-6 flex items-start justify-center gap-4">
          {/* Horizontal connector line */}
          {node.children.length > 1 && (
            <div
              className="absolute top-0 border-t-2 border-slate-200"
              style={{
                left: `calc(50% - ${(node.children.length - 1) * 104}px)`,
                width: `${(node.children.length - 1) * 208}px`,
              }}
            />
          )}
          {node.children.map((child) => (
            <div key={child.position_id} className="relative flex flex-col items-center">
              {/* Vertical connector */}
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 h-6 w-0.5 bg-slate-200" />
              <OrgChartNode
                node={child}
                depth={depth + 1}
                onSelect={onSelect}
                selectedId={selectedId}
                defaultCollapsed={depth >= 3}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}