/**
 * LegislativeTracking — Main page for the Municipal Legislative & Policy Tracking module
 *
 * Tabs:
 *  1. Executive Dashboard
 *  2. Bill & Policy Tracker
 *  3. Officials Directory
 *  4. Calendar / Timeline
 *  5. Funding Opportunities
 *  6. Profile & Settings
 */
import React, { useState, useMemo, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import SectionHeader from '../components/machias/SectionHeader';
import PolicyExecDashboard from '../components/policy/PolicyExecDashboard';
import LegislationCard from '../components/policy/LegislationCard';
import LegislationForm from '../components/policy/LegislationForm';
import PolicyFilters from '../components/policy/PolicyFilters';
import OfficialCard from '../components/policy/OfficialCard';
import PolicyCalendarView from '../components/policy/PolicyCalendarView';
import MunicipalityProfilePanel from '../components/policy/MunicipalityProfilePanel';
import { calcRelevanceScore, filterItems, sortByRelevance, fmt, fmtDate, TOPIC_CATEGORIES, DEFAULT_DEPARTMENTS } from '../components/policy/policyEngine';
import { PriorityBadge, StatusBadge, JurisdictionBadge, ImpactBadge, ActionBadge, RelevanceScore } from '../components/policy/PolicyBadges';
import {
  Landmark, LayoutDashboard, List, Users, Calendar, DollarSign, Settings,
  Plus, Download, AlertTriangle, Star, RefreshCw, ChevronDown, ChevronRight,
  ExternalLink, Flag, Archive, Eye
} from 'lucide-react';

// ── Seed data ──────────────────────────────────────────────────────────────────
const SEED_ITEMS = [
  {
    id: 's1', identifier: 'LD 2003', title: 'An Act to Increase State Revenue Sharing with Municipalities',
    jurisdiction: 'state', category: 'Revenue Sharing', status: 'in_committee', priority: 'critical',
    impact_level: 'very_high', summary: 'Would increase the percentage of state income and sales tax revenues shared with municipalities from 5% to 7%, providing significant additional unrestricted revenue for local governments.',
    municipal_relevance: 'Could provide an additional $180,000–$240,000 annually in unrestricted state aid, directly reducing the property tax burden on Machias residents and stabilizing the General Fund.',
    sponsor: 'Rep. Janet Mills', committee: 'Taxation Committee', last_action: 'Public hearing scheduled',
    last_action_date: '2026-03-10', hearing_date: '2026-04-02',
    departments_affected: ['Finance', 'Administration'],
    strategic_goals: ['Financial Sustainability', 'Operational Efficiency'],
    impact_types: ['Revenue', 'Governance'],
    fiscal_impact_note: 'Estimated $180K–$240K additional annual unrestricted revenue.',
    fiscal_impact_amount: 210000, recommended_action: 'advocate',
    recommended_action_note: 'Coordinate with Maine Municipal Association to submit written testimony in support.',
    probability_of_passage: 55, relevance_score: 92, confidence_level: 'medium',
    is_watched: true, is_flagged_budget: true, is_flagged_board: true,
  },
  {
    id: 's2', identifier: 'HB 4412', title: 'Federal Infrastructure Investment Act — Municipal Road Funding Extension',
    jurisdiction: 'federal', category: 'Infrastructure', status: 'signed', priority: 'high',
    impact_level: 'high', summary: 'Extends federal formula funding for local road maintenance and bridge repair through FY2028, with a new 10% set-aside for small municipalities under 5,000 population.',
    municipal_relevance: 'Machias is eligible under the small municipality set-aside. Public Works should identify qualifying projects and begin application preparation for next grant cycle opening in Q3 2026.',
    sponsor: 'Sen. Collins', committee: 'Senate Environment & Public Works', last_action: 'Signed into law',
    last_action_date: '2026-02-14', effective_date: '2026-10-01',
    departments_affected: ['Public Works'],
    strategic_goals: ['Infrastructure', 'Capital Planning'],
    impact_types: ['Capital', 'Grant Opportunity'],
    fiscal_impact_note: 'Potential $50K–$150K in road/bridge funding depending on project eligibility.',
    fiscal_impact_amount: 100000, recommended_action: 'prepare',
    recommended_action_note: 'Have Public Works Director identify qualifying projects by June 2026.',
    probability_of_passage: 100, relevance_score: 78, confidence_level: 'high',
    is_watched: true, is_flagged_grant: true, is_flagged_budget: true,
  },
  {
    id: 's3', identifier: 'LD 1887', title: 'Mandatory EMS Response Time Reporting for Municipal Agencies',
    jurisdiction: 'state', category: 'EMS / Ambulance', status: 'in_committee', priority: 'high',
    impact_level: 'high', summary: 'Requires all municipal EMS agencies to report response time data quarterly to MEMA and publish results publicly. Establishes minimum reporting standards and penalties for non-compliance.',
    municipal_relevance: 'Directly affects the Machias Ambulance Service. Will require implementation of a tracking system, staff training, and quarterly report submission. Finance Director and EMS Chief should prepare for new compliance obligations.',
    sponsor: 'Rep. Amy Arata', committee: 'Health & Human Services Committee', last_action: 'Amendment submitted',
    last_action_date: '2026-03-05', vote_date: '2026-04-15',
    departments_affected: ['EMS / Ambulance', 'Finance', 'Administration'],
    strategic_goals: ['Compliance', 'Public Safety'],
    impact_types: ['Compliance', 'Operations', 'HR'],
    compliance_impact: 'New quarterly reporting mandate. Requires data tracking capability and staff time.',
    operational_impact: 'Will require EMS to implement call data logging and response time tracking if not already in place.',
    fiscal_impact_note: 'Estimated $5K–$15K for software/setup plus ~$3K/yr ongoing staff time.',
    recommended_action: 'prepare', probability_of_passage: 70, relevance_score: 81,
    is_watched: true, is_flagged_board: true,
  },
  {
    id: 's4', identifier: 'OSHA 1910.132', title: 'OSHA PPE Standard Update — Public Safety Requirements',
    jurisdiction: 'federal', category: 'Compliance / Auditing', status: 'rulemaking', priority: 'medium',
    impact_level: 'moderate', summary: 'OSHA proposed rulemaking to update personal protective equipment standards for public safety employees including police, fire, and EMS. Comment period open through May 2026.',
    municipal_relevance: 'Police, Fire, and EMS departments may need to update PPE inventories and training procedures. HR should review current compliance status.',
    last_action: 'Comment period open', comment_deadline: '2026-05-15',
    departments_affected: ['Police', 'Fire', 'EMS / Ambulance', 'HR'],
    strategic_goals: ['Compliance', 'Public Safety'],
    impact_types: ['Compliance', 'HR', 'Expense'],
    compliance_impact: 'Potential new PPE requirements and training obligations.',
    recommended_action: 'monitor', probability_of_passage: 60, relevance_score: 55,
    source_url: 'https://www.osha.gov',
  },
  {
    id: 's5', identifier: 'USDA RD FY26', title: 'USDA Rural Development Community Facilities Grant Program',
    jurisdiction: 'federal', category: 'Grants / Appropriations', status: 'effective', priority: 'high',
    impact_level: 'high', summary: 'Annual USDA Community Facilities grant program for essential community facilities serving rural populations. FY2026 round is open with applications accepted on a rolling basis.',
    municipal_relevance: 'Machias is eligible as a rural community under 20,000 population. Could fund Fire/EMS facility improvements, public works equipment, or municipal office infrastructure.',
    departments_affected: ['Administration', 'Fire', 'EMS / Ambulance', 'Public Works'],
    strategic_goals: ['Infrastructure', 'Capital Planning', 'Public Safety'],
    impact_types: ['Grant Opportunity', 'Capital'],
    fiscal_impact_note: 'Grants range from $10K to $1M+ depending on project and eligibility.',
    fiscal_impact_amount: 250000, recommended_action: 'prepare',
    recommended_action_note: 'Identify priority capital need and submit pre-application by September 2026.',
    probability_of_passage: 80, relevance_score: 74,
    is_watched: true, is_flagged_grant: true, source_url: 'https://www.rd.usda.gov',
  },
];

const SEED_OFFICIALS = [
  { id: 'o1', name: 'Sen. Susan Collins', title: 'U.S. Senator', office: 'United States Senate', jurisdiction_level: 'federal', state: 'ME', party: 'R', district: 'Maine At-Large', committees: ['Appropriations', 'HELP', 'Intelligence'], key_positions: 'Strong advocate for rural infrastructure, consistent support for USDA rural programs.', relevance_score: 85 },
  { id: 'o2', name: 'Sen. Angus King', title: 'U.S. Senator', office: 'United States Senate', jurisdiction_level: 'federal', state: 'ME', party: 'I', district: 'Maine At-Large', committees: ['Armed Services', 'Energy', 'Intelligence'], key_positions: 'Champion of rural broadband, offshore wind, and energy transition.', relevance_score: 80 },
  { id: 'o3', name: 'Rep. Jared Golden', title: 'U.S. Representative', office: 'U.S. House of Representatives', jurisdiction_level: 'federal', state: 'ME', district: 'ME-02', party: 'D', committees: ['Agriculture', 'Armed Services'], key_positions: 'Represents Washington County. Focused on rural economic development and veterans services.', relevance_score: 90 },
  { id: 'o4', name: 'Sen. Janet Mills (Ret.)', title: 'Former Governor', office: 'State of Maine (Former)', jurisdiction_level: 'state', state: 'ME', relevance_score: 50 },
];

const SEED_EVENTS = [
  { id: 'e1', title: 'LD 2003 — Revenue Sharing Public Hearing', event_type: 'hearing', date: '2026-04-02', jurisdiction: 'State (Augusta)', legislation_id: 's1', priority: 'critical', description: 'Joint Standing Committee on Taxation. Written and oral testimony accepted.' },
  { id: 'e2', title: 'LD 1887 — EMS Reporting Bill Vote', event_type: 'vote', date: '2026-04-15', jurisdiction: 'State', legislation_id: 's3', priority: 'high' },
  { id: 'e3', title: 'OSHA PPE Comment Deadline', event_type: 'comment_deadline', date: '2026-05-15', jurisdiction: 'Federal', legislation_id: 's4', priority: 'medium' },
  { id: 'e4', title: 'Federal Infrastructure Act Effective Date', event_type: 'effective_date', date: '2026-10-01', jurisdiction: 'Federal', legislation_id: 's2', priority: 'high' },
  { id: 'e5', title: 'USDA Community Facilities Grant Pre-Application Target', event_type: 'grant_deadline', date: '2026-09-01', jurisdiction: 'Federal', priority: 'high' },
];

const SEED_FUNDING = [
  { id: 'f1', title: 'USDA Community Facilities Direct Loan & Grant Program', program_name: 'CF Grant', source: 'federal', max_award: 1000000, match_required: true, match_percent: 10, application_deadline: '2026-09-30', status: 'open', departments_relevant: ['Public Works', 'Fire', 'Administration'], summary: 'For essential community facilities serving rural populations.' },
  { id: 'f2', title: 'Maine DOT Local Roads Program', program_name: 'LRAP', source: 'state', max_award: 200000, match_required: false, application_deadline: '2026-06-01', status: 'open', departments_relevant: ['Public Works'], summary: 'Annual state program for local road reconstruction.' },
  { id: 'f3', title: 'FEMA BRIC Infrastructure Resilience Grant', program_name: 'BRIC', source: 'federal', max_award: 2000000, match_required: true, match_percent: 25, application_deadline: '2026-11-15', status: 'upcoming', departments_relevant: ['Public Works', 'Administration'], summary: 'Building resilient infrastructure communities — hazard mitigation focus.' },
];

const SEED_PROFILE = {
  name: 'Machias', state: 'ME', county: 'Washington', population: 2100,
  governance_type: 'town_meeting', fiscal_year: 'FY2027', annual_budget: 4200000,
  departments: DEFAULT_DEPARTMENTS,
  enterprise_funds: ['Ambulance Fund', 'Sewer Fund', 'Transfer Station Fund'],
  strategic_goals: ['Financial Sustainability', 'Compliance', 'Infrastructure', 'Public Safety', 'Regional Collaboration', 'Capital Planning', 'Operational Efficiency'],
  policy_focus_areas: ['EMS Billing', 'Revenue Sharing', 'Infrastructure', 'Workforce', 'Grants / Appropriations'],
  custom_categories: [],
};

const TABS = [
  { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
  { id: 'tracker', label: 'Bill Tracker', icon: List },
  { id: 'officials', label: 'Officials', icon: Users },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'funding', label: 'Funding', icon: DollarSign },
  { id: 'profile', label: 'Profile & Settings', icon: Settings },
];

export default function LegislativeTracking() {
  const queryClient = useQueryClient();

  // Data
  const { data: dbItems } = useQuery({ queryKey: ['legislation'], queryFn: () => base44.entities.LegislationItem.list('-created_date', 200), initialData: [] });
  const { data: dbOfficials } = useQuery({ queryKey: ['policy_officials'], queryFn: () => base44.entities.PolicyOfficial.list('-created_date', 100), initialData: [] });
  const { data: dbFunding } = useQuery({ queryKey: ['policy_funding'], queryFn: () => base44.entities.PolicyFundingOpportunity.list('-created_date', 100), initialData: [] });
  const { data: dbEvents } = useQuery({ queryKey: ['policy_events'], queryFn: () => base44.entities.PolicyCalendarEvent.list('-created_date', 200), initialData: [] });
  const { data: dbProfiles } = useQuery({ queryKey: ['muni_profiles'], queryFn: () => base44.entities.MunicipalityProfile.list(), initialData: [] });

  // Use DB or seed
  const items = dbItems?.length ? dbItems : SEED_ITEMS;
  const officials = dbOfficials?.length ? dbOfficials : SEED_OFFICIALS;
  const funding = dbFunding?.length ? dbFunding : SEED_FUNDING;
  const events = dbEvents?.length ? dbEvents : SEED_EVENTS;
  const profile = dbProfiles?.[0] || SEED_PROFILE;

  // Mutations
  const createItem = useMutation({ mutationFn: d => base44.entities.LegislationItem.create(d), onSuccess: () => queryClient.invalidateQueries(['legislation']) });
  const updateItem = useMutation({ mutationFn: ({ id, data }) => base44.entities.LegislationItem.update(id, data), onSuccess: () => queryClient.invalidateQueries(['legislation']) });
  const createOfficial = useMutation({ mutationFn: d => base44.entities.PolicyOfficial.create(d), onSuccess: () => queryClient.invalidateQueries(['policy_officials']) });
  const saveProfile = useMutation({ mutationFn: d => dbProfiles?.[0]?.id ? base44.entities.MunicipalityProfile.update(dbProfiles[0].id, d) : base44.entities.MunicipalityProfile.create(d), onSuccess: () => queryClient.invalidateQueries(['muni_profiles']) });

  // Local state
  const [activeTab, setActiveTab] = useState('dashboard');
  const [view, setView] = useState('cards'); // cards | table
  const [isAdding, setIsAdding] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filters, setFilters] = useState({ jurisdiction: 'all', priority: 'all', status: 'all', category: 'all', department: 'all', search: '', watched: false, urgent: false });

  // Computed items with relevance scores
  const scoredItems = useMemo(() =>
    items.map(item => ({
      ...item,
      relevance_score: item.relevance_score ?? calcRelevanceScore(item, profile),
    })), [items, profile]);

  const filtered = useMemo(() => filterItems(scoredItems, filters), [scoredItems, filters]);
  const sorted = useMemo(() => sortByRelevance(filtered), [filtered]);

  const handleSave = useCallback(async (form) => {
    if (editing?.id && !editing.id.startsWith('s') && !editing.id.startsWith('o')) {
      await updateItem.mutateAsync({ id: editing.id, data: form });
    } else {
      await createItem.mutateAsync(form);
    }
    setIsAdding(false);
    setEditing(null);
  }, [editing, createItem, updateItem]);

  const handleFlag = useCallback((item) => {
    // Toggle urgent flag
    if (item.id && !item.id.startsWith('s')) {
      updateItem.mutate({ id: item.id, data: { is_flagged_urgent: !item.is_flagged_urgent } });
    }
  }, [updateItem]);

  const handleSaveProfile = useCallback(async (profileData) => {
    await saveProfile.mutateAsync(profileData);
  }, [saveProfile]);

  const unread_alerts = sorted.filter(i => i.is_flagged_urgent && !i.is_archived).length;
  const critical_count = sorted.filter(i => i.priority === 'critical' && !i.is_archived).length;

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <SectionHeader
            title="Legislative & Policy Tracking"
            subtitle={`Municipal policy intelligence for ${profile?.name || 'your municipality'} · Federal, State, County & Local`}
            icon={Landmark}
          />
          {(critical_count > 0 || unread_alerts > 0) && (
            <div className="flex gap-2 mt-1">
              {critical_count > 0 && (
                <span className="text-[10px] bg-red-100 text-red-800 border border-red-300 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> {critical_count} Critical
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setIsAdding(true); setEditing(null); setActiveTab('tracker'); }}
            className="flex items-center gap-1.5 text-xs font-bold bg-slate-900 text-white px-3 py-1.5 rounded-lg hover:bg-slate-700 transition-colors">
            <Plus className="h-3.5 w-3.5" /> Track Item
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 border-b border-slate-200 overflow-x-auto">
        {TABS.map(({ id, label, icon: TabIcon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${activeTab === id ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-700'}`}>
            <TabIcon className="h-3.5 w-3.5 flex-shrink-0" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab: Executive Dashboard */}
      {activeTab === 'dashboard' && (
        <PolicyExecDashboard
          items={scoredItems}
          officials={officials}
          events={events}
          funding={funding}
          profile={profile}
        />
      )}

      {/* Tab: Bill & Policy Tracker */}
      {activeTab === 'tracker' && (
        <div className="space-y-4">
          {/* Add / Edit form */}
          {(isAdding || editing) && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-bold text-slate-700 mb-4">{editing ? `Editing: ${editing.title}` : 'Add New Tracked Item'}</p>
              <LegislationForm
                item={editing}
                profile={profile}
                onSave={handleSave}
                onCancel={() => { setIsAdding(false); setEditing(null); }}
              />
            </div>
          )}

          {/* Filters */}
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <PolicyFilters filters={filters} onChange={setFilters} profile={profile} />
          </div>

          {/* View toggle + count */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 font-medium">{sorted.length} item{sorted.length !== 1 ? 's' : ''} shown</p>
            <div className="flex gap-1 bg-slate-100 rounded-lg p-0.5">
              {[['cards', 'Cards'], ['table', 'Table']].map(([v, l]) => (
                <button key={v} onClick={() => setView(v)}
                  className={`text-[10px] px-2.5 py-1 rounded font-semibold transition-colors ${view === v ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Card view */}
          {view === 'cards' && (
            <div className="space-y-3">
              {sorted.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Landmark className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm font-medium">No items match your filters.</p>
                </div>
              ) : sorted.map(item => (
                <LegislationCard key={item.id} item={item} profile={profile} onEdit={setEditing} onFlag={handleFlag} />
              ))}
            </div>
          )}

          {/* Table view */}
          {view === 'table' && (
            <div className="rounded-2xl border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs min-w-[900px]">
                  <thead>
                    <tr className="bg-slate-900 text-white">
                      {['ID', 'Title', 'Jurisdiction', 'Priority', 'Status', 'Impact', 'Score', 'Action', 'Last Action', ''].map(h => (
                        <th key={h} className="px-3 py-2 text-left text-[9px] font-bold uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((item, i) => (
                      <tr key={item.id} className={`border-t border-slate-100 hover:bg-slate-50 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                        <td className="px-3 py-2 font-mono text-[10px] text-slate-400">{item.identifier || '—'}</td>
                        <td className="px-3 py-2 max-w-xs">
                          <p className="font-semibold text-slate-900 truncate">{item.title}</p>
                          {item.category && <p className="text-[9px] text-slate-400 mt-0.5">{item.category}</p>}
                        </td>
                        <td className="px-3 py-2"><JurisdictionBadge jurisdiction={item.jurisdiction} size="xs" /></td>
                        <td className="px-3 py-2"><PriorityBadge priority={item.priority} size="xs" /></td>
                        <td className="px-3 py-2"><StatusBadge status={item.status} size="xs" /></td>
                        <td className="px-3 py-2"><ImpactBadge level={item.impact_level} /></td>
                        <td className="px-3 py-2"><RelevanceScore score={item.relevance_score} /></td>
                        <td className="px-3 py-2">{item.recommended_action && item.recommended_action !== 'none' && <ActionBadge action={item.recommended_action} />}</td>
                        <td className="px-3 py-2 text-[10px] text-slate-500 whitespace-nowrap">{fmtDate(item.last_action_date)}</td>
                        <td className="px-3 py-2">
                          <button onClick={() => setEditing(item)} className="text-[9px] text-slate-400 hover:text-slate-700 font-semibold px-1.5 py-0.5 rounded hover:bg-slate-100">Edit</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Officials */}
      {activeTab === 'officials' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {officials.map(o => (
              <OfficialCard key={o.id} official={o} onEdit={setEditing} />
            ))}
            {officials.length === 0 && (
              <div className="col-span-3 text-center py-12 text-slate-400">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm font-medium">No officials tracked yet.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Calendar */}
      {activeTab === 'calendar' && (
        <PolicyCalendarView events={events} items={scoredItems} />
      )}

      {/* Tab: Funding */}
      {activeTab === 'funding' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {funding.map(f => (
              <FundingCard key={f.id} item={f} profile={profile} />
            ))}
            {funding.length === 0 && (
              <div className="col-span-2 text-center py-12 text-slate-400">
                <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm font-medium">No funding opportunities tracked.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Profile & Settings */}
      {activeTab === 'profile' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <MunicipalityProfilePanel profile={profile} onSave={handleSaveProfile} />
        </div>
      )}
    </div>
  );
}

function FundingCard({ item, profile }) {
  const statusColor = item.status === 'open' ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
    : item.status === 'upcoming' ? 'bg-amber-100 text-amber-800 border-amber-200'
    : 'bg-slate-100 text-slate-500 border-slate-200';

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-bold text-slate-900 leading-snug">{item.title}</p>
        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${statusColor}`}>
          {item.status?.toUpperCase()}
        </span>
      </div>
      {item.summary && <p className="text-[11px] text-slate-600 mb-3 leading-relaxed">{item.summary}</p>}
      <div className="grid grid-cols-2 gap-2 text-[10px]">
        {item.max_award && (
          <div className="bg-emerald-50 border border-emerald-200 rounded p-2">
            <p className="text-emerald-600 font-semibold">Max Award</p>
            <p className="text-emerald-900 font-bold text-sm">{fmt(item.max_award)}</p>
          </div>
        )}
        {item.application_deadline && (
          <div className="bg-amber-50 border border-amber-200 rounded p-2">
            <p className="text-amber-600 font-semibold">Deadline</p>
            <p className="text-amber-900 font-bold">{fmtDate(item.application_deadline)}</p>
          </div>
        )}
      </div>
      {item.match_required && (
        <p className="text-[10px] text-orange-700 mt-2 font-medium">⚠ {item.match_percent}% match required</p>
      )}
      {item.departments_relevant?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {item.departments_relevant.map(d => (
            <span key={d} className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">{d}</span>
          ))}
        </div>
      )}
      {item.source_url && (
        <a href={item.source_url} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1 text-[10px] text-blue-600 hover:text-blue-800 mt-2 font-medium">
          <ExternalLink className="h-3 w-3" /> View Program Details
        </a>
      )}
    </div>
  );
}