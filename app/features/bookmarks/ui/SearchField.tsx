import React from 'react';
import { Search, X } from 'lucide-react';

interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchField({ value, onChange }: SearchFieldProps) {
  return (
    <div className="search-field">
      <Search size={16} aria-hidden="true" />
      <input
        type="search"
        aria-label="Поиск закладок"
        placeholder="Поиск"
        value={value}
        onChange={event => onChange(event.target.value)}
        onKeyDown={event => {
          if (event.key === 'Escape') onChange('');
        }}
      />
      {value.length > 0 ? (
        <button type="button" className="icon-button" aria-label="Очистить поиск" onClick={() => onChange('')}>
          <X size={14} aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
