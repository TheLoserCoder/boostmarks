import React from 'react';
import { Search, X } from 'lucide-react';
import { IconButton } from './Button';

interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
  clearLabel?: string;
}

export function SearchField({ value, onChange, label, placeholder, clearLabel }: SearchFieldProps) {
  const clearText = clearLabel ?? `Очистить: ${label}`;

  return (
    <div className="ui-search">
      <input
        type="search"
        aria-label={label}
        name="bookmark-search"
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
        value={value}
        onChange={event => onChange(event.target.value)}
        onKeyDown={event => {
          if (event.key === 'Escape') onChange('');
        }}
      />
      <Search size={16} className="ui-search-icon" aria-hidden="true" />
      {value.length > 0 ? (
        <IconButton size="sm" aria-label={clearText} onClick={() => onChange('')}>
          <X size={14} aria-hidden="true" />
        </IconButton>
      ) : null}
    </div>
  );
}
