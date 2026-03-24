/**
 * BudgetLineEditor — Shows multi-year actuals + all FY27 stage columns.
 * Stages: Initial (Dept Head) → Manager → Budget Committee → Select Board → Approved
 */
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, X, MessageSquare, ChevronDown, ChevronUp, ThumbsUp, ThumbsDown } from 'lucide-react';

const fmt   = n => n != null && n !== '' ? `$${Number(n).toLocaleString()}` : '—';
const pct   = (a, b) => (b && b !== 0) ? `${((a - b) / Math.abs(b) * 100).toFixed(1)}%` : '—';
const delta = (a, b) => {
  if (a == null || b == null) return null;
  return a - b;
};

const STAGE_CONFIG = {
  initial:          { amtField: 'initial_request', notesField: 'initial_notes',   label: 'Dept. Initial Request' },
  manager:          { amtField: 'manager_amount',  notesField: 'manager_notes',   label: 'Manager Recommendation' },
  budget_committee: { amtField: 'committee_amount',notesField: 'committee_notes', label: 'Budget Committee' },
  select_board:     { amtField: 'board_amount',    notesField: 'board_notes',     label: 'Select Board' },
  approved:         { amtField: 'final_approved_amount', notesField: 'board_notes', label: 'Approved', readOnly: true },
};

