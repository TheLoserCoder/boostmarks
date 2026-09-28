import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import React from 'react';
import { BookmarkExplorer } from '../../../app/features/bookmarks/ui/BookmarkExplorer';
import type { ProjectionClient } from '../../../app/features/bookmarks/application/ports';
import type { BookmarkNode } from '../../../app/features/bookmarks/domain/types';
import { fakeClient, fakeCommands, node } from './support/fixtures';

beforeEach(() => localStorage.clear());

function renderExplorer(client: ProjectionClient) {
  return render(<BookmarkExplorer client={client} commands={fakeCommands().commands} />);
}

const tree: BookmarkNode[] = [
  node({ id: '0', kind: 'folder', title: '' }),
  node({ id: 'bar', parentId: '0', kind: 'folder', title: 'Панель закладок', index: 0 }),
  node({ id: 'other', parentId: '0', kind: 'folder', title: 'Другие закладки', index: 1 }),
  node({ id: 'folder', parentId: 'bar', kind: 'folder', title: 'Работа', index: 0 }),
  node({ id: 'bookmark', parentId: 'bar', title: 'Boostmarks', url: 'https://example.com', index: 1 }),
  node({ id: 'deep', parentId: 'folder', title: 'Глубокий', url: 'https://deep.dev', index: 0 }),
];

async function sidebar() {
  return within(await screen.findByRole('navigation', { name: 'Быстрый доступ' }));
}

async function content() {
  return within(await screen.findByRole('region', { name: 'Содержимое папки' }));
}

async function home() {
  return within(await screen.findByRole('region', { name: 'Главная' }));
}

/** The explorer lands on Home; tests open a folder before asserting its content. */
async function openFolder(title: string) {
  fireEvent.click((await sidebar()).getByRole('button', { name: title }));
  return content();
}

describe('BookmarkExplorer two-pane shell', () => {
  it('lands on Home with cards for the top-level folders and marks it in the sidebar', async () => {
    const { client } = fakeClient(tree);
    renderExplorer(client);

    const folders = await sidebar();
    expect(folders.getByRole('button', { name: 'Главная' })).toHaveAttribute('aria-current', 'page');
    expect(folders.getByRole('button', { name: 'Панель закладок' })).toBeInTheDocument();
    expect(folders.getByRole('button', { name: 'Другие закладки' })).toBeInTheDocument();

    const cards = await home();
    expect(cards.getByRole('button', { name: /Панель закладок/ })).toBeInTheDocument();
    expect(cards.getByRole('button', { name: /Другие закладки/ })).toBeInTheDocument();
  });

  it('navigates into a nested folder and back through breadcrumbs', async () => {
    const { client } = fakeClient(tree);
    renderExplorer(client);
    await openFolder('Панель закладок');

    fireEvent.doubleClick((await content()).getByRole('option', { name: 'Работа' }));

    const breadcrumbs = within(screen.getByRole('navigation', { name: 'Путь' }));
    expect(breadcrumbs.getByRole('button', { name: 'Работа' })).toHaveAttribute('aria-current', 'page');
    expect((await content()).getByRole('link', { name: 'Глубокий' })).toBeInTheDocument();

    fireEvent.click(breadcrumbs.getByRole('button', { name: 'Панель закладок' }));
    expect((await content()).getByRole('link', { name: 'Boostmarks' })).toBeInTheDocument();
  });

  it('opens bookmarks safely in a new tab', async () => {
    const { client } = fakeClient(tree);
    renderExplorer(client);
    await openFolder('Панель закладок');

    const link = await (await content()).findByRole('link', { name: 'Boostmarks' });
    expect(link).toHaveAttribute('href', 'https://example.com');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });

  it('shows an explicit empty state when the browser tree has no user folders', async () => {
    const { client } = fakeClient([node({ id: '0', kind: 'folder', title: '' })]);
    renderExplorer(client);

    expect(await screen.findByText('В этой проекции пока нет закладок')).toBeInTheDocument();
  });

  it('asks the background to resync when the user presses refresh', async () => {
    const { client } = fakeClient(tree);
    renderExplorer(client);
    await sidebar();

    fireEvent.click(screen.getByRole('button', { name: 'Обновить' }));

    expect(client.requestSync).toHaveBeenCalledTimes(1);
  });

  it('re-reads the projection when the background reports a change', async () => {
    const { client, notify, setNodes } = fakeClient(tree);
    renderExplorer(client);
    await openFolder('Панель закладок');

    setNodes([...tree, node({ id: 'fresh', parentId: 'bar', title: 'Новая', url: 'https://new.dev', index: 2 })]);
    notify();

    expect(await (await content()).findByRole('link', { name: 'Новая' })).toBeInTheDocument();
  });

  it('returns Home when the selected folder disappears', async () => {
    const { client, notify, setNodes } = fakeClient(tree);
    renderExplorer(client);
    await openFolder('Панель закладок');
    fireEvent.doubleClick((await content()).getByRole('option', { name: 'Работа' }));
    expect((await content()).getByRole('link', { name: 'Глубокий' })).toBeInTheDocument();

    setNodes(tree.filter(entry => entry.id !== 'folder' && entry.id !== 'deep'));
    notify();

    expect(await screen.findByRole('region', { name: 'Главная' })).toBeInTheDocument();
  });

  it('reports sync errors to the user and recovers on retry', async () => {
    const { client } = fakeClient(tree);
    (client.read as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('IndexedDB unavailable'));
    renderExplorer(client);

    expect(await screen.findByRole('alert')).toHaveTextContent('Не удалось прочитать локальную проекцию');
    fireEvent.click(screen.getByRole('button', { name: 'Повторить' }));
    await waitFor(() => expect(screen.getByRole('navigation', { name: 'Быстрый доступ' })).toBeInTheDocument());
  });
});

