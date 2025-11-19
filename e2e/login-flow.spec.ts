// tests/login-flow.spec.ts
import { test, expect } from '@playwright/test';
import { clearAuthentication, loginWithCredentials } from './utils/auth-helpers';


test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthentication(page);
    
  });

  test('should login successfully with correct credentials', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await loginWithCredentials(page, 'recruiter1@careerconnect.com', 'password123');
    await page.waitForLoadState('networkidle');
    // Should redirect to jobs page or intended destination
    await expect(page).not.toHaveURL(/\/login/);
    // await expect(page.locator('text=Welcome')).toBeVisible();
  });

  test('should show error for incorrect password', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await loginWithCredentials(page, 'recruiter1@careerconnect.com', 'wrongpassword');
    await page.waitForLoadState('networkidle');
    // Should stay on login page and show error
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText('Invalid email or password')).toBeVisible();
  });

  test('should show error for non-existent email', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await loginWithCredentials(page, 'nonexistent@careerconnect.com', 'password123');
    await page.waitForLoadState('networkidle');
    // Should stay on login page and show error
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText('Invalid email or password')).toBeVisible();
  });

  test('should preserve redirect URL after login', async ({ page }) => {
    const jobId = '123';
    const redirectUrl = `/jobs/${jobId}/apply`;
    
    // Mock successful login


    // Mock job data
    await page.route(`**/api/jobs/${jobId}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          jobData: { id: jobId, title: 'Test Job', company: { name: 'Test Co' } },
          formFields: []
        }),
      });
    });

    await page.goto(`/login?redirect=${encodeURIComponent(redirectUrl)}`);
    await page.waitForLoadState('networkidle');
    await loginWithCredentials(page, 'recruiter1@careerconnect.com', 'password123');
    await page.waitForLoadState('networkidle');
    // Should redirect to the intended application page
    await expect(page).toHaveURL(new RegExp(redirectUrl));
  });

  test('should validate login form fields', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    // Try to submit empty form
    await page.locator('button[type="submit"]').click();
    
    // Should show validation errors
    await expect(page.locator('text=Email is required')).toBeVisible();
    await expect(page.locator('text=Password is required')).toBeVisible();
    
    // Try with invalid email
    await page.locator('input[name="email"]').fill('invalid-email');
    await page.locator('input[name="password"]').fill('password123');
    await page.locator('button[type="submit"]').click();
    
    // Should show email validation error
    await expect(page.locator('text=Please enter a valid email')).toBeVisible();
  });
});