import React from 'react';
import { LayoutGrid, List, Table2 } from 'lucide-react';
import { RadioGroup, type RadioOption } from '../../../ui/RadioGroup';
import type { ViewMode } from './viewPreference';

export const VIEW_OPTIONS: ReadonlyArray<RadioOption<ViewMode>> = [
  { value: 'list', label: 'Список', icon: <List size={16} aria-hidden="true" /> },
  { value: 'table', label: 'Таблица', icon: <Table2 size={16} aria-hidden="true" /> },
  { value: 'grid', label: 'Сетка', icon: <LayoutGrid size={16} aria-hidden="true" /> },
];

interface ViewSwitcherProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export function ViewSwitcher({ value, onChange }: ViewSwitcherProps) {
  return <RadioGroup label="Вид" value={value} options={VIEW_OPTIONS} onChange={onChange} className="view-switcher" />;
}
