import React from 'react';
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup } from '@testing-library/react';
import { PopupApp } from '../../app/features/shell/PopupApp';
import { ManagerApp } from '../../app/features/shell/ManagerApp';
import { OptionsApp } from '../../app/features/shell/OptionsApp';

afterEach(cleanup);

describe('extension pages', () => {
  it('offers navigation from the popup to the manager', () => {
    render(<PopupApp />);
    expect(screen.getByRole('link', { name: 'Открыть проводник' })).toHaveAttribute('href', '/manager.html');
  });

  it('labels the manager main region', () => {
    render(<ManagerApp />);
    expect(screen.getByRole('main')).toHaveAccessibleName('Проводник закладок');
  });

  it('labels the options main region', () => {
    render(<OptionsApp />);
    expect(screen.getByRole('main')).toHaveAccessibleName('Настройки');
  });
});
