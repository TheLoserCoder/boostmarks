import { validateMove } from './move';
import { childrenOf } from './path';
import type { BookmarkNode } from './types';

/** Where a drag can land: inside a folder, or immediately before a sibling row. */
export type DropKind = 'folder' | 'before';

/**
 * Whether the drag gesture should be accepted. This only describes the UI rule;
 * native commands re-check the tree before mutating it, so a stale projection
 * can never turn a rejected drop into a native change.
 */
export function canDropOn(
  nodes: readonly BookmarkNode[],
  activeId: string,
  kind: DropKind,
  targetId: string,
): boolean {
  if (kind === 'folder') return validateMove(nodes, activeId, targetId) === null;

  const source = nodes.find(node => node.id === activeId);
  if (source === undefined || source.unmodifiable !== undefined || source.parentId === null) return false;
  if (activeId === targetId) return false;

  const anchor = nodes.find(node => node.id === targetId);
  if (anchor === undefined || anchor.unmodifiable !== undefined || anchor.kind === 'separator') return false;
  if (anchor.parentId !== source.parentId) return false;
  // Dropping an item right before its immediate successor leaves the order untouched.
  return source.index !== anchor.index - 1;
}

/**
 * Multi-selection rule: a group drop is accepted only when every item can move,
 * so a partially valid selection never silently moves a subset. Positional
 * groups land as one block in their current order; a block that already sits
 * right before the anchor is a no-op and therefore rejected.
 */
export function canDropManyOn(
  nodes: readonly BookmarkNode[],
  ids: readonly string[],
  kind: DropKind,
  targetId: string,
): boolean {
  if (ids.length === 0) return false;
  if (ids.length === 1) return canDropOn(nodes, ids[0]!, kind, targetId);

  if (kind === 'folder') {
    return ids.every(id => validateMove(nodes, id, targetId) === null);
  }

  const byId = new Map(nodes.map(node => [node.id, node]));
  const anchor = byId.get(targetId);
  if (
    anchor === undefined ||
    anchor.parentId === null ||
    anchor.unmodifiable !== undefined ||
    anchor.kind === 'separator'
  ) {
    return false;
  }

  const selected = new Set(ids);
  if (selected.has(targetId)) return false;

  const everySibling = ids.every(id => {
    const source = byId.get(id);
    return source !== undefined && source.unmodifiable === undefined && source.parentId === anchor.parentId;
  });
  if (!everySibling) return false;

  const siblings = childrenOf(nodes, anchor.parentId);
  const selectedInOrder = siblings.filter(sibling => selected.has(sibling.id));
  if (selectedInOrder.length !== ids.length) return false;

  const remaining = siblings.filter(sibling => !selected.has(sibling.id));
  const anchorIndex = remaining.findIndex(sibling => sibling.id === targetId);
  if (anchorIndex === -1) return false;

  const reordered = [...remaining.slice(0, anchorIndex), ...selectedInOrder, ...remaining.slice(anchorIndex)];
  return reordered.some((sibling, position) => sibling.id !== siblings[position]!.id);
}
