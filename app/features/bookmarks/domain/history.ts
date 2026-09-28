/**
 * Folder navigation stack used by the explorer toolbar.
 * `null` represents the Home view, so going back from a folder returns Home.
 */
export interface NavigationHistory {
  readonly past: readonly (string | null)[];
  readonly future: readonly (string | null)[];
}

export const emptyHistory: NavigationHistory = { past: [], future: [] };

const MAX_ENTRIES = 50;

/** Records a view visit; visiting the view that is already open keeps the stack. */
export function visit(
  history: NavigationHistory,
  currentId: string | null,
  nextId: string | null,
): NavigationHistory {
  if (currentId === nextId) return history;
  return { past: [...history.past, currentId].slice(-MAX_ENTRIES), future: [] };
}

export function canGoBack(history: NavigationHistory): boolean {
  return history.past.length > 0;
}

export function canGoForward(history: NavigationHistory): boolean {
  return history.future.length > 0;
}

export function goBack(
  history: NavigationHistory,
  currentId: string | null,
): { history: NavigationHistory; id: string | null } | null {
  const previous = history.past.at(-1);
  if (previous === undefined) return null;
  return {
    history: { past: history.past.slice(0, -1), future: [currentId, ...history.future] },
    id: previous,
  };
}

export function goForward(
  history: NavigationHistory,
  currentId: string | null,
): { history: NavigationHistory; id: string | null } | null {
  const [next, ...rest] = history.future;
  if (next === undefined) return null;
  return {
    history: { past: [...history.past, currentId].slice(-MAX_ENTRIES), future: rest },
    id: next,
  };
}
