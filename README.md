# Lalding's Portfolio

Personal portfolio site for **Laldingliana Tlau Vantawl** — Full-stack Tech Lead with 15+ years of experience.

**Live**: [lalding.in](https://lalding.in/)

## Tech Stack

- **Framework**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS 4, shadcn/ui (Radix UI + CVA), tailwind-merge, clsx
- **Animation**: Framer Motion
- **Forms/Email**: Resend API, React Email
- **Testing**: Vitest, Playwright, Testing Library
- **CI/CD**: GitHub Actions (lint, build, test, E2E, Lighthouse CI) → Vercel

## Key Features

- **Command palette** (⌘K / Ctrl+K) for keyboard-first navigation
- **Typewriter hero** with animated role cycling
- **Bento grid** about section with animated stat counters
- **Project filtering** by category with smooth transitions
- **Grouped skills** organized by category
- **Glassmorphism timeline** for career experience
- **Split contact layout** with info cards and contact form
- **Mesh gradient background** (layered OKLCH radial gradients)
- **Scroll progress indicator** in the header
- **Dark mode** with system preference detection
- **Responsive** with mobile-specific optimizations
- **prefers-reduced-motion** support throughout

## Getting Started

```bash
npm install
npm run dev      # http://localhost:1111
```

### Environment Variables

| Variable         | Description                      |
| ---------------- | -------------------------------- |
| `RESEND_API_KEY` | API key for Resend email service |

### Commands

```bash
npm run build          # Production build
npm run lint           # ESLint
npm run format         # Prettier
npm run test           # Vitest (unit/component)
npm run test:e2e       # Playwright (E2E)
npm run test:coverage  # Coverage report
```

## Documentation

| Document                                                               | Description                                     |
| ---------------------------------------------------------------------- | ----------------------------------------------- |
| [UI/UX Modernization Plan](docs/ui-ux-design.md)                       | Comprehensive 5-phase redesign plan (completed) |
| [Improvements & Optimizations](docs/improvements-and-optimizations.md) | Known issues and optimization recommendations   |
| [CI/CD Pipeline](docs/CI-CD-OPTIMIZATIONS.md)                          | CI/CD pipeline architecture and optimizations   |
| [Testing Infrastructure](docs/testing-infrastructure.md)               | Testing setup (Vitest, Playwright, coverage)    |
| [Tailwind v4 Migration](docs/tailwind-v4-migration.md)                 | Tailwind CSS v3 → v4 migration notes            |
| [Next.js 16 Migration](docs/next-16-migration.md)                      | Next.js 15 → 16 migration notes                 |
