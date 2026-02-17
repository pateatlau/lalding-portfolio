import { test, expect } from '@playwright/test';

const hasAuth = !!(process.env.E2E_ADMIN_EMAIL && process.env.E2E_ADMIN_PASSWORD);

test.describe('Admin Edit → Public Site Verification', () => {
  test.skip(!hasAuth, 'Requires E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD');

  test('editing profile tagline is reflected on the public homepage', async ({ page }) => {
    // ── Step 1: Read the current tagline from the admin profile page ──
    await page.goto('/admin/profile');
    await expect(page.getByRole('heading', { name: 'Profile Editor', level: 1 })).toBeVisible();

    const taglineInput = page.locator('#tagline');
    await expect(taglineInput).toBeVisible();
    const originalTagline = await taglineInput.inputValue();

    // ── Step 2: Change the tagline to a unique test value ──
    const testTagline = `E2E sync test ${Date.now()}`;

    try {
      await taglineInput.fill(testTagline);
      await page.getByRole('button', { name: 'Save General Info' }).click();

      // Wait for save confirmation
      await expect(page.getByText(/saved/i)).toBeVisible({ timeout: 10000 });

      // ── Step 3: Navigate to public homepage and verify the change ──
      await page.goto('/');
      await expect(page.getByText(testTagline)).toBeVisible({ timeout: 10000 });
    } finally {
      // ── Step 4: Always revert the tagline to its original value ──
      await page.goto('/admin/profile');
      const input = page.locator('#tagline');
      await expect(input).toBeVisible();
      await input.fill(originalTagline);
      await page.getByRole('button', { name: 'Save General Info' }).click();
      await expect(page.getByText(/saved/i)).toBeVisible({ timeout: 10000 });
    }

    // ── Step 5: Verify the public homepage shows the original value ──
    await page.goto('/');
    await expect(page.getByText(originalTagline)).toBeVisible({ timeout: 10000 });
  });
});
