import { en, ru, type Message, type PluralForms, type TranslationKey } from './messages';

export type Locale = 'ru' | 'en';

export const LOCALES: readonly Locale[] = ['ru', 'en'];

export interface TranslateParams {
  [name: string]: string | number;
}

export interface Translator {
  locale: Locale;
  /** Plain message lookup with `{name}` interpolation. */
  t: (key: TranslationKey, params?: TranslateParams) => string;
  /** Plural message lookup chosen by `Intl.PluralRules` for the locale. */
  plural: (key: TranslationKey, count: number, params?: TranslateParams) => string;
}

function interpolate(template: string, params: TranslateParams | undefined): string {
  if (params === undefined) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    (name in params ? String(params[name]) : match));
}

/**
 * Minimal locale-aware translator. The Russian dictionary is the key source of
 * truth; an unknown key returns the key itself so a missing string is visible
 * in the UI instead of crashing it.
 */
export function createTranslator(locale: Locale): Translator {
  const messages = locale === 'en' ? en : ru;
  const rules = new Intl.PluralRules(locale);

  const messageFor = (key: TranslationKey): Message => messages[key] ?? ru[key];

  const t = (key: TranslationKey, params?: TranslateParams): string => {
    const message = messageFor(key);
    return typeof message === 'string' ? interpolate(message, params) : key;
  };

  const plural = (key: TranslationKey, count: number, params?: TranslateParams): string => {
    const message = messageFor(key);
    if (typeof message === 'string') return interpolate(message, { ...params, count });
    const category = rules.select(count) as keyof PluralForms;
    const template =
      message[category] ?? message.other ?? message.many ?? message.few ?? message.one ?? key;
    return interpolate(template, { ...params, count });
  };

  return { locale, t, plural };
}
