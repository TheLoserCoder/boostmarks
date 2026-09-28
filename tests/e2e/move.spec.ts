import { expect, test } from '@playwright/test';
import { launchExtension, openExtensionPage, seedBookmarkPair } from './extension';

test('moves a bookmark to another folder through the native tree and projection', async () => {
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
      return api.create({ parentId: barId, title: 'Destination E2E' });
    });

    const quick = page.getByRole('navigation', { name: 'Быстрый доступ' });
    const pane = page.getByRole('region', { name: 'Содержимое папки' });
    await quick.getByRole('button', { name: seeded.barTitle }).click();
    await pane.getByRole('option', { name: seeded.folderTitle }).dblclick();
    const row = pane.getByRole('option', { name: seeded.bookmarkTitle });
    await expect(row).toBeVisible();
    await row.click();
    await page.keyboard.press('Shift+F10');
    await page.getByRole('menuitem', { name: 'Переместить…' }).click();

    const dialog = page.getByRole('dialog', { name: 'Переместить' });
    await dialog.getByRole('textbox', { name: 'Папка назначения' }).fill(`${seeded.barTitle}\\Destination E2E`);
    await dialog.getByRole('button', { name: 'Переместить', exact: true }).click();
    await expect(dialog).toBeHidden();
    await expect(row).toHaveCount(0);

    const nativeParent = await page.evaluate(async id => {
      const api = (globalThis as unknown as {
        chrome: { bookmarks: { get(id: string): Promise<Array<{ parentId?: string }>> } };
      }).chrome.bookmarks;
      return (await api.get(id))[0]?.parentId;
    }, seeded.bookmarkId);
    expect(nativeParent).toBe(destination.id);

    await page.getByRole('button', { name: 'Ввести путь' }).click();
    await page.getByLabel('Путь к папке').fill(`${seeded.barTitle}\\Destination E2E`);
    await page.getByLabel('Путь к папке').press('Enter');
    await expect(pane.getByRole('option', { name: seeded.bookmarkTitle })).toBeVisible();
  } finally {
    await session.close();
  }
});
