import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { DEPT_COLORS } from './OrgChartData';

// ─── Layout constants ─────────────────────────────────────────────────────────
const NODE_W = 186;
const NODE_H = 72;
const H_GAP  = 20;
const V_GAP  = 56;

// ─── Subtree width assignment ─────────────────────────────────────────────────
function assignWidths(node) {
  const visible = (node.children || []).filter(c => !node._collapsed);
  if (!visible.length) { node._sw = NODE_W; return; }
  visible.forEach(assignWidths);
  const total = visible.reduce((s, c) => s + c._sw, 0) + H_GAP * (visible.length - 1);
  node._sw = Math.max(NODE_W, total);
}

// ─── Position assignment ──────────────────────────────────────────────────────
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

// ─── Collect all visible nodes + edges ───────────────────────────────────────
function collectAll(node, nodes, edges) {
  nodes.push(node);
  if (!node.children || node._collapsed) return;
  node.children.forEach(child => {
    edges.push({
      x1: node._x + NODE_W / 2,
      y1: node._y + NODE_H,
      x2: child._x + NODE_W / 2,
      y2: child._y,
      dashed: child.contracted,
    });
    collectAll(child, nodes, edges);
  });
}

// ─── Single node ──────────────────────────────────────────────────────────────
function OrgNode({ node, selectedId, onSelect, onToggle }) {
  const isSelected = selectedId === node.id;
  const isVacant   = node.status === 'vacant';
  const color      = DEPT_COLORS[node.dept] || DEPT_COLORS.Governance;
  const hasChildren = node.children && node.children.length > 0;
  const R = 7;

  const cardFill   = isVacant ? '#fffbeb' : '#ffffff';
  const border     = isSelected ? '#3b82f6' : isVacant ? '#fcd34d' : '#e2e8f0';
  const borderW    = isSelected ? 2.5 : 1.5;

  // Truncate text
  const trunc = (text, maxLen) => text && text.length > maxLen ? text.slice(0, maxLen - 1) + '…' : (text || '');

  return (
    <g
      transform={`translate(${node._x},${node._y})`}
      style={{ cursor: 'pointer' }}
      onClick={e => { e.stopPropagation(); onSelect(node); }}
    >
      {/* Shadow */}
      <rect x={2} y={3} width={NODE_W} height={NODE_H} rx={R} fill="rgba(0,0,0,0.07)" />

      {/* Card */}
      <rect width={NODE_W} height={NODE_H} rx={R}
        fill={cardFill} stroke={border} strokeWidth={borderW}
        strokeDasharray={node.contracted ? '5,3' : undefined}
      />

      {/* Header bar */}
      <rect x={0} y={0} width={NODE_W} height={20} rx={R} fill={color} />
      <rect x={0} y={12} width={NODE_W} height={8} fill={color} />

      {/* Title */}
      <text x={8} y={13} fontSize={8.5} fontWeight="700" fill="#fff"
        style={{ fontFamily: 'Raleway, sans-serif' }}>
        {trunc(node.title, 30)}
      </text>

      {/* Employee / Vacant */}
      <text x={8} y={31}
        fontSize={9} fontWeight={isVacant ? '400' : '600'}
        fill={isVacant ? '#d97706' : '#1e293b'}
        fontStyle={isVacant ? 'italic' : 'normal'}
        style={{ fontFamily: 'Open Sans, sans-serif' }}>
        {trunc(node.employee || '— Vacant —', 26)}
      </text>

      {/* Dept label */}
      <text x={8} y={45} fontSize={7.5} fill="#64748b" style={{ fontFamily: 'Open Sans, sans-serif' }}>
        {trunc(node.dept, 28)}
      </text>

      {/* Badges */}
      {node.isUnion && (
        <>
          <rect x={8} y={50} width={26} height={11} rx={3} fill="#ede9fe" />
          <text x={21} y={58} textAnchor="middle" fontSize={7} fill="#5b21b6" fontWeight="700">Union</text>
        </>
      )}
      {!node.fullTime && node.status === 'filled' && (
        <>
          <rect x={node.isUnion ? 38 : 8} y={50} width={16} height={11} rx={3} fill="#f1f5f9" />
          <text x={(node.isUnion ? 38 : 8) + 8} y={58} textAnchor="middle" fontSize={7} fill="#475569" fontWeight="600">PT</text>
        </>
      )}

      {/* Status dot */}
      <circle cx={NODE_W - 8} cy={8} r={4}
        fill={isVacant ? '#f59e0b' : '#22c55e'}
        stroke="white" strokeWidth={1.5}
      />

      {/* Collapse toggle */}
      {hasChildren && (
        <g transform={`translate(${NODE_W / 2 - 8}, ${NODE_H - 2})`}
          onClick={e => { e.stopPropagation(); onToggle(node.id); }}
          style={{ cursor: 'pointer' }}>
          <circle cx={8} cy={8} r={8} fill="#334155" stroke="white" strokeWidth={1.5} />
          <text x={8} y={12} textAnchor="middle" fontSize={10} fill="white" fontWeight="bold">
            {node._collapsed ? '+' : '−'}
          </text>
        </g>
      )}
    </g>
  );
}

