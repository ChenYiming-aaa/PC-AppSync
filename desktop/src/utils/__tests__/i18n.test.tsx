import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { LangProvider, useLang } from '../i18n';

function renderWithProvider(lang?: 'zh' | 'en') {
  if (lang) {
    localStorage.setItem('appsync_lang', lang);
  } else {
    localStorage.removeItem('appsync_lang');
  }
  return renderHook(() => useLang(), { wrapper: LangProvider });
}

describe('useLang', () => {
  it('returns Chinese translations by default', () => {
    const { result } = renderWithProvider();
    expect(result.current.t('nav.dashboard')).toBe('概览');
  });

  it('returns English translations when lang is en', () => {
    const { result } = renderWithProvider('en');
    expect(result.current.t('nav.dashboard')).toBe('Dashboard');
  });

  it('returns key when translation missing', () => {
    const { result } = renderWithProvider();
    expect(result.current.t('nonexistent.key')).toBe('nonexistent.key');
  });

  it('interpolates parameters', () => {
    const { result } = renderWithProvider('en');
    const output = result.current.t('downloads.matchedCount', { count: 5 });
    expect(output).toBe('Matched (5)');
  });

  it('interpolates Chinese parameters', () => {
    const { result } = renderWithProvider('zh');
    const output = result.current.t('downloads.matchedCount', { count: 3 });
    expect(output).toBe('已匹配 (3)');
  });

  it('can switch language', () => {
    const { result } = renderWithProvider('zh');
    expect(result.current.t('nav.dashboard')).toBe('概览');
    act(() => { result.current.setLang('en'); });
    expect(result.current.t('nav.dashboard')).toBe('Dashboard');
  });
});
