import type { SyncReason } from './ports';

export const PROJECTION_CHANGED = 'boostmarks:projection-changed';
export const PROJECTION_SYNC_REQUEST = 'boostmarks:projection-sync-request';

export interface ProjectionChangedMessage {
  type: typeof PROJECTION_CHANGED;
  reason: SyncReason;
}

export interface ProjectionSyncRequestMessage {
  type: typeof PROJECTION_SYNC_REQUEST;
}

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