describe('BookmarkExplorer content views', () => {
  it('switches between list, table and grid renderings', async () => {
    const { client } = fakeClient(tree);
    renderExplorer(client);
    await openFolder('Панель закладок');

    expect(screen.getByRole('listbox', { name: 'Список' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('radio', { name: 'Таблица' }));
    const table = screen.getByRole('grid', { name: 'Содержимое папки' });
    expect(within(table).getByRole('columnheader', { name: 'Название' })).toBeInTheDocument();
    expect(within(table).getByRole('link', { name: 'Boostmarks' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('radio', { name: 'Сетка' }));
    expect(screen.getByRole('listbox', { name: 'Плитка' })).toBeInTheDocument();
    expect(within(screen.getByRole('listbox', { name: 'Плитка' })).getByRole('option', { name: 'Работа' })).toBeInTheDocument();
  });

  it('remembers the chosen view across renders', async () => {
    const { client } = fakeClient(tree);
    const first = renderExplorer(client);
    await openFolder('Панель закладок');
    fireEvent.click(screen.getByRole('radio', { name: 'Таблица' }));
    first.unmount();

    renderExplorer(client);
    await openFolder('Панель закладок');

    await waitFor(() => expect(screen.getByRole('grid', { name: 'Содержимое папки' })).toBeInTheDocument());
  });
});

describe('BookmarkExplorer address bar', () => {
  it('edits the folder path, opens the resolved folder and returns to breadcrumbs', async () => {
    const { client } = fakeClient(tree);
    renderExplorer(client);
    await openFolder('Панель закладок');

    expect(screen.queryByRole('button', { name: 'Изменить путь' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Ввести путь' }));
    const input = screen.getByLabelText('Путь к папке');
    expect(input).toHaveValue('Панель закладок');

    fireEvent.change(input, { target: { value: 'панель закладок\\работа' } });
    fireEvent.submit(input.closest('form')!);

    expect((await content()).getByRole('link', { name: 'Глубокий' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Путь к папке')).not.toBeInTheDocument();
  });

  it('keeps the current folder and explains an unknown path', async () => {
    const { client } = fakeClient(tree);
    renderExplorer(client);
    await openFolder('Панель закладок');

    fireEvent.click(screen.getByRole('button', { name: 'Ввести путь' }));
    fireEvent.change(screen.getByLabelText('Путь к папке'), { target: { value: 'Панель закладок\\Нет такой' } });
    fireEvent.submit(screen.getByLabelText('Путь к папке').closest('form')!);

    expect(await screen.findByRole('alert')).toHaveTextContent('Папка не найдена');
    expect((await content()).getByRole('link', { name: 'Boostmarks' })).toBeInTheDocument();
  });

  it('cancels editing with Escape', async () => {
    const { client } = fakeClient(tree);
    renderExplorer(client);
    await openFolder('Панель закладок');

    fireEvent.click(screen.getByRole('button', { name: 'Ввести путь' }));
    fireEvent.keyDown(screen.getByLabelText('Путь к папке'), { key: 'Escape' });

    expect(screen.queryByLabelText('Путь к папке')).not.toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Путь' })).toBeInTheDocument();
  });
});

describe('BookmarkExplorer search', () => {
  it('finds bookmarks by title and url and shows the containing folder', async () => {
    const { client } = fakeClient(tree);
    renderExplorer(client);
    await home();

    fireEvent.change(screen.getByLabelText('Поиск закладок'), { target: { value: 'deep' } });

    const results = within(await screen.findByRole('region', { name: 'Результаты поиска' }));
    expect(results.getByRole('link', { name: 'Глубокий' })).toBeInTheDocument();
    expect(results.getByText('Панель закладок\\Работа')).toBeInTheDocument();
    expect(screen.getByText('Найдено: 1')).toBeInTheDocument();
  });

  it('clears the query and returns to the folder content', async () => {
    const { client } = fakeClient(tree);
    renderExplorer(client);
    await openFolder('Панель закладок');

    fireEvent.change(screen.getByLabelText('Поиск закладок'), { target: { value: 'deep.dev' } });
    await screen.findByRole('region', { name: 'Результаты поиска' });

    fireEvent.click(screen.getByRole('button', { name: 'Очистить поиск' }));

    expect((await content()).getByRole('link', { name: 'Boostmarks' })).toBeInTheDocument();
    expect(screen.getByLabelText('Поиск закладок')).toHaveValue('');
  });

  it('explains when nothing matches', async () => {
    const { client } = fakeClient(tree);
    renderExplorer(client);
    await home();

    fireEvent.change(screen.getByLabelText('Поиск закладок'), { target: { value: 'zzz-нет-такого' } });

    expect(await screen.findByText('Ничего не найдено')).toBeInTheDocument();
  });
});

describe('BookmarkExplorer quick links', () => {
  it('pins a content item into the sidebar and remembers it', async () => {
    const { client } = fakeClient(tree);
    renderExplorer(client);
    await openFolder('Панель закладок');

    fireEvent.click(screen.getByRole('button', { name: 'Закрепить «Boostmarks»' }));

    const links = await sidebar();
    expect(links.getByRole('link', { name: 'Boostmarks' })).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('boostmarks:shortcuts:v1')!)).toEqual(['bookmark']);
  });

  it('unpins a shortcut from the sidebar', async () => {
    localStorage.setItem('boostmarks:shortcuts:v1', '["bookmark"]');
    const { client } = fakeClient(tree);
    renderExplorer(client);

    const links = await sidebar();
    fireEvent.click(await links.findByRole('button', { name: 'Открепить «Boostmarks»' }));

    expect(links.queryByRole('link', { name: 'Boostmarks' })).not.toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('boostmarks:shortcuts:v1')!)).toEqual([]);
  });

  it('offers a settings link anchored in the sidebar', async () => {
    const { client } = fakeClient(tree);
    renderExplorer(client);
    await sidebar();

    expect(await screen.findByRole('link', { name: 'Настройки' })).toHaveAttribute('href', '/options.html');
  });
});

const domRect = (left: number, top: number, right: number, bottom: number): DOMRect =>
  ({
    left,
    top,
    right,
    bottom,
    width: right - left,
    height: bottom - top,
    x: left,
    y: top,
    toJSON: () => ({}),
  }) as DOMRect;

describe('BookmarkExplorer selection and keyboard', () => {
  it('selects a row on click without navigating or opening', async () => {
    const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
    const { client } = fakeClient(tree);
    renderExplorer(client);

    const pane = await openFolder('Панель закладок');
    const work = pane.getByRole('option', { name: 'Работа' });
    fireEvent.click(work);

    expect(work).toHaveAttribute('aria-selected', 'true');
    expect(pane.getByRole('link', { name: 'Boostmarks' })).toBeInTheDocument();
    expect(openSpy).not.toHaveBeenCalled();
    openSpy.mockRestore();
  });

  it('toggles with ctrl, extends with shift and clears with Escape', async () => {
    const { client } = fakeClient(tree);
    renderExplorer(client);
    const pane = await openFolder('Панель закладок');
    const work = pane.getByRole('option', { name: 'Работа' });
    const bookmark = pane.getByRole('option', { name: 'Boostmarks' });

    fireEvent.click(work);
    fireEvent.click(bookmark, { ctrlKey: true });
    expect(work).toHaveAttribute('aria-selected', 'true');
    expect(bookmark).toHaveAttribute('aria-selected', 'true');

    fireEvent.click(bookmark, { ctrlKey: true });
    expect(bookmark).toHaveAttribute('aria-selected', 'false');

    fireEvent.click(bookmark);
    fireEvent.click(work, { shiftKey: true });
    expect(work).toHaveAttribute('aria-selected', 'true');
    expect(bookmark).toHaveAttribute('aria-selected', 'true');

    fireEvent.keyDown(work, { key: 'Escape' });
    expect(work).toHaveAttribute('aria-selected', 'false');
    expect(bookmark).toHaveAttribute('aria-selected', 'false');
  });

  it('selects all rows with ctrl+A', async () => {
    const { client } = fakeClient(tree);
    renderExplorer(client);
    const pane = await openFolder('Панель закладок');
    const work = pane.getByRole('option', { name: 'Работа' });
    const bookmark = pane.getByRole('option', { name: 'Boostmarks' });

    fireEvent.click(work);
    fireEvent.keyDown(work, { key: 'a', ctrlKey: true });

    expect(work).toHaveAttribute('aria-selected', 'true');
    expect(bookmark).toHaveAttribute('aria-selected', 'true');
  });

  it('moves the roving focus with arrows and extends the range with shift', async () => {
    const { client } = fakeClient(tree);
    renderExplorer(client);
    const pane = await openFolder('Панель закладок');
    const work = pane.getByRole('option', { name: 'Работа' });
    const bookmark = pane.getByRole('option', { name: 'Boostmarks' });

    fireEvent.click(work);
    expect(work).toHaveFocus();

    fireEvent.keyDown(work, { key: 'ArrowDown', shiftKey: true });
    expect(bookmark).toHaveFocus();
    expect(bookmark).toHaveAttribute('aria-selected', 'true');
    expect(work).toHaveAttribute('aria-selected', 'true');
  });

  it('enters a folder with Enter', async () => {
    const { client } = fakeClient(tree);
    renderExplorer(client);
    const work = (await openFolder('Панель закладок')).getByRole('option', { name: 'Работа' });

    fireEvent.click(work);
    fireEvent.keyDown(work, { key: 'Enter' });

    expect((await content()).getByRole('link', { name: 'Глубокий' })).toBeInTheDocument();
  });

  it('opens the focused bookmark with Enter and plain double click', async () => {
    const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
    const { client } = fakeClient(tree);
    renderExplorer(client);
    const pane = await openFolder('Панель закладок');
    const bookmark = pane.getByRole('option', { name: 'Boostmarks' });

    fireEvent.click(bookmark);
    fireEvent.keyDown(bookmark, { key: 'Enter' });
    expect(openSpy).toHaveBeenCalledWith('https://example.com', '_blank', 'noopener');

    fireEvent.doubleClick(bookmark);
    expect(openSpy).toHaveBeenCalledTimes(2);
    openSpy.mockRestore();
  });

  it('selects visible rows with a marquee drag on the pane background', async () => {
    const { client } = fakeClient(tree);
    renderExplorer(client);
    const pane = (await openFolder('Панель закладок')).getByRole('listbox', { name: 'Список' }).parentElement!;
    vi.spyOn(pane, 'getBoundingClientRect').mockReturnValue(domRect(0, 0, 400, 300));

    const workRow = pane.querySelector('[data-row-id="folder"]')!;
    const bookmarkRow = pane.querySelector('[data-row-id="bookmark"]')!;
    vi.spyOn(workRow, 'getBoundingClientRect').mockReturnValue(domRect(0, 0, 400, 20));
    vi.spyOn(bookmarkRow, 'getBoundingClientRect').mockReturnValue(domRect(0, 20, 400, 40));

    fireEvent.mouseDown(pane, { button: 0, clientX: 5, clientY: 5 });
    fireEvent.mouseMove(window, { clientX: 395, clientY: 35 });
    fireEvent.mouseUp(window, {});

    expect(workRow).toHaveAttribute('aria-selected', 'true');
    expect(bookmarkRow).toHaveAttribute('aria-selected', 'true');
  });
});
