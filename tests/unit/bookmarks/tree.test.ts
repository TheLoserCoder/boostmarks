import { describe, expect, it } from 'vitest';
import { buildTree, flattenTree, topLevelEntries } from '../../../app/features/bookmarks/domain/tree';
import type { BookmarkNode } from '../../../app/features/bookmarks/domain/types';

const node = (partial: Partial<BookmarkNode> & { id: string }): BookmarkNode => ({
  parentId: null,
  title: '',
  kind: 'bookmark',
  index: 0,
  ...partial,
});

describe('flattenTree', () => {
  it('turns a nested browser tree into flat nodes with parent ids and kinds', () => {
    const roots = [
      {
        id: '0',
        title: '',
        index: 0,
        children: [
          {
            id: '1',
            parentId: '0',
            title: 'Bookmarks bar',
            index: 0,
            children: [
              { id: '2', parentId: '1', title: 'Boostmarks', url: 'https://example.com', index: 0 },
              { id: '3', parentId: '1', title: 'Docs', index: 1, children: [] },
            ],
          },
          { id: '4', parentId: '0', title: 'Separator', index: 1, type: 'separator' },
        ],
      },
    ];

    expect(flattenTree(roots)).toEqual([
      node({ id: '0', parentId: null, title: '', kind: 'folder' }),
      node({ id: '1', parentId: '0', title: 'Bookmarks bar', kind: 'folder' }),
      node({ id: '2', parentId: '1', title: 'Boostmarks', url: 'https://example.com', kind: 'bookmark' }),
      node({ id: '3', parentId: '1', title: 'Docs', kind: 'folder', index: 1 }),
      node({ id: '4', parentId: '0', title: 'Separator', kind: 'separator', index: 1 }),
    ]);
  });

  it('keeps browser timestamps and unmodifiable markers', () => {
    const [flat] = flattenTree([
      { id: '10', title: 'Mobile', index: 3, dateAdded: 111, dateGroupModified: 222, unmodifiable: 'managed' },
    ]);

    expect(flat).toMatchObject({ dateAdded: 111, dateGroupModified: 222, unmodifiable: 'managed' });
  });

  it('treats a node without url as a folder and with url as a bookmark', () => {
    const flat = flattenTree([{ id: 'a', title: 'No url', index: 0, children: [] }, { id: 'b', title: 'Has url', url: 'https://x.dev', index: 1 }]);

    expect(flat.map(entry => entry.kind)).toEqual(['folder', 'bookmark']);
  });
});

describe('buildTree', () => {
  it('assembles children under parents ordered by index', () => {
    const tree = buildTree([
      node({ id: 'b', parentId: '1', index: 1, title: 'Second' }),
      node({ id: '1', parentId: 'root', kind: 'folder' }),
      node({ id: 'a', parentId: '1', index: 0, title: 'First' }),
      node({ id: 'root', parentId: null, kind: 'folder' }),
    ]);

    expect(tree).toHaveLength(1);
    expect(tree[0]?.children.map(child => child.node.id)).toEqual(['1']);
    expect(tree[0]?.children[0]?.children.map(child => child.node.title)).toEqual(['First', 'Second']);
  });

  it('promotes orphan nodes to roots instead of dropping them', () => {
    const tree = buildTree([node({ id: 'x', parentId: 'missing', title: 'Orphan' })]);

    expect(tree.map(entry => entry.node.id)).toEqual(['x']);
  });

  it('keeps sibling order stable for equal indexes by id-independent insertion order', () => {
    const tree = buildTree([
      node({ id: 'root', parentId: null, kind: 'folder' }),
      node({ id: 'later', parentId: 'root', index: 5 }),
      node({ id: 'earlier', parentId: 'root', index: 2 }),
    ]);

    expect(tree[0]?.children.map(entry => entry.node.id)).toEqual(['earlier', 'later']);
  });
});

describe('topLevelEntries', () => {
  it('renders children of the unnamed browser root directly, hiding the synthetic root folder', () => {
    const tree = buildTree([
      node({ id: '0', parentId: null, kind: 'folder', title: '' }),
      node({ id: 'bar', parentId: '0', kind: 'folder', title: 'Панель закладок', index: 0 }),
      node({ id: 'bookmark', parentId: '0', title: 'Boostmarks', url: 'https://example.com', index: 1 }),
    ]);

    expect(topLevelEntries(tree).map(entry => entry.node.id)).toEqual(['bar', 'bookmark']);
  });

  it('keeps genuine root nodes that are not unnamed container folders', () => {
    const tree = buildTree([
      node({ id: 'named', parentId: null, kind: 'folder', title: 'Другое' }),
      node({ id: 'solo', parentId: null, kind: 'bookmark', title: 'Solo', url: 'https://solo.dev' }),
    ]);

    expect(topLevelEntries(tree).map(entry => entry.node.id)).toEqual(['named', 'solo']);
  });
});
