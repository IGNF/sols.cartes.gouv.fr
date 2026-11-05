import { test, expect } from '@playwright/test';
import { collectConsole, untolerated } from './helpers';

// Erreurs documentées en amont (doc/catalogue-patches.md) sur les pages fiche.
const TOLERATED = [
  { pattern: /Invalid layer for legend creation/, reason: 'upstream geonetwork-ui, légende' },
  { pattern: /status of 400/, reason: "WMTS/légende 400 pour un nom CSW absent du service (upstream)" },
];

test.describe('Catalogue', () => {
  test('affiche 7 résultats, tous dans le périmètre sols', async ({ page }) => {
    const c = collectConsole(page);
    const searchBodies: string[] = [];
    page.on('request', (r) => {
      if (r.url().includes('_search')) searchBodies.push(r.postData() ?? '');
    });
    await page.goto('/rechercher-une-donnee/');
    await expect(page.getByText('7 résultats')).toBeVisible({ timeout: 60_000 });
    expect(searchBodies.length).toBeGreaterThan(0);
    // Requêtes de résultats (size > 0) : le filtre sols est obligatoire.
    const results = searchBodies.filter((b) => !/"size":0\b/.test(b.split('"from"')[1] ?? ''));
    expect(results.length).toBeGreaterThan(0);
    for (const b of results) expect(b).toContain('gissol-osf_g');
    // Requêtes d'agrégation (facettes, size 0) : le filtre devrait aussi s'y trouver (défaut catalogue si absent).
    const unscopedAggs = searchBodies.filter((b) => !b.includes('gissol-osf_g'));
    test.info().annotations.push({ type: 'agrégations', description: `${unscopedAggs.length}/${searchBodies.length} requêtes _search sans gissol-osf_g` });
    // KNOWN LIMIT (doc/catalogue-patches.md « Limites connues ») : les agrégations (size 0) ne sont pas filtrées.
    const unscopedResults = results.filter((b) => !b.includes('gissol-osf_g'));
    expect(unscopedResults).toEqual([]);
    expect(await page.locator('gn-ui-results-list-item, gn-ui-search-results gn-ui-record-preview-list, [data-test="result"] ').count()).toBeGreaterThan(0);
    expect(c.errors.filter((e) => !/legend|status of 4/.test(e))).toEqual([]);
  });

  test('ouvre une fiche avec un titre', async ({ page }) => {
    const c = collectConsole(page);
    await page.goto('/rechercher-une-donnee/');
    await expect(page.getByText('7 résultats')).toBeVisible({ timeout: 60_000 });
    const first = page.locator('gn-ui-record-preview-row, gn-ui-record-preview-list').first();
    await first.click();
    await page.waitForURL(/dataset\//, { timeout: 30_000 });
    await expect(page.locator('h1, gn-ui-metadata-info h1, .text-title').first()).toBeVisible({ timeout: 30_000 });
    const title = (await page.locator('h1').first().innerText()).trim();
    expect(title.length).toBeGreaterThan(0);
    const other = untolerated(c.errors, TOLERATED);
    expect(other, `erreurs console hors liste documentée`).toEqual([]);
  });
});
