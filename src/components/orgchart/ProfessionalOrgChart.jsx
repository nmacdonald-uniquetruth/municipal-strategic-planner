import React, { useRef, useState, useMemo, useCallback, useEffect } from 'react';
import { layoutOrgChart, CARD_W, CARD_H } from './HierarchicalLayoutEngine';
import { DEPT_COLORS } from './OrgChartData';

// Orthogonal connector line (vertical → horizontal → vertical)
function OrthoConnector({ x1, y1, x2, y2 }) {
  const midY = y1 + (y2 - y1) / 2;
  const d = `M${x1},${y1} L${x1},${midY} L${x2},${midY} L${x2},${y2}`;
  return <path d={d} fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" />;
}

// Professional card component
function OrgCard({ node, isSelected, onSelect, hasChildren, onToggle }) {
  const isStructural = node.nodeType === 'structural';
  const isVacant = !isStructural && node.status === 'vacant';
  const isPartTime = !isStructural && !node.fullTime;
  const isContracted = !isStructural && node.contracted;

  const color = DEPT_COLORS[node.dept] || '#344A60';

  let bgColor = '#ffffff';
  let borderColor = '#e2e8f0';
  let titleColor = '#1f2937';
  let nameColor = '#374151';
  let deptColor = '#9ca3af';

  if (isStructural) {
    bgColor = color;
    borderColor = color;
    titleColor = '#ffffff';
    nameColor = 'rgba(255,255,255,0.95)';
    deptColor = 'rgba(255,255,255,0.8)';
  } else if (isSelected) {
    borderColor = '#3b82f6';
  } else if (isVacant) {
    bgColor = '#faf5f0';
    borderColor = '#fed7aa';
  }

  const truncate = (text, len) => text && text.length > len ? text.slice(0, len - 1) + '…' : (text || '');

  return (
    <g
      transform={`translate(${node.x},${node.y})`}
      onClick={(e) => { e.stopPropagation(); onSelect(node); }}
      style={{ cursor: 'pointer' }}
    >
      {/* Shadow */}
      <rect x={1} y={1} width={CARD_W} height={CARD_H} rx={6} fill="rgba(0,0,0,0.08)" />

      {/* Card background */}
      <rect width={CARD_W} height={CARD_H} rx={6}
        fill={bgColor}
        stroke={borderColor}
        strokeWidth={isSelected ? 2.5 : 1.5}
      />

      {/* Color accent bar (position cards only) */}
      {!isStructural && (
        <rect x={0} y={0} width={CARD_W} height={4} rx={6} fill={color} />
      )}

      {/* Position title */}
      <text x={10} y={18} fontSize="9px" fontWeight="700" fill={titleColor}
        fontFamily="Raleway, sans-serif" textAnchor="start">
        {truncate(node.title, 22)}
      </text>

      {/* Employee name */}
      <text x={10} y={37} fontSize="8.5px" fontWeight={isVacant ? '400' : '600'}
        fill={nameColor} fontStyle={isVacant ? 'italic' : 'normal'}
        fontFamily="Open Sans, sans-serif">
        {truncate(node.employee || '(Vacant)', 24)}
      </text>

      {/* Department */}
      <text x={10} y={54} fontSize="7.5px" fill={deptColor}
        fontFamily="Open Sans, sans-serif">
        {truncate(node.dept, 26)}
      </text>

      {/* Status indicators */}
      <g>
        {isPartTime && (
          <text x={CARD_W - 40} y={70} fontSize="6px" fontWeight="700" fill="#8b5cf6"
            fontFamily="Open Sans, sans-serif">
            Part-Time
          </text>
        )}
        {isContracted && (
          <text x={CARD_W - 45} y={70} fontSize="6px" fontWeight="700" fill="#06b6d4"
            fontFamily="Open Sans, sans-serif">
            Contract
          </text>
        )}
        {isVacant && (
          <circle cx={CARD_W - 12} cy={10} r={3} fill="#f59e0b" stroke="white" strokeWidth={1} />
        )}
      </g>

      {/* Expand/collapse button */}
      {hasChildren && (
        <g
          onClick={(e) => { e.stopPropagation(); onToggle(node.id); }}
          style={{ cursor: 'pointer' }}
        >
          <rect x={CARD_W - 22} y={CARD_H - 20} width={18} height={18} rx={3}
            fill="#f3f4f6" stroke="#d1d5db" strokeWidth={0.5} />
          <text x={CARD_W - 13} y={CARD_H - 11} textAnchor="middle" dominantBaseline="middle"
            fontSize="11px" fontWeight="700" fill="#6b7280">
            {node.expanded ? '−' : '+'}
          </text>
        </g>
      )}
    </g>
  );
}

