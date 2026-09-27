import { browser } from 'wxt/browser';
import { createProjectionStore } from '../features/bookmarks/adapters/projectionStore';
import { createBrowserBookmarkSource } from '../features/bookmarks/adapters/browserBookmarkSource';
import { createBookmarkSync } from '../features/bookmarks/application/bookmarkSync';
import {
  PROJECTION_CHANGED,
  isProjectionSyncRequestMessage,
} from '../features/bookmarks/application/messages';

export default defineBackground(() => {
  const store = createProjectionStore();
  const source = createBrowserBookmarkSource();
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
    if (isProjectionSyncRequestMessage(message)) void sync.hydrate();
  });

  sync.start();
});
