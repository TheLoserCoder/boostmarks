import { describe, expect, it } from 'vitest';
import { validateMove } from '../../../app/features/bookmarks/domain/move';
import { node } from './support/fixtures';

const tree = [
  node({ id: 'root', kind: 'folder', title: '' }),
  node({ id: 'bar', parentId: 'root', kind: 'folder', title: 'Панель' }),
  node({ id: 'other', parentId: 'root', kind: 'folder', title: 'Другие' }),
  node({ id: 'work', parentId: 'bar', kind: 'folder', title: 'Работа' }),
  node({ id: 'child', parentId: 'work', kind: 'folder', title: 'Проект' }),
  node({ id: 'link', parentId: 'work', kind: 'bookmark', title: 'Сайт', url: 'https://example.com' }),
];

describe('move target validation', () => {
  it('accepts a bookmark moving to a different writable folder', () => {
    expect(validateMove(tree, 'link', 'other')).toBeNull();
  });

  it('rejects a missing source, a missing parent and the synthetic root', () => {
    expect(validateMove(tree, 'missing', 'other')).toBe('missing-source');
    expect(validateMove(tree, 'link', 'missing')).toBe('invalid-parent');
    expect(validateMove(tree, 'link', 'root')).toBe('invalid-parent');
  });

  it('prevents moving a folder into itself or a descendant', () => {
    expect(validateMove(tree, 'work', 'work')).toBe('cycle');
    expect(validateMove(tree, 'work', 'child')).toBe('cycle');
    expect(validateMove(tree, 'work', 'other')).toBeNull();
  });

  it('does not issue an unnecessary move to the same parent', () => {
    expect(validateMove(tree, 'link', 'work')).toBe('unchanged');
  });

  it('rejects managed bookmarks and destinations', () => {
    expect(validateMove([...tree, node({ id: 'managed', parentId: 'bar', unmodifiable: 'managed' })], 'managed', 'other')).toBe('unmodifiable');
    expect(validateMove([...tree, node({ id: 'managed-folder', kind: 'folder', parentId: 'root', unmodifiable: 'managed' })], 'link', 'managed-folder')).toBe('invalid-parent');
  });
});
