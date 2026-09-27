import React, { useRef } from 'react';
import * as RadixRadioGroup from '@radix-ui/react-radio-group';

export interface RadioOption<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

interface RadioGroupProps<T extends string> {
  label: string;
  value: T;
  options: ReadonlyArray<RadioOption<T>>;
  onChange: (value: T) => void;
  hideLabel?: boolean;
  className?: string;
}

function arrowDirection(key: string): 0 | 1 | -1 {
  if (key === 'ArrowRight' || key === 'ArrowDown') return 1;
  if (key === 'ArrowLeft' || key === 'ArrowUp') return -1;
  return 0;
}

/**
 * Segmented radio group with a single tab stop: arrows move the focus and select the
 * next option (WAI-ARIA radio pattern), Space selects, and the group carries the label.
 *
 * Selection on arrow keys is implemented here rather than left to the primitive: the
 * primitive selects on focus only while the arrow key is still held, so a quick tap
 * moves focus without changing the value.
 */
export function RadioGroup<T extends string>({
  label,
  value,
  options,
  onChange,
  hideLabel = false,
  className,
}: RadioGroupProps<T>) {
  const itemRefs = useRef(new Map<T, HTMLButtonElement>());

  const handleKeyDown = (event: React.KeyboardEvent) => {
    const direction = arrowDirection(event.key);
    if (direction === 0 || options.length === 0) return;
    event.preventDefault();

    const focusedIndex = options.findIndex(option => itemRefs.current.get(option.value) === document.activeElement);
    const currentIndex = focusedIndex === -1 ? options.findIndex(option => option.value === value) : focusedIndex;
    const nextIndex = ((currentIndex === -1 ? 0 : currentIndex) + direction + options.length) % options.length;
    const next = options[nextIndex]!;

    if (next.value !== value) onChange(next.value);
    itemRefs.current.get(next.value)?.focus();
  };

  return (
    <RadixRadioGroup.Root
      className={`ui-radio-group ${className ?? ''}`.trim()}
      value={value}
      onValueChange={next => onChange(next as T)}
      onKeyDown={handleKeyDown}
      aria-label={label}
    >
      {!hideLabel ? (
        <span className="ui-radio-group-legend" aria-hidden="true">
          {label}
        </span>
      ) : null}
      {options.map(option => (
        <RadixRadioGroup.Item
          key={option.value}
          value={option.value}
          className="ui-radio-item"
          ref={element => {
            if (element === null) itemRefs.current.delete(option.value);
            else itemRefs.current.set(option.value, element);
          }}
        >
          {option.icon}
          <span className="ui-radio-label">{option.label}</span>
        </RadixRadioGroup.Item>
      ))}
    </RadixRadioGroup.Root>
  );
}
