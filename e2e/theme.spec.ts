import { test, expect } from '@playwright/test';

test.describe('Theme Toggle', () => {
  test('theme toggle button is visible', async ({ page }) => {
    await page.goto('/');

    // Find theme toggle button by aria-label pattern
    const themeButton = page.getByRole('button', { name: /switch to (dark|light) mode/i });
    await expect(themeButton).toBeVisible();
  });

  test('toggles between light and dark mode', async ({ page }) => {
    await page.goto('/');

    const html = page.locator('html');
    const themeButton = page.getByRole('button', { name: /switch to (dark|light) mode/i });

    // Get initial state
    const initiallyDark = await html.evaluate((el) => el.classList.contains('dark'));

    // Click to toggle
    await themeButton.click();

    // Wait for theme change
    await page.waitForTimeout(100);

    // Should be opposite now
    if (initiallyDark) {
      await expect(html).not.toHaveClass(/dark/);
    } else {
      await expect(html).toHaveClass(/dark/);
    }
  });

  test('persists theme preference on reload', async ({ page }) => {
    await page.goto('/');

    const html = page.locator('html');
    const themeButton = page.getByRole('button', { name: /switch to (dark|light) mode/i });

    // Get initial state
    const initiallyDark = await html.evaluate((el) => el.classList.contains('dark'));

    // Toggle to opposite state
    await themeButton.click();
    await page.waitForTimeout(100);

    // Verify toggle worked
    if (initiallyDark) {
      await expect(html).not.toHaveClass(/dark/);
    } else {
      await expect(html).toHaveClass(/dark/);
    }

    // Reload page
    await page.reload();

    // Theme should persist
    if (initiallyDark) {
      await expect(html).not.toHaveClass(/dark/);
    } else {
      await expect(html).toHaveClass(/dark/);
    }
  });

  test('theme affects page styling', async ({ page }) => {
    await page.goto('/');

    const body = page.locator('body');

    // In light mode, body should have light background
    // In dark mode, body should have dark background
    // We just verify the page renders without errors in both modes

    const themeButton = page.getByRole('button', { name: /switch to (dark|light) mode/i });

    // Toggle twice to ensure both modes render
    await themeButton.click();
    await page.waitForTimeout(100);
    await expect(body).toBeVisible();

    await themeButton.click();
    await page.waitForTimeout(100);
    await expect(body).toBeVisible();
  });
});
