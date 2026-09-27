import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import React from 'react';
import { BookmarkExplorer } from '../../../app/features/bookmarks/ui/BookmarkExplorer';
import type { BookmarkNode } from '../../../app/features/bookmarks/domain/types';
import { fakeClient, node } from './support/fixtures';

beforeEach(() => localStorage.clear());

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

describe('BookmarkExplorer two-pane shell', () => {
  it('shows top-level folders in the sidebar and the first folder content in the pane', async () => {
    const { client } = fakeClient(tree);
    render(<BookmarkExplorer client={client} />);

    const folders = await sidebar();
    expect(await folders.findByRole('button', { name: 'Панель закладок' })).toHaveAttribute('aria-current', 'page');
    expect(folders.getByRole('button', { name: 'Другие закладки' })).toBeInTheDocument();

    const pane = await content();
    expect(pane.getByRole('link', { name: 'Boostmarks' })).toBeInTheDocument();
    expect(pane.getByRole('button', { name: 'Работа' })).toBeInTheDocument();
  });

  it('navigates into a nested folder and back through breadcrumbs', async () => {
    const { client } = fakeClient(tree);
    render(<BookmarkExplorer client={client} />);
    await sidebar();

    fireEvent.click((await content()).getByRole('button', { name: 'Работа' }));

    const breadcrumbs = within(screen.getByRole('navigation', { name: 'Путь' }));
    expect(breadcrumbs.getByRole('button', { name: 'Работа' })).toHaveAttribute('aria-current', 'page');
    expect((await content()).getByRole('link', { name: 'Глубокий' })).toBeInTheDocument();

    fireEvent.click(breadcrumbs.getByRole('button', { name: 'Панель закладок' }));
    expect((await content()).getByRole('link', { name: 'Boostmarks' })).toBeInTheDocument();
  });

  it('opens bookmarks safely in a new tab', async () => {
    const { client } = fakeClient(tree);
    render(<BookmarkExplorer client={client} />);

    const link = await (await content()).findByRole('link', { name: 'Boostmarks' });
    expect(link).toHaveAttribute('href', 'https://example.com');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });

  it('shows an explicit empty state when the browser tree has no user folders', async () => {
    const { client } = fakeClient([node({ id: '0', kind: 'folder', title: '' })]);
    render(<BookmarkExplorer client={client} />);

    expect(await screen.findByText('В этой проекции пока нет закладок')).toBeInTheDocument();
  });

  it('asks the background to resync when the user presses refresh', async () => {
    const { client } = fakeClient(tree);
    render(<BookmarkExplorer client={client} />);
    await sidebar();

    fireEvent.click(screen.getByRole('button', { name: 'Обновить' }));

    expect(client.requestSync).toHaveBeenCalledTimes(1);
  });

  it('re-reads the projection when the background reports a change', async () => {
    const { client, notify, setNodes } = fakeClient(tree);
    render(<BookmarkExplorer client={client} />);
    await sidebar();

    setNodes([...tree, node({ id: 'fresh', parentId: 'bar', title: 'Новая', url: 'https://new.dev', index: 2 })]);
    notify();

    expect(await (await content()).findByRole('link', { name: 'Новая' })).toBeInTheDocument();
  });

  it('falls back to the first folder when the selected folder disappears', async () => {
    const { client, notify, setNodes } = fakeClient(tree);
    render(<BookmarkExplorer client={client} />);
    await sidebar();
    fireEvent.click((await content()).getByRole('button', { name: 'Работа' }));
    expect((await content()).getByRole('link', { name: 'Глубокий' })).toBeInTheDocument();

    setNodes(tree.filter(entry => entry.id !== 'folder' && entry.id !== 'deep'));
    notify();

    await waitFor(() => expect(screen.getByRole('link', { name: 'Boostmarks' })).toBeInTheDocument());
  });

  it('reports sync errors to the user and recovers on retry', async () => {
    const { client } = fakeClient(tree);
    (client.read as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('IndexedDB unavailable'));
    render(<BookmarkExplorer client={client} />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Не удалось прочитать локальную проекцию');
    fireEvent.click(screen.getByRole('button', { name: 'Повторить' }));
    await waitFor(() => expect(screen.getByRole('navigation', { name: 'Быстрый доступ' })).toBeInTheDocument());
  });
});

describe('BookmarkExplorer content views', () => {
  it('switches between list, table and grid renderings', async () => {
    const { client } = fakeClient(tree);
    render(<BookmarkExplorer client={client} />);
    await content();

    expect(screen.getByRole('list', { name: 'Список' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('radio', { name: 'Таблица' }));
    const table = screen.getByRole('table', { name: 'Содержимое папки' });
    expect(within(table).getByRole('columnheader', { name: 'Название' })).toBeInTheDocument();
    expect(within(table).getByRole('link', { name: 'Boostmarks' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('radio', { name: 'Сетка' }));
    expect(screen.getByRole('list', { name: 'Плитка' })).toBeInTheDocument();
    expect(within(screen.getByRole('list', { name: 'Плитка' })).getByRole('button', { name: 'Работа' })).toBeInTheDocument();
  });

  it('remembers the chosen view across renders', async () => {
    const { client } = fakeClient(tree);
    const first = render(<BookmarkExplorer client={client} />);
    await content();
    fireEvent.click(screen.getByRole('radio', { name: 'Таблица' }));
    first.unmount();

    render(<BookmarkExplorer client={client} />);

    await waitFor(() => expect(screen.getByRole('table', { name: 'Содержимое папки' })).toBeInTheDocument());
  });
});

describe('BookmarkExplorer address bar', () => {
  it('edits the folder path, opens the resolved folder and returns to breadcrumbs', async () => {
    const { client } = fakeClient(tree);
    render(<BookmarkExplorer client={client} />);
    await content();

    fireEvent.click(screen.getByRole('button', { name: 'Изменить путь' }));
    const input = screen.getByLabelText('Путь к папке');
    expect(input).toHaveValue('Панель закладок');

    fireEvent.change(input, { target: { value: 'панель закладок\\работа' } });
    fireEvent.click(screen.getByRole('button', { name: 'Перейти' }));

    expect((await content()).getByRole('link', { name: 'Глубокий' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Путь к папке')).not.toBeInTheDocument();
  });

  it('keeps the current folder and explains an unknown path', async () => {
    const { client } = fakeClient(tree);
    render(<BookmarkExplorer client={client} />);
    await content();

    fireEvent.click(screen.getByRole('button', { name: 'Изменить путь' }));
    fireEvent.change(screen.getByLabelText('Путь к папке'), { target: { value: 'Панель закладок\\Нет такой' } });
    fireEvent.click(screen.getByRole('button', { name: 'Перейти' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Папка не найдена');
    expect((await content()).getByRole('link', { name: 'Boostmarks' })).toBeInTheDocument();
  });

  it('cancels editing with Escape', async () => {
    const { client } = fakeClient(tree);
    render(<BookmarkExplorer client={client} />);
    await content();

    fireEvent.click(screen.getByRole('button', { name: 'Изменить путь' }));
    fireEvent.keyDown(screen.getByLabelText('Путь к папке'), { key: 'Escape' });

    expect(screen.queryByLabelText('Путь к папке')).not.toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Путь' })).toBeInTheDocument();
  });
});

describe('BookmarkExplorer search', () => {
  it('finds bookmarks by title and url and shows the containing folder', async () => {
    const { client } = fakeClient(tree);
    render(<BookmarkExplorer client={client} />);
    await content();

    fireEvent.change(screen.getByLabelText('Поиск закладок'), { target: { value: 'deep' } });

    const results = within(await screen.findByRole('region', { name: 'Результаты поиска' }));
    expect(results.getByRole('link', { name: 'Глубокий' })).toBeInTheDocument();
    expect(results.getByText('Панель закладок\\Работа')).toBeInTheDocument();
    expect(screen.getByText('Найдено: 1')).toBeInTheDocument();
  });

  it('clears the query and returns to the folder content', async () => {
    const { client } = fakeClient(tree);
    render(<BookmarkExplorer client={client} />);
    await content();

    fireEvent.change(screen.getByLabelText('Поиск закладок'), { target: { value: 'deep.dev' } });
    await screen.findByRole('region', { name: 'Результаты поиска' });

    fireEvent.click(screen.getByRole('button', { name: 'Очистить поиск' }));

    expect((await content()).getByRole('link', { name: 'Boostmarks' })).toBeInTheDocument();
    expect(screen.getByLabelText('Поиск закладок')).toHaveValue('');
  });

  it('explains when nothing matches', async () => {
    const { client } = fakeClient(tree);
    render(<BookmarkExplorer client={client} />);
    await content();

    fireEvent.change(screen.getByLabelText('Поиск закладок'), { target: { value: 'zzz-нет-такого' } });

    expect(await screen.findByText('Ничего не найдено')).toBeInTheDocument();
  });
});

describe('BookmarkExplorer quick links', () => {
  it('pins a content item into the sidebar and remembers it', async () => {
    const { client } = fakeClient(tree);
    render(<BookmarkExplorer client={client} />);
    await content();

    fireEvent.click(screen.getByRole('button', { name: 'Закрепить «Boostmarks»' }));

    const links = await sidebar();
    expect(links.getByRole('link', { name: 'Boostmarks' })).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('boostmarks:shortcuts:v1')!)).toEqual(['bookmark']);
  });

  it('unpins a shortcut from the sidebar', async () => {
    localStorage.setItem('boostmarks:shortcuts:v1', '["bookmark"]');
    const { client } = fakeClient(tree);
    render(<BookmarkExplorer client={client} />);

    const links = await sidebar();
    fireEvent.click(await links.findByRole('button', { name: 'Открепить «Boostmarks»' }));

    expect(links.queryByRole('link', { name: 'Boostmarks' })).not.toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('boostmarks:shortcuts:v1')!)).toEqual([]);
  });

  it('offers a settings link anchored in the sidebar', async () => {
    const { client } = fakeClient(tree);
    render(<BookmarkExplorer client={client} />);
    await sidebar();

    expect(await screen.findByRole('link', { name: 'Настройки' })).toHaveAttribute('href', '/options.html');
  });
});
