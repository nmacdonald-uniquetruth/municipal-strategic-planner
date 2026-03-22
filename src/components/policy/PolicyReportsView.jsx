/**
 * PolicyReportsView — Report generation hub
 */
import React, { useState } from 'react';
import { FileText, Download, ChevronRight, DollarSign, Shield, Users, Target, Calendar, BookOpen, Sparkles } from 'lucide-react';
import { buildExecutiveBrief, buildBoardPacket, buildBudgetRiskSummary, buildGrantOpportunitySummary, buildDepartmentSummary, buildMonthlyMemo } from './policyIntelligenceEngine';
import { fmt, fmtDate } from './policyEngine';

const REPORT_TYPES = [
  { id: 'executive_brief',    label: 'Weekly Legislative Brief',         icon: Sparkles,  color: 'bg-slate-900 text-white',        desc: 'Top-ranked items, critical priorities, and upcoming deadlines for leadership review.' },
  { id: 'monthly_memo',       label: 'Monthly Policy Memo',              icon: Calendar,  color: 'bg-blue-700 text-white',          desc: 'Comprehensive monthly summary for distribution to staff and leadership.' },
  { id: 'board_packet',       label: 'Governing Body Briefing Packet',   icon: FileText,  color: 'bg-purple-700 text-white',        desc: 'Items flagged for board action, organized for governing body review.' },
  { id: 'budget_risk',        label: 'Budget Risk Summary',              icon: DollarSign,color: 'bg-amber-600 text-white',         desc: 'All items with potential fiscal impact, organized by budget exposure.' },
  { id: 'dept_summary',       label: 'Department Impact Summary',        icon: Users,     color: 'bg-teal-700 text-white',          desc: 'Policy items filtered and summarized by department for department head briefings.' },
  { id: 'grant_summary',      label: 'Grant Opportunity Report',         icon: Target,    color: 'bg-emerald-700 text-white',       desc: 'All tracked funding opportunities and grant-eligible items.' },
];

