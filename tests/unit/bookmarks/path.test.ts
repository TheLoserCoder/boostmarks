import { describe, expect, it } from 'vitest';
import {
  childrenOf,
  folderChain,
  formatFolderPath,
  quickLinks,
  resolveFolderPath,
  topLevelFolders,
} from '../../../app/features/bookmarks/domain/path';
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

describe('formatFolderPath', () => {
  it('joins the folder chain with backslashes', () => {
    expect(formatFolderPath(fixture, 'docs')).toBe('Панель закладок\\Работа\\Документы');
  });

  it('returns a single name for a top-level folder and an empty string for unknown ids', () => {
    expect(formatFolderPath(fixture, 'bar')).toBe('Панель закладок');
    expect(formatFolderPath(fixture, 'ghost')).toBe('');
  });
});

describe('resolveFolderPath', () => {
  it('resolves an exact path to the folder id', () => {
    expect(resolveFolderPath(fixture, 'Панель закладок\\Работа\\Документы')).toEqual({ ok: true, folderId: 'docs' });
  });

  it('matches case-insensitively and ignores surrounding spaces', () => {
    expect(resolveFolderPath(fixture, ' панель закладок \\ РАБОТА ')).toEqual({ ok: true, folderId: 'work' });
  });

  it('reports not-found for an unknown segment', () => {
    expect(resolveFolderPath(fixture, 'Панель закладок\\Нет такой')).toEqual({ ok: false, reason: 'not-found' });
  });

  it('reports ambiguity instead of silently picking one of several same-named folders', () => {
    const withTwin = [...fixture, node({ id: 'work2', parentId: 'bar', kind: 'folder', title: 'Работа', index: 5 })];

    expect(resolveFolderPath(withTwin, 'Панель закладок\\Работа')).toEqual({ ok: false, reason: 'ambiguous' });
  });

  it('rejects empty input and bare separators', () => {
    expect(resolveFolderPath(fixture, '   ')).toEqual({ ok: false, reason: 'empty' });
    expect(resolveFolderPath(fixture, '\\\\')).toEqual({ ok: false, reason: 'empty' });
  });
});

describe('quickLinks', () => {
  it('lists pinned nodes first and then top-level folders without duplicates', () => {
    expect(quickLinks(fixture, ['read']).map(entry => entry.id)).toEqual(['read', 'bar', 'other']);
    expect(quickLinks(fixture, ['bar']).map(entry => entry.id)).toEqual(['bar', 'other']);
  });

  it('drops pinned ids that no longer exist', () => {
    expect(quickLinks(fixture, ['ghost', 'other']).map(entry => entry.id)).toEqual(['other', 'bar']);
  });

  it('ignores separators and repeated ids in the pinned list', () => {
    const withSeparator = [...fixture, node({ id: 'sep', parentId: 'bar', kind: 'separator' })];

    expect(quickLinks(withSeparator, ['sep', 'read', 'read']).map(entry => entry.id)).toEqual(['read', 'bar', 'other']);
  });
});
