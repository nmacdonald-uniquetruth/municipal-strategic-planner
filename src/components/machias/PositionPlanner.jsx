import React from 'react';
import { POSITIONS, HEALTH_TIERS } from './FinancialModel';
import { Badge } from '@/components/ui/badge';
import { Users, DollarSign, Calendar, Building2 } from 'lucide-react';

const statusColors = {
  'Phase 1': 'bg-emerald-100 text-emerald-800',
  'Trigger-based': 'bg-amber-100 text-amber-800',
};

export default function PositionPlanner() {
  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white overflow-hidden">
      <div className="p-5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-slate-600" />
          <h3 className="text-sm font-semibold text-slate-700">Position Plan — Phase 1 & Growth</h3>
        </div>
      </div>
      <div className="divide-y divide-slate-100">
        {POSITIONS.map((pos) => (
          <div key={pos.title} className="p-4 hover:bg-slate-50/50 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-slate-900 text-sm">{pos.title}</h4>
              <Badge className={statusColors[pos.status]}>{pos.status}</Badge>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-xs text-slate-600">${pos.base.toLocaleString()} base</span>
              </div>
              <div className="flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5 text-blue-400" />
                <span className="text-xs text-slate-600">${pos.loaded.toLocaleString()} loaded</span>
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
          </div>
        ))}
      </div>
      <div className="p-4 bg-slate-50/50 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">Health insurance budgeted at Family tier (worst-case)</span>
          <span className="text-xs text-slate-500">${HEALTH_TIERS.family.annual.toLocaleString()}/yr employer cost</span>
        </div>
        <p className="text-[10px] text-slate-400 mt-1">If all hires elect Individual tier, savings = $13,217/employee/year vs. budget</p>
      </div>
    </div>
  );
}