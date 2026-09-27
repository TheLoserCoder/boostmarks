import React, { useEffect, useRef, useState, type FormEvent } from 'react';
import { Pencil } from 'lucide-react';
import { folderChain, formatFolderPath, resolveFolderPath } from '../domain/path';
import type { BookmarkNode } from '../domain/types';

interface AddressBarProps {
  nodes: BookmarkNode[];
  folderId: string;
  onNavigate: (id: string) => void;
}

const ERROR_TEXT: Record<'empty' | 'not-found' | 'ambiguous', string> = {
  empty: 'Введите путь к папке',
  'not-found': 'Папка не найдена',
  ambiguous: 'Найдено несколько папок с таким именем — уточните путь',
};

export function AddressBar({ nodes, folderId, onNavigate }: AddressBarProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chain = folderChain(nodes, folderId);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const startEditing = () => {
    setValue(formatFolderPath(nodes, folderId));
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
    setError(ERROR_TEXT[result.reason]);
  };

  if (editing) {
    return (
      <form className="address-bar path-form" onSubmit={submit}>
        <input
          ref={inputRef}
          className="path-input"
          aria-label="Путь к папке"
          value={value}
          onChange={event => setValue(event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Escape') cancel();
          }}
        />
        <button type="submit" className="path-submit">
          Перейти
        </button>
        {error !== null ? (
          <p className="path-error" role="alert">
            {error}
          </p>
        ) : null}
      </form>
    );
  }

  return (
    <nav aria-label="Путь" className="address-bar breadcrumbs">
      <ol>
        {chain.map(folder => (
          <li key={folder.id}>
            <button
              type="button"
              aria-current={folder.id === folderId ? 'page' : undefined}
              onClick={() => onNavigate(folder.id)}
            >
              {folder.title}
            </button>
          </li>
        ))}
      </ol>
      <button type="button" className="icon-button" aria-label="Изменить путь" onClick={startEditing}>
        <Pencil size={14} aria-hidden="true" />
      </button>
    </nav>
  );
}
