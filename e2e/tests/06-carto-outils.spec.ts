import { test, expect, type Page } from '@playwright/test';
import {
  collectConsole,
  GPF_TILE_FLAKE,
  GPF_WMS_V,
  DEEP_LINK_WMS,
  PAGES,
  SOLS_LAYER,
  trackResponses,
  waitForDsfr,
} from './helpers';

// Outils affichés par défaut (M13, DEFAULT_TOOLS) et outils ajoutés à la demande par « Afficher tous les outils ».
const DEFAULT_TOOL_BUTTONS = [
  'Mesurer une distance',
  'Mesurer une surface',
  'Itinéraire',
  'Annoter la carte',
];
const ON_DEMAND_TOOLS = [
  'Mesurer un angle',
  'Afficher les coordonnées du curseur',
  'Profil altimétrique',
  'Zone selon le temps de trajet ou distance',
  'Trouver une adresse',
];
const FIXED_BUTTONS = [
  "Ouvrir l'import de couches",
  "Activer/désactiver l'interrogation des couches",
  'Imprimer',
  'Légende',
  'Sélectionner un territoire',
  'Mini-carte',
  'Catalogue de cartes',
  'Afficher tous les outils',
];

// Bruits amont documentés (doc/agents/geopf-ext.md §10.4) : avertissement « Greyscale » de geopf et
// complétion de lieu vide refusée par la GPF (400). Tout le reste fait échouer.
const UPSTREAM_NOISE = [
  {
    pattern: /Greyscale only implemented/,
    reason: 'geopf LayerSwitcher, couche vecteur (§10.4 point 8)',
  },
  {
    pattern: /geocodage\/completion/,
    reason: 'complétion vide des formulaires Route/Isocurve (§10.4 point 9)',
  },
  { pattern: GPF_TILE_FLAKE, reason: 'flake GPF M-2' },
];

async function openMap(page: Page, url: string = PAGES.carto): Promise<void> {
  await page.goto(url);
  await expect(page.locator('.map-view canvas').first()).toBeVisible({ timeout: 30_000 });
  await page.waitForLoadState('load');
}

async function addCarbone(page: Page): Promise<void> {
  const button = page.getByRole('button', { name: 'Catalogue de cartes', exact: true });
  await button.click();
  await page.locator('#catalog-input-search-global').fill('carbone');
  const box = page.getByRole('checkbox', {
    name: /^Ajouter à la carte\s*: Carte nationale des stocks de carbone/,
  });
  await box.focus();
  await page.keyboard.press('Space');
  await expect(box).toBeChecked();
  await button.click(); // referme le catalogue
}

async function layerTitlesText(page: Page): Promise<string[]> {
  const toggle = page.getByRole('button', { name: 'Ma sélection de cartes' });
  if ((await toggle.getAttribute('aria-pressed')) !== 'true') await toggle.click();
  await expect(page.locator('[id^="GPtitle_ID_"]').first()).toBeVisible();
  return page.locator('[id^="GPtitle_ID_"]').allInnerTexts();
}

