import { describe, expect, it, vi } from 'vitest';
import { createBrowserBookmarkCommands, type BookmarkMutationApi } from '../../../app/features/bookmarks/adapters/browserBookmarkCommands';
import { createBookmarkCommandsClient } from '../../../app/features/bookmarks/adapters/bookmarkCommandsClient';
import { BOOKMARK_MOVE, isMoveRequestMessage, isMoveResponseMessage } from '../../../app/features/bookmarks/application/messages';

const nativeNodes = new Map([
  ['root', { id: 'root', title: '' }],
  ['bar', { id: 'bar', parentId: 'root', title: 'Панель' }],
  ['other', { id: 'other', parentId: 'root', title: 'Другие' }],
  ['work', { id: 'work', parentId: 'bar', title: 'Работа' }],
  ['child', { id: 'child', parentId: 'work', title: 'Проект' }],
  ['link', { id: 'link', parentId: 'work', title: 'Сайт', url: 'https://example.com' }],
]);

function nativeApi() {
  const get = vi.fn(async (id: string) => {
    const found = nativeNodes.get(id);
    return found === undefined ? [] : [found];
  });
  const move = vi.fn(async (id: string, destination: { parentId: string }) => ({ id, parentId: destination.parentId }));
  return { get, getChildren: vi.fn(async () => []), move, create: vi.fn(async () => ({ id: 'created' })) } satisfies BookmarkMutationApi;
}

describe('native move command', () => {
  it('moves a bookmark using the browser API, not the projection', async () => {
    const api = nativeApi();
    await expect(createBrowserBookmarkCommands(api).move('link', 'other')).resolves.toEqual({ ok: true });
    expect(api.move).toHaveBeenCalledExactlyOnceWith('link', { parentId: 'other' });
  });

  it('refuses missing nodes and the browser root before calling move', async () => {
    const api = nativeApi();
    const commands = createBrowserBookmarkCommands(api);
    await expect(commands.move('missing', 'other')).resolves.toEqual({ ok: false, reason: 'missing-source' });
    await expect(commands.move('link', 'missing')).resolves.toEqual({ ok: false, reason: 'invalid-parent' });
    await expect(commands.move('link', 'root')).resolves.toEqual({ ok: false, reason: 'invalid-parent' });
    expect(api.move).not.toHaveBeenCalled();
  });

  it('refuses a folder moved into its descendant or itself', async () => {
    const api = nativeApi();
    const commands = createBrowserBookmarkCommands(api);
    await expect(commands.move('work', 'child')).resolves.toEqual({ ok: false, reason: 'cycle' });
    await expect(commands.move('work', 'work')).resolves.toEqual({ ok: false, reason: 'cycle' });
    expect(api.move).not.toHaveBeenCalled();
  });

  it('refuses unchanged and managed nodes without calling move', async () => {
    const api = nativeApi();
    const commands = createBrowserBookmarkCommands(api);
    await expect(commands.move('link', 'work')).resolves.toEqual({ ok: false, reason: 'unchanged' });
    api.get.mockImplementation(async id => id === 'link'
      ? [{ id: 'link', parentId: 'work', title: 'Сайт', unmodifiable: 'managed' }]
      : id === 'root' ? [{ id: 'root', title: '' }] : [{ id, parentId: 'root', title: 'Папка' }]);
    await expect(commands.move('link', 'other')).resolves.toEqual({ ok: false, reason: 'unmodifiable' });
    expect(api.move).not.toHaveBeenCalled();
  });

  it('refuses a bookmark as the destination', async () => {
    const api = nativeApi();
    await expect(createBrowserBookmarkCommands(api).move('work', 'link')).resolves.toEqual({ ok: false, reason: 'invalid-parent' });
    expect(api.move).not.toHaveBeenCalled();
  });

  it('returns a failure if native move rejects a changed tree', async () => {
    const api = nativeApi();
    api.move.mockRejectedValueOnce(new Error('destination disappeared'));
    await expect(createBrowserBookmarkCommands(api).move('link', 'other')).resolves.toEqual({ ok: false, reason: 'failed' });
  });
});

describe('move messages', () => {
  it('sends an id-only request through the page client', async () => {
    const send = vi.fn(async () => ({ ok: true }));
    await expect(createBookmarkCommandsClient(send).move('link', 'other')).resolves.toEqual({ ok: true });
    expect(send).toHaveBeenCalledExactlyOnceWith({ type: BOOKMARK_MOVE, id: 'link', parentId: 'other' });
  });

  it('rejects malformed input and responses', async () => {
    expect(isMoveRequestMessage({ type: BOOKMARK_MOVE, id: 'link', parentId: 'other' })).toBe(true);
    expect(isMoveRequestMessage({ type: BOOKMARK_MOVE, id: 'link', parentId: 123 })).toBe(false);
    expect(isMoveResponseMessage({ ok: false, reason: 'cycle' })).toBe(true);
    expect(isMoveResponseMessage({ ok: false, reason: 'anything' })).toBe(false);
    await expect(createBookmarkCommandsClient(async () => undefined).move('link', 'other')).resolves.toEqual({ ok: false, reason: 'failed' });
  });
});
