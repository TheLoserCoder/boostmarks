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
