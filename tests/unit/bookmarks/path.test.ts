import { describe, expect, it } from 'vitest';
import { childrenOf, folderChain, topLevelFolders } from '../../../app/features/bookmarks/domain/path';
import type { BookmarkNode } from '../../../app/features/bookmarks/domain/types';

const node = (partial: Partial<BookmarkNode> & { id: string }): BookmarkNode => ({
  parentId: null,
  title: '',
  kind: 'bookmark',
  index: 0,
  ...partial,
});

const fixture: BookmarkNode[] = [
  node({ id: '0', parentId: null, kind: 'folder', title: '' }),
  node({ id: 'bar', parentId: '0', kind: 'folder', title: 'Панель закладок', index: 0 }),
  node({ id: 'other', parentId: '0', kind: 'folder', title: 'Другие закладки', index: 1 }),
  node({ id: 'work', parentId: 'bar', kind: 'folder', title: 'Работа', index: 0 }),
  node({ id: 'docs', parentId: 'work', kind: 'folder', title: 'Документы', index: 0 }),
  node({ id: 'read', parentId: 'bar', title: 'Читать позже', url: 'https://read.dev', index: 1 }),
  node({ id: 'spec', parentId: 'docs', title: 'Спецификация', url: 'https://spec.dev', index: 0 }),
];

describe('childrenOf', () => {
  it('returns only direct children ordered by index', () => {
    expect(childrenOf(fixture, 'bar').map(entry => entry.id)).toEqual(['work', 'read']);
  });

  it('returns an empty list for a leaf folder', () => {
    expect(childrenOf(fixture, 'docs').map(entry => entry.id)).toEqual(['spec']);
    expect(childrenOf(fixture, 'read')).toEqual([]);
  });
});

describe('folderChain', () => {
  it('walks from the visible top-level folder down to the selected folder', () => {
    expect(folderChain(fixture, 'docs').map(entry => entry.title)).toEqual(['Панель закладок', 'Работа', 'Документы']);
  });

  it('skips the unnamed synthetic browser root', () => {
    expect(folderChain(fixture, 'bar').map(entry => entry.title)).toEqual(['Панель закладок']);
  });

  it('returns the containing folder chain for a bookmark', () => {
    expect(folderChain(fixture, 'spec').map(entry => entry.title)).toEqual(['Панель закладок', 'Работа', 'Документы']);
  });

  it('returns an empty chain for unknown ids', () => {
    expect(folderChain(fixture, 'ghost')).toEqual([]);
  });
});

describe('topLevelFolders', () => {
  it('lists visible top-level folders without the synthetic root', () => {
    expect(topLevelFolders(fixture).map(entry => entry.title)).toEqual(['Панель закладок', 'Другие закладки']);
  });

  it('ignores top-level bookmarks', () => {
    const withLooseBookmark = [...fixture, node({ id: 'loose', parentId: '0', title: 'Ссылка', url: 'https://loose.dev', index: 2 })];

    expect(topLevelFolders(withLooseBookmark).map(entry => entry.id)).toEqual(['bar', 'other']);
  });

  it('still finds synthetic root children when an orphaned node exists at the top level', () => {
    const withOrphan = [...fixture, node({ id: 'ghost', parentId: 'missing', title: 'Сирота', url: 'https://ghost.dev', index: 5 })];

    expect(topLevelFolders(withOrphan).map(entry => entry.id)).toEqual(['bar', 'other']);
  });
});
