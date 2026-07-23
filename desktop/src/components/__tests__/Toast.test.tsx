import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { toast, ToastContainer } from '../Toast';

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows a toast message', () => {
    render(<ToastContainer />);
    act(() => { toast('Hello World', 'info'); });
    expect(screen.getByText('Hello World')).toBeTruthy();
  });

  it('shows success toast', () => {
    render(<ToastContainer />);
    act(() => { toast('Success!', 'success'); });
    expect(screen.getByText('Success!')).toBeTruthy();
  });

  it('shows error toast', () => {
    render(<ToastContainer />);
    act(() => { toast('Error!', 'error'); });
    expect(screen.getByText('Error!')).toBeTruthy();
  });

  it('auto-dismisses after timeout', () => {
    render(<ToastContainer />);
    act(() => { toast('Auto Dismiss', 'info'); });
    expect(screen.getByText('Auto Dismiss')).toBeTruthy();
    act(() => { vi.advanceTimersByTime(4000); });
    expect(screen.queryByText('Auto Dismiss')).toBeNull();
  });

  it('stacks multiple toasts', () => {
    render(<ToastContainer />);
    act(() => { toast('First', 'info'); });
    act(() => { toast('Second', 'info'); });
    expect(screen.getByText('First')).toBeTruthy();
    expect(screen.getByText('Second')).toBeTruthy();
  });
});
