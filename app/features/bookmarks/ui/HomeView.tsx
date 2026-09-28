import React from 'react';
import { Folder, Link } from 'lucide-react';
import { childrenOf, topLevelFolders } from '../domain/path';
import type { BookmarkNode } from '../domain/types';
import { useI18n } from '../../i18n/I18nProvider';

function hostOf(url: string | undefined): string {
  if (url === undefined || url.length === 0) return '';
  try {
    return new URL(url).hostname || url;
  } catch {
    return url;
  }
}

interface HomeViewProps {
  nodes: BookmarkNode[];
  pinnedIds: readonly string[];
  onOpenFolder: (id: string) => void;
}

/**
 * Landing view built only from real projection data: pinned entries and top-level
 * folders. There is no «Недавние» section because bookmark `dateAdded` is not a
 * visit time, and no fake sections that the extension cannot back with data.
 */
export function HomeView({ nodes, pinnedIds, onOpenFolder }: HomeViewProps) {
  const { t, plural } = useI18n();
  const byId = new Map(nodes.map(node => [node.id, node]));
  const pinned: BookmarkNode[] = [];
  const seen = new Set<string>();
  for (const id of pinnedIds) {
    const node = byId.get(id);
    if (node !== undefined && node.kind !== 'separator' && !seen.has(id)) {
      pinned.push(node);
      seen.add(id);
    }
  }
  const folders = topLevelFolders(nodes).filter(folder => !seen.has(folder.id));
  const empty = pinned.length === 0 && folders.length === 0;

  const open = (node: BookmarkNode) => {
    if (node.kind === 'folder') onOpenFolder(node.id);
    else if (node.url !== undefined) window.open(node.url, '_blank', 'noopener');
  };

  const caption = (node: BookmarkNode) =>
    node.kind === 'folder'
      ? plural('home.childCount', childrenOf(nodes, node.id).length)
      : hostOf(node.url);

  const card = (node: BookmarkNode) => (
    <li key={node.id}>
      <button type="button" className="home-card" onClick={() => open(node)}>
        {node.kind === 'folder' ? (
          <Folder className="home-card-icon" size={20} aria-hidden="true" />
        ) : (
          <Link className="home-card-icon" size={20} aria-hidden="true" />
        )}
        <span className="home-card-body">
          <span className="home-card-title">{node.title || node.url || t('item.separator')}</span>
          <span className="home-card-caption">{caption(node)}</span>
        </span>
      </button>
    </li>
  );

  return (
    <section className="home-view" aria-label={t('home.region')}>
      {empty ? (
        <p className="empty">{t('home.empty')}</p>
      ) : (
        <>
          {pinned.length > 0 ? (
            <section className="home-section" aria-labelledby="home-pinned-heading">
              <h2 id="home-pinned-heading">{t('home.pinned')}</h2>
              <ul className="home-cards">{pinned.map(card)}</ul>
            </section>
          ) : null}
          {folders.length > 0 ? (
            <section className="home-section" aria-labelledby="home-folders-heading">
              <h2 id="home-folders-heading">{t('home.folders')}</h2>
              <ul className="home-cards">{folders.map(card)}</ul>
            </section>
          ) : null}
        </>
      )}
    </section>
  );
}
