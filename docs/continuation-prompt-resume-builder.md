# Continuation Prompt: Resume Builder — Implementation

## Context

We're implementing the **Resume Builder** feature (Phase 8) for the portfolio site (lalding.in). The full architecture design and implementation plan is in `docs/resume-builder-plan.md` — **read this file first**, it is the source of truth for everything: data model, types, template system, PDF pipeline, admin UI, and sub-task breakdown (8A–8J).

## Branch

You should be on branch `feature/resume-builder-implement` (created from `main`). If not, create it.

## What's Already Built (Phases 1–7)

The portfolio site has a fully working Supabase CMS with admin dashboard:

- **Supabase CMS**: Tables for `profile`, `experiences`, `projects`, `skill_groups`, `skills`, `profile_stats` — all with RLS
- **Auth**: Supabase OAuth, admin-only gated dashboard
- **Admin dashboard**: `/admin/*` with sidebar nav (Dashboard, Profile, Experience, Projects, Skills, Resume, Visitors)
- **File uploads**: Supabase Storage with `resume` bucket (manual upload + download tracking)
- **Testing**: Vitest unit tests, Playwright E2E tests
- **CI/CD**: GitHub Actions (lint → build + test + e2e in parallel) → Vercel deploy
- **Monitoring**: Sentry error tracking

## Key Files to Read

Before starting any sub-task, read these:

| File                               | Why                                                                           |
| ---------------------------------- | ----------------------------------------------------------------------------- |
| `docs/resume-builder-plan.md`      | **THE PLAN** — architecture, schema, types, sub-tasks (8A–8J)                 |
| `CLAUDE.md`                        | Project conventions and structure                                             |
| `lib/supabase/types.ts`            | Current Supabase schema types (existing tables the builder uses)              |
| `actions/admin.ts`                 | Server action patterns: `requireAdmin()`, return types, Supabase client usage |
| `components/admin/admin-shell.tsx` | Admin sidebar nav structure (add "Resume Builder" nav item)                   |
| `temp-downloads/resume.pdf`        | Visual reference for the "Professional" template (pixel-match target)         |

## Existing Patterns to Follow

### Server Actions (`actions/admin.ts`)

```typescript
// Discriminated union return type
type AdminResult = { user: User; error?: undefined } | { user?: undefined; error: string };

// Every server action:
// 1. Calls requireAdmin() first
// 2. Returns { data } on success or { error: string } on failure
// 3. Calls revalidatePath() after mutations
```

### Admin Navigation (`components/admin/admin-shell.tsx`)

```typescript
// Icons from lucide-react
const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/profile', label: 'Profile', icon: User },
  // ... existing items
  { href: '/admin/resume', label: 'Resume', icon: FileText },
  { href: '/admin/visitors', label: 'Visitors', icon: Users },
];
// Add Resume Builder between Resume and Visitors
```

### Admin Page Structure

```
app/admin/(dashboard)/<section>/
├── page.tsx      # Server component: fetches data, passes to client components
└── loading.tsx   # Skeleton loader
```

### Profile Type (note: `website_url` column is added in 8A)

The `profile` table currently has: `full_name`, `job_title`, `email`, `phone`, `location`, `linkedin_url`, `github_url`, `resume_url`, `about_tech_stack`, `about_expertise`, etc. The `website_url` field does NOT exist yet — it's added as part of sub-task 8A.

## Sub-tasks (8A–8J)

All sub-task details are in `docs/resume-builder-plan.md`. Summary:

| Sub-task | Scope                                  | Status  |
| -------- | -------------------------------------- | ------- |
| **8A**   | Database schema & TypeScript types     | PENDING |
| **8B**   | Template system & React components     | PENDING |
| **8C**   | PDF generation server action           | PENDING |
| **8D**   | Resume config CRUD server actions      | PENDING |
| **8E**   | Admin UI — Config List & Composer      | PENDING |
| **8F**   | Admin UI — Preview & Generation        | PENDING |
| **8G**   | Admin UI — Templates & Version History | PENDING |
| **8H**   | Testing & Polish                       | PENDING |
| **8I**   | JD Analysis Engine (LLM-powered)       | PENDING |
| **8J**   | JD Optimization UI                     | PENDING |

## Workflow Constraints

**These are strict rules — follow them exactly:**

1. **One sub-task at a time.** Implement the current sub-task fully before moving to the next.
2. **Read the sub-task spec first.** Before writing any code, re-read the sub-task's section in `docs/resume-builder-plan.md` to understand all requirements.
3. **Test before declaring done.** After completing a sub-task, run:
   - `npm run lint` — no lint errors
   - `npm run build` — build succeeds
   - `npm run format:check` — Prettier passes (run `npx prettier --write .` to fix)
   - Sub-task-specific tests as defined in the plan
4. **Wait for user confirmation** before proceeding to the next sub-task. Do NOT auto-advance.
5. **Update status in the plan.** After completing a sub-task, change its status from `PENDING` to `DONE` in `docs/resume-builder-plan.md`.
6. **Commit after each sub-task.** Create a descriptive commit with the sub-task ID (e.g., "Implement 8A: Database schema & types").
7. **Follow existing patterns.** Match the coding style, file structure, and conventions already in the codebase. Read before writing.
8. **No over-engineering.** Implement exactly what the plan specifies. Don't add features, abstractions, or "improvements" beyond the sub-task scope.

## CI Checks

Before committing, always run:

```bash
npm run lint
npm run build
npx prettier --write .
npm run format:check
```

## What to Do Now

1. Read `docs/resume-builder-plan.md` in full
2. Read `lib/supabase/types.ts` and `actions/admin.ts` for existing patterns
3. Start implementing **sub-task 8A** (Database Schema & Types)
4. After completing 8A, run all CI checks, commit, and wait for confirmation
