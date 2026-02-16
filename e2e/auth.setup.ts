import { test as setup } from '@playwright/test';

const adminAuthFile = 'e2e/.auth/admin.json';

setup('authenticate as admin', async ({ page }) => {
  const email = process.env.E2E_ADMIN_EMAIL;
  const password = process.env.E2E_ADMIN_PASSWORD;

  if (!email || !password) {
    // Write an empty storage state so the admin project doesn't error
    await page.context().storageState({ path: adminAuthFile });
    setup.skip(true, 'E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD not set — skipping admin auth setup');
    return;
  }

  await page.goto('/admin/login');

  // Fill login form
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.getByRole('button', { name: 'Sign In', exact: true }).click();

  // Wait for redirect to admin dashboard
  await page.waitForURL('/admin', { timeout: 15000 });

  // Save auth state
  await page.context().storageState({ path: adminAuthFile });
});
