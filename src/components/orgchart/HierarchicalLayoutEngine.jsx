// Deterministic hierarchical tree layout engine for org charts
// Produces clean top-down layouts with proper spacing and centering

const CARD_W = 200;
const CARD_H = 80;
const V_SPACING = 110;  // Vertical spacing between levels
const H_SIBLING = 50;   // Horizontal spacing between siblings
const H_BRANCH = 100;   // Horizontal spacing between major branches

// Calculate subtree width (includes all descendants)
function calculateSubtreeWidth(node, isExpanded) {
  if (!node.children || node.children.length === 0 || !isExpanded[node.id]) {
    return CARD_W;
  }

  const childrenWidths = node.children.map(child => calculateSubtreeWidth(child, isExpanded));
  const totalChildWidth = childrenWidths.reduce((a, b) => a + b, 0);
  const totalSpacing = Math.max(0, (node.children.length - 1) * H_SIBLING);
  const totalWidth = totalChildWidth + totalSpacing;

  return Math.max(CARD_W, totalWidth);
}

// Position nodes in the layout
function layoutNode(node, x, y, isExpanded) {
  node.x = x;
  node.y = y;
  node.visible = true;

  // Don't expand if not in expanded set
  if (!isExpanded[node.id]) {
    node.children = [];
    return;
  }

  if (!node.children || node.children.length === 0) {
    return;
  }

  // Calculate child positions
  const childSubtreeWidths = node.children.map(child => calculateSubtreeWidth(child, isExpanded));
  const totalChildWidth = childSubtreeWidths.reduce((a, b) => a + b, 0);
  const totalSpacing = Math.max(0, (node.children.length - 1) * H_SIBLING);
  const childrenAreaWidth = totalChildWidth + totalSpacing;

  // Center children under parent
  const childrenStartX = x + CARD_W / 2 - childrenAreaWidth / 2;

  let nextX = childrenStartX;
  node.children.forEach((child, idx) => {
    const childX = nextX;
    const childY = y + CARD_H + V_SPACING;

    layoutNode(child, childX, childY, isExpanded);
    nextX += childSubtreeWidths[idx] + H_SIBLING;
  });
}

// Calculate bounds of entire tree
function calculateBounds(nodes) {
  if (!nodes || nodes.length === 0) {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0 };
  }

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

  nodes.forEach(node => {
    minX = Math.min(minX, node.x);
    maxX = Math.max(maxX, node.x + CARD_W);
    minY = Math.min(minY, node.y);
    maxY = Math.max(maxY, node.y + CARD_H);
  });

  return {
    minX,
    maxX,
    minY,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

// Collect all visible nodes and edges
function collectNodesAndEdges(node, nodes, edges) {
  nodes.push(node);

  if (!node.children || node.children.length === 0) {
    return;
  }

  const parentCenterX = node.x + CARD_W / 2;
  const parentBottomY = node.y + CARD_H;

  node.children.forEach(child => {
    const childCenterX = child.x + CARD_W / 2;
    const childTopY = child.y;

    edges.push({
      x1: parentCenterX,
      y1: parentBottomY,
      x2: childCenterX,
      y2: childTopY,
    });

    collectNodesAndEdges(child, nodes, edges);
  });
}

// Main layout function
export function layoutOrgChart(focusNode, isExpanded = {}) {
  if (!focusNode) {
    return { nodes: [], edges: [], bounds: { width: 0, height: 0 } };
  }

  // Layout from root
  layoutNode(focusNode, 100, 40, isExpanded);

  // Collect all visible nodes
  const nodes = [];
  const edges = [];
  collectNodesAndEdges(focusNode, nodes, edges);

  // Calculate bounds
  const bounds = calculateBounds(nodes);

  // Adjust all positions relative to bounds
  const padding = 60;
  const adjustedNodes = nodes.map(node => ({
    ...node,
    x: node.x - bounds.minX + padding,
    y: node.y - bounds.minY + padding,
  }));

  const adjustedEdges = edges.map(edge => ({
    x1: edge.x1 - bounds.minX + padding,
    y1: edge.y1 - bounds.minY + padding,
    x2: edge.x2 - bounds.minX + padding,
    y2: edge.y2 - bounds.minY + padding,
  }));

  const adjustedBounds = calculateBounds(adjustedNodes);

  return {
    nodes: adjustedNodes,
    edges: adjustedEdges,
    bounds: {
      width: adjustedBounds.width + padding * 2,
      height: adjustedBounds.height + padding * 2,
    },
  };
}

export { CARD_W, CARD_H, V_SPACING, H_SIBLING, H_BRANCH };