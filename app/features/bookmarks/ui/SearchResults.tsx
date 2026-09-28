import React from 'react';
import { Folder, Link } from 'lucide-react';
import { formatFolderPath } from '../domain/path';
import type { BookmarkNode } from '../domain/types';
import { useI18n } from '../../i18n/I18nProvider';
import { VirtualList } from './VirtualList';

interface SearchResultsProps {
  nodes: BookmarkNode[];
  results: BookmarkNode[];
  onOpenFolder: (id: string) => void;
}

export function SearchResults({ nodes, results, onOpenFolder }: SearchResultsProps) {
  const { t } = useI18n();

  return (
    <section className="search-results" aria-label={t('search.results')}>
      {results.length === 0 ? (
        <p className="empty">{t('search.nothing')}</p>
      ) : (
        <VirtualList
          items={results}
          getKey={node => node.id}
          label={t('search.resultList')}
          renderItem={node => {
            const location = node.parentId === null ? '' : formatFolderPath(nodes, node.parentId);
            const title = node.title || node.url || '';

            return (
              <>
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
              </>
            );
          }}
        />
      )}
    </section>
  );
}
