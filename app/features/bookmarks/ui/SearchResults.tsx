import React from 'react';
import { Folder, Link } from 'lucide-react';
import { formatFolderPath } from '../domain/path';
import type { BookmarkNode } from '../domain/types';

interface SearchResultsProps {
  nodes: BookmarkNode[];
  results: BookmarkNode[];
  onOpenFolder: (id: string) => void;
}

export function SearchResults({ nodes, results, onOpenFolder }: SearchResultsProps) {
  return (
    <section className="search-results" aria-label="Результаты поиска">
      {results.length === 0 ? (
        <p className="empty">Ничего не найдено</p>
      ) : (
        <ul className="content-list" aria-label="Найденные закладки">
          {results.map(node => {
            const location = node.parentId === null ? '' : formatFolderPath(nodes, node.parentId);
            const title = node.title || node.url || '';

            return (
              <li key={node.id} className={`content-item result-${node.kind}`}>
                {node.kind === 'folder' ? (
                  <button type="button" className="item-link" onClick={() => onOpenFolder(node.id)}>
                    <Folder size={16} aria-hidden="true" />
                    <span>{title}</span>
                  </button>
                ) : (
                  <a className="item-link" href={node.url} target="_blank" rel="noopener noreferrer">
                    <Link size={16} aria-hidden="true" />
                    <span>{title}</span>
                  </a>
                )}
                {location !== '' ? <span className="result-location">{location}</span> : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
