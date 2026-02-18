import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AtsCheckerPanel from '@/components/admin/resume-builder/ats-checker-panel';
import { mockResumeConfig } from '../../helpers/admin-fixtures';
import type { AtsCheckResult } from '@/lib/resume-builder/ats-checker';
import type { ResumeConfig } from '@/lib/supabase/types';

vi.mock('@/actions/resume-builder', () => ({
  runAtsCheck: vi.fn(),
}));

import { runAtsCheck } from '@/actions/resume-builder';

beforeEach(() => {
  vi.clearAllMocks();
});

const mockResult: AtsCheckResult = {
  score: 78,
  categories: [
    {
      category: 'parsability',
      label: 'Parsability',
      passed: 5,
      warned: 2,
      failed: 0,
      total: 7,
      checks: [
        {
          id: 'P1',
          category: 'parsability',
          name: 'Contact info present',
          status: 'pass',
          message: 'Email, phone, and location are all present.',
        },
        {
          id: 'P2',
          category: 'parsability',
          name: 'Standard section headings',
          status: 'pass',
          message: 'All section headings are ATS-recognized.',
        },
        {
          id: 'P3',
          category: 'parsability',
          name: 'Date format consistency',
          status: 'pass',
          message: 'All dates use a consistent, recognized format.',
        },
        {
          id: 'P4',
          category: 'parsability',
          name: 'No empty sections',
          status: 'pass',
          message: 'All sections contain at least one item.',
        },
        {
          id: 'P5',
          category: 'parsability',
          name: 'Summary present',
          status: 'warning',
          message: 'No summary/objective found.',
        },
        {
          id: 'P6',
          category: 'parsability',
          name: 'Template ATS safety',
          status: 'pass',
          message: 'Template uses ATS-safe HTML elements.',
        },
        {
          id: 'P7',
          category: 'parsability',
          name: 'No header/footer content',
          status: 'warning',
          message: 'Fixed or absolutely positioned elements detected.',
          details: ['Found position: absolute outside small container'],
        },
      ],
    },
    {
      category: 'readability',
      label: 'Readability & Structure',
      passed: 4,
      warned: 3,
      failed: 0,
      total: 7,
      checks: [
        {
          id: 'R1',
          category: 'readability',
          name: 'Bullet point length',
          status: 'pass',
          message: 'All bullet points are within the ideal range.',
        },
        {
          id: 'R2',
          category: 'readability',
          name: 'Quantified achievements',
          status: 'warning',
          message: 'Only 10% of bullets contain metrics.',
        },
        {
          id: 'R3',
          category: 'readability',
          name: 'Section count',
          status: 'pass',
          message: 'Resume has 3 sections.',
        },
        {
          id: 'R4',
          category: 'readability',
          name: 'Experience section position',
          status: 'pass',
          message: 'Experience section is at position 1.',
        },
        {
          id: 'R5',
          category: 'readability',
          name: 'Skills density',
          status: 'pass',
          message: '15 skills listed.',
        },
        {
          id: 'R6',
          category: 'readability',
          name: 'Summary length',
          status: 'warning',
          message: 'Summary is 50 characters — too short.',
        },
        {
          id: 'R7',
          category: 'readability',
          name: 'Action verbs in bullets',
          status: 'warning',
          message: 'Only 40% of bullets start with action verbs.',
          details: ['"Worked on frontend" — Dev', '"Was responsible for backend" — Dev'],
        },
      ],
    },
    {
      category: 'format',
      label: 'Format Compliance',
      passed: 3,
      warned: 1,
      failed: 0,
      total: 4,
      checks: [
        {
          id: 'F1',
          category: 'format',
          name: 'Font is web-safe/embeddable',
          status: 'pass',
          message: '"Open Sans" is a safe font.',
        },
        {
          id: 'F2',
          category: 'format',
          name: 'Font size readable',
          status: 'pass',
          message: 'Font size 10pt is within the ideal range.',
        },
        {
          id: 'F3',
          category: 'format',
          name: 'Page length estimate',
          status: 'pass',
          message: 'Content length should fit within a single page.',
        },
        {
          id: 'F4',
          category: 'format',
          name: 'Special characters',
          status: 'warning',
          message: 'Non-standard Unicode characters detected.',
          details: ['2 fancy quote(s) found'],
        },
      ],
    },
  ],
  totalPassed: 12,
  totalWarned: 6,
  totalFailed: 0,
  totalChecks: 18,
  checkedAt: '2025-06-15T12:00:00.000Z',
};

