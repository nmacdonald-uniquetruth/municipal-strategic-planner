import React from 'react';
import { ENTERPRISE_FUNDS } from './FinancialModel';
import { Badge } from '@/components/ui/badge';
import { Landmark } from 'lucide-react';

const statusBadge = {
  HEALTHY: 'bg-emerald-100 text-emerald-800',
  DEFICIT: 'bg-red-100 text-red-800',
  CRITICAL: 'bg-red-100 text-red-800',
  MARGINAL: 'bg-amber-100 text-amber-800',
};

export default function EnterpriseFundTable() {
  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white overflow-hidden">
      <div className="p-5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Landmark className="h-4 w-4 text-slate-600" />
          <h3 className="text-sm font-semibold text-slate-700">Enterprise Fund Sustainability</h3>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="text-left p-3 font-medium text-slate-500">Fund</th>
              <th className="text-right p-3 font-medium text-slate-500">Balance</th>
              <th className="text-right p-3 font-medium text-slate-500">Transfer</th>
              <th className="text-right p-3 font-medium text-slate-500">Net After Loan</th>
              <th className="text-center p-3 font-medium text-slate-500">Status</th>
              <th className="text-left p-3 font-medium text-slate-500">Action</th>
            </tr>
          </thead>
          <tbody>
            {ENTERPRISE_FUNDS.map((f) => (
              <tr key={f.fund} className="border-b border-slate-50 hover:bg-slate-50/50">
                <td className="p-3 font-medium text-slate-900">{f.fund}</td>
                <td className={`p-3 text-right font-mono ${f.balance < 0 ? 'text-red-600' : 'text-slate-700'}`}>
                  ${f.balance.toLocaleString()}
                </td>
                <td className="p-3 text-right font-mono text-slate-600">${f.transfer.toLocaleString()}</td>
                <td className={`p-3 text-right font-mono ${f.netBalance < 0 ? 'text-red-600' : 'text-slate-700'}`}>
                  ${f.netBalance.toLocaleString()}
                </td>
                <td className="p-3 text-center">
                  <Badge className={statusBadge[f.status]}>{f.status}</Badge>
                </td>
                <td className="p-3 text-slate-600">{f.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}