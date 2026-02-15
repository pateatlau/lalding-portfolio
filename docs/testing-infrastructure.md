# Testing Infrastructure Implementation Plan

This document outlines the implementation plan for adding code quality tooling and testing infrastructure to the lalding-portfolio project.

## Overview

| Tool                  | Purpose                                   | Priority |
| --------------------- | ----------------------------------------- | -------- |
| Prettier              | Code formatting with ESLint integration   | 1        |
| Vitest                | Unit testing framework (faster than Jest) | 2        |
| React Testing Library | Component integration tests               | 3        |
| Playwright            | End-to-end testing                        | 4        |
| CI Integration        | Automated testing in pipeline             | 5        |

## Current State

- **Framework**: Next.js 16.1.6 with App Router
- **ESLint**: v9 with flat config (`eslint.config.mjs`)
- **CI Pipeline**: Lint → Build → Lighthouse (no tests)
- **Testing**: None installed

---

## Phase 1: Prettier Setup

### Installation

```bash
npm install --save-dev prettier eslint-config-prettier --legacy-peer-deps
```

### Configuration Files

**`.prettierrc`**:

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

**`.prettierignore`**:

```
.next
node_modules
coverage
playwright-report
*.min.js
```

### ESLint Integration

Update `eslint.config.mjs` to add `eslint-config-prettier` (disables conflicting rules):

```javascript
import { defineConfig, globalIgnores } from 'eslint/config';
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import prettier from 'eslint-config-prettier';

const eslintConfig = defineConfig([
  ...nextCoreWebVitals,
  prettier,
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
  {
    rules: {
      'react/no-unescaped-entities': 'off',
    },
  },
]);

export default eslintConfig;
```

### Scripts

```json
{
  "scripts": {
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  }
}
```

---

## Phase 2: Vitest Setup (Unit Tests)

### Why Vitest over Jest?

- Native ESM support (Next.js 16 is ESM-first)
- Faster execution with Vite's transform
- Jest-compatible API (easy migration)
- Built-in TypeScript support
- Better integration with modern tooling

### Installation

```bash
npm install --save-dev vitest @vitest/ui @vitest/coverage-v8 jsdom --legacy-peer-deps
```

### Configuration

**`vitest.config.ts`**:

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', '.next', 'e2e'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        '.next/',
        'coverage/',
        '**/*.d.ts',
        'vitest.config.ts',
        'vitest.setup.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
```

**`vitest.setup.ts`**:

```typescript
import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock IntersectionObserver
class MockIntersectionObserver {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
}

vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);

// Mock window.matchMedia for theme tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
```

### Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage"
  }
}
```

### Test Structure

```
__tests__/
├── unit/
│   ├── lib/
│   │   ├── utils.test.ts          # validateString, getErrorMessage
│   │   └── hooks.test.tsx         # useSectionInView
│   └── actions/
│       └── sendEmail.test.ts      # Server action tests
├── components/
│   ├── contact.test.tsx
│   ├── submit-btn.test.tsx
│   ├── header.test.tsx
│   ├── theme-switch.test.tsx
│   └── project.test.tsx
└── context/
    ├── theme-context.test.tsx
    └── active-section-context.test.tsx
```

### Sample Unit Tests

**`__tests__/unit/lib/utils.test.ts`**:

```typescript
import { describe, it, expect } from 'vitest';
import { validateString, getErrorMessage } from '@/lib/utils';

describe('validateString', () => {
  it('returns true for valid string within maxLength', () => {
    expect(validateString('hello', 10)).toBe(true);
  });

  it('returns false for non-string values', () => {
    expect(validateString(null, 10)).toBe(false);
    expect(validateString(undefined, 10)).toBe(false);
    expect(validateString(123, 10)).toBe(false);
  });

  it('returns false for strings exceeding maxLength', () => {
    expect(validateString('hello world', 5)).toBe(false);
  });
});

describe('getErrorMessage', () => {
  it('extracts message from Error instance', () => {
    expect(getErrorMessage(new Error('Test error'))).toBe('Test error');
  });

  it('extracts message from object with message property', () => {
    expect(getErrorMessage({ message: 'Object error' })).toBe('Object error');
  });

  it('returns default message for unknown error types', () => {
    expect(getErrorMessage(null)).toBe('Something went wrong');
  });
});
```

---

## Phase 3: React Testing Library (Component Tests)

### Installation

```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event --legacy-peer-deps
```

### Test Utilities

**`__tests__/test-utils.tsx`**:

