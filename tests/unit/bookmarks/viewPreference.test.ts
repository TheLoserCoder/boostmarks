import { describe, expect, it } from 'vitest';
import {
  readViewPreference,
  writeViewPreference,
  VIEW_STORAGE_KEY,
} from '../../../app/features/bookmarks/ui/viewPreference';

function fakeStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
  };
}

describe('view preference', () => {
  it('defaults to the list view when nothing is stored', () => {
    expect(readViewPreference(fakeStorage())).toBe('list');
  });

  it('round-trips a written preference', () => {
    const storage = fakeStorage();

    writeViewPreference('grid', storage);

    expect(storage.getItem(VIEW_STORAGE_KEY)).toBe('grid');
    expect(readViewPreference(storage)).toBe('grid');
  });

  it('falls back to the list for unknown stored values', () => {
    expect(readViewPreference(fakeStorage({ [VIEW_STORAGE_KEY]: 'carousel' }))).toBe('list');
    expect(readViewPreference(fakeStorage({ [VIEW_STORAGE_KEY]: '' }))).toBe('list');
  });
});