test.describe('Carto : outils geopf, impression', () => {
  test('boutons : outils par défaut visibles, autres outils cachés jusqu’à « Afficher tous les outils »', async ({
    page,
  }) => {
    await openMap(page);
    for (const name of [...DEFAULT_TOOL_BUTTONS, ...FIXED_BUTTONS])
      await expect(page.getByRole('button', { name, exact: true }), name).toBeVisible();
    // « Afficher tous les outils » est le dernier bouton de la colonne de droite.
    const derniers = await page
      .locator('#position-container-top-right button:visible')
      .evaluateAll((b) =>
        b.map((x) => x.getAttribute('aria-label') || x.textContent?.trim() || ''),
      );
    expect(derniers.at(-1)).toBe('Afficher tous les outils');
    expect(
      await page.locator('.map-tool--on-demand:not(.map-tool--shown)').count(),
    ).toBeGreaterThan(0);
    for (const name of ON_DEMAND_TOOLS)
      await expect(page.getByRole('button', { name, exact: true }), `${name} caché`).toBeHidden();
    const unnamed = await page.evaluate(() =>
      Array.from(document.querySelectorAll('.map-view dialog, .map-view .fr-modal'))
        .filter((d) => !d.hasAttribute('aria-label') && !d.hasAttribute('aria-labelledby'))
        .map((d) => d.id),
    );
    expect(unnamed, 'fenêtres sans nom').toEqual([]);
  });

  test('« Afficher tous les outils » : activation clavier ajoute le bouton de l’outil et rend le focus', async ({
    page,
  }) => {
    await openMap(page);
    const tous = page.getByRole('button', { name: 'Afficher tous les outils', exact: true });
    await tous.click();
    const panel = page.locator('[id^="GPcontrolListPanel-"]');
    const entry = panel.locator('li', { hasText: 'Mesurer un angle' });
    await expect(entry).toBeVisible();
    await entry.focus();
    await page.keyboard.press('Enter');
    await expect(panel).toBeHidden();
    await expect(tous).toBeFocused();
    const angle = page.getByRole('button', { name: 'Mesurer un angle', exact: true });
    await expect(angle).toBeVisible();
    await expect(angle).toHaveAttribute('aria-pressed', 'true');
  });

  test('la mesure de distance renvoie une valeur', async ({ page, isMobile }) => {
    test.skip(isMobile, 'tracé à la souris sur la carte : desktop');
    await openMap(page);
    await page.getByRole('button', { name: 'Mesurer une distance', exact: true }).click();
    await page.mouse.click(600, 500);
    await page.mouse.click(700, 520);
    await page.mouse.dblclick(800, 560);
    await expect
      .poll(async () =>
        (await page.locator('.ol-overlay-container').allInnerTexts())
          .map((t) => t.trim())
          .find((t) => /\d\s*(km|m)$/.test(t)),
      )
      .toBeTruthy();
  });

  test('le partage a été retiré (aucun bouton « Partager »)', async ({ page }) => {
    await openMap(page);
    await expect(page.getByRole('button', { name: 'Partager' })).toHaveCount(0);
  });

  test('Imprimer (bouton de la carte) télécharge un PNG', async ({ page }) => {
    await openMap(page);
    await page.getByRole('button', { name: 'Imprimer', exact: true }).click();
    const download = page.waitForEvent('download', { timeout: 30_000 });
    await page.getByRole('button', { name: 'Télécharger en PNG' }).click();
    const file = await download;
    expect(file.suggestedFilename()).toMatch(/\.png$/);
  });

  test('Légende affiche une image pour une couche sols ajoutée', async ({ page }) => {
    const wms = trackResponses(page, GPF_WMS_V);
    await openMap(page);
    await addCarbone(page);
    await page.getByRole('button', { name: 'Légende', exact: true }).click();
    const entry = page.locator(`.legend-entry-container[id="${SOLS_LAYER}"]`);
    await expect(entry).toBeAttached();
    await page
      .getByRole('button', { name: /^Afficher la légende : Carte nationale des stocks/ })
      .click();
    const image = entry.locator('img').first();
    await expect(image).toBeVisible({ timeout: 30_000 });
    await expect
      .poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0), {
        timeout: 30_000,
      })
      .toBe(true);
    expect(wms.length).toBeGreaterThan(0);
  });

  test('le parcours outils ne produit aucune erreur console hors bruits amont documentés', async ({
    page,
  }) => {
    const c = collectConsole(page);
    await openMap(page, DEEP_LINK_WMS);
    await page.getByRole('button', { name: 'Mesurer une distance', exact: true }).click();
    await page.getByRole('button', { name: 'Mesurer une distance', exact: true }).click();
    await page.getByRole('button', { name: 'Légende', exact: true }).click();
    await expect(page.locator('[id^="GPlegendsPanel-"]')).toBeVisible();
    await expect(page.locator('.legend-entry-container').first()).toBeAttached();
    await page.getByRole('button', { name: 'Légende', exact: true }).click();
    expect(c.errors.filter((e) => !UPSTREAM_NOISE.some((n) => n.pattern.test(e)))).toEqual([]);
  });
});

test.describe('Carto : en-tête', () => {
  test('le chevron du menu « Services » se retourne à l’ouverture', async ({ page, isMobile }) => {
    await openMap(page);
    if (isMobile) await page.locator('header .fr-btn--menu').click();
    await waitForDsfr(page);
    const button = page
      .locator('header')
      .getByRole('button', { name: 'Services' })
      .locator('visible=true');
    // Le chevron est le <span> enfant du bouton (M10) : sa transformation change quand le menu s'ouvre.
    const transform = () =>
      button.evaluate((el) => getComputedStyle(el.querySelector('span') ?? el).transform);
    const ferme = await transform();
    await button.click();
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    await expect.poll(transform).not.toBe(ferme);
  });
});
