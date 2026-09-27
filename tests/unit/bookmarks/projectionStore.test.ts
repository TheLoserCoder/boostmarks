import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { createProjectionStore, type ProjectionStore } from '../../../app/features/bookmarks/adapters/projectionStore';
import type { BookmarkNode } from '../../../app/features/bookmarks/domain/types';

const node = (partial: Partial<BookmarkNode> & { id: string }): BookmarkNode => ({
  parentId: null,
  title: '',
  kind: 'bookmark',
  index: 0,
  ...partial,
});

const sorted = (nodes: BookmarkNode[]) => nodes.slice().sort((a, b) => a.id.localeCompare(b.id));

let store: ProjectionStore;

beforeEach(() => {
  store = createProjectionStore(`boostmarks-test-${Math.random().toString(36).slice(2)}`);
});

describe('projection store', () => {
  it('reads an empty projection for a fresh database', async () => {
    await expect(store.readAll()).resolves.toEqual([]);
    await expect(store.readMeta('lastHydratedAt')).resolves.toBeUndefined();
  });

  it('round-trips a full snapshot', async () => {
    const snapshot = [
      node({ id: 'root', kind: 'folder' }),
      node({ id: 'a', parentId: 'root', title: 'A', url: 'https://a.dev' }),
      node({ id: 'b', parentId: 'root', kind: 'folder', index: 1 }),
    ];

    await store.replaceAll(snapshot);

    expect(sorted(await store.readAll())).toEqual(sorted(snapshot));
  });

  it('replaceAll drops nodes that are no longer in the browser tree', async () => {
    await store.replaceAll([node({ id: 'old' }), node({ id: 'kept' })]);
    await store.replaceAll([node({ id: 'kept' })]);

    expect((await store.readAll()).map(entry => entry.id)).toEqual(['kept']);
  });

  it('upsert inserts new nodes and updates existing ones', async () => {
    await store.replaceAll([node({ id: 'a', title: 'Old' })]);
    await store.upsert([node({ id: 'a', title: 'New' }), node({ id: 'b', title: 'Added', index: 2 })]);

    const all = await store.readAll();
    expect(all).toHaveLength(2);
    expect(all.find(entry => entry.id === 'a')?.title).toBe('New');
    expect(all.find(entry => entry.id === 'b')?.title).toBe('Added');
  });

  it('remove deletes exactly the requested ids', async () => {
    await store.replaceAll([node({ id: 'a' }), node({ id: 'b' }), node({ id: 'c' })]);

    await store.remove(['a', 'c']);

    expect((await store.readAll()).map(entry => entry.id)).toEqual(['b']);
  });

  it('stores metadata for freshness checks', async () => {
    await store.writeMeta('lastHydratedAt', 1735689600000);

    await expect(store.readMeta<number>('lastHydratedAt')).resolves.toBe(1735689600000);
  });
});
