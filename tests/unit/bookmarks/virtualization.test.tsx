import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import React from 'react';
import { BookmarkExplorer } from '../../../app/features/bookmarks/ui/BookmarkExplorer';
import type { ProjectionClient } from '../../../app/features/bookmarks/application/ports';
import type { BookmarkNode } from '../../../app/features/bookmarks/domain/types';
import { fakeClient, fakeCommands, node } from './support/fixtures';

const LARGE_COUNT = 5000;

function largeFolder(prefix: string, count: number): BookmarkNode[] {
  return [
    node({ id: '0', kind: 'folder', title: '' }),
    node({ id: 'bar', parentId: '0', kind: 'folder', title: 'Панель закладок', index: 0 }),
    node({ id: 'big', parentId: 'bar', kind: 'folder', title: 'Большая папка', index: 0 }),
    ...Array.from({ length: count }, (_, index) =>
      node({
        id: `${prefix}-${index}`,
        parentId: 'big',
        title: `${prefix} ${String(index).padStart(4, '0')}`,
        url: `https://example.com/${index}`,
        index,
      }),
    ),
  ];
}

function smallFolder(count: number): BookmarkNode[] {
  return [
    node({ id: '0', kind: 'folder', title: '' }),
    node({ id: 'bar', parentId: '0', kind: 'folder', title: 'Панель закладок', index: 0 }),
    node({ id: 'small', parentId: 'bar', kind: 'folder', title: 'Маленькая папка', index: 0 }),
    ...Array.from({ length: count }, (_, index) =>
      node({ id: `small-${index}`, parentId: 'small', title: `Точка ${index}`, url: `https://small.dev/${index}`, index }),
    ),
  ];
}

function renderExplorer(client: ProjectionClient) {
  return render(<BookmarkExplorer client={client} commands={fakeCommands().commands} />);
}

async function content() {
  return within(await screen.findByRole('region', { name: 'Содержимое папки' }));
}

/** Home -> the top-level folders bar -> the requested folder. */
async function openFolder(title: string) {
  const sidebar = within(await screen.findByRole('navigation', { name: 'Быстрый доступ' }));
  fireEvent.click(sidebar.getByRole('button', { name: 'Панель закладок' }));
  const pane = await content();
  fireEvent.doubleClick(await pane.findByRole('option', { name: title }));
}

function scrollPane(): HTMLElement {
  return screen.getByRole('listbox', { name: 'Список' }).parentElement!;
}

beforeEach(() => localStorage.clear());

if (typeof Element.prototype.scrollTo !== 'function') {
  Object.defineProperty(Element.prototype, 'scrollTo', { configurable: true, writable: true, value: () => undefined });
}

beforeAll(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class ResizeObserverStub {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  vi.spyOn(Element.prototype, 'scrollTo').mockImplementation(function (this: Element, options?: ScrollToOptions | number) {
    const top = typeof options === 'number' ? options : options?.top;
    if (typeof top === 'number') {
      Object.defineProperty(this, 'scrollTop', { configurable: true, value: top });
      this.dispatchEvent(new Event('scroll'));
    }
  });
  vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(800);
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(600);
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(600);
  vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(10_000_000);
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    right: 800,
    bottom: 600,
    width: 800,
    height: 600,
    toJSON: () => ({}),
  } as DOMRect);
});

