import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createMockSupabaseClient,
  createChainMock,
  MOCK_ADMIN_USER,
} from '../helpers/supabase-mock';
import type { MockSupabaseClient } from '../helpers/supabase-mock';
import type { ResumeData } from '@/components/resume-templates/types';
import type { AtsCheckResult } from '@/lib/resume-builder/ats-checker';
import { ATS_CHECKS_WITHOUT_JD, ATS_TOTAL_CHECKS } from '@/lib/resume-builder/ats-checker';

// Mock external dependencies before imports
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

// Mock assembleResumeData and renderToHtml — configured in beforeEach
vi.mock('@/actions/resume-pdf', () => ({
  assembleResumeData: vi.fn(),
  renderToHtml: vi.fn(),
}));

import { createClient } from '@/lib/supabase/server';
import { runAtsCheck } from '@/actions/resume-builder';
import { assembleResumeData, renderToHtml } from '@/actions/resume-pdf';

const mockResumeData: ResumeData = {
  profile: {
    fullName: 'John Doe',
    jobTitle: 'Software Engineer',
    email: 'john@example.com',
    phone: '+1234567890',
    location: 'New York, NY',
    websiteUrl: null,
    linkedinUrl: null,
    githubUrl: null,
  },
  summary:
    'Experienced software engineer with 10+ years building scalable web applications using React, TypeScript, and Node.js.',
  sections: [
    {
      type: 'experience',
      label: 'Experience',
      items: [
        {
          title: 'Senior Engineer',
          company: 'TechCorp',
          displayDate: 'Jan 2020 – Present',
          description:
            'Led development of microservices architecture\nImplemented CI/CD pipeline reducing deployment time by 60%',
        },
      ],
    },
    {
      type: 'skills',
      label: 'Skills',
      items: [
        {
          category: 'Frontend',
          skills: [
            'React',
            'TypeScript',
            'Next.js',
            'Tailwind CSS',
            'HTML',
            'CSS',
            'Vue',
            'Angular',
          ],
        },
        { category: 'Backend', skills: ['Node.js', 'Python', 'PostgreSQL', 'Redis', 'GraphQL'] },
      ],
    },
    {
      type: 'education',
      label: 'Education',
      items: [
        {
          institution: 'University',
          degree: 'BS Computer Science',
          fieldOfStudy: 'CS',
          displayDate: 'Aug 2013 – May 2017',
          description: null,
        },
      ],
    },
  ],
  style: {
    primaryColor: '#1a1a1a',
    accentColor: '#2bbcb3',
    fontFamily: 'Open Sans, sans-serif',
    headingFontFamily: 'Open Sans, sans-serif',
    fontSize: '10pt',
    lineHeight: '1.4',
    margins: { top: '0.75in', right: '0.75in', bottom: '0.75in', left: '0.75in' },
  },
  pageSize: 'A4',
};

const mockHtml =
  '<!DOCTYPE html><html><head></head><body><div style="display: flex;">Resume content</div></body></html>';

let mockClient: MockSupabaseClient;

beforeEach(() => {
  vi.clearAllMocks();
  mockClient = createMockSupabaseClient();
  vi.mocked(createClient).mockResolvedValue(mockClient as never);
  vi.mocked(assembleResumeData).mockResolvedValue(mockResumeData);
  vi.mocked(renderToHtml).mockResolvedValue(mockHtml);
});

function setAdmin() {
  mockClient._setAuth(MOCK_ADMIN_USER);
}

const mockConfig = {
  id: 'cfg-1',
  name: 'Test Config',
  description: null,
  template_id: 'tmpl-1',
  sections: [],
  style_overrides: {},
  custom_summary: 'Test summary',
  job_description: null,
  jd_keywords: null,
  jd_coverage_score: null,
  jd_analysis: null,
  is_active: true,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
};

// ─── runAtsCheck ────────────────────────────────────────────────

