import { test, expect, type Page } from '@playwright/test';
import {
  collectConsole,
  openCatalogue,
  searchCatalogue,
  openServicesMenu,
  openAideMenu,
  expectAideLinks,
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

  test('le catalogue, onglet « Fonds de cartes » : bascule sur les photographies aériennes au clavier', async ({
    page,
  }, testInfo) => {
    const tiles = trackResponses(page, GPF_WMTS);
    await openMap(page);
    await openCatalogue(page);
    await page.locator('#tabbutton-1_fonds').click();
    const fond = (nom: string) =>
      page.locator(
        `input[name="checkboxes-fonds"][aria-label="Afficher le fond de carte : ${nom}"]`,
      );
    await expect(fond('Plan IGN')).toBeChecked();
    const ortho = fond('Photographies aériennes');
    // Après le clic d'onglet, le panneau DSFR reste masqué une image : attendre la case avant focus() + Espace.
    await expect(ortho).toBeVisible();
    await ortho.focus();
    await page.keyboard.press('Space');
    await expect(ortho).toBeChecked();
    await expect(fond('Plan IGN')).not.toBeChecked();
    await expect
      .poll(() => tiles.filter((t) => /ORTHOIMAGERY/i.test(t.url)).length, { timeout: 30_000 })
      .toBeGreaterThan(0);
    const orthoTiles = tiles.filter((t) => /ORTHOIMAGERY/i.test(t.url));
    expect(orthoTiles.some((t) => t.status === 200)).toBe(true);
    expect(expectFlakeWithin(orthoTiles, testInfo, 'orthophotos')).toBeNull();
  });

  test('le catalogue de cartes ajoute puis retire une couche (GetMap 200, image)', async ({
    page,
  }, testInfo) => {
    const wms = trackResponses(page, GPF_WMS_V);
    await openMap(page);
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
      page.getByRole('alert').filter({ hasText: 'Couche indisponible' }).first(),
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

  test('mise en page v1.1 : carte plein viewport, aucune barre d’outils, badge « Explorer »', async ({
    page,
    isMobile,
  }) => {
    await openMap(page);
    await expect(page.locator('header .fr-badge')).toHaveText('Explorer');
    await expect(page.locator('header .fr-badge')).toHaveClass(
      /fr-badge--purple-glycine.*fr-badge--icon-left.*fr-icon-map-pin-2-fill/,
    );
    await expect(
      page.getByRole('heading', { level: 1, name: 'Explorer les cartes' }),
    ).toBeAttached();
    // M13 : plus de panneau latéral, de partage, de contrôle d'attribution ni de lien vers la vue liste sur la carte.
    for (const name of [/panneau/, 'Partager', 'Sources des données'])
      await expect(page.getByRole('button', { name }), String(name)).toHaveCount(0);
    await expect(page.locator('.ol-attribution, #panneau-lateral')).toHaveCount(0);
    await expect(
      page.getByRole('link', { name: 'Version accessible de la liste des données' }),
    ).toHaveCount(0);
    // Imprimer : bouton de la carte, colonne haut gauche.
    await expect(page.locator('#position-container-top-left .map-print button')).toHaveAttribute(
      'aria-label',
      'Imprimer',
    );
    if (!isMobile) {
      // Carte plein viewport : pas de défilement de page (1280x900, desktop), pied de page replié.
      const [scrollH, innerH] = await page.evaluate(() => [
        document.documentElement.scrollHeight,
        window.innerHeight,
      ]);
      expect(scrollH, 'hauteur de la page vs viewport').toBeLessThanOrEqual(innerH + 1);
    }
  });

  test('plein écran en bas à droite, échelle à sa gauche en bleu action (clair)', async ({
    page,
  }) => {
    await openMap(page);
    const plein = await page
      .locator('#position-container-bottom-right [id^="GPfullScreen-"] button')
      .boundingBox();
    const echelle = await page.locator('.ol-scale-line').boundingBox();
    const viewport = page.viewportSize()!;
    expect(plein, 'plein écran').not.toBeNull();
    expect(viewport.width - (plein!.x + plein!.width), 'écart au bord droit').toBeLessThanOrEqual(
      16,
    );
    expect(echelle!.x + echelle!.width, 'échelle à gauche du plein écran').toBeLessThanOrEqual(
      plein!.x,
    );
    expect(
      plein!.x - (echelle!.x + echelle!.width),
      'écart échelle / plein écran',
    ).toBeLessThanOrEqual(24);
    const [attendu, couleur] = await page.evaluate(() => {
      const probe = document.createElement('span');
      probe.style.color = 'var(--text-action-high-blue-france)';
      document.body.append(probe);
      const attendu = getComputedStyle(probe).color;
      probe.remove();
      return [attendu, getComputedStyle(document.querySelector('.ol-scale-line-inner')!).color];
    });
    expect(couleur, 'couleur de l’échelle = jeton action').toBe(attendu);
  });

  test('pied de page : « Haut de page » le déplie, la page défile, « Fermer » le replie', async ({
    page,
    isMobile,
  }) => {
    await openMap(page);
    const footer = page.getByRole('contentinfo');
    const dims = () =>
      page.evaluate(() => ({
        h: document.documentElement.scrollHeight,
        v: window.innerHeight,
      }));
    const ouvrir = footer.getByRole('button', { name: 'Haut de page' });
    await expect(ouvrir).toHaveAttribute('aria-expanded', 'false');
    await ouvrir.click();
    const fermer = footer.getByRole('button', { name: 'Fermer' });
    await expect(fermer).toHaveAttribute('aria-expanded', 'true');
    await expect(footer.locator('.fr-footer__partners img').first()).toBeVisible();
    const ouvert = await dims();
    expect(ouvert.h, 'la page devient défilable').toBeGreaterThan(ouvert.v + 1);
    await fermer.click();
    await expect(footer.getByRole('button', { name: 'Haut de page' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    const replie = await dims();
    if (!isMobile) expect(replie.h, 'défilement restauré').toBeLessThanOrEqual(replie.v + 1);
    expect(replie.h).toBeLessThan(ouvert.h);
  });

  test('le bloc marque de l’en-tête est entièrement cliquable (vers /)', async ({ page }) => {
    await openMap(page);
    for (const sel of ['.fr-header__logo', '.fr-header__operator', '.fr-header__service']) {
      const href = await page
        .locator(sel)
        .first()
        .evaluate((el) => {
          const r = el.getBoundingClientRect();
          const at = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
          return at?.closest('a')?.getAttribute('href') ?? null;
        });
      expect(href, `lien au centre de ${sel}`).toBe('/');
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
    // Le menu burger reste ouvert : seul le sous-menu s'est fermé.
    if (isMobile)
      await expect(page.locator('header .fr-header__menu')).toHaveClass(/fr-modal--opened/);
  });

  // D-carto-1 : la carte s'affichait parfois sans canvas ni fond Plan IGN (aucune erreur réseau). Depuis M6
  // (PR #39, délai et nouveaux essais sur les capacités WMTS) le test passe la plupart du temps ; un chargement
  // manqué résiduel (environ 1 sur 20) peut encore le faire échouer et le nouvel essai Playwright peut le masquer :
  // lire les annotations « sans canvas » et « Plan IGN absent » avant de se fier à un run vert.
  test('stabilité du rendu : la carte a un canvas à chaque chargement (D-carto-1)', async ({
    browser,
  }, testInfo) => {
    test.setTimeout(MAP_STABILITY_RUNS * 40_000);
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

  // L'en-tête est partagé : ce test ne dépend pas de la barre d'outils de la carte (refonte M13 en cours).
  test('le menu « Aide » de la carte : liens externes cartes.gouv.fr, cible, attributs, icônes', async ({
    page,
    isMobile,
  }) => {
    await openMap(page);
    await openAideMenu(page, isMobile);
    await expectAideLinks(page, 'fr');
  });
});
