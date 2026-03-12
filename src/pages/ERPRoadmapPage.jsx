import React from 'react';
import ERPRoadmap from '../components/machias/ERPRoadmap';
import SectionHeader from '../components/machias/SectionHeader';
import StatCard from '../components/machias/StatCard';
import { Monitor, DollarSign, Clock, Database, Server } from 'lucide-react';

export default function ERPRoadmapPage() {
  return (
    <div className="space-y-8">
      <SectionHeader
        title="ERP / Payroll / HRIS Modernization"
        subtitle="Separate from restructuring — operationally complementary but independently funded"
        icon={Monitor}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Implementation Cost" value="$47K" icon={DollarSign} sub="Offset by $24K designated fund" />
        <StatCard label="Net GF Cost (Y1)" value="$23K" icon={DollarSign} sub="After capital reserve offset" />
        <StatCard label="Annual Value" value="$21K" icon={Clock} sub="Conservative ROI estimate" />
        <StatCard label="Ongoing Cost" value="$5K/yr" icon={Server} sub="License + support after Y1" />
      </div>

      <ERPRoadmap />

      {/* Three-platform architecture */}
      <div className="rounded-2xl border border-slate-200/60 bg-white p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Three-Platform Functional Architecture</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl bg-violet-50 p-4 border border-violet-100">
            <Database className="h-5 w-5 text-violet-600 mb-2" />
            <h4 className="text-xs font-semibold text-violet-800">Financial ERP</h4>
            <p className="text-[10px] text-violet-600 mt-1">GL, AP, AR, budget management, GASB reporting. Multi-entity for regional services. COA alignment to Maine standards.</p>
            <p className="text-[10px] text-violet-500 mt-2">Examples: Sage Intacct, Edmunds GovTech, Tyler Munis</p>
          </div>
          <div className="rounded-xl bg-blue-50 p-4 border border-blue-100">
            <Server className="h-5 w-5 text-blue-600 mb-2" />
            <h4 className="text-xs font-semibold text-blue-800">Payroll / HRIS</h4>
            <p className="text-[10px] text-blue-600 mt-1">Payroll processing, W-2, withholding, PFML, school data import. Benefits administration, employee self-service.</p>
            <p className="text-[10px] text-blue-500 mt-2">Examples: Paylocity, ADP, Paychex</p>
          </div>
          <div className="rounded-xl bg-emerald-50 p-4 border border-emerald-100">
            <Monitor className="h-5 w-5 text-emerald-600 mb-2" />
            <h4 className="text-xs font-semibold text-emerald-800">Revenue / Civic Platform</h4>
            <p className="text-[10px] text-emerald-600 mt-1">Online payments, utility billing, permit/license management, citizen portal. Integration with ERP for GL posting.</p>
            <p className="text-[10px] text-emerald-500 mt-2">Examples: TownCloud, Tyler EnerGov</p>
          </div>
        </div>
      </div>

      {/* Critical dependencies */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50/30 p-5">
        <h3 className="text-sm font-semibold text-amber-800 mb-2">Critical Dependencies & Sequencing</h3>
        <ul className="text-xs text-amber-700 space-y-1.5">
          <li>• <strong>Staff Accountant must be hired BEFORE ERP selection begins</strong> — SA participates on evaluation committee</li>
          <li>• COA rebuild must occur BEFORE ERP go-live — data migration requires clean account structure</li>
          <li>• Billing Specialist Comstar cutover is INDEPENDENT of ERP timeline — can proceed in FY2027</li>
          <li>• White-glove implementation support is non-negotiable given Machias's small admin capacity</li>
          <li>• SA serves as primary internal implementation resource to protect FD strategic time</li>
        </ul>
      </div>

      {/* Synergy with restructuring */}
      <div className="rounded-2xl border border-slate-200/60 bg-white p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Synergy with Administrative Restructuring</h3>
        <p className="text-xs text-slate-500 mb-4">Neither investment reaches full value without the other</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="font-semibold text-slate-800 mb-1">Staff + Legacy System =</p>
            <p className="text-slate-600">Recovers some FD capacity but cannot achieve monthly close discipline, subsidiary ledger quality, or audit trail standards</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="font-semibold text-slate-800 mb-1">Modern System + No Staff =</p>
            <p className="text-slate-600">Automates workflows but doesn't address reconciliation gap, school coordination, or regional services delivery</p>
          </div>
          <div className="rounded-lg bg-emerald-50 p-3 col-span-1 md:col-span-2 border border-emerald-200">
            <p className="font-semibold text-emerald-800 mb-1">Staff + Modern System =</p>
            <p className="text-emerald-700">Addresses ALL simultaneously — monthly close, audit compliance, regional multi-entity services, segregation of duties, payroll automation</p>
          </div>
        </div>
        <p className="text-[10px] text-slate-400 mt-3">Even at 70% ERP value + zero regional revenue: combined generates ~$730K cumulative 5-year net value</p>
      </div>
    </div>
  );
}