/**
 * DepartmentBudgetTable — Multi-column department budget review table
 * Shows all budget stages side-by-side with variance and approval status.
 */
import React, { useState } from 'react';
import { ChevronDown, ChevronRight, CheckCircle, Circle, AlertTriangle, Pencil, Link2 } from 'lucide-react';
import { FUND_LABELS, JUSTIFICATION_TAGS, resolveActiveColumn, getColumnLabel, groupDeptsByFund, computeVariance } from './budgetProcessEngine';
import TraceabilityPanel from '../budget/TraceabilityPanel';

const fmt = n => n == null || n === 0 ? '—' : `$${Math.round(Math.abs(n)).toLocaleString()}`;
const diff = (a, b) => {
  if (!b || !a) return null;
  const d = a - b;
  const pct = ((d / Math.abs(b)) * 100).toFixed(1);
  return { d, pct, color: d > 0 ? 'text-red-600' : d < 0 ? 'text-emerald-600' : 'text-slate-400' };
};

const DISPLAY_COLS = ['prior_year_budget','prior_year_actual','current_year_budget','ytd_actual','projected_year_end'];

function ApprovalBadge({ approved, label }) {
  return approved
    ? <span className="flex items-center gap-0.5 text-[9px] text-emerald-600 font-semibold"><CheckCircle className="h-2.5 w-2.5" />{label}</span>
    : <span className="flex items-center gap-0.5 text-[9px] text-slate-400"><Circle className="h-2.5 w-2.5" />{label}</span>;
}

