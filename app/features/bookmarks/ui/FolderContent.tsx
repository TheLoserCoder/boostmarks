import React, { useCallback } from 'react';
import { Folder, Link, Pin, PinOff } from 'lucide-react';
import { IconButton } from '../../../ui/Button';
import { childrenOf } from '../domain/path';
import type { BookmarkNode } from '../domain/types';
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
}

function ItemName({ item, onSelect }: { item: BookmarkNode; onSelect: (id: string) => void }) {
  if (item.kind === 'folder') {
    return (
      <button type="button" className="item-link" tabIndex={-1} onClick={() => onSelect(item.id)}>
        <Folder size={16} aria-hidden="true" />
        <span>{item.title}</span>
      </button>
    );
  }
  if (item.kind === 'bookmark') {
    return (
      <a className="item-link" href={item.url} target="_blank" rel="noopener noreferrer" tabIndex={-1}>
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

export function FolderContent({ nodes, folderId, view, pinnedIds, onSelect, onTogglePin }: FolderContentProps) {
  const items = childrenOf(nodes, folderId);
  const pinned = new Set(pinnedIds);
  const order = items.map(item => item.id);

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

  const row = (item: BookmarkNode) => (
    <>
      <ItemName item={item} onSelect={onSelect} />
      {item.kind !== 'separator' ? (
        <PinToggle item={item} pinned={pinned.has(item.id)} onTogglePin={onTogglePin} />
      ) : null}
    </>
  );

  return (
    <section className="folder-content" aria-label="Содержимое папки">
      {items.length === 0 ? (
        <p className="empty-folder">Папка пуста</p>
      ) : view === 'list' ? (
        <VirtualList
          items={items}
          getKey={item => item.id}
          getLabel={rowLabel}
          label="Список"
          controller={controller}
          renderItem={item => row(item)}
        />
      ) : view === 'table' ? (
        <VirtualTable
          items={items}
          getKey={item => item.id}
          getLabel={rowLabel}
          label="Содержимое папки"
          controller={controller}
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
                controller.onKeyDown(event);
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
  );
}
