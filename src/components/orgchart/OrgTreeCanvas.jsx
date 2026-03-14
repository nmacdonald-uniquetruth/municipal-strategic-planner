import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { DEPT_COLORS } from './OrgChartData';

const NODE_W = 200;
const NODE_H = 80;
const H_GAP = 24;
const V_GAP = 60;

// Assign subtree widths for layout
function assignWidths(node) {
  const visible = (node.children || []).filter(c => !node._collapsed);
  if (!visible.length) { node._sw = NODE_W; return; }
  visible.forEach(assignWidths);
  const total = visible.reduce((s, c) => s + c._sw, 0) + H_GAP * (visible.length - 1);
  node._sw = Math.max(NODE_W, total);
}

// Position nodes in 2D space
function assignPositions(node, x, y) {
  node._x = x;
  node._y = y;
  const visible = (node.children || []).filter(c => !node._collapsed);
  if (!visible.length) return;
  const totalW = visible.reduce((s, c) => s + c._sw, 0) + H_GAP * (visible.length - 1);
  let cx = x + NODE_W / 2 - totalW / 2;
  visible.forEach(child => {
    assignPositions(child, cx, y + NODE_H + V_GAP);
    cx += child._sw + H_GAP;
  });
}

// Collect all visible nodes and edges
function collectAll(node, nodes, edges) {
  nodes.push(node);
  if (!node.children || node._collapsed) return;
  node.children.forEach(child => {
    edges.push({
      x1: node._x + NODE_W / 2,
      y1: node._y + NODE_H,
      x2: child._x + NODE_W / 2,
      y2: child._y,
    });
    collectAll(child, nodes, edges);
  });
}

