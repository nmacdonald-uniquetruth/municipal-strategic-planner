import React from 'react';
import { CheckCircle2, Clock, AlertCircle, Pause, XCircle } from 'lucide-react';

const PHASE_ORDER = { immediate: 0, short_term: 1, medium_term: 2, long_term: 3 };
const PHASE_LABELS = { immediate: 'Immediate', short_term: 'Short Term', medium_term: 'Medium Term', long_term: 'Long Term' };

export default function RoadmapTimeline({ roadmap, filters }) {
  if (!roadmap || !roadmap.action_items) {
    return <div className="text-center py-8 text-slate-500 text-xs">No action items</div>;
  }

  let items = roadmap.action_items;

  // Apply filters
  if (filters?.phase) items = items.filter((item) => item.phase === filters.phase);
  if (filters?.owner) items = items.filter((item) => item.owner === filters.owner);
  if (filters?.status) items = items.filter((item) => item.status === filters.status);

  const groupedByPhase = {};
  items.forEach((item) => {
    if (!groupedByPhase[item.phase]) groupedByPhase[item.phase] = [];
    groupedByPhase[item.phase].push(item);
  });

  const phases = Object.keys(groupedByPhase).sort((a, b) => PHASE_ORDER[a] - PHASE_ORDER[b]);

  const getStatusIcon = (status) => {
    const icons = {
      completed: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
      in_progress: <Clock className="h-4 w-4 text-blue-600" />,
      not_started: <Circle className="h-4 w-4 text-slate-400" />,
      blocked: <XCircle className="h-4 w-4 text-red-600" />,
      deferred: <Pause className="h-4 w-4 text-amber-600" />,
    };
    return icons[status] || icons.not_started;
  };

  const getStatusBg = (status) => {
    const bgs = {
      completed: 'bg-emerald-50',
      in_progress: 'bg-blue-50',
      not_started: 'bg-white',
      blocked: 'bg-red-50',
      deferred: 'bg-amber-50',
    };
    return bgs[status] || 'bg-white';
  };

  return (
    <div className="space-y-6">
      {phases.length === 0 ? (
        <div className="text-center py-8 text-slate-500 text-xs">No action items match filters</div>
      ) : (
        phases.map((phase) => (
          <div key={phase}>
            <div className="flex items-center gap-3 mb-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase">{PHASE_LABELS[phase]}</h3>
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">
                {groupedByPhase[phase].length} items
              </span>
            </div>

            <div className="space-y-2 ml-4 border-l-2 border-slate-200 pl-4">
              {groupedByPhase[phase].map((item) => (
                <div
                  key={item.id}
                  className={`rounded-lg border border-slate-200 p-3 ${getStatusBg(item.status)} hover:shadow-sm transition-shadow`}
                >
                  <div className="flex items-start gap-3">
                    <div className="pt-0.5">{getStatusIcon(item.status)}</div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                          {item.description && (
                            <p className="text-[10px] text-slate-600 mt-1">{item.description}</p>
                          )}
                        </div>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap ${
                          item.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-700'
                            : item.status === 'in_progress'
                            ? 'bg-blue-100 text-blue-700'
                            : item.status === 'blocked'
                            ? 'bg-red-100 text-red-700'
                            : item.status === 'deferred'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {item.status}
                        </span>
                      </div>

                      <div className="flex items-center flex-wrap gap-2 mt-2 text-[10px]">
                        <span className="font-semibold text-slate-700">Owner: {item.owner}</span>

                        {item.start_date && (
                          <span className="text-slate-600">
                            {new Date(item.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            {item.end_date && ` – ${new Date(item.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                          </span>
                        )}

                        {item.cost_estimate > 0 && (
                          <span className="font-semibold text-slate-700">Cost: ${item.cost_estimate.toLocaleString()}</span>
                        )}

                        {item.policy_action_needed && (
                          <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded">Board Action</span>
                        )}

                        {item.communication_need && (
                          <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Communication</span>
                        )}
                      </div>

                      {item.notes && <p className="text-[10px] text-slate-500 mt-2 italic">{item.notes}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function Circle({ className }) {
  return <svg className={className} fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" /></svg>;
}