import React from 'react';

export function PopupApp() {
  return (
    <main className="page popup" aria-labelledby="popup-title">
      <h1 id="popup-title">Boostmarks</h1>
      <p>Проводник закладок</p>
      <a href="/manager.html">Открыть проводник</a>
      <a href="/options.html">Настройки</a>
    </main>
  );
}