// Org node card
function OrgNode({ node, selectedId, onSelect, onToggle }) {
  const isSelected = selectedId === node.id;
  const isStructural = node.nodeType === 'structural';
  const isVacant = !isStructural && node.status === 'vacant';
  const color = DEPT_COLORS[node.dept] || DEPT_COLORS.Governance;
  const hasChildren = node.children && node.children.length > 0;

  const R = 10;
  const cardFill = isStructural ? color : (isVacant ? '#fffbeb' : '#ffffff');
  const borderColor = isSelected ? '#3b82f6' : isStructural ? color : (isVacant ? '#fcd34d' : '#e5e7eb');
  const borderW = isSelected ? 2.5 : 1.5;
  const textColor = isStructural ? '#ffffff' : '#1f2937';

  const trunc = (text, maxLen) => text && text.length > maxLen ? text.slice(0, maxLen - 1) + '…' : (text || '');

  return (
    <g
      transform={`translate(${node._x},${node._y})`}
      style={{ cursor: 'pointer' }}
      onClick={e => { e.stopPropagation(); onSelect(node); }}
    >
      {/* Shadow */}
      <rect x={2} y={3} width={NODE_W} height={NODE_H} rx={R} fill="rgba(0,0,0,0.12)" />

      {/* Card body */}
      <rect width={NODE_W} height={NODE_H} rx={R}
        fill={cardFill} stroke={borderColor} strokeWidth={borderW}
      />

      {/* Header bar (structural: full color, position: thin accent) */}
      {isStructural ? (
        <>
          <rect x={0} y={0} width={NODE_W} height={NODE_H} rx={R} fill={color} />
          <text x={NODE_W / 2} y={30} textAnchor="middle"
            fontSize={11} fontWeight="700" fill="#ffffff"
            style={{ fontFamily: 'Raleway, sans-serif' }}>
            {trunc(node.title, 28)}
          </text>
          <text x={NODE_W / 2} y={52} textAnchor="middle"
            fontSize={8.5} fill="rgba(255,255,255,0.7)"
            style={{ fontFamily: 'Open Sans, sans-serif' }}>
            {trunc(node.dept, 30)}
          </text>
        </>
      ) : (
        <>
          {/* Thin header accent */}
          <rect x={0} y={0} width={NODE_W} height={4} rx={R} fill={color} />

          {/* Title */}
          <text x={8} y={17} fontSize={9.5} fontWeight="700" fill={textColor}
            style={{ fontFamily: 'Raleway, sans-serif' }}>
            {trunc(node.title, 28)}
          </text>

          {/* Employee name or vacant */}
          <text x={8} y={37}
            fontSize={8.5} fontWeight={isVacant ? '400' : '600'}
            fill={isVacant ? '#b45309' : '#374151'}
            fontStyle={isVacant ? 'italic' : 'normal'}
            style={{ fontFamily: 'Open Sans, sans-serif' }}>
            {trunc(node.employee || '(Vacant)', 26)}
          </text>

          {/* Department */}
          <text x={8} y={53} fontSize={7.5} fill="#9ca3af"
            style={{ fontFamily: 'Open Sans, sans-serif' }}>
            {node.dept}
          </text>

          {/* Status badges */}
          {node.isUnion && (
            <>
              <rect x={8} y={56} width={24} height={10} rx={3} fill="#f3e8ff" />
              <text x={20} y={63} textAnchor="middle" fontSize={7} fill="#6b21a8" fontWeight="700">U</text>
            </>
          )}
          {!node.fullTime && (
            <>
              <rect x={node.isUnion ? 36 : 8} y={56} width={16} height={10} rx={3} fill="#f1f5f9" />
              <text x={(node.isUnion ? 36 : 8) + 8} y={63} textAnchor="middle" fontSize={7} fill="#64748b" fontWeight="600">PT</text>
            </>
          )}

          {/* Status indicator dot */}
          <circle cx={NODE_W - 10} cy={10} r={4}
            fill={isVacant ? '#f59e0b' : '#10b981'}
            stroke="white" strokeWidth={1.5}
          />
        </>
      )}

      {/* Collapse toggle for parents */}
      {hasChildren && (
        <g transform={`translate(${NODE_W / 2 - 8}, ${NODE_H - 10})`}
          onClick={e => { e.stopPropagation(); onToggle(node.id); }}
          style={{ cursor: 'pointer' }}>
          <circle cx={8} cy={8} r={7} fill="#334155" stroke="white" strokeWidth={1.5} />
          <text x={8} y={11.5} textAnchor="middle" fontSize={9} fill="white" fontWeight="bold">
            {node._collapsed ? '+' : '−'}
          </text>
        </g>
      )}
    </g>
  );
}

// Connector line
function OrgEdge({ edge }) {
  const d = `M${edge.x1},${edge.y1} C${edge.x1},${edge.y1 + 30} ${edge.x2},${edge.y2 - 30} ${edge.x2},${edge.y2}`;
  return <path d={d} fill="none" stroke="#cbd5e1" strokeWidth={1.5} />;
}

