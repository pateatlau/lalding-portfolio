import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createMockSupabaseClient,
  createChainMock,
  MOCK_ADMIN_USER,
} from '../helpers/supabase-mock';
import type { MockSupabaseClient } from '../helpers/supabase-mock';

// Mock external dependencies before imports
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

// Mock the jd-analyzer module
vi.mock('@/lib/resume-builder/jd-analyzer', () => ({
  sanitizeJobDescription: vi.fn((text: string) => text.trim()),
  extractKeywords: vi.fn().mockResolvedValue({
    keywords: ['React', 'TypeScript', 'Node.js'],
    categories: {
      technical: ['React', 'TypeScript', 'Node.js'],
      soft: [],
      qualifications: [],
    },
  }),
  scoreCoverage: vi.fn().mockReturnValue({
    score: 0.67,
    matchedKeywords: ['React', 'TypeScript'],
    missingKeywords: ['Node.js'],
    keywordItemMap: new Map([
      ['React', [{ type: 'skill_group', itemId: 'sg-1' }]],
      ['TypeScript', [{ type: 'skill_group', itemId: 'sg-1' }]],
    ]),
  }),
  generateSuggestions: vi.fn().mockReturnValue([
    {
      type: 'include_skill_group' as const,
      itemId: 'sg-2',
      reason: 'Matches keyword "Node.js"',
    },
  ]),
  JdAnalysisError: class JdAnalysisError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'JdAnalysisError';
    }
  },
}));

import { createClient } from '@/lib/supabase/server';
import { analyzeJobDescription, clearJdAnalysis } from '@/actions/resume-builder';

let mockClient: MockSupabaseClient;

beforeEach(() => {
  vi.clearAllMocks();
  mockClient = createMockSupabaseClient();
  vi.mocked(createClient).mockResolvedValue(mockClient as never);
  // Reset env
  delete process.env.RESUME_BUILDER_LLM_API_KEY;
});

function setAdmin() {
  mockClient._setAuth(MOCK_ADMIN_USER);
}

// ─── analyzeJobDescription ───────────────────────────────────

