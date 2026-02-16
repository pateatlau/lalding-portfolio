import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createMockSupabaseClient,
  createChainMock,
  MOCK_ADMIN_USER,
  MOCK_NON_ADMIN_USER,
} from '../helpers/supabase-mock';
import type { MockSupabaseClient } from '../helpers/supabase-mock';

// Mock external dependencies before imports
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  requireAdmin,
  getAdminStats,
  updateProfile,
  updateProfileStats,
  createExperience,
  updateExperience,
  deleteExperience,
  reorderExperiences,
  createProject,
  updateProject,
  deleteProject,
  reorderProjects,
  createSkillGroup,
  updateSkillGroup,
  deleteSkillGroup,
  reorderSkillGroups,
  createSkill,
  updateSkill,
  deleteSkill,
  reorderSkills,
  getResumeDownloads,
  uploadResume,
} from '@/actions/admin';

let mockClient: MockSupabaseClient;

beforeEach(() => {
  vi.clearAllMocks();
  mockClient = createMockSupabaseClient();
  vi.mocked(createClient).mockResolvedValue(mockClient as never);
});

/** Helper: configure mock as an authenticated admin */
function setAdmin() {
  mockClient._setAuth(MOCK_ADMIN_USER);
}

// ─── requireAdmin ────────────────────────────────────────────

describe('requireAdmin', () => {
  it('returns error when not authenticated', async () => {
    mockClient._setAuth(null, { message: 'No session' });
    const result = await requireAdmin();
    expect(result.error).toBe('Not authenticated');
  });

  it('returns error when user is not admin', async () => {
    mockClient._setAuth(MOCK_NON_ADMIN_USER);
    const result = await requireAdmin();
    expect(result.error).toBe('Not authorized — admin role required');
  });

  it('returns user when user is admin', async () => {
    setAdmin();
    const result = await requireAdmin();
    expect(result.user).toEqual(MOCK_ADMIN_USER);
    expect(result.error).toBeUndefined();
  });
});

// ─── getAdminStats ───────────────────────────────────────────

describe('getAdminStats', () => {
  it('returns error when not admin', async () => {
    mockClient._setAuth(null);
    const result = await getAdminStats();
    expect(result.error).toBe('Not authenticated');
  });

  it('returns aggregated stats on success', async () => {
    setAdmin();

    const rawDownloads = [{ id: 'dl-1', downloaded_at: '2025-01-01T00:00:00Z', visitor_id: 'v-1' }];
    const visitors = [{ id: 'v-1', full_name: 'Jane', email: 'jane@test.com', company: 'Corp' }];

    mockClient.from
      .mockReturnValueOnce(createChainMock({ data: null, error: null, count: 100 }))
      .mockReturnValueOnce(createChainMock({ data: null, error: null, count: 50 }))
      .mockReturnValueOnce(createChainMock({ data: null, error: null, count: 10 }))
      .mockReturnValueOnce(createChainMock({ data: rawDownloads, error: null }))
      .mockReturnValueOnce(createChainMock({ data: visitors, error: null }));

    const result = await getAdminStats();
    expect(result.data).toEqual({
      totalVisitors: 100,
      totalDownloads: 50,
      recentDownloads: 10,
      recentDownloadsList: [
        {
          id: 'dl-1',
          downloadedAt: '2025-01-01T00:00:00Z',
          visitorName: 'Jane',
          visitorEmail: 'jane@test.com',
          visitorCompany: 'Corp',
        },
      ],
    });
  });

  it('returns error when visitor_profiles query fails', async () => {
    setAdmin();
    mockClient.from
      .mockReturnValueOnce(
        createChainMock({ data: null, error: { message: 'DB error' }, count: null })
      )
      .mockReturnValueOnce(createChainMock({ data: null, error: null, count: 0 }))
      .mockReturnValueOnce(createChainMock({ data: null, error: null, count: 0 }))
      .mockReturnValueOnce(createChainMock({ data: [], error: null }));

    const result = await getAdminStats();
    expect(result.error).toBe('Failed to load visitor stats');
  });

  it('returns error when total downloads query fails', async () => {
    setAdmin();
    mockClient.from
      .mockReturnValueOnce(createChainMock({ data: null, error: null, count: 100 }))
      .mockReturnValueOnce(
        createChainMock({ data: null, error: { message: 'DB error' }, count: null })
      )
      .mockReturnValueOnce(createChainMock({ data: null, error: null, count: 0 }))
      .mockReturnValueOnce(createChainMock({ data: [], error: null }));

    const result = await getAdminStats();
    expect(result.error).toBe('Failed to load download stats');
  });

  it('returns error when recent downloads query fails', async () => {
    setAdmin();
    mockClient.from
      .mockReturnValueOnce(createChainMock({ data: null, error: null, count: 100 }))
      .mockReturnValueOnce(createChainMock({ data: null, error: null, count: 50 }))
      .mockReturnValueOnce(
        createChainMock({ data: null, error: { message: 'DB error' }, count: null })
      )
      .mockReturnValueOnce(createChainMock({ data: [], error: null }));

    const result = await getAdminStats();
    expect(result.error).toBe('Failed to load recent download stats');
  });

  it('returns error when downloads list query fails', async () => {
    setAdmin();
    mockClient.from
      .mockReturnValueOnce(createChainMock({ data: null, error: null, count: 100 }))
      .mockReturnValueOnce(createChainMock({ data: null, error: null, count: 50 }))
      .mockReturnValueOnce(createChainMock({ data: null, error: null, count: 10 }))
      .mockReturnValueOnce(createChainMock({ data: null, error: { message: 'DB error' } }));

    const result = await getAdminStats();
    expect(result.error).toBe('Failed to load downloads list');
  });

  it('returns empty downloads list when no downloads exist', async () => {
    setAdmin();
    mockClient.from
      .mockReturnValueOnce(createChainMock({ data: null, error: null, count: 100 }))
      .mockReturnValueOnce(createChainMock({ data: null, error: null, count: 0 }))
      .mockReturnValueOnce(createChainMock({ data: null, error: null, count: 0 }))
      .mockReturnValueOnce(createChainMock({ data: [], error: null }));

    const result = await getAdminStats();
    expect(result.data!.recentDownloadsList).toEqual([]);
  });
});

