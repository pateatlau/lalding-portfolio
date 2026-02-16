/**
 * Setup script — creates the first admin user.
 *
 * Usage: npm run setup-admin
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.
 * Uses the admin client (service role key) to bypass RLS.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// ---------------------------------------------------------------------------
// Load env vars from .env.local
// ---------------------------------------------------------------------------
function loadEnv() {
  try {
    const envPath = resolve(process.cwd(), '.env.local');
    const content = readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex === -1) continue;
      const key = trimmed.slice(0, eqIndex).trim();
      const value = trimmed.slice(eqIndex + 1).trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // .env.local may not exist — that's fine if env vars are set externally
  }
}
loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

// ---------------------------------------------------------------------------
// Admin user config
// ---------------------------------------------------------------------------
const ADMIN_EMAIL = 'pateatlau@gmail.com';
const ADMIN_PASSWORD = 'Tantei@2025';

async function main() {
  console.log(`\nSetting up admin user: ${ADMIN_EMAIL}\n`);

  // Check if user already exists
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const existing = existingUsers?.users.find((u) => u.email === ADMIN_EMAIL);

  if (existing) {
    // User exists — ensure they have admin role
    const hasAdminRole = existing.app_metadata?.role === 'admin';

    if (hasAdminRole) {
      console.log('User already exists with admin role. Setting password...');
    } else {
      console.log('User exists but missing admin role. Updating...');
    }

    const { error } = await supabase.auth.admin.updateUserById(existing.id, {
      password: ADMIN_PASSWORD,
      app_metadata: { role: 'admin' },
    });

    if (error) {
      console.error('Failed to update user:', error.message);
      process.exit(1);
    }

    console.log('Admin role and password set successfully.');
    return;
  }

  // Create new admin user
  const { data, error } = await supabase.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true,
    app_metadata: { role: 'admin' },
  });

  if (error) {
    console.error('Failed to create admin user:', error.message);
    process.exit(1);
  }

  console.log(`Admin user created successfully!`);
  console.log(`  ID:    ${data.user.id}`);
  console.log(`  Email: ${data.user.email}`);
  console.log(`\nYou can now log in at /admin/login`);
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
