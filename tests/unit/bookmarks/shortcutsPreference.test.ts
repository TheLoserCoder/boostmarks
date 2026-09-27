import { describe, expect, it } from 'vitest';
import {
  readPinnedIds,
  SHORTCUTS_STORAGE_KEY,
  writePinnedIds,
} from '../../../app/features/bookmarks/ui/shortcutsPreference';

function fakeStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
  };
}

describe('shortcuts preference', () => {
  it('starts with no pinned shortcuts', () => {
    expect(readPinnedIds(fakeStorage())).toEqual([]);
  });

  it('round-trips pinned ids in order', () => {
    const storage = fakeStorage();

    writePinnedIds(['docs', 'read', 'bar'], storage);

    expect(storage.getItem(SHORTCUTS_STORAGE_KEY)).toBe('["docs","read","bar"]');
    expect(readPinnedIds(storage)).toEqual(['docs', 'read', 'bar']);
  });

  it('filters out non-string entries, empty values and duplicates', () => {
    const storage = fakeStorage({ [SHORTCUTS_STORAGE_KEY]: '["a",1,null,"","a","b"]' });

    expect(readPinnedIds(storage)).toEqual(['a', 'b']);
  });

  it('falls back to an empty list for malformed stored data', () => {
    expect(readPinnedIds(fakeStorage({ [SHORTCUTS_STORAGE_KEY]: '{oops' }))).toEqual([]);
    expect(readPinnedIds(fakeStorage({ [SHORTCUTS_STORAGE_KEY]: '{"a":1}' }))).toEqual([]);
  });
});
