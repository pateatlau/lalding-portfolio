import { test, expect } from '@playwright/test';

const hasAuth = !!(process.env.E2E_ADMIN_EMAIL && process.env.E2E_ADMIN_PASSWORD);

test.describe('Admin Resume Manager', () => {
  test.skip(!hasAuth, 'Requires E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD');

  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/resume');
  });

  test('resume page loads with heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Resume Management', level: 1 })).toBeVisible();
    await expect(page.getByText('Upload your resume and view download history')).toBeVisible();
  });

  test('upload button is visible', async ({ page }) => {
    // Button text is either "Upload Resume" or "Replace Resume" depending on state
    const uploadBtn = page.getByRole('button', { name: /Upload Resume|Replace Resume/ });
    await expect(uploadBtn).toBeVisible();
  });

  test('file input accepts PDF only', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toHaveAttribute('accept', '.pdf,application/pdf');
  });

  test('download log section is visible', async ({ page }) => {
    await expect(page.getByText('Download Log')).toBeVisible();

    // Either a table or the empty state
    const table = page.locator('table');
    const emptyState = page.getByText('No downloads recorded yet');

    const tableVisible = await table.isVisible().catch(() => false);
    const emptyVisible = await emptyState.isVisible().catch(() => false);

    expect(tableVisible || emptyVisible).toBe(true);
  });
});
