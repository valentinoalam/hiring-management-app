// e2e/job-creation.spec.ts
import { test, expect, Page } from '@playwright/test';

// Helper function to login
async function login(page: Page, email = 'recruiter@example.com', password = 'password') {
  await page.goto('/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/dashboard'); // Adjust based on your app
}

// Helper to create a company first if needed
async function ensureCompanyExists(page: Page) {
  // Navigate to companies page and check if we have at least one company
  await page.goto('/companies');
  
  // Check if company list is empty
  const noCompaniesMessage = page.getByText('No companies found');
  if (await noCompaniesMessage.isVisible()) {
    // Create a test company
    await page.click('button:has-text("Add Company")');
    await page.fill('input[name="name"]', 'Test Company Inc');
    await page.fill('input[name="website"]', 'https://test-company.com');
    await page.fill('textarea[name="description"]', 'A test company for E2E testing');
    await page.click('button:has-text("Create Company")');
    
    // Wait for company to be created and redirect
    await page.waitForURL('/companies');
  }
}

test.describe('Job Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await login(page);
    await ensureCompanyExists(page);
  });

  test('should create a new job successfully', async ({ page }) => {
    // Navigate to jobs page
    await page.goto('/jobs');
    
    // Click create job button
    await page.click('button:has-text("Create Job")');
    
    // Wait for job creation modal to open
    await expect(page.getByRole('dialog').getByText('Job Opening')).toBeVisible();

    // Fill basic job information
    await page.fill('input[id="job-title"]', 'Senior Frontend Developer - E2E Test');
    await page.selectOption('select[id="employment-type"]', 'FULL_TIME');
    await page.selectOption('select[id="remote-policy"]', 'hybrid');
    await page.fill('input[id="location"]', 'Jakarta, Indonesia');
    await page.fill('input[id="department"]', 'Engineering');
    await page.selectOption('select[id="experience-level"]', 'senior');
    await page.selectOption('select[id="education-level"]', 'bachelor');

    // Fill job description
    await page.fill('textarea[id="job-description"]', 'We are looking for a skilled Senior Frontend Developer to join our team. Responsibilities include:\n\n- Developing responsive web applications\n- Collaborating with design and backend teams\n- Writing clean, maintainable code\n- Mentoring junior developers\n\nRequirements:\n- 5+ years of experience with React\n- Strong JavaScript/TypeScript skills\n- Experience with modern frontend tools');

    // Fill candidate requirements
    await page.fill('input[id="number-of-candidates"]', '3');

    // Fill salary information
    await page.fill('input[id="min-salary"]', '15000000');
    await page.fill('input[id="max-salary"]', '20000000');
    await page.fill('input[id="salary-display"]', 'Competitive salary based on experience');

    // Configure application form fields (set some fields to optional)
    const formFields = page.locator('[data-testid="form-field-config"]').first();
    
    // Set "Photo Profile" to optional
    const photoProfileField = page.locator('text=Photo Profile').locator('..');
    await photoProfileField.getByText('Optional').click();
    
    // Set "LinkedIn URL" to optional  
    const linkedinField = page.locator('text=LinkedIn URL').locator('..');
    await linkedinField.getByText('Optional').click();

    // Submit the form
    await page.click('button[type="submit"]:has-text("Publish Job")');

    // Verify success - wait for either success message or redirect
    try {
      // Option 1: Check for success toast/notification
      await expect(page.locator('[data-testid="toast-success"]').first()).toBeVisible({ timeout: 10000 });
    } catch {
      // Option 2: Check if redirected to jobs list with new job visible
      await page.waitForURL('/jobs');
      await expect(page.getByText('Senior Frontend Developer - E2E Test')).toBeVisible();
    }

    // Verify job details in the list or detail page
    await page.goto('/jobs');
    await expect(page.getByText('Senior Frontend Developer - E2E Test')).toBeVisible();
    await expect(page.getByText('Hybrid')).toBeVisible();
    await expect(page.getByText('Jakarta, Indonesia')).toBeVisible();
  });

  test('should show validation errors for required fields', async ({ page }) => {
    await page.goto('/jobs');
    await page.click('button:has-text("Create Job")');
    
    // Try to submit empty form
    await page.click('button[type="submit"]:has-text("Publish Job")');
    
    // Check for validation errors
    await expect(page.getByText('Job title is required')).toBeVisible();
    await expect(page.getByText('Job description is required')).toBeVisible();
    await expect(page.getByText('Number of candidates is required')).toBeVisible();

    // Fill only required fields
    await page.fill('input[id="job-title"]', 'Test Job');
    await page.fill('textarea[id="job-description"]', 'Test description');
    await page.fill('input[id="number-of-candidates"]', '1');

    // Check if submit button becomes enabled
    const submitButton = page.locator('button[type="submit"]:has-text("Publish Job")');
    await expect(submitButton).not.toBeDisabled();
  });

  test('should create job with custom form fields', async ({ page }) => {
    await page.goto('/jobs');
    await page.click('button:has-text("Create Job")');

    // Fill basic job info
    await page.fill('input[id="job-title"]', 'Job with Custom Fields');
    await page.fill('textarea[id="job-description"]', 'Job description');
    await page.fill('input[id="number-of-candidates"]', '2');

    // Add a custom field
    await page.click('button:has-text("Add Custom Field")');
    
    await page.fill('input[placeholder="e.g., years_experience"]', 'years_experience');
    await page.fill('input[placeholder="e.g., Years of Experience"]', 'Years of Experience');
    await page.selectOption('select', 'number'); // Select field type
    
    await page.click('button:has-text("Add Field")');

    // Verify custom field was added
    await expect(page.getByText('Years of Experience')).toBeVisible();
    await expect(page.getByText('Custom')).toBeVisible();

    // Set custom field to mandatory
    const customField = page.locator('text=Years of Experience').locator('..');
    await customField.getByText('Required').click();

    // Submit the job
    await page.click('button[type="submit"]:has-text("Publish Job")');

    // Verify success
    await expect(page.locator('[data-testid="toast-success"]').first()).toBeVisible({ timeout: 10000 });
  });

  test('should reorder form fields using drag and drop', async ({ page }) => {
    await page.goto('/jobs');
    await page.click('button:has-text("Create Job")');

    // Fill basic info
    await page.fill('input[id="job-title"]', 'Job with Reordered Fields');
    await page.fill('textarea[id="job-description"]', 'Job description');
    await page.fill('input[id="number-of-candidates"]', '1');

    // Get initial order
    const fields = page.locator('[data-testid="sortable-field"]');
    const initialFirstField = await fields.nth(0).textContent();
    
    // Perform drag and drop (this might need adjustment based on your DnD implementation)
    const firstField = fields.nth(0);
    const thirdField = fields.nth(2);
    
    // Drag first field to third position
    await firstField.hover();
    await page.mouse.down();
    await thirdField.hover();
    await page.mouse.up();

    // Verify order changed (you might need to add visual indicators in your app)
    // This is a basic check - you might want to add data attributes for better testing
    const newFirstField = await fields.nth(0).textContent();
    expect(newFirstField).not.toBe(initialFirstField);
  });

  test('should save job as draft', async ({ page }) => {
    await page.goto('/jobs');
    await page.click('button:has-text("Create Job")');

    // Fill basic info
    await page.fill('input[id="job-title"]', 'Draft Job - E2E Test');
    await page.fill('textarea[id="job-description"]', 'This is a draft job');
    await page.fill('input[id="number-of-candidates"]', '1');

    // Look for draft button (you might need to add this to your UI)
    const draftButton = page.locator('button:has-text("Save Draft")');
    
    if (await draftButton.isVisible()) {
      await draftButton.click();
      
      // Verify draft was saved
      await expect(page.locator('[data-testid="toast-success"]')).toContainText('draft', { ignoreCase: true });
      
      // Navigate to drafts section
      await page.goto('/jobs?status=draft');
      await expect(page.getByText('Draft Job - E2E Test')).toBeVisible();
    }
  });
});

