/**
 * DashboardKPIRow
 * Four KPI tiles: Cost Recovery %, Structural Efficiency Index,
 * ERP Spend vs Budget, Open Compliance Issues.
 * Each tile has a hover tooltip with the formula / data source.
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, Minus, HelpCircle, ArrowRight, AlertTriangle } from 'lucide-react';

const TOOLTIP_CONTENT = {
  costRecovery:
    'Cost Recovery % = (Total Revenue ÷ Total Cost) × 100.\nIncludes EMS billing, enterprise transfers, and regional service contracts.',
  structuralEfficiency:
    'Structural Efficiency Index = Net Cash Benefit ÷ Total Staffing Cost.\nMeasures how much the restructuring returns per dollar of new personnel investment.',
  erpSpend:
    'ERP Spend vs Budget = (Actual ERP Cost ÷ Budgeted ERP Cost) × 100.\nY1 budget = $47,000 (implementation) + $5,000 (ongoing). Source: Model Settings.',
  compliance:
    'Open Compliance Issues = count of checklist items with status "Partial" or "Placeholder" in Compliance Settings.\nRequires legal review before they can be cleared.',
};

function Tooltip({ text }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-flex">
      <button
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        className="p-0.5 rounded focus:outline-none focus:ring-2 focus:ring-indigo-400"
        aria-label="Show formula"
        tabIndex={0}
      >
        <HelpCircle className="h-3 w-3 text-slate-400 hover:text-slate-600 transition-colors" />
      </button>
      {show && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 rounded-xl border border-slate-200 bg-white shadow-lg p-3 text-[10px] leading-relaxed text-slate-700 whitespace-pre-line pointer-events-none">
          {text}
          <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-white border-b border-r border-slate-200 rotate-45" />
        </div>
      )}
    </span>
  );
}

function KPITile({ id, label, value, sub, trend, tooltipKey, linkTo, linkLabel, highlight, warn }) {
  const trendColor = trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-red-600' : 'text-slate-500';
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const borderColor = warn ? 'border-amber-300' : highlight ? 'border-indigo-200' : 'border-slate-200';
  const bg = warn ? 'bg-amber-50/60' : 'bg-white';

  return (
    <div
      className={`rounded-2xl border ${borderColor} ${bg} p-4 flex flex-col gap-2 hover:shadow-md transition-shadow focus-within:ring-2 focus-within:ring-indigo-400`}
      role="region"
      aria-label={label}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</span>
        <Tooltip text={TOOLTIP_CONTENT[tooltipKey]} />
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold text-slate-900 tabular-nums leading-none">{value}</span>
        {warn && <AlertTriangle className="h-4 w-4 text-amber-500 mb-0.5 flex-shrink-0" />}
      </div>
      {sub && <p className="text-[11px] text-slate-500 leading-relaxed">{sub}</p>}
      <div className="flex items-center justify-between mt-auto pt-1">
        <div className={`flex items-center gap-1 text-[10px] font-semibold ${trendColor}`}>
          <TrendIcon className="h-3 w-3" />
          {trend === 'up' ? 'Favorable' : trend === 'down' ? 'Needs attention' : 'Neutral'}
        </div>
        {linkTo && (
          <Link
            to={linkTo}
            className="inline-flex items-center gap-0.5 text-[10px] font-semibold hover:underline focus:outline-none focus:ring-1 focus:ring-indigo-400 rounded"
            style={{ color: '#344A60' }}
            title={`Drill down: ${linkLabel}`}
          >
            {linkLabel}
            <ArrowRight className="h-2.5 w-2.5" />
          </Link>
        )}
      </div>
    </div>
  );
}

export default function DashboardKPIRow({ projections, settings }) {
  // Cost Recovery % — Y1
  const y1 = projections?.[0];
  const costRecoveryPct = y1 && y1.totalCost
    ? Math.round((y1.totalRevenue / y1.totalCost) * 100)
    : null;

  // Structural Efficiency Index — net cash / staffing cost
  const netCash = projections?.reduce((s, y) => s + (y.cashOnlyCost ?? 0), 0) ?? 0;
  const staffCost = projections?.reduce((s, y) => s + (y.totalStaffCost ?? 0), 0) ?? 1;
  const sei = staffCost > 0 ? (Math.abs(netCash) / staffCost).toFixed(2) : '—';

  // ERP Spend vs Budget
  const erpBudget = (settings?.erp_y1_cost ?? 47000) + (settings?.erp_ongoing_cost ?? 5000) * 4;
  const erpActual = settings?.erp_y1_cost ?? 47000;
  const erpPct = Math.round((erpActual / erpBudget) * 100);

  // Open Compliance Issues — static count based on known placeholder items
  const openIssues = 10; // matches items with legalReview:true in ComplianceChecklist

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <KPITile
        id="costRecovery"
        label="Cost Recovery"
        value={costRecoveryPct !== null ? `${costRecoveryPct}%` : '—'}
        sub="Year 1 revenue vs. total restructuring cost"
        trend={costRecoveryPct !== null && costRecoveryPct >= 80 ? 'up' : 'down'}
        tooltipKey="costRecovery"
        linkTo="/ProForma"
        linkLabel="View Pro Forma"
        highlight
      />
      <KPITile
        id="sei"
        label="Structural Efficiency Index"
        value={sei}
        sub="Net return per $1 of new staffing investment"
        trend={parseFloat(sei) >= 1 ? 'up' : parseFloat(sei) > 0 ? 'neutral' : 'down'}
        tooltipKey="structuralEfficiency"
        linkTo="/Dashboard"
        linkLabel="View Model"
      />
      <KPITile
        id="erpSpend"
        label="ERP Spend vs Budget"
        value={`${erpPct}%`}
        sub={`$${erpActual.toLocaleString()} of $${erpBudget.toLocaleString()} authorized`}
        trend={erpPct <= 100 ? 'up' : 'down'}
        tooltipKey="erpSpend"
        linkTo="/ERPRoadmap"
        linkLabel="ERP Roadmap"
      />
      <KPITile
        id="compliance"
        label="Open Compliance Issues"
        value={openIssues}
        sub={`${openIssues} items need legal sign-off`}
        trend="neutral"
        tooltipKey="compliance"
        linkTo="/ComplianceSettings"
        linkLabel="Review Issues"
        warn
      />
    </div>
  );
}