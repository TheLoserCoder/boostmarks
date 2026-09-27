import React, { useCallback, useEffect, useState } from 'react';
import type { ProjectionClient } from '../application/ports';
import { topLevelFolders } from '../domain/path';
import type { BookmarkNode } from '../domain/types';
import { FolderContent } from './FolderContent';
import { FolderTree } from './FolderTree';

type Status = 'loading' | 'ready' | 'error';

interface BookmarkExplorerProps {
  client: ProjectionClient;
}

function hasContent(nodes: BookmarkNode[]): boolean {
  return nodes.some(node => node.kind !== 'separator' && node.parentId !== null);
}

export function BookmarkExplorer({ client }: BookmarkExplorerProps) {
  const [status, setStatus] = useState<Status>('loading');
  const [nodes, setNodes] = useState<BookmarkNode[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [count, setCount] = useState(0);

  const load = useCallback(async () => {
    try {
      const loaded = await client.read();
      setNodes(loaded);
      setCount(hasContent(loaded) ? loaded.length : 0);
      setSelectedId(current => {
        if (current !== null && loaded.some(node => node.id === current)) return current;
        return topLevelFolders(loaded)[0]?.id ?? null;
      });
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, [client]);

  useEffect(() => {
    void Promise.resolve().then(load);
    return client.subscribe(() => void load());
  }, [client, load]);

  const refresh = () => {
    client.requestSync();
    void load();
  };

  if (status === 'error') {
    return (
      <section className="explorer" aria-label="Закладки">
        <div role="alert" className="error">
          <p>Не удалось прочитать локальную проекцию.</p>
          <button type="button" onClick={() => void load()}>
            Повторить
          </button>
        </div>
      </section>
    );
  }

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

      {status === 'loading' ? (
        <p>Загрузка…</p>
      ) : count === 0 ? (
        <p className="empty">В этой проекции пока нет закладок</p>
      ) : (
        <div className="panes">
          <nav aria-label="Папки" className="sidebar">
            <FolderTree nodes={nodes} selectedId={selectedId} onSelect={setSelectedId} />
          </nav>
          {selectedId !== null ? (
            <FolderContent nodes={nodes} folderId={selectedId} onSelect={setSelectedId} />
          ) : null}
        </div>
      )}
    </section>
  );
}
