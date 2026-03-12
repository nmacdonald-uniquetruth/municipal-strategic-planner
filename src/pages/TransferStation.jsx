import React, { useState, useMemo } from 'react';
import { useModel } from '../components/machias/ModelContext';
import SectionHeader from '../components/machias/SectionHeader';
import { Truck, DollarSign, TrendingUp, Settings, Users, BarChart2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line, ReferenceLine } from 'recharts';

const fmt  = (n) => n == null ? '—' : `$${Math.abs(Math.round(n)).toLocaleString()}`;
const fmtK = (n) => `$${Math.round(n / 1000)}K`;

const MEMBER_TOWNS = [
  { name: 'Machias (host)', population: 2100, current_annual: 28000, proposed_y1: 35000, proposed_y3: 42000, tier: 'Host', status: 'member' },
  { name: 'Roque Bluffs',   population: 320,  current_annual: 3200,  proposed_y1: 4800,  proposed_y3: 5500,  tier: 'Residential', status: 'member' },
  { name: 'Marshfield',     population: 430,  current_annual: 4100,  proposed_y1: 6000,  proposed_y3: 7000,  tier: 'Residential', status: 'member' },
  { name: 'Whitneyville',   population: 310,  current_annual: 2900,  proposed_y1: 4200,  proposed_y3: 5000,  tier: 'Residential', status: 'member' },
  { name: 'Wesley',         population: 540,  current_annual: 0,     proposed_y1: 6500,  proposed_y3: 7500,  tier: 'Residential', status: 'prospective' },
  { name: 'Beddington',     population: 50,   current_annual: 0,     proposed_y1: 1200,  proposed_y3: 1500,  tier: 'Residential', status: 'prospective' },
  { name: 'Northfield',     population: 230,  current_annual: 1800,  proposed_y1: 3000,  proposed_y3: 3600,  tier: 'Residential', status: 'member' },
  { name: 'Machiasport',    population: 1050, current_annual: 8000,  proposed_y1: 11000, proposed_y3: 13000, tier: 'Residential', status: 'member' },
];

const TS_METRICS = [
  { label: 'Current Fund Balance', value: '($296,245)', status: 'critical', note: 'Accumulated deficit — primary concern' },
  { label: 'Annual GF Overhead Transfer', value: '$21,000', status: 'stable', note: 'Current admin cost recovery to GF' },
  { label: 'Deficit Trend', value: '−$40K–60K/yr', status: 'critical', note: 'Estimated annual gap before restructuring' },
  { label: 'Target Break-Even', value: 'Year 3', status: 'target', note: 'Under proposed revenue restructuring' },
];

