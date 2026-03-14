import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { DEPT_COLORS } from './OrgChartData';

const NODE_W = 200;
const NODE_H = 75;
const H_SPACING = 160;
const V_SPACING = 130;

// Calculate tree dimensions and position nodes
function layoutTree(node, x = 0, y = 0, visited = new Set()) {
  if (!node || visited.has(node.id)) return { nodes: [], bounds: { minX: 0, minY: 0, maxX: 0, maxY: 0 } };
  visited.add(node.id);

  const nodes = [{ ...node, x, y }];
  let minX = x, minY = y, maxX = x + NODE_W, maxY = y + NODE_H;

  if (!node.children || node.children.length === 0) {
    return { nodes, bounds: { minX, minY, maxX, maxY } };
  }

  const totalChildWidth = node.children.length * H_SPACING;
  let childStartX = x + NODE_W / 2 - totalChildWidth / 2;

  node.children.forEach((child) => {
    const result = layoutTree(child, childStartX, y + V_SPACING, visited);
    nodes.push(...result.nodes);
    minX = Math.min(minX, result.bounds.minX);
    minY = Math.min(minY, result.bounds.minY);
    maxX = Math.max(maxX, result.bounds.maxX);
    maxY = Math.max(maxY, result.bounds.maxY);
    childStartX += H_SPACING;
  });

  return { nodes, bounds: { minX, minY, maxX, maxY } };
}

// SVG connector line
function ConnectorLine({ x1, y1, x2, y2 }) {
  const d = `M${x1},${y1} L${x1},${y1 + 40} L${x2},${y2 - 40} L${x2},${y2}`;
  return <path d={d} fill="none" stroke="#cbd5e1" strokeWidth={2} />;
}

// Org node card
function OrgNode({ node, selectedId, onSelect }) {
  const isSelected = selectedId === node.id;
  const isStructural = node.nodeType === 'structural';
  const isVacant = !isStructural && node.status === 'vacant';
  const color = DEPT_COLORS[node.dept] || '#344A60';
  
  const trunc = (text, maxLen) => text && text.length > maxLen ? text.slice(0, maxLen - 1) + '…' : (text || '');

  return (
    <g
      transform={`translate(${node.x},${node.y})`}
      onClick={(e) => { e.stopPropagation(); onSelect(node); }}
      style={{ cursor: 'pointer' }}
    >
      {/* Shadow */}
      <rect x={2} y={2} width={NODE_W} height={NODE_H} rx={8} fill="rgba(0,0,0,0.08)" />

      {/* Background */}
      <rect width={NODE_W} height={NODE_H} rx={8}
        fill={isStructural ? color : '#ffffff'}
        stroke={isSelected ? '#3b82f6' : (isStructural ? color : (isVacant ? '#fcd34d' : '#e2e8f0'))}
        strokeWidth={isSelected ? 2.5 : 1.5}
      />

      {/* Color accent bar */}
      {!isStructural && (
        <rect x={0} y={0} width={NODE_W} height={4} rx={8} fill={color} />
      )}

      {/* Content */}
      {isStructural ? (
        // Structural: white text on colored background
        <>
          <text x={NODE_W / 2} y={28} textAnchor="middle" fontSize={11} fontWeight="700" fill="#ffffff"
            style={{ fontFamily: 'Raleway, sans-serif' }}>
            {trunc(node.title, 22)}
          </text>
          <text x={NODE_W / 2} y={48} textAnchor="middle" fontSize={8} fill="rgba(255,255,255,0.8)"
            style={{ fontFamily: 'Open Sans, sans-serif' }}>
            {trunc(node.dept, 24)}
          </text>
        </>
      ) : (
        // Position: title, employee, department
        <>
          <text x={10} y={16} fontSize={9} fontWeight="700" fill="#1f2937"
            style={{ fontFamily: 'Raleway, sans-serif' }}>
            {trunc(node.title, 24)}
          </text>
          <text x={10} y={35} fontSize={8.5} fontWeight={isVacant ? '400' : '600'}
            fill={isVacant ? '#b45309' : '#374151'} fontStyle={isVacant ? 'italic' : 'normal'}
            style={{ fontFamily: 'Open Sans, sans-serif' }}>
            {trunc(node.employee || '(Vacant)', 26)}
          </text>
          <text x={10} y={54} fontSize={7.5} fill="#9ca3af"
            style={{ fontFamily: 'Open Sans, sans-serif' }}>
            {trunc(node.dept, 26)}
          </text>
          {/* Status dot */}
          <circle cx={NODE_W - 12} cy={10} r={3.5}
            fill={isVacant ? '#f59e0b' : '#10b981'} stroke="white" strokeWidth={1}
          />
        </>
      )}
    </g>
  );
}

