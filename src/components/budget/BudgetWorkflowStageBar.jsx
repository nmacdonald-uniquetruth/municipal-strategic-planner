import React from 'react';
import { CheckCircle2, Clock, Circle } from 'lucide-react';

const STAGES = [
  { key: 'dept_head',        label: 'Dept. Head',      role: 'Department Head submits request' },
  { key: 'finance_director', label: 'Finance Dir.',    role: 'Finance Director reviews & adjusts' },
  { key: 'town_manager',     label: 'Town Manager',    role: 'Town Manager reviews & adjusts' },
  { key: 'budget_committee', label: 'Budget Committee',role: 'Committee reviews & adjusts' },
  { key: 'select_board',     label: 'Select Board',    role: 'Board makes final revisions' },
  { key: 'final',            label: 'Final / Print',   role: 'Ready for town vote' },
];

const STAGE_IDX = Object.fromEntries(STAGES.map((s, i) => [s.key, i]));

export default function BudgetWorkflowStageBar({ currentStage }) {
  const currentIdx = STAGE_IDX[currentStage] ?? 0;
  return (
    <div className="flex items-center gap-0 w-full overflow-x-auto pb-1">
      {STAGES.map((stage, idx) => {
        const done    = idx < currentIdx;
        const active  = idx === currentIdx;
        const pending = idx > currentIdx;
        return (
          <React.Fragment key={stage.key}>
            <div className={`flex flex-col items-center gap-1 min-w-[90px] ${pending ? 'opacity-40' : ''}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all ${
                done   ? 'bg-emerald-500 border-emerald-500 text-white' :
                active ? 'bg-slate-900 border-slate-900 text-white' :
                         'bg-white border-slate-300 text-slate-400'
              }`}>
                {done ? <CheckCircle2 className="h-4 w-4" /> :
                 active ? <Clock className="h-4 w-4" /> :
                          <Circle className="h-4 w-4" />}
              </div>
              <span className={`text-[9px] font-bold text-center leading-tight ${
                active ? 'text-slate-900' : done ? 'text-emerald-700' : 'text-slate-400'
              }`}>{stage.label}</span>
            </div>
            {idx < STAGES.length - 1 && (
              <div className={`h-0.5 flex-1 min-w-[16px] mx-1 ${done ? 'bg-emerald-400' : 'bg-slate-200'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}