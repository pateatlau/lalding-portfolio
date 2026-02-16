import { test, expect } from '@playwright/test';

const hasAuth = !!(process.env.E2E_ADMIN_EMAIL && process.env.E2E_ADMIN_PASSWORD);

test.describe('Admin Dashboard', () => {
  test.skip(!hasAuth, 'Requires E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD');

  test.beforeEach(async ({ page }) => {
    await page.goto('/admin');
  });

  test('dashboard page loads with heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible();
    await expect(page.getByText('Overview of your portfolio activity')).toBeVisible();
  });

  test('displays stats cards', async ({ page }) => {
    await expect(page.getByText('Total Visitors')).toBeVisible();
    await expect(page.getByText('Total Downloads')).toBeVisible();
    await expect(page.getByText('Recent Downloads')).toBeVisible();
  });

  test('displays quick actions section with all links', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Quick Actions' })).toBeVisible();

    const actions = ['Profile', 'Experience', 'Projects', 'Skills', 'Resume', 'Visitors'];
    for (const action of actions) {
      await expect(page.getByRole('link', { name: action })).toBeVisible();
    }
  });

  test('sidebar navigation is visible with all items', async ({ page }) => {
    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible();

    const navItems = [
      'Dashboard',
      'Profile',
      'Experience',
      'Projects',
      'Skills',
      'Resume',
      'Visitors',
    ];
    for (const item of navItems) {
      await expect(sidebar.getByRole('link', { name: item })).toBeVisible();
    }
  });

  test('quick action navigates to profile page', async ({ page }) => {
    await page.getByRole('link', { name: 'Profile' }).first().click();
    await expect(page).toHaveURL(/\/admin\/profile/);
    await expect(page.getByRole('heading', { name: 'Profile Editor', level: 1 })).toBeVisible();
  });
});
