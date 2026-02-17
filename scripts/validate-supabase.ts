/**
 * Validates Supabase connection by attempting a simple query.
 * Exits with code 0 on success, 1 on failure.
 *
 * Usage: npx tsx scripts/validate-supabase.ts
 *
 * If NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY are not set,
 * logs a warning and exits with code 0 (build will use static data fallback).
 */

import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.warn(
    '⚠️  Supabase env vars not set (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY).'
  );
  console.warn('   Build will use static data fallback.');
  process.exit(0);
}

const supabase = createClient(url, anonKey);

async function validate() {
  try {
    const query = supabase.from('profile').select('id').limit(1);
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Connection timed out after 10s')), 10000)
    );

    const { error } = await Promise.race([query, timeout]);

    if (error) {
      console.error('❌ Supabase connection failed:', error.message);
      process.exit(1);
    }

    console.log('✅ Supabase connection verified.');
    process.exit(0);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('❌ Supabase unexpected error:', message);
    process.exit(1);
  }
}

validate();
