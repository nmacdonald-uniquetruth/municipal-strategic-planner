import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useModel } from './ModelContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Pencil, Trash2, Plus, CheckCircle2, DollarSign } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

const HEALTH_TIERS = {
  individual: 17721,
  employee_spouse: 30938,
  employee_children: 24437,
  family: 30938,
  none: 0,
};

function computeFL(pos, settings) {
  if (pos.is_stipend) return pos.base_salary;
  const health = HEALTH_TIERS[pos.health_tier] ?? HEALTH_TIERS.family;
  const fica = pos.include_fica ? pos.base_salary * settings.fica_rate : 0;
  const pers = pos.include_pers ? pos.base_salary * settings.pers_rate : 0;
  const wc = pos.include_wc ? pos.base_salary * settings.wc_rate : 0;
  return Math.round(pos.base_salary + fica + pers + wc + health);
}

const EMPTY = {
  title: '',
  department: '',
  status: 'phase1',
  base_salary: 65000,
  is_stipend: false,
  hire_month_offset: 1,
  partial_year_months_y1: 12,
  fund_source: 'general_fund',
  health_tier: 'family',
  include_fica: true,
  include_pers: true,
  include_wc: true,
  trigger_description: '',
  notes: '',
  sort_order: 0,
};

const STATUS_COLORS = {
  phase1: 'bg-emerald-100 text-emerald-800',
  trigger_based: 'bg-amber-100 text-amber-800',
  proposed: 'bg-blue-100 text-blue-800',
  eliminated: 'bg-red-100 text-red-600',
};

