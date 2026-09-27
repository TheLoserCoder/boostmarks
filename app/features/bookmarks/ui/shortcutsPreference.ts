import { safeRead, safeWrite, type PreferenceStorage } from './storage';

export const SHORTCUTS_STORAGE_KEY = 'boostmarks:shortcuts:v1';

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

export function readPinnedIds(storage: PreferenceStorage = globalThis.localStorage): string[] {
  const raw = safeRead(storage, SHORTCUTS_STORAGE_KEY);
  if (raw === null) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return [...new Set(parsed.filter(isNonEmptyString))];
  } catch {
    return [];
  }
}

export function writePinnedIds(ids: readonly string[], storage: PreferenceStorage = globalThis.localStorage): void {
  safeWrite(storage, SHORTCUTS_STORAGE_KEY, JSON.stringify([...new Set(ids)]));
}
