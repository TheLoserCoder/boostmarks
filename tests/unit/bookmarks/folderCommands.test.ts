import { describe, expect, it, vi } from 'vitest';
import { createBrowserBookmarkCommands, type BookmarkMutationApi } from '../../../app/features/bookmarks/adapters/browserBookmarkCommands';
import { createBookmarkCommandsClient } from '../../../app/features/bookmarks/adapters/bookmarkCommandsClient';
import { BOOKMARK_CREATE_FOLDER } from '../../../app/features/bookmarks/application/messages';

function api(overrides: Partial<BookmarkMutationApi> = {}): BookmarkMutationApi {
  return {
    get: vi.fn(async () => [{ id: 'bar', title: 'Панель' }]),
    getChildren: vi.fn(async () => []),
    create: vi.fn(async () => ({ id: 'new-folder' })),
    move: vi.fn(async (id: string) => ({ id })),
    ...overrides,
  };
}

describe('browser bookmark commands', () => {
  it('trims the title and returns the created native id', async () => {
    const create = vi.fn(async () => ({ id: 'new-folder' }));
    const commands = createBrowserBookmarkCommands(api({ create }));

    await expect(commands.createFolder('bar', '  Отпуск  ')).resolves.toEqual({ ok: true, id: 'new-folder' });
    expect(create).toHaveBeenCalledWith({ parentId: 'bar', title: 'Отпуск' });
  });

  it('refuses an empty title before touching the browser API', async () => {
    const get = vi.fn(async () => [{ id: 'bar', title: 'Панель' }]);
    const commands = createBrowserBookmarkCommands(api({ get }));

    await expect(commands.createFolder('bar', '   ')).resolves.toEqual({ ok: false, reason: 'invalid-title' });
    expect(get).not.toHaveBeenCalled();
  });

  it('reports a parent that disappeared before the dialog was confirmed', async () => {
    const commands = createBrowserBookmarkCommands(api({ get: vi.fn(async () => []) }));

    await expect(commands.createFolder('gone', 'Отпуск')).resolves.toEqual({ ok: false, reason: 'invalid-parent' });
  });

  it('surfaces a browser failure without throwing', async () => {
    const commands = createBrowserBookmarkCommands(
      api({ create: vi.fn(async () => Promise.reject(new Error('quota'))) }),
    );

    await expect(commands.createFolder('bar', 'Отпуск')).resolves.toEqual({ ok: false, reason: 'failed' });
  });
});

describe('bookmark commands client', () => {
  it('sends the create-folder request and returns the parsed response', async () => {
    const send = vi.fn(async () => ({ ok: true, id: 'abc' }));
    const commands = createBookmarkCommandsClient(send);

    await expect(commands.createFolder('bar', 'Работа')).resolves.toEqual({ ok: true, id: 'abc' });
    expect(send).toHaveBeenCalledWith({ type: BOOKMARK_CREATE_FOLDER, parentId: 'bar', title: 'Работа' });
  });

  it('passes a failure reason through', async () => {
    const commands = createBookmarkCommandsClient(async () => ({ ok: false, reason: 'invalid-parent' }));

    await expect(commands.createFolder('bar', 'Работа')).resolves.toEqual({ ok: false, reason: 'invalid-parent' });
  });

  it('falls back to a generic failure for malformed responses and transport errors', async () => {
    const malformed = createBookmarkCommandsClient(async () => 'nope');
    const throwing = createBookmarkCommandsClient(async () => {
      throw new Error('no receiver');
    });

    await expect(malformed.createFolder('bar', 'Работа')).resolves.toEqual({ ok: false, reason: 'failed' });
    await expect(throwing.createFolder('bar', 'Работа')).resolves.toEqual({ ok: false, reason: 'failed' });
  });
});
