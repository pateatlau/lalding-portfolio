import { vi } from 'vitest';

type SupabaseResponse = { data: unknown; error: unknown; count?: number | null };

/**
 * Creates a chainable mock that mimics the Supabase query builder.
 * Every intermediate method returns `this`. When awaited, resolves to { data, error, count }.
 */
export function createChainMock(
  response: SupabaseResponse = { data: null, error: null }
): Record<string, ReturnType<typeof vi.fn>> & PromiseLike<SupabaseResponse> {
  const chain = {} as Record<string, ReturnType<typeof vi.fn>> & PromiseLike<SupabaseResponse>;

  const methods = [
    'select',
    'insert',
    'update',
    'delete',
    'upsert',
    'eq',
    'neq',
    'gt',
    'gte',
    'lt',
    'lte',
    'in',
    'order',
    'limit',
    'single',
    'maybeSingle',
    'filter',
    'match',
    'range',
  ];

  for (const method of methods) {
    chain[method] = vi.fn().mockReturnValue(chain);
  }

  // Thenable so `await` resolves to the configured response
  chain.then = vi.fn((resolve: (value: SupabaseResponse) => void) =>
    resolve(response)
  ) as unknown as PromiseLike<SupabaseResponse>['then'];

  return chain;
}

export function createStorageBucketMock(
  response: { data: unknown; error: unknown } = { data: null, error: null }
) {
  return {
    upload: vi.fn().mockResolvedValue(response),
    download: vi.fn().mockResolvedValue(response),
    remove: vi.fn().mockResolvedValue(response),
    createSignedUrl: vi.fn().mockResolvedValue(response),
    getPublicUrl: vi.fn().mockReturnValue({
      data: { publicUrl: 'https://example.com/file.pdf' },
    }),
  };
}

export type MockSupabaseClient = ReturnType<typeof createMockSupabaseClient>;

export function createMockSupabaseClient() {
  const tableResponses = new Map<string, SupabaseResponse>();
  const storageResponses = new Map<string, { data: unknown; error: unknown }>();

  const client = {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: null },
        error: null,
      }),
    },

    from: vi.fn((table: string) => {
      const response = tableResponses.get(table) ?? { data: null, error: null };
      return createChainMock(response);
    }),

    storage: {
      from: vi.fn((bucket: string) => {
        const response = storageResponses.get(bucket) ?? {
          data: null,
          error: null,
        };
        return createStorageBucketMock(response);
      }),
    },

    // --- Test helpers ---

    _setTableResponse(table: string, response: SupabaseResponse) {
      tableResponses.set(table, response);
    },

    _setStorageResponse(bucket: string, response: { data: unknown; error: unknown }) {
      storageResponses.set(bucket, response);
    },

    _setAuth(user: unknown, error: unknown = null) {
      client.auth.getUser.mockResolvedValue({ data: { user }, error });
    },
  };

  return client;
}

// --- Auth fixtures ---

export const MOCK_ADMIN_USER = {
  id: 'admin-user-id',
  email: 'admin@example.com',
  app_metadata: { role: 'admin' },
  user_metadata: {},
};

export const MOCK_NON_ADMIN_USER = {
  id: 'regular-user-id',
  email: 'user@example.com',
  app_metadata: {},
  user_metadata: {},
};
