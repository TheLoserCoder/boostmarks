import React from 'react';
import { Folder, Link } from 'lucide-react';
import { childrenOf, topLevelFolders } from '../domain/path';
import type { BookmarkNode } from '../domain/types';

/** Russian plural for «элемент» so card captions read naturally at any count. */
export function formatItemCount(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  const word =
    mod10 === 1 && mod100 !== 11
      ? 'элемент'
      : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)
        ? 'элемента'
        : 'элементов';
  return `${count} ${word}`;
}

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
    node.kind === 'folder' ? formatItemCount(childrenOf(nodes, node.id).length) : hostOf(node.url);

  const card = (node: BookmarkNode) => (
    <li key={node.id}>
      <button type="button" className="home-card" onClick={() => open(node)}>
        {node.kind === 'folder' ? (
          <Folder className="home-card-icon" size={20} aria-hidden="true" />
        ) : (
          <Link className="home-card-icon" size={20} aria-hidden="true" />
        )}
        <span className="home-card-body">
          <span className="home-card-title">{node.title || node.url || 'Разделитель'}</span>
          <span className="home-card-caption">{caption(node)}</span>
        </span>
      </button>
    </li>
  );

  return (
    <section className="home-view" aria-label="Главная">
      {empty ? (
        <p className="empty">Папок пока нет. Создайте их в браузере или закрепите закладку в боковой панели.</p>
      ) : (
        <>
          {pinned.length > 0 ? (
            <section className="home-section" aria-labelledby="home-pinned-heading">
              <h2 id="home-pinned-heading">Закреплённые</h2>
              <ul className="home-cards">{pinned.map(card)}</ul>
            </section>
          ) : null}
          {folders.length > 0 ? (
            <section className="home-section" aria-labelledby="home-folders-heading">
              <h2 id="home-folders-heading">Папки</h2>
              <ul className="home-cards">{folders.map(card)}</ul>
            </section>
          ) : null}
        </>
      )}
    </section>
  );
}
