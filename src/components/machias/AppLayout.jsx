import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, TrendingUp, Users, Monitor, Landmark, Target,
  ClipboardList, ChevronLeft, Menu, Settings, Calculator, MessageSquare, BookOpen,
  Truck, BarChart2, FileText, HelpCircle, Megaphone, BookMarked, Activity,
  Scale, Network, MapPin, Zap, AlertTriangle, ShieldCheck, ChevronDown, UserCircle, GitMerge, Scroll
} from 'lucide-react';
import FeedbackDialog from './FeedbackDialog';
import { RoleProvider, useRole, useCanAccess, ROLES } from './RoleContext';

// ── Navigation definition ────────────────────────────────────────────────────
// 7 top-level groups matching the required nav structure
const NAV_GROUPS = [
  {
    label: 'Dashboard',
    items: [
      { path: '/ExecutiveDashboard', label: 'Executive Summary',  icon: LayoutDashboard },
      { path: '/Dashboard',          label: 'Financial Model',    icon: TrendingUp },
      { path: '/PerformanceMetrics', label: 'Performance',        icon: Activity },
    ],
  },
  {
    label: 'Proposals',
    items: [
      { path: '/Proposals',                   label: 'All Proposals',     icon: FileText },
      { path: '/DepartmentProposals',          label: 'By Department',     icon: FileText },
      { path: '/RestructuringProposalLibrary', label: 'Proposal Library',  icon: BookOpen },
      { path: '/ProposalEvaluations',          label: 'Evaluations',       icon: Zap },
      { path: '/ProposalComparison',           label: 'Compare Proposals', icon: BarChart2 },
    ],
  },
  {
    label: 'Scenario Builder',
    items: [
      { path: '/Scenarios',             label: 'Scenarios',          icon: Target },
      { path: '/SensitivityAnalysis',   label: 'Sensitivity',        icon: BarChart2 },
      { path: '/RiskAdjustedPlanning',  label: 'Risk Assessment',    icon: AlertTriangle },
      { path: '/TaxImpact',             label: 'Tax Impact',         icon: Scale },
      { path: '/ImplementationRoadmap', label: 'Implementation',     icon: MapPin },
      { path: '/Milestones',            label: 'Milestones',         icon: ClipboardList },
    ],
  },
  {
    label: 'Regional Map',
    items: [
      { path: '/RegionalMap',                  label: 'Service Map',           icon: MapPin },
      { path: '/RegionalServices',             label: 'Regional Services',     icon: Target },
      { path: '/RegionalServiceRevenue',       label: 'Service Revenue',       icon: Landmark },
      { path: '/RegionalFeasibility',          label: 'Feasibility',           icon: Scale },
      { path: '/ServiceTerritoryAnalysis',     label: 'Territory Analysis',    icon: MapPin },
      { path: '/RegionalParticipationSettings',label: 'Participation',         icon: Settings },
    ],
  },
  {
    label: 'Financial Models',
    items: [
      { path: '/ProForma',            label: 'Pro Forma',          icon: TrendingUp },
      { path: '/EnterpriseFunds',     label: 'Enterprise Funds',   icon: Landmark },
      { path: '/CapitalProjects',     label: 'Capital Projects',   icon: Landmark },
      { path: '/ERPRoadmap',          label: 'ERP / Payroll',      icon: Monitor },
      { path: '/TransferStation',     label: 'Transfer Station',   icon: Truck },
      { path: '/Positions',           label: 'Positions',          icon: Users },
      { path: '/OrgChart',            label: 'Org Chart',          icon: Network },
      { path: '/DepartmentRestructuring', label: 'Dept Restructuring', icon: BarChart2 },
      { path: '/LeadershipCapacityModeling', label: 'Leadership Capacity', icon: Users },
      { path: '/AssumptionsManager',  label: 'Assumptions',        icon: Settings },
      { path: '/ModelSettings',       label: 'Model Settings',     icon: Settings },
      { path: '/MathVerify',          label: 'Math Verify',        icon: Calculator },
    ],
  },
  {
    label: 'Compliance',
    items: [
      { path: '/AnnualBudgetProcess',  label: 'Budget Process',      icon: ClipboardList },
      { path: '/BudgetControl',        label: 'Budget Control',       icon: ShieldCheck },
      { path: '/BudgetEngine',        label: 'Budget Engine',       icon: Calculator },
      { path: '/WarrantManager',      label: 'Warrant Manager',     icon: FileText },
      { path: '/WarrantBuilder',      label: 'Warrant Builder',     icon: Scroll },
      { path: '/ComplianceSettings',  label: 'Compliance Settings', icon: ShieldCheck },
      { path: '/ChartOfAccounts',     label: 'COA Crosswalk',       icon: GitMerge },
      { path: '/AIPlanner',           label: 'AI Planner',          icon: MessageSquare },
      { path: '/ReferencesAndResearch',label: 'References',         icon: BookMarked },
    ],
  },
  {
    label: 'Legislative & Policy',
    items: [
      { path: '/LegislativeTracking', label: 'Legislative Tracking', icon: Landmark },
    ],
  },
  {
    label: 'Reports',
    items: [
      { path: '/Narrative',               label: 'Narrative Report',    icon: BookOpen },
      { path: '/SelectBoardPresentation', label: 'Board Presentation',  icon: Megaphone },
      { path: '/BoardMemoGenerator',      label: 'Board Memo',          icon: FileText },
      { path: '/CommunicationStrategy',   label: 'Communications',      icon: Megaphone },
      { path: '/TaxpayerFAQ',             label: 'Taxpayer FAQ',        icon: FileText },
      { path: '/QandA',                   label: 'Q & A',               icon: HelpCircle },
    ],
  },
];

