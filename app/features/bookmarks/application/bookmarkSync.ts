import type { ProjectionStore } from '../adapters/projectionStore';
import { applyChanged, applyCreated, applyMoved, applyReordered, descendantIds } from '../domain/reconcile';
import { flattenTree, fromRawNode } from '../domain/tree';
import type { BookmarkNode } from '../domain/types';
import type { BookmarkSource, SyncNotification, SyncReason } from './ports';

export interface BookmarkSyncDeps {
  source: BookmarkSource;
  store: ProjectionStore;
  notify: (message: SyncNotification) => void;
}

export interface BookmarkSync {
  /** Full projection rebuild from the browser tree. */
  hydrate(): Promise<BookmarkNode[]>;
  /** Subscribes to browser events; queued after an initial hydration. */
  start(): void;
  /** Resolves when all queued work has finished. */
  whenIdle(): Promise<void>;
}

const LAST_HYDRATED_AT = 'lastHydratedAt';

export function createBookmarkSync({ source, store, notify }: BookmarkSyncDeps): BookmarkSync {
  let state: BookmarkNode[] | null = null;
  let chain: Promise<unknown> = Promise.resolve();

  const enqueue = <T>(task: () => Promise<T>): Promise<T> => {
    const run = chain.then(task, task);
    chain = run.catch(() => undefined);
    return run;
  };

  const whenIdle = () => chain.then(() => undefined);

  const loadState = async () => {
    state ??= await store.readAll();
    return state;
  };

  const rebuild = (reason: SyncReason) =>
    enqueue(async () => {
      const flat = flattenTree(await source.getTree());
      await store.replaceAll(flat);
      await store.writeMeta(LAST_HYDRATED_AT, Date.now());
      state = flat;
      notify({ reason });
      return flat;
    });

  const hydrate = () => rebuild('hydrated');

  const mutate = (reason: SyncReason, apply: (current: BookmarkNode[]) => { next: BookmarkNode[]; persist: () => Promise<void> }) =>
    enqueue(async () => {
      const current = await loadState();
      const { next, persist } = apply(current);
      if (next === current) return;
      await persist();
      state = next;
      notify({ reason });
    });

  const start = () => {
    void hydrate();
    source.onCreated(created => {
      void mutate('created', current => {
        const node = fromRawNode(created, created.parentId ?? null);
        return { next: applyCreated(current, node), persist: () => store.upsert([node]) };
      });
    });
    source.onChanged((id, change) => {
      void mutate('changed', current => {
        const next = applyChanged(current, id, change);
        const updated = next.find(node => node.id === id);
        return { next: updated === undefined ? current : next, persist: () => store.upsert([updated!]) };
      });
    });
    source.onMoved((id, move) => {
      void mutate('moved', current => {
        const next = applyMoved(current, id, move);
        const changed = next.filter((node, index) => node !== current[index]);
        return { next, persist: () => store.upsert(changed) };
      });
    });
    source.onRemoved(id => {
      void mutate('removed', current => {
        if (!current.some(node => node.id === id)) return { next: current, persist: async () => undefined };
        const removed = new Set(descendantIds(current, id));
        return { next: current.filter(node => !removed.has(node.id)), persist: () => store.remove([...removed]) };
      });
    });
    source.onChildrenReordered((id, childIds) => {
      void mutate('reordered', current => {
        const order = new Map(childIds.map((childId, position) => [childId, position]));
        const next = applyReordered(current, id, childIds);
        const changed = next.filter(node => order.has(node.id));
        return { next, persist: () => store.upsert(changed) };
      });
    });
    source.onImportEnded(() => {
      void rebuild('resynced');
    });
  };

  return { hydrate, start, whenIdle };
}
