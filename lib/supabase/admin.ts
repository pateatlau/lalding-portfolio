import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-role-key';

let warnedOnce = false;

// Admin client using service role key — bypasses RLS.
// Use only for server-side operations that genuinely need to bypass RLS,
// such as seeding data and setting admin roles.
// NEVER expose this client or the service role key to the browser.
export function createAdminClient() {
  if (
    !warnedOnce &&
    (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY)
  ) {
    console.warn(
      '⚠️  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY — using placeholder. Admin operations will fail.'
    );
    warnedOnce = true;
  }
  return createClient<Database>(SUPABASE_URL, SERVICE_ROLE_KEY);
}
