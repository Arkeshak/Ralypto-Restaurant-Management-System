import { test, expect } from '@playwright/test';

async function loginAsOwner(page: import('@playwright/test').Page) {
  await page.goto('/pin-login');
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('ralypto_walkthrough_dismissed', 'true');
    localStorage.setItem('ralypto_rest_code', 'CEY101');
  });
  await page.goto('/pin-login');
  for (const digit of '1234') await page.getByRole('button', { name: digit, exact: true }).click();
  await page.waitForURL(/\/(dashboard|pos|tables|billing)/, { timeout: 10000 });
}

test('staff changes and operational module records persist after reload', async ({ page }) => {
  await loginAsOwner(page);

  await page.goto('/staff');
  await page.getByRole('button', { name: 'Add Staff Member' }).click();
  await page.getByPlaceholder('e.g. Priyantha Jayasuriya').fill('E2E Team Member');
  await page.getByPlaceholder('e.g. 077 123 4567').fill('0770000000');
  await page.getByPlaceholder('••••').fill('9876');
  await page.getByRole('button', { name: 'Add Staff', exact: true }).click();
  await expect(page.getByText('E2E Team Member', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText('E2E Team Member', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Deactivate E2E Team Member' }).click();
  await expect(page.getByRole('button', { name: 'Activate E2E Team Member' })).toBeVisible();

  await page.goto('/stock');
  await page.getByPlaceholder('Ingredient').fill('E2E Flour');
  await page.getByRole('button', { name: /Add item/ }).click();
  await expect(page.getByText('E2E Flour')).toBeVisible();
  await page.reload();
  await expect(page.getByText('E2E Flour')).toBeVisible();

  await page.goto('/delivery');
  await page.getByPlaceholder('Customer name').fill('E2E Guest');
  await page.getByPlaceholder('Phone').fill('0770000001');
  await page.getByPlaceholder('Delivery address').fill('1 Test Road');
  await page.getByPlaceholder('Amount (cents)').fill('4500');
  await page.locator('form').getByRole('button').click();
  await expect(page.getByText(/E2E Guest · 0770000001/)).toBeVisible();
  await page.reload();
  await expect(page.getByText(/E2E Guest · 0770000001/)).toBeVisible();

  await page.goto('/accounting');
  await page.getByPlaceholder('Expense description').fill('E2E Utilities');
  await page.getByPlaceholder('Amount (cents)').fill('1200');
  await page.getByRole('button', { name: 'Record', exact: true }).click();
  await expect(page.getByText(/E2E Utilities/)).toBeVisible();
  await page.reload();
  await expect(page.getByText(/E2E Utilities/)).toBeVisible();

  await page.goto('/settings');
  await page.getByRole('button', { name: 'Save All Settings' }).click();
  await expect(page.getByText(/Settings saved to the restaurant account/)).toBeVisible();
});
