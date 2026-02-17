import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createMockSupabaseClient, createChainMock } from '../../helpers/supabase-mock';
import type { MockSupabaseClient } from '../../helpers/supabase-mock';
import {
  mockProfile,
  mockStats,
  mockExperiences,
  mockCategories,
  mockProjects,
  mockSkillGroups,
} from '../../helpers/admin-fixtures';

// Mock the server client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

import { createClient } from '@/lib/supabase/server';
import {
  getProfile,
  getProfileStats,
  getNavLinks,
  getCompanies,
  getExperiences,
  getProjectCategories,
  getProjects,
  getSkillGroups,
  getProfileData,
} from '@/lib/supabase/queries';

let mockClient: MockSupabaseClient;

// Save original env
const originalEnv = { ...process.env };

beforeEach(() => {
  vi.clearAllMocks();
  mockClient = createMockSupabaseClient();
  vi.mocked(createClient).mockResolvedValue(mockClient as never);
  // Ensure Supabase env vars are set by default
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
});

afterEach(() => {
  // Restore original env
  process.env.NEXT_PUBLIC_SUPABASE_URL = originalEnv.NEXT_PUBLIC_SUPABASE_URL;
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY;
});

// ─── isSupabaseConfigured (tested indirectly) ────────────────

describe('Supabase not configured', () => {
  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  });

  it('getProfile returns null when env vars are missing', async () => {
    const result = await getProfile();
    expect(result).toBeNull();
    expect(createClient).not.toHaveBeenCalled();
  });

  it('getProfileStats returns null when env vars are missing', async () => {
    const result = await getProfileStats();
    expect(result).toBeNull();
    expect(createClient).not.toHaveBeenCalled();
  });

  it('getNavLinks returns null when env vars are missing', async () => {
    const result = await getNavLinks();
    expect(result).toBeNull();
    expect(createClient).not.toHaveBeenCalled();
  });

  it('getCompanies returns null when env vars are missing', async () => {
    const result = await getCompanies();
    expect(result).toBeNull();
    expect(createClient).not.toHaveBeenCalled();
  });

  it('getExperiences returns null when env vars are missing', async () => {
    const result = await getExperiences();
    expect(result).toBeNull();
    expect(createClient).not.toHaveBeenCalled();
  });

  it('getProjectCategories returns null when env vars are missing', async () => {
    const result = await getProjectCategories();
    expect(result).toBeNull();
    expect(createClient).not.toHaveBeenCalled();
  });

  it('getProjects returns null when env vars are missing', async () => {
    const result = await getProjects();
    expect(result).toBeNull();
    expect(createClient).not.toHaveBeenCalled();
  });

  it('getSkillGroups returns null when env vars are missing', async () => {
    const result = await getSkillGroups();
    expect(result).toBeNull();
    expect(createClient).not.toHaveBeenCalled();
  });

  it('getProfileData returns static fallback when env vars are missing', async () => {
    const result = await getProfileData();
    expect(result).toBeDefined();
    expect(result.fullName).toBe('Laldingliana Tlau Vantawl');
    expect(result.shortName).toBe('Lalding');
    expect(result.jobTitle).toBe('Full-stack Tech Lead');
    expect(createClient).not.toHaveBeenCalled();
  });
});

// ─── getProfile ──────────────────────────────────────────────

describe('getProfile', () => {
  it('returns profile data on success', async () => {
    mockClient._setTableResponse('profile', { data: mockProfile, error: null });
    const result = await getProfile();
    expect(result).toEqual(mockProfile);
    expect(mockClient.from).toHaveBeenCalledWith('profile');
  });

  it('returns null on error', async () => {
    mockClient._setTableResponse('profile', {
      data: null,
      error: { message: 'DB error' },
    });
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = await getProfile();
    expect(result).toBeNull();
    expect(consoleSpy).toHaveBeenCalledWith('getProfile error:', 'DB error');
    consoleSpy.mockRestore();
  });
});

// ─── getProfileStats ─────────────────────────────────────────

describe('getProfileStats', () => {
  it('returns stats sorted by sort_order', async () => {
    mockClient._setTableResponse('profile_stats', { data: mockStats, error: null });
    const result = await getProfileStats();
    expect(result).toEqual(mockStats);
    expect(mockClient.from).toHaveBeenCalledWith('profile_stats');
  });

  it('returns null on error', async () => {
    mockClient._setTableResponse('profile_stats', {
      data: null,
      error: { message: 'Stats error' },
    });
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = await getProfileStats();
    expect(result).toBeNull();
    expect(consoleSpy).toHaveBeenCalledWith('getProfileStats error:', 'Stats error');
    consoleSpy.mockRestore();
  });
});

// ─── getNavLinks ─────────────────────────────────────────────

