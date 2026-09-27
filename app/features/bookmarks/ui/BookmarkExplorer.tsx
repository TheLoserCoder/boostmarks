import React, { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { RefreshCw, Settings } from 'lucide-react';
import type { ProjectionClient } from '../application/ports';
import { topLevelFolders } from '../domain/path';
import { searchNodes } from '../domain/search';
import type { BookmarkNode } from '../domain/types';
import { AddressBar } from './AddressBar';
import { FolderContent } from './FolderContent';
import { QuickLinks } from './QuickLinks';
import { SearchField } from './SearchField';
import { SearchResults } from './SearchResults';
import { ViewSwitcher } from './ViewSwitcher';
import { readPinnedIds, writePinnedIds } from './shortcutsPreference';
import { readViewPreference, writeViewPreference, type ViewMode } from './viewPreference';

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
  const [view, setView] = useState<ViewMode>(() => readViewPreference());
  const [pinnedIds, setPinnedIds] = useState<string[]>(() => readPinnedIds());
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);

  const load = useCallback(async () => {
    try {
      const loaded = await client.read();
      setNodes(loaded);
      setCount(hasContent(loaded) ? loaded.length : 0);
      setSelectedId(current => {
        if (current !== null && loaded.some(node => node.id === current)) return current;
        return topLevelFolders(loaded)[0]?.id ?? null;
      });
      setPinnedIds(current => {
        const valid = current.filter(id => loaded.some(node => node.id === id));
        if (valid.length !== current.length) writePinnedIds(valid);
        return valid;
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

  const results = useMemo(() => searchNodes(nodes, deferredQuery), [nodes, deferredQuery]);
  const searching = query.trim().length > 0;

  const navigate = (id: string) => {
    setSelectedId(id);
    setQuery('');
  };

  const changeView = (mode: ViewMode) => {
    setView(mode);
    writeViewPreference(mode);
  };

  const togglePin = (id: string) => {
    setPinnedIds(current => {
      const next = current.includes(id) ? current.filter(pinId => pinId !== id) : [...current, id];
      writePinnedIds(next);
      return next;
    });
  };

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
      <div className="explorer-body">
        <aside className="sidebar">
          <div className="sidebar-scroll">
            <QuickLinks
              nodes={nodes}
              pinnedIds={pinnedIds}
              selectedId={searching ? null : selectedId}
              onSelect={navigate}
              onTogglePin={togglePin}
            />
          </div>
          <div className="sidebar-footer">
            <a className="sidebar-action" href="/options.html">
              <Settings size={16} aria-hidden="true" />
              <span>Настройки</span>
            </a>
          </div>
        </aside>

        <div className="workspace">
          {status === 'loading' ? (
            <p className="loading">Загрузка…</p>
          ) : count === 0 ? (
            <p className="empty">В этой проекции пока нет закладок</p>
          ) : (
            <>
              <div className="command-bar">
                <AddressBar nodes={nodes} folderId={selectedId ?? ''} onNavigate={navigate} />
                <SearchField value={query} onChange={setQuery} />
                <ViewSwitcher value={view} onChange={changeView} />
                <button
                  type="button"
                  className="icon-button"
                  aria-label="Обновить"
                  onClick={refresh}
                >
                  <RefreshCw size={16} aria-hidden="true" />
                </button>
              </div>
              <p role="status" className="status">
                {searching ? `Найдено: ${results.length}` : `Закладок в проекции: ${count}`}
              </p>

              {searching ? (
                <SearchResults nodes={nodes} results={results} onOpenFolder={navigate} />
              ) : selectedId !== null ? (
                <FolderContent
                  nodes={nodes}
                  folderId={selectedId}
                  view={view}
                  pinnedIds={pinnedIds}
                  onSelect={navigate}
                  onTogglePin={togglePin}
                />
              ) : null}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
