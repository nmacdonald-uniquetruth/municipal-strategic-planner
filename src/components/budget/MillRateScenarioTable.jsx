/**
 * MillRateScenarioTable — What-if mill rate selector
 * Shows a range of mill rates with commitment, overlay, and per-home impact.
 */
import React, { useState } from 'react';
import { millRateScenarios } from './budgetEngine';

const $ = n => `$${Math.round(Math.abs(n || 0)).toLocaleString()}`;

export default function MillRateScenarioTable({ calc, selectedMillRate, onSelectMillRate }) {
  const [stepSize, setStepSize] = useState(0.05);
  const scenarios = millRateScenarios(calc, 6, stepSize);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-700">Mill Rate Scenarios</p>
        <div className="flex items-center gap-2">
          <label className="text-[10px] text-slate-500">Step size:</label>
          <select value={stepSize} onChange={e => setStepSize(parseFloat(e.target.value))}
            className="text-[10px] border border-slate-200 rounded px-1.5 py-0.5">
            {[0.025, 0.05, 0.1, 0.25].map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 px-3 py-1.5 grid grid-cols-6 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
          <span>Mill Rate</span>
          <span className="text-right">Commitment</span>
          <span className="text-right">Overlay $</span>
          <span className="text-right">Overlay %</span>
          <span className="text-right">$/Median</span>
          <span className="text-center">Select</span>
        </div>
        {scenarios.map((s) => {
          const isSelected = Math.abs(s.millRate - (selectedMillRate ?? calc.calculatedMillRate)) < 0.0001;
          const isCalculated = s.isCalculated;
          return (
            <div key={s.millRate}
              className={`px-3 py-1.5 grid grid-cols-6 text-[10px] border-t border-slate-50 transition-colors ${
                isSelected ? 'bg-slate-900 text-white' :
                isCalculated ? 'bg-blue-50' : 'hover:bg-slate-50'
              }`}>
              <span className={`font-mono font-bold ${isSelected ? 'text-white' : isCalculated ? 'text-blue-700' : 'text-slate-800'}`}>
                {s.millRate.toFixed(3)}
                {isCalculated && !isSelected && <span className="ml-1 text-[8px] text-blue-500 font-normal">calc</span>}
              </span>
              <span className={`text-right font-mono ${isSelected ? 'text-white' : 'text-slate-700'}`}>{$(s.commitment)}</span>
              <span className={`text-right font-mono ${isSelected ? 'text-white' : s.overlayGenerated >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                {s.overlayGenerated >= 0 ? '' : '-'}{$(s.overlayGenerated)}
              </span>
              <span className={`text-right font-mono ${isSelected ? 'text-white' : s.overlayPct > 3 ? 'text-amber-700' : 'text-slate-600'}`}>
                {s.overlayPct.toFixed(2)}%
              </span>
              <span className={`text-right font-mono ${isSelected ? 'text-white' : 'text-slate-700'}`}>{$(s.perMedianHome)}</span>
              <div className="flex justify-center">
                <button
                  onClick={() => onSelectMillRate(isSelected ? null : s.millRate)}
                  className={`text-[9px] px-2 py-0.5 rounded font-bold transition-colors ${
                    isSelected ? 'bg-white text-slate-900 hover:bg-slate-100' : 'bg-slate-200 text-slate-700 hover:bg-slate-900 hover:text-white'
                  }`}>
                  {isSelected ? '✓ Active' : 'Use'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-[9px] text-slate-400">Median home = $150K assessed value. Select a mill rate to override the calculated rate in the commitment form.</p>
    </div>
  );
}