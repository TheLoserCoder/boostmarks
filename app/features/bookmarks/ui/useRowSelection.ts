import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  clearSelectionIds,
  emptySelection,
  idsInRect,
  moveFocus,
  rectFromPoints,
  selectAll,
  selectRange,
  selectSingle,
  toggleSelection,
  type Rect,
  type SelectionState,
} from '../domain/selection';

export interface MarqueeVisual {
  height: number;
  left: number;
  top: number;
  width: number;
}

export interface RowSelectionController {
  selectedIds: ReadonlySet<string>;
  focusedId: string | null;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  marquee: MarqueeVisual | null;
  onRowClick: (id: string, event: React.MouseEvent) => void;
  onRowDoubleClick: (id: string, event: React.MouseEvent) => void;
  onKeyDown: (event: React.KeyboardEvent) => void;
  onBackgroundMouseDown: (event: React.MouseEvent) => void;
}

function toRect(domRect: DOMRect): Rect {
  return { left: domRect.left, top: domRect.top, right: domRect.right, bottom: domRect.bottom };
}

interface MarqueeOrigin {
  originX: number;
  originY: number;
  additive: boolean;
  base: ReadonlySet<string>;
  anchorId: string | null;
  focusId: string | null;
}

/**
 * Windows Explorer-like row selection: click selects, ctrl toggles, shift extends,
 * arrows/Home/End move the roving focus, ctrl+A selects all, Escape clears, Enter activates,
 * and dragging on the empty pane background draws a selection marquee over visible rows.
 */
export function useRowSelection(order: readonly string[], onActivate: (id: string) => void): RowSelectionController {
  const [state, setState] = useState<SelectionState>(emptySelection);
  const [marquee, setMarquee] = useState<MarqueeVisual | null>(null);
  const [dragging, setDragging] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const origin = useRef<MarqueeOrigin | null>(null);

  const onRowClick = useCallback(
    (id: string, event: React.MouseEvent) => {
      if (event.button !== 0) return;
      event.preventDefault();
      (event.currentTarget as HTMLElement).focus();
      setState(current => {
        if (event.ctrlKey || event.metaKey) return toggleSelection(current, id);
        if (event.shiftKey) return selectRange(order, current.anchorId, id);
        return selectSingle(id);
      });
    },
    [order],
  );

  const onRowDoubleClick = useCallback(
    (id: string, event: React.MouseEvent) => {
      event.preventDefault();
      onActivate(id);
    },
    [onActivate],
  );

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a') {
        event.preventDefault();
        setState(selectAll(order));
        return;
      }
      switch (event.key) {
        case 'Escape':
          event.preventDefault();
          setState(clearSelectionIds);
          return;
        case 'ArrowDown':
          event.preventDefault();
          setState(current => moveFocus(current, order, 1, event.shiftKey));
          return;
        case 'ArrowUp':
          event.preventDefault();
          setState(current => moveFocus(current, order, -1, event.shiftKey));
          return;
        case 'Home':
          event.preventDefault();
          setState(current => moveFocus(current, order, 'first', event.shiftKey));
          return;
        case 'End':
          event.preventDefault();
          setState(current => moveFocus(current, order, 'last', event.shiftKey));
          return;
        case ' ':
        case 'Spacebar':
          event.preventDefault();
          setState(current => (current.focusId === null ? current : toggleSelection(current, current.focusId)));
          return;
        case 'Enter':
          event.preventDefault();
          setState(current => {
            if (current.focusId !== null) onActivate(current.focusId);
            return current;
          });
          return;
        default:
          return;
      }
    },
    [order, onActivate],
  );

  const onBackgroundMouseDown = useCallback(
    (event: React.MouseEvent) => {
      if (event.button !== 0) return;
      if ((event.target as HTMLElement).closest('[data-row-id]') !== null) return;

      const additive = event.ctrlKey || event.metaKey;
      origin.current = {
        originX: event.clientX,
        originY: event.clientY,
        additive,
        base: additive ? state.ids : new Set(),
        anchorId: state.anchorId,
        focusId: state.focusId,
      };
      if (!additive) setState(clearSelectionIds);
      setMarquee({ left: 0, top: 0, width: 0, height: 0 });
      setDragging(true);
    },
    [state.ids, state.anchorId, state.focusId],
  );

  useEffect(() => {
    if (!dragging) return;
    const pane = scrollRef.current;
    const info = origin.current;
    if (pane === null || info === null) return;

    const handleMove = (event: MouseEvent) => {
      const paneRect = pane.getBoundingClientRect();
      const clientRect = rectFromPoints({ x: info.originX, y: info.originY }, { x: event.clientX, y: event.clientY });
      setMarquee({
        left: clientRect.left - paneRect.left,
        top: clientRect.top - paneRect.top,
        width: clientRect.right - clientRect.left,
        height: clientRect.bottom - clientRect.top,
      });

      const rows = [...pane.querySelectorAll<HTMLElement>('[data-row-id]')].map(element => ({
        id: element.dataset.rowId ?? '',
        rect: toRect(element.getBoundingClientRect()),
      }));
      const inside = idsInRect(clientRect, rows);
      setState({
        ids: info.additive ? new Set([...info.base, ...inside]) : new Set(inside),
        anchorId: info.anchorId,
        focusId: inside[inside.length - 1] ?? info.focusId,
      });
    };

    const handleUp = () => {
      origin.current = null;
      setDragging(false);
      setMarquee(null);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [dragging]);

  return {
    selectedIds: state.ids,
    focusedId: state.focusId,
    scrollRef,
    marquee,
    onRowClick,
    onRowDoubleClick,
    onKeyDown,
    onBackgroundMouseDown,
  };
}
