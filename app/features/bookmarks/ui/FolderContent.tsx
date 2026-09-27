import React from 'react';
import { childrenOf, folderChain } from '../domain/path';
import type { BookmarkNode } from '../domain/types';

interface FolderContentProps {
  nodes: BookmarkNode[];
  folderId: string;
  onSelect: (id: string) => void;
}

export function FolderContent({ nodes, folderId, onSelect }: FolderContentProps) {
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
      ) : (
        <ul className="content-list">
          {items.map(item => (
            <li key={item.id} className={`content-item content-${item.kind}`}>
              {item.kind === 'folder' ? (
                <button type="button" onClick={() => onSelect(item.id)}>
                  {item.title}
                </button>
              ) : item.kind === 'bookmark' ? (
                <a href={item.url} target="_blank" rel="noopener noreferrer">
                  {item.title || item.url}
                </a>
              ) : (
                <hr />
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
