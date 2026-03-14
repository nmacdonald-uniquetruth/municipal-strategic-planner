import React from 'react';
import { NODE_MAP, TYPE_CONFIG, STRATEGIC_INSIGHTS, SEVERITY_CONFIG, BRANCH_COLORS } from './twinData';
import { X, DollarSign, Users, AlertTriangle, TrendingUp, Building2 } from 'lucide-react';

const fmt = n => n ? `$${Math.round(n).toLocaleString()}` : '—';

export default function NodeDetailPanel({ nodeId, onClose }) {
  const node = NODE_MAP[nodeId];
  if (!node) return null;

  const cfg = TYPE_CONFIG[node.type] || TYPE_CONFIG.department;
  const insights = STRATEGIC_INSIGHTS.filter(i => i.dept === nodeId);
  const scoreColor = node.efficiencyScore
    ? node.efficiencyScore >= 80 ? '#2A7F7F' : node.efficiencyScore >= 60 ? '#F6C85F' : '#e05c3a'
    : null;

  // Parent
  const parent = Object.values(NODE_MAP).find(n => n.children?.includes(nodeId));
  // Children nodes
  const childNodes = (node.children || []).map(id => NODE_MAP[id]).filter(Boolean);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden">
      {/* Header */}
      <div className="p-5 text-white" style={{ background: cfg.bg === '#ffffff' ? '#344A60' : cfg.bg }}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="text-3xl">{node.icon}</span>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">{cfg.label}</span>
                {node.branch && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                    style={{ background: BRANCH_COLORS[node.branch] + '55' }}>
                    {node.branch}
                  </span>
                )}
              </div>
              <h2 className="text-lg font-bold leading-tight">{node.label}</h2>
              {node.role && <p className="text-sm opacity-75 mt-0.5">{node.role}</p>}
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/20 transition-colors flex-shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          {node.fte > 0 && (
            <div className="text-center">
              <p className="text-xl font-bold">{node.fte}</p>
              <p className="text-[10px] opacity-60">FTE</p>
            </div>
          )}
          {node.budget > 0 && (
            <div className="text-center">
              <p className="text-xl font-bold">{fmt(node.budget)}</p>
              <p className="text-[10px] opacity-60">Annual Budget</p>
            </div>
          )}
          {node.efficiencyScore != null && (
            <div className="text-center">
              <p className="text-xl font-bold" style={{ color: scoreColor || '#fff' }}>{node.efficiencyScore}</p>
              <p className="text-[10px] opacity-60">Efficiency Score</p>
            </div>
          )}
        </div>
      </div>

      <div className="p-5 space-y-4 overflow-y-auto max-h-[60vh]">
        {/* Description */}
        <div>
          <p className="text-xs font-semibold text-slate-600 mb-1">Overview</p>
          <p className="text-xs text-slate-600 leading-relaxed">{node.description}</p>
        </div>

        {/* Reporting relationship */}
        {parent && (
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-1">Reports To</p>
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <span className="text-base">{parent.icon}</span>
              <span className="text-xs font-medium text-slate-800">{parent.label}</span>
              {parent.role && <span className="text-[10px] text-slate-500">— {parent.role}</span>}
            </div>
          </div>
        )}

        {/* Staff */}
        {node.staff?.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-1">Staff / Members</p>
            <div className="space-y-1">
              {node.staff.map((s, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-slate-700">
                  <div className="h-1.5 w-1.5 rounded-full bg-slate-300 flex-shrink-0" />
                  {s}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Direct reports (children departments) */}
        {childNodes.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-1">Direct Reports / Units ({childNodes.length})</p>
            <div className="grid grid-cols-2 gap-1.5">
              {childNodes.map(c => (
                <div key={c.id} className="flex items-center gap-1.5 rounded-lg border border-slate-100 bg-slate-50 px-2 py-1.5 text-xs">
                  <span>{c.icon}</span>
                  <span className="text-slate-700 truncate">{c.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Insights */}
        {insights.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-2">Strategic Insights</p>
            <div className="space-y-2">
              {insights.map(ins => {
                const sc = SEVERITY_CONFIG[ins.severity];
                return (
                  <div key={ins.id} className={`rounded-xl border p-3 ${sc.color}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`h-2 w-2 rounded-full ${sc.dot}`} />
                      <p className="text-xs font-bold">{ins.label}</p>
                      <span className="text-[9px] uppercase tracking-wider opacity-60 ml-auto">{sc.label}</span>
                    </div>
                    <p className="text-xs leading-relaxed opacity-90">{ins.body}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Budget breakdown if available */}
        {node.budget > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-2">Budget Context</p>
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs">
              <div className="flex justify-between mb-1">
                <span className="text-slate-500">Annual Budget</span>
                <span className="font-bold text-slate-800">{fmt(node.budget)}</span>
              </div>
              {node.fte > 0 && (
                <div className="flex justify-between mb-1">
                  <span className="text-slate-500">Cost per FTE</span>
                  <span className="font-bold text-slate-800">{fmt(node.budget / node.fte)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Cost per Resident</span>
                <span className="font-bold text-slate-800">${(node.budget / 2100).toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Restructuring status badge */}
        {node.restructuringStatus && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
            <p className="text-xs font-bold text-amber-800 mb-0.5">Restructuring Status</p>
            <p className="text-xs text-amber-700 capitalize">{node.restructuringStatus.replace('_', ' ')}</p>
          </div>
        )}
      </div>
    </div>
  );
}