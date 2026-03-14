import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import SectionHeader from '../components/machias/SectionHeader';
import DepartmentRestructuringPanel from '../components/departmentplanning/DepartmentRestructuringPanel';
import { BarChart3 } from 'lucide-react';

const DEPARTMENTS = [
  { id: 'police', name: 'Police Department' },
  { id: 'ambulance', name: 'Ambulance / EMS' },
  { id: 'fire', name: 'Fire Department' },
  { id: 'public_works', name: 'Public Works' },
  { id: 'transfer_station', name: 'Transfer Station' },
  { id: 'administration', name: 'Administration' },
  { id: 'finance', name: 'Financial Services' },
  { id: 'code_enforcement', name: 'Code Enforcement' },
  { id: 'recreation', name: 'Recreation' },
];

export default function DepartmentRestructuring() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      const existing = await base44.entities.DepartmentRestructuring.list();
      const existingMap = {};
      existing.forEach((dept) => {
        existingMap[dept.department_id] = dept;
      });

      const allDepts = DEPARTMENTS.map((dept) =>
        existingMap[dept.id] || {
          department_id: dept.id,
          department_name: dept.name,
          current_model: 'current_structure',
        }
      );

      setDepartments(allDepts);
      setLoading(false);
    } catch (error) {
      console.error('Error loading departments:', error);
      setLoading(false);
    }
  };

  const handleDepartmentChange = async (updated) => {
    try {
      if (updated.id) {
        await base44.entities.DepartmentRestructuring.update(updated.id, updated);
      } else {
        await base44.entities.DepartmentRestructuring.create(updated);
      }

      setDepartments((prev) =>
        prev.map((d) => (d.department_id === updated.department_id ? updated : d))
      );
    } catch (error) {
      console.error('Error saving department:', error);
    }
  };

  // Calculate totals
  const totals = departments.reduce(
    (acc, dept) => ({
      currentFTE: acc.currentFTE + (dept.current_fte || 0),
      proposedFTE: acc.proposedFTE + (dept.proposed_fte || 0),
      currentBudget: acc.currentBudget + (dept.current_budget || 0),
      proposedBudget: acc.proposedBudget + (dept.proposed_budget || 0),
      taxImpact: acc.taxImpact + (dept.tax_impact_annual || 0),
    }),
    { currentFTE: 0, proposedFTE: 0, currentBudget: 0, proposedBudget: 0, taxImpact: 0 }
  );

  const budgetChange = totals.proposedBudget - totals.currentBudget;
  const fteChange = totals.proposedFTE - totals.currentFTE;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs text-slate-500">Loading departments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Department Restructuring Planner"
        subtitle="Configure operational models, staffing levels, and service delivery approaches for each municipal department."
        icon={BarChart3}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold text-slate-600 uppercase mb-2">Departments</p>
          <p className="text-2xl font-bold text-slate-900">{departments.length}</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold text-slate-600 uppercase mb-2">Current FTE</p>
          <p className="text-2xl font-bold text-slate-900">{totals.currentFTE.toFixed(1)}</p>
        </div>

        <div className={`rounded-lg border p-4 ${fteChange !== 0 ? (fteChange > 0 ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50') : 'border-slate-200 bg-white'}`}>
          <p className={`text-xs font-semibold uppercase mb-2 ${fteChange > 0 ? 'text-emerald-700' : fteChange < 0 ? 'text-red-700' : 'text-slate-600'}`}>
            Proposed FTE
          </p>
          <p className={`text-2xl font-bold ${fteChange > 0 ? 'text-emerald-700' : fteChange < 0 ? 'text-red-700' : 'text-slate-900'}`}>
            {totals.proposedFTE.toFixed(1)}
            {fteChange !== 0 && <span className="text-sm ml-1">({fteChange > 0 ? '+' : ''}{fteChange.toFixed(1)})</span>}
          </p>
        </div>

        <div className={`rounded-lg border p-4 ${budgetChange !== 0 ? (budgetChange > 0 ? 'border-red-200 bg-red-50' : 'border-emerald-200 bg-emerald-50') : 'border-slate-200 bg-white'}`}>
          <p className={`text-xs font-semibold uppercase mb-2 ${budgetChange > 0 ? 'text-red-700' : budgetChange < 0 ? 'text-emerald-700' : 'text-slate-600'}`}>
            Budget Change
          </p>
          <p className={`text-2xl font-bold ${budgetChange > 0 ? 'text-red-700' : budgetChange < 0 ? 'text-emerald-700' : 'text-slate-900'}`}>
            {budgetChange > 0 ? '+' : ''}{(budgetChange / 1000).toFixed(0)}k
          </p>
        </div>

        <div className={`rounded-lg border p-4 ${totals.taxImpact !== 0 ? (totals.taxImpact > 0 ? 'border-red-200 bg-red-50' : 'border-emerald-200 bg-emerald-50') : 'border-slate-200 bg-white'}`}>
          <p className={`text-xs font-semibold uppercase mb-2 ${totals.taxImpact > 0 ? 'text-red-700' : totals.taxImpact < 0 ? 'text-emerald-700' : 'text-slate-600'}`}>
            Tax Impact
          </p>
          <p className={`text-2xl font-bold ${totals.taxImpact > 0 ? 'text-red-700' : totals.taxImpact < 0 ? 'text-emerald-700' : 'text-slate-900'}`}>
            {totals.taxImpact > 0 ? '+' : ''}{(totals.taxImpact / 1000).toFixed(0)}k
          </p>
        </div>
      </div>

      {/* Department Panels */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-900">Department Plans</h2>
        <div className="space-y-2">
          {departments.map((dept) => (
            <DepartmentRestructuringPanel
              key={dept.department_id}
              department={dept}
              onChange={handleDepartmentChange}
            />
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <h4 className="text-sm font-bold text-blue-900 mb-2">Department Restructuring Planning</h4>
        <ul className="text-xs text-blue-900 space-y-1 list-disc list-inside">
          <li>Select a service delivery model for each department</li>
          <li>Update staffing levels and budgets based on proposed changes</li>
          <li>Track workload growth and service impact assessments</li>
          <li>Changes automatically cascade to financial projections and tax impact calculations</li>
          <li>Regional delivery models can generate revenue to offset municipal costs</li>
        </ul>
      </div>
    </div>
  );
}