import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import {
  DEFAULT_DEPT_BUDGETS, DEFAULT_CAPITAL_PROJECTS,
  computeBudgetSummary, FUND_COLORS, FUND_LABELS,
  costPerResident, MACHIAS_POPULATION,
} from '../components/finance/financialSimEngine';
import TaxImpactCalc from '../components/finance/TaxImpactCalc';
import ScenarioBuilder from '../components/finance/ScenarioBuilder';
import CapitalPlanTable from '../components/finance/CapitalPlanTable';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { DollarSign, Loader2, Users, TrendingUp, Building2, RefreshCw } from 'lucide-react';
import { useModel } from '../components/machias/ModelContext';

const fmt  = n => `$${Math.abs(Math.round(n)).toLocaleString()}`;
const fmtK = n => `$${Math.round(Math.abs(n) / 1000)}K`;

const DEPT_ICONS = {
  'Town Manager': '🏛️', 'Finance': '💰', 'Town Clerk': '📋', 'Police': '🚔',
  'Fire': '🚒', 'Ambulance': '🚑', 'Public Works': '🔧', 'Wastewater': '💧',
  'Transfer': '♻️', 'Parks': '🌳', 'Airport': '✈️', 'Planning': '🗺️',
};
function deptIcon(name) {
  const key = Object.keys(DEPT_ICONS).find(k => name.includes(k));
  return key ? DEPT_ICONS[key] : '🏢';
}

