import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createMockSupabaseClient,
  createChainMock,
  MOCK_ADMIN_USER,
} from '../helpers/supabase-mock';
import type { MockSupabaseClient } from '../helpers/supabase-mock';
import { mockResumeConfig, mockResumeTemplate, mockResumeVersion } from '../helpers/admin-fixtures';

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
  getResumeConfigs,
  getResumeConfig,
  createResumeConfig,
  updateResumeConfig,
  deleteResumeConfig,
  getResumeVersions,
  activateResumeVersion,
  deleteResumeVersion,
  getResumeTemplates,
  updateResumeTemplate,
} from '@/actions/resume-builder';

let mockClient: MockSupabaseClient;

beforeEach(() => {
  vi.clearAllMocks();
  mockClient = createMockSupabaseClient();
  vi.mocked(createClient).mockResolvedValue(mockClient as never);
});

function setAdmin() {
  mockClient._setAuth(MOCK_ADMIN_USER);
}

// ─── getResumeConfigs ─────────────────────────────────────────

describe('getResumeConfigs', () => {
  it('returns error when not admin', async () => {
    mockClient._setAuth(null);
    const result = await getResumeConfigs();
    expect(result.error).toBe('Not authenticated');
  });

  it('returns configs with template names on success', async () => {
    setAdmin();

    const configRows = [
      {
        id: 'cfg-1',
        name: 'Default Resume',
        description: 'Main config',
        template_id: 'tmpl-1',
        jd_coverage_score: 0.73,
        is_active: true,
        updated_at: '2025-01-01T00:00:00Z',
      },
    ];
    const templateRows = [{ id: 'tmpl-1', name: 'Professional' }];

    mockClient.from
      .mockReturnValueOnce(createChainMock({ data: configRows, error: null }))
      .mockReturnValueOnce(createChainMock({ data: templateRows, error: null }));

    const result = await getResumeConfigs();
    expect(result.data).toHaveLength(1);
    expect(result.data![0]).toEqual({
      id: 'cfg-1',
      name: 'Default Resume',
      description: 'Main config',
      template_id: 'tmpl-1',
      templateName: 'Professional',
      jd_coverage_score: 0.73,
      is_active: true,
      updated_at: '2025-01-01T00:00:00Z',
    });
  });

  it('returns error on database failure', async () => {
    setAdmin();
    mockClient.from.mockReturnValueOnce(
      createChainMock({ data: null, error: { message: 'DB error' } })
    );

    const result = await getResumeConfigs();
    expect(result.error).toBe('Failed to load resume configs');
  });
});

// ─── getResumeConfig ──────────────────────────────────────────

describe('getResumeConfig', () => {
  it('returns error when not admin', async () => {
    mockClient._setAuth(null);
    const result = await getResumeConfig('cfg-1');
    expect(result.error).toBe('Not authenticated');
  });

  it('returns config on success', async () => {
    setAdmin();
    mockClient._setTableResponse('resume_configs', { data: mockResumeConfig, error: null });

    const result = await getResumeConfig('cfg-1');
    expect(result.data).toEqual(mockResumeConfig);
  });

  it('returns error on database failure', async () => {
    setAdmin();
    mockClient._setTableResponse('resume_configs', {
      data: null,
      error: { message: 'Not found' },
    });

    const result = await getResumeConfig('cfg-1');
    expect(result.error).toBe('Resume config not found');
  });
});

// ─── createResumeConfig ───────────────────────────────────────

