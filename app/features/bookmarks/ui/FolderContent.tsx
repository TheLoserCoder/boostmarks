import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Folder, Link, Pin, PinOff } from 'lucide-react';
import { IconButton } from '../../../ui/Button';
import { dispatchContextMenu } from '../../../ui/ContextMenu';
import { resolveCreateTarget } from '../domain/createFolder';
import { childrenOf } from '../domain/path';
import type { BookmarkNode } from '../domain/types';
import type { MoveResult } from '../application/ports';
import { ContentContextMenu, type ContextTarget } from './ContentContextMenu';
import { DragItem } from './DragItem';
import { useRowSelection } from './useRowSelection';
import { VirtualList } from './VirtualList';
import { VirtualTable } from './VirtualTable';
import type { ViewMode } from './viewPreference';

interface FolderContentProps {
  nodes: BookmarkNode[];
  folderId: string;
  view: ViewMode;
  pinnedIds: readonly string[];
  onSelect: (id: string) => void;
  onTogglePin: (id: string) => void;
  onRefresh: () => void;
  /** Open the create-folder dialog for a resolved parent folder. */
  onCreateFolderIn: (parentId: string, parentTitle: string) => void;
  onMove: (id: string) => void;
  onDropBefore: (id: string, beforeId: string) => Promise<MoveResult>;
  /** Reports the selection in visual order so a drag that starts on it can move the whole group. */
  onSelectionChange: (ids: readonly string[]) => void;
}

function ItemName({ item }: { item: BookmarkNode }) {
  if (item.kind === 'folder') {
    return (
      <>
        <Folder size={16} aria-hidden="true" />
        <span>{item.title}</span>
      </>
    );
  }
  if (item.kind === 'bookmark') {
    return (
      <a
        className="item-link"
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        tabIndex={-1}
        draggable={false}
        onDragStart={event => event.preventDefault()}
      >
        <Link size={16} aria-hidden="true" />
        <span>{item.title || item.url}</span>
      </a>
    );
  }
  return <hr />;
}

function PinToggle({ item, pinned, onTogglePin }: { item: BookmarkNode; pinned: boolean; onTogglePin: (id: string) => void }) {
  const title = item.title || item.url || '';

  return (
    <IconButton
      size="sm"
      className="pin-toggle"
      aria-label={pinned ? `Открепить «${title}»` : `Закрепить «${title}»`}
      onClick={() => onTogglePin(item.id)}
    >
      {pinned ? <PinOff size={14} aria-hidden="true" /> : <Pin size={14} aria-hidden="true" />}
    </IconButton>
  );
}

const kindLabel = (item: BookmarkNode) =>
  item.kind === 'folder' ? 'Папка' : item.kind === 'bookmark' ? 'Закладка' : 'Разделитель';

const rowLabel = (item: BookmarkNode) => item.title || item.url || '';

