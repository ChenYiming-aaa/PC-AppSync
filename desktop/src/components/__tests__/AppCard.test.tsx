import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AppCard } from '../AppCard';

vi.mock('../../api/scanner', () => ({
  openUrl: vi.fn(),
}));

vi.mock('../../utils/categorize', () => ({
  categorizeApp: () => ({ category: '浏览器', icon: '🌐' }),
  getAppIconUrl: () => [],
  getFallbackIcon: () => ({ bg: '#eee', icon: '🌐', color: '#333' }),
}));

vi.mock('../../utils/i18n', () => ({
  useLang: () => ({ t: (key: string) => key }),
}));

describe('AppCard', () => {
  it('renders app name and version', () => {
    render(<AppCard name="Google Chrome" version="120.0.6099" matched={true} />);
    expect(screen.getByText('Google Chrome')).toBeTruthy();
    expect(screen.getByText(/v120/)).toBeTruthy();
  });

  it('shows Official badge when matched and not community', () => {
    render(<AppCard name="Chrome" version="120" matched={true} downloadUrl="https://google.com/chrome" isCommunity={false} />);
    expect(screen.getByText('appcard.official')).toBeTruthy();
  });

  it('shows Community badge when isCommunity', () => {
    render(<AppCard name="Chrome" version="120" matched={true} isCommunity={true} />);
    expect(screen.getByText('appcard.community')).toBeTruthy();
  });

  it('shows search button when not matched and onSearch provided', () => {
    const onSearch = vi.fn();
    render(<AppCard name="Chrome" version="120" matched={false} onSearch={onSearch} />);
    const btn = screen.getByText('appcard.search');
    expect(btn).toBeTruthy();
    fireEvent.click(btn);
    expect(onSearch).toHaveBeenCalledOnce();
  });

  it('shows open button when downloadUrl provided', () => {
    render(<AppCard name="Chrome" version="120" downloadUrl="https://google.com/chrome" matched={true} />);
    expect(screen.getByText('appcard.open')).toBeTruthy();
  });

  it('shows loading placeholder when loading', () => {
    const { container } = render(<AppCard name="Chrome" version="120" loading={true} />);
    const pulse = container.querySelector('[style*="pulse"]');
    expect(pulse).toBeTruthy();
  });

  it('expands to show details', () => {
    const { container } = render(
      <AppCard
        name="Chrome"
        version="120"
        matched={true}
        publisher="Google LLC"
        installPath="C:\\Program Files\\Google\\Chrome"
        installDate="2024-01-15"
      />
    );
    expect(screen.queryByText(/Google LLC/)).toBeNull();
    const expandBtn = container.querySelector('.md-btn-icon');
    expect(expandBtn).toBeTruthy();
    fireEvent.click(expandBtn!);
    expect(screen.getByText(/Google LLC/)).toBeTruthy();
  });
});
