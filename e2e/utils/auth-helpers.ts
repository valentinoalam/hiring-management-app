// tests/utils/auth-helpers.ts
import { Page, expect } from '@playwright/test';
import { mockUser } from '../mocks/job-application-mocks';

export async function setupAuthenticatedState(page: Page) {
  // Set auth state in localStorage
  await page.addInitScript((user) => {
    window.localStorage.setItem('auth-token', 'mock-jwt-token');
    window.localStorage.setItem('user', JSON.stringify(user));
  }, mockUser);

  // Mock auth API
  await page.route('**/api/auth/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockUser),
    });
  });
}

export async function clearAuthentication(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
}

export async function loginWithCredentials(page: Page, email: string, password: string) {
  // Fill login form with provided credentials
  const emailInput = page.getByPlaceholder('Enter your email');
  await emailInput.clear({ timeout: 20000 });
  await emailInput.fill(email);
  const passwordInput = page.getByPlaceholder('Enter your password');
  await passwordInput.fill(password);
  
  // Submit login
  await page.locator('button[type="submit"]').click();
}

export async function loginAndGoToApplication(page: Page, jobId: string = '123') {
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

  // Go to login page first
  await page.goto(`/auth/login?redirect=${encodeURIComponent(`/jobs/${jobId}/apply`)}`);
  
  // Use specific credentials
  await loginWithCredentials(page, 'recruiter1@careerconnect.com', 'password123');
  
  // Should redirect to application page
  await expect(page).toHaveURL(new RegExp(`/jobs/${jobId}/apply`));
}