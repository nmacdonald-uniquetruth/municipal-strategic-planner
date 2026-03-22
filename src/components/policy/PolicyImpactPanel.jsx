/**
 * PolicyImpactPanel — shows the full AI/rule-based impact analysis for a single item.
 * Used as an expandable section within LegislationCard or as a standalone panel.
 */
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { RelevanceScore, PriorityBadge } from './PolicyBadges';
import { fmt } from './policyEngine';
import {
  Sparkles, ChevronDown, ChevronRight, AlertTriangle, DollarSign,
  Users, Shield, Wrench, Building2, BookOpen, Target, RefreshCw,
  CheckCircle, Edit3, Save, X
} from 'lucide-react';

const ImpactSection = ({ icon: Icon, title, text, color = 'text-slate-700' }) => {
  if (!text) return null;
  return (
    <div className="flex gap-2.5 py-2 border-b border-slate-100 last:border-0">
      <Icon className={`h-3.5 w-3.5 mt-0.5 flex-shrink-0 ${color}`} />
      <div>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">{title}</p>
        <p className="text-xs text-slate-700 leading-relaxed">{text}</p>
      </div>
    </div>
  );
};

export default function PolicyImpactPanel({ item, impactRecord, profile, onGenerateAI, aiLoading, onSaveOverride }) {
  const [expanded, setExpanded] = useState(false);
  const [editingNote, setEditingNote] = useState(false);
  const [adminNote, setAdminNote] = useState(impactRecord?.admin_note || '');

  const score = impactRecord?.overall_relevance_score ?? item?.relevance_score ?? 0;
  const priority = impactRecord?.priority_level ?? item?.priority ?? 'watch';
  const isAI = impactRecord?.generation_method === 'ai_generated';
  const hasInsights = !!(impactRecord?.why_it_matters_summary || impactRecord?.plain_language_summary);

  const handleSaveNote = () => {
    if (onSaveOverride) {
      onSaveOverride(item.id, { admin_note: adminNote });
    }
    setEditingNote(false);
  };

  return (
    <div className="border-t border-slate-100 mt-2">
      {/* Toggle bar */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-4 py-2 hover:bg-slate-50 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <Target className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-[11px] font-semibold text-slate-600">Municipal Impact Analysis</span>
          {hasInsights && (
            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${isAI ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>
              {isAI ? '✦ AI' : 'Rule-based'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <RelevanceScore score={score} />
          <PriorityBadge priority={priority} size="xs" />
          {expanded ? <ChevronDown className="h-3.5 w-3.5 text-slate-400" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-400" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {/* Sub-dimension scores */}
          {impactRecord && (
            <div className="grid grid-cols-3 md:grid-cols-6 gap-1.5">
              {[
                { label: 'Budget', score: impactRecord.budget_impact_score, color: 'text-amber-700' },
                { label: 'Ops', score: impactRecord.operations_impact_score, color: 'text-blue-700' },
                { label: 'HR', score: impactRecord.hr_impact_score, color: 'text-purple-700' },
                { label: 'Compliance', score: impactRecord.compliance_impact_score, color: 'text-red-700' },
                { label: 'Capital', score: impactRecord.capital_impact_score, color: 'text-teal-700' },
                { label: 'Funding', score: impactRecord.funding_opportunity_score, color: 'text-emerald-700' },
              ].map(({ label, score: s, color }) => s > 0 && (
                <div key={label} className="bg-slate-50 rounded-lg p-2 text-center">
                  <p className={`text-sm font-bold ${color}`}>{Math.round(s || 0)}</p>
                  <p className="text-[9px] text-slate-500 font-medium">{label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Why it matters */}
          {(impactRecord?.why_it_matters_summary || item?.municipal_relevance) && (
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Why It Matters to {profile?.name || 'Your Municipality'}</p>
              <p className="text-xs text-slate-800 leading-relaxed font-medium">
                {impactRecord?.why_it_matters_summary || item?.municipal_relevance}
              </p>
            </div>
          )}

          {/* Impact sections */}
          <div className="space-y-0">
            <ImpactSection icon={DollarSign}    title="Budget Impact"       text={impactRecord?.possible_budget_impact}       color="text-amber-600" />
            <ImpactSection icon={Wrench}         title="Operational Impact"  text={impactRecord?.possible_operational_impact}  color="text-blue-600" />
            <ImpactSection icon={Users}          title="HR Impact"           text={impactRecord?.possible_hr_impact}           color="text-purple-600" />
            <ImpactSection icon={Shield}         title="Compliance"          text={impactRecord?.possible_compliance_impact}   color="text-red-600" />
            <ImpactSection icon={Building2}      title="Capital Impact"      text={impactRecord?.possible_capital_impact}      color="text-teal-600" />
            <ImpactSection icon={BookOpen}       title="Funding Opportunity" text={impactRecord?.possible_funding_opportunity} color="text-emerald-600" />
            <ImpactSection icon={AlertTriangle}  title="Risks if Enacted"    text={impactRecord?.risks_if_enacted}             color="text-orange-600" />
            <ImpactSection icon={AlertTriangle}  title="Risk if Not Addressed" text={impactRecord?.risks_if_not_addressed}    color="text-red-600" />
          </div>

          {/* Recommended actions */}
          {impactRecord?.recommended_actions?.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Recommended Actions</p>
              <div className="flex flex-wrap gap-1.5">
                {impactRecord.recommended_actions.map((action, i) => (
                  <span key={i} className="text-[10px] bg-slate-900 text-white px-2 py-0.5 rounded-full font-medium">
                    {action}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Owner */}
          {impactRecord?.recommended_owner_role && (
            <p className="text-[10px] text-slate-500">
              <span className="font-semibold">Recommended Owner:</span> {impactRecord.recommended_owner_role}
            </p>
          )}

          {/* Department + goal matches */}
          {(impactRecord?.department_matches?.length > 0 || impactRecord?.strategic_goal_matches?.length > 0) && (
            <div className="flex flex-wrap gap-1">
              {(impactRecord.department_matches || []).map(d => (
                <span key={d} className="text-[9px] bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded font-medium">{d}</span>
              ))}
              {(impactRecord.strategic_goal_matches || []).map(g => (
                <span key={g} className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded font-medium">{g}</span>
              ))}
            </div>
          )}

          {/* Admin note */}
          <div className="border-t border-slate-100 pt-2">
            {editingNote ? (
              <div className="space-y-1">
                <textarea
                  value={adminNote}
                  onChange={e => setAdminNote(e.target.value)}
                  placeholder="Add internal note for staff..."
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg resize-none h-16 focus:outline-none focus:ring-1 focus:ring-slate-300"
                />
                <div className="flex gap-1">
                  <button onClick={handleSaveNote} className="flex items-center gap-1 text-[10px] bg-slate-900 text-white px-2 py-1 rounded font-semibold">
                    <Save className="h-3 w-3" /> Save
                  </button>
                  <button onClick={() => { setEditingNote(false); setAdminNote(impactRecord?.admin_note || ''); }}
                    className="flex items-center gap-1 text-[10px] text-slate-500 px-2 py-1 rounded hover:bg-slate-100">
                    <X className="h-3 w-3" /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-2">
                <p className="text-[10px] text-slate-400 italic flex-1">
                  {adminNote || 'No internal note.'}
                </p>
                <button onClick={() => setEditingNote(true)} className="text-[9px] text-slate-400 hover:text-slate-700 flex items-center gap-0.5">
                  <Edit3 className="h-3 w-3" /> Note
                </button>
              </div>
            )}
          </div>

          {/* AI generate / refresh */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-2">
            <p className="text-[9px] text-slate-400">
              {impactRecord?.generated_at
                ? `Scored ${new Date(impactRecord.generated_at).toLocaleDateString()} · v${impactRecord.scoring_version || '—'}`
                : 'Not yet scored'}
            </p>
            {onGenerateAI && (
              <button
                onClick={() => onGenerateAI(item, 'full')}
                disabled={aiLoading}
                className="flex items-center gap-1 text-[10px] text-purple-700 hover:text-purple-900 font-semibold disabled:opacity-50"
              >
                {aiLoading ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                {isAI ? 'Refresh AI' : 'Generate AI Insights'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}