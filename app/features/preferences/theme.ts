import { readPreferences } from './preferencesStore';
import { resolveTheme, type ThemePreference } from './preferences';

export const LIGHT_QUERY = '(prefers-color-scheme: light)';

export function systemPrefersLight(): boolean {
  return window.matchMedia(LIGHT_QUERY).matches;
}

/**
 * Writes the resolved theme onto `<html data-theme>`. `system` is resolved here
 * rather than in CSS so the light and dark token blocks stay single-source.
 */
export function applyTheme(
  theme: ThemePreference,
  { doc = document, prefersLight = false }: { doc?: Document; prefersLight?: boolean } = {},
): 'dark' | 'light' {
  const resolved = resolveTheme(theme, prefersLight);
  doc.documentElement.dataset.theme = resolved;
  return resolved;
}

/** Applies the persisted preference synchronously before first paint. */
export function applyStoredTheme(): 'dark' | 'light' {
  return applyTheme(readPreferences().theme, { prefersLight: systemPrefersLight() });
}
