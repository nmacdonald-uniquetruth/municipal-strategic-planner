/**
 * OfficialCard — directory card for a tracked elected official
 */
import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Mail, Phone, Globe, Users, MessageSquare } from 'lucide-react';
import { JURISDICTION_COLORS } from './policyEngine';
import { RelevanceScore } from './PolicyBadges';
import OutreachModal from './OutreachModal';

export default function OfficialCard({ official, onEdit, profile }) {
  const [expanded, setExpanded] = useState(false);
  const [showOutreach, setShowOutreach] = useState(false);
  const jc = JURISDICTION_COLORS[official.jurisdiction_level] || { bg: 'bg-slate-100', text: 'text-slate-600' };

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Avatar initial */}
          <div className="h-10 w-10 rounded-full bg-slate-800 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
            {official.name?.charAt(0) || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-bold text-slate-900">{official.name}</p>
                <p className="text-[11px] text-slate-600">{official.title}{official.office ? ` · ${official.office}` : ''}</p>
              </div>
              {official.relevance_score != null && <RelevanceScore score={official.relevance_score} />}
            </div>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${jc.bg} ${jc.text}`}>
                {official.jurisdiction_level}
              </span>
              {official.state && <span className="text-[9px] text-slate-500 font-medium">{official.state}</span>}
              {official.district && <span className="text-[9px] text-slate-500">{official.district}</span>}
              {official.party && <span className="text-[9px] text-slate-500">({official.party})</span>}
            </div>
            {official.committees?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {official.committees.slice(0, 3).map(c => (
                  <span key={c} className="text-[9px] bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded font-medium">{c}</span>
                ))}
                {official.committees.length > 3 && (
                  <span className="text-[9px] text-slate-400">+{official.committees.length - 3} more</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Outreach action buttons */}
        <div className="flex items-center gap-1.5 mt-3 flex-wrap">
          <button
            onClick={() => setShowOutreach(true)}
            className="flex items-center gap-1.5 text-[11px] font-bold bg-blue-700 text-white px-2.5 py-1.5 rounded-lg hover:bg-blue-800 transition-colors"
          >
            <Mail className="h-3 w-3" /> Email
          </button>
          <button
            onClick={() => setShowOutreach(true)}
            className="flex items-center gap-1.5 text-[11px] font-bold bg-emerald-700 text-white px-2.5 py-1.5 rounded-lg hover:bg-emerald-800 transition-colors"
          >
            <Phone className="h-3 w-3" /> Call
          </button>
          <button
            onClick={() => setShowOutreach(true)}
            className="flex items-center gap-1.5 text-[11px] font-bold bg-purple-700 text-white px-2.5 py-1.5 rounded-lg hover:bg-purple-800 transition-colors"
          >
            <MessageSquare className="h-3 w-3" /> Letter
          </button>
        </div>

        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2">
            {official.contact_email && (
              <a href={`mailto:${official.contact_email}`} className="p-1 text-slate-400 hover:text-blue-600 transition-colors" title={official.contact_email}>
                <Mail className="h-3.5 w-3.5" />
              </a>
            )}
            {official.contact_phone && (
              <a href={`tel:${official.contact_phone}`} className="p-1 text-slate-400 hover:text-green-600 transition-colors" title={official.contact_phone}>
                <Phone className="h-3.5 w-3.5" />
              </a>
            )}
            {official.contact_website && (
              <a href={official.contact_website} target="_blank" rel="noopener noreferrer" className="p-1 text-slate-400 hover:text-blue-600 transition-colors" title="Website">
                <Globe className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {onEdit && (
              <button onClick={() => onEdit(official)} className="text-[10px] text-slate-500 hover:text-slate-800 font-semibold px-2 py-1 rounded hover:bg-slate-100">
                Edit
              </button>
            )}
            <button onClick={() => setExpanded(e => !e)} className="p-1 text-slate-400 hover:text-slate-600">
              {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        {showOutreach && (
          <OutreachModal official={official} profile={profile} onClose={() => setShowOutreach(false)} />
        )}
      </div>

      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50 px-4 py-3 rounded-b-xl space-y-2">
          {official.key_positions && (
            <InfoBlock label="Key Positions" text={official.key_positions} />
          )}
          {official.voting_notes && (
            <InfoBlock label="Voting Behavior" text={official.voting_notes} />
          )}
          {official.sponsored_bills?.length > 0 && (
            <div>
              <p className="text-[9px] font-bold text-slate-500 uppercase mb-1">Sponsored Bills</p>
              <div className="flex flex-wrap gap-1">
                {official.sponsored_bills.map(b => (
                  <span key={b} className="text-[9px] bg-white border border-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono">{b}</span>
                ))}
              </div>
            </div>
          )}
          {official.relationship_notes && (
            <InfoBlock label="Relationship Notes" text={official.relationship_notes} />
          )}
          {official.notes && (
            <InfoBlock label="Notes" text={official.notes} />
          )}
        </div>
      )}
    </div>
  );
}

function InfoBlock({ label, text }) {
  return (
    <div>
      <p className="text-[9px] font-bold text-slate-500 uppercase mb-0.5">{label}</p>
      <p className="text-[10px] text-slate-700 leading-relaxed">{text}</p>
    </div>
  );
}