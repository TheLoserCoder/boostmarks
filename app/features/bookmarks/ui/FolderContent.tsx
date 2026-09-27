import React from 'react';
import { Folder, Link, Pin, PinOff } from 'lucide-react';
import { childrenOf } from '../domain/path';
import type { BookmarkNode } from '../domain/types';
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
      <button type="button" className="item-link" onClick={() => onSelect(item.id)}>
        <Folder size={16} aria-hidden="true" />
        <span>{item.title}</span>
      </button>
    );
  }
  if (item.kind === 'bookmark') {
    return (
      <a className="item-link" href={item.url} target="_blank" rel="noopener noreferrer">
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
    <button
      type="button"
      className="icon-button pin-toggle"
      aria-label={pinned ? `Открепить «${title}»` : `Закрепить «${title}»`}
      onClick={() => onTogglePin(item.id)}
    >
      {pinned ? <PinOff size={14} aria-hidden="true" /> : <Pin size={14} aria-hidden="true" />}
    </button>
  );
}

const kindLabel = (item: BookmarkNode) =>
  item.kind === 'folder' ? 'Папка' : item.kind === 'bookmark' ? 'Закладка' : 'Разделитель';

export function FolderContent({ nodes, folderId, view, pinnedIds, onSelect, onTogglePin }: FolderContentProps) {
  const items = childrenOf(nodes, folderId);
  const pinned = new Set(pinnedIds);

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
        <ul className="content-list" aria-label="Список">
          {items.map(item => (
            <li key={item.id} className={`content-item content-${item.kind}`}>
              {row(item)}
            </li>
          ))}
        </ul>
      ) : view === 'table' ? (
        <table className="content-table" aria-label="Содержимое папки">
          <thead>
            <tr>
              <th scope="col">Название</th>
              <th scope="col">Тип</th>
              <th scope="col">Адрес</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id}>
                <td className="content-name">{row(item)}</td>
                <td>{kindLabel(item)}</td>
                <td className="content-address">{item.url ?? ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <ul className="content-grid" aria-label="Плитка">
          {items.map(item => (
            <li key={item.id} className={`grid-card grid-${item.kind}`}>
              {row(item)}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
