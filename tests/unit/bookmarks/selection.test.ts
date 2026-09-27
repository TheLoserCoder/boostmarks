import { describe, expect, it } from 'vitest';
import {
  clearSelectionIds,
  emptySelection,
  idsInRect,
  moveFocus,
  rectFromPoints,
  rectsIntersect,
  selectAll,
  selectRange,
  selectSingle,
  toggleSelection,
} from '../../../app/features/bookmarks/domain/selection';

const order = ['a', 'b', 'c', 'd', 'e'];

describe('selection state', () => {
  it('selects a single id and makes it the anchor and focus', () => {
    expect(selectSingle('c')).toEqual({ ids: new Set(['c']), anchorId: 'c', focusId: 'c' });
  });

  it('selects an inclusive range in both directions', () => {
    expect(selectRange(order, 'b', 'd').ids).toEqual(new Set(['b', 'c', 'd']));
    expect(selectRange(order, 'd', 'b').ids).toEqual(new Set(['b', 'c', 'd']));
    expect(selectRange(order, 'd', 'b').anchorId).toBe('d');
    expect(selectRange(order, 'd', 'b').focusId).toBe('b');
  });

  it('selects a single id when the range has no anchor', () => {
    expect(selectRange(order, null, 'c')).toEqual(selectSingle('c'));
  });

  it('ignores unknown ids in ranges', () => {
    expect(selectRange(order, 'b', 'ghost')).toEqual(emptySelection);
  });

  it('toggles membership and moves the anchor', () => {
    const once = toggleSelection(selectSingle('a'), 'c');
    expect(once.ids).toEqual(new Set(['a', 'c']));
    expect(once.anchorId).toBe('c');

    const twice = toggleSelection(once, 'a');
    expect(twice.ids).toEqual(new Set(['c']));
  });

  it('selects all ids and clears selected ids while keeping focus', () => {
    expect(selectAll(order).ids).toEqual(new Set(order));
    expect(clearSelectionIds({ ids: new Set(['a']), anchorId: 'a', focusId: 'a' }).ids).toEqual(new Set());
    expect(clearSelectionIds({ ids: new Set(['a']), anchorId: 'a', focusId: 'a' }).focusId).toBe('a');
  });
});

describe('moveFocus', () => {
  it('starts at the first row when nothing is focused', () => {
    expect(moveFocus(emptySelection, order, 1, false).focusId).toBe('a');
    expect(moveFocus(emptySelection, order, -1, false).focusId).toBe('e');
  });

  it('clamps at both ends', () => {
    expect(moveFocus(selectSingle('a'), order, -1, false).focusId).toBe('a');
    expect(moveFocus(selectSingle('e'), order, 1, false).focusId).toBe('e');
  });

  it('moves focus and selects only the focused row without shift', () => {
    const moved = moveFocus(selectSingle('a'), order, 1, false);

    expect(moved.focusId).toBe('b');
    expect(moved.ids).toEqual(new Set(['b']));
  });

  it('extends the selection from the anchor with shift', () => {
    const moved = moveFocus(selectSingle('b'), order, 1, true);

    expect(moved.focusId).toBe('c');
    expect(moved.ids).toEqual(new Set(['b', 'c']));
    expect(moved.anchorId).toBe('b');
  });

  it('jumps to the first and last rows', () => {
    expect(moveFocus(selectSingle('c'), order, 'first', false).focusId).toBe('a');
    expect(moveFocus(selectSingle('c'), order, 'last', true).focusId).toBe('e');
  });
});

describe('marquee geometry', () => {
  it('normalizes a rectangle from two points', () => {
    expect(rectFromPoints({ x: 30, y: 40 }, { x: 10, y: 20 })).toEqual({ left: 10, top: 20, right: 30, bottom: 40 });
  });

  it('detects overlapping rectangles but not touching edges', () => {
    const rect = { left: 0, top: 0, right: 10, bottom: 10 };

    expect(rectsIntersect(rect, { left: 5, top: 5, right: 15, bottom: 15 })).toBe(true);
    expect(rectsIntersect(rect, { left: 10, top: 0, right: 20, bottom: 10 })).toBe(false);
    expect(rectsIntersect(rect, { left: 20, top: 20, right: 30, bottom: 30 })).toBe(false);
  });

  it('collects ids of rows intersecting the marquee in order', () => {
    const rows = [
      { id: 'a', rect: { left: 0, top: 0, right: 50, bottom: 20 } },
      { id: 'b', rect: { left: 0, top: 20, right: 50, bottom: 40 } },
      { id: 'c', rect: { left: 0, top: 40, right: 50, bottom: 60 } },
    ];

    expect(idsInRect({ left: 0, top: 10, right: 50, bottom: 45 }, rows)).toEqual(['a', 'b', 'c']);
    expect(idsInRect({ left: 0, top: 0, right: 0, bottom: 0 }, rows)).toEqual([]);
  });
});
