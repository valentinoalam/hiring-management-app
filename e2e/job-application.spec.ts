// tests/job-application.spec.ts
import { test, expect, Page } from '@playwright/test';
import { mockUser, mockJob, mockApplication } from './mocks/job-application-mocks';
import { setupAuthenticatedState, clearAuthentication, loginWithCredentials } from './utils/auth-helpers';

test.describe('Job Application Flow', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    
    // Setup authenticated state for most tests
    await setupAuthenticatedState(page);

    // Mock API responses
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
        body: JSON.stringify(mockUser.profile),
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
  });

  test('should redirect to login when not authenticated', async () => {
    // Clear authentication for this test
    await page.goto('/auth/signout');
    await page.waitForLoadState('networkidle');
    await page.goto('/jobs/123/apply');
    
    // Should redirect to login page
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('text=Masuk ke Rakamin')).toBeVisible();
    
    // Check that redirect parameter is preserved
    const url = page.url();
    expect(url).toContain('callbackUrl=');
    expect(url).toContain(encodeURIComponent('/jobs/123/apply'));
  });

  test('should login with specific credentials and access application', async () => {
    await page.goto('/auth/signout');
    await page.waitForLoadState('networkidle');
    
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

    // Go directly to application page (should redirect to login)
    await page.goto('/jobs/123/apply');
    
    // Verify we're on login page
    await expect(page).toHaveURL(/\/login/);
    
    // Login with specific credentials
    await loginWithCredentials(page, 'recruiter1@careerconnect.com', 'password123');
    
    // Should redirect back to application page after login
    await expect(page).toHaveURL(/\/jobs\/123\/apply/);
    await expect(page.locator('h1')).toContainText(`Apply ${mockJob.jobData.title}`);
  });

  test('should load job application form when authenticated', async () => {
    await page.goto('/jobs/123/apply');
    
    // Verify we're on the application page (not redirected)
    await expect(page).toHaveURL(/\/jobs\/123\/apply/);
    await expect(page.locator('h1')).toContainText(`Apply ${mockJob.jobData.title}`);
    await expect(page.locator('text=Required')).toBeVisible();
  });

  test('should submit application with required fields when authenticated', async () => {
    await page.goto('/jobs/123/apply');
    
    // Fill required fields that might not be pre-filled
    await page.locator('input[name="date_of_birth"]').fill('1990-01-01');
    
    // Select gender
    await page.locator('input[value="female"]').check();
    
    // Fill domicile
    await page.locator('[placeholder="Pilih domisili..."]').fill('Jakarta');
    await page.locator('text=Jakarta').first().click();
    
    // Fill LinkedIn URL
    await page.locator('input[name="linkedin_url"]').fill('https://linkedin.com/in/johndoe');
    await fillRequiredFields(page)
    // Upload resume
    const resumeInput = page.locator('input[id="resume"]');
    await resumeInput.setInputFiles('./tests/fixtures/sample-resume.pdf');
    
    // Select source
    await page.locator('select[name="source"]').selectOption('linkedin');
    
    // Submit application
    await page.locator('button[type="submit"]:has-text("Submit Application")').click();
    
    // Verify success redirect
    await expect(page).toHaveURL(/\/success/);
    await expect(page.locator('text=Application submitted successfully')).toBeVisible();
  });

  test('should show validation errors for missing required fields', async () => {
    await page.goto('/jobs/123/apply');
    
    // Clear pre-filled required fields
    await page.locator('input[name="full_name"]').fill('');
    await page.locator('input[name="email"]').fill('');
    
    // Try to submit
    await page.locator('button[type="submit"]:has-text("Submit Application")').click();
    
    // Verify validation errors
    await expect(page.locator('text=Full Name is required')).toBeVisible();
    await expect(page.locator('text=Email is required')).toBeVisible();
    await expect(page.locator('text=Resume is required')).toBeVisible();
  });

  test('should handle invalid login credentials', async () => {
    await clearAuthentication(page);
    
    // Mock login API to return error for invalid credentials
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Invalid credentials' }),
      });
    });

    await page.goto('/auth/login?callbackUrl=/jobs/123/apply');
    
    // Try to login with wrong password
    await loginWithCredentials(page, 'recruiter1@careerconnect.com', 'wrongpassword');
    
    // Should stay on login page and show error
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('text=Invalid credentials')).toBeVisible();
  });
});

// Helper function to fill required fields
async function fillRequiredFields(page: Page) {
  await page.locator('input[name="date_of_birth"]').fill('1990-01-01');
  await page.locator('input[value="female"]').check();
  await page.locator('[placeholder="Pilih domisili..."]').fill('Jakarta');
  await page.locator('text=Jakarta').first().click();
  await page.locator('input[name="linkedin_url"]').fill('https://linkedin.com/in/johndoe');
  
  const resumeInput = page.locator('input[id="resume"]');
  await resumeInput.setInputFiles('./tests/fixtures/valentino_cv_1014.pdf');
  
  await page.locator('select[name="source"]').selectOption('linkedin');
}