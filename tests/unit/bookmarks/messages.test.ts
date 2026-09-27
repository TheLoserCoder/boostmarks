import { describe, expect, it } from 'vitest';
import {
  isProjectionChangedMessage,
  isProjectionSyncRequestMessage,
  PROJECTION_CHANGED,
  PROJECTION_SYNC_REQUEST,
} from '../../../app/features/bookmarks/application/messages';

describe('projection message guards', () => {
  it('accepts a well-formed projection-changed notification', () => {
    expect(isProjectionChangedMessage({ type: PROJECTION_CHANGED, reason: 'created' })).toBe(true);
  });

  it('rejects unknown reasons and malformed notifications', () => {
    expect(isProjectionChangedMessage({ type: PROJECTION_CHANGED, reason: 'nonsense' })).toBe(false);
    expect(isProjectionChangedMessage({ type: PROJECTION_CHANGED })).toBe(false);
    expect(isProjectionChangedMessage('hello')).toBe(false);
    expect(isProjectionChangedMessage(undefined)).toBe(false);
  });

  it('recognizes the sync request and rejects other messages', () => {
    expect(isProjectionSyncRequestMessage({ type: PROJECTION_SYNC_REQUEST })).toBe(true);
    expect(isProjectionSyncRequestMessage({ type: PROJECTION_CHANGED })).toBe(false);
  });
});
