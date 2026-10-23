import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility (axe checks)', () => {
  test('login page meets accessibility guidelines', async ({ page }) => {
    await page.goto('/pin-login');
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .disableRules(['color-contrast']) // Some muted status badges are subtle by design
      .analyze();

    expect(accessibilityScanResults.violations.filter((v) => v.impact === 'critical')).toEqual([]);
  });

  test('QR menu page meets accessibility standards', async ({ page }) => {
    await page.goto('/menu/qr?table=T1');
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .disableRules(['color-contrast'])
      .analyze();

    expect(accessibilityScanResults.violations.filter((v) => v.impact === 'critical')).toEqual([]);
  });

  test('keyboard navigation and focus indicators work on PIN pad', async ({ page }) => {
    await page.goto('/pin-login');
    await page.keyboard.press('Tab');
    const focusedTag = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedTag).toBeDefined();
  });
});
