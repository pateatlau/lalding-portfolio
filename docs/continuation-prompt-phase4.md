# Continuation Prompt — Phase 4: Admin Dashboard

## Context

We are building a CMS & Authentication system for the **lalding.in** portfolio website, following `docs/cms-and-auth-plan.md` as the **single source of truth**. The work is split into 6 phases executed sequentially with manual gates between phases.

**Completed phases:**
- Phase 1 (Supabase Setup) — COMPLETE
- Phase 3 (Data Layer) — COMPLETE
- Phase 2 (Authentication) — COMPLETE

**Current phase:** Phase 4 (Admin Dashboard)

**Branch:** `feature/cms-phase1-supabase-setup` (all phases are built on this branch)

**Known issue:** LinkedIn OIDC login is not working (Google and GitHub work fine). Deferred — will debug after all phases are implemented.

---

## Phase 4 Scope

Phase 4 covers Steps 12–17 and Step 19 from the Implementation Order table in `docs/cms-and-auth-plan.md`. Step 18 (resume upload + download log) is Phase 5 in the plan doc, but it shares the admin layout, so it will be included in this phase's sub-tasks.

The plan doc sections 4.1–4.5 define the full scope. Key decisions made in the previous session:
- **Split into sub-phases** — implement 1 sub-task at a time, test and verify before continuing
- **Polished UI** — proper layout, transitions, loading states, responsive design

---

## Sub-Tasks (implement one at a time, wait for user confirmation before proceeding)

### 4A: Foundation — shadcn/ui Components + Admin Login + Admin Layout + Dashboard Overview
- Install required shadcn/ui components: `table dialog input textarea label select tabs dropdown-menu avatar separator sheet`
- Create admin login page (`app/admin/login/page.tsx`) — email/password + social login, redirect to `/admin` on success
- Create admin layout (`app/admin/layout.tsx`) — server component with auth guard (verify `app_metadata.role === 'admin'`), redirect to `/admin/login` if not admin
- Create admin shell client component (`components/admin/admin-shell.tsx`) — sidebar nav (collapsible on mobile via Sheet), top bar with breadcrumbs + admin info + sign out, active state highlighting
- Create dashboard page (`app/admin/page.tsx`) — visitor count, download count, recent downloads, quick action cards
- Create `actions/admin.ts` with `requireAdmin()` helper and `getAdminStats()` action
- Note: `proxy.ts` already protects `/admin/*` routes, no changes needed there

### 4B: Profile Editor
- Create profile editor page (`app/admin/profile/page.tsx`)
- Create profile form client component (`components/admin/profile-form.tsx`) — tabbed interface for General/About/Stats fields
- Add `updateProfile()` and `updateProfileStats()` server actions to `actions/admin.ts`
- Cache invalidation: `revalidateTag('profile')` + `revalidatePath('/')`

### 4C: Experience CRUD
- Create experience editor page (`app/admin/experience/page.tsx`)
- Create experience editor client component (`components/admin/experience-editor.tsx`) — table view, add/edit/delete dialogs, sort_order controls
- Add `createExperience()`, `updateExperience()`, `deleteExperience()`, `reorderExperiences()` server actions
- Cache invalidation: `revalidateTag('experiences')`

### 4D: Projects CRUD + File Uploads
- Create projects editor page (`app/admin/projects/page.tsx`)
- Create projects editor client component (`components/admin/projects-editor.tsx`) — card grid, add/edit/delete dialogs with image/video upload
- Create reusable file upload component (`components/admin/file-upload.tsx`) — drag-and-drop, preview, progress
- Add project CRUD + file upload/delete server actions to `actions/admin.ts`
- Cache invalidation: `revalidateTag('projects')`

### 4E: Skills CRUD
- Create skills editor page (`app/admin/skills/page.tsx`)
- Create skills editor client component (`components/admin/skills-editor.tsx`) — grouped card view, add/remove/reorder groups and skills
- Add skill group and skill CRUD server actions to `actions/admin.ts`
- Cache invalidation: `revalidateTag('skills')`

### 4F: Resume Management (from Phase 5 in plan doc)
- Create resume management page (`app/admin/resume/page.tsx`)
- Create resume manager client component (`components/admin/resume-manager.tsx`) — current resume info, upload new, download log table
- Add `uploadResume()` and `getResumeDownloads()` server actions
- Cache invalidation: `revalidateTag('profile')`

