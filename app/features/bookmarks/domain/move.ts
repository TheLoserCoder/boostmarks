import type { BookmarkNode } from './types';
import { isWritableFolder } from './createFolder';

export type MoveError = 'missing-source' | 'invalid-parent' | 'cycle' | 'unchanged' | 'unmodifiable';

export function validateMove(nodes: readonly BookmarkNode[], id: string, parentId: string): MoveError | null {
  const byId = new Map(nodes.map(node => [node.id, node]));
  const source = byId.get(id);
  if (source === undefined) return 'missing-source';
  if (source.unmodifiable !== undefined || source.parentId === null) return 'unmodifiable';
  const parent = byId.get(parentId);
  if (!isWritableFolder(parent) || parent.unmodifiable !== undefined) return 'invalid-parent';
  if (id === parentId) return 'cycle';
  if (source.parentId === parentId) return 'unchanged';

  const visited = new Set<string>();
  let current: BookmarkNode | undefined = parent;
  while (current !== undefined) {
    if (current.id === id) return 'cycle';
    if (visited.has(current.id)) return 'invalid-parent';
    visited.add(current.id);
    current = current.parentId === null ? undefined : byId.get(current.parentId);
  }
  return null;
}
