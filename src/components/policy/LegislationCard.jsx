/**
 * LegislationCard — compact card view for a single tracked item
 */
import React, { useState } from 'react';
import { ChevronDown, ChevronRight, ExternalLink, Star, AlertTriangle, Bookmark, DollarSign, Users, Flag } from 'lucide-react';
import { PriorityBadge, StatusBadge, JurisdictionBadge, ActionBadge, RelevanceScore, ImpactBadge, FlagRow } from './PolicyBadges';
import { fmtDate, fmt, daysUntil, buildRelevanceNote } from './policyEngine';

export default function LegislationCard({ item, profile, onEdit, onFlag, compact = false }) {
  const [expanded, setExpanded] = useState(false);
  const relevanceNote = buildRelevanceNote(item, profile);
  const deadlines = [
    item.hearing_date && { label: 'Hearing', date: item.hearing_date },
    item.vote_date && { label: 'Vote', date: item.vote_date },
    item.comment_deadline && { label: 'Comment Deadline', date: item.comment_deadline },
    item.effective_date && { label: 'Effective', date: item.effective_date },
  ].filter(Boolean);

  const urgentDeadline = deadlines.find(d => {
    const days = daysUntil(d.date);
    return days !== null && days >= 0 && days <= 14;
  });

  return (
    <div className={`rounded-xl border bg-white transition-shadow hover:shadow-md ${
      item.priority === 'critical' ? 'border-red-300' :
      item.priority === 'high' ? 'border-orange-300' :
      'border-slate-200'
    }`}>
      {/* Card header */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            {/* Top row: jurisdiction + priority + status */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              <JurisdictionBadge jurisdiction={item.jurisdiction} />
              <PriorityBadge priority={item.priority} />
              <StatusBadge status={item.status} />
              {item.impact_level && <ImpactBadge level={item.impact_level} />}
            </div>
            {/* Title */}
            <div className="flex items-start gap-2">
              {item.identifier && (
                <span className="text-[10px] font-mono font-bold text-slate-400 mt-0.5 flex-shrink-0">{item.identifier}</span>
              )}
              <p className="text-sm font-bold text-slate-900 leading-snug">{item.title}</p>
            </div>
            {/* Flags */}
            {(item.is_flagged_urgent || item.is_flagged_board || item.is_flagged_budget || item.is_flagged_grant) && (
              <div className="mt-1.5"><FlagRow item={item} /></div>
            )}
            {/* Urgent deadline warning */}
            {urgentDeadline && (
              <div className="flex items-center gap-1.5 mt-1.5 text-[10px] font-semibold text-red-700 bg-red-50 px-2 py-1 rounded">
                <AlertTriangle className="h-3 w-3" />
                {urgentDeadline.label} in {daysUntil(urgentDeadline.date)} day{daysUntil(urgentDeadline.date) !== 1 ? 's' : ''}
              </div>
            )}
          </div>
          {/* Score */}
          <div className="flex-shrink-0 text-right">
            <RelevanceScore score={item.relevance_score} />
            <p className="text-[9px] text-slate-400 mt-0.5">relevance</p>
          </div>
        </div>

        {/* Summary */}
        {item.summary && !compact && (
          <p className="text-[11px] text-slate-600 mt-2 leading-relaxed line-clamp-2">{item.summary}</p>
        )}

        {/* Why this matters */}
        {relevanceNote && !compact && (
          <div className="mt-2 bg-amber-50 border border-amber-200 rounded p-2">
            <p className="text-[10px] font-bold text-amber-800 mb-0.5">Why this matters to {profile?.name || 'your municipality'}</p>
            <p className="text-[10px] text-amber-900 leading-relaxed">{relevanceNote}</p>
          </div>
        )}

        {/* Meta row */}
        <div className="flex flex-wrap gap-3 mt-3 text-[10px] text-slate-500">
          {item.sponsor && <span><span className="font-semibold">Sponsor:</span> {item.sponsor}</span>}
          {item.committee && <span><span className="font-semibold">Committee:</span> {item.committee}</span>}
          {item.last_action_date && <span><span className="font-semibold">Last action:</span> {fmtDate(item.last_action_date)}</span>}
          {item.category && <span>{item.category}</span>}
        </div>

        {/* Departments */}
        {item.departments_affected?.length > 0 && !compact && (
          <div className="flex flex-wrap gap-1 mt-2">
            {item.departments_affected.map(d => (
              <span key={d} className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">{d}</span>
            ))}
          </div>
        )}

        {/* Actions row */}
        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100">
          <div className="flex items-center gap-2">
            {item.recommended_action && item.recommended_action !== 'none' && (
              <ActionBadge action={item.recommended_action} />
            )}
            {item.fiscal_impact_amount ? (
              <span className="flex items-center gap-1 text-[10px] text-amber-700 font-semibold">
                <DollarSign className="h-3 w-3" />{fmt(item.fiscal_impact_amount)}
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-1.5">
            {item.source_url && (
              <a href={item.source_url} target="_blank" rel="noopener noreferrer"
                className="p-1 text-slate-400 hover:text-blue-600 transition-colors" title="Source">
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
            {onFlag && (
              <button onClick={() => onFlag(item)} className="p-1 text-slate-400 hover:text-amber-600 transition-colors" title="Flags">
                <Flag className="h-3.5 w-3.5" />
              </button>
            )}
            {onEdit && (
              <button onClick={() => onEdit(item)} className="text-[10px] text-slate-500 hover:text-slate-800 font-semibold px-2 py-1 rounded hover:bg-slate-100 transition-colors">
                Edit
              </button>
            )}
            <button onClick={() => setExpanded(e => !e)} className="p-1 text-slate-400 hover:text-slate-700 transition-colors">
              {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50 px-4 py-4 rounded-b-xl space-y-3">
          {/* Deadlines */}
          {deadlines.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-slate-600 uppercase mb-1.5">Key Dates</p>
              <div className="flex flex-wrap gap-2">
                {deadlines.map(d => {
                  const days = daysUntil(d.date);
                  return (
                    <div key={d.label} className={`text-[10px] px-2 py-1 rounded border ${days !== null && days >= 0 && days <= 14 ? 'bg-red-50 border-red-200 text-red-700' : 'bg-white border-slate-200 text-slate-600'}`}>
                      <span className="font-semibold">{d.label}:</span> {fmtDate(d.date)}
                      {days !== null && days >= 0 && <span className="ml-1 font-bold">({days}d)</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {/* Impact grid */}
          <div className="grid grid-cols-2 gap-3">
            {item.fiscal_impact_note && (
              <ImpactBlock icon="💰" label="Fiscal Impact" text={item.fiscal_impact_note} />
            )}
            {item.operational_impact && (
              <ImpactBlock icon="⚙️" label="Operational" text={item.operational_impact} />
            )}
            {item.compliance_impact && (
              <ImpactBlock icon="📋" label="Compliance" text={item.compliance_impact} />
            )}
            {item.hr_impact && (
              <ImpactBlock icon="👥" label="HR / Labor" text={item.hr_impact} />
            )}
            {item.capital_impact && (
              <ImpactBlock icon="🏗️" label="Capital" text={item.capital_impact} />
            )}
            {item.opportunities && (
              <ImpactBlock icon="✅" label="Opportunities" text={item.opportunities} />
            )}
          </div>
          {item.risk_if_enacted && (
            <ImpactBlock icon="⚠️" label="Risk if Enacted" text={item.risk_if_enacted} full />
          )}
          {item.recommended_action_note && (
            <ImpactBlock icon="🎯" label="Recommended Action" text={item.recommended_action_note} full />
          )}
          {item.notes && (
            <ImpactBlock icon="📝" label="Notes" text={item.notes} full />
          )}
          {/* Strategic goals */}
          {item.strategic_goals?.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-slate-600 uppercase mb-1">Strategic Goals</p>
              <div className="flex flex-wrap gap-1">
                {item.strategic_goals.map(g => (
                  <span key={g} className="text-[9px] bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded font-medium">{g}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ImpactBlock({ icon, label, text, full = false }) {
  return (
    <div className={`bg-white border border-slate-200 rounded p-2 ${full ? 'col-span-2' : ''}`}>
      <p className="text-[9px] font-bold text-slate-500 uppercase mb-0.5">{icon} {label}</p>
      <p className="text-[10px] text-slate-700 leading-relaxed">{text}</p>
    </div>
  );
}