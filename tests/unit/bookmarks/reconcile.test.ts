import { describe, expect, it } from 'vitest';
import { applyChanged, applyCreated, applyMoved, applyRemoved, applyReordered } from '../../../app/features/bookmarks/domain/reconcile';
import type { BookmarkNode } from '../../../app/features/bookmarks/domain/types';

const node = (partial: Partial<BookmarkNode> & { id: string }): BookmarkNode => ({
  parentId: null,
  title: '',
  kind: 'bookmark',
  index: 0,
  ...partial,
});

const fixture: BookmarkNode[] = [
  node({ id: 'root', parentId: null, kind: 'folder', title: '' }),
  node({ id: 'folder', parentId: 'root', kind: 'folder', title: 'Folder' }),
  node({ id: 'child-a', parentId: 'folder', title: 'A', url: 'https://a.dev' }),
  node({ id: 'child-b', parentId: 'folder', title: 'B', url: 'https://b.dev', index: 1 }),
  node({ id: 'grandchild', parentId: 'child-a', title: 'A1', url: 'https://a1.dev' }),
  node({ id: 'keeper', parentId: 'root', title: 'Keep me', url: 'https://keep.dev', index: 1 }),
];

describe('applyCreated', () => {
  it('inserts a new bookmark', () => {
    const next = applyCreated(fixture, node({ id: 'new', parentId: 'folder', title: 'New', url: 'https://new.dev', index: 2 }));

    expect(next).toHaveLength(fixture.length + 1);
    expect(next.at(-1)).toMatchObject({ id: 'new', parentId: 'folder', index: 2 });
  });

  it('replaces an existing node instead of duplicating it', () => {
    const next = applyCreated(fixture, node({ id: 'child-b', parentId: 'folder', title: 'Renamed', url: 'https://b.dev', index: 1 }));

    expect(next.filter(entry => entry.id === 'child-b')).toHaveLength(1);
    expect(next.find(entry => entry.id === 'child-b')?.title).toBe('Renamed');
  });
});

describe('applyChanged', () => {
  it('merges partial title/url changes without touching other fields', () => {
    const next = applyChanged(fixture, 'child-a', { title: 'A2' });

    expect(next.find(entry => entry.id === 'child-a')).toMatchObject({
      title: 'A2',
      url: 'https://a.dev',
      parentId: 'folder',
    });
  });

  it('renames a folder when the change carries only a title', () => {
    const next = applyChanged(fixture, 'folder', { title: 'Renamed folder' });

    expect(next.find(entry => entry.id === 'folder')).toMatchObject({ title: 'Renamed folder', kind: 'folder' });
  });

  it('is a no-op for unknown ids', () => {
    expect(applyChanged(fixture, 'ghost', { title: 'x' })).toEqual(fixture);
  });
});

describe('applyMoved', () => {
  it('re-parents and re-indexes the node', () => {
    const next = applyMoved(fixture, 'child-b', { parentId: 'root', index: 0 });

    expect(next.find(entry => entry.id === 'child-b')).toMatchObject({ parentId: 'root', index: 0 });
  });
});

describe('applyRemoved', () => {
  it('removes a single bookmark', () => {
    const next = applyRemoved(fixture, 'keeper');

    expect(next.map(entry => entry.id)).not.toContain('keeper');
    expect(next).toHaveLength(fixture.length - 1);
  });

  it('removes a folder together with every descendant, because onRemoved fires only for the folder', () => {
    const next = applyRemoved(fixture, 'folder');

    expect(next.map(entry => entry.id)).toEqual(['root', 'keeper']);
  });

  it('removes grandchildren as well', () => {
    const next = applyRemoved(fixture, 'child-a');

    expect(next.map(entry => entry.id)).toEqual(['root', 'folder', 'child-b', 'keeper']);
  });

  it('is a no-op for unknown ids', () => {
    expect(applyRemoved(fixture, 'ghost')).toEqual(fixture);
  });
});

describe('applyReordered', () => {
  it('assigns indexes following the browser order', () => {
    const next = applyReordered(fixture, 'folder', ['child-b', 'child-a']);

    expect(next.find(entry => entry.id === 'child-b')?.index).toBe(0);
    expect(next.find(entry => entry.id === 'child-a')?.index).toBe(1);
  });
});
