/**
 * DataSourceAdminPanel — Live data connector management UI
 * Shows connector health, sync logs, last refresh times, manual sync triggers.
 */
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  RefreshCw, CheckCircle, AlertTriangle, XCircle, Clock, Zap,
  Globe, FileText, DollarSign, Building2, ChevronDown, ChevronRight,
  Play, Pause, Settings, Info, ExternalLink, Activity
} from 'lucide-react';

const SOURCE_CONNECTORS = [
  {
    id: 'congress_gov_bills',
    name: 'Congress.gov — Bills & Resolutions',
    type: 'Federal Legislation',
    jurisdiction: 'Federal',
    access: 'REST API (JSON)',
    auth: 'API Key (optional)',
    refresh_hours: 6,
    source_url: 'https://api.congress.gov/v3',
    description: 'Official U.S. Congress bill data, actions, sponsors, and committees from Congress.gov API v3.',
    requires_key: 'CONGRESS_API_KEY',
    icon: FileText,
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
  },
  {
    id: 'federal_register',
    name: 'Federal Register — Rulemaking',
    type: 'Agency Rulemaking',
    jurisdiction: 'Federal',
    access: 'REST API (JSON)',
    auth: 'None (public)',
    refresh_hours: 12,
    source_url: 'https://www.federalregister.gov/api/v1',
    description: 'Federal rulemaking notices, proposed rules, comment deadlines from the Federal Register API.',
    requires_key: null,
    icon: Globe,
    color: 'text-purple-700',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
  },
  {
    id: 'grants_gov',
    name: 'Grants.gov — Federal Grants',
    type: 'Funding Announcements',
    jurisdiction: 'Federal',
    access: 'REST API (JSON)',
    auth: 'None (public)',
    refresh_hours: 12,
    source_url: 'https://www.grants.gov',
    description: 'Federal grant opportunities filtered for municipal eligibility (City/Township Governments).',
    requires_key: null,
    icon: DollarSign,
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
  },
  {
    id: 'state_legislature',
    name: 'State Legislature (Profile-Driven)',
    type: 'State Legislation',
    jurisdiction: 'State',
    access: 'RSS/XML + HTML Parser',
    auth: 'None (public)',
    refresh_hours: 4,
    source_url: 'Driven by Municipality Profile state',
    description: 'Pulls bill listings and committee calendars from the configured municipality\'s state legislature website.',
    requires_key: null,
    icon: Building2,
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
  },
];

const STATUS_CONFIG = {
  completed: { label: 'Synced',   color: 'text-emerald-700', bg: 'bg-emerald-50',  border: 'border-emerald-200', icon: CheckCircle },
  partial:   { label: 'Partial',  color: 'text-amber-700',   bg: 'bg-amber-50',    border: 'border-amber-200',   icon: AlertTriangle },
  failed:    { label: 'Failed',   color: 'text-red-700',     bg: 'bg-red-50',      border: 'border-red-200',     icon: XCircle },
  running:   { label: 'Running',  color: 'text-blue-700',    bg: 'bg-blue-50',     border: 'border-blue-200',    icon: RefreshCw },
  never:     { label: 'Not Run',  color: 'text-slate-500',   bg: 'bg-slate-50',    border: 'border-slate-200',   icon: Clock },
};

