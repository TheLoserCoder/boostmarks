import React from 'react';
import { childrenOf, folderChain } from '../domain/path';
import type { BookmarkNode } from '../domain/types';
import type { ViewMode } from './viewPreference';

interface FolderContentProps {
  nodes: BookmarkNode[];
  folderId: string;
  view: ViewMode;
  onSelect: (id: string) => void;
}

function ItemName({ item, onSelect }: { item: BookmarkNode; onSelect: (id: string) => void }) {
  if (item.kind === 'folder') {
    return (
      <button type="button" onClick={() => onSelect(item.id)}>
        {item.title}
      </button>
    );
  }
  if (item.kind === 'bookmark') {
    return (
      <a href={item.url} target="_blank" rel="noopener noreferrer">
        {item.title || item.url}
      </a>
    );
  }
  return <hr />;
}

const kindLabel = (item: BookmarkNode) => (item.kind === 'folder' ? 'Папка' : item.kind === 'bookmark' ? 'Закладка' : 'Разделитель');

export function FolderContent({ nodes, folderId, view, onSelect }: FolderContentProps) {
  const chain = folderChain(nodes, folderId);
  const items = childrenOf(nodes, folderId);

  return (
    <section className="folder-content" aria-label="Содержимое папки">
      <nav aria-label="Путь" className="breadcrumbs">
        <ol>
          {chain.map(folder => (
            <li key={folder.id}>
              <button
                type="button"
                aria-current={folder.id === folderId ? 'page' : undefined}
                onClick={() => onSelect(folder.id)}
              >
                {folder.title}
              </button>
            </li>
          ))}
        </ol>
      </nav>

      {items.length === 0 ? (
        <p className="empty-folder">Папка пуста</p>
      ) : view === 'list' ? (
        <ul className="content-list" aria-label="Список">
          {items.map(item => (
            <li key={item.id} className={`content-item content-${item.kind}`}>
              <ItemName item={item} onSelect={onSelect} />
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
                <td>
                  <ItemName item={item} onSelect={onSelect} />
                </td>
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
              <ItemName item={item} onSelect={onSelect} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
