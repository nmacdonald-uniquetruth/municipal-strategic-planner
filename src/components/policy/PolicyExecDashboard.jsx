/**
 * PolicyExecDashboard — Executive intelligence workspace landing view
 */
import React, { useMemo } from 'react';
import {
  AlertTriangle, Calendar, DollarSign, Shield, Globe, Users, Zap,
  TrendingUp, ChevronRight, Clock, Building2, Target, BookOpen,
  FileText, ArrowRight, CheckCircle, Bell
} from 'lucide-react';
import { PriorityBadge, JurisdictionBadge, StatusBadge, ActionBadge, RelevanceScore } from './PolicyBadges';
import {
  sortByRelevance, getUpcomingEvents, aggregateFiscalImpact,
  buildRelevanceNote, fmt, fmtDate, daysUntil,
  EVENT_TYPE_LABELS, EVENT_TYPE_COLORS
} from './policyEngine';

export default function PolicyExecDashboard({ items, officials, events, funding, profile, onNavigate }) {
  const profileName = profile?.name || 'Your Municipality';
  const activeItems = useMemo(() => items.filter(i => !i.is_archived), [items]);
  const critical    = useMemo(() => activeItems.filter(i => i.priority === 'critical'), [activeItems]);
  const high        = useMemo(() => activeItems.filter(i => i.priority === 'high'), [activeItems]);
  const top         = useMemo(() => sortByRelevance(activeItems).slice(0, 6), [activeItems]);
  const upcoming    = useMemo(() => getUpcomingEvents(events, 45), [events]);
  const openFunding = useMemo(() => funding.filter(f => f.status === 'open' || f.status === 'upcoming'), [funding]);
  const boardItems  = useMemo(() => activeItems.filter(i => i.is_flagged_board), [activeItems]);
  const budgetItems = useMemo(() => activeItems.filter(i => i.is_flagged_budget), [activeItems]);
  const grantItems  = useMemo(() => activeItems.filter(i => i.is_flagged_grant), [activeItems]);
  const totalFiscal = useMemo(() => aggregateFiscalImpact(budgetItems), [budgetItems]);

  const needsAction30 = useMemo(() => activeItems.filter(item => {
    const dates = [item.hearing_date, item.vote_date, item.comment_deadline].filter(Boolean);
    return dates.some(d => { const days = daysUntil(d); return days !== null && days >= 0 && days <= 30; });
  }), [activeItems]);

  // Department exposure
  const deptExposure = useMemo(() => {
    const counts = {};
    activeItems.forEach(item => {
      (item.departments_affected || []).forEach(d => { counts[d] = (counts[d] || 0) + 1; });
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [activeItems]);

  return (
    <div className="space-y-6">
      {/* Critical alert banner */}
      {critical.length > 0 && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-red-700 flex-shrink-0">
              <AlertTriangle className="h-3.5 w-3.5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-red-900">{critical.length} Critical Item{critical.length !== 1 ? 's' : ''} Require Attention</p>
              <p className="text-[10px] text-red-700">Review and assign action before next leadership meeting</p>
            </div>
          </div>
          <div className="space-y-1.5 pl-9">
            {critical.slice(0, 3).map(item => (
              <div key={item.id} className="flex items-center gap-2 text-[11px]">
                <span className="font-mono text-red-400 flex-shrink-0">{item.identifier || '→'}</span>
                <span className="font-semibold text-red-900 truncate flex-1">{item.title}</span>
                {item.recommended_action && item.recommended_action !== 'none' && (
                  <ActionBadge action={item.recommended_action} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Active Items',     value: activeItems.length,           icon: Globe,         color: 'text-slate-700',   sub: 'being tracked' },
          { label: 'Critical / High',  value: critical.length + high.length, icon: AlertTriangle, color: critical.length > 0 ? 'text-red-700' : 'text-orange-700', sub: 'need review' },
          { label: 'Action in 30 Days',value: needsAction30.length,          icon: Clock,         color: needsAction30.length > 0 ? 'text-amber-700' : 'text-slate-500', sub: 'deadlines near' },
          { label: 'Budget Impact',    value: budgetItems.length,            icon: DollarSign,    color: 'text-amber-700',   sub: totalFiscal ? fmt(totalFiscal) : 'flagged' },
          { label: 'Grant Opps',       value: grantItems.length + openFunding.length, icon: TrendingUp, color: 'text-emerald-700', sub: 'funding tracked' },
          { label: 'Board Review',     value: boardItems.length,             icon: FileText,      color: boardItems.length > 0 ? 'text-purple-700' : 'text-slate-500', sub: 'flagged for board' },
        ].map(k => (
          <div key={k.label} className="rounded-xl border border-slate-200 bg-white p-3.5 hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between mb-1.5">
              <k.icon className={`h-4 w-4 ${k.color}`} />
              <span className={`text-2xl font-bold tracking-tight ${k.color}`}>{k.value}</span>
            </div>
            <p className="text-[11px] font-semibold text-slate-700 leading-tight">{k.label}</p>
            <p className="text-[9px] text-slate-400 mt-0.5">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Main 2-col content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* LEFT: Top relevant items (3 cols) */}
        <div className="lg:col-span-3 space-y-3">
          <PanelHeader icon={Zap} label={`Top Items for ${profileName}`} iconColor="text-amber-600" />
          {top.length === 0 ? (
            <EmptyPanel
              icon={Globe}
              title="No items tracked yet"
              message="Add policy items or configure the municipality profile to see relevance-ranked intelligence here."
            />
          ) : (
            <div className="space-y-2">
              {top.map((item, i) => (
                <TopItemRow key={item.id} item={item} rank={i + 1} profile={profile} />
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: Stacked panels (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Upcoming deadlines */}
          <SidePanel title="Upcoming Deadlines" icon={Calendar} iconColor="text-blue-600">
            {upcoming.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">No upcoming deadlines in the next 45 days.</p>
            ) : (
              <div className="space-y-2">
                {upcoming.slice(0, 5).map(ev => {
                  const days = daysUntil(ev.date);
                  const tc = EVENT_TYPE_COLORS[ev.event_type] || EVENT_TYPE_COLORS.custom;
                  const urgent = days !== null && days <= 7;
                  return (
                    <div key={ev.id} className={`flex items-center gap-2.5 p-2 rounded-lg border ${urgent ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-100'}`}>
                      <div className={`text-center min-w-[36px] rounded px-1 py-0.5 ${urgent ? 'bg-red-100' : 'bg-white border border-slate-200'}`}>
                        <p className={`text-xs font-bold ${urgent ? 'text-red-700' : 'text-slate-600'}`}>{days}d</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold text-slate-800 truncate leading-tight">{ev.title}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold border ${tc.bg} ${tc.text} ${tc.border}`}>
                            {EVENT_TYPE_LABELS[ev.event_type]}
                          </span>
                          <span className="text-[9px] text-slate-400">{fmtDate(ev.date)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </SidePanel>

          {/* Funding opportunities */}
          <SidePanel title="Active Funding Opportunities" icon={DollarSign} iconColor="text-emerald-600">
            {openFunding.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">No open funding opportunities tracked.</p>
            ) : (
              <div className="space-y-2">
                {openFunding.slice(0, 4).map(f => (
                  <div key={f.id} className="p-2 rounded-lg border border-emerald-100 bg-emerald-50">
                    <p className="text-[11px] font-semibold text-slate-900 leading-tight truncate">{f.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {f.max_award && <span className="text-[10px] font-bold text-emerald-700">Up to {fmt(f.max_award)}</span>}
                      {f.application_deadline && (
                        <span className="text-[9px] text-slate-500">Due {fmtDate(f.application_deadline)}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SidePanel>

          {/* Board review queue */}
          {boardItems.length > 0 && (
            <SidePanel title="Governing Body Review Queue" icon={FileText} iconColor="text-purple-600">
              <div className="space-y-1.5">
                {boardItems.slice(0, 4).map(item => (
                  <div key={item.id} className="flex items-start gap-2 py-1 border-b border-slate-100 last:border-0">
                    <PriorityBadge priority={item.priority} size="xs" />
                    <p className="text-[11px] text-slate-800 font-medium leading-snug flex-1">{item.title}</p>
                  </div>
                ))}
              </div>
            </SidePanel>
          )}
        </div>
      </div>

      {/* Analysis row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <AnalysisCard
          title="Potential Budget Exposure"
          value={totalFiscal ? fmt(totalFiscal) : `${budgetItems.length} items`}
          sub={totalFiscal ? `across ${budgetItems.length} tracked items` : 'no dollar estimates yet'}
          color="amber"
          icon={DollarSign}
        />
        <AnalysisCard
          title="Compliance & Operations"
          value={activeItems.filter(i => (i.impact_types || []).includes('Compliance')).length}
          sub={`items with compliance implications`}
          color="red"
          icon={Shield}
        />
        <AnalysisCard
          title="Regional / County Items"
          value={activeItems.filter(i => i.jurisdiction === 'county' || i.jurisdiction === 'regional').length}
          sub={profile?.county ? `${profile.county} County area` : 'county & regional'}
          color="teal"
          icon={Globe}
        />
        <AnalysisCard
          title="Officials Tracked"
          value={officials.length}
          sub="federal, state & local"
          color="blue"
          icon={Users}
        />
      </div>

      {/* Department exposure */}
      {deptExposure.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="h-4 w-4 text-slate-500" />
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">Department Exposure</p>
            <p className="text-[10px] text-slate-400 ml-1">— tracked items affecting each department</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {deptExposure.map(([dept, count]) => (
              <div key={dept} className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
                <span className="text-sm font-bold text-slate-800">{count}</span>
                <span className="text-[11px] text-slate-600 font-medium">{dept}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TopItemRow({ item, rank, profile }) {
  const relevanceNote = buildRelevanceNote(item, profile);
  return (
    <div className={`rounded-xl border bg-white p-3.5 hover:shadow-sm transition-shadow ${
      item.priority === 'critical' ? 'border-red-200' :
      item.priority === 'high' ? 'border-orange-200' : 'border-slate-200'
    }`}>
      <div className="flex items-start gap-3">
        <span className="text-xs font-bold text-slate-300 w-5 flex-shrink-0 mt-0.5 text-right">{rank}</span>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
            <JurisdictionBadge jurisdiction={item.jurisdiction} size="xs" />
            <PriorityBadge priority={item.priority} size="xs" />
            <StatusBadge status={item.status} size="xs" />
            {item.identifier && (
              <span className="text-[9px] font-mono text-slate-400">{item.identifier}</span>
            )}
          </div>
          <p className="text-sm font-semibold text-slate-900 leading-snug mb-1">{item.title}</p>
          {relevanceNote && (
            <p className="text-[11px] text-slate-600 leading-relaxed mb-1.5 line-clamp-2">{relevanceNote}</p>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            {item.recommended_action && item.recommended_action !== 'none' && (
              <ActionBadge action={item.recommended_action} />
            )}
            {(item.departments_affected || []).slice(0, 3).map(d => (
              <span key={d} className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-medium">{d}</span>
            ))}
          </div>
        </div>
        <div className="flex-shrink-0 text-right">
          <RelevanceScore score={item.relevance_score} />
          {item.hearing_date && daysUntil(item.hearing_date) <= 30 && (
            <p className="text-[9px] text-red-600 font-semibold mt-1">
              Hearing {daysUntil(item.hearing_date)}d
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function PanelHeader({ icon: Icon, label, iconColor }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className={`h-4 w-4 ${iconColor}`} />
      <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">{label}</p>
    </div>
  );
}

function SidePanel({ title, icon: Icon, iconColor, children }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`h-3.5 w-3.5 ${iconColor}`} />
        <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">{title}</p>
      </div>
      {children}
    </div>
  );
}

function AnalysisCard({ title, value, sub, color, icon: Icon }) {
  const colors = {
    amber: 'border-amber-200 bg-amber-50',
    red:   'border-red-200 bg-red-50',
    teal:  'border-teal-200 bg-teal-50',
    blue:  'border-blue-100 bg-blue-50',
  };
  const textColors = { amber: 'text-amber-800', red: 'text-red-800', teal: 'text-teal-800', blue: 'text-blue-800' };
  const subColors  = { amber: 'text-amber-600', red: 'text-red-600', teal: 'text-teal-600', blue: 'text-blue-600' };
  const iconColors = { amber: 'text-amber-600', red: 'text-red-600', teal: 'text-teal-600', blue: 'text-blue-600' };

  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">{title}</p>
        <Icon className={`h-4 w-4 ${iconColors[color]}`} />
      </div>
      <p className={`text-2xl font-bold tracking-tight ${textColors[color]}`}>{value}</p>
      <p className={`text-[10px] mt-0.5 ${subColors[color]}`}>{sub}</p>
    </div>
  );
}

function EmptyPanel({ icon: Icon, title, message }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
      <Icon className="h-8 w-8 mx-auto mb-3 text-slate-300" />
      <p className="text-sm font-semibold text-slate-600 mb-1">{title}</p>
      <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">{message}</p>
    </div>
  );
}