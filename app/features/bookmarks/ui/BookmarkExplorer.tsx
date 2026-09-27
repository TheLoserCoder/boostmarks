import React, { useCallback, useEffect, useState } from 'react';
import type { ProjectionClient } from '../application/ports';
import { buildTree, topLevelEntries, type BookmarkTree } from '../domain/tree';
import type { BookmarkNode } from '../domain/types';
import { BookmarkTreeView } from './BookmarkTreeView';

type Status = 'loading' | 'ready' | 'error';

interface BookmarkExplorerProps {
  client: ProjectionClient;
}

function hasContent(nodes: BookmarkNode[]): boolean {
  return nodes.some(node => node.kind !== 'separator' && node.parentId !== null);
}

export function BookmarkExplorer({ client }: BookmarkExplorerProps) {
  const [status, setStatus] = useState<Status>('loading');
  const [trees, setTrees] = useState<BookmarkTree[]>([]);
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => new Set());
  const [count, setCount] = useState(0);

  const load = useCallback(async () => {
    try {
      const nodes = await client.read();
      setTrees(topLevelEntries(buildTree(nodes)));
      setCount(hasContent(nodes) ? nodes.length : 0);
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, [client]);

  useEffect(() => {
    void Promise.resolve().then(load);
    return client.subscribe(() => void load());
  }, [client, load]);

  const toggle = (id: string) => {
    setExpanded(current => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const refresh = () => {
    client.requestSync();
    void load();
  };

  return (
    <section className="explorer" aria-label="Закладки">
      <div className="toolbar">
        <button type="button" onClick={refresh} disabled={status === 'loading'}>
          Обновить
        </button>
        <p role="status" className="status">
          {status === 'loading' ? 'Загрузка…' : `Закладок в проекции: ${count}`}
        </p>
      </div>

      {status === 'error' ? (
        <div role="alert" className="error">
          <p>Не удалось прочитать локальную проекцию.</p>
          <button type="button" onClick={() => void load()}>
            Повторить
          </button>
        </div>
      ) : status === 'loading' ? (
        <p>Загрузка…</p>
      ) : count === 0 ? (
        <p className="empty">В этой проекции пока нет закладок</p>
      ) : (
        <BookmarkTreeView entries={trees} expanded={expanded} onToggle={toggle} />
      )}
    </section>
  );
}
