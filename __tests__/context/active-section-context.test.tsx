import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { render, screen } from '@testing-library/react';
import ActiveSectionContextProvider, {
  useActiveSectionContext,
} from '@/context/active-section-context';
import { ReactNode } from 'react';

const wrapper = ({ children }: { children: ReactNode }) => (
  <ActiveSectionContextProvider>{children}</ActiveSectionContextProvider>
);

describe('ActiveSectionContextProvider', () => {
  it('renders children', () => {
    render(
      <ActiveSectionContextProvider>
        <div data-testid="child">Test Child</div>
      </ActiveSectionContextProvider>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('provides default activeSection as "Home"', () => {
    const { result } = renderHook(() => useActiveSectionContext(), { wrapper });

    expect(result.current.activeSection).toBe('Home');
  });

  it('provides default timeOfLastClick as 0', () => {
    const { result } = renderHook(() => useActiveSectionContext(), { wrapper });

    expect(result.current.timeOfLastClick).toBe(0);
  });

  it('allows setting activeSection', () => {
    const { result } = renderHook(() => useActiveSectionContext(), { wrapper });

    act(() => {
      result.current.setActiveSection('About');
    });

    expect(result.current.activeSection).toBe('About');
  });

  it('allows setting timeOfLastClick', () => {
    const { result } = renderHook(() => useActiveSectionContext(), { wrapper });

    act(() => {
      result.current.setTimeOfLastClick(12345);
    });

    expect(result.current.timeOfLastClick).toBe(12345);
  });

  it('supports functional updates for setActiveSection', () => {
    const { result } = renderHook(() => useActiveSectionContext(), { wrapper });

    act(() => {
      result.current.setActiveSection('Projects');
    });

    expect(result.current.activeSection).toBe('Projects');

    act(() => {
      result.current.setActiveSection((prev) => (prev === 'Projects' ? 'Skills' : 'Home'));
    });

    expect(result.current.activeSection).toBe('Skills');
  });
});

describe('useActiveSectionContext', () => {
  it('throws error when used outside provider', () => {
    // Suppress console.error for this test since we expect an error
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useActiveSectionContext());
    }).toThrow('useActiveSectionContext must be used within an ActiveSectionContextProvider');

    consoleSpy.mockRestore();
  });

  it('returns context value when used inside provider', () => {
    const { result } = renderHook(() => useActiveSectionContext(), { wrapper });

    expect(result.current).toHaveProperty('activeSection');
    expect(result.current).toHaveProperty('setActiveSection');
    expect(result.current).toHaveProperty('timeOfLastClick');
    expect(result.current).toHaveProperty('setTimeOfLastClick');
  });
});
