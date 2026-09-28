import { expect, test } from '@playwright/test';
import { launchExtension, openExtensionPage } from './extension';

test('language and theme preferences persist across extension pages', async () => {
  const session = await launchExtension();
  try {
    const options = await openExtensionPage(session.context, session.extensionId, 'options.html');
    await expect(options.getByRole('heading', { name: 'Настройки' })).toBeVisible();
    await expect(options.getByRole('radio', { name: 'Русский' })).toBeChecked();

    await options.getByRole('radio', { name: 'English' }).click();
    await expect(options.getByRole('heading', { name: 'Settings' })).toBeVisible();
    await expect(options.getByRole('radio', { name: 'English' })).toBeChecked();
    await expect(options.getByRole('radio', { name: 'Russian' })).toBeVisible();

    await options.getByRole('radio', { name: 'Light' }).click();
    await expect(options.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(options.getByRole('radio', { name: 'Light' })).toBeChecked();

    const manager = await openExtensionPage(session.context, session.extensionId, 'manager.html');
    await expect(manager.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(manager.getByRole('tab', { name: 'Bookmarks' })).toBeVisible();
    await expect(manager.getByRole('navigation', { name: 'Quick access' })).toBeVisible();
  } finally {
    await session.close();
  }
});