function DeptRow({ dept, activeColumn, showHistory, onEdit, coaAccounts }) {
  const [expanded, setExpanded] = useState(false);
  const [showCOA, setShowCOA] = useState(false);
  const activeVal = dept[activeColumn] || 0;
  const priorVal  = dept.prior_year_budget || 0;
  const chg = diff(activeVal, priorVal);
  const varianceData = dept.adopted_budget ? diff(dept.projected_year_end, dept.adopted_budget) : null;
  const linkedCoaAccounts = coaAccounts?.filter(a => a.department === dept.department && a.validation_status === 'approved') || [];

  return (
    <>
      <tr className="border-t border-slate-100 hover:bg-slate-50/50 group cursor-pointer" onClick={() => setExpanded(e => !e)}>
        <td className="px-3 py-2 flex items-center gap-1.5">
          {expanded ? <ChevronDown className="h-3 w-3 text-slate-400 flex-shrink-0" /> : <ChevronRight className="h-3 w-3 text-slate-400 flex-shrink-0" />}
          <span className="text-xs font-semibold text-slate-800">{dept.department}</span>
          {dept.justification_tags?.length > 0 && (
            <span className="text-[8px] text-slate-400 font-medium ml-1">{dept.justification_tags.length} tag{dept.justification_tags.length !== 1 ? 's' : ''}</span>
          )}
        </td>
        {showHistory && DISPLAY_COLS.map(col => (
          <td key={col} className="px-2 py-2 text-right font-mono text-[11px] text-slate-500">{fmt(dept[col])}</td>
        ))}
        <td className="px-2 py-2 text-right font-mono text-xs font-bold text-slate-900">{fmt(activeVal)}</td>
        <td className={`px-2 py-2 text-right font-mono text-[10px] font-semibold ${chg?.color || 'text-slate-400'}`}>
          {chg ? `${chg.d > 0 ? '+' : ''}${chg.pct}%` : '—'}
        </td>
        <td className="px-2 py-2 text-center">
          <div className="flex items-center justify-center gap-1">
            <ApprovalBadge approved={dept.manager_approved} label="Mgr" />
            <ApprovalBadge approved={dept.budget_committee_approved} label="BC" />
            <ApprovalBadge approved={dept.select_board_approved} label="SB" />
          </div>
        </td>
        <td className="px-2 py-2 text-center opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={e => { e.stopPropagation(); onEdit(dept); }} className="p-1 text-slate-400 hover:text-slate-800 transition-colors rounded">
            <Pencil className="h-3 w-3" />
          </button>
        </td>
      </tr>

      {/* Expanded detail and COA traceability */}
      {expanded && (
        <>
        <tr>
          <td colSpan={99} className="bg-slate-50/60 px-4 py-3 border-t border-slate-100">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[10px]">
              <div>
                <p className="font-bold text-slate-500 uppercase tracking-wider mb-1">Budget Progression</p>
                {[
                  ['Dept Request', dept.dept_request],
                  ['Finance Rec', dept.finance_recommendation],
                  ['Mgr Rec', dept.manager_recommendation],
                  ['BC Rec', dept.budget_committee_recommendation],
                  ['SB Rec', dept.select_board_recommendation],
                  ['Adopted', dept.adopted_budget],
                ].map(([l, v]) => v != null && v > 0 ? (
                  <div key={l} className="flex justify-between">
                    <span className="text-slate-500">{l}</span>
                    <span className="font-mono text-slate-700">{fmt(v)}</span>
                  </div>
                ) : null)}
              </div>
              <div>
                <p className="font-bold text-slate-500 uppercase tracking-wider mb-1">Approvals</p>
                <ApprovalBadge approved={dept.manager_approved} label="Manager Approved" />
                <br />
                <ApprovalBadge approved={dept.budget_committee_approved} label="Budget Committee" />
                <br />
                <ApprovalBadge approved={dept.select_board_approved} label="Select Board" />
                {dept.article_number && <p className="mt-1 text-slate-500">Article: <span className="font-semibold text-slate-700">{dept.article_number}</span></p>}
                {dept.bete_mapping && <p className="text-slate-500">BETE: <span className="font-semibold text-slate-700">{dept.bete_mapping}</span></p>}
              </div>
              <div>
                <p className="font-bold text-slate-500 uppercase tracking-wider mb-1">Justification Tags</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(dept.justification_tags || []).map(t => {
                    const cfg = JUSTIFICATION_TAGS[t];
                    return <span key={t} className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${cfg?.color || 'bg-slate-100 text-slate-600'}`}>{cfg?.label || t}</span>;
                  })}
                  {(!dept.justification_tags || dept.justification_tags.length === 0) && <span className="text-slate-400 italic">None tagged</span>}
                </div>
              </div>
              <div>
                <p className="font-bold text-slate-500 uppercase tracking-wider mb-1">Notes</p>
                {dept.justification_narrative && <p className="text-slate-600 leading-relaxed">{dept.justification_narrative}</p>}
                {dept.manager_notes && <p className="text-slate-500 mt-1"><span className="font-semibold">Mgr:</span> {dept.manager_notes}</p>}
                {dept.carryforward_amount > 0 && <p className="text-amber-700 mt-1">Carryforward: {fmt(dept.carryforward_amount)}</p>}
                {dept.enterprise_transfer > 0 && <p className="text-teal-700 mt-1">Enterprise offset: {fmt(dept.enterprise_transfer)}</p>}
              </div>
            </div>
          </td>
        </tr>
        {linkedCoaAccounts.length > 0 && (
          <tr>
            <td colSpan={99} className="bg-white px-4 py-3 border-t border-slate-100">
              <button onClick={() => setShowCOA(!showCOA)} className="text-[9px] font-semibold text-slate-600 hover:text-slate-900 py-1 px-2 rounded hover:bg-slate-100 flex items-center gap-1">
                <Link2 className="h-3 w-3" /> {showCOA ? 'Hide' : 'Show'} COA Mapping ({linkedCoaAccounts.length} account{linkedCoaAccounts.length !== 1 ? 's' : ''})
              </button>
              {showCOA && (
                <div className="mt-3 space-y-2">
                  {linkedCoaAccounts.map(coa => (
                    <TraceabilityPanel key={coa.id} newAccountNumber={coa.new_account_number} coaAccounts={coaAccounts} budgetValue={dept.adopted_budget} />
                  ))}
                </div>
              )}
            </td>
          </tr>
        )}
        </>
      )}
    </>
  );
}

function FundGroup({ fund, depts, activeColumn, showHistory, onEdit, coaAccounts }) {
  const [open, setOpen] = useState(true);
  const total = depts.reduce((s, d) => s + (d[activeColumn] || 0), 0);
  const priorTotal = depts.reduce((s, d) => s + (d.prior_year_budget || 0), 0);
  const chg = diff(total, priorTotal);

  return (
    <>
      <tr className="bg-slate-800 text-white cursor-pointer" onClick={() => setOpen(o => !o)}>
        <td colSpan={99} className="px-3 py-2 flex items-center gap-2">
          {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          <span className="text-xs font-bold">{FUND_LABELS[fund] || fund}</span>
          <span className="text-[9px] text-white/50 ml-1">{depts.length} dept{depts.length !== 1 ? 's' : ''}</span>
          <span className="ml-auto font-mono text-sm font-bold">{fmt(total)}</span>
          {chg && <span className={`text-[10px] font-semibold ml-2 ${chg.d > 0 ? 'text-red-300' : 'text-emerald-300'}`}>{chg.d > 0 ? '+' : ''}{chg.pct}%</span>}
        </td>
      </tr>
      {open && depts.map(d => (
        <DeptRow key={d.id || d.department} dept={d} activeColumn={activeColumn} showHistory={showHistory} onEdit={onEdit} coaAccounts={coaAccounts} />
      ))}
    </>
  );
}

export default function DepartmentBudgetTable({ depts, activePhase, showHistory = true, onEdit, coaAccounts }) {
  const activeColumn = resolveActiveColumn(activePhase);
  const grouped = groupDeptsByFund(depts);
  const grandTotal = depts.reduce((s, d) => s + (d[activeColumn] || 0), 0);
  const grandPrior = depts.reduce((s, d) => s + (d.prior_year_budget || 0), 0);
  const grandChg = diff(grandTotal, grandPrior);

  const colCount = showHistory ? DISPLAY_COLS.length + 4 : 4;

  return (
    <div className="rounded-2xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs min-w-[700px]">
          <thead>
            <tr className="bg-slate-900 text-white">
              <th className="px-3 py-2 text-left text-[9px] font-bold uppercase tracking-wider">Department</th>
              {showHistory && DISPLAY_COLS.map(col => (
                <th key={col} className="px-2 py-2 text-right text-[9px] font-bold uppercase tracking-wider whitespace-nowrap">{getColumnLabel(col)}</th>
              ))}
              <th className="px-2 py-2 text-right text-[9px] font-bold uppercase tracking-wider whitespace-nowrap">
                {getColumnLabel(activeColumn)}
              </th>
              <th className="px-2 py-2 text-right text-[9px] font-bold uppercase tracking-wider">Chg%</th>
              <th className="px-2 py-2 text-center text-[9px] font-bold uppercase tracking-wider">Approvals</th>
              <th className="px-2 py-2 w-8" />
            </tr>
          </thead>
          <tbody>
            {Object.entries(grouped).map(([fund, ds]) => (
              <FundGroup key={fund} fund={fund} depts={ds} activeColumn={activeColumn} showHistory={showHistory} onEdit={onEdit} />
            ))}
            {/* Grand total */}
            <tr className="bg-slate-900 text-white border-t-2 border-slate-700">
              <td className="px-3 py-2 font-bold text-xs" colSpan={showHistory ? DISPLAY_COLS.length + 1 : 1}>TOTAL ALL FUNDS</td>
              {showHistory && DISPLAY_COLS.slice(1).map(col => (
                <td key={col} className="px-2 py-2 text-right font-mono text-xs text-slate-300">{fmt(depts.reduce((s, d) => s + (d[col] || 0), 0))}</td>
              ))}
              <td className="px-2 py-2 text-right font-mono font-bold text-sm">{fmt(grandTotal)}</td>
              <td className={`px-2 py-2 text-right font-mono text-[10px] font-semibold ${grandChg?.d > 0 ? 'text-red-300' : 'text-emerald-300'}`}>
                {grandChg ? `${grandChg.d > 0 ? '+' : ''}${grandChg.pct}%` : '—'}
              </td>
              <td colSpan={2} />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}