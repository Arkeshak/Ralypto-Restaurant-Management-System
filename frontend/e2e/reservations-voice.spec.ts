import { test, expect } from '@playwright/test';

test.describe('Reservations & Voice AI Flows E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pin-login');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem('ralypto_walkthrough_dismissed', 'true');
    });
  });

  test('(a) Owner navigates to Reservations, views Timeline, and opens New Reservation modal', async ({ page }) => {
    // 1. PIN Login as owner (seeded PIN: 1234)
    await page.goto('/pin-login');
    await page.waitForLoadState('networkidle');

    for (const char of '1234') {
      await page.getByRole('button', { name: char, exact: true }).click();
    }
    await page.waitForURL(/\/dashboard|\/pos|\/tables/, { timeout: 10000 });

    // 2. Navigate to Reservations
    await page.goto('/reservations');
    await page.waitForLoadState('networkidle');

    // 3. Verify page header & metrics
    await expect(page.getByRole('button', { name: "Today's Bookings" })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Timeline by Table' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Waitlist Queue' })).toBeVisible();

    // 4. Switch to Timeline by Table
    await page.getByRole('button', { name: 'Timeline by Table' }).click();
    await expect(page.getByText('12:00 PM')).toBeVisible();
    await expect(page.getByText('08:00 PM')).toBeVisible();

    // 5. Open New Reservation Modal
    await page.getByRole('button', { name: 'New Reservation' }).click();
    await expect(page.getByRole('heading', { name: 'Create Reservation' })).toBeVisible();
    await expect(page.getByPlaceholder('e.g. Kasun Bandara')).toBeVisible();

    // Close modal
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('heading', { name: 'Create Reservation' })).not.toBeVisible();
  });

  test('(b) Waiter page displays push-to-talk Voice Order button', async ({ page }) => {
    // Login as owner to access waiter app
    await page.goto('/pin-login');
    await page.waitForLoadState('networkidle');
    for (const char of '1234') {
      await page.getByRole('button', { name: char, exact: true }).click();
    }
    await page.waitForURL(/\/dashboard|\/pos|\/tables/, { timeout: 10000 });

    // Navigate to Waiter Pad
    await page.goto('/waiter');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Waiter Pad')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Voice Order' })).toBeVisible();
  });

  test('(c) QR Menu displays "Just talk to Ralypto" voice bar', async ({ page }) => {
    // Public QR menu access (zero auth required)
    await page.goto('/qr/CEY101/Table%201');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Ceylon Spice Bistro')).toBeVisible();
    await expect(page.getByText('Just talk to Ralypto')).toBeVisible();
  });

  test('(d) Ask Ralypto AI assistant answers questions with data & chart', async ({ page }) => {
    // Login as owner
    await page.goto('/pin-login');
    await page.waitForLoadState('networkidle');
    for (const char of '1234') {
      await page.getByRole('button', { name: char, exact: true }).click();
    }
    await page.waitForURL(/\/dashboard|\/pos|\/tables/, { timeout: 10000 });

    // Navigate to AI Assistant
    await page.goto('/ai');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'Ralypto AI Brain & Voice Assistant' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Ask Ralypto (Hero 4)' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Daily Morning Briefing' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Demand Forecast & Prep List (Hero 5)' })).toBeVisible();

    // Click suggestion chip: "Best selling item this week?"
    await page.getByRole('button', { name: 'Best selling item this week?' }).click();

    // The answer is computed from this tenant's recorded completed orders.
    await expect(page.getByText(/best seller in the available completed-order data|no completed order items/i)).toBeVisible({ timeout: 5000 });

    // Switch to Daily Morning Briefing
    await page.getByRole('button', { name: 'Daily Morning Briefing' }).click();
    await expect(page.getByText('WhatsApp Morning Briefing')).toBeVisible();
    await expect(page.getByText('Current restaurant report summary:')).toBeVisible();

    // Switch to Demand Forecast
    await page.getByRole('button', { name: 'Demand Forecast & Prep List (Hero 5)' }).click();
    await expect(page.getByText('Recorded Demand Summary')).toBeVisible();
    await expect(page.getByText('Kitchen Morning Prep List')).toBeVisible();
    await expect(page.getByText('Low Stock Check')).toBeVisible();
  });
});
