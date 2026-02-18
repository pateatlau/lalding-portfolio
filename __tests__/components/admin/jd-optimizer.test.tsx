import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import JdOptimizer from '@/components/admin/resume-builder/jd-optimizer';
import { mockJdAnalysisResult } from '../../helpers/admin-fixtures';
import type { JdAnalysisResult, JdSuggestion } from '@/lib/supabase/types';

vi.mock('@/actions/resume-builder', () => ({
  analyzeJobDescription: vi.fn(),
  clearJdAnalysis: vi.fn(),
}));

import { analyzeJobDescription, clearJdAnalysis } from '@/actions/resume-builder';

beforeEach(() => {
  vi.clearAllMocks();
});

const defaultProps = {
  configId: 'cfg-1',
  initialJobDescription: null,
  initialKeywords: null,
  initialCoverageScore: null,
  initialAnalysis: null,
  onSuggestionsApplied: vi.fn(),
};

describe('JdOptimizer', () => {
  it('renders the textarea and analyze button', () => {
    render(<JdOptimizer {...defaultProps} />);
    expect(screen.getByPlaceholderText(/paste a job description/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /analyze/i })).toBeInTheDocument();
  });

  it('disables analyze button when textarea is empty', () => {
    render(<JdOptimizer {...defaultProps} />);
    expect(screen.getByRole('button', { name: /analyze/i })).toBeDisabled();
  });

  it('enables analyze button when text is entered', async () => {
    const user = userEvent.setup();
    render(<JdOptimizer {...defaultProps} />);

    await user.type(
      screen.getByPlaceholderText(/paste a job description/i),
      'Looking for a React developer'
    );

    expect(screen.getByRole('button', { name: /analyze/i })).not.toBeDisabled();
  });

  it('calls analyzeJobDescription on analyze click and shows results', async () => {
    const user = userEvent.setup();
    vi.mocked(analyzeJobDescription).mockResolvedValueOnce({
      data: {
        keywords: ['React', 'TypeScript', 'Node.js'],
        coverageScore: 0.67,
        analysis: mockJdAnalysisResult,
      },
    });

    render(<JdOptimizer {...defaultProps} />);

    await user.type(
      screen.getByPlaceholderText(/paste a job description/i),
      'Looking for a React developer'
    );
    await user.click(screen.getByRole('button', { name: /analyze/i }));

    await waitFor(() => {
      expect(screen.getByText('67%')).toBeInTheDocument();
    });

    expect(vi.mocked(analyzeJobDescription)).toHaveBeenCalledWith(
      'cfg-1',
      'Looking for a React developer'
    );

    // Matched keywords shown as green badges
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();

    // Missing keywords shown as amber badges
    expect(screen.getByText('Go')).toBeInTheDocument();
    expect(screen.getByText('Redis')).toBeInTheDocument();

    // Suggestions shown
    expect(screen.getByText('Include Experience')).toBeInTheDocument();
    expect(screen.getByText('Include Skill Group')).toBeInTheDocument();
  });

  it('shows error message when analysis fails', async () => {
    const user = userEvent.setup();
    vi.mocked(analyzeJobDescription).mockResolvedValueOnce({
      error: 'LLM not configured',
    });

    render(<JdOptimizer {...defaultProps} />);

    await user.type(screen.getByPlaceholderText(/paste a job description/i), 'Some JD text');
    await user.click(screen.getByRole('button', { name: /analyze/i }));

    await waitFor(() => {
      expect(screen.getByText('LLM not configured')).toBeInTheDocument();
    });
  });

  it('renders initial analysis results from props', () => {
    render(
      <JdOptimizer
        {...defaultProps}
        initialJobDescription="Existing JD"
        initialKeywords={['React', 'TypeScript']}
        initialCoverageScore={0.75}
        initialAnalysis={mockJdAnalysisResult}
      />
    );

    // Should show the coverage score and keywords
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('Clear Analysis')).toBeInTheDocument();
  });

  it('calls clearJdAnalysis and resets state on clear', async () => {
    const user = userEvent.setup();
    vi.mocked(clearJdAnalysis).mockResolvedValueOnce({ data: { success: true } });

    render(
      <JdOptimizer
        {...defaultProps}
        initialJobDescription="Some JD"
        initialKeywords={['React']}
        initialCoverageScore={0.5}
        initialAnalysis={mockJdAnalysisResult}
      />
    );

    await user.click(screen.getByRole('button', { name: /clear analysis/i }));

    await waitFor(() => {
      expect(screen.getByText('Analysis cleared')).toBeInTheDocument();
    });
    expect(clearJdAnalysis).toHaveBeenCalledWith('cfg-1');
    // Coverage score should be gone
    expect(screen.queryByText('50%')).not.toBeInTheDocument();
  });

  it('calls onSuggestionsApplied when apply button is clicked', async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();

    render(
      <JdOptimizer
        {...defaultProps}
        initialJobDescription="Some JD"
        initialKeywords={['React']}
        initialCoverageScore={0.5}
        initialAnalysis={mockJdAnalysisResult}
        onSuggestionsApplied={onApply}
      />
    );

    // Click the first "Apply" button
    const applyButtons = screen.getAllByRole('button', { name: /^apply$/i });
    await user.click(applyButtons[0]);

    expect(onApply).toHaveBeenCalledWith([mockJdAnalysisResult.suggestions[0]]);
  });

  it('calls onSuggestionsApplied with all suggestions when apply all is clicked', async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();

    render(
      <JdOptimizer
        {...defaultProps}
        initialJobDescription="Some JD"
        initialKeywords={['React']}
        initialCoverageScore={0.5}
        initialAnalysis={mockJdAnalysisResult}
        onSuggestionsApplied={onApply}
      />
    );

    await user.click(screen.getByRole('button', { name: /apply all/i }));

    expect(onApply).toHaveBeenCalledWith(mockJdAnalysisResult.suggestions);
  });

  it('shows applied state after applying a suggestion', async () => {
    const user = userEvent.setup();

    render(
      <JdOptimizer
        {...defaultProps}
        initialJobDescription="Some JD"
        initialKeywords={['React']}
        initialCoverageScore={0.5}
        initialAnalysis={mockJdAnalysisResult}
      />
    );

    const applyButtons = screen.getAllByRole('button', { name: /^apply$/i });
    await user.click(applyButtons[0]);

    // The first suggestion should now show "Applied"
    expect(screen.getByText('Applied')).toBeInTheDocument();
  });

  it('does not render suggestions section when analysis has no suggestions', () => {
    const emptyAnalysis: JdAnalysisResult = {
      matchedKeywords: ['React'],
      missingKeywords: [],
      suggestions: [],
    };

    render(
      <JdOptimizer
        {...defaultProps}
        initialJobDescription="Some JD"
        initialKeywords={['React']}
        initialCoverageScore={1.0}
        initialAnalysis={emptyAnalysis}
      />
    );

    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.queryByText('Suggestions')).not.toBeInTheDocument();
  });

  it('shows correct color coding for coverage scores', () => {
    // Green for >= 75%
    render(
      <JdOptimizer
        {...defaultProps}
        initialCoverageScore={0.8}
        initialKeywords={['React']}
        initialAnalysis={{ matchedKeywords: ['React'], missingKeywords: [], suggestions: [] }}
      />
    );
    const greenScore = screen.getByText('80%');
    expect(greenScore).toHaveClass('text-green-600');
    cleanup();

    // Amber for >= 50%
    render(
      <JdOptimizer
        {...defaultProps}
        initialCoverageScore={0.55}
        initialKeywords={['React']}
        initialAnalysis={{ matchedKeywords: ['React'], missingKeywords: ['Go'], suggestions: [] }}
      />
    );
    const amberScore = screen.getByText('55%');
    expect(amberScore).toHaveClass('text-amber-600');
    cleanup();

    // Red for < 50%
    render(
      <JdOptimizer
        {...defaultProps}
        initialCoverageScore={0.3}
        initialKeywords={['React']}
        initialAnalysis={{ matchedKeywords: [], missingKeywords: ['React', 'Go'], suggestions: [] }}
      />
    );
    const redScore = screen.getByText('30%');
    expect(redScore).toHaveClass('text-red-600');
  });
});
