import React, { useEffect, useRef, useState, type FormEvent } from 'react';
import { ChevronDown } from 'lucide-react';
import { IconButton } from '../../../ui/Button';
import { useI18n } from '../../i18n/I18nProvider';
import { folderChain, formatFolderPath, resolveFolderPath } from '../domain/path';
import type { BookmarkNode } from '../domain/types';
import type { TranslationKey } from '../../i18n/messages';

interface AddressBarProps {
  nodes: BookmarkNode[];
  /** Open folder id, or null for the Home view. */
  folderId: string | null;
  onNavigate: (id: string) => void;
}

const ERROR_KEYS = {
  empty: 'address.empty',
  'not-found': 'address.notFound',
  ambiguous: 'address.ambiguous',
} as const satisfies Record<'empty' | 'not-found' | 'ambiguous', TranslationKey>;

export function AddressBar({ nodes, folderId, onNavigate }: AddressBarProps) {
  const { t } = useI18n();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chain = folderId === null ? [] : folderChain(nodes, folderId);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const startEditing = () => {
    setValue(folderId === null ? '' : formatFolderPath(nodes, folderId));
    setError(null);
    setEditing(true);
  };

  const cancel = () => {
    setEditing(false);
    setError(null);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const result = resolveFolderPath(nodes, value);
    if (result.ok) {
      cancel();
      onNavigate(result.folderId);
      return;
    }
    setError(t(ERROR_KEYS[result.reason]));
  };

  if (editing) {
    return (
      <form className="address-bar address-field path-form" onSubmit={submit}>
        <input
          ref={inputRef}
          className="ui-input path-input"
          aria-label={t('address.path')}
          name="bookmark-path"
          autoComplete="off"
          spellCheck={false}
          value={value}
          onChange={event => setValue(event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Escape') cancel();
          }}
        />
        {error !== null ? (
          <p className="ui-field-error address-bar-error" role="alert">
            {error}
          </p>
        ) : null}
      </form>
    );
  }

  return (
    <div className="address-bar address-field">
      <nav aria-label={t('address.breadcrumbs')} className="breadcrumbs">
        <ol>
          {chain.length === 0 ? (
            <li>
              <span className="breadcrumb-current" aria-current="page">
                {t('nav.home')}
              </span>
            </li>
          ) : (
            chain.map(folder => (
              <li key={folder.id}>
                <button
                  type="button"
                  aria-current={folder.id === folderId ? 'page' : undefined}
                  onClick={() => onNavigate(folder.id)}
                >
                  {folder.title}
                </button>
              </li>
            ))
          )}
        </ol>
      </nav>
      <IconButton className="address-edit-trigger" aria-label={t('address.edit')} size="sm" onClick={startEditing}>
        <ChevronDown size={14} aria-hidden="true" />
      </IconButton>
    </div>
  );
}
