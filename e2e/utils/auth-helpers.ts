// tests/utils/auth-helpers.ts
import { Page, expect } from '@playwright/test';
import { mockUser } from '../mocks/job-application-mocks';

export async function setupAuthenticatedState(page: Page) {
  // Mock Auth.js session endpoint
  await page.route('**/api/auth/session', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user: mockUser,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }),
    });
  });

  // Set localStorage/cookies to simulate Auth.js session
  await page.addInitScript((user) => {
    // Auth.js stores session in localStorage
    localStorage.setItem('next-auth.session-token', 'mock-session-token');
    localStorage.setItem('next-auth.callback-url', '${process.env.NEXT_PUBLIC_APP_URL}/');
    
    // Your app might store user data
    localStorage.setItem('user', JSON.stringify(user));
  }, mockUser);
}
export async function clearAuthentication(page: Page) {
  await page.addInitScript(() => {
    sessionStorage.clear();
    localStorage.clear();
  });
}
export async function loginWithCredentials(page: Page, email: string, password: string) {
  // Fill login form with provided credentials
  const emailInput = page.getByPlaceholder('Enter your email');
  expect(emailInput).toBeVisible({ timeout: 200000 });
  await emailInput.clear({ timeout: 20000 });
  await emailInput.fill(email);
      
  const passwordButton = page.getByRole('button', { name: 'Masuk dengan Password' });
  await passwordButton.click();
  const passwordInput = page.getByPlaceholder('Enter your password');
  await passwordInput.fill(password);
  
  // Submit login
  await page.locator('button[type="submit"]').click();
}

export async function loginAndGoToApplication(page: Page, jobId: string = '123') {

  // Go to login page first
  await page.goto(`/login?callbackUrl=${encodeURIComponent(`/jobs/${jobId}/apply`)}`);
  console.log(page.url())
  // Use specific credentials
  await loginWithCredentials(page, 'recruiter1@careerconnect.com', 'password123');
  await page.waitForLoadState('networkidle');
  // Should redirect to application page
  await expect(page).toHaveURL(new RegExp(`/jobs/${jobId}/apply`));
}

export async function mockAuthJsEndpoints(page: Page) {
  // Mock the Auth.js signin endpoint
  await page.route('**/api/auth/callback/credentials**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        url: `${process.env.NEXT_PUBLIC_APP_URL}/jobs` // Where Auth.js redirects after login
      }),
    });
  });

  // Mock the session endpoint
  await page.route('**/api/auth/session**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user: mockUser,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }),
    });
  });

  // Mock the CSRF token endpoint
  await page.route('**/api/auth/csrf**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ csrfToken: 'mock-csrf-token' }),
    });
  });

  // Mock the providers endpoint if needed
  await page.route('**/api/auth/providers**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        credentials: {
          id: 'credentials',
          name: 'Credentials',
          type: 'credentials',
          signinUrl: '/api/auth/signin/credentials',
          callbackUrl: '/api/auth/callback/credentials'
        }
      }),
    });
  });
}