import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should navigate to login page', async ({ page }) => {
    await page.goto('/');
    
    // Find and click login button/link
    const loginButton = page.locator('a[href*="logowanie"], button:has-text("Zaloguj")').first();
    await expect(loginButton).toBeVisible({timeout: 10000});
    await loginButton.click();
    await expect(page).toHaveURL(/logowanie/);
  });

  test('should show login form', async ({ page }) => {
    await page.goto('/logowanie');
    
    // Check for login form elements
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible({timeout: 10000});
    await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"], button:has-text("Zaloguj")').first()).toBeVisible();
  });

  test('should navigate to register page', async ({ page }) => {
    await page.goto('/');
    
    // Find and click register button/link
    const registerButton = page.locator('a[href*="rejestracja"], button:has-text("Zarejestruj")').first();
    await expect(registerButton).toBeVisible({timeout: 10000});
    await registerButton.click();
    await expect(page).toHaveURL(/rejestracja/);
  });

  test('should show register form', async ({ page }) => {
    await page.goto('/rejestracja');
    
    // Check for register form elements
    await expect(page.locator('input[name="email"], input[type="email"]')).toBeVisible({timeout: 10000});
    await expect(page.locator('input[name="password"], input[type="password"]')).toBeVisible();
    await expect(page.locator('input[name="firstName"], input[name="first_name"]')).toBeVisible();
    await expect(page.locator('button[type="submit"], button:has-text("Zarejestruj")').first()).toBeVisible();
  });

  test('should show validation errors for empty login form', async ({ page }) => {
    await page.goto('/logowanie');
    
    // Try to submit empty form
    await page.locator('button[type="submit"], button:has-text("Zaloguj")').first().click();
    
    // Check for validation messages
    await expect(page.locator('text=wymagane, [role="alert"], .error-message').first()).toBeVisible({timeout: 5000});
  });

  test('should attempt login with test credentials', async ({ page }) => {
    await page.goto('/logowanie');
    
    // Fill in test credentials
    await page.fill('input[type="email"], input[name="email"]', 'admin@test.com');
    await page.fill('input[type="password"], input[name="password"]', 'admin123');
    
    // Submit form
    await page.locator('button[type="submit"], button:has-text("Zaloguj")').first().click();
    
    // Wait for response and check result
    await page.waitForLoadState('networkidle', {timeout: 10000});
    
    const currentUrl = page.url();
    // Should either redirect to dashboard or show error - both are valid outcomes to test
    const isRedirected = !currentUrl.includes('/logowanie');
    const hasErrorMessage = await page.locator('[role="alert"], .error-message, text=błędne').first().isVisible({timeout: 2000});
    
    // At least one should be true (either success redirect or error shown)
    expect(isRedirected || hasErrorMessage).toBe(true);
  });
});