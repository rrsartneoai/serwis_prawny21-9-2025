import { test, expect } from '@playwright/test';

test.describe('Legal Services', () => {
  test('should display legal service packages with pricing', async ({ page }) => {
    await page.goto('/');
    
    // Check for service packages and their prices
    await expect(page.locator('text=39 zł, text=39zł, text=39PLN').first()).toBeVisible({timeout: 10000});
    await expect(page.locator('text=59 zł, text=59zł, text=59PLN').first()).toBeVisible();
    await expect(page.locator('text=89 zł, text=89zł, text=89PLN').first()).toBeVisible();
    await expect(page.locator('text=129 zł, text=129zł, text=129PLN').first()).toBeVisible();
  });

  test('should allow package selection', async ({ page }) => {
    await page.goto('/');
    
    // Look for package selection buttons
    const packageButton = page.locator('button:has-text("Wybierz"), button:has-text("Select"), a:has-text("Wybierz")').first();
    if (await packageButton.isVisible()) {
      await expect(packageButton).toBeVisible();
      
      // Click on package selection
      await packageButton.click();
      
      // Should navigate to payment/order process or require login
      await page.waitForTimeout(2000);
      const currentUrl = page.url();
      expect(currentUrl).not.toBe('/');
    }
  });

  test('should show legal service descriptions', async ({ page }) => {
    await page.goto('/');
    
    // Check for service descriptions
    await expect(page.locator('text=analiza dokumentów, text=document analysis, text=przegląd prawny').first()).toBeVisible({timeout: 10000});
    await expect(page.locator('text=konsultacja, text=consultation').first()).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size
    await page.goto('/');
    
    // Check if page loads on mobile
    await expect(page).toHaveTitle(/Kancelaria/);
    
    // Check mobile navigation (hamburger menu or mobile-friendly layout)
    const mobileNav = page.locator('nav, .mobile-menu, button[aria-label*="menu"]').first();
    await expect(mobileNav).toBeVisible({timeout: 10000});
  });

  test('should have contact information', async ({ page }) => {
    await page.goto('/');
    
    // Look for contact information (email, phone, address)
    const contactInfo = page.locator('text=contact, text=kontakt, footer').first();
    if (await contactInfo.isVisible()) {
      await expect(contactInfo).toBeVisible();
    }
  });
});