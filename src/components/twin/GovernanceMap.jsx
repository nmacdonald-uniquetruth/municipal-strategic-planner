import React, { useState } from 'react';
import { TWIN_NODES, NODE_MAP, TYPE_CONFIG, BRANCH_COLORS } from './twinData';

// Recursive tree renderer
function TreeBranch({ nodeId, selectedId, onSelect, depth = 0 }) {
  const node = NODE_MAP[nodeId];
  if (!node) return null;

  const cfg = TYPE_CONFIG[node.type] || TYPE_CONFIG.department;
  const isSelected = selectedId === nodeId;
  const hasChildren = node.children?.length > 0;
  const [expanded, setExpanded] = useState(depth < 2); // auto-expand top 2 levels

  const hasInsight = ['finance_hr','ambulance','transfer_stn','wastewater','town_mgr'].includes(nodeId);

  return (
    <div className={`${depth > 0 ? 'relative' : ''}`}>
      {/* Connector */}
      {depth > 0 && (
        <div className="absolute left-3 -top-2 bottom-0 w-px border-l border-dashed border-slate-300" />
      )}

      <div className={`relative ${depth > 0 ? 'ml-7' : ''} mb-1.5`}>
        {depth > 0 && <div className="absolute -left-4 top-4 w-4 border-t border-dashed border-slate-300" />}

        <div
          onClick={() => { onSelect(isSelected ? null : nodeId); if (hasChildren) setExpanded(e => !e); }}
          className={`group flex items-center gap-2 rounded-xl px-3 py-2 cursor-pointer border transition-all duration-100 ${
            isSelected
              ? 'shadow-md ring-2 ring-offset-1'
              : 'hover:shadow-sm'
          }`}
          style={{
            background: cfg.bg,
            borderColor: isSelected ? cfg.ring : (depth === 0 ? '#000' : '#ddd0bc'),
            outline: isSelected ? `2px solid ${cfg.ring}` : undefined,
          }}
        >
          <span className="text-sm flex-shrink-0">{node.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-semibold truncate" style={{ color: cfg.text === '#fff' ? '#fff' : '#2F2F30' }}>
                {node.label}
              </p>
              {hasInsight && (
                <span className="flex-shrink-0 h-3.5 w-3.5 rounded-full bg-amber-400 text-[8px] font-bold text-white flex items-center justify-center">!</span>
              )}
            </div>
            {node.role && (
              <p className="text-[9px] truncate" style={{ color: cfg.text === '#fff' ? 'rgba(255,255,255,0.65)' : '#8a7e72' }}>
                {node.role}
              </p>
            )}
          </div>
          {node.fte > 0 && (
            <span className="text-[9px] font-mono flex-shrink-0" style={{ color: cfg.text === '#fff' ? 'rgba(255,255,255,0.5)' : '#aaa' }}>
              {node.fte}
            </span>
          )}
          {hasChildren && (
            <span className="text-[9px] flex-shrink-0" style={{ color: cfg.text === '#fff' ? 'rgba(255,255,255,0.4)' : '#bbb' }}>
              {expanded ? '▾' : '▸'}
            </span>
          )}
        </div>

        {/* Children */}
        {hasChildren && expanded && (
          <div className="relative mt-0.5">
            {node.children.map(childId => (
              <TreeBranch key={childId} nodeId={childId} selectedId={selectedId} onSelect={onSelect} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function GovernanceMap({ selectedId, onSelect, viewMode = 'both' }) {
  const showMunicipal = viewMode !== 'school';
  const showSchool    = viewMode !== 'municipal';

  return (
    <div className="flex flex-col lg:flex-row gap-4">
      {/* Municipal branch */}
      {showMunicipal && (
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3 px-1">
            <div className="h-3 w-3 rounded-full" style={{ background: BRANCH_COLORS.municipal }} />
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Municipal Government</p>
          </div>
          <div className="bg-slate-50/60 rounded-xl border border-slate-200 p-3">
            <TreeBranch nodeId="select_board" selectedId={selectedId} onSelect={onSelect} depth={0} />
          </div>
        </div>
      )}

      {/* School branch */}
      {showSchool && (
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3 px-1">
            <div className="h-3 w-3 rounded-full" style={{ background: BRANCH_COLORS.school }} />
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">School Governance (AOS 96)</p>
          </div>
          <div className="bg-purple-50/40 rounded-xl border border-purple-100 p-3">
            <TreeBranch nodeId="school_comm" selectedId={selectedId} onSelect={onSelect} depth={0} />
          </div>
        </div>
      )}
    </div>
  );
}