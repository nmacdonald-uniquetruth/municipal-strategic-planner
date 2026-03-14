import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { DEPT_COLORS } from './OrgChartData';

const NODE_W = 200;
const NODE_H = 80;
const V_SPACING = 160;
const H_SPACING = 240;

// Assign each node to its hierarchy level
function assignLevels(nodes) {
  const byId = {};
  nodes.forEach(n => { byId[n.id] = { ...n, level: -1, children: [] }; });

  // Build parent->children relationships
  nodes.forEach(n => {
    const node = byId[n.id];
    if (n.reportsTo && byId[n.reportsTo]) {
      byId[n.reportsTo].children.push(node);
    }
  });

  // BFS to assign levels from roots
  const roots = [];
  const queue = [];
  
  nodes.forEach(n => {
    if (!n.reportsTo) {
      const node = byId[n.id];
      node.level = 0;
      roots.push(node);
      queue.push(node);
    }
  });

  while (queue.length > 0) {
    const node = queue.shift();
    node.children.forEach(child => {
      child.level = node.level + 1;
      queue.push(child);
    });
  }

  return { nodesById: byId, roots };
}

// Position nodes in grid: level determines row, siblings centered under parent
function calculatePositions(roots) {
  const positioned = {};

  function positionSubtree(node, centerX, yOffset) {
    node.y = yOffset;
    node.x = centerX;
    positioned[node.id] = { x: centerX, y: yOffset };

    if (!node.children || node.children.length === 0) return;

    const totalWidth = node.children.length * H_SPACING;
    let startX = centerX - totalWidth / 2 + H_SPACING / 2;

    node.children.forEach((child, i) => {
      const childX = startX + i * H_SPACING;
      positionSubtree(child, childX, yOffset + V_SPACING);
    });
  }

  // Position all roots horizontally, starting from left
  let nextX = 100;
  roots.forEach(root => {
    positionSubtree(root, nextX, 40);
    nextX += 600; // spacing between root branches
  });

  return positioned;
}

// Collect visible nodes and connection lines
function collectRenderData(node, positioned, nodes, edges) {
  nodes.push(node);

  if (!node.children || node.children.length === 0) return;

  node.children.forEach(child => {
    edges.push({
      x1: node.x + NODE_W / 2,
      y1: node.y + NODE_H,
      x2: child.x + NODE_W / 2,
      y2: child.y,
    });
    collectRenderData(child, positioned, nodes, edges);
  });
}

// Connection line
function ConnectorLine({ edge }) {
  const d = `M${edge.x1},${edge.y1} L${edge.x1},${edge.y1 + 40} L${edge.x2},${edge.y2 - 40} L${edge.x2},${edge.y2}`;
  return <path d={d} fill="none" stroke="#cbd5e1" strokeWidth={2} />;
}

// Org node card
function OrgNode({ node, selectedId, onSelect }) {
  const isSelected = selectedId === node.id;
  const isStructural = node.nodeType === 'structural';
  const isVacant = !isStructural && node.status === 'vacant';
  const color = DEPT_COLORS[node.dept] || DEPT_COLORS.Governance;
  
  const cardFill = isStructural ? color : (isVacant ? '#fffbeb' : '#ffffff');
  const borderColor = isSelected ? '#3b82f6' : isStructural ? color : (isVacant ? '#fcd34d' : '#e5e7eb');
  const borderW = isSelected ? 2.5 : 1.5;

  const trunc = (text, maxLen) => text && text.length > maxLen ? text.slice(0, maxLen - 1) + '…' : (text || '');

  return (
    <g
      transform={`translate(${node.x},${node.y})`}
      style={{ cursor: 'pointer' }}
      onClick={e => { e.stopPropagation(); onSelect(node); }}
    >
      {/* Shadow */}
      <rect x={2} y={3} width={NODE_W} height={NODE_H} rx={10} fill="rgba(0,0,0,0.12)" />

      {/* Card body */}
      <rect width={NODE_W} height={NODE_H} rx={10}
        fill={cardFill} stroke={borderColor} strokeWidth={borderW}
      />

      {/* Content */}
      {isStructural ? (
        // Structural node: full color background
        <>
          <rect x={0} y={0} width={NODE_W} height={NODE_H} rx={10} fill={color} />
          <text x={NODE_W / 2} y={32} textAnchor="middle"
            fontSize={11} fontWeight="700" fill="#ffffff"
            style={{ fontFamily: 'Raleway, sans-serif' }}>
            {trunc(node.title, 26)}
          </text>
          <text x={NODE_W / 2} y={53} textAnchor="middle"
            fontSize={8} fill="rgba(255,255,255,0.75)"
            style={{ fontFamily: 'Open Sans, sans-serif' }}>
            {trunc(node.dept, 28)}
          </text>
        </>
      ) : (
        // Position node: colored header bar
        <>
          {/* Thin header accent */}
          <rect x={0} y={0} width={NODE_W} height={5} rx={10} fill={color} />

          {/* Title */}
          <text x={8} y={17} fontSize={9.5} fontWeight="700" fill="#1f2937"
            style={{ fontFamily: 'Raleway, sans-serif' }}>
            {trunc(node.title, 26)}
          </text>

          {/* Employee name or vacant */}
          <text x={8} y={37}
            fontSize={8.5} fontWeight={isVacant ? '400' : '600'}
            fill={isVacant ? '#b45309' : '#374151'}
            fontStyle={isVacant ? 'italic' : 'normal'}
            style={{ fontFamily: 'Open Sans, sans-serif' }}>
            {trunc(node.employee || '(Vacant)', 24)}
          </text>

          {/* Department */}
          <text x={8} y={54} fontSize={7.5} fill="#9ca3af"
            style={{ fontFamily: 'Open Sans, sans-serif' }}>
            {trunc(node.dept, 26)}
          </text>

          {/* Status indicator dot */}
          <circle cx={NODE_W - 12} cy={10} r={4}
            fill={isVacant ? '#f59e0b' : '#10b981'}
            stroke="white" strokeWidth={1.5}
          />
        </>
      )}
    </g>
  );
}

