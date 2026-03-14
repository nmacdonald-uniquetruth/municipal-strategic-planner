import React, { useRef, useState, useMemo, useCallback, useEffect } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { DEPT_COLORS } from './OrgChartData';

const CARD_W = 200;
const CARD_H = 75;
const V_GAP = 100;
const H_GAP = 50;
const BRANCH_GAP = 90;

// Measure and position nodes in a strict top-down hierarchical layout
function measureAndLayout(node, x = 0, y = 0, isExpanded = {}, byId = {}) {
  const expanded = isExpanded[node.id] !== false; // default expanded
  
  let childCount = 0;
  let totalWidth = 0;

  if (expanded && node.children && node.children.length > 0) {
    node.children.forEach((child) => {
      const { width: cw } = measureAndLayout(child, 0, 0, isExpanded, byId);
      totalWidth += cw;
      childCount++;
    });
    totalWidth += Math.max(0, (childCount - 1) * H_GAP);
  }

  const nodeWidth = Math.max(CARD_W, totalWidth);
  node.x = x + nodeWidth / 2 - CARD_W / 2;
  node.y = y;
  node.expanded = expanded;
  node.displayChildren = expanded ? node.children : [];

  if (expanded && node.displayChildren.length > 0) {
    const childTotalWidth = node.displayChildren.reduce((s, c) => s + (byId[c.id]?.width || CARD_W), 0);
    const childTotalGap = Math.max(0, (node.displayChildren.length - 1) * H_GAP);
    const childrenAreaWidth = childTotalWidth + childTotalGap;
    const startX = x + nodeWidth / 2 - childrenAreaWidth / 2;

    let nextX = startX;
    node.displayChildren.forEach((child) => {
      const childNode = byId[child.id];
      const childWidth = childNode?.width || CARD_W;
      measureAndLayout(childNode, nextX, y + CARD_H + V_GAP, isExpanded, byId);
      nextX += childWidth + H_GAP;
    });
  }

  node.width = nodeWidth;
  return node;
}

// Build edges for connectors
function buildEdges(node, edges = []) {
  if (node.displayChildren && node.displayChildren.length > 0) {
    const parentX = node.x + CARD_W / 2;
    const parentY = node.y + CARD_H;

    node.displayChildren.forEach((child) => {
      const childX = child.x + CARD_W / 2;
      const childY = child.y;
      edges.push({ parentX, parentY, childX, childY });
      buildEdges(child, edges);
    });
  }
  return edges;
}

