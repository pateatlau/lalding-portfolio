# Next.js 16 Migration Plan

**Current Version:** Next.js 15.5.12
**Target Version:** Next.js 16.x (latest stable)
**React Version:** React 19.2.4 (already compatible)
**Node.js Version:** v24.11.0 (exceeds minimum 20.9.0)

**References:**

- [Next.js Version 16 Upgrade Guide](https://nextjs.org/docs/app/guides/upgrading/version-16)
- [Next.js 16 Release Notes](https://nextjs.org/blog/next-16)
- [Next.js 16.1 Release Notes](https://nextjs.org/blog/next-16-1)

---

## Executive Summary

Next.js 16 is a significant release focused on:

- **Turbopack as default bundler** (2-5x faster builds)
- **`next lint` command removed** - must migrate to ESLint CLI
- **Middleware renamed to Proxy** (`middleware.ts` → `proxy.ts`)
- **Async Request APIs fully required** (no sync fallback)
- **Cache Components** (new explicit caching model)
- **Image configuration defaults changed**

### Impact Assessment for This Project

| Area                | Impact   | Notes                                                        |
| ------------------- | -------- | ------------------------------------------------------------ |
| `next lint` removal | **HIGH** | Must migrate lint script to ESLint CLI                       |
| Turbopack default   | LOW      | No custom webpack config, should work                        |
| Async APIs          | NONE     | Not using `cookies()`, `headers()`, `params`, `searchParams` |
| Middleware → Proxy  | NONE     | No middleware.ts file exists                                 |
| Image config        | LOW      | May need to add `images.qualities` config                    |
| Node.js version     | NONE     | Already on v24.11.0 (exceeds 20.9.0 minimum)                 |
| React version       | NONE     | Already on React 19.2.4                                      |
| CI/CD               | MEDIUM   | Need to update lint command in CI                            |

---

## Pre-Migration Checklist

### Codebase Analysis

| Check                                            | Status      | Notes                                      |
| ------------------------------------------------ | ----------- | ------------------------------------------ |
| Using `cookies()`, `headers()`, `draftMode()`    | Not used    | No async API migration needed              |
| Using `params` or `searchParams` props           | Not used    | No async prop migration needed             |
| Has `middleware.ts`                              | Not present | No proxy migration needed                  |
| Using `next lint`                                | Yes         | **MUST migrate to ESLint CLI**             |
| Custom webpack config                            | Not present | Turbopack should work seamlessly           |
| Using `experimental.turbopack`                   | Not present | N/A                                        |
| Using `experimental.ppr`                         | Not present | N/A                                        |
| Using `images.qualities`                         | Not present | Add to config (already noted in CLAUDE.md) |
| Has parallel routes                              | Not present | N/A                                        |
| Uses AMP                                         | Not present | N/A                                        |
| Uses `serverRuntimeConfig`/`publicRuntimeConfig` | Not present | N/A                                        |

### Dependencies to Update

| Package            | Current  | Target  | Breaking Changes                  |
| ------------------ | -------- | ------- | --------------------------------- |
| next               | ^15.5.12 | ^16.x   | Major release - see details below |
| react              | ^19.2.4  | ^19.2.x | Already compatible                |
| react-dom          | ^19.2.4  | ^19.2.x | Already compatible                |
| eslint-config-next | ^15.5.12 | ^16.x   | ESLint Flat Config default        |
| @types/react       | ^19.2.14 | ^19.2.x | Keep current                      |
| @types/react-dom   | ^19.2.3  | ^19.2.x | Keep current                      |

### Third-Party Library Compatibility

| Library                           | Version  | React 19 + Next 16 | Notes                         |
| --------------------------------- | -------- | ------------------ | ----------------------------- |
| framer-motion                     | ^12.34.0 | ✅ Compatible      | Already updated for React 19  |
| react-slick                       | ^0.30.3  | ✅ Compatible      | Stable library                |
| react-vertical-timeline-component | ^3.6.0   | ✅ Compatible      | May need `--legacy-peer-deps` |
| @react-email/components           | ^0.0.28  | ✅ Compatible      | Server-side only              |
| react-hot-toast                   | ^2.4.1   | ✅ Compatible      | Stable library                |
| react-icons                       | ^5.5.0   | ✅ Compatible      | Icon library                  |
| react-intersection-observer       | ^10.0.2  | ✅ Compatible      | Lightweight                   |
| resend                            | ^4.0.0   | ✅ Compatible      | Server-side only              |

---

## Breaking Changes Requiring Action

### 1. `next lint` Command Removed (HIGH PRIORITY)

The `next lint` command has been removed in Next.js 16. We must migrate to using ESLint CLI directly.

**Current `package.json` script:**

```json
"lint": "next lint"
```

**New script after migration:**

```json
"lint": "eslint ."
```

**CI/CD Impact:** The GitHub Actions workflow runs `npm run lint` which currently calls `next lint`. After migration, it will use ESLint CLI.

**Action Required:**

1. Update `package.json` lint script
2. Create/update ESLint configuration (ESLint Flat Config recommended)
3. Verify CI passes with new lint command

### 2. Image Configuration Defaults Changed

Several image configuration defaults have changed:

| Setting           | Old Default | New Default | Our Action                 |
| ----------------- | ----------- | ----------- | -------------------------- |
| `minimumCacheTTL` | 60 seconds  | 4 hours     | Keep new default (better)  |
| `imageSizes`      | Includes 16 | Excludes 16 | Keep new default           |
| `qualities`       | All (1-100) | [75] only   | Add [75, 85, 95] to config |

**Action Required:** Add `images.qualities: [75, 85, 95]` to `next.config.js` (already noted as TODO in CLAUDE.md).

### 3. ESLint Flat Config Default

`@next/eslint-plugin-next` now defaults to ESLint Flat Config format. We should migrate to flat config.

**Action Required:**

- Create `eslint.config.mjs` (flat config)
- Remove `.eslintrc.json` if exists
- Update lint script

### 4. Turbopack as Default Bundler

Turbopack is now the default bundler. Since we have no custom webpack configuration, this should work seamlessly with faster builds.

**Action Required:** None - automatic improvement.

---

## Risks & Mitigations

### Low Risk

| Risk                    | Impact                           | Mitigation                                  |
| ----------------------- | -------------------------------- | ------------------------------------------- |
| Turbopack compatibility | Build may behave differently     | Use `--webpack` flag to fall back if issues |
| ESLint config migration | Lint may fail initially          | Test lint locally before CI                 |
| Image quality coercion  | Images may use different quality | Explicitly set `images.qualities` array     |

### Medium Risk

| Risk                  | Impact                             | Mitigation                          |
| --------------------- | ---------------------------------- | ----------------------------------- |
| Third-party peer deps | Install warnings/failures          | Continue using `--legacy-peer-deps` |
| ESLint Flat Config    | Config format completely different | Use codemod or manual migration     |

---

## Prerequisites

### Verified Requirements

- [x] **Node.js:** v24.11.0 (exceeds minimum 20.9.0)
- [x] **TypeScript:** 5.1.5 (meets minimum 5.1.0)
- [x] **React:** 19.2.4 (already compatible with Next.js 16)
- [x] **Git:** Repository clean (verified from git status)

### Manual Requirements (User Action Needed)

- [ ] **Backup:** Ensure all work is committed and pushed to remote
- [ ] **Git branch:** Create a dedicated migration branch
- [ ] **Verify current build:** Run `npm run build` passes before migration

---

## Migration Steps

### Phase 1: Preparation

- [ ] **1.1** Create migration branch

  ```bash
  git checkout main
  git pull origin main
  git checkout -b feature/nextjs-16-migration
  ```

- [ ] **1.2** Verify current working state
  ```bash
  npm run build  # Verify build passes
  npm run lint   # Verify lint passes
  ```

### Phase 2: ESLint Migration (Before Next.js Upgrade)

Since `next lint` is removed in Next.js 16, we need to migrate ESLint first.

- [ ] **2.1** Run Next.js ESLint migration codemod

  ```bash
  npx @next/codemod@canary next-lint-to-eslint-cli .
  ```

- [ ] **2.2** If codemod fails, manually create ESLint Flat Config

  Create `eslint.config.mjs`:

  ```javascript
  import { dirname } from 'path';
  import { fileURLToPath } from 'url';
  import { FlatCompat } from '@eslint/eslintrc';

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  const compat = new FlatCompat({
    baseDirectory: __dirname,
  });

  const eslintConfig = [...compat.extends('next/core-web-vitals')];

  export default eslintConfig;
  ```

- [ ] **2.3** Update `package.json` lint script

  ```json
  "lint": "eslint ."
  ```

- [ ] **2.4** Install ESLint dependencies if needed

  ```bash
  npm install -D @eslint/eslintrc --legacy-peer-deps
  ```

- [ ] **2.5** Test lint command
  ```bash
  npm run lint
  ```

### Phase 3: Update Dependencies

- [ ] **3.1** Run Next.js upgrade codemod (recommended)

  ```bash
  npx @next/codemod@canary upgrade latest
  ```

  This will:
  - Update Next.js to latest version
  - Update related dependencies
  - Apply necessary code transformations

- [ ] **3.2** If codemod fails, update manually

  ```bash
  npm install next@latest --legacy-peer-deps
  npm install eslint-config-next@latest --legacy-peer-deps
  ```

- [ ] **3.3** Verify peer dependencies
  ```bash
  npm ls 2>&1 | grep -i "peer dep" || echo "No peer dependency issues"
  ```

### Phase 4: Configuration Updates

- [ ] **4.1** Update `next.config.js` with image qualities

  ```javascript
  /** @type {import('next').NextConfig} */
  const nextConfig = {
    images: {
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'images.unsplash.com',
        },
      ],
      qualities: [75, 85, 95],
    },
  };

  module.exports = nextConfig;
  ```

- [ ] **4.2** Remove any deprecated experimental flags (none exist currently)

- [ ] **4.3** Consider enabling Turbopack file system caching (optional - beta)
  ```javascript
  experimental: {
    turbopackFileSystemCacheForDev: true,
  },
  ```

### Phase 5: Build & Test

- [ ] **5.1** Clear build cache

  ```bash
  rm -rf .next
  rm -rf node_modules/.cache
  ```

- [ ] **5.2** Install fresh dependencies

  ```bash
  rm -rf node_modules
  rm package-lock.json
  npm install --legacy-peer-deps
  ```

- [ ] **5.3** Run linter

  ```bash
  npm run lint
  ```

- [ ] **5.4** Run build

  ```bash
  npm run build
  ```

- [ ] **5.5** Start development server and test
  ```bash
  npm run dev
  ```

### Phase 6: Manual Testing

- [ ] **6.1** Test all pages load correctly
  - Home page with all sections
  - Scroll navigation works
  - Dark/light mode toggle works

- [ ] **6.2** Test animations (Framer Motion)
  - Intro section animations
  - Section fade-in animations
  - Project card hover effects
  - Experience timeline animations

- [ ] **6.3** Test interactive features
  - Navigation active state tracking
  - Contact form submission (if RESEND_API_KEY is set)
  - Theme persistence across page reloads

- [ ] **6.4** Test responsive design
  - Mobile view
  - Tablet view
  - Desktop view

- [ ] **6.5** Test external links
  - LinkedIn link opens in new tab
  - GitHub link opens in new tab
  - Project live demo links work

### Phase 7: CI/CD Verification

- [ ] **7.1** The CI should already work since we updated the lint script
  - `npm run lint` now uses ESLint CLI
  - `npm run build` uses Turbopack by default

- [ ] **7.2** Consider updating Node.js version in CI (optional)
  - Currently using Node 20, which meets minimum requirement
  - Could upgrade to Node 22 or 24 for better performance

### Phase 8: Commit & Deploy

- [ ] **8.1** Commit changes

  ```bash
  git add .
  git commit -m "Migrate to Next.js 16

  - Update Next.js to v16.x with Turbopack as default bundler
  - Migrate from 'next lint' to ESLint CLI (next lint removed in v16)
  - Add ESLint Flat Config (eslint.config.mjs)
  - Add images.qualities config [75, 85, 95]
  - Update eslint-config-next to v16.x

  Breaking changes addressed:
  - next lint command removal → ESLint CLI migration
  - Image qualities default change → Explicit config

  No changes needed for:
  - Async Request APIs (not used)
  - middleware.ts → proxy.ts (no middleware)
  - Parallel routes (not used)

  Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
  ```

- [ ] **8.2** Push and create PR

  ```bash
  git push -u origin feature/nextjs-16-migration
  gh pr create --title "Migrate to Next.js 16" --body "..."
  ```

- [ ] **8.3** Wait for CI/CD to pass
  - Lint check
  - Build check
  - Lighthouse audit

- [ ] **8.4** Merge PR to main

---

## Post-Migration Checks

### Functionality Checks

| Check               | Expected Result               | Status |
| ------------------- | ----------------------------- | ------ |
| Home page loads     | All sections visible          | [ ]    |
| Navigation works    | Smooth scroll to sections     | [ ]    |
| Dark mode toggle    | Theme switches correctly      | [ ]    |
| Animations work     | Framer Motion animations play | [ ]    |
| Contact form        | Form submits (if API key set) | [ ]    |
| External links      | Open in new tabs              | [ ]    |
| Resume download     | PDF downloads correctly       | [ ]    |
| Mobile responsive   | Layout adapts correctly       | [ ]    |
| Companies slider    | Carousel works                | [ ]    |
| Experience timeline | Timeline renders correctly    | [ ]    |

### Performance Checks

| Metric                    | Target                      | Status |
| ------------------------- | --------------------------- | ------ |
| Lighthouse Performance    | 90+                         | [ ]    |
| Lighthouse Accessibility  | 90+                         | [ ]    |
| Lighthouse Best Practices | 90+                         | [ ]    |
| Lighthouse SEO            | 90+                         | [ ]    |
| Build time                | Faster than v15 (Turbopack) | [ ]    |
| Dev server startup        | Faster than v15 (Turbopack) | [ ]    |

### CI/CD Checks

| Check                           | Status |
| ------------------------------- | ------ |
| GitHub Actions lint job passes  | [ ]    |
| GitHub Actions build job passes | [ ]    |
| Lighthouse CI passes            | [ ]    |
| Vercel preview deployment works | [ ]    |

---

## Rollback Plan

If critical issues are found after migration:

1. **Revert the PR** (if not merged)

   ```bash
   git checkout main
   git branch -D feature/nextjs-16-migration
   ```

2. **Revert the merge** (if merged)

   ```bash
   git revert <merge-commit-hash>
   git push origin main
   ```

3. **Pin to previous versions** in `package.json`:

   ```json
   {
     "next": "^15.5.12",
     "eslint-config-next": "^15.5.12"
   }
   ```

4. **Restore original lint script**:
   ```json
   {
     "scripts": {
       "lint": "next lint"
     }
   }
   ```

---

## Known Issues & Workarounds

### Issue: Third-party library peer dependency warnings

**Workaround:** Continue using `--legacy-peer-deps` flag

```bash
npm install --legacy-peer-deps
```

### Issue: ESLint Flat Config migration fails

**Workaround:** Keep using `.eslintrc.json` with compatibility layer

```bash
npm install -D @eslint/eslintrc
```

### Issue: Turbopack build issues

**Workaround:** Use Webpack fallback

```bash
npm run build -- --webpack
# Or update package.json:
"build": "next build --webpack"
```

### Issue: Framer Motion scroll container warning

**Status:** Benign warning, can be ignored (noted in previous migration)

---

## New Features Available (Optional)

After migration, these Next.js 16 features become available:

### Cache Components (Optional)

```javascript
// next.config.js
const nextConfig = {
  cacheComponents: true,
};
```

### React Compiler (Optional)

```javascript
// next.config.js
const nextConfig = {
  reactCompiler: true,
};
```

Requires: `npm install -D babel-plugin-react-compiler`

### Turbopack File System Caching (Beta)

```javascript
// next.config.js
const nextConfig = {
  experimental: {
    turbopackFileSystemCacheForDev: true,
  },
};
```

---

## Additional Resources

- [Next.js 16 Release Notes](https://nextjs.org/blog/next-16)
- [Next.js 16 Upgrade Guide](https://nextjs.org/docs/app/guides/upgrading/version-16)
- [Next.js 16.1 Release Notes](https://nextjs.org/blog/next-16-1)
- [ESLint Flat Config Migration Guide](https://eslint.org/docs/latest/use/configure/migration-guide)
- [Next.js Codemods Documentation](https://nextjs.org/docs/app/guides/upgrading/codemods)

---

## Summary

This migration is **relatively straightforward** for this portfolio project because:

1. **No async API usage** - No `cookies()`, `headers()`, `params`, or `searchParams`
2. **No middleware** - No `middleware.ts` to rename to `proxy.ts`
3. **No custom webpack config** - Turbopack works out of the box
4. **Already on React 19** - No React upgrade needed
5. **Already on Node.js 24** - Exceeds minimum requirement

The main work involves:

1. **ESLint migration** - Moving from `next lint` to ESLint CLI
2. **Image config** - Adding `images.qualities` array
3. **Testing** - Verifying everything works with Turbopack

Expected benefits:

- **2-5x faster builds** with Turbopack
- **Up to 10x faster Fast Refresh** in development
- **Better caching** with new image defaults
- **Modern ESLint setup** with Flat Config