// ─── updateProfile ───────────────────────────────────────────

describe('updateProfile', () => {
  it('returns error when not admin', async () => {
    mockClient._setAuth(null);
    const result = await updateProfile({ full_name: 'Test' });
    expect(result.error).toBe('Not authenticated');
  });

  it('updates profile and calls revalidatePath on success', async () => {
    setAdmin();
    mockClient._setTableResponse('profile', { data: null, error: null });

    const result = await updateProfile({ full_name: 'Updated Name' });
    expect(result.data).toEqual({ success: true });
    expect(revalidatePath).toHaveBeenCalledWith('/');
    expect(mockClient.from).toHaveBeenCalledWith('profile');
  });

  it('returns error on database failure', async () => {
    setAdmin();
    mockClient._setTableResponse('profile', {
      data: null,
      error: { message: 'DB error' },
    });

    const result = await updateProfile({ full_name: 'Test' });
    expect(result.error).toBe('Failed to update profile');
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

// ─── updateProfileStats ─────────────────────────────────────

describe('updateProfileStats', () => {
  it('returns error when not admin', async () => {
    mockClient._setAuth(null);
    const result = await updateProfileStats([]);
    expect(result.error).toBe('Not authenticated');
  });

  it('deletes existing stats and inserts new ones on success', async () => {
    setAdmin();
    // Both delete and insert calls hit profile_stats — both succeed
    mockClient._setTableResponse('profile_stats', { data: null, error: null });

    const stats = [{ value: 15, suffix: '+', label: 'Years', sort_order: 0 }];
    const result = await updateProfileStats(stats);
    expect(result.data).toEqual({ success: true });
    expect(revalidatePath).toHaveBeenCalledWith('/');
  });

  it('returns error when delete step fails', async () => {
    setAdmin();
    mockClient._setTableResponse('profile_stats', {
      data: null,
      error: { message: 'DB error' },
    });

    const result = await updateProfileStats([{ value: 1, label: 'Test', sort_order: 0 }]);
    expect(result.error).toBe('Failed to update stats');
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it('skips insert when stats array is empty', async () => {
    setAdmin();
    mockClient._setTableResponse('profile_stats', { data: null, error: null });

    const result = await updateProfileStats([]);
    expect(result.data).toEqual({ success: true });
    // from('profile_stats') called once for delete only
    const profileStatsCalls = mockClient.from.mock.calls.filter((c) => c[0] === 'profile_stats');
    expect(profileStatsCalls.length).toBe(1);
  });
});

// ─── CRUD Test Helpers ───────────────────────────────────────

/**
 * Generates standard CRUD tests for create/update/delete/reorder actions.
 */
function describeCrud({
  entityName,
  tableName,
  createFn,
  updateFn,
  deleteFn,
  reorderFn,
  sampleInsert,
  sampleEntity,
  createErrorMsg,
  updateErrorMsg,
  deleteErrorMsg,
  reorderErrorMsg,
}: {
  entityName: string;
  tableName: string;
  createFn: (data: never) => Promise<{ data?: unknown; error?: string }>;
  updateFn: (id: string, data: never) => Promise<{ data?: unknown; error?: string }>;
  deleteFn: (id: string) => Promise<{ data?: unknown; error?: string }>;
  reorderFn: (ids: string[]) => Promise<{ data?: unknown; error?: string }>;
  sampleInsert: Record<string, unknown>;
  sampleEntity: Record<string, unknown>;
  createErrorMsg: string;
  updateErrorMsg: string;
  deleteErrorMsg: string;
  reorderErrorMsg: string;
}) {
  describe(`create${entityName}`, () => {
    it('returns error when not admin', async () => {
      mockClient._setAuth(null);
      const result = await createFn(sampleInsert as never);
      expect(result.error).toBe('Not authenticated');
    });

    it('creates entity and calls revalidatePath', async () => {
      setAdmin();
      mockClient._setTableResponse(tableName, { data: sampleEntity, error: null });

      const result = await createFn(sampleInsert as never);
      expect(result.data).toEqual(sampleEntity);
      expect(revalidatePath).toHaveBeenCalledWith('/');
      expect(mockClient.from).toHaveBeenCalledWith(tableName);
    });

    it('returns error on database failure', async () => {
      setAdmin();
      mockClient._setTableResponse(tableName, {
        data: null,
        error: { message: 'DB error' },
      });

      const result = await createFn(sampleInsert as never);
      expect(result.error).toBe(createErrorMsg);
      expect(revalidatePath).not.toHaveBeenCalled();
    });
  });

  describe(`update${entityName}`, () => {
    it('returns error when not admin', async () => {
      mockClient._setAuth(null);
      const result = await updateFn('id-1', sampleInsert as never);
      expect(result.error).toBe('Not authenticated');
    });

    it('updates entity and calls revalidatePath', async () => {
      setAdmin();
      mockClient._setTableResponse(tableName, { data: sampleEntity, error: null });

      const result = await updateFn('id-1', sampleInsert as never);
      expect(result.data).toEqual(sampleEntity);
      expect(revalidatePath).toHaveBeenCalledWith('/');
    });

    it('returns error on database failure', async () => {
      setAdmin();
      mockClient._setTableResponse(tableName, {
        data: null,
        error: { message: 'DB error' },
      });

      const result = await updateFn('id-1', sampleInsert as never);
      expect(result.error).toBe(updateErrorMsg);
      expect(revalidatePath).not.toHaveBeenCalled();
    });
  });

  describe(`delete${entityName}`, () => {
    it('returns error when not admin', async () => {
      mockClient._setAuth(null);
      const result = await deleteFn('id-1');
      expect(result.error).toBe('Not authenticated');
    });

    it('deletes entity and calls revalidatePath', async () => {
      setAdmin();
      mockClient._setTableResponse(tableName, { data: null, error: null });

      const result = await deleteFn('id-1');
      expect(result.data).toEqual({ success: true });
      expect(revalidatePath).toHaveBeenCalledWith('/');
    });

    it('returns error on database failure', async () => {
      setAdmin();
      mockClient._setTableResponse(tableName, {
        data: null,
        error: { message: 'DB error' },
      });

      const result = await deleteFn('id-1');
      expect(result.error).toBe(deleteErrorMsg);
      expect(revalidatePath).not.toHaveBeenCalled();
    });
  });

  describe(`reorder${entityName}s`, () => {
    it('returns error when not admin', async () => {
      mockClient._setAuth(null);
      const result = await reorderFn(['id-2', 'id-1']);
      expect(result.error).toBe('Not authenticated');
    });

    it('updates sort_order for each id and calls revalidatePath', async () => {
      setAdmin();
      mockClient._setTableResponse(tableName, { data: null, error: null });

      const result = await reorderFn(['id-2', 'id-1']);
      expect(result.data).toEqual({ success: true });
      expect(revalidatePath).toHaveBeenCalledWith('/');
    });

    it('returns error when any update fails', async () => {
      setAdmin();
      mockClient._setTableResponse(tableName, {
        data: null,
        error: { message: 'DB error' },
      });

      const result = await reorderFn(['id-2', 'id-1']);
      expect(result.error).toBe(reorderErrorMsg);
      expect(revalidatePath).not.toHaveBeenCalled();
    });
  });
}

// ─── Experience CRUD ─────────────────────────────────────────

describeCrud({
  entityName: 'Experience',
  tableName: 'experiences',
  createFn: createExperience,
  updateFn: updateExperience,
  deleteFn: deleteExperience,
  reorderFn: reorderExperiences,
  sampleInsert: {
    title: 'Senior Dev',
    company: 'Acme',
    description: 'Led team',
    start_date: '2020-01-01',
    display_date: 'Jan 2020 - Present',
  },
  sampleEntity: {
    id: 'exp-1',
    title: 'Senior Dev',
    company: 'Acme',
    description: 'Led team',
    icon: 'work',
    start_date: '2020-01-01',
    end_date: null,
    display_date: 'Jan 2020 - Present',
    company_logo_url: null,
    sort_order: 0,
  },
  createErrorMsg: 'Failed to create experience',
  updateErrorMsg: 'Failed to update experience',
  deleteErrorMsg: 'Failed to delete experience',
  reorderErrorMsg: 'Failed to reorder experiences',
});

// ─── Project CRUD ────────────────────────────────────────────

describeCrud({
  entityName: 'Project',
  tableName: 'projects',
  createFn: createProject,
  updateFn: updateProject,
  deleteFn: deleteProject,
  reorderFn: reorderProjects,
  sampleInsert: {
    title: 'Project Alpha',
    description: 'A project',
    tags: ['React'],
  },
  sampleEntity: {
    id: 'proj-1',
    title: 'Project Alpha',
    description: 'A project',
    tags: ['React'],
    image_url: null,
    demo_video_url: null,
    source_code_url: null,
    live_site_url: null,
    category_id: null,
    sort_order: 0,
  },
  createErrorMsg: 'Failed to create project',
  updateErrorMsg: 'Failed to update project',
  deleteErrorMsg: 'Failed to delete project',
  reorderErrorMsg: 'Failed to reorder projects',
});

// ─── SkillGroup CRUD ─────────────────────────────────────────

describeCrud({
  entityName: 'SkillGroup',
  tableName: 'skill_groups',
  createFn: createSkillGroup,
  updateFn: updateSkillGroup,
  deleteFn: deleteSkillGroup,
  reorderFn: reorderSkillGroups,
  sampleInsert: { category: 'Frontend' },
  sampleEntity: { id: 'sg-1', category: 'Frontend', sort_order: 0 },
  createErrorMsg: 'Failed to create skill group',
  updateErrorMsg: 'Failed to update skill group',
  deleteErrorMsg: 'Failed to delete skill group',
  reorderErrorMsg: 'Failed to reorder skill groups',
});

// ─── Skill CRUD ──────────────────────────────────────────────

describeCrud({
  entityName: 'Skill',
  tableName: 'skills',
  createFn: createSkill,
  updateFn: updateSkill,
  deleteFn: deleteSkill,
  reorderFn: reorderSkills,
  sampleInsert: { name: 'React', group_id: 'sg-1' },
  sampleEntity: { id: 'sk-1', name: 'React', group_id: 'sg-1', sort_order: 0 },
  createErrorMsg: 'Failed to create skill',
  updateErrorMsg: 'Failed to update skill',
  deleteErrorMsg: 'Failed to delete skill',
  reorderErrorMsg: 'Failed to reorder skills',
});

// ─── getResumeDownloads ──────────────────────────────────────

describe('getResumeDownloads', () => {
  it('returns error when not admin', async () => {
    mockClient._setAuth(null);
    const result = await getResumeDownloads();
    expect(result.error).toBe('Not authenticated');
  });

  it('returns mapped download entries with visitor info', async () => {
    setAdmin();

    const rawDownloads = [
      { id: 'dl-1', downloaded_at: '2025-06-01T00:00:00Z', visitor_id: 'v-1' },
      { id: 'dl-2', downloaded_at: '2025-06-02T00:00:00Z', visitor_id: 'v-2' },
    ];
    const visitors = [
      { id: 'v-1', full_name: 'Jane', email: 'jane@test.com', company: 'Corp' },
      { id: 'v-2', full_name: 'Bob', email: 'bob@test.com', company: null },
    ];

    mockClient.from
      .mockReturnValueOnce(createChainMock({ data: rawDownloads, error: null }))
      .mockReturnValueOnce(createChainMock({ data: visitors, error: null }));

    const result = await getResumeDownloads();
    expect(result.data).toEqual([
      {
        id: 'dl-1',
        downloadedAt: '2025-06-01T00:00:00Z',
        visitorName: 'Jane',
        visitorEmail: 'jane@test.com',
        visitorCompany: 'Corp',
      },
      {
        id: 'dl-2',
        downloadedAt: '2025-06-02T00:00:00Z',
        visitorName: 'Bob',
        visitorEmail: 'bob@test.com',
        visitorCompany: null,
      },
    ]);
  });

  it('returns empty array when no downloads exist', async () => {
    setAdmin();
    mockClient.from.mockReturnValueOnce(createChainMock({ data: [], error: null }));

    const result = await getResumeDownloads();
    expect(result.data).toEqual([]);
  });

  it('returns error on database failure', async () => {
    setAdmin();
    mockClient.from.mockReturnValueOnce(
      createChainMock({ data: null, error: { message: 'DB error' } })
    );

    const result = await getResumeDownloads();
    expect(result.error).toBe('Failed to load download log');
  });

  it('handles downloads without visitor_id gracefully', async () => {
    setAdmin();

    const rawDownloads = [{ id: 'dl-1', downloaded_at: '2025-06-01T00:00:00Z', visitor_id: null }];

    mockClient.from.mockReturnValueOnce(createChainMock({ data: rawDownloads, error: null }));
    // No visitor lookup call needed since visitorIds is empty

    const result = await getResumeDownloads();
    expect(result.data).toEqual([
      {
        id: 'dl-1',
        downloadedAt: '2025-06-01T00:00:00Z',
        visitorName: null,
        visitorEmail: null,
        visitorCompany: null,
      },
    ]);
  });
});

// ─── uploadResume ────────────────────────────────────────────

describe('uploadResume', () => {
  function createFormDataWithFile(file: File): FormData {
    const fd = new FormData();
    fd.append('file', file);
    return fd;
  }

  it('returns error when not admin', async () => {
    mockClient._setAuth(null);
    const fd = createFormDataWithFile(new File(['pdf'], 'resume.pdf', { type: 'application/pdf' }));
    const result = await uploadResume(fd);
    expect(result.error).toBe('Not authenticated');
  });

  it('returns error when no file is provided', async () => {
    setAdmin();
    const result = await uploadResume(new FormData());
    expect(result.error).toBe('No file provided');
  });

  it('returns error for non-PDF files', async () => {
    setAdmin();
    const fd = createFormDataWithFile(new File(['text'], 'doc.txt', { type: 'text/plain' }));
    const result = await uploadResume(fd);
    expect(result.error).toBe('Only PDF files are allowed');
  });

  it('returns error for files over 10 MB', async () => {
    setAdmin();
    // Create a file slightly over 10 MB
    const bigContent = new Uint8Array(10 * 1024 * 1024 + 1);
    const fd = createFormDataWithFile(
      new File([bigContent], 'big.pdf', { type: 'application/pdf' })
    );
    const result = await uploadResume(fd);
    expect(result.error).toBe('File must be smaller than 10 MB');
  });

  it('uploads file and updates profile on success', async () => {
    setAdmin();
    mockClient._setStorageResponse('resume', { data: { path: 'resume.pdf' }, error: null });
    mockClient._setTableResponse('profile', { data: null, error: null });

    const file = new File(['pdf content'], 'resume.pdf', { type: 'application/pdf' });
    const fd = createFormDataWithFile(file);
    const result = await uploadResume(fd);

    expect(result.data).toEqual({ path: 'resume.pdf' });
    expect(revalidatePath).toHaveBeenCalledWith('/');
    expect(mockClient.storage.from).toHaveBeenCalledWith('resume');
  });

  it('returns error when storage upload fails', async () => {
    setAdmin();
    mockClient._setStorageResponse('resume', {
      data: null,
      error: { message: 'Storage error' },
    });

    const fd = createFormDataWithFile(new File(['pdf'], 'resume.pdf', { type: 'application/pdf' }));
    const result = await uploadResume(fd);
    expect(result.error).toBe('Failed to upload file');
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it('returns error when profile update fails after upload', async () => {
    setAdmin();
    mockClient._setStorageResponse('resume', { data: { path: 'resume.pdf' }, error: null });
    mockClient._setTableResponse('profile', {
      data: null,
      error: { message: 'DB error' },
    });

    const fd = createFormDataWithFile(new File(['pdf'], 'resume.pdf', { type: 'application/pdf' }));
    const result = await uploadResume(fd);
    expect(result.error).toBe('File uploaded but failed to update profile');
  });
});