describe('getNavLinks', () => {
  const mockNavLinks = [
    { id: 'nl-1', name: 'Home', hash: '#home', sort_order: 0 },
    { id: 'nl-2', name: 'About', hash: '#about', sort_order: 1 },
  ];

  it('returns nav links sorted by sort_order', async () => {
    mockClient._setTableResponse('nav_links', { data: mockNavLinks, error: null });
    const result = await getNavLinks();
    expect(result).toEqual(mockNavLinks);
    expect(mockClient.from).toHaveBeenCalledWith('nav_links');
  });

  it('returns null on error', async () => {
    mockClient._setTableResponse('nav_links', {
      data: null,
      error: { message: 'Nav error' },
    });
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = await getNavLinks();
    expect(result).toBeNull();
    expect(consoleSpy).toHaveBeenCalledWith('getNavLinks error:', 'Nav error');
    consoleSpy.mockRestore();
  });
});

// ─── getCompanies ────────────────────────────────────────────

describe('getCompanies', () => {
  const mockCompanies = [
    { id: 'co-1', name: 'Acme', logo_url: '/logos/acme.webp', sort_order: 0 },
    { id: 'co-2', name: 'Globex', logo_url: '/logos/globex.webp', sort_order: 1 },
  ];

  it('returns companies sorted by sort_order', async () => {
    mockClient._setTableResponse('companies', { data: mockCompanies, error: null });
    const result = await getCompanies();
    expect(result).toEqual(mockCompanies);
    expect(mockClient.from).toHaveBeenCalledWith('companies');
  });

  it('returns null on error', async () => {
    mockClient._setTableResponse('companies', {
      data: null,
      error: { message: 'Companies error' },
    });
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = await getCompanies();
    expect(result).toBeNull();
    expect(consoleSpy).toHaveBeenCalledWith('getCompanies error:', 'Companies error');
    consoleSpy.mockRestore();
  });
});

// ─── getExperiences ──────────────────────────────────────────

describe('getExperiences', () => {
  it('returns experiences sorted by sort_order', async () => {
    mockClient._setTableResponse('experiences', { data: mockExperiences, error: null });
    const result = await getExperiences();
    expect(result).toEqual(mockExperiences);
    expect(mockClient.from).toHaveBeenCalledWith('experiences');
  });

  it('returns null on error', async () => {
    mockClient._setTableResponse('experiences', {
      data: null,
      error: { message: 'Experiences error' },
    });
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = await getExperiences();
    expect(result).toBeNull();
    expect(consoleSpy).toHaveBeenCalledWith('getExperiences error:', 'Experiences error');
    consoleSpy.mockRestore();
  });
});

// ─── getProjectCategories ────────────────────────────────────

describe('getProjectCategories', () => {
  it('returns categories sorted by sort_order', async () => {
    mockClient._setTableResponse('project_categories', { data: mockCategories, error: null });
    const result = await getProjectCategories();
    expect(result).toEqual(mockCategories);
    expect(mockClient.from).toHaveBeenCalledWith('project_categories');
  });

  it('returns null on error', async () => {
    mockClient._setTableResponse('project_categories', {
      data: null,
      error: { message: 'Categories error' },
    });
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = await getProjectCategories();
    expect(result).toBeNull();
    expect(consoleSpy).toHaveBeenCalledWith('getProjectCategories error:', 'Categories error');
    consoleSpy.mockRestore();
  });
});

// ─── getProjects ─────────────────────────────────────────────

describe('getProjects', () => {
  it('returns projects sorted by sort_order', async () => {
    mockClient._setTableResponse('projects', { data: mockProjects, error: null });
    const result = await getProjects();
    expect(result).toEqual(mockProjects);
    expect(mockClient.from).toHaveBeenCalledWith('projects');
  });

  it('returns null on error', async () => {
    mockClient._setTableResponse('projects', {
      data: null,
      error: { message: 'Projects error' },
    });
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = await getProjects();
    expect(result).toBeNull();
    expect(consoleSpy).toHaveBeenCalledWith('getProjects error:', 'Projects error');
    consoleSpy.mockRestore();
  });
});

// ─── getSkillGroups ──────────────────────────────────────────

