import type { BookmarkCommands, CreateFolderResult, MoveResult } from '../application/ports';
import { validateMove } from '../domain/move';
import { fromRawNode } from '../domain/tree';
import type { RawTreeNode } from '../domain/types';

/** The subset of `browser.bookmarks` this adapter needs, injected at the composition root. */
export interface BookmarkMutationApi {
  get(id: string): Promise<readonly RawTreeNode[]>;
  getChildren(id: string): Promise<readonly RawTreeNode[]>;
  create(details: { parentId: string; title: string; url?: string }): Promise<{ id: string }>;
  move(id: string, destination: { parentId: string; index?: number }): Promise<{ id: string }>;
}

async function nativeNode(api: BookmarkMutationApi, id: string): Promise<RawTreeNode | undefined> {
  try {
    return (await api.get(id))[0];
  } catch {
    return undefined;
  }
}

/**
 * Native bookmark mutations. Existence of the parent is re-checked here because the
 * native tree can change between the user opening the dialog and confirming it.
 */
export function createBrowserBookmarkCommands(api: BookmarkMutationApi): BookmarkCommands {
  return {
    async createFolder(parentId: string, title: string): Promise<CreateFolderResult> {
      const trimmed = title.trim();
      if (trimmed.length === 0) return { ok: false, reason: 'invalid-title' };

      try {
        const parents = await api.get(parentId);
        if (parents.length === 0) return { ok: false, reason: 'invalid-parent' };
      } catch {
        return { ok: false, reason: 'invalid-parent' };
      }

      try {
        const created = await api.create({ parentId, title: trimmed });
        return { ok: true, id: created.id };
      } catch {
        return { ok: false, reason: 'failed' };
      }
    },
    async move(id: string, parentId: string): Promise<MoveResult> {
      const source = await nativeNode(api, id);
      if (source === undefined) return { ok: false, reason: 'missing-source' };

      const nodes = [fromRawNode(source, source.parentId ?? null)];
      const visited = new Set<string>();
      let ancestorId: string | undefined = parentId;
      while (ancestorId !== undefined) {
        if (visited.has(ancestorId)) return { ok: false, reason: 'invalid-parent' };
        visited.add(ancestorId);
        const ancestor = await nativeNode(api, ancestorId);
        if (ancestor === undefined) return { ok: false, reason: 'invalid-parent' };
        if (ancestor.id !== source.id) nodes.push(fromRawNode(ancestor, ancestor.parentId ?? null));
        ancestorId = ancestor.parentId;
      }

      const error = validateMove(nodes, id, parentId);
      if (error !== null) return { ok: false, reason: error };
      try {
        await api.move(id, { parentId });
        return { ok: true };
      } catch {
        return { ok: false, reason: 'failed' };
      }
    },
    async moveBefore(id: string, beforeId: string): Promise<MoveResult> {
      const source = await nativeNode(api, id);
      if (source === undefined) return { ok: false, reason: 'missing-source' };
      if (id === beforeId) return { ok: false, reason: 'unchanged' };
      if (source.unmodifiable !== undefined || source.parentId === undefined) return { ok: false, reason: 'unmodifiable' };
      const anchor = await nativeNode(api, beforeId);
      if (anchor?.parentId === undefined || anchor.parentId !== source.parentId) {
        return { ok: false, reason: 'invalid-parent' };
      }
      if (anchor.unmodifiable !== undefined) return { ok: false, reason: 'invalid-parent' };

      try {
        const siblings = await api.getChildren(source.parentId);
        const ids = siblings.map(node => node.id);
        if (!ids.includes(id) || !ids.includes(beforeId)) return { ok: false, reason: 'invalid-parent' };
        const index = ids.filter(siblingId => siblingId !== id).indexOf(beforeId);
        if (index === ids.indexOf(id)) return { ok: false, reason: 'unchanged' };
        await api.move(id, { parentId: source.parentId, index });
        return { ok: true };
      } catch {
        return { ok: false, reason: 'failed' };
      }
    },
  };
}
