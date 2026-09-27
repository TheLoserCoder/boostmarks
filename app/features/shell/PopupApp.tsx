import React from 'react';

export function PopupApp() {
  return (
    <main className="page popup" aria-labelledby="popup-title">
      <h1 id="popup-title">Boostmarks</h1>
      <p>Проводник закладок</p>
      <div className="popup-actions">
        <a className="ui-button" data-variant="solid" href="/manager.html">
          Открыть проводник
        </a>
        <a className="ui-button" data-variant="soft" href="/options.html">
          Настройки
        </a>
      </div>
    </main>
  );
}
