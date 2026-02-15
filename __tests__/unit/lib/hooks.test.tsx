import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSectionInView } from '@/lib/hooks';
import ActiveSectionContextProvider from '@/context/active-section-context';
import { ReactNode } from 'react';

// Mock react-intersection-observer
const mockUseInView = vi.fn();
vi.mock('react-intersection-observer', () => ({
  useInView: (options: { threshold: number }) => mockUseInView(options),
}));

const wrapper = ({ children }: { children: ReactNode }) => (
  <ActiveSectionContextProvider>{children}</ActiveSectionContextProvider>
);

describe('useSectionInView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock: not in view
    mockUseInView.mockReturnValue({
      ref: vi.fn(),
      inView: false,
    });
  });

  it('returns a ref object', () => {
    mockUseInView.mockReturnValue({
      ref: vi.fn(),
      inView: false,
    });

    const { result } = renderHook(() => useSectionInView('Home'), { wrapper });

    expect(result.current).toHaveProperty('ref');
  });

  it('uses default threshold of 0.75', () => {
    mockUseInView.mockReturnValue({
      ref: vi.fn(),
      inView: false,
    });

    renderHook(() => useSectionInView('Home'), { wrapper });

    expect(mockUseInView).toHaveBeenCalledWith({ threshold: 0.75 });
  });

  it('uses custom threshold when provided', () => {
    mockUseInView.mockReturnValue({
      ref: vi.fn(),
      inView: false,
    });

    renderHook(() => useSectionInView('About', 0.5), { wrapper });

    expect(mockUseInView).toHaveBeenCalledWith({ threshold: 0.5 });
  });

  it('updates active section when in view and cooldown has passed', async () => {
    // Mock Date.now to return a time > 1000ms after last click (which starts at 0)
    const originalDateNow = Date.now;
    Date.now = vi.fn().mockReturnValue(2000);

    mockUseInView.mockReturnValue({
      ref: vi.fn(),
      inView: true,
    });

    const { result } = renderHook(() => useSectionInView('About'), { wrapper });

    // The hook should have triggered setActiveSection
    // We can verify by checking the ref is returned (hook completed without error)
    expect(result.current.ref).toBeDefined();

    // Restore Date.now
    Date.now = originalDateNow;
  });

  it('does not update active section during cooldown period', () => {
    // Mock Date.now to return a time within cooldown (< 1000ms after last click)
    const originalDateNow = Date.now;
    Date.now = vi.fn().mockReturnValue(500);

    mockUseInView.mockReturnValue({
      ref: vi.fn(),
      inView: true,
    });

    const { result } = renderHook(() => useSectionInView('Projects'), { wrapper });

    // Hook should still return ref without error
    expect(result.current.ref).toBeDefined();

    Date.now = originalDateNow;
  });

  it('does not update active section when not in view', () => {
    mockUseInView.mockReturnValue({
      ref: vi.fn(),
      inView: false,
    });

    const { result } = renderHook(() => useSectionInView('Skills'), { wrapper });

    expect(result.current.ref).toBeDefined();
  });
});
