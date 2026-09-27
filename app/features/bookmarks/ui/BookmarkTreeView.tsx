import React from 'react';
import type { BookmarkTree } from '../domain/tree';

interface TreeListProps {
  entries: BookmarkTree[];
  expanded: ReadonlySet<string>;
  onToggle: (id: string) => void;
}

function TreeList({ entries, expanded, onToggle }: TreeListProps) {
  return (
    <ul className="tree">
      {entries.map(({ node, children }) => (
        <li key={node.id} className={`tree-node tree-${node.kind}`}>
          {node.kind === 'folder' ? (
            <>
              <button
                type="button"
                className="tree-toggle"
                aria-expanded={expanded.has(node.id)}
                onClick={() => onToggle(node.id)}
              >
                {node.title || 'Корень'}
              </button>
              {expanded.has(node.id) && children.length > 0 ? (
                <TreeList entries={children} expanded={expanded} onToggle={onToggle} />
              ) : null}
            </>
          ) : node.kind === 'bookmark' ? (
            <a href={node.url} target="_blank" rel="noopener noreferrer">
              {node.title || node.url}
            </a>
          ) : (
            <hr className="tree-separator" />
          )}
        </li>
      ))}
    </ul>
  );
}

export function BookmarkTreeView(props: TreeListProps) {
  return <TreeList {...props} />;
}