// Main professional org chart component
export default function ProfessionalOrgChart({ roots, selectedId, onSelect, showGovernance = false }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const [expandedIds, setExpandedIds] = useState({});
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [dragging, setDragging] = useState(null);

  // Get focus node (Town Manager for operational, Residents for governance)
  const focusNode = useMemo(() => {
    if (!roots || roots.length === 0) return null;

    if (showGovernance) {
      return roots.find(r => r.id === 'residents') || roots[0];
    }

    // Find Town Manager in operational view
    const findTownManager = (node) => {
      if (node.id === 'town_manager') return node;
      if (!node.children) return null;
      for (const child of node.children) {
        const result = findTownManager(child);
        if (result) return result;
      }
      return null;
    };

    return findTownManager(roots[0]);
  }, [roots, showGovernance]);

  // Build expanded node tree
  const nodeTreeWithExpanded = useMemo(() => {
    if (!focusNode) return null;

    const buildTree = (node) => {
      const hasChildren = node.children && node.children.length > 0;
      const isExpanded = expandedIds[node.id] !== false; // default expanded

      return {
        ...node,
        expanded: isExpanded,
        children: hasChildren && isExpanded
          ? node.children.map(buildTree)
          : [],
      };
    };

    return buildTree(focusNode);
  }, [focusNode, expandedIds]);

  // Layout the chart
  const { nodes, edges, svgWidth, svgHeight } = useMemo(() => {
    if (!nodeTreeWithExpanded) return { nodes: [], edges: [], svgWidth: 0, svgHeight: 0 };

    const { nodes: layoutNodes, edges: layoutEdges, bounds } = layoutOrgChart(nodeTreeWithExpanded, expandedIds);

    return {
      nodes: layoutNodes,
      edges: layoutEdges,
      svgWidth: bounds.width,
      svgHeight: bounds.height,
    };
  }, [nodeTreeWithExpanded, expandedIds]);

  // Toggle node expansion
  const toggleNode = useCallback((nodeId) => {
    setExpandedIds(prev => ({
      ...prev,
      [nodeId]: prev[nodeId] === false ? true : false,
    }));
  }, []);

  // Auto-fit on load
  useEffect(() => {
    if (!containerRef.current || svgWidth <= 0 || svgHeight <= 0) return;

    const cw = containerRef.current.clientWidth || 1200;
    const ch = containerRef.current.clientHeight || 800;
    const pad = 60;

    const scaleX = (cw - pad * 2) / svgWidth;
    const scaleY = (ch - pad * 2) / svgHeight;
    const s = Math.min(scaleX, scaleY, 1.0);
    const finalScale = Math.max(0.5, s);

    const cx = (cw - svgWidth * finalScale) / 2;
    const cy = (ch - svgHeight * finalScale) / 2;

    setScale(finalScale);
    setPan({ x: cx, y: cy });
  }, [svgWidth, svgHeight]);

  // Zoom with wheel
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const handler = (e) => {
      e.preventDefault();
      setScale(s => Math.max(0.3, Math.min(3, s * (e.deltaY < 0 ? 1.15 : 0.87))));
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, []);

  // Pan
  const onMouseDown = useCallback((e) => {
    setDragging({ sx: e.clientX - pan.x, sy: e.clientY - pan.y });
  }, [pan]);

  const onMouseMove = useCallback((e) => {
    if (!dragging) return;
    setPan({ x: e.clientX - dragging.sx, y: e.clientY - dragging.sy });
  }, [dragging]);

  const onMouseUp = useCallback(() => setDragging(null), []);

  if (!nodes.length) {
    return <div className="flex items-center justify-center h-full text-slate-400 text-sm">No data</div>;
  }

  // Collect all visible nodes for rendering
  const allVisibleNodes = [];
  const collectVisible = (node) => {
    allVisibleNodes.push(node);
    if (node.children && node.children.length > 0) {
      node.children.forEach(collectVisible);
    }
  };
  if (nodeTreeWithExpanded) {
    collectVisible(nodeTreeWithExpanded);
  }

  return (
    <div ref={containerRef} style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#fafafa' }}>
      {/* Zoom controls */}
      <div className="absolute top-4 right-4 z-20 flex gap-1 rounded-lg bg-white border border-slate-200 shadow-sm p-1.5">
        <button
          onClick={() => setScale(s => Math.min(3, s * 1.2))}
          title="Zoom in"
          className="h-8 w-8 flex items-center justify-center rounded border border-slate-100 hover:bg-slate-50 text-sm font-bold text-slate-600"
        >
          +
        </button>
        <button
          onClick={() => setScale(s => Math.max(0.3, s / 1.2))}
          title="Zoom out"
          className="h-8 w-8 flex items-center justify-center rounded border border-slate-100 hover:bg-slate-50 text-sm font-bold text-slate-600"
        >
          −
        </button>
        <div className="w-px bg-slate-200" />
        <button
          onClick={() => {
            if (containerRef.current) {
              const cw = containerRef.current.clientWidth;
              const ch = containerRef.current.clientHeight;
              const s = Math.min((cw - 120) / svgWidth, (ch - 120) / svgHeight, 1);
              const finalScale = Math.max(0.5, s);
              setPan({ x: (cw - svgWidth * finalScale) / 2, y: (ch - svgHeight * finalScale) / 2 });
              setScale(finalScale);
            }
          }}
          title="Fit to view"
          className="h-8 w-8 flex items-center justify-center rounded border border-slate-100 hover:bg-slate-50 text-sm font-bold text-slate-600"
        >
          ⊡
        </button>
        <div className="text-[9px] text-slate-400 px-2 py-1 whitespace-nowrap font-mono">
          {Math.round(scale * 100)}%
        </div>
      </div>

      <svg
        ref={svgRef}
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
          transformOrigin: '0 0',
          cursor: dragging ? 'grabbing' : 'grab',
          userSelect: 'none',
        }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onClick={() => onSelect(null)}
      >
        {/* Connector lines */}
        {edges.map((e, i) => (
          <OrthoConnector key={i} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} />
        ))}

        {/* Cards */}
        {allVisibleNodes.map(node => (
          <OrgCard
            key={node.id}
            node={node}
            isSelected={selectedId === node.id}
            onSelect={onSelect}
            hasChildren={node.children && node.children.length > 0}
            onToggle={toggleNode}
          />
        ))}
      </svg>
    </div>
  );
}