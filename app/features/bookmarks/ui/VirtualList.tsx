import React, { useRef, type ReactNode } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { LIST_ROW_HEIGHT, OVERSCAN_ROWS, VIRTUALIZE_ABOVE } from './virtualization';

interface VirtualListProps<T> {
  items: T[];
  getKey: (item: T) => string;
  renderItem: (item: T, index: number) => ReactNode;
  label: string;
}

interface Row<T> {
  item: T;
  index: number;
  style?: React.CSSProperties;
}

/**
 * Windowed list. `aria-setsize`/`aria-posinset` keep the true position of each row
 * readable even though only the visible slice is in the DOM.
 */
export function VirtualList<T>({ items, getKey, renderItem, label }: VirtualListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);
  // TanStack Virtual exposes non-memoizable handles by design; React Compiler is not enabled in this project.
  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => LIST_ROW_HEIGHT,
    overscan: OVERSCAN_ROWS,
  });
  const windowed = items.length > VIRTUALIZE_ABOVE;

  const rows: Row<T>[] = windowed
    ? virtualizer.getVirtualItems().map(row => ({
        item: items[row.index]!,
        index: row.index,
        style: { height: LIST_ROW_HEIGHT, transform: `translateY(${row.start}px)` },
      }))
    : items.map((item, index) => ({ item, index }));

  return (
    <div ref={parentRef} className="virtual-scroll">
      <ul
        className="content-list"
        aria-label={label}
        style={windowed ? { height: virtualizer.getTotalSize(), position: 'relative' } : undefined}
      >
        {rows.map(row => (
          <li
            key={getKey(row.item)}
            className={`content-item${row.style !== undefined ? ' virtual-row' : ''}`}
            aria-posinset={row.index + 1}
            aria-setsize={items.length}
            style={row.style}
          >
            {renderItem(row.item, row.index)}
          </li>
        ))}
      </ul>
    </div>
  );
}
