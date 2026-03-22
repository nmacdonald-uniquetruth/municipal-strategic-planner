/**
 * LegislativeTracking — Municipal Legislative & Policy Intelligence Module
 * Full redesign: module-level nav, executive dashboard, bill tracker,
 * officials, calendar, watchlists/alerts, impact analysis, reports, settings.
 */
import React, { useState, useMemo, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Engine & hooks
import { calcRelevanceScore, filterItems, sortByRelevance, fmt, fmtDate, daysUntil, DEFAULT_DEPARTMENTS, TOPIC_CATEGORIES } from '../components/policy/policyEngine';
import { usePolicyIntelligence } from '../components/policy/usePolicyIntelligence';

// Components
import PolicyExecDashboard from '../components/policy/PolicyExecDashboard';
import LegislationCard from '../components/policy/LegislationCard';
import LegislationForm from '../components/policy/LegislationForm';
import PolicyFilters from '../components/policy/PolicyFilters';
import OfficialCard from '../components/policy/OfficialCard';
import PolicyCalendarView from '../components/policy/PolicyCalendarView';
import MunicipalityProfilePanel from '../components/policy/MunicipalityProfilePanel';
import PolicyWatchlistsView from '../components/policy/PolicyWatchlistsView';
import PolicyReportsView from '../components/policy/PolicyReportsView';
import PolicyItemDetailDrawer from '../components/policy/PolicyItemDetailDrawer';
import DataSourceAdminPanel from '../components/policy/DataSourceAdminPanel';
import FiscalImpactModeler from '../components/policy/FiscalImpactModeler';
import { PriorityBadge, StatusBadge, JurisdictionBadge, ActionBadge, RelevanceScore, ImpactBadge } from '../components/policy/PolicyBadges';

import {
  Landmark, LayoutDashboard, List, Users, Calendar, DollarSign,
  Settings, Plus, AlertTriangle, FileText, Bell, Target, Search,
  Filter, X, ChevronDown, ExternalLink, Flag, Archive, Eye,
  Building2, BookOpen, Sparkles, Download, RefreshCw
} from 'lucide-react';

// ── Seed / default data ────────────────────────────────────────────────────────
const SEED_ITEMS = [
  { id: 's1', identifier: 'LD 2003', title: 'An Act to Increase State Revenue Sharing with Municipalities', jurisdiction: 'state', category: 'Revenue Sharing', status: 'in_committee', priority: 'critical', impact_level: 'very_high', summary: 'Would increase the percentage of state income and sales tax revenues shared with municipalities from 5% to 7%, providing significant additional unrestricted revenue for local governments.', municipal_relevance: 'Could provide an additional $180,000–$240,000 annually in unrestricted state aid, directly reducing the property tax burden on Machias residents and stabilizing the General Fund.', sponsor: 'Rep. Janet Mills', committee: 'Taxation Committee', last_action: 'Public hearing scheduled', last_action_date: '2026-03-10', hearing_date: '2026-04-02', departments_affected: ['Finance', 'Administration'], strategic_goals: ['Financial Sustainability', 'Operational Efficiency'], impact_types: ['Revenue', 'Governance'], fiscal_impact_note: 'Estimated $180K–$240K additional annual unrestricted revenue.', fiscal_impact_amount: 210000, recommended_action: 'advocate', recommended_action_note: 'Coordinate with Maine Municipal Association to submit written testimony in support.', probability_of_passage: 55, relevance_score: 92, is_watched: true, is_flagged_budget: true, is_flagged_board: true },
  { id: 's2', identifier: 'HB 4412', title: 'Federal Infrastructure Investment Act — Municipal Road Funding Extension', jurisdiction: 'federal', category: 'Infrastructure', status: 'signed', priority: 'high', impact_level: 'high', summary: 'Extends federal formula funding for local road maintenance and bridge repair through FY2028, with a new 10% set-aside for small municipalities under 5,000 population.', municipal_relevance: 'Machias is eligible under the small municipality set-aside. Public Works should identify qualifying projects and begin application preparation for next grant cycle opening in Q3 2026.', sponsor: 'Sen. Collins', last_action: 'Signed into law', last_action_date: '2026-02-14', effective_date: '2026-10-01', departments_affected: ['Public Works'], strategic_goals: ['Infrastructure', 'Capital Planning'], impact_types: ['Capital', 'Grant Opportunity'], fiscal_impact_note: 'Potential $50K–$150K in road/bridge funding depending on project eligibility.', fiscal_impact_amount: 100000, recommended_action: 'prepare', probability_of_passage: 100, relevance_score: 78, is_watched: true, is_flagged_grant: true, is_flagged_budget: true },
  { id: 's3', identifier: 'LD 1887', title: 'Mandatory EMS Response Time Reporting for Municipal Agencies', jurisdiction: 'state', category: 'EMS / Ambulance', status: 'in_committee', priority: 'high', impact_level: 'high', summary: 'Requires all municipal EMS agencies to report response time data quarterly to MEMA and publish results publicly. Establishes minimum reporting standards and penalties for non-compliance.', municipal_relevance: 'Directly affects the Machias Ambulance Service. Will require implementation of a tracking system, staff training, and quarterly report submission.', sponsor: 'Rep. Amy Arata', committee: 'Health & Human Services Committee', last_action: 'Amendment submitted', last_action_date: '2026-03-05', vote_date: '2026-04-15', departments_affected: ['EMS / Ambulance', 'Finance', 'Administration'], strategic_goals: ['Compliance', 'Public Safety'], impact_types: ['Compliance', 'Operations', 'HR'], compliance_impact: 'New quarterly reporting mandate. Requires data tracking capability and staff time.', operational_impact: 'Will require EMS to implement call data logging and response time tracking.', fiscal_impact_note: 'Estimated $5K–$15K for software/setup plus ~$3K/yr ongoing staff time.', recommended_action: 'prepare', probability_of_passage: 70, relevance_score: 81, is_watched: true, is_flagged_board: true },
  { id: 's4', identifier: 'OSHA 1910.132', title: 'OSHA PPE Standard Update — Public Safety Requirements', jurisdiction: 'federal', category: 'Compliance / Auditing', status: 'rulemaking', priority: 'medium', impact_level: 'moderate', summary: 'OSHA proposed rulemaking to update personal protective equipment standards for public safety employees. Comment period open through May 2026.', municipal_relevance: 'Police, Fire, and EMS departments may need to update PPE inventories and training procedures.', last_action: 'Comment period open', comment_deadline: '2026-05-15', departments_affected: ['Police', 'Fire', 'EMS / Ambulance'], strategic_goals: ['Compliance', 'Public Safety'], impact_types: ['Compliance', 'HR'], compliance_impact: 'Potential new PPE requirements and training obligations.', recommended_action: 'monitor', probability_of_passage: 60, relevance_score: 55, source_url: 'https://www.osha.gov' },
  { id: 's5', identifier: 'USDA RD FY26', title: 'USDA Rural Development Community Facilities Grant Program', jurisdiction: 'federal', category: 'Grants / Appropriations', status: 'effective', priority: 'high', impact_level: 'high', summary: 'Annual USDA Community Facilities grant program for essential community facilities serving rural populations. FY2026 round is open with applications accepted on a rolling basis.', municipal_relevance: 'Machias is eligible as a rural community. Could fund Fire/EMS facility improvements, public works equipment, or municipal office infrastructure.', departments_affected: ['Administration', 'Fire', 'EMS / Ambulance', 'Public Works'], strategic_goals: ['Infrastructure', 'Capital Planning', 'Public Safety'], impact_types: ['Grant Opportunity', 'Capital'], fiscal_impact_amount: 250000, recommended_action: 'prepare', probability_of_passage: 80, relevance_score: 74, is_watched: true, is_flagged_grant: true, source_url: 'https://www.rd.usda.gov' },
];

const SEED_OFFICIALS = [
  { id: 'o1', name: 'Sen. Susan Collins', title: 'U.S. Senator', office: 'United States Senate', jurisdiction_level: 'federal', state: 'ME', party: 'R', district: 'Maine At-Large', committees: ['Appropriations', 'HELP', 'Intelligence'], key_positions: 'Strong advocate for rural infrastructure, consistent support for USDA rural programs.', relevance_score: 85, is_active: true },
  { id: 'o2', name: 'Sen. Angus King', title: 'U.S. Senator', office: 'United States Senate', jurisdiction_level: 'federal', state: 'ME', party: 'I', district: 'Maine At-Large', committees: ['Armed Services', 'Energy', 'Intelligence'], key_positions: 'Champion of rural broadband, offshore wind, and energy transition.', relevance_score: 80, is_active: true },
  { id: 'o3', name: 'Rep. Jared Golden', title: 'U.S. Representative', office: 'U.S. House of Representatives', jurisdiction_level: 'federal', state: 'ME', district: 'ME-02', party: 'D', committees: ['Agriculture', 'Armed Services'], key_positions: 'Represents Washington County. Focused on rural economic development and veterans services.', relevance_score: 90, is_active: true },
];

const SEED_EVENTS = [
  { id: 'e1', title: 'LD 2003 — Revenue Sharing Public Hearing', event_type: 'hearing', date: '2026-04-02', jurisdiction: 'State (Augusta)', legislation_id: 's1', priority: 'critical', description: 'Joint Standing Committee on Taxation. Written and oral testimony accepted.' },
  { id: 'e2', title: 'LD 1887 — EMS Reporting Bill Vote', event_type: 'vote', date: '2026-04-15', jurisdiction: 'State', legislation_id: 's3', priority: 'high' },
  { id: 'e3', title: 'OSHA PPE Comment Deadline', event_type: 'comment_deadline', date: '2026-05-15', jurisdiction: 'Federal', legislation_id: 's4', priority: 'medium' },
  { id: 'e4', title: 'Federal Infrastructure Act Effective Date', event_type: 'effective_date', date: '2026-10-01', jurisdiction: 'Federal', legislation_id: 's2', priority: 'high' },
];

const SEED_FUNDING = [
  { id: 'f1', title: 'USDA Community Facilities Direct Loan & Grant Program', program_name: 'CF Grant', source: 'federal', max_award: 1000000, match_required: true, match_percent: 10, application_deadline: '2026-09-30', status: 'open', departments_relevant: ['Public Works', 'Fire', 'Administration'], summary: 'For essential community facilities serving rural populations.' },
  { id: 'f2', title: 'Maine DOT Local Roads Program', program_name: 'LRAP', source: 'state', max_award: 200000, match_required: false, application_deadline: '2026-06-01', status: 'open', departments_relevant: ['Public Works'], summary: 'Annual state program for local road reconstruction.' },
];

const SEED_PROFILE = { name: 'Machias', state: 'ME', county: 'Washington', population: 2100, governance_type: 'town_meeting', fiscal_year: 'FY2027', annual_budget: 4200000, departments: DEFAULT_DEPARTMENTS, enterprise_funds: ['Ambulance Fund', 'Sewer Fund', 'Transfer Station Fund'], strategic_goals: ['Financial Sustainability', 'Compliance', 'Infrastructure', 'Public Safety', 'Regional Collaboration', 'Capital Planning', 'Operational Efficiency'], policy_focus_areas: ['EMS Billing', 'Revenue Sharing', 'Infrastructure', 'Workforce', 'Grants / Appropriations'], custom_categories: [] };

// ── Module navigation ──────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: 'dashboard',    label: 'Dashboard',             icon: LayoutDashboard },
  { id: 'tracker',      label: 'Bills & Policy Items',  icon: List },
  { id: 'officials',    label: 'Officials',             icon: Users },
  { id: 'calendar',     label: 'Calendar & Deadlines',  icon: Calendar },
  { id: 'fiscal',       label: 'Fiscal Impact Model',   icon: DollarSign },
  { id: 'watchlists',   label: 'Watchlists & Alerts',   icon: Bell },
  { id: 'reports',      label: 'Reports',               icon: FileText },
  { id: 'settings',     label: 'Settings',              icon: Settings },
];

