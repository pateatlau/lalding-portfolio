# CLAUDE.md - Project Guide

This document provides context for AI assistants working on this codebase.

## Project Overview

**Lalding's Portfolio Website** - A personal portfolio site for Laldingliana Tlau Vantawl, a Full-stack Tech Lead with 15+ years of experience.

- **Live URL**: https://lalding.in/
- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with dark mode support

Features a Supabase-backed CMS with an admin dashboard, a resume builder that generates tailored PDF resumes from CMS data with JD optimization, OAuth-gated resume downloads with visitor tracking, and a public-facing portfolio rendered via ISR with static data fallback.

## Tech Stack

| Category     | Technology                                                       |
| ------------ | ---------------------------------------------------------------- |
| Framework    | Next.js 16 (App Router), React 19, TypeScript 5.9                |
| Styling      | Tailwind CSS 4, shadcn/ui (Radix UI + CVA), tailwind-merge, clsx |
| Animation    | Framer Motion                                                    |
| Database     | Supabase (Postgres) with Row-Level Security                      |
| Auth         | Supabase Auth (Google, GitHub, LinkedIn OAuth)                   |
| File Storage | Supabase Storage (resume PDFs, project images/videos)            |
| PDF Gen      | Playwright (HTML → PDF via headless Chromium)                    |
| AI/LLM       | Anthropic Claude API (optional — JD keyword analysis)            |
| Forms/Email  | Resend API, React Email                                          |
| Monitoring   | Sentry (error tracking, performance, user feedback)              |
| Testing      | Vitest, Playwright, Testing Library                              |
| CI/CD        | GitHub Actions (lint, build, test, E2E, Lighthouse CI) → Vercel  |

## Project Structure

```text
lalding-portfolio/
├── .github/workflows/
│   └── ci.yml                    # CI/CD pipeline
├── app/
│   ├── admin/
│   │   ├── (dashboard)/          # Auth-guarded admin routes
│   │   │   ├── layout.tsx        # Auth check + AdminShell wrapper
│   │   │   ├── page.tsx          # Dashboard overview
│   │   │   ├── profile/          # Profile editor
│   │   │   ├── experience/       # Experience CRUD
│   │   │   ├── projects/         # Projects CRUD
│   │   │   ├── skills/           # Skills CRUD
│   │   │   ├── resume/           # Resume upload + download log
│   │   │   ├── resume-builder/   # Resume builder (compose, preview, generate)
│   │   │   ├── education/        # Education CRUD
│   │   │   ├── visitors/         # Visitor profiles + export
│   │   │   └── error.tsx         # Shared error boundary
│   │   └── login/page.tsx        # Admin login (public)
│   ├── auth/callback/route.ts    # OAuth callback handler
│   ├── layout.tsx                # Root layout with providers
│   ├── page.tsx                  # Home page (server component)
│   ├── globals.css               # Global styles
│   └── global-error.tsx          # Error boundary
├── components/
│   ├── admin/                    # Admin dashboard components
│   │   ├── admin-shell.tsx       # Sidebar + topbar layout
│   │   ├── dashboard-content.tsx # Stats cards + quick actions
│   │   ├── profile-form.tsx      # Tabbed profile editor
│   │   ├── experience-editor.tsx # Experience table + dialogs
│   │   ├── projects-editor.tsx   # Projects table + dialogs
│   │   ├── skills-editor.tsx     # Grouped skills editor
│   │   ├── resume-manager.tsx    # Resume upload + log
│   │   ├── resume-builder/      # Resume builder components
│   │   │   ├── resume-builder-tabs.tsx  # Tabbed container
│   │   │   ├── config-list.tsx          # Config CRUD list
│   │   │   ├── resume-composer.tsx      # Section picker + reorder
│   │   │   ├── resume-preview.tsx       # Live HTML preview + PDF gen
│   │   │   ├── jd-optimizer.tsx         # JD analysis + suggestions
│   │   │   ├── template-manager.tsx     # Template style editor
│   │   │   └── version-history.tsx      # Version list + activate
│   │   ├── visitors-table.tsx    # Visitors list + CSV export
│   │   ├── image-upload.tsx      # Reusable image upload
│   │   ├── video-upload.tsx      # Reusable video upload
│   │   └── sentry-feedback.tsx   # Sentry bug report widget
│   ├── auth/                     # Auth UI components
│   │   ├── login-modal.tsx       # Social login modal
│   │   └── optional-fields-modal.tsx
│   ├── resume-templates/         # Resume PDF templates
│   │   ├── types.ts              # ResumeData, ResumeSection, etc.
│   │   ├── registry.ts           # Template ID → component mapping
│   │   ├── professional.tsx      # Primary template (inline CSS for PDF fidelity)
│   │   └── shared/               # Shared template components
│   ├── ui/                       # shadcn/ui components
│   ├── intro.tsx                 # Hero section
│   ├── about.tsx                 # About section
│   ├── projects.tsx              # Projects grid
│   ├── project.tsx               # Project card (image/video)
│   ├── skills.tsx                # Skills tags
│   ├── experience.tsx            # Career timeline
│   ├── contact.tsx               # Contact form
│   ├── header.tsx                # Navigation
│   ├── footer.tsx                # Footer
│   ├── command-palette.tsx       # Cmd+K palette
│   └── theme-switch.tsx          # Dark/light toggle
├── actions/
│   ├── admin.ts                  # Admin CRUD server actions
│   ├── resume.ts                 # Resume download (signed URLs)
│   ├── resume-builder.ts         # Resume builder CRUD + JD analysis
│   ├── resume-pdf.ts             # PDF generation pipeline
│   └── sendEmail.ts              # Contact form email
├── context/
│   ├── active-section-context.tsx
│   ├── auth-context.tsx          # Supabase auth state
│   └── theme-context.tsx
├── lib/
│   ├── data.ts                   # Static fallback data
│   ├── hooks.ts                  # Custom hooks
│   ├── types.ts                  # Shared TypeScript types
│   ├── utils.ts                  # Utility functions
│   ├── resume-builder/
│   │   ├── jd-analyzer.ts        # JD keyword extraction + coverage scoring
│   │   ├── render-to-html.ts     # Template → HTML rendering
│   │   └── render-to-pdf.ts      # Playwright HTML → PDF conversion
│   └── supabase/
│       ├── client.ts             # Browser Supabase client
│       ├── server.ts             # Server Supabase client
│       ├── admin.ts              # Service role client (RLS bypass)
│       ├── queries.ts            # Typed data fetching functions
│       ├── types.ts              # Supabase schema types
│       ├── seed.ts               # Database seed script
│       └── setup-admin.ts        # Admin user setup script
├── supabase/                     # SQL migration files
│   ├── schema.sql                # Content tables
│   ├── rls.sql                   # Content RLS policies
│   ├── storage.sql               # Storage buckets
│   ├── auth-schema.sql           # Auth/visitor tables
│   ├── auth-rls.sql              # Auth RLS policies
│   ├── education-schema.sql      # Education table
│   ├── resume-builder-schema.sql # Resume builder tables
│   ├── resume-builder-rls.sql    # Resume builder RLS policies
│   └── resume-builder-seed.sql   # Built-in template seed data
├── e2e/                          # Playwright E2E tests
├── __tests__/                    # Vitest unit/component tests
│   ├── actions/                  # Server action tests
│   ├── components/admin/         # Admin component tests
│   ├── components/auth/          # Auth component tests
│   ├── lib/                      # Library module tests
│   └── helpers/                  # Test fixtures + mocks
├── email/
│   └── contact-form-email.tsx    # Resend email template
├── public/                       # Static assets
│   ├── images/                   # Project screenshots
│   └── companies/                # Company logos
├── docs/                         # Project documentation
└── scripts/                      # Utility scripts
```

