import React, { useRef, useState, type FormEvent } from 'react';
import { Button } from '../../../ui/Button';
import { Dialog } from '../../../ui/Dialog';
import { TextField } from '../../../ui/TextField';
import { useI18n } from '../../i18n/I18nProvider';
import type { TranslationKey } from '../../i18n/messages';
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

const PATH_KEYS = {
  empty: 'move.pathEmpty',
  'not-found': 'move.pathNotFound',
  ambiguous: 'move.pathAmbiguous',
} as const satisfies Record<'empty' | 'not-found' | 'ambiguous', TranslationKey>;

const MOVE_KEYS = {
  'missing-source': 'move.error.missingSource',
  'invalid-parent': 'move.error.invalidParent',
  cycle: 'move.error.cycle',
  unchanged: 'move.error.unchanged',
  unmodifiable: 'move.error.unmodifiable',
} as const;

export function MoveDialog({ open, itemId, itemTitle, nodes, pending, error, onOpenChange, onSubmit }: MoveDialogProps) {
  const { t } = useI18n();

  return (
    <Dialog
      open={open}
      onOpenChange={next => {
        if (!pending) onOpenChange(next);
      }}
      title={t('move.title')}
      description={t('move.description', { title: itemTitle })}
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
  const { t } = useI18n();
  const [path, setPath] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const fieldRef = useRef<HTMLInputElement>(null);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (pending) return;
    const resolved = resolveFolderPath(nodes, path);
    if (!resolved.ok) {
      setLocalError(t(PATH_KEYS[resolved.reason]));
      fieldRef.current?.focus();
      return;
    }
    const issue = validateMove(nodes, itemId, resolved.folderId);
    if (issue !== null) {
      setLocalError(t(MOVE_KEYS[issue]));
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
        label={t('move.destination')}
        name="destinationPath"
        placeholder={t('move.placeholder')}
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
        <Button variant="ghost" disabled={pending} onClick={onCancel}>{t('dialog.cancel')}</Button>
        <Button type="submit" variant="solid" disabled={pending}>
          {pending ? t('dialog.moving') : t('dialog.move')}
        </Button>
      </div>
    </form>
  );
}