describe('runAtsCheck', () => {
  it('returns error when not admin', async () => {
    mockClient._setAuth(null);
    const result = await runAtsCheck('cfg-1');
    expect(result.error).toBe('Not authenticated');
  });

  it('returns error when config not found', async () => {
    setAdmin();
    mockClient.from.mockReturnValueOnce(
      createChainMock({ data: null, error: { message: 'Not found' } })
    );

    const result = await runAtsCheck('cfg-nonexistent');
    expect(result.error).toBe('Resume config not found');
  });

  it('runs ATS check successfully without JD analysis', async () => {
    setAdmin();

    // Config fetch
    mockClient.from
      .mockReturnValueOnce(createChainMock({ data: mockConfig, error: null }))
      // Template fetch
      .mockReturnValueOnce(
        createChainMock({ data: { registry_key: 'professional' }, error: null })
      );

    const result = await runAtsCheck('cfg-1');

    expect(result.error).toBeUndefined();
    expect(result.data).toBeDefined();

    const data = result.data as AtsCheckResult;
    expect(data.score).toBeGreaterThanOrEqual(0);
    expect(data.score).toBeLessThanOrEqual(100);
    expect(data.totalChecks).toBe(ATS_CHECKS_WITHOUT_JD); // No keyword checks without JD analysis
    expect(data.categories.find((c) => c.category === 'keywords')).toBeUndefined();
    expect(data.checkedAt).toBeTruthy();
  });

  it('includes keyword checks when JD analysis is present', async () => {
    setAdmin();

    const configWithJd = {
      ...mockConfig,
      jd_analysis: {
        matchedKeywords: ['React', 'TypeScript', 'Node.js'],
        missingKeywords: ['Go'],
        suggestions: [],
      },
      jd_coverage_score: 0.75,
      jd_keywords: ['React', 'TypeScript', 'Node.js', 'Go'],
    };

    // Config fetch
    mockClient.from
      .mockReturnValueOnce(createChainMock({ data: configWithJd, error: null }))
      // Template fetch
      .mockReturnValueOnce(
        createChainMock({ data: { registry_key: 'professional' }, error: null })
      );

    const result = await runAtsCheck('cfg-1');

    expect(result.error).toBeUndefined();
    const data = result.data as AtsCheckResult;
    expect(data.totalChecks).toBe(ATS_TOTAL_CHECKS); // All checks including keywords
    expect(data.categories.find((c) => c.category === 'keywords')).toBeDefined();
  });

  it('uses default template when no template_id is set', async () => {
    setAdmin();

    const configNoTemplate = { ...mockConfig, template_id: null };

    // Config fetch (no template fetch needed)
    mockClient.from.mockReturnValueOnce(createChainMock({ data: configNoTemplate, error: null }));

    const result = await runAtsCheck('cfg-1');

    expect(result.error).toBeUndefined();
    expect(result.data).toBeDefined();
    // assembleResumeData and renderToHtml should have been called
    expect(assembleResumeData).toHaveBeenCalled();
    expect(renderToHtml).toHaveBeenCalledWith('professional', mockResumeData);
  });

  it('returns error when assembleResumeData fails', async () => {
    setAdmin();

    // Config fetch
    mockClient.from
      .mockReturnValueOnce(createChainMock({ data: mockConfig, error: null }))
      // Template fetch
      .mockReturnValueOnce(
        createChainMock({ data: { registry_key: 'professional' }, error: null })
      );

    vi.mocked(assembleResumeData).mockRejectedValueOnce(new Error('Profile not found'));

    const result = await runAtsCheck('cfg-1');
    expect(result.error).toBe('Profile not found');
  });

  it('returns error when renderToHtml fails', async () => {
    setAdmin();

    // Config fetch
    mockClient.from
      .mockReturnValueOnce(createChainMock({ data: mockConfig, error: null }))
      // Template fetch
      .mockReturnValueOnce(
        createChainMock({ data: { registry_key: 'professional' }, error: null })
      );

    vi.mocked(renderToHtml).mockRejectedValueOnce(new Error('Template not found: unknown'));

    const result = await runAtsCheck('cfg-1');
    expect(result.error).toBe('Template not found: unknown');
  });

  it('passes correct registry key from template lookup', async () => {
    setAdmin();

    mockClient.from
      .mockReturnValueOnce(createChainMock({ data: mockConfig, error: null }))
      .mockReturnValueOnce(createChainMock({ data: { registry_key: 'modern' }, error: null }));

    await runAtsCheck('cfg-1');

    expect(renderToHtml).toHaveBeenCalledWith('modern', mockResumeData);
  });

  it('returns valid AtsCheckResult structure', async () => {
    setAdmin();

    mockClient.from
      .mockReturnValueOnce(createChainMock({ data: mockConfig, error: null }))
      .mockReturnValueOnce(
        createChainMock({ data: { registry_key: 'professional' }, error: null })
      );

    const result = await runAtsCheck('cfg-1');
    const data = result.data as AtsCheckResult;

    // Verify structure
    expect(typeof data.score).toBe('number');
    expect(Array.isArray(data.categories)).toBe(true);
    expect(typeof data.totalPassed).toBe('number');
    expect(typeof data.totalWarned).toBe('number');
    expect(typeof data.totalFailed).toBe('number');
    expect(typeof data.totalChecks).toBe('number');
    expect(typeof data.checkedAt).toBe('string');

    // Verify math
    expect(data.totalPassed + data.totalWarned + data.totalFailed).toBe(data.totalChecks);

    // Verify each category has checks
    for (const cat of data.categories) {
      expect(cat.checks.length).toBe(cat.total);
      expect(cat.passed + cat.warned + cat.failed).toBe(cat.total);
    }
  });
});
