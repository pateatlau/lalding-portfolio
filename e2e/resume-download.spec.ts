import { test, expect } from '@playwright/test';

test.describe('Resume Download Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Download Resume button is visible in the intro section', async ({ page }) => {
    const downloadButton = page.getByRole('button', { name: /download resume/i });
    await expect(downloadButton).toBeVisible();
  });

  test('clicking Download Resume opens the login modal for unauthenticated users', async ({
    page,
  }) => {
    const downloadButton = page.getByRole('button', { name: /download resume/i });
    await downloadButton.click();

    // Login modal should appear with heading
    await expect(page.getByText('Sign in to download')).toBeVisible();
  });

  test('login modal displays all three social login buttons', async ({ page }) => {
    await page.getByRole('button', { name: /download resume/i }).click();

    await expect(page.getByRole('button', { name: /continue with google/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /continue with github/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /continue with linkedin/i })).toBeVisible();
  });

  test('login modal can be closed with the Cancel button', async ({ page }) => {
    await page.getByRole('button', { name: /download resume/i }).click();
    await expect(page.getByText('Sign in to download')).toBeVisible();

    await page.getByRole('button', { name: /cancel/i }).click();

    // Modal should be dismissed
    await expect(page.getByText('Sign in to download')).not.toBeVisible();
  });

  test('login modal can be closed by clicking the backdrop', async ({ page }) => {
    await page.getByRole('button', { name: /download resume/i }).click();
    await expect(page.getByText('Sign in to download')).toBeVisible();

    // Click outside the modal content area to hit the backdrop overlay.
    // The modal is centered horizontally and positioned at top 20%, so
    // clicking the top-left corner (10, 10) reliably hits the backdrop.
    await page.mouse.click(10, 10);

    await expect(page.getByText('Sign in to download')).not.toBeVisible();
  });

  test('Download Resume button is not in downloading state initially', async ({ page }) => {
    const downloadButton = page.getByRole('button', { name: /download resume/i });
    await expect(downloadButton).toBeEnabled();
    await expect(downloadButton).not.toContainText('Downloading');
  });
});
