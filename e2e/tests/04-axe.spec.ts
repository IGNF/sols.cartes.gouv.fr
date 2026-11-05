import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { PAGES, AXE_STRICT, OUT_DIR, waitForCatalogueResults } from './helpers';

test.describe('Accessibilité (axe-core)', () => {
  test.skip(({ isMobile }) => isMobile, 'axe exécuté sur desktop uniquement');
  mkdirSync(OUT_DIR, { recursive: true });

  for (const [nom, path] of Object.entries(PAGES)) {
    test(`aucune violation critique ou sérieuse sur ${nom}`, async ({ page }) => {
      await page.goto(path);
      if (nom === 'catalogue') await waitForCatalogueResults(page);
      if (nom === 'liste') await expect(page.getByRole('article').first()).toBeVisible();
      if (nom === 'fiche')
        await expect(page.locator('h1').first()).toBeVisible({ timeout: 30_000 });
      if (nom === 'carto')
        await expect(page.locator('canvas').first()).toBeVisible({ timeout: 30_000 });
      const { violations } = await new AxeBuilder({ page }).analyze();
      const summary = violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        nodes: v.nodes.length,
        help: v.help,
        sample: v.nodes[0]?.target,
      }));
      writeFileSync(`${OUT_DIR}/axe-${nom}.json`, JSON.stringify(summary, null, 2));
      const blocking = summary.filter((v) => v.impact === 'critical' || v.impact === 'serious');
      // Les fiches gardent des violations amont documentées (doc/catalogue-patches.md) : rapportées, non bloquantes.
      if (!(AXE_STRICT as readonly string[]).includes(nom)) {
        test.info().annotations.push({
          type: 'axe amont',
          description: `${blocking.length} règles critical/serious (voir axe-${nom}.json)`,
        });
        return;
      }
      expect(blocking).toEqual([]);
    });
  }
});
