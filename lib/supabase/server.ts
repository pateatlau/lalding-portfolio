import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from './types';

// Placeholder values satisfy the Supabase SDK's constructor validation
// when real env vars are missing (e.g. CI builds without Supabase).
// Operations will fail gracefully (auth returns no user, queries error).
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

let warnedOnce = false;

export async function createClient() {
  if (
    !warnedOnce &&
    (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  ) {
    console.warn(
      '⚠️  Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY — using placeholder. Auth and DB operations will fail.'
    );
    warnedOnce = true;
  }
  const cookieStore = await cookies();

  return createServerClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // setAll is called from a Server Component where cookies
          // cannot be set. This is expected when reading auth state
          // in layouts/pages — the middleware handles the refresh.
        }
      },
    },
  });
}