```typescript
import { ReactElement, ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import ThemeContextProvider from '@/context/theme-context';
import ActiveSectionContextProvider from '@/context/active-section-context';

interface AllProvidersProps {
  children: ReactNode;
}

function AllProviders({ children }: AllProvidersProps) {
  return (
    <ThemeContextProvider>
      <ActiveSectionContextProvider>
        {children}
      </ActiveSectionContextProvider>
    </ThemeContextProvider>
  );
}

function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllProviders, ...options });
}

export * from '@testing-library/react';
export { customRender as render };
```

### Mocking Strategies

**Framer Motion**:

```typescript
// __mocks__/framer-motion.ts
export const motion = {
  div: 'div',
  section: 'section',
  span: 'span',
  a: 'a',
  li: 'li',
};

export const useScroll = () => ({ scrollYProgress: { current: 0 } });
export const useTransform = () => 0;
export const AnimatePresence = ({ children }: { children: ReactNode }) => children;
```

**Next.js Image**:

```typescript
// __mocks__/next/image.ts
const Image = (props: any) => <img {...props} />;
export default Image;
```

### Sample Component Tests

**`__tests__/components/theme-switch.test.tsx`**:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../test-utils';
import userEvent from '@testing-library/user-event';
import ThemeSwitch from '@/components/theme-switch';

describe('ThemeSwitch', () => {
  it('renders a button', () => {
    render(<ThemeSwitch />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('toggles theme when clicked', async () => {
    const user = userEvent.setup();
    render(<ThemeSwitch />);

    const button = screen.getByRole('button');
    await user.click(button);

    // Theme should toggle (implementation depends on context)
  });
});
```

**`__tests__/components/submit-btn.test.tsx`**:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import SubmitBtn from '@/components/submit-btn';

// Mock useFormStatus
vi.mock('react-dom', async () => {
  const actual = await vi.importActual('react-dom');
  return {
    ...actual,
    useFormStatus: () => ({ pending: false }),
  };
});

describe('SubmitBtn', () => {
  it('renders submit text when not pending', () => {
    render(<SubmitBtn />);
    expect(screen.getByRole('button')).toHaveTextContent('Submit');
  });

  it('shows loading state when pending', () => {
    vi.mocked(useFormStatus).mockReturnValue({ pending: true });
    render(<SubmitBtn />);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

---

## Phase 4: Playwright (E2E Tests)

### Installation

```bash
npm install --save-dev @playwright/test --legacy-peer-deps
npx playwright install
```

### Configuration

**`playwright.config.ts`**:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:1111',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:1111',
    reuseExistingServer: !process.env.CI,
  },
});
```

### Test Structure

```
e2e/
├── navigation.spec.ts      # Header navigation, section scrolling
├── theme.spec.ts           # Theme toggle, persistence
├── contact-form.spec.ts    # Form submission flow
└── accessibility.spec.ts   # A11y testing with axe-core
```

### Sample E2E Tests

**`e2e/navigation.spec.ts`**:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('navigates through all sections', async ({ page }) => {
    await page.goto('/');

    // Check header links
    await expect(page.getByRole('navigation')).toBeVisible();

    // Click on About link
    await page.getByRole('link', { name: 'About' }).click();
    await expect(page.locator('#about')).toBeInViewport();

    // Click on Projects link
    await page.getByRole('link', { name: 'Projects' }).click();
    await expect(page.locator('#projects')).toBeInViewport();
  });

  test('highlights active section in navigation', async ({ page }) => {
    await page.goto('/');

    // Scroll to Projects section
    await page.locator('#projects').scrollIntoViewIfNeeded();

    // Wait for intersection observer to trigger
    await page.waitForTimeout(500);

    // Check that Projects link is active
    const projectsLink = page.getByRole('link', { name: 'Projects' });
    await expect(projectsLink).toHaveClass(/bg-gray-100/);
  });
});
```

**`e2e/theme.spec.ts`**:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Theme Toggle', () => {
  test('toggles between light and dark mode', async ({ page }) => {
    await page.goto('/');

    // Find theme toggle button
    const themeButton = page.getByRole('button', { name: /theme/i });

    // Check initial state (light mode)
    await expect(page.locator('html')).not.toHaveClass(/dark/);

    // Toggle to dark mode
    await themeButton.click();
    await expect(page.locator('html')).toHaveClass(/dark/);

    // Toggle back to light mode
    await themeButton.click();
    await expect(page.locator('html')).not.toHaveClass(/dark/);
  });

  test('persists theme preference on reload', async ({ page }) => {
    await page.goto('/');

    // Toggle to dark mode
    await page.getByRole('button', { name: /theme/i }).click();
    await expect(page.locator('html')).toHaveClass(/dark/);

    // Reload page
    await page.reload();

    // Should still be dark mode
    await expect(page.locator('html')).toHaveClass(/dark/);
  });
});
```

### Scripts

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed"
  }
}
```

---

## Phase 5: CI Pipeline Integration

### Updated `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  lint:
    name: Lint & Format Check
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm install --legacy-peer-deps

      - name: Run ESLint
        run: npm run lint

      - name: Check Prettier formatting
        run: npm run format:check

  test:
    name: Unit & Integration Tests
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm install --legacy-peer-deps

      - name: Run tests with coverage
        run: npm run test:coverage

      - name: Upload coverage report
        uses: codecov/codecov-action@v4
        if: github.event_name == 'pull_request'
        with:
          files: ./coverage/coverage-final.json
          fail_ci_if_error: false

  e2e:
    name: E2E Tests
    runs-on: ubuntu-latest
    needs: test
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm install --legacy-peer-deps

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: Run E2E tests
        run: npm run test:e2e -- --project=chromium

      - name: Upload Playwright report
        uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7

  build:
    name: Build
    runs-on: ubuntu-latest
    needs: [lint, test]
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm install --legacy-peer-deps

      - name: Build application
        run: npm run build

  lighthouse:
    name: Lighthouse CI
    runs-on: ubuntu-latest
    needs: build
    if: github.event_name == 'pull_request'
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm install --legacy-peer-deps

      - name: Build application
        run: npm run build

      - name: Run Lighthouse CI
        run: |
          npm install -g @lhci/cli
          lhci autorun
