import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { PAGES, openServicesMenu, shootJpeg, OUT_DIR, waitForCatalogueResults } from './helpers';

test.describe('Captures', () => {
  mkdirSync(OUT_DIR, { recursive: true });
  for (const [nom, path] of Object.entries(PAGES)) {
    test(`capture de ${nom}`, async ({ page }, testInfo) => {
      await page.goto(path);
      if (nom === 'catalogue') await waitForCatalogueResults(page);
      if (nom === 'aide') await expect(page.locator('#contact')).toBeAttached();
      if (nom === 'liste') await expect(page.getByRole('article').first()).toBeVisible();
      if (nom === 'fiche')
        await expect(page.locator('h1').first()).toBeVisible({ timeout: 30_000 });
      if (nom === 'carto') {
        await expect(page.locator('canvas').first()).toBeVisible({ timeout: 30_000 });
        await page.waitForLoadState('networkidle').catch(() => undefined);
      }
      // JPEG sous 300 kB (la qualité baisse si besoin, voir shootJpeg).
      const file = `${OUT_DIR}/${nom}-${testInfo.project.name}.jpg`;
      await shootJpeg(page, file, { fullPage: ['home', 'liste', 'aide'].includes(nom) });
    });
  }

  // Les deux en-têtes (edito et carto) avec le menu « Services » ouvert.
  for (const [nom, path] of [
    ['home', PAGES.home],
    ['carto', PAGES.carto],
  ] as const) {
    test(`capture de l'en-tête ${nom}, menu Services ouvert`, async ({
      page,
      isMobile,
    }, testInfo) => {
      await page.goto(path);
      if (nom === 'carto')
        await expect(page.locator('.map-view canvas').first()).toBeVisible({ timeout: 30_000 });
      await openServicesMenu(page, isMobile);
      await page.waitForTimeout(600); // fin de l'animation du menu
      const file = `${OUT_DIR}/en-tete-${nom}-${testInfo.project.name}.jpg`;
      await shootJpeg(page, file, {
        clip: { x: 0, y: 0, width: page.viewportSize()!.width, height: isMobile ? 812 : 420 },
      });
    });
  }
});