export default function PositionEditor() {
  const qc = useQueryClient();
  const { settings } = useModel();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);

  const { data: positions = [] } = useQuery({
    queryKey: ['positions'],
    queryFn: () => base44.entities.PositionConfig.list('sort_order', 20),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => editing?.id
      ? base44.entities.PositionConfig.update(editing.id, data)
      : base44.entities.PositionConfig.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['positions'] }); setEditing(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PositionConfig.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['positions'] }),
  });

  const openEdit = (pos) => { setEditing(pos); setForm({ ...EMPTY, ...pos }); };
  const openNew = () => { setEditing({}); setForm({ ...EMPTY, sort_order: positions.length }); };
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const fl = computeFL(form, settings);
  const y1Cost = form.is_stipend ? Math.round(form.base_salary * (form.partial_year_months_y1 / 12)) : Math.round(fl * (form.partial_year_months_y1 / 12));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs text-slate-500">Click any position to edit. Changes recalculate the pro forma.</p>
        <Button size="sm" onClick={openNew} className="h-7 text-xs gap-1">
          <Plus className="h-3.5 w-3.5" /> Add Position
        </Button>
      </div>

      {positions.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center">
          <p className="text-sm text-slate-400">No positions configured. Click "Add Position" or they will load from defaults.</p>
        </div>
      )}

      <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200/60 bg-white overflow-hidden">
        {positions.map(pos => {
          const posFL = computeFL(pos, settings);
          const posY1 = pos.is_stipend ? Math.round(pos.base_salary * (pos.partial_year_months_y1 / 12)) : Math.round(posFL * (pos.partial_year_months_y1 / 12));
          return (
            <div key={pos.id} className="flex items-center gap-3 p-3 hover:bg-slate-50/50">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-900">{pos.title}</span>
                  <Badge className={STATUS_COLORS[pos.status]}>{pos.status?.replace(/_/g, ' ')}</Badge>
                  {pos.fund_source && <span className="text-[10px] text-slate-400">{pos.fund_source.replace(/_/g, ' ')}</span>}
                </div>
                <div className="flex gap-3 mt-1 text-[10px] text-slate-500">
                  <span>Base: <strong>${pos.base_salary?.toLocaleString()}</strong></span>
                  <span>Fully loaded: <strong>${posFL.toLocaleString()}</strong></span>
                  <span>Y1 cost ({pos.partial_year_months_y1}mo): <strong>${posY1.toLocaleString()}</strong></span>
                  <span>Hire: M{pos.hire_month_offset}</span>
                </div>
              </div>
              <button onClick={() => openEdit(pos)} className="p-1.5 rounded-lg hover:bg-slate-100">
                <Pencil className="h-3.5 w-3.5 text-slate-500" />
              </button>
              <button onClick={() => deleteMutation.mutate(pos.id)} className="p-1.5 rounded-lg hover:bg-red-50">
                <Trash2 className="h-3.5 w-3.5 text-red-400" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? 'Edit Position' : 'Add Position'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="text-xs">Position Title</Label>
                <Input value={form.title} onChange={e => set('title', e.target.value)} className="mt-1 h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Base Salary / Stipend Amount</Label>
                <Input type="number" value={form.base_salary} onChange={e => set('base_salary', +e.target.value)} className="mt-1 h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Fund Source</Label>
                <Select value={form.fund_source} onValueChange={v => set('fund_source', v)}>
                  <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['general_fund','ambulance_fund','airport_budget','regional_revenue','enterprise_fund'].map(f => (
                      <SelectItem key={f} value={f} className="text-xs">{f.replace(/_/g, ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Status</Label>
                <Select value={form.status} onValueChange={v => set('status', v)}>
                  <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['phase1','trigger_based','proposed','eliminated'].map(s => (
                      <SelectItem key={s} value={s} className="text-xs">{s.replace(/_/g, ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Health Tier</Label>
                <Select value={form.health_tier} onValueChange={v => set('health_tier', v)}>
                  <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(HEALTH_TIERS).map(t => (
                      <SelectItem key={t} value={t} className="text-xs">{t.replace(/_/g, ' ')} (${HEALTH_TIERS[t].toLocaleString()}/yr)</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Hire Month Offset</Label>
                <Input type="number" value={form.hire_month_offset} onChange={e => set('hire_month_offset', +e.target.value)} className="mt-1 h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Y1 Months Active</Label>
                <Input type="number" min={1} max={12} value={form.partial_year_months_y1} onChange={e => set('partial_year_months_y1', +e.target.value)} className="mt-1 h-8 text-sm" />
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Switch checked={form.is_stipend} onCheckedChange={v => set('is_stipend', v)} id="stipend" />
                <Label htmlFor="stipend" className="text-xs">Stipend (no benefits)</Label>
              </div>
              {!form.is_stipend && <>
                <div className="flex items-center gap-2">
                  <Switch checked={form.include_fica} onCheckedChange={v => set('include_fica', v)} id="fica" />
                  <Label htmlFor="fica" className="text-xs">FICA</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={form.include_pers} onCheckedChange={v => set('include_pers', v)} id="pers" />
                  <Label htmlFor="pers" className="text-xs">Maine PERS</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={form.include_wc} onCheckedChange={v => set('include_wc', v)} id="wc" />
                  <Label htmlFor="wc" className="text-xs">Workers' Comp</Label>
                </div>
              </>}
            </div>

            {form.status === 'trigger_based' && (
              <div>
                <Label className="text-xs">Trigger Description</Label>
                <Input value={form.trigger_description} onChange={e => set('trigger_description', e.target.value)} className="mt-1 h-8 text-xs" />
              </div>
            )}

            <div>
              <Label className="text-xs">Notes</Label>
              <Input value={form.notes} onChange={e => set('notes', e.target.value)} className="mt-1 h-8 text-xs" />
            </div>

            {/* Live preview */}
            <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
              <p className="text-[10px] text-slate-400 font-medium uppercase mb-2">Live Cost Preview</p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div><span className="text-slate-500">Fully Loaded:</span> <strong>${fl.toLocaleString()}</strong></div>
                <div><span className="text-slate-500">Y1 Cost:</span> <strong>${y1Cost.toLocaleString()}</strong></div>
                <div><span className="text-slate-500">Health:</span> <strong>${HEALTH_TIERS[form.health_tier]?.toLocaleString()}/yr</strong></div>
                {!form.is_stipend && <>
                  <div><span className="text-slate-500">FICA:</span> ${Math.round(form.base_salary * settings.fica_rate).toLocaleString()}</div>
                  <div><span className="text-slate-500">PERS:</span> ${Math.round(form.base_salary * settings.pers_rate).toLocaleString()}</div>
                  <div><span className="text-slate-500">WC:</span> ${Math.round(form.base_salary * settings.wc_rate).toLocaleString()}</div>
                </>}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEditing(null)}>Cancel</Button>
            <Button size="sm" onClick={() => saveMutation.mutate(form)}>
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Save Position
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}