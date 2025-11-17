// tests/job-application-error.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Job Application Error Scenarios', () => {
  test('should handle job not found', async ({ page }) => {
    await page.route('**/api/jobs/invalid-job-id', async (route) => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Job not found' }),
      });
    });

    await page.goto('/jobs/invalid-job-id/apply');
    
    await expect(page.locator('text=Job Not Found')).toBeVisible();
    await expect(page.locator('text=The job you\'re looking for doesn\'t exist')).toBeVisible();
  });

  test('should handle network failure', async ({ page }) => {
    await page.route('**/api/jobs/*', async (route) => {
      await route.abort();
    });

    await page.goto('/jobs/123/apply');
    
    await expect(page.locator('text=Error Loading Application Data')).toBeVisible();
  });

  test('should handle file validation errors', async ({ page }) => {
    // Mock successful page load
    await page.route('**/api/jobs/*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          jobData: { id: 'job-123', title: 'Test Job', company: { name: 'Test Co' } },
          formFields: []
        }),
      });
    });

    await page.goto('/jobs/123/apply');
    
    // Try to upload invalid file type
    const resumeInput = page.locator('input[id="resume"]');
    await resumeInput.setInputFiles('./tests/fixtures/invalid-file.txt');
    
    // Verify error message
    await expect(page.locator('text=Resume must be PDF or Word document')).toBeVisible();
  });

  test('should handle form submission failure', async ({ page }) => {
    // Mock successful page load
    await page.route('**/api/jobs/*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          jobData: { id: 'job-123', title: 'Test Job', company: { name: 'Test Co' } },
          formFields: []
        }),
      });
    });

    // Mock submission failure
    await page.route('**/api/jobs/*/apply', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    });

    await page.goto('/jobs/123/apply');
    
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
    
    await expect(page.locator('text=Failed to submit application')).toBeVisible();
  });
});