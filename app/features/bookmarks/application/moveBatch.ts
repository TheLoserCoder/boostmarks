import type { BookmarkCommands } from './ports';
import type { DropKind } from '../domain/dropTarget';

export interface MoveBatchOutcome {
  moved: number;
  unchanged: number;
  failed: number;
}

/**
 * Sequential group move for a multi-selection. Items travel in their current
 * order, so their relative order is preserved; `unchanged` is kept apart from
 * real failures because a positional group may legitimately skip a row that is
 * already in place.
 */
export async function moveBatch(
  commands: BookmarkCommands,
  ids: readonly string[],
  kind: DropKind,
  targetId: string,
): Promise<MoveBatchOutcome> {
  let moved = 0;
  let unchanged = 0;
  let failed = 0;

  for (const id of ids) {
    const result = kind === 'before'
      ? await commands.moveBefore(id, targetId)
      : await commands.move(id, targetId);
    if (result.ok) moved += 1;
    else if (result.reason === 'unchanged') unchanged += 1;
    else failed += 1;
  }

  return { moved, unchanged, failed };
}

/** Russian count forms: 1 элемент, 2 элемента, 5 элементов. */
export function pluralRu(count: number, forms: readonly [string, string, string]): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
  return forms[2];
}
