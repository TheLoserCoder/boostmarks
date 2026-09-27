import React from 'react';
import type { ViewMode } from './viewPreference';

export const VIEW_OPTIONS: ReadonlyArray<{ id: ViewMode; label: string }> = [
  { id: 'list', label: 'Список' },
  { id: 'table', label: 'Таблица' },
  { id: 'grid', label: 'Сетка' },
];

interface ViewSwitcherProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export function ViewSwitcher({ value, onChange }: ViewSwitcherProps) {
  return (
    <fieldset className="view-switcher">
      <legend>Вид</legend>
      {VIEW_OPTIONS.map(option => (
        <label key={option.id}>
          <input
            type="radio"
            name="bookmarks-view"
            value={option.id}
            checked={value === option.id}
            onChange={() => onChange(option.id)}
          />
          {option.label}
        </label>
      ))}
    </fieldset>
  );
}
