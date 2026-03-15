/**
 * BudgetWorksheetTable — Editable line-item budget table
 * Supports add/edit/delete of budget lines with multi-column view.
 */
import React, { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { groupByDepartment, groupByArticle, resolveAmount } from './budgetEngine';

const $ = n => n == null ? '—' : `$${Math.round(Math.abs(n)).toLocaleString()}`;
const pctChange = (a, b) => {
  if (!b || b === 0) return null;
  const p = ((a - b) / Math.abs(b)) * 100;
  return { val: parseFloat(p.toFixed(1)), color: p > 5 ? 'text-red-600' : p < -5 ? 'text-emerald-600' : 'text-slate-500' };
};

const FUNDS = ['general_fund', 'school', 'county', 'enterprise', 'tif', 'debt_service', 'capital_reserve'];
const TYPES = ['appropriation', 'revenue', 'deduction', 'transfer', 'enterprise_offset', 'overlay'];

const EMPTY = { fiscal_year: '', department: '', fund: 'general_fund', account_code: '', account_name: '', account_type: 'appropriation', article_number: '', prior_year_budget: 0, manager_request: 0, budget_committee: 0, select_board: 0, adopted: 0, notes: '' };

function AddLineForm({ onAdd, onCancel, fiscalYear }) {
  const [form, setForm] = useState({ ...EMPTY, fiscal_year: fiscalYear || 'FY2027' });
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const setN = k => e => setForm(p => ({ ...p, [k]: parseFloat(e.target.value) || 0 }));
  return (
    <tr className="bg-blue-50/50">
      <td colSpan={8} className="p-3">
        <div className="grid grid-cols-3 gap-2 mb-2">
          <input placeholder="Department" value={form.department} onChange={set('department')} className="text-xs border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-400" />
          <input placeholder="Account Name" value={form.account_name} onChange={set('account_name')} className="text-xs border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-400" />
          <input placeholder="Article #" value={form.article_number} onChange={set('article_number')} className="text-xs border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-400" />
        </div>
        <div className="grid grid-cols-4 gap-2 mb-2">
          <select value={form.fund} onChange={set('fund')} className="text-xs border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-400">
            {FUNDS.map(f => <option key={f} value={f}>{f.replace(/_/g, ' ')}</option>)}
          </select>
          <select value={form.account_type} onChange={set('account_type')} className="text-xs border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-400">
            {TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
          </select>
          <input placeholder="Prior Year Budget" type="number" value={form.prior_year_budget || ''} onChange={setN('prior_year_budget')} className="text-xs border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-400 text-right font-mono" />
          <input placeholder="Manager Request" type="number" value={form.manager_request || ''} onChange={setN('manager_request')} className="text-xs border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-400 text-right font-mono" />
        </div>
        <div className="flex gap-2">
          <button onClick={() => { onAdd(form); setForm({ ...EMPTY, fiscal_year: fiscalYear || 'FY2027' }); }}
            className="text-xs bg-slate-900 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-slate-700">
            Add Line
          </button>
          <button onClick={onCancel} className="text-xs text-slate-500 hover:text-slate-800 px-3 py-1.5">Cancel</button>
        </div>
      </td>
    </tr>
  );
}

function DeptGroup({ dept, onDelete }) {
  const [open, setOpen] = useState(true);
  const pc = pctChange(dept.total, dept.priorTotal);
  return (
    <>
      <tr className="bg-slate-100 cursor-pointer" onClick={() => setOpen(o => !o)}>
        <td colSpan={3} className="px-3 py-2 font-bold text-xs text-slate-800 flex items-center gap-1.5">
          {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          {dept.department}
          <span className="text-[9px] text-slate-400 font-normal ml-1">{dept.lines.length} line{dept.lines.length !== 1 ? 's' : ''}</span>
        </td>
        <td className="px-3 py-2 text-right font-mono text-xs text-slate-500">{$(dept.priorTotal)}</td>
        <td colSpan={4} className="px-3 py-2 text-right font-mono text-xs font-bold text-slate-900">
          {$(dept.total)}
          {pc && <span className={`ml-2 text-[10px] ${pc.color}`}>{pc.val > 0 ? '+' : ''}{pc.val}%</span>}
        </td>
      </tr>
      {open && dept.lines.map((line, i) => (
        <tr key={i} className="hover:bg-slate-50 border-t border-slate-50">
          <td className="pl-7 pr-2 py-1.5 text-[11px] text-slate-600">{line.account_code || '—'}</td>
          <td className="px-2 py-1.5 text-[11px] text-slate-700">{line.account_name}</td>
          <td className="px-2 py-1.5 text-[9px] text-slate-400">{line.account_type?.replace(/_/g, ' ')}</td>
          <td className="px-2 py-1.5 text-right font-mono text-[11px] text-slate-500">{$(line.prior_year_budget)}</td>
          <td className="px-2 py-1.5 text-right font-mono text-[11px] text-slate-600">{$(line.manager_request)}</td>
          <td className="px-2 py-1.5 text-right font-mono text-[11px] text-slate-600">{$(line.budget_committee)}</td>
          <td className="px-2 py-1.5 text-right font-mono text-[11px] font-bold text-slate-900">{$(resolveAmount(line))}</td>
          <td className="px-2 py-1.5 text-center">
            <button onClick={() => onDelete(i, dept.department)} className="text-slate-300 hover:text-red-500 transition-colors">
              <Trash2 className="h-3 w-3" />
            </button>
          </td>
        </tr>
      ))}
    </>
  );
}

export default function BudgetWorksheetTable({ lines, onLinesChange, fiscalYear, groupBy = 'department' }) {
  const [showAdd, setShowAdd] = useState(false);

  const handleAdd = (line) => {
    onLinesChange([...lines, { ...line, _localId: Date.now() }]);
    setShowAdd(false);
  };

  const handleDelete = (lineIndex, dept) => {
    const deptGroup = groupByDepartment(lines).find(g => g.department === dept);
    if (!deptGroup) return;
    const targetLine = deptGroup.lines[lineIndex];
    onLinesChange(lines.filter(l => l !== targetLine));
  };

  const groups = groupBy === 'department' ? groupByDepartment(lines) : groupByArticle(lines);
  const grandTotal = lines.reduce((s, l) => s + resolveAmount(l), 0);
  const grandPrior = lines.reduce((s, l) => s + (l.prior_year_budget || 0), 0);

  return (
    <div className="space-y-2">
      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-slate-900 text-white">
              <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider">Code</th>
              <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider">Account</th>
              <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider">Type</th>
              <th className="px-3 py-2 text-right text-[10px] font-bold uppercase tracking-wider">Prior Yr</th>
              <th className="px-3 py-2 text-right text-[10px] font-bold uppercase tracking-wider">Mgr Req</th>
              <th className="px-3 py-2 text-right text-[10px] font-bold uppercase tracking-wider">Bud Comm</th>
              <th className="px-3 py-2 text-right text-[10px] font-bold uppercase tracking-wider">Adopted</th>
              <th className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider w-8"></th>
            </tr>
          </thead>
          <tbody>
            {groups.map((g, i) => (
              <DeptGroup key={i} dept={g} onDelete={(li, dept) => handleDelete(li, dept)} />
            ))}
            {showAdd && <AddLineForm onAdd={handleAdd} onCancel={() => setShowAdd(false)} fiscalYear={fiscalYear} />}
            {/* Grand total */}
            <tr className="bg-slate-900 text-white">
              <td colSpan={3} className="px-3 py-2 text-xs font-bold">GRAND TOTAL</td>
              <td className="px-3 py-2 text-right font-mono text-xs text-slate-300">{$(grandPrior)}</td>
              <td colSpan={3} className="px-3 py-2 text-right font-mono text-sm font-bold">{$(grandTotal)}</td>
              <td />
            </tr>
          </tbody>
        </table>
      </div>
      {!showAdd && (
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 border border-dashed border-slate-300 rounded-lg px-3 py-2 w-full justify-center hover:border-slate-500 transition-colors">
          <Plus className="h-3.5 w-3.5" /> Add Budget Line
        </button>
      )}
    </div>
  );
}