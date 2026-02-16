import { test, expect } from '@playwright/test';

const hasAuth = !!(process.env.E2E_ADMIN_EMAIL && process.env.E2E_ADMIN_PASSWORD);

test.describe('Admin Experience Editor', () => {
  test.skip(!hasAuth, 'Requires E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD');

  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/experience');
  });

  test('experience page loads with heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Experience Editor', level: 1 })).toBeVisible();
    await expect(page.getByText('Manage your career timeline entries')).toBeVisible();
  });

  test('add experience button is visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Add Experience' })).toBeVisible();
  });

  test('add dialog opens with form fields', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Experience' }).click();

    // Dialog should open
    await expect(page.getByRole('heading', { name: 'Add Experience' })).toBeVisible();
    await expect(page.locator('#exp-title')).toBeVisible();
    await expect(page.locator('#exp-company')).toBeVisible();
    await expect(page.locator('#exp-description')).toBeVisible();
    await expect(page.locator('#exp-display-date')).toBeVisible();
    await expect(page.locator('#exp-start-date')).toBeVisible();
  });

  test('add dialog has cancel and create buttons', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Experience' }).click();

    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create' })).toBeVisible();
  });

  test('experience table or empty state is visible', async ({ page }) => {
    // Either a table with experiences or the empty state message
    const table = page.locator('table');
    const emptyState = page.getByText('No experiences yet');

    const tableVisible = await table.isVisible().catch(() => false);
    const emptyVisible = await emptyState.isVisible().catch(() => false);

    expect(tableVisible || emptyVisible).toBe(true);
  });
});
