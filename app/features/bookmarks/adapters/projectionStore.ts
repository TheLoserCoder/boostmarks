import Dexie, { type Table } from 'dexie';
import type { BookmarkNode } from '../domain/types';

export interface MetaRecord {
  key: string;
  value: unknown;
}

class ProjectionDatabase extends Dexie {
  nodes!: Table<BookmarkNode, string>;
  meta!: Table<MetaRecord, string>;

  constructor(name: string) {
    super(name);
    this.version(1).stores({
      nodes: 'id, parentId, kind, index',
      meta: 'key',
    });
  }
}

export interface ProjectionStore {
  readAll(): Promise<BookmarkNode[]>;
  replaceAll(nodes: BookmarkNode[]): Promise<void>;
  upsert(nodes: BookmarkNode[]): Promise<void>;
  remove(ids: string[]): Promise<void>;
  readMeta<T>(key: string): Promise<T | undefined>;
  writeMeta(key: string, value: unknown): Promise<void>;
}

export function createProjectionStore(databaseName = 'boostmarks'): ProjectionStore {
  const db = new ProjectionDatabase(databaseName);

  return {
    async readAll() {
      return db.nodes.toArray();
    },
    async replaceAll(nodes) {
      await db.transaction('rw', db.nodes, async () => {
        await db.nodes.clear();
        await db.nodes.bulkPut(nodes);
      });
    },
    async upsert(nodes) {
      await db.nodes.bulkPut(nodes);
    },
    async remove(ids) {
      await db.nodes.bulkDelete(ids);
    },
    async readMeta(key) {
      const record = await db.meta.get(key);
      return record?.value as never;
    },
    async writeMeta(key, value) {
      await db.meta.put({ key, value });
    },
  };
}