### 4G: Visitors Page
- Create visitors page (`app/admin/visitors/page.tsx`)
- Create visitors table client component (`components/admin/visitors-table.tsx`) — table with filter, search, sort, CSV export, pagination
- Add `getVisitors()` and `getVisitorsCsvData()` server actions

### 4H: Polish & Final Touches
- Loading states / skeleton screens for all admin pages
- Empty states (friendly messages when no data exists)
- Error boundaries
- Responsive verification on mobile/tablet
- Form validation (required fields, URL format, file size limits)

---

## Key Technical Context

### Existing Patterns to Follow

**Server actions** (`actions/resume.ts` pattern):
```typescript
'use server';
const supabase = await createClient(); // from lib/supabase/server.ts
const { data: { user } } = await supabase.auth.getUser();
// check user.app_metadata?.role === 'admin'
// perform operation
// revalidateTag('tag') + revalidatePath('/')
// return { data?, error? }
```

**Server → Client data flow** (`app/page.tsx` → components):
- Server components fetch data, pass as serializable props to client components
- Client components have `'use client'` directive for interactivity

**shadcn/ui config** (`components.json`):
- Style: `new-york`
- Icon library: `lucide` (import from `lucide-react`)
- RSC: true
- Base color: `neutral`
- CSS variables: true

### Already Installed
- shadcn/ui components: `button`, `badge`, `card`, `tooltip`
- `@supabase/supabase-js` v2.95.3, `@supabase/ssr` v0.8.0
- `framer-motion` v12.34.0
- `react-hot-toast` v2.4.1
- `lucide-react` v0.564.0
- `class-variance-authority`, `clsx`, `tailwind-merge`

### Key Files
- `docs/cms-and-auth-plan.md` — **single source of truth** for the full plan
- `lib/supabase/types.ts` — hand-written DB types (Row, Insert, Update for all tables)
- `lib/supabase/queries.ts` — data fetching functions with ISR
- `lib/supabase/server.ts` — server Supabase client (respects RLS)
- `lib/supabase/client.ts` — browser Supabase client
- `lib/supabase/admin.ts` — admin client (bypasses RLS, server-only)
- `context/auth-context.tsx` — auth state provider with `useAuth()` hook
- `proxy.ts` — session refresh + admin route protection (`app_metadata.role === 'admin'`)
- `app/auth/callback/route.ts` — OAuth code exchange
- `components.json` — shadcn/ui configuration

### Supabase Storage Buckets
- `resume` (private) — Resume PDFs
- `project-images` (public) — Project screenshots
- `project-videos` (public) — Demo videos
- `company-logos` (public) — Company logos

### Cache Tags (for `revalidateTag()`)
- `profile` — Profile info, stats, contact, footer
- `experiences` — Career timeline + companies
- `projects` — Project cards + categories
- `skills` — Skill groups and skills
- `navigation` — Header nav links

### ESLint Gotchas (React 19 strict rules)
- `react-hooks/set-state-in-effect` — no setState inside useEffect; use uncontrolled inputs with `defaultValue` + `key`-based re-mounting for pre-fill
- `react-hooks/refs` — no ref updates during render
- `@next/next/no-img-element` — use `<Image>` from `next/image`

### Next.js 16 Notes
- Uses `proxy.ts` (not `middleware.ts`) — function exported as `proxy` (not `middleware`)
- Dev server runs on port 1111

### Commands
- `npm run dev` — dev server on port 1111
- `npm run build` — production build
- `npm run lint` — ESLint
- `npm test -- --run` — vitest (not jest)

---

## Instructions for Claude

1. Read `docs/cms-and-auth-plan.md` first — it is the single source of truth
2. Start with **sub-task 4A** only. Do NOT proceed to 4B until the user explicitly confirms
3. Before coding, enter plan mode to design the implementation for the current sub-task
4. After implementing, run `npm run lint && npm run build` to verify
5. Update `docs/cms-and-auth-plan.md` with implementation notes after each sub-task
6. When making any plan updates, update `docs/cms-and-auth-plan.md` directly — do NOT create separate plan files
7. Commit after each sub-task is verified
