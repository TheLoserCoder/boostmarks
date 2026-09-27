import { expect, test } from '@playwright/test';
import { countNativeFoldersByTitle, launchExtension, openExtensionPage, seedBookmarkPair } from './extension';

test('creates native folders from the context menu and the toolbar', async () => {
  const session = await launchExtension();
  try {
    const page = await openExtensionPage(session.context, session.extensionId, 'manager.html');
    const created = await seedBookmarkPair(page);
    const quickAccess = page.getByRole('navigation', { name: 'Быстрый доступ' });
    const content = page.getByRole('region', { name: 'Содержимое папки' });
    const path = page.getByRole('navigation', { name: 'Путь' });
    const dialog = page.getByRole('dialog');
    const toolbarNewFolder = page.getByRole('button', { name: 'Новая папка' });

    await quickAccess.getByRole('button', { name: created.barTitle }).click();
    const folderRow = content.getByRole('option', { name: created.folderTitle });
    await expect(folderRow).toBeVisible();

    // Keyboard-accessible context menu on the folder row creates inside that folder.
    await folderRow.click();
    await page.keyboard.press('Shift+F10');
    await expect(page.getByRole('menu', { name: 'Действия' })).toBeVisible();
    await page.getByRole('menuitem', { name: `Создать папку в «${created.folderTitle}»` }).click();

    await expect(dialog).toBeVisible();
    await dialog.getByLabel('Имя папки').fill('Вложенная папка');
    await dialog.getByRole('button', { name: 'Создать' }).click();

    // The projection follows the native tree and the new folder is revealed.
    await expect(content.getByText('Папка пуста')).toBeVisible();
    await expect(path).toContainText('Вложенная папка');
    expect(await countNativeFoldersByTitle(page, 'Вложенная папка')).toBe(1);

    // Going back shows the created folder as a sibling in the parent.
    await path.getByRole('button', { name: created.folderTitle }).click();
    await expect(content.getByRole('option', { name: 'Вложенная папка' })).toBeVisible();

    // The toolbar action creates in the folder currently open; clearing the
    // "open after" checkbox keeps us in that folder so the new row is visible.
    await toolbarNewFolder.click();
    await dialog.getByLabel('Имя папки').fill('Сверху');
    await dialog.getByRole('checkbox', { name: 'Открыть новую папку' }).click();
    await dialog.getByRole('button', { name: 'Создать' }).click();
    await expect(content.getByRole('option', { name: 'Сверху' })).toBeVisible();
    expect(await countNativeFoldersByTitle(page, 'Сверху')).toBe(1);

    // A duplicate sibling name is refused with an explanation and the dialog stays open.
    await toolbarNewFolder.click();
    await dialog.getByLabel('Имя папки').fill('сверху');
    await dialog.getByRole('button', { name: 'Создать' }).click();
    await expect(dialog.getByRole('alert')).toContainText('уже есть');
    expect(await countNativeFoldersByTitle(page, 'Сверху')).toBe(1);
    await dialog.getByRole('button', { name: 'Отмена' }).click();
    await expect(dialog).toBeHidden();

    // Right-clicking the empty space below the rows offers creation too.
    await content.locator('.virtual-scroll').click({ button: 'right', position: { x: 40, y: 300 } });
    await expect(page.getByRole('menuitem', { name: 'Новая папка' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('menuitem', { name: 'Новая папка' })).toBeHidden();
  } finally {
    await session.close();
  }
});
