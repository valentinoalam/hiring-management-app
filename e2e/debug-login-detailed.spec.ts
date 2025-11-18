// e2e/debug-login-detailed.spec.ts
import { test, expect } from '@playwright/test';

test('debug login page in detail', async ({ page }) => {
  await page.goto('/login');
  
  console.log('=== BASIC PAGE INFO ===');
  console.log('URL:', page.url());
  console.log('Title:', await page.title());
  
  // Check if we have any visible text content
  const bodyText = await page.textContent('body');
  console.log('Body text sample (first 500 chars):', bodyText?.substring(0, 500));
  
  console.log('\n=== SEARCHING FOR SPECIFIC ELEMENTS ===');
  
  // Look for headings with various text patterns
  const headingPatterns = [
    /masuk/i, /login/i, /sign.in/i, /welcome/i, /hiringhub/i
  ];
  
  for (const pattern of headingPatterns) {
    const heading = page.getByRole('heading').filter({ hasText: pattern });
    const count = await heading.count();
    if (count > 0) {
      const text = await heading.first().textContent();
      console.log(`✅ Found heading with pattern ${pattern}: "${text}"`);
    } else {
      console.log(`❌ No heading with pattern ${pattern}`);
    }
  }
  
  // Look for email input with various strategies
  console.log('\n=== EMAIL INPUT SEARCH ===');
  const emailSelectors = [
    'input[type="email"]',
    'input[name="email"]',
    '[placeholder*="email" i]',
    'input[type="text"]' // sometimes email inputs use type="text"
  ];
  
  for (const selector of emailSelectors) {
    const elements = page.locator(selector);
    const count = await elements.count();
    if (count > 0) {
      const placeholder = await elements.first().getAttribute('placeholder');
      console.log(`✅ Found input with selector "${selector}": placeholder="${placeholder}"`);
    } else {
      console.log(`❌ No input with selector "${selector}"`);
    }
  }
  
  // Look for password input
  console.log('\n=== PASSWORD INPUT SEARCH ===');
  const passwordSelectors = [
    'input[type="password"]',
    'input[name="password"]',
    '[placeholder*="password" i]',
    '[placeholder*="sandi" i]'
  ];
  
  for (const selector of passwordSelectors) {
    const elements = page.locator(selector);
    const count = await elements.count();
    if (count > 0) {
      const placeholder = await elements.first().getAttribute('placeholder');
      console.log(`✅ Found password input with selector "${selector}": placeholder="${placeholder}"`);
    } else {
      console.log(`❌ No password input with selector "${selector}"`);
    }
  }
  
  // Look for buttons with various text patterns
  console.log('\n=== BUTTON SEARCH ===');
  const buttonPatterns = [
    /kirim/i, /send/i, /submit/i, /login/i, /masuk/i, 
    /password/i, /sandi/i, /google/i, /kembali/i, /back/i
  ];
  
  const allButtons = await page.getByRole('button').all();
  console.log(`Total buttons found: ${allButtons.length}`);
  
  for (const button of allButtons) {
    const text = await button.textContent();
    const isVisible = await button.isVisible();
    console.log(`Button: "${text?.trim()}" (visible: ${isVisible})`);
  }
  
  // Look for specific button patterns
  for (const pattern of buttonPatterns) {
    const button = page.getByRole('button').filter({ hasText: pattern });
    const count = await button.count();
    if (count > 0) {
      const text = await button.first().textContent();
      console.log(`✅ Found button with pattern ${pattern}: "${text}"`);
    } else {
      console.log(`❌ No button with pattern ${pattern}`);
    }
  }
  
  // Look for links
  console.log('\n=== LINK SEARCH ===');
  const linkPatterns = [
    /daftar/i, /sign.up/i, /register/i, /buat.akun/i, /home/i, /return/i
  ];
  
  const allLinks = await page.getByRole('link').all();
  console.log(`Total links found: ${allLinks.length}`);
  
  for (const link of allLinks) {
    const text = await link.textContent();
    const href = await link.getAttribute('href');
    console.log(`Link: "${text?.trim()}" -> ${href}`);
  }
  
  for (const pattern of linkPatterns) {
    const link = page.getByRole('link').filter({ hasText: pattern });
    const count = await link.count();
    if (count > 0) {
      const text = await link.first().textContent();
      const href = await link.first().getAttribute('href');
      console.log(`✅ Found link with pattern ${pattern}: "${text}" -> ${href}`);
    } else {
      console.log(`❌ No link with pattern ${pattern}`);
    }
  }
  
  // Look for forms
  console.log('\n=== FORM SEARCH ===');
  const forms = await page.locator('form').all();
  console.log(`Total forms found: ${forms.length}`);
  
  for (let i = 0; i < forms.length; i++) {
    const form = forms[i];
    const inputsInForm = await form.locator('input').count();
    console.log(`Form ${i + 1}: ${inputsInForm} input(s)`);
  }
  
  // Take screenshot
  await page.screenshot({ path: 'debug-login-detailed.png', fullPage: true });
  
  // Simple test that should pass
  await expect(page.locator('body')).toBeVisible();
});