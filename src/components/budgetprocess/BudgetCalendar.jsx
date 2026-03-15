/**
 * BudgetCalendar — Phase timeline with owners, deadlines, status, and dependencies
 */
import React from 'react';
import { PHASES, PHASE_ORDER } from './budgetProcessEngine';
import { CheckCircle, Circle, Clock, AlertTriangle, ChevronRight, Lock } from 'lucide-react';

const STATUS_CONFIG = {
  not_started: { icon: Circle,        color: 'text-slate-400', bg: 'bg-slate-50',  border: 'border-slate-200', label: 'Not Started' },
  in_progress: { icon: Clock,         color: 'text-blue-600',  bg: 'bg-blue-50',   border: 'border-blue-200',  label: 'In Progress' },
  complete:    { icon: CheckCircle,   color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', label: 'Complete' },
  blocked:     { icon: AlertTriangle, color: 'text-red-600',   bg: 'bg-red-50',    border: 'border-red-200',   label: 'Blocked' },
  skipped:     { icon: Lock,          color: 'text-slate-300', bg: 'bg-slate-50',  border: 'border-slate-100', label: 'Skipped' },
};

function PhaseRow({ phase, phaseData, onUpdate, isActive, index }) {
  const cfg = STATUS_CONFIG[phaseData?.status || 'not_started'];
  const StatusIcon = cfg.icon;
  const today = new Date();
  const deadline = phaseData?.deadline ? new Date(phaseData.deadline) : null;
  const isPast = deadline && deadline < today && phaseData?.status !== 'complete';

  return (
    <div className={`rounded-xl border p-3 transition-all ${isActive ? 'ring-2 ring-slate-900 ' + cfg.border : cfg.border} ${cfg.bg}`}>
      <div className="flex items-start gap-3">
        {/* Step number */}
        <div className={`h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold mt-0.5 ${isActive ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-400'}`}>
          {index + 1}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`text-xs font-bold ${isActive ? 'text-slate-900' : 'text-slate-700'}`}>{phase.label}</p>
            <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
              {cfg.label}
            </span>
            {isPast && <span className="text-[9px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full border border-red-200">Past Deadline</span>}
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">{phase.description}</p>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <span className="text-[9px] text-slate-500">Owner: <span className="font-semibold text-slate-700">{phaseData?.owner || phase.owner}</span></span>
            {phaseData?.deadline && (
              <span className={`text-[9px] ${isPast ? 'text-red-600 font-semibold' : 'text-slate-500'}`}>
                Deadline: {phaseData.deadline}
              </span>
            )}
            {phaseData?.completed_date && (
              <span className="text-[9px] text-emerald-600">Completed: {phaseData.completed_date}</span>
            )}
          </div>
        </div>

        {/* Status selector */}
        <select
          value={phaseData?.status || 'not_started'}
          onChange={e => onUpdate(phase.id, { status: e.target.value })}
          className="text-[10px] border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-slate-400 bg-white flex-shrink-0"
        >
          {Object.entries(STATUS_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      {/* Deadline editor */}
      {onUpdate && (
        <div className="mt-2 flex gap-2 items-center pl-9">
          <div className="flex items-center gap-1.5">
            <label className="text-[9px] text-slate-400 uppercase tracking-wider">Deadline</label>
            <input type="date" value={phaseData?.deadline || ''}
              onChange={e => onUpdate(phase.id, { deadline: e.target.value })}
              className="text-[10px] border border-slate-200 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-slate-400 bg-white" />
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-[9px] text-slate-400 uppercase tracking-wider">Owner</label>
            <input value={phaseData?.owner || phase.owner}
              onChange={e => onUpdate(phase.id, { owner: e.target.value })}
              className="text-[10px] border border-slate-200 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-slate-400 bg-white w-40" />
          </div>
          {phaseData?.status === 'complete' && (
            <div className="flex items-center gap-1.5">
              <label className="text-[9px] text-slate-400 uppercase tracking-wider">Completed</label>
              <input type="date" value={phaseData?.completed_date || ''}
                onChange={e => onUpdate(phase.id, { completed_date: e.target.value })}
                className="text-[10px] border border-slate-200 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-slate-400 bg-white" />
            </div>
          )}
        </div>
      )}
      {phaseData?.notes !== undefined && (
        <div className="mt-1.5 pl-9">
          <input value={phaseData?.notes || ''} placeholder="Phase notes…"
            onChange={e => onUpdate(phase.id, { notes: e.target.value })}
            className="w-full text-[10px] border border-slate-100 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-slate-300 bg-white/70" />
        </div>
      )}
    </div>
  );
}

export default function BudgetCalendar({ phases, currentPhase, onUpdatePhase, onSetCurrentPhase }) {
  const phaseMap = {};
  phases.forEach(p => { phaseMap[p.phase_id] = p; });

  return (
    <div className="space-y-2">
      {PHASES.map((phase, i) => (
        <div key={phase.id} className="relative">
          {i < PHASES.length - 1 && (
            <div className="absolute left-[22px] top-full h-2 w-0.5 bg-slate-200 z-10" />
          )}
          <PhaseRow
            phase={phase}
            phaseData={phaseMap[phase.id] || { status: 'not_started', owner: phase.owner }}
            onUpdate={(id, updates) => onUpdatePhase(id, updates)}
            isActive={currentPhase === phase.id}
            index={i}
          />
        </div>
      ))}
      <div className="pt-2 flex items-center justify-between">
        <p className="text-[10px] text-slate-400">Click a phase to set as active, update owner/deadline, and mark status.</p>
        <div className="flex gap-1">
          {PHASE_ORDER.map(id => {
            const p = phaseMap[id];
            const color = p?.status === 'complete' ? 'bg-emerald-400' : p?.status === 'in_progress' ? 'bg-blue-400' : p?.status === 'blocked' ? 'bg-red-400' : 'bg-slate-200';
            return <div key={id} className={`h-2 w-4 rounded-sm ${color}`} title={id} />;
          })}
        </div>
      </div>
    </div>
  );
}