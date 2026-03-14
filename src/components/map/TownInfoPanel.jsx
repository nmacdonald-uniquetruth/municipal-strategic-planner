import React, { useState } from 'react';
import { X, ChevronDown, ChevronRight, ExternalLink, Anchor, Fish, Wifi, Home, Briefcase, MapPin } from 'lucide-react';

function fmt(n) {
  if (!n && n !== 0) return '—';
  if (typeof n === 'number') return n.toLocaleString();
  return n;
}

function fmtCurrency(n) {
  if (!n) return '—';
  return '$' + n.toLocaleString();
}

function Section({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-slate-100">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 transition-colors">
        <span className="text-xs font-bold text-slate-700">{title}</span>
        {open ? <ChevronDown className="h-3.5 w-3.5 text-slate-400" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-400" />}
      </button>
      {open && <div className="px-4 pb-3">{children}</div>}
    </div>
  );
}

function Row({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex justify-between gap-2 py-1 border-b border-slate-50 last:border-0">
      <span className="text-[10px] text-slate-500 flex-shrink-0">{label}</span>
      <span className="text-[11px] font-medium text-slate-800 text-right">{value}</span>
    </div>
  );
}

function TagList({ items }) {
  if (!items || !items.length) return <span className="text-[11px] text-slate-400">—</span>;
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {items.map((item, i) => (
        <span key={i} className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">{item}</span>
      ))}
    </div>
  );
}

export default function TownInfoPanel({ profile, color, onClose }) {
  if (!profile) return null;

  const hasWaterfront = profile.working_waterfront;
  const hasFishing = profile.commercial_fishing_presence;

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200 overflow-hidden shadow-lg">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-4 text-white relative" style={{ background: color || '#1a3a5c' }}>
        <button onClick={onClose}
          className="absolute top-3 right-3 p-1 rounded hover:bg-white/20 transition-colors">
          <X className="h-4 w-4" />
        </button>
        <div className="pr-8">
          <h2 className="text-lg font-bold">{profile.town_name}</h2>
          <p className="text-[11px] opacity-80">{profile.county}</p>
          <div className="flex gap-2 mt-2 flex-wrap">
            {hasWaterfront && (
              <span className="flex items-center gap-1 text-[10px] bg-white/20 px-2 py-0.5 rounded-full">
                <Anchor className="h-2.5 w-2.5" /> Working Waterfront
              </span>
            )}
            {hasFishing && (
              <span className="flex items-center gap-1 text-[10px] bg-white/20 px-2 py-0.5 rounded-full">
                <Fish className="h-2.5 w-2.5" /> Commercial Fishing
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Key stats */}
      <div className="flex-shrink-0 grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
        <div className="p-3 text-center">
          <p className="text-base font-bold text-slate-900">{fmt(profile.population)}</p>
          <p className="text-[9px] text-slate-500">Population</p>
        </div>
        <div className="p-3 text-center">
          <p className="text-base font-bold text-emerald-700">{fmtCurrency(profile.median_household_income)}</p>
          <p className="text-[9px] text-slate-500">Median HHI</p>
        </div>
        <div className="p-3 text-center">
          <p className="text-base font-bold text-slate-700">{fmt(profile.households)}</p>
          <p className="text-[9px] text-slate-500">Households</p>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <Section title="Demographics & Economy" defaultOpen={true}>
          <Row label="Population" value={fmt(profile.population)} />
          <Row label="Median Age" value={profile.median_age} />
          <Row label="Households" value={fmt(profile.households)} />
          <Row label="Median Household Income" value={fmtCurrency(profile.median_household_income)} />
          <Row label="Labor Force" value={fmt(profile.labor_force)} />
          <Row label="Employment" value={fmt(profile.employment)} />
        </Section>

        <Section title="Major Employers" defaultOpen={true}>
          <div className="space-y-1 mt-1">
            {(profile.major_employers || []).map((e, i) => (
              <div key={i} className="flex items-start gap-1.5 text-[11px] text-slate-700">
                <Briefcase className="h-3 w-3 text-slate-400 flex-shrink-0 mt-0.5" />
                {e}
              </div>
            ))}
          </div>
        </Section>

        <Section title="Key Industries">
          <TagList items={profile.industry_sectors} />
        </Section>

        <Section title="Housing">
          <Row label="Housing Units" value={fmt(profile.housing_units)} />
          <Row label="Occupancy" value={profile.housing_occupancy} />
          <Row label="Median Home Value" value={fmtCurrency(profile.median_home_value)} />
        </Section>

        <Section title="Community Assets">
          <div className="space-y-1 mt-1">
            {(profile.community_assets || []).map((a, i) => (
              <div key={i} className="flex items-start gap-1.5 text-[11px] text-slate-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 flex-shrink-0 mt-1.5" />
                {a}
              </div>
            ))}
          </div>
        </Section>

        <Section title="Tourism & Recreation">
          <div className="space-y-1 mt-1">
            {(profile.tourism_assets || []).map((a, i) => (
              <div key={i} className="text-[11px] text-slate-700 py-0.5 border-b border-slate-50 last:border-0">{a}</div>
            ))}
          </div>
        </Section>

        <Section title="Planning Priorities">
          <div className="space-y-1 mt-1">
            {(profile.planning_priorities || []).map((p, i) => (
              <div key={i} className="flex items-start gap-1.5 text-[11px] text-slate-700">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                {p}
              </div>
            ))}
          </div>
        </Section>

        <Section title="Challenges">
          <div className="space-y-1 mt-1">
            {(profile.community_challenges || []).map((c, i) => (
              <div key={i} className="flex items-start gap-1.5 text-[11px] text-slate-700">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 flex-shrink-0 mt-1.5" />
                {c}
              </div>
            ))}
          </div>
        </Section>

        <Section title="Infrastructure & Access">
          <Row label="Transportation" value={profile.transportation_access} />
          <Row label="Broadband" value={profile.broadband_availability} />
          <Row label="Water Access" value={profile.water_access} />
          <Row label="Healthcare" value={profile.healthcare_access} />
          <Row label="School System" value={profile.school_system} />
        </Section>

        <Section title="Economic Opportunities">
          <div className="space-y-1 mt-1">
            {(profile.economic_development_opportunities || []).map((o, i) => (
              <div key={i} className="flex items-start gap-1.5 text-[11px] text-slate-700">
                <span className="h-1.5 w-1.5 rounded-full bg-teal-500 flex-shrink-0 mt-1.5" />
                {o}
              </div>
            ))}
          </div>
        </Section>

        <Section title="Regional Connections">
          <TagList items={profile.regional_connections} />
        </Section>

        {profile.note && (
          <div className="mx-4 my-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-800">
            <strong>Note:</strong> {profile.note}
          </div>
        )}

        {/* External links */}
        <div className="px-4 py-3 border-t border-slate-100 space-y-2">
          {profile.profile_url && (
            <a href={profile.profile_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[11px] text-blue-600 hover:underline">
              <ExternalLink className="h-3 w-3" />
              Sunrise County Community Profile
            </a>
          )}
          {profile.planning_map_url && (
            <a href={profile.planning_map_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[11px] text-blue-600 hover:underline">
              <MapPin className="h-3 w-3" />
              Interactive Planning Map
            </a>
          )}
        </div>
      </div>
    </div>
  );
}