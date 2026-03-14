import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { AlertTriangle, Plus, Trash2 } from 'lucide-react';
import SectionHeader from '@/components/machias/SectionHeader';
import CapitalProjectDisplay from '@/components/capital/CapitalProjectDisplay';

export default function CapitalProjects() {
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [filterUrgency, setFilterUrgency] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const { data: projects = [] } = useQuery({
    queryKey: ['capitalProjects'],
    queryFn: () => base44.entities.CapitalProject.list('-priority_rank', 100),
  });

  const { data: proposals = [] } = useQuery({
    queryKey: ['proposals'],
    queryFn: () => base44.entities.Proposal.list('-updated_date', 100),
  });

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      if (filterUrgency !== 'all' && p.urgency !== filterUrgency) return false;
      if (filterStatus !== 'all' && p.status !== filterStatus) return false;
      return true;
    });
  }, [projects, filterUrgency, filterStatus]);

  const selected = selectedProjectId ? projects.find((p) => p.id === selectedProjectId) : null;

  // Calculate portfolio metrics
  const portfolioMetrics = useMemo(() => {
    const totalCost = projects.reduce((sum, p) => sum + (p.project_cost || 0), 0);
    const regulatoryCount = projects.filter((p) => p.regulatory_necessity).length;
    const criticalCount = projects.filter((p) => p.urgency === 'critical').length;
    const completedCount = projects.filter((p) => p.status === 'completed').length;

    const totalOperatingImpact = projects.reduce((sum, p) => sum + ((p.annual_operating_impact || 0) + (p.annual_maintenance_impact || 0)), 0);

    return { totalCost, regulatoryCount, criticalCount, completedCount, totalOperatingImpact };
  }, [projects]);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Capital Projects"
        subtitle="Evaluate, prioritize, and track capital improvement projects"
      />

      {/* Portfolio Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-bold text-slate-600">Total Portfolio</p>
          <p className="text-2xl font-bold text-slate-900 mt-2">${(portfolioMetrics.totalCost / 1000000).toFixed(1)}M</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-bold text-slate-600">Projects</p>
          <p className="text-2xl font-bold text-slate-900 mt-2">{projects.length}</p>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-xs font-bold text-red-700">Regulatory</p>
          <p className="text-2xl font-bold text-red-900 mt-2">{portfolioMetrics.regulatoryCount}</p>
        </div>
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
          <p className="text-xs font-bold text-orange-700">Critical</p>
          <p className="text-2xl font-bold text-orange-900 mt-2">{portfolioMetrics.criticalCount}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-bold text-slate-600">Annual Operating Impact</p>
          <p className={`text-lg font-bold mt-2 ${portfolioMetrics.totalOperatingImpact < 0 ? 'text-emerald-600' : 'text-orange-600'}`}>
            ${(portfolioMetrics.totalOperatingImpact / 1000).toFixed(0)}K
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project List */}
        <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
          <div className="bg-slate-900 text-white px-4 py-3">
            <h3 className="font-bold">Capital Projects</h3>
          </div>

          {/* Filters */}
          <div className="p-4 space-y-3 border-b border-slate-200">
            <select
              value={filterUrgency}
              onChange={(e) => setFilterUrgency(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded px-2 py-1.5 focus:outline-none"
            >
              <option value="all">All Urgencies</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded px-2 py-1.5 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="concept">Concept</option>
              <option value="planning">Planning</option>
              <option value="design">Design</option>
              <option value="permitting">Permitting</option>
              <option value="construction">Construction</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Project Items */}
          <div className="divide-y divide-slate-200 max-h-96 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="p-4 text-center text-slate-600 text-xs">
                <p>No projects match filters</p>
              </div>
            ) : (
              filtered.map((project) => (
                <button
                  key={project.id}
                  onClick={() => setSelectedProjectId(project.id)}
                  className={`w-full text-left p-4 hover:bg-slate-50 transition-colors border-l-4 ${
                    selectedProjectId === project.id
                      ? 'border-blue-600 bg-blue-50'
                      : project.regulatory_necessity
                      ? 'border-red-400'
                      : 'border-transparent'
                  }`}
                >
                  <h4 className="font-bold text-slate-900 text-sm">{project.title}</h4>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-slate-600">${(project.project_cost / 1000000).toFixed(1)}M</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      project.urgency === 'critical' ? 'bg-red-100 text-red-700' :
                      project.urgency === 'high' ? 'bg-orange-100 text-orange-700' :
                      project.urgency === 'medium' ? 'bg-amber-100 text-amber-700' :
                      'bg-emerald-100 text-emerald-700'
                    }`}>
                      {project.urgency}
                    </span>
                  </div>
                  {project.regulatory_necessity && (
                    <p className="text-[10px] text-red-700 font-bold mt-2 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Regulatory Requirement
                    </p>
                  )}
                </button>
              ))
            )}
          </div>

          {/* Add New Button */}
          <div className="p-3 border-t border-slate-200 bg-slate-50">
            <button className="w-full px-3 py-2 text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center justify-center gap-1 transition-colors">
              <Plus className="h-3 w-3" />
              Add Project
            </button>
          </div>
        </div>

        {/* Project Details */}
        <div className="lg:col-span-2">
          {selected ? (
            <CapitalProjectDisplay project={selected} />
          ) : (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center">
              <p className="text-slate-600">Select a project to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Capital vs Operating Comparison */}
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h3 className="font-bold text-slate-900 mb-4">Capital vs Operating Proposals</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg border border-blue-200 bg-blue-50">
            <p className="font-bold text-blue-900">Capital Projects</p>
            <p className="text-2xl font-bold text-blue-900 mt-1">{projects.length}</p>
            <p className="text-sm text-blue-800 mt-2">
              Total investment: ${(portfolioMetrics.totalCost / 1000000).toFixed(1)}M
            </p>
          </div>
          <div className="p-4 rounded-lg border border-purple-200 bg-purple-50">
            <p className="font-bold text-purple-900">Operating Proposals</p>
            <p className="text-2xl font-bold text-purple-900 mt-1">{proposals.length}</p>
            <p className="text-sm text-purple-800 mt-2">
              Staffing, restructuring, and service changes
            </p>
          </div>
        </div>
      </div>

      {/* Best Practices */}
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-6">
        <h3 className="font-bold text-slate-900 mb-3">Capital Planning Best Practices</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-700">
          <ul className="space-y-1">
            <li>• Assess regulatory requirements and deadlines</li>
            <li>• Consider useful life and long-term costs</li>
            <li>• Identify grant and funding opportunities</li>
            <li>• Evaluate ROI and community value</li>
          </ul>
          <ul className="space-y-1">
            <li>• Plan for operating/maintenance costs</li>
            <li>• Use phased delivery to spread costs</li>
            <li>• Assess tax impact on households</li>
            <li>• Coordinate with operating budgets</li>
          </ul>
        </div>
      </div>
    </div>
  );
}