import React from 'react';
import * as RadixCheckbox from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';

export interface CheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
  name?: string;
}

export function Checkbox({ checked, onCheckedChange, label, disabled = false, name }: CheckboxProps) {
  return (
    <label className="ui-checkbox-row">
      <RadixCheckbox.Root
        className="ui-checkbox"
        checked={checked}
        onCheckedChange={value => onCheckedChange(value === true)}
        disabled={disabled}
        name={name}
      >
        <RadixCheckbox.Indicator className="ui-checkbox-indicator">
          <Check size={14} aria-hidden="true" />
        </RadixCheckbox.Indicator>
      </RadixCheckbox.Root>
      <span className="ui-checkbox-label">{label}</span>
    </label>
  );
}
