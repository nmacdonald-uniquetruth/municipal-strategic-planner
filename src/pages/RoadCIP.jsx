/**
 * RoadCIP.jsx — Machias Road Capital Improvement Program
 * Integrates GIS road register, 10-15 year treatment schedule,
 * Option C hybrid funding model, and project pipeline.
 */
import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  BarChart2, List, Settings, AlertTriangle,
  TrendingUp, DollarSign, RefreshCw, Info, MapPin, Sliders
} from 'lucide-react';
import { useWhatIf } from '../context/WhatIfContext';
import WhatIfPanel from '../components/whatif/WhatIfPanel';
import {
  buildDefaultRoadRegister, buildDefaultProjectPipeline, buildCIPSchedule,
  buildScheduleSummary, fmt, fmtK, fmtM,
  STATUS_COLORS, CURRENT_YEAR, DEFAULT_YEARS
} from '../components/roadcip/roadCIPEngine';
import RoadInventoryTable   from '../components/roadcip/RoadInventoryTable';
import CIPScheduleChart     from '../components/roadcip/CIPScheduleChart';
import ProjectPipelineTable from '../components/roadcip/ProjectPipelineTable';
import AssumptionsPanel     from '../components/roadcip/AssumptionsPanel';

const DEFAULT_ASSUMPTIONS = {
  label:                        'Option C Hybrid',
  start_fiscal_year:            2027,
  analysis_years:               15,
  paved_centerline_miles:       12.089,
  gravel_centerline_miles:      5.181,
  total_centerline_miles:       17.27,
  inflation_rate:               0.03,
  crack_seal_cycle_yrs:         5,
  crack_seal_cost_per_mile:     6000,
  chip_seal_pct_of_paved:       0.35,
  chip_seal_cost_per_mile:      20000,
  overlay_cycle_yrs:            10,
  overlay_cost_per_mile:        150000,
  reclaim_cycle_yrs:            25,
  reclaim_cost_per_mile:        400000,
  gravel_grading_cycle_yrs:     2,
  gravel_grading_cost_per_mile: 4000,
  gf_annual_transfer:           100000,
  excise_annual_allocation:     100000,
  lrap_annual_estimate:         20724,
  beginning_reserve:            0,
  is_active:                    true,
};

const NAV = [
  { id: 'dashboard',   label: 'Dashboard',         icon: BarChart2   },
  { id: 'schedule',    label: '15-Yr Schedule',     icon: TrendingUp  },
  { id: 'pipeline',    label: 'Project Pipeline',   icon: List        },
  { id: 'inventory',   label: 'Road Inventory',     icon: MapPin      },
  { id: 'assumptions', label: 'Assumptions',        icon: Settings    },
];