describe('getSkillGroups', () => {
  const mockGroups = [
    { id: 'sg-1', category: 'Frontend', sort_order: 0 },
    { id: 'sg-2', category: 'Backend', sort_order: 1 },
  ];

  const mockSkills = [
    { id: 'sk-1', name: 'React', group_id: 'sg-1', sort_order: 0 },
    { id: 'sk-2', name: 'TypeScript', group_id: 'sg-1', sort_order: 1 },
    { id: 'sk-3', name: 'Node.js', group_id: 'sg-2', sort_order: 0 },
  ];

  it('returns groups with nested skills', async () => {
    // getSkillGroups calls from('skill_groups') then from('skills')
    mockClient.from
      .mockReturnValueOnce(createChainMock({ data: mockGroups, error: null }))
      .mockReturnValueOnce(createChainMock({ data: mockSkills, error: null }));

    const result = await getSkillGroups();
    expect(result).toEqual([
      {
        ...mockGroups[0],
        skills: [mockSkills[0], mockSkills[1]],
      },
      {
        ...mockGroups[1],
        skills: [mockSkills[2]],
      },
    ]);
  });

  it('returns null on groups fetch error', async () => {
    mockClient.from.mockReturnValueOnce(
      createChainMock({ data: null, error: { message: 'Groups error' } })
    );

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = await getSkillGroups();
    expect(result).toBeNull();
    expect(consoleSpy).toHaveBeenCalledWith('getSkillGroups error:', 'Groups error');
    consoleSpy.mockRestore();
  });

  it('returns null on skills fetch error', async () => {
    mockClient.from
      .mockReturnValueOnce(createChainMock({ data: mockGroups, error: null }))
      .mockReturnValueOnce(
        createChainMock({ data: null, error: { message: 'Skills fetch error' } })
      );

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = await getSkillGroups();
    expect(result).toBeNull();
    expect(consoleSpy).toHaveBeenCalledWith('getSkillGroups (skills) error:', 'Skills fetch error');
    consoleSpy.mockRestore();
  });

  it('handles group with no matching skills', async () => {
    const groupWithNoSkills = [{ id: 'sg-3', category: 'DevOps', sort_order: 2 }];
    mockClient.from
      .mockReturnValueOnce(createChainMock({ data: groupWithNoSkills, error: null }))
      .mockReturnValueOnce(createChainMock({ data: mockSkills, error: null }));

    const result = await getSkillGroups();
    expect(result).toEqual([{ ...groupWithNoSkills[0], skills: [] }]);
  });
});

// ─── getProfileData ──────────────────────────────────────────

describe('getProfileData', () => {
  it('maps DB profile to camelCase ProfileData', async () => {
    mockClient._setTableResponse('profile', { data: mockProfile, error: null });
    const result = await getProfileData();

    expect(result.fullName).toBe(mockProfile.full_name);
    expect(result.shortName).toBe(mockProfile.short_name);
    expect(result.jobTitle).toBe(mockProfile.job_title);
    expect(result.tagline).toBe(mockProfile.tagline);
    expect(result.typewriterTitles).toEqual(mockProfile.typewriter_titles);
    expect(result.email).toBe(mockProfile.email);
    expect(result.phone).toBe(mockProfile.phone);
    expect(result.location).toBe(mockProfile.location);
    expect(result.linkedinUrl).toBe(mockProfile.linkedin_url);
    expect(result.githubUrl).toBe(mockProfile.github_url);
    expect(result.resumeUrl).toBe(mockProfile.resume_url);
    expect(result.aboutTechStack).toBe(mockProfile.about_tech_stack);
    expect(result.aboutCurrentFocus).toBe(mockProfile.about_current_focus);
    expect(result.aboutBeyondCode).toBe(mockProfile.about_beyond_code);
    expect(result.aboutExpertise).toEqual(mockProfile.about_expertise);
    expect(result.footerText).toBe(mockProfile.footer_text);
  });

  it('handles null fields with defaults', async () => {
    const profileWithNulls = {
      ...mockProfile,
      tagline: null,
      phone: null,
      location: null,
      linkedin_url: null,
      github_url: null,
      resume_url: null,
      about_tech_stack: null,
      about_current_focus: null,
      about_beyond_code: null,
      about_expertise: null,
      footer_text: null,
    };
    mockClient._setTableResponse('profile', { data: profileWithNulls, error: null });
    const result = await getProfileData();

    expect(result.tagline).toBe('');
    expect(result.phone).toBe('');
    expect(result.location).toBe('');
    expect(result.linkedinUrl).toBe('');
    expect(result.githubUrl).toBe('');
    expect(result.resumeUrl).toBe('/lalding.pdf');
    expect(result.aboutTechStack).toBe('');
    expect(result.aboutCurrentFocus).toBe('');
    expect(result.aboutBeyondCode).toBe('');
    expect(result.aboutExpertise).toEqual([]);
    expect(result.footerText).toBe('');
  });

  it('falls back to static profile on DB error', async () => {
    mockClient._setTableResponse('profile', {
      data: null,
      error: { message: 'Connection error' },
    });
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = await getProfileData();

    expect(result.fullName).toBe('Laldingliana Tlau Vantawl');
    expect(result.shortName).toBe('Lalding');
    consoleSpy.mockRestore();
  });
});
