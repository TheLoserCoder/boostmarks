import React from 'react';
import { childrenOf, folderChain, topLevelFolders } from '../domain/path';
import type { BookmarkNode } from '../domain/types';

interface FolderTreeProps {
  nodes: BookmarkNode[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

interface FolderBranchProps extends FolderTreeProps {
  folder: BookmarkNode;
  expanded: ReadonlySet<string>;
}

function FolderBranch({ nodes, folder, selectedId, expanded, onSelect }: FolderBranchProps) {
  const childFolders = childrenOf(nodes, folder.id).filter(node => node.kind === 'folder');

  return (
    <li>
      <button
        type="button"
        className="folder-link"
        aria-current={folder.id === selectedId ? 'page' : undefined}
        onClick={() => onSelect(folder.id)}
      >
        {folder.title || 'Корень'}
      </button>
      {expanded.has(folder.id) && childFolders.length > 0 ? (
        <ul className="folder-tree">
          {childFolders.map(child => (
            <FolderBranch
              key={child.id}
              nodes={nodes}
              folder={child}
              selectedId={selectedId}
              expanded={expanded}
              onSelect={onSelect}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function FolderTree({ nodes, selectedId, onSelect }: FolderTreeProps) {
  const expanded = new Set(folderChain(nodes, selectedId ?? '').map(node => node.id));

  return (
    <ul className="folder-tree">
      {topLevelFolders(nodes).map(folder => (
        <FolderBranch
          key={folder.id}
          nodes={nodes}
          folder={folder}
          selectedId={selectedId}
          expanded={expanded}
          onSelect={onSelect}
        />
      ))}
    </ul>
  );
}
