import type { BookmarkNode } from './types';

export interface ChangeInfo {
  title?: string;
  url?: string;
}

export interface MoveInfo {
  parentId: string;
  index: number;
}

export function applyCreated(nodes: BookmarkNode[], created: BookmarkNode): BookmarkNode[] {
  const existing = nodes.findIndex(node => node.id === created.id);
  if (existing === -1) return [...nodes, created];
  return nodes.map(node => (node.id === created.id ? created : node));
}

export function applyChanged(nodes: BookmarkNode[], id: string, change: ChangeInfo): BookmarkNode[] {
  if (!nodes.some(node => node.id === id)) return nodes;
  return nodes.map(node => {
    if (node.id !== id) return node;
    const next: BookmarkNode = { ...node };
    if (change.title !== undefined) next.title = change.title;
    if (change.url !== undefined) {
      next.url = change.url;
      next.kind = 'bookmark';
    }
    return next;
  });
}

export function applyMoved(nodes: BookmarkNode[], id: string, move: MoveInfo): BookmarkNode[] {
  const source = nodes.find(node => node.id === id);
  if (source === undefined) return nodes;
  return nodes.map(node => {
    if (node.id === id) return { ...node, parentId: move.parentId, index: move.index };
    if (source.parentId === move.parentId && node.parentId === move.parentId) {
      if (source.index < move.index && node.index > source.index && node.index <= move.index) {
        return { ...node, index: node.index - 1 };
      }
      if (source.index > move.index && node.index >= move.index && node.index < source.index) {
        return { ...node, index: node.index + 1 };
      }
    } else {
      if (node.parentId === source.parentId && node.index > source.index) return { ...node, index: node.index - 1 };
      if (node.parentId === move.parentId && node.index >= move.index) return { ...node, index: node.index + 1 };
    }
    return node;
  });
}

export function descendantIds(nodes: BookmarkNode[], rootId: string): string[] {
  const removed = new Set<string>([rootId]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const node of nodes) {
      if (node.parentId !== null && removed.has(node.parentId) && !removed.has(node.id)) {
        removed.add(node.id);
        grew = true;
      }
    }
  }
  return [...removed];
}

/** The browser fires a single onRemoved for a folder, so descendants must be pruned from the projection. */
export function applyRemoved(nodes: BookmarkNode[], id: string): BookmarkNode[] {
  if (!nodes.some(node => node.id === id)) return nodes;
  const removed = new Set(descendantIds(nodes, id));
  return nodes.filter(node => !removed.has(node.id));
}

export function applyReordered(nodes: BookmarkNode[], parentId: string, childIds: string[]): BookmarkNode[] {
  const order = new Map(childIds.map((id, position) => [id, position]));
  return nodes.map(node =>
    node.parentId === parentId && order.has(node.id) ? { ...node, index: order.get(node.id)! } : node,
  );
}