export default function LegislativeTracking() {
  const queryClient = useQueryClient();

  // Data
  const { data: dbItems    } = useQuery({ queryKey: ['legislation'],       queryFn: () => base44.entities.LegislationItem.list('-created_date', 200),         initialData: [] });
  const { data: dbOfficials } = useQuery({ queryKey: ['policy_officials'], queryFn: () => base44.entities.PolicyOfficial.list('-created_date', 100),          initialData: [] });
  const { data: dbFunding   } = useQuery({ queryKey: ['policy_funding'],   queryFn: () => base44.entities.PolicyFundingOpportunity.list('-created_date', 100), initialData: [] });
  const { data: dbEvents    } = useQuery({ queryKey: ['policy_events'],    queryFn: () => base44.entities.PolicyCalendarEvent.list('-created_date', 200),      initialData: [] });
  const { data: dbProfiles  } = useQuery({ queryKey: ['muni_profiles'],    queryFn: () => base44.entities.MunicipalityProfile.list(),                          initialData: [] });

  const items    = dbItems?.length    ? dbItems    : SEED_ITEMS;
  const officials = dbOfficials?.length ? dbOfficials : SEED_OFFICIALS;
  const funding  = dbFunding?.length   ? dbFunding  : SEED_FUNDING;
  const events   = dbEvents?.length    ? dbEvents   : SEED_EVENTS;
  const profile  = dbProfiles?.[0]     || SEED_PROFILE;

  // Mutations
  const createItem  = useMutation({ mutationFn: d => base44.entities.LegislationItem.create(d),             onSuccess: () => queryClient.invalidateQueries(['legislation']) });
  const updateItem  = useMutation({ mutationFn: ({ id, data }) => base44.entities.LegislationItem.update(id, data), onSuccess: () => queryClient.invalidateQueries(['legislation']) });
  const saveProfile = useMutation({
    mutationFn: d => dbProfiles?.[0]?.id
      ? base44.entities.MunicipalityProfile.update(dbProfiles[0].id, d)
      : base44.entities.MunicipalityProfile.create(d),
    onSuccess: () => queryClient.invalidateQueries(['muni_profiles']),
  });

  // Intelligence
  const { scoredItems, impactMap, impactRecordsList, generateAIInsights, aiLoading, saveManualImpact } = usePolicyIntelligence(items, profile, events);

  // Live sync state
  const [syncing, setSyncing]       = useState(false);
  const [lastSynced, setLastSynced] = useState(null);

  const handleLiveSync = useCallback(async () => {
    setSyncing(true);
    try {
      await base44.functions.invoke('policyDataSync', { sources: ['all'], force: true });
      setLastSynced(new Date());
      queryClient.invalidateQueries(['legislation']);
      queryClient.invalidateQueries(['policy_funding']);
      queryClient.invalidateQueries(['policy_events']);
    } finally {
      setSyncing(false);
    }
  }, [queryClient]);

  // UI state
  const [activeNav, setActiveNav]   = useState('dashboard');
  const [view, setView]             = useState('cards');
  const [isAdding, setIsAdding]     = useState(false);
  const [editing, setEditing]       = useState(null);
  const [detailItem, setDetailItem] = useState(null);
  const [filters, setFilters]       = useState({ jurisdiction: 'all', priority: 'all', status: 'all', category: 'all', department: 'all', search: '', watched: false, urgent: false });
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => filterItems(scoredItems, filters), [scoredItems, filters]);
  const sorted   = useMemo(() => sortByRelevance(filtered), [filtered]);

  const handleSave = useCallback(async (form) => {
    if (editing?.id && !editing.id.startsWith('s')) {
      await updateItem.mutateAsync({ id: editing.id, data: form });
    } else {
      await createItem.mutateAsync(form);
    }
    setIsAdding(false);
    setEditing(null);
  }, [editing, createItem, updateItem]);

  const handleFlag = useCallback((item) => {
    if (item.id && !item.id.startsWith('s')) {
      updateItem.mutate({ id: item.id, data: { is_flagged_urgent: !item.is_flagged_urgent } });
    }
  }, [updateItem]);

  const critical_count = scoredItems.filter(i => i.priority === 'critical' && !i.is_archived).length;
  const alert_count    = scoredItems.filter(i => i.is_flagged_urgent && !i.is_archived).length;

  return (
    <div className="space-y-0 -mt-2">
      {/* Module header bar */}
      <div className="sticky top-0 z-20 bg-white border-b border-slate-200 -mx-8 px-8 py-3 mb-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 flex-shrink-0">
              <Landmark className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 leading-tight">Legislative & Policy Tracking</h1>
              <p className="text-[10px] text-slate-400">
                {profile?.name || 'Municipality'} · {profile?.state || ''} · {profile?.fiscal_year || ''}
                {lastSynced && (
                  <span className="ml-2 text-emerald-600 font-semibold">
                    · Live data synced {lastSynced.toLocaleTimeString()}
                  </span>
                )}
              </p>
            </div>
            {critical_count > 0 && (
              <span className="flex items-center gap-1 text-[10px] bg-red-100 text-red-800 border border-red-300 px-2 py-0.5 rounded-full font-bold">
                <AlertTriangle className="h-3 w-3" /> {critical_count} Critical
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleLiveSync}
              disabled={syncing}
              title="Sync live data from Congress.gov, Federal Register, Grants.gov, and state legislature"
              className="flex items-center gap-1.5 text-xs font-semibold border border-slate-200 bg-white text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin text-blue-600' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync Live Data'}
            </button>
            <button
              onClick={() => { setIsAdding(true); setEditing(null); setActiveNav('tracker'); }}
              className="flex items-center gap-1.5 text-xs font-bold bg-slate-900 text-white px-3 py-1.5 rounded-lg hover:bg-slate-700 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Track Item
            </button>
          </div>
        </div>

        {/* Module nav tabs */}
        <nav className="flex gap-0 mt-3 overflow-x-auto border-t border-slate-100 pt-2 -mb-3 pb-0">
          {NAV_ITEMS.map(({ id, label, icon: NavIcon }) => {
            const isBell = id === 'watchlists' && alert_count > 0;
            return (
              <button key={id} onClick={() => setActiveNav(id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors relative ${
                  activeNav === id ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}>
                <NavIcon className="h-3.5 w-3.5 flex-shrink-0" />
                {label}
                {isBell && (
                  <span className="ml-1 h-4 w-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">{alert_count}</span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* ── DASHBOARD ── */}
      {activeNav === 'dashboard' && (
        <PolicyExecDashboard
          items={scoredItems}
          officials={officials}
          events={events}
          funding={funding}
          profile={profile}
          onNavigate={setActiveNav}
        />
      )}

      {/* ── BILL TRACKER ── */}
      {activeNav === 'tracker' && (
        <div className="space-y-4">
          {/* Add / Edit form */}
          {(isAdding || editing) && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-bold text-slate-700">{editing ? `Editing: ${editing.title}` : 'Add New Tracked Item'}</p>
                <button onClick={() => { setIsAdding(false); setEditing(null); }} className="text-slate-400 hover:text-slate-700">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <LegislationForm item={editing} profile={profile} onSave={handleSave} onCancel={() => { setIsAdding(false); setEditing(null); }} />
            </div>
          )}

          {/* Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search bills, policies, identifiers..."
                value={filters.search || ''}
                onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                className="w-full pl-8 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 bg-white"
              />
            </div>
            <button onClick={() => setShowFilters(v => !v)}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border transition-colors ${showFilters ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}>
              <Filter className="h-3.5 w-3.5" /> Filters
              {Object.entries(filters).some(([k, v]) => k !== 'search' && v && v !== 'all' && v !== false) && (
                <span className="h-4 w-4 rounded-full bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center">!</span>
              )}
            </button>
            <div className="flex gap-1 bg-slate-100 rounded-lg p-0.5 flex-shrink-0">
              {[['cards', 'Cards'], ['table', 'Table']].map(([v, l]) => (
                <button key={v} onClick={() => setView(v)}
                  className={`text-[10px] px-2.5 py-1 rounded font-semibold transition-colors ${view === v ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>
                  {l}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 font-medium">{sorted.length} of {scoredItems.filter(i => !i.is_archived).length} items</p>
          </div>

          {/* Expanded filter bar */}
          {showFilters && (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <PolicyFilters filters={filters} onChange={setFilters} profile={profile} />
            </div>
          )}

          {/* Card view */}
          {view === 'cards' && (
            <div className="space-y-3">
              {sorted.length === 0 ? (
                <EmptyState
                  icon={List}
                  title="No items match your filters"
                  message="Try adjusting your filters or add new tracked items."
                  action={{ label: 'Clear Filters', onClick: () => setFilters({ jurisdiction: 'all', priority: 'all', status: 'all', category: 'all', department: 'all', search: '', watched: false, urgent: false }) }}
                />
              ) : sorted.map(item => (
                <div key={item.id} onClick={(e) => { if (!e.target.closest('button, a')) setDetailItem(item); }} className="cursor-pointer">
                  <LegislationCard
                    item={item}
                    profile={profile}
                    onEdit={item => { setEditing(item); setIsAdding(false); }}
                    onFlag={handleFlag}
                    impactRecord={impactMap[item.id]}
                    onGenerateAI={generateAIInsights}
                    aiLoading={aiLoading}
                    onSaveOverride={saveManualImpact}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Table view */}
          {view === 'table' && (
            <div className="rounded-2xl border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs min-w-[960px]">
                  <thead>
                    <tr className="bg-slate-900 text-white">
                      {['Priority', 'ID', 'Title', 'Jurisdiction', 'Status', 'Last Action', 'Departments', 'Score', 'Next Deadline', ''].map(h => (
                        <th key={h} className="px-3 py-2.5 text-left text-[9px] font-bold uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((item, i) => {
                      const nearestDeadline = [item.hearing_date, item.vote_date, item.comment_deadline].filter(Boolean).sort()[0];
                      const days = daysUntil(nearestDeadline);
                      return (
                        <tr key={item.id} onClick={() => setDetailItem(item)}
                          className={`border-t border-slate-100 cursor-pointer hover:bg-slate-50 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                          <td className="px-3 py-2.5"><PriorityBadge priority={item.priority} size="xs" /></td>
                          <td className="px-3 py-2.5 font-mono text-[9px] text-slate-400">{item.identifier || '—'}</td>
                          <td className="px-3 py-2.5 max-w-[260px]">
                            <p className="font-semibold text-slate-900 truncate">{item.title}</p>
                            {item.category && <p className="text-[9px] text-slate-400 mt-0.5">{item.category}</p>}
                          </td>
                          <td className="px-3 py-2.5"><JurisdictionBadge jurisdiction={item.jurisdiction} size="xs" /></td>
                          <td className="px-3 py-2.5"><StatusBadge status={item.status} size="xs" /></td>
                          <td className="px-3 py-2.5 text-[10px] text-slate-500 whitespace-nowrap">{fmtDate(item.last_action_date)}</td>
                          <td className="px-3 py-2.5">
                            <div className="flex flex-wrap gap-0.5">
                              {(item.departments_affected || []).slice(0, 2).map(d => (
                                <span key={d} className="text-[9px] bg-slate-100 text-slate-500 px-1 py-0.5 rounded">{d}</span>
                              ))}
                              {(item.departments_affected || []).length > 2 && <span className="text-[9px] text-slate-400">+{item.departments_affected.length - 2}</span>}
                            </div>
                          </td>
                          <td className="px-3 py-2.5"><RelevanceScore score={item.relevance_score} /></td>
                          <td className="px-3 py-2.5">
                            {nearestDeadline && (
                              <span className={`text-[10px] font-semibold ${days !== null && days <= 14 ? 'text-red-700' : 'text-slate-500'}`}>
                                {fmtDate(nearestDeadline)}{days !== null && days >= 0 && ` (${days}d)`}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2.5">
                            <button onClick={e => { e.stopPropagation(); setEditing(item); }} className="text-[9px] text-slate-400 hover:text-slate-700 font-semibold px-1.5 py-0.5 rounded hover:bg-slate-100">Edit</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── OFFICIALS ── */}
      {activeNav === 'officials' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {officials.map(o => <OfficialCard key={o.id} official={o} profile={profile} />)}
            {officials.length === 0 && (
              <EmptyState icon={Users} title="No officials tracked" message="Add federal, state, and local officials relevant to your municipality's policy landscape." />
            )}
          </div>
        </div>
      )}

      {/* ── CALENDAR ── */}
      {activeNav === 'calendar' && (
        <PolicyCalendarView events={events} items={scoredItems} />
      )}

      {/* ── FISCAL IMPACT MODEL ── */}
      {activeNav === 'fiscal' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <FiscalImpactModeler profileId={dbProfiles?.[0]?.id || null} />
        </div>
      )}

      {/* ── WATCHLISTS & ALERTS ── */}
      {activeNav === 'watchlists' && (
        <PolicyWatchlistsView items={scoredItems} profile={profile} />
      )}

      {/* ── REPORTS ── */}
      {activeNav === 'reports' && (
        <PolicyReportsView items={scoredItems} impactRecords={impactRecordsList} profile={profile} />
      )}

      {/* ── SETTINGS ── */}
      {activeNav === 'settings' && (
        <div className="space-y-6 max-w-4xl">
          {/* Live Data Sources panel */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <DataSourceAdminPanel profile={profile} />
          </div>

          {/* Municipality Profile */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <MunicipalityProfilePanel
              profile={profile}
              onSave={async (data) => { await saveProfile.mutateAsync(data); }}
            />
          </div>
        </div>
      )}

      {/* ── Detail drawer ── */}
      {detailItem && (
        <PolicyItemDetailDrawer
          item={detailItem}
          profile={profile}
          impactRecord={impactMap[detailItem.id]}
          onClose={() => setDetailItem(null)}
          onEdit={item => { setEditing(item); setDetailItem(null); setActiveNav('tracker'); }}
          onGenerateAI={async (item, mode) => { await generateAIInsights(item, mode); }}
          aiLoading={aiLoading}
        />
      )}
    </div>
  );
}

function EmptyState({ icon: Icon, title, message, action }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center col-span-full">
      <Icon className="h-8 w-8 mx-auto mb-3 text-slate-300" />
      <p className="text-sm font-semibold text-slate-600 mb-1">{title}</p>
      <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto mb-3">{message}</p>
      {action && (
        <button onClick={action.onClick} className="text-xs font-semibold text-slate-700 border border-slate-300 px-4 py-1.5 rounded-lg hover:bg-white transition-colors">
          {action.label}
        </button>
      )}
    </div>
  );
}