## Commands

```bash
npm run dev              # Dev server on port 1111
npm run build            # Production build
npm run start            # Start production server
npm run lint             # ESLint
npm run format           # Prettier (write)
npm run format:check     # Prettier (check only — used in CI)
npm run test             # Vitest (watch mode)
npm run test:run         # Vitest (single run)
npm run test:coverage    # Vitest with coverage report
npm run test:e2e         # Playwright E2E tests
npm run seed             # Seed Supabase with data from lib/data.ts
npm run setup-admin      # Create admin user in Supabase
npm run validate-supabase # Test Supabase connection
```

## Environment Variables

| Variable                        | Required | Description                                                                 |
| ------------------------------- | -------- | --------------------------------------------------------------------------- |
| `RESEND_API_KEY`                | Yes      | API key for Resend email service (contact form)                             |
| `NEXT_PUBLIC_SUPABASE_URL`      | No\*     | Supabase project URL                                                        |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | No\*     | Supabase anonymous/public key                                               |
| `SUPABASE_SERVICE_ROLE_KEY`     | No\*     | Supabase service role key (server-side only, for seeding/admin setup)       |
| `NEXT_PUBLIC_SENTRY_DSN`        | No       | Sentry DSN (public ingest endpoint)                                         |
| `SENTRY_AUTH_TOKEN`             | No       | Sentry auth token for source map uploads                                    |
| `SENTRY_ORG`                    | No       | Sentry organization slug                                                    |
| `SENTRY_PROJECT`                | No       | Sentry project slug                                                         |
| `RESUME_BUILDER_LLM_API_KEY`    | No       | Anthropic API key for JD keyword analysis (resume builder works without it) |
| `NEXT_TELEMETRY_DISABLED`       | No       | Set to `1` to disable Next.js telemetry                                     |
| `VERCEL_OIDC_TOKEN`             | No       | Vercel OIDC token (set automatically in Vercel deployments)                 |
| `E2E_ADMIN_EMAIL`               | No       | Admin email for E2E tests (tests skip without this)                         |
| `E2E_ADMIN_PASSWORD`            | No       | Admin password for E2E tests                                                |

