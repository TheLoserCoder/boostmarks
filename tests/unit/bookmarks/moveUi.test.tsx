import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { BookmarkExplorer } from '../../../app/features/bookmarks/ui/BookmarkExplorer';
import type { BookmarkCommands } from '../../../app/features/bookmarks/application/ports';
import { fakeClient, fakeCommands, node } from './support/fixtures';

const tree = [
  node({ id: 'root', kind: 'folder', title: '' }),
  node({ id: 'bar', kind: 'folder', parentId: 'root', title: 'Панель' }),
  node({ id: 'other', kind: 'folder', parentId: 'root', title: 'Другие', index: 1 }),
  node({ id: 'work', kind: 'folder', parentId: 'bar', title: 'Работа' }),
  node({ id: 'link', parentId: 'bar', title: 'Сайт', url: 'https://example.com', index: 1 }),
];

beforeEach(() => localStorage.clear());

async function setup(move: BookmarkCommands['move'] = vi.fn<BookmarkCommands['move']>(async () => ({ ok: true }))) {
  const { client, setNodes, notify } = fakeClient(tree);
  const { commands } = fakeCommands();
  commands.move = move;
  render(<BookmarkExplorer client={client} commands={commands} />);
  fireEvent.click(
    within(await screen.findByRole('navigation', { name: 'Быстрый доступ' })).getByRole('button', { name: 'Панель' }),
  );
  const pane = within(await screen.findByRole('region', { name: 'Содержимое папки' }));
  return { pane, setNodes, notify };
}

async function openMove(row: HTMLElement) {
  fireEvent.contextMenu(row);
  const menu = await screen.findByRole('menu', { name: 'Действия' });
  fireEvent.click(within(menu).getByRole('menuitem', { name: 'Переместить…' }));
  return within(await screen.findByRole('dialog', { name: 'Переместить' }));
}

describe('move via the keyboard-accessible context menu', () => {
  it('clicking the drag grip does not select or open its row', async () => {
    const { pane } = await setup();
    const row = pane.getByRole('option', { name: 'Работа' });
    expect(row).toHaveAttribute('aria-selected', 'false');
    fireEvent.click(within(row).getByRole('button', { name: 'Перетащить «Работа»' }));
    expect(row).toHaveAttribute('aria-selected', 'false');
  });

  it('offers a keyboard-accessible move-to-start action without dragging', async () => {
    const { client } = fakeClient(tree);
    const { commands } = fakeCommands();
    const moveBefore = vi.fn<BookmarkCommands['moveBefore']>(async () => ({ ok: true }));
    commands.moveBefore = moveBefore;
    render(<BookmarkExplorer client={client} commands={commands} />);
    fireEvent.click(
      within(await screen.findByRole('navigation', { name: 'Быстрый доступ' })).getByRole('button', { name: 'Панель' }),
    );
    const pane = within(await screen.findByRole('region', { name: 'Содержимое папки' }));
    fireEvent.contextMenu(pane.getByRole('option', { name: 'Сайт' }));
    const menu = await screen.findByRole('menu', { name: 'Действия' });
    fireEvent.click(within(menu).getByRole('menuitem', { name: 'В начало папки' }));
    await waitFor(() => expect(moveBefore).toHaveBeenCalledExactlyOnceWith('link', 'work'));
  });

  it('moves a bookmark to a typed folder and waits for the projection event', async () => {
    const move = vi.fn<BookmarkCommands['move']>(async () => ({ ok: true }));
    const { pane, setNodes, notify } = await setup(move);
    const dialog = await openMove(pane.getByRole('option', { name: 'Сайт' }));

    fireEvent.change(dialog.getByRole('textbox', { name: 'Папка назначения' }), { target: { value: 'Другие' } });
    fireEvent.click(dialog.getByRole('button', { name: 'Переместить' }));

    await waitFor(() => expect(move).toHaveBeenCalledExactlyOnceWith('link', 'other'));
    expect(pane.getByRole('option', { name: 'Сайт' })).toBeInTheDocument();
    setNodes(tree.map(item => item.id === 'link' ? { ...item, parentId: 'other' } : item));
    await act(async () => notify());
    expect(pane.queryByRole('option', { name: 'Сайт' })).not.toBeInTheDocument();
  });

  it('rejects moving a folder into itself without calling the browser', async () => {
    const move = vi.fn<BookmarkCommands['move']>(async () => ({ ok: true }));
    const { pane } = await setup(move);
    const dialog = await openMove(pane.getByRole('option', { name: 'Работа' }));

    fireEvent.change(dialog.getByRole('textbox', { name: 'Папка назначения' }), { target: { value: 'Панель\\Работа' } });
    fireEvent.click(dialog.getByRole('button', { name: 'Переместить' }));

    expect(dialog.getByRole('alert')).toHaveTextContent('внутрь самой себя');
    expect(move).not.toHaveBeenCalled();
  });

  it('focuses the destination field when its path is invalid', async () => {
    const { pane } = await setup();
    const dialog = await openMove(pane.getByRole('option', { name: 'Сайт' }));
    const field = dialog.getByRole('textbox', { name: 'Папка назначения' });
    fireEvent.change(field, { target: { value: 'Нет такой папки' } });
    const submit = dialog.getByRole('button', { name: 'Переместить' });
    submit.focus();
    fireEvent.click(submit);
    expect(dialog.getByRole('alert')).toHaveTextContent('не найдена');
    expect(field).toHaveFocus();
  });

  it('keeps the dialog open on a native failure', async () => {
    const move = vi.fn<BookmarkCommands['move']>(async () => ({ ok: false, reason: 'failed' }));
    const { pane } = await setup(move);
    const dialog = await openMove(pane.getByRole('option', { name: 'Сайт' }));

    fireEvent.change(dialog.getByRole('textbox', { name: 'Папка назначения' }), { target: { value: 'Другие' } });
    fireEvent.click(dialog.getByRole('button', { name: 'Переместить' }));

    await waitFor(() => expect(dialog.getByRole('alert')).toHaveTextContent('Не удалось переместить'));
    expect(dialog.getByRole('textbox', { name: 'Папка назначения' })).toHaveValue('Другие');
  });
});
