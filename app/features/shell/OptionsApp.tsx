import React from 'react';

export function OptionsApp() {
  return (
    <main className="page" aria-labelledby="options-title">
      <h1 id="options-title">Настройки</h1>
      <section className="ui-panel" aria-label="Настройки расширения">
        <p>Настройки появятся вместе с функциями расширения: язык, тема и поведение закладок.</p>
        <p className="ui-panel-hint">Все данные хранятся локально, в вашем браузере.</p>
      </section>
    </main>
  );
}
