import { test, expect, type Page } from '@playwright/test';
import {
  collectConsole,
  openServicesMenu,
  waitForDsfr,
  MAP_STABILITY_RUNS,
  trackResponses,
  expectFlakeWithin,
  GPF_TILE_FLAKE,
  GPF_WMTS,
  GPF_WMS_V,
  SOLS_LAYER,
  DEEP_LINK_WMS,
  DEEP_LINK_LOIRET,
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
  if (await show.isVisible().catch(() => false)) {
    await expect(show).toHaveAttribute('aria-expanded', 'false');
    await show.click();
  }
  const hide = page.getByRole('button', { name: 'Masquer le panneau' });
  await expect(hide).toBeVisible();
  await expect(hide).toHaveAttribute('aria-expanded', 'true');
}

/** Ouvre le catalogue des données sols (contrôle geopf, M9). */
async function openCatalogue(page: Page): Promise<void> {
  const button = page.getByRole('button', { name: 'Catalogue des données sols', exact: true });
  if ((await button.getAttribute('aria-pressed')) !== 'true') await button.click();
  await expect(page.locator('[id^="GPcatalogPanel-"]')).toBeVisible();
}

async function searchCatalogue(page: Page, text: string): Promise<void> {
  await page.locator('#catalog-input-search-global').fill(text);
}

async function openLayerList(page: Page): Promise<void> {
  // Sur mobile le catalogue recouvre le bouton du gestionnaire : on le referme d'abord.
  const panel = page.locator('[id^="GPcatalogPanel-"]');
  if (await panel.isVisible()) {
    await panel.getByRole('button', { name: 'Fermer le panneau' }).click();
    await expect(panel).toBeHidden();
  }
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
    // Depuis M9 le panneau latéral ne contient que les fonds de carte (plus d'onglets).
    await expect(page.getByRole('tab')).toHaveCount(0);
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

  test('le catalogue des données sols ajoute puis retire une couche (GetMap 200, image)', async ({
    page,
  }, testInfo) => {
    const wms = trackResponses(page, GPF_WMS_V);
    await openMap(page);
    await expect(page.getByRole('tab', { name: 'Données sols' })).toHaveCount(0);
    await openCatalogue(page);
    await searchCatalogue(page, 'carbone');
    const box = page.getByRole('checkbox', {
      name: new RegExp(`^Ajouter à la carte\\s*: ${STOCK_CARBONE_FULL_TITLE}$`),
    });
    await expect(box).toHaveCount(1);
    await box.focus();
    await page.keyboard.press('Space');
    await expect(box).toBeChecked();
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
    // Décocher retire la couche : on ferme la liste des couches (Échap, M5, plein écran sur mobile), puis on rouvre le catalogue.
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'Gestionnaire de couches' })).toBeHidden();
    await openCatalogue(page);
    await searchCatalogue(page, 'carbone');
    await box.focus();
    await page.keyboard.press('Space');
    await expect(box).not.toBeChecked();
    await expect(layerTitles(page).filter({ hasText: STOCK_CARBONE_TITLE })).toHaveCount(0);
  });

  test('un lien profond coche l’entrée correspondante du catalogue', async ({ page }) => {
    await openMap(page, DEEP_LINK_WMS);
    await expect(layerTitles(page).first()).toBeAttached({ timeout: 30_000 });
    await openCatalogue(page);
    await searchCatalogue(page, 'carbone');
    await expect(
      page.getByRole('checkbox', {
        name: new RegExp(`^Ajouter à la carte\\s*: ${STOCK_CARBONE_FULL_TITLE}$`),
      }),
    ).toBeChecked({ timeout: 30_000 });
  });

  test('couche du Loiret cassée côté serveur : avis « Couche indisponible » (M-4)', async ({
    page,
  }) => {
    await openMap(page, DEEP_LINK_LOIRET);
    await expect(
      page
        .getByRole('alert')
        .or(page.getByRole('status'))
        .filter({ hasText: 'Couche indisponible' })
        .first(),
    ).toBeVisible({ timeout: 45_000 });
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

  test('mise en page v1 : carte plein viewport, h1 sr-only, badge « Explorer », pied de page compact', async ({
    page,
    isMobile,
  }) => {
    await openMap(page);
    await expect(page.locator('header .fr-badge')).toHaveText('Explorer');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Explorer les cartes' }),
    ).toBeAttached();
    // Pied de page compact : liens bas, paramètres d'affichage, « Haut de page » ; ni partenaires ni liens de contenu.
    const footer = page.locator('footer');
    await expect(footer.getByRole('button', { name: "Paramètres d'affichage" })).toBeAttached();
    await expect(footer.getByRole('link', { name: 'Mentions légales' })).toBeAttached();
    await expect(footer.locator('.fr-footer__partners, .fr-footer__content')).toHaveCount(0);
    await expect(footer.getByRole('link', { name: 'legifrance.gouv.fr' })).toHaveCount(0);
    // Barre d'outils au-dessus de la carte : bouton du panneau et lien vers la liste.
    const region = await page.getByRole('region', MAP_REGION).boundingBox();
    const toggle = await page
      .getByRole('button', { name: /(Afficher|Masquer) le panneau/ })
      .boundingBox();
    const list = await page
      .getByRole('link', { name: 'Version accessible de la liste des données' })
      .first()
      .boundingBox();
    expect(toggle!.y + toggle!.height).toBeLessThanOrEqual(region!.y + 1);
    expect(list!.y + list!.height).toBeLessThanOrEqual(region!.y + 1);
    if (!isMobile) {
      // Carte plein viewport : pas de défilement de page (1280x900, desktop).
      const [scrollH, innerH] = await page.evaluate(() => [
        document.documentElement.scrollHeight,
        window.innerHeight,
      ]);
      expect(scrollH, 'hauteur de la page vs viewport').toBeLessThanOrEqual(innerH + 1);
    }
  });

  test('le menu « Services » de la carte mène au catalogue', async ({ page, isMobile }) => {
    await openMap(page);
    await openServicesMenu(page, isMobile);
    await page
      .locator('header a[href="/rechercher-une-donnee/"]')
      .locator('visible=true')
      .first()
      .click();
    await page.waitForURL(/\/rechercher-une-donnee\//, { waitUntil: 'commit' });
  });

  test('Échap ferme seulement le sous-menu « Services » (mobile compris)', async ({
    page,
    isMobile,
  }) => {
    await openMap(page);
    if (isMobile) await page.locator('header .fr-btn--menu').click();
    const button = page
      .locator('header')
      .getByRole('button', { name: 'Services' })
      .locator('visible=true');
    await waitForDsfr(page);
    await button.focus();
    await page.keyboard.press('Enter');
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Escape');
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await expect(button).toBeFocused();
  });

  // D-carto-1 : la carte s'affichait parfois sans canvas ni fond Plan IGN (aucune erreur réseau). Depuis M6
  // (PR #39, délai et nouveaux essais sur les capacités WMTS) le test passe la plupart du temps ; un chargement
  // manqué résiduel (environ 1 sur 20) peut encore le faire échouer et le nouvel essai Playwright peut le masquer :
  // lire les annotations « sans canvas » et « Plan IGN absent » avant de se fier à un run vert.
  test('stabilité du rendu : la carte a un canvas à chaque chargement (D-carto-1)', async ({
    browser,
  }, testInfo) => {
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
