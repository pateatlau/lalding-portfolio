import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('homepage loads successfully', async ({ page }) => {
    await page.goto('/');

    // Check that the page title or main heading is present
    await expect(page).toHaveTitle(/Lalding/i);
  });

  test('header navigation is visible', async ({ page }) => {
    await page.goto('/');

    // Check header links are visible
    await expect(page.getByRole('navigation')).toBeVisible();
  });

  test('navigates to About section', async ({ page }) => {
    await page.goto('/');

    // Click on About link
    await page.getByRole('link', { name: 'About' }).click();

    // Check that the About section is in viewport
    await expect(page.locator('#about')).toBeInViewport();
  });

  test('navigates to Projects section', async ({ page }) => {
    await page.goto('/');

    // Click on Projects link
    await page.getByRole('link', { name: 'Projects' }).click();

    // Check that the Projects section is in viewport
    await expect(page.locator('#projects')).toBeInViewport();
  });

  test('navigates to Skills section', async ({ page }) => {
    await page.goto('/');

    // Click on Skills link
    await page.getByRole('link', { name: 'Skills' }).click();

    // Check that the Skills section is in viewport
    await expect(page.locator('#skills')).toBeInViewport();
  });

  test('navigates to Experience section', async ({ page }) => {
    await page.goto('/');

    // Click on Experience link
    await page.getByRole('link', { name: 'Experience' }).click();

    // Check that the Experience section is in viewport
    await expect(page.locator('#experience')).toBeInViewport();
  });

  test('navigates to Contact section', async ({ page }) => {
    await page.goto('/');

    // Click on Contact link in nav
    await page.locator('nav').getByRole('link', { name: 'Contact' }).click();

    // Check that the Contact section is in viewport
    await expect(page.locator('#contact')).toBeInViewport();
  });

  test('all navigation links are present', async ({ page }) => {
    await page.goto('/');

    const links = ['Home', 'About', 'Projects', 'Skills', 'Experience', 'Contact'];

    for (const link of links) {
      await expect(page.locator('nav').getByRole('link', { name: link })).toBeVisible();
    }
  });
});