// Main canvas
export default function OrgCompactCanvas({ roots, selectedId, onSelect, showGovernance = false }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [dragging, setDragging] = useState(null);

  // Get Town Manager node (focus node)
  const focusNode = useMemo(() => {
    if (!roots || roots.length === 0) return null;
    
    if (showGovernance) {
      // Show full governance structure
      return roots[0]; // Residents & Voters
    }
    
    // Find Town Manager node
    const findTownManager = (node) => {
      if (node.id === 'town_manager') return node;
      if (!node.children) return null;
      for (const child of node.children) {
        const result = findTownManager(child);
        if (result) return result;
      }
      return null;
    };

    return roots.length > 0 ? findTownManager(roots[0]) : null;
  }, [roots, showGovernance]);

  // Layout the tree
  const { renderNodes, edges, svgWidth, svgHeight } = useMemo(() => {
    if (!focusNode) return { renderNodes: [], edges: [], svgWidth: 0, svgHeight: 0 };

    const { nodes, bounds } = layoutTree(focusNode);
    const padding = 80;
    const width = Math.min(bounds.maxX - bounds.minX + padding * 2, 1400);
    const height = bounds.maxY - bounds.minY + padding * 2;

    // Adjust positions to fit in viewport
    const adjustedNodes = nodes.map(n => ({
      ...n,
      x: n.x - bounds.minX + padding,
      y: n.y - bounds.minY + padding,
    }));

    // Build edges
    const edgeList = [];
    adjustedNodes.forEach(node => {
      if (node.children) {
        node.children.forEach(child => {
          const childNode = adjustedNodes.find(n => n.id === child.id);
          if (childNode) {
            edgeList.push({
              x1: node.x + NODE_W / 2,
              y1: node.y + NODE_H,
              x2: childNode.x + NODE_W / 2,
              y2: childNode.y,
            });
          }
        });
      }
    });

    return { renderNodes: adjustedNodes, edges: edgeList, svgWidth: width, svgHeight: height };
  }, [focusNode]);

  // Auto-fit on load
  useEffect(() => {
    if (!containerRef.current || svgWidth <= 0 || svgHeight <= 0) return;

    const cw = containerRef.current.clientWidth || 1000;
    const ch = containerRef.current.clientHeight || 700;

    const scaleX = (cw - 40) / svgWidth;
    const scaleY = (ch - 40) / svgHeight;
    const s = Math.min(scaleX, scaleY, 1.0);
    const clampedScale = Math.max(0.5, s);

    const cx = (cw - svgWidth * clampedScale) / 2;
    const cy = (ch - svgHeight * clampedScale) / 2;

    setScale(clampedScale);
    setPan({ x: cx, y: cy });
  }, [svgWidth, svgHeight]);

  // Zoom wheel
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const handler = (e) => {
      e.preventDefault();
      setScale(s => Math.max(0.3, Math.min(2.5, s * (e.deltaY < 0 ? 1.12 : 0.89))));
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

  if (!renderNodes.length) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400 text-sm">
        No positions to display
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {/* Controls */}
      <div className="absolute top-4 right-4 z-10 flex gap-1 rounded-xl bg-white border border-slate-200 shadow-sm p-1">
        <button
          onClick={() => setScale(s => Math.min(2.5, s * 1.15))}
          title="Zoom in"
          className="h-8 w-8 rounded-lg border border-slate-100 text-slate-600 hover:bg-slate-50 font-bold text-sm flex items-center justify-center"
        >
          +
        </button>
        <button
          onClick={() => setScale(s => Math.max(0.3, s / 1.15))}
          title="Zoom out"
          className="h-8 w-8 rounded-lg border border-slate-100 text-slate-600 hover:bg-slate-50 font-bold text-sm flex items-center justify-center"
        >
          −
        </button>
        <div className="w-px bg-slate-200" />
        <button
          onClick={() => {
            if (containerRef.current) {
              const cw = containerRef.current.clientWidth || 1000;
              const ch = containerRef.current.clientHeight || 700;
              const s = Math.min((cw - 40) / svgWidth, (ch - 40) / svgHeight, 1.0);
              const clampedScale = Math.max(0.5, s);
              const cx = (cw - svgWidth * clampedScale) / 2;
              const cy = (ch - svgHeight * clampedScale) / 2;
              setScale(clampedScale);
              setPan({ x: cx, y: cy });
            }
          }}
          title="Fit to view"
          className="h-8 w-8 rounded-lg border border-slate-100 text-slate-600 hover:bg-slate-50 font-bold text-sm flex items-center justify-center"
        >
          ⊡
        </button>
        <div className="text-[9px] text-slate-400 px-2 py-1 font-mono whitespace-nowrap">
          {Math.round(scale * 100)}%
        </div>
      </div>

      <svg
        ref={svgRef}
        width={svgWidth}
        height={svgHeight}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          display: 'block',
          cursor: dragging ? 'grabbing' : 'grab',
          userSelect: 'none',
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
          transformOrigin: '0 0',
        }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onClick={() => onSelect(null)}
      >
        {/* Edges */}
        {edges.map((e, i) => (
          <ConnectorLine key={i} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} />
        ))}

        {/* Nodes */}
        {renderNodes.map(node => (
          <OrgNode
            key={node.id}
            node={node}
            selectedId={selectedId}
            onSelect={onSelect}
          />
        ))}
      </svg>
    </div>
  );
}