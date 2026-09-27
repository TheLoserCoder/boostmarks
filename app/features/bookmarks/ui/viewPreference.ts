import { safeRead, safeWrite, type PreferenceStorage } from './storage';

export type ViewMode = 'list' | 'table' | 'grid';

export const VIEW_STORAGE_KEY = 'boostmarks:view:v1';

const MODES: readonly ViewMode[] = ['list', 'table', 'grid'];

function isViewMode(value: unknown): value is ViewMode {
  return typeof value === 'string' && (MODES as readonly string[]).includes(value);
}

export function readViewPreference(storage: PreferenceStorage = globalThis.localStorage): ViewMode {
  const raw = safeRead(storage, VIEW_STORAGE_KEY);
  return isViewMode(raw) ? raw : 'list';
}

export function writeViewPreference(mode: ViewMode, storage: PreferenceStorage = globalThis.localStorage): void {
  safeWrite(storage, VIEW_STORAGE_KEY, mode);
}