// ─── Edge ─────────────────────────────────────────────────────────────────────
function OrgEdge({ edge }) {
  const d = `M${edge.x1},${edge.y1} C${edge.x1},${edge.y1 + 28} ${edge.x2},${edge.y2 - 28} ${edge.x2},${edge.y2}`;
  return <path d={d} fill="none" stroke={edge.dashed ? '#94a3b8' : '#cbd5e1'}
    strokeWidth={1.5} strokeDasharray={edge.dashed ? '5,3' : undefined} />;
}

// ─── Main canvas ──────────────────────────────────────────────────────────────
export default function OrgTreeCanvas({ roots, selectedId, onSelect }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const [pan, setPan] = useState({ x: 40, y: 40 });
  const [scale, setScale] = useState(1);
  const [dragging, setDragging] = useState(null);
  const [collapsed, setCollapsed] = useState({});

  // Deep-clone and apply collapsed state
  const applyCollapsed = useCallback((nodes) =>
    nodes.map(n => ({
      ...n,
      _collapsed: !!collapsed[n.id],
      children: n.children ? applyCollapsed(n.children) : [],
    })), [collapsed]);

  const processedRoots = useMemo(() => applyCollapsed(roots), [roots, applyCollapsed]);

  // Layout
  const { nodes, edges, vb } = useMemo(() => {
    if (!processedRoots.length) return { nodes: [], edges: [], vb: { minX: 0, minY: 0, w: 0, h: 0 } };
    processedRoots.forEach(assignWidths);
    let cx = 0;
    processedRoots.forEach(r => { assignPositions(r, cx, 0); cx += r._sw + 80; });
    const allNodes = [], allEdges = [];
    processedRoots.forEach(r => collectAll(r, allNodes, allEdges));
    const xs = allNodes.map(n => n._x);
    const ys = allNodes.map(n => n._y);
    return {
      nodes: allNodes, edges: allEdges,
      vb: {
        minX: Math.min(...xs) - 40,
        minY: Math.min(...ys) - 40,
        w: Math.max(...xs) + NODE_W + 40 - (Math.min(...xs) - 40),
        h: Math.max(...ys) + NODE_H + 40 - (Math.min(...ys) - 40),
      },
    };
  }, [processedRoots]);

  const fitView = useCallback(() => {
    const c = containerRef.current;
    if (!c || vb.w <= 0 || vb.h <= 0) return;
    const cw = c.clientWidth || 800;
    const ch = c.clientHeight || 500;
    const s = Math.min(cw / (vb.w + 80), ch / (vb.h + 80), 1.0);
    setScale(s);
    setPan({ x: (cw - vb.w * s) / 2 - vb.minX * s, y: 40 });
  }, [vb]);

  useEffect(() => {
    const t1 = requestAnimationFrame(() => {
      const t2 = requestAnimationFrame(() => {
        const t3 = requestAnimationFrame(fitView);
        return () => cancelAnimationFrame(t3);
      });
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
      setScale(s => Math.max(0.15, Math.min(2.5, s * (e.deltaY < 0 ? 1.1 : 0.9))));
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
    return (
      <div className="flex items-center justify-center h-full text-slate-400 text-sm">
        No positions to display.
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ position: 'absolute', inset: 0 }}>
      {/* Controls */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1" data-ctrl="1">
        {[
          { l: '+', a: () => setScale(s => Math.min(2.5, s * 1.2)) },
          { l: '−', a: () => setScale(s => Math.max(0.15, s / 1.2)) },
          { l: '⊡', a: fitView },
        ].map(({ l, a }) => (
          <button key={l} data-ctrl="1" onClick={a}
            className="h-8 w-8 rounded-lg bg-white border border-slate-200 shadow text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-center">
            {l}
          </button>
        ))}
      </div>
      <div className="absolute bottom-3 right-3 z-10 text-[10px] text-slate-400 bg-white/80 px-2 py-1 rounded">
        {Math.round(scale * 100)}%
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