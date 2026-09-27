import React, { useEffect, useRef, type ReactNode } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { RowSelectionController } from './useRowSelection';
import { OVERSCAN_ROWS, TABLE_ROW_HEIGHT, VIRTUALIZE_ABOVE } from './virtualization';

interface VirtualTableProps<T> {
  items: T[];
  getKey: (item: T) => string;
  getLabel?: (item: T) => string;
  columns: string[];
  renderCells: (item: T, index: number) => ReactNode;
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

/**
 * Windowed ARIA table. Rendered with ARIA table/grid roles instead of a native
 * `<table>` because absolutely positioned table rows break native layout;
 * `aria-rowcount` and `aria-rowindex` keep the geometry truthful for assistive
 * technology. With a selection controller it becomes a multi-select grid.
 */
export function VirtualTable<T>({
  items,
  getKey,
  getLabel,
  columns,
  renderCells,
  label,
  controller,
  rowKeyDown,
}: VirtualTableProps<T>) {
  const internalRef = useRef<HTMLDivElement>(null);
  const parentRef = controller?.scrollRef ?? internalRef;
  const rowRefs = useRef(new Map<string, HTMLDivElement>());
  const pendingFocus = useRef<string | null>(null);
  const lastFocused = useRef<string | null>(null);

  // TanStack Virtual exposes non-memoizable handles by design; React Compiler is not enabled in this project.
  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => TABLE_ROW_HEIGHT,
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
        style: { height: TABLE_ROW_HEIGHT, transform: `translateY(${row.start}px)` },
      }))
    : items.map((item, index) => ({ item, index }));

  return (
    <div
      ref={parentRef}
      className="virtual-scroll"
      role="presentation"
      onMouseDown={controller?.onBackgroundMouseDown}
    >
      <div
        role={controller ? 'grid' : 'table'}
        aria-label={label}
        aria-rowcount={items.length + 1}
        aria-multiselectable={controller ? true : undefined}
        className="virtual-table"
      >
        <div role="row" aria-rowindex={1} className="virtual-table-header">
          {columns.map(column => (
            <div role="columnheader" key={column} className="virtual-cell">
              {column}
            </div>
          ))}
        </div>
        <div
          className="virtual-table-body"
          style={windowed ? { height: virtualizer.getTotalSize(), position: 'relative' } : undefined}
        >
          {rows.map(row => {
            const key = getKey(row.item);

            return (
              <div
                key={key}
                role="row"
                aria-rowindex={row.index + 2}
                aria-selected={controller ? controller.selectedIds.has(key) : undefined}
                aria-label={controller ? getLabel?.(row.item) : undefined}
                tabIndex={controller ? (controller.focusedId === key ? 0 : -1) : undefined}
                data-row-id={controller ? key : undefined}
                ref={element => {
                  if (element === null) rowRefs.current.delete(key);
                  else rowRefs.current.set(key, element);
                }}
                className="virtual-table-row"
                style={row.style}
                onClick={controller ? event => controller.onRowClick(key, event) : undefined}
                onDoubleClick={controller ? event => controller.onRowDoubleClick(key, event) : undefined}
                onKeyDown={
                  controller
                    ? event => {
                        event.stopPropagation();
                        (rowKeyDown ?? controller.onKeyDown)(event);
                      }
                    : undefined
                }
              >
                {row.index >= 0 ? renderCells(row.item, row.index) : null}
              </div>
            );
          })}
        </div>
      </div>
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
