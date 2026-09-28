import { describe, expect, it } from 'vitest';
import { createBookmarkSync } from '../../../app/features/bookmarks/application/bookmarkSync';
import type { BookmarkSource, ChangeInfo, MoveInfo } from '../../../app/features/bookmarks/application/ports';
import type { ProjectionStore } from '../../../app/features/bookmarks/adapters/projectionStore';
import type { BookmarkNode, RawTreeNode } from '../../../app/features/bookmarks/domain/types';

class MemoryStore implements ProjectionStore {
  readonly nodes = new Map<string, BookmarkNode>();
  readonly meta = new Map<string, unknown>();

  async readAll() {
    return [...this.nodes.values()];
  }
  async replaceAll(nodes: BookmarkNode[]) {
    this.nodes.clear();
    for (const node of nodes) this.nodes.set(node.id, node);
  }
  async upsert(nodes: BookmarkNode[]) {
    for (const node of nodes) this.nodes.set(node.id, node);
  }
  async remove(ids: string[]) {
    for (const id of ids) this.nodes.delete(id);
  }
  async readMeta<T>(key: string) {
    return this.meta.get(key) as T | undefined;
  }
  async writeMeta(key: string, value: unknown) {
    this.meta.set(key, value);
  }
}

type Emit = {
  created: (node: RawTreeNode) => void;
  changed: (id: string, change: ChangeInfo) => void;
  moved: (id: string, move: MoveInfo) => void;
  removed: (id: string) => void;
  reordered: (id: string, childIds: string[]) => void;
  importEnded: () => void;
};

class MemorySource implements BookmarkSource {
  tree: RawTreeNode[] = [];
  treeCalls = 0;
  private listeners = new Map<keyof Emit, ((...args: never[]) => void)[]>();

  async getTree() {
    this.treeCalls++;
    return structuredClone(this.tree);
  }
  onCreated(listener: Emit['created']) {
    this.on('created', listener);
  }
  onChanged(listener: Emit['changed']) {
    this.on('changed', listener);
  }
  onMoved(listener: Emit['moved']) {
    this.on('moved', listener);
  }
  onRemoved(listener: Emit['removed']) {
    this.on('removed', listener);
  }
  onChildrenReordered(listener: Emit['reordered']) {
    this.on('reordered', listener);
  }
  onImportEnded(listener: Emit['importEnded']) {
    this.on('importEnded', listener);
  }

  emit<K extends keyof Emit>(type: K, ...args: Parameters<Emit[K]>) {
    for (const listener of this.listeners.get(type) ?? []) listener(...(args as never[]));
  }

  private on(type: keyof Emit, listener: (...args: never[]) => void) {
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]);
  }
}

const raw = (partial: Partial<RawTreeNode> & { id: string }): RawTreeNode => ({
  title: '',
  index: 0,
  ...partial,
});

const baseTree: RawTreeNode[] = [
  raw({
    id: 'root',
    title: '',
    index: 0,
    children: [
      raw({
        id: 'bar',
        parentId: 'root',
        title: 'Bar',
        index: 0,
        children: [
          raw({ id: 'a', parentId: 'bar', title: 'A', url: 'https://a.dev', index: 0 }),
          raw({
            id: 'folder',
            parentId: 'bar',
            title: 'Folder',
            index: 1,
            children: [raw({ id: 'nested', parentId: 'folder', title: 'Nested', url: 'https://n.dev', index: 0 })],
          }),
        ],
      }),
    ],
  }),
];

function setup(tree: RawTreeNode[] = baseTree) {
  const store = new MemoryStore();
  const source = new MemorySource();
  source.tree = tree;
  const notifications: string[] = [];
  const sync = createBookmarkSync({
    source,
    store,
    notify: message => notifications.push(message.reason),
  });
  return { store, source, notifications, sync };
}

