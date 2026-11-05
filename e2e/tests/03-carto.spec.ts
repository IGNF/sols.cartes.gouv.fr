import { test, expect, type Page } from '@playwright/test';
import {
  collectConsole,
  MAP_STABILITY_RUNS,
  trackResponses,
  expectFlakeWithin,
  GPF_TILE_FLAKE,
  GPF_WMTS,
  GPF_WMS_V,
  SOLS_LAYER,
  DEEP_LINK_WMS,
  DEEP_LINK_WMTS,
  DEEP_LINK_UNKNOWN,
  PAGES,
} from './helpers';

const MAP_REGION = { name: 'Carte interactive des données sols' };

async function openMap(page: Page, url: string = PAGES.carto): Promise<void> {
  await page.goto(url);
  await expect(page.getByRole('region', MAP_REGION)).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('.map-view canvas, canvas').first()).toBeVisible({ timeout: 30_000 });
}

/** Ouvre le panneau latéral s'il est masqué. */
async function ensurePanel(page: Page): Promise<void> {
  const show = page.getByRole('button', { name: 'Afficher le panneau' });
  if (await show.isVisible().catch(() => false)) await show.click();
  await expect(page.getByRole('button', { name: 'Masquer le panneau' })).toBeVisible();
}

async function openLayerList(page: Page): Promise<void> {
  const toggle = page.getByRole('button', { name: 'Ma sélection de cartes' });
  if ((await toggle.getAttribute('aria-pressed')) !== 'true') await toggle.click();
}

function layerTitles(page: Page) {
  return page.locator('[id^="GPtitle_ID_"]');
}

const STOCK_CARBONE_FULL_TITLE =
  'Carte nationale des stocks de carbone des sols intégrée dans la carte mondiale de la FAO';
const STOCK_CARBONE_TITLE = /Carte nationale des stocks de carbone/;

/** Le fond Plan IGN manque parfois dans la liste (flake intermittent observé, noté sans faire échouer la couche sols). */
async function noteBaseLayer(
  page: Page,
  testInfo: { annotations: { type: string; description?: string }[] },
) {
  const hasBase = (await layerTitles(page).filter({ hasText: 'Plan IGN' }).count()) > 0;
  testInfo.annotations.push({
    type: 'fond Plan IGN dans la liste',
    description: hasBase ? 'présent' : 'ABSENT (intermittent)',
  });
}

