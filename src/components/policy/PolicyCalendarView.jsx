/**
 * PolicyCalendarView — Timeline/calendar of legislative events
 */
import React, { useMemo, useState } from 'react';
import { Calendar, AlertTriangle, Clock } from 'lucide-react';
import { EVENT_TYPE_LABELS, EVENT_TYPE_COLORS, fmtDate, daysUntil } from './policyEngine';

export default function PolicyCalendarView({ events, items, onAdd }) {
  const [filter, setFilter] = useState('all');

  const itemMap = useMemo(() => {
    const m = {};
    (items || []).forEach(i => { m[i.id] = i; });
    return m;
  }, [items]);

  const sorted = useMemo(() => {
    const now = new Date();
    return [...events]
      .filter(e => {
        if (filter !== 'all' && e.event_type !== filter) return false;
        return true;
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [events, filter]);

  const past = sorted.filter(e => new Date(e.date) < new Date());
  const upcoming = sorted.filter(e => new Date(e.date) >= new Date());

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex flex-wrap gap-1.5">
          {['all', ...Object.keys(EVENT_TYPE_LABELS)].map(type => (
            <button key={type} onClick={() => setFilter(type)}
              className={`text-[10px] px-2.5 py-1 rounded-full border font-semibold transition-colors ${filter === type ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'}`}>
              {type === 'all' ? 'All Events' : EVENT_TYPE_LABELS[type]}
            </button>
          ))}
        </div>
        {onAdd && (
          <button onClick={onAdd} className="text-xs bg-slate-900 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-slate-700 transition-colors">
            + Add Event
          </button>
        )}
      </div>

      {/* Upcoming */}
      <div>
        <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Upcoming</p>
        {upcoming.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-4 text-center">No upcoming events.</p>
        ) : (
          <div className="space-y-2">
            {upcoming.map(ev => <EventRow key={ev.id} ev={ev} itemMap={itemMap} />)}
          </div>
        )}
      </div>

      {/* Past */}
      {past.length > 0 && (
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Past</p>
          <div className="space-y-2 opacity-60">
            {past.slice(-5).reverse().map(ev => <EventRow key={ev.id} ev={ev} itemMap={itemMap} past />)}
          </div>
        </div>
      )}
    </div>
  );
}

function EventRow({ ev, itemMap, past = false }) {
  const days = daysUntil(ev.date);
  const tc = EVENT_TYPE_COLORS[ev.event_type] || EVENT_TYPE_COLORS.custom;
  const linkedItem = ev.legislation_id ? itemMap[ev.legislation_id] : null;
  const isUrgent = !past && days !== null && days >= 0 && days <= 7;

  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border bg-white transition-shadow ${isUrgent ? 'border-red-300 shadow-sm shadow-red-50' : 'border-slate-200'}`}>
      {/* Date block */}
      <div className={`text-center min-w-[52px] rounded-lg border px-2 py-2 flex-shrink-0 ${isUrgent ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
        <p className={`text-lg font-bold leading-none ${isUrgent ? 'text-red-700' : 'text-slate-700'}`}>
          {ev.date ? new Date(ev.date).getDate() : '—'}
        </p>
        <p className={`text-[9px] font-semibold uppercase ${isUrgent ? 'text-red-500' : 'text-slate-400'}`}>
          {ev.date ? new Date(ev.date).toLocaleDateString('en-US', { month: 'short' }) : ''}
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap gap-1.5 mb-1">
          <span className={`text-[9px] px-1.5 py-0.5 rounded border font-semibold ${tc.bg} ${tc.text} ${tc.border}`}>
            {EVENT_TYPE_LABELS[ev.event_type]}
          </span>
          {ev.jurisdiction && (
            <span className="text-[9px] text-slate-500">{ev.jurisdiction}</span>
          )}
          {ev.priority === 'critical' && (
            <span className="text-[9px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">Critical</span>
          )}
        </div>
        <p className="text-xs font-bold text-slate-900">{ev.title}</p>
        {ev.description && <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{ev.description}</p>}
        {linkedItem && (
          <p className="text-[9px] text-blue-600 mt-1 font-medium">→ {linkedItem.title}</p>
        )}
        {ev.location && <p className="text-[9px] text-slate-400 mt-0.5">📍 {ev.location}</p>}
      </div>

      {/* Days countdown */}
      {!past && days !== null && days >= 0 && (
        <div className={`text-right flex-shrink-0 ${isUrgent ? 'text-red-700' : 'text-slate-400'}`}>
          <p className="text-sm font-bold">{days}</p>
          <p className="text-[9px]">days</p>
        </div>
      )}
    </div>
  );
}