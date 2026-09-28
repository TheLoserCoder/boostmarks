import React, { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  defaultDropAnimationSideEffects,
  pointerWithin,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DropAnimation,
} from '@dnd-kit/core';
import { ArrowLeft, ArrowRight, ArrowUp, Folder, FolderPlus, Link, RefreshCw, Settings } from 'lucide-react';
import { Button, IconButton } from '../../../ui/Button';
import { SearchField } from '../../../ui/SearchField';
import { useI18n } from '../../i18n/I18nProvider';
import type { TranslationKey } from '../../i18n/messages';
import type { BookmarkCommands, CreateFolderFailureReason, MoveResult, ProjectionClient } from '../application/ports';
import { canGoBack, canGoForward, emptyHistory, goBack, goForward, visit, type NavigationHistory } from '../domain/history';
import { childrenOf, isSyntheticRoot } from '../domain/path';
import { HomeView } from './HomeView';
import { isWritableFolder, validateFolderName } from '../domain/createFolder';
import { canDropManyOn } from '../domain/dropTarget';
import { moveBatch } from '../application/moveBatch';
import { searchNodes } from '../domain/search';
import type { BookmarkNode } from '../domain/types';
import { AddressBar } from './AddressBar';
import { dragSourceId, dropTargetOf } from './DragItem';
import { DropRulesContext, type DropRules } from './dropRules';
import { FolderContent } from './FolderContent';
import { NewFolderDialog } from './NewFolderDialog';
import { MoveDialog } from './MoveDialog';
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

const CREATE_ERROR_KEYS = {
  'invalid-title': 'newFolder.emptyName',
  'invalid-parent': 'create.error.invalidParent',
  failed: 'create.error.failed',
} as const satisfies Record<CreateFolderFailureReason, TranslationKey>;

const dropAnimation: DropAnimation = {
  duration: 180,
  easing: 'cubic-bezier(0.2, 0, 0, 1)',
  sideEffects: defaultDropAnimationSideEffects({
    styles: { active: { opacity: '0.35' }, dragOverlay: { opacity: '0' } },
  }),
};

const MOVE_ERROR_KEYS = {
  'missing-source': 'move.error.missingSource',
  'invalid-parent': 'move.error.invalidParent',
  cycle: 'move.error.cycle',
  unchanged: 'move.error.unchanged',
  unmodifiable: 'move.error.unmodifiable',
  failed: 'move.error.failed',
} as const satisfies Record<Extract<MoveResult, { ok: false }>['reason'], TranslationKey>;

function hasContent(nodes: BookmarkNode[]): boolean {
  return nodes.some(node => node.kind !== 'separator' && node.parentId !== null);
}

