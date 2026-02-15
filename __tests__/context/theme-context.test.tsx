import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ThemeContextProvider, { useTheme } from '@/context/theme-context';
import { ReactNode } from 'react';

const wrapper = ({ children }: { children: ReactNode }) => (
  <ThemeContextProvider>{children}</ThemeContextProvider>
);

// Mock document.documentElement.classList
const mockClassList = {
  add: vi.fn(),
  remove: vi.fn(),
  contains: vi.fn(),
};

describe('ThemeContextProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset localStorage mock
    vi.mocked(localStorage.getItem).mockReturnValue(null);

    // Mock document.documentElement.classList
    Object.defineProperty(document.documentElement, 'classList', {
      value: mockClassList,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders children', () => {
    render(
      <ThemeContextProvider>
        <div data-testid="child">Test Child</div>
      </ThemeContextProvider>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('provides theme value', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    expect(result.current).toHaveProperty('theme');
    expect(['light', 'dark']).toContain(result.current.theme);
  });

  it('provides toggleTheme function', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    expect(result.current).toHaveProperty('toggleTheme');
    expect(typeof result.current.toggleTheme).toBe('function');
  });

  it('initializes theme from localStorage when available', async () => {
    vi.mocked(localStorage.getItem).mockReturnValue('dark');

    const { result } = renderHook(() => useTheme(), { wrapper });

    // Wait for useEffect to run
    await waitFor(() => {
      expect(localStorage.getItem).toHaveBeenCalledWith('theme');
    });
  });

  it('toggleTheme switches from light to dark', async () => {
    vi.mocked(localStorage.getItem).mockReturnValue('light');

    const { result } = renderHook(() => useTheme(), { wrapper });

    await waitFor(() => {
      expect(localStorage.getItem).toHaveBeenCalledWith('theme');
    });

    act(() => {
      result.current.toggleTheme();
    });

    expect(localStorage.setItem).toHaveBeenCalledWith('theme', 'dark');
  });

  it('toggleTheme updates localStorage', async () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    act(() => {
      result.current.toggleTheme();
    });

    expect(localStorage.setItem).toHaveBeenCalled();
  });
});

describe('useTheme', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(document.documentElement, 'classList', {
      value: mockClassList,
      writable: true,
      configurable: true,
    });
  });

  it('throws error when used outside provider', () => {
    // Suppress console.error for this test since we expect an error
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useTheme());
    }).toThrow('useTheme must be used within a ThemeContextProvider');

    consoleSpy.mockRestore();
  });

  it('returns context value when used inside provider', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    expect(result.current).toHaveProperty('theme');
    expect(result.current).toHaveProperty('toggleTheme');
  });
});

describe('Theme toggle button integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(document.documentElement, 'classList', {
      value: mockClassList,
      writable: true,
      configurable: true,
    });
  });

  it('can be used in a component', async () => {
    const user = userEvent.setup();

    function TestComponent() {
      const { theme, toggleTheme } = useTheme();
      return (
        <button onClick={toggleTheme} data-testid="toggle">
          Current theme: {theme}
        </button>
      );
    }

    render(
      <ThemeContextProvider>
        <TestComponent />
      </ThemeContextProvider>
    );

    const button = screen.getByTestId('toggle');
    expect(button).toBeInTheDocument();

    await user.click(button);

    // localStorage.setItem should have been called
    expect(localStorage.setItem).toHaveBeenCalled();
  });
});
