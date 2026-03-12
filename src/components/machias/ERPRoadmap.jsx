import React from 'react';
import { ERP_PHASES } from './FinancialModel';
import { Monitor, ArrowRight } from 'lucide-react';

export default function ERPRoadmap() {
  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white p-5">
      <div className="flex items-center gap-2 mb-5">
        <Monitor className="h-4 w-4 text-slate-600" />
        <h3 className="text-sm font-semibold text-slate-700">ERP / Payroll / HRIS Modernization Roadmap</h3>
      </div>
      <div className="space-y-3">
        {ERP_PHASES.map((phase, i) => (
          <div key={phase.phase} className="relative">
            <div className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                  i === 0 ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {i + 1}
                </div>
                {i < ERP_PHASES.length - 1 && <div className="w-px h-6 bg-slate-200 mt-1" />}
              </div>
              <div className="flex-1 pb-3">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h4 className="text-sm font-semibold text-slate-900">{phase.name}</h4>
                  <span className="text-[10px] font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">{phase.timing}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{phase.desc}</p>
                <div className="flex items-center gap-1 mt-1.5">
                  <ArrowRight className="h-3 w-3 text-amber-500" />
                  <span className="text-[10px] text-amber-600 font-medium">Depends on: {phase.dependency}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 p-3 rounded-lg bg-blue-50/50 border border-blue-100">
        <p className="text-xs text-blue-700 font-medium">Platform candidates under evaluation:</p>
        <p className="text-xs text-blue-600 mt-1">Sage Intacct (ERP) · Paylocity (Payroll/HRIS) · TownCloud (Revenue) · Edmunds GovTech · Tyler Technologies (Munis)</p>
        <p className="text-[10px] text-blue-500 mt-1">$24K designated fund available + ~$23K net GF appropriation for Year 1 implementation</p>
      </div>
    </div>
  );
}