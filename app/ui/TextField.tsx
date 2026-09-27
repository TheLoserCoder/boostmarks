import React, { useId } from 'react';

export interface TextFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string;
  hint?: string;
  error?: string | null;
  /** Visually hide the label but keep it for assistive technology. */
  hideLabel?: boolean;
}

export const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, hint, error, hideLabel = false, className, ...rest },
  ref,
) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint !== undefined ? hintId : null, error ? errorId : null].filter(Boolean).join(' ');

  return (
    <div className={`ui-field ${className ?? ''}`.trim()}>
      <label className={hideLabel ? 'ui-field-label ui-field-label-hidden' : 'ui-field-label'} htmlFor={id}>
        {label}
      </label>
      <input
        ref={ref}
        id={id}
        className="ui-input"
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy === '' ? undefined : describedBy}
        {...rest}
      />
      {hint !== undefined ? (
        <p className="ui-field-hint" id={hintId}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p className="ui-field-error" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
});
