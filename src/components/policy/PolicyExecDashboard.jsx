/**
 * PolicyExecDashboard — Executive summary view for the policy module
 */
import React, { useMemo } from 'react';
import { AlertTriangle, TrendingUp, Calendar, DollarSign, Shield, Globe, Users, Zap } from 'lucide-react';
import { PriorityBadge, JurisdictionBadge, StatusBadge, ActionBadge } from './PolicyBadges';
import { sortByRelevance, getUpcomingEvents, aggregateFiscalImpact, buildRelevanceNote, fmt, fmtDate, daysUntil, EVENT_TYPE_LABELS, EVENT_TYPE_COLORS } from './policyEngine';

export default function PolicyExecDashboard({ items, officials, events, funding, profile }) {
  const profileName = profile?.name || 'Your Municipality';

  const critical = useMemo(() => items.filter(i => i.priority === 'critical' && !i.is_archived), [items]);
  const high = useMemo(() => items.filter(i => i.priority === 'high' && !i.is_archived), [items]);
  const top = useMemo(() => sortByRelevance(items.filter(i => !i.is_archived)).slice(0, 5), [items]);
  const upcoming = useMemo(() => getUpcomingEvents(events, 45), [events]);
  const openFunding = useMemo(() => funding.filter(f => f.status === 'open' || f.status === 'upcoming'), [funding]);
  const totalFiscal = useMemo(() => aggregateFiscalImpact(items.filter(i => i.fiscal_impact_amount && !i.is_archived)), [items]);

  return (
    <div className="space-y-6">
      {/* Alert banner for critical items */}
      {critical.length > 0 && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-red-700" />
            <p className="text-sm font-bold text-red-800">{critical.length} Critical Policy Item{critical.length !== 1 ? 's' : ''} Require Immediate Attention</p>
          </div>
          <div className="space-y-1.5">
            {critical.slice(0, 3).map(item => (
              <div key={item.id} className="flex items-start gap-2 text-[11px] text-red-800">
                <span className="font-mono text-red-500 mt-0.5 flex-shrink-0">{item.identifier || '•'}</span>
                <span className="font-semibold">{item.title}</span>
                {item.recommended_action && item.recommended_action !== 'none' && (
                  <span className="ml-auto flex-shrink-0"><ActionBadge action={item.recommended_action} /></span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Active Items', value: items.filter(i => !i.is_archived).length, icon: Globe, color: 'text-slate-700' },
          { label: 'Critical / High', value: critical.length + high.length, icon: AlertTriangle, color: critical.length > 0 ? 'text-red-700' : 'text-orange-600' },
          { label: 'Tracked Officials', value: officials.length, icon: Users, color: 'text-blue-700' },
          { label: 'Upcoming Events', value: upcoming.length, icon: Calendar, color: upcoming.some(e => daysUntil(e.date) <= 7) ? 'text-red-600' : 'text-teal-700' },
          { label: 'Funding Open', value: openFunding.length, icon: DollarSign, color: 'text-emerald-700' },
        ].map(k => (
          <div key={k.label} className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="flex items-center gap-2 mb-1">
              <k.icon className={`h-4 w-4 ${k.color}`} />
              <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
            </div>
            <p className="text-[10px] text-slate-500 font-medium">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Main 2-col grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Items by Relevance */}
        <DashPanel title="Top Items by Municipal Relevance" icon={Zap} iconColor="text-amber-600">
          {top.length === 0 ? (
            <EmptyState msg="No active items tracked." />
          ) : (
            <div className="space-y-2">
              {top.map((item, i) => (
                <div key={item.id} className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-100 bg-slate-50">
                  <span className="text-[10px] font-bold text-slate-400 w-4 mt-0.5 flex-shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap gap-1 mb-1">
                      <JurisdictionBadge jurisdiction={item.jurisdiction} size="xs" />
                      <PriorityBadge priority={item.priority} size="xs" />
                    </div>
                    <p className="text-xs font-semibold text-slate-900 leading-snug">{item.title}</p>
                    {item.recommended_action && item.recommended_action !== 'none' && (
                      <div className="mt-1"><ActionBadge action={item.recommended_action} /></div>
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 flex-shrink-0">{Math.round(item.relevance_score || 0)}</span>
                </div>
              ))}
            </div>
          )}
        </DashPanel>

        {/* Upcoming Events */}
        <DashPanel title="Upcoming Deadlines & Events" icon={Calendar} iconColor="text-blue-600">
          {upcoming.length === 0 ? (
            <EmptyState msg="No upcoming events in the next 45 days." />
          ) : (
            <div className="space-y-2">
              {upcoming.slice(0, 6).map(ev => {
                const days = daysUntil(ev.date);
                const tc = EVENT_TYPE_COLORS[ev.event_type] || EVENT_TYPE_COLORS.custom;
                return (
                  <div key={ev.id} className="flex items-center gap-2.5">
                    <div className={`text-center min-w-[40px] rounded border px-1 py-1 ${days <= 7 ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}>
                      <p className={`text-xs font-bold ${days <= 7 ? 'text-red-700' : 'text-slate-700'}`}>{days}d</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">{ev.title}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${tc.bg} ${tc.text}`}>
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
        </DashPanel>

        {/* Why this matters to [Municipality] */}
        <DashPanel title={`Why This Matters to ${profileName}`} icon={Shield} iconColor="text-slate-600">
          {top.length === 0 ? (
            <EmptyState msg="Add tracked items to see municipality-specific analysis." />
          ) : (
            <div className="space-y-2">
              {top.slice(0, 4).map(item => (
                <div key={item.id} className="bg-amber-50 border border-amber-100 rounded p-2.5">
                  <p className="text-[10px] font-bold text-slate-700 truncate mb-0.5">{item.title}</p>
                  <p className="text-[10px] text-amber-900 leading-relaxed">
                    {buildRelevanceNote(item, profile)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </DashPanel>

        {/* Funding Opportunities */}
        <DashPanel title="Active Funding Opportunities" icon={DollarSign} iconColor="text-emerald-600">
          {openFunding.length === 0 ? (
            <EmptyState msg="No open funding opportunities tracked." />
          ) : (
            <div className="space-y-2">
              {openFunding.slice(0, 5).map(f => (
                <div key={f.id} className="flex items-start gap-2.5 p-2 rounded border border-slate-100 bg-white">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-900 truncate">{f.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {f.max_award && (
                        <span className="text-[10px] text-emerald-700 font-bold">Up to {fmt(f.max_award)}</span>
                      )}
                      {f.application_deadline && (
                        <span className="text-[9px] text-slate-400">Due {fmtDate(f.application_deadline)}</span>
                      )}
                    </div>
                    {f.departments_relevant?.length > 0 && (
                      <p className="text-[9px] text-slate-500 mt-0.5">{f.departments_relevant.join(', ')}</p>
                    )}
                  </div>
                  <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${f.status === 'open' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                    {f.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </DashPanel>
      </div>

      {/* Potential Budget / Operational / Regional impact row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InsightPanel title="Potential Budget Impact" color="amber">
          {totalFiscal ? (
            <p className="text-2xl font-bold text-amber-800">{fmt(totalFiscal)}</p>
          ) : (
            <p className="text-sm text-amber-700">No dollar estimates entered yet.</p>
          )}
          <p className="text-[10px] text-amber-700 mt-1">
            Across {items.filter(i => i.fiscal_impact_amount).length} tracked item{items.filter(i => i.fiscal_impact_amount).length !== 1 ? 's' : ''} with fiscal estimates
          </p>
        </InsightPanel>

        <InsightPanel title="Operational / Compliance Impact" color="blue">
          <p className="text-2xl font-bold text-blue-800">
            {items.filter(i => (i.impact_types || []).includes('Compliance') && !i.is_archived).length}
          </p>
          <p className="text-[10px] text-blue-700 mt-1">
            Items with compliance implications · {items.filter(i => (i.impact_types || []).includes('Operations') && !i.is_archived).length} with operational impact
          </p>
        </InsightPanel>

        <InsightPanel title="Regional / County Relevance" color="teal">
          <p className="text-2xl font-bold text-teal-800">
            {items.filter(i => i.jurisdiction === 'county' || i.jurisdiction === 'regional').length}
          </p>
          <p className="text-[10px] text-teal-700 mt-1">
            County or regional-level items tracked {profile?.county ? `for ${profile.county} County` : ''}
          </p>
        </InsightPanel>
      </div>
    </div>
  );
}

function DashPanel({ title, icon: Icon, iconColor, children }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`h-4 w-4 ${iconColor}`} />
        <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">{title}</p>
      </div>
      {children}
    </div>
  );
}

function InsightPanel({ title, color, children }) {
  const map = {
    amber: 'border-amber-200 bg-amber-50',
    blue: 'border-blue-200 bg-blue-50',
    teal: 'border-teal-200 bg-teal-50',
  };
  return (
    <div className={`rounded-xl border p-4 ${map[color] || map.amber}`}>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-2">{title}</p>
      {children}
    </div>
  );
}

function EmptyState({ msg }) {
  return <p className="text-xs text-slate-400 italic py-2">{msg}</p>;
}