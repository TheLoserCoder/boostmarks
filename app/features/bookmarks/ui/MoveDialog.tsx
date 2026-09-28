import React, { useRef, useState, type FormEvent } from 'react';
import { Button } from '../../../ui/Button';
import { Dialog } from '../../../ui/Dialog';
import { TextField } from '../../../ui/TextField';
import { validateMove } from '../domain/move';
import { resolveFolderPath } from '../domain/path';
import type { BookmarkNode } from '../domain/types';

interface MoveDialogProps {
  open: boolean;
  itemId: string;
  itemTitle: string;
  nodes: BookmarkNode[];
  pending: boolean;
  error: string | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (parentId: string) => void;
}

const PATH_ERRORS = {
  empty: 'Введите путь к папке назначения',
  'not-found': 'Папка назначения не найдена',
  ambiguous: 'Путь неоднозначен: уточните папку назначения',
} as const;

const MOVE_ERRORS = {
  'missing-source': 'Закладка больше не существует',
  'invalid-parent': 'Нельзя переместить в эту папку',
  cycle: 'Нельзя переместить папку внутрь самой себя',
  unchanged: 'Элемент уже находится в этой папке',
  unmodifiable: 'Этот элемент нельзя переместить',
} as const;

export function MoveDialog({ open, itemId, itemTitle, nodes, pending, error, onOpenChange, onSubmit }: MoveDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={next => {
        if (!pending) onOpenChange(next);
      }}
      title="Переместить"
      description={`Куда переместить «${itemTitle}»? Укажите полный путь к папке через обратную косую черту.`}
    >
      {open ? (
        <MoveForm
          itemId={itemId}
          nodes={nodes}
          pending={pending}
          error={error}
          onCancel={() => onOpenChange(false)}
          onSubmit={onSubmit}
        />
      ) : null}
    </Dialog>
  );
}

interface MoveFormProps extends Pick<MoveDialogProps, 'itemId' | 'nodes' | 'pending' | 'error' | 'onSubmit'> {
  onCancel: () => void;
}

function MoveForm({ itemId, nodes, pending, error, onCancel, onSubmit }: MoveFormProps) {
  const [path, setPath] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const fieldRef = useRef<HTMLInputElement>(null);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (pending) return;
    const resolved = resolveFolderPath(nodes, path);
    if (!resolved.ok) {
      setLocalError(PATH_ERRORS[resolved.reason]);
      fieldRef.current?.focus();
      return;
    }
    const issue = validateMove(nodes, itemId, resolved.folderId);
    if (issue !== null) {
      setLocalError(MOVE_ERRORS[issue]);
      fieldRef.current?.focus();
      return;
    }
    setLocalError(null);
    onSubmit(resolved.folderId);
  };

  return (
    <form className="new-folder-form" onSubmit={submit} noValidate>
      <TextField
        ref={fieldRef}
        label="Папка назначения"
        name="destinationPath"
        placeholder="Например: Панель закладок\\Работа"
        value={path}
        error={localError ?? error}
        autoComplete="off"
        spellCheck={false}
        disabled={pending}
        onChange={event => {
          setPath(event.target.value);
          setLocalError(null);
        }}
      />
      <div className="ui-dialog-actions">
        <Button variant="ghost" disabled={pending} onClick={onCancel}>Отмена</Button>
        <Button type="submit" variant="solid" disabled={pending}>
          {pending ? 'Перемещение…' : 'Переместить'}
        </Button>
      </div>
    </form>
  );
}
