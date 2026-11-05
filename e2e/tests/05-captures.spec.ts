import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { PAGES } from './helpers';

test.describe('Captures', () => {
  mkdirSync('../doc/e2e', { recursive: true });
  for (const [nom, path] of Object.entries(PAGES)) {
    test(`capture de ${nom}`, async ({ page }, testInfo) => {
      await page.goto(path);
      if (nom === 'catalogue') await expect(page.getByText('7 résultats')).toBeVisible({ timeout: 60_000 });
      if (nom === 'carto') {
        await expect(page.locator('canvas').first()).toBeVisible({ timeout: 30_000 });
        await page.waitForLoadState('networkidle').catch(() => undefined);
      }
      await page.screenshot({ path: `../doc/e2e/${nom}-${testInfo.project.name}.png`, scale: 'css', fullPage: nom === 'home' });
    });
  }
});