```

---

## Implementation Order

1. **Prettier** (30 min)
   - Install packages
   - Create config files
   - Update ESLint config
   - Run initial format
   - Add scripts

2. **Vitest** (1-2 hours)
   - Install packages
   - Create config
   - Create setup file
   - Write utility tests
   - Add scripts

3. **React Testing Library** (2-3 hours)
   - Install packages
   - Create test utilities
   - Set up mocks
   - Write component tests

4. **Playwright** (1-2 hours)
   - Install packages
   - Create config
   - Write E2E tests
   - Add scripts

5. **CI Integration** (30 min)
   - Update workflow
   - Test pipeline
   - Verify all jobs pass

---

## Coverage Goals

| Category                 | Target     |
| ------------------------ | ---------- |
| Utilities (lib/utils.ts) | 100%       |
| Hooks (lib/hooks.ts)     | 100%       |
| Context providers        | 95%+       |
| Server actions           | 95%+       |
| Components               | 70-80%     |
| **Overall**              | **75-80%** |

---

## Dependencies Summary

### DevDependencies to Add

```json
{
  "devDependencies": {
    "prettier": "^3.4.0",
    "prettier-plugin-tailwindcss": "^0.6.0",
    "eslint-config-prettier": "^10.0.0",
    "vitest": "^3.0.0",
    "@vitest/ui": "^3.0.0",
    "@vitest/coverage-v8": "^3.0.0",
    "@vitejs/plugin-react": "^4.4.0",
    "jsdom": "^26.0.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/jest-dom": "^6.6.0",
    "@testing-library/user-event": "^14.6.0",
    "@playwright/test": "^1.50.0"
  }
}
```

### Scripts to Add

```json
{
  "scripts": {
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed"
  }
}
```

---

## Files to Create

| File                                | Purpose                      |
| ----------------------------------- | ---------------------------- |
| `.prettierrc`                       | Prettier configuration       |
| `.prettierignore`                   | Files to ignore              |
| `vitest.config.ts`                  | Vitest configuration         |
| `vitest.setup.ts`                   | Test setup and mocks         |
| `playwright.config.ts`              | Playwright configuration     |
| `__tests__/test-utils.tsx`          | Custom render with providers |
| `__tests__/unit/lib/utils.test.ts`  | Utility tests                |
| `__tests__/unit/lib/hooks.test.tsx` | Hook tests                   |
| `__tests__/components/*.test.tsx`   | Component tests              |
| `__tests__/context/*.test.tsx`      | Context tests                |
| `e2e/*.spec.ts`                     | E2E tests                    |

---

## Notes

- Use `npm install --legacy-peer-deps` for all installations
- Dev server runs on port 1111
- Resend API key needed for email tests (mock in unit tests)
- Framer Motion requires mocking for unit tests
- IntersectionObserver requires polyfill/mock
