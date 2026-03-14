import React, { useState, useMemo, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useModel } from '../components/machias/ModelContext';
import { useDepartment, DEPARTMENTS } from '../components/machias/DepartmentContext';
import { generateDepartmentProposal } from '../components/proposals/FinancialProposalEngine';
import DepartmentProposalDisplay from '../components/proposals/DepartmentProposalDisplay';
import SectionHeader from '../components/machias/SectionHeader';
import { FileText, Loader2 } from 'lucide-react';

export default function DepartmentProposals() {
  const { settings, planningHorizon } = useModel();
  const [selectedDept, setSelectedDept] = useState('finance');
  const [proposal, setProposal] = useState(null);
  const [generating, setGenerating] = useState(false);

  // Fetch regional participation data
  const { data: regionalParticipations = [], isLoading: partLoading } = useQuery({
    queryKey: ['regional_participations'],
    queryFn: () => base44.entities.RegionalParticipation.list(),
  });

  // Generate proposal when department, settings, or planning horizon changes
  useEffect(() => {
    if (regionalParticipations.length === 0) return;

    const generateProposal = async () => {
      setGenerating(true);
      try {
        const prop = await generateDepartmentProposal(
          selectedDept,
          base44,
          settings,
          planningHorizon,
          regionalParticipations
        );
        setProposal(prop);
      } catch (error) {
        console.error('Error generating proposal:', error);
      } finally {
        setGenerating(false);
      }
    };

    generateProposal();
  }, [selectedDept, settings, planningHorizon, regionalParticipations]);

  const deptOptions = DEPARTMENTS.filter(d => d.value !== 'all');

  if (partLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-slate-400" />
          <p className="text-sm text-slate-500">Loading department data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <SectionHeader
          title="Department Financial Proposals"
          subtitle="Dynamically generated proposals for regional service delivery based on live financial model"
          icon={FileText}
        />
        <p className="text-xs text-slate-500 mt-2">
          Select a department to generate a comprehensive financial proposal suitable for Select Board presentations, interlocal agreement discussions, and town meeting briefings.
        </p>
      </div>

      {/* Department selector */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">Department</label>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
          {deptOptions.map(dept => (
            <button
              key={dept.value}
              onClick={() => setSelectedDept(dept.value)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                selectedDept === dept.value
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              {dept.label}
            </button>
          ))}
        </div>
      </div>

      {/* Proposal display */}
      {generating ? (
        <div className="flex items-center justify-center py-12 rounded-xl border border-slate-200 bg-white">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-slate-400" />
            <p className="text-sm text-slate-500">Generating {deptOptions.find(d => d.value === selectedDept)?.label} proposal...</p>
          </div>
        </div>
      ) : (
        <DepartmentProposalDisplay proposal={proposal} />
      )}
    </div>
  );
}