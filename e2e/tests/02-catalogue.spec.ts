import { test, expect } from '@playwright/test';
import {
  collectConsole,
  untolerated,
  isResultQuery,
  waitForCatalogueResults,
  SOLS_GROUP,
  GPF_TILE_FLAKE,
  PAGES,
  SOLS_LAYER,
} from './helpers';

// Erreurs console tolérées : documentées en amont (doc/catalogue-patches.md), uniquement sur les pages fiche.
// Le 400 est ancré sur l'URL WMTS GPF pour ne masquer aucun autre 4xx.
const TOLERATED = [
  {
    pattern: GPF_TILE_FLAKE,
    reason:
      'flake GPF ponctuel (400/404/502/503) sur le fond de carte de l\u2019aperçu de la fiche, côté serveur (M-2)',
  },
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

    // C5 a fermé la limite connue : les agrégations (size 0) portent aussi le filtre.
    const unscoped = searchBodies.filter((b) => !b.includes(SOLS_GROUP));
    test.info().annotations.push({
      type: 'requêtes _search',
      description: `${searchBodies.length} au total, ${unscoped.length} sans ${SOLS_GROUP}`,
    });
    expect(unscoped, 'requêtes _search sans filtre sols (résultats ou agrégations)').toEqual([]);

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

  test('/rechercher-une-donnee/organisations redirige vers la recherche', async ({ page }) => {
    await page.goto('/rechercher-une-donnee/organisations');
    await page.waitForURL(/\/rechercher-une-donnee\/search/, { timeout: 30_000 });
    await waitForCatalogueResults(page);
  });

  test('« Voir sur la carte » ouvre la carte dans le même onglet avec la couche', async ({
    page,
  }) => {
    const popups: unknown[] = [];
    page.context().on('page', (p) => popups.push(p));
    await page.goto(PAGES.fiche);
    const btn = page.getByTitle('Voir sur la carte');
    await expect(btn.first()).toBeVisible({ timeout: 30_000 });
    await btn.first().click();
    await page.waitForURL(/\/explorer-les-cartes\/\?l=/, { timeout: 30_000 });
    expect(decodeURIComponent(page.url())).toContain(`l=${SOLS_LAYER}$GEOPORTAIL:OGC:WMS(1;1;1;0)`);
    expect(page.url()).toContain('permalink=no');
    expect(popups, 'aucun nouvel onglet').toHaveLength(0);
    // La couche s'affiche, sinon l'avis « Couche indisponible » doit être présent (couche cassée côté serveur, M-4).
    await page.getByRole('button', { name: 'Ma sélection de cartes' }).click({ timeout: 30_000 });
    const titles = page.locator('[id^="GPtitle_ID_"]');
    await expect(titles.filter({ hasText: /Carte nationale des stocks de carbone/ })).toHaveCount(
      1,
      { timeout: 30_000 },
    );
    await expect(page.getByRole('alert').filter({ hasText: 'Couche indisponible' })).toHaveCount(0);
  });
});
