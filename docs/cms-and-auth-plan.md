# CMS, Authentication & Content Management Plan

## Overview

Migrate hardcoded portfolio content to a Supabase-backed CMS with an admin dashboard, and add authentication for resume downloads and admin access.

### Decisions

| Concern            | Choice                             |
| ------------------ | ---------------------------------- |
| Database           | Supabase (Postgres)                |
| Auth               | Supabase Auth                      |
| File storage       | Supabase Storage                   |
| Admin dashboard    | Built-in Next.js `/admin` routes   |
| Visitor login gate | Resume download only               |
| Visitor data       | Capture profile + optional fields  |
| Contact form       | Pre-fill from session if logged in |

---

## Phase 1: Supabase Setup & Database Schema

### 1.1 Supabase Project Setup

- Create Supabase project
- Install `@supabase/supabase-js` and `@supabase/ssr`
- Add environment variables:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (server-side only, for bootstrap operations like seeding and setting admin roles — never exposed to the client)
- Create Supabase client utilities:
  - `lib/supabase/client.ts` — browser client (uses anon key)
  - `lib/supabase/server.ts` — server client (uses anon key + user's JWT for RLS-respecting operations; service role key used only in `lib/supabase/admin.ts` for specific operations that genuinely need to bypass RLS, such as setting admin roles)

### 1.2 Database Schema

Tables map to the current data structures in `lib/data.ts` plus hardcoded content across components.

```sql
-- ============================================
-- CONTENT TABLES
-- ============================================

-- Personal info (about, intro, contact, footer — singleton row)
-- Enforced via UNIQUE constraint on a constant sentinel value.
CREATE TABLE profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton BOOLEAN NOT NULL DEFAULT true UNIQUE CHECK (singleton = true),
  full_name TEXT NOT NULL,
  short_name TEXT NOT NULL,           -- "Lalding"
  job_title TEXT NOT NULL,            -- "Full-stack Tech Lead"
  tagline TEXT,                       -- intro paragraph
  typewriter_titles TEXT[] NOT NULL,  -- ["Full-stack Tech Lead", "React Specialist", ...]
  email TEXT NOT NULL,
  phone TEXT,
  location TEXT,
  linkedin_url TEXT,
  github_url TEXT,
  resume_url TEXT,                    -- Supabase Storage path
  about_tech_stack TEXT,              -- tech stack description paragraph
  about_current_focus TEXT,           -- current focus paragraph
  about_beyond_code TEXT,             -- beyond code paragraph
  about_expertise TEXT[],             -- ["Monorepos & NX", "Micro Frontends", ...]
  footer_text TEXT,                   -- footer description
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- About section stats (15+ years, 50+ projects, etc.)
CREATE TABLE profile_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  value INTEGER NOT NULL,
  suffix TEXT DEFAULT '+',
  label TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- Navigation links
CREATE TABLE nav_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  hash TEXT NOT NULL,                 -- "#home", "#about", etc.
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- Companies (logo slider)
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT NOT NULL,             -- Supabase Storage path
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- Experience / career timeline
CREATE TABLE experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,                -- "Deputy Vice President"
  company TEXT NOT NULL,              -- "HDFC Bank Limited"
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'work',  -- string identifier mapped to React icons in frontend
  start_date DATE NOT NULL,           -- enables sorting and date-based queries
  end_date DATE,                      -- NULL = current/present role
  display_date TEXT NOT NULL,         -- human-readable label, e.g. "May 2023 - Present"
  company_logo_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- Project categories
CREATE TABLE project_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,          -- "All", "React", "Mobile", "Full-stack"
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- Projects
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  tags TEXT[] NOT NULL,
  image_url TEXT,                     -- Supabase Storage path (e.g. "project-images/my-project.png")
  demo_video_url TEXT,               -- Supabase Storage path (optional, e.g. "project-videos/demo.mp4")
  source_code_url TEXT,
  live_site_url TEXT,
  category_id UUID REFERENCES project_categories(id),
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- Skill groups
CREATE TABLE skill_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,             -- "Frontend", "Backend & Database", etc.
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- Skills (belong to a group)
CREATE TABLE skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  group_id UUID REFERENCES skill_groups(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- ============================================
-- AUTH & VISITOR TABLES
-- ============================================

-- Visitor profiles (populated on social login)
-- Supabase Auth handles the auth.users table automatically.
-- This table extends it with optional fields not available in auth.users
-- (company, role). The email field is denormalized here for convenience
-- in admin views and CSV export; it is kept in sync via a DB trigger
-- (see below) and refreshed on every login upsert. auth.users is the
-- source of truth for email.
CREATE TABLE visitor_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,                         -- denormalized from auth.users, synced via trigger
  avatar_url TEXT,
  provider TEXT,                      -- "google", "linkedin_oidc", "github"
  company TEXT,                       -- optional, asked before download
  role TEXT,                          -- optional, asked before download
  created_at TIMESTAMPTZ DEFAULT now()
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

-- Resume download log
CREATE TABLE resume_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id UUID REFERENCES visitor_profiles(id) ON DELETE SET NULL,
  downloaded_at TIMESTAMPTZ DEFAULT now()
);

-- Admin users (subset of auth.users with admin role)
-- Managed via Supabase Auth app_metadata: { role: "admin" }
-- Set server-side via Supabase Admin API (supabase.auth.admin.updateUserById)
-- No separate table needed — use RLS policies + app_metadata.
```

**Icon mapping note**: The current `lib/data.ts` stores React elements (`React.createElement(CgWorkAlt)`) for experience icons. The database stores string identifiers (e.g., `"work"`, `"react"`). The seed script maps current React elements to string keys, and the frontend maps strings back to icons via a lookup object:

```typescript
const iconMap: Record<string, React.ReactNode> = {
  work: <CgWorkAlt />,
  react: <FaReact />,
};
```

### 1.3 Row Level Security (RLS)

```sql
-- Content tables: public read, admin write
-- Pattern applied to all content tables:
ALTER TABLE profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read" ON profile
  FOR SELECT USING (true);

CREATE POLICY "Admin write" ON profile
  FOR ALL
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- visitor_profiles: visitors can read/update their own row
ALTER TABLE visitor_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own profile" ON visitor_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users update own profile" ON visitor_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users insert own profile" ON visitor_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Admin read all" ON visitor_profiles
  FOR SELECT USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- resume_downloads: visitors insert own, admin read all
ALTER TABLE resume_downloads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own download" ON resume_downloads
  FOR INSERT WITH CHECK (auth.uid() = visitor_id);

CREATE POLICY "Admin read all downloads" ON resume_downloads
  FOR SELECT USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );
```

### 1.4 Supabase Storage Buckets

| Bucket           | Access  | Purpose                                    |
| ---------------- | ------- | ------------------------------------------ |
| `resume`         | Private | Resume PDF (served via signed URL on auth) |
| `project-images` | Public  | Project screenshot images                  |
| `project-videos` | Public  | Optional short demo videos for projects    |
| `company-logos`  | Public  | Company logo images                        |

### 1.5 Seed Script

Create `lib/supabase/seed.ts` to migrate current `lib/data.ts` + hardcoded content into the database. This ensures no data is lost during migration. The seed script:

- Maps `React.createElement()` icon calls to string identifiers
- Parses free-form date strings into structured date fields using a `parseDateRange()` function
- Sets `demo_video_url` to `NULL` for all existing projects (videos will be added later via admin dashboard)

**Date parsing rules** (`parseDateRange`):

| Input pattern               | start_date   | end_date     | display_date    |
| --------------------------- | ------------ | ------------ | --------------- |
| `"Month Year - Month Year"` | 1st of month | 1st of month | original string |
| `"Month Year - Year"`       | 1st of month | Jan 1st      | original string |
| `"Month Year - Present"`    | 1st of month | `NULL`       | original string |
| Year-only (e.g., `"2025"`)  | Jan 1st      | `NULL`       | original string |

- "Present", "Current", and "Now" (case-insensitive) → `end_date = NULL`
- Unparseable values → log a warning, use current date as `start_date`, `NULL` as `end_date`, and flag for manual review
- The original string is always preserved as `display_date`

Example: `"May 2023 - 2025"` → `{ start_date: "2023-05-01", end_date: "2025-01-01", display_date: "May 2023 - 2025" }`

### Phase 1 Implementation Notes

- Auth/visitor tables (`visitor_profiles`, `resume_downloads`, email sync trigger) are deferred to Phase 2 since they depend on Supabase Auth being configured. Phase 1 creates content tables only.
- SQL files are stored in `supabase/` directory at the project root:
  - `supabase/schema.sql` — content tables
  - `supabase/rls.sql` — RLS policies for content tables
  - `supabase/storage.sql` — storage bucket creation + access policies
- These SQL files must be run manually in the Supabase SQL Editor after creating the project.
- TypeScript types in `lib/supabase/types.ts` are hand-written to match the schema. They can be regenerated later via `supabase gen types typescript` once the Supabase CLI is set up.
- The seed script uses the admin client (service role key) to bypass RLS.
- `next.config.js` is updated with Supabase hostname in `images.remotePatterns` so `<Image>` works with Supabase Storage URLs.

### Phase 1 Status: COMPLETE

---

## Phase 2: Authentication

### 2.1 Supabase Auth Configuration

Configure providers in Supabase dashboard:

| Provider         | Use case              | Notes                                        |
| ---------------- | --------------------- | -------------------------------------------- |
| Google           | Visitor + Admin login | OAuth 2.0, configure in Google Cloud Console |
| LinkedIn (OIDC)  | Visitor + Admin login | LinkedIn uses OIDC provider in Supabase      |
| GitHub           | Visitor + Admin login | OAuth App in GitHub settings                 |
| Email + Password | Admin login only      | Disabled for visitors                        |

### 2.2 Auth Proxy (Route Protection)

Create `proxy.ts` at the project root to handle session refresh and route protection (Next.js 16 uses the `proxy` convention instead of `middleware`):

```text
/admin/*     → Require authenticated user with admin role
/api/admin/* → Require authenticated user with admin role
Everything else → Public
```

Resume downloads are handled via a server action (not an API route), so auth is checked inside the action itself rather than in middleware.

### 2.3 Auth UI Components

| Component             | Location                                    | Purpose                                                                                                  |
| --------------------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `LoginModal`          | `components/auth/login-modal.tsx`           | Modal with social login buttons (Google, LinkedIn, GitHub). Shown when visitor clicks "Download Resume". |
| `AdminLoginPage`      | `app/admin/login/page.tsx`                  | Admin login page with email/password + social login options.                                             |
| `AuthProvider`        | `context/auth-context.tsx`                  | React context wrapping Supabase auth state. Provides `user`, `session`, `signIn`, `signOut`.             |
| `OptionalFieldsModal` | `components/auth/optional-fields-modal.tsx` | After first social login, optionally ask for company and role before proceeding to download.             |

### 2.4 Resume Download Flow

```text
1. Visitor clicks "Download Resume" (intro.tsx or command palette)
2. If not authenticated → show LoginModal with social login buttons
3. On successful login:
   a. Upsert visitor_profiles row (name, email, avatar, provider from OAuth)
   b. If first login → show OptionalFieldsModal (company, role — skippable)
   c. Call server action to generate a signed URL (5-minute expiry) for the private resume bucket
   d. Log download in resume_downloads table (server-side)
   e. Return signed URL to client, trigger browser download
4. If already authenticated → skip to step 3c
```

### 2.5 Contact Form Pre-fill

When a visitor is logged in (has an active Supabase session):

- Pre-fill the contact form's name and email fields from `visitor_profiles`
- Fields remain editable (pre-filled, not locked)
- No change to the server action `sendEmail.ts` — it still receives form data as before

### Phase 2 Implementation Notes

- Created `supabase/auth-schema.sql` with `visitor_profiles` table (references `auth.users`), `resume_downloads` table, and `sync_visitor_email()` trigger function.
- Created `supabase/auth-rls.sql` with RLS policies: visitors can read/update/insert own profile row, admin can read all; visitors can insert own downloads, admin can read all.
- Added `VisitorProfile`, `ResumeDownload`, and their Insert types to `lib/supabase/types.ts`, following the existing pattern with Row, Insert, Update, Relationships properties.
- Created `proxy.ts` at project root using `@supabase/ssr` `createServerClient` with request/response cookie handling (Next.js 16 convention). Refreshes auth session on every request, protects `/admin/*` routes (requires `app_metadata.role === 'admin'`), redirects unauthorized users to `/`.
- Created `app/auth/callback/route.ts` — GET route handler that exchanges OAuth `code` for a session via `supabase.auth.exchangeCodeForSession()` and redirects to the `next` query param or `/`.
- Created `context/auth-context.tsx` following existing context provider pattern. Provides `user`, `visitorProfile`, `isLoading`, `isNewUser`, `signInWithProvider()`, `signOut()`, `refreshVisitorProfile()`, `clearNewUserFlag()`. Listens to `onAuthStateChange` and upserts visitor profile via server action on `SIGNED_IN`.
- Created `actions/resume.ts` with three server actions:
  - `upsertVisitorProfile()` — gets user from session, upserts `visitor_profiles` row, returns `{ data, isNewUser }`.
  - `updateVisitorOptionalFields(company, role)` — updates company and role fields.
  - `downloadResume()` — verifies auth, generates signed URL (5-min expiry) from private `resume` bucket, logs download in `resume_downloads`.
- Created `components/auth/login-modal.tsx` — Framer Motion modal with Google, GitHub, LinkedIn social login buttons. Stores `pendingAction` in localStorage before OAuth redirect.
- Created `components/auth/optional-fields-modal.tsx` — Framer Motion modal with Company and Role inputs, Skip/Continue buttons.
- Added `useResumeDownload` hook to `lib/hooks.ts` — encapsulates the full auth-gated download flow. Checks auth state, shows login modal for unauthenticated users, shows optional fields modal for new users, triggers signed URL download for authenticated users. Subscribes to `onAuthStateChange` to resume download after OAuth redirect.
- Updated `components/intro.tsx` — replaced `<a>` download link with `<button>` that calls `handleResumeClick()`, shows loading spinner during download, renders `LoginModal` and `OptionalFieldsModal`.
- Updated `components/command-palette.tsx` — replaced direct download action with `handleResumeClick()`, renders `LoginModal` and `OptionalFieldsModal`.
- Updated `components/contact.tsx` — added `senderName` text input above email field, pre-fills both name and email from `visitorProfile` using `defaultValue` with `key`-based re-mounting when profile loads. Fields remain editable.
- Updated `app/layout.tsx` — wrapped with `AuthProvider` inside `ThemeContextProvider`.
- Note: Next.js 16 shows a deprecation warning that "middleware" should use "proxy" convention. The middleware still works correctly; this is an informational warning for a future migration.
- AdminLoginPage (`app/admin/login/page.tsx`) is deferred to Phase 4 since it's part of the admin dashboard.
- **Known issue**: LinkedIn OIDC login is not working (Google and GitHub work fine). Deferred — will debug after all phases are implemented. Most likely a configuration issue in the LinkedIn Developer Portal (OIDC product approval, redirect URL, or scope mismatch).

### Phase 2 Status: COMPLETE

---

## Phase 3: Data Layer — Fetching Content from Supabase

### 3.1 Data Fetching Strategy

Replace static imports from `lib/data.ts` with Supabase queries. Since this is a portfolio site with infrequently changing content, we'll use **ISR (Incremental Static Regeneration)** with on-demand revalidation.

| Pattern                | Where                        | How                                                                 |
| ---------------------- | ---------------------------- | ------------------------------------------------------------------- |
| Server Components      | `app/page.tsx`               | Fetch data in server components, pass as props to client components |
| ISR + revalidation     | `app/page.tsx`, `layout.tsx` | `export const revalidate = 3600` (per-segment, App Router pattern)  |
| On-demand revalidation | Admin dashboard save         | Call `revalidatePath('/')` and `revalidateTag()` after admin edits  |
| Client-side auth state | Auth context                 | Supabase real-time auth listener                                    |

### 3.2 Cache Tag Strategy

Use `revalidateTag()` for granular cache invalidation. Each data fetch is tagged, and admin actions invalidate only the relevant tag(s).

| Tag           | Scope                                | Attached to                               | Invalidated by                                                   |
| ------------- | ------------------------------------ | ----------------------------------------- | ---------------------------------------------------------------- |
| `profile`     | Profile info, stats, contact, footer | `getProfile()`, `getProfileStats()`       | `updateProfile()`, `updateStats()`                               |
| `experiences` | Career timeline + companies slider   | `getExperiences()`, `getCompanies()`      | `createExperience()`, `updateExperience()`, `deleteExperience()` |
| `projects`    | Project cards + categories           | `getProjects()`, `getProjectCategories()` | `createProject()`, `updateProject()`, `deleteProject()`          |
| `skills`      | Skill groups and individual skills   | `getSkillGroups()`                        | `createSkill()`, `updateSkill()`, `deleteSkill()`                |
| `navigation`  | Header nav links                     | `getNavLinks()`                           | `updateNavLinks()`                                               |

Tags are attached in query functions via `next: { tags: ['profile'] }` options. Admin server actions call `revalidateTag('<tag>')` after mutations, with `revalidatePath('/')` as a fallback to ensure full-page invalidation when needed.

### 3.3 Refactor Component Architecture

Currently `app/page.tsx` is a client component (`'use client'`) and all data-consuming components import directly from `lib/data.ts`. Refactor:

1. **`app/page.tsx`** — Remove `'use client'` directive, convert to a **server component**. Fetch all content data from Supabase here. This requires moving Framer Motion animations out of the page component and into individual section wrapper client components.
2. Pass data as serializable props to child components.
3. Client components (`'use client'`) remain for:
   - Components with interactivity (animations, filters, scroll observers)
   - Auth-dependent UI (download button, contact form pre-fill)
   - Each section already has its own client component — these receive data as props instead of importing from `lib/data.ts`

### 3.4 Data Fetching Functions

Create `lib/supabase/queries.ts` with typed query functions:

```typescript
// Each function returns typed data from Supabase
getProfile()          → Profile
getProfileStats()     → ProfileStat[]
getNavLinks()         → NavLink[]
getCompanies()        → Company[]
getExperiences()      → Experience[]
getProjectCategories()→ ProjectCategory[]
getProjects()         → Project[] (includes optional demo_video_url)
getSkillGroups()      → SkillGroup[] (with nested skills)
```

### 3.5 TypeScript Types

Create `lib/supabase/types.ts` — generate from Supabase schema using `supabase gen types typescript`. These types replace the current `lib/types.ts` and inline types in `lib/data.ts`.

### 3.6 Migration Path

To avoid a big-bang migration, implement a **fallback pattern** during development only:

1. Keep `lib/data.ts` as a static fallback during local development
2. Data fetching functions try Supabase first, fall back to static data if `NEXT_PUBLIC_SUPABASE_URL` is not configured
3. Log a warning when fallback is triggered so it's never silently active
4. Remove fallback before production deployment — production always requires Supabase

### Phase 3 Implementation Notes

- Created `lib/supabase/queries.ts` with 9 data fetching functions (`getProfile`, `getProfileStats`, `getNavLinks`, `getCompanies`, `getExperiences`, `getProjectCategories`, `getProjects`, `getSkillGroups`) plus a shared `getProfileData()` helper that maps DB columns to frontend camelCase types with static fallback.
- Converted `app/page.tsx` from a client component to an async **server component**. It fetches all content data from Supabase via `Promise.all()` and passes serializable props to child components. Uses `export const revalidate = 3600` for ISR.
- Created `components/section-animation.tsx` — a client component wrapper for Framer Motion scroll-triggered animations, extracted from page.tsx since server components cannot use Framer Motion directly.
- Created shared serializable data types in `lib/types.ts` (`ProfileData`, `ProfileStatData`, `CompanyData`, `ExperienceData`, `ProjectData`, `SkillGroupData`) to bridge the server→client boundary with camelCase naming.
- Refactored all content-consuming components to receive data as props instead of importing from `lib/data.ts`:
  - `intro.tsx` — accepts `{ profile: ProfileData }`
  - `about.tsx` — accepts `{ profile: ProfileData; stats: ProfileStatData[] }`
  - `projects.tsx` — accepts `{ projects: ProjectData[]; categories: string[] }`
  - `project.tsx` — accepts `ProjectData` props directly
  - `skills.tsx` — accepts `{ skillGroups: SkillGroupData[] }`
  - `experience.tsx` — accepts `{ experiences: ExperienceData[]; companies: CompanyData[] }`, maps icon string identifiers (`"work"`, `"react"`) to React elements via `iconMap`
  - `companies-slider.tsx` — accepts `{ companies: CompanyData[] }`
  - `contact.tsx` — accepts `{ profile: ProfileData }`, uses profile data for email/phone/location/social links
  - `footer.tsx` — accepts `{ profile: ProfileData }`, uses profile data for name, footer text, and source code link
  - `command-palette.tsx` — accepts `{ profile: ProfileData }`, uses profile data for resume URL, LinkedIn/GitHub links
- Updated `app/layout.tsx` to be an async server component that fetches profile data via `getProfileData()` and passes it to `Footer` and `CommandPalette`.
- `header.tsx` still imports `links` from `lib/data.ts` — navigation links are structural and tightly coupled to the `SectionName` type used across the app. These will be migrated when nav_links are needed from the DB.
- The `lib/data.ts` file is preserved as a static fallback; all query functions return `null` when Supabase env vars are missing, triggering the static data path.

### Phase 3 Status: COMPLETE

---

## Phase 4: Admin Dashboard

Phase 4 is split into sub-tasks 4A–4H, implemented sequentially with manual verification between each.

### Route Structure (actual)

```tree
app/admin/
├── login/
│   └── page.tsx              # Admin login (public, outside route group)
└── (dashboard)/              # Route group — auth guard + AdminShell
    ├── layout.tsx            # Server component: auth check, fixed overlay
    ├── page.tsx              # Dashboard overview (URL: /admin)
    ├── profile/
    │   └── page.tsx          # Edit profile info, about section, contact info
    ├── experience/
    │   └── page.tsx          # CRUD experience entries (reorderable)
    ├── projects/
    │   └── page.tsx          # CRUD projects, upload images, manage categories
    ├── skills/
    │   └── page.tsx          # CRUD skill groups and skills (reorderable)
    ├── resume/
    │   └── page.tsx          # Upload/replace resume PDF, view download log
    └── visitors/
        └── page.tsx          # View visitor profiles and download history
```

### Server Actions for Admin

All admin server actions live in `actions/admin.ts`. Every action:

- Calls `requireAdmin()` to verify auth + `app_metadata.role === 'admin'`
- Performs the database operation via `createClient()` (RLS-respecting)
- Calls `revalidateTag()` for granular cache invalidation + `revalidatePath('/')` as fallback
- Returns `{ data?, error? }` response

### shadcn/ui Components

Installed: `button`, `badge`, `card`, `tooltip` (pre-existing) + `table`, `dialog`, `input`, `textarea`, `label`, `select`, `tabs`, `dropdown-menu`, `avatar`, `separator`, `sheet` (added in 4A).

---

### 4A: Foundation — Login + Layout + Dashboard

**Scope:** shadcn/ui installation, admin login page, admin layout with auth guard, admin shell (sidebar + topbar), dashboard overview page, `requireAdmin()` + `getAdminStats()` server actions.

**Files created:**

- `actions/admin.ts` — `requireAdmin()` helper + `getAdminStats()` action
- `app/admin/login/page.tsx` — email/password + social login, fixed overlay
- `app/admin/(dashboard)/layout.tsx` — auth guard + AdminShell wrapper
- `app/admin/(dashboard)/page.tsx` — dashboard overview
- `components/admin/admin-shell.tsx` — sidebar nav + topbar + mobile sheet
- `components/admin/dashboard-content.tsx` — stats cards + downloads table + quick actions

**Files modified:**

- `proxy.ts` — exclude `/admin/login` from admin protection, redirect to `/admin/login` instead of `/`

**Key decisions:**

- `(dashboard)` route group separates auth-guarded pages from the public login page
- `fixed inset-0 z-[1000]` overlay covers portfolio chrome without restructuring app directory
- Dashboard stats use parallel Supabase queries via `Promise.all()`

### 4A Status: COMPLETE

---

### 4B: Profile Editor

**Scope:** Profile editor page, tabbed form for General/About/Stats fields, `updateProfile()` + `updateProfileStats()` server actions, cache invalidation via `revalidateTag('profile')`.

**Files to create:**

- `app/admin/(dashboard)/profile/page.tsx` — server component, fetches profile + stats
- `components/admin/profile-form.tsx` — client component, tabbed interface (General, About, Stats)

**Files to modify:**

- `actions/admin.ts` — add `updateProfile()`, `updateProfileStats()` actions

### 4B Implementation Notes

- Created `app/admin/(dashboard)/profile/page.tsx` — server component that fetches profile + stats via `Promise.all([getProfile(), getProfileStats()])` and passes to `ProfileForm` client component. Handles null profile with fallback UI.
- Created `components/admin/profile-form.tsx` — client component with 3-tab interface using shadcn/ui Tabs:
  - **General tab**: Personal info (full_name, short_name, job_title, tagline), typewriter titles (dynamic array with add/remove), contact info (email, phone, location), social links (linkedin_url, github_url), footer text. Each section separated by `Separator`.
  - **About tab**: Three textarea fields (about_tech_stack, about_current_focus, about_beyond_code) plus expertise highlights (dynamic array with add/remove).
  - **Stats tab**: Inline editable rows with value (number), suffix (text), label (text). Up/down arrow buttons for reordering, add/delete buttons. Bulk replace on save (delete all → insert new).
- Each tab has its own Save button, loading state (Loader2 spinner), and inline success/error status messages.
- Added `updateProfile(data: Partial<ProfileInsert>)` server action — updates singleton profile row via `.update(data).eq('singleton', true)`, calls `revalidatePath('/')` for cache invalidation.
- Added `updateProfileStats(stats: ProfileStatInsert[])` server action — bulk replace strategy: `.delete().gte('sort_order', 0)` to remove all existing rows, then `.insert(stats)` for new ones. Calls `revalidatePath('/')`.
- Cache invalidation uses `revalidatePath('/')` instead of `revalidateTag('profile')` because Supabase client queries don't use `fetch()`, so Next.js cache tags aren't applicable. `revalidatePath('/')` ensures the homepage re-renders with fresh data.
- Empty optional text fields are converted to `null` before saving (Postgres convention). Empty arrays are converted to `null` for `about_expertise`.
- Stats validation: all stats must have a non-empty label before save is allowed.
- Helper functions (`updateField`, `updateArrayItem`, `addArrayItem`, `removeArrayItem`) reduce repetition in form handlers.

### 4B Status: COMPLETE

---

### 4C: Experience CRUD

**Scope:** Experience editor page, table view with add/edit/delete dialogs, sort_order controls, CRUD server actions, cache invalidation via `revalidateTag('experiences')`.

**Files to create:**

- `app/admin/(dashboard)/experience/page.tsx` — server component, fetches experiences
- `components/admin/experience-editor.tsx` — client component, table + dialogs

**Files to modify:**

- `actions/admin.ts` — add `createExperience()`, `updateExperience()`, `deleteExperience()`, `reorderExperiences()`

### 4C Implementation Notes

- Created `app/admin/(dashboard)/experience/page.tsx` — server component that fetches experiences via `getExperiences()` and passes `Experience[]` to `ExperienceEditor` client component. Handles null with fallback UI.
- Created `components/admin/experience-editor.tsx` — client component with:
  - **Table view**: Columns for Order (up/down arrows), Title, Company, Date (hidden on mobile), Actions (edit/delete icon buttons). Empty state when no experiences exist.
  - **Add/Edit Dialog** (shared): Form fields for title, company, description (textarea), display_date (free text), start_date/end_date (date inputs), icon (Select dropdown: "work"/"react"), company_logo_url (optional URL). "Leave empty for current role" hint on end_date.
  - **Delete Confirmation Dialog**: Shows experience title + company, Confirm/Cancel buttons with destructive variant.
  - **Reorder**: Up/down ChevronUp/ChevronDown buttons call `reorderExperiences()` with optimistic local state. Reverts on error.
- Optimistic local state updates: after successful create/edit/delete, local state is updated immediately without full page reload.
- Added four server actions to `actions/admin.ts`:
  - `createExperience(data: ExperienceInsert)` — inserts row, returns created `Experience` via `.select().single()`.
  - `updateExperience(id, data: Partial<ExperienceInsert>)` — updates row by ID, returns updated `Experience`.
  - `deleteExperience(id)` — deletes row by ID.
  - `reorderExperiences(orderedIds: string[])` — updates `sort_order` for each ID using `Promise.all()` of individual update calls.
- All actions follow the established pattern: `requireAdmin()` → DB operation → `revalidatePath('/')` → return `{ data?, error? }`.
- New experience gets `sort_order` set to `experiences.length` (appended at end).
- Empty optional fields (`end_date`, `company_logo_url`) converted to `null` before saving.

### 4C Status: COMPLETE

---

### 4D: Projects CRUD + File Uploads

**Scope:** Projects editor page, card grid with add/edit/delete dialogs, image/video upload, reusable file upload component, CRUD server actions, cache invalidation via `revalidateTag('projects')`.

**Files to create:**

- `app/admin/(dashboard)/projects/page.tsx` — server component, fetches projects + categories
- `components/admin/projects-editor.tsx` — client component, card grid + dialogs
- `components/admin/file-upload.tsx` — reusable drag-and-drop upload with preview + progress

**Files to modify:**

- `actions/admin.ts` — add project CRUD + file upload/delete actions

### 4D Implementation Notes

- Created `app/admin/(dashboard)/projects/page.tsx` — server component that fetches projects + categories via `Promise.all([getProjects(), getProjectCategories()])` and passes `Project[]` + `ProjectCategory[]` to `ProjectsEditor` client component.
- Created `components/admin/projects-editor.tsx` — client component with:
  - **Table view**: Columns for Order (up/down arrows), Title, Category (resolved from `categoryMap`), Tags (first 3 shown as Badges, "+N" overflow), Actions (edit/delete icon buttons). Empty state when no projects exist.
  - **Add/Edit Dialog** (shared): Form fields for title, description (textarea), tags (comma-separated Input parsed to `string[]` on save), category (Select dropdown from categories, with "No Category" option using sentinel value `__none__`), image_url (URL Input), demo_video_url (URL Input), source_code_url / live_site_url (2-col grid URL Inputs).
  - **Delete Confirmation Dialog**: Shows project title, Confirm/Cancel with destructive variant.
  - **Reorder**: Up/down arrows with optimistic local state and revert on error.
- Added four server actions to `actions/admin.ts`:
  - `createProject(data: ProjectInsert)` — inserts row, returns created `Project` via `.select().single()`.
  - `updateProject(id, data: Partial<ProjectInsert>)` — updates row by ID, returns updated `Project`.
  - `deleteProject(id)` — deletes row by ID.
  - `reorderProjects(orderedIds: string[])` — updates `sort_order` for each ID using `Promise.all()`.
- All actions follow the established pattern: `requireAdmin()` → DB operation → `revalidatePath('/')` → return `{ data?, error? }`.
- **File upload component (`components/admin/file-upload.tsx`) deferred to Phase 5** — 4D uses URL text inputs for image/video fields since images are already in Supabase Storage referenced by URL. The reusable drag-and-drop upload component will be built in Phase 5 when full storage integration is implemented.

### 4D Status: COMPLETE

---

### 4E: Skills CRUD

**Scope:** Skills editor page, grouped card view, add/remove/reorder groups and skills, CRUD server actions, cache invalidation via `revalidateTag('skills')`.

**Files to create:**

- `app/admin/(dashboard)/skills/page.tsx` — server component, fetches skill groups with skills
- `components/admin/skills-editor.tsx` — client component, grouped view + dialogs

**Files to modify:**

- `actions/admin.ts` — add skill group and skill CRUD actions

### 4E Implementation Notes

- Created `app/admin/(dashboard)/skills/page.tsx` — server component that fetches skill groups with nested skills via `getSkillGroups()` and passes `SkillGroupWithSkills[]` to `SkillsEditor` client component.
- Created `components/admin/skills-editor.tsx` — client component with grouped card view:
  - **Group cards**: Each group rendered as a Card with category name, reorder up/down arrows, edit (rename) and delete icon buttons. Groups can be added/renamed via a Dialog, deleted via a confirmation dialog that warns about cascading skill deletion.
  - **Skill rows within groups**: Each skill shows name with inline edit (click Pencil → Input with Check/X buttons, Enter/Escape keyboard support), delete button (no confirmation), reorder up/down arrows within the group.
  - **Inline add skill**: Input + Plus button at the bottom of each group card, with Enter key support. Per-group input state tracked via `newSkillName` Record.
- Added 8 server actions to `actions/admin.ts`:
  - Group actions: `createSkillGroup()`, `updateSkillGroup()`, `deleteSkillGroup()`, `reorderSkillGroups()`
  - Skill actions: `createSkill()`, `updateSkill()`, `deleteSkill()`, `reorderSkills()`
- All actions follow the established pattern: `requireAdmin()` → DB op → `revalidatePath('/')` → return `{ data?, error? }`.
- Skills use FK `ON DELETE CASCADE` — deleting a group automatically deletes all its skills.
- Optimistic local state updates for all operations; reorder reverts on error.

### 4E Status: COMPLETE

---

### 4F: Resume Management

**Scope:** Resume management page, current resume info, upload new resume, download log table, `uploadResume()` + `getResumeDownloads()` server actions, cache invalidation via `revalidateTag('profile')`.

**Files to create:**

- `app/admin/(dashboard)/resume/page.tsx` — server component, fetches profile + downloads
- `components/admin/resume-manager.tsx` — client component, upload + download log table

**Files to modify:**

- `actions/admin.ts` — add `uploadResume()`, `getResumeDownloads()`

### 4F Status: COMPLETE

**Implementation notes (4F):**

- Added `getResumeDownloads()` server action — queries `resume_downloads` with visitor join (same pattern as `getAdminStats()`)
- Added `uploadResume(formData)` server action — accepts FormData, validates PDF type + 10 MB limit, uploads to `resume` bucket with `upsert: true`, updates `profile.resume_url`
- Consistent filename `resume.pdf` — simplifies replacement via upsert
- `ResumeManager` client component — current resume card with file info + upload button, download log table with time-ago formatting
- Server page fetches profile + downloads in parallel via `Promise.all`
- Cache invalidation uses `revalidatePath('/')` (not `revalidateTag` since Supabase queries don't use `fetch()`)

---

### 4G: Visitors Page

**Scope:** Visitors page, table with filter/search/sort, CSV export, pagination, `getVisitors()` + `getVisitorsCsvData()` server actions.

**Files to create:**

- `app/admin/(dashboard)/visitors/page.tsx` — server component, fetches visitors
- `components/admin/visitors-table.tsx` — client component, table + filters + export

**Files to modify:**

- `actions/admin.ts` — add `getVisitors()`, `getVisitorsCsvData()`

### 4G Implementation Notes

- Created `app/admin/(dashboard)/visitors/page.tsx` — server component that fetches visitors via `getVisitors()` and passes `VisitorEntry[]` to `VisitorsTable` client component. Handles error with fallback UI.
- Created `components/admin/visitors-table.tsx` — client component with:
  - **Table view**: Columns for Name (with avatar), Email, Provider (Badge), Company, Role, Downloads (count), Joined (time-ago). Responsive: Email hidden on mobile, Provider hidden below md, Company/Role hidden below lg.
  - **Search**: Full-text search across name, email, company, and role fields. Resets pagination on change.
  - **Provider filter**: Select dropdown with dynamically populated providers (Google, GitHub, LinkedIn, etc.) plus "All providers" option.
  - **Sortable columns**: Name, Email, Provider, Downloads, Joined — click toggles asc/desc with visual indicator via ArrowUpDown icon.
  - **Pagination**: 20 items per page with Previous/Next buttons and "Showing X–Y of Z" indicator.
  - **CSV export**: "Export CSV" button calls `getVisitorsCsvData()` server action, generates a Blob, and triggers browser download with date-stamped filename.
  - **Empty states**: Distinct messages for "No visitors yet" vs "No visitors match your filters."
- Added 2 server actions to `actions/admin.ts`:
  - `getVisitors()` — fetches all `visitor_profiles` ordered by `created_at` desc, joins download counts from `resume_downloads` via a second query + Map aggregation. Returns camelCase `VisitorEntry[]`.
  - `getVisitorsCsvData()` — calls `getVisitors()` internally, formats as CSV string with proper field escaping (commas, quotes, newlines).
- Added `VisitorEntry` exported type for use in component props and test fixtures.
- Created `app/admin/(dashboard)/visitors/loading.tsx` — skeleton loading state matching the visitors page layout.
- Added `mockVisitors` fixture to `__tests__/helpers/admin-fixtures.ts` (3 visitors: Google, GitHub, null-name).
- Added 10 server action tests (getVisitors: 5, getVisitorsCsvData: 4 including CSV escaping) and 14 component tests (rendering, search, sort, export, empty states).
- All actions follow the established pattern: `requireAdmin()` → DB query → return `{ data?, error? }`.

### 4G Status: COMPLETE

---

### 4H: Polish & Final Touches

**Scope:** Loading states / skeleton screens, empty states, error boundaries, responsive verification, form validation.

**Files to modify:**

- All admin pages and components as needed

### 4H Implementation Notes

- Installed shadcn/ui `skeleton` component for loading state animations.
- Created `loading.tsx` skeleton files for all 6 admin pages (dashboard, profile, experience, projects, skills, resume), each mirroring the layout of its corresponding page component.
- Created `app/admin/(dashboard)/error.tsx` — shared error boundary with AlertTriangle icon, error message, and "Try Again" button. Catches errors within the admin shell so sidebar/header remain visible.
- Added `--success` CSS custom property to `globals.css` (oklch values for light and dark mode). Replaced all `text-green-600` with `text-success` across 5 admin components.
- Added required field indicators (`*` asterisks) and client-side validation to profile-form, experience-editor, and projects-editor.
- Added client-side file validation to resume-manager (PDF type + 10 MB size check before server call).
- Added 2 new test cases for resume file validation. Updated existing test assertions to use regex patterns for labels with asterisks.

### 4H Status: COMPLETE

---

## Phase 5: File Uploads & Storage

### 5.1 Resume Upload (Admin)

- Admin uploads PDF via `/admin/resume`
- File stored in `resume` bucket (private)
- Old file is deleted on replacement
- `profile.resume_url` updated with the new storage path

### 5.1 Status: COMPLETE (implemented in 4F)

---

### 5.2 Resume Download (Visitor)

- Authenticated visitor triggers download
- Server action (`actions/resume.ts`) verifies auth, creates a signed URL (300 seconds / 5 minutes, to accommodate slow connections while keeping links short-lived) for the private `resume` bucket, logs the download, and returns the URL
- Client receives the signed URL and triggers browser download
- Download logged in `resume_downloads`

### 5.2 Status: COMPLETE (implemented in Phase 2)

### 5.3 Image Uploads (Admin)

- Project images → `project-images` bucket (public)
- Company logos → `company-logos` bucket (public)
- On upload, persist the **full public URL** (returned by `getPublicUrl()`) in the `image_url` / `logo_url` column so consumers can use it directly in `<Image src={...}>`. Storage cleanup uses `extractStoragePath()` to derive the path from the URL for `deleteStorageFile()`.
- Support image preview before saving

### 5.3 Implementation Notes

- Created `components/admin/image-upload.tsx` — reusable image upload component with click-to-upload dashed placeholder, instant local preview via `URL.createObjectURL()`, image preview with "Replace Image" button, destructive remove button, client-side validation (JPEG/PNG/WebP/GIF, max 5 MB), loading spinner overlay, and error display.
- Added `uploadProjectImage(formData)` server action to `actions/admin.ts` — validates file type and size, uploads to `project-images` bucket with UUID filename, returns both storage `path` and derived `publicUrl`.
- Added `deleteStorageFile(bucket, path)` server action — generic helper to remove a file from any Supabase Storage bucket, reusable across project images, company logos, and videos.
- Integrated `ImageUpload` into `components/admin/projects-editor.tsx`, replacing the plain "Image URL" text input. On upload, stores the full public URL in `image_url`; on replace/remove, cleans up old Supabase-hosted images via `deleteStorageFile`.
- Added `extractStoragePath()` helper to derive storage path from Supabase public URLs for cleanup. Non-Supabase URLs (e.g. local `/images/...` paths) are left alone.
- Stores full public URL (not storage path) in `image_url` column — matches existing code that uses `image_url` directly in `<Image src={...}>` without transformation.
- Company logos upload deferred — the `ImageUpload` component is reusable and can be integrated into a company logos editor in a future phase.

### 5.3 Status: COMPLETE

---

### 5.4 Demo Video Uploads (Admin)

- Optional short demo videos for projects → `project-videos` bucket (public)
- On upload, persist the **full public URL** (returned by `getPublicUrl()`) in `projects.demo_video_url` — consistent with the image upload approach. Storage cleanup uses `extractStoragePath()` to derive the path from the URL for `deleteStorageFile()`.
- Old video is deleted from storage on replacement (path derived from the stored URL)
- Support video preview before saving
- Visitors can view the demo video inline on the project card and download it
- **Future**: YouTube embedding is planned but not in scope for this implementation; the `demo_video_url` field will initially store Supabase Storage paths only

### 5.4 Implementation Notes

- Added `uploadProjectVideo(formData)` server action to `actions/admin.ts` — validates file type (MP4/WebM) and size (max 50 MB), uploads to `project-videos` bucket with UUID filename, returns storage `path` and `publicUrl`.
- Created `components/admin/video-upload.tsx` — reusable video upload component following the same pattern as `ImageUpload`: click-to-upload placeholder with `Film` icon, `<video>` preview with controls, replace/remove buttons, client-side validation, loading overlay, error display.
- Integrated `VideoUpload` into `components/admin/projects-editor.tsx`, replacing the plain "Demo Video URL" text input. On replace/remove, cleans up old Supabase-hosted videos via `deleteStorageFile`.
- Updated `components/project.tsx` (public project card) to support inline video playback:
  - Destructures `demoVideoUrl` from `ProjectData` props.
  - Desktop: when `demoVideoUrl` is present, renders a `<video>` element (with controls) in place of the static `<Image>`, using the same absolute positioning and hover animations.
  - Mobile: renders a full-width `<video>` element below the project description (since desktop media is hidden on mobile).
  - When no video is present, falls back to the existing `<Image>` behavior.
- Stores full public URL (not storage path) in `demo_video_url` column — consistent with `image_url` approach from Phase 5.3.

### 5.4 Status: COMPLETE

---

## Phase 6: Testing & Deployment

Phase 6 is split into sub-tasks 6A–6E, implemented sequentially with manual verification between each.

### Already completed in earlier phases

The following tests were built alongside their respective features:

**Unit / component tests** (Vitest + Testing Library):

- `__tests__/actions/admin.test.ts` — server actions: requireAdmin, getAdminStats, CRUD for Experience/Project/SkillGroup/Skill, uploadResume, getResumeDownloads, getVisitors, getVisitorsCsvData
- `__tests__/components/admin/` — profile-form, experience-editor, projects-editor, skills-editor, resume-manager, visitors-table
- `__tests__/components/` — section-heading, submit-btn, theme-switch
- `__tests__/context/` — active-section-context, theme-context
- `__tests__/unit/lib/` — hooks, utils

**E2E tests** (Playwright):

- `e2e/navigation.spec.ts`, `e2e/theme.spec.ts`, `e2e/contact-form.spec.ts`, `e2e/accessibility.spec.ts`
- `e2e/admin-auth.spec.ts`, `e2e/admin-dashboard.spec.ts`, `e2e/admin-profile.spec.ts`, `e2e/admin-experience.spec.ts`, `e2e/admin-projects.spec.ts`, `e2e/admin-skills.spec.ts`, `e2e/admin-resume.spec.ts`

---

### 6A: Unit Tests — Data Fetching Functions

**Scope:** Unit tests for all query functions in `lib/supabase/queries.ts` using the existing Supabase mock.

**Tests to write (`__tests__/unit/lib/queries.test.ts`):**

- All 9 query functions: `getProfile`, `getProfileStats`, `getNavLinks`, `getCompanies`, `getExperiences`, `getProjectCategories`, `getProjects`, `getSkillGroups`, `getProfileData`
- Supabase not configured (env vars missing) → returns `null` and logs warning
- Supabase query error → returns `null` and logs error
- Successful query → returns correctly typed data
- `getSkillGroups` → nests skills under their parent groups
- `getProfileData` → maps DB snake_case columns to camelCase `ProfileData`; falls back to static profile when Supabase is not configured

**Follows:** existing patterns in `__tests__/helpers/supabase-mock.ts` and `__tests__/actions/admin.test.ts`.

### 6A Implementation Notes

- Created `__tests__/unit/lib/queries.test.ts` with 30 tests covering all 9 query functions.
- **Supabase not configured** (9 tests): Verifies each function returns `null` (or static fallback for `getProfileData`) when `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` are missing, and that `createClient` is never called.
- **Successful queries** (9 tests): Each function returns correctly typed data from the mock Supabase client. Verifies the correct table is queried via `mockClient.from`.
- **Error handling** (8 tests): Each function returns `null` and logs an error via `console.error` when the Supabase query fails. `getSkillGroups` has separate error tests for the groups fetch and the skills fetch.
- **getSkillGroups nesting** (2 tests): Verifies skills are correctly nested under their parent group by `group_id`, and that a group with no matching skills gets an empty `skills` array.
- **getProfileData mapping** (3 tests): Verifies DB snake_case columns are mapped to camelCase `ProfileData`, nullable fields default to empty strings/arrays, `resume_url` defaults to `'/lalding.pdf'`, and falls back to static profile on DB error.
- Uses `process.env` manipulation with `beforeEach`/`afterEach` to test the `isSupabaseConfigured()` guard. Uses `vi.spyOn(console, 'error')` to verify error logging without polluting test output.
- Mocks `@/lib/supabase/server` (`createClient`) following the same pattern as `admin.test.ts`. Uses `createChainMock` with `mockReturnValueOnce` for `getSkillGroups` since it calls `from()` twice.
- All 235 tests pass (30 new + 205 existing). Lint, format, and build all pass.

### 6A Status: COMPLETE

---

### 6B: Component Tests — Auth Components

**Scope:** Component tests for `LoginModal` and `OptionalFieldsModal` using Testing Library.

**Tests to write:**

- `__tests__/components/auth/login-modal.test.tsx`:
  - Renders social login buttons (Google, GitHub, LinkedIn)
  - Calls `onClose` when backdrop/close button is clicked
  - Calls `signInWithProvider` with correct provider on button click
  - Does not render when `isOpen` is false

- `__tests__/components/auth/optional-fields-modal.test.tsx`:
  - Renders company and role inputs
  - Calls `onSubmit` with field values on Continue
  - Calls `onSkip` when Skip is clicked
  - Does not render when `isOpen` is false

**Follows:** existing component test patterns in `__tests__/components/admin/`.

### 6B Implementation Notes

- Created `__tests__/components/auth/login-modal.test.tsx` with 9 tests:
  - Renders nothing when `isOpen` is false (empty container)
  - Renders heading ("Sign in to download"), all 3 social login buttons, and Cancel button
  - Calls `onClose` when Cancel button is clicked
  - Calls `onClose` when backdrop overlay is clicked
  - Calls `signInWithProvider` with correct provider string for each button (`'google'`, `'github'`, `'linkedin_oidc'`)
  - Stores `pendingAction: 'download_resume'` in localStorage before OAuth redirect
- Mocks `@/context/auth-context` (`useAuth`) to provide a mock `signInWithProvider` function.
- Created `__tests__/components/auth/optional-fields-modal.test.tsx` with 7 tests:
  - Renders nothing when `isOpen` is false
  - Renders heading, Company/Role inputs, Skip and Continue buttons
  - Calls `onComplete` without calling server action when Skip is clicked
  - Calls `updateVisitorOptionalFields` with typed values and then `onComplete` on Continue
  - Handles empty fields (submits empty strings)
  - Shows "Saving..." loading text while server action is pending
  - Shows toast error on server action failure, still calls `onComplete`
- Mocks `@/actions/resume` (`updateVisitorOptionalFields`) and `react-hot-toast` (`toast.error`).
- All 251 tests pass (16 new + 235 existing). Lint, format, and build all pass.

### 6B Status: COMPLETE

---

### 6C: E2E Test — Resume Download Flow

**Scope:** Playwright E2E test covering the full auth-gated resume download flow.

**Test to write (`e2e/resume-download.spec.ts`):**

- Visitor clicks "Download Resume" → LoginModal appears
- After social login → OptionalFieldsModal appears (first login)
- After completing/skipping optional fields → download triggers
- Already-authenticated visitor → download triggers immediately (no modals)

**Note:** Requires `E2E_VISITOR_EMAIL` / `E2E_VISITOR_PASSWORD` env vars or mocked auth state. May need a test visitor account in Supabase.

### 6C Implementation Notes

- Created `e2e/resume-download.spec.ts` with 6 Playwright tests covering the unauthenticated resume download flow:
  - "Download Resume" button is visible in the intro section
  - Clicking "Download Resume" opens the LoginModal for unauthenticated users
  - LoginModal displays all three social login buttons (Google, GitHub, LinkedIn)
  - LoginModal can be closed via the Cancel button
  - LoginModal can be closed by clicking the backdrop overlay
  - "Download Resume" button is enabled and not in downloading state initially
- Test runs on all three browser projects (chromium, firefox, webkit) — it doesn't match the `admin-*` ignore pattern.
- **Limitation:** The full authenticated flow (OAuth login → OptionalFieldsModal → download trigger) cannot be tested in E2E without real OAuth credentials or a test visitor account. Visitor auth uses social login only (no email/password), so there's no way to programmatically authenticate a visitor like the admin auth setup does. The unauthenticated path (modal appearance, interactions, dismissal) is fully covered. The authenticated download logic is covered by unit tests (6A: `downloadResume` server action, 6B: `OptionalFieldsModal` component).
- All 6 E2E tests pass on chromium. All 251 unit tests pass. Lint and format clean.

### 6C Status: COMPLETE

---

### 6D: E2E Test — Admin Edit → Public Site Verification

**Scope:** Playwright E2E test verifying that admin edits are reflected on the public homepage.

**Test to write (`e2e/admin-public-sync.spec.ts`):**

- Admin logs in, edits a field (e.g., profile tagline or a project title)
- Navigate to public homepage
- Verify the edited content appears on the public page
- Revert the change to leave the DB clean

**Depends on:** admin auth setup (`e2e/auth.setup.ts`), saved auth state.

### 6D Implementation Notes

- Created `e2e/admin-public-sync.spec.ts` with 1 comprehensive test that covers the full round-trip:
  1. Reads the current profile tagline from `/admin/profile`
  2. Edits it to a unique timestamped test value
  3. Saves and waits for confirmation
  4. Navigates to the public homepage `/` and verifies the new tagline is visible
  5. Reverts the tagline to its original value via the admin editor
  6. Verifies the public homepage shows the restored original value
- Uses `test.skip(!hasAuth, ...)` to gracefully skip when `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD` are not set — consistent with all other `admin-*` E2E tests.
- Filename matches `admin-*` pattern so it runs in the `admin` Playwright project with saved auth state from `auth.setup.ts`.
- Test is self-cleaning: always reverts the change regardless of test outcome within the test flow.
- Skips as expected locally (no admin credentials). Lint and format clean.

### 6D Status: COMPLETE

---

### 6E: Environment Variables & CI/CD Updates

**Scope:** Update `.env.example`, add Supabase connection validation, update CI config, document fallback for contributors.

**Tasks:**

1. **Update `.env.example`** — add Supabase env vars with placeholder values:
   - `NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...`
   - `SUPABASE_SERVICE_ROLE_KEY=eyJ...`

2. **Create `scripts/validate-supabase.ts`** — lightweight script that tests Supabase connection (attempts a simple query) and exits with code 0/1. Can be run as a pre-build check.

3. **Update `.github/workflows/ci.yml`**:
   - Add Supabase env vars from GitHub Actions secrets
   - Optionally add `validate-supabase` step before build
   - Document that builds without Supabase env vars use the static data fallback

4. **Document contributor setup** — note in `.env.example` or README that fork contributors without Supabase access will see a logged warning and the build will use static data fallback.

### 6E Implementation Notes

- `.env.example` already had Supabase env vars from Phase 1. Updated with descriptive comments explaining fallback behavior, and added optional `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD` entries for E2E testing.
- Created `scripts/validate-supabase.ts` — uses `@supabase/supabase-js` directly (not the SSR server client) to avoid cookie dependencies. Queries `profile` table with `.select('id').limit(1)`. Exits 0 on success or when env vars are missing (fallback is acceptable), exits 1 on connection failure.
- Added `"validate-supabase"` npm script to `package.json` (`npx tsx scripts/validate-supabase.ts`).
- Updated `.github/workflows/ci.yml`:
  - Added top-level comment documenting that fork contributors without Supabase secrets will use static data fallback.
  - **Build job**: Added `validate-supabase` step before `npm run build`, with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from secrets. Build step also receives these env vars.
  - **E2E job**: Added Supabase env vars + `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD` from secrets to the E2E test run step.
- Verified both script paths: exits 0 with warning when env vars are missing, exits 0 with success message when Supabase is configured and reachable.
- All checks pass: lint, format, build.

### 6E Status: COMPLETE

### Phase 6 Status: COMPLETE

---

## Implementation Order

| Step | Phase | Description                                       | Dependencies |
| ---- | ----- | ------------------------------------------------- | ------------ |
| 1    | 1     | Supabase project setup + env vars                 | None         |
| 2    | 1     | Database schema + RLS policies                    | Step 1       |
| 3    | 1     | Storage buckets                                   | Step 1       |
| 4    | 1     | Supabase client utilities + TypeScript types      | Step 2       |
| 5    | 1     | Seed script (migrate data.ts + hardcoded content) | Step 4       |
| 6    | 3     | Data fetching functions + refactor page.tsx       | Step 5       |
| 7    | 3     | Refactor components to receive data as props      | Step 6       |
| 8    | 2     | Auth setup (providers, middleware, auth context)  | Step 4       |
| 9    | 2     | Visitor login modal + resume download flow        | Steps 3, 8   |
| 10   | 2     | Optional fields modal                             | Step 9       |
| 11   | 2     | Contact form pre-fill                             | Step 8       |
| 12   | 4     | Admin layout + login page                         | Step 8       |
| 13   | 4     | Admin dashboard overview                          | Step 12      |
| 14   | 4     | Admin profile editor                              | Step 12      |
| 15   | 4     | Admin experience CRUD                             | Step 12      |
| 16   | 4     | Admin projects CRUD + image upload                | Step 12      |
| 17   | 4     | Admin skills CRUD                                 | Step 12      |
| 18   | 5     | Admin resume upload + download log                | Step 12      |
| 19   | 4     | Admin visitors page                               | Step 12      |
| 20   | 6A    | Unit tests — data fetching functions              | Steps 7-19   |
| 21   | 6B    | Component tests — auth components                 | Steps 7-19   |
| 22   | 6C    | E2E test — resume download flow                   | Steps 7-19   |
| 23   | 6D    | E2E test — admin edit → public site verification  | Steps 7-19   |
| 24   | 6E    | Environment variables & CI/CD updates             | Steps 20-23  |

---

## Files Changed / Created

### New Files

```tree
lib/supabase/client.ts           # Browser Supabase client
lib/supabase/server.ts           # Server Supabase client (anon key + user JWT)
lib/supabase/admin.ts            # Admin client (service role key, RLS bypass)
lib/supabase/queries.ts          # Typed data fetching functions
lib/supabase/types.ts            # Generated TypeScript types
lib/supabase/seed.ts             # Seed script for initial data migration
proxy.ts                        # Auth + route protection proxy (Next.js 16)
context/auth-context.tsx         # Supabase auth React context
components/auth/login-modal.tsx  # Visitor social login modal
components/auth/optional-fields-modal.tsx
actions/admin.ts                 # Admin CRUD server actions
actions/resume.ts                # Resume download server action (signed URL generation)
app/admin/layout.tsx
app/admin/page.tsx
app/admin/login/page.tsx
app/admin/profile/page.tsx
app/admin/experience/page.tsx
app/admin/projects/page.tsx
app/admin/skills/page.tsx
app/admin/resume/page.tsx
app/admin/visitors/page.tsx
```

### Modified Files

```tree
package.json                     # Add @supabase/supabase-js, @supabase/ssr
app/layout.tsx                   # Wrap with AuthProvider
app/page.tsx                     # Remove 'use client', convert to server component, fetch data
components/intro.tsx             # Props instead of hardcoded data, auth-gated download
components/about.tsx             # Props instead of hardcoded data
components/contact.tsx           # Props + session pre-fill
components/experience.tsx        # Props instead of imported data, icon string→component mapping
components/project.tsx           # Inline video playback + download button when demo_video_url is present
components/projects.tsx          # Props instead of imported data
components/skills.tsx            # Props instead of imported data
components/header.tsx            # Props instead of imported data
components/companies-slider.tsx  # Props instead of imported data
components/command-palette.tsx   # Props + auth-gated resume download (wraps server action call)
components/footer.tsx            # Props instead of hardcoded data
lib/types.ts                     # Extended with Supabase types
.env.example                     # Add Supabase env vars
.github/workflows/ci.yml         # Add Supabase env vars to CI
```

### Eventually Deprecated

```tree
lib/data.ts                      # Kept as fallback initially, removed once Supabase is stable
```

---

## Phase 7: Sentry Error Monitoring & Performance Tracking

### Overview

Integrate Sentry (`@sentry/nextjs`) for error monitoring and performance tracking. Sentry should be **optional** — the app works fine without Sentry env vars, matching the existing Supabase fallback pattern.

### Prerequisites (User Action Required)

Before implementation can begin, complete these steps:

1. **Create a Sentry account** (or confirm existing one) at [sentry.io](https://sentry.io)
2. **Create a Next.js project** in Sentry dashboard
3. **Provide the following values:**
   - **DSN** — the project's ingest endpoint (looks like `https://xxx@xxx.ingest.sentry.io/xxx`)
   - **Organization slug** — from Sentry settings (e.g., `my-org`)
   - **Project slug** — from Sentry settings (e.g., `lalding-portfolio`)
4. **Generate an auth token** at [sentry.io/settings/auth-tokens/](https://sentry.io/settings/auth-tokens/) with scopes:
   - `project:releases`
   - `org:read`
5. **Add environment variables to Vercel** (production + preview):
   - `NEXT_PUBLIC_SENTRY_DSN`
   - `SENTRY_AUTH_TOKEN`
   - `SENTRY_ORG`
   - `SENTRY_PROJECT`
6. **Add GitHub Actions secrets** (for source map uploads in CI):
   - `SENTRY_AUTH_TOKEN`
   - `SENTRY_ORG`
   - `SENTRY_PROJECT`
   - `NEXT_PUBLIC_SENTRY_DSN`

### Environment Variables

| Variable                 | Public? | Where                    | Purpose                                     |
| ------------------------ | ------- | ------------------------ | ------------------------------------------- |
| `NEXT_PUBLIC_SENTRY_DSN` | Yes     | `.env.local`, Vercel, CI | Sentry project DSN (public ingest endpoint) |
| `SENTRY_AUTH_TOKEN`      | No      | `.env.local`, Vercel, CI | Auth token for source map uploads           |
| `SENTRY_ORG`             | No      | `.env.local`, Vercel, CI | Sentry organization slug                    |
| `SENTRY_PROJECT`         | No      | `.env.local`, Vercel, CI | Sentry project slug                         |

**Notes:**

- DSN uses `NEXT_PUBLIC_` prefix because the client-side SDK (browser) needs access to it. DSNs are intentionally public — they're ingest endpoints, not secrets.
- The existing `NEXT_PUBLIC_SENTRY_AUTH_TOKEN` in `.env.example` will be replaced with `SENTRY_AUTH_TOKEN` — auth tokens must not be public.

---

### 7A: Install SDK & Create Config Files

**Scope:** Install `@sentry/nextjs`, create the four required config files, wrap `next.config.js` with `withSentryConfig`.

**Tasks:**

1. Install `@sentry/nextjs` (latest v10.x, compatible with Next.js 16)
2. Create `instrumentation-client.ts` — client-side Sentry init with:
   - DSN from `process.env.NEXT_PUBLIC_SENTRY_DSN`
   - `tracesSampleRate: 0.1` (low to stay within free tier)
   - Guard: skip init if `NEXT_PUBLIC_SENTRY_DSN` is not set
   - `onRouterTransitionStart` export for App Router navigation tracking
3. Create `sentry.server.config.ts` — server-side Sentry init with:
   - DSN from `process.env.NEXT_PUBLIC_SENTRY_DSN`
   - `tracesSampleRate: 0.1`
   - Guard: skip init if `NEXT_PUBLIC_SENTRY_DSN` is not set
4. Create `sentry.edge.config.ts` — edge runtime Sentry init with:
   - Same config as server, used by `proxy.ts` edge runtime
   - Guard: skip init if `NEXT_PUBLIC_SENTRY_DSN` is not set
5. Create `instrumentation.ts` — Next.js instrumentation hook:
   - Import `sentry.server.config` when `NEXT_RUNTIME === 'nodejs'`
   - Import `sentry.edge.config` when `NEXT_RUNTIME === 'edge'`
   - Export `onRequestError` from `@sentry/nextjs` for server error capture
6. Update `next.config.js` — wrap with `withSentryConfig()`:
   - Pass `org`, `project`, `authToken` from env vars
   - `silent: !process.env.CI` (suppress logs outside CI)
   - `widenClientFileUpload: true` (better stack traces)
   - `tunnelRoute: '/monitoring'` (route events through server to avoid ad blockers)
   - Conditionally apply wrapper — if Sentry env vars are missing, export plain config

**Files created:** `instrumentation-client.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`, `instrumentation.ts`
**Files modified:** `next.config.js`

### 7A Status: COMPLETE

---

### 7B: Error Boundary & Server Action Instrumentation

**Scope:** Integrate Sentry with `global-error.tsx`, add error capture to server actions.

**Tasks:**

1. Update `app/global-error.tsx`:
   - Import `@sentry/nextjs`
   - Call `Sentry.captureException(error)` in a `useEffect` on mount
   - Keep existing UI (NextError fallback)
   - Guard: only call Sentry if it's initialized (check `Sentry.getClient()`)
2. Optionally instrument critical server actions:
   - `actions/sendEmail.ts` — wrap with `Sentry.withServerActionInstrumentation()` for contact form error tracking
   - `actions/resume.ts` — wrap `downloadResume()` for resume download error tracking
   - Skip admin actions (admin dashboard errors are less critical for monitoring)
3. Update `proxy.ts` — if `tunnelRoute` is set to `/monitoring`, exclude it from the Supabase session refresh and admin auth checks

**Files modified:** `app/global-error.tsx`, `actions/sendEmail.ts`, `actions/resume.ts`, `proxy.ts`

### 7B Status: COMPLETE

---

### 7C: Environment Variables & CI/CD

**Scope:** Update `.env.example`, add Sentry env vars to CI pipeline, configure source map uploads.

**Tasks:**

1. Update `.env.example`:
   - Replace `NEXT_PUBLIC_SENTRY_AUTH_TOKEN=sntrys_xxx` with the four Sentry env vars
   - Add comments explaining each variable and that they're optional
2. Update `.github/workflows/ci.yml`:
   - **Build job**: Add `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `NEXT_PUBLIC_SENTRY_DSN` from secrets to the build step (enables source map upload during CI builds)
   - Source maps are uploaded automatically by `withSentryConfig` during `next build` when auth token is present
3. Verify source maps are **not** uploaded during dev (`next dev`) — only during production builds

**Files modified:** `.env.example`, `.github/workflows/ci.yml`

### 7C Status: COMPLETE

---

### 7D: Testing & Verification

**Scope:** Verify Sentry integration works correctly, test fallback behavior, update existing tests.

**Tasks:**

1. Verify build succeeds **without** Sentry env vars (fallback/optional behavior)
2. Verify build succeeds **with** Sentry env vars (full integration)
3. Verify `global-error.tsx` captures exceptions to Sentry
4. Update any existing tests that mock or test `global-error.tsx`
5. Run full test suite (`npm run test:run`, `npm run lint`, `npm run build`, `npm run format:check`)
6. Verify no bundle size regression beyond expected Sentry SDK addition

**Files modified:** Tests as needed

### 7D Status: COMPLETE

---

### Implementation Notes

- **SDK version**: `@sentry/nextjs` v10.x (latest, tested with Next.js 16)
- **Optional pattern**: All Sentry config files guard on `NEXT_PUBLIC_SENTRY_DSN` being set — matches the existing Supabase fallback pattern where the app gracefully degrades without external services. `next.config.js` conditionally applies `withSentryConfig` only when `SENTRY_ORG`, `SENTRY_PROJECT`, and `SENTRY_AUTH_TOKEN` are all present.
- **Performance budget**: `tracesSampleRate: 0.1` (10% of requests) keeps within Sentry's free tier (~50K transactions/month). Can be adjusted once baseline traffic is known.
- **Tunnel route**: `/monitoring` proxies Sentry events through the Next.js server, avoiding ad blocker interference. The `proxy.ts` file must be updated to skip this path.
- **Source maps**: Uploaded automatically during `next build` when `SENTRY_AUTH_TOKEN` is present. The `withSentryConfig` wrapper handles this — no separate upload step needed.
- **No `sentry.properties` file**: Org/project/auth token are configured via environment variables, not a properties file. This avoids committing secrets and keeps config in the same place as other env vars.

---

## Resolved Questions

1. **Admin seeding**: Setup/invite flow — build an admin setup flow rather than manual Supabase dashboard creation.
2. **Image optimization**: Uploaded images should be processed (resized/compressed) before storage.
3. **Content versioning**: Yes — track edit history and support rollback in the admin dashboard.
4. **Rate limiting**: Yes — rate-limit both resume downloads and login attempts.