// Main canvas
export default function OrgTreeCanvas({ roots, selectedId, onSelect, view = 'tree' }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [dragging, setDragging] = useState(null);
  const [collapsed, setCollapsed] = useState({});

  const applyCollapsed = useCallback((nodes) =>
    nodes.map(n => ({
      ...n,
      _collapsed: !!collapsed[n.id],
      children: n.children ? applyCollapsed(n.children) : [],
    })), [collapsed]);

  const processedRoots = useMemo(() => applyCollapsed(roots), [roots, applyCollapsed]);

  // Calculate layout
  const { nodes, edges, vb } = useMemo(() => {
    if (!processedRoots.length) return { nodes: [], edges: [], vb: { minX: 0, minY: 0, w: 800, h: 600 } };
    
    processedRoots.forEach(assignWidths);
    let cx = 40;
    processedRoots.forEach(r => { assignPositions(r, cx, 40); cx += r._sw + 100; });
    
    const allNodes = [], allEdges = [];
    processedRoots.forEach(r => collectAll(r, allNodes, allEdges));
    
    const xs = allNodes.map(n => n._x);
    const ys = allNodes.map(n => n._y);
    const minX = Math.min(...xs) - 30;
    const minY = Math.min(...ys) - 30;
    const maxX = Math.max(...xs) + NODE_W + 30;
    const maxY = Math.max(...ys) + NODE_H + 30;
    
    return {
      nodes: allNodes, edges: allEdges,
      vb: { minX, minY, w: maxX - minX, h: maxY - minY },
    };
  }, [processedRoots]);

  // Auto-fit on mount
  const fitView = useCallback(() => {
    const c = containerRef.current;
    if (!c || vb.w <= 0 || vb.h <= 0) return;
    const cw = c.clientWidth || 800;
    const ch = c.clientHeight || 600;
    const pad = 40;
    const s = Math.min((cw - pad * 2) / vb.w, (ch - pad * 2) / vb.h, 1.2);
    const clampedScale = Math.max(0.2, Math.min(s, 1.5));
    const cx = (cw - vb.w * clampedScale) / 2 - vb.minX * clampedScale;
    const cy = (ch - vb.h * clampedScale) / 2 - vb.minY * clampedScale;
    setScale(clampedScale);
    setPan({ x: cx, y: cy });
  }, [vb]);

  useEffect(() => {
    const t1 = requestAnimationFrame(() => {
      const t2 = requestAnimationFrame(fitView);
      return () => cancelAnimationFrame(t2);
    });
    return () => cancelAnimationFrame(t1);
  }, [fitView]);

  // Wheel zoom
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const handler = (e) => {
      e.preventDefault();
      setScale(s => Math.max(0.2, Math.min(2.0, s * (e.deltaY < 0 ? 1.12 : 0.89))));
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, []);

  const onMouseDown = useCallback((e) => {
    if (e.target.closest('[data-ctrl]')) return;
    setDragging({ sx: e.clientX - pan.x, sy: e.clientY - pan.y });
  }, [pan]);

  const onMouseMove = useCallback((e) => {
    if (!dragging) return;
    setPan({ x: e.clientX - dragging.sx, y: e.clientY - dragging.sy });
  }, [dragging]);

  const onMouseUp = useCallback(() => setDragging(null), []);
  const toggleCollapse = useCallback((id) => setCollapsed(p => ({ ...p, [id]: !p[id] })), []);

  if (!nodes.length) {
    return <div className="flex items-center justify-center h-full text-slate-400">No positions to display</div>;
  }

  return (
    <div ref={containerRef} style={{ position: 'absolute', inset: 0 }}>
      {/* Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-1.5 rounded-xl bg-white border border-slate-200 shadow-md p-1.5" data-ctrl="1">
        {[
          { l: '+', title: 'Zoom in', a: () => setScale(s => Math.min(2.0, s * 1.2)) },
          { l: '−', title: 'Zoom out', a: () => setScale(s => Math.max(0.2, s / 1.2)) },
          { l: '⊡', title: 'Fit view', a: fitView },
        ].map(({ l, title, a }) => (
          <button key={l} data-ctrl="1" onClick={a} title={title}
            className="h-8 w-8 rounded-lg bg-white border border-slate-100 shadow-sm text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 flex items-center justify-center transition-all">
            {l}
          </button>
        ))}
        <div className="text-center text-[9px] text-slate-400 pt-0.5 font-mono">
          {Math.round(scale * 100)}%
        </div>
      </div>

      <svg ref={svgRef} width="100%" height="100%"
        style={{ display: 'block', cursor: dragging ? 'grabbing' : 'grab', userSelect: 'none' }}
        onMouseDown={onMouseDown} onMouseMove={onMouseMove}
        onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
        onClick={() => onSelect(null)}
      >
        <g transform={`translate(${pan.x},${pan.y}) scale(${scale})`}>
          {edges.map((e, i) => <OrgEdge key={i} edge={e} />)}
          {nodes.map(n => (
            <OrgNode key={n.id} node={n}
              selectedId={selectedId} onSelect={onSelect} onToggle={toggleCollapse} />
          ))}
        </g>
      </svg>
    </div>
  );
}