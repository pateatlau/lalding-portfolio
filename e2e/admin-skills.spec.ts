import { test, expect } from '@playwright/test';

const hasAuth = !!(process.env.E2E_ADMIN_EMAIL && process.env.E2E_ADMIN_PASSWORD);

test.describe('Admin Skills Editor', () => {
  test.skip(!hasAuth, 'Requires E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD');

  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/skills');
  });

  test('skills page loads with heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Skills Editor', level: 1 })).toBeVisible();
    await expect(page.getByText('Manage skill groups and individual skills')).toBeVisible();
  });

  test('add group button is visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Add Group' })).toBeVisible();
  });

  test('add group dialog opens with name field', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Group' }).click();

    await expect(page.getByRole('heading', { name: 'Add Skill Group' })).toBeVisible();
    await expect(page.locator('#group-name')).toBeVisible();
  });

  test('add group dialog has cancel and create buttons', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Group' }).click();

    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create' })).toBeVisible();
  });

  test('skill groups or empty state is visible', async ({ page }) => {
    // Either skill group cards or the empty state message
    const groupCards = page.locator('[class*="card"]').first();
    const emptyState = page.getByText('No skill groups yet');

    const cardsVisible = await groupCards.isVisible().catch(() => false);
    const emptyVisible = await emptyState.isVisible().catch(() => false);

    expect(cardsVisible || emptyVisible).toBe(true);
  });
});
