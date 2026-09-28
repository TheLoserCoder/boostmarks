import { DEFAULT_PREFERENCES, parsePreferences, type Preferences } from './preferences';

export const PREFERENCES_KEY = 'boostmarks:preferences:v1';

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

function storageOrNull(): StorageLike | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function readPreferences(storage: StorageLike | null = storageOrNull()): Preferences {
  if (storage === null) return DEFAULT_PREFERENCES;
  try {
    const raw = storage.getItem(PREFERENCES_KEY);
    return raw === null ? DEFAULT_PREFERENCES : parsePreferences(JSON.parse(raw));
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function writePreferences(
  preferences: Preferences,
  storage: StorageLike | null = storageOrNull(),
): void {
  if (storage === null) return;
  try {
    storage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
  } catch {
    // Storage can be unavailable in private modes; the in-memory preference still applies.
  }
}
