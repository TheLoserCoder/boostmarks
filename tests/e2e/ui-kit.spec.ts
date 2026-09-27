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

test('the manager stays usable in a narrow window', async () => {
  const session = await launchExtension();
  try {
    const popup = await openExtensionPage(session.context, session.extensionId, 'popup.html');
    await seedBookmarkPair(popup);
    await popup.close();

    const page = await openExtensionPage(session.context, session.extensionId, 'manager.html');
    await page.setViewportSize({ width: 420, height: 720 });

    await expect(page.getByRole('heading', { name: 'Проводник закладок' })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Быстрый доступ' })).toBeVisible();
    await expect(page.getByRole('radiogroup', { name: 'Вид' })).toBeVisible();
    await expect(page.getByLabel('Поиск закладок')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Новая папка' })).toBeVisible();

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