describe('analyzeJobDescription', () => {
  it('returns error when not admin', async () => {
    mockClient._setAuth(null);
    const result = await analyzeJobDescription('cfg-1', 'Some job description');
    expect(result.error).toBe('Not authenticated');
  });

  it('returns error when job description is empty', async () => {
    setAdmin();
    const result = await analyzeJobDescription('cfg-1', '');
    expect(result.error).toBe('Job description is required');
  });

  it('returns error when job description is whitespace only', async () => {
    setAdmin();
    const result = await analyzeJobDescription('cfg-1', '   \n  ');
    expect(result.error).toBe('Job description is required');
  });

  it('returns error when LLM API key is not configured', async () => {
    setAdmin();
    // RESUME_BUILDER_LLM_API_KEY is not set
    const result = await analyzeJobDescription('cfg-1', 'Looking for a React developer');
    expect(result.error).toBe('LLM not configured');
  });

  it('returns analysis results on success', async () => {
    setAdmin();
    process.env.RESUME_BUILDER_LLM_API_KEY = 'test-key';

    // Mock CMS data queries (4 tables: experiences, projects, skill_groups, skills)
    mockClient.from
      .mockReturnValueOnce(
        createChainMock({
          data: [
            {
              id: 'exp-1',
              title: 'Senior Dev',
              company: 'Corp',
              description: 'React development',
            },
          ],
          error: null,
        })
      )
      .mockReturnValueOnce(
        createChainMock({
          data: [{ id: 'proj-1', title: 'App', description: 'Web app', tags: ['React'] }],
          error: null,
        })
      )
      .mockReturnValueOnce(
        createChainMock({
          data: [{ id: 'sg-1', category: 'Frontend' }],
          error: null,
        })
      )
      .mockReturnValueOnce(
        createChainMock({
          data: [{ id: 'sk-1', name: 'React', group_id: 'sg-1' }],
          error: null,
        })
      )
      // DB update for saving analysis results
      .mockReturnValueOnce(createChainMock({ data: null, error: null }));

    const result = await analyzeJobDescription('cfg-1', 'Looking for a React developer');

    expect(result.error).toBeUndefined();
    expect(result.data).toBeDefined();
    expect(result.data!.keywords).toEqual(['React', 'TypeScript', 'Node.js']);
    expect(result.data!.coverageScore).toBe(0.67);
    expect(result.data!.analysis.matchedKeywords).toEqual(['React', 'TypeScript']);
    expect(result.data!.analysis.missingKeywords).toEqual(['Node.js']);
    expect(result.data!.analysis.suggestions).toHaveLength(1);
  });

  it('returns error when DB update fails', async () => {
    setAdmin();
    process.env.RESUME_BUILDER_LLM_API_KEY = 'test-key';

    // Mock CMS data queries
    mockClient.from
      .mockReturnValueOnce(createChainMock({ data: [], error: null }))
      .mockReturnValueOnce(createChainMock({ data: [], error: null }))
      .mockReturnValueOnce(createChainMock({ data: [], error: null }))
      .mockReturnValueOnce(createChainMock({ data: [], error: null }))
      // DB update fails
      .mockReturnValueOnce(createChainMock({ data: null, error: { message: 'Update failed' } }));

    const result = await analyzeJobDescription('cfg-1', 'Job description');
    expect(result.error).toBe('Analysis completed but failed to save results');
  });

  it('returns error when LLM call fails', async () => {
    setAdmin();
    process.env.RESUME_BUILDER_LLM_API_KEY = 'test-key';

    // Override extractKeywords to throw
    const { extractKeywords } = await import('@/lib/resume-builder/jd-analyzer');
    vi.mocked(extractKeywords).mockRejectedValueOnce(new Error('LLM timeout'));

    // Mock CMS data queries
    mockClient.from
      .mockReturnValueOnce(createChainMock({ data: [], error: null }))
      .mockReturnValueOnce(createChainMock({ data: [], error: null }))
      .mockReturnValueOnce(createChainMock({ data: [], error: null }))
      .mockReturnValueOnce(createChainMock({ data: [], error: null }));

    const result = await analyzeJobDescription('cfg-1', 'Job description');
    expect(result.error).toBe('LLM timeout');
  });

  it('enforces rate limiting', async () => {
    setAdmin();
    process.env.RESUME_BUILDER_LLM_API_KEY = 'test-key';

    // Use fake timers to ensure a clean rate limit window
    vi.useFakeTimers();
    // Advance past any timestamps from previous tests
    vi.advanceTimersByTime(120_000);

    // Helper to set up successful mocks for one call
    const setupMocks = () => {
      mockClient.from
        .mockReturnValueOnce(createChainMock({ data: [], error: null }))
        .mockReturnValueOnce(createChainMock({ data: [], error: null }))
        .mockReturnValueOnce(createChainMock({ data: [], error: null }))
        .mockReturnValueOnce(createChainMock({ data: [], error: null }))
        .mockReturnValueOnce(createChainMock({ data: null, error: null }));
    };

    // Make 10 successful calls
    for (let i = 0; i < 10; i++) {
      setupMocks();
      const result = await analyzeJobDescription('cfg-1', `Job description ${i}`);
      expect(result.error).toBeUndefined();
    }

    // 11th call should be rate limited
    const result = await analyzeJobDescription('cfg-1', 'One more');
    expect(result.error).toContain('Rate limit exceeded');

    vi.useRealTimers();
  });
});

// ─── clearJdAnalysis ─────────────────────────────────────────

describe('clearJdAnalysis', () => {
  it('returns error when not admin', async () => {
    mockClient._setAuth(null);
    const result = await clearJdAnalysis('cfg-1');
    expect(result.error).toBe('Not authenticated');
  });

  it('clears JD analysis data successfully', async () => {
    setAdmin();
    mockClient._setTableResponse('resume_configs', { data: null, error: null });

    const result = await clearJdAnalysis('cfg-1');
    expect(result.data).toEqual({ success: true });
  });

  it('returns error on database failure', async () => {
    setAdmin();
    mockClient._setTableResponse('resume_configs', {
      data: null,
      error: { message: 'DB error' },
    });

    const result = await clearJdAnalysis('cfg-1');
    expect(result.error).toBe('Failed to clear JD analysis');
  });
});
