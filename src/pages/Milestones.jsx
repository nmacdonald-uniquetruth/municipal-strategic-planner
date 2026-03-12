import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useModel } from '../components/machias/ModelContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { SectionHeader } from '../components/machias/SectionHeader';
import { ClipboardList, Gavel, Plus, Pencil, Trash2, CalendarDays, CheckCircle2, Circle, Clock, AlertTriangle } from 'lucide-react';
import DecisionTracker from '../components/machias/DecisionTracker';
import SectionHdr from '../components/machias/SectionHeader';

const STATUS_CONFIG = {
  not_started: { icon: Circle, color: 'bg-slate-100 text-slate-600', label: 'Not Started' },
  in_progress: { icon: Clock, color: 'bg-blue-100 text-blue-700', label: 'In Progress' },
  completed: { icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-700', label: 'Complete' },
  blocked: { icon: AlertTriangle, color: 'bg-red-100 text-red-700', label: 'Blocked' },
  deferred: { icon: AlertTriangle, color: 'bg-amber-100 text-amber-700', label: 'Deferred' },
};

const CAT_COLORS = {
  restructuring: 'bg-slate-800 text-white',
  erp: 'bg-violet-100 text-violet-800',
  regional_services: 'bg-blue-100 text-blue-800',
  transfer_station: 'bg-green-100 text-green-800',
  ems_billing: 'bg-rose-100 text-rose-800',
  audit: 'bg-amber-100 text-amber-800',
};

const PRI_COLORS = {
  critical: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-slate-100 text-slate-600',
};

const EMPTY_M = { title: '', category: 'restructuring', phase: '', priority: 'medium', status: 'not_started', responsible_party: '', dependencies: '', notes: '', target_date: '' };
const EMPTY_D = { title: '', category: 'staffing', status: 'pending', decision_body: 'select_board', financial_impact: 0, description: '', rationale: '', decision_date: '' };

export default function Milestones() {
  const qc = useQueryClient();
  const { settings, milestoneDates } = useModel();
  const startDate = settings.start_date || '2026-07-01';

  const [editingM, setEditingM] = useState(null);
  const [formM, setFormM] = useState(EMPTY_M);
  const [editingD, setEditingD] = useState(null);
  const [formD, setFormD] = useState(EMPTY_D);
  const [catFilter, setCatFilter] = useState('all');

  const { data: milestones = [] } = useQuery({ queryKey: ['milestones'], queryFn: () => base44.entities.MilestoneTracker.list('-created_date', 100) });
  const { data: decisions = [] } = useQuery({ queryKey: ['decisions'], queryFn: () => base44.entities.DecisionLog.list('-created_date', 50) });

  const saveMilestone = useMutation({
    mutationFn: d => editingM?.id ? base44.entities.MilestoneTracker.update(editingM.id, d) : base44.entities.MilestoneTracker.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['milestones'] }); setEditingM(null); },
  });
  const delMilestone = useMutation({ mutationFn: id => base44.entities.MilestoneTracker.delete(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['milestones'] }) });
  const updateMilestoneStatus = useMutation({
    mutationFn: ({ id, data }) => base44.entities.MilestoneTracker.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['milestones'] }),
  });

  const saveDecision = useMutation({
    mutationFn: d => editingD?.id ? base44.entities.DecisionLog.update(editingD.id, d) : base44.entities.DecisionLog.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['decisions'] }); setEditingD(null); },
  });
  const delDecision = useMutation({ mutationFn: id => base44.entities.DecisionLog.delete(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['decisions'] }) });
  const updateDecisionStatus = useMutation({
    mutationFn: ({ id, data }) => base44.entities.DecisionLog.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['decisions'] }),
  });

  const filtered = catFilter === 'all' ? milestones : milestones.filter(m => m.category === catFilter);
  const grouped = filtered.reduce((acc, m) => { const c = m.category || 'restructuring'; (acc[c] = acc[c] || []).push(m); return acc; }, {});

  return (
    <div className="space-y-8">
      <SectionHdr title="Implementation Milestones & Decision Log" subtitle={`Start date: ${startDate} — dates ripple from this anchor`} icon={ClipboardList} />

      <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-700">
        <CalendarDays className="h-4 w-4 flex-shrink-0" />
        <span><strong>Start date: {startDate}.</strong> Change it in Model Settings → all dates recalculate automatically.
          SA target: {milestoneDates.saHire} · BS target: {milestoneDates.bsHire} · Comstar cutover: {milestoneDates.comstarCutover} · ERP go-live: {milestoneDates.erpGoLive}</span>
      </div>

      {/* Milestone section */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {['all','restructuring','erp','regional_services','transfer_station','ems_billing','audit'].map(c => (
            <button key={c} onClick={() => setCatFilter(c)} className={`text-[10px] px-2.5 py-1 rounded-full font-medium transition-colors ${catFilter === c ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {c.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
        <Button size="sm" className="h-7 text-xs gap-1" onClick={() => { setEditingM({}); setFormM(EMPTY_M); }}>
          <Plus className="h-3.5 w-3.5" /> Add Milestone
        </Button>
      </div>

      {Object.entries(grouped).map(([cat, items]) => (
        <div key={cat} className="rounded-2xl border border-slate-200/60 bg-white overflow-hidden">
          <div className="p-3 border-b border-slate-100 flex items-center gap-2">
            <Badge className={CAT_COLORS[cat]}>{cat.replace(/_/g, ' ')}</Badge>
            <span className="text-xs text-slate-400">{items.length} items</span>
          </div>
          <div className="divide-y divide-slate-50">
            {items.map(m => {
              const st = STATUS_CONFIG[m.status || 'not_started'];
              const Icon = st.icon;
              return (
                <div key={m.id} className="flex items-center gap-3 p-3 hover:bg-slate-50/50">
                  <Icon className="h-4 w-4 flex-shrink-0 text-slate-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{m.title}</p>
                    <div className="flex gap-2 mt-0.5 flex-wrap">
                      {m.target_date && <span className="text-[10px] text-slate-400">{m.target_date}</span>}
                      {m.phase && <span className="text-[10px] text-slate-400">{m.phase}</span>}
                      {m.priority && <Badge className={`${PRI_COLORS[m.priority]} text-[10px] py-0`}>{m.priority}</Badge>}
                      {m.responsible_party && <span className="text-[10px] text-slate-400">→ {m.responsible_party}</span>}
                    </div>
                  </div>
                  <Select value={m.status || 'not_started'} onValueChange={v => updateMilestoneStatus.mutate({ id: m.id, data: { status: v } })}>
                    <SelectTrigger className="w-28 h-6 text-[10px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_CONFIG).map(([k, v]) => <SelectItem key={k} value={k} className="text-xs">{v.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <button onClick={() => { setEditingM(m); setFormM({ ...EMPTY_M, ...m }); }} className="p-1 hover:bg-slate-100 rounded"><Pencil className="h-3.5 w-3.5 text-slate-400" /></button>
                  <button onClick={() => delMilestone.mutate(m.id)} className="p-1 hover:bg-red-50 rounded"><Trash2 className="h-3.5 w-3.5 text-red-400" /></button>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Decision log */}
      <div className="flex items-center justify-between mt-4">
        <SectionHdr title="Decision Log" subtitle="Track decisions requiring Select Board, Town Manager, or committee action" icon={Gavel} />
        <Button size="sm" className="h-7 text-xs gap-1" onClick={() => { setEditingD({}); setFormD(EMPTY_D); }}>
          <Plus className="h-3.5 w-3.5" /> Add Decision
        </Button>
      </div>

      <div className="rounded-2xl border border-slate-200/60 bg-white overflow-hidden divide-y divide-slate-50">
        {decisions.map(d => (
          <div key={d.id} className="flex items-start gap-3 p-4 hover:bg-slate-50/50">
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-slate-900">{d.title}</h4>
              <div className="flex flex-wrap gap-2 mt-1">
                <Badge variant="outline" className="text-[10px]">{d.category?.replace(/_/g, ' ')}</Badge>
                <span className="text-[10px] text-slate-400">{d.decision_body?.replace(/_/g, ' ')}</span>
                {d.decision_date && <span className="text-[10px] text-slate-400">{d.decision_date}</span>}
                {d.financial_impact != null && d.financial_impact !== 0 && (
                  <span className={`text-[10px] font-mono ${d.financial_impact > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {d.financial_impact > 0 ? '+' : ''}${d.financial_impact?.toLocaleString()}/yr
                  </span>
                )}
              </div>
              {d.description && <p className="text-xs text-slate-500 mt-1">{d.description}</p>}
            </div>
            <Select value={d.status || 'pending'} onValueChange={v => updateDecisionStatus.mutate({ id: d.id, data: { status: v } })}>
              <SelectTrigger className="w-28 h-6 text-[10px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {['pending','approved','rejected','tabled','needs_info'].map(s => <SelectItem key={s} value={s} className="text-xs">{s.replace(/_/g, ' ')}</SelectItem>)}
              </SelectContent>
            </Select>
            <button onClick={() => { setEditingD(d); setFormD({ ...EMPTY_D, ...d }); }} className="p-1 hover:bg-slate-100 rounded"><Pencil className="h-3.5 w-3.5 text-slate-400" /></button>
            <button onClick={() => delDecision.mutate(d.id)} className="p-1 hover:bg-red-50 rounded"><Trash2 className="h-3.5 w-3.5 text-red-400" /></button>
          </div>
        ))}
      </div>

      {/* Milestone edit dialog */}
      <Dialog open={!!editingM} onOpenChange={o => !o && setEditingM(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingM?.id ? 'Edit Milestone' : 'Add Milestone'}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label className="text-xs">Title</Label><Input value={formM.title} onChange={e => setFormM(f => ({ ...f, title: e.target.value }))} className="mt-1 h-8 text-sm" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Category</Label>
                <Select value={formM.category} onValueChange={v => setFormM(f => ({ ...f, category: v }))}>
                  <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{['restructuring','erp','regional_services','transfer_station','ems_billing','audit'].map(c => <SelectItem key={c} value={c} className="text-xs">{c.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Priority</Label>
                <Select value={formM.priority} onValueChange={v => setFormM(f => ({ ...f, priority: v }))}>
                  <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{['critical','high','medium','low'].map(p => <SelectItem key={p} value={p} className="text-xs">{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Target Date</Label><Input type="date" value={formM.target_date || ''} onChange={e => setFormM(f => ({ ...f, target_date: e.target.value }))} className="mt-1 h-8 text-xs" /></div>
              <div><Label className="text-xs">Phase</Label><Input value={formM.phase || ''} onChange={e => setFormM(f => ({ ...f, phase: e.target.value }))} className="mt-1 h-8 text-xs" /></div>
              <div className="col-span-2"><Label className="text-xs">Responsible Party</Label><Input value={formM.responsible_party || ''} onChange={e => setFormM(f => ({ ...f, responsible_party: e.target.value }))} className="mt-1 h-8 text-xs" /></div>
              <div className="col-span-2"><Label className="text-xs">Dependencies</Label><Input value={formM.dependencies || ''} onChange={e => setFormM(f => ({ ...f, dependencies: e.target.value }))} className="mt-1 h-8 text-xs" /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEditingM(null)}>Cancel</Button>
            <Button size="sm" onClick={() => saveMilestone.mutate(formM)}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Decision edit dialog */}
      <Dialog open={!!editingD} onOpenChange={o => !o && setEditingD(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingD?.id ? 'Edit Decision' : 'Add Decision'}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label className="text-xs">Title</Label><Input value={formD.title} onChange={e => setFormD(f => ({ ...f, title: e.target.value }))} className="mt-1 h-8 text-sm" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Category</Label>
                <Select value={formD.category} onValueChange={v => setFormD(f => ({ ...f, category: v }))}>
                  <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{['staffing','erp','regional_services','transfer_station','ems_billing','budget','policy'].map(c => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Decision Body</Label>
                <Select value={formD.decision_body} onValueChange={v => setFormD(f => ({ ...f, decision_body: v }))}>
                  <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{['select_board','town_manager','finance_director','budget_committee','town_meeting'].map(b => <SelectItem key={b} value={b} className="text-xs">{b.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Target Date</Label><Input type="date" value={formD.decision_date || ''} onChange={e => setFormD(f => ({ ...f, decision_date: e.target.value }))} className="mt-1 h-8 text-xs" /></div>
              <div><Label className="text-xs">Financial Impact ($/yr)</Label><Input type="number" value={formD.financial_impact || 0} onChange={e => setFormD(f => ({ ...f, financial_impact: +e.target.value }))} className="mt-1 h-8 text-xs" /></div>
              <div className="col-span-2"><Label className="text-xs">Description</Label><Input value={formD.description || ''} onChange={e => setFormD(f => ({ ...f, description: e.target.value }))} className="mt-1 h-8 text-xs" /></div>
              <div className="col-span-2"><Label className="text-xs">Rationale</Label><Input value={formD.rationale || ''} onChange={e => setFormD(f => ({ ...f, rationale: e.target.value }))} className="mt-1 h-8 text-xs" /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEditingD(null)}>Cancel</Button>
            <Button size="sm" onClick={() => saveDecision.mutate(formD)}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}