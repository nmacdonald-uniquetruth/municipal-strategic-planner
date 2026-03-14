// ─── Org Chart Layout Engine ──────────────────────────────────────────────────
// Computes x/y positions for every node using a top-down Reingold-Tilford-inspired
// algorithm. Returns nodes with { x, y, width, height } and edges as { x1,y1,x2,y2 }.

export const NODE_W = 188;
export const NODE_H = 88;
export const H_GAP  = 24;   // horizontal gap between siblings
export const V_GAP  = 64;   // vertical gap between levels

// ─── Step 1: Assign subtree widths (bottom-up) ───────────────────────────────
function assignWidths(node) {
  if (!node.children || node.children.length === 0 || node._collapsed) {
    node._subtreeW = NODE_W;
    return;
  }
  node.children.forEach(assignWidths);
  const childrenW = node.children.reduce((s, c) => s + c._subtreeW, 0)
    + H_GAP * (node.children.length - 1);
  node._subtreeW = Math.max(NODE_W, childrenW);
}

// ─── Step 2: Assign x,y positions (top-down) ─────────────────────────────────
function assignPositions(node, x, y) {
  node.x = x;
  node.y = y;

  if (!node.children || node.children.length === 0 || node._collapsed) return;

  const totalChildW = node.children.reduce((s, c) => s + c._subtreeW, 0)
    + H_GAP * (node.children.length - 1);
  let curX = x + NODE_W / 2 - totalChildW / 2;

  node.children.forEach(child => {
    assignPositions(child, curX, y + NODE_H + V_GAP);
    curX += child._subtreeW + H_GAP;
  });
}

// ─── Step 3: Collect all nodes + edges ────────────────────────────────────────
function collectAll(node, nodes, edges) {
  nodes.push(node);
  if (!node.children || node._collapsed) return;
  node.children.forEach(child => {
    edges.push({
      x1: node.x + NODE_W / 2,
      y1: node.y + NODE_H,
      x2: child.x + NODE_W / 2,
      y2: child.y,
      dashed: child.employment_type === 'contracted',
    });
    collectAll(child, nodes, edges);
  });
}

// ─── Main export ──────────────────────────────────────────────────────────────
export function computeLayout(roots) {
  // Assign subtree widths for all root trees
  roots.forEach(assignWidths);

  // Layout root trees side by side with a gap
  const ROOT_GAP = 80;
  let curX = 0;
  roots.forEach(root => {
    assignPositions(root, curX, 0);
    curX += root._subtreeW + ROOT_GAP;
  });

  const nodes = [];
  const edges = [];
  roots.forEach(root => collectAll(root, nodes, edges));

  // Compute bounding box
  const xs = nodes.map(n => n.x);
  const ys = nodes.map(n => n.y);
  const minX = Math.min(...xs) - 40;
  const minY = Math.min(...ys) - 40;
  const maxX = Math.max(...xs) + NODE_W + 40;
  const maxY = Math.max(...ys) + NODE_H + 40;

  return {
    nodes,
    edges,
    viewBox: { minX, minY, width: maxX - minX, height: maxY - minY },
  };
}

// ─── Department color palette (extended for spec) ────────────────────────────
export const DEPT_PALETTE = {
  'Governance':             { bg: '#1a3a5c', text: '#ffffff', ring: '#3a6a9c' },
  'Select Board':           { bg: '#1a3a5c', text: '#ffffff', ring: '#3a6a9c' },
  'Town Manager':           { bg: '#1a3a5c', text: '#ffffff', ring: '#3a6a9c' },
  'Finance & Administration':{ bg: '#1a6b5c', text: '#ffffff', ring: '#2A9F8F' },
  "Clerk's Office":         { bg: '#3d6b4a', text: '#ffffff', ring: '#5a9b6a' },
  'Police Department':      { bg: '#8B2020', text: '#ffffff', ring: '#c04040' },
  'Fire Department':        { bg: '#7a2020', text: '#ffffff', ring: '#b04040' },
  'Ambulance Service':      { bg: '#8a4020', text: '#ffffff', ring: '#c06040' },
  'Public Works':           { bg: '#7a5c1a', text: '#ffffff', ring: '#b08c3a' },
  'Wastewater':             { bg: '#2a5c7a', text: '#ffffff', ring: '#4a8caa' },
  'Assessing':              { bg: '#5c3d8a', text: '#ffffff', ring: '#8c6dba' },
  'Code Enforcement':       { bg: '#3a5c3a', text: '#ffffff', ring: '#5a8c5a' },
  'School Governance':      { bg: '#2a4c6b', text: '#ffffff', ring: '#4a7caa' },
  'School Administration':  { bg: '#2a4c6b', text: '#ffffff', ring: '#4a7caa' },
};

export const STATUS_RING = {
  filled:     '#22c55e',
  vacant:     '#f59e0b',
  proposed:   '#3b82f6',
  eliminated: '#ef4444',
  frozen:     '#94a3b8',
};