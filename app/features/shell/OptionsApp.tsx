import React from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { RadioGroup } from '../../ui/RadioGroup';
import { useI18n } from '../i18n/I18nProvider';
import { usePreferences } from './AppRoot';
import type { Locale } from '../i18n/translate';
import type { ThemePreference } from '../preferences/preferences';

export function OptionsApp() {
  const { t } = useI18n();
  const { preferences, setLocale, setTheme } = usePreferences();

  return (
    <main className="page" aria-labelledby="options-title">
      <h1 id="options-title">{t('options.title')}</h1>
      <section className="ui-panel options-panel" aria-label={t('options.section')}>
        <RadioGroup<Locale>
          label={t('options.language')}
          value={preferences.locale}
          options={[
            { value: 'ru', label: t('options.locale.ru') },
            { value: 'en', label: t('options.locale.en') },
          ]}
          onChange={setLocale}
        />
        <RadioGroup<ThemePreference>
          label={t('options.theme')}
          value={preferences.theme}
          options={[
            { value: 'system', label: t('options.theme.system'), icon: <Monitor size={16} aria-hidden="true" /> },
            { value: 'dark', label: t('options.theme.dark'), icon: <Moon size={16} aria-hidden="true" /> },
            { value: 'light', label: t('options.theme.light'), icon: <Sun size={16} aria-hidden="true" /> },
          ]}
          onChange={setTheme}
        />
        <p className="ui-panel-hint">{t('options.localNote')}</p>
      </section>
    </main>
  );
}
