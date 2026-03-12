import React, { useState, useMemo } from 'react';
import { runProForma } from './FinancialModel';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Sliders } from 'lucide-react';
import ProFormaChart from './ProFormaChart';

export default function ScenarioModeler() {
  const [params, setParams] = useState({
    saBase: 65000,
    bsBase: 55000,
    wageGrowth: 0.04,
    healthTier: 'family',
    regionalEnabled: true,
    tsExpansion: true,
    emsExternal: true,
    erpEnabled: true,
    inhouseRate: 0.90,
  });

  const data = useMemo(() => runProForma(params), [params]);
  const cumulative = data.reduce((s, d) => s + d.net, 0);

  const update = (key, val) => setParams(p => ({ ...p, [key]: val }));

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200/60 bg-white p-5">
        <div className="flex items-center gap-2 mb-5">
          <Sliders className="h-4 w-4 text-slate-600" />
          <h3 className="text-sm font-semibold text-slate-700">Scenario Modeler — Adjust Assumptions</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-slate-500">Staff Accountant Base: ${params.saBase.toLocaleString()}</Label>
              <Slider min={55000} max={80000} step={1000} value={[params.saBase]} onValueChange={([v]) => update('saBase', v)} className="mt-2" />
            </div>
            <div>
              <Label className="text-xs text-slate-500">Billing Specialist Base: ${params.bsBase.toLocaleString()}</Label>
              <Slider min={48000} max={68000} step={1000} value={[params.bsBase]} onValueChange={([v]) => update('bsBase', v)} className="mt-2" />
            </div>
            <div>
              <Label className="text-xs text-slate-500">Wage Growth: {(params.wageGrowth * 100).toFixed(1)}%</Label>
              <Slider min={0.02} max={0.06} step={0.005} value={[params.wageGrowth]} onValueChange={([v]) => update('wageGrowth', v)} className="mt-2" />
            </div>
            <div>
              <Label className="text-xs text-slate-500">In-House Collection Rate: {(params.inhouseRate * 100).toFixed(1)}%</Label>
              <Slider min={0.85} max={0.95} step={0.005} value={[params.inhouseRate]} onValueChange={([v]) => update('inhouseRate', v)} className="mt-2" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-slate-600">Regional Financial Services</Label>
              <Switch checked={params.regionalEnabled} onCheckedChange={(v) => update('regionalEnabled', v)} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs text-slate-600">Transfer Station Expansion</Label>
              <Switch checked={params.tsExpansion} onCheckedChange={(v) => update('tsExpansion', v)} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs text-slate-600">EMS External Billing</Label>
              <Switch checked={params.emsExternal} onCheckedChange={(v) => update('emsExternal', v)} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs text-slate-600">ERP Implementation</Label>
              <Switch checked={params.erpEnabled} onCheckedChange={(v) => update('erpEnabled', v)} />
            </div>
          </div>
        </div>

        <div className="mt-5 p-3 rounded-xl bg-slate-50 flex flex-wrap items-center gap-4">
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-medium">5-Year Cumulative Net</p>
            <p className={`text-lg font-bold ${cumulative >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
              ${cumulative.toLocaleString()}
            </p>
          </div>
          {data.map(d => (
            <div key={d.fiscalYear} className="hidden md:block">
              <p className="text-[10px] text-slate-400">{d.fiscalYear}</p>
              <p className={`text-xs font-semibold ${d.net >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                ${d.net.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>

      <ProFormaChart data={data} />
    </div>
  );
}