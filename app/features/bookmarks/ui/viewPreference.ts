export type ViewMode = 'list' | 'table' | 'grid';

export const VIEW_STORAGE_KEY = 'boostmarks:view:v1';

export interface ViewStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const MODES: readonly ViewMode[] = ['list', 'table', 'grid'];

function isViewMode(value: unknown): value is ViewMode {
  return typeof value === 'string' && (MODES as readonly string[]).includes(value);
}

export function readViewPreference(storage: ViewStorage = globalThis.localStorage): ViewMode {
  try {
    const raw = storage.getItem(VIEW_STORAGE_KEY);
    return isViewMode(raw) ? raw : 'list';
  } catch {
    return 'list';
  }
}

export function writeViewPreference(mode: ViewMode, storage: ViewStorage = globalThis.localStorage): void {
  try {
    storage.setItem(VIEW_STORAGE_KEY, mode);
  } catch {
    // Storage can be unavailable (private mode); the in-memory choice still applies.
  }
}
