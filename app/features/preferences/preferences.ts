import { LOCALES, type Locale } from '../i18n/translate';

export type ThemePreference = 'system' | 'dark' | 'light';

export const THEMES: readonly ThemePreference[] = ['system', 'dark', 'light'];

export interface Preferences {
  locale: Locale;
  theme: ThemePreference;
}

export const DEFAULT_PREFERENCES: Preferences = { locale: 'ru', theme: 'dark' };

/** Coerces stored data into valid preferences instead of trusting localStorage. */
export function parsePreferences(value: unknown): Preferences {
  const record = typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
  const locale = LOCALES.includes(record.locale as Locale)
    ? (record.locale as Locale)
    : DEFAULT_PREFERENCES.locale;
  const theme = THEMES.includes(record.theme as ThemePreference)
    ? (record.theme as ThemePreference)
    : DEFAULT_PREFERENCES.theme;
  return { locale, theme };
}

/** The concrete theme the document should use; `system` follows the OS. */
export function resolveTheme(theme: ThemePreference, prefersLight: boolean): 'dark' | 'light' {
  if (theme === 'system') return prefersLight ? 'light' : 'dark';
  return theme;
}
