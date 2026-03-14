import React from 'react';
import { TYPE_CONFIG, SEVERITY_CONFIG, STRATEGIC_INSIGHTS } from './twinData';
import { ChevronDown, ChevronRight, DollarSign, Users, AlertTriangle, TrendingUp } from 'lucide-react';

const fmt = n => n ? `$${Math.round(n).toLocaleString()}` : null;

export default function TwinNodeCard({ node, isSelected, onSelect, depth = 0, children }) {
  const cfg = TYPE_CONFIG[node.type] || TYPE_CONFIG.department;
  const insights = STRATEGIC_INSIGHTS.filter(i => i.dept === node.id);
  const hasChildren = children && React.Children.count(children) > 0;

  const scoreColor = node.efficiencyScore
    ? node.efficiencyScore >= 80 ? '#2A7F7F' : node.efficiencyScore >= 60 ? '#F6C85F' : '#e05c3a'
    : null;

  return (
    <div className={`relative ${depth > 0 ? 'ml-4 md:ml-6' : ''}`}>
      {/* Connector line */}
      {depth > 0 && (
        <div className="absolute left-0 top-0 bottom-0 w-px bg-slate-200" style={{ left: '-12px' }} />
      )}

      <div
        onClick={() => onSelect(isSelected ? null : node.id)}
        className={`relative cursor-pointer rounded-xl border transition-all duration-150 mb-2 ${
          isSelected
            ? 'shadow-lg ring-2 scale-[1.01]'
            : 'hover:shadow-md hover:scale-[1.005]'
        }`}
        style={{
          borderColor: isSelected ? cfg.ring : (node.branch === 'school' ? '#c4b5e8' : '#e2d6c4'),
          background: cfg.bg,
          ringColor: cfg.ring,
          ...(isSelected ? { outline: `2px solid ${cfg.ring}` } : {}),
        }}
      >
        <div className="p-3">
          <div className="flex items-start gap-2.5">
            <span className="text-lg flex-shrink-0 leading-none mt-0.5">{node.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold leading-tight truncate" style={{ color: cfg.text === '#fff' ? '#fff' : '#2F2F30' }}>
                  {node.label}
                </p>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {insights.length > 0 && (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[9px] font-bold text-white">!</span>
                  )}
                  {node.efficiencyScore != null && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: scoreColor + '22', color: scoreColor }}>
                      {node.efficiencyScore}
                    </span>
                  )}
                  {hasChildren
                    ? <ChevronDown className="h-3 w-3 flex-shrink-0" style={{ color: cfg.text === '#fff' ? '#ccc' : '#888' }} />
                    : null
                  }
                </div>
              </div>

              {node.role && (
                <p className="text-[10px] mt-0.5 truncate" style={{ color: cfg.text === '#fff' ? 'rgba(255,255,255,0.7)' : '#6B6153' }}>
                  {node.role}
                </p>
              )}

              {/* Inline stats for departments */}
              {(node.budget || node.fte) && (
                <div className="flex gap-3 mt-1">
                  {node.budget > 0 && (
                    <span className="flex items-center gap-0.5 text-[9px]" style={{ color: cfg.text === '#fff' ? 'rgba(255,255,255,0.6)' : '#888' }}>
                      <DollarSign className="h-2.5 w-2.5" />{fmt(node.budget)}
                    </span>
                  )}
                  {node.fte > 0 && (
                    <span className="flex items-center gap-0.5 text-[9px]" style={{ color: cfg.text === '#fff' ? 'rgba(255,255,255,0.6)' : '#888' }}>
                      <Users className="h-2.5 w-2.5" />{node.fte} FTE
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Insight badges */}
          {insights.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {insights.map(ins => {
                const sc = SEVERITY_CONFIG[ins.severity];
                return (
                  <span key={ins.id} className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${sc.color}`}>
                    {ins.label}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Children */}
      {hasChildren && (
        <div className="pl-3 border-l border-slate-200 ml-4 space-y-0">
          {children}
        </div>
      )}
    </div>
  );
}