import React from 'react';
import PositionPlanner from '../components/machias/PositionPlanner';
import SectionHeader from '../components/machias/SectionHeader';
import { Users, Briefcase } from 'lucide-react';

export default function Positions() {
  return (
    <div className="space-y-8">
      <SectionHeader
        title="Position Planning & Workforce Strategy"
        subtitle="Phase 1 positions (immediate) and trigger-based growth positions"
        icon={Users}
      />

      <PositionPlanner />

      {/* Misallocation analysis */}
      <div className="rounded-2xl border border-slate-200/60 bg-white p-5">
        <div className="flex items-center gap-2 mb-4">
          <Briefcase className="h-4 w-4 text-slate-600" />
          <h3 className="text-sm font-semibold text-slate-700">Current Structural Misallocation</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl bg-slate-50 p-4">
            <h4 className="text-xs font-semibold text-slate-800 mb-2">Finance Director — 2 to 4 days/week on transactional work</h4>
            <div className="space-y-1.5 text-xs text-slate-600">
              <p>• Transaction-level entry, review, and error correction</p>
              <p>• System troubleshooting in TRIO</p>
              <p>• Reconciliation cleanup from July 2025 departure</p>
              <p>• Fire billing and ad-hoc billing oversight</p>
              <p>• Also serves as Assistant HR Director + tech manager</p>
            </div>
            <p className="mt-3 text-sm font-bold text-slate-900">$86,824 loaded × 45-60% = $39K-$52K/yr misallocated</p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <h4 className="text-xs font-semibold text-slate-800 mb-2">Town Manager — 10 to 17 hrs/week below executive scope</h4>
            <div className="space-y-1.5 text-xs text-slate-600">
              <p>• GA case processing (2-5 hrs/week, statutory Title 22)</p>
              <p>• Absorbed operations coordinator duties (8-12 hrs/week)</p>
              <p>• Vendor management, facilities, project oversight</p>
              <p>• EMS contract administration</p>
            </div>
            <p className="mt-3 text-sm font-bold text-slate-900">$96,013 loaded × 18-22% = $17K-$21K/yr misallocated</p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <h4 className="text-xs font-semibold text-slate-800 mb-2">Clerk Office — $26K/yr informal stipends</h4>
            <div className="space-y-1.5 text-xs text-slate-600">
              <p>• $350/week Deputy + $150/week Clerk since July 2025</p>
              <p>• ~$19,500 already paid as of March 2026</p>
              <p>• Financial ops outside statutory scope</p>
              <p>• Deputy has expressed workload is unsustainable</p>
            </div>
            <p className="mt-3 text-sm font-bold text-slate-900">$26,000/yr — eliminated upon SA hire</p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <h4 className="text-xs font-semibold text-slate-800 mb-2">Airport Inspection — $2,527/yr overage</h4>
            <div className="space-y-1.5 text-xs text-slate-600">
              <p>• Operations Manager at $25.37/hr, ~4 hrs/week</p>
              <p>• Annual cost: $5,277 from General Fund</p>
              <p>• No defined scope, inspection frequency, or documentation</p>
              <p>• Proposed: $2,750 stipend from airport budget line</p>
            </div>
            <p className="mt-3 text-sm font-bold text-slate-900">Saves $2,527/yr + creates FAA compliance documentation</p>
          </div>
        </div>
      </div>

      {/* Growth triggers */}
      <div className="rounded-2xl border border-blue-200 bg-blue-50/30 p-5">
        <h3 className="text-sm font-semibold text-blue-800 mb-3">Growth Position Triggers</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-lg bg-white p-3 border border-blue-100">
            <h4 className="text-xs font-semibold text-blue-800">Revenue Coordinator (PT → FT)</h4>
            <p className="text-[10px] text-blue-600 mt-1">
              Trigger: FD/SCEC devoting 8+ hrs/week to revenue coordination AND non-tax managed services revenue exceeds $60K annually.
              Requires Town Manager analysis + Select Board vote.
            </p>
          </div>
          <div className="rounded-lg bg-white p-3 border border-blue-100">
            <h4 className="text-xs font-semibold text-blue-800">Controller</h4>
            <p className="text-[10px] text-blue-600 mt-1">
              Trigger: Finance team reaches 4+ staff AND FD spending 20%+ on operational supervision with $130K+ regional revenue.
              Requires Town Manager analysis + Select Board vote.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}