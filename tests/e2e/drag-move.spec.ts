import { expect, test } from '@playwright/test';
import { launchExtension, openExtensionPage, seedBookmarkPair } from './extension';

test('dragging a bookmark onto a folder moves it in the native tree and projection', async () => {
  const session = await launchExtension();
  try {
    const page = await openExtensionPage(session.context, session.extensionId, 'manager.html');
    const seeded = await seedBookmarkPair(page);
    const destination = await page.evaluate(async parentId => {
      const api = (globalThis as unknown as {
        chrome: { bookmarks: { create(details: { parentId: string; title: string }): Promise<{ id: string }> } };
      }).chrome.bookmarks;
      return api.create({ parentId, title: 'Drag destination' });
    }, seeded.folderId);
    const pane = page.getByRole('region', { name: 'Содержимое папки' });
    await page.getByRole('navigation', { name: 'Быстрый доступ' })
      .getByRole('button', { name: seeded.barTitle }).click();
    await pane.getByRole('option', { name: seeded.folderTitle }).dblclick();

    const bookmark = pane.getByRole('option', { name: seeded.bookmarkTitle });
    const folder = pane.getByRole('option', { name: 'Drag destination' });
    await expect(bookmark).toBeVisible();
    await bookmark.getByRole('button', { name: `Перетащить «${seeded.bookmarkTitle}»` })
      .dragTo(folder.getByText('Drag destination'), { sourcePosition: { x: 8, y: 8 }, targetPosition: { x: 20, y: 12 }, steps: 15 });

    await expect(page.getByRole('status').filter({ hasText: `Перемещено «${seeded.bookmarkTitle}» в «Drag destination»` }))
      .toBeAttached();

    await expect(bookmark).toHaveCount(0);
    const nativeParent = await page.evaluate(async id => {
      const api = (globalThis as unknown as {
        chrome: { bookmarks: { get(id: string): Promise<Array<{ parentId?: string }>> } };
      }).chrome.bookmarks;
      return (await api.get(id))[0]?.parentId;
    }, seeded.bookmarkId);
    expect(nativeParent).toBe(destination.id);

    await folder.dblclick();
    await expect(pane.getByRole('option', { name: seeded.bookmarkTitle })).toBeVisible();
  } finally {
    await session.close();
  }
});

test('dragging onto a bookmark places the source immediately before it', async () => {
  const session = await launchExtension();
  try {
    const page = await openExtensionPage(session.context, session.extensionId, 'manager.html');
    const seeded = await seedBookmarkPair(page);
    const second = await page.evaluate(async parentId => {
      const api = (globalThis as unknown as {
        chrome: { bookmarks: { create(details: { parentId: string; title: string; url: string }): Promise<{ id: string }> } };
      }).chrome.bookmarks;
      return api.create({ parentId, title: 'Second bookmark', url: 'https://second.example' });
    }, seeded.folderId);
    const pane = page.getByRole('region', { name: 'Содержимое папки' });
    await page.getByRole('navigation', { name: 'Быстрый доступ' })
      .getByRole('button', { name: seeded.barTitle }).click();
    await pane.getByRole('option', { name: seeded.folderTitle }).dblclick();
    const source = pane.getByRole('option', { name: 'Second bookmark' });
    const anchor = pane.getByRole('option', { name: seeded.bookmarkTitle });
    await expect(source).toBeVisible();
    await source.getByRole('button', { name: 'Перетащить «Second bookmark»' })
      .dragTo(anchor.getByText(seeded.bookmarkTitle), { steps: 15 });

    await expect.poll(async () => page.evaluate(async parentId => {
      const api = (globalThis as unknown as {
        chrome: { bookmarks: { getChildren(id: string): Promise<Array<{ id: string }>> } };
      }).chrome.bookmarks;
      return (await api.getChildren(parentId)).map(node => node.id);
    }, seeded.folderId)).toEqual([second.id, seeded.bookmarkId]);
    await expect.poll(async () => pane.getByRole('option').allTextContents()).toEqual([
      expect.stringContaining('Second bookmark'),
      expect.stringContaining(seeded.bookmarkTitle),
    ]);

    await anchor.getByRole('button', { name: `Перетащить «${seeded.bookmarkTitle}»` })
      .dragTo(source.getByText('Second bookmark'), { steps: 15 });
    await expect.poll(async () => page.evaluate(async parentId => {
      const api = (globalThis as unknown as {
        chrome: { bookmarks: { getChildren(id: string): Promise<Array<{ id: string }>> } };
      }).chrome.bookmarks;
      return (await api.getChildren(parentId)).map(node => node.id);
    }, seeded.folderId)).toEqual([seeded.bookmarkId, second.id]);
    await expect.poll(async () => pane.getByRole('option').allTextContents()).toEqual([
      expect.stringContaining(seeded.bookmarkTitle),
      expect.stringContaining('Second bookmark'),
    ]);
  } finally {
    await session.close();
  }
});

