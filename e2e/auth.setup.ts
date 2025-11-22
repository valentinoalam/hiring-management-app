// tests/auth.setup.ts
import { test as setup, expect } from '@playwright/test';
import { loginWithCredentials, mockAuthJsEndpoints } from './utils/auth-helpers.js';

const authFile = 'tests/auth-state.json';

setup('authenticate', async ({ page }) => {
  // Mock the login API for this setup
  await mockAuthJsEndpoints(page);

  // Go to login page
  await page.goto('/login');

  // Use the helper to login with specific credentials
  await loginWithCredentials(page, 'recruiter1@careerconnect.com', 'password123');

  // Wait for navigation and verify login was successful
  await expect(page).toHaveURL('/jobs');
  
  // Save authentication state for other tests
  await page.context().storageState({ path: authFile });
});