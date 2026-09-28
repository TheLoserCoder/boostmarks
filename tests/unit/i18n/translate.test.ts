import { describe, expect, it } from 'vitest';
import { createTranslator } from '../../../app/features/i18n/translate';
import { en, ru } from '../../../app/features/i18n/messages';

describe('createTranslator', () => {
  it('returns Russian strings with interpolated params', () => {
    const { t } = createTranslator('ru');
    expect(t('nav.back')).toBe('Назад');
    expect(t('search.found', { count: 3 })).toBe('Найдено: 3');
  });

  it('translates to English', () => {
    const { t } = createTranslator('en');
    expect(t('nav.back')).toBe('Back');
    expect(t('menu.createIn', { title: 'Work' })).toBe('Create a folder in “Work”');
  });

  it('covers every Russian key in the English dictionary', () => {
    for (const key of Object.keys(ru)) {
      expect(en[key as keyof typeof en], key).toBeDefined();
    }
  });

  it('picks Russian plural categories, including the awkward teens', () => {
    const { plural } = createTranslator('ru');
    expect(plural('item.noun', 1)).toBe('элемент');
    expect(plural('item.noun', 2)).toBe('элемента');
    expect(plural('item.noun', 4)).toBe('элемента');
    expect(plural('item.noun', 5)).toBe('элементов');
    expect(plural('item.noun', 11)).toBe('элементов');
    expect(plural('item.noun', 21)).toBe('элемент');
    expect(plural('item.noun', 112)).toBe('элементов');
    expect(plural('home.childCount', 0)).toBe('0 элементов');
    expect(plural('home.childCount', 2)).toBe('2 элемента');
  });

  it('picks English plural categories', () => {
    const { plural } = createTranslator('en');
    expect(plural('item.noun', 1)).toBe('item');
    expect(plural('item.noun', 2)).toBe('items');
    expect(plural('home.childCount', 1)).toBe('1 item');
    expect(plural('home.childCount', 5)).toBe('5 items');
  });
});
