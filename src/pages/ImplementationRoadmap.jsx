import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import SectionHeader from '../components/machias/SectionHeader';
import RoadmapTimeline from '../components/roadmap/RoadmapTimeline';
import RoadmapGenerator from '../components/roadmap/RoadmapGenerator';
import { Trash2, RefreshCw, MapPin } from 'lucide-react';

export default function ImplementationRoadmap() {
  const [roadmaps, setRoadmaps] = useState([]);
  const [selectedRoadmap, setSelectedRoadmap] = useState(null);
  const [filters, setFilters] = useState({ phase: null, owner: null, status: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRoadmaps();
  }, []);

  const loadRoadmaps = async () => {
    try {
      const data = await base44.entities.ImplementationRoadmap.list();
      setRoadmaps(data || []);
      if (data && data.length > 0) setSelectedRoadmap(data[0]);
      setLoading(false);
    } catch (error) {
      console.error('Error loading roadmaps:', error);
      setLoading(false);
    }
  };

  const handleDeleteRoadmap = async (id) => {
    if (window.confirm('Delete this roadmap?')) {
      try {
        await base44.entities.ImplementationRoadmap.delete(id);
        if (selectedRoadmap?.id === id) setSelectedRoadmap(null);
        await loadRoadmaps();
      } catch (error) {
        console.error('Error deleting roadmap:', error);
      }
    }
  };

  const handleRoadmapGenerated = (newRoadmap) => {
    setRoadmaps([newRoadmap, ...roadmaps]);
    setSelectedRoadmap(newRoadmap);
  };

  const handleStatusUpdate = async (roadmapId, actionItemId, newStatus) => {
    try {
      const roadmap = roadmaps.find((r) => r.id === roadmapId);
      if (!roadmap) return;

      const updatedItems = roadmap.action_items.map((item) =>
        item.id === actionItemId ? { ...item, status: newStatus } : item
      );

      await base44.entities.ImplementationRoadmap.update(roadmapId, {
        action_items: updatedItems,
      });

      setRoadmaps((prev) =>
        prev.map((r) =>
          r.id === roadmapId ? { ...r, action_items: updatedItems } : r
        )
      );

      if (selectedRoadmap?.id === roadmapId) {
        setSelectedRoadmap({ ...selectedRoadmap, action_items: updatedItems });
      }
    } catch (error) {
      console.error('Error updating action item:', error);
    }
  };

  // Extract unique values for filters
  const uniqueOwners = selectedRoadmap
    ? Array.from(new Set(selectedRoadmap.action_items?.map((item) => item.owner) || []))
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs text-slate-500">Loading roadmaps...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Implementation Roadmap"
        subtitle="Execute approved proposals and restructuring plans with detailed action items, owners, timelines, and dependencies."
        icon={MapPin}
      />

      {/* Summary */}
      {selectedRoadmap && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold text-slate-600 uppercase mb-2">Total Items</p>
            <p className="text-2xl font-bold text-slate-900">{selectedRoadmap.action_items?.length || 0}</p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold text-slate-600 uppercase mb-2">Total Cost</p>
            <p className="text-2xl font-bold text-slate-900">${(selectedRoadmap.total_cost_estimate || 0).toLocaleString()}</p>
          </div>

          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p className="text-xs font-semibold text-blue-700 uppercase mb-2">Board Actions</p>
            <p className="text-2xl font-bold text-blue-700">{selectedRoadmap.policy_items_count || 0}</p>
          </div>

          <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
            <p className="text-xs font-semibold text-purple-700 uppercase mb-2">Communications</p>
            <p className="text-2xl font-bold text-purple-700">{selectedRoadmap.communication_items_count || 0}</p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold text-slate-600 uppercase mb-2">Timeline</p>
            <p className="text-xs text-slate-700 font-semibold">
              {selectedRoadmap.start_date && selectedRoadmap.end_date
                ? `${new Date(selectedRoadmap.start_date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })} – ${new Date(selectedRoadmap.end_date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}`
                : 'TBD'}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Roadmap List */}
        <div className="lg:col-span-1 space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 mb-3">Roadmaps</h2>
            <div className="space-y-2">
              {roadmaps.length === 0 ? (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center">
                  <p className="text-xs text-slate-600">No roadmaps yet</p>
                </div>
              ) : (
                roadmaps.map((roadmap) => (
                  <button
                    key={roadmap.id}
                    onClick={() => setSelectedRoadmap(roadmap)}
                    className={`w-full rounded-lg border p-3 text-left transition-all ${
                      selectedRoadmap?.id === roadmap.id
                        ? 'border-slate-800 bg-slate-50'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <h3 className="text-xs font-bold text-slate-900 truncate">{roadmap.source_title}</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {roadmap.action_items?.length || 0} items • ${(roadmap.total_cost_estimate || 0).toLocaleString()}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Filters */}
          {selectedRoadmap && (
            <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-3">
              <h3 className="text-xs font-bold text-slate-900">Filters</h3>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">Phase</label>
                <select
                  value={filters.phase || ''}
                  onChange={(e) => setFilters({ ...filters, phase: e.target.value || null })}
                  className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none"
                >
                  <option value="">All Phases</option>
                  <option value="immediate">Immediate</option>
                  <option value="short_term">Short Term</option>
                  <option value="medium_term">Medium Term</option>
                  <option value="long_term">Long Term</option>
                </select>
              </div>

              {uniqueOwners.length > 0 && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">Owner</label>
                  <select
                    value={filters.owner || ''}
                    onChange={(e) => setFilters({ ...filters, owner: e.target.value || null })}
                    className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none"
                  >
                    <option value="">All Owners</option>
                    {uniqueOwners.map((owner) => (
                      <option key={owner} value={owner}>
                        {owner}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">Status</label>
                <select
                  value={filters.status || ''}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value || null })}
                  className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none"
                >
                  <option value="">All Status</option>
                  <option value="not_started">Not Started</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="blocked">Blocked</option>
                  <option value="deferred">Deferred</option>
                </select>
              </div>

              <button
                onClick={() => setFilters({ phase: null, owner: null, status: null })}
                className="w-full text-xs font-bold text-slate-600 hover:text-slate-900 py-1 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>

        {/* Main View */}
        <div className="lg:col-span-3">
          {selectedRoadmap ? (
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{selectedRoadmap.source_title}</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    {selectedRoadmap.source_type === 'proposal' && '📋 Proposal'}
                    {selectedRoadmap.source_type === 'scenario' && '🎯 Scenario'}
                    {selectedRoadmap.source_type === 'restructuring' && '🏢 Department Restructuring'}
                    {selectedRoadmap.department && ` • ${selectedRoadmap.department}`}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteRoadmap(selectedRoadmap.id)}
                  className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Generator - offer to regenerate */}
              <RoadmapGenerator
                sourceType={selectedRoadmap.source_type}
                sourceId={selectedRoadmap.source_id}
                sourceTitle={selectedRoadmap.source_title}
                department={selectedRoadmap.department}
                onGenerated={() => loadRoadmaps()}
              />

              {/* Timeline */}
              <div className="rounded-lg border border-slate-200 bg-white p-6">
                <RoadmapTimeline roadmap={selectedRoadmap} filters={filters} />
              </div>

              {selectedRoadmap.notes && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <h4 className="text-xs font-bold text-slate-900 mb-2">Notes</h4>
                  <p className="text-xs text-slate-700">{selectedRoadmap.notes}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-12 text-center">
              <p className="text-sm text-slate-600">Select a roadmap to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="rounded-lg border border-green-200 bg-green-50 p-4">
        <h4 className="text-sm font-bold text-green-900 mb-2">Implementation Planning</h4>
        <ul className="text-xs text-green-900 space-y-1 list-disc list-inside">
          <li>Generate roadmaps from approved proposals, scenarios, or restructuring plans</li>
          <li>AI creates detailed action items with phases, owners, timelines, and costs</li>
          <li>Track board actions and stakeholder communication needs</li>
          <li>Update progress as implementation proceeds</li>
          <li>Filter by phase, owner, or status for focused leadership reviews</li>
        </ul>
      </div>
    </div>
  );
}