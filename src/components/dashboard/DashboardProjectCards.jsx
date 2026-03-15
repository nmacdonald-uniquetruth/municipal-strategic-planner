/**
 * DashboardProjectCards
 * Bento-style project cards for the five core restructuring initiatives.
 * Each card shows status, quick financials, and 2–3 quick-action CTAs.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { Monitor, Users, Truck, MapPin, DollarSign, ArrowRight, ExternalLink } from 'lucide-react';

const PROJECTS = [
  {
    id: 'erp',
    title: 'ERP / Payroll System',
    subtitle: 'Financial systems modernization',
    icon: Monitor,
    color: { border: 'border-indigo-200', bg: 'bg-indigo-50/30', icon: 'text-indigo-600', badge: 'bg-indigo-100 text-indigo-700' },
    status: 'In Progress',
    statusColor: 'bg-indigo-100 text-indigo-700',
    metric: { label: 'Y1 Budget', value: '$47,000' },
    metric2: { label: 'Annual Value', value: '$21,000/yr' },
    actions: [
      { label: 'View Roadmap', to: '/ERPRoadmap', primary: false },
      { label: 'Record Adjustment', to: '/ModelSettings', primary: true },
    ],
    tooltip: 'ERP implementation generates $21K/yr efficiency value once live. RFP phase Q3 FY27.',
  },
  {
    id: 'staffing',
    title: 'Finance Restructuring',
    subtitle: 'Staff accountant + billing specialist hires',
    icon: Users,
    color: { border: 'border-slate-200', bg: 'bg-white', icon: 'text-slate-600', badge: 'bg-slate-100 text-slate-600' },
    status: 'Planning',
    statusColor: 'bg-slate-100 text-slate-600',
    metric: { label: 'Y1 Staffing Cost', value: '~$168K' },
    metric2: { label: 'Loaded w/ Benefits', value: '+32%' },
    actions: [
      { label: 'View Positions', to: '/Positions', primary: false },
      { label: 'Review Org Chart', to: '/OrgChart', primary: false },
    ],
    tooltip: 'Hiring Staff Accountant (Y1) and Billing Specialist (Y1). Stipend elimination offsets $26K.',
  },
  {
    id: 'ems',
    title: 'EMS In-House Billing',
    subtitle: 'Replace Comstar with direct billing',
    icon: DollarSign,
    color: { border: 'border-emerald-200', bg: 'bg-emerald-50/30', icon: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700' },
    status: 'Approved',
    statusColor: 'bg-emerald-100 text-emerald-700',
    metric: { label: 'Collection Rate Target', value: '90%' },
    metric2: { label: 'Net Annual Gain', value: '+$42K est.' },
    actions: [
      { label: 'View Pro Forma', to: '/ProForma', primary: true },
      { label: 'Enterprise Funds', to: '/EnterpriseFunds', primary: false },
    ],
    tooltip: 'Switching from Comstar (5.22% fee) to in-house. Y1 ramp at 85.5%, steady-state 90%.',
  },
  {
    id: 'regional',
    title: 'Regional Services',
    subtitle: 'Interlocal contracts with nearby towns',
    icon: MapPin,
    color: { border: 'border-amber-200', bg: 'bg-amber-50/30', icon: 'text-amber-600', badge: 'bg-amber-100 text-amber-700' },
    status: 'Active Outreach',
    statusColor: 'bg-amber-100 text-amber-700',
    metric: { label: 'Contracted Revenue', value: '$77K/yr' },
    metric2: { label: 'Target Towns', value: '5 towns' },
    actions: [
      { label: 'Regional Map', to: '/RegionalMap', primary: false },
      { label: 'Service Revenue', to: '/RegionalServiceRevenue', primary: true },
    ],
    tooltip: 'R/B ($19K), Machiasport ($20K), Marshfield ($15K), Whitneyville ($11K), Northfield ($12K).',
  },
  {
    id: 'transfer',
    title: 'Transfer Station',
    subtitle: 'Regional expansion & cost recovery',
    icon: Truck,
    color: { border: 'border-slate-200', bg: 'bg-white', icon: 'text-slate-500', badge: 'bg-slate-100 text-slate-500' },
    status: 'Planning',
    statusColor: 'bg-slate-100 text-slate-500',
    metric: { label: 'Current Transfer', value: '$21,000/yr' },
    metric2: { label: 'Growth Rate', value: '+3%/yr' },
    actions: [
      { label: 'View Analysis', to: '/TransferStation', primary: false },
    ],
    tooltip: 'Enterprise fund currently transfers $21K/yr to general fund. Targeting renegotiation by Q3 FY27.',
  },
];

function ProjectCard({ project }) {
  const { color, icon: Icon } = project;
  return (
    <div
      className={`rounded-2xl border ${color.border} ${color.bg} p-4 flex flex-col gap-3 hover:shadow-md transition-shadow focus-within:ring-2 focus-within:ring-indigo-400`}
      role="region"
      aria-label={project.title}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5">
          <div className={`p-1.5 rounded-lg ${color.bg} border ${color.border}`}>
            <Icon className={`h-4 w-4 ${color.icon}`} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-800 leading-tight">{project.title}</p>
            <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{project.subtitle}</p>
          </div>
        </div>
        <span className={`flex-shrink-0 inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${project.statusColor}`}>
          {project.status}
        </span>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-white/70 border border-white/80 p-2">
          <p className="text-[9px] text-slate-400 uppercase tracking-wide font-bold">{project.metric.label}</p>
          <p className="text-sm font-bold text-slate-800 mt-0.5 tabular-nums">{project.metric.value}</p>
        </div>
        <div className="rounded-lg bg-white/70 border border-white/80 p-2">
          <p className="text-[9px] text-slate-400 uppercase tracking-wide font-bold">{project.metric2.label}</p>
          <p className="text-sm font-bold text-slate-800 mt-0.5 tabular-nums">{project.metric2.value}</p>
        </div>
      </div>

      {/* Tooltip detail */}
      <p className="text-[10px] text-slate-500 leading-relaxed border-t border-slate-100 pt-2">
        {project.tooltip}
      </p>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 mt-auto pt-1">
        {project.actions.map(action => (
          <Link
            key={action.label}
            to={action.to}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
              action.primary
                ? 'text-white hover:opacity-90'
                : 'border border-slate-200 text-slate-700 bg-white hover:bg-slate-50'
            }`}
            style={action.primary ? { background: '#344A60' } : {}}
            title={action.label}
          >
            {action.label}
            <ArrowRight className="h-2.5 w-2.5" />
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function DashboardProjectCards({ dept }) {
  const filtered = dept && dept !== 'All Departments'
    ? PROJECTS.filter(p =>
        p.title.toLowerCase().includes(dept.toLowerCase()) ||
        p.subtitle.toLowerCase().includes(dept.toLowerCase()) ||
        dept === 'Finance' && ['erp', 'staffing', 'ems'].includes(p.id) ||
        dept === 'Ambulance/EMS' && p.id === 'ems' ||
        dept === 'Transfer Station' && p.id === 'transfer' ||
        dept === 'Administration' && ['erp', 'staffing'].includes(p.id)
      )
    : PROJECTS;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-slate-800">
          Active Initiatives
          {dept && dept !== 'All Departments' && (
            <span className="ml-2 text-[10px] font-normal text-slate-500">— filtered: {dept}</span>
          )}
        </h3>
        <Link
          to="/ImplementationRoadmap"
          className="inline-flex items-center gap-1 text-[11px] font-semibold hover:underline focus:outline-none focus:ring-1 focus:ring-indigo-400 rounded"
          style={{ color: '#344A60' }}
        >
          Full Roadmap
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>
      {filtered.length === 0 ? (
        <p className="text-xs text-slate-500 py-4">No initiatives match the current department filter.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(p => <ProjectCard key={p.id} project={p} />)}
        </div>
      )}
    </div>
  );
}