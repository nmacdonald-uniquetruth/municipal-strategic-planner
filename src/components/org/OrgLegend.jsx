import React from 'react';
import { NODE_TYPE_CONFIG, RESTRUCTURING_STATUS_CONFIG } from './orgUtils';

export default function OrgLegend({ showRestructuring }) {
  return (
    <div className="flex flex-wrap gap-4 text-[10px]">
      <div>
        <p className="font-bold text-slate-500 uppercase tracking-wider mb-1.5">Node Types</p>
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(NODE_TYPE_CONFIG).filter(([k]) => k !== 'root').map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-1">
              <div className="h-3 w-3 rounded" style={{ backgroundColor: cfg.color, border: `1px solid ${cfg.border}` }} />
              <span className="text-slate-600">{cfg.label}</span>
            </div>
          ))}
        </div>
      </div>
      {showRestructuring && (
        <div>
          <p className="font-bold text-slate-500 uppercase tracking-wider mb-1.5">Restructuring Status</p>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(RESTRUCTURING_STATUS_CONFIG).filter(([k]) => k !== 'unchanged').map(([key, cfg]) => (
              <div key={key} className="flex items-center gap-1">
                <div className={`h-3 w-3 rounded-full ${cfg.dot}`} />
                <span className="text-slate-600">{cfg.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div>
        <p className="font-bold text-slate-500 uppercase tracking-wider mb-1.5">Connections</p>
        <div className="flex gap-3">
          <div className="flex items-center gap-1">
            <div className="h-px w-6 bg-slate-400" />
            <span className="text-slate-600">Reports to</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-px w-6 border-t border-dashed border-slate-400" />
            <span className="text-slate-600">Advisory</span>
          </div>
        </div>
      </div>
    </div>
  );
}