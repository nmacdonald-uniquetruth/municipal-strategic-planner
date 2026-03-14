import React, { useState, useCallback } from 'react';
import OrgNodeCard from './OrgNodeCard';
import { BRANCH_COLORS } from './orgUtils';

// Recursive tree renderer with connector lines
function TreeNode({ node, onSelect, selected, showRestructuring, defaultExpanded = true, depth = 0 }) {
  const [expanded, setExpanded] = useState(defaultExpanded || depth < 2);
  const hasChildren = node.children && node.children.length > 0;

  // Separate advisory boards from regular children
  const advisoryChildren = hasChildren ? node.children.filter(c => c.is_advisory) : [];
  const regularChildren = hasChildren ? node.children.filter(c => !c.is_advisory) : [];

  return (
    <div className="flex flex-col items-center">
      <OrgNodeCard
        node={node}
        expanded={expanded}
        onToggle={() => setExpanded(!expanded)}
        onSelect={onSelect}
        selected={selected}
        depth={depth}
        showRestructuring={showRestructuring}
      />

      {/* Regular children with vertical connector */}
      {hasChildren && expanded && regularChildren.length > 0 && (
        <div className="flex flex-col items-center w-full">
          {/* Vertical line down */}
          <div className="w-px bg-slate-300" style={{ height: '20px' }} />

          {/* Horizontal spread */}
          <div className="relative flex items-start gap-4 justify-center">
            {/* Horizontal line spanning children */}
            {regularChildren.length > 1 && (
              <div
                className="absolute top-0 bg-slate-300"
                style={{
                  height: '1px',
                  left: '50%',
                  right: 0,
                  transform: 'translateX(-50%)',
                  width: `calc(100% - 120px)`,
                }}
              />
            )}
            {regularChildren.map((child, i) => (
              <div key={child.id || child._key} className="flex flex-col items-center">
                {/* Short vertical drop */}
                <div className="w-px bg-slate-300" style={{ height: '20px' }} />
                <TreeNode
                  node={child}
                  onSelect={onSelect}
                  selected={selected}
                  showRestructuring={showRestructuring}
                  depth={depth + 1}
                  defaultExpanded={depth < 1}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Advisory boards — shown to the side with dashed line */}
      {hasChildren && expanded && advisoryChildren.length > 0 && (
        <div className="flex flex-col items-center mt-2 w-full">
          <div className="w-px border-l border-dashed border-slate-300" style={{ height: '12px' }} />
          <div className="flex flex-wrap gap-2 justify-center">
            {advisoryChildren.map(child => (
              <div key={child.id || child._key} className="flex flex-col items-center">
                <div className="w-px border-l border-dashed border-slate-300" style={{ height: '8px' }} />
                <OrgNodeCard
                  node={child}
                  expanded={false}
                  onToggle={() => {}}
                  onSelect={onSelect}
                  selected={selected}
                  depth={depth + 1}
                  showRestructuring={showRestructuring}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrgTree({ roots, onSelect, selected, showRestructuring, viewMode }) {
  if (!roots || roots.length === 0) {
    return <div className="text-slate-400 text-sm p-8 text-center">No organizational data loaded.</div>;
  }

  // For full view, show root → two branches side by side
  // For branch views, just show that branch's root
  const rootNode = roots.find(r => r.branch === 'root' || r.node_type === 'governance_body' && !r.parent_id);
  const allRoots = viewMode === 'full' ? roots : roots;

  return (
    <div className="flex flex-col items-center gap-8 py-6 px-4">
      {viewMode === 'full' && rootNode ? (
        // Full community governance: root → both branches side by side
        <div className="flex flex-col items-center">
          {/* Root node */}
          <OrgNodeCard
            node={rootNode}
            expanded={true}
            onToggle={() => {}}
            onSelect={onSelect}
            selected={selected}
            depth={0}
            showRestructuring={showRestructuring}
          />
          <div className="w-px bg-slate-300" style={{ height: '24px' }} />

          {/* Branch divider line */}
          <div className="relative flex items-start gap-16">
            {/* Horizontal connector */}
            <div className="absolute top-0 bg-slate-300" style={{ height: '1px', left: '25%', right: '25%' }} />

            {/* Municipal branch */}
            <div className="flex flex-col items-center">
              <div className="w-px bg-slate-300" style={{ height: '24px' }} />
              <div className="mb-2">
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Municipal Gov.</span>
              </div>
              {roots.filter(r => r.branch === 'municipal' && (!r.parent_id || r.parent_id === 'root')).map(r => (
                <TreeNode
                  key={r.id || r._key}
                  node={r}
                  onSelect={onSelect}
                  selected={selected}
                  showRestructuring={showRestructuring}
                  defaultExpanded={false}
                  depth={1}
                />
              ))}
            </div>

            {/* School branch */}
            <div className="flex flex-col items-center">
              <div className="w-px bg-slate-300" style={{ height: '24px' }} />
              <div className="mb-2">
                <span className="text-[9px] font-bold uppercase tracking-widest text-purple-400 bg-purple-50 px-2 py-0.5 rounded-full">School Governance</span>
              </div>
              {roots.filter(r => r.branch === 'school' && (!r.parent_id || r.parent_id === 'root')).map(r => (
                <TreeNode
                  key={r.id || r._key}
                  node={r}
                  onSelect={onSelect}
                  selected={selected}
                  showRestructuring={showRestructuring}
                  defaultExpanded={false}
                  depth={1}
                />
              ))}
            </div>
          </div>
        </div>
      ) : (
        // Single-branch view
        allRoots.map(root => (
          <TreeNode
            key={root.id || root._key}
            node={root}
            onSelect={onSelect}
            selected={selected}
            showRestructuring={showRestructuring}
            defaultExpanded={true}
            depth={0}
          />
        ))
      )}
    </div>
  );
}