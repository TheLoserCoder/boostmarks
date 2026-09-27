import React, { useState } from 'react';
import { ExternalLink, FolderOpen, FolderPlus, Pin, PinOff, RefreshCw } from 'lucide-react';
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
  isPinned: (target: ContextTarget) => boolean;
  onOpenFolder: (id: string) => void;
  onOpenBookmark: (url: string) => void;
  onCreateFolder: (target: ContextTarget) => void;
  onTogglePin: (target: ContextTarget) => void;
  onRefresh: () => void;
  onRestoreFocus: () => void;
  children: React.ReactElement;
}

const emptyTarget: ContextTarget = { kind: 'pane', id: '', title: '' };

export function ContentContextMenu({
  resolveTarget,
  canCreate,
  isPinned,
  onOpenFolder,
  onOpenBookmark,
  onCreateFolder,
  onTogglePin,
  onRefresh,
  onRestoreFocus,
  children,
}: ContentContextMenuProps) {
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
        label="Действия"
        onCloseAutoFocus={event => {
          // Radix would focus the (non-focusable) pane; keep the row that had focus.
          event.preventDefault();
          onRestoreFocus();
        }}
      >
        {target.kind === 'folder' ? (
          <ContextMenuItem icon={<FolderOpen size={16} aria-hidden="true" />} onSelect={() => onOpenFolder(target.id)}>
            Открыть
          </ContextMenuItem>
        ) : null}
        {target.kind === 'bookmark' && target.url !== undefined ? (
          <ContextMenuItem
            icon={<ExternalLink size={16} aria-hidden="true" />}
            onSelect={() => onOpenBookmark(target.url!)}
          >
            Открыть в новой вкладке
          </ContextMenuItem>
        ) : null}
        {target.kind !== 'pane' ? <ContextMenuSeparator /> : null}
        <ContextMenuItem
          icon={<FolderPlus size={16} aria-hidden="true" />}
          disabled={!createAllowed}
          onSelect={() => onCreateFolder(target)}
        >
          {target.kind === 'folder' ? `Создать папку в «${target.title}»` : 'Новая папка'}
        </ContextMenuItem>
        {target.kind !== 'pane' ? (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem
              icon={
                pinned ? <PinOff size={16} aria-hidden="true" /> : <Pin size={16} aria-hidden="true" />
              }
              onSelect={() => onTogglePin(target)}
            >
              {pinned ? 'Убрать из быстрого доступа' : 'Закрепить в быстром доступе'}
            </ContextMenuItem>
          </>
        ) : (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem icon={<RefreshCw size={16} aria-hidden="true" />} onSelect={onRefresh}>
              Обновить
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenuRoot>
  );
}
