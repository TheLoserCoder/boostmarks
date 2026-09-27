import { vi } from 'vitest';
import type { ProjectionClient } from '../../../../app/features/bookmarks/application/ports';
import type { BookmarkNode } from '../../../../app/features/bookmarks/domain/types';

export const node = (partial: Partial<BookmarkNode> & { id: string }): BookmarkNode => ({
  parentId: null,
  title: '',
  kind: 'bookmark',
  index: 0,
  ...partial,
});

export function fakeClient(nodes: BookmarkNode[] = []) {
  let listener: (() => void) | undefined;
  const client: ProjectionClient = {
    read: vi.fn(async () => nodes),
    readFreshness: vi.fn(async () => undefined),
    requestSync: vi.fn(),
    subscribe: vi.fn((next: () => void) => {
      listener = next;
      return () => {
        listener = undefined;
      };
    }),
  };
  return {
    client,
    notify: () => listener?.(),
    setNodes: (next: BookmarkNode[]) => {
      nodes = next;
    },
  };
}
