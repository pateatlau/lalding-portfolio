import { test, expect } from '@playwright/test';

const hasAuth = !!(process.env.E2E_ADMIN_EMAIL && process.env.E2E_ADMIN_PASSWORD);

test.describe('Admin Projects Editor', () => {
  test.skip(!hasAuth, 'Requires E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD');

  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/projects');
  });

  test('projects page loads with heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Projects Editor', level: 1 })).toBeVisible();
    await expect(page.getByText('Manage your portfolio projects')).toBeVisible();
  });

  test('add project button is visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Add Project' })).toBeVisible();
  });

  test('add dialog opens with form fields', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Project' }).click();

    // Dialog should open
    await expect(page.getByRole('heading', { name: 'Add Project' })).toBeVisible();
    await expect(page.locator('#proj-title')).toBeVisible();
    await expect(page.locator('#proj-description')).toBeVisible();
    await expect(page.locator('#proj-tags')).toBeVisible();
  });

  test('add dialog has cancel and create buttons', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Project' }).click();

    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create' })).toBeVisible();
  });

  test('projects table or empty state is visible', async ({ page }) => {
    const table = page.locator('table');
    const emptyState = page.getByText('No projects yet');

    const tableVisible = await table.isVisible().catch(() => false);
    const emptyVisible = await emptyState.isVisible().catch(() => false);

    expect(tableVisible || emptyVisible).toBe(true);
  });
});
