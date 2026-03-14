import React, { useState } from 'react';
import { STRATEGIC_INSIGHTS, SEVERITY_CONFIG, NODE_MAP } from './twinData';
import { Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';

export default function InsightsLayer({ onSelectNode }) {
  const [open, setOpen] = useState(null);

  const grouped = {
    critical:    STRATEGIC_INSIGHTS.filter(i => i.severity === 'critical'),
    high:        STRATEGIC_INSIGHTS.filter(i => i.severity === 'high'),
    medium:      STRATEGIC_INSIGHTS.filter(i => i.severity === 'medium'),
    opportunity: STRATEGIC_INSIGHTS.filter(i => i.severity === 'opportunity'),
  };

  return (
    <div className="space-y-3">
      {Object.entries(grouped).filter(([, items]) => items.length).map(([severity, items]) => {
        const sc = SEVERITY_CONFIG[severity];
        return (
          <div key={severity}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">{sc.label} ({items.length})</p>
            <div className="space-y-2">
              {items.map(ins => {
                const node = NODE_MAP[ins.dept];
                const isOpen = open === ins.id;
                return (
                  <div key={ins.id} className={`rounded-xl border ${sc.color} overflow-hidden`}>
                    <button className="w-full text-left p-3 flex items-start gap-2.5" onClick={() => setOpen(isOpen ? null : ins.id)}>
                      <div className={`h-2 w-2 rounded-full mt-1 flex-shrink-0 ${sc.dot}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold">{ins.label}</p>
                        {node && (
                          <p className="text-[10px] opacity-70 mt-0.5">{node.icon} {node.label}</p>
                        )}
                      </div>
                      {isOpen ? <ChevronUp className="h-3 w-3 flex-shrink-0 mt-0.5" /> : <ChevronDown className="h-3 w-3 flex-shrink-0 mt-0.5" />}
                    </button>
                    {isOpen && (
                      <div className="px-3 pb-3 border-t border-current border-opacity-20">
                        <p className="text-xs leading-relaxed mt-2">{ins.body}</p>
                        {node && (
                          <button onClick={() => onSelectNode(ins.dept)}
                            className="mt-2 text-[10px] font-bold underline opacity-70 hover:opacity-100">
                            View {node.label} in tree →
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}