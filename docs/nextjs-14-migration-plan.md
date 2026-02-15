# Next.js 14 Migration Plan

## Overview

This document outlines the migration plan for upgrading the portfolio project from Next.js 13.4.8 to Next.js 14.x. The migration addresses breaking changes and updates dependencies accordingly.

## Prerequisites

- Node.js 18.17 or higher (Next.js 14 requirement)
- Current Next.js version: 13.4.8
- Target Next.js version: 14.2.0 (or latest 14.x)

## Breaking Changes Affecting This Project

### 1. Server Actions No Longer Experimental

Server Actions are now stable in Next.js 14, so the experimental flag must be removed.

### 2. useFormStatus Hook Stable

The `experimental_useFormStatus` hook is now stable and should be imported directly as `useFormStatus`.

## Migration Steps

### Step 1: Update Dependencies

**File**: `package.json`

Update the following dependencies:

```json
{
  "dependencies": {
    "next": "^14.2.0", // Update from 13.4.8
    "react": "^18.2.0", // Keep compatible version
    "react-dom": "^18.2.0", // Keep compatible version
    "eslint-config-next": "^14.2.0", // Update from 13.4.7
    "@types/react": "^18.2.0", // Update if needed
    "@types/react-dom": "^18.2.0" // Update if needed
  }
}
```

**Action**: Update these versions in `package.json` and run `npm install`.

### Step 2: Remove Experimental Server Actions Flag

**File**: `next.config.js`

**Current configuration**:

```javascript
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  experimental: {
    serverActions: true, // Remove this
  },
};
```

**Updated configuration**:

```javascript
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  // experimental.serverActions removed - Server Actions are now stable
};
```

**Action**: Remove the `experimental.serverActions: true` line from `next.config.js`.

### Step 3: Fix useFormStatus Import

**File**: `components/submit-btn.tsx`

**Current code** (line 3):

```typescript
import { experimental_useFormStatus as useFormStatus } from 'react-dom';
```

**Updated code**:

```typescript
import { useFormStatus } from 'react-dom';
```

**Action**: Replace the experimental import with the stable import.

### Step 4: Update Dockerfile (Optional but Recommended)

**File**: `Dockerfile`

**Current configuration**:

```dockerfile
FROM node:18-alpine
```

**Recommended update**:

```dockerfile
FROM node:18.17-alpine
```

Or for better future compatibility:

```dockerfile
FROM node:20-alpine
```

**Note**: `node:18-alpine` should work, but explicitly using 18.17+ ensures compatibility with Next.js 14 requirements.

**Action**: Update the Node.js version in Dockerfile if you want explicit versioning.

## Verification Checklist

After completing the migration, verify the following:

- [ ] Run `npm install` successfully
- [ ] Run `npm run build` - build should complete without errors
- [ ] Run `npm run dev` - development server should start on port 1111
- [ ] Test the contact form - verify form submission works correctly
- [ ] Verify email sending functionality (Server Actions)
- [ ] Check browser console for any warnings or errors
- [ ] Test all navigation links and sections
- [ ] Verify dark mode toggle functionality
- [ ] Test responsive design on different screen sizes

## Files That Don't Require Changes

The following files are already compatible with Next.js 14 and require no changes:

- `app/layout.tsx` - Already uses `next/font/google` (correct)
- `app/page.tsx` - Standard App Router usage
- `app/global-error.tsx` - Standard error boundary
- All component files - Standard React patterns
- `actions/sendEmail.ts` - Server Actions already properly implemented

## Rollback Plan

If issues arise after migration:

1. Revert `package.json` to previous versions
2. Restore `next.config.js` with experimental flag
3. Revert `components/submit-btn.tsx` import
4. Run `npm install` to restore previous dependencies
5. Run `npm run build` to verify rollback

## Risk Assessment

**Risk Level**: Low

**Reasoning**:

- The codebase uses standard Next.js 13 App Router patterns
- Only one breaking change affects this project (`useFormStatus`)
- Server Actions are already properly implemented
- No deprecated features are in use
- Simple, straightforward migration path

## Additional Notes

- Next.js 14 maintains backward compatibility with most Next.js 13 features
- The App Router patterns used in this project are fully supported
- No changes needed for font loading (`next/font` is correct)
- No changes needed for image optimization
- No middleware file exists, so no middleware-related changes needed

## Next Steps After Migration

Once Next.js 14 migration is complete and verified:

1. Consider updating to Next.js 15 (optional, for Turbopack and React Compiler)
2. Consider updating to Next.js 16 (optional, requires Node.js 20.9+)
3. Review Next.js 14 new features that could benefit the project
4. Update documentation if needed

## References

- [Next.js 14 Upgrade Guide](https://nextjs.org/docs/app/building-your-application/upgrading/version-14)
- [Next.js 14 Release Notes](https://nextjs.org/blog/next-14)
