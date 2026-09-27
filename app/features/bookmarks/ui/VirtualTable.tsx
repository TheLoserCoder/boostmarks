import React, { useRef, type ReactNode } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { OVERSCAN_ROWS, TABLE_ROW_HEIGHT, VIRTUALIZE_ABOVE } from './virtualization';

interface VirtualTableProps<T> {
  items: T[];
  getKey: (item: T) => string;
  columns: string[];
  renderCells: (item: T, index: number) => ReactNode;
  label: string;
}

interface Row<T> {
  item: T;
  index: number;
  style?: React.CSSProperties;
}

/**
 * Windowed ARIA table. Rendered with ARIA table roles instead of a native `<table>`
 * because absolutely positioned table rows break native layout; `aria-rowcount`
 * and `aria-rowindex` keep the geometry truthful for assistive technology.
 */
export function VirtualTable<T>({ items, getKey, columns, renderCells, label }: VirtualTableProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);
  // TanStack Virtual exposes non-memoizable handles by design; React Compiler is not enabled in this project.
  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => TABLE_ROW_HEIGHT,
    overscan: OVERSCAN_ROWS,
  });
  const windowed = items.length > VIRTUALIZE_ABOVE;

  const rows: Row<T>[] = windowed
    ? virtualizer.getVirtualItems().map(row => ({
        item: items[row.index]!,
        index: row.index,
        style: { height: TABLE_ROW_HEIGHT, transform: `translateY(${row.start}px)` },
      }))
    : items.map((item, index) => ({ item, index }));

  return (
    <div ref={parentRef} className="virtual-scroll">
      <div role="table" aria-label={label} aria-rowcount={items.length + 1} className="virtual-table">
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
          {rows.map(row => (
            <div
              key={getKey(row.item)}
              role="row"
              aria-rowindex={row.index + 2}
              className="virtual-table-row"
              style={row.style}
            >
              {renderCells(row.item, row.index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
