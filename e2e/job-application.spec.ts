// tests/job-application.spec.ts
import { test, expect, Page } from '@playwright/test';
import { mockUser, mockJob, mockApplication } from './mocks/job-application-mocks';

test.describe('Job Application Flow', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    
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

    // Navigate to job application page
    await page.goto('/jobs/123/apply');
  });

  test('should load job application form successfully', async () => {
    // Verify page title and job info
    await expect(page.locator('h1')).toContainText(`Apply ${mockJob.jobData.title}`);
    await expect(page.locator('text=Required')).toBeVisible();
    
    // Verify form sections are present
    await expect(page.locator('text=Photo Profile')).toBeVisible();
    await expect(page.locator('text=Full Name')).toBeVisible();
    await expect(page.locator('text=Email')).toBeVisible();
    await expect(page.locator('text=Resume')).toBeVisible();
  });

  test('should pre-fill user profile data', async () => {
    // Verify profile data is pre-filled
    await expect(page.locator('input[name="full_name"]')).toHaveValue(mockUser.profile.fullname);
    await expect(page.locator('input[name="email"]')).toHaveValue(mockUser.profile.email);
    await expect(page.locator('input[name="phone_number"]')).toHaveValue(mockUser.profile.phone);
  });

  test('should submit application with required fields', async () => {
    // Fill required fields that might not be pre-filled
    await page.locator('input[name="date_of_birth"]').fill('1990-01-01');
    
    // Select gender
    await page.locator('input[value="female"]').check();
    
    // Fill domicile
    await page.locator('[placeholder="Pilih domisili..."]').fill('Jakarta');
    await page.locator('text=Jakarta').first().click();
    
    // Fill LinkedIn URL
    await page.locator('input[name="linkedin_url"]').fill('https://linkedin.com/in/johndoe');
    
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

  test('should handle cover letter in text mode', async () => {
    // Select text mode for cover letter
    await page.locator('input[value="text"]').check();
    
    // Fill cover letter
    const coverLetterText = 'I am excited to apply for this position...';
    await page.locator('textarea[name="coverLetter"]').fill(coverLetterText);
    
    // Fill other required fields
    await fillRequiredFields(page);
    
    // Submit
    await page.locator('button[type="submit"]').click();
    
    await expect(page).toHaveURL(/\/success/);
  });

  test('should handle cover letter in file mode', async () => {
    // Select file mode for cover letter
    await page.locator('input[value="file"]').check();
    
    // Upload cover letter file
    const coverLetterInput = page.locator('input[id="coverLetterFile"]');
    await coverLetterInput.setInputFiles('./tests/fixtures/cover-letter.pdf');
    
    // Fill other required fields
    await fillRequiredFields(page);
    
    // Submit
    await page.locator('button[type="submit"]').click();
    
    await expect(page).toHaveURL(/\/success/);
  });

  test('should handle photo capture', async () => {
    // Mock the gesture capture component
    await page.route('**/api/capture-photo', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ imageUrl: 'data:image/jpeg;base64,mock-image-data' }),
      });
    });

    // Click take picture button
    await page.locator('button:has-text("Take a Picture")').click();
    
    // Verify gesture capture is shown
    await expect(page.locator('text=Gesture Profile Capture')).toBeVisible();
    
    // Mock saving the photo
    await page.locator('button:has-text("Save Photo")').click();
    
    // Verify we're back to form and photo is updated
    await expect(page.locator('img[alt="avatar"]')).toHaveAttribute('src', /data:image/);
  });

  test('should cancel and go back', async () => {
    // Click back button
    await page.locator('button[aria-label="Go back"]').click();
    
    // Verify navigation back
    await expect(page).toHaveURL(/\/jobs/);
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
  await resumeInput.setInputFiles('./tests/fixtures/sample-resume.pdf');
  
  await page.locator('select[name="source"]').selectOption('linkedin');
}