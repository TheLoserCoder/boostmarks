import React from 'react';
import { Folder, FolderOpen, Link, PinOff } from 'lucide-react';
import { quickLinks } from '../domain/path';
import type { BookmarkNode } from '../domain/types';

interface QuickLinksProps {
  nodes: BookmarkNode[];
  pinnedIds: readonly string[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onTogglePin: (id: string) => void;
}

function UnpinButton({ title, id, onTogglePin }: { title: string; id: string; onTogglePin: (id: string) => void }) {
  return (
    <button type="button" className="icon-button" aria-label={`Открепить «${title}»`} onClick={() => onTogglePin(id)}>
      <PinOff size={14} aria-hidden="true" />
    </button>
  );
}

export function QuickLinks({ nodes, pinnedIds, selectedId, onSelect, onTogglePin }: QuickLinksProps) {
  const links = quickLinks(nodes, pinnedIds);
  const pinned = new Set(pinnedIds);

  return (
    <nav aria-label="Быстрый доступ" className="quick-links">
      <ul>
        {links.map(node => {
          const title = node.title || node.url || 'Корень';
          const selected = node.kind === 'folder' && node.id === selectedId;

          return (
            <li key={node.id}>
              {node.kind === 'folder' ? (
                <button
                  type="button"
                  className="quick-link"
                  aria-current={selected ? 'page' : undefined}
                  onClick={() => onSelect(node.id)}
                >
                  {selected ? <FolderOpen size={16} aria-hidden="true" /> : <Folder size={16} aria-hidden="true" />}
                  <span>{title}</span>
                </button>
              ) : (
                <a className="quick-link" href={node.url} target="_blank" rel="noopener noreferrer">
                  <Link size={16} aria-hidden="true" />
                  <span>{title}</span>
                </a>
              )}
              {pinned.has(node.id) ? <UnpinButton title={title} id={node.id} onTogglePin={onTogglePin} /> : null}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
