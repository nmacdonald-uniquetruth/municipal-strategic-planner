import React from 'react';
import { useModel } from './ModelContext';
import { Clock } from 'lucide-react';

export default function PlanningHorizonToggle() {
  const { planningHorizon, setPlanningHorizon } = useModel();

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">Planning Horizon</label>
      <div className="flex gap-2">
        <button
          onClick={() => setPlanningHorizon(5)}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-semibold text-sm transition-all ${
            planningHorizon === 5
              ? 'bg-slate-900 text-white shadow-sm'
              : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300'
          }`}
        >
          <Clock className="h-4 w-4" />
          5 Years
        </button>
        <button
          onClick={() => setPlanningHorizon(10)}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-semibold text-sm transition-all ${
            planningHorizon === 10
              ? 'bg-slate-900 text-white shadow-sm'
              : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300'
          }`}
        >
          <Clock className="h-4 w-4" />
          10 Years
        </button>
      </div>
      <p className="text-[10px] text-slate-500 mt-2">
        {planningHorizon === 5
          ? 'Near-term: Focus on immediate restructuring and phase 1-2 initiatives'
          : 'Long-term: Includes advanced regionalization and multi-phase expansion'}
      </p>
    </div>
  );
}