export function BookmarkExplorer({ client, commands }: BookmarkExplorerProps) {
  const { t, plural } = useI18n();
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
  const [moveTargetId, setMoveTargetId] = useState<string | null>(null);
  const [movePending, setMovePending] = useState(false);
  const [moveError, setMoveError] = useState<string | null>(null);
  const [dragError, setDragError] = useState<string | null>(null);
  const [dragNotice, setDragNotice] = useState<string | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [selectionIds, setSelectionIds] = useState<readonly string[]>([]);
  const [history, setHistory] = useState<NavigationHistory>(emptyHistory);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const pendingRevealRef = useRef<string | null>(null);
  const deferredQuery = useDeferredValue(query);

  const reportSelection = useCallback((ids: readonly string[]) => {
    setSelectionIds(current =>
      current.length === ids.length && current.every((id, index) => id === ids[index]) ? current : ids);
  }, []);

  const dropRules = useMemo<DropRules>(() => ({
    idsFor: draggedId => (selectionIds.includes(draggedId) && selectionIds.length > 1 ? selectionIds : [draggedId]),
    canDrop: (ids, kind, targetId) => canDropManyOn(nodes, ids, kind, targetId),
  }), [nodes, selectionIds]);

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
        // Home is the landing view; a deleted folder falls back to it instead of guessing.
        return null;
      });
      setPinnedIds(current => {
        const valid = current.filter(id => loaded.some(node => node.id === id));
        if (valid.length !== current.length) writePinnedIds(valid);
        return valid;
      });
      setHistory(current => {
        const alive = (ids: readonly (string | null)[]) =>
          ids.filter(id => id === null || loaded.some(node => node.id === id));
        const past = alive(current.past);
        const future = alive(current.future);
        const unchanged = past.length === current.past.length && future.length === current.future.length;
        return unchanged ? current : { past, future };
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
    setHistory(current => visit(current, selectedId, id));
    setSelectedId(id);
    setQuery('');
  };

  const navigateBack = () => {
    const step = goBack(history, selectedId);
    if (step === null) return;
    setHistory(step.history);
    setSelectedId(step.id);
    setQuery('');
  };

  const navigateForward = () => {
    const step = goForward(history, selectedId);
    if (step === null) return;
    setHistory(step.history);
    setSelectedId(step.id);
    setQuery('');
  };

  const goHome = () => {
    setHistory(current => visit(current, selectedId, null));
    setSelectedId(null);
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
      setCreateError(t('create.error.duplicate'));
      return;
    }

    setCreateError(null);
    setCreatePending(true);
    const result = await commands.createFolder(createTarget.parentId, name);
    setCreatePending(false);
    if (!result.ok) {
      setCreateError(t(CREATE_ERROR_KEYS[result.reason]));
      return;
    }

    setCreateTarget(null);
    if (openAfter) {
      pendingRevealRef.current = result.id;
      setQuery('');
      void load();
    }
  };

  const submitMove = async (parentId: string) => {
    if (moveTargetId === null || movePending) return;
    setMoveError(null);
    setMovePending(true);
    const result = await commands.move(moveTargetId, parentId);
    setMovePending(false);
    if (!result.ok) {
      setMoveError(t(MOVE_ERROR_KEYS[result.reason]));
      return;
    }
    setMoveTargetId(null);
  };

  const finishDrag = async ({ active, over }: DragEndEvent) => {
    if (over === null) return;
    const draggedId = dragSourceId(active.id);
    if (draggedId === null) return;
    const ids = dropRules.idsFor(draggedId);
    const { kind, targetId } = dropTargetOf(String(over.id));
    if (!dropRules.canDrop(ids, kind, targetId)) return;
    setDragError(null);
    setDragNotice(null);

    const outcome = await moveBatch(commands, ids, kind, targetId);
    const targetTitle = nodes.find(node => node.id === targetId)?.title || t('item.folder');

    if (ids.length === 1) {
      const sourceTitle = nodes.find(node => node.id === ids[0])?.title || t('item.element');
      if (outcome.moved === 0) {
        setDragError(t('drag.failed'));
        return;
      }
      setDragNotice(kind === 'before'
        ? t('drag.movedBefore', { source: sourceTitle, target: targetTitle })
        : t('drag.moved', { source: sourceTitle, target: targetTitle }));
      return;
    }

    if (outcome.failed > 0) {
      setDragError(outcome.moved > 0
        ? t('drag.partial', { moved: outcome.moved, total: ids.length })
        : t('drag.failed'));
      return;
    }
    const noun = plural('item.noun', ids.length);
    const messageKey = kind === 'before'
      ? (outcome.moved === ids.length ? 'drag.movedManyBefore' : 'drag.movedSomeBefore')
      : (outcome.moved === ids.length ? 'drag.movedMany' : 'drag.movedSome');
    setDragNotice(t(messageKey, { moved: outcome.moved, count: outcome.moved, total: ids.length, noun, target: targetTitle }));
  };

  const dragIds = activeDragId === null ? [] : dropRules.idsFor(activeDragId);
  const dragNode = activeDragId === null ? undefined : nodes.find(node => node.id === activeDragId);

  if (status === 'error') {
    return (
      <section className="explorer" aria-label={t('explorer.region')}>
        <div role="alert" className="error">
          <p>{t('explorer.loadError')}</p>
          <button type="button" onClick={() => void load()}>
            {t('explorer.retry')}
          </button>
        </div>
      </section>
    );
  }

  const currentFolder = selectedId === null ? undefined : nodes.find(node => node.id === selectedId);
  const parentFolder = currentFolder !== undefined && currentFolder.parentId !== null
    ? nodes.find(node => node.id === currentFolder.parentId)
    : undefined;
  const canGoUp = parentFolder !== undefined && !isSyntheticRoot(parentFolder);
  const canCreateHere = isWritableFolder(currentFolder);

  return (
    <section className="explorer" aria-label={t('explorer.region')}>
      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={event => setActiveDragId(dragSourceId(event.active.id))}
        onDragCancel={() => setActiveDragId(null)}
        onDragEnd={event => {
          setActiveDragId(null);
          void finishDrag(event);
        }}
        accessibility={{
          screenReaderInstructions: { draggable: t('drag.hint') },
          announcements: {
            onDragStart: ({ active }) => {
              const id = dragSourceId(active.id);
              const total = id === null ? 1 : dropRules.idsFor(id).length;
              return total > 1 ? t('drag.startMany', { count: total }) : t('drag.start');
            },
            onDragOver: () => '',
            onDragEnd: () => t('drag.end'),
            onDragCancel: () => t('drag.cancel'),
          },
        }}
      >
      <DropRulesContext.Provider value={dropRules}>
      <div className="explorer-frame">
      {status === 'ready' && count > 0 ? (
        <div className="toolbar">
          <div className="nav-row">
            <IconButton aria-label={t('nav.back')} size="sm" disabled={!canGoBack(history)} onClick={navigateBack}>
              <ArrowLeft size={16} aria-hidden="true" />
            </IconButton>
            <IconButton aria-label={t('nav.forward')} size="sm" disabled={!canGoForward(history)} onClick={navigateForward}>
              <ArrowRight size={16} aria-hidden="true" />
            </IconButton>
            <IconButton aria-label={t('nav.up')} size="sm" disabled={!canGoUp} onClick={() => parentFolder && navigate(parentFolder.id)}>
              <ArrowUp size={16} aria-hidden="true" />
            </IconButton>
            <IconButton aria-label={t('nav.refresh')} size="sm" onClick={refresh}>
              <RefreshCw size={16} aria-hidden="true" />
            </IconButton>
            <AddressBar nodes={nodes} folderId={selectedId ?? ''} onNavigate={navigate} />
            <SearchField
              value={query}
              onChange={setQuery}
              label={t('search.label')}
              placeholder={t('search.placeholder')}
              clearLabel={t('search.clear')}
            />
          </div>
          <div className="command-bar">
            {canCreateHere ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => startCreateFolder(currentFolder.id, currentFolder.title || t('quick.root'))}
              >
                <FolderPlus size={16} aria-hidden="true" />
                <span>{t('command.newFolder')}</span>
              </Button>
            ) : null}
            <ViewSwitcher value={view} onChange={changeView} />
          </div>
        </div>
      ) : null}
      <div className="explorer-body">
        <aside className="sidebar">
          <div className="sidebar-scroll">
            <QuickLinks
              nodes={nodes}
              pinnedIds={pinnedIds}
              selectedId={searching ? null : selectedId}
              homeActive={!searching && selectedId === null}
              onSelect={navigate}
              onGoHome={goHome}
              onTogglePin={togglePin}
            />
          </div>
          <div className="sidebar-footer">
            <a className="sidebar-action" href="/options.html">
              <Settings size={16} aria-hidden="true" />
              <span>{t('nav.settings')}</span>
            </a>
          </div>
        </aside>

        <div className="workspace">
          {status === 'loading' ? (
            <p className="loading">{t('explorer.loading')}</p>
          ) : count === 0 ? (
            <p className="empty">{t('explorer.emptyProjection')}</p>
          ) : (
            <>
               {dragError !== null ? <p role="alert" className="error">{dragError}</p> : null}

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
                  onMove={id => {
                    setMoveError(null);
                    setMoveTargetId(id);
                  }}
                  onDropBefore={(id, beforeId) => commands.moveBefore(id, beforeId)}
                  onSelectionChange={reportSelection}
                />
              ) : (
                <HomeView nodes={nodes} pinnedIds={pinnedIds} onOpenFolder={navigate} />
              )}
              <div className="status-bar">
                <p role="status" className="status">
                  {searching
                    ? t('search.found', { count: results.length })
                    : t('status.projected', { count })}
                </p>
                {dragNotice !== null ? <p role="status" className="status status-bar-notice">{dragNotice}</p> : null}
              </div>
            </>
          )}
        </div>
      </div>
      </div>
      </DropRulesContext.Provider>
      <DragOverlay dropAnimation={dropAnimation}>
        {dragNode !== undefined ? (
          <div className="drag-overlay" aria-hidden="true">
            {dragNode.kind === 'folder' ? <Folder size={16} /> : <Link size={16} />}
            <span>{dragNode.title || dragNode.url || t('item.separator')}</span>
            {dragIds.length > 1 ? <span className="drag-count">+{dragIds.length - 1}</span> : null}
          </div>
        ) : null}
      </DragOverlay>
      </DndContext>

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
      <MoveDialog
        open={moveTargetId !== null}
        itemId={moveTargetId ?? ''}
        itemTitle={nodes.find(node => node.id === moveTargetId)?.title ?? ''}
        nodes={nodes}
        pending={movePending}
        error={moveError}
        onOpenChange={open => {
          if (!open) {
            setMoveTargetId(null);
            setMoveError(null);
          }
        }}
        onSubmit={parentId => void submitMove(parentId)}
      />
    </section>
  );
}
