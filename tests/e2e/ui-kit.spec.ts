import { expect, test } from '@playwright/test';
import { launchExtension, openExtensionPage, seedBookmarkPair } from './extension';

test('view switcher behaves as one radio group with arrow-key selection', async () => {
  const session = await launchExtension();
  try {
    const popup = await openExtensionPage(session.context, session.extensionId, 'popup.html');
    await seedBookmarkPair(popup);
    await popup.close();

    const page = await openExtensionPage(session.context, session.extensionId, 'manager.html');
    const list = page.getByRole('radio', { name: 'Список' });
    const table = page.getByRole('radio', { name: 'Таблица' });
    const grid = page.getByRole('radio', { name: 'Сетка' });

    await expect(list).toBeChecked();
    await expect(page.getByRole('radiogroup', { name: 'Вид' })).toBeVisible();

    await list.click();
    await page.keyboard.press('ArrowRight');
    await expect(table).toBeChecked();

    await page.keyboard.press('ArrowRight');
    await expect(grid).toBeChecked();

    await page.keyboard.press('ArrowLeft');
    await expect(table).toBeChecked();

    // Single tab stop: the group holds focus, so one Tab leaves the whole control.
    await expect(page.getByRole('radio', { name: 'Таблица' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('radio', { name: 'Таблица' })).not.toBeFocused();
  } finally {
    await session.close();
  }
});

test('the manager opens on Home and opens a folder from a card', async () => {
  const session = await launchExtension();
  try {
    const popup = await openExtensionPage(session.context, session.extensionId, 'popup.html');
    const seeded = await seedBookmarkPair(popup);
    await popup.close();

    const page = await openExtensionPage(session.context, session.extensionId, 'manager.html');
    const home = page.getByRole('region', { name: 'Главная' });
    await expect(home).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Путь' })).toContainText('Главная');
    await expect(page.getByRole('button', { name: 'Новая папка' })).toHaveCount(0);

    // The seeded folder lives inside the bookmarks bar, so open the bar card first.
    await home.getByRole('button', { name: seeded.barTitle }).click();
    const content = page.getByRole('region', { name: 'Содержимое папки' });
    await content.getByRole('option', { name: seeded.folderTitle, exact: true }).dblclick();

    await expect(content.getByRole('link', { name: seeded.bookmarkTitle })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Путь' })).toContainText(seeded.folderTitle);

    await page.getByRole('navigation', { name: 'Быстрый доступ' }).getByRole('button', { name: 'Главная' }).click();
    await expect(page.getByRole('region', { name: 'Главная' })).toBeVisible();
  } finally {
    await session.close();
  }
});

test('the manager stays usable in a narrow window', async () => {
  const session = await launchExtension();
  try {
    const popup = await openExtensionPage(session.context, session.extensionId, 'popup.html');
    const seeded = await seedBookmarkPair(popup);
    await popup.close();

    const page = await openExtensionPage(session.context, session.extensionId, 'manager.html');
    await page.setViewportSize({ width: 420, height: 720 });

    await expect(page.getByRole('tab', { name: 'Закладки' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Проводник закладок' })).toHaveCount(0);
    await expect(page.getByRole('navigation', { name: 'Быстрый доступ' })).toBeVisible();
    await expect(page.getByRole('radiogroup', { name: 'Вид' })).toBeVisible();
    await expect(page.getByLabel('Поиск закладок')).toBeVisible();

    // Toolbar folder actions belong to folder content, so open a folder first.
    await page.getByRole('navigation', { name: 'Быстрый доступ' })
      .getByRole('button', { name: seeded.barTitle }).click();
    await expect(page.getByRole('button', { name: 'Новая папка' })).toBeVisible();

    // Neither pane may push the layout wider than the window (the sidebar scrolls inside itself).
    const widths = await page.evaluate(() => ({
      sidebar: document.querySelector('.sidebar')?.getBoundingClientRect().width ?? 0,
      workspace: document.querySelector('.workspace')?.getBoundingClientRect().width ?? 0,
      viewport: window.innerWidth,
    }));
    expect(widths.sidebar).toBeLessThanOrEqual(widths.viewport);
    expect(widths.workspace).toBeLessThanOrEqual(widths.viewport);

    // The dialog fits the narrow window and stays operable.
    await page.getByRole('button', { name: 'Новая папка' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    const box = await dialog.boundingBox();
    expect(box?.width ?? Number.POSITIVE_INFINITY).toBeLessThanOrEqual(420);

    await dialog.getByLabel('Имя папки').fill('Узкая папка');
    await dialog.getByRole('button', { name: 'Создать' }).click();
    await expect(page.getByRole('navigation', { name: 'Путь' })).toContainText('Узкая папка');
  } finally {
    await session.close();
  }
});

test('grid cards keep a compact height instead of stretching to fill the pane', async () => {
  const session = await launchExtension();
  try {
    const page = await openExtensionPage(session.context, session.extensionId, 'manager.html');
    const seeded = await seedBookmarkPair(page);
    await page.getByRole('navigation', { name: 'Быстрый доступ' })
      .getByRole('button', { name: seeded.barTitle }).click();
    await page.getByRole('radio', { name: 'Сетка' }).click();

    const card = page.getByRole('option', { name: seeded.folderTitle });
    await expect(card).toBeVisible();
    const box = await card.boundingBox();
    expect(box?.height ?? Number.POSITIVE_INFINITY).toBeLessThanOrEqual(88);
  } finally {
    await session.close();
  }
});
