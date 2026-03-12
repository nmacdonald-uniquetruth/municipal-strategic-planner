import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, Circle, Clock, AlertTriangle, Pause } from 'lucide-react';

const statusConfig = {
  not_started: { icon: Circle, color: 'bg-slate-100 text-slate-600', label: 'Not Started' },
  in_progress: { icon: Clock, color: 'bg-blue-100 text-blue-700', label: 'In Progress' },
  completed: { icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-700', label: 'Complete' },
  blocked: { icon: AlertTriangle, color: 'bg-red-100 text-red-700', label: 'Blocked' },
  deferred: { icon: Pause, color: 'bg-amber-100 text-amber-700', label: 'Deferred' },
};

const categoryColors = {
  restructuring: 'bg-slate-800 text-white',
  erp: 'bg-violet-100 text-violet-800',
  regional_services: 'bg-blue-100 text-blue-800',
  transfer_station: 'bg-green-100 text-green-800',
  ems_billing: 'bg-rose-100 text-rose-800',
  audit: 'bg-amber-100 text-amber-800',
};

export default function MilestoneBoard() {
  const qc = useQueryClient();
  const { data: milestones = [] } = useQuery({
    queryKey: ['milestones'],
    queryFn: () => base44.entities.MilestoneTracker.list('-created_date', 50),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.MilestoneTracker.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['milestones'] }),
  });

  if (milestones.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center">
        <p className="text-sm text-slate-400">No milestones tracked yet. They will appear here once created.</p>
      </div>
    );
  }

  const grouped = milestones.reduce((acc, m) => {
    const cat = m.category || 'restructuring';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(m);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([cat, items]) => (
        <div key={cat} className="rounded-2xl border border-slate-200/60 bg-white overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center gap-2">
            <Badge className={categoryColors[cat]}>{cat.replace(/_/g, ' ')}</Badge>
            <span className="text-xs text-slate-400">{items.length} milestones</span>
          </div>
          <div className="divide-y divide-slate-50">
            {items.map((m) => {
              const st = statusConfig[m.status || 'not_started'];
              const Icon = st.icon;
              return (
                <div key={m.id} className="p-3 flex items-center gap-3 hover:bg-slate-50/50">
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{m.title}</p>
                    {m.phase && <p className="text-[10px] text-slate-400">{m.phase} · {m.responsible_party || 'TBD'}</p>}
                  </div>
                  <Select
                    value={m.status || 'not_started'}
                    onValueChange={(v) => updateMutation.mutate({ id: m.id, data: { status: v } })}
                  >
                    <SelectTrigger className="w-28 h-7 text-[10px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusConfig).map(([k, v]) => (
                        <SelectItem key={k} value={k} className="text-xs">{v.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}