export default function FinancialSimulator() {
  const { settings } = useModel();
  const [budgets, setBudgets] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [activeTab, setActiveTab] = useState('overview');

  async function loadData() {
    setLoading(true);
    const [bData, pData] = await Promise.all([
      base44.entities.DeptBudget.list('department_name', 50),
      base44.entities.CapitalProject.list('department', 50),
    ]);

    if (bData.length === 0) {
      const created = await base44.entities.DeptBudget.bulkCreate(DEFAULT_DEPT_BUDGETS);
      setBudgets(created);
    } else {
      setBudgets(bData);
    }

    if (pData.length === 0) {
      const created = await base44.entities.CapitalProject.bulkCreate(DEFAULT_CAPITAL_PROJECTS);
      setProjects(created);
    } else {
      setProjects(pData);
    }
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  const summary = useMemo(() => budgets.length ? computeBudgetSummary(budgets) : null, [budgets]);

  async function saveEdit(id) {
    await base44.entities.DeptBudget.update(id, editValues);
    setBudgets(prev => prev.map(b => b.id === id ? { ...b, ...editValues } : b));
    setEditingId(null);
    setEditValues({});
  }

  if (loading) return (
    <div className="flex items-center justify-center h-96 gap-3 text-slate-500">
      <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      <p className="text-sm">Loading financial data…</p>
    </div>
  );

  // Chart data
  const pieData = Object.entries(
    budgets.reduce((acc, b) => {
      acc[b.fund_type] = (acc[b.fund_type] || 0) + (b.annual_budget || 0);
      return acc;
    }, {})
  ).map(([k, v]) => ({ name: FUND_LABELS[k] || k, value: v, color: FUND_COLORS[k] }));

  const deptBarData = summary?.byDept
    .filter(d => d.annual_budget > 0)
    .sort((a, b) => b.annual_budget - a.annual_budget)
    .slice(0, 10)
    .map(d => ({
      name: d.department_name.replace(' Department', '').replace(' Administration', '').replace(' & Human Resources', ' & HR'),
      personnel: d.personnel_costs || 0,
      operating: d.operating_costs || 0,
      capital: d.capital_budget || 0,
    }));

  const TABS = [
    { id: 'overview',  label: 'Budget Overview' },
    { id: 'depts',     label: 'Department Budgets' },
    { id: 'ratios',    label: 'Cost Ratios' },
    { id: 'scenarios', label: 'Scenario Builder' },
    { id: 'tax',       label: 'Tax Calculator' },
    { id: 'capital',   label: 'Capital Planning' },
  ];

  return (
    <div className="space-y-6 pb-16">

      {/* Hero */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 text-white">
        <div className="flex items-center gap-2 mb-2">
          <DollarSign className="h-4 w-4 text-slate-400" />
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Municipal Financial Structure Simulator — Town of Machias</span>
        </div>
        <h1 className="text-xl font-bold mb-1">Financial Structure Simulator</h1>
        <p className="text-sm text-slate-400 max-w-2xl">Model department budgets, staffing costs, capital spending, and property tax impacts. Integrates with live organizational data.</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
          <div><p className="text-2xl font-bold text-slate-200">{fmt(summary?.totalAll || 0)}</p><p className="text-[10px] text-slate-400">Total All Funds</p></div>
          <div><p className="text-2xl font-bold text-slate-200">{fmt(summary?.totalGF || 0)}</p><p className="text-[10px] text-slate-400">General Fund</p></div>
          <div><p className="text-2xl font-bold text-amber-400">{(( summary?.personnelPct || 0) * 100).toFixed(0)}%</p><p className="text-[10px] text-slate-400">Personnel % of Budget</p></div>
          <div><p className="text-2xl font-bold text-blue-400">{fmt(summary?.totalAll / MACHIAS_POPULATION || 0)}</p><p className="text-[10px] text-slate-400">Cost per Resident</p></div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 flex-wrap">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === t.id ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie */}
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-sm font-bold text-slate-900 mb-4">Budget by Fund Type</p>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85}
                    label={({ name, value }) => `${name}: ${fmtK(value)}`} labelLine={true} fontSize={10}>
                    {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip formatter={v => [fmt(v)]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Stacked bar */}
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-sm font-bold text-slate-900 mb-4">Personnel vs. Operating by Department</p>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={deptBarData} layout="vertical" margin={{ left: 80, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => fmtK(v)} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={78} />
                  <Tooltip formatter={v => [fmt(v)]} />
                  <Bar dataKey="personnel" name="Personnel" stackId="a" fill="#344A60" />
                  <Bar dataKey="operating"  name="Operating"  stackId="a" fill="#2A7F7F" radius={[0,4,4,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Summary stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Personnel Costs', value: fmt(summary?.totalPersonnel || 0), sub: `${((summary?.personnelPct || 0) * 100).toFixed(0)}% of all funds`, icon: Users, color: '#344A60' },
              { label: 'Total Operating Costs', value: fmt(summary?.totalOperating || 0), sub: 'Non-personnel operating', icon: Building2, color: '#2A7F7F' },
              { label: 'Enterprise Funds', value: fmt(summary?.totalEnterprise || 0), sub: 'Self-supporting funds', icon: TrendingUp, color: '#4A6741' },
              { label: 'GF Cost per Resident', value: `$${summary?.costPerResidentGF || 0}`, sub: `$${summary?.costPerResidentAll || 0} all funds`, icon: DollarSign, color: '#8B6914' },
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: s.color }}>
                      <Icon className="h-3.5 w-3.5 text-white" />
                    </div>
                    <p className="text-xs font-semibold text-slate-600">{s.label}</p>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{s.value}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{s.sub}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Department Budgets (editable table) ── */}
      {activeTab === 'depts' && (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
            <p className="text-sm font-bold text-slate-900">Department Budget Detail</p>
            <button onClick={loadData} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800">
              <RefreshCw className="h-3 w-3" /> Refresh
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-900 text-white">
                  {['Department', 'Fund Type', 'Personnel', 'Operating', 'Capital', 'Total Budget', 'Cost/Resident', ''].map((h, i) => (
                    <th key={i} className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {budgets.map((b, i) => {
                  const isEditing = editingId === b.id;
                  const vals = isEditing ? editValues : b;
                  return (
                    <tr key={b.id} className={i % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
                      <td className="px-3 py-2 font-medium text-slate-800 whitespace-nowrap">
                        {deptIcon(b.department_name)} {b.department_name}
                      </td>
                      <td className="px-3 py-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: FUND_COLORS[b.fund_type] + '22', color: FUND_COLORS[b.fund_type] }}>
                          {FUND_LABELS[b.fund_type] || b.fund_type}
                        </span>
                      </td>
                      {['personnel_costs', 'operating_costs', 'capital_budget', 'annual_budget'].map(field => (
                        <td key={field} className="px-3 py-2 font-mono text-slate-700">
                          {isEditing && field !== 'annual_budget' ? (
                            <input type="number" value={vals[field] || 0}
                              onChange={e => setEditValues(prev => ({ ...prev, [field]: Number(e.target.value) }))}
                              className="w-24 border border-slate-300 rounded px-1.5 py-0.5 text-xs focus:outline-none" />
                          ) : (
                            <span className={field === 'annual_budget' ? 'font-bold text-slate-900' : ''}>{fmt(b[field] || 0)}</span>
                          )}
                        </td>
                      ))}
                      <td className="px-3 py-2 font-mono text-slate-500">${costPerResident(b.annual_budget || 0)}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {isEditing ? (
                          <div className="flex gap-1">
                            <button onClick={() => saveEdit(b.id)} className="px-2 py-0.5 rounded bg-slate-900 text-white text-[10px] hover:bg-slate-700">Save</button>
                            <button onClick={() => { setEditingId(null); setEditValues({}); }} className="px-2 py-0.5 rounded border text-[10px] text-slate-600">Cancel</button>
                          </div>
                        ) : (
                          <button onClick={() => { setEditingId(b.id); setEditValues({ personnel_costs: b.personnel_costs, operating_costs: b.operating_costs, capital_budget: b.capital_budget }); }}
                            className="text-[10px] text-slate-400 hover:text-slate-700 underline">Edit</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-300 bg-slate-100 font-bold">
                  <td className="px-3 py-2 text-slate-800" colSpan={2}>Total</td>
                  <td className="px-3 py-2 font-mono">{fmt(summary?.totalPersonnel || 0)}</td>
                  <td className="px-3 py-2 font-mono">{fmt(summary?.totalOperating || 0)}</td>
                  <td className="px-3 py-2 font-mono">{fmt(budgets.reduce((s, b) => s + (b.capital_budget || 0), 0))}</td>
                  <td className="px-3 py-2 font-mono text-slate-900">{fmt(summary?.totalAll || 0)}</td>
                  <td className="px-3 py-2 font-mono">${summary?.costPerResidentAll || 0}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ── Cost Ratios ── */}
      {activeTab === 'ratios' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {summary?.byDept.filter(d => d.annual_budget > 0).sort((a, b) => b.annual_budget - a.annual_budget).map((d, i) => (
              <div key={i} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-slate-800">{deptIcon(d.department_name)} {d.department_name}</span>
                  <span className="text-xs font-mono text-slate-600">{fmt(d.annual_budget)}/yr</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-slate-50 p-2">
                    <p className="text-sm font-bold text-slate-900">${d.costPerResident}</p>
                    <p className="text-[10px] text-slate-400">per resident</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2">
                    <p className="text-sm font-bold" style={{ color: '#344A60' }}>{(d.personnelPct * 100).toFixed(0)}%</p>
                    <p className="text-[10px] text-slate-400">personnel</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: FUND_COLORS[d.fund_type] + '22', color: FUND_COLORS[d.fund_type] }}>
                      {FUND_LABELS[d.fund_type]?.replace(' Fund', '') || d.fund_type}
                    </span>
                  </div>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-1.5 rounded-full" style={{ width: `${(d.personnelPct * 100).toFixed(0)}%`, background: '#344A60' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Scenario Builder ── */}
      {activeTab === 'scenarios' && <ScenarioBuilder budgets={budgets} />}

      {/* ── Tax Calculator ── */}
      {activeTab === 'tax' && <TaxImpactCalc currentMillRate={settings.current_mill_rate || 14.5} />}

      {/* ── Capital Planning ── */}
      {activeTab === 'capital' && (
        <CapitalPlanTable
          projects={projects}
          onRefresh={() => base44.entities.CapitalProject.list('department', 50).then(setProjects)}
        />
      )}

    </div>
  );
}