afterAll(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('large folder virtualization', () => {
  it('renders only a window of list rows but reports the true size', async () => {
    const { client } = fakeClient(largeFolder('Заметка', LARGE_COUNT));
    renderExplorer(client);
    await screen.findByRole('navigation', { name: 'Быстрый доступ' });
    await openFolder('Большая папка');

    const list = within(screen.getByRole('listbox', { name: 'Список' }));
    const rows = list.getAllByRole('option');

    expect(rows.length).toBeGreaterThan(0);
    expect(rows.length).toBeLessThan(120);
    expect(rows[0]).toHaveAttribute('aria-setsize', String(LARGE_COUNT));
    expect(rows[0]).toHaveAttribute('aria-posinset', '1');
    expect(list.getByText('Заметка 0000')).toBeInTheDocument();
    expect(list.queryByText(String(LARGE_COUNT - 1).padStart(4, '0'))).not.toBeInTheDocument();
  });

  it('reveals later rows after scrolling instead of rendering everything at once', async () => {
    const { client } = fakeClient(largeFolder('Заметка', LARGE_COUNT));
    renderExplorer(client);
    await screen.findByRole('navigation', { name: 'Быстрый доступ' });
    await openFolder('Большая папка');

    const pane = scrollPane();
    Object.defineProperty(pane, 'scrollTop', { configurable: true, value: 32 * 1000 });
    fireEvent.scroll(pane);

    const list = within(screen.getByRole('listbox', { name: 'Список' }));
    expect(list.getByText('Заметка 1000')).toBeInTheDocument();
    expect(list.queryByText('Заметка 0000')).not.toBeInTheDocument();
    expect(list.getAllByRole('option').length).toBeLessThan(120);
  });

  it('keeps rendering small folders in full', async () => {
    const { client } = fakeClient(smallFolder(6));
    renderExplorer(client);
    await screen.findByRole('navigation', { name: 'Быстрый доступ' });
    await openFolder('Маленькая папка');

    const rows = within(screen.getByRole('listbox', { name: 'Список' })).getAllByRole('option');
    expect(rows).toHaveLength(6);
    expect(rows[0]).toHaveAttribute('aria-setsize', '6');
  });

  it('windows table rows while keeping aria-rowcount authoritative', async () => {
    const { client } = fakeClient(largeFolder('Заметка', LARGE_COUNT));
    renderExplorer(client);
    await screen.findByRole('navigation', { name: 'Быстрый доступ' });
    await openFolder('Большая папка');
    fireEvent.click(screen.getByRole('radio', { name: 'Таблица' }));

    const table = screen.getByRole('grid', { name: 'Содержимое папки' });
    const rows = within(table).getAllByRole('row');

    expect(table).toHaveAttribute('aria-rowcount', String(LARGE_COUNT + 1));
    expect(rows.length).toBeLessThan(120);
    expect(within(table).getByText('Заметка 0000')).toBeInTheDocument();
  });

  it('windows long search result lists', async () => {
    const { client } = fakeClient(largeFolder('Заметка', LARGE_COUNT));
    renderExplorer(client);
    await screen.findByRole('navigation', { name: 'Быстрый доступ' });

    fireEvent.change(screen.getByLabelText('Поиск закладок'), { target: { value: 'Заметка' } });

    const results = within(await screen.findByRole('region', { name: 'Результаты поиска' }));
    expect(screen.getByText(`Найдено: ${LARGE_COUNT}`)).toBeInTheDocument();
    expect(results.getAllByRole('listitem').length).toBeLessThan(120);
    expect(results.getByText('Заметка 0000')).toBeInTheDocument();
  });

  it('keeps the focused row rendered while walking through a virtualized folder', async () => {
    const { client } = fakeClient(largeFolder('Заметка', LARGE_COUNT));
    renderExplorer(client);
    await screen.findByRole('navigation', { name: 'Быстрый доступ' });
    await openFolder('Большая папка');

    fireEvent.click(screen.getByRole('option', { name: 'Заметка 0000' }));
    for (let step = 0; step < 60; step += 1) {
      const active = document.activeElement;
      const target =
        active instanceof HTMLElement && active.getAttribute('role') === 'option'
          ? active
          : screen.getByRole('listbox', { name: 'Список' });
      fireEvent.keyDown(target, { key: 'ArrowDown' });
    }

    const focused = screen.getByRole('option', { name: 'Заметка 0060' });
    expect(focused).toHaveFocus();
    expect(focused).toHaveAttribute('aria-selected', 'true');
    expect(screen.getAllByRole('option').length).toBeLessThan(120);
  });
});