test('dragging onto a pinned sidebar folder moves the bookmark across panes', async () => {
  const session = await launchExtension();
  try {
    const page = await openExtensionPage(session.context, session.extensionId, 'manager.html');
    const seeded = await seedBookmarkPair(page);
    const destination = await page.evaluate(async () => {
      const api = (globalThis as unknown as {
        chrome: { bookmarks: {
          getTree(): Promise<Array<{ children?: Array<{ id: string }> }>>;
          create(details: { parentId: string; title: string }): Promise<{ id: string }>;
        } };
      }).chrome.bookmarks;
      const barId = (await api.getTree())[0]!.children![0]!.id;
      return api.create({ parentId: barId, title: 'Pinned destination' });
    });
    const pane = page.getByRole('region', { name: 'Содержимое папки' });
    const quick = page.getByRole('navigation', { name: 'Быстрый доступ' });
    await quick.getByRole('button', { name: seeded.barTitle }).click();
    await pane.getByRole('button', { name: 'Закрепить «Pinned destination»' }).click();
    await expect(quick.getByRole('button', { name: 'Pinned destination', exact: true })).toBeVisible();
    await pane.getByRole('option', { name: seeded.folderTitle }).dblclick();
    const bookmark = pane.getByRole('option', { name: seeded.bookmarkTitle });
    await bookmark.getByRole('button', { name: `Перетащить «${seeded.bookmarkTitle}»` })
      .dragTo(quick.getByRole('button', { name: 'Pinned destination', exact: true }), { steps: 15 });

    await expect(bookmark).toHaveCount(0);
    const nativeParent = await page.evaluate(async id => {
      const api = (globalThis as unknown as {
        chrome: { bookmarks: { get(id: string): Promise<Array<{ parentId?: string }>> } };
      }).chrome.bookmarks;
      return (await api.get(id))[0]?.parentId;
    }, seeded.bookmarkId);
    expect(nativeParent).toBe(destination.id);
    // dnd-kit keeps a document-level click suppressor for 50 ms after pointer release.
    await page.waitForTimeout(60);
    await quick.getByRole('button', { name: 'Pinned destination', exact: true }).click();
    await expect(quick.getByRole('button', { name: 'Pinned destination', exact: true })).toHaveAttribute('aria-current', 'page');
    await expect(pane.getByRole('option', { name: seeded.bookmarkTitle })).toBeVisible();
  } finally {
    await session.close();
  }
});

test('a folder visible in both pane and quick access remains a separate drop target', async () => {
  const session = await launchExtension();
  try {
    const page = await openExtensionPage(session.context, session.extensionId, 'manager.html');
    const seeded = await seedBookmarkPair(page);
    const source = await page.evaluate(async () => {
      const api = (globalThis as unknown as {
        chrome: { bookmarks: {
          getTree(): Promise<Array<{ children?: Array<{ id: string }> }>>;
          create(details: { parentId: string; title: string; url: string }): Promise<{ id: string }>;
        } };
      }).chrome.bookmarks;
      const barId = (await api.getTree())[0]!.children![0]!.id;
      return api.create({ parentId: barId, title: 'Sidebar drag source', url: 'https://source.example' });
    });
    const pane = page.getByRole('region', { name: 'Содержимое папки' });
    const quick = page.getByRole('navigation', { name: 'Быстрый доступ' });
    await quick.getByRole('button', { name: seeded.barTitle }).click();
    await pane.getByRole('button', { name: `Закрепить «${seeded.folderTitle}»` }).click();
    const bookmark = pane.getByRole('option', { name: 'Sidebar drag source' });
    await bookmark.getByRole('button', { name: 'Перетащить «Sidebar drag source»' })
      .dragTo(quick.getByRole('button', { name: seeded.folderTitle, exact: true }), { steps: 15 });
    await expect(bookmark).toHaveCount(0);
    const nativeParent = await page.evaluate(async id => {
      const api = (globalThis as unknown as {
        chrome: { bookmarks: { get(id: string): Promise<Array<{ parentId?: string }>> } };
      }).chrome.bookmarks;
      return (await api.get(id))[0]?.parentId;
    }, source.id);
    expect(nativeParent).toBe(seeded.folderId);
  } finally {
    await session.close();
  }
});

