/**
 * COAValidationPanel — display crosswalk validation results
 */
import React from 'react';
import { XCircle, AlertTriangle, Info, CheckCircle } from 'lucide-react';

export default function COAValidationPanel({ validation }) {
  const { errors = [], warnings = [], info = [] } = validation;
  const total = errors.length + warnings.length;

  if (total === 0) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 flex items-center gap-2">
        <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0" />
        <p className="text-xs font-semibold text-emerald-800">All accounts validated — crosswalk is clean.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {errors.map((e, i) => (
        <div key={i} className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 flex items-start gap-2">
          <XCircle className="h-3.5 w-3.5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[11px] font-semibold text-red-800">{e.msg}</p>
            {e.trio && <p className="text-[9px] text-red-500 mt-0.5">TRIO: {e.trio}</p>}
            {e.field && <p className="text-[9px] text-red-400">Field: {e.field}</p>}
          </div>
        </div>
      ))}
      {warnings.map((w, i) => (
        <div key={i} className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 flex items-start gap-2">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[11px] text-amber-800">{w.msg}</p>
            {w.field && <p className="text-[9px] text-amber-600 mt-0.5">Field: {w.field}</p>}
          </div>
        </div>
      ))}
      {info.map((inf, i) => (
        <div key={i} className="rounded-xl border border-blue-200 bg-blue-50/50 px-3 py-2 flex items-start gap-2">
          <Info className="h-3.5 w-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-blue-700">{inf.msg}</p>
        </div>
      ))}
    </div>
  );
}