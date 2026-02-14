# Next.js 15 Migration Plan

**Current Version:** Next.js 14.2.0
**Target Version:** Next.js 15.x (latest stable)
**React Version Change:** React 18.3.0 → React 19.x

**References:**
- [Next.js Version 15 Upgrade Guide](https://nextjs.org/docs/app/guides/upgrading/version-15)
- [React 19 Upgrade Guide](https://react.dev/blog/2024/04/25/react-19-upgrade-guide)

---

## Pre-Migration Checklist

### Codebase Analysis

| Check | Status | Notes |
|-------|--------|-------|
| Using `cookies()`, `headers()`, `draftMode()` | Not used | No async API migration needed |
| Using `useFormState` | Not used | No migration to `useActionState` needed |
| Using `@next/font` | Not used | Already using `next/font/google` |
| Using `experimental-edge` runtime | Not used | No runtime config changes needed |
| Using `geo` or `ip` on NextRequest | Not used | No middleware changes needed |
| Using Speed Insights auto-instrumentation | Not used | No changes needed |
| Has Server Actions | Yes | `actions/sendEmail.ts` - should work as-is |
| Has Route Handlers | No | No API routes to update |
| Using fetch caching | No | Static site, no fetch caching concerns |

### Dependencies to Update

| Package | Current | Target | Breaking Changes |
|---------|---------|--------|------------------|
| next | ^14.2.0 | ^15.x | Caching defaults changed |
| react | ^18.3.0 | ^19.x | useFormState deprecated |
| react-dom | ^18.3.0 | ^19.x | - |
| @types/react | ^18.3.0 | ^19.x | Type updates |
| @types/react-dom | ^18.3.0 | ^19.x | Type updates |
| eslint-config-next | ^14.2.0 | ^15.x | - |

### Third-Party Library Compatibility

| Library | Version | React 19 Compatible | Notes |
|---------|---------|---------------------|-------|
| framer-motion | ^10.12.17 | Check | May need update |
| react-hot-toast | ^2.4.1 | Check | Should be compatible |
| react-icons | ^4.10.1 | Check | Should be compatible |
| react-intersection-observer | ^9.5.2 | Check | Should be compatible |
| react-slick | ^0.30.3 | Check | May need update |
| react-vertical-timeline-component | ^3.6.0 | Check | May need update |
| resend | ^4.0.0 | Check | Should be compatible |
| @react-email/components | ^0.0.28 | Check | Should be compatible |

---

## Risks & Mitigations

### High Risk

| Risk | Impact | Mitigation |
|------|--------|------------|
| Third-party libraries not React 19 compatible | Build failures, runtime errors | Test each library, check GitHub issues, have fallback versions ready |
| Framer Motion compatibility | Animations may break | Test thoroughly, check framer-motion React 19 support |

### Medium Risk

| Risk | Impact | Mitigation |
|------|--------|------------|
| Caching behavior changes | Different page behavior | Review fetch usage, explicitly set cache options if needed |
| Type errors with new React types | Build failures | Update @types packages, fix any type issues |

### Low Risk

| Risk | Impact | Mitigation |
|------|--------|------------|
| ESLint config changes | Lint warnings/errors | Update eslint-config-next alongside Next.js |
| Node.js version requirements | CI/CD failures | Ensure Node.js 18.17+ is used |

---

## Prerequisites

### Manual Requirements (User Action Needed)

- [ ] **Backup:** Ensure all work is committed and pushed to remote
- [ ] **Git branch:** Create a dedicated migration branch
- [ ] **Node.js:** Verify Node.js version is 18.17.0 or higher
  ```bash
  node --version  # Should be >= 18.17.0
  ```
- [ ] **Review third-party library changelogs:** Check for React 19 compatibility announcements

### Environment Requirements

- Node.js >= 18.17.0
- npm >= 9.x or equivalent package manager
- Git for version control

---

## Migration Steps (TODO Format)

### Phase 1: Preparation

- [ ] **1.1** Create migration branch
  ```bash
  git checkout main
  git pull origin main
  git checkout -b feature/nextjs-15-migration
  ```

- [ ] **1.2** Document current working state
  ```bash
  npm run build  # Verify build passes
  npm run lint   # Verify lint passes
  ```

- [ ] **1.3** Check Node.js version
  ```bash
  node --version
  ```

### Phase 2: Update Dependencies

- [ ] **2.1** Run Next.js upgrade codemod (recommended approach)
  ```bash
  npx @next/codemod@canary upgrade latest
  ```
  This will:
  - Update Next.js to latest version
  - Update React and React DOM to v19
  - Apply necessary code transformations

- [ ] **2.2** If codemod fails, update manually
  ```bash
  npm install next@latest react@latest react-dom@latest
  npm install -D @types/react@latest @types/react-dom@latest
  npm install eslint-config-next@latest
  ```

- [ ] **2.3** Update remaining dependencies for React 19 compatibility
  ```bash
  npm update framer-motion
  npm update react-hot-toast
  npm update react-slick
  ```

- [ ] **2.4** Check for peer dependency warnings
  ```bash
  npm ls
  ```

### Phase 3: Code Updates

- [ ] **3.1** Review and update `next.config.js` if needed
  - Check for any `experimental` flags that are now stable
  - No changes expected for this project

- [ ] **3.2** Verify font configuration
  - Already using `next/font/google` (correct)
  - No changes needed

- [ ] **3.3** Review Server Actions (`actions/sendEmail.ts`)
  - Server Actions should work as-is
  - Test email functionality after upgrade

- [ ] **3.4** Check for any `useFormState` usage (replace with `useActionState`)
  - Not used in this project

- [ ] **3.5** Review caching behavior if any fetch calls exist
  - Static site, no explicit fetch calls to external APIs in components
  - No changes needed

### Phase 4: Build & Test

- [ ] **4.1** Clear build cache
  ```bash
  rm -rf .next
  rm -rf node_modules/.cache
  ```

- [ ] **4.2** Install fresh dependencies
  ```bash
  rm -rf node_modules
  npm install
  ```

- [ ] **4.3** Run linter
  ```bash
  npm run lint
  ```
  Fix any new lint errors

- [ ] **4.4** Run build
  ```bash
  npm run build
  ```
  Fix any build errors

- [ ] **4.5** Start development server and test
  ```bash
  npm run dev
  ```

### Phase 5: Manual Testing

- [ ] **5.1** Test all pages load correctly
  - Home page with all sections
  - Scroll navigation works
  - Dark/light mode toggle works

- [ ] **5.2** Test animations
  - Intro section animations
  - Section fade-in animations
  - Project card hover effects
  - Experience timeline animations

- [ ] **5.3** Test interactive features
  - Navigation active state tracking
  - Contact form submission (if RESEND_API_KEY is set)
  - Theme persistence across page reloads

- [ ] **5.4** Test responsive design
  - Mobile view
  - Tablet view
  - Desktop view

- [ ] **5.5** Test external links
  - LinkedIn link opens in new tab
  - GitHub link opens in new tab
  - Project live demo links work

### Phase 6: Commit & Deploy

- [ ] **6.1** Commit changes
  ```bash
  git add .
  git commit -m "Migrate to Next.js 15 and React 19"
  ```

- [ ] **6.2** Push and create PR
  ```bash
  git push -u origin feature/nextjs-15-migration
  gh pr create --title "Migrate to Next.js 15" --body "..."
  ```

- [ ] **6.3** Wait for CI/CD to pass
  - Lint check
  - Build check
  - Lighthouse audit

- [ ] **6.4** Deploy to staging/preview (Vercel preview deployment)

- [ ] **6.5** Final verification on preview deployment

- [ ] **6.6** Merge PR to main

---

## Post-Migration Checks

### Functionality Checks

| Check | Expected Result | Status |
|-------|-----------------|--------|
| Home page loads | All sections visible | [ ] |
| Navigation works | Smooth scroll to sections | [ ] |
| Dark mode toggle | Theme switches correctly | [ ] |
| Animations work | Framer Motion animations play | [ ] |
| Contact form | Form submits (if API key set) | [ ] |
| External links | Open in new tabs with rel attributes | [ ] |
| Resume download | PDF downloads correctly | [ ] |
| Mobile responsive | Layout adapts correctly | [ ] |
| Companies slider | Carousel works | [ ] |
| Experience timeline | Timeline renders correctly | [ ] |

### Performance Checks

| Metric | Target | Status |
|--------|--------|--------|
| Lighthouse Performance | 90+ | [ ] |
| Lighthouse Accessibility | 90+ | [ ] |
| Lighthouse Best Practices | 90+ | [ ] |
| Lighthouse SEO | 90+ | [ ] |
| Build time | Similar to v14 | [ ] |
| Bundle size | Similar or smaller | [ ] |

### CI/CD Checks

| Check | Status |
|-------|--------|
| GitHub Actions lint job passes | [ ] |
| GitHub Actions build job passes | [ ] |
| Lighthouse CI passes | [ ] |
| Vercel preview deployment works | [ ] |

---

## Rollback Plan

If critical issues are found after migration:

1. **Revert the PR** (if not merged)
   ```bash
   git checkout main
   git branch -D feature/nextjs-15-migration
   ```

2. **Revert the merge** (if merged)
   ```bash
   git revert <merge-commit-hash>
   git push origin main
   ```

3. **Pin to previous versions** in `package.json`:
   ```json
   {
     "next": "^14.2.0",
     "react": "^18.3.0",
     "react-dom": "^18.3.0"
   }
   ```

---

## Known Issues & Workarounds

### Issue: Third-party library not compatible with React 19

**Workaround:** Use `--legacy-peer-deps` flag temporarily
```bash
npm install --legacy-peer-deps
```

### Issue: Type errors with new React types

**Workaround:** Check if `@types/react` needs specific version
```bash
npm install -D @types/react@19 @types/react-dom@19
```

### Issue: Framer Motion compatibility

**Workaround:** Check framer-motion GitHub for React 19 support, update to latest version
```bash
npm install framer-motion@latest
```

---

## Additional Resources

- [Next.js 15 Release Notes](https://nextjs.org/blog/next-15)
- [React 19 Release Notes](https://react.dev/blog/2024/12/05/react-19)
- [Next.js Codemods Documentation](https://nextjs.org/docs/app/guides/upgrading/codemods)
- [Vercel Deployment Documentation](https://vercel.com/docs)

---

## Estimated Effort

| Phase | Estimated Time |
|-------|----------------|
| Preparation | 15 mins |
| Update Dependencies | 15-30 mins |
| Code Updates | 15 mins (minimal for this project) |
| Build & Test | 30 mins |
| Manual Testing | 30-45 mins |
| Commit & Deploy | 15 mins |
| **Total** | **2-2.5 hours** |

*Note: Time estimates assume no major compatibility issues. If third-party libraries have issues, additional time may be needed.*
