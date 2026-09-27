import { expect, test } from '@playwright/test';
import { launchExtension, openExtensionPage } from './extension';

test('popup opens the installed extension manager', async () => {
  const session = await launchExtension();
  try {
    const page = await openExtensionPage(session.context, session.extensionId, 'popup.html');
    await page.getByRole('link', { name: 'Открыть проводник' }).click();
    await expect(page.getByRole('heading', { name: 'Проводник закладок' })).toBeVisible();
  } finally {
    await session.close();
  }
});
