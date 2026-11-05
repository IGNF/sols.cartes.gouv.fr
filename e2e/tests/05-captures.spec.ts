import { test, expect } from '@playwright/test';
import { mkdirSync, statSync } from 'node:fs';
import { PAGES, OUT_DIR, MAX_SCREENSHOT_BYTES, waitForCatalogueResults } from './helpers';

test.describe('Captures', () => {
  mkdirSync(OUT_DIR, { recursive: true });
  for (const [nom, path] of Object.entries(PAGES)) {
    test(`capture de ${nom}`, async ({ page }, testInfo) => {
      await page.goto(path);
      if (nom === 'catalogue') await waitForCatalogueResults(page);
      if (nom === 'carto') {
        await expect(page.locator('canvas').first()).toBeVisible({ timeout: 30_000 });
        await page.waitForLoadState('networkidle').catch(() => undefined);
      }
      // JPEG qualité 70 : garde chaque capture sous 300 kB sans étape manuelle.
      const file = `${OUT_DIR}/${nom}-${testInfo.project.name}.jpg`;
      await page.screenshot({
        path: file,
        type: 'jpeg',
        quality: 70,
        scale: 'css',
        fullPage: nom === 'home',
      });
      expect(statSync(file).size, `${file} dépasse 300 kB`).toBeLessThan(MAX_SCREENSHOT_BYTES);
    });
  }
});
