import { Page, expect } from '@playwright/test';

export class TestHelpers {
  constructor(private page: Page) {}

  /**
   * Login with test credentials
   */
  async loginAsAdmin() {
    await this.page.goto('/auth/login');
    await this.page.fill('input[type="email"], input[name="email"]', 'admin@test.com');
    await this.page.fill('input[type="password"], input[name="password"]', 'admin123');
    await this.page.locator('button[type="submit"], button:has-text("Zaloguj")').first().click();
    await this.page.waitForTimeout(3000);
  }

  /**
   * Login as operator
   */
  async loginAsOperator() {
    await this.page.goto('/auth/login');
    await this.page.fill('input[type="email"], input[name="email"]', 'operator@test.com');
    await this.page.fill('input[type="password"], input[name="password"]', 'operator123');
    await this.page.locator('button[type="submit"], button:has-text("Zaloguj")').first().click();
    await this.page.waitForTimeout(3000);
  }

  /**
   * Check if user is logged in
   */
  async isLoggedIn(): Promise<boolean> {
    // Look for logout button or user menu
    const logoutButton = this.page.locator('button:has-text("Wyloguj"), a:has-text("Logout")').first();
    const userMenu = this.page.locator('.user-menu, [data-testid="user-menu"]').first();
    
    return await logoutButton.isVisible({timeout: 2000}) || await userMenu.isVisible({timeout: 2000});
  }

  /**
   * Wait for API response
   */
  async waitForApiResponse(apiEndpoint: string, timeout = 10000) {
    return await this.page.waitForResponse(
      response => response.url().includes(apiEndpoint) && response.status() === 200,
      { timeout }
    );
  }

  /**
   * Fill contact form
   */
  async fillContactForm(data: {
    name: string;
    email: string;
    phone?: string;
    message: string;
  }) {
    await this.page.fill('input[name="name"], input[name="firstName"]', data.name);
    await this.page.fill('input[name="email"]', data.email);
    if (data.phone) {
      await this.page.fill('input[name="phone"]', data.phone);
    }
    await this.page.fill('textarea[name="message"], textarea[name="description"]', data.message);
  }

  /**
   * Select legal service package
   */
  async selectPackage(packageType: 'Basic' | 'Standard' | 'Premium' | 'Express') {
    const packageButton = this.page.locator(`button:has-text("${packageType}"), a:has-text("${packageType}")`).first();
    if (await packageButton.isVisible()) {
      await packageButton.click();
    }
  }

  /**
   * Wait for loading spinner to disappear
   */
  async waitForLoading() {
    const spinner = this.page.locator('.spinner, .loading, [data-testid="loading"]').first();
    if (await spinner.isVisible({timeout: 1000})) {
      await spinner.waitFor({state: 'hidden', timeout: 10000});
    }
  }

  /**
   * Take screenshot with timestamp
   */
  async takeScreenshot(name: string) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    await this.page.screenshot({ 
      path: `tests/screenshots/${name}-${timestamp}.png`,
      fullPage: true 
    });
  }

  /**
   * Check accessibility features
   */
  async checkAccessibility() {
    // Check for alt texts on images
    const images = this.page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      if (await img.isVisible()) {
        const alt = await img.getAttribute('alt');
        expect(alt).toBeTruthy();
      }
    }

    // Check for proper heading hierarchy
    const headings = this.page.locator('h1, h2, h3, h4, h5, h6');
    const headingCount = await headings.count();
    expect(headingCount).toBeGreaterThan(0);

    // Check for focus indicators
    const focusableElements = this.page.locator('button, input, a, select, textarea');
    const firstElement = focusableElements.first();
    if (await firstElement.isVisible()) {
      await firstElement.focus();
      await expect(firstElement).toBeFocused();
    }
  }
}