import React from 'react';
import { computeGovernanceComplexity, TWIN_NODES } from './twinData';

export default function ComplexityScore() {
  const c = computeGovernanceComplexity(TWIN_NODES);

  const color = c.score >= 70 ? '#e05c3a' : c.score >= 45 ? '#F6C85F' : '#2A7F7F';
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (c.score / 100) * circumference;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-4">Governance Complexity Score</p>
      <div className="flex items-center gap-6">
        <div className="relative flex-shrink-0">
          <svg width="96" height="96" viewBox="0 0 96 96">
            <circle cx="48" cy="48" r="40" fill="none" stroke="#f1f5f9" strokeWidth="8" />
            <circle cx="48" cy="48" r="40" fill="none" stroke={color} strokeWidth="8"
              strokeDasharray={circumference} strokeDashoffset={offset}
              strokeLinecap="round" transform="rotate(-90 48 48)"
              style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
            <text x="48" y="48" textAnchor="middle" dy="0.4em" fontSize="18" fontWeight="700" fill={color}>{c.score}</text>
          </svg>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs flex-1">
          {[
            ['Departments', c.depts],
            ['Committees', c.committees],
            ['Contracted Services', c.agencies],
            ['Schools', c.schools],
            ['Governance Bodies', c.governance],
            ['Reporting Layers', c.layers],
          ].map(([label, val]) => (
            <div key={label} className="flex justify-between items-center gap-2">
              <span className="text-slate-500">{label}</span>
              <span className="font-bold text-slate-800">{val}</span>
            </div>
          ))}
        </div>
      </div>
      <p className="text-[10px] text-slate-400 mt-3 leading-relaxed">
        Score 0–100: higher = more complex governance structure. Machias at {c.score} reflects a mid-complexity regional service hub appropriate for its county-seat role.
      </p>
    </div>
  );
}