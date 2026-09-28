import { createContext, useContext } from 'react';
import type { DropKind } from '../domain/dropTarget';

/** UI-side mirror of the move rules so drop targets can show allowed/forbidden states. */
export interface DropRules {
  /** The ids a drag that started at `draggedId` would move: the whole selection when it contains the row. */
  idsFor: (draggedId: string) => readonly string[];
  /** True only when every id in the group can land on the target. */
  canDrop: (ids: readonly string[], kind: DropKind, targetId: string) => boolean;
}

const DEFAULT_RULES: DropRules = { idsFor: id => [id], canDrop: () => false };

export const DropRulesContext = createContext<DropRules>(DEFAULT_RULES);

export function useDropRules(): DropRules {
  return useContext(DropRulesContext);
}
