import React from 'react';
import { LayoutGrid, List, Table2 } from 'lucide-react';
import { RadioGroup, type RadioOption } from '../../../ui/RadioGroup';
import { useI18n } from '../../i18n/I18nProvider';
import type { ViewMode } from './viewPreference';

interface ViewSwitcherProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export function ViewSwitcher({ value, onChange }: ViewSwitcherProps) {
  const { t } = useI18n();
  const options: ReadonlyArray<RadioOption<ViewMode>> = [
    { value: 'list', label: t('view.list'), icon: <List size={16} aria-hidden="true" /> },
    { value: 'table', label: t('view.table'), icon: <Table2 size={16} aria-hidden="true" /> },
    { value: 'grid', label: t('view.grid'), icon: <LayoutGrid size={16} aria-hidden="true" /> },
  ];

  return <RadioGroup label={t('view.label')} value={value} options={options} onChange={onChange} className="view-switcher" />;
}
