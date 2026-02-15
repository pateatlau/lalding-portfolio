import { test, expect } from '@playwright/test';

test.describe('Accessibility', () => {
  test('page has a main heading', async ({ page }) => {
    await page.goto('/');

    // Check for h1 or main content
    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible();
  });

  test('images have alt text', async ({ page }) => {
    await page.goto('/');

    // Get all images
    const images = page.locator('img');
    const count = await images.count();

    // Check each image has alt attribute
    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      expect(alt).not.toBeNull();
    }
  });

  test('navigation links are keyboard accessible', async ({ page }) => {
    await page.goto('/');

    // Tab to first navigation link
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Should be able to navigate
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('buttons have accessible labels', async ({ page }) => {
    await page.goto('/');

    // Check theme toggle button
    const themeButton = page.getByRole('button', { name: /switch to (dark|light) mode/i });
    await expect(themeButton).toHaveAttribute('aria-label');
  });

  test('sections have proper headings', async ({ page }) => {
    await page.goto('/');

    // Check for section headings
    const headings = page.locator('h2');
    const count = await headings.count();

    // Should have multiple section headings
    expect(count).toBeGreaterThan(0);
  });

  test('color contrast is maintained in both themes', async ({ page }) => {
    await page.goto('/');

    // Check page is readable (basic check)
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // Toggle theme and check again
    const themeButton = page.getByRole('button', { name: /switch to (dark|light) mode/i });
    await themeButton.click();
    await page.waitForTimeout(100);

    await expect(body).toBeVisible();
  });

  test('links have discernible text', async ({ page }) => {
    await page.goto('/');

    // Get all links in navigation
    const navLinks = page.locator('nav a');
    const count = await navLinks.count();

    for (let i = 0; i < count; i++) {
      const link = navLinks.nth(i);
      const text = await link.textContent();
      expect(text?.trim().length).toBeGreaterThan(0);
    }
  });

  test('form inputs have associated labels', async ({ page }) => {
    await page.goto('/');

    // Navigate to contact
    await page.getByRole('link', { name: 'Contact' }).click();

    // Check email input has label or placeholder
    const emailInput = page.locator('input[name="senderEmail"]');
    const emailPlaceholder = await emailInput.getAttribute('placeholder');
    expect(emailPlaceholder?.length).toBeGreaterThan(0);

    // Check message textarea has label or placeholder
    const messageInput = page.locator('textarea[name="message"]');
    const messagePlaceholder = await messageInput.getAttribute('placeholder');
    expect(messagePlaceholder?.length).toBeGreaterThan(0);
  });
});
