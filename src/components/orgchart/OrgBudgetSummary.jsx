import React from 'react';
import { DollarSign, TrendingUp, Users } from 'lucide-react';
import { FUND_LABELS } from './OrgData';

const HEALTH = 30938;
const FICA = 0.0765;
const PERS = 0.085;
const WC = 0.025;

function fl(base) {
  return Math.round(base * (1 + FICA + PERS + WC) + HEALTH);
}

export default function OrgBudgetSummary({ positions, scenario }) {
  const visible = positions.filter(p => !p._hidden && p.base_salary > 0);

  // Group by fund
  const byFund = {};
  let totalBase = 0, totalLoaded = 0;
  let filledCount = 0, vacantCount = 0;

  visible.forEach(p => {
    const fund = p.fund_source || 'general_fund';
    if (!byFund[fund]) byFund[fund] = { base: 0, loaded: 0, count: 0 };
    const loaded = p.employment_type === 'full_time' ? fl(p.base_salary) : p.base_salary;
    byFund[fund].base += p.base_salary;
    byFund[fund].loaded += loaded;
    byFund[fund].count += 1;
    totalBase += p.base_salary;
    totalLoaded += loaded;
    if (p.status === 'filled') filledCount++;
    else vacantCount++;
  });

  const fmt = (n) => `$${Math.round(n).toLocaleString()}`;

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="bg-slate-900 px-4 py-3 flex items-center gap-2">
        <DollarSign className="h-4 w-4 text-slate-300" />
        <span className="text-sm font-bold text-white">Budget Summary</span>
        <span className="ml-auto text-[10px] text-slate-400">{scenario?.name}</span>
      </div>

      <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
        <div className="p-3 text-center">
          <p className="text-lg font-bold text-slate-900">{visible.length}</p>
          <p className="text-[10px] text-slate-500">Positions Shown</p>
        </div>
        <div className="p-3 text-center">
          <p className="text-lg font-bold text-emerald-700">{filledCount}</p>
          <p className="text-[10px] text-slate-500">Filled</p>
        </div>
        <div className="p-3 text-center">
          <p className="text-lg font-bold text-amber-600">{vacantCount}</p>
          <p className="text-[10px] text-slate-500">Vacant / Proposed</p>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* By fund */}
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">By Fund Source</p>
          <div className="space-y-1.5">
            {Object.entries(byFund).sort((a, b) => b[1].loaded - a[1].loaded).map(([fund, data]) => (
              <div key={fund} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-200">{FUND_LABELS[fund] || fund}</span>
                  <span className="text-slate-500">{data.count} pos.</span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-semibold text-slate-800">{fmt(data.loaded)}</span>
                  <span className="text-slate-400 text-[10px] ml-1">loaded</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="border-t border-slate-100 pt-3 space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Total Base Salaries</span>
            <span className="font-mono font-semibold text-slate-700">{fmt(totalBase)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Fully Loaded (est.)</span>
            <span className="font-mono font-bold text-slate-900">{fmt(totalLoaded)}</span>
          </div>
          <p className="text-[9px] text-slate-400">Loaded = base + FICA + PERS + WC + family health (est.)</p>
        </div>
      </div>
    </div>
  );
}