// Card component
function OrgCard({ node, isSelected, onSelect, onToggle }) {
  const hasChildren = node.children && node.children.length > 0;
  const isStructural = node.nodeType === 'structural';
  const isVacant = !isStructural && node.status === 'vacant';
  const isPartTime = !isStructural && !node.fullTime;
  const isContracted = !isStructural && node.contracted;

  const color = DEPT_COLORS[node.dept] || '#344A60';

  let fillColor = '#ffffff';
  let borderColor = '#e2e8f0';
  let borderWidth = 1.5;
  let textColor = '#1f2937';
  let nameColor = '#374151';
  let deptColor = '#9ca3af';

  if (isStructural) {
    fillColor = color;
    borderColor = color;
    textColor = '#ffffff';
    nameColor = 'rgba(255,255,255,0.9)';
    deptColor = 'rgba(255,255,255,0.7)';
  } else if (isSelected) {
    borderColor = '#3b82f6';
    borderWidth = 2.5;
  } else if (isVacant) {
    fillColor = '#f5f5f5';
    borderColor = '#f59e0b';
  }

  const truncate = (text, len) => {
    if (!text) return '';
    return text.length > len ? text.slice(0, len - 1) + '…' : text;
  };

  return (
    <g transform={`translate(${node.x},${node.y})`} onClick={(e) => { e.stopPropagation(); onSelect(node); }} style={{ cursor: 'pointer' }}>
      {/* Shadow */}
      <rect x={1} y={1} width={CARD_W} height={CARD_H} rx={6} fill="rgba(0,0,0,0.06)" />

      {/* Card body */}
      <rect width={CARD_W} height={CARD_H} rx={6} fill={fillColor} stroke={borderColor} strokeWidth={borderWidth} />

      {/* Colored accent bar (position cards only) */}
      {!isStructural && (
        <rect x={0} y={0} width={CARD_W} height={3} rx={6} fill={color} />
      )}

      {/* Content */}
      <text x={10} y={16} fontSize="9px" fontWeight="700" fill={textColor} fontFamily="Raleway, sans-serif">
        {truncate(node.title, 26)}
      </text>

      <text x={10} y={33} fontSize="8.5px" fontWeight={isVacant ? '400' : '600'} fill={nameColor}
        fontStyle={isVacant ? 'italic' : 'normal'} fontFamily="Open Sans, sans-serif">
        {truncate(node.employee || '(Vacant)', 26)}
      </text>

      <text x={10} y={51} fontSize="7.5px" fill={deptColor} fontFamily="Open Sans, sans-serif">
        {truncate(node.dept, 28)}
      </text>

      {/* Status indicators */}
      <g>
        {isPartTime && (
          <text x={CARD_W - 50} y={65} fontSize="6px" fontWeight="700" fill="#8b5cf6" fontFamily="Open Sans, sans-serif">
            PT
          </text>
        )}
        {isContracted && (
          <text x={CARD_W - 35} y={65} fontSize="6px" fontWeight="700" fill="#06b6d4" fontFamily="Open Sans, sans-serif">
            Contract
          </text>
        )}
        {isVacant && (
          <circle cx={CARD_W - 12} cy={10} r={3} fill="#f59e0b" stroke="white" strokeWidth={1} />
        )}
      </g>

      {/* Expand/Collapse toggle */}
      {hasChildren && (
        <g onClick={(e) => { e.stopPropagation(); onToggle(node.id); }} style={{ cursor: 'pointer' }}>
          <rect x={CARD_W - 18} y={CARD_H - 18} width={16} height={16} rx={3} fill="#f3f4f6" stroke="#d1d5db" strokeWidth={0.5} />
          <text x={CARD_W - 10} y={CARD_H - 9} textAnchor="middle" dominantBaseline="middle" fontSize="10px" fill="#6b7280" fontWeight="700">
            {node.expanded ? '−' : '+'}
          </text>
        </g>
      )}
    </g>
  );
}

// Connector line
function ConnectorPath({ parentX, parentY, childX, childY }) {
  const d = `M${parentX},${parentY} L${parentX},${parentY + 30} L${childX},${childY - 30} L${childX},${childY}`;
  return <path d={d} fill="none" stroke="#cbd5e1" strokeWidth="1.5" />;
}