function timeAgo(isoStr) {
  if (!isoStr) return 'Never';
  const ms = Date.now() - new Date(isoStr).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function isStale(isoStr, thresholdHours) {
  if (!isoStr) return true;
  const ms = Date.now() - new Date(isoStr).getTime();
  return ms > thresholdHours * 60 * 60 * 1000;
}

export default function DataSourceAdminPanel({ profile }) {
  const queryClient = useQueryClient();
  const [syncing, setSyncing] = useState(false);
  const [syncingSource, setSyncingSource] = useState(null);
  const [syncResult, setSyncResult] = useState(null);
  const [expandedLog, setExpandedLog] = useState(null);

  const { data: logs = [] } = useQuery({
    queryKey: ['policy_ingestion_logs'],
    queryFn: () => base44.entities.PolicyIngestionLog.list('-created_date', 20),
    initialData: [],
    refetchInterval: 30000,
  });

  // Get most recent log per source
  const lastSyncBySource = {};
  logs.forEach(log => {
    (log.source_name || '').split(',').map(s => s.trim()).forEach(src => {
      if (!lastSyncBySource[src] || new Date(log.completed_at) > new Date(lastSyncBySource[src].completed_at)) {
        lastSyncBySource[src] = log;
      }
    });
  });

  const lastFullSync = logs.find(l => l.source_type === 'multi_source');

  const runSync = async (sources = ['all']) => {
    setSyncing(true);
    setSyncingSource(sources[0] === 'all' ? 'all' : sources[0]);
    setSyncResult(null);
    try {
      const res = await base44.functions.invoke('policyDataSync', { sources, force: true });
      setSyncResult(res.data);
      queryClient.invalidateQueries(['legislation']);
      queryClient.invalidateQueries(['policy_funding']);
      queryClient.invalidateQueries(['policy_ingestion_logs']);
    } catch (err) {
      setSyncResult({ error: err.message });
    } finally {
      setSyncing(false);
      setSyncingSource(null);
    }
  };

  const isSyncingSource = (id) => syncing && (syncingSource === 'all' || syncingSource === id);

  return (
    <div className="space-y-5">
      {/* Header + full sync button */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-slate-900">Live Data Sources</p>
          <p className="text-xs text-slate-500 mt-0.5">
            Connector status, refresh history, and sync controls for {profile?.name || 'this municipality'} · {profile?.state || '—'}
          </p>
          {lastFullSync?.completed_at && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <Clock className="h-3 w-3 text-slate-400" />
              <p className="text-[10px] text-slate-500">
                Last full sync: <span className="font-semibold text-slate-700">{timeAgo(lastFullSync.completed_at)}</span>
                {' · '}{new Date(lastFullSync.completed_at).toLocaleString()}
              </p>
            </div>
          )}
        </div>
        <button
          onClick={() => runSync(['all'])}
          disabled={syncing}
          className="flex items-center gap-2 text-xs font-bold bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-700 disabled:opacity-50 transition-colors flex-shrink-0"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${syncing && syncingSource === 'all' ? 'animate-spin' : ''}`} />
          {syncing && syncingSource === 'all' ? 'Syncing All Sources...' : 'Sync All Sources Now'}
        </button>
      </div>

      {/* Sync result banner */}
      {syncResult && (
        <div className={`rounded-xl border p-3.5 ${syncResult.error ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
          {syncResult.error ? (
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <p className="text-xs font-semibold text-red-800">Sync failed: {syncResult.error}</p>
            </div>
          ) : (
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-emerald-800">
                  Sync complete · {syncResult.total_upserted} records updated · {syncResult.sources_run?.length} sources
                </p>
                {syncResult.errors?.length > 0 && (
                  <p className="text-[10px] text-amber-700 mt-0.5">
                    {syncResult.errors.length} warning{syncResult.errors.length !== 1 ? 's' : ''}: {syncResult.errors[0]}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Connector cards */}
      <div className="space-y-3">
        {SOURCE_CONNECTORS.map(connector => {
          const lastLog = lastSyncBySource[connector.id];
          const lastAt = lastLog?.completed_at;
          const status = !lastAt ? 'never' : lastLog.status || 'completed';
          const stale = isStale(lastAt, connector.refresh_hours);
          const StatusIcon = STATUS_CONFIG[status]?.icon || Clock;
          const CIcon = connector.icon;
          const isSyncing = isSyncingSource(connector.id);

          return (
            <div key={connector.id} className={`rounded-xl border ${stale && lastAt ? 'border-amber-200' : 'border-slate-200'} bg-white overflow-hidden`}>
              <div className="p-4">
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 ${connector.bg} border ${connector.border}`}>
                    <CIcon className={`h-4 w-4 ${connector.color}`} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-slate-900">{connector.name}</p>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide border ${STATUS_CONFIG[status]?.bg} ${STATUS_CONFIG[status]?.color} ${STATUS_CONFIG[status]?.border}`}>
                        {STATUS_CONFIG[status]?.label}
                      </span>
                      {stale && lastAt && (
                        <span className="text-[9px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full font-bold">
                          Stale
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{connector.description}</p>

                    {/* Metadata row */}
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                      {[
                        { label: 'Type', value: connector.type },
                        { label: 'Access', value: connector.access },
                        { label: 'Auth', value: connector.auth },
                        { label: 'Refresh', value: `Every ${connector.refresh_hours}h` },
                        lastAt && { label: 'Last Sync', value: timeAgo(lastAt) },
                        lastLog && { label: 'Records', value: `${lastLog.records_normalized || 0} normalized` },
                      ].filter(Boolean).map(m => (
                        <span key={m.label} className="text-[10px] text-slate-500">
                          <span className="font-bold text-slate-600">{m.label}:</span> {m.value}
                        </span>
                      ))}
                    </div>

                    {/* Auth key notice */}
                    {connector.requires_key && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <Info className="h-3 w-3 text-blue-500" />
                        <p className="text-[10px] text-blue-700 font-medium">
                          Set <code className="bg-blue-100 px-1 py-0.5 rounded text-[9px]">{connector.requires_key}</code> in Environment Variables for higher rate limits
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <a href={connector.source_url !== 'Driven by Municipality Profile state' ? connector.source_url : '#'} target="_blank" rel="noopener noreferrer"
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                    <button
                      onClick={() => runSync([connector.id])}
                      disabled={syncing}
                      className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 border border-slate-200 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
                    >
                      <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin text-blue-600' : ''}`} />
                      {isSyncing ? 'Syncing...' : 'Sync Now'}
                    </button>
                  </div>
                </div>

                {/* Error log if failed */}
                {lastLog?.error_log && status === 'failed' && (
                  <div className="mt-3 ml-12 bg-red-50 border border-red-200 rounded-lg p-2.5">
                    <p className="text-[10px] font-bold text-red-700 mb-1">Error Log</p>
                    <pre className="text-[9px] text-red-700 whitespace-pre-wrap font-mono">{lastLog.error_log.slice(0, 300)}</pre>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Sync history log */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="bg-slate-900 text-white px-4 py-2.5 flex items-center gap-2">
          <Activity className="h-3.5 w-3.5" />
          <p className="text-xs font-bold">Sync History</p>
        </div>
        {logs.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">No sync runs recorded yet. Run a sync above to get started.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {logs.slice(0, 10).map(log => {
              const StatusIcon = STATUS_CONFIG[log.status]?.icon || Clock;
              const isExpanded = expandedLog === log.id;
              return (
                <div key={log.id}>
                  <button onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left">
                    <StatusIcon className={`h-4 w-4 flex-shrink-0 ${STATUS_CONFIG[log.status]?.color || 'text-slate-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">{log.source_name || 'Multi-source sync'}</p>
                      <p className="text-[10px] text-slate-400">
                        {log.completed_at ? new Date(log.completed_at).toLocaleString() : new Date(log.started_at).toLocaleString()}
                        {' · '}{log.records_normalized || 0} normalized · {log.records_errored || 0} errors
                        {' · '}by {log.triggered_by || 'system'}
                      </p>
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${STATUS_CONFIG[log.status]?.bg} ${STATUS_CONFIG[log.status]?.color} ${STATUS_CONFIG[log.status]?.border}`}>
                      {STATUS_CONFIG[log.status]?.label}
                    </span>
                    {isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-slate-400" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-400" />}
                  </button>
                  {isExpanded && log.error_log && (
                    <div className="px-4 pb-3 ml-7">
                      <p className="text-[10px] font-bold text-slate-600 mb-1">Error / Warning Log</p>
                      <pre className="text-[9px] text-red-700 bg-red-50 border border-red-100 rounded p-2.5 whitespace-pre-wrap font-mono">{log.error_log}</pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Architecture note */}
      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
        <div className="flex items-start gap-2">
          <Info className="h-4 w-4 text-slate-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[11px] font-bold text-slate-600 mb-1">Source Connector Architecture</p>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Each connector fetches from its official public API or feed, normalizes data into the internal schema, and upserts records
              without overwriting staff edits (priority flags, notes, watchlist status are preserved).
              Federal Register and Grants.gov require no API key. Congress.gov works without a key but at lower rate limits —
              set <code className="bg-white border border-slate-200 px-1 rounded text-[9px]">CONGRESS_API_KEY</code> for production use.
              State connectors are driven by the Municipality Profile state field and can be extended to any U.S. state.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}