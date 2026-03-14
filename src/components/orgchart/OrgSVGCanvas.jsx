import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { computeLayout, NODE_W, NODE_H, DEPT_PALETTE, STATUS_RING } from './OrgLayoutEngine';
import { FUND_LABELS } from './OrgData';

// ─── Individual SVG node ──────────────────────────────────────────────────────
function SvgNode({ node, onSelect, selectedId, onToggleCollapse }) {
  const isSelected = selectedId === node.position_id;
  const palette = DEPT_PALETTE[node.department] || DEPT_PALETTE['Town Manager'];
  const statusColor = STATUS_RING[node.status] || STATUS_RING.vacant;
  const isContracted = node.employment_type === 'contracted';
  const isVacant = node.status === 'vacant';
  const hasChildren = node.children && node.children.length > 0;

  const x = node.x;
  const y = node.y;
  const R = 8; // border-radius

  // Card background
  const cardBg = isVacant ? '#fffbeb' : '#ffffff';
  const borderColor = isSelected ? '#3b82f6' : isVacant ? '#fcd34d' : '#e2e8f0';
  const borderW = isSelected ? 2.5 : 1.5;

  return (
    <g
      transform={`translate(${x},${y})`}
      style={{ cursor: 'pointer' }}
      onClick={(e) => { e.stopPropagation(); onSelect(node); }}
    >
      {/* Shadow */}
      <rect x={2} y={3} width={NODE_W} height={NODE_H} rx={R} ry={R} fill="rgba(0,0,0,0.07)" />

      {/* Card background */}
      <rect
        width={NODE_W} height={NODE_H} rx={R} ry={R}
        fill={cardBg}
        stroke={borderColor} strokeWidth={borderW}
        strokeDasharray={isContracted ? '5,3' : undefined}
      />

      {/* Left accent bar */}
      <rect x={0} y={0} width={4} height={NODE_H} rx={R} ry={0}
        fill={palette.bg}
        clipPath={`url(#lclip-${node.position_id})`}
      />
      <clipPath id={`lclip-${node.position_id}`}>
        <rect x={0} y={0} width={4} height={NODE_H} rx={R} />
      </clipPath>

      {/* Dept color header strip */}
      <rect x={4} y={0} width={NODE_W - 4} height={22} rx={0} fill={palette.bg}
        clipPath={`url(#hclip-${node.position_id})`}
      />
      <clipPath id={`hclip-${node.position_id}`}>
        <rect x={4} y={0} width={NODE_W - 4} height={22} rx={0} />
      </clipPath>
      {/* Round top-right header */}
      <rect x={4} y={0} width={NODE_W - 4} height={22} rx={R} ry={R} fill={palette.bg}
        clipPath={`url(#htop-${node.position_id})`}
      />
      <clipPath id={`htop-${node.position_id}`}>
        <rect x={4} y={0} width={NODE_W - 4} height={16} />
      </clipPath>

      {/* Title text */}
      <text
        x={10} y={14}
        fontSize={9.5} fontWeight="700" fill="#ffffff"
        style={{ fontFamily: 'Raleway, sans-serif' }}
      >
        <TruncText text={node.title} maxW={NODE_W - 22} />
      </text>

      {/* Subtitle */}
      {node.subtitle && (
        <text x={10} y={30} fontSize={8} fill="#64748b" style={{ fontFamily: 'Open Sans, sans-serif' }}>
          <TruncText text={node.subtitle} maxW={NODE_W - 16} />
        </text>
      )}

      {/* Employee name */}
      <text
        x={10} y={node.subtitle ? 42 : 33}
        fontSize={9.5} fontWeight={isVacant ? 'normal' : '600'}
        fill={isVacant ? '#d97706' : '#1e293b'}
        fontStyle={isVacant ? 'italic' : 'normal'}
        style={{ fontFamily: 'Open Sans, sans-serif' }}
      >
        <TruncText text={node.employee ? node.employee.full_name : '— Vacant —'} maxW={NODE_W - 16} />
      </text>

      {/* Badges row */}
      <BadgesRow node={node} y={node.subtitle ? 52 : 43} statusColor={statusColor} />

      {/* Salary */}
      {node.base_salary > 0 && (
        <text x={10} y={NODE_H - 6} fontSize={8} fill="#94a3b8" style={{ fontFamily: 'monospace' }}>
          ${node.base_salary.toLocaleString()}
        </text>
      )}

      {/* Status dot top-right */}
      <circle cx={NODE_W - 7} cy={7} r={4} fill={statusColor} stroke="white" strokeWidth={1.5} />

      {/* Collapse button */}
      {hasChildren && (
        <g
          transform={`translate(${NODE_W / 2 - 9}, ${NODE_H - 2})`}
          onClick={(e) => { e.stopPropagation(); onToggleCollapse(node.position_id); }}
          style={{ cursor: 'pointer' }}
        >
          <circle cx={9} cy={9} r={9} fill="#334155" stroke="white" strokeWidth={1.5} />
          <text x={9} y={13} textAnchor="middle" fontSize={10} fill="white" fontWeight="bold">
            {node._collapsed ? '+' : '−'}
          </text>
        </g>
      )}
    </g>
  );
}

