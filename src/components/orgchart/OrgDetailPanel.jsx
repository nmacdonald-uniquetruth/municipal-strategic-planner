import React from 'react';
import { Network, ChevronRight } from 'lucide-react';
import { DEPT_COLORS } from './OrgChartData';

export default function OrgDetailPanel({ node, allPositions, onClose }) {
  if (!node) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
          <Network className="h-6 w-6 text-slate-300" />
        </div>
        <p className="text-sm font-semibold text-slate-500">Select a position</p>
        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
          Click any node to view details
        </p>
      </div>
    );
  }

  const isStructural = node.nodeType === 'structural';
  const color = DEPT_COLORS[node.dept] || DEPT_COLORS.Governance;
  const supervisor = allPositions.find(p => p.id === node.reportsTo);
  const reports = allPositions.filter(p => p.reportsTo === node.id);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 text-white flex-shrink-0" style={{ background: color }}>
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

      {/* Content */}
      <div className="px-5 py-4 space-y-3 text-xs flex-1 overflow-y-auto">
        {isStructural && (
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Type</p>
            <p className="text-slate-700">Governance / Structural Body</p>
          </div>
        )}

        {!isStructural && (
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Employee</p>
            {node.employee ? (
              <p className="font-medium text-slate-800">{node.employee}</p>
            ) : (
              <p className="italic text-amber-600">Position Vacant</p>
            )}
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