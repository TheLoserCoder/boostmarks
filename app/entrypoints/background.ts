import { browser } from 'wxt/browser';
import { createProjectionStore } from '../features/bookmarks/adapters/projectionStore';
import { createBrowserBookmarkSource } from '../features/bookmarks/adapters/browserBookmarkSource';
import { createBrowserBookmarkCommands } from '../features/bookmarks/adapters/browserBookmarkCommands';
import { createBookmarkSync } from '../features/bookmarks/application/bookmarkSync';
import {
  PROJECTION_CHANGED,
  isCreateFolderRequestMessage,
  isProjectionSyncRequestMessage,
} from '../features/bookmarks/application/messages';

export default defineBackground(() => {
  const store = createProjectionStore();
  const source = createBrowserBookmarkSource();
  const commands = createBrowserBookmarkCommands(browser.bookmarks);
  const sync = createBookmarkSync({
    source,
    store,
    notify: message => {
      void browser.runtime
        .sendMessage({ type: PROJECTION_CHANGED, reason: message.reason })
        .catch(() => undefined);
    },
  });

  browser.runtime.onMessage.addListener((message: unknown) => {
    if (isProjectionSyncRequestMessage(message)) {
      void sync.hydrate();
      return undefined;
    }
    if (isCreateFolderRequestMessage(message)) {
      return commands.createFolder(message.parentId, message.title);
    }
    return undefined;
  });

  sync.start();
});
