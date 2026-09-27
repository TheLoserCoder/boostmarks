import React from 'react';

export type ButtonVariant = 'solid' | 'soft' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'soft', size = 'md', className, type = 'button', ...rest },
  ref,
) {
  const classes = ['ui-button', className].filter(Boolean).join(' ');

  return <button ref={ref} type={type} className={classes} data-variant={variant} data-size={size} {...rest} />;
});

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Icons carry meaning, so an accessible name is mandatory. */
  'aria-label': string;
  size?: ButtonSize;
  active?: boolean;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { size = 'md', active = false, className, type = 'button', ...rest },
  ref,
) {
  const classes = ['ui-icon-button', className].filter(Boolean).join(' ');

  return (
    <button ref={ref} type={type} className={classes} data-size={size} data-active={active || undefined} {...rest} />
  );
});
