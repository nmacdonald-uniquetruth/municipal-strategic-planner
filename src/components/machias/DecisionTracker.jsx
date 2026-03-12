import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const statusColors = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-800',
  tabled: 'bg-slate-100 text-slate-600',
  needs_info: 'bg-blue-100 text-blue-700',
};

export default function DecisionTracker() {
  const qc = useQueryClient();
  const { data: decisions = [] } = useQuery({
    queryKey: ['decisions'],
    queryFn: () => base44.entities.DecisionLog.list('-created_date', 50),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.DecisionLog.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['decisions'] }),
  });

  if (decisions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center">
        <p className="text-sm text-slate-400">No decisions logged yet. They will appear here once created.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white overflow-hidden">
      <div className="divide-y divide-slate-50">
        {decisions.map((d) => (
          <div key={d.id} className="p-4 hover:bg-slate-50/50 transition-colors">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-slate-900">{d.title}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-[10px]">{d.category?.replace(/_/g, ' ')}</Badge>
                  <span className="text-[10px] text-slate-400">{d.decision_body?.replace(/_/g, ' ')}</span>
                  {d.financial_impact && (
                    <span className={`text-[10px] font-mono ${d.financial_impact > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {d.financial_impact > 0 ? '+' : ''}${d.financial_impact.toLocaleString()}/yr
                    </span>
                  )}
                </div>
              </div>
              <Select
                value={d.status || 'pending'}
                onValueChange={(v) => updateMutation.mutate({ id: d.id, data: { status: v } })}
              >
                <SelectTrigger className="w-28 h-7 text-[10px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusColors).map(([k]) => (
                    <SelectItem key={k} value={k} className="text-xs">{k.replace(/_/g, ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {d.description && <p className="text-xs text-slate-500 mt-1">{d.description}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}