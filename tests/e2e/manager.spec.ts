import { expect, test } from '@playwright/test';
import { launchExtension, openExtensionPage, removeFolderTree, renameBookmark, seedBookmarkPair } from './extension';

test('manager projects real browser bookmarks and follows changes', async () => {
  const session = await launchExtension();
  try {
    const page = await openExtensionPage(session.context, session.extensionId, 'manager.html');
    await expect(page.getByRole('heading', { name: 'Проводник закладок' })).toBeVisible();

    const created = await seedBookmarkPair(page);

    await page.getByRole('button', { name: created.barTitle }).click();
    await expect(page.getByRole('button', { name: created.folderTitle })).toBeVisible();
    await page.getByRole('button', { name: created.folderTitle }).click();
    await expect(page.getByRole('link', { name: created.bookmarkTitle })).toBeVisible();

    await page.reload();
    await page.getByRole('button', { name: created.barTitle }).click();
    await page.getByRole('button', { name: created.folderTitle }).click();
    await expect(page.getByRole('link', { name: created.bookmarkTitle })).toBeVisible();

    await renameBookmark(page, created.bookmarkId, 'Boostmarks E2E renamed');
    await expect(page.getByRole('link', { name: 'Boostmarks E2E renamed' })).toBeVisible();

    await removeFolderTree(page, created.folderId);
    await expect(page.getByRole('button', { name: created.folderTitle })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Boostmarks E2E renamed' })).toHaveCount(0);
  } finally {
    await session.close();
  }
});
