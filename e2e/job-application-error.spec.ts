// tests/job-application-error.spec.ts
import { test, expect } from '@playwright/test';
import { loginWithCredentials } from './utils/auth-helpers';

test.describe('Job Application Error Scenarios', () => {
    test.beforeEach(async ({ page }) => {
    await page.goto('/auth/signout');
    await page.waitForTimeout(25000);
    await page.goto('/login')
    await loginWithCredentials(page, 'recruiter1@careerconnect.com', 'password123');
    await page.waitForLoadState('networkidle');
  });

  test('should handle job not found or network failure', async ({ page }) => {
    await page.route('**/api/jobs/invalid-job-id', async (route) => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Job not found' }),
      });
    });

    await page.goto('/jobs/invalid-job-id/apply');
    
    await expect(page.locator('text=Job Not Found')).toBeVisible({ timeout: 30000 });
    await expect(page.locator('text=The job you\'re looking for doesn\'t exist')).toBeVisible({ timeout: 30000 });
  });

  test('should handle file validation errors', async ({ page }) => {
    await page.goto('/jobs');
    await page.locator('text=Apply').click();
    await page.waitForLoadState('networkidle');
    
    // Try to upload invalid file type
    const resumeInput = page.locator('input[id="resume"]');
    await resumeInput.setInputFiles('./tests/fixtures/invalid-file.txt');
    
    // Verify error message
    await expect(page.locator('text=Resume must be PDF or Word document')).toBeVisible({ timeout: 30000 });
  });

  test('should handle form submission failure', async ({ page }) => {
    await page.goto('/jobs');
    await page.locator('text=Apply').click();
    await page.waitForLoadState('networkidle');
    
    // Fill required fields
    await page.locator('input[name="full_name"]').fill('Test User');
    await page.locator('input[name="email"]').fill('test@example.com');
    await page.locator('input[name="phone_number"]').fill('+628123456789');
    await page.locator('input[name="date_of_birth"]').fill('1990-01-01');
    await page.locator('input[value="male"]').check();
    
    const resumeInput = page.locator('input[id="resume"]');
    await resumeInput.setInputFiles('./tests/fixtures/sample-resume.pdf');
    
    await page.locator('select[name="source"]').selectOption('linkedin');
    
    // Submit and verify error handling
    await page.locator('button[type="submit"]').click();
    
    await expect(page.locator('text=Failed to submit application')).toBeVisible({ timeout: 30000 });
  });
});