import { describe, expect, it } from 'vitest';
import {
  isWritableFolder,
  resolveCreateTarget,
  siblingFolders,
  validateFolderName,
} from '../../../app/features/bookmarks/domain/createFolder';
import { node } from './support/fixtures';

const nodes = [
  node({ id: '0', kind: 'folder', title: '' }),
  node({ id: 'bar', parentId: '0', kind: 'folder', title: 'Панель закладок', index: 0 }),
  node({ id: 'work', parentId: 'bar', kind: 'folder', title: 'Работа', index: 0 }),
  node({ id: 'read', parentId: 'bar', kind: 'folder', title: 'Чтение', index: 1 }),
  node({ id: 'bookmark', parentId: 'work', title: 'Boostmarks', url: 'https://example.com', index: 0 }),
];

describe('resolveCreateTarget', () => {
  it('creates inside the folder open in the pane when the background is clicked', () => {
    expect(resolveCreateTarget(nodes, { clickedId: null, currentFolderId: 'work' })).toEqual({
      ok: true,
      parentId: 'work',
      parentTitle: 'Работа',
    });
  });

  it('creates inside a clicked folder', () => {
    expect(resolveCreateTarget(nodes, { clickedId: 'work', currentFolderId: 'bar' })).toEqual({
      ok: true,
      parentId: 'work',
      parentTitle: 'Работа',
    });
  });

  it('creates next to a clicked bookmark', () => {
    expect(resolveCreateTarget(nodes, { clickedId: 'bookmark', currentFolderId: 'bar' })).toEqual({
      ok: true,
      parentId: 'work',
      parentTitle: 'Работа',
    });
  });

  it('refuses the synthetic browser root', () => {
    expect(resolveCreateTarget(nodes, { clickedId: '0', currentFolderId: '0' })).toEqual({
      ok: false,
      reason: 'not-writable',
    });
  });

  it('reports a target that is no longer in the projection', () => {
    expect(resolveCreateTarget(nodes, { clickedId: 'ghost', currentFolderId: undefined as never })).toEqual({
      ok: false,
      reason: 'missing',
    });
  });
});

describe('validateFolderName', () => {
  const siblings = [node({ id: 'work', parentId: 'bar', kind: 'folder', title: 'Работа' })];

  it('rejects empty and whitespace-only names', () => {
    expect(validateFolderName('', siblings)).toBe('empty');
    expect(validateFolderName('   ', siblings)).toBe('empty');
  });

  it('rejects a sibling folder with the same name regardless of case or padding', () => {
    expect(validateFolderName('работа', siblings)).toBe('duplicate');
    expect(validateFolderName('  Работа ', siblings)).toBe('duplicate');
  });

  it('accepts a new name and ignores bookmarks with the same title', () => {
    expect(validateFolderName('Отпуск', siblings)).toBeNull();
    expect(validateFolderName('Работа', [node({ id: 'b', title: 'Работа', url: 'https://example.com' })])).toBeNull();
  });
});

describe('folder helpers', () => {
  it('treats the synthetic root as not writable', () => {
    expect(isWritableFolder(nodes[0])).toBe(false);
    expect(isWritableFolder(nodes[1])).toBe(true);
    expect(isWritableFolder(undefined)).toBe(false);
  });

  it('lists every child as a candidate sibling, including bookmarks', () => {
    expect(siblingFolders(nodes, 'bar').map(item => item.id)).toEqual(['work', 'read']);
  });
});
