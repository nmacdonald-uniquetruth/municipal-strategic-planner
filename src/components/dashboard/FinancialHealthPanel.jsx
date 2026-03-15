import React from 'react';
import { TrendingUp, TrendingDown, Minus, DollarSign, Shield, Users, BarChart2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const fmt = (n) => n == null ? '—' : `$${Math.abs(Math.round(n)).toLocaleString()}`;

function HealthIndicator({ label, value, status, detail, icon: Icon, to }) {
  const STATUS = {
    good:    { bg: 'bg-emerald-50',  border: 'border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700', label: 'On Track',  Icon: TrendingUp },
    caution: { bg: 'bg-amber-50',    border: 'border-amber-200',   text: 'text-amber-700',   badge: 'bg-amber-100 text-amber-700',   label: 'Caution',   Icon: Minus },
    concern: { bg: 'bg-red-50',      border: 'border-red-200',     text: 'text-red-700',     badge: 'bg-red-100 text-red-700',       label: 'Attention', Icon: TrendingDown },
  };
  const s = STATUS[status] || STATUS.caution;
  const TrendIcon = s.Icon;

  const inner = (
    <div className={`rounded-xl border p-4 flex flex-col gap-2 h-full transition-all hover:shadow-md ${s.bg} ${s.border}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${s.text}`} />
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-600">{label}</p>
        </div>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${s.badge}`}>
          <TrendIcon className="h-3 w-3" />
          {s.label}
        </span>
      </div>
      <p className={`text-xl font-bold tabular-nums ${s.text}`}>{value}</p>
      <p className="text-[11px] text-slate-600 leading-snug">{detail}</p>
    </div>
  );

  return to ? <Link to={to} className="block">{inner}</Link> : inner;
}

export default function FinancialHealthPanel({ projections, settings }) {
  if (!projections || projections.length === 0) return null;

  const y1 = projections[0];
  const y5 = projections[projections.length - 1];
  const cumNet = projections.reduce((s, y) => s + (y.net || 0), 0);

  // Tax / mill rate impact
  const millImpact = y1?.gf?.millRateImpact ?? 0;
  const taxStatus = millImpact <= 0 ? 'good' : millImpact < 0.2 ? 'caution' : 'concern';
  const taxValue = millImpact <= 0 ? 'No increase' : `+${millImpact.toFixed(3)} mills`;
  const taxDetail = millImpact <= 0
    ? 'Restructuring cash offsets fully cover Year 1 costs — no tax rate increase projected.'
    : `Year 1 mill rate may increase by ${millImpact.toFixed(3)} (approx. $${(millImpact * (settings.total_assessed_value / 1000 / 1000)).toFixed(0)}K levy impact).`;

  // Fund balance health
  const gfBalance = settings.gf_undesignated_balance || 0;
  const levy = settings.annual_tax_levy || 1;
  const fundPct = gfBalance / levy;
  const fundStatus = fundPct >= 0.17 ? 'good' : fundPct >= 0.08 ? 'caution' : 'concern';
  const fundDetail = `${(fundPct * 100).toFixed(0)}% of annual levy. GFOA recommends 17–25%.`;

  // 5-year net benefit
  const netStatus = cumNet > 0 ? 'good' : cumNet > -50000 ? 'caution' : 'concern';

  // Regional revenue
  const y1Regional = y1?.value?.regionalServices ?? 0;
  const y5Regional = y5?.value?.regionalServices ?? 0;
  const regStatus = y1Regional > 0 ? 'good' : 'caution';

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-slate-700">Town Financial Health</h2>
        <Link to="/TaxImpact" className="text-[11px] text-slate-500 hover:text-slate-800 underline">
          Full Tax Impact Analysis →
        </Link>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <HealthIndicator
          label="Tax Rate Impact"
          value={taxValue}
          status={taxStatus}
          detail={taxDetail}
          icon={DollarSign}
          to="/TaxImpact"
        />
        <HealthIndicator
          label="Fund Balance"
          value={fmt(gfBalance)}
          status={fundStatus}
          detail={fundDetail}
          icon={Shield}
          to="/ModelSettings"
        />
        <HealthIndicator
          label="5-Year Net Benefit"
          value={cumNet >= 0 ? `+${fmt(cumNet)}` : `-${fmt(Math.abs(cumNet))}`}
          status={netStatus}
          detail="Cumulative net value created by restructuring over the full 5-year planning horizon."
          icon={BarChart2}
          to="/ProForma"
        />
        <HealthIndicator
          label="Regional Revenue"
          value={y1Regional > 0 ? fmt(y1Regional) : 'Pending'}
          status={regStatus}
          detail={y1Regional > 0
            ? `Year 1: ${fmt(y1Regional)} · Year 5: ${fmt(y5Regional)} from interlocal service contracts.`
            : 'Interlocal contracts not yet in place. See Regional Services for outreach plan.'}
          icon={Users}
          to="/RegionalServices"
        />
      </div>
    </div>
  );
}