\* Without Supabase env vars, the app falls back to static data from `lib/data.ts`. All CMS, auth, and admin features require Supabase.

## Key Patterns

### Server Actions

- Admin CRUD operations in `actions/admin.ts` — all guarded by `requireAdmin()`
- Return type pattern: `{ data?: T; error?: string }`
- Resume builder actions split across `actions/resume-builder.ts` (CRUD + JD analysis) and `actions/resume-pdf.ts` (assembly + generation)
- Contact form uses `actions/sendEmail.ts`

### Context Providers

- `ThemeContextProvider` — manages dark/light theme
- `ActiveSectionContextProvider` — tracks current navigation section
- `AuthProvider` — Supabase auth state (client-side)

### Custom Hooks

- `useSectionInView()` — Intersection Observer for section tracking

### Animation

Framer Motion is used throughout for scroll-triggered animations and transitions.

### Resume Builder Architecture

- **Config system** — `resume_configs` table defines which CMS items to include per resume variant
- **Template engine** — React components (`components/resume-templates/`) rendered to HTML with inline CSS (no Tailwind in templates — PDF fidelity)
- **PDF pipeline** — `assembleResumeData()` → `renderToHtml()` → `htmlToPdf()` (Playwright)
- **JD analysis** — `lib/resume-builder/jd-analyzer.ts` has pure functions for keyword extraction (LLM), fuzzy coverage scoring (`fastest-levenshtein`), and suggestion generation
- **LLM guard** — JD features gated by `RESUME_BUILDER_LLM_API_KEY` env var; builder works without it

### Admin UI Patterns

- shadcn/ui components (`Card`, `Badge`, `Button`, `Dialog`, `Table`, `Tabs`, etc.)
- `'use client'` directive on interactive components
- Status messages: `{ type: 'success' | 'error'; message: string } | null`
- Loading states with `isLoading` booleans and `Loader2` spinner
- Dark mode via Tailwind `dark:` variants

### Data Flow

- Public site: Supabase → `lib/supabase/queries.ts` → `app/page.tsx` (server component) → section components via props
- Fallback: `lib/data.ts` when Supabase env vars not configured
- ISR with `revalidate = 3600` + on-demand revalidation via `revalidatePath('/')` after admin edits

### Auth Architecture

- `proxy.ts` — refreshes Supabase session, protects `/admin/*` routes
- `requireAdmin()` — server-side guard checking `app_metadata.role === 'admin'`
- Visitor flow: social login → upsert profile → optional fields → signed URL download

---

## Git Workflow

**Branching Strategy**: Trunk-based development

- `main` — production branch
- `feature/*` — feature branches merged directly to main via PR

**CI/CD**: GitHub Actions (`.github/workflows/ci.yml`)

- Lint + format check → parallel Build, Test, E2E pipeline
- Lighthouse CI for performance audits on PRs
- Automated Vercel production deployment on main (gated behind all CI jobs)

---

## Documentation

| Document                                                                           | Description                                               |
| ---------------------------------------------------------------------------------- | --------------------------------------------------------- |
| [`docs/cms-and-auth-plan.md`](docs/cms-and-auth-plan.md)                           | Master plan for Supabase CMS + auth + Sentry (Phases 1-7) |
| [`docs/resume-builder-plan.md`](docs/resume-builder-plan.md)                       | Resume builder feature plan (Phase 8)                     |
| [`docs/ui-ux-design.md`](docs/ui-ux-design.md)                                     | Comprehensive UI/UX modernization plan                    |
| [`docs/testing-infrastructure.md`](docs/testing-infrastructure.md)                 | Testing setup (Vitest, Playwright, coverage)              |
| [`docs/CI-CD-OPTIMIZATIONS.md`](docs/CI-CD-OPTIMIZATIONS.md)                       | CI/CD pipeline architecture and optimizations             |
| [`docs/improvements-and-optimizations.md`](docs/improvements-and-optimizations.md) | Known issues and optimization recommendations             |

---

## Style Guidelines

- Use Tailwind CSS for all styling (except resume templates which use inline CSS)
- Follow existing animation patterns with Framer Motion
- Maintain consistent spacing (using Tailwind's spacing scale)
- Keep dark mode support for all new components
- Use semantic HTML where possible
- shadcn/ui for admin dashboard UI components

---

## Development Notes

- Dev server runs on port 1111 (not 3000)
- Uses Intersection Observer for scroll-based section tracking
- Email sending requires `RESEND_API_KEY` environment variable
- Static fallback data in `lib/data.ts` — used when Supabase is not configured
- Resume templates use inline CSS only (no Tailwind) for PDF rendering fidelity
- Playwright is used for both E2E testing and PDF generation
