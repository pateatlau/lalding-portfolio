import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../test-utils';
import userEvent from '@testing-library/user-event';
import OptionalFieldsModal from '@/components/auth/optional-fields-modal';

// Mock the server action
const mockUpdateVisitorOptionalFields = vi.fn();

vi.mock('@/actions/resume', () => ({
  updateVisitorOptionalFields: (...args: unknown[]) => mockUpdateVisitorOptionalFields(...args),
}));

// Mock react-hot-toast
const mockToastError = vi.fn();
vi.mock('react-hot-toast', () => ({
  default: {
    error: (...args: unknown[]) => mockToastError(...args),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockUpdateVisitorOptionalFields.mockResolvedValue({ error: null });
});

describe('OptionalFieldsModal', () => {
  it('renders nothing when isOpen is false', () => {
    const { container } = render(<OptionalFieldsModal isOpen={false} onComplete={vi.fn()} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders heading, inputs, and buttons when open', () => {
    render(<OptionalFieldsModal isOpen={true} onComplete={vi.fn()} />);

    expect(screen.getByText('Tell me about yourself')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Company')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Role / Title')).toBeInTheDocument();
    expect(screen.getByText('Skip')).toBeInTheDocument();
    expect(screen.getByText('Continue')).toBeInTheDocument();
  });

  it('calls onComplete when Skip is clicked', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<OptionalFieldsModal isOpen={true} onComplete={onComplete} />);

    await user.click(screen.getByText('Skip'));
    expect(onComplete).toHaveBeenCalledOnce();
    expect(mockUpdateVisitorOptionalFields).not.toHaveBeenCalled();
  });

  it('calls updateVisitorOptionalFields with field values on Continue', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<OptionalFieldsModal isOpen={true} onComplete={onComplete} />);

    await user.type(screen.getByPlaceholderText('Company'), 'Acme Corp');
    await user.type(screen.getByPlaceholderText('Role / Title'), 'Engineer');
    await user.click(screen.getByText('Continue'));

    expect(mockUpdateVisitorOptionalFields).toHaveBeenCalledWith('Acme Corp', 'Engineer');
    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledOnce();
    });
  });

  it('calls onComplete with empty fields when Continue is clicked without input', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<OptionalFieldsModal isOpen={true} onComplete={onComplete} />);

    await user.click(screen.getByText('Continue'));

    expect(mockUpdateVisitorOptionalFields).toHaveBeenCalledWith('', '');
    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledOnce();
    });
  });

  it('shows Saving... text while submitting', async () => {
    const user = userEvent.setup();
    // Make the server action hang so we can observe the loading state
    let resolveAction!: (value: { error: null }) => void;
    mockUpdateVisitorOptionalFields.mockReturnValue(
      new Promise((resolve) => {
        resolveAction = resolve;
      })
    );

    render(<OptionalFieldsModal isOpen={true} onComplete={vi.fn()} />);
    await user.click(screen.getByText('Continue'));

    expect(screen.getByText('Saving...')).toBeInTheDocument();

    // Resolve to allow cleanup
    resolveAction({ error: null });
    await waitFor(() => {
      expect(screen.getByText('Continue')).toBeInTheDocument();
    });
  });

  it('shows toast error when server action fails', async () => {
    const user = userEvent.setup();
    mockUpdateVisitorOptionalFields.mockResolvedValue({ error: 'Server error' });
    const onComplete = vi.fn();

    render(<OptionalFieldsModal isOpen={true} onComplete={onComplete} />);
    await user.click(screen.getByText('Continue'));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('Failed to save details');
    });
    // onComplete is still called even on error (modal should close)
    expect(onComplete).toHaveBeenCalledOnce();
  });
});
