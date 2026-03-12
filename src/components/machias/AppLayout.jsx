import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, TrendingUp, Users, Monitor, Landmark, Target,
  ClipboardList, ChevronLeft, Menu
} from 'lucide-react';

const NAV = [
  { path: '/Dashboard', label: 'Overview', icon: LayoutDashboard },
  { path: '/ProForma', label: 'Financial Model', icon: TrendingUp },
  { path: '/Positions', label: 'Positions', icon: Users },
  { path: '/ERPRoadmap', label: 'ERP / Payroll', icon: Monitor },
  { path: '/EnterpriseFunds', label: 'Enterprise Funds', icon: Landmark },
  { path: '/Scenarios', label: 'Scenario Modeler', icon: Target },
  { path: '/Milestones', label: 'Milestones', icon: ClipboardList },
];

export default function AppLayout() {
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Mobile overlay */}
      {mobileOpen && <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={() => setMobileOpen(false)} />}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static z-40 h-full flex flex-col bg-slate-900 text-white transition-all duration-300
        ${collapsed ? 'w-16' : 'w-56'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className={`flex items-center gap-2 p-4 border-b border-white/10 ${collapsed ? 'justify-center' : ''}`}>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <h1 className="text-sm font-bold tracking-tight truncate">Town of Machias</h1>
              <p className="text-[10px] text-slate-400 truncate">Strategic Planning Tool</p>
            </div>
          )}
          <button onClick={() => { setCollapsed(!collapsed); setMobileOpen(false); }} className="p-1 rounded hover:bg-white/10">
            <ChevronLeft className={`h-4 w-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>

        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {NAV.map(({ path, label, icon: Icon }) => {
            const active = pathname === path;
            return (
              <Link
                key={path}
                to={path}
                onClick={() => setMobileOpen(false)}
                className={`
                  flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all
                  ${active ? 'bg-white/15 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}
                  ${collapsed ? 'justify-center' : ''}
                `}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {!collapsed && <span className="truncate">{label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className={`p-3 border-t border-white/10 ${collapsed ? 'hidden' : ''}`}>
          <p className="text-[10px] text-slate-500 leading-relaxed">FY2027-FY2031 Administrative Realignment & Regional Service Center</p>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <div className="lg:hidden p-3 border-b border-slate-200 bg-white sticky top-0 z-20">
          <button onClick={() => setMobileOpen(true)} className="p-1.5 rounded-lg hover:bg-slate-100">
            <Menu className="h-5 w-5 text-slate-600" />
          </button>
        </div>
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}