import type { ChangeInfo, MoveInfo } from '../domain/reconcile';
import type { BookmarkNode, RawTreeNode } from '../domain/types';

export type { ChangeInfo, MoveInfo };

/** Browser bookmark events the synchronizer depends on; implemented by the browser adapter. */
export interface BookmarkSource {
  getTree(): Promise<RawTreeNode[]>;
  onCreated(listener: (node: RawTreeNode) => void): void;
  onChanged(listener: (id: string, change: ChangeInfo) => void): void;
  onMoved(listener: (id: string, move: MoveInfo) => void): void;
  onRemoved(listener: (id: string) => void): void;
  onChildrenReordered(listener: (id: string, childIds: string[]) => void): void;
  onImportEnded(listener: () => void): void;
}

export type SyncReason = 'hydrated' | 'created' | 'changed' | 'moved' | 'removed' | 'reordered' | 'resynced';

export interface SyncNotification {
  reason: SyncReason;
}

/** Page-side view of the projection store plus background notifications. */
export interface ProjectionClient {
  read(): Promise<BookmarkNode[]>;
  readFreshness(): Promise<number | undefined>;
  requestSync(): void;
  subscribe(listener: () => void): () => void;
}

export type CreateFolderFailureReason = 'invalid-title' | 'invalid-parent' | 'failed';

export type CreateFolderResult = { ok: true; id: string } | { ok: false; reason: CreateFolderFailureReason };

/**
 * Native bookmark mutations. Creating goes through the browser API so the native
 * tree stays the single source of truth; the projection follows via its own events.
 */
export interface BookmarkCommands {
  createFolder(parentId: string, title: string): Promise<CreateFolderResult>;
}
