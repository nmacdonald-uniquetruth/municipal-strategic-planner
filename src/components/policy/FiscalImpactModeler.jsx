/**
 * FiscalImpactModeler.jsx
 * Predictive fiscal impact modeling panel for Finance Directors.
 * Compares bill fiscal impact amounts against BudgetControlRecord baselines
 * and outputs potential budget variance percentages with risk tiers.
 */
import React, { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  DollarSign, AlertTriangle, TrendingUp, TrendingDown, RefreshCw,
  ChevronDown, ChevronRight, Building2, BarChart2, Info, Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// ─── Risk tier styling ────────────────────────────────────────────────────────
const RISK_STYLES = {
  Critical: { bg: 'bg-red-100',    text: 'text-red-800',    border: 'border-red-300',    bar: 'bg-red-500',    dot: 'bg-red-500'    },
  High:     { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300', bar: 'bg-orange-500', dot: 'bg-orange-500' },
  Moderate: { bg: 'bg-amber-100',  text: 'text-amber-800',  border: 'border-amber-300',  bar: 'bg-amber-400',  dot: 'bg-amber-400'  },
  Low:      { bg: 'bg-yellow-50',  text: 'text-yellow-800', border: 'border-yellow-200', bar: 'bg-yellow-400', dot: 'bg-yellow-400' },
  Minimal:  { bg: 'bg-green-50',   text: 'text-green-800',  border: 'border-green-200',  bar: 'bg-green-400',  dot: 'bg-green-400'  },
};

const fmt  = n  => n ? `$${Math.abs(n).toLocaleString()}` : '—';
const fmtPct = p => `${Math.abs(p).toFixed(1)}%`;

// ─── Subcomponents ────────────────────────────────────────────────────────────

function SummaryKPIs({ summary }) {
  if (!summary) return null;
  const cards = [
    { label: 'Items Modeled',      value: summary.total_modeled,   color: 'slate', icon: BarChart2 },
    { label: 'Critical Variance',  value: summary.critical_count,  color: summary.critical_count > 0 ? 'red' : 'slate',    icon: AlertTriangle },
    { label: 'High Variance',      value: summary.high_count,      color: summary.high_count > 0    ? 'orange' : 'slate',  icon: TrendingUp },
    { label: 'Total Fiscal Exposure', value: fmt(summary.total_exposure), color: 'amber', icon: DollarSign },
    { label: 'Avg Variance',       value: fmtPct(summary.avg_variance_pct), color: 'blue', icon: BarChart2 },
    { label: 'Budget Baseline',    value: summary.profile_name,    color: 'slate', icon: Building2 },
  ];
  const colorCls = {
    red:    'bg-red-50 border-red-200 text-red-800',
    orange: 'bg-orange-50 border-orange-200 text-orange-800',
    amber:  'bg-amber-50 border-amber-200 text-amber-800',
    blue:   'bg-blue-50 border-blue-200 text-blue-800',
    slate:  'bg-slate-50 border-slate-200 text-slate-700',
  };
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
      {cards.map(c => (
        <div key={c.label} className={`rounded-xl border p-3 ${colorCls[c.color]}`}>
          <div className="flex items-center justify-between mb-1">
            <c.icon className="h-3.5 w-3.5 opacity-60" />
          </div>
          <p className="text-lg font-bold leading-tight">{c.value}</p>
          <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70 mt-0.5">{c.label}</p>
        </div>
      ))}
    </div>
  );
}

function VarianceBar({ pct, max = 15 }) {
  const clamped = Math.min(Math.abs(pct), max);
  const width   = `${(clamped / max) * 100}%`;
  const tier    = pct >= 10 ? 'Critical' : pct >= 5 ? 'High' : pct >= 2 ? 'Moderate' : pct >= 0.5 ? 'Low' : 'Minimal';
  return (
    <div className="flex items-center gap-2 flex-1">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${RISK_STYLES[tier].bar}`} style={{ width }} />
      </div>
      <span className="text-[11px] font-bold tabular-nums w-10 text-right">{fmtPct(pct)}</span>
    </div>
  );
}

function PredictionRow({ prediction, expanded, onToggle }) {
  const s = RISK_STYLES[prediction.risk_tier] || RISK_STYLES.Minimal;
  const isExpanded = expanded === prediction.legislation_item_id;

  return (
    <div className={`rounded-xl border ${s.border} overflow-hidden`}>
      {/* Main row */}
      <button
        className="w-full text-left flex items-center gap-3 p-3.5 hover:bg-slate-50 transition-colors"
        onClick={() => onToggle(prediction.legislation_item_id)}
      >
        {/* Risk dot */}
        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${s.dot}`} />

        {/* Identifier + title */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            {prediction.identifier && (
              <span className="text-[10px] font-mono text-slate-400">{prediction.identifier}</span>
            )}
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${s.bg} ${s.text}`}>
              {prediction.risk_tier}
            </span>
            <span className="text-[10px] text-slate-400 capitalize">
              {prediction.variance_direction.replace('_', ' ')}
            </span>
          </div>
          <p className="text-sm font-semibold text-slate-900 truncate leading-snug">
            {prediction.title}
          </p>
        </div>

        {/* Fiscal amount */}
        <div className="text-right flex-shrink-0 w-24">
          <p className={`text-sm font-bold ${prediction.variance_direction === 'revenue_increase' ? 'text-emerald-700' : 'text-red-700'}`}>
            {fmt(prediction.fiscal_impact_amount)}
          </p>
          <p className="text-[10px] text-slate-400">est. impact</p>
        </div>

        {/* Variance bar */}
        <div className="w-36 hidden md:flex">
          <VarianceBar pct={prediction.potential_budget_variance_pct} />
        </div>

        {/* Confidence */}
        <div className="text-right flex-shrink-0 w-14 hidden lg:block">
          <p className="text-xs font-semibold text-slate-600">{prediction.confidence_score}%</p>
          <p className="text-[9px] text-slate-400">confidence</p>
        </div>

        <ChevronRight className={`h-4 w-4 text-slate-400 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
      </button>

      {/* Expanded detail */}
      {isExpanded && (
        <div className={`border-t ${s.border} p-4 space-y-4 ${s.bg} bg-opacity-40`}>
          {/* Finance action */}
          <div className="rounded-lg border border-current border-opacity-20 bg-white p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Shield className="h-3.5 w-3.5 text-slate-500" />
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-600">Finance Director Action</p>
            </div>
            <p className="text-sm text-slate-800 font-medium leading-snug">{prediction.finance_action}</p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCell label="Budget Variance" value={fmtPct(prediction.potential_budget_variance_pct)} highlight />
            <StatCell label="% of Annual Budget" value={fmtPct(prediction.annual_budget_pct)} />
            <StatCell label="Baseline Used" value={fmt(prediction.baseline_budget_used)} />
            <StatCell label="Confidence" value={`${prediction.confidence_score}%`} />
          </div>

          {/* Department breakdown */}
          {prediction.department_breakdown?.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-2">Department Breakdown</p>
              <div className="space-y-1.5">
                {prediction.department_breakdown.map(d => (
                  <div key={d.department} className="flex items-center gap-3 text-xs bg-white rounded-lg px-3 py-2 border border-slate-100">
                    <span className="font-semibold text-slate-700 w-40 truncate flex-shrink-0">{d.department}</span>
                    <span className="text-slate-400">Adopted: {fmt(d.adopted_budget)}</span>
                    <span className="text-slate-400">YTD: {fmt(d.ytd_actual)}</span>
                    {d.dept_variance_pct != null ? (
                      <span className={`ml-auto font-bold ${d.dept_variance_pct >= 10 ? 'text-red-700' : d.dept_variance_pct >= 5 ? 'text-orange-700' : 'text-slate-600'}`}>
                        {fmtPct(d.dept_variance_pct)} variance
                      </span>
                    ) : (
                      <span className="ml-auto text-slate-300 italic text-[10px]">no baseline</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fiscal note */}
          {prediction.fiscal_impact_note && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1">Fiscal Impact Note</p>
              <p className="text-xs text-slate-700 leading-relaxed">{prediction.fiscal_impact_note}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatCell({ label, value, highlight }) {
  return (
    <div className={`rounded-lg p-2.5 border ${highlight ? 'bg-white border-slate-200' : 'bg-white bg-opacity-60 border-slate-100'}`}>
      <p className={`text-sm font-bold ${highlight ? 'text-slate-900' : 'text-slate-700'}`}>{value}</p>
      <p className="text-[9px] text-slate-400 uppercase tracking-wide mt-0.5">{label}</p>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function FiscalImpactModeler({ profileId = null }) {
  const [expandedId, setExpandedId]       = useState(null);
  const [filterTier, setFilterTier]       = useState('all');
  const [sortBy, setSortBy]               = useState('variance');

  const { data: result, isPending, refetch } = useQuery({
    queryKey: ['fiscal_impact_predictions', profileId],
    queryFn: async () => {
      const res = await base44.functions.invoke('fiscalImpactPredictor', {
        ...(profileId ? { profile_id: profileId } : {}),
      });
      return res.data;
    },
    staleTime: 10 * 60 * 1000, // 10 min
  });

  const predictions = result?.predictions || [];
  const summary     = result?.summary || null;

  const filtered = useMemo(() => {
    let list = filterTier === 'all' ? predictions : predictions.filter(p => p.risk_tier === filterTier);
    if (sortBy === 'variance') return [...list].sort((a, b) => b.potential_budget_variance_pct - a.potential_budget_variance_pct);
    if (sortBy === 'amount')   return [...list].sort((a, b) => Math.abs(b.fiscal_impact_amount) - Math.abs(a.fiscal_impact_amount));
    return list;
  }, [predictions, filterTier, sortBy]);

  const tiers = ['all', 'Critical', 'High', 'Moderate', 'Low', 'Minimal'];

  const handleToggle = (id) => setExpandedId(prev => prev === id ? null : id);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-amber-600" />
            Legislative Fiscal Impact Modeler
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Predictive budget variance analysis against {summary?.fiscal_year || 'current'} spending baseline
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isPending}
          className="gap-1.5 text-xs"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isPending ? 'animate-spin' : ''}`} />
          {isPending ? 'Modeling…' : 'Re-run Model'}
        </Button>
      </div>

      {/* KPIs */}
      {summary && <SummaryKPIs summary={summary} />}

      {/* Info bar */}
      {summary && (
        <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
          <Info className="h-3.5 w-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-blue-800 leading-relaxed">
            Variance = estimated bill fiscal impact ÷ affected department adopted budget.
            Confidence reflects availability of dollar amounts and department baseline data.
            Items with no dollar amount are estimated from text signals or impact level.
          </p>
        </div>
      )}

      {isPending && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-12 text-center">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-3 text-slate-400" />
          <p className="text-sm text-slate-600 font-medium">Running fiscal impact model…</p>
          <p className="text-xs text-slate-400 mt-1">Comparing bill amounts against budget baselines</p>
        </div>
      )}

      {!isPending && predictions.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
          <DollarSign className="h-8 w-8 mx-auto mb-3 text-slate-300" />
          <p className="text-sm font-semibold text-slate-600 mb-1">No fiscal signals found</p>
          <p className="text-xs text-slate-400">Add fiscal impact amounts or notes to tracked legislation items to enable modeling.</p>
        </div>
      )}

      {!isPending && predictions.length > 0 && (
        <>
          {/* Filters + sort */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500 mr-1">Risk Tier:</span>
            {tiers.map(tier => {
              const s = tier !== 'all' ? RISK_STYLES[tier] : null;
              const count = tier === 'all' ? predictions.length : predictions.filter(p => p.risk_tier === tier).length;
              return (
                <button
                  key={tier}
                  onClick={() => setFilterTier(tier)}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all ${
                    filterTier === tier
                      ? (s ? `${s.bg} ${s.text} ${s.border}` : 'bg-slate-800 text-white border-slate-800')
                      : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                  }`}
                >
                  {tier === 'all' ? `All (${count})` : `${tier} (${count})`}
                </button>
              );
            })}
            <div className="ml-auto flex items-center gap-1.5">
              <span className="text-[10px] text-slate-400">Sort:</span>
              {[['variance', 'By Variance'], ['amount', 'By Amount']].map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setSortBy(val)}
                  className={`text-[11px] px-2 py-0.5 rounded border transition-all ${sortBy === val ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500 border-slate-200'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Prediction list */}
          <div className="space-y-2">
            {filtered.map(p => (
              <PredictionRow
                key={p.legislation_item_id}
                prediction={p}
                expanded={expandedId}
                onToggle={handleToggle}
              />
            ))}
          </div>

          <p className="text-[10px] text-slate-400 text-center pt-2">
            Model run: {summary?.modeled_at ? new Date(summary.modeled_at).toLocaleString() : '—'} •
            {' '}{summary?.baseline_depts || 0} departments in baseline •
            Annual budget: {fmt(summary?.annual_budget)}
          </p>
        </>
      )}
    </div>
  );
}