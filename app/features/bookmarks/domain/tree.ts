import type { BookmarkKind, BookmarkNode, RawTreeNode } from './types';

function kindOf(raw: RawTreeNode): BookmarkKind {
  if (raw.type === 'separator') return 'separator';
  return raw.url === undefined ? 'folder' : 'bookmark';
}

export function fromRawNode(raw: RawTreeNode, parentId: string | null): BookmarkNode {
  const node: BookmarkNode = {
    id: raw.id,
    parentId,
    title: raw.title,
    kind: kindOf(raw),
    index: raw.index ?? 0,
  };
  if (raw.url !== undefined) node.url = raw.url;
  if (raw.dateAdded !== undefined) node.dateAdded = raw.dateAdded;
  if (raw.dateGroupModified !== undefined) node.dateGroupModified = raw.dateGroupModified;
  if (raw.unmodifiable !== undefined) node.unmodifiable = raw.unmodifiable;
  return node;
}

export function flattenTree(roots: RawTreeNode[]): BookmarkNode[] {
  const nodes: BookmarkNode[] = [];

  const visit = (raw: RawTreeNode, parentId: string | null) => {
    nodes.push(fromRawNode(raw, parentId));
    for (const child of raw.children ?? []) visit(child, raw.id);
  };

  for (const root of roots) visit(root, root.parentId ?? null);
  return nodes;
}

export interface BookmarkTree {
  node: BookmarkNode;
  children: BookmarkTree[];
}

/** Browser trees wrap everything in an unnamed synthetic root folder; the UI shows its children instead. */
export function topLevelEntries(trees: BookmarkTree[]): BookmarkTree[] {
  return trees.flatMap(entry =>
    entry.node.parentId === null && entry.node.kind === 'folder' && entry.node.title === '' ? entry.children : [entry],
  );
}

export function buildTree(nodes: BookmarkNode[]): BookmarkTree[] {
  const ids = new Set(nodes.map(node => node.id));
  const childrenOf = new Map<string, BookmarkNode[]>();
  for (const node of nodes) {
    if (node.parentId === null || !ids.has(node.parentId)) continue;
    const siblings = childrenOf.get(node.parentId) ?? [];
    siblings.push(node);
    childrenOf.set(node.parentId, siblings);
  }

  const assemble = (node: BookmarkNode): BookmarkTree => ({
    node,
    children: (childrenOf.get(node.id) ?? []).slice().sort((a, b) => a.index - b.index).map(assemble),
  });

  return nodes
    .filter(node => node.parentId === null || !ids.has(node.parentId))
    .slice()
    .sort((a, b) => a.index - b.index)
    .map(assemble);
}