// Main canvas component
export default function LucidChartStyleCanvas({ roots, selectedId, onSelect, showGovernance = false }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [expandedIds, setExpandedIds] = useState({});
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [dragging, setDragging] = useState(null);

  // Get focus node
  const focusNode = useMemo(() => {
    if (!roots || roots.length === 0) return null;

    if (showGovernance) {
      return roots.find(r => r.id === 'residents') || roots[0];
    }

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

  // Layout tree
  const { allNodes, edges, bounds } = useMemo(() => {
    if (!focusNode) return { allNodes: [], edges: [], bounds: null };

    const byId = {};
    const collect = (node) => {
      byId[node.id] = node;
      if (node.children) node.children.forEach(collect);
    };
    collect(focusNode);

    // First pass: measure widths (unexpanded)
    const firstPass = (node) => {
      node.width = CARD_W;
      if (node.children && expandedIds[node.id] !== false) {
        let totalW = 0;
        node.children.forEach(child => {
          totalW += firstPass(child);
        });
        totalW += Math.max(0, (node.children.length - 1) * H_GAP);
        node.width = Math.max(CARD_W, totalW);
      }
      return node.width;
    };
    firstPass(focusNode);

    // Layout from root
    const layoutNode = measureAndLayout(focusNode, 100, 40, expandedIds, byId);

    // Collect all visible nodes
    const visibleNodes = [];
    const collectVisible = (node) => {
      visibleNodes.push(node);
      if (node.displayChildren) {
        node.displayChildren.forEach(collectVisible);
      }
    };
    collectVisible(layoutNode);

    // Build edges
    const allEdges = [];
    buildEdges(layoutNode, allEdges);

    // Calculate bounds
    const xs = visibleNodes.map(n => n.x);
    const ys = visibleNodes.map(n => n.y);
    const minX = Math.min(...xs) - 20;
    const minY = Math.min(...ys) - 20;
    const maxX = Math.max(...xs) + CARD_W + 20;
    const maxY = Math.max(...ys) + CARD_H + 20;

    return {
      allNodes: visibleNodes,
      edges: allEdges,
      bounds: { minX, minY, width: maxX - minX, height: maxY - minY },
    };
  }, [focusNode, expandedIds]);

  // Toggle node expansion
  const toggleNode = useCallback((nodeId) => {
    setExpandedIds(prev => ({
      ...prev,
      [nodeId]: prev[nodeId] === false ? true : false,
    }));
  }, []);

  // Auto-fit on first render
  useEffect(() => {
    if (!containerRef.current || !bounds || bounds.width <= 0 || bounds.height <= 0) return;

    const cw = containerRef.current.clientWidth || 1200;
    const ch = containerRef.current.clientHeight || 800;
    const pad = 60;

    const scaleX = (cw - pad * 2) / bounds.width;
    const scaleY = (ch - pad * 2) / bounds.height;
    const s = Math.min(scaleX, scaleY, 1.0);
    const clampedScale = Math.max(0.5, s);

    const cx = (cw - bounds.width * clampedScale) / 2;
    const cy = (ch - bounds.height * clampedScale) / 2;

    setScale(clampedScale);
    setPan({ x: cx, y: cy });
  }, [bounds]);

  // Zoom
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

  if (!allNodes.length) {
    return <div className="flex items-center justify-center h-full text-slate-400">No data to display</div>;
  }

  const svgW = bounds?.width || 1000;
  const svgH = bounds?.height || 700;

  return (
    <div ref={containerRef} style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#fafafa' }}>
      {/* Zoom controls */}
      <div className="absolute top-4 right-4 z-20 flex gap-1 rounded-lg bg-white border border-slate-200 shadow-sm p-1.5">
        <button onClick={() => setScale(s => Math.min(3, s * 1.2))} className="h-8 w-8 flex items-center justify-center rounded border border-slate-100 hover:bg-slate-50 text-sm font-bold text-slate-600">+</button>
        <button onClick={() => setScale(s => Math.max(0.3, s / 1.2))} className="h-8 w-8 flex items-center justify-center rounded border border-slate-100 hover:bg-slate-50 text-sm font-bold text-slate-600">−</button>
        <div className="w-px bg-slate-200" />
        <button
          onClick={() => {
            if (bounds && containerRef.current) {
              const cw = containerRef.current.clientWidth;
              const ch = containerRef.current.clientHeight;
              const s = Math.min((cw - 120) / bounds.width, (ch - 120) / bounds.height, 1);
              const clamp = Math.max(0.5, s);
              setPan({ x: (cw - bounds.width * clamp) / 2, y: (ch - bounds.height * clamp) / 2 });
              setScale(clamp);
            }
          }}
          className="h-8 w-8 flex items-center justify-center rounded border border-slate-100 hover:bg-slate-50 text-sm font-bold text-slate-600"
        >
          ⊡
        </button>
        <div className="text-[9px] text-slate-400 px-2 py-1 whitespace-nowrap font-mono">{Math.round(scale * 100)}%</div>
      </div>

      <svg
        ref={svgRef}
        width={svgW}
        height={svgH}
        viewBox={`0 0 ${svgW} ${svgH}`}
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
        {/* Connectors */}
        {edges.map((e, i) => (
          <ConnectorPath key={i} parentX={e.parentX} parentY={e.parentY} childX={e.childX} childY={e.childY} />
        ))}

        {/* Nodes */}
        {allNodes.map(node => (
          <OrgCard
            key={node.id}
            node={node}
            isSelected={selectedId === node.id}
            onSelect={onSelect}
            onToggle={toggleNode}
          />
        ))}
      </svg>
    </div>
  );
}