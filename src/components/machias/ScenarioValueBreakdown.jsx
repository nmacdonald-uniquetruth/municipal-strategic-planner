import React, { useState } from 'react';
import { useModel } from './ModelContext';
import { runProFormaFromSettings } from './FinancialModelV2';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

const fmt = (v) => v != null ? `$${Math.abs(Math.round(v)).toLocaleString()}` : '—';

const VALUE_GROUPS = {
  cash: {
    label: 'Actual Cash / Direct Revenue',
    color: '#10b981',
    description: 'Dollars that are deposited or not paid out — verifiable in financial records',
    keys: ['comstarAvoided', 'collectionImprovement', 'stipendSavings', 'airportSavings', 'regionalServices', 'emsExternal', 'transferStation'],
  },
  capacity: {
    label: 'Executive Capacity Value',
    color: '#3b82f6',
    description: 'Dollar value of time redirected from transactional to strategic work — real but not directly depositable',
    keys: ['fdCapacity', 'tmCapacity'],
  },
  riskMitigation: {
    label: 'Risk & Control Value',
    color: '#8b5cf6',
    description: 'Probabilistic reduction in audit-identified control risk exposure',
    keys: ['controlRisk'],
  },
  overhead: {
    label: 'Enterprise Overhead (Pre-Existing)',
    color: '#94a3b8',
    description: 'Existing enterprise fund transfers — establish cost-neutrality but are NOT new money',
    keys: ['enterpriseOverhead'],
  },
};

