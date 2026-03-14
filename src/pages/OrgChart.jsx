import React, { useState, useMemo, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useModel } from '../components/machias/ModelContext';
import { Network, ChevronDown, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import SectionHeader from '../components/machias/SectionHeader';
import OrgHierarchicalCanvas from '../components/orgchart/OrgHierarchicalCanvas';
import OrgDetailPanel from '../components/orgchart/OrgDetailPanel';
import { getAllPositions, buildOrgTree } from '../components/orgchart/OrgChartData';

export default function OrgChart() {
  const { settings } = useModel();
  const [selectedNode, setSelectedNode] = useState(null);
  const [view, setView] = useState(settings?.DEFAULT_ORG_CHART_VIEW || 'tree');

  // Generate positions from current settings
  const positions = useMemo(() => {
    if (!settings) return [];
    return getAllPositions(settings);
  }, [settings]);

  // Count stats properly (position nodes only)
  const stats = useMemo(() => {
    const positionNodes = positions.filter(p => p.nodeType === 'position');
    return {
      total: positionNodes.length,
      filled: positionNodes.filter(p => p.status === 'filled').length,
      vacant: positionNodes.filter(p => p.status === 'vacant').length,
    };
  }, [positions]);

  const tree = useMemo(() => buildOrgTree(positions), [positions]);

  const handleSelect = useCallback((node) => {
    setSelectedNode(prev => !node || prev?.id === node.id ? null : node);
  }, []);

  return (
    <div className="flex flex-col gap-4" style={{ height: 'calc(100vh - 96px)' }}>
      {/* Header */}
      <SectionHeader
        title="Municipal Organizational Chart"
        subtitle="Town of Machias — organizational structure and reporting hierarchy"
        icon={Network}
      />

      {/* Stats */}
      <div className="flex gap-2 flex-wrap">
        {[
          { label: 'Positions', value: stats.total, cls: 'text-slate-900' },
          { label: 'Filled', value: stats.filled, cls: 'text-emerald-700' },
          { label: 'Vacant', value: stats.vacant, cls: 'text-amber-600' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-center min-w-20 shadow-sm">
            <p className={`text-lg font-bold leading-none ${s.cls}`}>{s.value}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Main layout */}
      <div className="flex gap-4 flex-1 min-h-0">
        {/* Chart area */}
        <div className="flex-1 min-w-0 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden relative">
          {positions.length > 0 && tree.length > 0 ? (
            <OrgHierarchicalCanvas
              roots={tree}
              selectedId={selectedNode?.id}
              onSelect={handleSelect}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400 text-sm">
              Loading organizational structure…
            </div>
          )}
        </div>

        {/* Detail panel */}
        <div className="w-72 flex-shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <OrgDetailPanel node={selectedNode} allPositions={positions} onClose={() => setSelectedNode(null)} />
        </div>
      </div>
    </div>
  );
}