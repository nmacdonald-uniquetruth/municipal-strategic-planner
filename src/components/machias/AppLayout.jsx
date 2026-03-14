import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, TrendingUp, Users, Monitor, Landmark, Target,
  ClipboardList, ChevronLeft, Menu, Settings, Calculator, MessageSquare, BookOpen,
  Truck, BarChart2, FileText, HelpCircle, Megaphone, BookMarked, Activity, Scale, Network, Banknote, Globe
} from 'lucide-react';
import FeedbackDialog from './FeedbackDialog';

const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { path: '/Dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/ProForma', label: 'Financial Model', icon: TrendingUp },
      { path: '/PerformanceMetrics', label: 'Performance', icon: Activity },
      { path: '/SensitivityAnalysis', label: 'Sensitivity', icon: BarChart2 },
      { path: '/Scenarios', label: 'Scenarios', icon: Target },
    ],
  },
  {
    label: 'Initiatives',
    items: [
      { path: '/OrgStructure', label: 'Org Structure', icon: Network },
      { path: '/EfficiencyAnalyzer', label: 'Efficiency Analyzer', icon: Activity },
      { path: '/FinancialSimulator', label: 'Financial Simulator', icon: Banknote },
      { path: '/Positions', label: 'Positions', icon: Users },
      { path: '/ERPRoadmap', label: 'ERP / Payroll', icon: Monitor },
      { path: '/RegionalServices', label: 'Regional Services', icon: Target },
      { path: '/RegionalFeasibility', label: 'Regional Feasibility', icon: Scale },
      { path: '/TransferStation', label: 'Transfer Station', icon: Truck },
      { path: '/EnterpriseFunds', label: 'Enterprise Funds', icon: Landmark },
    ],
  },
  {
    label: 'Planning',
    items: [
      { path: '/Milestones', label: 'Milestones', icon: ClipboardList },
      { path: '/CommunicationStrategy', label: 'Communications', icon: Megaphone },
      { path: '/QandA', label: 'Q & A', icon: HelpCircle },
      { path: '/SelectBoardPresentation', label: 'SB Presentation', icon: Megaphone },
      { path: '/TaxpayerFAQ', label: 'Taxpayer FAQ', icon: FileText },
    ],
  },
  {
    label: 'Reference',
    items: [
      { path: '/ReferencesAndResearch', label: 'References', icon: BookMarked },
      { path: '/MathVerify', label: 'Math Verify', icon: Calculator },
      { path: '/ModelSettings', label: 'Model Settings', icon: Settings },
      { path: '/AIPlanner', label: 'AI Planner', icon: MessageSquare },
    ],
  },
];

export default function AppLayout() {
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Machias Blue = #344A60, Sand Dune = #E7D0B1, Shiretown Cream = #F3EAD6
  // Misty Blue = #B3C6C8, Salt Marsh Grass = #F6C85F
  return (
    <div className="flex h-screen" style={{ background: '#F3EAD6' }}>
      {/* Mobile overlay */}
      {mobileOpen && <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setMobileOpen(false)} />}

      {/* Sidebar — Machias Blue */}
      <aside className={`
        fixed lg:static z-40 h-full flex flex-col transition-all duration-300
        ${collapsed ? 'w-16' : 'w-56'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `} style={{ background: '#344A60' }}>

        {/* Brand header */}
        <div className={`flex items-center gap-2.5 p-4 border-b ${collapsed ? 'justify-center' : ''}`} style={{ borderColor: 'rgba(179,198,200,0.2)' }}>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <h1 className="text-sm font-bold tracking-tight truncate" style={{ color: '#E7D0B1', fontFamily: 'Raleway, sans-serif' }}>
                Town of Machias
              </h1>
              <p className="text-[10px] truncate mt-0.5" style={{ color: '#B3C6C8' }}>Strategic Planning · FY2027–31</p>
            </div>
          )}
          <button onClick={() => { setCollapsed(!collapsed); setMobileOpen(false); }}
            className="p-1 rounded transition-colors"
            style={{ color: '#B3C6C8' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <ChevronLeft className={`h-4 w-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>

        <nav className="flex-1 p-2 overflow-y-auto space-y-3 mt-1">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              {!collapsed && (
                <p className="text-[9px] font-bold uppercase tracking-widest px-3 mb-1" style={{ color: '#B3C6C8', opacity: 0.6 }}>{group.label}</p>
              )}
              <div className="space-y-0.5">
                {group.items.map(({ path, label, icon: NavIcon }) => {
                  const active = pathname === path;
                  return (
                    <Link
                      key={path}
                      to={path}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${collapsed ? 'justify-center' : ''}`}
                      style={{
                        background: active ? 'rgba(231,208,177,0.18)' : 'transparent',
                        color: active ? '#E7D0B1' : '#B3C6C8',
                        borderLeft: active ? '2px solid #F6C85F' : '2px solid transparent',
                        fontFamily: 'Open Sans, sans-serif',
                      }}
                      onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(179,198,200,0.1)'; e.currentTarget.style.color = '#E7D0B1'; }}}
                      onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#B3C6C8'; }}}
                    >
                      <NavIcon className="h-4 w-4 flex-shrink-0" />
                      {!collapsed && <span className="truncate">{label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer tagline */}
        <div className={`p-3 border-t ${collapsed ? 'hidden' : ''}`} style={{ borderColor: 'rgba(179,198,200,0.2)' }}>
          <p className="text-[9px] leading-relaxed italic" style={{ color: '#B3C6C8', opacity: 0.7 }}>
            "Making Here Better — Together"
          </p>
        </div>
      </aside>

      {/* Main content — Shiretown Cream background */}
      <main className="flex-1 overflow-y-auto" style={{ background: '#F3EAD6' }}>
        {/* Mobile top bar */}
        <div className="lg:hidden p-3 border-b sticky top-0 z-20 flex items-center gap-3 justify-between" style={{ background: '#344A60', borderColor: 'rgba(179,198,200,0.2)' }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="p-1.5 rounded" style={{ color: '#E7D0B1' }}>
              <Menu className="h-5 w-5" />
            </button>
            <span className="text-sm font-bold" style={{ color: '#E7D0B1', fontFamily: 'Raleway, sans-serif' }}>Town of Machias</span>
          </div>
          <FeedbackDialog />
        </div>
        {/* Desktop header bar */}
        <div className="hidden lg:flex items-center justify-between p-3 border-b sticky top-0 z-20" style={{ background: '#344A60', borderColor: 'rgba(179,198,200,0.2)' }}>
          <div />
          <FeedbackDialog />
        </div>
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}