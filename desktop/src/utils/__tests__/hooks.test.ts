import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { parseScanTime, fmtShort, fmtFull, useDebounce } from '../hooks';

describe('parseScanTime', () => {
  it('parses millisecond string', () => {
    const d = parseScanTime('1721721600000');
    expect(d.getTime()).toBe(1721721600000);
  });

  it('parses ISO string', () => {
    const d = parseScanTime('2024-07-23T10:00:00.000Z');
    expect(d.getTime()).toBe(1721728800000);
  });

  it('parses SQLite datetime format', () => {
    const d = parseScanTime('2024-07-23 10:00:00');
    expect(d.getFullYear()).toBe(2024);
    expect(d.getMonth()).toBe(6); // 0-indexed
    expect(d.getDate()).toBe(23);
    expect(d.getHours()).toBe(10);
    expect(d.getMinutes()).toBe(0);
  });

  it('returns invalid date for garbage input', () => {
    const d = parseScanTime('not-a-date');
    expect(isNaN(d.getTime())).toBe(true);
  });
});

describe('fmtShort', () => {
  it('formats a valid timestamp', () => {
    const result = fmtShort('1721721600000');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns raw string for invalid date', () => {
    const result = fmtShort('garbage');
    expect(result).toBe('garbage');
  });
});

describe('fmtFull', () => {
  it('returns all fields for valid timestamp', () => {
    const result = fmtFull('1721721600000');
    expect(result).toHaveProperty('date');
    expect(result).toHaveProperty('time');
    expect(result).toHaveProperty('full');
    expect(result).toHaveProperty('fullTime');
    expect(typeof result.date).toBe('string');
  });

  it('returns unknown for invalid date', () => {
    const result = fmtFull('garbage');
    expect(result.date).toBe('unknown');
  });
});

describe('useDebounce', () => {
  it('returns initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('hello', 200));
    expect(result.current).toBe('hello');
  });

  it('updates after delay', async () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'hello', delay: 200 } }
    );
    expect(result.current).toBe('hello');

    rerender({ value: 'world', delay: 200 });
    expect(result.current).toBe('hello');

    act(() => { vi.advanceTimersByTime(200); });
    expect(result.current).toBe('world');

    vi.useRealTimers();
  });

  it('cleans up timer on unmount', () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
    const { unmount } = renderHook(() => useDebounce('test', 200));
    unmount();
    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });
});
