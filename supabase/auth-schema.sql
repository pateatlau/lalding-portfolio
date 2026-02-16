-- ============================================
-- AUTH & VISITOR TABLES (Phase 2)
-- ============================================
-- Run this file in the Supabase SQL Editor after enabling Auth providers.
-- Depends on: auth.users (managed by Supabase Auth automatically).

-- Visitor profiles (populated on social login)
-- Extends auth.users with optional fields (company, role).
-- Email is denormalized for admin views/CSV export; synced via trigger below.
CREATE TABLE visitor_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  provider TEXT,
  company TEXT,
  role TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Resume download log
CREATE TABLE resume_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id UUID REFERENCES visitor_profiles(id) ON DELETE SET NULL,
  downloaded_at TIMESTAMPTZ DEFAULT now()
);

-- Keep visitor_profiles.email in sync when auth.users.email changes
CREATE OR REPLACE FUNCTION sync_visitor_email()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.email IS DISTINCT FROM NEW.email THEN
    UPDATE visitor_profiles SET email = NEW.email WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_email_updated
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW EXECUTE FUNCTION sync_visitor_email();
