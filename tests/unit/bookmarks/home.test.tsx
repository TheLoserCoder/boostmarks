import React from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { BookmarkExplorer } from '../../../app/features/bookmarks/ui/BookmarkExplorer';
import { fakeClient, fakeCommands, node } from './support/fixtures';

const tree = [
  node({ id: '0', kind: 'folder', title: '' }),
  node({ id: 'bar', parentId: '0', kind: 'folder', title: 'Панель закладок', index: 0 }),
  node({ id: 'other', parentId: '0', kind: 'folder', title: 'Другие закладки', index: 1 }),
  node({ id: 'work', parentId: 'bar', kind: 'folder', title: 'Работа', index: 0 }),
  node({ id: 'link', parentId: 'bar', title: 'Boostmarks', url: 'https://example.com', index: 1 }),
];

beforeEach(() => localStorage.clear());

function renderExplorer() {
  const { client } = fakeClient(tree);
  render(<BookmarkExplorer client={client} commands={fakeCommands().commands} />);
}

async function homeRegion() {
  return within(await screen.findByRole('region', { name: 'Главная' }));
}

async function sidebar() {
  return within(await screen.findByRole('navigation', { name: 'Быстрый доступ' }));
}

async function content() {
  return within(await screen.findByRole('region', { name: 'Содержимое папки' }));
}

describe('explorer home view', () => {
  it('opens on Home with cards for top-level folders and honest item counts', async () => {
    renderExplorer();

    const home = await homeRegion();
    expect(home.getByRole('heading', { name: 'Папки' })).toBeInTheDocument();
    expect(home.getByRole('button', { name: /Панель закладок/ })).toBeInTheDocument();
    expect(home.getByRole('button', { name: /Другие закладки/ })).toBeInTheDocument();
    expect(home.getByText('2 элемента')).toBeInTheDocument();
    expect(home.getByText('0 элементов')).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Содержимое папки' })).not.toBeInTheDocument();
  });

  it('opens a folder from a card and returns Home from the sidebar', async () => {
    renderExplorer();

    fireEvent.click((await homeRegion()).getByRole('button', { name: /Панель закладок/ }));
    expect((await content()).getByRole('link', { name: 'Boostmarks' })).toBeInTheDocument();

    fireEvent.click((await sidebar()).getByRole('button', { name: 'Главная' }));
    expect(await screen.findByRole('region', { name: 'Главная' })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Содержимое папки' })).not.toBeInTheDocument();
  });

  it('lists pinned entries in their own section without duplicating them', async () => {
    localStorage.setItem('boostmarks:shortcuts:v1', '["work"]');
    renderExplorer();

    const home = await homeRegion();
    expect(home.getByRole('heading', { name: 'Закреплённые' })).toBeInTheDocument();
    expect(home.getByRole('button', { name: /Работа/ })).toBeInTheDocument();
    expect(home.getAllByRole('button', { name: /Работа/ })).toHaveLength(1);
    expect(home.getByRole('heading', { name: 'Папки' })).toBeInTheDocument();
  });

  it('keeps Home out of the way when the open folder disappears', async () => {
    const { client, notify, setNodes } = fakeClient(tree);
    render(<BookmarkExplorer client={client} commands={fakeCommands().commands} />);
    fireEvent.click((await homeRegion()).getByRole('button', { name: /Панель закладок/ }));
    expect((await content()).getByRole('link', { name: 'Boostmarks' })).toBeInTheDocument();

    setNodes(tree.filter(entry => entry.id !== 'bar' && entry.id !== 'work' && entry.id !== 'link'));
    notify();

    expect(await screen.findByRole('region', { name: 'Главная' })).toBeInTheDocument();
  });

  it('explains how folders appear when there is nothing to show', async () => {
    const { client } = fakeClient([
      node({ id: '0', kind: 'folder', title: '' }),
      node({ id: 'orphan', parentId: '0', title: 'Одинокая', url: 'https://one.dev' }),
    ]);
    render(<BookmarkExplorer client={client} commands={fakeCommands().commands} />);

    expect(await screen.findByText(/Папок пока нет/)).toBeInTheDocument();
  });
});
