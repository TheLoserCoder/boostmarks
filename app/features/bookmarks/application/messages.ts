import type { SyncReason } from './ports';

export const PROJECTION_CHANGED = 'boostmarks:projection-changed';
export const PROJECTION_SYNC_REQUEST = 'boostmarks:projection-sync-request';
export const BOOKMARK_CREATE_FOLDER = 'boostmarks:create-folder';

export interface ProjectionChangedMessage {
  type: typeof PROJECTION_CHANGED;
  reason: SyncReason;
}

export interface ProjectionSyncRequestMessage {
  type: typeof PROJECTION_SYNC_REQUEST;
}

export interface CreateFolderRequestMessage {
  type: typeof BOOKMARK_CREATE_FOLDER;
  parentId: string;
  title: string;
}

export type CreateFolderFailureReason = 'invalid-title' | 'invalid-parent' | 'failed';

export type CreateFolderResponseMessage =
  | { ok: true; id: string }
  | { ok: false; reason: CreateFolderFailureReason };

const REASONS: readonly SyncReason[] = ['hydrated', 'created', 'changed', 'moved', 'removed', 'reordered', 'resynced'];

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : undefined;
}

export function isProjectionChangedMessage(value: unknown): value is ProjectionChangedMessage {
  const message = asRecord(value);
  if (message === undefined || message.type !== PROJECTION_CHANGED) return false;
  return typeof message.reason === 'string' && (REASONS as readonly string[]).includes(message.reason);
}

export function isProjectionSyncRequestMessage(value: unknown): value is ProjectionSyncRequestMessage {
  return asRecord(value)?.type === PROJECTION_SYNC_REQUEST;
}

export function isCreateFolderRequestMessage(value: unknown): value is CreateFolderRequestMessage {
  const message = asRecord(value);
  if (message === undefined || message.type !== BOOKMARK_CREATE_FOLDER) return false;
  return typeof message.parentId === 'string' && typeof message.title === 'string';
}

const FAILURE_REASONS: readonly CreateFolderFailureReason[] = ['invalid-title', 'invalid-parent', 'failed'];

export function isCreateFolderResponseMessage(value: unknown): value is CreateFolderResponseMessage {
  const message = asRecord(value);
  if (message === undefined) return false;
  if (message.ok === true) return typeof message.id === 'string';
  if (message.ok !== false) return false;
  return typeof message.reason === 'string' && (FAILURE_REASONS as readonly string[]).includes(message.reason);
}
