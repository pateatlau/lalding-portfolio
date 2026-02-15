import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSectionInView } from '@/lib/hooks';
import { useActiveSectionContext } from '@/context/active-section-context';
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

  afterEach(() => {
    vi.restoreAllMocks();
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

  it('updates active section when in view and cooldown has passed', () => {
    vi.spyOn(Date, 'now').mockReturnValue(2000);

    mockUseInView.mockReturnValue({
      ref: vi.fn(),
      inView: true,
    });

    const { result } = renderHook(
      () => ({
        section: useSectionInView('About'),
        context: useActiveSectionContext(),
      }),
      { wrapper }
    );

    expect(result.current.context.activeSection).toBe('About');
  });

  it('does not update active section during cooldown period', () => {
    vi.spyOn(Date, 'now').mockReturnValue(500);

    mockUseInView.mockReturnValue({
      ref: vi.fn(),
      inView: true,
    });

    const { result } = renderHook(
      () => ({
        section: useSectionInView('Projects'),
        context: useActiveSectionContext(),
      }),
      { wrapper }
    );

    // timeOfLastClick defaults to 0, Date.now() returns 500, cooldown is 1000ms
    // 500 - 0 = 500 < 1000, so section should NOT update
    expect(result.current.context.activeSection).toBe('Home');
  });

  it('does not update active section when not in view', () => {
    mockUseInView.mockReturnValue({
      ref: vi.fn(),
      inView: false,
    });

    const { result } = renderHook(
      () => ({
        section: useSectionInView('Skills'),
        context: useActiveSectionContext(),
      }),
      { wrapper }
    );

    expect(result.current.context.activeSection).toBe('Home');
  });
});
