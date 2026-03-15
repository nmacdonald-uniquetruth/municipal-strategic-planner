/**
 * ComplianceViolationBanner
 *
 * Reusable inline compliance warning component.
 * Place it at the top of any page that does financial calculations
 * (ProForma, TaxImpact, Scenarios, ModelSettings, etc.)
 *
 * Props:
 *   violations  — array from useComplianceValidation()
 *   compact     — boolean, show only count badge (default: false)
 *   filterSeverity — 'error' | 'warning' | 'info' | null (show all)
 *
 * Usage:
 *   import { useComplianceValidation } from '@/components/compliance/useComplianceValidation';
 *   import ComplianceViolationBanner from '@/components/compliance/ComplianceViolationBanner';
 *
 *   const { violations } = useComplianceValidation();
 *   <ComplianceViolationBanner violations={violations} />
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, XCircle, Info, ChevronDown, ChevronUp, ArrowRight, ShieldCheck } from 'lucide-react';
import { getViolationSummary } from './complianceConfig';

const SEVERITY = {
  error:   { icon: XCircle,       border: 'border-red-200',    bg: 'bg-red-50',     text: 'text-red-700',    badge: 'bg-red-100 text-red-800',    label: 'Compliance Error'   },
  warning: { icon: AlertTriangle, border: 'border-amber-200',  bg: 'bg-amber-50',   text: 'text-amber-700',  badge: 'bg-amber-100 text-amber-800', label: 'Warning'            },
  info:    { icon: Info,           border: 'border-blue-200',   bg: 'bg-blue-50/50', text: 'text-blue-700',   badge: 'bg-blue-100 text-blue-800',   label: 'Note'               },
};

function ViolationRow({ v }) {
  const s = SEVERITY[v.severity];
  const Icon = s.icon;
  return (
    <div className={`rounded-xl border ${s.border} ${s.bg} p-3`}>
      <div className="flex items-start gap-2.5">
        <Icon className={`h-3.5 w-3.5 flex-shrink-0 mt-0.5 ${s.text}`} />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
            <span className="text-[11px] font-bold text-slate-800">{v.rule}</span>
            <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold ${s.badge}`}>
              {s.label}
            </span>
            {v.legalReview && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                <AlertTriangle className="h-2.5 w-2.5" />
                Legal Review
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">{v.message}</p>
          {v.remediation && (
            <p className="text-[10px] text-slate-500 mt-1 italic">
              → {v.remediation}
            </p>
          )}
          {v.reference && (
            <p className="text-[9px] text-slate-400 mt-0.5">Ref: {v.reference}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ComplianceViolationBanner({ violations = [], compact = false, filterSeverity = null }) {
  const [expanded, setExpanded] = useState(false);
  const summary = getViolationSummary(violations);

  const displayed = filterSeverity
    ? violations.filter(v => v.severity === filterSeverity)
    : violations;

  if (displayed.length === 0) {
    if (compact) return null;
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-emerald-600 flex-shrink-0" />
        <p className="text-xs text-emerald-700 font-medium">No compliance issues detected for current settings.</p>
      </div>
    );
  }

  if (compact) {
    const errorCount = summary.errors.length;
    const warnCount = summary.warnings.length;
    return (
      <Link
        to="/ComplianceSettings"
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400"
        style={errorCount > 0
          ? { borderColor: '#fca5a5', background: '#fef2f2', color: '#b91c1c' }
          : { borderColor: '#fcd34d', background: '#fffbeb', color: '#92400e' }
        }
        title="View compliance issues"
      >
        {errorCount > 0
          ? <><XCircle className="h-3 w-3" />{errorCount} error{errorCount > 1 ? 's' : ''}</>
          : <><AlertTriangle className="h-3 w-3" />{warnCount} warning{warnCount > 1 ? 's' : ''}</>
        }
      </Link>
    );
  }

  // Summary bar colors
  const bannerBorder = summary.hasErrors ? 'border-red-200' : summary.hasWarnings ? 'border-amber-200' : 'border-blue-200';
  const bannerBg    = summary.hasErrors ? 'bg-red-50'      : summary.hasWarnings ? 'bg-amber-50'      : 'bg-blue-50/50';

  return (
    <div className={`rounded-2xl border ${bannerBorder} ${bannerBg} overflow-hidden`}>
      {/* Summary header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-4 py-3 hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-400"
      >
        <div className="flex items-center gap-3 flex-wrap">
          {summary.hasErrors && (
            <span className="flex items-center gap-1 text-[11px] font-bold text-red-700">
              <XCircle className="h-3.5 w-3.5" />
              {summary.errors.length} compliance error{summary.errors.length > 1 ? 's' : ''}
            </span>
          )}
          {summary.hasWarnings && (
            <span className="flex items-center gap-1 text-[11px] font-bold text-amber-700">
              <AlertTriangle className="h-3.5 w-3.5" />
              {summary.warnings.length} warning{summary.warnings.length > 1 ? 's' : ''}
            </span>
          )}
          {summary.info.length > 0 && (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-blue-600">
              <Info className="h-3.5 w-3.5" />
              {summary.info.length} note{summary.info.length > 1 ? 's' : ''}
            </span>
          )}
          {summary.legalReviewRequired.length > 0 && (
            <span className="text-[10px] text-amber-600 font-medium">
              · {summary.legalReviewRequired.length} require legal review
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link
            to="/ComplianceSettings"
            onClick={e => e.stopPropagation()}
            className="text-[10px] font-semibold underline text-slate-600 hover:text-slate-800 flex items-center gap-0.5"
          >
            View All
            <ArrowRight className="h-2.5 w-2.5" />
          </Link>
          {expanded
            ? <ChevronUp className="h-4 w-4 text-slate-500" />
            : <ChevronDown className="h-4 w-4 text-slate-500" />
          }
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-current border-opacity-10 px-4 pb-4 pt-3 space-y-2.5">
          {/* Errors first, then warnings, then info */}
          {[...summary.errors, ...summary.warnings, ...summary.info].map(v => (
            <ViolationRow key={v.id} v={v} />
          ))}
        </div>
      )}
    </div>
  );
}