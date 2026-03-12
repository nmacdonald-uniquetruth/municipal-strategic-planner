import React from 'react';

export default function ProFormaTable({ data }) {
  const fmt = (v) => v ? `$${v.toLocaleString()}` : '—';

  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-900 text-white">
              <th className="text-left p-3 font-medium">Category</th>
              {data.map(d => (
                <th key={d.fiscalYear} className="text-right p-3 font-medium">{d.fiscalYear}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="bg-slate-50 font-semibold text-slate-700">
              <td className="p-3" colSpan={6}>STRUCTURAL VALUE</td>
            </tr>
            {[
              ['Enterprise Overhead', 'enterpriseOverhead'],
              ['FD Capacity Recovery', 'fdCapacity'],
              ['TM Capacity Recovery', 'tmCapacity'],
              ['Comstar Fee Avoided', 'comstarAvoided'],
              ['Collection Improvement', 'collectionImprovement'],
              ['Stipend Savings', 'stipendSavings'],
              ['Airport Savings', 'airportSavings'],
              ['Control Risk Mitigation', 'controlRisk'],
            ].map(([label, key]) => (
              <tr key={key} className="border-b border-slate-50 hover:bg-slate-50/50">
                <td className="p-3 pl-6 text-slate-600">{label}</td>
                {data.map(d => <td key={d.fiscalYear} className="p-3 text-right font-mono text-slate-700">{fmt(d.value[key])}</td>)}
              </tr>
            ))}

            <tr className="bg-slate-50 font-semibold text-slate-700">
              <td className="p-3" colSpan={6}>REGIONAL REVENUE</td>
            </tr>
            {[
              ['Financial Services', 'regionalServices'],
              ['EMS External Billing', 'emsExternal'],
              ['Transfer Station', 'transferStation'],
              ['ERP Value', 'erpValue'],
            ].map(([label, key]) => (
              <tr key={key} className="border-b border-slate-50 hover:bg-slate-50/50">
                <td className="p-3 pl-6 text-slate-600">{label}</td>
                {data.map(d => <td key={d.fiscalYear} className="p-3 text-right font-mono text-slate-700">{fmt(d.value[key])}</td>)}
              </tr>
            ))}

            <tr className="bg-emerald-50 font-semibold text-emerald-800">
              <td className="p-3">TOTAL VALUE</td>
              {data.map(d => <td key={d.fiscalYear} className="p-3 text-right font-mono">{fmt(d.value.total)}</td>)}
            </tr>

            <tr className="bg-slate-50 font-semibold text-slate-700">
              <td className="p-3" colSpan={6}>POSITION COSTS</td>
            </tr>
            {[
              ['Staff Accountant', 'staffAccountant'],
              ['Billing Specialist', 'billingSpecialist'],
              ['GA Coordinator', 'gaCoordinator'],
              ['Revenue Coordinator', 'revenueCoordinator'],
              ['Controller', 'controller'],
              ['Implementation', 'implementation'],
              ['ERP', 'erp'],
            ].map(([label, key]) => (
              <tr key={key} className="border-b border-slate-50 hover:bg-slate-50/50">
                <td className="p-3 pl-6 text-slate-600">{label}</td>
                {data.map(d => <td key={d.fiscalYear} className="p-3 text-right font-mono text-red-600">{d.costs[key] ? `-${fmt(d.costs[key])}` : '—'}</td>)}
              </tr>
            ))}
            <tr className="bg-red-50 font-semibold text-red-700">
              <td className="p-3">TOTAL COSTS</td>
              {data.map(d => <td key={d.fiscalYear} className="p-3 text-right font-mono">-{fmt(d.costs.total)}</td>)}
            </tr>

            <tr className="bg-slate-900 text-white font-bold">
              <td className="p-3">NET ANNUAL VALUE</td>
              {data.map(d => (
                <td key={d.fiscalYear} className={`p-3 text-right font-mono ${d.net >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                  {fmt(d.net)}
                </td>
              ))}
            </tr>
            <tr className="bg-slate-800 text-slate-200 text-[11px]">
              <td className="p-3 font-medium">
                <span>Net Cost After Regional Revenue</span>
                <div className="text-[9px] text-slate-400 font-normal mt-0.5">Total Costs minus Regional Revenue (cash only)</div>
              </td>
              {data.map(d => {
                const netAfterRegional = d.costs.total - d.value.regionalTotal;
                return (
                  <td key={d.fiscalYear} className={`p-3 text-right font-mono ${netAfterRegional <= 0 ? 'text-emerald-300' : 'text-amber-300'}`}>
                    {netAfterRegional <= 0 ? fmt(Math.abs(netAfterRegional)) + ' surplus' : fmt(netAfterRegional) + ' gap'}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}