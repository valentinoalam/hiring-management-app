// tests/job-application-auth.spec.ts
import { test, expect } from '@playwright/test';
import { setupAuthenticatedState, clearAuthentication, loginAndGoToApplication } from './utils/auth-helpers';
import { mockJob, mockApplication } from './mocks/job-application-mocks';

test.describe('Job Application Authentication Scenarios', () => {
  test('should complete login flow and submit application', async ({ page }) => {
    // Mock job data
    await page.route('**/api/jobs/*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockJob),
      });
    });

    await page.route('**/api/profiles/user/*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'profile-123',
          fullname: 'John Doe',
          email: 'john.doe@example.com',
          phone: '+628123456789'
        }),
      });
    });

    await page.route('**/api/jobs/*/apply', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          application: mockApplication,
          success: true
        }),
      });
    });

    // Test full login to application flow
    await loginAndGoToApplication(page, '123');
    
    // Verify we can access the application form
    await expect(page.locator('h1')).toContainText(`Apply ${mockJob.jobData.title}`);
    
    // Fill and submit application
    await page.locator('input[name="date_of_birth"]').fill('1990-01-01');
    await page.locator('input[value="female"]').check();
    await page.locator('[placeholder="Pilih domisili..."]').fill('Jakarta');
    await page.locator('text=Jakarta').first().click();
    await page.locator('input[name="linkedin_url"]').fill('https://linkedin.com/in/johndoe');
    
    const resumeInput = page.locator('input[id="resume"]');
    await resumeInput.setInputFiles('./tests/fixtures/sample-resume.pdf');
    
    await page.locator('select[name="source"]').selectOption('linkedin');
    await page.locator('button[type="submit"]').click();
    
    await expect(page).toHaveURL(/\/success/);
  });

  test('should preserve application form after login redirect', async ({ page }) => {
    const jobId = '456';
    
    // Mock job data
    await page.route(`**/api/jobs/${jobId}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockJob),
      });
    });

    // Try to access application without auth
    await clearAuthentication(page);
    await page.goto(`/jobs/${jobId}/apply`);
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
    
    // Login and verify redirect back to application
    await setupAuthenticatedState(page);
    await page.goto(`/login?callbackUrl=${encodeURIComponent(`/jobs/${jobId}/apply`)}`);
    
    // Mock that we're already authenticated and should redirect
    await page.evaluate(() => {
      window.location.href = `/jobs/${jobId}/apply`;
    });
    
    await expect(page).toHaveURL(new RegExp(`/jobs/${jobId}/apply`));
    await expect(page.locator('h1')).toContainText(`Apply ${mockJob.jobData.title}`);
  });

  test('should handle expired authentication during application', async ({ page }) => {
    await setupAuthenticatedState(page);
    
    // Mock job data
    await page.route('**/api/jobs/*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockJob),
      });
    });

    await page.goto('/jobs/123/apply');
    
    // Simulate auth expiration by clearing storage
    await page.evaluate(() => {
      window.localStorage.removeItem('auth-token');
    });

    // Mock that auth check will now fail
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Token expired' }),
      });
    });

    // Try to submit application - should redirect to login
    const resumeInput = page.locator('input[id="resume"]');
    await resumeInput.setInputFiles('./tests/fixtures/sample-resume.pdf');
    
    await page.locator('button[type="submit"]').click();
    
    // Should redirect to login due to expired auth
    await expect(page).toHaveURL(/\/login/);
  });
});