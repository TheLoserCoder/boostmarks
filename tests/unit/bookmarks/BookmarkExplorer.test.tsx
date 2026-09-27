import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import React from 'react';
import { BookmarkExplorer } from '../../../app/features/bookmarks/ui/BookmarkExplorer';
import type { ProjectionClient } from '../../../app/features/bookmarks/application/ports';
import type { BookmarkNode } from '../../../app/features/bookmarks/domain/types';

const node = (partial: Partial<BookmarkNode> & { id: string }): BookmarkNode => ({
  parentId: null,
  title: '',
  kind: 'bookmark',
  index: 0,
  ...partial,
});

const tree: BookmarkNode[] = [
  node({ id: '0', kind: 'folder', title: '' }),
  node({ id: 'bar', parentId: '0', kind: 'folder', title: 'Панель закладок', index: 0 }),
  node({ id: 'other', parentId: '0', kind: 'folder', title: 'Другие закладки', index: 1 }),
  node({ id: 'folder', parentId: 'bar', kind: 'folder', title: 'Работа', index: 0 }),
  node({ id: 'bookmark', parentId: 'bar', title: 'Boostmarks', url: 'https://example.com', index: 1 }),
  node({ id: 'deep', parentId: 'folder', title: 'Глубокий', url: 'https://deep.dev', index: 0 }),
];

function fakeClient(nodes: BookmarkNode[] = tree) {
  let listener: (() => void) | undefined;
  const client: ProjectionClient = {
    read: vi.fn(async () => nodes),
    readFreshness: vi.fn(async () => undefined),
    requestSync: vi.fn(),
    subscribe: vi.fn((next: () => void) => {
      listener = next;
      return () => {
        listener = undefined;
      };
    }),
  };
  return { client, notify: () => listener?.(), setNodes: (next: BookmarkNode[]) => { nodes = next; } };
}

async function sidebar() {
  return within(await screen.findByRole('navigation', { name: 'Папки' }));
}

async function content() {
  return within(await screen.findByRole('region', { name: 'Содержимое папки' }));
}

describe('BookmarkExplorer two-pane shell', () => {
  it('shows top-level folders in the sidebar and the first folder content in the pane', async () => {
    const { client } = fakeClient();
    render(<BookmarkExplorer client={client} />);

    const folders = await sidebar();
    expect(await folders.findByRole('button', { name: 'Панель закладок' })).toHaveAttribute('aria-current', 'page');
    expect(folders.getByRole('button', { name: 'Другие закладки' })).toBeInTheDocument();

    const pane = await content();
    expect(pane.getByRole('link', { name: 'Boostmarks' })).toBeInTheDocument();
    expect(pane.getByRole('button', { name: 'Работа' })).toBeInTheDocument();
  });

  it('navigates into a nested folder and back through breadcrumbs', async () => {
    const { client } = fakeClient();
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
    const { client } = fakeClient();
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
    const { client } = fakeClient();
    render(<BookmarkExplorer client={client} />);
    await sidebar();

    fireEvent.click(screen.getByRole('button', { name: 'Обновить' }));

    expect(client.requestSync).toHaveBeenCalledTimes(1);
  });

  it('re-reads the projection when the background reports a change', async () => {
    const { client, notify, setNodes } = fakeClient();
    render(<BookmarkExplorer client={client} />);
    await sidebar();

    setNodes([...tree, node({ id: 'fresh', parentId: 'bar', title: 'Новая', url: 'https://new.dev', index: 2 })]);
    notify();

    expect(await (await content()).findByRole('link', { name: 'Новая' })).toBeInTheDocument();
  });

  it('falls back to the first folder when the selected folder disappears', async () => {
    const { client, notify, setNodes } = fakeClient();
    render(<BookmarkExplorer client={client} />);
    await sidebar();
    fireEvent.click((await content()).getByRole('button', { name: 'Работа' }));
    expect((await content()).getByRole('link', { name: 'Глубокий' })).toBeInTheDocument();

    setNodes(tree.filter(entry => entry.id !== 'folder' && entry.id !== 'deep'));
    notify();

    await waitFor(() => expect(screen.getByRole('link', { name: 'Boostmarks' })).toBeInTheDocument());
  });

  it('reports sync errors to the user and recovers on retry', async () => {
    const { client } = fakeClient();
    (client.read as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('IndexedDB unavailable'));
    render(<BookmarkExplorer client={client} />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Не удалось прочитать локальную проекцию');
    fireEvent.click(screen.getByRole('button', { name: 'Повторить' }));
    await waitFor(() => expect(screen.getByRole('navigation', { name: 'Папки' })).toBeInTheDocument());
  });
});
