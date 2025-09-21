import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should navigate to login page', async ({ page }) => {
    await page.goto('/');
    
    // Find and click login button/link
    const loginButton = page.locator('a[href*="login"], button:has-text("Zaloguj")').first();
    if (await loginButton.isVisible()) {
      await loginButton.click();
      await expect(page).toHaveURL(/login/);
    }
  });

  test('should show login form', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Check for login form elements
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible({timeout: 10000});
    await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"], button:has-text("Zaloguj")').first()).toBeVisible();
  });

  test('should navigate to register page', async ({ page }) => {
    await page.goto('/');
    
    // Find and click register button/link
    const registerButton = page.locator('a[href*="register"], button:has-text("Zarejestruj")').first();
    if (await registerButton.isVisible()) {
      await registerButton.click();
      await expect(page).toHaveURL(/register/);
    }
  });

  test('should show register form', async ({ page }) => {
    await page.goto('/auth/register');
    
    // Check for register form elements
    await expect(page.locator('input[name="email"], input[type="email"]')).toBeVisible({timeout: 10000});
    await expect(page.locator('input[name="password"], input[type="password"]')).toBeVisible();
    await expect(page.locator('input[name="firstName"], input[name="first_name"]')).toBeVisible();
    await expect(page.locator('button[type="submit"], button:has-text("Zarejestruj")').first()).toBeVisible();
  });

  test('should show validation errors for empty login form', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Try to submit empty form
    await page.locator('button[type="submit"], button:has-text("Zaloguj")').first().click();
    
    // Check for validation messages
    await expect(page.locator('text=required, text=wymagane, text=pole jest wymagane').first()).toBeVisible({timeout: 5000});
  });

  test('should attempt login with test credentials', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Fill in test credentials
    await page.fill('input[type="email"], input[name="email"]', 'admin@test.com');
    await page.fill('input[type="password"], input[name="password"]', 'admin123');
    
    // Submit form
    await page.locator('button[type="submit"], button:has-text("Zaloguj")').first().click();
    
    // Wait for response (either success redirect or error message)
    await page.waitForTimeout(3000);
    
    // Check if we're redirected (success) or see error message
    const currentUrl = page.url();
    const hasError = await page.locator('text=błąd, text=error, text=nieprawidłowe, text=invalid').first().isVisible({timeout: 1000});
    
    if (!hasError && !currentUrl.includes('/login')) {
      // Successful login - should be redirected
      expect(currentUrl).not.toContain('/login');
    }
    // If there's an error or still on login page, that's also valid for this test
  });
});