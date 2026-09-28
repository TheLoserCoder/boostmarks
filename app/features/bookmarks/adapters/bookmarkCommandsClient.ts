import { BOOKMARK_CREATE_FOLDER, BOOKMARK_MOVE, BOOKMARK_MOVE_BEFORE, isCreateFolderResponseMessage, isMoveResponseMessage } from '../application/messages';
import type { BookmarkCommands, CreateFolderResult, MoveResult } from '../application/ports';

export type SendMessage = (message: unknown) => Promise<unknown>;

const FAILED: CreateFolderResult = { ok: false, reason: 'failed' };
const MOVE_FAILED: MoveResult = { ok: false, reason: 'failed' };

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
    async move(id: string, parentId: string): Promise<MoveResult> {
      try {
        const response = await sendMessage({ type: BOOKMARK_MOVE, id, parentId });
        return isMoveResponseMessage(response) ? response : MOVE_FAILED;
      } catch {
        return MOVE_FAILED;
      }
    },
    async moveBefore(id: string, beforeId: string): Promise<MoveResult> {
      try {
        const response = await sendMessage({ type: BOOKMARK_MOVE_BEFORE, id, beforeId });
        return isMoveResponseMessage(response) ? response : MOVE_FAILED;
      } catch {
        return MOVE_FAILED;
      }
    },
  };
}
