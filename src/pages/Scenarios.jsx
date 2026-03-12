import React from 'react';
import ScenarioValueBreakdown from '../components/machias/ScenarioValueBreakdown';
import SectionHeader from '../components/machias/SectionHeader';
import { Target } from 'lucide-react';

export default function Scenarios() {
  return (
    <div className="space-y-8">
      <SectionHeader
        title="Scenario Modeler — Value vs. Cash"
        subtitle="Toggle between total value, cash-only, and by-category views. All figures update from Model Settings."
        icon={Target}
      />
      <ScenarioValueBreakdown />

      <div className="rounded-2xl border border-slate-200/60 bg-white p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Preset Scenario Reference</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl bg-slate-50 p-4 border border-slate-200">
            <h4 className="text-xs font-semibold text-slate-800">Conservative — Structural Only</h4>
            <p className="text-[10px] text-slate-500 mt-1">No regional revenue, no TS expansion, no external EMS billing. Just Comstar savings + stipends + capacity value.</p>
            <div className="mt-3 text-xs font-mono text-slate-700 space-y-0.5">
              <p>Y1: ~$90,600 · Y2: ~$162,600</p>
              <p>Y3: ~$192,000 · Y5: ~$250,000</p>
            </div>
          </div>
          <div className="rounded-xl bg-blue-50 p-4 border border-blue-200">
            <h4 className="text-xs font-semibold text-blue-800">Base Case — All Modeled Streams</h4>
            <p className="text-[10px] text-blue-500 mt-1">RB + Machiasport Y1, Marshfield Y2, Whitneyville + Northfield Y3. Full TS expansion and EMS external billing.</p>
            <div className="mt-3 text-xs font-mono text-blue-700 space-y-0.5">
              <p>5-Year net: ~$1.45M+ (all value categories)</p>
              <p>Cash-only 5yr: ~$900K</p>
              <p>Break-even: ~Month 7-8</p>
            </div>
          </div>
          <div className="rounded-xl bg-emerald-50 p-4 border border-emerald-200">
            <h4 className="text-xs font-semibold text-emerald-800">Optimistic</h4>
            <p className="text-[10px] text-emerald-500 mt-1">5+ service towns, 3 EMS external clients, full 7-town Transfer Station build.</p>
            <div className="mt-3 text-xs font-mono text-emerald-700 space-y-0.5">
              <p>Y1: ~$145,000 · Y5: ~$620,000</p>
              <p>5-Year significantly above base case</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}