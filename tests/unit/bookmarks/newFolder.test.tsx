import { beforeEach, describe, expect, it } from 'vitest';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import React from 'react';
import type { CreateFolderResult } from '../../../app/features/bookmarks/application/ports';
import { BookmarkExplorer } from '../../../app/features/bookmarks/ui/BookmarkExplorer';
import { fakeClient, fakeCommands, node } from './support/fixtures';

const tree = [
  node({ id: '0', kind: 'folder', title: '' }),
  node({ id: 'bar', parentId: '0', kind: 'folder', title: 'Панель закладок', index: 0 }),
  node({ id: 'work', parentId: 'bar', kind: 'folder', title: 'Работа', index: 0 }),
  node({ id: 'bookmark', parentId: 'bar', title: 'Boostmarks', url: 'https://example.com', index: 1 }),
];

beforeEach(() => localStorage.clear());

async function content() {
  return within(await screen.findByRole('region', { name: 'Содержимое папки' }));
}

async function setup(result?: CreateFolderResult) {
  const { client, notify, setNodes } = fakeClient(tree);
  const { commands, createFolder } = result === undefined ? fakeCommands() : fakeCommands(result);
  render(<BookmarkExplorer client={client} commands={commands} />);
  // Home is the landing view; folder actions target an open folder.
  fireEvent.click(
    within(await screen.findByRole('navigation', { name: 'Быстрый доступ' })).getByRole('button', { name: 'Панель закладок' }),
  );
  await content();
  return { client, notify, setNodes, createFolder };
}

async function fillName(name: string) {
  const input = await screen.findByLabelText('Имя папки');
  fireEvent.change(input, { target: { value: name } });
}

describe('creating a folder from the manager', () => {
  it('opens the dialog from the toolbar for the folder currently open', async () => {
    await setup();

    fireEvent.click(screen.getByRole('button', { name: 'Новая папка' }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: 'Новая папка' })).toBeInTheDocument();
    expect(within(dialog).getByText('Создать папку в «Панель закладок»')).toBeInTheDocument();
  });

  it('creates the folder through the command port and reveals it in the projection', async () => {
    const { createFolder, notify, setNodes } = await setup();

    fireEvent.click(screen.getByRole('button', { name: 'Новая папка' }));
    await fillName('Отпуск');
    fireEvent.click(screen.getByRole('button', { name: 'Создать' }));

    await waitFor(() => expect(createFolder).toHaveBeenCalledWith('bar', 'Отпуск'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    setNodes([...tree, node({ id: 'created-folder', parentId: 'bar', kind: 'folder', title: 'Отпуск', index: 2 })]);
    await act(async () => {
      notify();
    });

    const path = within(screen.getByRole('navigation', { name: 'Путь' }));
    await waitFor(() => expect(path.getByRole('button', { name: 'Отпуск' })).toBeInTheDocument());
  });

  it('keeps the current folder when the open-after option is cleared', async () => {
    const { createFolder, notify, setNodes } = await setup();

    fireEvent.click(screen.getByRole('button', { name: 'Новая папка' }));
    await fillName('Отпуск');
    fireEvent.click(screen.getByRole('checkbox', { name: 'Открыть новую папку' }));
    fireEvent.click(screen.getByRole('button', { name: 'Создать' }));

    await waitFor(() => expect(createFolder).toHaveBeenCalledWith('bar', 'Отпуск'));

    setNodes([...tree, node({ id: 'created-folder', parentId: 'bar', kind: 'folder', title: 'Отпуск', index: 2 })]);
    await act(async () => {
      notify();
    });

    const pane = await content();
    expect(pane.getByRole('option', { name: 'Работа' })).toBeInTheDocument();
  });

  it('refuses a duplicate sibling name before calling the browser', async () => {
    const { createFolder } = await setup();

    fireEvent.click(screen.getByRole('button', { name: 'Новая папка' }));
    await fillName('работа');
    fireEvent.click(screen.getByRole('button', { name: 'Создать' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Папка с таким именем уже есть в этой папке');
    expect(createFolder).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('reports an empty name without submitting', async () => {
    const { createFolder } = await setup();

    fireEvent.click(screen.getByRole('button', { name: 'Новая папка' }));
    fireEvent.click(screen.getByRole('button', { name: 'Создать' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Введите имя папки');
    expect(createFolder).not.toHaveBeenCalled();
  });

  it('shows an adapter failure and keeps the dialog open for a retry', async () => {
    const { createFolder } = await setup({ ok: false, reason: 'invalid-parent' });

    fireEvent.click(screen.getByRole('button', { name: 'Новая папка' }));
    await fillName('Отпуск');
    fireEvent.click(screen.getByRole('button', { name: 'Создать' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Папка назначения больше не существует');
    expect(createFolder).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});

describe('folder context menu', () => {
  it('targets a folder row from the keyboard menu key', async () => {
    await setup();

    const row = (await content()).getByRole('option', { name: 'Работа' });
    fireEvent.click(row);
    fireEvent.keyDown(row, { key: 'F10', shiftKey: true });

    const menu = await screen.findByRole('menu', { name: 'Действия' });
    fireEvent.click(within(menu).getByRole('menuitem', { name: 'Создать папку в «Работа»' }));

    expect(await screen.findByText('Создать папку в «Работа»')).toBeInTheDocument();
  });

  it('creates next to a bookmark that was right-clicked', async () => {
    await setup();

    const row = (await content()).getByRole('option', { name: 'Boostmarks' });
    fireEvent.contextMenu(row);

    const menu = await screen.findByRole('menu', { name: 'Действия' });
    fireEvent.click(within(menu).getByRole('menuitem', { name: 'Новая папка' }));

    expect(await screen.findByText('Создать папку в «Панель закладок»')).toBeInTheDocument();
  });

  it('offers create and refresh on the empty pane background', async () => {
    const { client } = await setup();

    const section = await screen.findByRole('region', { name: 'Содержимое папки' });
    fireEvent.contextMenu(section);

    const menu = await screen.findByRole('menu', { name: 'Действия' });
    expect(within(menu).getByRole('menuitem', { name: 'Новая папка' })).toBeInTheDocument();

    fireEvent.click(within(menu).getByRole('menuitem', { name: 'Обновить' }));
    expect(client.requestSync).toHaveBeenCalled();
  });
});
