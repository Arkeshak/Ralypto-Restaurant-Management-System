import { test } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const VIEWPORTS = [
  { name: 'desktop_1280', width: 1280, height: 800 },
  { name: 'tablet_1024', width: 1024, height: 768 },
  { name: 'tablet_768', width: 768, height: 1024 },
  { name: 'mobile_390', width: 390, height: 844 },
];

const PAGES = [
  { name: 'pos', path: '/pos', auth: 'manager' },
  { name: 'tables', path: '/tables', auth: 'manager' },
  { name: 'kitchen', path: '/kitchen', auth: 'manager' },
  { name: 'waiter', path: '/waiter', auth: 'waiter' },
  { name: 'qr_menu', path: '/menu/qr?table=T1', auth: null },
  { name: 'reports', path: '/reports', auth: 'owner' },
];

test.describe('Responsive Screenshots Generator', () => {
  const screenshotsDir = path.resolve(process.cwd(), '../docs/screenshots');

  test.beforeAll(() => {
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
  });

  for (const pageConfig of PAGES) {
    for (const vp of VIEWPORTS) {
      test(`capture ${pageConfig.name} at ${vp.name} (${vp.width}px)`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });

        if (pageConfig.auth) {
          await page.goto('/pin-login');
          await page.evaluate((role) => {
            localStorage.setItem(
              'ralypto_auth',
              JSON.stringify({
                token: 'mock-session-token',
                user: { id: `u-${role}`, name: `Mock ${role}`, role },
                restaurant: { id: 'rest-1', name: 'Ceylon Flavors', plan: 'standard' },
                plan: 'standard',
                featureFlags: {},
              })
            );
          }, pageConfig.auth);
        }

        await page.goto(pageConfig.path, { waitUntil: 'networkidle' }).catch(() => page.goto(pageConfig.path));
        await page.waitForTimeout(800);

        const fileName = `${pageConfig.name}_${vp.width}px.png`;
        const filePath = path.join(screenshotsDir, fileName);
        await page.screenshot({ path: filePath, fullPage: false });
      });
    }
  }
});
