# Tailwind CSS v4 Migration Plan

**Current Version:** Tailwind CSS 3.3.2
**Target Version:** Tailwind CSS 4.x (latest stable)
**Next.js Version:** 16.1.6 (already migrated)
**Node.js Version:** v24.11.0

**References:**

- [Tailwind CSS v4 Upgrade Guide](https://tailwindcss.com/docs/upgrade-guide)
- [Tailwind CSS v4 Announcement](https://tailwindcss.com/blog/tailwindcss-v4)
- [React Email Tailwind v4 Support](https://github.com/resend/react-email/discussions/1878)

---

## Executive Summary

Tailwind CSS v4 is a major release with significant architectural changes:

- **CSS-first configuration** - Theme defined in CSS using `@theme` instead of `tailwind.config.js`
- **New import syntax** - `@import "tailwindcss"` replaces `@tailwind` directives
- **PostCSS plugin change** - `@tailwindcss/postcss` replaces `tailwindcss` plugin
- **Renamed utilities** - Several utilities renamed for consistency
- **Important modifier syntax change** - `!` moves from prefix to suffix

### Impact Assessment for This Project

| Area | Impact | Notes |
|------|--------|-------|
| Import syntax | **HIGH** | Must change `@tailwind` to `@import "tailwindcss"` |
| PostCSS config | **HIGH** | Must switch to `@tailwindcss/postcss` |
| Config migration | **MEDIUM** | Move `tailwind.config.js` to CSS `@theme` |
| Renamed utilities | **MEDIUM** | 19 instances across 8 files need updating |
| `@react-email/tailwind` | **LOW** | React Email 5.0+ supports Tailwind v4 |
| Browser support | **LOW** | Requires Safari 16.4+, Chrome 111+, Firefox 128+ |

---

## Pre-Migration Checklist

### Codebase Analysis

| Check | Status | Notes |
|-------|--------|-------|
| Uses `@tailwind` directives | Yes | In `app/globals.css` |
| Has `tailwind.config.js` | Yes | Custom gradients, dark mode config |
| Has `postcss.config.js` | Yes | Uses `tailwindcss` and `autoprefixer` |
| Uses `@react-email/tailwind` | Yes | v0.0.15 - needs update |
| Uses deprecated utilities | Yes | 19 instances (see breakdown below) |
| Uses custom `@apply` | Yes | `.borderBlack` class |
| Uses custom `@layer` | No | N/A |

### Deprecated Utilities Found

| Utility | Replacement | Count | Files |
|---------|-------------|-------|-------|
| `rounded-sm` | `rounded-xs` | 1 | companies-slider.tsx |
| `outline-none` | `outline-hidden` | 5 | intro.tsx, contact.tsx, submit-btn.tsx |
| `!` prefix (important) | `!` suffix | 2 | layout.tsx, intro.tsx |
| `*-opacity-*` utilities | Color opacity syntax | 11 | Multiple files |

### Detailed Utility Findings

#### `rounded-sm` → `rounded-xs`

| File | Line | Current |
|------|------|---------|
| `components/companies-slider.tsx` | 82 | `rounded-sm h-24 w-32` |

#### `outline-none` → `outline-hidden`

| File | Line | Context |
|------|------|---------|
| `components/intro.tsx` | 83 | Button styling |
| `components/intro.tsx` | 95 | Button styling |
| `components/contact.tsx` | 61 | Input field |
| `components/contact.tsx` | 69 | Textarea |
| `components/submit-btn.tsx` | 11 | Submit button |

#### Important Modifier `!` Prefix → Suffix

| File | Line | Current | New |
|------|------|---------|-----|
| `app/layout.tsx` | 70 | `!scroll-smooth` | `scroll-smooth!` |
| `components/intro.tsx` | 61 | `!leading-[1.5]` | `leading-[1.5]!` |

#### Opacity Utilities → Color Opacity Syntax

| File | Line | Current | New |
|------|------|---------|-----|
| `components/header.tsx` | 17 | `border-white border-opacity-40` | `border-white/40` |
| `components/header.tsx` | 17 | `bg-white bg-opacity-80` | `bg-white/80` |
| `components/header.tsx` | 17 | `dark:bg-gray-950 dark:bg-opacity-75` | `dark:bg-gray-950/75` |
| `components/theme-switch.tsx` | 12 | `bg-yellow-400 bg-opacity-80` | `bg-yellow-400/80` |
| `components/theme-switch.tsx` | 12 | `border-yellow-400 border-opacity-40` | `border-yellow-400/40` |
| `components/contact.tsx` | 61 | `dark:bg-white dark:bg-opacity-80` | `dark:bg-white/80` |
| `components/contact.tsx` | 61 | `dark:focus:bg-opacity-100` | `dark:focus:bg-white/100` |
| `components/contact.tsx` | 69 | `dark:bg-white dark:bg-opacity-80` | `dark:bg-white/80` |
| `components/contact.tsx` | 69 | `dark:focus:bg-opacity-100` | `dark:focus:bg-white/100` |
| `components/submit-btn.tsx` | 11 | `dark:bg-white dark:bg-opacity-10` | `dark:bg-white/10` |
| `components/submit-btn.tsx` | 11 | `disabled:bg-opacity-65` | `disabled:bg-gray-900/65` |
| `components/section-divider.tsx` | 9 | `dark:bg-opacity-20` | `dark:bg-gray-200/20` |
| `app/layout.tsx` | 110 | `dark:text-opacity-90` | `dark:text-gray-50/90` |

### Dependencies to Update

| Package | Current | Target | Notes |
|---------|---------|--------|-------|
| tailwindcss | 3.3.2 | 4.x | Major version upgrade |
| @tailwindcss/postcss | N/A | 4.x | New package (replaces tailwindcss PostCSS) |
| autoprefixer | 10.4.14 | Remove | Handled by @tailwindcss/postcss |
| postcss | 8.4.24 | Keep | Still required |
| @react-email/tailwind | 0.0.15 | 1.x | Tailwind v4 support |
| @react-email/components | 1.0.7 | Latest | May need update for v4 |

---

## Breaking Changes Requiring Action

### 1. Import Syntax Change (HIGH PRIORITY)

**Current (`app/globals.css`):**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**New:**
```css
@import "tailwindcss";
```

### 2. PostCSS Plugin Change (HIGH PRIORITY)

**Current (`postcss.config.js`):**
```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

**New (`postcss.config.mjs`):**
```javascript
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

Notes:
- `tailwindcss` package is no longer a PostCSS plugin
- `autoprefixer` is now included automatically
- File should be renamed to `.mjs` for ES modules

### 3. Configuration Migration (MEDIUM PRIORITY)

**Current (`tailwind.config.js`):**
```javascript
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
  darkMode: 'class',
};
```

**New (in `app/globals.css`):**
```css
@import "tailwindcss";

/* Content paths auto-detected in v4 for standard project structures */

/* Dark mode: class-based (default in v4 is media-based) */
@variant dark (&:where(.dark, .dark *));

/* Custom theme extensions */
@theme {
  --background-image-gradient-radial: radial-gradient(var(--tw-gradient-stops));
  --background-image-gradient-conic: conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops));
}
```

### 4. Custom Utilities Migration

**Current:**
```css
.borderBlack {
  @apply border border-black/10;
}
```

**New (using `@utility`):**
```css
@utility borderBlack {
  border-width: 1px;
  border-color: rgb(0 0 0 / 0.1);
}
```

Note: `@apply` still works in v4, but `@utility` is the recommended approach for custom utilities.

### 5. Renamed Utilities (MEDIUM PRIORITY)

All instances must be updated manually or via automated upgrade tool.

### 6. Browser Requirements

Tailwind v4 requires modern browsers:
- Safari 16.4+ (released March 2023)
- Chrome 111+ (released March 2023)
- Firefox 128+ (released July 2024)

**Assessment:** This portfolio site targets modern browsers, so this should not be an issue.

---

## Risks & Mitigations

### Low Risk

| Risk | Impact | Mitigation |
|------|--------|------------|
| Browser compatibility | Older Safari/Chrome may break | Site targets modern browsers |
| Custom gradient utilities | May need syntax adjustment | Test thoroughly after migration |

### Medium Risk

| Risk | Impact | Mitigation |
|------|--------|------------|
| `@react-email/tailwind` compatibility | Email templates may break | Update to v1.x with Tailwind v4 support |
| Opacity utility migration | May miss some instances | Use automated upgrade tool |
| Dark mode behavior | May change from class to media | Explicitly configure with `@variant` |

### High Risk

| Risk | Impact | Mitigation |
|------|--------|------------|
| Automated upgrade tool failures | Manual migration needed | Have rollback plan ready |
| Third-party library conflicts | Build failures | Use `--legacy-peer-deps` |

---

## Prerequisites

### Verified Requirements

- [x] **Node.js:** v24.11.0 (exceeds requirements)
- [x] **Next.js:** 16.1.6 (latest, compatible)
- [x] **React:** 19.2.4 (latest, compatible)
- [x] **Git:** Feature branch created (`feature/tailwind-v4-migration`)

### Manual Requirements (User Action Needed)

- [ ] **Verify current build:** Run `npm run build` passes before migration
- [ ] **Verify current lint:** Run `npm run lint` passes before migration

---

## Migration Steps

### Phase 1: Preparation

- [ ] **1.1** Verify current working state
  ```bash
  npm run build  # Verify build passes
  npm run lint   # Verify lint passes
  ```

- [ ] **1.2** Document current Tailwind version
  ```bash
  npm ls tailwindcss
  # Expected: tailwindcss@3.3.2
  ```

### Phase 2: Run Automated Upgrade Tool

Tailwind provides an automated upgrade tool that handles most migrations.

- [ ] **2.1** Run the upgrade tool
  ```bash
  npx @tailwindcss/upgrade
  ```

  This tool will:
  - Update `tailwindcss` to v4
  - Install `@tailwindcss/postcss`
  - Migrate `tailwind.config.js` to CSS `@theme` blocks
  - Update `postcss.config.js` to use new plugin
  - Replace `@tailwind` directives with `@import "tailwindcss"`
  - Rename deprecated utilities in source files

- [ ] **2.2** Review changes made by upgrade tool
  ```bash
  git diff
  ```

- [ ] **2.3** If upgrade tool fails, proceed with manual migration (Phase 3)

### Phase 3: Manual Migration (If Needed)

Only proceed with this phase if the automated upgrade tool fails.

- [ ] **3.1** Update dependencies
  ```bash
  npm uninstall tailwindcss autoprefixer
  npm install tailwindcss@latest @tailwindcss/postcss --legacy-peer-deps
  ```

- [ ] **3.2** Update `postcss.config.js` → `postcss.config.mjs`
  ```bash
  rm postcss.config.js
  ```

  Create `postcss.config.mjs`:
  ```javascript
  export default {
    plugins: {
      "@tailwindcss/postcss": {},
    },
  };
  ```

- [ ] **3.3** Update `app/globals.css`

  Replace:
  ```css
  @tailwind base;
  @tailwind components;
  @tailwind utilities;
  ```

  With:
  ```css
  @import "tailwindcss";

  /* Dark mode: class-based */
  @variant dark (&:where(.dark, .dark *));

  /* Custom gradients */
  @theme {
    --background-image-gradient-radial: radial-gradient(var(--tw-gradient-stops));
    --background-image-gradient-conic: conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops));
  }
  ```

- [ ] **3.4** Remove `tailwind.config.js` (config now in CSS)
  ```bash
  rm tailwind.config.js
  ```

- [ ] **3.5** Update deprecated utilities in components

  **File: `components/companies-slider.tsx`**
  - Line 82: `rounded-sm` → `rounded-xs`

  **File: `components/intro.tsx`**
  - Line 61: `!leading-[1.5]` → `leading-[1.5]!`
  - Line 83: `outline-none` → `outline-hidden`
  - Line 95: `outline-none` → `outline-hidden`

  **File: `components/contact.tsx`**
  - Line 61: `outline-none` → `outline-hidden`
  - Line 61: `dark:bg-white dark:bg-opacity-80` → `dark:bg-white/80`
  - Line 61: `dark:focus:bg-opacity-100` → `dark:focus:bg-white`
  - Line 69: `outline-none` → `outline-hidden`
  - Line 69: `dark:bg-white dark:bg-opacity-80` → `dark:bg-white/80`
  - Line 69: `dark:focus:bg-opacity-100` → `dark:focus:bg-white`

  **File: `components/submit-btn.tsx`**
  - Line 11: `outline-none` → `outline-hidden`
  - Line 11: `dark:bg-white dark:bg-opacity-10` → `dark:bg-white/10`
  - Line 11: `disabled:bg-opacity-65` → `disabled:bg-gray-900/65`

  **File: `components/header.tsx`**
  - Line 17: `border-white border-opacity-40` → `border-white/40`
  - Line 17: `bg-white bg-opacity-80` → `bg-white/80`
  - Line 17: `dark:bg-gray-950 dark:bg-opacity-75` → `dark:bg-gray-950/75`

  **File: `components/theme-switch.tsx`**
  - Line 12: `bg-yellow-400 bg-opacity-80` → `bg-yellow-400/80`
  - Line 12: `border-yellow-400 border-opacity-40` → `border-yellow-400/40`

  **File: `components/section-divider.tsx`**
  - Line 9: `dark:bg-opacity-20` → Combine with base color

  **File: `app/layout.tsx`**
  - Line 70: `!scroll-smooth` → `scroll-smooth!`
  - Line 110: `dark:text-opacity-90` → Combine with base color

- [ ] **3.6** Update custom utility

  In `app/globals.css`, update:
  ```css
  .borderBlack {
    @apply border border-black/10;
  }
  ```

  To:
  ```css
  @utility borderBlack {
    border-width: 1px;
    border-color: rgb(0 0 0 / 0.1);
  }
  ```

  Or keep `@apply` (still supported in v4).

### Phase 4: Update React Email Dependencies

- [ ] **4.1** Update `@react-email/tailwind` for v4 support
  ```bash
  npm install @react-email/tailwind@latest @react-email/components@latest --legacy-peer-deps
  ```

- [ ] **4.2** Verify email template still works
  - Check `email/contact-form-email.tsx`
  - Test email sending if RESEND_API_KEY is configured

### Phase 5: Build & Test

- [ ] **5.1** Clear build cache
  ```bash
  rm -rf .next
  rm -rf node_modules/.cache
  ```

- [ ] **5.2** Fresh install
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

- [ ] **5.5** Start development server
  ```bash
  npm run dev
  ```

### Phase 6: Visual Regression Testing

- [ ] **6.1** Test all sections
  - [ ] Intro/Hero section
  - [ ] About section
  - [ ] Projects section
  - [ ] Skills section
  - [ ] Experience timeline
  - [ ] Contact form
  - [ ] Footer

- [ ] **6.2** Test dark mode
  - [ ] Toggle switch works
  - [ ] All sections render correctly in dark mode
  - [ ] Theme persists on reload

- [ ] **6.3** Test responsive design
  - [ ] Mobile (< 640px)
  - [ ] Tablet (640px - 1024px)
  - [ ] Desktop (> 1024px)

- [ ] **6.4** Test animations
  - [ ] Framer Motion animations work
  - [ ] Scroll-triggered animations work
  - [ ] Hover effects work

- [ ] **6.5** Test interactive elements
  - [ ] Navigation links
  - [ ] External links (LinkedIn, GitHub)
  - [ ] Contact form submission
  - [ ] Resume download

### Phase 7: CI/CD Verification

- [ ] **7.1** Push changes and verify CI passes
  ```bash
  git push -u origin feature/tailwind-v4-migration
  ```

- [ ] **7.2** Verify all CI checks
  - [ ] Lint job passes
  - [ ] Build job passes
  - [ ] Lighthouse audit passes

### Phase 8: Commit & Deploy

- [ ] **8.1** Commit changes
  ```bash
  git add .
  git commit -m "Migrate to Tailwind CSS v4

  - Update tailwindcss from v3.3.2 to v4.x
  - Replace @tailwind directives with @import \"tailwindcss\"
  - Migrate tailwind.config.js to CSS @theme configuration
  - Update postcss.config.js to use @tailwindcss/postcss
  - Remove autoprefixer (now included in @tailwindcss/postcss)
  - Update @react-email/tailwind for v4 compatibility

  Utility migrations:
  - rounded-sm → rounded-xs (1 instance)
  - outline-none → outline-hidden (5 instances)
  - !prefix → suffix! for important (2 instances)
  - *-opacity-* → color/opacity syntax (11 instances)

  Breaking changes addressed:
  - CSS-first configuration adopted
  - Dark mode explicitly configured with @variant
  - All deprecated utilities updated

  Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
  ```

- [ ] **8.2** Create PR
  ```bash
  gh pr create --title "Migrate to Tailwind CSS v4" --body "..."
  ```

- [ ] **8.3** Wait for CI to pass and merge

---

## Post-Migration Checks

### Functionality Checks

| Check | Expected Result | Status |
|-------|-----------------|--------|
| Home page loads | All sections visible | [ ] |
| Dark mode toggle | Theme switches correctly | [ ] |
| Navigation | Smooth scroll works | [ ] |
| Animations | All Framer Motion animations work | [ ] |
| Contact form | Form submits correctly | [ ] |
| Responsive design | Layouts adapt correctly | [ ] |
| Companies slider | Carousel works | [ ] |
| Experience timeline | Renders correctly | [ ] |

### Visual Checks

| Element | Light Mode | Dark Mode |
|---------|------------|-----------|
| Header background | Semi-transparent white | Semi-transparent dark | [ ] |
| Buttons | Correct opacity | Correct opacity | [ ] |
| Input fields | Correct styling | White with opacity | [ ] |
| Section divider | Gray | Gray with reduced opacity | [ ] |
| Theme toggle | Yellow with opacity | Correct styling | [ ] |

### Performance Checks

| Metric | Target | Status |
|--------|--------|--------|
| Lighthouse Performance | 90+ | [ ] |
| Lighthouse Accessibility | 90+ | [ ] |
| Build succeeds | No errors | [ ] |
| CSS bundle size | Similar or smaller | [ ] |

---

## Rollback Plan

If critical issues are found after migration:

1. **Revert the PR** (if not merged)
   ```bash
   git checkout main
   git branch -D feature/tailwind-v4-migration
   ```

2. **Revert the merge** (if merged)
   ```bash
   git revert <merge-commit-hash>
   git push origin main
   ```

3. **Restore previous versions** in `package.json`:
   ```json
   {
     "tailwindcss": "3.3.2",
     "autoprefixer": "10.4.14",
     "@react-email/tailwind": "^0.0.15"
   }
   ```

4. **Restore configuration files:**
   - Restore `tailwind.config.js` from git
   - Restore `postcss.config.js` from git
   - Restore `app/globals.css` from git

---

## Known Issues & Workarounds

### Issue: `@tailwindcss/upgrade` tool fails

**Workaround:** Use manual migration steps (Phase 3)

### Issue: Peer dependency warnings

**Workaround:** Use `--legacy-peer-deps` flag
```bash
npm install --legacy-peer-deps
```

### Issue: Dark mode not working after migration

**Workaround:** Ensure `@variant dark` is correctly configured:
```css
@variant dark (&:where(.dark, .dark *));
```

### Issue: Custom gradients not working

**Workaround:** May need to adjust CSS variable syntax for v4:
```css
@theme {
  --background-image-gradient-radial: radial-gradient(var(--color-*));
}
```

### Issue: `@react-email/tailwind` compatibility

**Workaround:** React Email maintains JS-based config internally. Email templates should work, but test thoroughly.

---

## New Features Available (Optional)

After migration, these Tailwind v4 features become available:

### Native CSS Variables

All design tokens are now CSS custom properties:
```css
.my-class {
  color: var(--color-blue-500);
}
```

### Container Queries

Built-in support for container queries:
```html
<div class="@container">
  <div class="@lg:flex">...</div>
</div>
```

### 3D Transforms

New transform utilities:
```html
<div class="rotate-x-45 rotate-y-30">...</div>
```

### Improved Color Palette

Wider P3 color gamut support for more vibrant colors on supported displays.

---

## Additional Resources

- [Tailwind CSS v4 Upgrade Guide](https://tailwindcss.com/docs/upgrade-guide)
- [Tailwind CSS v4 Blog Post](https://tailwindcss.com/blog/tailwindcss-v4)
- [React Email Tailwind v4 Discussion](https://github.com/resend/react-email/discussions/1878)
- [Tailwind CSS v4 Complete Guide](https://devtoolbox.dedyn.io/blog/tailwind-css-v4-complete-guide)

---

## Summary

This migration involves:

1. **Configuration paradigm shift** - From JS to CSS-first
2. **PostCSS plugin change** - New `@tailwindcss/postcss` package
3. **Utility updates** - 19 instances of deprecated utilities
4. **React Email update** - For v4 compatibility

**Estimated Changes:**
- 8 component files with utility updates
- 3 configuration files (postcss, tailwind, globals.css)
- 2 package updates (tailwindcss, @react-email/tailwind)

**Benefits:**
- Faster builds (v4 is significantly faster)
- Smaller CSS output
- Modern CSS features (container queries, 3D transforms)
- Native CSS custom properties
- Simpler configuration (CSS-based)