// Main canvas
export default function OrgHierarchicalCanvas({ roots, selectedId, onSelect }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [dragging, setDragging] = useState(null);

  // Calculate layout
  const { nodes, edges, bounds } = useMemo(() => {
    if (!roots || roots.length === 0) return { nodes: [], edges: [], bounds: null };

    // Assign levels
    const { nodesById, roots: processedRoots } = assignLevels(roots);

    // Position nodes
    const positioned = calculatePositions(processedRoots);

    // Collect render data
    const allNodes = [];
    const allEdges = [];
    processedRoots.forEach(root => collectRenderData(root, positioned, allNodes, allEdges));

    // Calculate bounds
    const xs = allNodes.map(n => n.x);
    const ys = allNodes.map(n => n.y);
    const minX = Math.min(...xs) - 50;
    const minY = Math.min(...ys) - 50;
    const maxX = Math.max(...xs) + NODE_W + 50;
    const maxY = Math.max(...ys) + NODE_H + 50;

    return {
      nodes: allNodes,
      edges: allEdges,
      bounds: { minX, minY, width: maxX - minX, height: maxY - minY },
    };
  }, [roots]);

  // Auto-fit on mount
  const fitView = useCallback(() => {
    if (!containerRef.current || !bounds || bounds.width <= 0 || bounds.height <= 0) return;

    const cw = containerRef.current.clientWidth || 1000;
    const ch = containerRef.current.clientHeight || 600;
    const pad = 60;

    // Calculate scale to fit
    const scaleX = (cw - pad * 2) / bounds.width;
    const scaleY = (ch - pad * 2) / bounds.height;
    const s = Math.min(scaleX, scaleY, 1.0); // Don't zoom in
    const clampedScale = Math.max(0.4, s);

    // Center
    const cx = (cw - bounds.width * clampedScale) / 2 - bounds.minX * clampedScale;
    const cy = (ch - bounds.height * clampedScale) / 2 - bounds.minY * clampedScale;

    setScale(clampedScale);
    setPan({ x: cx, y: cy });
  }, [bounds]);

  useEffect(() => {
    const t = requestAnimationFrame(() => fitView());
    return () => cancelAnimationFrame(t);
  }, [fitView]);

  // Wheel zoom
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const handler = (e) => {
      e.preventDefault();
      setScale(s => Math.max(0.3, Math.min(2.0, s * (e.deltaY < 0 ? 1.15 : 0.87))));
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, []);

  // Pan with mouse
  const onMouseDown = useCallback((e) => {
    setDragging({ sx: e.clientX - pan.x, sy: e.clientY - pan.y });
  }, [pan]);

  const onMouseMove = useCallback((e) => {
    if (!dragging) return;
    setPan({ x: e.clientX - dragging.sx, y: e.clientY - dragging.sy });
  }, [dragging]);

  const onMouseUp = useCallback(() => setDragging(null), []);

  if (!nodes.length) {
    return <div className="flex items-center justify-center h-full text-slate-400 text-sm">No positions to display</div>;
  }

  return (
    <div ref={containerRef} style={{ position: 'absolute', inset: 0 }}>
      {/* Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-1.5 rounded-xl bg-white border border-slate-200 shadow-md p-1.5">
        <button
          onClick={() => setScale(s => Math.min(2.0, s * 1.2))}
          title="Zoom in"
          className="h-8 w-8 rounded-lg bg-white border border-slate-100 shadow-sm text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 flex items-center justify-center transition-all"
        >
          +
        </button>
        <button
          onClick={() => setScale(s => Math.max(0.3, s / 1.2))}
          title="Zoom out"
          className="h-8 w-8 rounded-lg bg-white border border-slate-100 shadow-sm text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 flex items-center justify-center transition-all"
        >
          −
        </button>
        <button
          onClick={fitView}
          title="Fit view"
          className="h-8 w-8 rounded-lg bg-white border border-slate-100 shadow-sm text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 flex items-center justify-center transition-all"
        >
          ⊡
        </button>
        <div className="text-center text-[9px] text-slate-400 pt-0.5 font-mono">
          {Math.round(scale * 100)}%
        </div>
      </div>

      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        style={{ display: 'block', cursor: dragging ? 'grabbing' : 'grab', userSelect: 'none' }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onClick={() => onSelect(null)}
      >
        <g transform={`translate(${pan.x},${pan.y}) scale(${scale})`}>
          {/* Connector lines */}
          {edges.map((e, i) => (
            <ConnectorLine key={i} edge={e} />
          ))}

          {/* Nodes */}
          {nodes.map(n => (
            <OrgNode
              key={n.id}
              node={n}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}