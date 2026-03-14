import React from 'react';
import { X, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';
import { TOWN_FILL_COLORS } from './TownProfiles';

export default function ComparisonView({ selectedTowns, onRemoveTown, onClear }) {
  if (selectedTowns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center rounded-xl border border-slate-200 bg-white">
        <BarChart3 className="h-10 w-10 text-slate-200 mb-3" />
        <p className="text-sm font-medium text-slate-500">Select 2-3 municipalities</p>
        <p className="text-[10px] text-slate-400 mt-1">to compare demographics and stats</p>
      </div>
    );
  }

  // Prepare comparison data
  const comparisonData = selectedTowns.map(town => ({
    name: town.town_name,
    population: town.population || 0,
    income: town.median_household_income || 0,
    color: TOWN_FILL_COLORS[town.town_name],
  }));

  // Population and income comparison
  const populationChartData = comparisonData.map(t => ({
    name: t.name,
    population: t.population,
    fill: t.color,
  }));

  const incomeChartData = comparisonData.map(t => ({
    name: t.name,
    income: t.income,
    fill: t.color,
  }));

  // Summary stats
  const stats = [
    {
      label: 'Total Population',
      value: comparisonData.reduce((s, t) => s + t.population, 0).toLocaleString(),
    },
    {
      label: 'Average Median Income',
      value: '$' + Math.round(comparisonData.reduce((s, t) => s + t.income, 0) / comparisonData.length).toLocaleString(),
    },
    {
      label: 'Largest Town',
      value: comparisonData.reduce((max, t) => t.population > max.population ? t : max).name,
    },
  ];

  return (
    <div className="space-y-4 overflow-y-auto max-h-full">
      {/* Selected towns */}
      <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-slate-700">Comparing ({selectedTowns.length})</p>
          {selectedTowns.length > 0 && (
            <button onClick={onClear}
              className="text-[10px] text-slate-400 hover:text-slate-600 transition-colors">
              Clear
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {selectedTowns.map(town => (
            <div key={town.town_name}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold text-white"
              style={{ background: TOWN_FILL_COLORS[town.town_name] }}>
              <span>{town.town_name}</span>
              <button onClick={() => onRemoveTown(town.town_name)}
                className="hover:opacity-75 transition-opacity">
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 gap-2">
        {stats.map(s => (
          <div key={s.label} className="rounded-lg border border-slate-200 bg-white p-2.5">
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{s.label}</p>
            <p className="text-sm font-bold text-slate-900 mt-0.5">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Comparison table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="bg-slate-900 px-3 py-2.5">
          <p className="text-xs font-bold text-white">Key Metrics</p>
        </div>
        <div className="divide-y divide-slate-100">
          {[
            { label: 'Population', key: 'population', format: n => n.toLocaleString() },
            { label: 'Median HHI', key: 'median_household_income', format: n => '$' + (n || 0).toLocaleString() },
            { label: 'Education %', key: 'pct_college_educated', format: n => (n || 0).toFixed(1) + '%' },
            { label: 'Poverty Rate', key: 'pct_poverty', format: n => (n || 0).toFixed(1) + '%' },
          ].map(metric => (
            <div key={metric.key} className="px-3 py-2.5 grid grid-cols-3 gap-2 text-[10px]">
              <p className="font-bold text-slate-600">{metric.label}</p>
              {selectedTowns.map(town => (
                <p key={town.town_name} className="text-right font-semibold text-slate-900">
                  {metric.format(town[metric.key] || 0)}
                </p>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Charts */}
      {selectedTowns.length >= 2 && (
        <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-4">
          {/* Population chart */}
          <div>
            <p className="text-[10px] font-bold text-slate-700 mb-2">Population</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={populationChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 9 }} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6 }} formatter={n => n.toLocaleString()} />
                <Bar dataKey="population" radius={[4, 4, 0, 0]}>
                  {populationChartData.map((entry, index) => (
                    <Bar key={`bar-${index}`} dataKey="population" fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Income chart */}
          <div>
            <p className="text-[10px] font-bold text-slate-700 mb-2">Median Household Income</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={incomeChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 9 }} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6 }} formatter={n => '$' + n.toLocaleString()} />
                <Bar dataKey="income" radius={[4, 4, 0, 0]}>
                  {incomeChartData.map((entry, index) => (
                    <Bar key={`bar-${index}`} dataKey="income" fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}