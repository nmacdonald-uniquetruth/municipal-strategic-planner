import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, XCircle, Minus, Monitor, Filter } from 'lucide-react';

const CRITERIA = [
  { key: 'fund_accounting', label: 'Fund Accounting / GASB' },
  { key: 'multi_entity_support', label: 'Multi-Entity (Regional Svcs)' },
  { key: 'payroll_module', label: 'Payroll Module' },
  { key: 'hr_module', label: 'HR / HRIS Module' },
  { key: 'utility_billing_module', label: 'Utility Billing' },
  { key: 'ems_billing_module', label: 'EMS Billing' },
  { key: 'citizen_portal', label: 'Citizen Portal' },
  { key: 'maine_municipal_references', label: 'ME Municipal References' },
  { key: 'trio_migration_path', label: 'TRIO Migration Path' },
];

const STATUS_COLORS = {
  under_review: 'bg-slate-100 text-slate-600',
  shortlisted: 'bg-blue-100 text-blue-800',
  eliminated: 'bg-red-100 text-red-600',
  selected: 'bg-emerald-100 text-emerald-800',
};

const FIT_COLORS = {
  excellent: 'bg-emerald-100 text-emerald-800',
  good: 'bg-blue-100 text-blue-800',
  fair: 'bg-amber-100 text-amber-700',
  poor: 'bg-red-100 text-red-600',
};

function BoolCell({ value }) {
  if (value === true) return <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" />;
  if (value === false) return <XCircle className="h-4 w-4 text-red-400 mx-auto" />;
  return <Minus className="h-4 w-4 text-slate-300 mx-auto" />;
}

export default function ERPEvaluator() {
  const qc = useQueryClient();
  const [catFilter, setCatFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: systems = [] } = useQuery({
    queryKey: ['erp_systems'],
    queryFn: () => base44.entities.ERPSystem.list('name', 50),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ERPSystem.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['erp_systems'] }),
  });

  const filtered = systems.filter(s =>
    (catFilter === 'all' || s.category === catFilter) &&
    (statusFilter === 'all' || s.status === statusFilter)
  );

  if (systems.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center">
        <Monitor className="h-8 w-8 text-slate-300 mx-auto mb-2" />
        <p className="text-sm text-slate-400">ERP system records are loading...</p>
      </div>
    );
  }

  const categories = [...new Set(systems.map(s => s.category))];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <Filter className="h-4 w-4 text-slate-400" />
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-44 h-8 text-xs"><SelectValue placeholder="All Categories" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All Categories</SelectItem>
            {categories.map(c => <SelectItem key={c} value={c} className="text-xs">{c.replace(/_/g, ' ')}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 h-8 text-xs"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All Statuses</SelectItem>
            {['under_review','shortlisted','eliminated','selected'].map(s => (
              <SelectItem key={s} value={s} className="text-xs">{s.replace(/_/g, ' ')}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-slate-400 ml-auto">{filtered.length} systems</span>
      </div>

      {/* Feature matrix */}
      <div className="rounded-2xl border border-slate-200/60 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="text-left p-3 font-medium sticky left-0 bg-slate-900 min-w-[160px]">System</th>
                <th className="text-center p-2 font-medium">Category</th>
                <th className="text-center p-2 font-medium">Fit</th>
                <th className="text-center p-2 font-medium">Status</th>
                {CRITERIA.map(c => (
                  <th key={c.key} className="text-center p-2 font-medium min-w-[80px] text-[10px] leading-tight">{c.label}</th>
                ))}
                <th className="text-center p-2 font-medium">Score</th>
                <th className="text-left p-2 font-medium min-w-[120px]">Est. Annual</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(sys => (
                <tr key={sys.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="p-3 sticky left-0 bg-white font-semibold text-slate-900">{sys.name}</td>
                  <td className="p-2 text-center">
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full">
                      {sys.category?.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="p-2 text-center">
                    {sys.small_muni_fit && <Badge className={`${FIT_COLORS[sys.small_muni_fit]} text-[10px]`}>{sys.small_muni_fit}</Badge>}
                  </td>
                  <td className="p-2 text-center">
                    <Select value={sys.status || 'under_review'} onValueChange={v => updateMutation.mutate({ id: sys.id, data: { status: v } })}>
                      <SelectTrigger className="h-6 text-[10px] border-0 bg-transparent p-0 w-24">
                        <Badge className={`${STATUS_COLORS[sys.status || 'under_review']} cursor-pointer`}>
                          {(sys.status || 'under_review').replace(/_/g, ' ')}
                        </Badge>
                      </SelectTrigger>
                      <SelectContent>
                        {['under_review','shortlisted','eliminated','selected'].map(s => (
                          <SelectItem key={s} value={s} className="text-xs">{s.replace(/_/g, ' ')}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  {CRITERIA.map(c => (
                    <td key={c.key} className="p-2 text-center">
                      <BoolCell value={sys[c.key]} />
                    </td>
                  ))}
                  <td className="p-2 text-center font-bold text-slate-700">
                    {sys.evaluation_score ? `${sys.evaluation_score}/10` : '—'}
                  </td>
                  <td className="p-2 text-slate-600 font-mono text-[10px]">
                    {sys.est_annual_cost_low && sys.est_annual_cost_high
                      ? `$${sys.est_annual_cost_low.toLocaleString()}–$${sys.est_annual_cost_high.toLocaleString()}`
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Notes cards for shortlisted/reviewed */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.filter(s => s.pros || s.cons || s.notes).map(sys => (
          <div key={sys.id + '_note'} className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-semibold text-slate-800">{sys.name}</span>
              {sys.vendor && <span className="text-[10px] text-slate-400">{sys.vendor}</span>}
              <Badge className={FIT_COLORS[sys.small_muni_fit]}>{sys.small_muni_fit}</Badge>
            </div>
            {sys.pros && <p className="text-[10px] text-emerald-700 mb-1"><strong>✓ </strong>{sys.pros}</p>}
            {sys.cons && <p className="text-[10px] text-red-600 mb-1"><strong>✗ </strong>{sys.cons}</p>}
            {sys.notes && <p className="text-[10px] text-slate-500 italic">{sys.notes}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}