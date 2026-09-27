import React from 'react';
import { LayoutGrid, List, Table2 } from 'lucide-react';
import type { ViewMode } from './viewPreference';

export const VIEW_OPTIONS: ReadonlyArray<{ id: ViewMode; label: string; icon: React.ReactNode }> = [
  { id: 'list', label: 'Список', icon: <List size={16} aria-hidden="true" /> },
  { id: 'table', label: 'Таблица', icon: <Table2 size={16} aria-hidden="true" /> },
  { id: 'grid', label: 'Сетка', icon: <LayoutGrid size={16} aria-hidden="true" /> },
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
          {option.icon}
          {option.label}
        </label>
      ))}
    </fieldset>
  );
}
