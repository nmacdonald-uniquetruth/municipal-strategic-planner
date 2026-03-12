import React from 'react';
import EnterpriseFundTable from '../components/machias/EnterpriseFundTable';
import SectionHeader from '../components/machias/SectionHeader';
import { Landmark, AlertTriangle } from 'lucide-react';

export default function EnterpriseFunds() {
  return (
    <div className="space-y-8">
      <SectionHeader
        title="Enterprise Fund Analysis"
        subtitle="Transfer sustainability & restructuring impact"
        icon={Landmark}
      />

      <EnterpriseFundTable />

      {/* Ambulance fund deep dive */}
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/30 p-5">
        <h3 className="text-sm font-semibold text-emerald-800 mb-3">Ambulance Fund — Billing Specialist Self-Funding</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-white rounded-lg p-3 border border-emerald-100">
            <p className="text-[10px] text-emerald-600 uppercase font-medium">Fund Balance</p>
            <p className="text-lg font-bold text-emerald-800">$500K</p>
            <p className="text-[10px] text-emerald-500">$370K after $130K loan payoff</p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-emerald-100">
            <p className="text-[10px] text-emerald-600 uppercase font-medium">Y1 Comstar Avoided</p>
            <p className="text-lg font-bold text-emerald-800">$49,548</p>
            <p className="text-[10px] text-emerald-500">5.22% × $949K net collected</p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-emerald-100">
            <p className="text-[10px] text-emerald-600 uppercase font-medium">BS Partial Y1 Cost</p>
            <p className="text-lg font-bold text-emerald-800">$48,098</p>
            <p className="text-[10px] text-emerald-500">6 months (hired Month 7)</p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-emerald-100">
            <p className="text-[10px] text-emerald-600 uppercase font-medium">Y1 Net Surplus</p>
            <p className="text-lg font-bold text-emerald-800">$1,450</p>
            <p className="text-[10px] text-emerald-500">Before collection improvement</p>
          </div>
        </div>
        <p className="text-xs text-emerald-700">
          Current transfer: $45,000/yr. Proposed increase to $65,000 in Year 2 — justified by Comstar savings and EMS collection improvement 
          staying in the Ambulance fund. Y2+ EMS collection improvement at 90% target adds ~$28K/yr.
        </p>
      </div>

      {/* Warning about at-risk funds */}
      <div className="rounded-2xl border border-red-200 bg-red-50/30 p-5">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <h3 className="text-sm font-semibold text-red-800">Funds Requiring Separate Action</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-3 border border-red-100">
            <h4 className="text-xs font-semibold text-red-800">Sewer Fund — ($60,200) deficit</h4>
            <p className="text-[10px] text-red-600 mt-1">Hold transfer flat at $21,110. Address deficit separately. Do not increase transfer burden on a negative-balance fund.</p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-red-100">
            <h4 className="text-xs font-semibold text-red-800">Transfer Station — ($296,245) deficit</h4>
            <p className="text-[10px] text-red-600 mt-1">Transfer at risk. Priority is rebuilding member town revenue through interlocal agreements. FY2027 projected loss: ($131,389).</p>
          </div>
        </div>
      </div>

      {/* Year 1 funding options */}
      <div className="rounded-2xl border border-slate-200/60 bg-white p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Year 1 Zero-Levy-Impact Options</h3>
        <p className="text-xs text-slate-500 mb-4">Y1 gap of ~$89,867 between new GF costs and new GF offsets</p>
        <div className="space-y-3">
          <div className="rounded-lg bg-emerald-50 p-3 border border-emerald-200">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-800">Option A — Recommended</span>
              <span className="text-[10px] bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full font-medium">RECOMMENDED</span>
            </div>
            <p className="text-xs text-emerald-700 mt-1">GF undesignated fund balance draw for Y1 only. ~$90K ≈ 1.8–2% of $2.4–2.6M balance. Well within GFOA guidance. Fully repaid by Y2 operations. Ambulance Fund must maintain a 3–6 month undesignated reserve — no draw from that fund.</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
            <p className="text-xs font-bold text-slate-700">Option B — Partial</p>
            <p className="text-xs text-slate-600 mt-1">Delay SA hire to Month 3, saves ~$18K. Reduces Y1 GF draw to ~$72K. Downside: delays regional services and COA cleanup by 2 months.</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
            <p className="text-xs font-bold text-slate-700">Option C — Parallel</p>
            <p className="text-xs text-slate-600 mt-1">Accelerate interlocal agreement execution to begin revenue in Month 7 rather than Month 9. Adds ~$13K in Y1 regional revenue, reducing the GF draw proportionally.</p>
          </div>
        </div>
      </div>
    </div>
  );
}