import React, { useState } from 'react';
import ERPRoadmap from '../components/machias/ERPRoadmap';
import ERPEvaluator from '../components/machias/ERPEvaluator';
import SectionHeader from '../components/machias/SectionHeader';
import StatCard from '../components/machias/StatCard';
import { useModel } from '../components/machias/ModelContext';
import { Monitor, DollarSign, Clock, Server, Database } from 'lucide-react';

export default function ERPRoadmapPage() {
  const { settings } = useModel();
  const [activeTab, setActiveTab] = useState('roadmap');

  const netY1ERP = (settings.erp_y1_cost || 47000) - (settings.erp_designated_fund_offset || 24000);

  return (
    <div className="space-y-8">
      <SectionHeader
        title="ERP / Payroll / HRIS Modernization"
        subtitle="System-agnostic evaluation — separate initiative, complementary to restructuring"
        icon={Monitor}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Implementation Cost" value={`$${(settings.erp_y1_cost || 47000).toLocaleString()}`} icon={DollarSign} sub="Before designated fund offset" />
        <StatCard label="Net GF Cost (Y1)" value={`$${netY1ERP.toLocaleString()}`} icon={DollarSign} sub={`After $${(settings.erp_designated_fund_offset || 24000).toLocaleString()} designated fund`} />
        <StatCard label="Annual Value (Conservative)" value={`$${(settings.erp_annual_value || 21000).toLocaleString()}`} icon={Clock} sub="From Y2 onward" />
        <StatCard label="Ongoing Cost" value={`$${(settings.erp_ongoing_cost || 5000).toLocaleString()}/yr`} icon={Server} sub="License + support after Y1" />
      </div>

      <div className="flex gap-2">
        {[['roadmap','Timeline & Phases'],['evaluator','System Evaluator'],['architecture','Platform Architecture']].map(([id, label]) => (
          <button key={id} onClick={() => setActiveTab(id)} className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${activeTab === id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'roadmap' && (
        <>
          <ERPRoadmap />
          <div className="rounded-2xl border border-amber-200 bg-amber-50/30 p-5">
            <h3 className="text-sm font-semibold text-amber-800 mb-2">Critical Dependencies & Sequencing</h3>
            <ul className="text-xs text-amber-700 space-y-1.5">
              <li>• <strong>Staff Accountant must be hired BEFORE ERP selection begins</strong> — SA participates on evaluation committee</li>
              <li>• COA rebuild must occur BEFORE ERP go-live — data migration requires clean account structure aligned to Maine municipal COA</li>
              <li>• Billing Specialist / Comstar cutover is INDEPENDENT of ERP timeline — can and should proceed in FY2027</li>
              <li>• White-glove implementation support is a non-negotiable contract term given Machias's admin capacity</li>
              <li>• Multi-entity architecture critical for regional financial services delivery (RB, Machiasport, etc.)</li>
              <li>• School payroll import interface: goal is clean W-2, withholding, 941 for all employees — joint platform is optimal but not required</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-slate-200/60 bg-white p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Synergy with Administrative Restructuring</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="font-semibold text-slate-700 mb-1">Staff + Legacy System</p>
                <p className="text-slate-500">Recovers some FD capacity but can't achieve monthly close discipline or regional multi-entity services</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="font-semibold text-slate-700 mb-1">Modern System + No Staff</p>
                <p className="text-slate-500">Automates workflows but doesn't address reconciliation gap, school coordination, or audit finding</p>
              </div>
              <div className="rounded-lg bg-emerald-50 p-3 border border-emerald-200">
                <p className="font-semibold text-emerald-800 mb-1">Staff + Modern System</p>
                <p className="text-emerald-700">Addresses everything — monthly close, GASB, regional services, segregation of duties, payroll automation</p>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 mt-3">Even at 70% ERP value + zero regional revenue: combined investment generates ~$730K cumulative 5-year net value</p>
          </div>
        </>
      )}

      {activeTab === 'evaluator' && (
        <>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
            <strong>Systems under evaluation:</strong> Sage Intacct · TownCloud · Harris TRIO · Tyler Technologies (Munis / ERP Pro) · Edmunds GovTech · OpenGov · CivicPlus · Infor · Microsoft Dynamics 365 · Black Mountain Software · Caselle · BS&A Software · ClearGov · Paylocity · BambooHR · ADP · Paycor · Paycom · NEOGOV · HiBob · iSolved · Harris TRIO + TimeClock Plus · Harris TRIO + Smart AP · Harris TRIO + Employee Self Service · SmartFusion
          </div>
          <ERPEvaluator />
        </>
      )}

      {activeTab === 'architecture' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl bg-violet-50 p-4 border border-violet-100">
              <Database className="h-5 w-5 text-violet-600 mb-2" />
              <h4 className="text-xs font-semibold text-violet-800">Domain 1: Financial ERP</h4>
              <p className="text-[10px] text-violet-600 mt-1">GL, AP, AR, budget management, GASB fund reporting. Multi-entity for regional services. COA alignment to Maine AOS standards.</p>
              <p className="text-[10px] text-violet-500 mt-2 font-medium">Key criteria: fund accounting, GASB 34, multi-entity, Maine references, TRIO migration</p>
              <p className="text-[10px] text-violet-400 mt-1">Candidates: Sage Intacct, Tyler Munis, Edmunds, OpenGov, BS&A, Black Mountain, Caselle, Infor</p>
            </div>
            <div className="rounded-xl bg-blue-50 p-4 border border-blue-100">
              <Server className="h-5 w-5 text-blue-600 mb-2" />
              <h4 className="text-xs font-semibold text-blue-800">Domain 2: Payroll / HRIS</h4>
              <p className="text-[10px] text-blue-600 mt-1">Payroll, W-2, withholding, PFML, 941 filing. School payroll data import. Benefits admin, employee self-service, onboarding.</p>
              <p className="text-[10px] text-blue-500 mt-2 font-medium">Key criteria: ME PERS compatibility, school import, CEMSB workflow, ESS</p>
              <p className="text-[10px] text-blue-400 mt-1">Candidates: Paylocity, ADP, Paycor, Paycom, iSolved, BambooHR, HiBob, NEOGOV, TRIO ESS</p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-4 border border-emerald-100">
              <Monitor className="h-5 w-5 text-emerald-600 mb-2" />
              <h4 className="text-xs font-semibold text-emerald-800">Domain 3: Revenue / Civic</h4>
              <p className="text-[10px] text-emerald-600 mt-1">Online payments, utility billing, EMS/fire billing, permit/license, citizen portal. GL posting automation to ERP.</p>
              <p className="text-[10px] text-emerald-500 mt-2 font-medium">Key criteria: EMS billing (CEMSB), GL integration, utility billing, citizen UX</p>
              <p className="text-[10px] text-emerald-400 mt-1">Candidates: TownCloud, CivicPlus, ClearGov, TRIO Smart AP, TRIO + TimeClock Plus</p>
            </div>
          </div>
          <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 text-xs text-slate-600">
            <strong>Integration note:</strong> Single-vendor integrated suite (e.g., Tyler full suite, Edmunds, OpenGov) vs. best-of-breed point solutions with defined API integration. Key criteria: GL posting automation and AR reconciliation between Revenue platform and ERP. Vendor selection will determine specific product mix — functional requirements apply regardless of vendor.
          </div>
        </div>
      )}
    </div>
  );
}