function TruncText({ text, maxW }) {
  if (!text) return null;
  // SVG doesn't natively truncate — estimate ~5.8px per char at font-size 9.5
  const maxChars = Math.floor(maxW / 5.8);
  const display = text.length > maxChars ? text.slice(0, maxChars - 1) + '…' : text;
  return <>{display}</>;
}

function BadgesRow({ node, y, statusColor }) {
  const badges = [];
  let bx = 10;

  const addBadge = (label, bg, fg, dashed = false) => {
    const w = label.length * 5.2 + 8;
    badges.push({ label, bg, fg, x: bx, w, dashed });
    bx += w + 4;
  };

  addBadge(
    node.status.charAt(0).toUpperCase() + node.status.slice(1),
    node.status === 'filled' ? '#d1fae5' : node.status === 'vacant' ? '#fef3c7' : '#dbeafe',
    node.status === 'filled' ? '#065f46' : node.status === 'vacant' ? '#92400e' : '#1e40af',
  );

  if (node.employment_type && node.employment_type !== 'full_time') {
    const labels = { part_time: 'PT', stipend: 'Stipend', elected: 'Elected', appointed: 'Apptd', contracted: 'Contract', volunteer: 'Vol' };
    addBadge(labels[node.employment_type] || node.employment_type, '#f1f5f9', '#475569');
  }

  if (node.is_union) addBadge('Union', '#ede9fe', '#5b21b6');

  if (node.fund_source && node.fund_source !== 'general_fund') {
    addBadge(FUND_LABELS[node.fund_source] || node.fund_source, '#0f172a', '#cbd5e1');
  }

  return (
    <g>
      {badges.map((b, i) => (
        <g key={i}>
          <rect x={b.x} y={y} width={b.w} height={11} rx={4}
            fill={b.bg}
            stroke={b.dashed ? b.fg : 'none'} strokeDasharray={b.dashed ? '2,1' : undefined}
          />
          <text x={b.x + b.w / 2} y={y + 8} textAnchor="middle" fontSize={7.5} fill={b.fg} fontWeight="600">
            {b.label}
          </text>
        </g>
      ))}
    </g>
  );
}

// ─── Edge / connector ─────────────────────────────────────────────────────────
function SvgEdge({ edge }) {
  const mx = (edge.x1 + edge.x2) / 2;
  const my = (edge.y1 + edge.y2) / 2;
  // Smooth S-curve
  const d = `M ${edge.x1} ${edge.y1} C ${edge.x1} ${edge.y1 + 30}, ${edge.x2} ${edge.y2 - 30}, ${edge.x2} ${edge.y2}`;
  return (
    <path
      d={d}
      fill="none"
      stroke={edge.dashed ? '#94a3b8' : '#cbd5e1'}
      strokeWidth={edge.dashed ? 1.5 : 1.5}
      strokeDasharray={edge.dashed ? '5,3' : undefined}
    />
  );
}

