import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import SubmitBtn from '@/components/submit-btn';

// Mock useFormStatus
const mockUseFormStatus = vi.fn();
vi.mock('react-dom', async () => {
  const actual = await vi.importActual('react-dom');
  return {
    ...actual,
    useFormStatus: () => mockUseFormStatus(),
  };
});

describe('SubmitBtn', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseFormStatus.mockReturnValue({ pending: false });
  });

  it('renders a submit button', () => {
    render(<SubmitBtn />);

    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });

  it('displays "Submit" text when not pending', () => {
    mockUseFormStatus.mockReturnValue({ pending: false });

    render(<SubmitBtn />);

    expect(screen.getByRole('button')).toHaveTextContent('Submit');
  });

  it('is not disabled when not pending', () => {
    mockUseFormStatus.mockReturnValue({ pending: false });

    render(<SubmitBtn />);

    expect(screen.getByRole('button')).not.toBeDisabled();
  });

  it('is disabled when pending', () => {
    mockUseFormStatus.mockReturnValue({ pending: true });

    render(<SubmitBtn />);

    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('shows loading spinner when pending', () => {
    mockUseFormStatus.mockReturnValue({ pending: true });

    render(<SubmitBtn />);

    // When pending, the button should have a spinner div instead of "Submit" text
    const button = screen.getByRole('button');
    expect(button).not.toHaveTextContent('Submit');
    // Check for the spinner div with animate-spin class
    expect(button.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('has correct aria-label when not pending', () => {
    mockUseFormStatus.mockReturnValue({ pending: false });

    render(<SubmitBtn />);

    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Submit contact form');
  });

  it('has correct aria-label when pending', () => {
    mockUseFormStatus.mockReturnValue({ pending: true });

    render(<SubmitBtn />);

    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Sending message...');
  });

  it('has a title attribute', () => {
    render(<SubmitBtn />);

    expect(screen.getByRole('button')).toHaveAttribute(
      'title',
      'Submit your message to my email address'
    );
  });

  it('contains paper plane icon when not pending', () => {
    mockUseFormStatus.mockReturnValue({ pending: false });

    render(<SubmitBtn />);

    // The button should contain an SVG icon (FaPaperPlane)
    const button = screen.getByRole('button');
    expect(button.querySelector('svg')).toBeInTheDocument();
  });
});
