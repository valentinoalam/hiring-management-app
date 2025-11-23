// tests/job-application-error.spec.ts
import { test, expect } from '@playwright/test';
import { loginAndGoToApplication } from './utils/auth-helpers';

test.describe('Job Application Error Scenarios', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/signout');
    await page.waitForTimeout(25000);
  });

  test('should handle job not found or network failure', async ({ page }) => {
    await page.route('**/api/jobs/invalid-job-id', async (route) => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Job not found' }),
      });
    });
    await loginAndGoToApplication(page, 'invalid-job-id');
    
    await expect(page.locator('text=Job Not Found')).toBeVisible({ timeout: 30000 });
    await expect(page.locator('text=The job you\'re looking for doesn\'t exist')).toBeVisible({ timeout: 30000 });
  });

  test('should handle file validation errors', async ({ page }) => {
    // Mock successful page load
    await page.route('**/api/jobs/*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          jobData: { id: '123', title: 'Test Job', company: { name: 'Test Co' } },
          formFields: []
        }),
      });
    });
    await loginAndGoToApplication(page, '123');
    
    // Try to upload invalid file type
    const resumeInput = page.locator('input[id="resume"]');
    await resumeInput.setInputFiles('./e2e/fixtures/invalid-file.txt');
    
    // Verify error message
    await expect(page.getByText('Resume must be PDF or Word document')).toBeVisible({ timeout: 30000 });
  });

  test('should handle form submission failure', async ({ page }) => {
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        console.log('➡️ REQUEST:', request.method(), request.url());
      }
    });

    page.on('response', response => {
      if (response.url().includes('/api/')) {
        console.log('⬅️ RESPONSE:', response.status(), response.url());
      }
    });
    // Mock successful page load
    await page.route('**/api/jobs/*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          jobData: { id: '123', title: 'Test Job', company: { name: 'Test Co' } },
          formFields: []
        }),
      });
    });

    // Mock submission failure with a specific error message
    await page.route('**/api/jobs/*/apply', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ 
          error: 'Internal server error',
          message: 'Failed to submit application' 
        }),
      });
    });

    await loginAndGoToApplication(page, '123');
    await expect(page).toHaveURL(/\/jobs\/123\/apply/);
    // Fill required fields
    console.log('📸 Uploading avatar...');
    // Upload avatar (photo profile) - THIS IS REQUIRED
    const avatarInput = page.locator('input[type="file"][accept*="image"]').first();
    const avatarPath = './e2e/fixtures/test-avatar.png';
    await avatarInput.setInputFiles(avatarPath);
    
    // Wait for avatar preview to appear
    await page.waitForTimeout(1000);
    await page.locator('input[name="full_name"]').fill('Test User');
    await page.locator('input[name="email"]').fill('test@example.com');
    await page.locator('input[type="tel"]').fill('8123456789');
    await page.locator('input[name="date_of_birth"]').fill('1990-01-01');
    await page.locator('input[value="male"]').check();
    await page.locator('input[type="radio"][value="male"]').check();
    const resumeInput = page.locator('input[id="resume"]');
    await resumeInput.setInputFiles('./e2e/fixtures/valentino_cv_1014.pdf');
    await page.locator('button[role="combobox"]:has-text("Pilih domisili...")').click();
    const inputField = page.locator('[placeholder="Cari provinsi, kabupaten, kecamatan, atau desa..."]');
    await inputField.fill("Bekasi Barat");
    await inputField.press("Enter");
    await page.locator('select[name="source"]').selectOption('linkedin');

    console.log('🚀 Clicking submit button...');
    const submit = page.locator('button[type="submit"]:has-text("Submit Application")');
    await submit.isVisible();
    await submit.click();
    await page.waitForTimeout(2000);
    // Check if there are any network errors
    const networkLogs = await page.evaluate(() => {
      return performance.getEntriesByType('resource')
        .filter(entry => entry.name.includes('/api/'))
        .map(entry => ({
          name: entry.name,
          duration: entry.duration,
        }));
    });
    console.log('🌐 Network requests made:', networkLogs);
    // Wait for and verify the error message appears
    const errorVisible = await Promise.race([
      page.waitForSelector('[data-testid="submission-error"]', { timeout: 10000 })
        .then(() => true)
        .catch(() => false),
      page.waitForTimeout(10000).then(() => false)
    ]);
    await expect(page.getByTestId("submission-error")).toBeVisible();

    if (errorVisible) {
      console.log('✅ Error message detected');
      // Take a screenshot for debugging
      await page.screenshot({ path: 'submission-error.png' });
    } else {
      console.log('❌ No error message detected');
      // Check current URL
      console.log('Current URL:', page.url());
      // Check page content
      const content = await page.textContent('body');
      console.log('Page content:', content?.substring(0, 500));
    }
    
    // The test should fail if we were redirected to success page
    await expect(page).not.toHaveURL(/\/success/);
    await expect(page).toHaveURL(/\/jobs\/123\/apply/);
  });
});