test('dragging by the row name shows a drag ghost and reaches the folder', async () => {
  const session = await launchExtension();
  try {
    const page = await openExtensionPage(session.context, session.extensionId, 'manager.html');
    const seeded = await seedBookmarkPair(page);
    const destination = await page.evaluate(async parentId => {
      const api = (globalThis as unknown as {
        chrome: { bookmarks: { create(details: { parentId: string; title: string }): Promise<{ id: string }> } };
      }).chrome.bookmarks;
      return api.create({ parentId, title: 'Ghost destination' });
    }, seeded.folderId);
    const pane = page.getByRole('region', { name: 'Содержимое папки' });
    await page.getByRole('navigation', { name: 'Быстрый доступ' })
      .getByRole('button', { name: seeded.barTitle }).click();
    await pane.getByRole('option', { name: seeded.folderTitle }).dblclick();

    const from = await pane.getByRole('option', { name: seeded.bookmarkTitle })
      .getByText(seeded.bookmarkTitle).boundingBox();
    const to = await pane.getByRole('option', { name: 'Ghost destination' })
      .getByText('Ghost destination').boundingBox();
    if (from === null || to === null) throw new Error('rows are not visible');

    await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
    await page.mouse.down();
    await page.mouse.move(from.x + from.width / 2 + 24, from.y + from.height / 2 + 24, { steps: 8 });
    const ghost = page.locator('.drag-overlay');
    await expect(ghost).toBeVisible();
    await expect(ghost).toContainText(seeded.bookmarkTitle);
    const animationDuration = await ghost.evaluate(element => getComputedStyle(element).animationDuration);
    expect(Number.parseFloat(animationDuration)).toBeGreaterThan(0);

    await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 12 });
    await expect(pane.locator('.drop-folder[data-drop-active="true"]')).toHaveCount(1);
    await page.mouse.up();
    await expect(ghost).toHaveCount(0);

    await expect(pane.getByRole('option', { name: seeded.bookmarkTitle })).toHaveCount(0);
    const nativeParent = await page.evaluate(async id => {
      const api = (globalThis as unknown as {
        chrome: { bookmarks: { get(id: string): Promise<Array<{ parentId?: string }>> } };
      }).chrome.bookmarks;
      return (await api.get(id))[0]?.parentId;
    }, seeded.bookmarkId);
    expect(nativeParent).toBe(destination.id);
  } finally {
    await session.close();
  }
});

test('dragging a multi-selection moves every selected item and reports the count', async () => {
  const session = await launchExtension();
  try {
    const page = await openExtensionPage(session.context, session.extensionId, 'manager.html');
    const seeded = await seedBookmarkPair(page);
    const second = await page.evaluate(async parentId => {
      const api = (globalThis as unknown as {
        chrome: { bookmarks: { create(details: { parentId: string; title: string; url: string }): Promise<{ id: string }> } };
      }).chrome.bookmarks;
      return api.create({ parentId, title: 'Second bookmark', url: 'https://second.example' });
    }, seeded.folderId);
    const destination = await page.evaluate(async parentId => {
      const api = (globalThis as unknown as {
        chrome: { bookmarks: { create(details: { parentId: string; title: string }): Promise<{ id: string }> } };
      }).chrome.bookmarks;
      return api.create({ parentId, title: 'Multi destination' });
    }, seeded.folderId);
    const pane = page.getByRole('region', { name: 'Содержимое папки' });
    await page.getByRole('navigation', { name: 'Быстрый доступ' })
      .getByRole('button', { name: seeded.barTitle }).click();
    await pane.getByRole('option', { name: seeded.folderTitle }).dblclick();

    const first = pane.getByRole('option', { name: seeded.bookmarkTitle });
    const secondRow = pane.getByRole('option', { name: 'Second bookmark' });
    await first.click();
    await secondRow.click({ modifiers: ['Control'] });
    await expect(first).toHaveAttribute('aria-selected', 'true');
    await expect(secondRow).toHaveAttribute('aria-selected', 'true');

    await first.getByRole('button', { name: `Перетащить «${seeded.bookmarkTitle}»` })
      .dragTo(pane.getByRole('option', { name: 'Multi destination' }).getByText('Multi destination'), { steps: 15 });

    await expect(page.getByRole('status').filter({ hasText: 'Перемещено 2 элемента в «Multi destination»' }))
      .toBeAttached();
    await expect(first).toHaveCount(0);
    await expect(secondRow).toHaveCount(0);

    const parents = await page.evaluate(async ids => {
      const api = (globalThis as unknown as {
        chrome: { bookmarks: { get(id: string): Promise<Array<{ parentId?: string }>> } };
      }).chrome.bookmarks;
      return Promise.all(ids.map(async id => (await api.get(id))[0]?.parentId));
    }, [seeded.bookmarkId, second.id]);
    expect(parents).toEqual([destination.id, destination.id]);
  } finally {
    await session.close();
  }
});

