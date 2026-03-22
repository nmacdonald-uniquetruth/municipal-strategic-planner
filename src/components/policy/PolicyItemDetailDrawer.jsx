/**
 * PolicyItemDetailDrawer — full detail slide-in panel for a single policy item
 */
import React, { useState } from 'react';
import {
  X, ExternalLink, Flag, BookmarkPlus, Users, DollarSign, Shield,
  Wrench, Building2, Target, AlertTriangle, CheckCircle, Clock,
  ChevronDown, ChevronRight, Edit3, Save, Copy, Archive, Bell, FileText,
  Mail, Phone, MessageSquare
} from 'lucide-react';
import OutreachModal from './OutreachModal';
import { PriorityBadge, StatusBadge, JurisdictionBadge, ActionBadge, RelevanceScore, ImpactBadge, FlagRow } from './PolicyBadges';
import { fmtDate, fmt, daysUntil } from './policyEngine';

const OUTREACH_STATUSES = ['introduced', 'in_committee', 'passed_chamber', 'passed_both', 'rulemaking', 'watch'];

export default function PolicyItemDetailDrawer({ item, profile, impactRecord, onClose, onEdit, onGenerateAI, aiLoading }) {
  if (!item) return null;
  const [showOutreach, setShowOutreach] = useState(false);
  const showOutreachActions = OUTREACH_STATUSES.includes(item.status) && !item.is_archived;

  const deadlines = [
    item.hearing_date    && { label: 'Hearing',          date: item.hearing_date },
    item.vote_date       && { label: 'Vote',             date: item.vote_date },
    item.comment_deadline && { label: 'Comment Deadline', date: item.comment_deadline },
    item.effective_date  && { label: 'Effective Date',   date: item.effective_date },
  ].filter(Boolean);

  const copyToClipboard = () => {
    const text = `${item.identifier ? item.identifier + ' — ' : ''}${item.title}\n\n${item.summary || ''}\n\n${item.municipal_relevance || impactRecord?.why_it_matters_summary || ''}`;
    navigator.clipboard?.writeText(text);
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="w-full max-w-2xl bg-white shadow-2xl flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="flex items-start gap-3 px-5 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-1.5 mb-2">
              <JurisdictionBadge jurisdiction={item.jurisdiction} />
              <PriorityBadge priority={item.priority} />
              <StatusBadge status={item.status} />
              {item.impact_level && <ImpactBadge level={item.impact_level} />}
            </div>
            <h2 className="text-base font-bold text-slate-900 leading-snug">
              {item.identifier && <span className="font-mono text-slate-400 text-sm mr-2">{item.identifier}</span>}
              {item.title}
            </h2>
            <FlagRow item={item} />
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0 mt-1">
            <button onClick={copyToClipboard} title="Copy summary" className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded transition-colors">
              <Copy className="h-4 w-4" />
            </button>
            {onEdit && (
              <button onClick={() => onEdit(item)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded transition-colors">
                <Edit3 className="h-4 w-4" />
              </button>
            )}
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 min-h-full">

            {/* Main column */}
            <div className="md:col-span-2 px-5 py-4 space-y-4 border-r border-slate-100">
              {/* Summary */}
              {item.summary && (
                <Section title="Summary">
                  <p className="text-sm text-slate-700 leading-relaxed">{item.summary}</p>
                </Section>
              )}

              {/* Why it matters */}
              {(impactRecord?.why_it_matters_summary || item.municipal_relevance) && (
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-3.5">
                  <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-1.5">
                    Why This Matters to {profile?.name || 'Your Municipality'}
                  </p>
                  <p className="text-sm text-amber-900 leading-relaxed font-medium">
                    {impactRecord?.why_it_matters_summary || item.municipal_relevance}
                  </p>
                </div>
              )}

              {/* Relevance score */}
              {(impactRecord?.overall_relevance_score || item.relevance_score) && (
                <div className="flex items-center gap-3 py-2 border-b border-slate-100">
                  <RelevanceScore score={impactRecord?.overall_relevance_score ?? item.relevance_score} />
                  {impactRecord?.priority_level && <PriorityBadge priority={impactRecord.priority_level} />}
                  <span className="text-[10px] text-slate-400">Municipal Relevance Score</span>
                </div>
              )}

              {/* Impact sections */}
              <div className="space-y-1">
                <DetailSection icon={DollarSign} title="Budget Impact" color="amber"
                  text={impactRecord?.possible_budget_impact || item.fiscal_impact_note} />
                <DetailSection icon={Wrench} title="Operational Impact" color="blue"
                  text={impactRecord?.possible_operational_impact || item.operational_impact} />
                <DetailSection icon={Users} title="HR / Workforce Impact" color="purple"
                  text={impactRecord?.possible_hr_impact || item.hr_impact} />
                <DetailSection icon={Shield} title="Compliance Impact" color="red"
                  text={impactRecord?.possible_compliance_impact || item.compliance_impact} />
                <DetailSection icon={Building2} title="Capital / Infrastructure Impact" color="teal"
                  text={impactRecord?.possible_capital_impact || item.capital_impact} />
                <DetailSection icon={Target} title="Funding Opportunity" color="emerald"
                  text={impactRecord?.possible_funding_opportunity} />
                <DetailSection icon={AlertTriangle} title="Risks if Enacted" color="orange"
                  text={impactRecord?.risks_if_enacted || item.risk_if_enacted} />
                <DetailSection icon={AlertTriangle} title="Risks if Not Addressed" color="red"
                  text={impactRecord?.risks_if_not_addressed} />
              </div>

              {/* Recommended actions */}
              {(impactRecord?.recommended_actions?.length > 0 || item.recommended_action_note) && (
                <Section title="Recommended Actions">
                  {impactRecord?.recommended_actions?.length > 0 ? (
                    <div className="space-y-1.5">
                      {impactRecord.recommended_actions.map((a, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-slate-700">{a}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-700">{item.recommended_action_note}</p>
                  )}
                  {impactRecord?.recommended_owner_role && (
                    <p className="text-[10px] text-slate-500 mt-2">
                      <span className="font-semibold">Recommended Owner:</span> {impactRecord.recommended_owner_role}
                    </p>
                  )}
                </Section>
              )}

              {/* Notes */}
              {item.notes && (
                <Section title="Notes">
                  <p className="text-xs text-slate-600 leading-relaxed">{item.notes}</p>
                </Section>
              )}

              {/* AI insights button */}
              {onGenerateAI && (
                <button
                  onClick={() => onGenerateAI(item, 'full')}
                  disabled={aiLoading}
                  className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-purple-700 border border-purple-200 bg-purple-50 rounded-lg py-2.5 hover:bg-purple-100 transition-colors disabled:opacity-50"
                >
                  {aiLoading ? (
                    <span className="animate-spin text-purple-600">⟳</span>
                  ) : (
                    <span className="text-purple-600">✦</span>
                  )}
                  {impactRecord?.generation_method === 'ai_generated' ? 'Refresh AI Analysis' : 'Generate AI Municipal Impact Analysis'}
                </button>
              )}
            </div>

            {/* Sidebar */}
            <div className="px-4 py-4 space-y-4 bg-slate-50">
              {/* Score + priority */}
              <div className="space-y-2">
                <MetaLabel>Relevance Score</MetaLabel>
                <RelevanceScore score={impactRecord?.overall_relevance_score ?? item.relevance_score ?? 0} />
              </div>

              {/* Key dates */}
              {deadlines.length > 0 && (
                <div>
                  <MetaLabel>Key Dates</MetaLabel>
                  <div className="space-y-1.5 mt-1">
                    {deadlines.map(d => {
                      const days = daysUntil(d.date);
                      const urgent = days !== null && days >= 0 && days <= 14;
                      return (
                        <div key={d.label} className={`text-[10px] px-2.5 py-1.5 rounded-lg border ${urgent ? 'bg-red-50 border-red-200 text-red-800' : 'bg-white border-slate-200 text-slate-700'}`}>
                          <p className="font-bold">{d.label}</p>
                          <p>{fmtDate(d.date)} {days !== null && days >= 0 && <span className="font-bold">({days}d)</span>}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Departments */}
              {(impactRecord?.department_matches || item.departments_affected)?.length > 0 && (
                <div>
                  <MetaLabel>Affected Departments</MetaLabel>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(impactRecord?.department_matches || item.departments_affected || []).map(d => (
                      <span key={d} className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded font-medium">{d}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Strategic goals */}
              {(impactRecord?.strategic_goal_matches || item.strategic_goals)?.length > 0 && (
                <div>
                  <MetaLabel>Strategic Goals</MetaLabel>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(impactRecord?.strategic_goal_matches || item.strategic_goals || []).map(g => (
                      <span key={g} className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-medium">{g}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="space-y-1.5">
                <MetaLabel>Metadata</MetaLabel>
                {[
                  { label: 'Sponsor', value: item.sponsor },
                  { label: 'Committee', value: item.committee },
                  { label: 'Introduced', value: fmtDate(item.introduced_date) !== '—' ? fmtDate(item.introduced_date) : null },
                  { label: 'Last Action', value: item.last_action },
                  { label: 'Last Action Date', value: fmtDate(item.last_action_date) !== '—' ? fmtDate(item.last_action_date) : null },
                  { label: 'Probability', value: item.probability_of_passage ? `${item.probability_of_passage}%` : null },
                  { label: 'Category', value: item.category },
                ].filter(m => m.value).map(m => (
                  <div key={m.label} className="text-[10px]">
                    <span className="font-bold text-slate-500">{m.label}: </span>
                    <span className="text-slate-700">{m.value}</span>
                  </div>
                ))}
              </div>

              {/* Source */}
              {item.source_url && (
                <div>
                  <MetaLabel>Source</MetaLabel>
                  <a href={item.source_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-[11px] text-blue-600 hover:text-blue-800 mt-1 font-medium">
                    <ExternalLink className="h-3.5 w-3.5" /> View Source
                  </a>
                </div>
              )}

              {/* Scoring meta */}
              {impactRecord?.generated_at && (
                <p className="text-[9px] text-slate-400 pt-2 border-t border-slate-200">
                  Scored {new Date(impactRecord.generated_at).toLocaleDateString()} · {impactRecord.generation_method === 'ai_generated' ? '✦ AI' : 'Rule-based'} · v{impactRecord.scoring_version}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">{title}</p>
      {children}
    </div>
  );
}

function MetaLabel({ children }) {
  return <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{children}</p>;
}

function DetailSection({ icon: Icon, title, color, text }) {
  const [open, setOpen] = useState(true);
  if (!text) return null;
  const colors = {
    amber: 'text-amber-600', blue: 'text-blue-600', purple: 'text-purple-600',
    red: 'text-red-600', teal: 'text-teal-600', emerald: 'text-emerald-600', orange: 'text-orange-600',
  };
  return (
    <div className="border-b border-slate-100 py-2">
      <button onClick={() => setOpen(v => !v)} className="w-full flex items-center gap-2 text-left">
        <Icon className={`h-3.5 w-3.5 flex-shrink-0 ${colors[color]}`} />
        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex-1">{title}</p>
        {open ? <ChevronDown className="h-3 w-3 text-slate-300" /> : <ChevronRight className="h-3 w-3 text-slate-300" />}
      </button>
      {open && <p className="text-xs text-slate-700 leading-relaxed mt-1.5 pl-5">{text}</p>}
    </div>
  );
}