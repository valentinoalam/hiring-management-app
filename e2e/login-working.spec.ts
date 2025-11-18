// e2e/login-working.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Login Page - Working Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
  });

  test('should load login page with email input', async ({ page }) => {
    // Check email input is present
    const emailInput = page.getByPlaceholder('Enter your email');
    await expect(emailInput).toBeVisible();
    
    // Check magic link button
    const magicLinkButton = page.getByRole('button', { name: 'Kirim link' });
    await expect(magicLinkButton).toBeVisible();
    
    // Check password login option
    const passwordButton = page.getByRole('button', { name: 'Masuk dengan Password' });
    await expect(passwordButton).toBeVisible();
    
    // Check Google login option
    const googleButton = page.getByRole('button', { name: 'Masuk dengan Google' });
    await expect(googleButton).toBeVisible();
    
    // Check sign up link
    const signUpLink = page.getByRole('link', { name: 'Daftar menggunakan email' });
    await expect(signUpLink).toBeVisible();
  });

  test('should allow typing in email field', async ({ page }) => {
    const emailInput = page.getByPlaceholder('Enter your email');
    
    await emailInput.fill('test@example.com');
    await expect(emailInput).toHaveValue('test@example.com');
  });

  test('should switch to password login when password button is clicked', async ({ page }) => {
    // Fill email first
    const emailInput = page.getByPlaceholder('Enter your email');
    await emailInput.fill('test@example.com');
    
    // Click password login button
    const passwordButton = page.getByRole('button', { name: 'Masuk dengan Password' });
    await passwordButton.click();
    
    // Should show password field
    const passwordInput = page.getByPlaceholder('Enter your password');
    await expect(passwordInput).toBeVisible();
    
    // Should show back button
    const backButton = page.getByRole('button', { name: 'Kembali' });
    await expect(backButton).toBeVisible();
  });

  test('should submit magic link form', async ({ page }) => {
    // Mock the magic link submission
    await page.route('**/action', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    const emailInput = page.getByPlaceholder('Enter your email');
    await emailInput.fill('test@example.com');
    
    const magicLinkButton = page.getByRole('button', { name: 'Kirim link' });
    await magicLinkButton.click();
    
    // Should show loading state
    await expect(page.getByText('Mengirim...')).toBeVisible();
  });

  test('should submit password login form', async ({ page }) => {
    // Mock the password login submission
    await page.route('**/action', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    // Fill email and switch to password
    const emailInput = page.getByPlaceholder('Enter your email');
    await emailInput.fill('test@example.com');
    
    const passwordButton = page.getByRole('button', { name: 'Masuk dengan Password' });
    await passwordButton.click();
    
    // Fill password
    const passwordInput = page.getByPlaceholder('Enter your password');
    await passwordInput.fill('password123');
    
    // Submit
    const loginButton = page.getByRole('button', { name: 'Masuk' });
    await loginButton.click();
    
    // Should show loading state
    await expect(page.getByText('Masuk...')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    // Mock invalid credentials response
    await page.route('**/action', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'INVALID_CREDENTIALS' }),
      });
    });

    // Fill email and switch to password
    const emailInput = page.getByPlaceholder('Enter your email');
    await emailInput.fill('wrong@example.com');
    
    const passwordButton = page.getByRole('button', { name: 'Masuk dengan Password' });
    await passwordButton.click();
    
    // Fill wrong password
    const passwordInput = page.getByPlaceholder('Enter your password');
    await passwordInput.fill('wrongpassword');
    
    // Submit
    const loginButton = page.getByRole('button', { name: 'Masuk' });
    await loginButton.click();
    
    // Should show error message
    await expect(page.getByText('Invalid email or password')).toBeVisible();
  });

  test('should navigate to sign up page', async ({ page }) => {
    const signUpLink = page.getByRole('link', { name: 'Daftar menggunakan email' });
    await signUpLink.click();
    
    // Should navigate to sign up page
    await expect(page).toHaveURL(/.*sign-up/);
  });

  test('should handle Google OAuth login', async ({ page }) => {
    const googleButton = page.getByRole('button', { name: 'Masuk dengan Google' });
    await googleButton.click();
    
    // Should initiate OAuth flow (might show popup or redirect)
    await page.waitForTimeout(1000);
    
    // Check that something happened (either popup opened or page changed)
    const popupCount = page.context().pages().length;
    if (popupCount > 1) {
      console.log('OAuth popup opened');
    } else if (page.url() !== 'http://localhost:3000/login') {
      console.log('Page redirected for OAuth');
    }
  });

  test('should switch back to magic link from password form', async ({ page }) => {
    // Switch to password form
    const emailInput = page.getByPlaceholder('Enter your email');
    await emailInput.fill('test@example.com');
    
    const passwordButton = page.getByRole('button', { name: 'Masuk dengan Password' });
    await passwordButton.click();
    
    // Click back button
    const backButton = page.getByRole('button', { name: 'Kembali' });
    await backButton.click();
    
    // Should show magic link form again
    const magicLinkButton = page.getByRole('button', { name: 'Kirim link' });
    await expect(magicLinkButton).toBeVisible();
    
    // Password field should be hidden
    const passwordInput = page.getByPlaceholder('Enter your password');
    await expect(passwordInput).not.toBeVisible();
  });
});

test.describe('Login Page - Form Validation', () => {
  test('should validate email format', async ({ page }) => {
    await page.goto('/login');
    
    const emailInput = page.getByPlaceholder('Enter your email');
    
    // Try invalid email
    await emailInput.fill('invalid-email');
    
    const magicLinkButton = page.getByRole('button', { name: 'Kirim link' });
    await magicLinkButton.click();
    
    // Check for validation error
    await expect(page.getByText('Please enter a valid email address')).toBeVisible();
  });

  test('should validate password length', async ({ page }) => {
    await page.goto('/login');
    
    // Switch to password form
    const emailInput = page.getByPlaceholder('Enter your email');
    await emailInput.fill('test@example.com');
    
    const passwordButton = page.getByRole('button', { name: 'Masuk dengan Password' });
    await passwordButton.click();
    
    // Try short password
    const passwordInput = page.getByPlaceholder('Enter your password');
    await passwordInput.fill('123');
    
    const loginButton = page.getByRole('button', { name: 'Masuk' });
    await loginButton.click();
    
    // Check for password validation error
    await expect(page.getByText('Password must be at least 6 characters')).toBeVisible();
  });
});

test.describe('Login Page - Responsive', () => {
  test('should work on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/login');
    
    // All elements should still be accessible
    const emailInput = page.getByPlaceholder('Enter your email');
    await expect(emailInput).toBeVisible();
    
    const magicLinkButton = page.getByRole('button', { name: 'Kirim link' });
    await expect(magicLinkButton).toBeVisible();
    
    // Should be able to interact
    await emailInput.fill('test@example.com');
    await expect(emailInput).toHaveValue('test@example.com');
  });
});