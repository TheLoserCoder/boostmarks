import React from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { BookmarkExplorer } from '../../../app/features/bookmarks/ui/BookmarkExplorer';
import { fakeClient, fakeCommands, node } from './support/fixtures';

const tree = [
  node({ id: '0', kind: 'folder', title: '' }),
  node({ id: 'bar', parentId: '0', kind: 'folder', title: 'Панель', index: 0 }),
  node({ id: 'work', parentId: 'bar', kind: 'folder', title: 'Работа', index: 0 }),
  node({ id: 'link', parentId: 'bar', title: 'Сайт', url: 'https://example.com', index: 1 }),
];

beforeEach(() => localStorage.clear());

async function setup() {
  const { client } = fakeClient(tree);
  const { commands } = fakeCommands();
  render(<BookmarkExplorer client={client} commands={commands} />);
  await screen.findByRole('navigation', { name: 'Быстрый доступ' });
}

/** The content pane is remounted on navigation, so re-query it before every row interaction. */
const pane = async () => within(await screen.findByRole('region', { name: 'Содержимое папки' }));

const sidebar = async () => within(await screen.findByRole('navigation', { name: 'Быстрый доступ' }));

/** Opens a top-level folder from the sidebar; the explorer lands on Home. */
const openFolder = async (title: string) => fireEvent.click((await sidebar()).getByRole('button', { name: title }));

const crumb = () =>
  within(screen.getByRole('navigation', { name: 'Путь' })).getByRole('button', { current: 'page' }).textContent;

describe('explorer navigation toolbar', () => {
  it('walks back and forward through visited folders', async () => {
    await setup();
    expect(screen.getByRole('button', { name: 'Назад' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Вперёд' })).toBeDisabled();

    await openFolder('Панель');
    expect(crumb()).toBe('Панель');

    fireEvent.doubleClick((await pane()).getByRole('option', { name: 'Работа' }));
    expect(crumb()).toBe('Работа');

    fireEvent.click(screen.getByRole('button', { name: 'Назад' }));
    expect(crumb()).toBe('Панель');
    expect(screen.getByRole('button', { name: 'Вперёд' })).toBeEnabled();

    fireEvent.click(screen.getByRole('button', { name: 'Вперёд' }));
    expect(crumb()).toBe('Работа');
  });

  it('returns from the first folder to Home with the back button', async () => {
    await setup();
    await openFolder('Панель');
    expect(crumb()).toBe('Панель');

    fireEvent.click(screen.getByRole('button', { name: 'Назад' }));

    expect(await screen.findByRole('region', { name: 'Главная' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Назад' })).toBeDisabled();
  });

  it('clears the forward stack when a folder is opened again', async () => {
    await setup();
    await openFolder('Панель');
    fireEvent.doubleClick((await pane()).getByRole('option', { name: 'Работа' }));
    fireEvent.click(screen.getByRole('button', { name: 'Назад' }));
    fireEvent.doubleClick((await pane()).getByRole('option', { name: 'Работа' }));
    expect(crumb()).toBe('Работа');
    expect(screen.getByRole('button', { name: 'Вперёд' })).toBeDisabled();
  });

  it('goes up to the parent folder and disables the button at the top level', async () => {
    await setup();
    expect(screen.getByRole('button', { name: 'Вверх' })).toBeDisabled();

    await openFolder('Панель');
    fireEvent.doubleClick((await pane()).getByRole('option', { name: 'Работа' }));
    const up = screen.getByRole('button', { name: 'Вверх' });
    expect(up).toBeEnabled();

    fireEvent.click(up);
    expect(crumb()).toBe('Панель');
    expect(screen.getByRole('button', { name: 'Вверх' })).toBeDisabled();
  });
});