export default function ScenarioValueBreakdown() {
  const { settings } = useModel();
  const [showOverhead, setShowOverhead] = useState(true);
  const [showCapacity, setShowCapacity] = useState(true);
  const [showRisk, setShowRisk] = useState(true);
  const [view, setView] = useState('stacked'); // 'stacked' | 'table' | 'cash_only'

  const data = runProFormaFromSettings(settings);

  const buildChartData = () => data.map(d => {
    const row = { name: d.fiscalYear };
    const v = d.value;
    // Cash
    row['Cash & Direct Revenue'] = Math.round(
      (v.comstarAvoided || 0) + (v.collectionImprovement || 0) + (v.stipendSavings || 0) + (v.airportSavings || 0) +
      (v.regionalServices || 0) + (v.emsExternal || 0) + (v.transferStation || 0)
    );
    if (showCapacity) row['Executive Capacity'] = Math.round((v.fdCapacity || 0) + (v.tmCapacity || 0));
    if (showRisk) row['Control Risk Value'] = Math.round(v.controlRisk || 0);
    if (showOverhead) row['Enterprise Overhead (existing)'] = Math.round(v.enterpriseOverhead || 0);
    row['Total Costs (−)'] = -d.costs.total;
    return row;
  });

  const barColors = {
    'Cash & Direct Revenue': '#10b981',
    'Executive Capacity': '#3b82f6',
    'Control Risk Value': '#8b5cf6',
    'Enterprise Overhead (existing)': '#94a3b8',
    'Total Costs (−)': '#ef4444',
  };

  return (
    <div className="space-y-4">
      {/* Legend / toggles */}
      <div className="flex flex-wrap gap-4 p-4 rounded-2xl bg-white border border-slate-200/60 items-center">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-emerald-500" />
          <span className="text-xs text-slate-700 font-medium">Cash & Direct Revenue</span>
          <span className="text-[10px] text-slate-400 ml-1">— always shown</span>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={showCapacity} onCheckedChange={setShowCapacity} id="cap" />
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-blue-500" />
            <Label htmlFor="cap" className="text-xs text-slate-700">Executive Capacity Value</Label>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={showRisk} onCheckedChange={setShowRisk} id="risk" />
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-violet-500" />
            <Label htmlFor="risk" className="text-xs text-slate-700">Control Risk Mitigation</Label>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={showOverhead} onCheckedChange={setShowOverhead} id="oh" />
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-slate-400" />
            <Label htmlFor="oh" className="text-xs text-slate-700">Enterprise Overhead</Label>
          </div>
        </div>
        <div className="flex gap-1 ml-auto">
          {['stacked','table','cash_only'].map(v => (
            <button key={v} onClick={() => setView(v)} className={`text-[10px] px-2.5 py-1 rounded-full font-medium transition-colors ${view === v ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {v === 'stacked' ? 'Chart' : v === 'table' ? 'Table' : 'Cash Only'}
            </button>
          ))}
        </div>
      </div>

      {view === 'stacked' && (
        <div className="rounded-2xl border border-slate-200/60 bg-white p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Value vs. Cost by Category</h3>
          <ResponsiveContainer width="100%" height={360}>
            <BarChart data={buildChartData()} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip
                formatter={(v, name) => [fmt(Math.abs(v)), name]}
                contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {Object.entries(barColors).map(([key, color]) => (
                <Bar key={key} dataKey={key} fill={color} radius={[3, 3, 0, 0]} stackId={key === 'Total Costs (−)' ? undefined : 'value'} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {view === 'cash_only' && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/30 p-5">
          <h3 className="text-sm font-semibold text-emerald-800 mb-2">Cash-Only View — Most Conservative Case</h3>
          <p className="text-xs text-emerald-600 mb-4">Only counting dollars that are actually deposited or not paid out. Excludes capacity value and risk mitigation entirely.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-emerald-200">
                  <th className="text-left p-2 font-medium text-emerald-700">Cash Item</th>
                  {data.map(d => <th key={d.fiscalYear} className="text-right p-2 font-medium text-emerald-700">{d.fiscalYear}</th>)}
                </tr>
              </thead>
              <tbody>
                {[
                  ['Comstar Fee Avoided', 'comstarAvoided'],
                  ['Collection Rate Improvement', 'collectionImprovement'],
                  ['Stipend Elimination', 'stipendSavings'],
                  ['Airport Savings', 'airportSavings'],
                  ['Regional Financial Services', 'regionalServices'],
                  ['EMS External Billing', 'emsExternal'],
                  ['Transfer Station Fees', 'transferStation'],
                ].map(([label, key]) => (
                  <tr key={key} className="border-b border-emerald-100 hover:bg-emerald-50/50">
                    <td className="p-2 text-emerald-700">{label}</td>
                    {data.map(d => <td key={d.fiscalYear} className="p-2 text-right font-mono text-emerald-800">{fmt(d.value[key])}</td>)}
                  </tr>
                ))}
                <tr className="bg-emerald-100 font-bold">
                  <td className="p-2 text-emerald-800">Total Cash Value</td>
                  {data.map(d => {
                    const cash = ['comstarAvoided','collectionImprovement','stipendSavings','airportSavings','regionalServices','emsExternal','transferStation'].reduce((s, k) => s + (d.value[k] || 0), 0);
                    return <td key={d.fiscalYear} className="p-2 text-right font-mono text-emerald-900">{fmt(cash)}</td>;
                  })}
                </tr>
                <tr>
                  <td className="p-2 text-red-600">Total Costs</td>
                  {data.map(d => <td key={d.fiscalYear} className="p-2 text-right font-mono text-red-600">-{fmt(d.costs.total)}</td>)}
                </tr>
                <tr className="bg-slate-900 text-white font-bold">
                  <td className="p-2">Cash Net</td>
                  {data.map(d => {
                    const cash = ['comstarAvoided','collectionImprovement','stipendSavings','airportSavings','regionalServices','emsExternal','transferStation'].reduce((s, k) => s + (d.value[k] || 0), 0);
                    const net = Math.round(cash - d.costs.total);
                    return <td key={d.fiscalYear} className={`p-2 text-right font-mono ${net >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>{net >= 0 ? fmt(net) : `-${fmt(net)}`}</td>;
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {view === 'table' && (
        <div className="space-y-4">
          {Object.entries(VALUE_GROUPS).map(([key, group]) => (
            <div key={key} className="rounded-2xl border border-slate-200/60 bg-white overflow-hidden">
              <div className="flex items-center gap-2 p-3 border-b border-slate-100">
                <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: group.color }} />
                <span className="text-xs font-semibold text-slate-800">{group.label}</span>
                <span className="text-[10px] text-slate-400 flex-1">{group.description}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      <th className="text-left p-2 text-slate-500">Line Item</th>
                      {data.map(d => <th key={d.fiscalYear} className="text-right p-2 text-slate-500">{d.fiscalYear}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {group.keys.map(k => (
                      <tr key={k} className="border-b border-slate-50">
                        <td className="p-2 text-slate-600 capitalize">{k.replace(/([A-Z])/g, ' $1').trim()}</td>
                        {data.map(d => <td key={d.fiscalYear} className="p-2 text-right font-mono text-slate-700">{fmt(d.value[k])}</td>)}
                      </tr>
                    ))}
                    <tr className="font-semibold" style={{ backgroundColor: group.color + '15' }}>
                      <td className="p-2">Subtotal</td>
                      {data.map(d => {
                        const sub = group.keys.reduce((s, k) => s + (d.value[k] || 0), 0);
                        return <td key={d.fiscalYear} className="p-2 text-right font-mono">{fmt(sub)}</td>;
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}