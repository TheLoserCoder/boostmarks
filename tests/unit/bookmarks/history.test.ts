import { describe, expect, it } from 'vitest';
import { canGoBack, canGoForward, emptyHistory, goBack, goForward, visit } from '../../../app/features/bookmarks/domain/history';

describe('navigation history', () => {
  it('starts empty and cannot move', () => {
    expect(canGoBack(emptyHistory)).toBe(false);
    expect(canGoForward(emptyHistory)).toBe(false);
    expect(goBack(emptyHistory, 'a')).toBeNull();
    expect(goForward(emptyHistory, 'a')).toBeNull();
  });

  it('records Home as a real entry and clears the forward stack when opening a folder', () => {
    const opened = visit(emptyHistory, null, 'a');
    expect(opened.past).toEqual([null]);
    expect(opened.future).toEqual([]);
    expect(canGoBack(opened)).toBe(true);
  });

  it('returns from a folder to Home with the forward stack intact', () => {
    const opened = visit(emptyHistory, null, 'a');
    const home = goBack(opened, 'a');
    expect(home?.id).toBeNull();
    expect(home?.history.past).toEqual([]);
    expect(home?.history.future).toEqual(['a']);
    expect(canGoForward(home!.history)).toBe(true);
  });

  it('ignores visiting the view that is already open', () => {
    expect(visit(emptyHistory, null, null).past).toEqual([]);
    expect(visit(visit(emptyHistory, null, 'a'), 'a', 'a').past).toEqual([null]);
  });

  it('walks back and forward, clearing the opposite stack when a new view is visited', () => {
    const abc = visit(visit(visit(emptyHistory, null, 'a'), 'a', 'b'), 'b', 'c');
    expect(abc.past).toEqual([null, 'a', 'b']);

    const back = goBack(abc, 'c');
    expect(back?.id).toBe('b');
    expect(back?.history.past).toEqual([null, 'a']);
    expect(back?.history.future).toEqual(['c']);

    const forward = goForward(back!.history, 'b');
    expect(forward?.id).toBe('c');
    expect(forward?.history.past).toEqual([null, 'a', 'b']);

    const branched = visit(back!.history, 'b', 'x');
    expect(branched.future).toEqual([]);
    expect(branched.past).toEqual([null, 'a', 'b']);
  });

  it('keeps only the most recent 50 entries', () => {
    let history = emptyHistory;
    for (let index = 0; index < 60; index += 1) {
      history = visit(history, String(index), String(index + 1));
    }
    expect(history.past).toHaveLength(50);
    expect(history.past[0]).toBe('10');
  });
});
