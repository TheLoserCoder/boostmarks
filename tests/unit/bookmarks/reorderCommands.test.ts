import { describe, expect, it, vi } from 'vitest';
import { createBrowserBookmarkCommands, type BookmarkMutationApi } from '../../../app/features/bookmarks/adapters/browserBookmarkCommands';
import { createBookmarkCommandsClient } from '../../../app/features/bookmarks/adapters/bookmarkCommandsClient';
import { BOOKMARK_MOVE_BEFORE, isMoveBeforeRequestMessage } from '../../../app/features/bookmarks/application/messages';

function api(): BookmarkMutationApi {
  const nodes = new Map([
    ['root', { id: 'root', title: '' }],
    ['bar', { id: 'bar', title: 'Панель', parentId: 'root' }],
    ['a', { id: 'a', title: 'A', parentId: 'bar', index: 0, url: 'https://a.dev' }],
    ['b', { id: 'b', title: 'B', parentId: 'bar', index: 1, url: 'https://b.dev' }],
    ['c', { id: 'c', title: 'C', parentId: 'bar', index: 2, url: 'https://c.dev' }],
  ]);
  return {
    get: vi.fn(async id => nodes.has(id) ? [nodes.get(id)!] : []),
    getChildren: vi.fn(async id => id === 'bar' ? ['a', 'b', 'c'].map(key => nodes.get(key)!) : []),
    create: vi.fn(async () => ({ id: 'new' })),
    move: vi.fn(async (id: string) => ({ id })),
  };
}

describe('move before a sibling', () => {
  it('computes the final index after removing the source from current native children', async () => {
    const native = api();
    const commands = createBrowserBookmarkCommands(native);
    await expect(commands.moveBefore('a', 'c')).resolves.toEqual({ ok: true });
    expect(native.move).toHaveBeenCalledWith('a', { parentId: 'bar', index: 1 });
    await expect(commands.moveBefore('c', 'a')).resolves.toEqual({ ok: true });
    expect(native.move).toHaveBeenLastCalledWith('c', { parentId: 'bar', index: 0 });
  });

  it('does not move if it is already immediately before the anchor or is the anchor', async () => {
    const native = api();
    const commands = createBrowserBookmarkCommands(native);
    await expect(commands.moveBefore('a', 'b')).resolves.toEqual({ ok: false, reason: 'unchanged' });
    await expect(commands.moveBefore('a', 'a')).resolves.toEqual({ ok: false, reason: 'unchanged' });
    expect(native.move).not.toHaveBeenCalled();
  });

  it('refuses stale, cross-folder and managed targets before calling move', async () => {
    const native = api();
    const commands = createBrowserBookmarkCommands(native);
    await expect(commands.moveBefore('gone', 'b')).resolves.toEqual({ ok: false, reason: 'missing-source' });
    await expect(commands.moveBefore('a', 'gone')).resolves.toEqual({ ok: false, reason: 'invalid-parent' });
    await expect(commands.moveBefore('a', 'bar')).resolves.toEqual({ ok: false, reason: 'invalid-parent' });
    vi.mocked(native.get).mockImplementation(async id => id === 'b'
      ? [{ id: 'b', title: 'B', parentId: 'bar', unmodifiable: 'managed' }]
      : id === 'root' ? [{ id: 'root', title: '' }] : [{ id, parentId: 'bar', title: 'Bookmark' }]);
    await expect(commands.moveBefore('a', 'b')).resolves.toEqual({ ok: false, reason: 'invalid-parent' });
    expect(native.move).not.toHaveBeenCalled();
  });

  it('passes a typed message and rejects non-integer indexes in unrelated messages', async () => {
    const send = vi.fn(async () => ({ ok: true }));
    await expect(createBookmarkCommandsClient(send).moveBefore('a', 'c')).resolves.toEqual({ ok: true });
    expect(send).toHaveBeenCalledWith({ type: BOOKMARK_MOVE_BEFORE, id: 'a', beforeId: 'c' });
    expect(isMoveBeforeRequestMessage({ type: BOOKMARK_MOVE_BEFORE, id: 'a', beforeId: 'c' })).toBe(true);
    expect(isMoveBeforeRequestMessage({ type: BOOKMARK_MOVE_BEFORE, id: 'a', beforeId: 2 })).toBe(false);
  });
});
