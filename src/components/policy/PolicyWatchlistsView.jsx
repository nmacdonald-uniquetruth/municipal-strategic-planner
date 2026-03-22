/**
 * PolicyWatchlistsView — Watchlists & Alerts management panel
 */
import React, { useState } from 'react';
import { Bell, Plus, X, CheckCircle, Archive, ChevronDown, AlertTriangle, Clock, DollarSign, FileText, Users, BookOpen, Bookmark, Eye } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fmtDate, daysUntil } from './policyEngine';

const ALERT_SEVERITY_STYLES = {
  critical: 'bg-red-50 border-red-300 text-red-900',
  high:     'bg-orange-50 border-orange-300 text-orange-900',
  medium:   'bg-amber-50 border-amber-200 text-amber-900',
  info:     'bg-blue-50 border-blue-200 text-blue-900',
};

const ALERT_ICON_COLORS = {
  critical: 'text-red-600', high: 'text-orange-600', medium: 'text-amber-600', info: 'text-blue-600',
};

const WATCH_TYPE_ICONS = {
  topic:          BookOpen,
  bill:           FileText,
  official:       Users,
  department:     Users,
  strategic_goal: CheckCircle,
  budget:         DollarSign,
  grant:          DollarSign,
  custom:         Bookmark,
};

export default function PolicyWatchlistsView({ items = [], profile }) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('alerts');
  const [showNewWatchlist, setShowNewWatchlist] = useState(false);
  const [newWatch, setNewWatch] = useState({ name: '', watch_type: 'topic', watch_value: '', alert_on_deadline_days: 30, alert_on_status_change: true });

  const { data: watchlists = [] } = useQuery({
    queryKey: ['policy_watchlists'],
    queryFn: () => base44.entities.PolicyWatchlist.filter({}),
    initialData: [],
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['policy_alerts'],
    queryFn: () => base44.entities.PolicyAlert.filter({}),
    initialData: [],
  });

  const createWatchlist = useMutation({
    mutationFn: d => base44.entities.PolicyWatchlist.create(d),
    onSuccess: () => { queryClient.invalidateQueries(['policy_watchlists']); setShowNewWatchlist(false); setNewWatch({ name: '', watch_type: 'topic', watch_value: '', alert_on_deadline_days: 30, alert_on_status_change: true }); },
  });

  const deleteWatchlist = useMutation({
    mutationFn: id => base44.entities.PolicyWatchlist.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['policy_watchlists']),
  });

  const dismissAlert = useMutation({
    mutationFn: id => base44.entities.PolicyAlert.update(id, { is_dismissed: true }),
    onSuccess: () => queryClient.invalidateQueries(['policy_alerts']),
  });

  const markAlertRead = useMutation({
    mutationFn: id => base44.entities.PolicyAlert.update(id, { is_read: true }),
    onSuccess: () => queryClient.invalidateQueries(['policy_alerts']),
  });

  const activeAlerts  = alerts.filter(a => !a.is_dismissed && !a.is_read);
  const readAlerts    = alerts.filter(a => a.is_read && !a.is_dismissed);
  const dismissed     = alerts.filter(a => a.is_dismissed);

  // Derive watchlist-matched items
  const watchlistMatches = watchlists.filter(w => w.is_active).map(w => {
    const matched = items.filter(item => {
      if (w.watch_type === 'topic') return (item.category || '').toLowerCase().includes((w.watch_value || '').toLowerCase());
      if (w.watch_type === 'bill') return item.identifier === w.watch_value;
      if (w.watch_type === 'department') return (item.departments_affected || []).includes(w.watch_value);
      if (w.watch_type === 'strategic_goal') return (item.strategic_goals || []).includes(w.watch_value);
      return false;
    });
    return { ...w, matched };
  });

  return (
    <div className="space-y-4">
      {/* Tab switcher */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {[['alerts', `Alerts ${activeAlerts.length > 0 ? `(${activeAlerts.length})` : ''}`], ['watchlists', 'Watchlists']].map(([id, label]) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors ${activeTab === id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Alerts tab */}
      {activeTab === 'alerts' && (
        <div className="space-y-4">
          {/* Active alerts */}
          <div>
            <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
              Active Alerts {activeAlerts.length > 0 && <span className="ml-1 text-red-600">({activeAlerts.length})</span>}
            </p>
            {activeAlerts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                <Bell className="h-6 w-6 mx-auto mb-2 text-slate-300" />
                <p className="text-sm text-slate-500">No active alerts.</p>
                <p className="text-xs text-slate-400">Alerts are generated automatically based on deadlines and priority thresholds.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {activeAlerts.map(alert => (
                  <AlertRow key={alert.id} alert={alert} onRead={() => markAlertRead.mutate(alert.id)} onDismiss={() => dismissAlert.mutate(alert.id)} />
                ))}
              </div>
            )}
          </div>

          {/* Recently read */}
          {readAlerts.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Recently Reviewed ({readAlerts.length})</p>
              <div className="space-y-1.5">
                {readAlerts.slice(0, 5).map(alert => (
                  <AlertRow key={alert.id} alert={alert} muted onDismiss={() => dismissAlert.mutate(alert.id)} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Watchlists tab */}
      {activeTab === 'watchlists' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">{watchlists.filter(w => w.is_active).length} active watchlists</p>
            <button onClick={() => setShowNewWatchlist(v => !v)}
              className="flex items-center gap-1.5 text-xs font-semibold bg-slate-900 text-white px-3 py-1.5 rounded-lg hover:bg-slate-700 transition-colors">
              <Plus className="h-3.5 w-3.5" /> New Watchlist
            </button>
          </div>

          {/* New watchlist form */}
          {showNewWatchlist && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
              <p className="text-xs font-bold text-slate-700">Create Watchlist</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Name</label>
                  <input value={newWatch.name} onChange={e => setNewWatch(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Budget Season 2027"
                    className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-400" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Watch Type</label>
                  <select value={newWatch.watch_type} onChange={e => setNewWatch(f => ({ ...f, watch_type: e.target.value }))}
                    className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none">
                    {['topic', 'bill', 'official', 'department', 'strategic_goal', 'custom'].map(t => (
                      <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1).replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Watch Value</label>
                  <input value={newWatch.watch_value} onChange={e => setNewWatch(f => ({ ...f, watch_value: e.target.value }))}
                    placeholder="e.g. Revenue Sharing, LD 2003, Finance..."
                    className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-400" />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => createWatchlist.mutate({ ...newWatch, is_active: true })}
                  disabled={!newWatch.name || createWatchlist.isPending}
                  className="text-xs font-semibold bg-slate-900 text-white px-4 py-1.5 rounded-lg hover:bg-slate-700 disabled:opacity-50 transition-colors">
                  Create
                </button>
                <button onClick={() => setShowNewWatchlist(false)} className="text-xs text-slate-500 px-3 py-1.5 rounded-lg hover:bg-slate-100">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Watchlist cards */}
          {watchlists.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
              <Bookmark className="h-6 w-6 mx-auto mb-2 text-slate-300" />
              <p className="text-sm text-slate-500 mb-1">No watchlists yet</p>
              <p className="text-xs text-slate-400">Create a watchlist to automatically surface relevant items by topic, department, or goal.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {watchlistMatches.map(w => {
                const WIcon = WATCH_TYPE_ICONS[w.watch_type] || Bookmark;
                return (
                  <div key={w.id} className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                          <WIcon className="h-4 w-4 text-slate-500" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{w.name}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            {w.watch_type.replace('_', ' ')} · <span className="font-medium text-slate-700">{w.watch_value}</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${w.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                          {w.is_active ? 'Active' : 'Paused'}
                        </span>
                        <button onClick={() => { if (window.confirm('Delete this watchlist?')) deleteWatchlist.mutate(w.id); }}
                          className="text-slate-300 hover:text-red-500 transition-colors">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    {w.matched.length > 0 && (
                      <div className="mt-3 pl-10">
                        <p className="text-[10px] font-semibold text-slate-500 mb-1">{w.matched.length} item{w.matched.length !== 1 ? 's' : ''} matched</p>
                        <div className="space-y-1">
                          {w.matched.slice(0, 3).map(item => (
                            <p key={item.id} className="text-[11px] text-slate-700 truncate">→ {item.title}</p>
                          ))}
                          {w.matched.length > 3 && (
                            <p className="text-[10px] text-slate-400">+{w.matched.length - 3} more</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AlertRow({ alert, muted, onRead, onDismiss }) {
  const severityStyle = ALERT_SEVERITY_STYLES[alert.severity] || ALERT_SEVERITY_STYLES.medium;
  const iconColor = ALERT_ICON_COLORS[alert.severity] || 'text-amber-600';
  return (
    <div className={`rounded-xl border p-3.5 ${muted ? 'bg-slate-50 border-slate-200 opacity-70' : severityStyle}`}>
      <div className="flex items-start gap-2.5">
        <Bell className={`h-4 w-4 flex-shrink-0 mt-0.5 ${iconColor}`} />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold">{alert.title}</p>
          {alert.message && <p className="text-[11px] mt-0.5 opacity-80 leading-relaxed">{alert.message}</p>}
          {alert.due_date && (
            <p className="text-[10px] mt-1 font-semibold flex items-center gap-1">
              <Clock className="h-3 w-3" /> Due {fmtDate(alert.due_date)}
            </p>
          )}
        </div>
        <div className="flex gap-1 flex-shrink-0">
          {!muted && onRead && (
            <button onClick={onRead} title="Mark reviewed" className="p-1 rounded hover:bg-white/50 transition-colors">
              <Eye className="h-3.5 w-3.5" />
            </button>
          )}
          {onDismiss && (
            <button onClick={onDismiss} title="Dismiss" className="p-1 rounded hover:bg-white/50 transition-colors">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}