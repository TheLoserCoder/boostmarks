import type { BookmarkNode } from './types';

export function childrenOf(nodes: BookmarkNode[], parentId: string | null): BookmarkNode[] {
  return nodes
    .filter(node => node.parentId === parentId)
    .slice()
    .sort((a, b) => a.index - b.index);
}

function isSyntheticRoot(node: BookmarkNode): boolean {
  return node.parentId === null && node.kind === 'folder' && node.title === '';
}

function pathTo(nodes: BookmarkNode[], id: string): BookmarkNode[] {
  const byId = new Map(nodes.map(node => [node.id, node]));
  const chain: BookmarkNode[] = [];
  let current = byId.get(id);
  while (current !== undefined) {
    chain.unshift(current);
    current = current.parentId === null ? undefined : byId.get(current.parentId);
  }
  return chain;
}

/** Folder chain shown as breadcrumbs; the synthetic browser root is hidden and bookmarks are excluded. */
export function folderChain(nodes: BookmarkNode[], id: string): BookmarkNode[] {
  return pathTo(nodes, id).filter(node => !isSyntheticRoot(node) && node.kind !== 'bookmark');
}

export function topLevelFolders(nodes: BookmarkNode[]): BookmarkNode[] {
  const ids = new Set(nodes.map(node => node.id));
  const roots = nodes.filter(node => node.parentId === null || !ids.has(node.parentId));
  const synthetic = roots.filter(isSyntheticRoot);
  const real = roots.filter(node => !isSyntheticRoot(node) && node.kind === 'folder');

  const candidates = new Map<string, BookmarkNode>(real.map(node => [node.id, node]));
  for (const root of synthetic) {
    for (const child of childrenOf(nodes, root.id)) {
      if (child.kind === 'folder') candidates.set(child.id, child);
    }
  }

  return [...candidates.values()].sort((a, b) => a.index - b.index || a.id.localeCompare(b.id));
}
