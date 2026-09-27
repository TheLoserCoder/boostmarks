import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { createProjectionStore } from '../../../app/features/bookmarks/adapters/projectionStore';
import { applyRemoved, descendantIds } from '../../../app/features/bookmarks/domain/reconcile';
import { buildTree, flattenTree, topLevelEntries } from '../../../app/features/bookmarks/domain/tree';
import type { BookmarkNode, RawTreeNode } from '../../../app/features/bookmarks/domain/types';

const FOLDERS = 50;
const BOOKMARKS_PER_FOLDER = 1000;

function generateRawTree(): RawTreeNode[] {
  const children: RawTreeNode[] = [];
  for (let folder = 0; folder < FOLDERS; folder++) {
    const bookmarks: RawTreeNode[] = [];
    for (let item = 0; item < BOOKMARKS_PER_FOLDER; item++) {
      bookmarks.push({
        id: `${folder}-${item}`,
        parentId: `folder-${folder}`,
        title: `Bookmark ${folder}/${item}`,
        url: `https://example.com/${folder}/${item}`,
        index: item,
      });
    }
    children.push({ id: `folder-${folder}`, parentId: '0', title: `Folder ${folder}`, index: folder, children: bookmarks });
  }
  return [{ id: '0', title: '', index: 0, children }];
}

function elapsed<T>(work: () => T): { result: T; ms: number } {
  const started = performance.now();
  const result = work();
  return { result, ms: Math.round(performance.now() - started) };
}

describe('projection scale', () => {
  it(`normalizes and assembles ${FOLDERS * BOOKMARKS_PER_FOLDER} nodes without pathological slowdown`, () => {
    const raw = generateRawTree();

    const flatten = elapsed(() => flattenTree(raw));
    const assemble = elapsed(() => topLevelEntries(buildTree(flatten.result)));

    console.info(`flattenTree: ${flatten.ms} ms, buildTree+topLevel: ${assemble.ms} ms (${flatten.result.length} nodes)`);

    expect(flatten.result).toHaveLength(FOLDERS * BOOKMARKS_PER_FOLDER + FOLDERS + 1);
    expect(assemble.result).toHaveLength(FOLDERS);
    expect(assemble.result[0]?.children).toHaveLength(BOOKMARKS_PER_FOLDER);
    expect(flatten.ms + assemble.ms).toBeLessThan(10_000);
  });

  it('prunes a folder with thousands of descendants quickly', () => {
    const nodes: BookmarkNode[] = flattenTree(generateRawTree());
    const previousLength = nodes.length;

    const prune = elapsed(() => applyRemoved(nodes, 'folder-0'));
    const removed = descendantIds(nodes, 'folder-0');

    console.info(`applyRemoved of one 1000-item folder: ${prune.ms} ms`);
    expect(removed).toHaveLength(BOOKMARKS_PER_FOLDER + 1);
    expect(prune.result).toHaveLength(previousLength - BOOKMARKS_PER_FOLDER - 1);
    expect(prune.ms).toBeLessThan(10_000);
  }, 30_000);

  it('round-trips a 20k-node projection through IndexedDB', async () => {
    const raw = generateRawTree();
    const nodes = flattenTree(raw).slice(0, 20_000);
    const store = createProjectionStore(`boostmarks-perf-${Date.now()}`);

    const write = await elapsedAsync(() => store.replaceAll(nodes));
    const read = await elapsedAsync(() => store.readAll());

    console.info(`IndexedDB write of ${nodes.length} nodes: ${write.ms} ms, read: ${read.ms} ms`);
    expect(read.result).toHaveLength(nodes.length);
  }, 60_000);
});

async function elapsedAsync<T>(work: () => Promise<T>): Promise<{ result: T; ms: number }> {
  const started = performance.now();
  const result = await work();
  return { result, ms: Math.round(performance.now() - started) };
}
