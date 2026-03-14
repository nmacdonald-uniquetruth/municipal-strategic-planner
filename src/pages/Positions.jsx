import React from 'react';
import PositionPlanner from '../components/machias/PositionPlanner';
import PoliceAdminConfig from '../components/machias/PoliceAdminConfig';
import SectionHeader from '../components/machias/SectionHeader';
import { useModel } from '../components/machias/ModelContext';
import { runProFormaFromSettings } from '../components/machias/FinancialModelV2';
import { Users, Briefcase, ExternalLink } from 'lucide-react';

const fmt = (n) => `$${Math.abs(Math.round(n)).toLocaleString()}`;

export default function Positions() {
  const { settings } = useModel();
  const data = runProFormaFromSettings(settings);
  const d1 = data[0];
  return (
    <div className="space-y-8">
      <SectionHeader
        title="Position Planning & Workforce Strategy"
        subtitle="Phase 1 positions (immediate) and trigger-based growth positions"
        icon={Users}
      />

      <PositionPlanner />

      {/* Police Administrative Support Configuration */}
      <PoliceAdminConfig />

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
            <h4 className="text-xs font-semibold text-slate-800 mb-2">Clerk Office — {fmt(settings.stipend_elimination)}/yr informal stipends</h4>
            <div className="space-y-1.5 text-xs text-slate-600">
              <p>• $350/week Deputy + $150/week Clerk since July 2025</p>
              <p>• ~$19,500 already paid as of March 2026</p>
              <p>• Financial ops outside statutory scope</p>
              <p>• Deputy has expressed workload is unsustainable</p>
            </div>
            <p className="mt-3 text-sm font-bold text-slate-900">
              {fmt(settings.stipend_elimination)}/yr — {settings.y1_staffing_model === 'parttime_stipend'
                ? 'reallocated Day 1 to fund part-time accounting support'
                : 'eliminated upon SA hire'}
            </p>
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

      {/* Capacity Allocation */}
      <div className="rounded-2xl border border-slate-200/60 bg-white p-5">
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-4 w-4 text-slate-600" />
          <h3 className="text-sm font-semibold text-slate-700">Executive Capacity Recovery — By Position</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-2">Finance Director — Capacity Freed</p>
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <div className="bg-slate-100 px-3 py-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider grid grid-cols-3">
                <span>Year</span><span>% FD Time Freed</span><span>Value at FD Rate</span>
              </div>
              {data.map((d, i) => (
                <div key={i} className="px-3 py-1.5 grid grid-cols-3 text-xs border-t border-slate-100">
                  <span className="font-medium text-slate-700">{d.fiscalYear}</span>
                  <span className="font-mono text-emerald-700">{i === 0 ? '45%' : i === 1 ? '55%' : '60%'}</span>
                  <span className="font-mono text-slate-700">{fmt(d.value.fdCapacity)}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Capacity redirected to strategic planning, capital projects, economic development</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-2">Town Manager — Capacity Freed</p>
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <div className="bg-slate-100 px-3 py-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider grid grid-cols-3">
                <span>Year</span><span>% TM Time Freed</span><span>Value at TM Rate</span>
              </div>
              {data.map((d, i) => (
                <div key={i} className="px-3 py-1.5 grid grid-cols-3 text-xs border-t border-slate-100">
                  <span className="font-medium text-slate-700">{d.fiscalYear}</span>
                  <span className="font-mono text-emerald-700">{i === 0 ? '18%' : '22%'}</span>
                  <span className="font-mono text-slate-700">{fmt(d.value.tmCapacity)}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Capacity redirected to regional partnerships, grant strategy, intergovernmental relations</p>
          </div>
        </div>
      </div>

      {/* Job Descriptions */}
      <div className="rounded-2xl border border-blue-200 bg-blue-50/30 p-5">
        <h3 className="text-sm font-semibold text-blue-800 mb-3">Job Description Resources</h3>
        <p className="text-xs text-blue-700 mb-3">Use these templates as starting points. All salary figures should reference current MMA wage survey data and be confirmed with the Town's HR policy before posting.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { title: 'Staff Accountant', base: fmt(settings.sa_base_salary), fund: 'General Fund', source: 'GFOA + MMA template', url: 'https://www.gfoa.org/job-descriptions' },
            { title: 'Billing Specialist (EMS)', base: fmt(settings.bs_base_salary), fund: 'Ambulance Fund', source: 'NAEMSE template', url: 'https://www.naemse.org/' },
            { title: 'GA Coordinator', base: fmt(settings.ga_stipend) + ' stipend', fund: 'General Fund', source: 'MMA + Title 22 requirements', url: 'https://www.memun.org/' },
            { title: 'Revenue Coordinator (future)', base: fmt(settings.rc_base_salary), fund: 'Regional Revenue', source: 'ICMA shared services template', url: 'https://icma.org/' },
          ].map((jd, i) => (
            <div key={i} className="rounded-lg bg-white border border-blue-100 p-3 flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-blue-900 text-xs">{jd.title}</p>
                <p className="text-[10px] text-blue-600 mt-0.5">{jd.base} · {jd.fund}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Template: {jd.source}</p>
              </div>
              <a href={jd.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-700">
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          ))}
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