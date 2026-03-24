import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, X, MessageSquare } from 'lucide-react';

const fmt = n => n != null ? `$${Number(n).toLocaleString()}` : '—';

const STAGE_CONFIG = {
  dept_head:        { amtField: 'dept_head_request',  notesField: 'dept_head_notes',  label: 'Dept. Request',      nextStage: 'finance_director', nextStatus: 'fd_tm_review' },
  finance_director: { amtField: 'fd_amount',          notesField: 'fd_notes',         label: 'FD Adjustment',      nextStage: 'town_manager',     nextStatus: 'fd_tm_review' },
  town_manager:     { amtField: 'tm_amount',          notesField: 'tm_notes',         label: 'TM Adjustment',      nextStage: 'budget_committee', nextStatus: 'committee_review' },
  budget_committee: { amtField: 'committee_amount',   notesField: 'committee_notes',  label: 'Committee Amount',   nextStage: 'select_board',     nextStatus: 'board_review' },
  select_board:     { amtField: 'board_amount',       notesField: 'board_notes',      label: 'Board Final',        nextStage: 'final',            nextStatus: 'approved' },
};

export default function BudgetLineEditor({ line, activeStage, onSaved }) {
  const qc = useQueryClient();
  const cfg = STAGE_CONFIG[activeStage];
  const [amount, setAmount] = useState(line[cfg?.amtField] ?? line.current_year_budget ?? 0);
  const [notes, setNotes]   = useState(line[cfg?.notesField] ?? '');
  const [open, setOpen]     = useState(false);

  const save = useMutation({
    mutationFn: (data) => base44.entities.BudgetRequest.update(line.id, data),
    onSuccess: () => { qc.invalidateQueries(['budget_requests']); setOpen(false); onSaved?.(); },
  });

  if (!cfg) return null;

  const handleSave = () => {
    const now = new Date().toISOString();
    const tsField = `${activeStage === 'dept_head' ? 'dept_head' : activeStage}_${activeStage === 'dept_head' ? 'submitted' : 'reviewed'}_at`;
    save.mutate({ [cfg.amtField]: Number(amount), [cfg.notesField]: notes, [tsField]: now });
  };

  // Read-only display of prior stages
  const priorAmounts = [
    { label: 'FY25 Actual', val: line.prior_year_actual },
    { label: 'FY26 Budget', val: line.current_year_budget },
    { label: 'FY26 YTD',   val: line.current_year_ytd },
    line.dept_head_request != null && { label: 'Dept Req', val: line.dept_head_request },
    line.fd_amount != null         && { label: 'FD Amt',   val: line.fd_amount },
    line.tm_amount != null         && { label: 'TM Amt',   val: line.tm_amount },
    line.committee_amount != null  && { label: 'Comm Amt', val: line.committee_amount },
  ].filter(Boolean);

  return (
    <div className="border border-slate-200 rounded-lg bg-white">
      {/* Summary row */}
      <div className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer" onClick={() => setOpen(v => !v)}>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-800 truncate">{line.account_code} — {line.account_name}</p>
          <div className="flex gap-3 flex-wrap mt-0.5">
            {priorAmounts.map(p => (
              <span key={p.label} className="text-[9px] text-slate-400">{p.label}: <span className="text-slate-600 font-semibold">{fmt(p.val)}</span></span>
            ))}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-[10px] text-slate-400">{cfg.label}</p>
          <p className="text-sm font-bold text-slate-900">{fmt(line[cfg.amtField])}</p>
        </div>
        {line[cfg.notesField] && <MessageSquare className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />}
      </div>

      {/* Inline editor */}
      {open && (
        <div className="px-3 pb-3 border-t border-slate-100 pt-2 space-y-2">
          <div className="flex gap-2 items-center">
            <label className="text-[10px] font-bold text-slate-600 w-28 flex-shrink-0">{cfg.label} ($)</label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="flex-1 border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>
          <div className="flex gap-2 items-start">
            <label className="text-[10px] font-bold text-slate-600 w-28 flex-shrink-0 pt-1">Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              className="flex-1 border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-slate-400 resize-none"
              placeholder="Add comment or justification..."
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setOpen(false)} className="flex items-center gap-1 text-xs border border-slate-200 px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-50">
              <X className="h-3 w-3" /> Cancel
            </button>
            <button onClick={handleSave} disabled={save.isPending} className="flex items-center gap-1 text-xs bg-slate-900 text-white px-3 py-1.5 rounded-lg hover:bg-slate-700 disabled:opacity-50">
              <Check className="h-3 w-3" /> Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}