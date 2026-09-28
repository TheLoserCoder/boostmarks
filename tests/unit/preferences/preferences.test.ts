import { beforeEach, describe, expect, it } from 'vitest';
import {
  DEFAULT_PREFERENCES,
  parsePreferences,
  resolveTheme,
} from '../../../app/features/preferences/preferences';
import { PREFERENCES_KEY, readPreferences, writePreferences } from '../../../app/features/preferences/preferencesStore';
import { applyTheme } from '../../../app/features/preferences/theme';

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
  };
}

describe('preferences', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('coerces invalid stored fields back to the defaults', () => {
    expect(parsePreferences(undefined)).toEqual(DEFAULT_PREFERENCES);
    expect(parsePreferences('nonsense')).toEqual(DEFAULT_PREFERENCES);
    expect(parsePreferences({ locale: 'de', theme: 'neon' })).toEqual(DEFAULT_PREFERENCES);
    expect(parsePreferences({ locale: 'en' })).toEqual({ locale: 'en', theme: 'dark' });
    expect(parsePreferences({ theme: 'light' })).toEqual({ locale: 'ru', theme: 'light' });
  });

  it('resolves the system theme against the OS preference', () => {
    expect(resolveTheme('system', false)).toBe('dark');
    expect(resolveTheme('system', true)).toBe('light');
    expect(resolveTheme('dark', true)).toBe('dark');
    expect(resolveTheme('light', false)).toBe('light');
  });

  it('round-trips preferences through storage and survives broken JSON', () => {
    const storage = memoryStorage();
    writePreferences({ locale: 'en', theme: 'light' }, storage);
    expect(readPreferences(storage)).toEqual({ locale: 'en', theme: 'light' });

    const broken = memoryStorage({ [PREFERENCES_KEY]: '{not json' });
    expect(readPreferences(broken)).toEqual(DEFAULT_PREFERENCES);
  });

  it('writes the resolved theme onto the document element', () => {
    const doc = document.implementation.createHTMLDocument('theme-test');
    expect(applyTheme('light', { doc })).toBe('light');
    expect(doc.documentElement.dataset.theme).toBe('light');
    expect(applyTheme('system', { doc, prefersLight: false })).toBe('dark');
    expect(doc.documentElement.dataset.theme).toBe('dark');
  });
});
