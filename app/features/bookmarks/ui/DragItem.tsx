import React from 'react';
import { useDndContext, useDraggable, useDroppable } from '@dnd-kit/core';
import { GripVertical } from 'lucide-react';
import type { DropKind } from '../domain/dropTarget';
import type { BookmarkNode } from '../domain/types';
import { useDropRules } from './dropRules';

interface DragItemProps {
  item: BookmarkNode;
  children: React.ReactNode;
}

/** Parses the draggable id back into the bookmark id. */
export function dragSourceId(activeId: string | number | null): string | null {
  if (activeId === null) return null;
  const raw = String(activeId);
  return raw.startsWith('drag:') ? raw.slice('drag:'.length) : null;
}

/** Parses a droppable id like `folder:abc` or `before:abc`. */
export function dropTargetOf(overId: string): { kind: DropKind; targetId: string } {
  const kind: DropKind = overId.startsWith('before:') ? 'before' : 'folder';
  return { kind, targetId: overId.slice(kind === 'before' ? 'before:'.length : 'folder:'.length) };
}

const dropIdFor = (item: BookmarkNode): string =>
  item.kind === 'folder' ? `folder:${item.id}` : `before:${item.id}`;

/**
 * Makes the whole row a drag source while keeping the grip as a visible affordance
 * for tests and assistive technology. Clicking selects as before: the pointer sensor
 * only activates after a short movement, so plain clicks never turn into drags.
 */
export function DragItem({ item, children }: DragItemProps) {
  const { canDrop, idsFor } = useDropRules();
  const { active } = useDndContext();
  const disabled = item.unmodifiable !== undefined;
  const dropKind: DropKind = item.kind === 'folder' ? 'folder' : 'before';
  const dropId = dropIdFor(item);

  const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({
    id: `drag:${item.id}`,
    disabled,
  });
  const { isOver, setNodeRef: setDropRef } = useDroppable({
    id: dropId,
    disabled: item.kind === 'separator' || disabled,
  });

  const activeId = dragSourceId(active?.id ?? null);
  const invalid = isOver && activeId !== null && !canDrop(idsFor(activeId), dropKind, item.id);

  const surface = (
    <span className="drag-surface" ref={setDragRef} data-dragging={isDragging || undefined} {...listeners}>
      <button
        type="button"
        className="drag-handle"
        aria-label={`Перетащить «${item.title || item.url || 'Разделитель'}»`}
        disabled={disabled}
        {...attributes}
        tabIndex={-1}
        onClick={event => event.stopPropagation()}
        onDoubleClick={event => event.stopPropagation()}
      >
        <GripVertical size={15} aria-hidden="true" />
      </button>
      {children}
    </span>
  );

  if (item.kind === 'separator') return surface;

  return (
    <span
      className={item.kind === 'folder' ? 'drop-folder' : 'drop-bookmark'}
      ref={setDropRef}
      data-drop-active={isOver || undefined}
      data-drop-invalid={invalid || undefined}
    >
      {surface}
    </span>
  );
}