const mockResultWithKeywords: AtsCheckResult = {
  ...mockResult,
  score: 72,
  categories: [
    ...mockResult.categories.slice(0, 1),
    {
      category: 'keywords',
      label: 'Keyword Optimization',
      passed: 1,
      warned: 2,
      failed: 0,
      total: 3,
      checks: [
        {
          id: 'K1',
          category: 'keywords',
          name: 'JD keyword coverage',
          status: 'pass',
          message: 'Keyword coverage is 75%.',
        },
        {
          id: 'K2',
          category: 'keywords',
          name: 'Missing keywords',
          status: 'warning',
          message: '2 keyword(s) from the job description are missing.',
          details: ['Go', 'Rust'],
        },
        {
          id: 'K3',
          category: 'keywords',
          name: 'Keywords in summary',
          status: 'warning',
          message: 'Only 1 matched keyword(s) in the summary.',
        },
      ],
    },
    ...mockResult.categories.slice(1),
  ],
  totalPassed: 13,
  totalWarned: 8,
  totalFailed: 0,
  totalChecks: 21,
};

const mockResultWithFailure: AtsCheckResult = {
  ...mockResult,
  score: 50,
  categories: [
    {
      ...mockResult.categories[0],
      failed: 1,
      passed: 4,
      checks: [
        ...mockResult.categories[0].checks.slice(0, 3),
        {
          id: 'P4',
          category: 'parsability',
          name: 'No empty sections',
          status: 'fail',
          message: '1 section(s) have no items.',
          details: ['"Experience" is empty'],
        },
        ...mockResult.categories[0].checks.slice(4),
      ],
    },
    ...mockResult.categories.slice(1),
  ],
  totalFailed: 1,
  totalPassed: 11,
};

