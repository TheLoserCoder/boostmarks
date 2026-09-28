import React, { useState, type FormEvent } from 'react';
import { Button } from '../../../ui/Button';
import { Checkbox } from '../../../ui/Checkbox';
import { Dialog } from '../../../ui/Dialog';
import { TextField } from '../../../ui/TextField';
import { useI18n } from '../../i18n/I18nProvider';

export interface NewFolderDialogProps {
  open: boolean;
  /** Folder the folder will be created in, shown in the description. */
  parentTitle: string;
  pending: boolean;
  /** Adapter-level error, e.g. a name clash or a parent that vanished. */
  error: string | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string, openAfter: boolean) => void;
}

export function NewFolderDialog({ open, parentTitle, pending, error, onOpenChange, onSubmit }: NewFolderDialogProps) {
  const { t } = useI18n();

  return (
    <Dialog
      open={open}
      onOpenChange={next => {
        if (!pending) onOpenChange(next);
      }}
      title={t('newFolder.title')}
      description={t('newFolder.description', { title: parentTitle })}
    >
      {/* Mounted only while open, so each dialog starts from a clean name. */}
      {open ? (
        <NewFolderForm
          pending={pending}
          error={error}
          onCancel={() => onOpenChange(false)}
          onSubmit={onSubmit}
        />
      ) : null}
    </Dialog>
  );
}

interface NewFolderFormProps {
  pending: boolean;
  error: string | null;
  onCancel: () => void;
  onSubmit: (name: string, openAfter: boolean) => void;
}

function NewFolderForm({ pending, error, onCancel, onSubmit }: NewFolderFormProps) {
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [openAfter, setOpenAfter] = useState(true);
  const [touched, setTouched] = useState(false);

  const trimmed = name.trim();
  const emptyError = touched && trimmed.length === 0 ? t('newFolder.emptyName') : null;
  const message = emptyError ?? error;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setTouched(true);
    if (trimmed.length === 0 || pending) return;
    onSubmit(trimmed, openAfter);
  };

  return (
    <form className="new-folder-form" onSubmit={submit} noValidate>
      <TextField
        label={t('newFolder.name')}
        value={name}
        error={message}
        disabled={pending}
        onChange={event => setName(event.target.value)}
      />
      <Checkbox
        label={t('newFolder.open')}
        checked={openAfter}
        onCheckedChange={setOpenAfter}
        disabled={pending}
      />
      <div className="ui-dialog-actions">
        <Button variant="ghost" onClick={onCancel} disabled={pending}>
          {t('dialog.cancel')}
        </Button>
        <Button type="submit" variant="solid" disabled={pending}>
          {pending ? t('dialog.creating') : t('dialog.create')}
        </Button>
      </div>
    </form>
  );
}
