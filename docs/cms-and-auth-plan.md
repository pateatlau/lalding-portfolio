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
  - `SUPABASE_SERVICE_ROLE_KEY` (server-side only, for admin operations)
- Create Supabase client utilities:
  - `lib/supabase/client.ts` — browser client (uses anon key)
  - `lib/supabase/server.ts` — server client (uses service role key for admin, anon key for public)

### 1.2 Database Schema

Tables map to the current data structures in `lib/data.ts` plus hardcoded content across components.

```sql
-- ============================================
-- CONTENT TABLES
-- ============================================

-- Personal info (about, intro, contact, footer — single row)
CREATE TABLE profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  resume_url TEXT,                    -- Supabase Storage URL
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
  logo_url TEXT NOT NULL,             -- path or Supabase Storage URL
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- Experience / career timeline
CREATE TABLE experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,                -- "Deputy Vice President"
  company TEXT NOT NULL,              -- "HDFC Bank Limited"
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'work',  -- "work" | "react" (mapped to icons in frontend)
  date_range TEXT NOT NULL,           -- "May 2023 - 2025"
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
  image_url TEXT,                     -- Supabase Storage URL
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
-- This table extends it with optional fields.
CREATE TABLE visitor_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  provider TEXT,                      -- "google", "linkedin_oidc", "github"
  company TEXT,                       -- optional, asked before download
  role TEXT,                          -- optional, asked before download
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Resume download log
CREATE TABLE resume_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id UUID REFERENCES visitor_profiles(id),
  downloaded_at TIMESTAMPTZ DEFAULT now()
);

-- Admin users (subset of auth.users with admin role)
-- Managed via Supabase Auth app_metadata: { role: "admin" }
-- Set server-side via Supabase Admin API (supabase.auth.admin.updateUserById)
-- No separate table needed — use RLS policies + app_metadata.
```

### 1.3 Row Level Security (RLS)