// ─── Main SVG Canvas ──────────────────────────────────────────────────────────
export default function OrgSVGCanvas({ tree, onSelect, selectedId }) {
  const svgRef = useRef(null);
  const [transform, setTransform] = useState({ x: 40, y: 40, scale: 1 });
  const [dragging, setDragging] = useState(null);
  const [collapsed, setCollapsed] = useState({});

  // Apply collapsed state to tree nodes
  const applyCollapsed = useCallback((nodes) => {
    return nodes.map(n => ({
      ...n,
      _collapsed: collapsed[n.position_id] || false,
      children: n.children ? applyCollapsed(n.children) : [],
    }));
  }, [collapsed]);

  const processedTree = useMemo(() => applyCollapsed(tree), [tree, applyCollapsed]);
  const { nodes, edges, viewBox } = useMemo(() => computeLayout(processedTree), [processedTree]);

  const handleToggleCollapse = useCallback((pid) => {
    setCollapsed(prev => ({ ...prev, [pid]: !prev[pid] }));
  }, []);

  // Pan handling
  const onMouseDown = useCallback((e) => {
    if (e.target.closest('[data-no-pan]')) return;
    setDragging({ startX: e.clientX - transform.x, startY: e.clientY - transform.y });
  }, [transform]);

  const onMouseMove = useCallback((e) => {
    if (!dragging) return;
    setTransform(t => ({ ...t, x: e.clientX - dragging.startX, y: e.clientY - dragging.startY }));
  }, [dragging]);

  const onMouseUp = useCallback(() => setDragging(null), []);

  // Wheel zoom
  const onWheel = useCallback((e) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    setTransform(t => ({
      ...t,
      scale: Math.max(0.2, Math.min(2.5, t.scale * factor)),
    }));
  }, []);

  const svgEl = svgRef.current;
  useEffect(() => {
    if (!svgEl) return;
    svgEl.addEventListener('wheel', onWheel, { passive: false });
    return () => svgEl.removeEventListener('wheel', onWheel);
  }, [svgEl, onWheel]);

  // Fit to view
  const fitView = useCallback(() => {
    if (!svgEl) return;
    const rect = svgEl.getBoundingClientRect();
    const w = rect.width || svgEl.clientWidth || 800;
    const h = rect.height || svgEl.clientHeight || 600;
    if (viewBox.width <= 0 || viewBox.height <= 0) return;
    const scaleX = w / (viewBox.width + 80);
    const scaleY = h / (viewBox.height + 80);
    const scale = Math.min(scaleX, scaleY, 1.0);
    setTransform({
      scale,
      x: (w - viewBox.width * scale) / 2 - viewBox.minX * scale,
      y: 40,
    });
  }, [svgEl, viewBox]);

  // Auto-fit on tree change — defer one frame so SVG has rendered size
  useEffect(() => {
    const id = requestAnimationFrame(() => { fitView(); });
    return () => cancelAnimationFrame(id);
  }, [nodes.length]);

  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400 text-sm">
        No positions match current scenario settings.
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* Controls */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5">
        {[
          { label: '+', action: () => setTransform(t => ({ ...t, scale: Math.min(2.5, t.scale * 1.2) })) },
          { label: '−', action: () => setTransform(t => ({ ...t, scale: Math.max(0.2, t.scale / 1.2) })) },
          { label: '⊡', action: fitView },
        ].map(({ label, action }) => (
          <button
            key={label}
            onClick={action}
            data-no-pan="true"
            className="h-8 w-8 rounded-lg bg-white border border-slate-200 shadow text-sm font-bold text-slate-600 hover:bg-slate-50 flex items-center justify-center"
          >
            {label}
          </button>
        ))}
      </div>

      {/* Scale indicator */}
      <div className="absolute bottom-3 right-3 z-10 text-[10px] text-slate-400 bg-white/80 px-2 py-1 rounded">
        {Math.round(transform.scale * 100)}%
      </div>

      <svg
        ref={svgRef}
        className="w-full"
        style={{ height: '100%', minHeight: '500px', cursor: dragging ? 'grabbing' : 'grab', userSelect: 'none' }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onClick={() => onSelect(null)}
      >
        <g transform={`translate(${transform.x},${transform.y}) scale(${transform.scale})`}>
          {/* Edges first (under nodes) */}
          {edges.map((edge, i) => <SvgEdge key={i} edge={edge} />)}
          {/* Nodes */}
          {nodes.map(node => (
            <SvgNode
              key={node.position_id}
              node={node}
              onSelect={onSelect}
              selectedId={selectedId}
              onToggleCollapse={handleToggleCollapse}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}