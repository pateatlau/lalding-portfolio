# SEO Optimizations Plan

## Scope

Public-facing pages only: home page (`/`), auth callback (`/auth/callback`).
Admin routes (`/admin/*`) are auth-gated and must be excluded from indexing.

Live URL: `https://lalding.in/`

---

## Current State Audit

### What Already Exists

| Feature                | Status  | Notes                                                                   |
| ---------------------- | ------- | ----------------------------------------------------------------------- |
| `metadataBase`         | Present | Set to `https://lalding.in`                                             |
| Title & description    | Present | Good, descriptive content                                               |
| Keywords               | Present | 7 relevant keywords                                                     |
| Authors / creator      | Present | Full name                                                               |
| Open Graph tags        | Present | type, locale, url, siteName, title, description, images                 |
| Twitter card           | Present | `summary` card with title, description, image                           |
| `robots` in metadata   | Present | `index: true, follow: true` (root layout only)                          |
| JSON-LD (Person)       | Present | name, alternateName, url, image, jobTitle, worksFor, sameAs, knowsAbout |
| `lang="en"`            | Present | On `<html>` element                                                     |
| Font `display: 'swap'` | Present | Inter font config                                                       |
| Skip-to-content link   | Present | Accessible skip nav                                                     |
| Favicon                | Present | `/lalding.jpg` (JPG, 1200x1600)                                         |

### What's Missing

| Feature                  | Impact | Notes                                                                          |
| ------------------------ | ------ | ------------------------------------------------------------------------------ |
| `robots.txt`             | High   | No file exists — crawlers rely on defaults                                     |
| `sitemap.xml`            | High   | No file exists — search engines must discover pages manually                   |
| Admin `noindex`          | High   | `/admin/*` routes have no `robots: noindex` metadata                           |
| Dedicated OG image       | Medium | Using profile photo (1200x1600 portrait) — should be 1200x630 landscape        |
| `twitter.creator`        | Low    | No Twitter/X handle specified                                                  |
| Canonical URL            | Low    | Not explicitly set (Next.js infers from `metadataBase` but explicit is better) |
| Additional JSON-LD types | Low    | Could add `WebSite` with `SearchAction`, or `WebPage`                          |
| Dynamic JSON-LD from CMS | Low    | Current JSON-LD is hardcoded — could pull from Supabase profile data           |
| `manifest.json` (PWA)    | Low    | Out of scope for this task                                                     |

---

## Implementation Plan

### Task 1: `robots.txt` via Next.js Metadata API

**File**: `app/robots.ts` (new)

Create a `robots.ts` file using Next.js's [Metadata API for robots.txt](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots):

```ts
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/auth/', '/monitoring'],
      },
    ],
    sitemap: 'https://lalding.in/sitemap.xml',
  };
}
```

**Key decisions**:

- Disallow `/admin/` — auth-gated, no public value
- Disallow `/auth/` — callback route, no content
- Disallow `/monitoring` — Sentry tunnel route
- Reference sitemap for crawler discovery

---

### Task 2: `sitemap.xml` via Next.js Metadata API

**File**: `app/sitemap.ts` (new)

Create a `sitemap.ts` file using Next.js's [Metadata API for sitemaps](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap):

```ts
import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://lalding.in',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
  ];
}
```

**Notes**:

- Single-page portfolio — only one URL entry needed
- `changeFrequency: 'monthly'` matches the ISR revalidation intent
- `lastModified: new Date()` updates on each build/request

---

### Task 3: Admin routes `noindex`

**File**: `app/admin/layout.tsx` (new — wraps both login and dashboard)

Add a layout that sets `robots: noindex, nofollow` for all `/admin/*` routes:

```ts
import type { Metadata } from 'next';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

**Why a new file**: Currently `/admin/login/page.tsx` is a client component and can't export metadata. The dashboard already has `app/admin/(dashboard)/layout.tsx` but that only covers authenticated routes — login is outside the route group. A shared `app/admin/layout.tsx` covers both.

**Check**: Verify no existing `app/admin/layout.tsx` conflicts.

---

### Task 4: Dedicated Open Graph image

**Files**: `public/og-image.jpg` (new, 1200x630)

The current OG image is the profile photo at 1200x1600 (portrait). Social platforms expect 1200x630 (landscape). Options:

**Option A** (recommended): Create a designed OG image (1200x630) with name, title, and branding — requires a graphic to be created/provided by the user.

**Option B**: Use Next.js `ImageResponse` to generate an OG image dynamically at build time (`app/opengraph-image.tsx`). This auto-generates a 1200x630 image with text overlay — no external graphic needed.

**Option C**: Keep current profile photo — functional but not optimized for social cards.

After the image is available, update `app/layout.tsx` metadata:

```ts
openGraph: {
  images: [
    {
      url: '/og-image.jpg',  // or auto-generated via opengraph-image.tsx
      width: 1200,
      height: 630,
      alt: 'Lalding — Full-stack Tech Lead Portfolio',
    },
  ],
},
twitter: {
  card: 'summary_large_image',  // upgrade from 'summary' for larger preview
  images: ['/og-image.jpg'],
},
```

---

### Task 5: Enhance existing metadata

**File**: `app/layout.tsx` (edit)

Minor metadata improvements:

```ts
export const metadata: Metadata = {
  // ... existing fields ...

  // Add explicit canonical (Next.js does this via metadataBase, but explicit is clearer)
  alternates: {
    canonical: 'https://lalding.in',
  },

  // Add category for content classification
  category: 'technology',
};
```

---

### Task 6: Enrich JSON-LD structured data

**File**: `app/layout.tsx` (edit)

Enhance the existing Person JSON-LD and add a WebSite schema:

```ts
// Enhanced Person schema
{
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Laldingliana Tlau Vantawl',
  alternateName: 'Lalding',
  url: 'https://lalding.in',
  image: 'https://lalding.in/lalding.jpg',
  jobTitle: 'Full-stack Tech Lead',
  worksFor: {
    '@type': 'Organization',
    name: 'HDFC Bank Limited',
  },
  sameAs: [
    'https://www.linkedin.com/in/laldingliana-tv/',
    'https://github.com/pateatlau',
  ],
  knowsAbout: [
    'React', 'Next.js', 'TypeScript', 'Node.js',
    'Full-stack Development', 'Web Development',
  ],
  // NEW: Add description
  description: 'Full-stack Tech Lead with 15+ years of experience building scalable web applications.',
}

// NEW: WebSite schema (separate <script> tag)
{
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Lalding Portfolio',
  url: 'https://lalding.in',
  description: 'Portfolio of Laldingliana Tlau Vantawl — Full-stack Tech Lead with 15+ years of experience.',
}
```

**Optional / future**: Make JSON-LD dynamic by pulling `profile` data (already fetched in the layout) into the schema. This is a nice-to-have — the static version is fine for SEO since the data rarely changes.

---

### Task 7: Dynamic JSON-LD from CMS data (optional enhancement)

**File**: `app/layout.tsx` (edit)

Since `getProfileData()` is already called in the root layout, we could populate JSON-LD dynamically:

```ts
const personJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: profile?.full_name ?? 'Laldingliana Tlau Vantawl',
  alternateName: profile?.heading ? profile.heading.split(' ')[0] : 'Lalding',
  url: 'https://lalding.in',
  image: profile?.avatar_url ?? 'https://lalding.in/lalding.jpg',
  jobTitle: profile?.heading ?? 'Full-stack Tech Lead',
  description: profile?.bio ?? 'Full-stack Tech Lead with 15+ years of experience...',
  // ... etc
};
```

**Trade-off**: Adds runtime dependency on Supabase for SEO content. Static fallback data means this always works, but it's more moving parts. Can be deferred if desired.

---

## Task Summary

| #   | Task                     | Files                                                            | Priority | Complexity | Status |
| --- | ------------------------ | ---------------------------------------------------------------- | -------- | ---------- | ------ |
| 1   | `robots.txt`             | `app/robots.ts` (new)                                            | High     | Low        | Done   |
| 2   | `sitemap.xml`            | `app/sitemap.ts` (new)                                           | High     | Low        | Done   |
| 3   | Admin `noindex`          | `app/admin/layout.tsx` (new)                                     | High     | Low        | Done   |
| 4   | OG image                 | `public/og-image.jpg` or `app/opengraph-image.tsx` + layout edit | Medium   | Medium     |        |
| 5   | Metadata enhancements    | `app/layout.tsx` (edit)                                          | Low      | Low        |        |
| 6   | Enrich JSON-LD           | `app/layout.tsx` (edit)                                          | Low      | Low        |        |
| 7   | Dynamic JSON-LD from CMS | `app/layout.tsx` (edit)                                          | Low      | Medium     |        |

**Proposed order**: 1 → 2 → 3 → 5 → 6 → 4 → 7

Tasks 5 and 6 are small edits to `layout.tsx` that can be combined. Task 4 requires a decision on the OG image approach. Task 7 is optional.

---

## Out of Scope

- PWA manifest / service worker
- Per-project detail pages (site is single-page)
- RSS feed
- AMP pages
- International SEO (hreflang) — single-language site
- Performance optimizations (Core Web Vitals) — separate concern
- Admin page SEO (explicitly excluded)

---

## Verification

After implementation, verify with:

- `curl https://lalding.in/robots.txt` — should show rules
- `curl https://lalding.in/sitemap.xml` — should show URL entries
- View page source for JSON-LD, OG tags, canonical link
- [Google Rich Results Test](https://search.google.com/test/rich-results) — validate structured data
- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) — validate OG tags
- [Twitter Card Validator](https://cards-dev.twitter.com/validator) — validate Twitter cards
- Lighthouse SEO audit in Chrome DevTools
