import React from 'react';
import { useModel } from './ModelContext';
import { Badge } from '@/components/ui/badge';
import { Users, DollarSign, Calendar, Building2, Info } from 'lucide-react';

const statusColors = {
  'Phase 1': 'bg-emerald-100 text-emerald-800',
  'Y1 Transition': 'bg-blue-100 text-blue-800',
  'Y2 Full-time': 'bg-emerald-100 text-emerald-800',
  'Trigger-based': 'bg-amber-100 text-amber-800',
};

const fmt = (n) => `$${Math.round(n).toLocaleString()}`;

export default function PositionPlanner() {
  const { settings } = useModel();
  const isPartTime = settings.y1_staffing_model === 'parttime_stipend';
  const clerkStipend = settings.clerk_stipend_realloc || settings.stipend_elimination || 26000;
  const gaStipend = settings.ga_stipend || 10000;
  const healthCost = settings.health_tier === 'individual' ? settings.health_individual_annual : settings.health_family_annual;

  const fl = (base) => {
    const fica = base * (settings.fica_rate || 0.0765);
    const pers = base * (settings.pers_rate || 0.085);
    const wc = base * (settings.wc_rate || 0.025);
    return Math.round(base + fica + pers + wc + healthCost);
  };

  const positions = isPartTime ? [
    {
      title: 'Part-Time Accounting Support (Y1)',
      status: 'Y1 Transition',
      base: gaStipend + clerkStipend,
      loaded: gaStipend + clerkStipend,
      hireMonth: 'Month 1 (stipend-funded)',
      fund: 'General Fund',
      note: `Funded by GA stipend (${fmt(gaStipend)}) + clerk stipend reallocation (${fmt(clerkStipend)}). No benefits. Covers basic accounting support & GA duties.`,
    },
    {
      title: 'Staff Accountant (Full-Time, Y2)',
      status: 'Y2 Full-time',
      base: settings.sa_base_salary,
      loaded: fl(settings.sa_base_salary),
      hireMonth: 'Month 13 (start of Year 2)',
      fund: 'General Fund',
      note: 'Full-time hire begins Year 2 after part-time transition. GA Coordinator stipend also resumes in Y2.',
    },
    {
      title: 'Billing Specialist (EMS)',
      status: 'Phase 1',
      base: settings.bs_base_salary,
      loaded: fl(settings.bs_base_salary),
      hireMonth: 'Month 7 (half-year Y1)',
      fund: 'Ambulance Fund',
    },
    {
      title: 'GA Coordinator (Y2+)',
      status: 'Y2 Full-time',
      base: gaStipend,
      loaded: gaStipend,
      hireMonth: 'Month 13 (start of Year 2)',
      fund: 'General Fund',
      note: 'GA duties covered by part-time person in Y1. Dedicated coordinator stipend resumes in Y2.',
    },
    {
      title: 'Revenue Coordinator',
      status: 'Trigger-based',
      base: settings.rc_base_salary,
      loaded: fl(settings.rc_base_salary),
      hireMonth: 'Year 3 (trigger-based)',
      fund: 'Regional Revenue',
    },
  ] : [
    {
      title: 'Staff Accountant',
      status: 'Phase 1',
      base: settings.sa_base_salary,
      loaded: fl(settings.sa_base_salary),
      hireMonth: 'Month 3',
      fund: 'General Fund',
    },
    {
      title: 'Billing Specialist (EMS)',
      status: 'Phase 1',
      base: settings.bs_base_salary,
      loaded: fl(settings.bs_base_salary),
      hireMonth: 'Month 7 (half-year Y1)',
      fund: 'Ambulance Fund',
    },
    {
      title: 'GA Coordinator',
      status: 'Phase 1',
      base: gaStipend,
      loaded: gaStipend,
      hireMonth: 'Month 9 (stipend)',
      fund: 'General Fund',
    },
    {
      title: 'Revenue Coordinator',
      status: 'Trigger-based',
      base: settings.rc_base_salary,
      loaded: fl(settings.rc_base_salary),
      hireMonth: 'Year 3 (trigger-based)',
      fund: 'Regional Revenue',
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-slate-600" />
          <h3 className="text-sm font-semibold text-slate-700">Position Plan — Phase 1 & Growth</h3>
        </div>
        {isPartTime && (
          <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2 py-0.5 font-medium">
            Part-Time Y1 Model Active
          </span>
        )}
      </div>
      <div className="divide-y divide-slate-100">
        {positions.map((pos) => (
          <div key={pos.title} className="p-4 hover:bg-slate-50/50 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-slate-900 text-sm">{pos.title}</h4>
              <Badge className={statusColors[pos.status]}>{pos.status}</Badge>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-xs text-slate-600">{fmt(pos.base)} base</span>
              </div>
              <div className="flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5 text-blue-400" />
                <span className="text-xs text-slate-600">{fmt(pos.loaded)} loaded</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-xs text-slate-600">{pos.hireMonth}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-xs text-slate-600">{pos.fund}</span>
              </div>
            </div>
            {pos.note && (
              <div className="mt-2 flex items-start gap-1.5">
                <Info className="h-3 w-3 text-blue-400 mt-0.5 shrink-0" />
                <p className="text-[10px] text-slate-500">{pos.note}</p>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="p-4 bg-slate-50/50 border-t border-slate-100">
        {isPartTime ? (
          <p className="text-[10px] text-slate-500">
            <strong>Y1 cost: {fmt(gaStipend + clerkStipend)}</strong> (stipend-funded, no benefits load).
            Full-time SA + GA Coordinator resume in Y2 at fully-loaded rates.
            Clerk stipends eliminated on Day 1.
          </p>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Health insurance budgeted at {settings.health_tier} tier</span>
              <span className="text-xs text-slate-500">{fmt(healthCost)}/yr employer cost</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Clerk stipends ($26K/yr) eliminated upon SA hire</p>
          </>
        )}
      </div>
    </div>
  );
}