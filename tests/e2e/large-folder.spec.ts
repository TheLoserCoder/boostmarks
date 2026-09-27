import { expect, test } from '@playwright/test';
import { launchExtension, openExtensionPage, seedLargeFolder } from './extension';

const LARGE_COUNT = 150;

test('large folders render only a window of rows and scroll to the end', async () => {
  test.setTimeout(60_000);
  const session = await launchExtension();
  try {
    const popup = await openExtensionPage(session.context, session.extensionId, 'popup.html');
    const created = await seedLargeFolder(popup, LARGE_COUNT, 'Boostmarks large folder');
    await popup.close();

    const page = await openExtensionPage(session.context, session.extensionId, 'manager.html');
    await page.getByRole('navigation', { name: 'Быстрый доступ' }).getByRole('button', { name: created.barTitle }).click();

    const content = page.getByRole('region', { name: 'Содержимое папки' });
    await content.getByRole('button', { name: created.folderTitle, exact: true }).click();

    const list = page.getByRole('list', { name: 'Список' });
    await expect(list.getByRole('link', { name: `${created.folderTitle} 0000` })).toBeVisible();
    await expect(page.getByRole('link', { name: created.lastTitle })).toHaveCount(0);

    const renderedRows = await list.locator('> li').count();
    expect(renderedRows).toBeGreaterThan(0);
    expect(renderedRows).toBeLessThan(120);
    await expect(list.locator('> li').first()).toHaveAttribute('aria-setsize', String(LARGE_COUNT));

    await content.locator('.virtual-scroll').first().evaluate(element => {
      element.scrollTop = element.scrollHeight;
      element.dispatchEvent(new Event('scroll'));
    });
    await expect(page.getByRole('link', { name: created.lastTitle })).toBeVisible();

    await page.getByRole('radio', { name: 'Таблица' }).click();
    const table = page.getByRole('table', { name: 'Содержимое папки' });
    await expect(table).toHaveAttribute('aria-rowcount', String(LARGE_COUNT + 1));
    expect(await table.getByRole('row').count()).toBeLessThan(120);
  } finally {
    await session.close();
  }
});
