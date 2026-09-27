import { describe, expect, it } from 'vitest';
import {
  BOOKMARK_CREATE_FOLDER,
  isCreateFolderRequestMessage,
  isCreateFolderResponseMessage,
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

  it('recognizes a well-formed create-folder request', () => {
    expect(isCreateFolderRequestMessage({ type: BOOKMARK_CREATE_FOLDER, parentId: 'bar', title: 'Работа' })).toBe(true);
    expect(isCreateFolderRequestMessage({ type: BOOKMARK_CREATE_FOLDER, parentId: 'bar' })).toBe(false);
    expect(isCreateFolderRequestMessage({ type: BOOKMARK_CREATE_FOLDER, parentId: 1, title: 'x' })).toBe(false);
    expect(isCreateFolderRequestMessage({ type: PROJECTION_SYNC_REQUEST })).toBe(false);
  });

  it('recognizes both shapes of create-folder response', () => {
    expect(isCreateFolderResponseMessage({ ok: true, id: 'abc' })).toBe(true);
    expect(isCreateFolderResponseMessage({ ok: false, reason: 'invalid-parent' })).toBe(true);
    expect(isCreateFolderResponseMessage({ ok: false, reason: 'nonsense' })).toBe(false);
    expect(isCreateFolderResponseMessage({ ok: true })).toBe(false);
    expect(isCreateFolderResponseMessage(null)).toBe(false);
  });
});
