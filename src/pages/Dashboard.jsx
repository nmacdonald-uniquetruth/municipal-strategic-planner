import React, { useMemo } from 'react';
import { ENTERPRISE_FUNDS } from '../components/machias/FinancialModel';
import { runProFormaFromSettings } from '../components/machias/FinancialModelV2';
import { useModel } from '../components/machias/ModelContext';
import { useDepartment, DEPARTMENTS } from '../components/machias/DepartmentContext';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import StatCard from '../components/machias/StatCard';
import SectionHeader from '../components/machias/SectionHeader';
import ProFormaChart from '../components/machias/ProFormaChart';
import PaybackChart from '../components/machias/PaybackChart';
import InfoTooltip from '../components/machias/InfoTooltip';
import { Link } from 'react-router-dom';
import { LayoutDashboard, DollarSign, TrendingUp, Users, AlertTriangle, Clock, Target, ShieldCheck, BookOpen } from 'lucide-react';
import ExportExecSummary from '../components/machias/ExportExecSummary';
import PlanningHorizonToggle from '../components/machias/PlanningHorizonToggle';

const formatShortCurrency = (value) => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
};

export default function Dashboard() {
  const { settings, planningHorizon } = useModel();
  const { selectedDepartments, toggleDepartment, DEPARTMENTS } = useDepartment();
  const [deptDropdownOpen, setDeptDropdownOpen] = useState(false);
  const data = useMemo(() => runProFormaFromSettings(settings), [settings]);
  
  // Slice data based on planning horizon
  const horizonData = planningHorizon === 5 ? data.slice(0, 5) : data;
  const cumulativeValue = horizonData.reduce((s, d) => s + d.net, 0);
  const y1Net = horizonData[0]?.net || 0;
  const finalYearValue = horizonData[horizonData.length - 1]?.value.total || 0;

  // Cash-only net (excludes FD/TM capacity, control risk, ERP value, enterprise overhead)
  const cashOnlyNet = horizonData.reduce((s, d) => {
    const cashRev = d.value.comstarAvoided + d.value.collectionImprovement +
      d.value.stipendSavings + d.value.airportSavings +
      d.value.regionalServices + d.value.emsExternal + d.value.transferStation;
    return s + cashRev - d.costs.total;
  }, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Machias Bay Region Strategic Planning</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Regional service consolidation, fiscal simulation, and leadership planning platform</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <ExportExecSummary />
          <Link to="/Narrative" className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-400 rounded-lg px-3 py-1.5 transition-all">
            <BookOpen className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Full Narrative</span>
            <span className="sm:hidden">Narrative</span>
          </Link>
        </div>
      </div>

      {/* Planning Horizon Toggle */}
      <PlanningHorizonToggle />

      {/* Department filter */}
      <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Departments Being Evaluated</label>
        <div className="relative w-full md:w-96">
          <button
            onClick={() => setDeptDropdownOpen(!deptDropdownOpen)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-900 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-0 flex items-center justify-between"
          >
            <span>{selectedDepartments.length === 0 ? 'Select departments...' : selectedDepartments.includes('all') ? 'All Departments' : `${selectedDepartments.length} selected`}</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${deptDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          {deptDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
              {DEPARTMENTS.map(dept => (
                <label
                  key={dept.id}
                  className="flex items-center gap-2 px-3 py-2.5 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-b-0"
                >
                  <input
                    type="checkbox"
                    checked={selectedDepartments.includes('all') || selectedDepartments.includes(dept.id)}
                    onChange={() => toggleDepartment(dept.id)}
                    className="w-4 h-4 rounded border-slate-300"
                  />
                  <span className="text-sm text-slate-700">{dept.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Key insight banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Core Finding</p>
              <InfoTooltip title="Why $229,000+ in structural inefficiency?">
                <p>The Finance Director's fully loaded cost is <strong>${settings.fd_loaded_cost?.toLocaleString()}/yr</strong>. At current utilization, 45–60% of FD time is spent on transactional tasks (AP, payroll, EMS billing oversight) that don't require a Finance Director's expertise.</p>
                <p>Comstar currently charges <strong>{(settings.comstar_fee_rate * 100).toFixed(2)}%</strong> of gross EMS collections — approximately <strong>${data[0]?.value?.comstarAvoided?.toLocaleString()}/yr</strong> — to manage billing that an in-house Billing Specialist can handle.</p>
                <p>Informal stipend arrangements of <strong>${settings.stipend_elimination?.toLocaleString()}/yr</strong> exist for work that should be consolidated into formal roles.</p>
                <p className="text-slate-500 text-xs">See the <strong>Full Narrative → Section 2</strong> for the complete problem statement.</p>
              </InfoTooltip>
            </div>
            <p className="text-lg font-bold mt-1">$229,000+ in annual structural inefficiency</p>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Executive compensation on transactional work, outsourced billing fees, informal stipends, and airport inspection overage.
              This plan formalizes that expenditure into 3 dedicated positions — zero tax increase required.
            </p>
          </div>
          <div className="flex gap-4 flex-wrap justify-end">
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-400">{formatShortCurrency(cashOnlyNet)}</p>
              <p className="text-[10px] text-slate-400">{planningHorizon}-Yr Cash Net</p>
              <p className="text-[9px] text-slate-500">actual dollars only</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-300">{formatShortCurrency(cumulativeValue)}</p>
              <p className="text-[10px] text-slate-400">{planningHorizon}-Yr Total Value</p>
              <p className="text-[9px] text-slate-500">incl. capacity + risk value</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-400">~Y2</p>
              <p className="text-[10px] text-slate-400">Cash Break-Even</p>
              <p className="text-[9px] text-slate-500">actual dollars</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="relative">
           <StatCard label="Year 1 Net" value={formatShortCurrency(y1Net)} icon={DollarSign} sub="Base case, all 3 positions" />
           <div className="absolute top-2 right-2">
             <InfoTooltip title="Year 1 Net Value">
              <p>This is the net of all projected value (structural savings, regional revenue, EMS improvement, capacity) minus the total cost of all new positions and ERP implementation in Year 1.</p>
              <p>It includes both cash and non-cash value categories. For a cash-only view, see the "5-Yr Cash Net" figure on the banner above.</p>
            </InfoTooltip>
          </div>
        </div>
        <div className="relative">
           <StatCard label={`Year ${planningHorizon} Gross Value`} value={formatShortCurrency(finalYearValue)} icon={TrendingUp} sub="Structural + regional" />
          <div className="absolute top-2 right-2">
            <InfoTooltip title={`Year ${planningHorizon} Gross Value`}>
              <p>The total projected annual value of the restructuring by Year {planningHorizon}, including all three categories: non-tax revenue (regional contracts, EMS), budget impact (avoided fees, stipend savings, enterprise overhead), and capacity value (FD/TM time recovered, control risk mitigation).</p>
            </InfoTooltip>
          </div>
        </div>
        <div className="relative">
          <StatCard
            label="Tax Levy"
            value={`$${(settings.annual_tax_levy / 1000000).toFixed(2)}M`}
            icon={ShieldCheck}
            sub="Annual GF levy"
          />
          <div className="absolute top-2 right-2">
            <InfoTooltip title="General Fund Levy Impact">
              <p>This measures whether the restructuring requires a property tax increase. The calculation compares GF-funded position costs (Staff Accountant, GA Coordinator, ERP, airport stipend) against GF cash offsets (regional contracts, Comstar savings, stipend elimination, enterprise overhead).</p>
              <p><strong>The Billing Specialist is excluded</strong> — that position is funded entirely by the Ambulance Fund.</p>
              <p>A surplus means cash offsets exceed costs — no tax increase needed.</p>
            </InfoTooltip>
          </div>
        </div>
        <div className="relative">
           <StatCard label="Undesignated Draw Y1" value={horizonData[0]?.gf?.undesignatedDraw === 0 ? 'None' : `$${horizonData[0]?.gf?.undesignatedDraw.toLocaleString()}`} icon={AlertTriangle} sub={horizonData[0]?.gf?.undesignatedDraw === 0 ? 'Cash offsets cover all GF costs' : 'Fund draw required'} />
          <div className="absolute top-2 right-2">
            <InfoTooltip title="Undesignated Fund Draw">
              <p>If GF-funded costs exceed GF cash offsets in Year 1, the gap would need to be covered by a draw from the undesignated fund balance (currently ~${settings.gf_undesignated_balance?.toLocaleString()}).</p>
              <p>The plan is designed to avoid any undesignated fund draw. If this shows "None," the restructuring is fully covered by operating cash offsets.</p>
            </InfoTooltip>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="flex items-center gap-2">
        <SectionHeader title={`${planningHorizon}-Year Financial Pro Forma`} subtitle="Base case: all revenue streams active" icon={TrendingUp} />
        <InfoTooltip title="How to read the Pro Forma chart">
          <p>The stacked bars show three value categories: <strong>Structural</strong> (avoided costs, enterprise overhead, capacity), <strong>Regional</strong> (contracts + EMS external + Transfer Station), and <strong>ERP</strong> (starting Year 2).</p>
          <p>The orange line shows total costs. When stacked bars exceed the line, the restructuring is net-positive for that year.</p>
          <p>Note: the chart includes all value categories including non-cash items. See "{planningHorizon}-Yr Cash Net" for actual dollars only.</p>
        </InfoTooltip>
      </div>
      <ProFormaChart data={horizonData} />

      <div className="flex items-center gap-2">
        <SectionHeader title="Payback Timeline" subtitle="Quarterly cost-value analysis through 24 months" icon={Clock} />
        <InfoTooltip title="Payback Timeline">
          <p>This chart tracks the cash-only cumulative net — actual dollars deposited or saved, minus actual costs — quarter by quarter through the first two fiscal years.</p>
          <p>Cash break-even is projected around Year 2, when cumulative cash offsets exceed cumulative costs. Non-cash value (FD/TM capacity, control risk) is excluded here intentionally.</p>
        </InfoTooltip>
      </div>
      <PaybackChart />

      {/* Three pillars summary */}
      <div className="flex items-center gap-2">
        <SectionHeader title="Value Categories" subtitle="Understanding what the numbers measure" icon={Target} />
        <InfoTooltip title="Why three value categories?">
          <p>Not all financial value is cash. To give an honest picture, the model separates value into three distinct categories so stakeholders can decide which they find credible.</p>
          <p><strong>Category 1 (Non-Tax Revenue)</strong> — actual dollars deposited. Most conservative. Use this for budget planning.</p>
          <p><strong>Category 2 (Budget Impact)</strong> — real cost reductions and avoided expenditures. Directly reduces the levy, but some items are opportunity costs.</p>
          <p><strong>Category 3 (Capacity Value)</strong> — time redirected from the FD and TM to higher-value work. Real but hardest to quantify. The model uses conservative hourly values.</p>
        </InfoTooltip>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/30 p-5">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="h-4 w-4 text-emerald-700" />
            <h3 className="text-sm font-semibold text-emerald-800">Category 1: Non-Tax Revenue</h3>
          </div>
          <p className="text-xs text-emerald-700 leading-relaxed">
            Actual cash deposited to the General Fund. Regional services contracts, EMS collection improvement,
            Transfer Station member fees, and external EMS billing revenue.
          </p>
          <p className="mt-3 text-lg font-bold text-emerald-800">~${(planningHorizon === 5 ? 900 : 1800)}K over {planningHorizon} years</p>
          <Link to="/Narrative" className="mt-2 text-[10px] text-emerald-600 hover:underline block">Read full narrative →</Link>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/30 p-5">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="h-4 w-4 text-amber-700" />
            <h3 className="text-sm font-semibold text-amber-800">Category 2: Budget Impact</h3>
          </div>
          <p className="text-xs text-amber-700 leading-relaxed">
            Real cost reductions. Comstar fee avoided (${horizonData[0]?.value?.comstarAvoided?.toLocaleString()}+ and growing), stipend elimination (${settings.stipend_elimination?.toLocaleString()}/yr),
            airport inspection savings, enterprise overhead allocation.
          </p>
          <p className="mt-3 text-lg font-bold text-amber-800">Direct GF reductions</p>
          <Link to="/Narrative" className="mt-2 text-[10px] text-amber-600 hover:underline block">Read full narrative →</Link>
        </div>

        <div className="rounded-2xl border border-blue-200 bg-blue-50/30 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-4 w-4 text-blue-700" />
            <h3 className="text-sm font-semibold text-blue-800">Category 3: Capacity Value</h3>
          </div>
          <p className="text-xs text-blue-700 leading-relaxed">
            Time redirected to strategic work. FD: 45-60% capacity recovered. TM: 18-22% recovered.
            Control risk mitigation ${horizonData[0]?.value?.controlRisk?.toLocaleString()}–${horizonData[1]?.value?.controlRisk?.toLocaleString()}/yr. Enables economic development.
          </p>
          <p className="mt-3 text-lg font-bold text-blue-800">~${(planningHorizon === 5 ? 700 : 1400)}K time value</p>
          <Link to="/Narrative" className="mt-2 text-[10px] text-blue-600 hover:underline block">Read full narrative →</Link>
        </div>
      </div>
    </div>
  );
}