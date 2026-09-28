import React, { useState } from 'react';
import { ExternalLink, FolderOpen, FolderPlus, Pin, PinOff, RefreshCw, FolderInput, ArrowUpToLine } from 'lucide-react';
import { useI18n } from '../../i18n/I18nProvider';
import {
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuRoot,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '../../../ui/ContextMenu';

export interface ContextTarget {
  kind: 'pane' | 'folder' | 'bookmark';
  id: string;
  title: string;
  url?: string;
}

interface ContentContextMenuProps {
  /** Resolves the right-clicked row (or the pane background) into an action target. */
  resolveTarget: (element: Element | null) => ContextTarget;
  canCreate: (target: ContextTarget) => boolean;
  canMove: (target: ContextTarget) => boolean;
  canMoveToStart: (target: ContextTarget) => boolean;
  isPinned: (target: ContextTarget) => boolean;
  onOpenFolder: (id: string) => void;
  onOpenBookmark: (url: string) => void;
  onCreateFolder: (target: ContextTarget) => void;
  onMove: (target: ContextTarget) => void;
  onMoveToStart: (target: ContextTarget) => void;
  onTogglePin: (target: ContextTarget) => void;
  onRefresh: () => void;
  onRestoreFocus: () => void;
  children: React.ReactElement;
}

const emptyTarget: ContextTarget = { kind: 'pane', id: '', title: '' };

export function ContentContextMenu({
  resolveTarget,
  canCreate,
  canMove,
  canMoveToStart,
  isPinned,
  onOpenFolder,
  onOpenBookmark,
  onCreateFolder,
  onMove,
  onMoveToStart,
  onTogglePin,
  onRefresh,
  onRestoreFocus,
  children,
}: ContentContextMenuProps) {
  const { t } = useI18n();
  const [target, setTarget] = useState<ContextTarget>(emptyTarget);
  const createAllowed = canCreate(target);
  const pinned = target.kind === 'pane' ? false : isPinned(target);

  return (
    <ContextMenuRoot>
      <ContextMenuTrigger
        asChild
        onContextMenu={event => {
          setTarget(resolveTarget(event.target as Element | null));
        }}
      >
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent
        label={t('menu.actions')}
        onCloseAutoFocus={event => {
          // Radix would focus the (non-focusable) pane; keep the row that had focus.
          event.preventDefault();
          onRestoreFocus();
        }}
      >
        {target.kind === 'folder' ? (
          <ContextMenuItem icon={<FolderOpen size={16} aria-hidden="true" />} onSelect={() => onOpenFolder(target.id)}>
            {t('menu.open')}
          </ContextMenuItem>
        ) : null}
        {target.kind === 'bookmark' && target.url !== undefined ? (
          <ContextMenuItem
            icon={<ExternalLink size={16} aria-hidden="true" />}
            onSelect={() => onOpenBookmark(target.url!)}
          >
            {t('menu.openTab')}
          </ContextMenuItem>
        ) : null}
        {target.kind !== 'pane' ? <ContextMenuSeparator /> : null}
        <ContextMenuItem
          icon={<FolderPlus size={16} aria-hidden="true" />}
          disabled={!createAllowed}
          onSelect={() => onCreateFolder(target)}
        >
          {target.kind === 'folder' ? t('menu.createIn', { title: target.title }) : t('command.newFolder')}
        </ContextMenuItem>
        {target.kind !== 'pane' ? (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem
              icon={<FolderInput size={16} aria-hidden="true" />}
              disabled={!canMove(target)}
              onSelect={() => onMove(target)}
            >
              {t('menu.move')}
            </ContextMenuItem>
            <ContextMenuItem
              icon={<ArrowUpToLine size={16} aria-hidden="true" />}
              disabled={!canMoveToStart(target)}
              onSelect={() => onMoveToStart(target)}
            >
              {t('menu.moveToStart')}
            </ContextMenuItem>
            <ContextMenuItem
              icon={
                pinned ? <PinOff size={16} aria-hidden="true" /> : <Pin size={16} aria-hidden="true" />
              }
              onSelect={() => onTogglePin(target)}
            >
              {pinned ? t('menu.unpin') : t('menu.pin')}
            </ContextMenuItem>
          </>
        ) : (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem icon={<RefreshCw size={16} aria-hidden="true" />} onSelect={onRefresh}>
              {t('nav.refresh')}
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenuRoot>
  );
}