describe('createResumeConfig', () => {
  it('returns error when not admin', async () => {
    mockClient._setAuth(null);
    const result = await createResumeConfig({ name: 'Test' });
    expect(result.error).toBe('Not authenticated');
  });

  it('creates config and revalidates on success', async () => {
    setAdmin();
    mockClient._setTableResponse('resume_configs', { data: mockResumeConfig, error: null });

    const result = await createResumeConfig({ name: 'Default Resume' });
    expect(result.data).toEqual(mockResumeConfig);
    expect(revalidatePath).toHaveBeenCalledWith('/admin');
    expect(mockClient.from).toHaveBeenCalledWith('resume_configs');
  });

  it('returns error on database failure', async () => {
    setAdmin();
    mockClient._setTableResponse('resume_configs', {
      data: null,
      error: { message: 'Insert failed' },
    });

    const result = await createResumeConfig({ name: 'Test' });
    expect(result.error).toBe('Failed to create resume config');
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

// ─── updateResumeConfig ───────────────────────────────────────

describe('updateResumeConfig', () => {
  it('returns error when not admin', async () => {
    mockClient._setAuth(null);
    const result = await updateResumeConfig('cfg-1', { name: 'Updated' });
    expect(result.error).toBe('Not authenticated');
  });

  it('updates config and revalidates on success', async () => {
    setAdmin();
    const updatedConfig = { ...mockResumeConfig, name: 'Updated Resume' };
    mockClient._setTableResponse('resume_configs', { data: updatedConfig, error: null });

    const result = await updateResumeConfig('cfg-1', { name: 'Updated Resume' });
    expect(result.data).toEqual(updatedConfig);
    expect(revalidatePath).toHaveBeenCalledWith('/admin');
  });

  it('returns error on database failure', async () => {
    setAdmin();
    mockClient._setTableResponse('resume_configs', {
      data: null,
      error: { message: 'Update failed' },
    });

    const result = await updateResumeConfig('cfg-1', { name: 'Updated' });
    expect(result.error).toBe('Failed to update resume config');
  });
});

// ─── deleteResumeConfig ───────────────────────────────────────

describe('deleteResumeConfig', () => {
  it('returns error when not admin', async () => {
    mockClient._setAuth(null);
    const result = await deleteResumeConfig('cfg-1');
    expect(result.error).toBe('Not authenticated');
  });

  it('deletes config, cleans up storage, and revalidates', async () => {
    setAdmin();

    // First call: fetch versions for storage paths
    // Second call: delete config row (cascade removes versions)
    // Third call: storage delete (via deleteStorageFile → admin action)
    mockClient.from
      .mockReturnValueOnce(createChainMock({ data: [mockResumeVersion], error: null }))
      .mockReturnValueOnce(createChainMock({ data: null, error: null }))
      .mockReturnValueOnce(createChainMock({ data: null, error: null }));

    // Mock storage removal
    mockClient._setStorageResponse('resume', { data: null, error: null });

    const result = await deleteResumeConfig('cfg-1');
    expect(result.data).toEqual({ success: true });
    expect(revalidatePath).toHaveBeenCalledWith('/admin');
  });

  it('returns error on database failure', async () => {
    setAdmin();

    // Versions fetch OK, no versions to clean up, then delete fails
    mockClient.from
      .mockReturnValueOnce(createChainMock({ data: [], error: null }))
      .mockReturnValueOnce(createChainMock({ data: null, error: { message: 'Delete failed' } }));

    const result = await deleteResumeConfig('cfg-1');
    expect(result.error).toBe('Failed to delete resume config');
  });
});

// ─── getResumeVersions ───────────────────────────────────────

describe('getResumeVersions', () => {
  it('returns error when not admin', async () => {
    mockClient._setAuth(null);
    const result = await getResumeVersions('cfg-1');
    expect(result.error).toBe('Not authenticated');
  });

  it('returns versions on success', async () => {
    setAdmin();

    const versionRows = [
      {
        id: 'ver-1',
        config_id: 'cfg-1',
        pdf_storage_path: 'generated/cfg-1/ver-1.pdf',
        pdf_file_size: 102400,
        page_count: 1,
        generation_time_ms: 2500,
        is_active: true,
        created_at: '2025-01-15T12:00:00Z',
      },
    ];

    mockClient._setTableResponse('resume_versions', { data: versionRows, error: null });

    const result = await getResumeVersions('cfg-1');
    expect(result.data).toHaveLength(1);
    expect(result.data![0].id).toBe('ver-1');
  });

  it('returns error on database failure', async () => {
    setAdmin();
    mockClient._setTableResponse('resume_versions', {
      data: null,
      error: { message: 'DB error' },
    });

    const result = await getResumeVersions('cfg-1');
    expect(result.error).toBe('Failed to load resume versions');
  });
});

// ─── activateResumeVersion ────────────────────────────────────

describe('activateResumeVersion', () => {
  it('returns error when not admin', async () => {
    mockClient._setAuth(null);
    const result = await activateResumeVersion('ver-1');
    expect(result.error).toBe('Not authenticated');
  });

  it('deactivates all, activates target, updates profile', async () => {
    setAdmin();

    // 1. Find previously active version (maybeSingle)
    // 2. Deactivate all active versions
    // 3. Activate target version (returns pdf_storage_path)
    // 4. Update profile resume_url
    mockClient.from
      .mockReturnValueOnce(createChainMock({ data: { id: 'ver-old' }, error: null }))
      .mockReturnValueOnce(createChainMock({ data: null, error: null }))
      .mockReturnValueOnce(
        createChainMock({
          data: { pdf_storage_path: 'generated/cfg-1/ver-1.pdf' },
          error: null,
        })
      )
      .mockReturnValueOnce(createChainMock({ data: null, error: null }));

    const result = await activateResumeVersion('ver-1');
    expect(result.data).toEqual({ success: true });
    expect(revalidatePath).toHaveBeenCalledWith('/');
    expect(revalidatePath).toHaveBeenCalledWith('/admin');
  });

  it('returns error when activation fails', async () => {
    setAdmin();

    // 1. Find previously active version
    // 2. Deactivate all
    // 3. Activate target fails
    mockClient.from
      .mockReturnValueOnce(createChainMock({ data: null, error: null }))
      .mockReturnValueOnce(createChainMock({ data: null, error: null }))
      .mockReturnValueOnce(createChainMock({ data: null, error: { message: 'Activate failed' } }));

    const result = await activateResumeVersion('ver-1');
    expect(result.error).toBe('Failed to activate resume version');
  });
});

// ─── deleteResumeVersion ──────────────────────────────────────

describe('deleteResumeVersion', () => {
  it('returns error when not admin', async () => {
    mockClient._setAuth(null);
    const result = await deleteResumeVersion('ver-1');
    expect(result.error).toBe('Not authenticated');
  });

  it('blocks deletion of active version', async () => {
    setAdmin();
    mockClient._setTableResponse('resume_versions', {
      data: { pdf_storage_path: 'path.pdf', is_active: true },
      error: null,
    });

    const result = await deleteResumeVersion('ver-1');
    expect(result.error).toBe('Cannot delete the active resume version. Deactivate it first.');
  });

  it('deletes inactive version and cleans up storage', async () => {
    setAdmin();

    // 1. Fetch version
    // 2. Delete version row (DB first)
    // 3. Delete storage file (via deleteStorageFile)
    mockClient.from
      .mockReturnValueOnce(
        createChainMock({
          data: { pdf_storage_path: 'generated/cfg-1/ver-2.pdf', is_active: false },
          error: null,
        })
      )
      .mockReturnValueOnce(createChainMock({ data: null, error: null }));

    mockClient._setStorageResponse('resume', { data: null, error: null });

    const result = await deleteResumeVersion('ver-1');
    expect(result.data).toEqual({ success: true });
    expect(revalidatePath).toHaveBeenCalledWith('/admin');
  });

  it('returns error when version not found', async () => {
    setAdmin();
    mockClient._setTableResponse('resume_versions', {
      data: null,
      error: { message: 'Not found' },
    });

    const result = await deleteResumeVersion('ver-999');
    expect(result.error).toBe('Resume version not found');
  });
});

// ─── getResumeTemplates ───────────────────────────────────────

describe('getResumeTemplates', () => {
  it('returns error when not admin', async () => {
    mockClient._setAuth(null);
    const result = await getResumeTemplates();
    expect(result.error).toBe('Not authenticated');
  });

  it('returns templates on success', async () => {
    setAdmin();

    const templateRow = {
      id: mockResumeTemplate.id,
      registry_key: mockResumeTemplate.registry_key,
      name: mockResumeTemplate.name,
      description: mockResumeTemplate.description,
      is_builtin: mockResumeTemplate.is_builtin,
      page_size: mockResumeTemplate.page_size,
      columns: mockResumeTemplate.columns,
      style_config: mockResumeTemplate.style_config,
      sort_order: mockResumeTemplate.sort_order,
    };

    mockClient._setTableResponse('resume_templates', { data: [templateRow], error: null });

    const result = await getResumeTemplates();
    expect(result.data).toHaveLength(1);
    expect(result.data![0].name).toBe('Professional');
  });

  it('returns error on database failure', async () => {
    setAdmin();
    mockClient._setTableResponse('resume_templates', {
      data: null,
      error: { message: 'DB error' },
    });

    const result = await getResumeTemplates();
    expect(result.error).toBe('Failed to load resume templates');
  });
});

// ─── updateResumeTemplate ─────────────────────────────────────

describe('updateResumeTemplate', () => {
  it('returns error when not admin', async () => {
    mockClient._setAuth(null);
    const result = await updateResumeTemplate('tmpl-1', { name: 'Updated' });
    expect(result.error).toBe('Not authenticated');
  });

  it('updates template and revalidates on success', async () => {
    setAdmin();
    mockClient._setTableResponse('resume_templates', { data: null, error: null });

    const result = await updateResumeTemplate('tmpl-1', {
      style_config: { primaryColor: '#000' },
    });
    expect(result.data).toEqual({ success: true });
    expect(revalidatePath).toHaveBeenCalledWith('/admin');
  });

  it('returns error on database failure', async () => {
    setAdmin();
    mockClient._setTableResponse('resume_templates', {
      data: null,
      error: { message: 'Update failed' },
    });

    const result = await updateResumeTemplate('tmpl-1', { name: 'Updated' });
    expect(result.error).toBe('Failed to update resume template');
  });
});