export function FolderContent({
  nodes,
  folderId,
  view,
  pinnedIds,
  onSelect,
  onTogglePin,
  onRefresh,
  onCreateFolderIn,
  onMove,
  onDropBefore,
  onSelectionChange,
}: FolderContentProps) {
  const items = useMemo(() => childrenOf(nodes, folderId), [nodes, folderId]);
  const pinned = new Set(pinnedIds);
  const order = useMemo(() => items.map(item => item.id), [items]);
  const sectionRef = useRef<HTMLElement>(null);
  const [dragError, setDragError] = React.useState<string | null>(null);

  const activate = useCallback(
    (id: string) => {
      const item = items.find(entry => entry.id === id);
      if (item === undefined) return;
      if (item.kind === 'folder') {
        onSelect(item.id);
        return;
      }
      if (item.kind === 'bookmark' && item.url !== undefined) window.open(item.url, '_blank', 'noopener');
    },
    [items, onSelect],
  );

  const controller = useRowSelection(order, activate);
  const orderedSelection = useMemo(
    () => items.filter(item => controller.selectedIds.has(item.id)).map(item => item.id),
    [items, controller.selectedIds],
  );

  useEffect(() => {
    onSelectionChange(orderedSelection);
  }, [onSelectionChange, orderedSelection]);
  useEffect(() => () => onSelectionChange([]), [onSelectionChange]);

  const resolveTarget = (element: Element | null): ContextTarget => {
    const rowId = element?.closest('[data-row-id]')?.getAttribute('data-row-id') ?? null;
    const item = rowId === null ? undefined : items.find(entry => entry.id === rowId);
    if (item === undefined) return { kind: 'pane', id: folderId, title: '' };
    if (item.kind === 'folder') return { kind: 'folder', id: item.id, title: rowLabel(item) };
    return { kind: 'bookmark', id: item.id, title: rowLabel(item), url: item.url };
  };

  const createParent = (target: ContextTarget) =>
    resolveCreateTarget(nodes, { clickedId: target.kind === 'pane' ? null : target.id, currentFolderId: folderId });

  const handleCreate = (target: ContextTarget) => {
    const parent = createParent(target);
    if (parent.ok) onCreateFolderIn(parent.parentId, parent.parentTitle);
  };

  const handleRowKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')) {
      event.preventDefault();
      dispatchContextMenu(event.currentTarget as Element);
      return;
    }
    controller.onKeyDown(event);
  };

  const restoreFocus = () => {
    const section = sectionRef.current;
    const focusedId = controller.focusedId;
    if (section === null || focusedId === null) return;
    const element = [...section.querySelectorAll<HTMLElement>('[data-row-id]')].find(
      candidate => candidate.dataset.rowId === focusedId,
    );
    element?.focus();
  };

  const row = (item: BookmarkNode) => (
    <>
      <DragItem item={item}><ItemName item={item} /></DragItem>
      {item.kind !== 'separator' ? (
        <PinToggle item={item} pinned={pinned.has(item.id)} onTogglePin={onTogglePin} />
      ) : null}
    </>
  );

  return (
    <ContentContextMenu
      resolveTarget={resolveTarget}
      canCreate={target => createParent(target).ok}
      canMove={target => nodes.some(node => node.id === target.id && node.unmodifiable === undefined)}
      canMoveToStart={target => target.kind !== 'pane' && items[0]?.id !== target.id &&
        items.some(item => item.id === target.id && item.unmodifiable === undefined)}
      isPinned={target => pinned.has(target.id)}
      onOpenFolder={onSelect}
      onOpenBookmark={url => window.open(url, '_blank', 'noopener')}
      onCreateFolder={handleCreate}
      onMove={target => onMove(target.id)}
      onMoveToStart={target => {
        const first = items[0];
        if (first !== undefined) void onDropBefore(target.id, first.id).then(result => {
          if (!result.ok) setDragError('Не удалось переместить. Обновите закладки и попробуйте ещё раз');
        });
      }}
      onTogglePin={target => onTogglePin(target.id)}
      onRefresh={onRefresh}
      onRestoreFocus={restoreFocus}
    >
      <section className="folder-content" aria-label="Содержимое папки" ref={sectionRef}>
        {dragError !== null ? <p role="alert" className="error">{dragError}</p> : null}
        {items.length === 0 ? (
          <p className="empty-folder">Папка пуста</p>
        ) : view === 'list' ? (
          <VirtualList
            items={items}
            getKey={item => item.id}
            getLabel={rowLabel}
            label="Список"
            controller={controller}
            rowKeyDown={handleRowKeyDown}
            renderItem={item => row(item)}
          />
        ) : view === 'table' ? (
          <VirtualTable
            items={items}
            getKey={item => item.id}
            getLabel={rowLabel}
            label="Содержимое папки"
            controller={controller}
            rowKeyDown={handleRowKeyDown}
            columns={['Название', 'Тип', 'Адрес']}
            renderCells={item => [
              <div role="gridcell" key="name" className="virtual-cell">
                {row(item)}
              </div>,
              <div role="gridcell" key="type" className="virtual-cell">
                {kindLabel(item)}
              </div>,
              <div role="gridcell" key="address" className="virtual-cell">
                {item.url ?? ''}
              </div>,
            ]}
          />
        ) : (
          <ul
            className="content-grid"
            aria-label="Плитка"
            role="listbox"
            aria-multiselectable={true}
            onKeyDown={controller.onKeyDown}
            onMouseDown={controller.onBackgroundMouseDown}
          >
            {items.map(item => (
              <li
                key={item.id}
                role="option"
                aria-selected={controller.selectedIds.has(item.id)}
                aria-label={rowLabel(item)}
                tabIndex={controller.focusedId === item.id ? 0 : -1}
                data-row-id={item.id}
                className={`grid-card grid-${item.kind}`}
                onClick={event => controller.onRowClick(item.id, event)}
                onDoubleClick={event => controller.onRowDoubleClick(item.id, event)}
                onKeyDown={event => {
                  event.stopPropagation();
                  handleRowKeyDown(event);
                }}
              >
                {row(item)}
              </li>
            ))}
            {controller.marquee !== null ? (
              <div
                className="marquee"
                aria-hidden="true"
                style={{
                  height: controller.marquee.height,
                  left: controller.marquee.left,
                  top: controller.marquee.top,
                  width: controller.marquee.width,
                }}
              />
            ) : null}
          </ul>
        )}
      </section>
    </ContentContextMenu>
  );
}
