/**
 * OutreachModal — Outreach action modal for email, call, and letter generation.
 * Pulls municipality context from Model Settings / MunicipalityProfile.
 * Supports editable templates pre-filled with item/official context.
 */
import React, { useState, useMemo, useEffect } from 'react';
import { X, Mail, Phone, FileText, Copy, CheckCircle, ChevronDown, ChevronRight, Sparkles, Edit3, Send } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { fmtDate } from './policyEngine';

// ── Template generators ────────────────────────────────────────────────────────

function buildEmailSubject(context) {
  const { item, official, profile } = context;
  if (item) {
    return `Municipal Position: ${item.identifier ? item.identifier + ' — ' : ''}${item.title?.slice(0, 60)}${item.title?.length > 60 ? '...' : ''}`;
  }
  if (official) {
    return `Request for Meeting — ${profile?.name || 'Municipality'} Leadership`;
  }
  return `Correspondence from ${profile?.name || 'Municipality'}`;
}

function buildEmailBody(context) {
  const { item, official, profile, settings, sender } = context;
  const muni = profile?.name || settings?.name || 'our municipality';
  const state = profile?.state || 'ME';
  const senderName = sender?.name || settings?.tm_name || '[Your Name]';
  const senderTitle = sender?.title || 'Town Manager';
  const govBody = profile?.governance_type === 'town_meeting' ? 'Annual Town Meeting' :
                  profile?.governance_type === 'select_board' ? 'Select Board' :
                  profile?.governance_type === 'city_council' ? 'City Council' : 'Governing Body';

  if (item) {
    const relevance = item.municipal_relevance || item.summary || '';
    const action = item.recommended_action;
    const isSupport = action === 'advocate';
    const isMonitor = action === 'monitor';

    return `Dear ${official ? official.name : '[Official Name]'},

My name is ${senderName}, ${senderTitle} for the Town of ${muni}, ${state}. I am writing on behalf of our ${govBody} regarding ${item.identifier ? item.identifier + ', ' : ''}${item.title}.

${isSupport
  ? `We write in strong support of this legislation. ${relevance}`
  : isMonitor
  ? `We are actively monitoring this legislation and wish to share our perspective as a small rural municipality. ${relevance}`
  : `We are writing to share our municipality's position on this legislation and its potential impact on ${muni}. ${relevance}`
}

${item.fiscal_impact_note ? `From a fiscal standpoint: ${item.fiscal_impact_note}\n\n` : ''}${item.compliance_impact ? `On compliance: ${item.compliance_impact}\n\n` : ''}${item.operational_impact ? `Operationally: ${item.operational_impact}\n\n` : ''}We respectfully ask that you consider the perspective of small rural municipalities like ${muni} as this matter moves forward.${item.hearing_date ? ` We plan to monitor the hearing scheduled for ${fmtDate(item.hearing_date)}.` : ''}

Thank you for your time and public service. We welcome the opportunity to provide further information or testimony.

Respectfully,

${senderName}
${senderTitle}
Town of ${muni}, ${state}
Population: ${profile?.population?.toLocaleString() || '[Population]'}
Annual Budget: ${profile?.annual_budget ? '$' + profile.annual_budget.toLocaleString() : '[Budget]'}
[Phone] | [Email] | [Address]`;
  }

  if (official) {
    return `Dear ${official.name},

My name is ${senderName}, ${senderTitle} for the Town of ${muni}, ${state}. I am writing to request the opportunity to discuss matters of local government concern with your office.

The Town of ${muni} is a ${profile?.governance_type?.replace('_', ' ') || 'small'} municipality in ${state} with a population of approximately ${profile?.population?.toLocaleString() || '[population]'} and an annual budget of ${profile?.annual_budget ? '$' + profile.annual_budget.toLocaleString() : '[budget]'}. We are focused on the following strategic priorities: ${(profile?.strategic_goals || []).slice(0, 3).join(', ')}.

${official.key_positions ? `We are particularly interested in your positions on: ${official.key_positions}\n\n` : ''}We believe a brief conversation or meeting would be mutually beneficial and would allow us to share our community's perspective on issues affecting small rural municipalities.

Thank you for your service to our region.

Respectfully,

${senderName}
${senderTitle}
Town of ${muni}, ${state}
[Phone] | [Email] | [Address]`;
  }

  return `Dear [Official Name],\n\nOn behalf of the Town of ${muni}, ${state}...\n\nRespectfully,\n${senderName}\n${senderTitle}\nTown of ${muni}`;
}

function buildCallScript(context) {
  const { item, official, profile, settings, sender } = context;
  const muni = profile?.name || settings?.name || 'our municipality';
  const state = profile?.state || 'ME';
  const senderName = sender?.name || '[Your Name]';
  const senderTitle = sender?.title || 'Town Manager';

  if (item) {
    return `CALL SCRIPT — ${item.identifier || 'Legislation'}: ${item.title?.slice(0, 50)}

BEFORE THE CALL
• Confirm you're calling the right office
• Have bill number ready: ${item.identifier || 'N/A'}
• Know the key ask: ${item.recommended_action === 'advocate' ? 'Express support' : item.recommended_action === 'respond' ? 'Express concern' : 'Share municipal impact perspective'}

OPENING
"Hello, my name is ${senderName}, I'm the ${senderTitle} for the Town of ${muni}, ${state}. I'm calling regarding ${item.identifier ? item.identifier + ', ' : ''}${item.title?.slice(0, 60)}."

KEY POINTS TO MAKE
${item.municipal_relevance ? `• ${item.municipal_relevance}\n` : ''}${item.fiscal_impact_note ? `• Fiscal: ${item.fiscal_impact_note}\n` : ''}${item.compliance_impact ? `• Compliance: ${item.compliance_impact}\n` : ''}• ${muni} has a population of ~${profile?.population?.toLocaleString() || '[pop]'} and an annual budget of ~${profile?.annual_budget ? '$' + profile.annual_budget.toLocaleString() : '[budget]'}

THE ASK
${item.recommended_action === 'advocate' ? `"We urge support for this bill. Would the [Senator/Representative/office] be willing to ${official ? 'take a position or co-sponsor?' : 'support this measure?'}"` : item.recommended_action === 'respond' ? `"We have significant concerns about this legislation and would appreciate the opportunity to share testimony or a written comment."` : `"We would appreciate any information about the status of this item and how to share our municipality's perspective."`}

CLOSE
"May I get a contact email for follow-up correspondence? Thank you for your time and service."

NOTES / OUTCOME
_______________________________________________`;
  }

  if (official) {
    return `CALL SCRIPT — Outreach to ${official.name}

OPENING
"Hello, my name is ${senderName}, ${senderTitle} for the Town of ${muni}, ${state}. I'm calling to request a brief meeting or conversation with ${official.name}'s office."

KEY POINTS
• Represent the Town of ${muni}, pop. ${profile?.population?.toLocaleString() || '[pop]'}, ${state}
• Priority topics: ${(profile?.policy_focus_areas || profile?.strategic_goals || []).slice(0, 3).join(', ')}
${official.committees?.length ? `• Relevant committees: ${official.committees.slice(0, 2).join(', ')}` : ''}

THE ASK
"We'd appreciate a 15–20 minute call or in-person meeting to discuss issues affecting small rural municipalities in ${state}."

CLOSE
"Who should I follow up with? Thank you for your time."

NOTES / OUTCOME
_______________________________________________`;
  }

  return `CALL SCRIPT\n\nIntroduce yourself as ${senderName}, ${senderTitle}, Town of ${muni}...\n\nNOTES:\n_______________________________________________`;
}

function buildFormalLetter(context) {
  const { item, official, profile, settings, sender } = context;
  const muni = profile?.name || settings?.name || 'Municipality';
  const state = profile?.state || 'ME';
  const senderName = sender?.name || '[Your Name]';
  const senderTitle = sender?.title || 'Town Manager';
  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const govBody = profile?.governance_type === 'town_meeting' ? 'Annual Town Meeting' :
                  profile?.governance_type === 'select_board' ? 'Select Board' :
                  profile?.governance_type === 'city_council' ? 'City Council' : 'Governing Body';

  const recipientBlock = official
    ? `${official.name}\n${official.title || ''}\n${official.office || ''}\n${official.district || official.state || ''}`
    : '[Recipient Name]\n[Title]\n[Office]\n[Address]';

  const body = item
    ? `RE: ${item.identifier ? item.identifier + ' — ' : ''}${item.title}

To ${official ? official.name : 'Whom It May Concern'},

The Select Board / ${govBody} of the Town of ${muni}, ${state}, hereby submits this formal correspondence regarding ${item.identifier ? item.identifier + ', ' : ''}"${item.title}."

BACKGROUND
${item.summary || 'Please refer to the attached legislative summary.'}

MUNICIPAL IMPACT ANALYSIS
The Town of ${muni} is a ${profile?.governance_type?.replace(/_/g, ' ') || 'municipal'} government in ${profile?.county ? profile.county + ' County, ' : ''}${state}, serving a population of approximately ${profile?.population?.toLocaleString() || '[population]'} residents with an annual budget of ${profile?.annual_budget ? '$' + profile.annual_budget.toLocaleString() : '[budget]'}.

${item.municipal_relevance || ''}

${item.fiscal_impact_note ? `Fiscal Impact: ${item.fiscal_impact_note}\n\n` : ''}${item.compliance_impact ? `Compliance Implications: ${item.compliance_impact}\n\n` : ''}${item.operational_impact ? `Operational Impact: ${item.operational_impact}\n\n` : ''}MUNICIPAL POSITION
${item.recommended_action === 'advocate'
  ? `The Town of ${muni} formally supports this legislation and urges its adoption.`
  : item.recommended_action === 'respond'
  ? `The Town of ${muni} respectfully raises concerns regarding this legislation and requests that the interests of small rural municipalities be fully considered during deliberation.`
  : `The Town of ${muni} is actively monitoring this legislation and wishes to remain engaged as it progresses.`
}

${item.hearing_date ? `We note that a public hearing is scheduled for ${fmtDate(item.hearing_date)}. ${muni} intends to participate or submit written testimony.\n\n` : ''}Respectfully submitted on behalf of the ${govBody} of the Town of ${muni},`
    : `To ${official ? official.name : 'Whom It May Concern'},

On behalf of the Town of ${muni}, I respectfully submit this correspondence to introduce our municipality and request your engagement on matters of local government concern.

[Body of letter here]

Respectfully,`;

  return `Town of ${muni}
Municipal Offices · ${muni}, ${state}

${today}

${recipientBlock}

${body}

${senderName}
${senderTitle}
Town of ${muni}, ${state}

[Seal / Letterhead]`;
}

// ── Tab definitions ────────────────────────────────────────────────────────────

const TABS = [
  { id: 'email',  label: 'Send Email',     icon: Mail,     color: 'text-blue-700',   bg: 'bg-blue-50',   border: 'border-blue-200' },
  { id: 'call',   label: 'Call Office',    icon: Phone,    color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  { id: 'letter', label: 'Draft Letter',   icon: FileText, color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' },
];

// ── Main component ─────────────────────────────────────────────────────────────

export default function OutreachModal({ item, official, profile, onClose }) {
  const [activeTab, setActiveTab] = useState('email');
  const [copied, setCopied] = useState(false);
  const [sender, setSender] = useState({ name: '', title: 'Town Manager' });
  const [showSenderEdit, setShowSenderEdit] = useState(false);

  // Load model settings for sender context
  useEffect(() => {
    base44.entities.ModelSettings.filter({ key: 'main' }).then(records => {
      if (records?.[0]) {
        const s = records[0];
        setSender({
          name: s.tm_name || s.fd_name || '',
          title: 'Town Manager',
        });
      }
    }).catch(() => {});
  }, []);

  const context = useMemo(() => ({ item, official, profile, sender }), [item, official, profile, sender]);

  const [emailSubject, setEmailSubject] = useState(() => buildEmailSubject(context));
  const [emailBody,    setEmailBody]    = useState(() => buildEmailBody(context));
  const [callScript,   setCallScript]   = useState(() => buildCallScript(context));
  const [letterText,   setLetterText]   = useState(() => buildFormalLetter(context));

  // Regenerate when context changes
  useEffect(() => {
    setEmailSubject(buildEmailSubject(context));
    setEmailBody(buildEmailBody(context));
    setCallScript(buildCallScript(context));
    setLetterText(buildFormalLetter(context));
  }, [JSON.stringify({ item?.id, official?.id, sender })]);

  const activeContent = activeTab === 'email' ? emailBody : activeTab === 'call' ? callScript : letterText;

  const copy = (text) => {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const openMailto = () => {
    const email = official?.contact_email || '';
    const subject = encodeURIComponent(emailSubject);
    const body = encodeURIComponent(emailBody);
    window.open(`mailto:${email}?subject=${subject}&body=${body}`);
  };

  const contextName = item ? (item.identifier || item.title?.slice(0, 40)) : official?.name;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-200 bg-slate-50 flex-shrink-0">
          <div>
            <p className="text-sm font-bold text-slate-900">Outreach Actions</p>
            <p className="text-[10px] text-slate-500 mt-0.5 truncate max-w-md">
              {contextName}
              {profile?.name && <span className="text-slate-400"> · {profile.name}, {profile.state}</span>}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded transition-colors flex-shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Sender context bar */}
        <div className="flex items-center justify-between gap-3 px-5 py-2.5 bg-slate-50 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-2 text-[10px] text-slate-600">
            <span className="font-bold">From:</span>
            {sender.name
              ? <span className="font-semibold text-slate-800">{sender.name} · {sender.title} · {profile?.name || 'Municipality'}</span>
              : <span className="text-slate-400 italic">Configure sender below</span>
            }
          </div>
          <button onClick={() => setShowSenderEdit(v => !v)}
            className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-800 font-semibold">
            <Edit3 className="h-3 w-3" />
            {showSenderEdit ? 'Hide' : 'Edit Sender'}
          </button>
        </div>

        {/* Sender editor */}
        {showSenderEdit && (
          <div className="flex gap-3 px-5 py-3 bg-slate-50 border-b border-slate-100 flex-shrink-0">
            <div className="flex-1">
              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Your Name</label>
              <input value={sender.name} onChange={e => setSender(s => ({ ...s, name: e.target.value }))}
                placeholder="Full Name"
                className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-400" />
            </div>
            <div className="flex-1">
              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Title</label>
              <input value={sender.title} onChange={e => setSender(s => ({ ...s, title: e.target.value }))}
                placeholder="e.g. Town Manager"
                className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-400" />
            </div>
          </div>
        )}

        {/* Tab switcher */}
        <div className="flex gap-0 px-5 pt-3 flex-shrink-0">
          {TABS.map(t => {
            const TIcon = t.icon;
            return (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
                  activeTab === t.id
                    ? `border-slate-900 ${t.color}`
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}>
                <TIcon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {/* Email subject line */}
          {activeTab === 'email' && (
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Subject Line</label>
              <input
                value={emailSubject}
                onChange={e => setEmailSubject(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium text-slate-800"
              />
            </div>
          )}

          {/* Context chip row */}
          <div className="flex flex-wrap gap-1.5">
            {item && (
              <>
                {item.identifier && <ContextChip label="Bill" value={item.identifier} />}
                {item.jurisdiction && <ContextChip label="Jurisdiction" value={item.jurisdiction} />}
                {item.recommended_action && item.recommended_action !== 'none' && <ContextChip label="Action" value={item.recommended_action} highlight />}
              </>
            )}
            {official && (
              <>
                {official.jurisdiction_level && <ContextChip label="Level" value={official.jurisdiction_level} />}
                {official.party && <ContextChip label="Party" value={official.party} />}
                {official.contact_phone && <ContextChip label="Phone" value={official.contact_phone} />}
              </>
            )}
            {profile?.name && <ContextChip label="Municipality" value={`${profile.name}, ${profile.state}`} />}
          </div>

          {/* Editable template */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {activeTab === 'email' ? 'Email Body' : activeTab === 'call' ? 'Call Script' : 'Formal Letter'}
                <span className="ml-1.5 text-[8px] text-slate-400 normal-case font-normal">(editable — template pre-filled from municipality context)</span>
              </label>
            </div>
            <textarea
              value={activeContent}
              onChange={e => {
                if (activeTab === 'email') setEmailBody(e.target.value);
                else if (activeTab === 'call') setCallScript(e.target.value);
                else setLetterText(e.target.value);
              }}
              rows={activeTab === 'call' ? 20 : 22}
              className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-slate-400 font-mono leading-relaxed resize-y text-slate-800"
            />
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-slate-200 bg-slate-50 flex-shrink-0">
          <p className="text-[10px] text-slate-400">All templates are editable before sending or copying.</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => copy(activeTab === 'email' ? `Subject: ${emailSubject}\n\n${emailBody}` : activeContent)}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 border border-slate-200 bg-white px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
            >
              {copied ? <CheckCircle className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>

            {activeTab === 'email' && (
              <button
                onClick={openMailto}
                className="flex items-center gap-1.5 text-xs font-bold bg-blue-700 text-white px-4 py-1.5 rounded-lg hover:bg-blue-800 transition-colors"
              >
                <Mail className="h-3.5 w-3.5" />
                Open in Email Client
              </button>
            )}

            {activeTab === 'call' && official?.contact_phone && (
              <a
                href={`tel:${official.contact_phone}`}
                className="flex items-center gap-1.5 text-xs font-bold bg-emerald-700 text-white px-4 py-1.5 rounded-lg hover:bg-emerald-800 transition-colors"
              >
                <Phone className="h-3.5 w-3.5" />
                Call {official.contact_phone}
              </a>
            )}

            {activeTab === 'letter' && (
              <button
                onClick={() => {
                  const blob = new Blob([letterText], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `letter_${(profile?.name || 'municipality').toLowerCase().replace(/\s/g, '_')}_${Date.now()}.txt`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="flex items-center gap-1.5 text-xs font-bold bg-purple-700 text-white px-4 py-1.5 rounded-lg hover:bg-purple-800 transition-colors"
              >
                <FileText className="h-3.5 w-3.5" />
                Export Letter
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ContextChip({ label, value, highlight }) {
  return (
    <span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold border ${
      highlight
        ? 'bg-amber-50 text-amber-800 border-amber-300'
        : 'bg-slate-100 text-slate-600 border-slate-200'
    }`}>
      <span className="opacity-60">{label}:</span> {value}
    </span>
  );
}