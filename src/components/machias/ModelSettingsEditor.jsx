import React, { useState } from 'react';
import { useModel } from './ModelContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, CalendarDays, ChevronDown, ChevronRight } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

function Section({ title, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <button className="w-full flex items-center justify-between p-3 hover:bg-slate-50 text-left" onClick={() => setOpen(!open)}>
        <span className="text-xs font-semibold text-slate-700">{title}</span>
        {open ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
      </button>
      {open && <div className="p-4 border-t border-slate-100 grid grid-cols-2 md:grid-cols-3 gap-3">{children}</div>}
    </div>
  );
}

function Field({ label, value, onChange, type = 'number', prefix, suffix }) {
  return (
    <div>
      <Label className="text-[10px] text-slate-500 uppercase font-medium">{label}</Label>
      <div className="relative mt-1">
        {prefix && <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">{prefix}</span>}
        <Input
          type={type}
          value={value}
          onChange={e => onChange(type === 'number' ? +e.target.value : e.target.value)}
          className={`h-8 text-xs ${prefix ? 'pl-5' : ''} ${suffix ? 'pr-8' : ''}`}
          step={type === 'number' && value < 2 ? 0.001 : 1}
        />
        {suffix && <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">{suffix}</span>}
      </div>
    </div>
  );
}

export default function ModelSettingsEditor() {
  const { settings, updateSettings } = useModel();
  const [local, setLocal] = useState(settings);
  const set = (k) => (v) => setLocal(s => ({ ...s, [k]: v }));

  const save = async () => {
    await updateSettings(local);
    toast({ title: 'Settings saved', description: 'All figures updated. Dates will ripple to milestones.' });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-900 text-white">
        <CalendarDays className="h-5 w-5" />
        <div className="flex-1">
          <h3 className="text-sm font-bold">Model Settings</h3>
          <p className="text-[10px] text-slate-400">All edits ripple through every calculation and milestone date automatically</p>
        </div>
        <Button size="sm" onClick={save} className="bg-emerald-600 hover:bg-emerald-700 h-8 text-xs">
          <Save className="h-3.5 w-3.5 mr-1" /> Save All
        </Button>
      </div>

      {/* Start Date — top level always visible */}
      <div className="rounded-xl border border-slate-200 p-4 bg-white">
        <Label className="text-xs font-semibold text-slate-700">Project Start Date</Label>
        <p className="text-[10px] text-slate-400 mb-2">All milestone and decision dates calculate from this date forward</p>
        <Input
          type="date"
          value={local.start_date || '2026-07-01'}
          onChange={e => setLocal(s => ({ ...s, start_date: e.target.value }))}
          className="h-8 text-sm w-48"
        />
      </div>

      <Section title="Personnel — Salary & Benefits Rates">
        <Field label="Staff Accountant Base" value={local.sa_base_salary} onChange={set('sa_base_salary')} prefix="$" />
        <Field label="Billing Specialist Base" value={local.bs_base_salary} onChange={set('bs_base_salary')} prefix="$" />
        <Field label="GA Coordinator Stipend" value={local.ga_stipend} onChange={set('ga_stipend')} prefix="$" />
        <Field label="Revenue Coordinator Base" value={local.rc_base_salary} onChange={set('rc_base_salary')} prefix="$" />
        <Field label="Controller Base" value={local.controller_base_salary} onChange={set('controller_base_salary')} prefix="$" />
        <Field label="Annual Wage Growth Rate" value={local.wage_growth_rate} onChange={set('wage_growth_rate')} suffix="%" />
        <div>
          <Label className="text-[10px] text-slate-500 uppercase font-medium">Default Health Tier</Label>
          <Select value={local.health_tier || 'family'} onValueChange={set('health_tier')}>
            <SelectTrigger className="h-8 mt-1 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {['individual','employee_spouse','employee_children','family'].map(t => (
                <SelectItem key={t} value={t} className="text-xs">{t.replace(/_/g, ' ')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Field label="FICA Rate" value={local.fica_rate} onChange={set('fica_rate')} suffix="%" />
        <Field label="Maine PERS Rate" value={local.pers_rate} onChange={set('pers_rate')} suffix="%" />
        <Field label="Workers' Comp Rate" value={local.wc_rate} onChange={set('wc_rate')} suffix="%" />
        <Field label="Health (Individual) Annual" value={local.health_individual_annual} onChange={set('health_individual_annual')} prefix="$" />
        <Field label="Health (Family) Annual" value={local.health_family_annual} onChange={set('health_family_annual')} prefix="$" />
      </Section>

      <Section title="EMS Billing Assumptions">
        <Field label="Annual Transports (FY24-25)" value={local.ems_transports} onChange={set('ems_transports')} />
        <Field label="Avg Revenue / Transport" value={local.avg_revenue_per_transport} onChange={set('avg_revenue_per_transport')} prefix="$" />
        <Field label="Comstar Fee Rate (confirmed 5.22%)" value={local.comstar_fee_rate} onChange={set('comstar_fee_rate')} />
        <Field label="Comstar Collection Rate (87.4%)" value={local.comstar_collection_rate} onChange={set('comstar_collection_rate')} />
        <Field label="In-House Y1 Ramp Rate (85.5%)" value={local.inhouse_y1_rate} onChange={set('inhouse_y1_rate')} />
        <Field label="In-House Steady State Target (90%)" value={local.inhouse_steady_rate} onChange={set('inhouse_steady_rate')} />
        <Field label="Transport Volume Growth" value={local.transport_growth_rate} onChange={set('transport_growth_rate')} />
      </Section>

      <Section title="Enterprise Fund Transfers (FY2026 Actuals)">
        <Field label="Ambulance Fund" value={local.ambulance_transfer} onChange={set('ambulance_transfer')} prefix="$" />
        <Field label="Sewer Fund" value={local.sewer_transfer} onChange={set('sewer_transfer')} prefix="$" />
        <Field label="Transfer Station" value={local.ts_transfer} onChange={set('ts_transfer')} prefix="$" />
        <Field label="Telebusiness Center" value={local.telebusiness_transfer} onChange={set('telebusiness_transfer')} prefix="$" />
        <Field label="7 Court Street" value={local.court_st_transfer} onChange={set('court_st_transfer')} prefix="$" />
        <Field label="Enterprise Transfer Growth" value={local.enterprise_growth_rate} onChange={set('enterprise_growth_rate')} />
      </Section>

      <Section title="Regional Financial Services Pricing">
        <Field label="Roque Bluffs Annual" value={local.rb_annual_contract} onChange={set('rb_annual_contract')} prefix="$" />
        <Field label="Machiasport Annual" value={local.machiasport_annual_contract} onChange={set('machiasport_annual_contract')} prefix="$" />
        <Field label="Marshfield Annual" value={local.marshfield_annual_contract} onChange={set('marshfield_annual_contract')} prefix="$" />
        <Field label="Whitneyville Annual" value={local.whitneyville_annual_contract} onChange={set('whitneyville_annual_contract')} prefix="$" />
        <Field label="Northfield Annual" value={local.northfield_annual_contract} onChange={set('northfield_annual_contract')} prefix="$" />
      </Section>

      <Section title="ERP Implementation">
        <Field label="Implementation Cost" value={local.erp_y1_cost} onChange={set('erp_y1_cost')} prefix="$" />
        <Field label="Designated Fund Offset" value={local.erp_designated_fund_offset} onChange={set('erp_designated_fund_offset')} prefix="$" />
        <Field label="Annual Ongoing Cost" value={local.erp_ongoing_cost} onChange={set('erp_ongoing_cost')} prefix="$" />
        <Field label="Annual Value (conservative)" value={local.erp_annual_value} onChange={set('erp_annual_value')} prefix="$" />
      </Section>

      <Section title="Structural Savings & Risk">
        <Field label="Stipend Elimination" value={local.stipend_elimination} onChange={set('stipend_elimination')} prefix="$" />
        <Field label="Airport Savings" value={local.airport_savings} onChange={set('airport_savings')} prefix="$" />
        <Field label="Control Risk Exposure" value={local.control_risk_exposure} onChange={set('control_risk_exposure')} prefix="$" />
        <Field label="FD Fully Loaded Cost" value={local.fd_loaded_cost} onChange={set('fd_loaded_cost')} prefix="$" />
        <Field label="TM Fully Loaded Cost" value={local.tm_loaded_cost} onChange={set('tm_loaded_cost')} prefix="$" />
      </Section>

      <Section title="Tax & Fund Balance">
        <Field label="GF Undesignated Balance" value={local.gf_undesignated_balance} onChange={set('gf_undesignated_balance')} prefix="$" />
        <Field label="Ambulance Fund Balance" value={local.ambulance_fund_balance} onChange={set('ambulance_fund_balance')} prefix="$" />
        <Field label="Ambulance Loan Payoff" value={local.ambulance_loan_payoff} onChange={set('ambulance_loan_payoff')} prefix="$" />
        <Field label="Total Assessed Value" value={local.total_assessed_value} onChange={set('total_assessed_value')} prefix="$" />
        <Field label="Current Mill Rate" value={local.current_mill_rate} onChange={set('current_mill_rate')} />
        <Field label="Annual Tax Levy" value={local.annual_tax_levy} onChange={set('annual_tax_levy')} prefix="$" />
      </Section>
    </div>
  );
}