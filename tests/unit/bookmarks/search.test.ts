import { describe, expect, it } from 'vitest';
import { searchNodes } from '../../../app/features/bookmarks/domain/search';
import type { BookmarkNode } from '../../../app/features/bookmarks/domain/types';

const node = (partial: Partial<BookmarkNode> & { id: string }): BookmarkNode => ({
  parentId: null,
  title: '',
  kind: 'bookmark',
  index: 0,
  ...partial,
});

const fixture: BookmarkNode[] = [
  node({ id: '0', kind: 'folder', title: '' }),
  node({ id: 'bar', parentId: '0', kind: 'folder', title: 'Панель закладок', index: 0 }),
  node({ id: 'read', parentId: 'bar', title: 'Читать позже', url: 'https://read.dev', index: 0 }),
  node({ id: 'docs', parentId: 'bar', kind: 'folder', title: 'Документы', index: 1 }),
  node({ id: 'spec', parentId: 'docs', title: 'Спецификация', url: 'https://spec.dev', index: 0 }),
  node({ id: 'sep', parentId: 'bar', kind: 'separator', title: 'Разделитель', index: 2 }),
];

describe('searchNodes', () => {
  it('matches titles case-insensitively', () => {
    expect(searchNodes(fixture, 'ЧИТАТЬ').map(entry => entry.id)).toEqual(['read']);
  });

  it('matches urls anywhere in the projection', () => {
    expect(searchNodes(fixture, 'spec.dev').map(entry => entry.id)).toEqual(['spec']);
  });

  it('finds folders as well as bookmarks', () => {
    expect(searchNodes(fixture, 'докум').map(entry => entry.id)).toEqual(['docs']);
  });

  it('preserves projection order for several matches', () => {
    expect(searchNodes(fixture, 'https://').map(entry => entry.id)).toEqual(['read', 'spec']);
  });

  it('skips separators and the synthetic root even when their titles match', () => {
    expect(searchNodes(fixture, 'разделитель')).toEqual([]);
    expect(searchNodes(fixture, 'панель')).toEqual([fixture[1]]);
  });

  it('returns nothing for an empty or whitespace-only query', () => {
    expect(searchNodes(fixture, '')).toEqual([]);
    expect(searchNodes(fixture, '   ')).toEqual([]);
  });
});
