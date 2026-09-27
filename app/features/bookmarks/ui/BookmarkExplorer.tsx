import React, { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { FolderPlus, RefreshCw, Settings } from 'lucide-react';
import { Button, IconButton } from '../../../ui/Button';
import { SearchField } from '../../../ui/SearchField';
import type { BookmarkCommands, CreateFolderFailureReason, ProjectionClient } from '../application/ports';
import { childrenOf, topLevelFolders } from '../domain/path';
import { isWritableFolder, validateFolderName } from '../domain/createFolder';
import { searchNodes } from '../domain/search';
import type { BookmarkNode } from '../domain/types';
import { AddressBar } from './AddressBar';
import { FolderContent } from './FolderContent';
import { NewFolderDialog } from './NewFolderDialog';
import { QuickLinks } from './QuickLinks';
import { SearchResults } from './SearchResults';
import { ViewSwitcher } from './ViewSwitcher';
import { readPinnedIds, writePinnedIds } from './shortcutsPreference';
import { readViewPreference, writeViewPreference, type ViewMode } from './viewPreference';

type Status = 'loading' | 'ready' | 'error';

interface BookmarkExplorerProps {
  client: ProjectionClient;
  commands: BookmarkCommands;
}

interface CreateTarget {
  parentId: string;
  parentTitle: string;
}

const CREATE_ERRORS: Record<CreateFolderFailureReason, string> = {
  'invalid-title': 'Введите имя папки',
  'invalid-parent': 'Папка назначения больше не существует',
  failed: 'Не удалось создать папку. Попробуйте ещё раз',
};

function hasContent(nodes: BookmarkNode[]): boolean {
  return nodes.some(node => node.kind !== 'separator' && node.parentId !== null);
}

export function BookmarkExplorer({ client, commands }: BookmarkExplorerProps) {
  const [status, setStatus] = useState<Status>('loading');
  const [nodes, setNodes] = useState<BookmarkNode[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [count, setCount] = useState(0);
  const [view, setView] = useState<ViewMode>(() => readViewPreference());
  const [pinnedIds, setPinnedIds] = useState<string[]>(() => readPinnedIds());
  const [query, setQuery] = useState('');
  const [createTarget, setCreateTarget] = useState<CreateTarget | null>(null);
  const [createPending, setCreatePending] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const pendingRevealRef = useRef<string | null>(null);
  const deferredQuery = useDeferredValue(query);

  const load = useCallback(async () => {
    try {
      const loaded = await client.read();
      setNodes(loaded);
      setCount(hasContent(loaded) ? loaded.length : 0);
      setSelectedId(current => {
        // Reveal a freshly created folder as soon as the projection catches up.
        const reveal = pendingRevealRef.current;
        if (reveal !== null && loaded.some(node => node.id === reveal)) {
          pendingRevealRef.current = null;
          return reveal;
        }
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

  const startCreateFolder = (parentId: string, parentTitle: string) => {
    setCreateError(null);
    setCreateTarget({ parentId, parentTitle });
  };

  const submitCreateFolder = async (name: string, openAfter: boolean) => {
    if (createTarget === null) return;
    const clash = validateFolderName(name, childrenOf(nodes, createTarget.parentId));
    if (clash === 'duplicate') {
      setCreateError('Папка с таким именем уже есть в этой папке');
      return;
    }

    setCreateError(null);
    setCreatePending(true);
    const result = await commands.createFolder(createTarget.parentId, name);
    setCreatePending(false);
    if (!result.ok) {
      setCreateError(CREATE_ERRORS[result.reason]);
      return;
    }

    setCreateTarget(null);
    if (openAfter) {
      pendingRevealRef.current = result.id;
      setQuery('');
      void load();
    }
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

  const currentFolder = selectedId === null ? undefined : nodes.find(node => node.id === selectedId);
  const canCreateHere = isWritableFolder(currentFolder);

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
                <SearchField
                  value={query}
                  onChange={setQuery}
                  label="Поиск закладок"
                  placeholder="Название или адрес…"
                  clearLabel="Очистить поиск"
                />
                <ViewSwitcher value={view} onChange={changeView} />
                {canCreateHere ? (
                  <Button
                    variant="soft"
                    onClick={() => startCreateFolder(currentFolder.id, currentFolder.title || 'Корень')}
                  >
                    <FolderPlus size={16} aria-hidden="true" />
                    <span>Новая папка</span>
                  </Button>
                ) : null}
                <IconButton aria-label="Обновить" onClick={refresh}>
                  <RefreshCw size={16} aria-hidden="true" />
                </IconButton>
              </div>
              <p role="status" className="status">
                {searching ? `Найдено: ${results.length}` : `Закладок в проекции: ${count}`}
              </p>

              {searching ? (
                <SearchResults nodes={nodes} results={results} onOpenFolder={navigate} />
              ) : selectedId !== null ? (
                <FolderContent
                  key={selectedId}
                  nodes={nodes}
                  folderId={selectedId}
                  view={view}
                  pinnedIds={pinnedIds}
                  onSelect={navigate}
                  onTogglePin={togglePin}
                  onRefresh={refresh}
                  onCreateFolderIn={startCreateFolder}
                />
              ) : null}
            </>
          )}
        </div>
      </div>

      <NewFolderDialog
        open={createTarget !== null}
        parentTitle={createTarget?.parentTitle ?? ''}
        pending={createPending}
        error={createError}
        onOpenChange={open => {
          if (!open) {
            setCreateTarget(null);
            setCreateError(null);
          }
        }}
        onSubmit={(name, openAfter) => void submitCreateFolder(name, openAfter)}
      />
    </section>
  );
}
