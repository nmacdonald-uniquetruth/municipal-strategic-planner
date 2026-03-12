import React from 'react';
import { cn } from '@/lib/utils';

export default function StatCard({ label, value, sub, icon: Icon, trend, className }) {
  return (
    <div className={cn("relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-5 transition-shadow hover:shadow-lg", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium tracking-wider text-slate-400 uppercase">{label}</p>
          <p className="text-2xl font-bold tracking-tight text-slate-900">{value}</p>
          {sub && <p className="text-xs text-slate-500">{sub}</p>}
        </div>
        {Icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50">
            <Icon className="h-5 w-5 text-slate-600" />
          </div>
        )}
      </div>
      {trend && (
        <p className={cn("mt-3 text-xs font-medium", trend > 0 ? "text-emerald-600" : "text-amber-600")}>
          {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% vs. current
        </p>
      )}
    </div>
  );
}