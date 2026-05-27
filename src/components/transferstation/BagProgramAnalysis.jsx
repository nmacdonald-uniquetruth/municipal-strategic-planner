import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const fmt = (n) => n == null ? '—' : `$${Math.abs(Math.round(n)).toLocaleString()}`;

const SCENARIOS = {
  current:      { label: 'Current Pricing',   color: '#94a3b8', price20: 2.00, price30: 3.00 },
  raise_modest: { label: 'Raise Prices (+50%)', color: '#f59e0b', price20: 3.00, price30: 4.50 },
  raise_full:   { label: 'Cost-Recovery Price', color: '#10b981', price20: 4.00, price30: 6.00 },
  discontinue:  { label: 'Discontinue Program', color: '#ef4444', price20: 0,    price30: 0    },
};

export default function BagProgramAnalysis() {
  const [bags20perMonth, setBags20perMonth] = useState(150);
  const [bags30perMonth, setBags30perMonth] = useState(100);
  const [costPerBag, setCostPerBag]         = useState(1.20); // purchase + handling cost per bag

  const annualBags20 = bags20perMonth * 12;
  const annualBags30 = bags30perMonth * 12;
  const totalAnnualBags = annualBags20 + annualBags30;
  const annualCost = totalAnnualBags * costPerBag;

  const calcRevenue = (sc) => sc.price20 * annualBags20 + sc.price30 * annualBags30;

  const scenarios = Object.entries(SCENARIOS).map(([key, sc]) => {
    const revenue = calcRevenue(sc);
    const net     = revenue - (key === 'discontinue' ? 0 : annualCost);
    return { key, ...sc, revenue, net };
  });

  const currentRevenue = calcRevenue(SCENARIOS.current);
  const currentNet     = currentRevenue - annualCost;

  const chartData = scenarios.filter(s => s.key !== 'discontinue').map(s => ({
    name: s.label,
    Revenue: s.revenue,
    Cost:    annualCost,
    Net:     s.net,
  }));

  return (
    <div className="space-y-5">
      {/* Current State Banner */}
      <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4">
        <h3 className="font-bold text-amber-900 text-sm mb-1">Current Bag Program</h3>
        <p className="text-xs text-amber-800">
          Machias sells <strong>20-gallon bags at $2.00</strong> and <strong>30-gallon bags at $3.00</strong>.
          Use the inputs below to model whether the program covers its costs and evaluate your options.
        </p>
      </div>

      {/* Inputs */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
        <h3 className="font-bold text-slate-900 text-sm">Program Assumptions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              20-gal bags sold / month: <span className="text-slate-900 font-bold">{bags20perMonth}</span>
            </label>
            <input type="range" min={0} max={500} step={10} value={bags20perMonth}
              onChange={e => setBags20perMonth(Number(e.target.value))} className="w-full" />
            <p className="text-[10px] text-slate-400 mt-0.5">{annualBags20.toLocaleString()} bags/yr @ $2.00 = {fmt(annualBags20 * 2)}</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              30-gal bags sold / month: <span className="text-slate-900 font-bold">{bags30perMonth}</span>
            </label>
            <input type="range" min={0} max={500} step={10} value={bags30perMonth}
              onChange={e => setBags30perMonth(Number(e.target.value))} className="w-full" />
            <p className="text-[10px] text-slate-400 mt-0.5">{annualBags30.toLocaleString()} bags/yr @ $3.00 = {fmt(annualBags30 * 3)}</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Cost per bag (purchase + handling): <span className="text-slate-900 font-bold">${costPerBag.toFixed(2)}</span>
            </label>
            <input type="range" min={0.50} max={3.00} step={0.10} value={costPerBag}
              onChange={e => setCostPerBag(Number(e.target.value))} className="w-full" />
            <p className="text-[10px] text-slate-400 mt-0.5">Total annual cost: {fmt(annualCost)}</p>
          </div>
        </div>

        {/* Current program P&L */}
        <div className={`rounded-lg border p-3 flex items-center justify-between ${currentNet >= 0 ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
          <div>
            <p className="text-xs font-bold text-slate-700">Current program net (revenue − cost)</p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Revenue: {fmt(currentRevenue)} &nbsp;·&nbsp; Cost: {fmt(annualCost)}
            </p>
          </div>
          <p className={`text-lg font-bold ${currentNet >= 0 ? 'text-emerald-800' : 'text-red-800'}`}>
            {currentNet >= 0 ? '+' : ''}{fmt(currentNet)}/yr
          </p>
        </div>
      </div>

      {/* Scenario Comparison */}
      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 text-white px-4 py-2.5">
          <h3 className="font-semibold text-sm">Scenario Comparison</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {scenarios.map(sc => {
            const netDelta = sc.net - currentNet;
            return (
              <div key={sc.key} className="px-4 py-3 grid grid-cols-5 text-xs items-center">
                <span className="font-semibold text-slate-800 col-span-2 flex items-center gap-2">
                  <span className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: sc.color }} />
                  {sc.label}
                </span>
                <span className="font-mono text-slate-600">
                  {sc.key === 'discontinue' ? <span className="text-red-600 font-bold">$0 (no sales)</span> : `${fmt(sc.price20)} / ${fmt(sc.price30)}`}
                </span>
                <span className={`font-mono font-semibold ${sc.net >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                  {sc.key === 'discontinue' ? <span className="text-slate-500">n/a</span> : `${sc.net >= 0 ? '+' : ''}${fmt(sc.net)}/yr`}
                </span>
                <span className={`font-mono text-[10px] ${netDelta > 0 ? 'text-emerald-600' : netDelta < 0 ? 'text-red-600' : 'text-slate-400'}`}>
                  {sc.key === 'current' ? '(baseline)' : sc.key === 'discontinue' ? `−${fmt(currentRevenue)}/yr lost` : `${netDelta >= 0 ? '+' : ''}${fmt(netDelta)} vs. now`}
                </span>
              </div>
            );
          })}
          <div className="px-4 py-1 bg-slate-50 text-[10px] text-slate-400 grid grid-cols-5">
            <span className="col-span-2">Scenario</span>
            <span>Bag prices (20 / 30 gal)</span>
            <span>Annual net</span>
            <span>Change vs. current</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="font-bold text-slate-900 text-sm mb-3">Revenue vs. Cost by Pricing Scenario</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fontSize: 9 }} />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${(v/1000).toFixed(1)}K`} />
            <Tooltip formatter={v => fmt(v)} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Bar dataKey="Revenue" fill="#10b981" radius={[3,3,0,0]} />
            <Bar dataKey="Cost"    fill="#f59e0b" radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recommendation Box */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
        <h3 className="font-bold text-slate-900 text-sm">Considerations for Each Option</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="rounded-lg border border-red-200 bg-red-50/40 p-3">
            <p className="font-bold text-red-900 mb-1">⚠️ Keep Current Pricing</p>
            <p className="text-red-800">If the program is running at a loss at current volumes, this continues to drain the fund. Only viable if current prices already cover costs at actual sales volumes.</p>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50/40 p-3">
            <p className="font-bold text-amber-900 mb-1">📈 Raise Prices</p>
            <p className="text-amber-800">A price increase to $3/$4.50 or higher can move the program to cost-neutral or profitable. Residents have already accepted pay-as-you-throw bag programs — an increase is more defensible than discontinuation.</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="font-bold text-slate-900 mb-1">🚫 Discontinue</p>
            <p className="text-slate-700">Eliminates administrative burden and purchasing costs. However, lose convenience revenue and may shift volume to free disposal alternatives. Best if administrative cost exceeds any realistic revenue gain.</p>
          </div>
        </div>
      </div>
    </div>
  );
}