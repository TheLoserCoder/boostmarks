import React, { useEffect, useRef, type ReactNode } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { RowSelectionController } from './useRowSelection';
import { LIST_ROW_HEIGHT, OVERSCAN_ROWS, VIRTUALIZE_ABOVE } from './virtualization';

interface VirtualListProps<T> {
  items: T[];
  getKey: (item: T) => string;
  getLabel?: (item: T) => string;
  renderItem: (item: T, index: number) => ReactNode;
  label: string;
  controller?: RowSelectionController;
  /** Overrides the row key handling, e.g. to open the context menu from the keyboard. */
  rowKeyDown?: (event: React.KeyboardEvent) => void;
}

interface Row<T> {
  item: T;
  index: number;
  style?: React.CSSProperties;
}

interface OptionAttributes {
  role?: 'option';
  'aria-selected'?: boolean;
  'aria-label'?: string;
  tabIndex?: number;
  'data-row-id'?: string;
  onClick?: (event: React.MouseEvent) => void;
  onDoubleClick?: (event: React.MouseEvent) => void;
  onKeyDown?: (event: React.KeyboardEvent) => void;
}

/**
 * Windowed list. `aria-setsize`/`aria-posinset` keep the true position of each row
 * readable even though only the visible slice is in the DOM. With a selection
 * controller the list becomes a multi-select listbox with a roving tab stop.
 */
export function VirtualList<T>({ items, getKey, getLabel, renderItem, label, controller, rowKeyDown }: VirtualListProps<T>) {
  const internalRef = useRef<HTMLDivElement>(null);
  const parentRef = controller?.scrollRef ?? internalRef;
  const rowRefs = useRef(new Map<string, HTMLLIElement>());
  const pendingFocus = useRef<string | null>(null);
  const lastFocused = useRef<string | null>(null);

  // TanStack Virtual exposes non-memoizable handles by design; React Compiler is not enabled in this project.
  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => LIST_ROW_HEIGHT,
    overscan: OVERSCAN_ROWS,
  });
  const windowed = items.length > VIRTUALIZE_ABOVE;
  const focusedId = controller?.focusedId ?? null;

  useEffect(() => {
    if (focusedId === null || focusedId === lastFocused.current) return;
    lastFocused.current = focusedId;
    if (windowed) {
      const index = items.findIndex(item => getKey(item) === focusedId);
      if (index >= 0) virtualizer.scrollToIndex(index, { align: 'auto' });
    }
    pendingFocus.current = focusedId;
  }, [focusedId, windowed, items, getKey, virtualizer]);

  useEffect(() => {
    const id = pendingFocus.current;
    if (id === null) return;
    const element = rowRefs.current.get(id);
    if (element === undefined) return;
    element.focus();
    pendingFocus.current = null;
  });

  const rows: Row<T>[] = windowed
    ? virtualizer.getVirtualItems().map(row => ({
        item: items[row.index]!,
        index: row.index,
        style: { height: LIST_ROW_HEIGHT, transform: `translateY(${row.start}px)` },
      }))
    : items.map((item, index) => ({ item, index }));

  return (
    <div
      ref={parentRef}
      className="virtual-scroll"
      role="presentation"
      onMouseDown={controller?.onBackgroundMouseDown}
    >
      <ul
        className="content-list"
        aria-label={label}
        role={controller ? 'listbox' : undefined}
        aria-multiselectable={controller ? true : undefined}
        style={windowed ? { height: virtualizer.getTotalSize(), position: 'relative' } : undefined}
      >
        {rows.map(row => {
          const key = getKey(row.item);
          const attributes: OptionAttributes = controller
            ? {
                role: 'option',
                'aria-selected': controller.selectedIds.has(key),
                'aria-label': getLabel?.(row.item),
                tabIndex: controller.focusedId === key ? 0 : -1,
                'data-row-id': key,
                onClick: event => controller.onRowClick(key, event),
                onDoubleClick: event => controller.onRowDoubleClick(key, event),
                onKeyDown: event => {
                  event.stopPropagation();
                  (rowKeyDown ?? controller.onKeyDown)(event);
                },
              }
            : {};

          return (
            <li
              key={key}
              {...attributes}
              ref={element => {
                if (element === null) rowRefs.current.delete(key);
                else rowRefs.current.set(key, element);
              }}
              className={`content-item${row.style !== undefined ? ' virtual-row' : ''}`}
              aria-posinset={row.index + 1}
              aria-setsize={items.length}
              style={row.style}
            >
              {renderItem(row.item, row.index)}
            </li>
          );
        })}
      </ul>
      {controller?.marquee !== null && controller?.marquee !== undefined ? (
        <div
          className="marquee"
          aria-hidden="true"
          style={{
            height: controller.marquee.height,
            left: controller.marquee.left,
            top: controller.marquee.top,
            width: controller.marquee.width,
          }}
        />
      ) : null}
    </div>
  );
}
