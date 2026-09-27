import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import React from 'react';
import { Button, IconButton } from '../../../app/ui/Button';
import { Checkbox } from '../../../app/ui/Checkbox';
import { ContextMenuContent, ContextMenuItem, ContextMenuRoot, ContextMenuTrigger } from '../../../app/ui/ContextMenu';
import { Dialog } from '../../../app/ui/Dialog';
import { RadioGroup } from '../../../app/ui/RadioGroup';
import { SearchField } from '../../../app/ui/SearchField';
import { TextField } from '../../../app/ui/TextField';

describe('styled controls', () => {
  it('renders buttons with variant and size styling instead of browser defaults', () => {
    render(
      <>
        <Button variant="solid">Создать</Button>
        <Button size="sm">Отмена</Button>
        <IconButton aria-label="Обновить">↻</IconButton>
      </>,
    );

    const create = screen.getByRole('button', { name: 'Создать' });
    expect(create).toHaveClass('ui-button');
    expect(create).toHaveAttribute('data-variant', 'solid');
    expect(screen.getByRole('button', { name: 'Отмена' })).toHaveAttribute('data-size', 'sm');
    expect(screen.getByRole('button', { name: 'Обновить' })).toHaveClass('ui-icon-button');
  });

  it('disables a pending button so it cannot be submitted twice', () => {
    const onClick = vi.fn();
    render(
      <Button variant="solid" disabled onClick={onClick}>
        Создать
      </Button>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Создать' }));
    expect(onClick).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Создать' })).toBeDisabled();
  });

  it('links a text field label, hint and error to the input', () => {
    render(<TextField label="Имя папки" hint="Необязательно" error="Имя занято" defaultValue="" />);

    const input = screen.getByLabelText('Имя папки');
    expect(input).toHaveClass('ui-input');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    const describedBy = input.getAttribute('aria-describedby') ?? '';
    expect(describedBy.split(' ').length).toBe(2);
    expect(screen.getByRole('alert')).toHaveTextContent('Имя занято');
  });

  it('toggles the styled checkbox by click and keyboard', () => {
    const changes: boolean[] = [];
    render(<Checkbox label="Открыть папку" checked={false} onCheckedChange={value => changes.push(value)} />);

    const checkbox = screen.getByRole('checkbox', { name: 'Открыть папку' });
    expect(checkbox).toHaveClass('ui-checkbox');

    fireEvent.click(checkbox);
    fireEvent.keyDown(checkbox, { key: ' ' });

    expect(changes).toEqual([true]);
  });

  it('keeps the radio group to one tab stop and changes value with arrow keys', () => {
    const changes: string[] = [];
    const options = [
      { value: 'list', label: 'Список' },
      { value: 'table', label: 'Таблица' },
      { value: 'grid', label: 'Сетка' },
    ] as const;

    function Controlled() {
      const [value, setValue] = React.useState<'list' | 'table' | 'grid'>('list');
      return (
        <RadioGroup
          label="Вид"
          value={value}
          options={options}
          onChange={next => {
            changes.push(next);
            setValue(next);
          }}
        />
      );
    }

    render(<Controlled />);

    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(3);
    const group = screen.getByRole('radiogroup', { name: 'Вид' });
    expect(screen.getByRole('radio', { name: 'Список' })).toBeChecked();
    // The group is the single tab stop; arrow keys select inside it.
    expect(group).toHaveAttribute('tabindex', '0');
    expect(radios.every(radio => radio.getAttribute('tabindex') === '-1')).toBe(true);

    fireEvent.keyDown(radios[0]!, { key: 'ArrowRight' });
    expect(screen.getByRole('radio', { name: 'Таблица' })).toHaveFocus();
    expect(screen.getByRole('radio', { name: 'Таблица' })).toBeChecked();

    fireEvent.keyDown(screen.getByRole('radio', { name: 'Таблица' }), { key: 'ArrowDown' });
    expect(screen.getByRole('radio', { name: 'Сетка' })).toBeChecked();

    fireEvent.keyDown(screen.getByRole('radio', { name: 'Сетка' }), { key: 'ArrowRight' });
    expect(screen.getByRole('radio', { name: 'Список' })).toBeChecked();

    fireEvent.keyDown(screen.getByRole('radio', { name: 'Список' }), { key: 'ArrowLeft' });
    expect(screen.getByRole('radio', { name: 'Сетка' })).toBeChecked();
  });

  it('exposes a search field with a clear affordance', () => {
    const onChange = vi.fn();
    render(<SearchField label="Поиск закладок" value="boost" onChange={onChange} />);

    expect(screen.getByRole('searchbox', { name: 'Поиск закладок' })).toHaveValue('boost');
    fireEvent.click(screen.getByRole('button', { name: 'Очистить: Поиск закладок' }));
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('opens a styled context menu from the keyboard and reports the chosen item', async () => {
    const onSelect = vi.fn();
    render(
      <ContextMenuRoot>
        <ContextMenuTrigger>
          <button type="button">Панель закладок</button>
        </ContextMenuTrigger>
        <ContextMenuContent label="Действия">
          <ContextMenuItem onSelect={onSelect}>Создать папку</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenuRoot>,
    );

    fireEvent.keyDown(screen.getByRole('button', { name: 'Панель закладок' }), { key: 'F10', shiftKey: true });

    const menu = await screen.findByRole('menu', { name: 'Действия' });
    const item = within(menu).getByRole('menuitem', { name: 'Создать папку' });
    expect(menu).toHaveClass('ui-menu');

    fireEvent.click(item);
    await waitFor(() => expect(onSelect).toHaveBeenCalledTimes(1));
  });

  it('traps focus in the dialog and closes it with Escape', async () => {
    const onOpenChange = vi.fn();
    render(
      <Dialog open onOpenChange={onOpenChange} title="Новая папка" description="Введите имя">
        <input aria-label="Имя" />
      </Dialog>,
    );

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: 'Новая папка' })).toBeInTheDocument();
    await waitFor(() => expect(within(dialog).getByLabelText('Имя')).toHaveFocus());

    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
