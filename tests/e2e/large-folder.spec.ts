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
    await content.getByRole('option', { name: created.folderTitle, exact: true }).dblclick();

    const list = page.getByRole('listbox', { name: 'Список' });
    const firstOption = list.getByRole('option', { name: `${created.folderTitle} 0000` });
    await expect(firstOption).toBeVisible();
    await expect(page.getByRole('link', { name: created.lastTitle })).toHaveCount(0);

    const renderedRows = await list.locator('> li').count();
    expect(renderedRows).toBeGreaterThan(0);
    expect(renderedRows).toBeLessThan(120);
    await expect(list.locator('> li').first()).toHaveAttribute('aria-setsize', String(LARGE_COUNT));

    await firstOption.click();
    for (let step = 0; step < 5; step += 1) {
      await page.keyboard.press('ArrowDown');
    }
    const focusedOption = list.getByRole('option', { name: `${created.folderTitle} 0005` });
    await expect(focusedOption).toBeFocused();
    await expect(focusedOption).toHaveAttribute('aria-selected', 'true');

    await content.locator('.virtual-scroll').first().evaluate(element => {
      element.scrollTop = element.scrollHeight;
      element.dispatchEvent(new Event('scroll'));
    });
    await expect(page.getByRole('link', { name: created.lastTitle })).toBeVisible();

    await page.getByRole('radio', { name: 'Таблица' }).click();
    const table = page.getByRole('grid', { name: 'Содержимое папки' });
    await expect(table).toHaveAttribute('aria-rowcount', String(LARGE_COUNT + 1));
    expect(await table.getByRole('row').count()).toBeLessThan(120);
  } finally {
    await session.close();
  }
});
