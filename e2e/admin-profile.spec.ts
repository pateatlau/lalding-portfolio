import { test, expect } from '@playwright/test';

const hasAuth = !!(process.env.E2E_ADMIN_EMAIL && process.env.E2E_ADMIN_PASSWORD);

test.describe('Admin Profile Editor', () => {
  test.skip(!hasAuth, 'Requires E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD');

  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/profile');
  });

  test('profile page loads with heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Profile Editor', level: 1 })).toBeVisible();
    await expect(page.getByText('Edit your personal info, about section, and stats')).toBeVisible();
  });

  test('three tabs are visible', async ({ page }) => {
    await expect(page.getByRole('tab', { name: 'General' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'About' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Stats' })).toBeVisible();
  });

  test('general tab shows form fields', async ({ page }) => {
    // General tab should be active by default
    await expect(page.locator('#full_name')).toBeVisible();
    await expect(page.locator('#short_name')).toBeVisible();
    await expect(page.locator('#job_title')).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Save General Info' })).toBeVisible();
  });

  test('general tab fields have pre-filled values', async ({ page }) => {
    // Fields should not be empty since profile data exists
    const fullName = page.locator('#full_name');
    await expect(fullName).not.toHaveValue('');
  });

  test('about tab shows textarea fields', async ({ page }) => {
    await page.getByRole('tab', { name: 'About' }).click();

    await expect(page.locator('#about_tech_stack')).toBeVisible();
    await expect(page.locator('#about_current_focus')).toBeVisible();
    await expect(page.locator('#about_beyond_code')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Save About Info' })).toBeVisible();
  });

  test('stats tab shows stats management', async ({ page }) => {
    await page.getByRole('tab', { name: 'Stats' }).click();

    await expect(page.getByRole('button', { name: 'Add Stat' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Save Stats' })).toBeVisible();
  });

  test('tab navigation switches content', async ({ page }) => {
    // Start on General tab
    await expect(page.locator('#full_name')).toBeVisible();

    // Switch to About tab
    await page.getByRole('tab', { name: 'About' }).click();
    await expect(page.locator('#about_tech_stack')).toBeVisible();
    await expect(page.locator('#full_name')).not.toBeVisible();

    // Switch to Stats tab
    await page.getByRole('tab', { name: 'Stats' }).click();
    await expect(page.getByRole('button', { name: 'Add Stat' })).toBeVisible();
    await expect(page.locator('#about_tech_stack')).not.toBeVisible();
  });
});
