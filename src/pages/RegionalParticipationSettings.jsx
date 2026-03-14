import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, Plus, Trash2 } from 'lucide-react';
import SectionHeader from '../components/machias/SectionHeader';
import { DEPARTMENTS } from '../components/strategic/DepartmentContext';

const TOWNS = ['Machias', 'Beals', 'Machiasport', 'Marshfield', 'Whitneyville', 'Northfield', 'Roque Bluffs', 'Jonesport', 'Jonesborough', 'East Machias'];

const PARTICIPATION_STATUS = [
  { value: 'not_participating', label: 'Not Participating', color: 'bg-slate-100 text-slate-700' },
  { value: 'prospect', label: 'Prospect', color: 'bg-blue-100 text-blue-700' },
  { value: 'active_partner', label: 'Active Partner', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'host', label: 'Host', color: 'bg-amber-100 text-amber-700' },
  { value: 'limited_shared', label: 'Limited/Shared', color: 'bg-purple-100 text-purple-700' },
  { value: 'future_phase', label: 'Future Phase', color: 'bg-indigo-100 text-indigo-700' },
];

export default function RegionalParticipationSettings() {
  const [selectedDept, setSelectedDept] = useState('finance');
  const queryClient = useQueryClient();

  const { data: participations = [] } = useQuery({
    queryKey: ['RegionalParticipation', selectedDept],
    queryFn: () => base44.entities.RegionalParticipation.filter({ department: selectedDept }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.RegionalParticipation.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['RegionalParticipation', selectedDept] });
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.RegionalParticipation.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['RegionalParticipation', selectedDept] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.RegionalParticipation.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['RegionalParticipation', selectedDept] });
    },
  });

  const deptLabel = DEPARTMENTS.find(d => d.id === selectedDept)?.label || 'Unknown';
  const selectedDeptObj = DEPARTMENTS.find(d => d.id === selectedDept);

  // Get towns that are already in this department
  const participatingTowns = participations.map(p => p.municipality);
  const availableTowns = TOWNS.filter(town => !participatingTowns.includes(town));

  const handleAddTown = (town) => {
    createMutation.mutate({
      department: selectedDept,
      municipality: town,
      status: 'prospect',
    });
  };

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto">
      <SectionHeader
        title="Regional Participation Settings"
        subtitle="Edit town participation by service line and set participation status"
        icon={Settings}
      />

      {/* Department selector */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Service Line</label>
        <div className="flex flex-wrap gap-2">
          {DEPARTMENTS.filter(d => d.id !== 'all').map(dept => (
            <button
              key={dept.id}
              onClick={() => setSelectedDept(dept.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedDept === dept.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {dept.label}
            </button>
          ))}
        </div>
      </div>

      {/* Participation table */}
      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="px-4 py-3 text-left font-bold">Municipality</th>
                <th className="px-4 py-3 text-left font-bold">Status</th>
                <th className="px-4 py-3 text-left font-bold">Host</th>
                <th className="px-4 py-3 text-left font-bold">Annual Fee</th>
                <th className="px-4 py-3 text-left font-bold">Implementation Year</th>
                <th className="px-4 py-3 text-center font-bold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {participations.map(p => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{p.municipality}</td>
                  <td className="px-4 py-3">
                    <select
                      value={p.status || 'prospect'}
                      onChange={(e) => updateMutation.mutate({ id: p.id, data: { status: e.target.value } })}
                      className="px-2 py-1 rounded border border-slate-200 text-xs"
                    >
                      {PARTICIPATION_STATUS.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={p.host_town || false}
                      onChange={(e) => updateMutation.mutate({ id: p.id, data: { host_town: e.target.checked } })}
                      className="rounded border-slate-200"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={p.annual_fee || ''}
                      onChange={(e) => updateMutation.mutate({ id: p.id, data: { annual_fee: parseInt(e.target.value) || 0 } })}
                      placeholder="0"
                      className="w-24 px-2 py-1 rounded border border-slate-200 text-xs"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={p.implementation_year || ''}
                      onChange={(e) => updateMutation.mutate({ id: p.id, data: { implementation_year: parseInt(e.target.value) || 1 } })}
                      placeholder="1"
                      min="1"
                      max="5"
                      className="w-20 px-2 py-1 rounded border border-slate-200 text-xs"
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => deleteMutation.mutate(p.id)}
                      className="text-red-600 hover:text-red-900 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add towns */}
      {availableTowns.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Towns to {deptLabel}
          </h3>
          <div className="flex flex-wrap gap-2">
            {availableTowns.map(town => (
              <button
                key={town}
                onClick={() => handleAddTown(town)}
                className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all"
              >
                + {town}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}