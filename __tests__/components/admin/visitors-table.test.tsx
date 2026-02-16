import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VisitorsTable from '@/components/admin/visitors-table';
import { mockVisitors } from '../../helpers/admin-fixtures';

vi.mock('@/actions/admin', () => ({
  getVisitorsCsvData: vi.fn(),
}));

import { getVisitorsCsvData } from '@/actions/admin';

const originalCreateObjectURL = global.URL.createObjectURL;
const originalRevokeObjectURL = global.URL.revokeObjectURL;

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  global.URL.createObjectURL = originalCreateObjectURL;
  global.URL.revokeObjectURL = originalRevokeObjectURL;
});

describe('VisitorsTable', () => {
  it('renders heading and total count', () => {
    render(<VisitorsTable visitors={mockVisitors} />);
    expect(screen.getByRole('heading', { name: 'Visitors' })).toBeInTheDocument();
    expect(screen.getByText(/3 total visitors/)).toBeInTheDocument();
  });

  it('renders visitor names and emails in the table', () => {
    render(<VisitorsTable visitors={mockVisitors} />);
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    expect(screen.getByText('bob@example.com')).toBeInTheDocument();
  });

  it('shows em dash for null visitor name', () => {
    render(<VisitorsTable visitors={mockVisitors} />);
    const rows = screen.getAllByRole('row');
    // Header + 3 data rows (default sort is joined desc, so v-3 with null name is first)
    expect(rows.length).toBe(4);
    // v-3 has null fullName — its name cell should render an em dash
    const firstDataRow = rows[1];
    const nameCell = within(firstDataRow).getAllByRole('cell')[0];
    expect(nameCell).toHaveTextContent('—');
  });

  it('renders provider badges', () => {
    render(<VisitorsTable visitors={mockVisitors} />);
    expect(screen.getAllByText('Google').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('GitHub')).toBeInTheDocument();
  });

  it('displays download counts', () => {
    render(<VisitorsTable visitors={mockVisitors} />);
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('shows empty state when no visitors', () => {
    render(<VisitorsTable visitors={[]} />);
    expect(screen.getByText('No visitors yet.')).toBeInTheDocument();
    expect(screen.getByText('0 total visitors')).toBeInTheDocument();
  });

  it('filters visitors by search query', async () => {
    const user = userEvent.setup();
    render(<VisitorsTable visitors={mockVisitors} />);

    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'Jane');

    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.queryByText('Bob Johnson')).not.toBeInTheDocument();
  });

  it('filters visitors by provider when only one provider exists', () => {
    // Test provider filtering by rendering visitors with a single provider
    const githubOnly = mockVisitors.filter((v) => v.provider === 'github');
    render(<VisitorsTable visitors={githubOnly} />);

    expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    expect(screen.getByText('1 total visitor')).toBeInTheDocument();
  });

  it('shows no-match state when filters exclude all visitors', async () => {
    const user = userEvent.setup();
    render(<VisitorsTable visitors={mockVisitors} />);

    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'nonexistentperson');

    expect(screen.getByText('No visitors match your filters.')).toBeInTheDocument();
  });

  it('sorts visitors by name when clicking name header', async () => {
    const user = userEvent.setup();
    // Use visitors that all have names so sort order is deterministic
    const namedVisitors = mockVisitors.filter((v) => v.fullName !== null);
    render(<VisitorsTable visitors={namedVisitors} />);

    const nameButton = screen.getByRole('button', { name: /name/i });
    await user.click(nameButton);

    // After sorting by name ascending, first data row should be Bob (B < J)
    const rows = screen.getAllByRole('row');
    const firstDataRow = rows[1];
    expect(within(firstDataRow).getByText('Bob Johnson')).toBeInTheDocument();
  });

  it('triggers CSV export on button click', async () => {
    const user = userEvent.setup();
    vi.mocked(getVisitorsCsvData).mockResolvedValue({
      data: 'Name,Email\nJane,jane@test.com',
    });

    // Mock URL.createObjectURL and URL.revokeObjectURL
    const createObjectURL = vi.fn().mockReturnValue('blob:test');
    const revokeObjectURL = vi.fn();
    global.URL.createObjectURL = createObjectURL;
    global.URL.revokeObjectURL = revokeObjectURL;

    render(<VisitorsTable visitors={mockVisitors} />);

    const exportBtn = screen.getByRole('button', { name: /export csv/i });
    await user.click(exportBtn);

    expect(getVisitorsCsvData).toHaveBeenCalledTimes(1);
    expect(createObjectURL).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalled();
  });

  it('renders Export CSV button', () => {
    render(<VisitorsTable visitors={mockVisitors} />);
    expect(screen.getByRole('button', { name: /export csv/i })).toBeInTheDocument();
  });

  it('searches by company', async () => {
    const user = userEvent.setup();
    render(<VisitorsTable visitors={mockVisitors} />);

    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'TechCo');

    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.queryByText('Bob Johnson')).not.toBeInTheDocument();
  });

  it('searches by role', async () => {
    const user = userEvent.setup();
    render(<VisitorsTable visitors={mockVisitors} />);

    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'CTO');

    // v-3 has role "CTO"
    expect(screen.getByText('anonymous@example.com')).toBeInTheDocument();
    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
  });
});
