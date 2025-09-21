# Frontend E2E Testing with Playwright

## Overview
This directory contains end-to-end tests for the Kancelaria legal services platform frontend built with Next.js.

## Test Structure

### Files:
- **`homepage.spec.ts`** - Tests for homepage loading and navigation
- **`auth.spec.ts`** - Authentication flow tests (login/register)
- **`legal-services.spec.ts`** - Legal service package tests and accessibility
- **`test-helpers.ts`** - Reusable helper functions for common test operations
- **`playwright.config.ts`** - Playwright configuration for multiple browsers/devices

### Key Features Tested:
✅ **Homepage Loading** - Verifies main content and navigation
✅ **Authentication Flows** - Login/register forms and validation
✅ **Legal Service Packages** - Package display and pricing
✅ **Mobile Responsiveness** - Tests on different viewport sizes
✅ **Basic Accessibility** - Alt tags, labels, heading hierarchy
✅ **Polish Localization** - Correct routes (/logowanie, /rejestracja)

## Running Tests

### Prerequisites
In a CI/CD environment, install dependencies:
```bash
npx playwright install-deps
npx playwright install
```

### Available Scripts
```bash
# Run all E2E tests
npm run test:e2e

# Run tests with UI mode
npm run test:e2e:ui

# Run tests in debug mode
npm run test:e2e:debug

# View test reports
npm run test:e2e:report
```

### Environment Requirements
- **Frontend server**: Must be running on http://localhost:5000
- **Backend server**: Should be running on http://localhost:8000 for full integration
- **Browser deps**: Playwright browsers must be installed

## Test Strategy

### 🎯 **Deterministic Assertions**
Tests use specific, deterministic assertions rather than permissive "if visible" patterns:

```typescript
// ❌ Avoid permissive patterns
if (await element.isVisible()) {
  await expect(element).toBeVisible();
}

// ✅ Use deterministic assertions  
await expect(element).toBeVisible({timeout: 10000});
```

### 🔄 **Integration with Backend**
Tests expect the FastAPI backend to be running for:
- Authentication validation
- API endpoint responses
- Role-based access control

### 📱 **Cross-Browser & Mobile**
Configuration includes:
- Desktop Chrome, Firefox, Safari
- Mobile Chrome (Pixel 5)
- Mobile Safari (iPhone 12)

### ♿ **Accessibility Testing**
Basic accessibility checks include:
- Image alt attributes
- Form label associations  
- Proper heading hierarchy
- Focus management

## Known Limitations

1. **Browser Dependencies** - Tests require system browser dependencies in CI
2. **Backend Integration** - Some tests expect backend endpoints to be available
3. **Content Coupling** - Tests may need updates if Polish text content changes
4. **Environment Setup** - Requires proper Next.js and FastAPI server setup

## Future Improvements

- [ ] Add integration with @axe-core/playwright for comprehensive a11y testing
- [ ] Implement proper test data seeding for deterministic flows
- [ ] Add visual regression testing with screenshots
- [ ] Create authenticated user flows with session management
- [ ] Add performance testing with lighthouse integration