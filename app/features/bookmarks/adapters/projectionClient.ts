import { browser } from 'wxt/browser';
import { PROJECTION_SYNC_REQUEST, isProjectionChangedMessage } from '../application/messages';
import type { ProjectionClient } from '../application/ports';
import { createProjectionStore } from './projectionStore';

const LAST_HYDRATED_AT = 'lastHydratedAt';

export function createProjectionClient(): ProjectionClient {
  const store = createProjectionStore();

  return {
    read: () => store.readAll(),
    readFreshness: () => store.readMeta<number>(LAST_HYDRATED_AT),
    requestSync: () => {
      void browser.runtime.sendMessage({ type: PROJECTION_SYNC_REQUEST }).catch(() => undefined);
    },
    subscribe: listener => {
      const handler = (message: unknown) => {
        if (isProjectionChangedMessage(message)) listener();
      };
      browser.runtime.onMessage.addListener(handler);
      return () => browser.runtime.onMessage.removeListener(handler);
    },
  };
}
