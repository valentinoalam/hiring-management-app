// tests/login-flow.spec.ts
import { test, expect } from '@playwright/test';
import { clearAuthentication, loginWithCredentials } from './utils/auth-helpers';
// import { signIn } from '@/auth';

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthentication(page);
  });

  test('should login successfully with correct credentials', async ({ page }) => {
    await page.goto('/login');
    
    await loginWithCredentials(page, 'recruiter1@careerconnect.com', 'password123');
    
    // Should redirect to jobs page or intended destination
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.locator('text=Welcome')).toBeVisible();
  });

  test('should show error for incorrect password', async ({ page }) => {
    await page.goto('/login');
    
    await loginWithCredentials(page, 'recruiter1@careerconnect.com', 'wrongpassword');
    
    // Should stay on login page and show error
    await expect(page).toHaveURL(/\/auth\/login/);
    await expect(page.locator('text=Invalid email or password')).toBeVisible();
  });

  test('should show error for non-existent email', async ({ page }) => {
    await page.goto('/login');
    
    await loginWithCredentials(page, 'nonexistent@careerconnect.com', 'password123');
    
    // Should stay on login page and show error
    await expect(page).toHaveURL(/\/auth\/login/);
    await expect(page.locator('text=User not found')).toBeVisible();
  });

  test('should preserve redirect URL after login', async ({ page }) => {
    const jobId = '123';
    const redirectUrl = `/jobs/${jobId}/apply`;
    
    // Mock successful login
    // await signIn("credentials", {
    //   email: "recruiter1@careerconnect.com",
    //   password: "password123",
    // })

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
    
    await loginWithCredentials(page, 'recruiter1@careerconnect.com', 'password123');
    
    // Should redirect to the intended application page
    await expect(page).toHaveURL(new RegExp(redirectUrl));
  });

  test('should validate login form fields', async ({ page }) => {
    await page.goto('/login');
    
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