export default function BudgetLineEditor({ line, activeStage, onSaved }) {
  const qc  = useQueryClient();
  const cfg = STAGE_CONFIG[activeStage];
  const [amount, setAmount] = useState('');
  const [notes, setNotes]   = useState('');
  const [open, setOpen]     = useState(false);
  const [votesYes, setVotesYes] = useState(line.board_votes_yes ?? 0);
  const [votesNo,  setVotesNo]  = useState(line.board_votes_no  ?? 0);

  const save = useMutation({
    mutationFn: (data) => base44.entities.BudgetRequest.update(line.id, data),
    onSuccess: () => { qc.invalidateQueries(['budget_requests']); setOpen(false); onSaved?.(); },
  });

  if (!cfg) return null;

  const currentAmt = line[cfg.amtField];

  const handleOpen = () => {
    setAmount(currentAmt ?? line.fy26_budget ?? line.current_year_budget ?? '');
    setNotes(line[cfg.notesField] ?? '');
    setVotesYes(line.board_votes_yes ?? 0);
    setVotesNo(line.board_votes_no ?? 0);
    setOpen(v => !v);
  };

  const handleSave = () => {
    const now = new Date().toISOString();
    const updates = {
      [cfg.amtField]:    Number(amount),
      [cfg.notesField]:  notes,
    };
    if (activeStage === 'initial')          updates.initial_submitted_at  = now;
    if (activeStage === 'manager')          updates.manager_reviewed_at   = now;
    if (activeStage === 'budget_committee') updates.committee_reviewed_at = now;
    if (activeStage === 'select_board') {
      updates.board_reviewed_at = now;
      updates.board_votes_yes   = Number(votesYes);
      updates.board_votes_no    = Number(votesNo);
      // Auto-approve if 3+ yes votes
      if (Number(votesYes) >= 3) {
        updates.final_approved_amount = Number(amount);
        updates.status         = 'approved';
        updates.workflow_stage = 'approved';
      }
    }
    save.mutate(updates);
  };

  // Build multi-year history columns
  const historyYears = [
    { label: 'FY23 Bgt', val: line.fy23_budget },
    { label: 'FY23 Act', val: line.fy23_actual },
    { label: 'FY24 Bgt', val: line.fy24_budget },
    { label: 'FY24 Act', val: line.fy24_actual },
    { label: 'FY25 Bgt', val: line.fy25_budget  ?? line.prior_year_budget },
    { label: 'FY25 Act', val: line.fy25_actual  ?? line.prior_year_actual },
    { label: 'FY26 Bgt', val: line.fy26_budget  ?? line.current_year_budget },
    { label: 'FY26 YTD', val: line.fy26_ytd     ?? line.current_year_ytd },
  ].filter(h => h.val != null);

  const fy26Budget = line.fy26_budget ?? line.current_year_budget ?? 0;
  const d = delta(currentAmt, fy26Budget);

  const isApproved = line.status === 'approved' || (line.board_votes_yes ?? 0) >= 3;

  return (
    <div className={`border-b border-slate-100 last:border-0 ${isApproved ? 'bg-emerald-50/30' : ''}`}>
      {/* Summary row */}
      <div
        className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-slate-50/80 transition-colors ${open ? 'bg-slate-50' : ''}`}
        onClick={handleOpen}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold text-slate-800 truncate">{line.account_code} — {line.account_name}</p>
            {isApproved && <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">✓ Approved</span>}
            {activeStage === 'select_board' && !isApproved && (line.board_votes_yes ?? 0) > 0 && (
              <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">
                {line.board_votes_yes ?? 0}/5 votes
              </span>
            )}
          </div>
          <div className="flex gap-2 flex-wrap mt-0.5">
            {historyYears.map(h => (
              <span key={h.label} className="text-[9px] text-slate-400">
                {h.label}: <span className="text-slate-600 font-semibold">{fmt(h.val)}</span>
              </span>
            ))}
          </div>
        </div>
        <div className="text-right flex-shrink-0 ml-2">
          <p className="text-[10px] text-slate-400">{cfg.label}</p>
          <p className="text-sm font-bold text-slate-900">{fmt(currentAmt)}</p>
          {d != null && d !== 0 && (
            <p className={`text-[10px] font-semibold ${d > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
              {d > 0 ? '+' : ''}{fmt(d)} ({pct(currentAmt, fy26Budget)})
            </p>
          )}
        </div>
        {line[cfg.notesField] && <MessageSquare className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />}
        {open ? <ChevronUp className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />}
      </div>

      {/* Expanded editor */}
      {open && (
        <div className="px-3 pb-3 pt-2 border-t border-slate-100 bg-slate-50/50 space-y-3">
          {/* Full historical table */}
          <div className="overflow-x-auto">
            <table className="w-full text-[10px] border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  {['FY23 Budget','FY23 Actual','FY24 Budget','FY24 Actual','FY25 Budget','FY25 Actual','FY26 Budget','FY26 YTD','Initial Req','Manager','Committee','Sel. Board','Approved'].map(h => (
                    <th key={h} className="px-2 py-1 text-left font-bold text-slate-500 whitespace-nowrap border border-slate-200">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {[
                    line.fy23_budget, line.fy23_actual,
                    line.fy24_budget, line.fy24_actual,
                    line.fy25_budget ?? line.prior_year_budget,
                    line.fy25_actual ?? line.prior_year_actual,
                    line.fy26_budget ?? line.current_year_budget,
                    line.fy26_ytd   ?? line.current_year_ytd,
                    line.initial_request ?? line.dept_head_request,
                    line.manager_amount  ?? line.tm_amount,
                    line.committee_amount,
                    line.board_amount,
                    line.final_approved_amount,
                  ].map((v, i) => (
                    <td key={i} className={`px-2 py-1 tabular-nums text-right border border-slate-200 ${
                      i >= 8 ? 'font-bold text-slate-800' :
                      i % 2 === 1 && v != null && (i > 0) ? 'text-slate-700' : 'text-slate-500'
                    }`}>{fmt(v)}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Edit controls - don't show for approved readonly */}
          {!cfg.readOnly && (
            <>
              <div className="flex gap-3 flex-wrap items-start">
                <div className="flex-1 min-w-[150px]">
                  <label className="text-[10px] font-bold text-slate-600 block mb-1">{cfg.label} Amount ($)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-slate-400 bg-white"
                  />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="text-[10px] font-bold text-slate-600 block mb-1">Notes / Justification</label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={2}
                    className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-slate-400 resize-none bg-white"
                    placeholder="Justification or comment..."
                  />
                </div>
              </div>

              {/* Select Board voting */}
              {activeStage === 'select_board' && (
                <div className="flex items-center gap-4 bg-white border border-slate-200 rounded-lg px-3 py-2">
                  <p className="text-[10px] font-bold text-slate-600">Select Board Vote (need 3 of 5 to approve):</p>
                  <div className="flex items-center gap-2">
                    <ThumbsUp className="h-3.5 w-3.5 text-emerald-600" />
                    <input type="number" min={0} max={5} value={votesYes} onChange={e => setVotesYes(e.target.value)}
                      className="w-12 border border-slate-200 rounded px-2 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-emerald-400" />
                    <span className="text-[10px] text-slate-500">Yes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ThumbsDown className="h-3.5 w-3.5 text-red-500" />
                    <input type="number" min={0} max={5} value={votesNo} onChange={e => setVotesNo(e.target.value)}
                      className="w-12 border border-slate-200 rounded px-2 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-red-400" />
                    <span className="text-[10px] text-slate-500">No</span>
                  </div>
                  {Number(votesYes) >= 3 && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Will auto-approve ✓</span>
                  )}
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <button onClick={() => setOpen(false)} className="flex items-center gap-1 text-xs border border-slate-200 px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-50">
                  <X className="h-3 w-3" /> Cancel
                </button>
                <button onClick={handleSave} disabled={save.isPending} className="flex items-center gap-1 text-xs bg-slate-900 text-white px-3 py-1.5 rounded-lg hover:bg-slate-700 disabled:opacity-50">
                  <Check className="h-3 w-3" /> {save.isPending ? 'Saving…' : 'Save'}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}