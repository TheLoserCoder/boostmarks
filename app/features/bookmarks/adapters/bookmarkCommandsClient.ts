import { BOOKMARK_CREATE_FOLDER, isCreateFolderResponseMessage } from '../application/messages';
import type { BookmarkCommands, CreateFolderResult } from '../application/ports';

export type SendMessage = (message: unknown) => Promise<unknown>;

const FAILED: CreateFolderResult = { ok: false, reason: 'failed' };

/** Page-side command client: forwards mutations to the background service worker. */
export function createBookmarkCommandsClient(sendMessage: SendMessage): BookmarkCommands {
  return {
    async createFolder(parentId: string, title: string): Promise<CreateFolderResult> {
      try {
        const response = await sendMessage({ type: BOOKMARK_CREATE_FOLDER, parentId, title });
        return isCreateFolderResponseMessage(response) ? response : FAILED;
      } catch {
        return FAILED;
      }
    },
  };
}
