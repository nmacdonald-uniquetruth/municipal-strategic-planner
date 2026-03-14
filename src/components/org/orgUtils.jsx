// Build a tree structure from a flat list of nodes (keyed by id or _key)
export function buildTree(nodes) {
  const map = {};
  nodes.forEach(n => { map[n.id || n._key] = { ...n, children: [] }; });
  const roots = [];
  nodes.forEach(n => {
    const node = map[n.id || n._key];
    const parentKey = n.parent_id;
    if (!parentKey || !map[parentKey]) {
      roots.push(node);
    } else {
      map[parentKey].children.push(node);
    }
  });
  // Sort children
  const sortChildren = (node) => {
    node.children.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    node.children.forEach(sortChildren);
    return node;
  };
  roots.forEach(sortChildren);
  roots.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  return roots;
}

export const NODE_TYPE_CONFIG = {
  governance_body:      { label: 'Governance Body',      color: '#344A60', textColor: '#fff', border: '#1e2f3d' },
  executive_leadership: { label: 'Executive Leadership', color: '#2A7F7F', textColor: '#fff', border: '#1d6060' },
  department:           { label: 'Department',           color: '#4A6741', textColor: '#fff', border: '#384f31' },
  school:               { label: 'School',               color: '#6B4C9A', textColor: '#fff', border: '#503874' },
  division:             { label: 'Division',             color: '#8B6914', textColor: '#fff', border: '#6a4f0f' },
  program:              { label: 'Program',              color: '#9C5334', textColor: '#fff', border: '#7a3f27' },
  staff_role:           { label: 'Staff Role',           color: '#fff',    textColor: '#2F2F30', border: '#c9bba6' },
  board_committee:      { label: 'Board / Committee',    color: '#E7D0B1', textColor: '#344A60', border: '#c9b895' },
  support_services:     { label: 'Support Services',     color: '#F0F0F0', textColor: '#555',    border: '#d0d0d0' },
  root:                 { label: 'Root',                 color: '#1e2f3d', textColor: '#fff', border: '#000' },
};

export const RESTRUCTURING_STATUS_CONFIG = {
  unchanged:          { label: 'Unchanged',          color: 'bg-slate-100 text-slate-600',    dot: 'bg-slate-400' },
  proposed_new:       { label: 'Proposed New',       color: 'bg-emerald-100 text-emerald-800', dot: 'bg-emerald-500' },
  proposed_change:    { label: 'Proposed Change',    color: 'bg-amber-100 text-amber-800',    dot: 'bg-amber-500' },
  proposed_eliminate: { label: 'Proposed Eliminate', color: 'bg-red-100 text-red-800',        dot: 'bg-red-500' },
  proposed_merge:     { label: 'Proposed Merge',     color: 'bg-blue-100 text-blue-800',      dot: 'bg-blue-500' },
};

export const BRANCH_COLORS = {
  municipal: '#344A60',
  school:    '#6B4C9A',
  shared:    '#2A7F7F',
  root:      '#1e2f3d',
};