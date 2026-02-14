# CLAUDE.md - Project Guide

This document provides context for AI assistants working on this codebase.

## Project Overview

**Lalding's Portfolio Website** - A personal portfolio site for Laldingliana Tlau Vantawl, a Full-stack Tech Lead with 15+ years of experience.

- **Live URL**: https://lalding.in/
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with dark mode support

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 14.2.0 (App Router) |
| UI | React 18.3.0, TypeScript 5.1.5 |
| Styling | Tailwind CSS 3.3.2, PostCSS |
| Animation | Framer Motion 10.12.17 |
| Forms/Email | Resend API, React Email |
| Icons | React Icons |
| Timeline | react-vertical-timeline-component |
| Carousel | React Slick |

## Project Structure

```
lalding-portfolio/
├── .github/workflows/      # GitHub Actions CI/CD
│   └── ci.yml              # Main CI pipeline
├── app/                    # Next.js App Router pages
│   ├── layout.tsx          # Root layout with providers
│   ├── page.tsx            # Home page
│   ├── globals.css         # Global styles
│   └── global-error.tsx    # Error boundary
├── components/             # React components
│   ├── intro.tsx           # Hero section
│   ├── about.tsx           # About section
│   ├── projects.tsx        # Projects grid
│   ├── project.tsx         # Individual project card
│   ├── skills.tsx          # Skills tags
│   ├── experience.tsx      # Career timeline
│   ├── contact.tsx         # Contact form
│   ├── header.tsx          # Navigation
│   ├── footer.tsx          # Footer
│   ├── theme-switch.tsx    # Dark/light toggle
│   └── ...
├── actions/                # Server Actions
│   └── sendEmail.ts        # Email submission
├── context/                # React Context providers
│   ├── active-section-context.tsx
│   └── theme-context.tsx
├── lib/                    # Utilities and data
│   ├── data.ts             # Portfolio content data
│   ├── hooks.ts            # Custom hooks
│   └── types.ts            # TypeScript types
├── email/                  # Email templates
│   └── contact-form-email.tsx
├── docs/                   # Project documentation
│   ├── ui-ux-design.md     # UI/UX modernization plan
│   └── improvements-and-optimizations.md
└── public/                 # Static assets
    ├── images/             # Project screenshots
    └── companies/          # Company logos
```

## Commands

```bash
npm run dev      # Start dev server on port 1111
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `RESEND_API_KEY` | API key for Resend email service |

## Key Patterns

### Server Actions
Contact form uses React Server Actions in `actions/sendEmail.ts`.

### Context Providers
- `ThemeContextProvider` - Manages dark/light theme
- `ActiveSectionContextProvider` - Tracks current navigation section

### Custom Hooks
- `useSectionInView()` - Intersection Observer for section tracking

### Animation
Framer Motion is used throughout for scroll-triggered animations and transitions.

---

## Git Workflow

**Branching Strategy**: Trunk-based development
- `main` - Production branch
- `feature/*` - Feature branches merged directly to main via PR

**CI/CD**: GitHub Actions (`.github/workflows/ci.yml`)
- Lint → Build pipeline
- Lighthouse CI for performance audits on PRs
- Deploy job (currently disabled - see TODO below)

---

## Documentation

| Document | Description |
|----------|-------------|
| [`docs/ui-ux-design.md`](docs/ui-ux-design.md) | Comprehensive UI/UX modernization plan |
| [`docs/improvements-and-optimizations.md`](docs/improvements-and-optimizations.md) | Known issues and optimization recommendations |

---

## TODOs

### CI/CD: Enable Vercel Deployment

The deploy job in `.github/workflows/ci.yml` is currently disabled. To enable automated deployments:

1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel link` in the project root to connect to your Vercel project
3. Get your Vercel token from https://vercel.com/account/tokens
4. Add these secrets to GitHub repository settings (Settings → Secrets → Actions):
   - `VERCEL_TOKEN` - Your Vercel API token
   - `VERCEL_ORG_ID` - Found in `.vercel/project.json` after linking
   - `VERCEL_PROJECT_ID` - Found in `.vercel/project.json` after linking
5. Uncomment the deploy job in `.github/workflows/ci.yml`

---

## Known Issues

1. **Typo**: `flew-row` in `components/experience.tsx:53`
2. **Security**: External links missing `rel="noopener noreferrer"`
3. **Unused import**: `useEffect` in `app/global-error.tsx`
4. **Image quality**: Using 95% quality (consider reducing to 85%)

---

## Style Guidelines

- Use Tailwind CSS for all styling
- Follow existing animation patterns with Framer Motion
- Maintain consistent spacing (using Tailwind's spacing scale)
- Keep dark mode support for all new components
- Use semantic HTML where possible

---

## Development Notes

- Dev server runs on port 1111 (not 3000)
- Uses Intersection Observer for scroll-based section tracking
- Email sending requires RESEND_API_KEY environment variable
- Project data is centralized in `lib/data.ts`