describe('AtsCheckerPanel', () => {
  it('renders the run button', () => {
    render(<AtsCheckerPanel config={mockResumeConfig as ResumeConfig} />);
    expect(screen.getByRole('button', { name: /run ats check/i })).toBeInTheDocument();
  });

  it('shows keyword notice when no JD analysis', () => {
    render(<AtsCheckerPanel config={mockResumeConfig as ResumeConfig} />);
    expect(screen.getByText(/run jd analysis/i)).toBeInTheDocument();
  });

  it('hides keyword notice when JD analysis is present', () => {
    const configWithJd = {
      ...mockResumeConfig,
      jd_analysis: { matchedKeywords: ['React'], missingKeywords: [], suggestions: [] },
    };
    render(<AtsCheckerPanel config={configWithJd as ResumeConfig} />);
    expect(screen.queryByText(/run jd analysis/i)).not.toBeInTheDocument();
  });

  it('calls runAtsCheck and displays results', async () => {
    const user = userEvent.setup();
    vi.mocked(runAtsCheck).mockResolvedValueOnce({ data: mockResult });

    render(<AtsCheckerPanel config={mockResumeConfig as ResumeConfig} />);
    await user.click(screen.getByRole('button', { name: /run ats check/i }));

    await waitFor(() => {
      expect(screen.getByTestId('ats-score')).toHaveTextContent('78%');
    });

    // Summary badges
    expect(screen.getByText(/12 passed/)).toBeInTheDocument();
    expect(screen.getByText(/6 warnings/)).toBeInTheDocument();
    expect(screen.getByText(/0 failed/)).toBeInTheDocument();

    // Category cards
    expect(screen.getByText('Parsability')).toBeInTheDocument();
    expect(screen.getByText('Readability & Structure')).toBeInTheDocument();
    expect(screen.getByText('Format Compliance')).toBeInTheDocument();
  });

  it('auto-expands categories with warnings or failures', async () => {
    const user = userEvent.setup();
    vi.mocked(runAtsCheck).mockResolvedValueOnce({ data: mockResult });

    render(<AtsCheckerPanel config={mockResumeConfig as ResumeConfig} />);
    await user.click(screen.getByRole('button', { name: /run ats check/i }));

    await waitFor(() => {
      expect(screen.getByTestId('ats-score')).toBeInTheDocument();
    });

    // Categories with warnings should be expanded — check items visible
    expect(screen.getByText('Contact info present')).toBeInTheDocument();
    expect(screen.getByText('Bullet point length')).toBeInTheDocument();
  });

  it('toggles category expansion on click', async () => {
    const user = userEvent.setup();
    vi.mocked(runAtsCheck).mockResolvedValueOnce({ data: mockResult });

    render(<AtsCheckerPanel config={mockResumeConfig as ResumeConfig} />);
    await user.click(screen.getByRole('button', { name: /run ats check/i }));

    await waitFor(() => {
      expect(screen.getByTestId('ats-score')).toBeInTheDocument();
    });

    // Parsability is auto-expanded (has warnings) — collapse it
    const parsabilityHeader = screen.getByRole('button', { name: /parsability category/i });
    await user.click(parsabilityHeader);

    // Check items should be hidden
    expect(screen.queryByText('Contact info present')).not.toBeInTheDocument();

    // Click again to re-expand
    await user.click(parsabilityHeader);
    expect(screen.getByText('Contact info present')).toBeInTheDocument();
  });

  it('shows error message when check fails', async () => {
    const user = userEvent.setup();
    vi.mocked(runAtsCheck).mockResolvedValueOnce({ error: 'Resume config not found' });

    render(<AtsCheckerPanel config={mockResumeConfig as ResumeConfig} />);
    await user.click(screen.getByRole('button', { name: /run ats check/i }));

    await waitFor(() => {
      expect(screen.getByText('Resume config not found')).toBeInTheDocument();
    });
  });

  it('displays check details when expanded', async () => {
    const user = userEvent.setup();
    vi.mocked(runAtsCheck).mockResolvedValueOnce({ data: mockResult });

    render(<AtsCheckerPanel config={mockResumeConfig as ResumeConfig} />);
    await user.click(screen.getByRole('button', { name: /run ats check/i }));

    await waitFor(() => {
      expect(screen.getByTestId('ats-score')).toBeInTheDocument();
    });

    // P7 has details — find and click "Show details"
    const showDetailsButtons = screen.getAllByText(/show details/i);
    await user.click(showDetailsButtons[0]);

    expect(
      screen.getByText('Found position: absolute outside small container')
    ).toBeInTheDocument();
  });

  it('shows correct score color coding', async () => {
    const user = userEvent.setup();

    // Green >= 80
    const highScoreResult = { ...mockResult, score: 85 };
    vi.mocked(runAtsCheck).mockResolvedValueOnce({ data: highScoreResult });

    render(<AtsCheckerPanel config={mockResumeConfig as ResumeConfig} />);
    await user.click(screen.getByRole('button', { name: /run ats check/i }));

    await waitFor(() => {
      const score = screen.getByTestId('ats-score');
      expect(score).toHaveTextContent('85%');
      expect(score).toHaveClass('text-green-600');
    });
  });

  it('renders keyword category when JD analysis results include keywords', async () => {
    const user = userEvent.setup();
    vi.mocked(runAtsCheck).mockResolvedValueOnce({ data: mockResultWithKeywords });

    const configWithJd = {
      ...mockResumeConfig,
      jd_analysis: { matchedKeywords: ['React'], missingKeywords: ['Go'], suggestions: [] },
    };

    render(<AtsCheckerPanel config={configWithJd as ResumeConfig} />);
    await user.click(screen.getByRole('button', { name: /run ats check/i }));

    await waitFor(() => {
      expect(screen.getByText('Keyword Optimization')).toBeInTheDocument();
    });

    // K2 details should list missing keywords
    expect(screen.getByText('JD keyword coverage')).toBeInTheDocument();
    expect(screen.getByText('Missing keywords')).toBeInTheDocument();
  });

  it('displays fail status icon for categories with failures', async () => {
    const user = userEvent.setup();
    vi.mocked(runAtsCheck).mockResolvedValueOnce({ data: mockResultWithFailure });

    render(<AtsCheckerPanel config={mockResumeConfig as ResumeConfig} />);
    await user.click(screen.getByRole('button', { name: /run ats check/i }));

    await waitFor(() => {
      expect(screen.getByTestId('ats-score')).toBeInTheDocument();
    });

    // The failed check should be visible (auto-expanded)
    expect(screen.getByText('No empty sections')).toBeInTheDocument();
    expect(screen.getByText(/1 section\(s\) have no items/)).toBeInTheDocument();
  });

  it('shows loading state while checking', async () => {
    const user = userEvent.setup();
    // Don't resolve the promise immediately
    let resolveCheck: (value: { data: AtsCheckResult }) => void;
    vi.mocked(runAtsCheck).mockReturnValueOnce(
      new Promise((resolve) => {
        resolveCheck = resolve;
      })
    );

    render(<AtsCheckerPanel config={mockResumeConfig as ResumeConfig} />);
    await user.click(screen.getByRole('button', { name: /run ats check/i }));

    // Button should be disabled while loading
    expect(screen.getByRole('button', { name: /run ats check/i })).toBeDisabled();

    // Resolve
    resolveCheck!({ data: mockResult });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /run ats check/i })).not.toBeDisabled();
    });
  });
});
