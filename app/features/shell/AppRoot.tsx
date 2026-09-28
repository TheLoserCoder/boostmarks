import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { I18nProvider } from '../i18n/I18nProvider';
import type { Locale } from '../i18n/translate';
import { DEFAULT_PREFERENCES, type Preferences, type ThemePreference } from '../preferences/preferences';
import { PREFERENCES_KEY, readPreferences, writePreferences } from '../preferences/preferencesStore';
import { LIGHT_QUERY, applyTheme } from '../preferences/theme';

interface PreferencesContextValue {
  preferences: Preferences;
  setLocale: (locale: Locale) => void;
  setTheme: (theme: ThemePreference) => void;
}

const PreferencesContext = createContext<PreferencesContextValue>({
  preferences: DEFAULT_PREFERENCES,
  setLocale: () => undefined,
  setTheme: () => undefined,
});

/** Standalone renders fall back to the defaults; pages are wrapped by `AppRoot`. */
export function usePreferences(): PreferencesContextValue {
  return useContext(PreferencesContext);
}

/**
 * Composition root shared by manager, popup and options: owns the persisted
 * preferences, applies the theme to the document, follows OS theme changes
 * while `system` is selected and hot-reloads preferences changed in another
 * extension page through the window `storage` event.
 */
export function AppRoot({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<Preferences>(() => readPreferences());

  const update = useCallback((patch: Partial<Preferences>) => {
    setPreferences(current => {
      const next = { ...current, ...patch };
      writePreferences(next);
      return next;
    });
  }, []);

  useEffect(() => {
    const media = window.matchMedia(LIGHT_QUERY);
    applyTheme(preferences.theme, { prefersLight: media.matches });
    if (preferences.theme !== 'system') return;
    const listener = (event: MediaQueryListEvent) => applyTheme('system', { prefersLight: event.matches });
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [preferences.theme]);

  useEffect(() => {
    const listener = (event: StorageEvent) => {
      if (event.key === PREFERENCES_KEY) setPreferences(readPreferences());
    };
    window.addEventListener('storage', listener);
    return () => window.removeEventListener('storage', listener);
  }, []);

  const value = useMemo<PreferencesContextValue>(() => ({
    preferences,
    setLocale: locale => update({ locale }),
    setTheme: theme => update({ theme }),
  }), [preferences, update]);

  return (
    <PreferencesContext.Provider value={value}>
      <I18nProvider locale={preferences.locale}>{children}</I18nProvider>
    </PreferencesContext.Provider>
  );
}