// ── Sidebar nav item (role-aware) ────────────────────────────────────────────
function NavItem({ path, label, icon: NavIcon, active, onClick }) {
  const canAccess = useCanAccess(path);
  if (!canAccess) return null;
  return (
    <Link
      to={path}
      onClick={onClick}
      className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all`}
      style={{
        background: active ? 'rgba(231,208,177,0.18)' : 'transparent',
        color: active ? '#E7D0B1' : '#B3C6C8',
        borderLeft: active ? '2px solid #F6C85F' : '2px solid transparent',
      }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(179,198,200,0.1)'; e.currentTarget.style.color = '#E7D0B1'; }}}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#B3C6C8'; }}}
    >
      <NavIcon className="h-3.5 w-3.5 flex-shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  );
}

function NavItemCollapsed({ path, label, icon: NavIcon, active, onClick }) {
  const canAccess = useCanAccess(path);
  if (!canAccess) return null;
  return (
    <Link
      to={path}
      onClick={onClick}
      title={label}
      className="flex items-center justify-center p-2 rounded-lg transition-all"
      style={{
        background: active ? 'rgba(231,208,177,0.18)' : 'transparent',
        color: active ? '#E7D0B1' : '#B3C6C8',
      }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(179,198,200,0.1)'; e.currentTarget.style.color = '#E7D0B1'; }}}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#B3C6C8'; }}}
    >
      <NavIcon className="h-4 w-4" />
    </Link>
  );
}

// ── Role switcher dropdown ───────────────────────────────────────────────────
function RoleSwitcher() {
  const { role, setRole, roleConfig } = useRole();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-400"
        style={{ background: 'rgba(255,255,255,0.1)', color: '#E7D0B1' }}
      >
        <UserCircle className="h-4 w-4 flex-shrink-0" />
        <span className="hidden sm:inline">{roleConfig.label}</span>
        <ChevronDown className="h-3 w-3 opacity-70" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1.5 z-50 w-64 rounded-xl border border-slate-700 shadow-xl overflow-hidden"
            style={{ background: '#1e2f3f' }}>
            <div className="px-3 py-2 border-b border-slate-700">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">View As Role</p>
            </div>
            {Object.entries(ROLES).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => { setRole(key); setOpen(false); }}
                className={`w-full text-left px-3 py-2.5 flex items-start gap-3 transition-colors hover:bg-white/10 ${role === key ? 'bg-white/10' : ''}`}
              >
                <div className="w-2 h-2 rounded-full mt-1 flex-shrink-0" style={{ background: cfg.color }} />
                <div>
                  <p className="text-xs font-semibold text-white">{cfg.label}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{cfg.description}</p>
                </div>
                {role === key && <span className="ml-auto text-[10px] text-yellow-400 font-bold self-center">Active</span>}
              </button>
            ))}
            <div className="px-3 py-2 border-t border-slate-700">
              <p className="text-[9px] text-slate-500">Role filtering controls nav visibility. All routes remain accessible by URL.</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Main layout ──────────────────────────────────────────────────────────────
function AppLayoutInner() {
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen" style={{ background: '#F3EAD6' }}>
      {mobileOpen && <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setMobileOpen(false)} />}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static z-40 h-full flex flex-col transition-all duration-300
        ${collapsed ? 'w-14' : 'w-56'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `} style={{ background: '#344A60' }}>

        {/* Brand */}
        <div className={`flex items-center gap-2.5 p-3 border-b ${collapsed ? 'justify-center' : ''}`}
          style={{ borderColor: 'rgba(179,198,200,0.2)' }}>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <h1 className="text-xs font-bold tracking-tight truncate" style={{ color: '#E7D0B1', fontFamily: 'Raleway, sans-serif' }}>
                Town of Machias
              </h1>
              <p className="text-[10px] truncate mt-0.5" style={{ color: '#B3C6C8' }}>Strategic Planner · FY2027–31</p>
            </div>
          )}
          <button
            onClick={() => { setCollapsed(!collapsed); setMobileOpen(false); }}
            className="p-1 rounded transition-colors flex-shrink-0"
            style={{ color: '#B3C6C8' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <ChevronLeft className={`h-4 w-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-2 overflow-y-auto">
          {collapsed ? (
            // Collapsed: icons only
            <div className="px-1 space-y-0.5">
              {NAV_GROUPS.flatMap(g => g.items).map(item => (
                <NavItemCollapsed
                  key={item.path}
                  {...item}
                  active={pathname === item.path}
                  onClick={() => setMobileOpen(false)}
                />
              ))}
            </div>
          ) : (
            // Expanded: grouped
            <div className="px-2 space-y-4">
              {NAV_GROUPS.map(group => (
                <NavGroup
                  key={group.label}
                  group={group}
                  pathname={pathname}
                  onNavigate={() => setMobileOpen(false)}
                />
              ))}
            </div>
          )}
        </nav>

        {/* Footer */}
        {!collapsed && (
          <div className="p-3 border-t" style={{ borderColor: 'rgba(179,198,200,0.2)' }}>
            <p className="text-[9px] leading-relaxed italic" style={{ color: '#B3C6C8', opacity: 0.7 }}>
              "Making Here Better — Together"
            </p>
          </div>
        )}
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto flex flex-col" style={{ background: '#F3EAD6' }}>
        {/* Mobile top bar */}
        <div className="lg:hidden p-3 border-b sticky top-0 z-20 flex items-center gap-3 justify-between"
          style={{ background: '#344A60', borderColor: 'rgba(179,198,200,0.2)' }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="p-1.5 rounded" style={{ color: '#E7D0B1' }}>
              <Menu className="h-5 w-5" />
            </button>
            <span className="text-sm font-bold" style={{ color: '#E7D0B1', fontFamily: 'Raleway, sans-serif' }}>Town of Machias</span>
          </div>
          <div className="flex items-center gap-2">
            <RoleSwitcher />
            <FeedbackDialog />
          </div>
        </div>

        {/* Desktop top bar */}
        <div className="hidden lg:flex items-center justify-end gap-3 px-4 py-2 border-b sticky top-0 z-20"
          style={{ background: '#344A60', borderColor: 'rgba(179,198,200,0.2)' }}>
          <RoleSwitcher />
          <FeedbackDialog />
        </div>

        <div className="p-3 sm:p-5 lg:p-8 max-w-7xl mx-auto w-full flex-1">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

// Collapsible nav group with role-aware filtering
function NavGroup({ group, pathname, onNavigate }) {
  const { access } = useRole();
  const visibleItems = group.items.filter(item =>
    access === '*' || access.includes(item.path)
  );
  if (visibleItems.length === 0) return null;

  return (
    <div>
      <p className="text-[9px] font-bold uppercase tracking-widest px-3 mb-1"
        style={{ color: '#B3C6C8', opacity: 0.55 }}>
        {group.label}
      </p>
      <div className="space-y-0.5">
        {visibleItems.map(item => (
          <NavItem
            key={item.path}
            {...item}
            active={pathname === item.path}
            onClick={onNavigate}
          />
        ))}
      </div>
    </div>
  );
}

export default function AppLayout() {
  return (
    <RoleProvider>
      <AppLayoutInner />
    </RoleProvider>
  );
}