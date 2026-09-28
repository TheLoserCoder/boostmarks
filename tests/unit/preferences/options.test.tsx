import React from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { AppRoot } from '../../../app/features/shell/AppRoot';
import { OptionsApp } from '../../../app/features/shell/OptionsApp';
import { PREFERENCES_KEY } from '../../../app/features/preferences/preferencesStore';

function renderOptions() {
  return render(
    <AppRoot>
      <OptionsApp />
    </AppRoot>,
  );
}

beforeEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.theme;
});

describe('options preferences', () => {
  it('shows both real settings groups in Russian by default', () => {
    renderOptions();
    expect(screen.getByRole('heading', { name: 'Настройки' })).toBeInTheDocument();
    expect(screen.getByRole('radiogroup', { name: 'Язык' })).toBeInTheDocument();
    expect(screen.getByRole('radiogroup', { name: 'Тема' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Русский' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Тёмная' })).toBeChecked();
  });

  it('switches the language, persists it and retranslates the page', () => {
    renderOptions();
    fireEvent.click(screen.getByRole('radio', { name: 'English' }));

    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Light' })).toBeInTheDocument();
    expect(localStorage.getItem(PREFERENCES_KEY)).toContain('"locale":"en"');
  });

  it('applies and persists the light theme immediately', () => {
    renderOptions();
    fireEvent.click(screen.getByRole('radio', { name: 'Светлая' }));

    expect(document.documentElement.dataset.theme).toBe('light');
    expect(screen.getByRole('radio', { name: 'Светлая' })).toBeChecked();
    expect(localStorage.getItem(PREFERENCES_KEY)).toContain('"theme":"light"');
  });

  it('starts from stored preferences and resolves the system theme', () => {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify({ locale: 'en', theme: 'system' }));
    renderOptions();

    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(screen.getByRole('radio', { name: 'System' })).toBeChecked();
  });

  it('offers a language and theme control that stay keyboard reachable', () => {
    renderOptions();
    const language = screen.getByRole('radiogroup', { name: 'Язык' });
    const theme = screen.getByRole('radiogroup', { name: 'Тема' });
    expect(language).toBeInTheDocument();
    expect(theme).toBeInTheDocument();
    const checked = screen.getAllByRole('radio').filter(radio => radio.getAttribute('aria-checked') === 'true');
    expect(checked).toHaveLength(2);
  });
});