test('a multi-selection dropped onto one of its own rows stays forbidden', async () => {
  const session = await launchExtension();
  try {
    const page = await openExtensionPage(session.context, session.extensionId, 'manager.html');
    const seeded = await seedBookmarkPair(page);
    const second = await page.evaluate(async parentId => {
      const api = (globalThis as unknown as {
        chrome: { bookmarks: { create(details: { parentId: string; title: string; url: string }): Promise<{ id: string }> } };
      }).chrome.bookmarks;
      return api.create({ parentId, title: 'Second bookmark', url: 'https://second.example' });
    }, seeded.folderId);
    const pane = page.getByRole('region', { name: 'Содержимое папки' });
    await page.getByRole('navigation', { name: 'Быстрый доступ' })
      .getByRole('button', { name: seeded.barTitle }).click();
    await pane.getByRole('option', { name: seeded.folderTitle }).dblclick();

    const first = pane.getByRole('option', { name: seeded.bookmarkTitle });
    const secondRow = pane.getByRole('option', { name: 'Second bookmark' });
    await first.click();
    await secondRow.click({ modifiers: ['Control'] });

    const from = await first.getByText(seeded.bookmarkTitle).boundingBox();
    const to = await secondRow.getByText('Second bookmark').boundingBox();
    if (from === null || to === null) throw new Error('rows are not visible');
    await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
    await page.mouse.down();
    await page.mouse.move(from.x + from.width / 2 + 24, from.y + from.height / 2 + 24, { steps: 8 });
    await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 12 });
    await expect(pane.locator('.drop-bookmark[data-drop-invalid="true"]')).toHaveCount(1);
    await page.mouse.up();

    await expect(first).toBeVisible();
    await expect(secondRow).toBeVisible();
    const order = await page.evaluate(async parentId => {
      const api = (globalThis as unknown as {
        chrome: { bookmarks: { getChildren(id: string): Promise<Array<{ id: string }>> } };
      }).chrome.bookmarks;
      return (await api.getChildren(parentId)).map(node => node.id);
    }, seeded.folderId);
    expect(order).toEqual([seeded.bookmarkId, second.id]);
  } finally {
    await session.close();
  }
});

test('a folder dragged over itself is shown as a forbidden target and stays put', async () => {
  const session = await launchExtension();
  try {
    const page = await openExtensionPage(session.context, session.extensionId, 'manager.html');
    const seeded = await seedBookmarkPair(page);
    const pane = page.getByRole('region', { name: 'Содержимое папки' });
    await page.getByRole('navigation', { name: 'Быстрый доступ' })
      .getByRole('button', { name: seeded.barTitle }).click();
    const folder = pane.getByRole('option', { name: seeded.folderTitle });
    const box = await folder.getByText(seeded.folderTitle).boundingBox();
    if (box === null) throw new Error('folder row is not visible');

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 32, box.y + box.height / 2, { steps: 10 });
    await expect(pane.locator('.drop-folder[data-drop-invalid="true"]')).toHaveCount(1);
    await page.mouse.up();

    await expect(folder).toBeVisible();
    const nativeParent = await page.evaluate(async id => {
      const api = (globalThis as unknown as {
        chrome: { bookmarks: { get(id: string): Promise<Array<{ parentId?: string }>> } };
      }).chrome.bookmarks;
      return (await api.get(id))[0]?.parentId;
    }, seeded.folderId);
    const barId = await page.evaluate(async () => {
      const api = (globalThis as unknown as {
        chrome: { bookmarks: { getTree(): Promise<Array<{ children?: Array<{ id: string }> }>> } };
      }).chrome.bookmarks;
      return (await api.getTree())[0]?.children?.[0]?.id;
    });
    expect(nativeParent).toBe(barId);
  } finally {
    await session.close();
  }
});
