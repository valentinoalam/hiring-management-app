import { test, expect } from '@playwright/test';

test.describe('Sign In Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to sign in page before each test
    await page.goto('/sign-in');
  });

  test('should load the sign in page successfully', async ({ page }) => {
    // Check page title and basic elements
    await expect(page).toHaveTitle(/Sign In|Masuk/);
    await expect(page.getByRole('heading', { name: /Masuk ke Rakamin/i })).toBeVisible();
    await expect(page.getByText(/Belum punya akun?/)).toBeVisible();
    
    // Check logo is present
    await expect(page.locator('svg').first()).toBeVisible();
  });

  test('should display magic link form by default', async ({ page }) => {
    // Email input should be visible
    await expect(page.getByLabel(/Alamat email/i)).toBeVisible();
    
    // Magic link button should be visible
    await expect(page.getByRole('button', { name: /Kirim link ajaib/i })).toBeVisible();
    
    // Password field should not be visible initially
    await expect(page.getByLabel(/Password/i)).not.toBeVisible();
  });

  test('should validate email format in magic link form', async ({ page }) => {
    // Test invalid email
    await page.getByLabel(/Alamat email/i).fill('invalid-email');
    await page.getByRole('button', { name: /Kirim link ajaib/i }).click();
    
    // Should show validation error
    await expect(page.getByText(/Please enter a valid email address/i)).toBeVisible();
    
    // Test valid email
    await page.getByLabel(/Alamat email/i).fill('test@example.com');
    await expect(page.getByText(/Please enter a valid email address/i)).not.toBeVisible();
  });

  test('should switch to password login when email is valid', async ({ page }) => {
    // Fill valid email
    await page.getByLabel(/Alamat email/i).fill('test@example.com');
    
    // "Masuk dengan Password" button should appear
    await expect(page.getByRole('button', { name: /Masuk dengan Password/i })).toBeVisible();
    
    // Click to switch to password login
    await page.getByRole('button', { name: /Masuk dengan Password/i }).click();
    
    // Should show password field and email display
    await expect(page.getByLabel(/Password/i)).toBeVisible();
    await expect(page.getByText('test@example.com')).toBeVisible();
    
    // Should show back button and login button
    await expect(page.getByRole('button', { name: /Kembali/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Masuk/i })).toBeVisible();
  });

  test('should allow editing email in password mode', async ({ page }) => {
    // Switch to password mode
    await page.getByLabel(/Alamat email/i).fill('test@example.com');
    await page.getByRole('button', { name: /Masuk dengan Password/i }).click();
    
    // Click edit email button
    await page.getByRole('button', { name: /Ubah/i }).click();
    
    // Should switch back to magic link form with email preserved
    await expect(page.getByLabel(/Alamat email/i)).toHaveValue('test@example.com');
    await expect(page.getByLabel(/Password/i)).not.toBeVisible();
  });

  test('should validate password field', async ({ page }) => {
    // Switch to password mode
    await page.getByLabel(/Alamat email/i).fill('test@example.com');
    await page.getByRole('button', { name: /Masuk dengan Password/i }).click();
    
    // Login button should be disabled when password is empty
    await expect(page.getByRole('button', { name: /Masuk/i })).toBeDisabled();
    
    // Fill password
    await page.getByLabel(/Password/i).fill('password123');
    
    // Login button should be enabled
    await expect(page.getByRole('button', { name: /Masuk/i })).toBeEnabled();
  });

  test('should handle magic link submission', async ({ page }) => {
    // Mock the API response for magic link
    await page.route('**/action', async (route) => {
      if (route.request().method() === 'POST') {
        const postData = route.request().postData();
        if (postData?.includes('magic-link')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true }),
          });
        }
      } else {
        await route.continue();
      }
    });

    await page.getByLabel(/Alamat email/i).fill('test@example.com');
    await page.getByRole('button', { name: /Kirim link ajaib/i }).click();
    
    // Should show loading state
    await expect(page.getByText(/Mengirim.../i)).toBeVisible();
    
    // Should show success message after submission
    await expect(page.getByText(/Link telah dikirim/i)).toBeVisible();
    await expect(page.getByText('test@example.com')).toBeVisible();
  });

  test('should handle password login submission', async ({ page }) => {
    // Mock successful login
    await page.route('**/action', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      } else {
        await route.continue();
      }
    });

    // Perform password login
    await page.getByLabel(/Alamat email/i).fill('test@example.com');
    await page.getByRole('button', { name: /Masuk dengan Password/i }).click();
    await page.getByLabel(/Password/i).fill('password123');
    await page.getByRole('button', { name: /Masuk/i }).click();
    
    // Should show loading state
    await expect(page.getByText(/Masuk.../i)).toBeVisible();
    
    // Should redirect after successful login
    await page.waitForURL('**/**');
  });

  test('should handle login errors', async ({ page }) => {
    // Mock login error
    await page.route('**/action', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'INVALID_CREDENTIALS' }),
        });
      } else {
        await route.continue();
      }
    });

    // Try to login with wrong credentials
    await page.getByLabel(/Alamat email/i).fill('test@example.com');
    await page.getByRole('button', { name: /Masuk dengan Password/i }).click();
    await page.getByLabel(/Password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /Masuk/i }).click();
    
    // Should show error message
    await expect(page.getByText(/Invalid email or password/i)).toBeVisible();
  });

  test('should handle OAuth provider login', async ({ page }) => {
    // Mock OAuth redirect
    await page.route('**/auth/**', async (route) => {
      await route.fulfill({
        status: 302,
        headers: {
          'Location': '/api/auth/callback/google',
        },
      });
    });

    // Click Google login button
    await page.getByRole('button', { name: /Masuk dengan Google/i }).click();
    
    // Should initiate OAuth flow
    await page.waitForURL('**/api/auth/**');
  });

  test('should navigate to sign up page', async ({ page }) => {
    // Click sign up link
    await page.getByRole('link', { name: /Daftar menggunakan email/i }).click();
    
    // Should navigate to sign up page
    await expect(page).toHaveURL(/.*sign-up/);
  });

  test('should handle callback URL parameter', async ({ page }) => {
    // Navigate with callback URL
    await page.goto('/sign-in?callbackUrl=/dashboard');
    
    // Should preserve callback URL in sign up link
    const signUpLink = page.getByRole('link', { name: /Daftar menggunakan email/i });
    await expect(signUpLink).toHaveAttribute('href', /.*callbackUrl.*dashboard/);
  });

  test('should show loading states during form submission', async ({ page }) => {
    // Slow down API response to see loading state
    await page.route('**/action', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    // Test magic link loading
    await page.getByLabel(/Alamat email/i).fill('test@example.com');
    await page.getByRole('button', { name: /Kirim link ajaib/i }).click();
    await expect(page.getByText(/Mengirim.../i)).toBeVisible();

    // Wait for completion and test password login loading
    await page.waitForTimeout(1500);
    await page.goto('/sign-in');
    
    await page.getByLabel(/Alamat email/i).fill('test@example.com');
    await page.getByRole('button', { name: /Masuk dengan Password/i }).click();
    await page.getByLabel(/Password/i).fill('password123');
    await page.getByRole('button', { name: /Masuk/i }).click();
    await expect(page.getByText(/Masuk.../i)).toBeVisible();
  });
});

test.describe('Sign In Page - Mobile Responsive', () => {
  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/sign-in');
    
    // Check layout adapts to mobile
    await expect(page.locator('main')).toBeVisible();
    await expect(page.getByRole('heading', { name: /Masuk ke Rakamin/i })).toBeVisible();
    
    // Form should still be functional
    await page.getByLabel(/Alamat email/i).fill('test@example.com');
    await expect(page.getByRole('button', { name: /Kirim link ajaib/i })).toBeEnabled();
  });
});