import React from 'react';
import { useDndContext, useDroppable } from '@dnd-kit/core';
import { Folder, FolderOpen, Home, Link, PinOff } from 'lucide-react';
import { IconButton } from '../../../ui/Button';
import { useI18n } from '../../i18n/I18nProvider';
import { quickLinks } from '../domain/path';
import type { BookmarkNode } from '../domain/types';
import { dragSourceId } from './DragItem';
import { useDropRules } from './dropRules';

interface QuickLinksProps {
  nodes: BookmarkNode[];
  pinnedIds: readonly string[];
  selectedId: string | null;
  homeActive: boolean;
  onSelect: (id: string) => void;
  onGoHome: () => void;
  onTogglePin: (id: string) => void;
}

function UnpinButton({ title, id, onTogglePin }: { title: string; id: string; onTogglePin: (id: string) => void }) {
  const { t } = useI18n();

  return (
    <IconButton size="sm" aria-label={t('item.unpin', { title })} onClick={() => onTogglePin(id)}>
      <PinOff size={14} aria-hidden="true" />
    </IconButton>
  );
}

function FolderLink({ node, selected, onSelect }: {
  node: BookmarkNode;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  const { t } = useI18n();
  const { canDrop, idsFor } = useDropRules();
  const { active } = useDndContext();
  const { setNodeRef, isOver } = useDroppable({
    id: `folder:${node.id}`,
    disabled: node.unmodifiable !== undefined,
  });
  const activeId = dragSourceId(active?.id ?? null);
  const invalid = isOver && activeId !== null && !canDrop(idsFor(activeId), 'folder', node.id);

  return (
    <button
      ref={setNodeRef}
      type="button"
      className="quick-link"
      data-drop-active={isOver || undefined}
      data-drop-invalid={invalid || undefined}
      aria-current={selected ? 'page' : undefined}
      onClick={() => onSelect(node.id)}
    >
      {selected ? <FolderOpen size={16} aria-hidden="true" /> : <Folder size={16} aria-hidden="true" />}
      <span>{node.title || t('quick.root')}</span>
    </button>
  );
}

export function QuickLinks({ nodes, pinnedIds, selectedId, homeActive, onSelect, onGoHome, onTogglePin }: QuickLinksProps) {
  const { t } = useI18n();
  const links = quickLinks(nodes, pinnedIds);
  const pinned = new Set(pinnedIds);

  return (
    <nav aria-label={t('quick.access')} className="quick-links">
      <ul>
        <li>
          <button
            type="button"
            className="quick-link"
            aria-current={homeActive ? 'page' : undefined}
            onClick={onGoHome}
          >
            <Home size={16} aria-hidden="true" />
            <span>{t('quick.home')}</span>
          </button>
        </li>
        {links.map(node => {
          const title = node.title || node.url || t('quick.root');
          const selected = node.kind === 'folder' && node.id === selectedId;

          return (
            <li key={node.id}>
              {node.kind === 'folder' ? (
                <FolderLink node={node} selected={selected} onSelect={onSelect} />
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
