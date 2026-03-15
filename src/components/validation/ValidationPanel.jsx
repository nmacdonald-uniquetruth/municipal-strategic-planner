/**
 * ValidationPanel — reusable UI for displaying validation results
 * Accepts violations array from useValidation() hook.
 */

import React, { useState } from 'react';
import { AlertTriangle, XCircle, Info, ShieldCheck, ChevronDown, ChevronUp, Scale, Gavel } from 'lucide-react';

const SEVERITY_CONFIG = {
  error: {
    icon: XCircle,
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-700',
    badgeBg: 'bg-red-100',
    badgeText: 'text-red-800',
    label: 'Error',
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    textColor: 'text-amber-700',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-800',
    label: 'Warning',
  },
  info: {
    icon: Info,
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-800',
    label: 'Info',
  },
};

function ViolationRow({ violation }) {
  const [expanded, setExpanded] = useState(false);
  const config = SEVERITY_CONFIG[violation.severity] || SEVERITY_CONFIG.info;
  const Icon = config.icon;

  return (
    <div className={`rounded-lg border ${config.borderColor} ${config.bgColor} overflow-hidden`}>
      <button
        className="w-full flex items-start gap-3 p-3 text-left hover:opacity-90 transition-opacity"
        onClick={() => setExpanded(e => !e)}
      >
        <Icon className={`h-4 w-4 flex-shrink-0 mt-0.5 ${config.textColor}`} />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-0.5">
            <span className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${config.badgeBg} ${config.badgeText}`}>
              {config.label}
            </span>
            <span className="text-[10px] text-slate-500">{violation.category?.replace(/_/g, ' ')}</span>
            {violation.context && (
              <span className="text-[10px] text-slate-400 italic">{violation.context}</span>
            )}
            {violation.legalReview && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded border border-orange-200">
                <Gavel className="h-2.5 w-2.5" />Legal Review
              </span>
            )}
          </div>
          <p className={`text-xs font-medium ${config.textColor}`}>{violation.message}</p>
        </div>
        {(violation.detail || violation.remediation || violation.reference) && (
          expanded ? <ChevronUp className="h-3.5 w-3.5 text-slate-400 flex-shrink-0 mt-1" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-400 flex-shrink-0 mt-1" />
        )}
      </button>

      {expanded && (
        <div className="px-10 pb-3 space-y-1.5 border-t border-current border-opacity-10 pt-2">
          {violation.detail && (
            <p className="text-[11px] text-slate-600">{violation.detail}</p>
          )}
          {violation.remediation && (
            <p className="text-[11px] text-slate-500 italic">→ {violation.remediation}</p>
          )}
          {violation.reference && (
            <p className="text-[10px] text-slate-400">Ref: {violation.reference}</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function ValidationPanel({ violations = [], title = 'Validation Results', compact = false }) {
  const [showAll, setShowAll] = useState(false);
  const errors   = violations.filter(v => v.severity === 'error');
  const warnings = violations.filter(v => v.severity === 'warning');
  const info     = violations.filter(v => v.severity === 'info');
  const legalCount = violations.filter(v => v.legalReview).length;

  if (violations.length === 0) {
    return (
      <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
        <ShieldCheck className="h-5 w-5 text-emerald-600 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-emerald-700">All checks passed</p>
          <p className="text-xs text-emerald-600">No financial, compliance, or scenario integrity issues found.</p>
        </div>
      </div>
    );
  }

  const displayed = showAll ? violations : violations.filter(v => v.severity !== 'info').slice(0, 8);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Scale className="h-4 w-4 text-slate-500" />
          <span className="text-sm font-bold text-slate-800">{title}</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {errors.length > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
              <XCircle className="h-3 w-3" />{errors.length} error{errors.length !== 1 ? 's' : ''}
            </span>
          )}
          {warnings.length > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
              <AlertTriangle className="h-3 w-3" />{warnings.length} warning{warnings.length !== 1 ? 's' : ''}
            </span>
          )}
          {info.length > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
              <Info className="h-3 w-3" />{info.length} note{info.length !== 1 ? 's' : ''}
            </span>
          )}
          {legalCount > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
              <Gavel className="h-3 w-3" />{legalCount} legal review
            </span>
          )}
        </div>
      </div>

      {/* Violations list */}
      <div className="p-3 space-y-2">
        {displayed.map((v, i) => <ViolationRow key={v.id || i} violation={v} />)}

        {violations.length > displayed.length && (
          <button
            onClick={() => setShowAll(true)}
            className="w-full text-center text-xs text-slate-500 hover:text-slate-700 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Show {violations.length - displayed.length} more…
          </button>
        )}
        {showAll && violations.length > 8 && (
          <button
            onClick={() => setShowAll(false)}
            className="w-full text-center text-xs text-slate-500 hover:text-slate-700 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Show less
          </button>
        )}
      </div>
    </div>
  );
}