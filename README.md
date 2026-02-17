# Lalding's Portfolio

Personal portfolio site for **Laldingliana Tlau Vantawl** — Full-stack Tech Lead with 15+ years of experience. Features a Supabase-backed CMS with an admin dashboard for managing all content, OAuth-gated resume downloads with visitor tracking, and a public-facing portfolio rendered via ISR with static data fallback.

**Live**: [lalding.in](https://lalding.in/)

## Tech Stack

| Category     | Technology                                                       |
| ------------ | ---------------------------------------------------------------- |
| Framework    | Next.js 16 (App Router), React 19, TypeScript 5.9                |
| Styling      | Tailwind CSS 4, shadcn/ui (Radix UI + CVA), tailwind-merge, clsx |
| Animation    | Framer Motion                                                    |
| Database     | Supabase (Postgres) with Row-Level Security                      |
| Auth         | Supabase Auth (Google, GitHub, LinkedIn OAuth)                   |
| File Storage | Supabase Storage (resume PDFs, project images/videos)            |
| Forms/Email  | Resend API, React Email                                          |
| Testing      | Vitest, Playwright, Testing Library                              |
| CI/CD        | GitHub Actions (lint, build, test, E2E, Lighthouse CI) → Vercel  |

## Key Features

### Public Site

- **Command palette** (Cmd+K / Ctrl+K) for keyboard-first navigation
- **Typewriter hero** with animated role cycling
- **Bento grid** about section with animated stat counters
- **Project filtering** by category with smooth transitions
- **Inline demo videos** on project cards (with fallback to static images)
- **Grouped skills** organized by category
- **Glassmorphism timeline** for career experience
- **Split contact layout** with info cards and contact form
- **Mesh gradient background** (layered OKLCH radial gradients)
- **Scroll progress indicator** in the header
- **Dark mode** with system preference detection
- **Responsive** with mobile-specific optimizations
- **prefers-reduced-motion** support throughout

### CMS & Admin Dashboard

- **Admin dashboard** at `/admin` with auth-guarded route group
- **Profile editor** — tabbed form for personal info, about section, and stats
- **Experience CRUD** — table view with reorder, add/edit/delete dialogs
- **Projects CRUD** — table view with image/video uploads via Supabase Storage
- **Skills CRUD** — grouped card view with inline editing and reorder
- **Resume management** — upload/replace PDF, view download log with visitor info
- **Visitors page** — searchable/sortable table with CSV export
- **On-demand revalidation** — admin edits instantly reflect on the public site via ISR

### Authentication & Resume Gating

- **Social login** (Google, GitHub, LinkedIn) via Supabase Auth
- **Resume download gate** — visitors must sign in to download the resume
- **Optional fields modal** — asks for company/role on first login (skippable)
- **Visitor tracking** — profiles and download history stored in Supabase
- **Contact form pre-fill** — name and email auto-filled from visitor profile
- **Signed URLs** — resume served via time-limited signed URLs (5-min expiry)

## Getting Started

```bash
npm install
npm run dev      # http://localhost:1111
```

### Environment Variables

Copy `.env.example` to `.env.local` and fill in the values:

| Variable                        | Required | Description                                                           |
| ------------------------------- | -------- | --------------------------------------------------------------------- |
| `RESEND_API_KEY`                | Yes      | API key for Resend email service (contact form)                       |
| `NEXT_PUBLIC_SUPABASE_URL`      | No\*     | Supabase project URL                                                  |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | No\*     | Supabase anonymous/public key                                         |
| `SUPABASE_SERVICE_ROLE_KEY`     | No\*     | Supabase service role key (server-side only, for seeding/admin setup) |
| `NEXT_PUBLIC_SENTRY_AUTH_TOKEN` | No       | Sentry auth token for error monitoring                                |
| `NEXT_TELEMETRY_DISABLED`       | No       | Set to `1` to disable Next.js telemetry                               |
| `VERCEL_OIDC_TOKEN`             | No       | Vercel OIDC token (set automatically in Vercel deployments)           |
| `E2E_ADMIN_EMAIL`               | No       | Admin email for E2E tests (tests skip without this)                   |
| `E2E_ADMIN_PASSWORD`            | No       | Admin password for E2E tests                                          |

\* Without Supabase env vars, the app falls back to static data from `lib/data.ts` and logs a warning. All CMS, auth, and admin features require Supabase.

### Supabase Setup

1. Create a Supabase project
2. Run the SQL files in order in the Supabase SQL Editor:
   - `supabase/schema.sql` — content tables
   - `supabase/rls.sql` — RLS policies for content tables
   - `supabase/storage.sql` — storage buckets and access policies
   - `supabase/auth-schema.sql` — visitor profiles and resume downloads tables
   - `supabase/auth-rls.sql` — RLS policies for auth tables
3. Configure OAuth providers (Google, GitHub, LinkedIn) in the Supabase dashboard
4. Seed the database: `npm run seed`
5. Create an admin user: `npm run setup-admin`

### Commands

```bash
npm run dev              # Dev server on port 1111
npm run build            # Production build
npm run lint             # ESLint
npm run format           # Prettier (write)
npm run format:check     # Prettier (check only — used in CI)
npm run test             # Vitest (watch mode)
npm run test:run         # Vitest (single run)
npm run test:coverage    # Vitest with coverage report
npm run test:e2e         # Playwright E2E tests
npm run test:e2e:headed  # Playwright with browser UI
npm run seed             # Seed Supabase with data from lib/data.ts
npm run setup-admin      # Create admin user in Supabase
npm run validate-supabase # Test Supabase connection
```

## Project Structure

```
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
│   │   ├── visitors-table.tsx    # Visitors list + CSV export
│   │   ├── image-upload.tsx      # Reusable image upload
│   │   └── video-upload.tsx      # Reusable video upload
│   ├── auth/                     # Auth UI components
│   │   ├── login-modal.tsx       # Social login modal
│   │   └── optional-fields-modal.tsx
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
│   ├── companies-slider.tsx      # Company logos carousel
│   ├── scroll-progress.tsx       # Scroll progress bar
│   ├── section-animation.tsx     # Framer Motion wrapper
│   └── theme-switch.tsx          # Dark/light toggle
├── actions/
│   ├── admin.ts                  # Admin CRUD server actions
│   ├── resume.ts                 # Resume download (signed URLs)
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
│   └── auth-rls.sql              # Auth RLS policies
├── scripts/
│   └── validate-supabase.ts      # Connection validation
├── e2e/                          # Playwright E2E tests
│   ├── auth.setup.ts             # Auth state setup
│   ├── navigation.spec.ts
│   ├── theme.spec.ts
│   ├── contact-form.spec.ts
│   ├── accessibility.spec.ts
│   ├── resume-download.spec.ts
│   ├── admin-auth.spec.ts
│   ├── admin-dashboard.spec.ts
│   ├── admin-profile.spec.ts
│   ├── admin-experience.spec.ts
│   ├── admin-projects.spec.ts
│   ├── admin-skills.spec.ts
│   ├── admin-resume.spec.ts
│   └── admin-public-sync.spec.ts
├── __tests__/                    # Vitest unit/component tests
│   ├── actions/admin.test.ts
│   ├── components/admin/         # Admin component tests
│   ├── components/auth/          # Auth component tests
│   ├── context/                  # Context tests
│   ├── unit/lib/                 # Query, hook, util tests
│   └── helpers/                  # Test fixtures + mocks
├── email/
│   └── contact-form-email.tsx    # Resend email template
├── public/                       # Static assets
│   ├── images/                   # Project screenshots
│   └── companies/                # Company logos
├── proxy.ts                      # Auth + route protection (Next.js 16)
├── next.config.js
├── playwright.config.ts
├── vitest.config.ts
├── lighthouserc.json
└── components.json               # shadcn/ui config
```

## Architecture

### Data Flow

```
Supabase (Postgres) ──→ lib/supabase/queries.ts ──→ app/page.tsx (server component)
                                                          │
                                                          ├──→ intro.tsx (props)
                                                          ├──→ about.tsx (props)
                                                          ├──→ projects.tsx (props)
                                                          ├──→ skills.tsx (props)
                                                          ├──→ experience.tsx (props)
                                                          ├──→ contact.tsx (props)
                                                          └──→ footer.tsx (props)

Fallback: lib/data.ts ──→ (used when Supabase env vars are not configured)
```

### Caching Strategy

- **ISR** with `revalidate = 3600` (1 hour) on the home page
- **On-demand revalidation** via `revalidatePath('/')` after admin edits
- Static data fallback when Supabase is not configured

### Auth Architecture

- **Proxy** (`proxy.ts`) — refreshes Supabase session, protects `/admin/*` routes
- **AuthProvider** (`context/auth-context.tsx`) — client-side auth state
- **Admin guard** — `requireAdmin()` helper checks `app_metadata.role === 'admin'`
- **Visitor flow** — social login → upsert profile → optional fields → signed URL download

## CI/CD Pipeline

```
Lint & Format Check
        │
        ├──→ Unit & Integration Tests (Vitest + coverage)
        ├──→ E2E Tests (Playwright on Chromium)
        └──→ Build (with Supabase validation)
                    │
                    └──→ Lighthouse Audit (PRs only)
                    │
Deploy to Vercel (main branch only, gated behind all jobs)
```

Fork contributors without Supabase secrets will see a warning — the build uses the static data fallback from `lib/data.ts`.

## Architectural Decisions

**ISR over SSR** — Portfolio content changes infrequently (profile updates, new projects). ISR with `revalidate = 3600` serves static pages at CDN speed while admin edits trigger on-demand revalidation via `revalidatePath('/')` for instant updates. SSR would add unnecessary per-request latency for content that rarely changes.

**Supabase over self-hosted Postgres** — Supabase provides Postgres, auth, file storage, and RLS in a single managed service. This eliminates the need to self-host a database, build an auth system, and manage file uploads separately. The generous free tier covers a portfolio site's usage, and the JS client integrates directly with Next.js server components.

**Signed URLs for resume downloads** — The resume PDF lives in a private Supabase Storage bucket. Signed URLs (5-minute expiry) ensure only authenticated visitors can download it, without exposing permanent public links. The short TTL limits link sharing while accommodating slow connections.

**OAuth gating for resume downloads** — Requiring social login before download serves two purposes: it captures visitor identity (name, email, company) for the site owner's analytics, and it adds a lightweight friction layer that filters casual downloads. The optional fields modal (company, role) is skippable to avoid blocking motivated visitors.

**Static fallback mode** — When Supabase env vars are not configured, all query functions return `null` and the app renders from `lib/data.ts`. This lets fork contributors run the site locally without a Supabase project, keeps CI builds passing without secrets, and provides a safety net if the database is temporarily unreachable.

## Roadmap

- [ ] **Resume builder** — generate a resume PDF from admin CMS data (leveraging existing profile, experience, skills, and projects content)
- [ ] **Sentry integration** — full error monitoring and performance tracking (previously implemented but removed due to issues; needs re-implementation)
- [x] **Contact form email** — fixed email delivery with verified custom domain (noreply@lalding.in)
- [ ] **UI improvements** — misc UI polish and optimizations across public site and admin dashboard
- [ ] **SEO optimizations** — structured data, Open Graph tags, sitemap, and meta tag improvements

## Documentation

| Document                                                               | Description                                      |
| ---------------------------------------------------------------------- | ------------------------------------------------ |
| [CMS & Auth Plan](docs/cms-and-auth-plan.md)                           | Master plan for Supabase CMS + auth (Phases 1-6) |
| [UI/UX Modernization Plan](docs/ui-ux-design.md)                       | Comprehensive 5-phase redesign plan (completed)  |
| [Testing Infrastructure](docs/testing-infrastructure.md)               | Testing setup (Vitest, Playwright, coverage)     |
| [CI/CD Pipeline](docs/CI-CD-OPTIMIZATIONS.md)                          | CI/CD pipeline architecture and optimizations    |
| [Improvements & Optimizations](docs/improvements-and-optimizations.md) | Known issues and optimization recommendations    |
| [Tailwind v4 Migration](docs/tailwind-v4-migration.md)                 | Tailwind CSS v3 → v4 migration notes             |
| [Next.js 16 Migration](docs/next-16-migration.md)                      | Next.js 15 → 16 migration notes                  |
