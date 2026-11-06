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

// Les 15 boutons d'outils de l'entrée carto (libellés de apps/explorer-les-cartes/scripts/check-map.ts).
const TOOL_BUTTONS = [
  "Ouvrir l'import de couches",
  "Activer/désactiver l'interrogation des couches",
  'Mes outils',
  'Mesurer une distance',
  'Mesurer une surface',
  'Mesurer un angle',
  'Afficher les coordonnées du curseur',
  'Profil altimétrique',
  'Itinéraire',
  'Zone selon le temps de trajet ou distance',
  'Trouver une adresse',
  'Annoter la carte',
  'Légende',
  'Sélectionner un territoire',
  'Mini-carte',
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
  const button = page.getByRole('button', { name: 'Catalogue des données sols', exact: true });
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

test.describe('Carto : outils geopf, partage, impression', () => {
  test.skip(
    ({ isMobile }) => isMobile,
    'boutons des outils masqués sous 48em : vérifié sur desktop',
  );

  test('les quinze boutons d’outils ont un nom accessible', async ({ page }) => {
    await openMap(page);
    for (const name of TOOL_BUTTONS)
      await expect(page.getByRole('button', { name, exact: true }), name).toHaveCount(1);
    const unnamed = await page.evaluate(() =>
      Array.from(document.querySelectorAll('.map-view dialog, .map-view .fr-modal'))
        .filter((d) => !d.hasAttribute('aria-label') && !d.hasAttribute('aria-labelledby'))
        .map((d) => d.id),
    );
    expect(unnamed, 'fenêtres sans nom').toEqual([]);
  });

  test('la mesure de distance renvoie une valeur', async ({ page }) => {
    await openMap(page);
    await page.getByRole('button', { name: 'Mesurer une distance', exact: true }).click();
    await page.mouse.click(700, 500);
    await page.mouse.click(800, 520);
    await page.mouse.dblclick(900, 560);
    await expect
      .poll(async () =>
        (await page.locator('.ol-overlay-container').allInnerTexts())
          .map((t) => t.trim())
          .find((t) => /\d\s*(km|m)$/.test(t)),
      )
      .toBeTruthy();
  });

  test('Partager génère un permalien qui rouvre le même fond et la même couche', async ({
    page,
    context,
  }) => {
    await openMap(page);
    await addCarbone(page);
    const avant = await layerTitlesText(page);
    await page.getByRole('button', { name: 'Partager', exact: true }).click();
    const lien = await page.getByRole('textbox', { name: /^Lien permanent/ }).inputValue();
    const query = new URL(lien).searchParams;
    expect(query.get('permalink')).toBe('yes');
    expect(query.get('l') ?? '').toContain(
      'GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2$GEOPORTAIL:OGC:WMTS(',
    );
    expect(query.get('l') ?? '').toContain(`${SOLS_LAYER}$GEOPORTAIL:OGC:WMS(`);
    expect(query.get('c') ?? '').toMatch(/^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/);
    const neuve = await context.newPage();
    await neuve.goto(lien);
    await expect(neuve.locator('.map-view canvas').first()).toBeVisible({ timeout: 30_000 });
    const apres = await layerTitlesText(neuve);
    expect([...apres].sort()).toEqual([...avant].sort());
  });

  test('Imprimer télécharge un PNG', async ({ page }) => {
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
    // L'entrée est un accordéon replié : on le déplie (bouton nommé par M8) pour voir l'image de légende.
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

test.describe('Carto : « Mes outils »', () => {
  test('« Mes outils » : activation clavier d’une entrée lance l’outil et rend le focus', async ({
    page,
    isMobile,
  }) => {
    await openMap(page);
    const mesOutils = page.getByRole('button', { name: 'Mes outils', exact: true });
    await mesOutils.click();
    const panel = page.locator('[id^="GPcontrolListPanel-"]');
    const entry = panel.locator('li', { hasText: 'Mesurer une distance' });
    await expect(entry).toBeVisible();
    await entry.focus();
    await page.keyboard.press('Enter');
    // L'outil est activé (bouton enfoncé ; sur mobile le bouton est masqué) et le focus revient sur « Mes outils ».
    if (!isMobile)
      await expect(
        page.getByRole('button', { name: 'Mesurer une distance', exact: true }),
      ).toHaveAttribute('aria-pressed', 'true');
    await expect(mesOutils).toBeFocused();
    // Depuis le correctif de M8 (#56) : l'activation clavier d'une entrée vide la liste, sur desktop comme sur mobile.
    await expect(panel).toBeHidden();
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