describe('bookmarkSync hydrate', () => {
  it('persists the flattened browser tree and marks it fresh', async () => {
    const { sync, store } = setup();

    const nodes = await sync.hydrate();

    expect(nodes.map(node => node.id).sort()).toEqual(['a', 'bar', 'folder', 'nested', 'root']);
    expect([...store.nodes.keys()].sort()).toEqual(['a', 'bar', 'folder', 'nested', 'root']);
    expect(await store.readMeta('lastHydratedAt')).toEqual(expect.any(Number));
  });
});

describe('bookmarkSync events', () => {
  it('applies a created bookmark after hydration', async () => {
    const { sync, store, source } = setup();
    sync.start();
    await sync.whenIdle();

    source.emit('created', raw({ id: 'new', parentId: 'bar', title: 'New', url: 'https://new.dev', index: 2 }));
    await sync.whenIdle();

    expect(store.nodes.get('new')).toMatchObject({ parentId: 'bar', url: 'https://new.dev', kind: 'bookmark' });
  });

  it('merges a partial title change and turns a URL change into a bookmark', async () => {
    const { sync, store, source } = setup();
    sync.start();
    await sync.whenIdle();

    source.emit('changed', 'a', { title: 'A2' });
    source.emit('changed', 'folder', { url: 'https://now-bookmark.dev' });
    await sync.whenIdle();

    expect(store.nodes.get('a')).toMatchObject({ title: 'A2', url: 'https://a.dev' });
    expect(store.nodes.get('folder')).toMatchObject({ url: 'https://now-bookmark.dev', kind: 'bookmark' });
  });

  it('re-parents a moved bookmark', async () => {
    const { sync, store, source } = setup();
    sync.start();
    await sync.whenIdle();

    source.emit('moved', 'a', { parentId: 'folder', index: 0 });
    await sync.whenIdle();

    expect(store.nodes.get('a')).toMatchObject({ parentId: 'folder', index: 0 });
  });

  it('persists shifted sibling indexes, not only the moved node', async () => {
    const { sync, store, source } = setup();
    sync.start();
    await sync.whenIdle();
    source.emit('moved', 'folder', { parentId: 'bar', index: 0 });
    await sync.whenIdle();
    expect(store.nodes.get('folder')?.index).toBe(0);
    expect(store.nodes.get('a')?.index).toBe(1);
  });

  it('prunes descendants when a folder is removed', async () => {
    const { sync, store, source } = setup();
    sync.start();
    await sync.whenIdle();

    source.emit('removed', 'folder');
    await sync.whenIdle();

    expect([...store.nodes.keys()].sort()).toEqual(['a', 'bar', 'root']);
  });

  it('re-indexes children on reorder', async () => {
    const { sync, store, source } = setup();
    sync.start();
    await sync.whenIdle();

    source.emit('reordered', 'bar', ['folder', 'a']);
    await sync.whenIdle();

    expect(store.nodes.get('folder')?.index).toBe(0);
    expect(store.nodes.get('a')?.index).toBe(1);
  });

  it('drops vanished nodes after an import resyncs from the browser tree', async () => {
    const { sync, store, source } = setup();
    sync.start();
    await sync.whenIdle();

    source.tree = [raw({ id: 'root', title: '', index: 0, children: [raw({ id: 'bar', parentId: 'root', title: 'Bar', index: 0 })] })];
    source.emit('importEnded');
    await sync.whenIdle();

    expect(source.treeCalls).toBe(2);
    expect([...store.nodes.keys()].sort()).toEqual(['bar', 'root']);
  });

  it('processes events that arrive before the first hydration by loading the stored projection', async () => {
    const { sync, store, source } = setup();

    sync.start();
    source.emit('created', raw({ id: 'early', parentId: 'bar', title: 'Early', url: 'https://early.dev', index: 5 }));
    await sync.whenIdle();

    expect(store.nodes.get('early')?.title).toBe('Early');
    expect(source.treeCalls).toBe(1);
  });

  it('notifies listeners with the reason for each applied change', async () => {
    const { sync, source, notifications } = setup();
    sync.start();
    await sync.whenIdle();

    source.emit('created', raw({ id: 'n', parentId: 'bar', title: 'N', index: 9 }));
    await sync.whenIdle();

    expect(notifications).toEqual(['hydrated', 'created']);
  });
});