test.describe('Carto', () => {
  test('la carte affiche un canvas, les tuiles GPF répondent 200 et le sélecteur de couches fonctionne', async ({
    page,
  }, testInfo) => {
    const c = collectConsole(page);
    const tiles = trackResponses(page, GPF_WMTS);
    await openMap(page);
    await expect.poll(() => tiles.length, { timeout: 30_000 }).toBeGreaterThan(0);
    await page.waitForLoadState('load');
    await page.waitForTimeout(2000);

    expect(tiles.filter((t) => t.status === 200).length).toBeGreaterThan(0);
    expect(expectFlakeWithin(tiles, testInfo, 'fond Plan IGN')).toBeNull();

    await openLayerList(page);
    await expect(page.getByRole('dialog', { name: 'Gestionnaire de couches' })).toBeVisible();
    await expect(layerTitles(page).first()).toContainText('Plan IGN');
    expect(c.errors.filter((e) => !GPF_TILE_FLAKE.test(e))).toEqual([]);
  });

  test('le panneau « Fonds de carte » bascule sur les photographies aériennes au clavier', async ({
    page,
  }, testInfo) => {
    const tiles = trackResponses(page, GPF_WMTS);
    await openMap(page);
    await ensurePanel(page);
    await page.getByRole('tab', { name: 'Fonds de carte' }).click();
    const plan = page.getByRole('radio', { name: /Plan IGN/ });
    await expect(plan).toBeChecked();
    // Clavier : focus sur le radio coché, flèche vers le suivant jusqu'aux photographies aériennes.
    const ortho = page.getByRole('radio', { name: 'Photographies aériennes', exact: true });
    await plan.focus();
    for (let i = 0; i < 12 && !(await ortho.isChecked()); i++)
      await page.keyboard.press('ArrowDown');
    await expect(ortho).toBeChecked();
    await expect
      .poll(() => tiles.filter((t) => /ORTHOIMAGERY/i.test(t.url)).length, { timeout: 30_000 })
      .toBeGreaterThan(0);
    const orthoTiles = tiles.filter((t) => /ORTHOIMAGERY/i.test(t.url));
    expect(orthoTiles.some((t) => t.status === 200)).toBe(true);
    expect(expectFlakeWithin(orthoTiles, testInfo, 'orthophotos')).toBeNull();
  });

  test('l’onglet « Données sols » ajoute puis retire une couche (GetMap 200, image)', async ({
    page,
  }, testInfo) => {
    const wms = trackResponses(page, GPF_WMS_V);
    await openMap(page);
    await ensurePanel(page);
    await page.getByRole('tab', { name: 'Données sols' }).click();
    // Nom exact (doc/agents/geopf-ext.md §7.4) ; le nom calculé peut être « …carte: titre ».
    const addBtn = page.getByRole('button', {
      name: new RegExp(`^Ajouter à la carte\\s*: ${STOCK_CARBONE_FULL_TITLE}$`),
    });
    await addBtn.focus();
    await page.keyboard.press('Enter');
    await expect
      .poll(() => wms.filter((r) => /GetMap/i.test(r.url) && r.status === 200).length, {
        timeout: 45_000,
      })
      .toBeGreaterThan(0);
    const getMap = wms.find((r) => /GetMap/i.test(r.url) && r.status === 200)!;
    expect(getMap.contentType).toMatch(/^image\//);
    await openLayerList(page);
    await expect(layerTitles(page).filter({ hasText: STOCK_CARBONE_TITLE })).toHaveCount(1);
    await noteBaseLayer(page, testInfo);
    // Retrait : le même bouton, libellé inversé.
    await page.keyboard.press('Escape');
    const remove = page.getByRole('button', { name: /Retirer de la carte/ }).first();
    await remove.focus();
    await page.keyboard.press('Enter');
    await openLayerList(page);
    await expect(layerTitles(page).filter({ hasText: STOCK_CARBONE_TITLE })).toHaveCount(0);
  });

  test('lien profond cartes.gouv.fr WMS : couche ajoutée, tuiles 200', async ({
    page,
  }, testInfo) => {
    const c = collectConsole(page);
    const wms = trackResponses(page, GPF_WMS_V);
    await openMap(page, DEEP_LINK_WMS);
    await expect
      .poll(() => wms.filter((r) => /GetMap/i.test(r.url) && r.status === 200).length, {
        timeout: 45_000,
      })
      .toBeGreaterThan(0);
    expect(wms.find((r) => /GetMap/i.test(r.url) && r.status === 200)!.contentType).toMatch(
      /^image\//,
    );
    expect(expectFlakeWithin(wms, testInfo, SOLS_LAYER)).toBeNull();
    await openLayerList(page);
    await expect(layerTitles(page).filter({ hasText: STOCK_CARBONE_TITLE })).toHaveCount(1);
    await noteBaseLayer(page, testInfo);
    expect(c.errors.filter((e) => !GPF_TILE_FLAKE.test(e))).toEqual([]);
  });

  test('lien profond cartes.gouv.fr WMTS (INRAE_CARTE-SOLS) : couche ajoutée', async ({ page }) => {
    await openMap(page, DEEP_LINK_WMTS);
    await openLayerList(page);
    await expect(layerTitles(page).filter({ hasNotText: 'Plan IGN' })).toHaveCount(1, {
      timeout: 30_000,
    });
    await expect(page.getByRole('alert')).toHaveCount(0);
  });

  test('lien profond vers une couche inconnue : alerte « Couche introuvable »', async ({
    page,
  }) => {
    await openMap(page, DEEP_LINK_UNKNOWN);
    await expect(page.getByRole('alert').filter({ hasText: 'Couche introuvable' })).toBeVisible({
      timeout: 30_000,
    });
  });

  test('vue liste sans carte : un h1, 7 données, liens catalogue, aucune tuile GPF', async ({
    page,
  }) => {
    const requests: string[] = [];
    page.on('request', (r) => requests.push(r.url()));
    await page.goto(PAGES.liste);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Liste des données sols' }),
    ).toBeVisible();
    await expect(page.locator('h1:visible')).toHaveCount(1);
    await expect(page.getByRole('article')).toHaveCount(7);
    const links = page.getByRole('link', { name: /Fiche de la donnée dans le catalogue/ });
    expect(await links.count()).toBe(7);
    expect(await links.first().getAttribute('href')).toContain('/rechercher-une-donnee/dataset/');
    await page.waitForTimeout(1500);
    expect(
      requests.filter((u) => /data\.geopf\.fr\/(wmts|wms-v)/.test(u) && /GetTile|GetMap/i.test(u)),
    ).toEqual([]);
    expect(await page.locator('canvas').count()).toBe(0);
  });

  // D-carto-1 : la carte s'affiche parfois sans canvas ni fond Plan IGN (aucune erreur réseau). Échec connu :
  // `test.fail()` fait passer ce test au vert dès que M6 corrige le défaut (Playwright signale alors « attendu en échec »).
  test('stabilité du rendu : la carte a un canvas à chaque chargement (D-carto-1)', async ({
    browser,
  }, testInfo) => {
    test.fail(true, 'D-carto-1 : canvas absent sur ~5 % des chargements, correctif prévu en M6');
    test.setTimeout(MAP_STABILITY_RUNS * 25_000);
    let sansCanvas = 0;
    let sansFond = 0;
    for (let i = 0; i < MAP_STABILITY_RUNS; i++) {
      const context = await browser.newContext(testInfo.project.use);
      const page = await context.newPage();
      await page.goto(PAGES.carto);
      await expect(page.getByRole('region', MAP_REGION)).toBeVisible({ timeout: 30_000 });
      await page.waitForTimeout(5000);
      if ((await page.locator('.map-view canvas').count()) === 0) sansCanvas++;
      await openLayerList(page);
      if ((await layerTitles(page).filter({ hasText: 'Plan IGN' }).count()) === 0) sansFond++;
      await context.close();
    }
    testInfo.annotations.push(
      { type: 'sans canvas', description: `${sansCanvas}/${MAP_STABILITY_RUNS} sans canvas` },
      {
        type: 'Plan IGN absent',
        description: `${sansFond}/${MAP_STABILITY_RUNS} Plan IGN absent de la liste des couches`,
      },
    );
    expect(sansCanvas, 'chargements sans canvas').toBe(0);
    expect(sansFond, 'chargements sans Plan IGN dans la liste').toBe(0);
  });
});
