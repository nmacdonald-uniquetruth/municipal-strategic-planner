import React from 'react';
import { NODE_TYPE_CONFIG, RESTRUCTURING_STATUS_CONFIG } from './orgUtils';
import { ChevronDown, ChevronRight, Users, AlertTriangle, Plus, Pencil } from 'lucide-react';

export default function OrgNodeCard({ node, expanded, onToggle, onSelect, selected, depth = 0, showRestructuring }) {
  const cfg = NODE_TYPE_CONFIG[node.node_type] || NODE_TYPE_CONFIG.staff_role;
  const rCfg = RESTRUCTURING_STATUS_CONFIG[node.restructuring_status] || RESTRUCTURING_STATUS_CONFIG.unchanged;
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selected?.id === node.id || selected?._key === node._key;

  const restructuringBorder = showRestructuring && node.restructuring_status !== 'unchanged'
    ? node.restructuring_status === 'proposed_new'       ? 'ring-2 ring-emerald-400'
    : node.restructuring_status === 'proposed_change'    ? 'ring-2 ring-amber-400'
    : node.restructuring_status === 'proposed_eliminate' ? 'ring-2 ring-red-400 opacity-70'
    : 'ring-2 ring-blue-400'
    : '';

  return (
    <div
      className={`relative rounded-xl border cursor-pointer transition-all select-none
        ${isSelected ? 'shadow-lg scale-[1.01]' : 'hover:shadow-md hover:scale-[1.005]'}
        ${restructuringBorder}
      `}
      style={{
        backgroundColor: cfg.color,
        borderColor: cfg.border,
        color: cfg.textColor,
        minWidth: '160px',
        maxWidth: '220px',
      }}
      onClick={(e) => { e.stopPropagation(); onSelect(node); }}
    >
      {/* Top accent bar for restructuring */}
      {showRestructuring && node.restructuring_status !== 'unchanged' && (
        <div className={`h-1 rounded-t-xl ${rCfg.dot}`} />
      )}

      <div className="px-3 py-2.5">
        {/* Type badge */}
        <div className="flex items-center justify-between gap-1 mb-1">
          <span
            className="text-[9px] font-bold uppercase tracking-wider opacity-60 truncate"
          >
            {node.is_advisory ? '◆ Advisory' : cfg.label}
          </span>
          {hasChildren && (
            <button
              onClick={(e) => { e.stopPropagation(); onToggle(node); }}
              className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
            >
              {expanded
                ? <ChevronDown className="h-3 w-3" />
                : <ChevronRight className="h-3 w-3" />}
            </button>
          )}
        </div>

        {/* Name */}
        <p className="text-xs font-bold leading-tight">{node.name}</p>

        {/* Staff name */}
        {node.staff_name && (
          <p className="text-[10px] mt-1 opacity-75 truncate">{node.staff_name}</p>
        )}

        {/* Staff count */}
        {node.staff_count > 1 && (
          <div className="flex items-center gap-1 mt-1 opacity-60">
            <Users className="h-2.5 w-2.5" />
            <span className="text-[9px]">{node.staff_count}</span>
          </div>
        )}

        {/* Restructuring badge */}
        {showRestructuring && node.restructuring_status !== 'unchanged' && (
          <span className={`inline-block mt-1.5 text-[8px] font-bold px-1.5 py-0.5 rounded-full ${rCfg.color}`}>
            {rCfg.label}
          </span>
        )}
      </div>
    </div>
  );
}