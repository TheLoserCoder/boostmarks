import { expect, test } from '@playwright/test';
import { launchExtension, openExtensionPage, removeFolderTree, renameBookmark, seedBookmarkPair } from './extension';

test('manager projects real browser bookmarks and follows changes', async () => {
  const session = await launchExtension();
  try {
    const page = await openExtensionPage(session.context, session.extensionId, 'manager.html');
    await expect(page.getByRole('heading', { name: 'Проводник закладок' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Настройки' })).toBeVisible();

    const created = await seedBookmarkPair(page);
    const quickAccess = page.getByRole('navigation', { name: 'Быстрый доступ' });
    const content = page.getByRole('region', { name: 'Содержимое папки' });

    await quickAccess.getByRole('button', { name: created.barTitle }).click();
    await content.getByRole('button', { name: `Закрепить «${created.folderTitle}»` }).click();
    await expect(quickAccess.getByRole('button', { name: `Открепить «${created.folderTitle}»` })).toBeVisible();

    await content.getByRole('button', { name: created.folderTitle, exact: true }).click();
    await expect(content.getByRole('link', { name: created.bookmarkTitle })).toBeVisible();

    await page.getByRole('button', { name: 'Изменить путь' }).click();
    await page.getByLabel('Путь к папке').fill(`${created.barTitle}\\Boostmarks E2E folder`);
    await page.getByRole('button', { name: 'Перейти' }).click();
    await expect(content.getByRole('link', { name: created.bookmarkTitle })).toBeVisible();

    await page.getByLabel('Поиск закладок').fill('Boostmarks E2E bookmark');
    await expect(
      page.getByRole('region', { name: 'Результаты поиска' }).getByRole('link', { name: created.bookmarkTitle }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Очистить поиск' }).click();
    await expect(content.getByRole('link', { name: created.bookmarkTitle })).toBeVisible();

    await page.reload();
    const quickAccessAfterReload = page.getByRole('navigation', { name: 'Быстрый доступ' });
    await expect(quickAccessAfterReload.getByRole('button', { name: `Открепить «${created.folderTitle}»` })).toBeVisible();
    await quickAccessAfterReload.getByRole('button', { name: created.folderTitle, exact: true }).click();

    await renameBookmark(page, created.bookmarkId, 'Boostmarks E2E renamed');
    await expect(content.getByRole('link', { name: 'Boostmarks E2E renamed' })).toBeVisible();

    await page.getByRole('radio', { name: 'Таблица' }).click();
    await expect(page.getByRole('table', { name: 'Содержимое папки' })).toBeVisible();

    await page.reload();
    await page.getByRole('navigation', { name: 'Быстрый доступ' }).getByRole('button', { name: created.folderTitle, exact: true }).click();
    await expect(page.getByRole('table', { name: 'Содержимое папки' })).toBeVisible();
    await expect(content.getByRole('link', { name: 'Boostmarks E2E renamed' })).toBeVisible();

    await page
      .getByRole('navigation', { name: 'Быстрый доступ' })
      .getByRole('button', { name: `Открепить «${created.folderTitle}»` })
      .click();
    await expect(
      page.getByRole('navigation', { name: 'Быстрый доступ' }).getByRole('button', { name: created.folderTitle, exact: true }),
    ).toHaveCount(0);

    await removeFolderTree(page, created.folderId);
    await expect(page.getByRole('link', { name: 'Boostmarks E2E renamed' })).toHaveCount(0);
  } finally {
    await session.close();
  }
});