export default function TransferStation() {
  const { settings, updateSettings } = useModel();
  const [activeTab, setActiveTab] = useState('overview');
  const [adminPct, setAdminPct] = useState(12); // % of total TS revenue allocated to admin overhead to GF

  const tsRevData = [8190, 52554, 109551, 74282, 131000];
  const tsCostData = [65000, 68000, 71000, 74000, 77000]; // estimated operating costs
  const years = ['FY2027', 'FY2028', 'FY2029', 'FY2030', 'FY2031'];

  const currentMemberTotal = MEMBER_TOWNS.filter(t => t.status === 'member').reduce((s, t) => s + t.current_annual, 0);
  const proposedY1Total = MEMBER_TOWNS.reduce((s, t) => s + t.proposed_y1, 0);
  const proposedY3Total = MEMBER_TOWNS.reduce((s, t) => s + t.proposed_y3, 0);

  const chartData = years.map((fy, i) => ({
    fy,
    revenue: tsRevData[i],
    costs: tsCostData[i],
    net: tsRevData[i] - tsCostData[i],
    adminToGF: Math.round(tsRevData[i] * (adminPct / 100)),
  }));

  const cumulativeRecovery = tsRevData.reduce((s, v) => s + v, 0);
  const deficitBalance = -296245;
  let remaining = deficitBalance;
  const deficitTimeline = tsRevData.map((rev, i) => {
    const netSurplus = rev - tsCostData[i];
    remaining = Math.min(0, remaining + netSurplus);
    return { fy: years[i], deficit: remaining };
  });

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <SectionHeader
          title="Transfer Station — Regional Service Center Strategy"
          subtitle="Transforming a deficit enterprise fund into a sustainable regional waste management hub"
          icon={Truck}
        />
        <Link to="/ModelSettings" className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 border border-slate-200 rounded-lg px-3 py-1.5">
          <Settings className="h-3.5 w-3.5" /> Adjust Settings
        </Link>
      </div>

      {/* Status banner */}
      <div className="rounded-2xl border-2 border-red-200 bg-red-50/40 p-5">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-red-100 flex items-center justify-center">
            <span className="text-lg">🔴</span>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-red-900 text-sm mb-1">Critical Financial Status — Immediate Action Required</h3>
            <p className="text-xs text-red-700">The Transfer Station enterprise fund carries a deficit of <strong>($296,245)</strong> accumulated over several years. Member town contributions have not kept pace with operational costs. Without structural revenue reform, this deficit will continue to grow at an estimated $40,000–$60,000 per year, eventually requiring a General Fund subsidy or service discontinuation.</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-2xl font-bold text-red-800">($296K)</p>
            <p className="text-[10px] text-red-600">fund balance</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {[['overview','Overview & Strategy'],['members','Member Towns'],['revenue','Revenue Model'],['admin','Admin Allocation'],['operations','Operations'],['performance','Performance Metrics']].map(([id, label]) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${activeTab === id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {TS_METRICS.map((m, i) => (
              <div key={i} className={`rounded-xl border p-4 ${m.status === 'critical' ? 'border-red-200 bg-red-50' : m.status === 'target' ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white'}`}>
                <p className={`text-xl font-bold ${m.status === 'critical' ? 'text-red-800' : m.status === 'target' ? 'text-emerald-800' : 'text-slate-900'}`}>{m.value}</p>
                <p className="text-xs font-medium text-slate-600 mt-0.5">{m.label}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{m.note}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="font-bold text-slate-900 text-sm mb-3">The Strategic Imperative</h3>
            <div className="space-y-3 text-sm text-slate-700">
              <p>The Transfer Station is Washington County's primary solid waste facility for this cluster of towns. Shutting it down is not a realistic option — it would require member towns to find alternative disposal at significantly higher cost. The path forward is to <strong>operate it like the enterprise it is</strong>.</p>
              <p>The Administrative Restructuring creates the capacity to implement proper cost accounting, renegotiate member agreements on a defensible cost-per-household basis, and expand the member base to spread fixed costs. None of this is possible with the current Finance Department staffing level.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
              {[
                { step: '1. Conduct cost study', detail: 'SA performs a proper cost-per-household analysis in Year 1. Establishes defensible basis for rate renegotiation.', timing: 'Y1 Q2' },
                { step: '2. Renegotiate agreements', detail: 'Present cost data to member towns. New agreements based on population/tonnage rather than ad hoc negotiation.', timing: 'Y1 Q3–Q4' },
                { step: '3. Expand membership', detail: 'Target Wesley and Beddington. Every additional member town reduces per-household cost for all.', timing: 'Y2–Y3' },
              ].map((s, i) => (
                <div key={i} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="h-5 w-5 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">{i+1}</span>
                    <p className="font-semibold text-slate-800 text-xs">{s.step}</p>
                  </div>
                  <p className="text-xs text-slate-600">{s.detail}</p>
                  <p className="text-[10px] text-slate-400 mt-1 font-mono">{s.timing}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="font-bold text-slate-900 text-sm mb-3">5-Year Revenue vs. Cost Projection</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="fy" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${v/1000}K`} />
                <Tooltip formatter={(v) => fmt(v)} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="revenue" name="TS Revenue" fill="#10b981" radius={[4,4,0,0]} />
                <Bar dataKey="costs" name="Operating Costs" fill="#f59e0b" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-[10px] text-slate-400 mt-1">Revenue projections from FinancialModelV2. Operating costs estimated at $65K Y1 + 4%/yr escalation.</p>
          </div>
        </div>
      )}

      {/* Member Towns */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xl font-bold text-slate-900">{fmt(currentMemberTotal)}</p>
              <p className="text-xs text-slate-500">Current annual member contributions</p>
            </div>
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
              <p className="text-xl font-bold text-blue-900">{fmt(proposedY1Total)}</p>
              <p className="text-xs text-blue-600">Proposed Y1 (all towns + prospective)</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xl font-bold text-emerald-900">{fmt(proposedY3Total)}</p>
              <p className="text-xs text-emerald-600">Proposed Y3 (full expansion)</p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white px-4 py-2 text-[10px] font-semibold uppercase tracking-wider grid grid-cols-6">
              <span>Town</span><span>Pop.</span><span>Current</span><span>Proposed Y1</span><span>Proposed Y3</span><span>Status</span>
            </div>
            {MEMBER_TOWNS.map((town, i) => (
              <div key={i} className={`px-4 py-3 grid grid-cols-6 text-xs border-t border-slate-100 ${town.status === 'prospective' ? 'bg-blue-50/30' : ''}`}>
                <span className="font-medium text-slate-900">{town.name}</span>
                <span className="text-slate-600">{town.population.toLocaleString()}</span>
                <span className="font-mono text-slate-700">{town.current_annual > 0 ? fmt(town.current_annual) : '—'}</span>
                <span className="font-mono text-emerald-700 font-semibold">{fmt(town.proposed_y1)}</span>
                <span className="font-mono text-emerald-700 font-semibold">{fmt(town.proposed_y3)}</span>
                <span className={`font-semibold ${town.status === 'member' ? 'text-slate-700' : 'text-blue-600'}`}>{town.status === 'member' ? 'Current member' : 'Prospective'}</span>
              </div>
            ))}
            <div className="px-4 py-2 grid grid-cols-6 text-xs border-t-2 border-slate-300 bg-slate-100 font-bold">
              <span>Total</span>
              <span>{MEMBER_TOWNS.reduce((s, t) => s + t.population, 0).toLocaleString()}</span>
              <span className="font-mono">{fmt(currentMemberTotal)}</span>
              <span className="font-mono text-emerald-800">{fmt(proposedY1Total)}</span>
              <span className="font-mono text-emerald-800">{fmt(proposedY3Total)}</span>
              <span></span>
            </div>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 text-xs text-amber-800">
            <strong>Cost allocation methodology:</strong> Current agreements were negotiated ad hoc without a defensible cost basis. The proposed approach uses <strong>cost-per-household</strong> as the primary allocation metric, with tonnage as a secondary factor for commercial members. This creates a transparent, auditable basis for renegotiation and a clear formula for new member onboarding.
          </div>
        </div>
      )}

      {/* Revenue Model */}
      {activeTab === 'revenue' && (
        <div className="space-y-5">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="font-bold text-slate-900 text-sm mb-3">Revenue Stream Breakdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { stream: 'Member Town Assessments', pct: '60–70%', desc: 'Annual per-household or per-tonnage contributions from member towns. Primary revenue source. Requires renegotiation to align with actual costs.', priority: 'Critical' },
                { stream: 'Tipping Fees (Non-Members)', pct: '15–20%', desc: 'Walk-in and commercial customers who are not member towns pay a per-ton tipping fee. Opportunity to increase commercial revenue.', priority: 'High' },
                { stream: 'Recyclable Materials Revenue', pct: '5–10%', desc: 'Revenue from sale of recyclables — cardboard, metals, paper. Market-variable. Should be treated as upside, not budgeted conservatively.', priority: 'Medium' },
                { stream: 'Hazardous Waste Handling Fees', pct: '3–5%', desc: 'State HHW program reimbursements + direct fees for HHW collection events.', priority: 'Medium' },
                { stream: 'Admin Overhead Allocation to GF', pct: `${adminPct}%`, desc: `Overhead transfer from TS enterprise fund to General Fund, reflecting GF staff time spent on TS administration. Currently ${fmt(settings.ts_transfer)}/yr. Can be increased as TS revenue improves.`, priority: 'Structural' },
              ].map((s, i) => (
                <div key={i} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold text-slate-800 text-xs">{s.stream}</p>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{s.pct}</span>
                  </div>
                  <p className="text-xs text-slate-600">{s.desc}</p>
                  <p className="text-[10px] text-slate-400 mt-1">Priority: {s.priority}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white px-4 py-2 text-[10px] font-semibold uppercase tracking-wider grid grid-cols-5">
              <span>Year</span><span>TS Revenue</span><span>Op. Costs (est.)</span><span>Net</span><span>Deficit Recovery</span>
            </div>
            {chartData.map((row, i) => {
              const defRow = deficitTimeline[i];
              return (
                <div key={i} className={`px-4 py-2.5 grid grid-cols-5 text-xs border-t border-slate-100 ${row.net > 0 ? 'bg-emerald-50/20' : 'bg-red-50/20'}`}>
                  <span className="font-medium text-slate-800">{row.fy}</span>
                  <span className="font-mono text-emerald-700">{fmt(row.revenue)}</span>
                  <span className="font-mono text-red-700">{fmt(row.costs)}</span>
                  <span className={`font-mono font-semibold ${row.net >= 0 ? 'text-emerald-800' : 'text-red-800'}`}>{row.net >= 0 ? fmt(row.net) : `(${fmt(Math.abs(row.net))})`}</span>
                  <span className={`font-mono ${defRow.deficit < -100000 ? 'text-red-700' : defRow.deficit < 0 ? 'text-amber-700' : 'text-emerald-700'}`}>{fmt(defRow.deficit)}</span>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-slate-400">Operating cost estimates are illustrative. TS revenue projections from the financial model — adjust in <Link to="/ModelSettings" className="underline text-slate-700">Model Settings</Link> if needed.</p>
        </div>
      )}

      {/* Admin Allocation */}
      {activeTab === 'admin' && (
        <div className="space-y-5">
          <p className="text-sm text-slate-600">
            As the Transfer Station improves its revenue streams, the administrative overhead allocation to the General Fund should increase to reflect the growing complexity of managing the enterprise. This section models the relationship between TS revenue health and appropriate GF overhead recovery.
          </p>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="font-bold text-slate-900 text-sm mb-3">Admin Overhead Allocation Model</h3>
            <div className="flex items-center gap-4 mb-4">
              <label className="text-xs font-medium text-slate-700 flex-shrink-0">Admin allocation % of TS revenue:</label>
              <input type="range" min={5} max={25} value={adminPct} onChange={e => setAdminPct(Number(e.target.value))}
                className="flex-1" />
              <span className="text-sm font-bold text-slate-900 w-12 text-right">{adminPct}%</span>
            </div>
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <div className="bg-slate-100 px-4 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider grid grid-cols-4">
                <span>Year</span><span>TS Revenue</span><span>Admin to GF ({adminPct}%)</span><span>vs. Current ($21K)</span>
              </div>
              {chartData.map((row, i) => {
                const adminAmt = row.adminToGF;
                const delta = adminAmt - 21000;
                return (
                  <div key={i} className="px-4 py-2 grid grid-cols-4 text-xs border-t border-slate-100">
                    <span className="font-medium text-slate-800">{row.fy}</span>
                    <span className="font-mono text-slate-700">{fmt(row.revenue)}</span>
                    <span className="font-mono font-semibold text-emerald-700">{fmt(adminAmt)}</span>
                    <span className={`font-mono ${delta >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{delta >= 0 ? '+' : ''}{fmt(delta)}</span>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-slate-500 mt-3">
              Current GF overhead transfer from TS is <strong>{fmt(settings.ts_transfer)}/yr</strong> (set in Model Settings). As TS revenue grows, the Board should evaluate increasing this transfer annually to reflect actual GF staff time spent on TS administration — particularly as the SA provides cost accounting and member billing services.
            </p>
          </div>

          <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 text-xs text-blue-800">
            <strong>Recommended policy:</strong> Set the TS admin overhead allocation as a percentage of gross TS revenue (recommend starting at 10–12%, increasing to 15–18% as revenue stabilizes). This creates a natural escalation mechanism — as the TS does better, the GF is compensated more for the administrative services it provides. Update the base transfer in <Link to="/ModelSettings" className="underline font-semibold">Model Settings → Enterprise Funds</Link>.
          </div>
        </div>
      )}

      {/* Operations */}
      {activeTab === 'operations' && (
        <div className="space-y-4 text-sm text-slate-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { title: 'Cost Structure', icon: '💰', items: [
                'Labor: Station manager + part-time operators (~$55–65K/yr)',
                'Equipment: Compactor, front-end loader lease/maintenance',
                'Disposal contracts: Solid waste hauler + recycling processor',
                'HHW disposal: Annual contracted event + materials',
                'Insurance: Environmental liability + property + WC',
                'Utilities: Power, water, communications',
              ]},
              { title: 'Revenue Levers', icon: '📈', items: [
                'Member town assessment renegotiation (highest impact)',
                'Tipping fee for non-members (commercial opportunity)',
                'Recyclable commodity revenue (variable, upside)',
                'HHW state program reimbursements',
                'Special waste events (electronics, tires)',
                'Potential composting revenue (longer term)',
              ]},
              { title: 'Operational Improvements', icon: '⚙️', items: [
                'Implement tonnage tracking (required for cost allocation)',
                'Digital payment acceptance for tipping fees',
                'Member town reporting portal (ERP integration)',
                'Quarterly P&L reporting to Select Board',
                'Annual independent rate adequacy review',
                'Formalize HHW disposal schedule and marketing',
              ]},
              { title: 'Administrative Needs (SA-dependent)', icon: '📋', items: [
                'Separate enterprise fund ledger in new ERP',
                'Monthly reconciliation vs. current ad hoc',
                'Proper depreciation accounting for equipment',
                'Interlocal agreement management',
                'Tonnage billing and collection tracking',
                'Annual financial report to member towns',
              ]},
            ].map((col, i) => (
              <div key={i} className="rounded-xl border border-slate-200 bg-white p-4">
                <h4 className="font-bold text-slate-900 text-sm mb-2">{col.icon} {col.title}</h4>
                <div className="space-y-1">
                  {col.items.map((item, j) => (
                    <p key={j} className="text-xs text-slate-600">• {item}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance Metrics */}
      {activeTab === 'performance' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white px-4 py-3">
              <h3 className="font-semibold text-sm">Key Performance Indicators</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Track quarterly; report to Select Board annually</p>
            </div>
            {[
              { category: 'Financial', metrics: [
                { name: 'Fund balance trend', target: 'Deficit reduction ≥ $30K/yr', freq: 'Annual' },
                { name: 'Revenue per ton', target: '> cost per ton', freq: 'Quarterly' },
                { name: 'Cost recovery ratio', target: '≥ 95% by Y3', freq: 'Annual' },
                { name: 'Member assessment collection rate', target: '100%', freq: 'Annual' },
              ]},
              { category: 'Operational', metrics: [
                { name: 'Tons processed', target: 'Track vs. prior year', freq: 'Monthly' },
                { name: 'Recyclable diversion rate', target: '≥ 25%', freq: 'Monthly' },
                { name: 'HHW collection events', target: '2/yr minimum', freq: 'Annual' },
                { name: 'Equipment downtime', target: '< 5% of operating hours', freq: 'Monthly' },
              ]},
              { category: 'Member Relations', metrics: [
                { name: 'Member agreements current', target: '100% signed, not expired', freq: 'Annual' },
                { name: 'Annual report delivery', target: 'By Sept 1 each year', freq: 'Annual' },
                { name: 'Rate dispute resolution', target: '< 30 days to resolution', freq: 'As needed' },
                { name: 'New member prospects contacted', target: '2+ per year', freq: 'Annual' },
              ]},
            ].map((cat, ci) => (
              <div key={ci}>
                <div className="bg-slate-50 px-4 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-t border-slate-200">{cat.category}</div>
                {cat.metrics.map((m, mi) => (
                  <div key={mi} className="px-4 py-2.5 grid grid-cols-3 text-xs border-t border-slate-100">
                    <span className="font-medium text-slate-800">{m.name}</span>
                    <span className="text-slate-600">{m.target}</span>
                    <span className="text-slate-400 font-mono">{m.freq}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}