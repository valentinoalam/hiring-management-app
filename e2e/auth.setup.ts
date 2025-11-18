// tests/auth.setup.ts
import { test as setup, expect } from '@playwright/test';
import { mockUser } from './mocks/job-application-mocks';

const authFile = 'tests/auth-state.json';

setup('authenticate', async ({ page }) => {
  // Go to login page
  await page.goto('/auth/login');
  
  // Mock login API
  await page.route('**/api/auth/login', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user: mockUser,
        token: 'mock-jwt-token'
      }),
    });
  });

  // Fill and submit login form with specific credentials
  await page.locator('input[name="email"]').fill('recruiter1@careerconnect.com');
  await page.locator('input[name="password"]').fill('password123');
  await page.locator('button[type="submit"]').click();

  // Wait for navigation and verify login was successful
  await expect(page).toHaveURL('/jobs');
  
  // Save authentication state for other tests
  await page.context().storageState({ path: authFile });
});