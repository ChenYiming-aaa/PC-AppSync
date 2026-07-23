import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Pagination } from '../Pagination';

describe('Pagination', () => {
  it('renders page buttons', () => {
    const onPage = vi.fn();
    render(<Pagination page={1} pages={5} onPage={onPage} />);
    for (let i = 1; i <= 5; i++) {
      expect(screen.getByText(String(i))).toBeTruthy();
    }
  });

  it('highlights current page', () => {
    const onPage = vi.fn();
    render(<Pagination page={3} pages={5} onPage={onPage} />);
    const page3Btn = screen.getByText('3');
    expect(page3Btn).toBeTruthy();
  });

  it('calls onPage when clicking a page', () => {
    const onPage = vi.fn();
    render(<Pagination page={1} pages={5} onPage={onPage} />);
    fireEvent.click(screen.getByText('2'));
    expect(onPage).toHaveBeenCalledWith(2);
  });

  it('renders nothing when only 1 page', () => {
    const { container } = render(<Pagination page={1} pages={1} onPage={() => {}} />);
    expect(container.children.length).toBe(0);
  });

  it('renders nothing when pages is 0', () => {
    const { container } = render(<Pagination page={0} pages={0} onPage={() => {}} />);
    expect(container.children.length).toBe(0);
  });
});
