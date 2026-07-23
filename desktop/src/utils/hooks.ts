import { useState, useEffect, useRef } from 'react';

export function useDebounce(value: string, delay: number): string {
  const [debounced, setDebounced] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setDebounced(value), delay);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [value, delay]);
  return debounced;
}

export function parseScanTime(ts: string): Date {
  return /^\d+$/.test(ts) ? new Date(Number(ts)) : new Date(ts.replace(' ', 'T'));
}

export function fmtDate(ts: string): string {
  const d = parseScanTime(ts);
  return isNaN(d.getTime()) ? ts : d.toLocaleDateString();
}

export function fmtShort(ts: string): string {
  const d = parseScanTime(ts);
  return isNaN(d.getTime()) ? ts : d.toLocaleDateString();
}

export function fmtFull(ts: string): { date: string; time: string; full: string; fullTime: string } {
  const d = parseScanTime(ts);
  if (isNaN(d.getTime())) return { date: 'unknown', time: '', full: 'unknown', fullTime: '' };
  return {
    date: d.toLocaleDateString(),
    time: d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
    full: d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }),
    fullTime: d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  };
}
