import { test, expect } from '@playwright/test';

const hasAuth = !!(process.env.E2E_ADMIN_EMAIL && process.env.E2E_ADMIN_PASSWORD);

test.describe('Admin Resume Builder', () => {
  test.skip(!hasAuth, 'Requires E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD');

  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/resume-builder');
  });

  test('resume builder page loads with heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Resume Builder', level: 1 })).toBeVisible();
    await expect(page.getByText('Create and manage tailored resume configurations')).toBeVisible();
  });

  test('all tabs are rendered', async ({ page }) => {
    await expect(page.getByRole('tab', { name: 'Configs' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Composer' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Preview' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Templates' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'History' })).toBeVisible();
  });

  test('Configs tab is active by default', async ({ page }) => {
    const configsTab = page.getByRole('tab', { name: 'Configs' });
    await expect(configsTab).toHaveAttribute('data-state', 'active');
  });

  test('Composer and Preview tabs are disabled without a selected config', async ({ page }) => {
    const composerTab = page.getByRole('tab', { name: 'Composer' });
    const previewTab = page.getByRole('tab', { name: 'Preview' });
    const historyTab = page.getByRole('tab', { name: 'History' });

    await expect(composerTab).toBeDisabled();
    await expect(previewTab).toBeDisabled();
    await expect(historyTab).toBeDisabled();
  });

  test('Templates tab is always enabled', async ({ page }) => {
    const templatesTab = page.getByRole('tab', { name: 'Templates' });
    await expect(templatesTab).not.toBeDisabled();
  });

  test('Templates tab shows template cards', async ({ page }) => {
    await page.getByRole('tab', { name: 'Templates' }).click();
    // At minimum the seeded Professional template should be present
    await expect(page.getByText('Professional')).toBeVisible();
  });

  test('create config button is visible', async ({ page }) => {
    const createBtn = page.getByRole('button', { name: /New Config|Create/i });
    await expect(createBtn).toBeVisible();
  });
});
