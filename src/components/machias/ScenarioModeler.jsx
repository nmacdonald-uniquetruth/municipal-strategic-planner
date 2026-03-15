/**
 * ScenarioModeler — interactive what-if slider panel.
 *
 * Previously imported the legacy runProForma() with hardcoded defaults.
 * Now merges slider overrides onto live ModelContext settings and calls
 * the canonical runProFormaFromSettings(), so results are always
 * consistent with the rest of the app.
 */
import React, { useState, useMemo } from 'react';
import { runProFormaFromSettings } from './FinancialModelV2';
import { useModel } from './ModelContext';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Sliders } from 'lucide-react';
import ProFormaChart from './ProFormaChart';

export default function ScenarioModeler() {
  const { settings: baseSettings } = useModel();

  // Only store the fields the sliders actually override
  const [overrides, setOverrides] = useState({});

  const settings = useMemo(() => ({ ...baseSettings, ...overrides }), [baseSettings, overrides]);
  const data = useMemo(() => runProFormaFromSettings(settings), [settings]);
  const cumulative = data.reduce((s, d) => s + d.net, 0);

  const set = (key, val) => setOverrides(o => ({ ...o, [key]: val }));

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
              <Label className="text-xs text-slate-500">
                Staff Accountant Base: ${(settings.sa_base_salary).toLocaleString()}
              </Label>
              <Slider
                min={55000} max={80000} step={1000}
                value={[settings.sa_base_salary]}
                onValueChange={([v]) => set('sa_base_salary', v)}
                className="mt-2"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-500">
                Billing Specialist Base: ${(settings.bs_base_salary).toLocaleString()}
              </Label>
              <Slider
                min={48000} max={68000} step={1000}
                value={[settings.bs_base_salary]}
                onValueChange={([v]) => set('bs_base_salary', v)}
                className="mt-2"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-500">
                Wage Growth: {(settings.wage_growth_rate * 100).toFixed(1)}%
              </Label>
              <Slider
                min={0.02} max={0.06} step={0.005}
                value={[settings.wage_growth_rate]}
                onValueChange={([v]) => set('wage_growth_rate', v)}
                className="mt-2"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-500">
                In-House Collection Rate: {(settings.inhouse_steady_rate * 100).toFixed(1)}%
              </Label>
              <Slider
                min={0.85} max={0.95} step={0.005}
                value={[settings.inhouse_steady_rate]}
                onValueChange={([v]) => set('inhouse_steady_rate', v)}
                className="mt-2"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-slate-600">Regional Financial Services</Label>
              <Switch
                checked={settings.regional_services_enabled !== false}
                onCheckedChange={(v) => set('regional_services_enabled', v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs text-slate-600">Transfer Station Expansion</Label>
              <Switch
                checked={settings.transfer_station_expansion !== false}
                onCheckedChange={(v) => set('transfer_station_expansion', v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs text-slate-600">EMS External Billing</Label>
              <Switch
                checked={settings.ems_external_billing !== false}
                onCheckedChange={(v) => set('ems_external_billing', v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs text-slate-600">ERP Implementation</Label>
              <Switch
                checked={settings.erp_implementation !== false}
                onCheckedChange={(v) => set('erp_implementation', v)}
              />
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