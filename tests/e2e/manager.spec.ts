import { expect, test } from '@playwright/test';
import { launchExtension, openExtensionPage, removeFolderTree, renameBookmark, seedBookmarkPair } from './extension';

test('manager projects real browser bookmarks and follows changes', async () => {
  const session = await launchExtension();
  try {
    const page = await openExtensionPage(session.context, session.extensionId, 'manager.html');
    await expect(page.getByRole('heading', { name: 'Проводник закладок' })).toBeVisible();

    const created = await seedBookmarkPair(page);
    const sidebar = page.getByRole('navigation', { name: 'Папки' });
    const content = page.getByRole('region', { name: 'Содержимое папки' });

    await sidebar.getByRole('button', { name: created.barTitle }).click();
    await content.getByRole('button', { name: created.folderTitle }).click();
    await expect(content.getByRole('link', { name: created.bookmarkTitle })).toBeVisible();

    await page.reload();
    await sidebar.getByRole('button', { name: created.barTitle }).click();
    await content.getByRole('button', { name: created.folderTitle }).click();
    await expect(content.getByRole('link', { name: created.bookmarkTitle })).toBeVisible();

    await renameBookmark(page, created.bookmarkId, 'Boostmarks E2E renamed');
    await expect(content.getByRole('link', { name: 'Boostmarks E2E renamed' })).toBeVisible();

    await page.getByRole('radio', { name: 'Таблица' }).click();
    await expect(page.getByRole('table', { name: 'Содержимое папки' })).toBeVisible();

    await page.reload();
    await sidebar.getByRole('button', { name: created.barTitle }).click();
    await content.getByRole('button', { name: created.folderTitle }).click();
    await expect(page.getByRole('table', { name: 'Содержимое папки' })).toBeVisible();
    await expect(content.getByRole('link', { name: 'Boostmarks E2E renamed' })).toBeVisible();

    await removeFolderTree(page, created.folderId);
    await expect(page.getByRole('button', { name: created.folderTitle })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Boostmarks E2E renamed' })).toHaveCount(0);
  } finally {
    await session.close();
  }
});