export default function RoadCIP() {
  const queryClient = useQueryClient();
  const { scenario: whatIfScenario, isDirty: whatIfActive } = useWhatIf();
  const [showWhatIf, setShowWhatIf] = useState(false);
  const [activeNav, setActiveNav]     = useState('dashboard');
  const [selectedRoad, setSelectedRoad] = useState(null);
  const [localAssumptions, setAssumptions] = useState(DEFAULT_ASSUMPTIONS);

  const { data: dbRoads = [] }       = useQuery({ queryKey: ['road_segments'],       queryFn: () => base44.entities.RoadSegment.list('-priority_score', 200),              initialData: [] });
  const { data: dbProjects = [] }    = useQuery({ queryKey: ['road_cip_projects'],   queryFn: () => base44.entities.RoadCIPProject.list('fy_start', 200),                   initialData: [] });
  const { data: dbAssumptions = [] } = useQuery({ queryKey: ['road_cip_assumptions'],queryFn: () => base44.entities.RoadCIPAssumptions.filter({ is_active: true }),         initialData: [] });

  const seedRoads       = useMutation({ mutationFn: d => base44.entities.RoadSegment.bulkCreate(d),      onSuccess: () => queryClient.invalidateQueries(['road_segments']) });
  const seedProjects    = useMutation({ mutationFn: d => base44.entities.RoadCIPProject.bulkCreate(d),   onSuccess: () => queryClient.invalidateQueries(['road_cip_projects']) });
  const deleteProject   = useMutation({ mutationFn: id => base44.entities.RoadCIPProject.delete(id),    onSuccess: () => queryClient.invalidateQueries(['road_cip_projects']) });
  const saveAssumptions = useMutation({
    mutationFn: data => dbAssumptions[0]?.id
      ? base44.entities.RoadCIPAssumptions.update(dbAssumptions[0].id, data)
      : base44.entities.RoadCIPAssumptions.create(data),
    onSuccess: () => queryClient.invalidateQueries(['road_cip_assumptions']),
  });

  const defaultRoads    = useMemo(() => buildDefaultRoadRegister(), []);
  const roads           = dbRoads.length    ? dbRoads    : defaultRoads;
  const defaultProjects = useMemo(() => buildDefaultProjectPipeline(roads), [roads]);
  const projects        = dbProjects.length ? dbProjects : defaultProjects;
  const baseAssumptions = dbAssumptions[0]  || localAssumptions;

  // Merge What-If scenario CIP overrides on top of saved assumptions
  const assumptions = useMemo(() => whatIfActive
    ? { ...baseAssumptions, ...whatIfScenario.cipAssumptionsDelta }
    : baseAssumptions,
  [baseAssumptions, whatIfScenario, whatIfActive]);

  const schedule = useMemo(() => buildCIPSchedule(assumptions, projects),   [assumptions, projects]);
  const summary  = useMemo(() => buildScheduleSummary(schedule, projects),   [schedule, projects]);

  const handleSeedData = useCallback(async () => {
    if (!dbRoads.length)    await seedRoads.mutateAsync(defaultRoads);
    if (!dbProjects.length) await seedProjects.mutateAsync(defaultProjects.map(({ id, ...rest }) => rest));
  }, [dbRoads, dbProjects, defaultRoads, defaultProjects, seedRoads, seedProjects]);

  const handleSaveAssumptions = useCallback(async (data) => {
    setAssumptions(data);
    await saveAssumptions.mutateAsync(data);
  }, [saveAssumptions]);

  const criticalRoads = roads.filter(r => r.status_bucket === 'Critical').length;
  const agingRoads    = roads.filter(r => r.status_bucket === 'Aging').length;
  const totalMiles    = roads.reduce((s, r) => s + (r.centerline_miles || 0), 0);
  const deficitYears  = schedule.filter(y => y.is_deficit);
  const year10        = schedule[9];
  const year15        = schedule[14];

  const kpiCards = [
    { label: 'CIP Miles',          value: totalMiles.toFixed(2),           color: 'slate',   note: '17.27 GIS-loaded' },
    { label: 'Critical Roads',     value: criticalRoads,                   color: criticalRoads > 0 ? 'red' : 'slate', note: 'Past treatment cycle' },
    { label: 'Aging Roads',        value: agingRoads,                      color: 'orange',  note: 'Due within 3 yrs' },
    { label: 'Total Projects',     value: projects.length,                 color: 'slate',   note: '15-yr pipeline' },
    { label: '15-Yr Program Cost', value: fmtM(summary.total_project_cost),color: 'amber',   note: 'Gross capital spend' },
    { label: 'FY2036 Reserve',     value: year10 ? fmtK(year10.ending_reserve) : '—', color: year10?.is_deficit ? 'red' : 'emerald', note: 'Year 10' },
    { label: 'FY2041 Reserve',     value: year15 ? fmtK(year15.ending_reserve) : '—', color: year15?.is_deficit ? 'red' : 'emerald', note: 'Year 15' },
  ];

  const colorMap = {
    red:    'bg-red-50 border-red-200 text-red-800',
    orange: 'bg-orange-50 border-orange-200 text-orange-800',
    amber:  'bg-amber-50 border-amber-200 text-amber-800',
    emerald:'bg-emerald-50 border-emerald-200 text-emerald-800',
    slate:  'bg-white border-slate-200 text-slate-800',
  };

  return (
    <div className="space-y-0 -mt-2">
      {/* Module header */}
      <div className="sticky top-0 z-20 bg-white border-b border-slate-200 -mx-8 px-8 py-3 mb-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* What-If side panel */}
        {showWhatIf && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/20" onClick={() => setShowWhatIf(false)} />
            <div className="relative z-10 h-full shadow-2xl overflow-y-auto">
              <WhatIfPanel onClose={() => setShowWhatIf(false)} />
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900">
              <BarChart2 className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 leading-tight">Road Capital Improvement Program</h1>
              <p className="text-[10px] text-slate-400">
                Machias, ME · {totalMiles.toFixed(2)} CIP miles · Option C Hybrid Funding · FY2027–2041
              </p>
            </div>
            {criticalRoads > 0 && (
              <span className="flex items-center gap-1 text-[10px] bg-red-100 text-red-800 border border-red-300 px-2 py-0.5 rounded-full font-bold">
                <AlertTriangle className="h-3 w-3" /> {criticalRoads} Critical
              </span>
            )}
            {whatIfActive && (
              <span className="flex items-center gap-1 text-[10px] bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full font-bold">
                <Sliders className="h-3 w-3" /> What-If Active
              </span>
            )}
          </div>
          <button
            onClick={() => setShowWhatIf(true)}
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors ${
              whatIfActive ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}>
            <Sliders className="h-3.5 w-3.5" /> What-If
          </button>
          {!dbRoads.length && (
            <button onClick={handleSeedData}
              disabled={seedRoads.isPending || seedProjects.isPending}
              className="flex items-center gap-1.5 text-xs font-semibold border border-slate-200 bg-white text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors">
              <RefreshCw className={`h-3.5 w-3.5 ${seedRoads.isPending ? 'animate-spin' : ''}`} />
              Load GIS Data to DB
            </button>
          )}
        </div>
        <nav className="flex gap-0 mt-3 overflow-x-auto border-t border-slate-100 pt-2 -mb-3 pb-0">
          {NAV.map(({ id, label, icon: NavIcon }) => (
            <button key={id} onClick={() => setActiveNav(id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${
                activeNav === id ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}>
              <NavIcon className="h-3.5 w-3.5 flex-shrink-0" />{label}
            </button>
          ))}
        </nav>
      </div>

      {/* ── DASHBOARD ── */}
      {activeNav === 'dashboard' && (
        <div className="space-y-5">
          {/* What-If CIP impact banner */}
          {whatIfActive && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 flex items-center gap-3">
              <Sliders className="h-4 w-4 text-amber-600 flex-shrink-0" />
              <div className="flex-1 min-w-0 text-xs text-amber-800">
                <span className="font-bold">What-If Scenario Active — </span>
                CIP annual sources adjusted to <span className="font-bold">${(whatIfScenario.cip_total_annual / 1000).toFixed(0)}K/yr</span>
                {whatIfScenario.cip_gf_delta !== 0 && <span> (GF: {whatIfScenario.cip_gf_delta >= 0 ? '+' : ''}${(whatIfScenario.cip_gf_delta / 1000).toFixed(0)}K)</span>}
                {whatIfScenario.cip_excise_delta !== 0 && <span> · Excise: {whatIfScenario.cip_excise_delta >= 0 ? '+' : ''}${(whatIfScenario.cip_excise_delta / 1000).toFixed(0)}K</span>}
                . The 15-year reserve projections below reflect this scenario.
              </div>
              <button onClick={() => setShowWhatIf(true)} className="text-[11px] font-bold text-amber-700 underline flex-shrink-0">Edit</button>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {kpiCards.map(k => (
              <div key={k.label} className={`rounded-xl border p-3 ${colorMap[k.color]}`}>
                <p className="text-xl font-bold leading-tight">{k.value}</p>
                <p className="text-[10px] font-bold uppercase tracking-wide opacity-70 mt-0.5">{k.label}</p>
                <p className="text-[9px] opacity-50 mt-0.5">{k.note}</p>
              </div>
            ))}
          </div>

          {deficitYears.length > 0 && (
            <div className="rounded-xl border border-red-300 bg-red-50 p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-700 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-red-900">Fund Deficit in {deficitYears.length} Year{deficitYears.length !== 1 ? 's' : ''}</p>
                <p className="text-xs text-red-700 mt-1 leading-relaxed">
                  Years with negative reserve: {deficitYears.map(y => `FY${y.year}`).join(', ')}.
                  The River Rd Reclamation (FY2030-33, ~$728K) is the largest driver.
                  Increase GF transfer, excise allocation, or phase the River Rd project to restore balance.
                </p>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-bold text-slate-900">15-Year Fund Balance Projection</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Option C · GF Transfer + Excise + LRAP vs. Capital Needs</p>
              </div>
              <button onClick={() => setActiveNav('schedule')}
                className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 border border-slate-200 px-2.5 py-1 rounded-lg">
                Full Schedule →
              </button>
            </div>
            <CIPScheduleChart schedule={schedule.slice(0, 10)} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3">Network Condition Summary</p>
              {Object.entries(STATUS_COLORS).map(([bucket, colors]) => {
                const count = roads.filter(r => r.status_bucket === bucket).length;
                const miles = roads.filter(r => r.status_bucket === bucket).reduce((s, r) => s + (r.centerline_miles || 0), 0);
                const pct   = totalMiles > 0 ? (miles / totalMiles) * 100 : 0;
                return (
                  <div key={bucket} className="flex items-center gap-3 mb-2.5">
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${colors.dot}`} />
                    <span className="text-xs font-semibold text-slate-700 w-20">{bucket}</span>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${colors.dot}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-slate-500 w-6 text-right">{count}</span>
                    <span className="text-[10px] text-slate-400 w-14 text-right">{miles.toFixed(2)} mi</span>
                  </div>
                );
              })}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3">Top Priority Roads</p>
              <div className="space-y-2">
                {[...roads]
                  .sort((a, b) => (b.priority_score || 0) - (a.priority_score || 0))
                  .slice(0, 8)
                  .map(road => {
                    const sc = STATUS_COLORS[road.status_bucket] || STATUS_COLORS.Unknown;
                    return (
                      <div key={road.road_name} className="flex items-center gap-2.5">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${sc.dot}`} />
                        <span className="text-xs font-semibold text-slate-800 flex-1">{road.road_name}</span>
                        <span className="text-[10px] text-slate-400">{road.next_treatment_year || '—'}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${sc.bg} ${sc.text}`}>{road.status_bucket}</span>
                        <span className="text-[10px] text-slate-500 w-16 text-right">{fmt(road.estimated_project_cost)}</span>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 flex items-start gap-2.5">
            <Info className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-800 leading-relaxed">
              <strong>Validation needed:</strong> Condition, surface type, acceptance status, and legal classification are GIS-derived placeholders.
              Public Works and the Town Clerk should verify each road against the legal road inventory, RSMS records, and local knowledge before using this for warrant article preparation.
              Per MMA guidance, a defensible inventory documents: name, status (town way / easement / private), width, condition, drainage, last major work, and legal history.
            </p>
          </div>
        </div>
      )}

      {/* ── 15-YR SCHEDULE ── */}
      {activeNav === 'schedule' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-2">
          <p className="text-sm font-bold text-slate-900">15-Year CIP Fund Balance Schedule</p>
          <p className="text-[11px] text-slate-400 mt-0.5 mb-4">Sources vs. uses with ending reserve — Option C Hybrid (GF + Excise + LRAP)</p>
          <CIPScheduleChart schedule={schedule} />
        </div>
      )}

      {/* ── PROJECT PIPELINE ── */}
      {activeNav === 'pipeline' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <p className="text-sm font-bold text-slate-900 mb-1">Capital Project Pipeline (FY2027–2041)</p>
          <p className="text-[11px] text-slate-400 mb-4">Gantt-style schedule — every road has at least one treatment cycle planned across the 15-year window</p>
          <ProjectPipelineTable
            projects={projects}
            onDelete={p => p.id && deleteProject.mutate(p.id)}
          />
        </div>
      )}

      {/* ── ROAD INVENTORY ── */}
      {activeNav === 'inventory' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
          <div>
            <p className="text-sm font-bold text-slate-900">GIS Road Inventory</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{roads.length} roads · {totalMiles.toFixed(2)} centerline miles · click a row for detail</p>
          </div>
          <RoadInventoryTable roads={roads} onSelect={setSelectedRoad} selectedId={selectedRoad?.road_name} />
          {selectedRoad && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
              <p className="text-xs font-bold text-blue-900 mb-2">{selectedRoad.road_name} — Detail</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-blue-800">
                <div><span className="font-semibold">Miles:</span> {selectedRoad.centerline_miles?.toFixed(3)}</div>
                <div><span className="font-semibold">Jurisdiction:</span> {selectedRoad.jurisdiction}</div>
                <div><span className="font-semibold">Surface:</span> {selectedRoad.surface}</div>
                <div><span className="font-semibold">Status:</span> {selectedRoad.status_bucket}</div>
                <div><span className="font-semibold">Last Work:</span> {selectedRoad.last_major_work_year || '—'}</div>
                <div><span className="font-semibold">Next Treatment:</span> {selectedRoad.planning_work_type}</div>
                <div><span className="font-semibold">Target Year:</span> {selectedRoad.next_treatment_year}</div>
                <div><span className="font-semibold">Est. Cost:</span> {fmt(selectedRoad.estimated_project_cost)}</div>
                {selectedRoad.notes && <div className="col-span-4 opacity-75 leading-relaxed">{selectedRoad.notes}</div>}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── ASSUMPTIONS ── */}
      {activeNav === 'assumptions' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <AssumptionsPanel assumptions={assumptions} onChange={handleSaveAssumptions} />
        </div>
      )}
    </div>
  );
}