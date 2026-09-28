import React from 'react';
import { useI18n } from '../i18n/I18nProvider';

export function PopupApp() {
  const { t } = useI18n();

  return (
    <main className="page popup" aria-labelledby="popup-title">
      <h1 id="popup-title">{t('app.name')}</h1>
      <p>{t('app.tagline')}</p>
      <div className="popup-actions">
        <a className="ui-button" data-variant="solid" href="/manager.html">
          {t('popup.openManager')}
        </a>
        <a className="ui-button" data-variant="soft" href="/options.html">
          {t('nav.settings')}
        </a>
      </div>
    </main>
  );
}
