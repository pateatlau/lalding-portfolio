import { test, expect } from '@playwright/test';

test.describe('Admin Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/login');
  });

  test('renders login form with email and password fields', async ({ page }) => {
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In', exact: true })).toBeVisible();
  });

  test('displays Admin Dashboard title', async ({ page }) => {
    await expect(page.getByText('Admin Dashboard')).toBeVisible();
    await expect(page.getByText('Sign in to manage your portfolio')).toBeVisible();
  });

  test('has OAuth provider buttons', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Sign in with Google' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in with GitHub' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in with LinkedIn' })).toBeVisible();
  });

  test('has back to portfolio link', async ({ page }) => {
    const backLink = page.getByRole('link', { name: 'Back to portfolio' });
    await expect(backLink).toBeVisible();
    await expect(backLink).toHaveAttribute('href', '/');
  });

  test('email field has correct type and required attribute', async ({ page }) => {
    await expect(page.locator('#email')).toHaveAttribute('type', 'email');
    await expect(page.locator('#email')).toHaveAttribute('required', '');
  });

  test('password field has correct type and required attribute', async ({ page }) => {
    await expect(page.locator('#password')).toHaveAttribute('type', 'password');
    await expect(page.locator('#password')).toHaveAttribute('required', '');
  });

  test('or continue with separator is visible', async ({ page }) => {
    await expect(page.getByText('Or continue with')).toBeVisible();
  });
});

test.describe('Admin Auth Redirect', () => {
  test('unauthenticated visit to /admin redirects to login', async ({ page }) => {
    await page.goto('/admin');

    // Should redirect to /admin/login
    await expect(page).toHaveURL(/\/admin\/login/);
  });
});
