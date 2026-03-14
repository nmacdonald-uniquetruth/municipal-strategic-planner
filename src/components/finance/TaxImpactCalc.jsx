import React, { useState } from 'react';
import { budgetChangeToMillRate, budgetChangeToTaxPerHome, millRateToTaxPerHome, AVG_HOME_VALUE } from './financialSimEngine';
import { Calculator } from 'lucide-react';

const fmt = n => `$${Math.abs(Math.round(n)).toLocaleString()}`;
const fmtM = n => n >= 0 ? `+${n.toFixed(4)}` : n.toFixed(4);

export default function TaxImpactCalc({ currentMillRate = 14.5 }) {
  const [budgetChange, setBudgetChange] = useState(100000);
  const [homeValue, setHomeValue] = useState(AVG_HOME_VALUE);
  const [taxBase, setTaxBase] = useState(198000000);

  const millDelta = budgetChangeToMillRate(budgetChange, taxBase);
  const taxDelta  = budgetChangeToTaxPerHome(budgetChange, homeValue, taxBase);
  const newMill   = currentMillRate + millDelta;
  const currentTax = millRateToTaxPerHome(currentMillRate, homeValue);
  const newTax     = millRateToTaxPerHome(newMill, homeValue);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900">
          <Calculator className="h-4 w-4 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900">Property Tax Impact Calculator</h3>
          <p className="text-xs text-slate-500">Simulate how budget changes affect the mill rate and household tax bills</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        <div>
          <label className="text-xs font-medium text-slate-600 block mb-1">Budget Change ($)</label>
          <input type="number" value={budgetChange}
            onChange={e => setBudgetChange(Number(e.target.value))}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
          <p className="text-[10px] text-slate-400 mt-1">Positive = increase, negative = decrease</p>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600 block mb-1">Avg Home Assessed Value ($)</label>
          <input type="number" value={homeValue}
            onChange={e => setHomeValue(Number(e.target.value))}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600 block mb-1">Total Tax Base ($)</label>
          <input type="number" value={taxBase}
            onChange={e => setTaxBase(Number(e.target.value))}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Budget Change', value: `${budgetChange >= 0 ? '+' : ''}${fmt(budgetChange)}`, color: budgetChange >= 0 ? '#e05c3a' : '#2A7F7F' },
          { label: 'Mill Rate Change', value: `${fmtM(millDelta)} mills`, color: millDelta >= 0 ? '#e05c3a' : '#2A7F7F' },
          { label: 'Tax Change / Home', value: `${taxDelta >= 0 ? '+' : ''}${fmt(taxDelta)}/yr`, color: taxDelta >= 0 ? '#e05c3a' : '#2A7F7F' },
          { label: 'New Mill Rate', value: `${newMill.toFixed(2)} mills`, color: '#344A60' },
        ].map((s, i) => (
          <div key={i} className="text-center p-3 rounded-xl border border-slate-200 bg-slate-50">
            <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs">
        <p className="font-semibold text-slate-700 mb-1">Current vs. Projected Household Tax Bill</p>
        <div className="flex items-center gap-4">
          <div>
            <span className="text-slate-500">Current ({currentMillRate} mills): </span>
            <span className="font-bold text-slate-900">{fmt(currentTax)}/yr</span>
          </div>
          <span className="text-slate-300">→</span>
          <div>
            <span className="text-slate-500">Projected ({newMill.toFixed(2)} mills): </span>
            <span className="font-bold" style={{ color: newTax > currentTax ? '#e05c3a' : '#2A7F7F' }}>{fmt(newTax)}/yr</span>
          </div>
          <div className="ml-auto">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${taxDelta <= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'}`}>
              {taxDelta <= 0 ? `Saves ${fmt(Math.abs(taxDelta))}/yr` : `Costs ${fmt(taxDelta)}/yr more`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}