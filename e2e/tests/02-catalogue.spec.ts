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

// Erreurs console tolérées, uniquement sur les pages fiche. Le motif GPF couvre aussi le 400 WMTS/légende
// documenté en amont (nom CSW absent du service) : il est ancré sur data.geopf.fr, donc aucun autre 4xx n'est masqué.
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

  test('l\u2019en-tête v1 du catalogue : badge « Rechercher », marque vers /, pas de navigation', async ({
    page,
  }) => {
    await page.goto(PAGES.catalogue);
    await expect(page.locator('header .fr-badge')).toHaveText('Rechercher');
    await expect(
      page.locator('header #navigation-principale, header nav[aria-label="Menu principal"]'),
    ).toHaveCount(0);
    const hrefs = await page
      .locator('header a')
      .evaluateAll((a) => a.map((x) => x.getAttribute('href') ?? ''));
    expect(hrefs).toContain('/');
    expect(hrefs.filter((h) => /cartes\.gouv\.fr/.test(h))).toEqual([]);
    // C-6 : les paramètres d'affichage sont masqués sur le catalogue.
    await expect(page.getByRole('button', { name: "Paramètres d'affichage" })).toHaveCount(0);
    // Partenaires dans le pied de page.
    await expect(
      page.locator('footer').getByRole('link', { name: 'INRAE', exact: true }),
    ).toBeAttached();
  });

  test('les puces de mots-clés basculent (aria-pressed, filtre keyword, résultats)', async ({
    page,
  }) => {
    await page.goto(PAGES.catalogue);
    const total = await waitForCatalogueResults(page);
    const group = page.getByRole('group', { name: 'Mots-clés suggérés' });
    await expect(group).toBeVisible();
    const chip = group.getByRole('button', { name: 'RRP' });
    await expect(chip).toHaveAttribute('aria-pressed', 'false');
    await chip.click();
    await expect(chip).toHaveAttribute('aria-pressed', 'true');
    await expect(page).toHaveURL(/keyword=RRP/);
    await expect
      .poll(async () =>
        Number(
          /(\d+)/.exec(
            await page
              .getByText(/\d+ résultats?/)
              .first()
              .innerText(),
          )?.[1],
        ),
      )
      .toBeLessThan(total);
    await chip.click();
    await expect(chip).toHaveAttribute('aria-pressed', 'false');
    await expect(page).not.toHaveURL(/keyword=RRP/);
    await expect(page.getByText(new RegExp(`${total} résultats`)).first()).toBeVisible();
    // Clavier : Entrée puis Espace sur deux puces, cumul.
    const rmqs = group.getByRole('button', { name: 'RMQS' });
    await rmqs.focus();
    await page.keyboard.press('Enter');
    await expect(rmqs).toHaveAttribute('aria-pressed', 'true');
    const pedo = group.getByRole('button', { name: 'pédologie' });
    await pedo.focus();
    await page.keyboard.press('Space');
    await expect(pedo).toHaveAttribute('aria-pressed', 'true');
    await expect(rmqs).toHaveAttribute('aria-pressed', 'true');
    expect(decodeURIComponent(page.url())).toContain('keyword=RMQS,pédologie');
  });

  test('seuls les filtres Thèmes et Mot-clé sont proposés', async ({ page, isMobile }) => {
    test.skip(
      isMobile,
      'filtres repliés dans « Affiner votre recherche » sur mobile : vérifié sur desktop',
    );
    await page.goto(PAGES.catalogue);
    await waitForCatalogueResults(page);
    await expect(page.getByRole('button', { name: 'Thèmes' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Mot-clé' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Année de publication/ })).toHaveCount(0);
  });

  test('le lien « Voir sur la carte » de la fiche (section liens) ouvre la carte, même onglet, avec la couche', async ({
    page,
  }) => {
    const popups: unknown[] = [];
    page.context().on('page', (p) => popups.push(p));
    await page.goto(PAGES.fiche);
    const link = page.getByRole('link', { name: /^Voir sur la carte/ }).first();
    await expect(link).toBeVisible({ timeout: 30_000 });
    const href = await link.getAttribute('href');
    expect(href).toMatch(/^\/explorer-les-cartes\/\?l=/);
    expect(decodeURIComponent(href ?? '')).toContain(`l=${SOLS_LAYER}$GEOPORTAIL:OGC:WMS(1;1;1;0)`);
    expect(href).toContain('permalink=no');
    await link.click();
    await page.waitForURL(/\/explorer-les-cartes\/\?l=/, { timeout: 30_000 });
    expect(popups, 'aucun nouvel onglet').toHaveLength(0);
    await page.getByRole('button', { name: 'Ma sélection de cartes' }).click({ timeout: 30_000 });
    await expect(
      page
        .locator('[id^="GPtitle_ID_"]')
        .filter({ hasText: /Carte nationale des stocks de carbone/ }),
    ).toHaveCount(1, { timeout: 30_000 });
  });
});
