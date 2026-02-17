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
  const { error } = await supabase.from('profile').select('id').limit(1);

  if (error) {
    console.error('❌ Supabase connection failed:', error.message);
    process.exit(1);
  }

  console.log('✅ Supabase connection verified.');
  process.exit(0);
}

validate();
