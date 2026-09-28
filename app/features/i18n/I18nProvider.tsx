import React, { createContext, useContext, useMemo } from 'react';
import { createTranslator, type Locale, type Translator } from './translate';

const DEFAULT_TRANSLATOR = createTranslator('ru');

const I18nContext = createContext<Translator>(DEFAULT_TRANSLATOR);

/**
 * Pages are wrapped once by `AppRoot`; standalone renders (tests, future
 * embeds) fall back to Russian instead of requiring a provider.
 */
export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const translator = useMemo(() => createTranslator(locale), [locale]);
  return <I18nContext.Provider value={translator}>{children}</I18nContext.Provider>;
}

export function useI18n(): Translator {
  return useContext(I18nContext);
}
