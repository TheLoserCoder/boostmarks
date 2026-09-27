import { childrenOf, isSyntheticRoot } from './path';
import type { BookmarkNode } from './types';

/** Native folders we are allowed to create into; the synthetic browser root is not writable. */
export function isWritableFolder(node: BookmarkNode | undefined): node is BookmarkNode {
  return node !== undefined && node.kind === 'folder' && !isSyntheticRoot(node);
}

export type CreateTargetFailure = 'missing' | 'not-writable';

export type CreateTarget =
  | { ok: true; parentId: string; parentTitle: string }
  | { ok: false; reason: CreateTargetFailure };

export interface CreateTargetInput {
  /** Node the user right-clicked, when the gesture started on a row. */
  clickedId: string | null;
  /** Folder currently open in the pane, used for gestures on the empty background. */
  currentFolderId: string | null;
}

/**
 * Where a new folder should be created: inside a clicked folder, in the parent of a
 * clicked bookmark, or in the folder open in the pane.
 */
export function resolveCreateTarget(nodes: BookmarkNode[], input: CreateTargetInput): CreateTarget {
  const byId = new Map(nodes.map(node => [node.id, node]));
  const clicked = input.clickedId === null ? undefined : byId.get(input.clickedId);

  const parent =
    clicked === undefined
      ? input.currentFolderId === null
        ? undefined
        : byId.get(input.currentFolderId)
      : clicked.kind === 'folder'
        ? clicked
        : clicked.parentId === null
          ? undefined
          : byId.get(clicked.parentId);

  if (parent === undefined) return { ok: false, reason: 'missing' };
  if (!isWritableFolder(parent)) return { ok: false, reason: 'not-writable' };
  return { ok: true, parentId: parent.id, parentTitle: parent.title || 'Корень' };
}

export type FolderNameError = 'empty' | 'duplicate';

/** Sibling folders may not repeat a name, so the new folder stays addressable by path. */
export function validateFolderName(name: string, siblings: readonly BookmarkNode[]): FolderNameError | null {
  const trimmed = name.trim();
  if (trimmed.length === 0) return 'empty';

  const lower = trimmed.toLocaleLowerCase();
  const clash = siblings.some(node => node.kind === 'folder' && node.title.trim().toLocaleLowerCase() === lower);
  return clash ? 'duplicate' : null;
}

export function siblingFolders(nodes: BookmarkNode[], parentId: string): BookmarkNode[] {
  return childrenOf(nodes, parentId);
}
