import type { BookmarkCommands, CreateFolderResult } from '../application/ports';

/** The subset of `browser.bookmarks` this adapter needs, injected at the composition root. */
export interface BookmarkMutationApi {
  get(id: string): Promise<readonly { id: string }[]>;
  create(details: { parentId: string; title: string; url?: string }): Promise<{ id: string }>;
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
  };
}
