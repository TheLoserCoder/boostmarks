import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PopupApp } from '../../app/features/shell/PopupApp';
import { ManagerApp } from '../../app/features/shell/ManagerApp';
import { OptionsApp } from '../../app/features/shell/OptionsApp';
import type { BookmarkCommands, ProjectionClient } from '../../app/features/bookmarks/application/ports';

const emptyClient: ProjectionClient = {
  read: async () => [],
  readFreshness: async () => undefined,
  requestSync: () => undefined,
  subscribe: () => () => undefined,
};

const emptyCommands: BookmarkCommands = {
  createFolder: async () => ({ ok: false, reason: 'failed' }),
  move: async () => ({ ok: false, reason: 'failed' }),
  moveBefore: async () => ({ ok: false, reason: 'failed' }),
};

describe('extension pages', () => {
  it('offers navigation from the popup to the manager', () => {
    render(<PopupApp />);
    expect(screen.getByRole('link', { name: 'Открыть проводник' })).toHaveAttribute('href', '/manager.html');
  });

  it('labels the manager main region', () => {
    render(<ManagerApp client={emptyClient} commands={emptyCommands} />);
    expect(screen.getByRole('main')).toHaveAccessibleName('Закладки');
    expect(screen.queryByRole('heading', { name: 'Проводник закладок' })).not.toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Закладки' })).toHaveAttribute('aria-selected', 'true');
  });

  it('labels the options main region', () => {
    render(<OptionsApp />);
    expect(screen.getByRole('main')).toHaveAccessibleName('Настройки');
  });
});
