export interface SelectionState {
  ids: ReadonlySet<string>;
  anchorId: string | null;
  focusId: string | null;
}

export const emptySelection: SelectionState = { ids: new Set(), anchorId: null, focusId: null };

export function selectSingle(id: string): SelectionState {
  return { ids: new Set([id]), anchorId: id, focusId: id };
}

export function selectRange(order: readonly string[], fromId: string | null, toId: string): SelectionState {
  const toIndex = order.indexOf(toId);
  if (toIndex === -1) return emptySelection;
  const fromIndex = fromId === null ? toIndex : order.indexOf(fromId);
  if (fromIndex === -1) return selectSingle(toId);

  const start = Math.min(fromIndex, toIndex);
  const end = Math.max(fromIndex, toIndex);
  return { ids: new Set(order.slice(start, end + 1)), anchorId: fromId ?? toId, focusId: toId };
}

export function toggleSelection(state: SelectionState, id: string): SelectionState {
  const ids = new Set(state.ids);
  if (ids.has(id)) ids.delete(id);
  else ids.add(id);
  return { ids, anchorId: id, focusId: id };
}

export function selectAll(order: readonly string[]): SelectionState {
  return { ids: new Set(order), anchorId: order[0] ?? null, focusId: order[order.length - 1] ?? null };
}

export function clearSelectionIds(state: SelectionState): SelectionState {
  return { ...state, ids: new Set() };
}

export type FocusTarget = 'first' | 'last' | -1 | 1;

export function moveFocus(state: SelectionState, order: readonly string[], target: FocusTarget, extend: boolean): SelectionState {
  if (order.length === 0) return emptySelection;

  const current = state.focusId === null ? -1 : order.indexOf(state.focusId);
  let index: number;
  if (target === 'first') {
    index = 0;
  } else if (target === 'last') {
    index = order.length - 1;
  } else if (current === -1) {
    index = target === 1 ? 0 : order.length - 1;
  } else {
    index = Math.min(order.length - 1, Math.max(0, current + target));
  }

  const id = order[index]!;
  if (!extend) return selectSingle(id);
  return selectRange(order, state.anchorId ?? state.focusId ?? id, id);
}

export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export function rectFromPoints(a: Point, b: Point): Rect {
  return {
    left: Math.min(a.x, b.x),
    top: Math.min(a.y, b.y),
    right: Math.max(a.x, b.x),
    bottom: Math.max(a.y, b.y),
  };
}

export function rectsIntersect(a: Rect, b: Rect): boolean {
  return a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
}

export function idsInRect(rect: Rect, rows: ReadonlyArray<{ id: string; rect: Rect }>): string[] {
  return rows.filter(row => rectsIntersect(rect, row.rect)).map(row => row.id);
}