```sql
-- Content tables: public read, admin write
-- Pattern applied to all content tables:
ALTER TABLE profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read" ON profile
  FOR SELECT USING (true);

CREATE POLICY "Admin write" ON profile
  FOR ALL USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

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
| `company-logos`  | Public  | Company logo images                        |

### 1.5 Seed Script

Create `lib/supabase/seed.ts` to migrate current `lib/data.ts` + hardcoded content into the database. This ensures no data is lost during migration.

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

### 2.2 Auth Middleware

Create `middleware.ts` at the project root to handle session refresh and route protection:

```
/admin/*     → Require authenticated user with admin role
/api/admin/* → Require authenticated user with admin role
/api/resume/download → Require any authenticated user
Everything else → Public
```

### 2.3 Auth UI Components

| Component             | Location                                    | Purpose                                                                                                  |
| --------------------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `LoginModal`          | `components/auth/login-modal.tsx`           | Modal with social login buttons (Google, LinkedIn, GitHub). Shown when visitor clicks "Download Resume". |
| `AdminLoginPage`      | `app/admin/login/page.tsx`                  | Admin login page with email/password + social login options.                                             |
| `AuthProvider`        | `context/auth-context.tsx`                  | React context wrapping Supabase auth state. Provides `user`, `session`, `signIn`, `signOut`.             |
| `OptionalFieldsModal` | `components/auth/optional-fields-modal.tsx` | After first social login, optionally ask for company and role before proceeding to download.             |

### 2.4 Resume Download Flow

```
1. Visitor clicks "Download Resume" (intro.tsx or command palette)
2. If not authenticated → show LoginModal with social login buttons
3. On successful login:
   a. Upsert visitor_profiles row (name, email, avatar, provider from OAuth)
   b. If first login → show OptionalFieldsModal (company, role — skippable)
   c. Fetch signed URL from Supabase Storage for the resume
   d. Log download in resume_downloads table
   e. Trigger browser download
4. If already authenticated → skip to step 3c
```

### 2.5 Contact Form Pre-fill

When a visitor is logged in (has an active Supabase session):

- Pre-fill the contact form's name and email fields from `visitor_profiles`
- Fields remain editable (pre-filled, not locked)
- No change to the server action `sendEmail.ts` — it still receives form data as before

---

## Phase 3: Data Layer — Fetching Content from Supabase

### 3.1 Data Fetching Strategy

Replace static imports from `lib/data.ts` with Supabase queries. Since this is a portfolio site with infrequently changing content, we'll use **ISR (Incremental Static Regeneration)** with on-demand revalidation.

| Pattern                | Where                | How                                                                 |
| ---------------------- | -------------------- | ------------------------------------------------------------------- |
| Server Components      | `app/page.tsx`       | Fetch data in server components, pass as props to client components |
| ISR + revalidation     | `next.config.js`     | `revalidate: 3600` (1 hour default)                                 |
| On-demand revalidation | Admin dashboard save | Call `revalidatePath('/')` after admin edits                        |
| Client-side auth state | Auth context         | Supabase real-time auth listener                                    |

### 3.2 Refactor Component Architecture

Currently all data-consuming components are client components (`'use client'`). Refactor:

1. **`app/page.tsx`** — Convert to a **server component**. Fetch all content data from Supabase here.
2. Pass data as props to child components.
3. Client components (`'use client'`) only needed for:
   - Components with interactivity (animations, filters, scroll observers)
   - Auth-dependent UI (download button, contact form pre-fill)

### 3.3 Data Fetching Functions

Create `lib/supabase/queries.ts` with typed query functions:

```typescript
// Each function returns typed data from Supabase
getProfile()          → Profile
getProfileStats()     → ProfileStat[]
getNavLinks()         → NavLink[]
getCompanies()        → Company[]
getExperiences()      → Experience[]
getProjectCategories()→ ProjectCategory[]
getProjects()         → Project[]
getSkillGroups()      → SkillGroup[] (with nested skills)
```

### 3.4 TypeScript Types

Create `lib/supabase/types.ts` — generate from Supabase schema using `supabase gen types typescript`. These types replace the current `lib/types.ts` and inline types in `lib/data.ts`.

### 3.5 Migration Path

To avoid a big-bang migration, implement a **fallback pattern**:

1. Keep `lib/data.ts` as a static fallback during development
2. Data fetching functions try Supabase first, fall back to static data if Supabase is unavailable
3. Remove fallback once Supabase is stable and seeded

---

## Phase 4: Admin Dashboard

### 4.1 Route Structure

```
app/admin/
├── login/
│   └── page.tsx              # Admin login (email/password + social)
├── layout.tsx                # Admin layout (sidebar, auth guard)
├── page.tsx                  # Dashboard overview (visitor stats, download counts)
├── profile/
│   └── page.tsx              # Edit profile info, about section, contact info
├── experience/
│   └── page.tsx              # CRUD experience entries (reorderable)
├── projects/
│   └── page.tsx              # CRUD projects, upload images, manage categories
├── skills/
│   └── page.tsx              # CRUD skill groups and skills (reorderable)
├── resume/
│   └── page.tsx              # Upload/replace resume PDF, view download log
└── visitors/
    └── page.tsx              # View visitor profiles and download history
```

### 4.2 Admin Layout

- Sidebar navigation (collapsible on mobile)
- Top bar with admin user info and sign-out
- Breadcrumb navigation
- Uses existing shadcn/ui components (Button, Card, Badge) + add Table, Dialog, Input, Textarea, Label, Select, Tabs

### 4.3 Admin Features by Page

**Dashboard** (`/admin`)

- Total visitors who logged in
- Total resume downloads (with chart over time)
- Quick links to edit sections

**Profile** (`/admin/profile`)

- Edit all fields from the `profile` table
- Edit stats (add/remove/reorder)
- Live preview of changes (optional, later phase)

**Experience** (`/admin/experience`)

- Table of experiences with inline editing
- Drag-to-reorder (or sort_order input)
- Add/delete entries
- Upload company logos

**Projects** (`/admin/projects`)

- Card-based list of projects
- Add/edit/delete projects
- Upload project images
- Manage categories

**Skills** (`/admin/skills`)

- Grouped view matching the frontend
- Add/remove/reorder groups and skills within groups

**Resume** (`/admin/resume`)

- Current resume file info (name, size, upload date)
- Upload new resume (replaces current file in Supabase Storage)
- Table of recent downloads (visitor name, email, company, date)

**Visitors** (`/admin/visitors`)

- Table of all visitors who logged in
- Filter by provider (Google, LinkedIn, GitHub)
- Export to CSV

### 4.4 Server Actions for Admin

Create `actions/admin.ts` with server actions for each CRUD operation. All actions:

- Verify admin role via Supabase session
- Perform the database operation
- Call `revalidatePath('/')` to bust ISR cache
- Return success/error response

### 4.5 Additional shadcn/ui Components Needed

```bash
npx shadcn@latest add table dialog input textarea label select tabs
npx shadcn@latest add dropdown-menu avatar separator sheet
```

---

## Phase 5: File Uploads & Storage

### 5.1 Resume Upload (Admin)

- Admin uploads PDF via `/admin/resume`
- File stored in `resume` bucket (private)
- Old file is deleted on replacement
- `profile.resume_url` updated with the new storage path

### 5.2 Resume Download (Visitor)

- Authenticated visitor triggers download
- Server action creates a short-lived signed URL (e.g., 60 seconds) for the private `resume` bucket
- Browser downloads via the signed URL
- Download logged in `resume_downloads`

### 5.3 Image Uploads (Admin)

- Project images → `project-images` bucket (public)
- Company logos → `company-logos` bucket (public)
- On upload, generate a public URL and store in the respective table
- Support image preview before saving

---

## Phase 6: Testing & Deployment

### 6.1 Testing

| Test Type | What to Test                                                  |
| --------- | ------------------------------------------------------------- |
| Unit      | Data fetching functions, auth utilities, admin server actions |
| Component | LoginModal, OptionalFieldsModal, admin form components        |
| E2E       | Resume download flow (login → optional fields → download)     |
| E2E       | Admin login → edit content → verify on frontend               |

### 6.2 Environment Variables

Add to Vercel and local `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

Update `.env.example` and CI pipeline if needed.

### 6.3 CI/CD Updates

- Add Supabase env vars to GitHub Actions secrets
- Ensure build works without Supabase connection (fallback to static data during CI builds)

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
| 9    | 2     | Visitor login modal + resume download flow        | Step 8       |
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
| 20   | 6     | Tests (unit, component, E2E)                      | Steps 7-19   |
| 21   | 6     | CI/CD updates + deployment                        | Step 20      |

---

## Files Changed / Created

### New Files

```
lib/supabase/client.ts           # Browser Supabase client
lib/supabase/server.ts           # Server Supabase client
lib/supabase/queries.ts          # Typed data fetching functions
lib/supabase/types.ts            # Generated TypeScript types
lib/supabase/seed.ts             # Seed script for initial data migration
middleware.ts                    # Auth + route protection middleware
context/auth-context.tsx         # Supabase auth React context
components/auth/login-modal.tsx  # Visitor social login modal
components/auth/optional-fields-modal.tsx
actions/admin.ts                 # Admin CRUD server actions
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

```
package.json                     # Add @supabase/supabase-js, @supabase/ssr
app/layout.tsx                   # Wrap with AuthProvider
app/page.tsx                     # Convert to server component, fetch data
components/intro.tsx             # Props instead of hardcoded data, auth-gated download
components/about.tsx             # Props instead of hardcoded data
components/contact.tsx           # Props + session pre-fill
components/experience.tsx        # Props instead of imported data
components/projects.tsx          # Props instead of imported data
components/skills.tsx            # Props instead of imported data
components/header.tsx            # Props instead of imported data
components/companies-slider.tsx  # Props instead of imported data
components/command-palette.tsx   # Props + auth-gated resume action
components/footer.tsx            # Props instead of hardcoded data
lib/types.ts                     # Extended with Supabase types
.env.example                     # Add Supabase env vars
.github/workflows/ci.yml         # Add Supabase env vars to CI
```

### Eventually Deprecated

```
lib/data.ts                      # Kept as fallback initially, removed once Supabase is stable
```

---

## Open Questions

1. **Admin seeding**: Should the first admin user be created via Supabase dashboard manually, or should there be a setup/invite flow?
2. **Image optimization**: Should uploaded images be processed (resized/compressed) before storage, or rely on Next.js `<Image>` optimization?
3. **Content versioning**: Is there a need to track edit history / rollback changes in the admin dashboard?
4. **Rate limiting**: Should resume downloads or login attempts be rate-limited?
