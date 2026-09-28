import { describe, expect, it } from 'vitest';
import { canDropManyOn, canDropOn } from '../../../app/features/bookmarks/domain/dropTarget';
import { node } from './support/fixtures';

const tree = [
  node({ id: 'root', kind: 'folder', title: '' }),
  node({ id: 'bar', parentId: 'root', kind: 'folder', title: 'Панель' }),
  node({ id: 'other', parentId: 'root', kind: 'folder', title: 'Другие' }),
  node({ id: 'work', parentId: 'bar', kind: 'folder', title: 'Работа' }),
  node({ id: 'child', parentId: 'work', kind: 'folder', title: 'Проект' }),
  node({ id: 'a', parentId: 'work', index: 0, title: 'A', url: 'https://a.example' }),
  node({ id: 'b', parentId: 'work', index: 1, title: 'B', url: 'https://b.example' }),
  node({ id: 'c', parentId: 'work', index: 2, title: 'C', url: 'https://c.example' }),
  node({ id: 'far', parentId: 'other', title: 'Far', url: 'https://far.example' }),
];

describe('drop target rules', () => {
  it('accepts dropping an item into a writable unrelated folder', () => {
    expect(canDropOn(tree, 'a', 'folder', 'other')).toBe(true);
    expect(canDropOn(tree, 'work', 'folder', 'other')).toBe(true);
  });

  it('rejects a folder dropped into itself or its descendant, and a no-op re-parent', () => {
    expect(canDropOn(tree, 'work', 'folder', 'work')).toBe(false);
    expect(canDropOn(tree, 'work', 'folder', 'child')).toBe(false);
    expect(canDropOn(tree, 'a', 'folder', 'work')).toBe(false);
    expect(canDropOn(tree, 'a', 'folder', 'missing')).toBe(false);
    expect(canDropOn(tree, 'a', 'folder', 'a')).toBe(false);
    expect(canDropOn(tree, 'a', 'folder', 'root')).toBe(false);
  });

  it('accepts ordering an item before a non-adjacent sibling and rejects no-op, cross-folder or self anchors', () => {
    expect(canDropOn(tree, 'c', 'before', 'a')).toBe(true);
    expect(canDropOn(tree, 'a', 'before', 'c')).toBe(true);
    expect(canDropOn(tree, 'a', 'before', 'b')).toBe(false);
    expect(canDropOn(tree, 'b', 'before', 'a')).toBe(true);
    expect(canDropOn(tree, 'a', 'before', 'a')).toBe(false);
    expect(canDropOn(tree, 'a', 'before', 'far')).toBe(false);
    expect(canDropOn(tree, 'a', 'before', 'work')).toBe(false);
    expect(canDropOn(tree, 'a', 'before', 'missing')).toBe(false);
  });

  it('rejects managed sources and destinations', () => {
    const managed = [
      ...tree,
      node({ id: 'locked', parentId: 'work', title: 'Locked', url: 'https://locked.example', unmodifiable: 'managed' }),
      node({ id: 'locked-folder', parentId: 'root', kind: 'folder', title: 'Locked folder', unmodifiable: 'managed' }),
    ];
    expect(canDropOn(managed, 'locked', 'folder', 'other')).toBe(false);
    expect(canDropOn(managed, 'a', 'folder', 'locked-folder')).toBe(false);
    expect(canDropOn(managed, 'a', 'before', 'locked')).toBe(false);
  });
});

describe('multi-selection drop rules', () => {
  it('delegates a single item to the ordinary rule', () => {
    expect(canDropManyOn(tree, ['a'], 'folder', 'other')).toBe(true);
    expect(canDropManyOn(tree, ['a'], 'before', 'b')).toBe(false);
    expect(canDropManyOn(tree, [], 'folder', 'other')).toBe(false);
  });

  it('accepts a group when every item can be moved into the folder', () => {
    expect(canDropManyOn(tree, ['a', 'b'], 'folder', 'other')).toBe(true);
    expect(canDropManyOn(tree, ['a', 'work'], 'folder', 'other')).toBe(true);
  });

  it('rejects the whole group when any item is managed, cyclic or already there', () => {
    const managed = [
      ...tree,
      node({ id: 'locked', parentId: 'work', title: 'Locked', url: 'https://locked.example', unmodifiable: 'managed' }),
    ];
    expect(canDropManyOn(managed, ['a', 'locked'], 'folder', 'other')).toBe(false);
    expect(canDropManyOn(tree, ['a', 'work'], 'folder', 'child')).toBe(false);
    expect(canDropManyOn(tree, ['a', 'b'], 'folder', 'work')).toBe(false);
  });

  it('keeps a positional group meaningful and rejects a whole-block no-op', () => {
    // a and c move before b, so the order really changes.
    expect(canDropManyOn(tree, ['a', 'c'], 'before', 'b')).toBe(true);
    expect(canDropManyOn(tree, ['b', 'c'], 'before', 'a')).toBe(true);
    // a and b are already the block right before c.
    expect(canDropManyOn(tree, ['a', 'b'], 'before', 'c')).toBe(false);
    // The block a,b moved before c keeps the order unchanged.
    expect(canDropManyOn(tree, ['a', 'b', 'c'], 'before', 'c')).toBe(false);
  });

  it('rejects positional groups that span folders, include managed rows or the anchor', () => {
    const managed = [
      ...tree,
      node({ id: 'locked', parentId: 'work', title: 'Locked', url: 'https://locked.example', unmodifiable: 'managed' }),
    ];
    expect(canDropManyOn(tree, ['a', 'far'], 'before', 'c')).toBe(false);
    expect(canDropManyOn(tree, ['a', 'c'], 'before', 'c')).toBe(false);
    expect(canDropManyOn(managed, ['a', 'locked'], 'before', 'c')).toBe(false);
    expect(canDropManyOn(tree, ['a', 'work'], 'before', 'c')).toBe(false);
  });
});
