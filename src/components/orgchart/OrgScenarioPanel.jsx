import React from 'react';
import { CheckCircle2, Circle, Layers } from 'lucide-react';

const FINANCE_OPTIONS = [
  { value: 'controller_sa', label: 'Controller + Staff Accountant' },
  { value: 'controller_2sa', label: 'Controller + Two Staff Accountants' },
  { value: 'two_sa', label: 'Two Staff Accountants (no Controller)' },
  { value: 'sa_ptsa', label: 'SA + Part-Time Staff Accountant' },
  { value: 'controller_sa_ptsa', label: 'Controller + SA + Part-Time SA' },
];

const BILLING_OPTIONS = [
  { value: 'one_bs', label: 'One Billing Specialist' },
  { value: 'two_bs', label: 'Two Billing Specialists' },
  { value: 'bs_rc', label: 'Billing Specialist + Revenue Coordinator' },
];

const GA_OPTIONS = [
  { value: 'town_manager', label: 'Reports to Town Manager' },
  { value: 'finance_director', label: 'Reports to Finance Director' },
];

function RadioGroup({ label, options, value, onChange }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</p>
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`w-full flex items-center gap-2 text-left px-3 py-2 rounded-lg border text-xs transition-all ${
            value === opt.value
              ? 'border-slate-700 bg-slate-800 text-white'
              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
          }`}
        >
          {value === opt.value
            ? <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-emerald-400" />
            : <Circle className="h-3.5 w-3.5 flex-shrink-0 text-slate-300" />
          }
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function Toggle({ label, description, value, onChange }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 border-b border-slate-100 last:border-0">
      <div>
        <p className="text-xs font-medium text-slate-700">{label}</p>
        {description && <p className="text-[10px] text-slate-400">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${value ? 'bg-emerald-600' : 'bg-slate-200'}`}
      >
        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${value ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );
}

export default function OrgScenarioPanel({ scenario, scenarios, onSelectScenario, onUpdateScenario, onSaveScenario }) {
  return (
    <div className="w-72 flex-shrink-0 flex flex-col gap-4">

      {/* Scenario selector */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="bg-slate-900 px-4 py-3 flex items-center gap-2">
          <Layers className="h-4 w-4 text-slate-300" />
          <span className="text-sm font-bold text-white">Scenarios</span>
        </div>
        <div className="p-2 space-y-1">
          {scenarios.map(s => (
            <button
              key={s.id || s.name}
              onClick={() => onSelectScenario(s)}
              className={`w-full flex items-center gap-2.5 text-left px-3 py-2.5 rounded-lg text-xs transition-all ${
                scenario?.name === s.name
                  ? 'text-white shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-100'
              }`}
              style={scenario?.name === s.name ? { background: s.color || '#344A60' } : {}}
            >
              <span className="h-2.5 w-2.5 rounded-full flex-shrink-0 border-2 border-current opacity-70" style={{ background: s.color }} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{s.name}</p>
                {s.description && <p className="text-[10px] opacity-70 truncate">{s.description}</p>}
              </div>
              {s.is_baseline && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/20 border border-current/30">BASE</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Active scenario controls */}
      {scenario && (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100" style={{ background: scenario.color + '20' }}>
            <p className="text-xs font-bold text-slate-900">{scenario.name}</p>
            <p className="text-[10px] text-slate-500">{scenario.description}</p>
          </div>
          <div className="p-4 space-y-5">
            <RadioGroup
              label="Finance Department Structure"
              options={FINANCE_OPTIONS}
              value={scenario.finance_structure}
              onChange={v => onUpdateScenario({ finance_structure: v })}
            />
            <RadioGroup
              label="Billing & Revenue Structure"
              options={BILLING_OPTIONS}
              value={scenario.billing_structure}
              onChange={v => onUpdateScenario({ billing_structure: v })}
            />
            <RadioGroup
              label="GA Coordinator Reporting"
              options={GA_OPTIONS}
              value={scenario.ga_reporting}
              onChange={v => onUpdateScenario({ ga_reporting: v })}
            />
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Display Options</p>
              <Toggle label="Show Vacant Positions" value={scenario.show_vacant} onChange={v => onUpdateScenario({ show_vacant: v })} />
              <Toggle label="Show Part-Time Positions" value={scenario.show_part_time} onChange={v => onUpdateScenario({ show_part_time: v })} />
              <Toggle label="Regional Service Modeling" value={scenario.enable_regional} onChange={v => onUpdateScenario({ enable_regional: v })} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}