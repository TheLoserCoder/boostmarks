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

export const PATH_SEPARATOR = '\\';

export function formatFolderPath(nodes: BookmarkNode[], id: string): string {
  return folderChain(nodes, id)
    .map(node => node.title)
    .join(PATH_SEPARATOR);
}

export type PathResolution =
  | { ok: true; folderId: string }
  | { ok: false; reason: 'empty' | 'not-found' | 'ambiguous' };

/** Resolves a typed folder path (names joined with backslashes) without guessing between same-named folders. */
export function resolveFolderPath(nodes: BookmarkNode[], input: string): PathResolution {
  const segments = input
    .split(PATH_SEPARATOR)
    .map(segment => segment.trim())
    .filter(segment => segment.length > 0);
  if (segments.length === 0) return { ok: false, reason: 'empty' };

  let candidates = topLevelFolders(nodes);
  let current: BookmarkNode | undefined;
  for (const segment of segments) {
    const lower = segment.toLocaleLowerCase();
    const matches = candidates.filter(node => node.title.toLocaleLowerCase() === lower);
    if (matches.length === 0) return { ok: false, reason: 'not-found' };
    if (matches.length > 1) return { ok: false, reason: 'ambiguous' };
    current = matches[0]!;
    candidates = childrenOf(nodes, current.id).filter(node => node.kind === 'folder');
  }

  return current === undefined ? { ok: false, reason: 'empty' } : { ok: true, folderId: current.id };
}

/** Sidebar list: pinned entries in their chosen order, then remaining top-level folders. */
export function quickLinks(nodes: BookmarkNode[], pinnedIds: readonly string[]): BookmarkNode[] {
  const byId = new Map(nodes.map(node => [node.id, node]));
  const links: BookmarkNode[] = [];
  const seen = new Set<string>();

  for (const id of pinnedIds) {
    const node = byId.get(id);
    if (node !== undefined && node.kind !== 'separator' && !seen.has(id)) {
      links.push(node);
      seen.add(id);
    }
  }
  for (const folder of topLevelFolders(nodes)) {
    if (!seen.has(folder.id)) {
      links.push(folder);
      seen.add(folder.id);
    }
  }

  return links;
}
