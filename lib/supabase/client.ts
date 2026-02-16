import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './types';

// Placeholder values allow the Supabase SDK to construct without throwing
// during SSR/build when env vars are absent (e.g. CI). Auth and query
// operations will fail gracefully. The real guard is in signInWithOAuth
// (auth-context.tsx) which checks before redirecting to the Supabase URL.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const isSupabaseConfigured = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export function createClient() {
  return createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
}