test.describe('Job Creation Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await ensureCompanyExists(page);
  });

  test('should handle duplicate job titles gracefully', async ({ page }) => {
    // Create first job
    await page.goto('/jobs');
    await page.click('button:has-text("Create Job")');
    await page.fill('input[id="job-title"]', 'Duplicate Job Title');
    await page.fill('textarea[id="job-description"]', 'First job description');
    await page.fill('input[id="number-of-candidates"]', '1');
    await page.click('button[type="submit"]:has-text("Publish Job")');
    await expect(page.locator('[data-testid="toast-success"]')).toBeVisible();

    // Try to create duplicate
    await page.click('button:has-text("Create Job")');
    await page.fill('input[id="job-title"]', 'Duplicate Job Title');
    await page.fill('textarea[id="job-description"]', 'Second job description');
    await page.fill('input[id="number-of-candidates"]', '1');
    await page.click('button[type="submit"]:has-text("Publish Job")');

    // Should show error for duplicate title
    await expect(page.getByText(/already exists|duplicate/i)).toBeVisible();
  });

  test('should handle very long input fields', async ({ page }) => {
    await page.goto('/jobs');
    await page.click('button:has-text("Create Job")');

    const longText = 'A'.repeat(1000);
    await page.fill('input[id="job-title"]', longText);
    await page.fill('textarea[id="job-description"]', longText.repeat(10)); // Very long description
    
    await page.fill('input[id="number-of-candidates"]', '1');
    await page.click('button[type="submit"]:has-text("Publish Job")');

    // Should handle long inputs without crashing
    await expect(page.locator('[data-testid="toast-success"]').or(page.getByText(/error/i))).toBeVisible();
  });
});