import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PopupApp } from '../../app/features/shell/PopupApp';
import { ManagerApp } from '../../app/features/shell/ManagerApp';
import { OptionsApp } from '../../app/features/shell/OptionsApp';
import type { ProjectionClient } from '../../app/features/bookmarks/application/ports';

const emptyClient: ProjectionClient = {
  read: async () => [],
  readFreshness: async () => undefined,
  requestSync: () => undefined,
  subscribe: () => () => undefined,
};

describe('extension pages', () => {
  it('offers navigation from the popup to the manager', () => {
    render(<PopupApp />);
    expect(screen.getByRole('link', { name: 'Открыть проводник' })).toHaveAttribute('href', '/manager.html');
  });

  it('labels the manager main region', () => {
    render(<ManagerApp client={emptyClient} />);
    expect(screen.getByRole('main')).toHaveAccessibleName('Проводник закладок');
  });

  it('labels the options main region', () => {
    render(<OptionsApp />);
    expect(screen.getByRole('main')).toHaveAccessibleName('Настройки');
  });
});
