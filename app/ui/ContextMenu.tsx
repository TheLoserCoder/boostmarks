import React from 'react';
import * as RadixContextMenu from '@radix-ui/react-context-menu';

export const ContextMenuRoot = RadixContextMenu.Root;

/** Opens a context menu anchored to an element, used for the Shift+F10 / Menu key. */
export function dispatchContextMenu(element: Element): void {
  const rect = element.getBoundingClientRect();
  element.dispatchEvent(
    new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
      clientX: rect.left + 8,
      clientY: rect.top + 8,
    }),
  );
}

/**
 * Browsers open a native context menu on Shift+F10 / the Menu key; jsdom and some
 * environments do not, so we forward those keys to the Radix trigger ourselves.
 */
export function openContextMenuFromKeyboard(event: React.KeyboardEvent<HTMLElement>): void {
  const isMenuKey = event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10');
  if (!isMenuKey) return;

  event.preventDefault();
  dispatchContextMenu(event.currentTarget);
}

type TriggerProps = React.ComponentPropsWithoutRef<typeof RadixContextMenu.Trigger>;

export function ContextMenuTrigger({ children, onKeyDown, ...rest }: TriggerProps) {
  return (
    <RadixContextMenu.Trigger
      {...rest}
      onKeyDown={event => {
        onKeyDown?.(event);
        openContextMenuFromKeyboard(event);
      }}
    >
      {children}
    </RadixContextMenu.Trigger>
  );
}

interface ContextMenuContentProps {
  label: string;
  children: React.ReactNode;
  onCloseAutoFocus?: (event: Event) => void;
}

export function ContextMenuContent({ label, children, onCloseAutoFocus }: ContextMenuContentProps) {
  return (
    <RadixContextMenu.Portal>
      <RadixContextMenu.Content
        className="ui-menu"
        aria-label={label}
        collisionPadding={8}
        onCloseAutoFocus={onCloseAutoFocus}
      >
        {children}
      </RadixContextMenu.Content>
    </RadixContextMenu.Portal>
  );
}

interface ContextMenuItemProps {
  onSelect: () => void;
  icon?: React.ReactNode;
  shortcut?: string;
  disabled?: boolean;
  children: React.ReactNode;
}

export function ContextMenuItem({ onSelect, icon, shortcut, disabled = false, children }: ContextMenuItemProps) {
  return (
    <RadixContextMenu.Item className="ui-menu-item" disabled={disabled} onSelect={onSelect}>
      <span className="ui-menu-item-label">
        {icon}
        <span>{children}</span>
      </span>
      {shortcut !== undefined ? <span className="ui-menu-shortcut">{shortcut}</span> : null}
    </RadixContextMenu.Item>
  );
}

export function ContextMenuSeparator() {
  return <RadixContextMenu.Separator className="ui-menu-separator" />;
}
