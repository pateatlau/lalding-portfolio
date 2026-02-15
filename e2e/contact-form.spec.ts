import { test, expect } from '@playwright/test';

test.describe('Contact Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Navigate to contact section
    await page.getByRole('link', { name: 'Contact' }).click();
  });

  test('contact form is visible', async ({ page }) => {
    await expect(page.locator('#contact')).toBeVisible();
  });

  test('form has email input', async ({ page }) => {
    const emailInput = page.locator('input[name="senderEmail"]');
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toHaveAttribute('type', 'email');
  });

  test('form has message textarea', async ({ page }) => {
    const messageInput = page.locator('textarea[name="message"]');
    await expect(messageInput).toBeVisible();
  });

  test('form has submit button', async ({ page }) => {
    const submitButton = page.getByRole('button', { name: /submit/i });
    await expect(submitButton).toBeVisible();
  });

  test('email input has required attribute', async ({ page }) => {
    const emailInput = page.locator('input[name="senderEmail"]');
    await expect(emailInput).toHaveAttribute('required');
  });

  test('message textarea has required attribute', async ({ page }) => {
    const messageInput = page.locator('textarea[name="message"]');
    await expect(messageInput).toHaveAttribute('required');
  });

  test('can fill out form fields', async ({ page }) => {
    const emailInput = page.locator('input[name="senderEmail"]');
    const messageInput = page.locator('textarea[name="message"]');

    await emailInput.fill('test@example.com');
    await messageInput.fill('This is a test message.');

    await expect(emailInput).toHaveValue('test@example.com');
    await expect(messageInput).toHaveValue('This is a test message.');
  });

  test('form submission is disabled without input', async ({ page }) => {
    const submitButton = page.getByRole('button', { name: /submit/i });

    // Click submit without filling form
    await submitButton.click();

    // Form should not submit - browser validation should kick in
    // We can check that we're still on the same page
    await expect(page.locator('#contact')).toBeVisible();
  });
});
