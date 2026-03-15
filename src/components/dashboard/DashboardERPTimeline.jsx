/**
 * DashboardERPTimeline
 * Horizontal milestone timeline for ERP implementation phases.
 * Each node is keyboard-focusable with a tooltip and a drill-down link.
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useModel } from '@/components/machias/ModelContext';
import { CheckCircle2, Circle, Clock, AlertTriangle, ArrowRight } from 'lucide-react';

const PHASES = [
  {
    id: 'analysis',
    label: 'COA Analysis',
    phase: 'Q1–Q2 FY27',
    desc: 'Chart of Accounts review and gap analysis. Prerequisite for RFP.',
    status: 'complete',
    link: '/ERPRoadmap',
  },
  {
    id: 'rfp',
    label: 'Vendor RFP',
    phase: 'Q3 FY27',
    desc: 'Issue RFP, evaluate responses. Shortlist 2–3 vendors per Maine procurement rules.',
    status: 'in_progress',
    link: '/ERPRoadmap',
  },
  {
    id: 'vote',
    label: 'Town Meeting Vote',
    phase: 'Q4 FY27',
    desc: 'Appropriation vote required. Budget item: $47,000 Y1 implementation + $5,000/yr.',
    status: 'upcoming',
    link: '/ModelSettings',
  },
  {
    id: 'coa_rebuild',
    label: 'COA Rebuild',
    phase: 'Q1 FY28',
    desc: 'Migrate and restructure Chart of Accounts in new ERP. Parallel run with TRIO.',
    status: 'upcoming',
    link: '/ERPRoadmap',
  },
  {
    id: 'training',
    label: 'Staff Training',
    phase: 'Q2 FY28',
    desc: 'All finance staff trained on new system. Admin 403(b) payroll module live.',
    status: 'upcoming',
    link: '/Positions',
  },
  {
    id: 'golive',
    label: 'Go-Live',
    phase: 'Q3–Q4 FY28',
    desc: 'Full cutover from TRIO. Generates $21,000/yr in efficiency value.',
    status: 'upcoming',
    link: '/ERPRoadmap',
  },
];

const STATUS_STYLES = {
  complete:    { dot: 'bg-emerald-500 border-emerald-600', label: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2, line: 'bg-emerald-400' },
  in_progress: { dot: 'bg-indigo-500 border-indigo-600',  label: 'bg-indigo-100 text-indigo-700',   icon: Clock,         line: 'bg-indigo-300' },
  upcoming:    { dot: 'bg-slate-200 border-slate-300',     label: 'bg-slate-100 text-slate-500',     icon: Circle,        line: 'bg-slate-200'  },
  blocked:     { dot: 'bg-amber-400 border-amber-500',     label: 'bg-amber-100 text-amber-700',     icon: AlertTriangle,  line: 'bg-amber-200'  },
};

function MilestoneNode({ phase, isLast }) {
  const [showTip, setShowTip] = useState(false);
  const s = STATUS_STYLES[phase.status];
  const StatusIcon = s.icon;

  return (
    <div className="flex items-start gap-0 flex-1 min-w-0">
      {/* Node + connector */}
      <div className="flex flex-col items-center flex-shrink-0">
        <button
          onMouseEnter={() => setShowTip(true)}
          onMouseLeave={() => setShowTip(false)}
          onFocus={() => setShowTip(true)}
          onBlur={() => setShowTip(false)}
          className={`relative w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-indigo-400 ${s.dot}`}
          aria-label={`Milestone: ${phase.label} — ${phase.phase}`}
          tabIndex={0}
        >
          <StatusIcon className="h-4 w-4 text-white" />
          {/* Tooltip */}
          {showTip && (
            <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 rounded-xl border border-slate-200 bg-white shadow-xl p-3 text-[10px] text-slate-700 leading-relaxed pointer-events-none text-left">
              <p className="font-bold text-slate-800 mb-1">{phase.label}</p>
              <p>{phase.desc}</p>
              <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-white border-b border-r border-slate-200 rotate-45" />
            </div>
          )}
        </button>
        {/* Label below */}
        <div className="mt-2 text-center px-1 w-full">
          <p className="text-[10px] font-bold text-slate-800 leading-tight truncate">{phase.label}</p>
          <p className="text-[9px] text-slate-400 mt-0.5">{phase.phase}</p>
          <span className={`inline-flex mt-1 px-1.5 py-0.5 rounded text-[9px] font-semibold ${s.label}`}>
            {phase.status.replace('_', ' ')}
          </span>
        </div>
      </div>
      {/* Connector line */}
      {!isLast && (
        <div className="flex-1 h-0.5 mt-4 mx-1" style={{ background: '#E7D0B1' }} />
      )}
    </div>
  );
}

export default function DashboardERPTimeline() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-bold text-slate-800">ERP Implementation Timeline</h3>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Hover milestones for details · Click nodes to drill down
          </p>
        </div>
        <Link
          to="/ERPRoadmap"
          className="inline-flex items-center gap-1 text-[11px] font-semibold hover:underline focus:outline-none focus:ring-1 focus:ring-indigo-400 rounded px-1"
          style={{ color: '#344A60' }}
          title="View full ERP implementation roadmap"
        >
          Full Roadmap
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Desktop: horizontal row */}
      <div className="hidden sm:flex items-start w-full overflow-x-auto pb-2">
        {PHASES.map((phase, i) => (
          <MilestoneNode key={phase.id} phase={phase} isLast={i === PHASES.length - 1} />
        ))}
      </div>

      {/* Mobile: vertical stack */}
      <div className="sm:hidden space-y-3">
        {PHASES.map((phase) => {
          const s = STATUS_STYLES[phase.status];
          const StatusIcon = s.icon;
          return (
            <Link
              key={phase.id}
              to={phase.link}
              className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${s.dot}`}>
                <StatusIcon className="h-3.5 w-3.5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-xs font-bold text-slate-800">{phase.label}</p>
                  <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-semibold ${s.label}`}>
                    {phase.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">{phase.phase}</p>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{phase.desc}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-slate-100">
        {Object.entries(STATUS_STYLES).map(([key, s]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${s.dot}`} />
            <span className="text-[9px] text-slate-500 capitalize">{key.replace('_', ' ')}</span>
          </div>
        ))}
      </div>
    </div>
  );
}