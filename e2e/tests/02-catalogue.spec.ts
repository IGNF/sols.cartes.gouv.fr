import { test, expect } from '@playwright/test';
import {
  collectConsole,
  untolerated,
  isResultQuery,
  waitForCatalogueResults,
  SOLS_GROUP,
} from './helpers';

// Erreurs console tolérées : documentées en amont (doc/catalogue-patches.md), uniquement sur les pages fiche.
// Le 400 est ancré sur l'URL WMTS GPF pour ne masquer aucun autre 4xx.
const TOLERATED = [
  {
    pattern: /Invalid layer for legend creation/,
    reason: 'upstream geonetwork-ui : création de légende pour une couche invalide',
  },
  {
    pattern: /status of 400.*data\.geopf\.fr\/wmts/,
    reason: 'WMTS/légende 400 pour un nom CSW absent du service (documenté en amont)',
  },
];

test.describe('Catalogue', () => {
  test('affiche des résultats, tous dans le périmètre sols', async ({ page }) => {
    const c = collectConsole(page);
    const searchBodies: string[] = [];
    page.on('request', (r) => {
      if (r.url().includes('_search')) searchBodies.push(r.postData() ?? '');
    });
    await page.goto('/rechercher-une-donnee/');
    const count = await waitForCatalogueResults(page);
    // Note (non bloquante) : 7 résultats attendus au 2026-11-05.
    test
      .info()
      .annotations.push({ type: 'nombre de résultats', description: `${count} (attendu : 7)` });

    const results = searchBodies.filter(isResultQuery);
    expect(results.length).toBeGreaterThan(0);
    for (const b of results) expect(b).toContain(SOLS_GROUP);

    // KNOWN LIMIT (doc/catalogue-patches.md « Limites connues ») : les agrégations (size 0) ne sont pas filtrées.
    const unscopedAggs = searchBodies.filter((b) => !isResultQuery(b) && !b.includes(SOLS_GROUP));
    test
      .info()
      .annotations.push({
        type: 'KNOWN LIMIT',
        description: `${unscopedAggs.length}/${searchBodies.length} requêtes _search d'agrégation sans ${SOLS_GROUP}`,
      });

    expect(untolerated(c.errors, TOLERATED), 'erreurs console hors liste documentée').toEqual([]);
  });

  test('ouvre une fiche avec un titre', async ({ page }) => {
    const c = collectConsole(page);
    await page.goto('/rechercher-une-donnee/');
    await waitForCatalogueResults(page);
    await page.locator('gn-ui-record-preview-row, gn-ui-record-preview-list').first().click();
    await page.waitForURL(/dataset\//, { timeout: 30_000 });
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 30_000 });
    expect((await page.locator('h1').first().innerText()).trim().length).toBeGreaterThan(0);
    expect(untolerated(c.errors, TOLERATED), 'erreurs console hors liste documentée').toEqual([]);
  });
});
