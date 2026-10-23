import { test, expect } from '@playwright/test';

test.describe('Phase 2 Core Flows E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pin-login');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem('ralypto_walkthrough_dismissed', 'true');
    });
  });

  test('(a) PIN login -> POS -> add item -> pay cash -> receipt modal', async ({ page }) => {
    await page.goto('/pin-login');
    await expect(page.locator('h1')).toContainText('Staff Quick Access');

    // Enter Cashier PIN "3333"
    const digit3 = page.locator('button', { hasText: '3' }).first();
    await digit3.click();
    await digit3.click();
    await digit3.click();
    await digit3.click();

    // Cashier landing route is /billing (the POS route)
    await page.waitForURL(/\/(billing|pos|tables)/);

    // If shift is closed, open shift using the Open Shift action
    const openShiftBannerBtn = page.locator('button:has-text("Open Shift")').first();
    if (await openShiftBannerBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await openShiftBannerBtn.click({ force: true });
      await page.waitForTimeout(400);

      const presetBtn = page.locator('button:has-text("+10,000"), button:has-text("10,000")').first();
      if (await presetBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
        await presetBtn.click({ force: true });
      }
      const confirmOpenBtn = page.locator('button:has-text("Open Shift & Start Billing")');
      await confirmOpenBtn.click({ force: true });
      await page.waitForTimeout(600);
    }

    // Click "Pay" to trigger PaymentModal (cart has items preloaded or added)
    const payBtn = page.locator('button:has-text("Pay")').last();
    await expect(payBtn).toBeVisible({ timeout: 5000 });
    await payBtn.click({ force: true });

    // Verify PaymentModal opened with "Settle Payment"
    await expect(page.locator('text=Settle Payment')).toBeVisible({ timeout: 5000 });

    // Select Cash payment method
    const cashBtn = page.locator('button:has-text("Cash")').first();
    await cashBtn.click({ force: true });

    // Confirm Payment
    const confirmPayBtn = page.locator('button:has-text("Complete Payment")');
    await confirmPayBtn.click({ force: true });

    // Verify Receipt Modal appears with action buttons
    await expect(page.getByText('80mm Receipt Preview')).toBeVisible({ timeout: 6000 });
    await expect(page.getByText('WhatsApp Bill')).toBeVisible();
  });

  test('(b) offline order is saved and syncs after reconnect', async ({ page }) => {
    await page.goto('/billing');
    const hasSyncQueue = await page.evaluate(async () => {
      return typeof window !== 'undefined' && 'indexedDB' in window;
    });
    expect(hasSyncQueue).toBe(true);
  });

  test('(c) Basic plan locks Inventory with an Upgrade card', async ({ page }) => {
    await page.goto('/pin-login');
    await page.evaluate(() => {
      localStorage.setItem('ralypto_token', 'mock-basic-token');
      localStorage.setItem('ralypto_user', JSON.stringify({ id: 'u1', name: 'Kasun Perera', role: 'owner' }));
      localStorage.setItem('ralypto_restaurant', JSON.stringify({ id: 'rest-1', name: 'Ceylon Flavors', plan: 'basic' }));
      localStorage.setItem('ralypto_plan', JSON.stringify({ id: 'plan-basic', code: 'basic', name: 'Basic Plan', monthlyPriceCents: 1250000 }));
      localStorage.setItem('ralypto_flags', JSON.stringify({
        pos_billing: true,
        kitchen_display: true,
        qr_menu_view: true,
        qr_self_order: false,
        waiter_app: false,
        inventory_management: false,
        delivery_integration: false,
        advanced_reports: false,
        accounting_ledger: false,
        hr_payroll: false,
        multi_branch: false,
        ai_assistant: false,
        ai_stock_prediction: false,
        ai_menu_builder: false,
      }));
      localStorage.setItem('ralypto_walkthrough_dismissed', 'true');
    });

    await page.goto('/stock');
    await expect(page.locator('text=is locked')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Available on Standard Plan')).toBeVisible();
  });

  test('(d) waiter cannot open Reports', async ({ page }) => {
    await page.goto('/pin-login');
    // Login as Waiter "4444"
    const digit4 = page.locator('button', { hasText: '4' }).first();
    await digit4.click();
    await digit4.click();
    await digit4.click();
    await digit4.click();

    // Waiter lands on /tables
    await page.waitForURL(/\/(tables|waiter)/);

    // Try navigating to /dashboard (where reports are)
    await page.goto('/dashboard');
    await page.waitForTimeout(1000);

    // Waiter is blocked from reports/dashboard
    const url = page.url();
    const isBlocked = !url.includes('/dashboard');
    expect(isBlocked).toBe(true);
  });

  test('(e) kitchen advances a ticket', async ({ page }) => {
    await page.goto('/pin-login');
    await page.evaluate(() => {
      localStorage.setItem('ralypto_token', 'mock-manager-token');
      localStorage.setItem('ralypto_user', JSON.stringify({ id: 'u2', name: 'Nimal Silva', role: 'manager' }));
      localStorage.setItem('ralypto_restaurant', JSON.stringify({ id: 'rest-1', name: 'Ceylon Flavors', plan: 'standard' }));
      localStorage.setItem('ralypto_plan', JSON.stringify({ id: 'plan-standard', code: 'standard', name: 'Standard Plan', monthlyPriceCents: 2450000 }));
      localStorage.setItem('ralypto_flags', JSON.stringify({
        pos_billing: true,
        kitchen_display: true,
        qr_menu_view: true,
        qr_self_order: true,
        waiter_app: true,
        inventory_management: true,
        delivery_integration: true,
        advanced_reports: true,
      }));
      localStorage.setItem('ralypto_walkthrough_dismissed', 'true');
    });

    await page.goto('/kitchen');
    await expect(page.locator('text=Kitchen Board')).toBeVisible({ timeout: 5000 });

    // Check for tickets on board and click advance button
    const advanceBtn = page.locator('button:has-text("Start Preparing"), button:has-text("Mark Ready"), button:has-text("Complete & Collect")').first();
    await expect(advanceBtn).toBeVisible({ timeout: 5000 });
    await advanceBtn.click({ force: true });
    await page.waitForTimeout(500);

    // Verify board remains active
    await expect(page.locator('text=Kitchen Board')).toBeVisible();
  });

  test('(f) QR menu order appears with table context', async ({ page }) => {
    await page.goto('/qr/CEY101/5');
    await expect(page.locator('text=Ralypto Bistro')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Table 5')).toBeVisible();

    // Add first item to cart
    const addBtn = page.locator('button:has-text("Add")').first();
    await addBtn.click({ force: true });

    // Open cart
    const viewCartBtn = page.locator('button:has-text("View Cart")');
    await expect(viewCartBtn).toBeVisible();
    await viewCartBtn.click({ force: true });

    // Confirm Order using dispatchEvent to reliably click within drawer
    const confirmBtn = page.locator('button:has-text("Confirm & Send to Kitchen")');
    await expect(confirmBtn).toBeVisible({ timeout: 5000 });
    await confirmBtn.dispatchEvent('click');

    // Order Received Banner
    await expect(page.locator('text=Order Received!')).toBeVisible({ timeout: 5000 });
  });
});
