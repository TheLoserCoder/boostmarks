import { browser } from 'wxt/browser';
import type { BookmarkSource } from '../application/ports';

export function createBrowserBookmarkSource(): BookmarkSource {
  return {
    getTree: () => browser.bookmarks.getTree(),
    onCreated: listener =>
      browser.bookmarks.onCreated.addListener((_id, node) => listener(node)),
    onChanged: listener => browser.bookmarks.onChanged.addListener(listener),
    onMoved: listener => browser.bookmarks.onMoved.addListener(listener),
    onRemoved: listener => browser.bookmarks.onRemoved.addListener(listener),
    onChildrenReordered: listener =>
      browser.bookmarks.onChildrenReordered.addListener((id, reorderInfo) => listener(id, reorderInfo.childIds)),
    onImportEnded: listener => browser.bookmarks.onImportEnded.addListener(listener),
  };
}