export default function PolicyReportsView({ items, impactRecords = [], profile }) {
  const [selected, setSelected]   = useState(null);
  const [deptFilter, setDeptFilter] = useState('');
  const [report, setReport]       = useState(null);
  const [generating, setGenerating] = useState(false);

  const impactMap = Object.fromEntries((impactRecords).map(r => [r.policy_item_id, r]));
  const impactList = Object.values(impactMap);
  const departments = profile?.departments || [];

  const generate = () => {
    setGenerating(true);
    let result;
    switch (selected) {
      case 'executive_brief': result = buildExecutiveBrief(items, impactList, profile); break;
      case 'monthly_memo':    result = buildMonthlyMemo(items, impactList, profile);    break;
      case 'board_packet':    result = buildBoardPacket(items, impactList, profile);    break;
      case 'budget_risk':     result = buildBudgetRiskSummary(items, impactList, profile); break;
      case 'dept_summary':    result = buildDepartmentSummary(deptFilter || departments[0], items, impactList, profile); break;
      case 'grant_summary':   result = buildGrantOpportunitySummary(items, impactList, profile); break;
      default: result = null;
    }
    setTimeout(() => { setReport(result); setGenerating(false); }, 400);
  };

  const exportText = () => {
    if (!report) return;
    const lines = [`${profile?.name || 'Municipality'} — ${REPORT_TYPES.find(r => r.id === selected)?.label}`, `Generated: ${new Date().toLocaleDateString()}`, ''];
    if (report.executive_summary) lines.push(report.executive_summary, '');
    if (report.critical_items?.length) {
      lines.push('CRITICAL ITEMS:');
      report.critical_items.forEach(i => lines.push(`  • ${i.identifier || ''} ${i.title}`, `    Why it matters: ${i.why || ''}`, ''));
    }
    if (report.items?.length) {
      lines.push('ITEMS:');
      report.items.forEach(i => lines.push(`  • ${i.title}`, i.why_it_matters ? `    ${i.why_it_matters}` : '', ''));
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(profile?.name || 'municipality').toLowerCase().replace(/\s/g, '_')}_policy_report_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {!report ? (
        <>
          <p className="text-xs text-slate-500">Select a report type to generate from tracked policy data.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {REPORT_TYPES.map(r => {
              const RIcon = r.icon;
              return (
                <button key={r.id} onClick={() => setSelected(s => s === r.id ? null : r.id)}
                  className={`text-left rounded-xl border-2 p-4 transition-all hover:shadow-md ${selected === r.id ? 'border-slate-900 shadow-md' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                  <div className={`h-9 w-9 rounded-xl flex items-center justify-center mb-3 ${r.color}`}>
                    <RIcon className="h-4.5 w-4.5" />
                  </div>
                  <p className="text-sm font-bold text-slate-900 leading-snug mb-1">{r.label}</p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{r.desc}</p>
                </button>
              );
            })}
          </div>

          {selected && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
              <p className="text-xs font-bold text-slate-700">Generate: {REPORT_TYPES.find(r => r.id === selected)?.label}</p>
              {selected === 'dept_summary' && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Department</label>
                  <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
                    className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-slate-400">
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={generate} disabled={generating}
                  className="flex items-center gap-2 text-xs font-bold bg-slate-900 text-white px-5 py-2 rounded-lg hover:bg-slate-700 disabled:opacity-50 transition-colors">
                  {generating ? <span className="animate-spin">⟳</span> : <FileText className="h-3.5 w-3.5" />}
                  Generate Report
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-700">{REPORT_TYPES.find(r => r.id === selected)?.label}</p>
              <p className="text-[10px] text-slate-400">{report.municipality} · Generated {new Date(report.generated_at).toLocaleDateString()}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={exportText} className="flex items-center gap-1.5 text-xs text-slate-600 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 font-semibold">
                <Download className="h-3.5 w-3.5" /> Export
              </button>
              <button onClick={() => { setReport(null); }} className="text-xs text-slate-500 px-3 py-1.5 rounded-lg hover:bg-slate-100">
                ← Back
              </button>
            </div>
          </div>

          {/* Executive summary line */}
          {report.executive_summary && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <p className="text-sm text-slate-700 leading-relaxed">{report.executive_summary}</p>
            </div>
          )}

          {/* KPI row */}
          {(report.total_tracked || report.item_count) && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                report.total_tracked    && { label: 'Items Tracked',   value: report.total_tracked },
                report.critical_count   && { label: 'Critical',         value: report.critical_count },
                report.grant_count      && { label: 'Grant Opps',       value: report.grant_count },
                report.total_fiscal_exposure && { label: 'Fiscal Exposure', value: fmt(report.total_fiscal_exposure) },
                report.item_count       && { label: 'Items in Report',  value: report.item_count },
                report.total_exposure   && { label: 'Budget Exposure',  value: fmt(report.total_exposure) },
              ].filter(Boolean).slice(0, 4).map((k, i) => (
                <div key={i} className="rounded-xl border border-slate-200 bg-white p-3 text-center">
                  <p className="text-xl font-bold text-slate-900">{k.value}</p>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">{k.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Item list */}
          {(report.critical_items || report.items || report.budget_risk_items)?.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <div className="bg-slate-900 text-white px-4 py-2.5">
                <p className="text-xs font-bold">
                  {report.critical_items ? 'Critical Items' : report.items ? 'Items' : 'Budget Risk Items'}
                </p>
              </div>
              <div className="divide-y divide-slate-100">
                {(report.critical_items || report.items || report.budget_risk_items || []).map((item, i) => (
                  <div key={i} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-slate-900">
                          {item.identifier && <span className="font-mono text-slate-400 mr-1.5">{item.identifier}</span>}
                          {item.title}
                        </p>
                        {(item.why || item.why_it_matters || item.fiscal_note) && (
                          <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                            {item.why || item.why_it_matters || item.fiscal_note}
                          </p>
                        )}
                        {item.actions?.length > 0 && (
                          <p className="text-[10px] text-slate-500 mt-1">Actions: {item.actions.join(', ')}</p>
                        )}
                      </div>
                      {(item.fiscal_amount || item.score) && (
                        <div className="text-right flex-shrink-0">
                          {item.fiscal_amount && <p className="text-xs font-bold text-amber-700">{fmt(item.fiscal_amount)}</p>}
                          {item.score !== undefined && <p className="text-[10px] text-slate-500">{Math.round(item.score)}/100</p>}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming deadlines from brief */}
          {report.upcoming_deadlines?.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-2">Upcoming Deadlines</p>
              <div className="space-y-1.5">
                {report.upcoming_deadlines.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-[11px] text-slate-700">
                    <ChevronRight className="h-3 w-3 text-slate-400" />
                    <span className="font-medium">{item.title}</span>
                    {(item.hearing_date || item.vote_date || item.comment_deadline) && (
                      <span className="text-slate-400">{fmtDate(item.hearing_date || item.vote_date || item.comment_deadline)}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}