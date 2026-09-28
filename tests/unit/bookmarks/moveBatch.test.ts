import { describe, expect, it, vi } from 'vitest';
import { moveBatch } from '../../../app/features/bookmarks/application/moveBatch';
import type { BookmarkCommands } from '../../../app/features/bookmarks/application/ports';
import { fakeCommands } from './support/fixtures';

function orderedCommands(result: () => Awaited<ReturnType<BookmarkCommands['move']>>) {
  const calls: string[] = [];
  const { commands } = fakeCommands();
  commands.move = vi.fn(async (id: string) => {
    calls.push(id);
    return result();
  });
  commands.moveBefore = vi.fn(async (id: string) => {
    calls.push(id);
    return result();
  });
  return { commands, calls };
}

describe('moveBatch', () => {
  it('moves every id in order through the folder command and reports the outcome', async () => {
    const { commands, calls } = orderedCommands(() => ({ ok: true }));
    const outcome = await moveBatch(commands, ['a', 'b', 'c'], 'folder', 'other');
    expect(calls).toEqual(['a', 'b', 'c']);
    expect(commands.moveBefore).not.toHaveBeenCalled();
    expect(outcome).toEqual({ moved: 3, unchanged: 0, failed: 0 });
  });

  it('routes positional moves through moveBefore and counts unchanged rows separately', async () => {
    const results = [{ ok: true }, { ok: false, reason: 'unchanged' }, { ok: true }] as const;
    let index = 0;
    const { commands, calls } = orderedCommands(() => results[index++]!);
    const outcome = await moveBatch(commands, ['a', 'b', 'c'], 'before', 'anchor');
    expect(calls).toEqual(['a', 'b', 'c']);
    expect(commands.move).not.toHaveBeenCalled();
    expect(outcome).toEqual({ moved: 2, unchanged: 1, failed: 0 });
  });

  it('counts real failures without stopping the remaining moves', async () => {
    const results = [
      { ok: false, reason: 'missing-source' },
      { ok: true },
      { ok: false, reason: 'failed' },
    ] as const;
    let index = 0;
    const { commands, calls } = orderedCommands(() => results[index++]!);
    const outcome = await moveBatch(commands, ['a', 'b', 'c'], 'folder', 'other');
    expect(calls).toEqual(['a', 'b', 'c']);
    expect(outcome).toEqual({ moved: 1, unchanged: 0, failed: 2 });
  });
});
