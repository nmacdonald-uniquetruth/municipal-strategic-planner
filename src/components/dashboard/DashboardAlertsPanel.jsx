/**
 * DashboardAlertsPanel
 * Real-time anomaly and alert feed derived from model projections.
 * Each alert links to the relevant page for remediation.
 */
import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Info, CheckCircle2, ArrowRight, ShieldAlert } from 'lucide-react';

function buildAlerts(projections, settings) {
  const alerts = [];

  if (!projections || projections.length === 0) {
    alerts.push({
      id: 'no-data',
      level: 'info',
      title: 'No projection data',
      detail: 'Run the financial model to generate alerts.',
      link: '/ModelSettings',
      cta: 'Open Model Settings',
    });
    return alerts;
  }

  const y1 = projections[0];

  // Levy pressure
  if ((y1?.levyPressure ?? 0) > 0) {
    alerts.push({
      id: 'levy',
      level: 'warn',
      title: 'Year 1 Levy Pressure Detected',
      detail: `+$${Math.round(y1.levyPressure).toLocaleString()} above neutral. May require fund draw or deferral.`,
      link: '/TaxImpact',
      cta: 'Review Tax Impact',
    });
  }

  // Fund draw
  if ((y1?.fundDraw ?? 0) > 0) {
    alerts.push({
      id: 'fund-draw',
      level: 'warn',
      title: 'Undesignated Fund Draw Required',
      detail: `$${Math.round(y1.fundDraw).toLocaleString()} draw needed in Year 1. Verify fund balance sufficiency.`,
      link: '/EnterpriseFunds',
      cta: 'Check Fund Balances',
    });
  }

  // Negative 5-year cumulative
  const cumulative = projections.reduce((s, y) => s + (y.netImpact ?? 0), 0);
  if (cumulative < 0) {
    alerts.push({
      id: 'negative-cumulative',
      level: 'critical',
      title: '5-Year Net Impact Negative',
      detail: `Cumulative net: –$${Math.abs(Math.round(cumulative)).toLocaleString()}. Restructuring costs outpace returns over 5 years.`,
      link: '/SensitivityAnalysis',
      cta: 'Run Sensitivity Analysis',
    });
  }

  // ERP over budget
  const erpBudget = (settings?.erp_y1_cost ?? 47000) + (settings?.erp_ongoing_cost ?? 5000) * 4;
  if ((settings?.erp_y1_cost ?? 47000) > erpBudget * 0.9) {
    alerts.push({
      id: 'erp-budget',
      level: 'info',
      title: 'ERP Y1 Cost Near Budget Ceiling',
      detail: 'Implementation cost is ≥90% of authorized budget. Monitor closely.',
      link: '/ERPRoadmap',
      cta: 'ERP Roadmap',
    });
  }

  // Compliance items open
  alerts.push({
    id: 'compliance',
    level: 'warn',
    title: '10 Compliance Items Require Legal Review',
    detail: 'GASB basis, Maine interlocal authority, local ordinance citations — none are enforced until cleared.',
    link: '/ComplianceSettings',
    cta: 'Open Audit Log',
  });

  // Healthy signal
  if (cumulative >= 0) {
    alerts.push({
      id: 'healthy',
      level: 'ok',
      title: 'Restructuring Trajectory On Track',
      detail: 'Cumulative 5-year net impact is positive under current assumptions.',
      link: '/ProForma',
      cta: 'View Pro Forma',
    });
  }

  return alerts;
}

const LEVEL_CONFIG = {
  critical: { border: 'border-red-200',   bg: 'bg-red-50/60',    icon: ShieldAlert,     iconColor: 'text-red-500',    badge: 'bg-red-100 text-red-700' },
  warn:     { border: 'border-amber-200',  bg: 'bg-amber-50/40',  icon: AlertTriangle,   iconColor: 'text-amber-500',  badge: 'bg-amber-100 text-amber-700' },
  info:     { border: 'border-blue-200',   bg: 'bg-blue-50/30',   icon: Info,            iconColor: 'text-blue-500',   badge: 'bg-blue-100 text-blue-700' },
  ok:       { border: 'border-emerald-200',bg: 'bg-emerald-50/30',icon: CheckCircle2,    iconColor: 'text-emerald-500',badge: 'bg-emerald-100 text-emerald-700' },
};

export default function DashboardAlertsPanel({ projections, settings }) {
  const alerts = useMemo(() => buildAlerts(projections, settings), [projections, settings]);

  const critCount = alerts.filter(a => a.level === 'critical' || a.level === 'warn').length;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Alerts &amp; Anomalies</h3>
          <p className="text-[10px] text-slate-500 mt-0.5">Live signals from model &amp; compliance</p>
        </div>
        {critCount > 0 && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
            <AlertTriangle className="h-2.5 w-2.5" />
            {critCount} action{critCount > 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[420px] pr-0.5">
        {alerts.map(alert => {
          const c = LEVEL_CONFIG[alert.level];
          const AlertIcon = c.icon;
          return (
            <div
              key={alert.id}
              className={`rounded-xl border ${c.border} ${c.bg} p-3`}
              role="alert"
            >
              <div className="flex items-start gap-2.5">
                <AlertIcon className={`h-3.5 w-3.5 flex-shrink-0 mt-0.5 ${c.iconColor}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-1.5 flex-wrap">
                    <p className="text-[11px] font-bold text-slate-800 leading-tight">{alert.title}</p>
                    <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-semibold ${c.badge} flex-shrink-0`}>
                      {alert.level.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-600 mt-1 leading-relaxed">{alert.detail}</p>
                  {alert.link && (
                    <Link
                      to={alert.link}
                      className="inline-flex items-center gap-0.5 mt-1.5 text-[10px] font-semibold hover:underline focus:outline-none focus:ring-1 focus:ring-indigo-400 rounded"
                      style={{ color: '#344A60' }}
                    >
                      {alert.cta}
                      <ArrowRight className="h-2.5 w-2.5" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}