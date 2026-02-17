import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../../test-utils';
import userEvent from '@testing-library/user-event';
import LoginModal from '@/components/auth/login-modal';

// Mock the auth context
const mockSignInWithProvider = vi.fn();

vi.mock('@/context/auth-context', () => ({
  useAuth: () => ({
    signInWithProvider: mockSignInWithProvider,
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe('LoginModal', () => {
  it('renders nothing when isOpen is false', () => {
    const { container } = render(<LoginModal isOpen={false} onClose={vi.fn()} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders heading and social login buttons when open', () => {
    render(<LoginModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText('Sign in to download')).toBeInTheDocument();
    expect(screen.getByText('Continue with Google')).toBeInTheDocument();
    expect(screen.getByText('Continue with GitHub')).toBeInTheDocument();
    expect(screen.getByText('Continue with LinkedIn')).toBeInTheDocument();
  });

  it('renders Cancel button', () => {
    render(<LoginModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('calls onClose when Cancel is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<LoginModal isOpen={true} onClose={onClose} />);

    await user.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when backdrop is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const { container } = render(<LoginModal isOpen={true} onClose={onClose} />);

    // The backdrop is the first child div (fixed inset-0)
    const backdrop = container.querySelector('[class*="fixed inset-0"]');
    expect(backdrop).not.toBeNull();
    await user.click(backdrop!);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls signInWithProvider with "google" when Google button is clicked', async () => {
    const user = userEvent.setup();
    render(<LoginModal isOpen={true} onClose={vi.fn()} />);

    await user.click(screen.getByText('Continue with Google'));
    expect(mockSignInWithProvider).toHaveBeenCalledWith('google');
  });

  it('calls signInWithProvider with "github" when GitHub button is clicked', async () => {
    const user = userEvent.setup();
    render(<LoginModal isOpen={true} onClose={vi.fn()} />);

    await user.click(screen.getByText('Continue with GitHub'));
    expect(mockSignInWithProvider).toHaveBeenCalledWith('github');
  });

  it('calls signInWithProvider with "linkedin_oidc" when LinkedIn button is clicked', async () => {
    const user = userEvent.setup();
    render(<LoginModal isOpen={true} onClose={vi.fn()} />);

    await user.click(screen.getByText('Continue with LinkedIn'));
    expect(mockSignInWithProvider).toHaveBeenCalledWith('linkedin_oidc');
  });

  it('stores pendingAction in localStorage on login', async () => {
    const user = userEvent.setup();
    render(<LoginModal isOpen={true} onClose={vi.fn()} />);

    await user.click(screen.getByText('Continue with Google'));
    expect(localStorage.setItem).toHaveBeenCalledWith('pendingAction', 'download_resume');
  });
});
