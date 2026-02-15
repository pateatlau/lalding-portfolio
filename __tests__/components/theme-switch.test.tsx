import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ThemeSwitch from '@/components/theme-switch';
import ThemeContextProvider from '@/context/theme-context';

// Mock document.documentElement.classList
const mockClassList = {
  add: vi.fn(),
  remove: vi.fn(),
  contains: vi.fn(),
};

describe('ThemeSwitch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(localStorage.getItem).mockReturnValue(null);
    Object.defineProperty(document.documentElement, 'classList', {
      value: mockClassList,
      writable: true,
      configurable: true,
    });
  });

  it('renders a button', () => {
    render(
      <ThemeContextProvider>
        <ThemeSwitch />
      </ThemeContextProvider>
    );

    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('has correct aria-label for light mode', () => {
    vi.mocked(localStorage.getItem).mockReturnValue('light');

    render(
      <ThemeContextProvider>
        <ThemeSwitch />
      </ThemeContextProvider>
    );

    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Switch to dark mode');
  });

  it('calls toggleTheme when clicked', async () => {
    const user = userEvent.setup();

    render(
      <ThemeContextProvider>
        <ThemeSwitch />
      </ThemeContextProvider>
    );

    const button = screen.getByRole('button');
    await user.click(button);

    // localStorage.setItem should be called when toggling
    expect(localStorage.setItem).toHaveBeenCalled();
  });

  it('has correct title attribute', () => {
    render(
      <ThemeContextProvider>
        <ThemeSwitch />
      </ThemeContextProvider>
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('title');
  });

  it('contains an icon', () => {
    render(
      <ThemeContextProvider>
        <ThemeSwitch />
      </ThemeContextProvider>
    );

    // The button should contain an SVG icon (either BsSun or BsMoon)
    const button = screen.getByRole('button');
    expect(button.querySelector('svg')).toBeInTheDocument();
  });
});
