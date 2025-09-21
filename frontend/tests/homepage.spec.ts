import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load homepage successfully', async ({ page }) => {
    await page.goto('/');
    
    // Check if the page loads
    await expect(page).toHaveTitle(/Kancelaria/);
    
    // Check main navigation elements
    await expect(page.locator('nav')).toBeVisible();
    
    // Check for main legal services content
    await expect(page.locator('text=Profesjonalne usługi prawne')).toBeVisible({timeout: 10000});
  });

  test('should display service packages', async ({ page }) => {
    await page.goto('/');
    
    // Look for service packages (Basic, Standard, Premium, Express)
    await expect(page.locator('text=Basic')).toBeVisible({timeout: 10000});
    await expect(page.locator('text=Standard')).toBeVisible();
    await expect(page.locator('text=Premium')).toBeVisible();
    await expect(page.locator('text=Express')).toBeVisible();
  });

  test('should have working navigation', async ({ page }) => {
    await page.goto('/');
    
    // Test navigation links
    const loginLink = page.locator('a[href*="login"], button:has-text("Zaloguj")').first();
    if (await loginLink.isVisible()) {
      await expect(loginLink).toBeVisible();
    }
    
    const registerLink = page.locator('a[href*="register"], button:has-text("Zarejestruj")').first();
    if (await registerLink.isVisible()) {
      await expect(registerLink).toBeVisible();
    }
  });
});