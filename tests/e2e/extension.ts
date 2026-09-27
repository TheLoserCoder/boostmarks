import { chromium, type BrowserContext, type Page } from '@playwright/test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

export interface ExtensionSession {
  context: BrowserContext;
  extensionId: string;
  close(): Promise<void>;
}

export async function launchExtension(): Promise<ExtensionSession> {
  const profile = await mkdtemp(join(tmpdir(), 'boostmarks-chromium-'));
  const extension = resolve('.output/chrome-mv3');
  const context = await chromium.launchPersistentContext(profile, {
    channel: 'chromium',
    headless: true,
    args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`],
  });

  const worker = context.serviceWorkers()[0] ?? (await context.waitForEvent('serviceworker'));

  return {
    context,
    extensionId: new URL(worker.url()).host,
    async close() {
      await context.close();
      await rm(profile, { recursive: true, force: true });
    },
  };
}

export async function openExtensionPage(context: BrowserContext, extensionId: string, path: string): Promise<Page> {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/${path}`);
  return page;
}

export interface CreatedBookmarks {
  barTitle: string;
  folderId: string;
  folderTitle: string;
  bookmarkId: string;
  bookmarkTitle: string;
}

interface ChromeBookmarkTreeNode {
  id: string;
  title: string;
  url?: string;
  children?: ChromeBookmarkTreeNode[];
}

interface ChromeBookmarksApi {
  bookmarks: {
    getTree(): Promise<ChromeBookmarkTreeNode[]>;
    search(query: string): Promise<ChromeBookmarkTreeNode[]>;
    create(details: { parentId: string; title: string; url?: string }): Promise<ChromeBookmarkTreeNode>;
    update(id: string, changes: { title?: string }): Promise<unknown>;
    removeTree(id: string): Promise<void>;
  };
}

type ChromeGlobal = { chrome: ChromeBookmarksApi };

export async function seedBookmarkPair(page: Page): Promise<CreatedBookmarks> {  const { barTitle, folderId, folderTitle, bookmarkId, bookmarkTitle } = await page.evaluate(async () => {
    const { bookmarks } = (globalThis as unknown as ChromeGlobal).chrome;
    const [root] = await bookmarks.getTree();
    const bar = root?.children?.[0];
    if (!bar) throw new Error('Bookmarks bar not found');
    const folder = await bookmarks.create({ parentId: bar.id, title: 'Boostmarks E2E folder' });
    const bookmark = await bookmarks.create({
      parentId: folder.id,
      title: 'Boostmarks E2E bookmark',
      url: 'https://example.com/e2e',
    });
    return {
      barTitle: bar.title,
      folderId: folder.id,
      folderTitle: folder.title,
      bookmarkId: bookmark.id,
      bookmarkTitle: bookmark.title,
    };
  });
  return { barTitle, folderId, folderTitle, bookmarkId, bookmarkTitle };
}

export async function renameBookmark(page: Page, id: string, title: string) {
  await page.evaluate(
    ({ id, title }) => (globalThis as unknown as ChromeGlobal).chrome.bookmarks.update(id, { title }),
    { id, title },
  );
}

export async function removeFolderTree(page: Page, id: string) {
  await page.evaluate(id => (globalThis as unknown as ChromeGlobal).chrome.bookmarks.removeTree(id), id);
}

/** Confirms a folder really exists in the native browser tree, not just in the projection. */
export async function countNativeFoldersByTitle(page: Page, title: string): Promise<number> {
  return page.evaluate(
    title =>
      (globalThis as unknown as ChromeGlobal).chrome.bookmarks
        .search(title)
        .then(nodes => nodes.filter(node => node.title === title && node.url === undefined).length),
    title,
  );
}

export interface SeededLargeFolder {
  barTitle: string;
  folderTitle: string;
  count: number;
  lastTitle: string;
}

export async function seedLargeFolder(page: Page, count: number, folderTitle: string): Promise<SeededLargeFolder> {
  return page.evaluate(
    async ({ count: total, folderTitle: title }) => {
      const { bookmarks } = (globalThis as unknown as ChromeGlobal).chrome;
      const [root] = await bookmarks.getTree();
      const bar = root?.children?.[0];
      if (!bar) throw new Error('Bookmarks bar not found');
      const folder = await bookmarks.create({ parentId: bar.id, title });
      const batchSize = 25;
      for (let start = 0; start < total; start += batchSize) {
        const batch = Array.from({ length: Math.min(batchSize, total - start) }, (_, offset) => start + offset);
        await Promise.all(
          batch.map(index =>
            bookmarks.create({
              parentId: folder.id,
              title: `${title} ${String(index).padStart(4, '0')}`,
              url: `https://example.com/large/${index}`,
            }),
          ),
        );
      }
      return {
        barTitle: bar.title,
        folderTitle: folder.title,
        count: total,
        lastTitle: `${title} ${String(total - 1).padStart(4, '0')}`,
      };
    },
    { count, folderTitle },
  );
}
