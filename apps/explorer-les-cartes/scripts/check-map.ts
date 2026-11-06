/**
 * Browser check of the map page (Playwright, headless Chromium), run against a running preview:
 *   bun run build:all && PORT=8101 bun run preview:all   (repository root)
 *   bun run check:map [url]                              (this app; default http://localhost:8101/explorer-les-cartes/)
 * Asserts at 375, 768 and 1280 px: the zoom-in button is clickable (not covered by the search engine),
 * the search engine never overlaps the zoom column, the attribution/rotate buttons and the search input
 * have accessible names, and no console error or warning is logged.
 * Sols layers (M4, M9): a layer added from the catalogue with the keyboard is drawn (GetMap answered
 * with image/png) and listed in the layer switcher; the "Voir sur la carte" deep links (`l=` cartes.gouv.fr
 * permalink, and the `layer/type/url` alias) add their layer or show the matching notice.
 * M5: keyboard (tabs, add/remove focus, Escape on the layer list) and the non-map list view (?vue=liste).
 * M6: a canvas on 20 fresh loads (D-carto-1) and the side panel closed by default at 375 px.
 * M7: header v1 (brand), compact footer, map width and no page scroll, controls in both themes.
 * M8: the geopf-extensions tool set (every button named and operable, a distance measured, a WMS import of
 * GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2, feature info on a sols layer, legends), the print sheet
 * with the same layers, the print dialog (PNG download, print sheet); mobile tools through « Mes outils ».
 * M11: axe at 375 px in the dark theme with the page idle (pointer off the header); with the pointer on the
 * header brand block, only the known DSFR hover contrast on the « Menu » button (QUESTIONS M-5) is tolerated.
 * Exits 1 on failure.
 */
import AxeBuilder from '@axe-core/playwright';
import { chromium } from 'playwright';
import brand from '@sols/brand/brand.json';
import { CONTROL_LABELS, PRINT_LABELS } from '../src/config/map';
import { GPF_ENDPOINTS } from '../src/config/urls';

const url = process.argv[2] ?? 'http://localhost:8101/explorer-les-cartes/';

/** Share of GPF tile (GetTile/GetMap) requests allowed to fail: intermittent GPF errors under load (M-2). */
const TILE_ERROR_TOLERANCE = 0.1;

/**
 * Console warnings geopf-extensions 1.0.0-beta.16 writes itself (`console.warn` in LayerSwitcher.js,
 * `_updateLayerGrayScale`, called for every added layer, vector layers of the tools included): known
 * upstream noise, counted in the notes (doc/agents/geopf-ext.md §10).
 */
const UPSTREAM_WARNINGS = [
  'Greyscale only implemented for raster and vector tiles',
  'Grayscale not implemented for layer groups',
];

/**
 * GPF requests the geopf controls send on their own and the service refuses (HTTP 4xx logged by the
 * browser as "Failed to load resource"): the Route/Isocurve forms call the geocoding completion with a
 * blank or numeric text (`geocodage/completion?text=73%20`, 400). Only those (text shorter than three
 * characters, or digits only) are counted in the notes, like the tile errors.
 */
function isUpstreamRequestError(url: string): boolean {
  if (!/\/geocodage\/completion\?/.test(url)) return false;
  const text = new URL(url).searchParams.get('text')?.trim() ?? '';
  return text.length < 3 || /^\d+$/.test(text);
}

/**
 * Console messages of a page, minus the "Failed to load resource" lines caused by GPF tiles, as long as
 * failed tiles stay within TILE_ERROR_TOLERANCE of the tile requests (doc/agents/QUESTIONS.md M-2, same
 * tolerance as the e2e suite). Other messages always count.
 */
function watchConsole(page: import('playwright').Page) {
  const messages: string[] = [];
  const tiles = new Map<string, number[]>();
  let upstreamRequests = 0;
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') messages.push(m.text());
  });
  page.on('pageerror', (e) => messages.push(e.message));
  page.on('response', (r) => {
    if (/REQUEST=Get(Tile|Map)/i.test(r.url()))
      tiles.set(r.url(), [...(tiles.get(r.url()) ?? []), r.status()]);
    else if (r.status() >= 400 && isUpstreamRequestError(r.url())) upstreamRequests += 1;
  });
  return () => {
    const failed = [...tiles].filter(([, codes]) => codes.some((c) => c >= 400));
    const lost = failed.filter(([, codes]) => codes.at(-1) !== 200);
    const upstream = messages.filter((m) => UPSTREAM_WARNINGS.includes(m)).length;
    const unexplained = messages.filter(
      (m) => !m.startsWith('Failed to load resource') && !UPSTREAM_WARNINGS.includes(m),
    );
    const loadErrors = messages.length - unexplained.length - upstream;
    const withinTolerance = lost.length <= Math.ceil(tiles.size * TILE_ERROR_TOLERANCE);
    const explainedByTiles = failed.length > 0 && withinTolerance;
    const explainedByRequests = failed.length === 0 && loadErrors <= upstreamRequests;
    if (loadErrors > 0 && !explainedByTiles && !explainedByRequests) {
      unexplained.push(...lost.map(([u, c]) => `${c.join('→')} ${u}`));
      if (failed.length === 0)
        unexplained.push(`${loadErrors - upstreamRequests} ressource(s) en erreur hors tuiles`);
    }
    const noted = [
      ...(failed.length
        ? [
            `${failed.length} tuile(s) GPF en erreur sur ${tiles.size}, dont ${lost.length} perdue(s), tolérance ${TILE_ERROR_TOLERANCE * 100} %`,
          ]
        : []),
      ...(upstream ? [`${upstream} avertissement(s) amont geopf-ext (niveaux de gris)`] : []),
      ...(upstreamRequests
        ? [`${upstreamRequests} requête(s) de complétion refusée(s) par la GPF (amont)`]
        : []),
    ];
    const notes = noted.length ? ` (${noted.join(' ; ')})` : '';
    return { messages: unexplained, notes };
  };
}

const browser = await chromium.launch();
let failed = false;
const check = (ok: boolean, message: string) => {
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${message}\n`);
  if (!ok) failed = true;
};

for (const width of [375, 768, 1280]) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  const consoleReport = watchConsole(page);
  await page.goto(url, { waitUntil: 'load' });
  await page.locator('[id^="GPsearchEngine-"]').waitFor();

  const zoomIn = page.locator('#GPzoomIn');
  await zoomIn.scrollIntoViewIfNeeded();
  // `trial` runs Playwright's actionability checks, which fail if another element receives the click.
  const clickable = await zoomIn
    .click({ trial: true, timeout: 3000 })
    .then(() => true)
    .catch(() => false);
  check(clickable, `${width}px : le bouton « Zoomer » est cliquable`);

  const overlap = await page.evaluate(() => {
    const search = document.querySelector('[id^="GPsearchEngine-"]')?.getBoundingClientRect();
    const zoom = document.querySelector('[id^="GPzoom-"]')?.getBoundingClientRect();
    return search && zoom ? Math.max(0, zoom.right - search.left) : -1;
  });
  check(
    overlap === 0,
    `${width}px : la recherche ne recouvre pas la colonne de zoom (${overlap} px)`,
  );
  // The attribution control is hidden until a source has attributions (first tiles): check the name only.
  check(
    await page
      .getByRole('button', { name: CONTROL_LABELS.attribution, includeHidden: true })
      .waitFor({ state: 'attached', timeout: 15_000 })
      .then(() => true)
      .catch(() => false),
    `${width}px : bouton « ${CONTROL_LABELS.attribution} » nommé`,
  );
  check(
    (await page
      .getByRole('button', { name: CONTROL_LABELS.rotate, includeHidden: true })
      .count()) === 1,
    `${width}px : bouton « ${CONTROL_LABELS.rotate} » nommé (masqué tant que la carte n'est pas tournée)`,
  );
  check(
    (await page.getByRole('textbox', { name: CONTROL_LABELS.searchInput }).count()) === 1,
    `${width}px : champ « ${CONTROL_LABELS.searchInput} » nommé`,
  );
  const { messages, notes } = consoleReport();
  check(
    messages.length === 0,
    `${width}px : aucune erreur ni alerte console${notes} ${messages.join(' | ')}`,
  );
  await page.close();
}

const switcherTitles = (page: import('playwright').Page) =>
  page.locator('[id^="GPtitle_ID_"]').allInnerTexts();

const CATALOGUE = CONTROL_LABELS.catalog;
const CARBONE_ENTRY = 'input[data-layer="stock_carbone_fao_fr_wmsv:WMS"]';
/** Entry of the Loiret record (M-4: its GetMap answers 200 text/xml, the layer is reported unavailable). */
const LOIRET_ENTRY = 'input[data-layer="rrp_dept_loiret_gpkg_11-09-2026_wmsv:WMS"]';
const unavailableNotice = (page: import('playwright').Page) =>
  page.getByRole('alert').filter({ hasText: 'Couche indisponible' });
/** Opens the catalogue (geopf Catalog control, M9) and waits for its entries. */
async function openCatalogue(page: import('playwright').Page) {
  await page.getByRole('button', { name: CATALOGUE, exact: true }).click();
  await page.locator('input[data-layer]').first().waitFor({ state: 'attached', timeout: 20_000 });
  await page.waitForTimeout(300);
}
const closeCatalogue = (page: import('playwright').Page) =>
  page.getByRole('button', { name: CATALOGUE, exact: true }).click();

{
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const images: string[] = [];
  page.on('response', (r) => {
    if (/REQUEST=GetMap/i.test(r.url()))
      images.push(`${r.status()} ${r.headers()['content-type']}`);
  });
  await page.goto(url, { waitUntil: 'load' });
  await page.getByRole('button', { name: CATALOGUE, exact: true }).waitFor({ timeout: 30_000 });
  await openCatalogue(page);
  const title =
    'Carte nationale des stocks de carbone des sols intégrée dans la carte mondiale de la FAO';
  const entry = page.locator(CARBONE_ENTRY);
  check(
    (await entry.getAttribute('aria-label')) === `Ajouter à la carte : ${title}`,
    'catalogue : case à cocher nommée avec le titre de la donnée',
  );
  await entry.focus();
  const firstGetMap = page.waitForResponse((r) => /REQUEST=GetMap/i.test(r.url()), {
    timeout: 30_000,
  });
  await page.keyboard.press('Space');
  await firstGetMap;
  await page.waitForTimeout(3000);
  check(
    images.length > 0 && images.every((i) => i === '200 image/png'),
    `couche sols ajoutée au clavier depuis le catalogue : ${images.length} GetMap, toutes « 200 image/png »`,
  );
  check(
    (await switcherTitles(page))[0] === title,
    'couche sols en tête du gestionnaire de couches',
  );
  await page.close();
}

// Deep-link outcomes may need a live capabilities request: poll instead of reading once.
/** Waits until the element exists; `attached`, since the layer switcher list is collapsed (hidden). */
const visible = (locator: import('playwright').Locator) =>
  locator
    .first()
    .waitFor({ state: 'attached', timeout: 20_000 })
    .then(() => true)
    .catch(() => false);
/** The deep-linked layer is listed in the layer switcher (independent of the base layer, which needs the WMTS capabilities). */
const listed = (pattern: RegExp) => (page: import('playwright').Page) =>
  visible(page.locator('[id^="GPtitle_ID_"]').filter({ hasText: pattern }));
const alertWith = (text: string) => (page: import('playwright').Page) =>
  visible(page.getByRole('alert').filter({ hasText: text }));
const deepLinks: Array<
  [string, string, (page: import('playwright').Page) => Promise<boolean>, string?]
> = [
  // Primary format: cartes.gouv.fr permalink, values emitted by the catalogue (C6).
  [
    'lien l= WMS (stock_carbone_fao_fr_wmsv)',
    '?l=stock_carbone_fao_fr_wmsv$GEOPORTAIL:OGC:WMS(1;1;1;0)&permalink=no',
    listed(/stocks de carbone/i),
    'stock_carbone_fao_fr_wmsv:WMS',
  ],
  [
    'lien l= WMTS Lambert-93 (INRAE_CARTE-SOLS, reprojeté)',
    '?l=INRAE_CARTE-SOLS$GEOPORTAIL:OGC:WMTS(1;1;1;0)&permalink=no',
    listed(/sols dominants/i),
    'INRAE_CARTE-SOLS:WMTS',
  ],
  [
    'lien l= WMS INRAE_CARTE-SOLS (absent du fichier, trouvé sur wms-r)',
    '?l=INRAE_CARTE-SOLS$GEOPORTAIL:OGC:WMS(1;1;1;0)&permalink=no',
    listed(/sol/i),
  ],
  [
    'lien l= vers un nom absent des capacités',
    '?l=INRAE_CARTE-SOLS_WMTS$GEOPORTAIL:OGC:WMTS(1;1;1;0)&permalink=no',
    alertWith('Couche introuvable'),
  ],
  [
    'lien l= TMS (style nommé, non pris en charge)',
    '?l=style$GEOPORTAIL:GPP:TMS(1;1;1;0;c9740106-d6a2-481b-92ae-4e4609a25e49_sols_gironde)&permalink=no',
    (page) =>
      visible(
        page
          .getByRole('status')
          .filter({ hasText: 'c9740106-d6a2-481b-92ae-4e4609a25e49_sols_gironde' }),
      ),
  ],
  [
    // Not the preferred layer of its record: the record's entry must still be ticked.
    'lien l= WMS du RRP du Loiret (erreur serveur M-4)',
    '?l=rrp_loiret_gpkg_11-09-2026_wmsv$GEOPORTAIL:OGC:WMS(1;1;1;0)&permalink=no',
    alertWith('Couche indisponible'),
    'rrp_dept_loiret_gpkg_11-09-2026_wmsv:WMS',
  ],
  // Secondary alias: layer/type/url.
  [
    'alias layer/type/url WMS',
    '?layer=stock_carbone_fao_fr_wmsv&type=WMS&url=https%3A%2F%2Fdata.geopf.fr%2Fwms-v',
    listed(/stocks de carbone/i),
    'stock_carbone_fao_fr_wmsv:WMS',
  ],
  [
    'alias vers un hôte refusé',
    '?layer=x&type=WMS&url=https%3A%2F%2Fexemple.fr%2Fwms-v',
    alertWith('Lien invalide'),
  ],
];
for (const [label, query, assertion, entry] of deepLinks) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const consoleReport = watchConsole(page);
  // `load` + a fixed wait: a slow GPF request must not block the check (no reliance on network idle).
  await page.goto(`${url}${query}`, { waitUntil: 'load' });
  await page.waitForTimeout(4000);
  check(await assertion(page), label);
  if (entry) {
    // The entry of a record with any layer on the map is ticked; unticking it removes that layer.
    await openCatalogue(page);
    const input = page.locator(`input[data-layer="${entry}"]`);
    check(await input.isChecked(), `${label} : entrée cochée dans le catalogue`);
    const before = (await switcherTitles(page)).length;
    await input.focus();
    await page.keyboard.press('Space');
    await page.waitForTimeout(800);
    // The switcher keeps the base layer: one entry fewer, and no notice left.
    check(
      (await switcherTitles(page)).length === before - 1 &&
        (await unavailableNotice(page).count()) === 0,
      `${label} : décocher l’entrée retire la couche du lien (et son avis éventuel)`,
    );
  }
  const { messages, notes } = consoleReport();
  check(messages.length === 0, `${label} : console vide${notes} ${messages.join(' | ')}`);
  await page.close();
}

// Keyboard: tabs with arrows, add/remove with Enter/Space keeps focus, Escape closes the layer list.
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(url, { waitUntil: 'load' });
  // Catalogue at the keyboard: Enter opens it, Tab reaches the search box, the entry's checkbox adds.
  const catalogue = page.getByRole('button', { name: CATALOGUE, exact: true });
  await catalogue.waitFor({ timeout: 30_000 });
  await catalogue.focus();
  await page.keyboard.press('Enter');
  await page.locator('input[data-layer]').first().waitFor({ state: 'attached', timeout: 20_000 });
  let reachedSearch = false;
  for (let i = 0; i < 6 && !reachedSearch; i += 1) {
    await page.keyboard.press('Tab');
    reachedSearch = await page.evaluate(
      () => document.activeElement?.id === 'catalog-input-search-global',
    );
  }
  check(
    (await catalogue.getAttribute('aria-pressed')) === 'true' && reachedSearch,
    'clavier : Entrée ouvre le catalogue, Tab atteint le champ de recherche',
  );
  await page.keyboard.type('carbone');
  await page.waitForTimeout(700);
  const visibleEntries = await page
    .locator('[data-layeritem]')
    .evaluateAll((items) => items.filter((e) => (e as HTMLElement).offsetParent !== null).length);
  check(visibleEntries === 1, `clavier : « carbone » ne laisse qu’une donnée (${visibleEntries})`);
  const entry = page.locator(CARBONE_ENTRY);
  await entry.focus();
  await page.keyboard.press('Space');
  await page.waitForTimeout(1500);
  check(
    (await entry.isChecked()) &&
      (await page.evaluate(() => document.activeElement?.getAttribute('data-layer'))) ===
        'stock_carbone_fao_fr_wmsv:WMS' &&
      (await switcherTitles(page)).some((t) => /stocks de carbone/i.test(t)),
    'clavier : Espace ajoute la couche, le focus reste sur la case cochée',
  );
  await page.keyboard.press('Space');
  await page.waitForTimeout(800);
  check(
    !(await entry.isChecked()) &&
      !(await switcherTitles(page)).some((t) => /stocks de carbone/i.test(t)),
    'clavier : Espace retire la couche',
  );
  await closeCatalogue(page);
  const toggle = page.getByRole('button', { name: 'Ma sélection de cartes' });
  await toggle.focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Escape');
  check(
    (await toggle.getAttribute('aria-pressed')) === 'false' &&
      (await page.evaluate(() => document.activeElement?.id ?? '')).startsWith(
        'GPshowLayersListPicto-',
      ),
    'clavier : Échap ferme la liste des couches et rend le focus à « Ma sélection de cartes »',
  );
  await page.close();
}

// Non-map alternative (?vue=liste): no map, every dataset, links to services and catalogue records.
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const consoleReport = watchConsole(page);
  // v1.1: the list view is kept but no longer linked from the map page (reached by its URL).
  await page.goto(`${url}?vue=liste`, { waitUntil: 'load' });
  check(
    (await page.getByRole('heading', { level: 1, name: 'Liste des données sols' }).count()) === 1,
    'liste : titre de niveau 1',
  );
  check((await page.locator('canvas').count()) === 0, 'liste : aucune carte chargée');
  check((await page.getByRole('article').count()) === 7, 'liste : 7 données');
  check(
    (await page.getByRole('link', { name: /^Fiche de la donnée dans le catalogue/ }).count()) === 7,
    'liste : un lien vers la fiche du catalogue par donnée',
  );
  check(
    (await page.getByRole('link', { name: /^point d’accès/ }).count()) >= 12,
    'liste : un lien vers le point d’accès de chaque service validé',
  );
  const { messages, notes } = consoleReport();
  check(messages.length === 0, `liste : console vide${notes} ${messages.join(' | ')}`);
  await page.close();
}

// D-carto-1: the map must get its canvas on every load, even when the GPF hangs a capabilities request
// (timeout + retry). 20 fresh browser contexts, as in the e2e report.
{
  let missing = 0;
  let slowest = 0;
  for (let i = 0; i < 20; i++) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    const start = Date.now();
    await page.goto(url, { waitUntil: 'load' });
    const ok = await page
      .locator('.map-view canvas')
      .first()
      .waitFor({ state: 'attached', timeout: 20_000 })
      .then(() => true)
      .catch(() => false);
    slowest = Math.max(slowest, Date.now() - start);
    if (!ok) missing += 1;
    await context.close();
  }
  check(
    missing === 0,
    `20 chargements neufs : canvas à chaque fois (${missing} sans canvas, le plus lent ${slowest} ms)`,
  );
}

// M7: header v1 from @sols/brand, compact footer, cartes.gouv.fr layout, controls in both themes.
for (const width of [1024, 1440]) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await page.goto(url, { waitUntil: 'load' });
  await page.locator('.map-view canvas').first().waitFor({ state: 'attached', timeout: 20_000 });
  const layout = await page.evaluate(() => {
    const box = (selector: string) => document.querySelector(selector)?.getBoundingClientRect();
    return {
      map: box('.map-view')?.width ?? 0,
      scroll: document.documentElement.scrollHeight - window.innerHeight,
      footer: box('.fr-footer')?.height ?? 0,
      mapBottom: box('.map-view')?.bottom ?? 0,
      footerTop: box('.fr-footer')?.top ?? 0,
    };
  });
  check(
    layout.map >= width * 0.95,
    `${width}px : la carte prend toute la largeur (${Math.round((layout.map / width) * 100)} %)`,
  );
  check(layout.scroll <= 1, `${width}px : la page ne défile pas (carte jusqu’au pied de page)`);
  check(
    layout.footer <= 64 && Math.abs(layout.footerTop - layout.mapBottom) <= 1,
    `${width}px : pied de page compact (${Math.round(layout.footer)} px) collé à la carte`,
  );
  await page.close();
}

{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(url, { waitUntil: 'load' });
  const header = page.locator('header.fr-header');
  await header.waitFor();
  check(
    (await page
      .locator('.fr-header__brand a[href]')
      .evaluateAll((links) => links.every((link) => link.getAttribute('href') === '/'))) &&
      (await page.locator('header a[href*="cartes.gouv.fr"]').count()) === 0,
    'en-tête : la marque renvoie vers « / », jamais vers cartes.gouv.fr',
  );
  check(
    (await header.locator('.fr-nav').count()) === 0 &&
      (await page.getByRole('navigation', { name: /menu principal/i }).count()) === 0,
    'en-tête : pas de barre de navigation',
  );
  check(
    (await header.getByText(/se connecter/i).count()) === 0,
    'en-tête : pas de « Se connecter »',
  );
  check(
    (await header
      .locator('.fr-badge--purple-glycine', { hasText: brand.badges.carto ?? '' })
      .count()) >= 1,
    `en-tête : badge « ${brand.badges.carto} »`,
  );
  check(
    (await header.getByAltText(brand.header.operator.logoAlt).count()) >= 1,
    'en-tête : logo GIS Sol en opérateur',
  );
  const services = header
    .locator('.fr-header__tools')
    .getByRole('button', { name: brand.header.tools.services.label });
  await services.focus();
  await page.keyboard.press('Enter');
  const servicesPanel = page.locator(`#${await services.getAttribute('aria-controls')}`);
  check(
    (await services.getAttribute('aria-expanded')) === 'true' &&
      (await servicesPanel.getByRole('link').count()) === brand.header.tools.services.items.length,
    'en-tête : « Services » s’ouvre au clavier avec les liens de la marque',
  );
  const chevronTransform = async () => {
    await page.waitForTimeout(400);
    return services
      .locator('.header-menu__chevron')
      .evaluate((el) => getComputedStyle(el).transform);
  };
  check(
    (await chevronTransform()).startsWith('matrix(-1,'),
    'en-tête : chevron de « Services » tourné vers le haut menu ouvert',
  );
  await page.keyboard.press('Tab');
  await page.keyboard.press('Escape');
  check(
    (await services.getAttribute('aria-expanded')) === 'false' &&
      (await page.evaluate(() => document.activeElement?.textContent?.trim() ?? '')).startsWith(
        brand.header.tools.services.label,
      ),
    'en-tête : Échap ferme « Services » et rend le focus au bouton',
  );
  check(
    ['none', 'matrix(1, 0, 0, 1, 0, 0)'].includes(await chevronTransform()),
    'en-tête : chevron de « Services » vers le bas menu fermé',
  );
  const footer = page.getByRole('contentinfo');
  check(
    (await footer.locator('.fr-footer__body, .fr-footer__partners').count()) === 0 &&
      (await footer.getByRole('button', { name: /paramètres d.affichage/i }).count()) === 1 &&
      (await footer.getByRole('link', { name: 'Haut de page' }).count()) === 1,
    'pied de page compact : liens bas, « Paramètres d’affichage », « Haut de page »',
  );
  await page.close();
}

for (const scheme of ['light', 'dark'] as const) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    colorScheme: scheme,
  });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'load' });
  await page.locator('#GPzoomIn').waitFor({ timeout: 20_000 });
  await page.locator('.ol-attribution').waitFor({ state: 'attached', timeout: 20_000 });
  const colours = await page.evaluate(() => {
    const background = (selector: string) => {
      const element = document.querySelector(selector);
      return element ? getComputedStyle(element).backgroundColor : null;
    };
    const probe = document.createElement('div');
    probe.style.backgroundColor = 'var(--background-default-grey)';
    document.body.append(probe);
    const token = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return {
      theme: document.documentElement.getAttribute('data-fr-theme'),
      token,
      zoom: background('#GPzoomIn'),
      attribution: background('.ol-attribution button'),
    };
  });
  check(
    colours.theme === scheme &&
      colours.zoom === colours.token &&
      colours.attribution === colours.token,
    `thème ${scheme} : zoom et attributions sur le fond DSFR (${colours.token} ; zoom ${colours.zoom}, attributions ${colours.attribution})`,
  );
  await context.close();
}

// M8: the tool set of the cartes.gouv.fr map viewer.
const TOOL_BUTTONS = [
  "Ouvrir l'import de couches",
  "Activer/désactiver l'interrogation des couches",
  CONTROL_LABELS.controlList,
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
{
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    acceptDownloads: true,
  });
  const page = await context.newPage();
  const consoleReport = watchConsole(page);
  let prints = 0;
  await page.exposeFunction('reportPrint', () => {
    prints += 1;
  });
  await page.addInitScript(() => {
    window.print = () => {
      (window as unknown as { reportPrint: () => void }).reportPrint();
    };
  });
  await page.goto(url, { waitUntil: 'load' });
  const toolsLoaded = await page
    .locator('[id^="GPcontrolList-"]')
    .waitFor({ timeout: 30_000 })
    .then(() => true)
    .catch(() => false);
  check(
    toolsLoaded,
    'outils : le jeu d’outils geopf-extensions est chargé (« Afficher tous les outils » présent)',
  );
  await page.waitForTimeout(1500);
  for (const name of TOOL_BUTTONS) {
    const button = page.getByRole('button', { name, exact: true });
    check((await button.count()) === 1, `outils : bouton « ${name} » nommé`);
  }
  const unnamedDialogs = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.map-view dialog, .map-view .fr-modal'))
      .filter((d) => !d.hasAttribute('aria-label') && !d.hasAttribute('aria-labelledby'))
      .map((d) => d.id),
  );
  check(
    unnamedDialogs.length === 0,
    `outils : toutes les fenêtres geopf sont nommées (${unnamedDialogs.join(', ') || 'aucune sans nom'})`,
  );
  // Measure a distance: two clicks and a double click, the tooltip shows kilometres.
  await page.getByRole('button', { name: 'Mesurer une distance', exact: true }).click();
  await page.mouse.click(700, 500);
  await page.mouse.click(800, 520);
  await page.mouse.dblclick(900, 560);
  await page.waitForTimeout(800);
  // The measure tooltip is an OpenLayers overlay (`GPmeasureTooltip`).
  const measure = (await page.locator('.ol-overlay-container').allInnerTexts())
    .map((t) => t.trim())
    .find((t) => /\d\s*(km|m)$/.test(t));
  check(Boolean(measure), `outils : mesure de distance effectuée (${measure ?? 'aucune valeur'})`);
  await page.getByRole('button', { name: 'Mesurer une distance', exact: true }).click();
  // Feature info on a sols layer (GeoServer HTML output), legends listing the layer.
  await openCatalogue(page);
  await page.locator(CARBONE_ENTRY).focus();
  await page.keyboard.press('Space');
  await closeCatalogue(page);
  await page.waitForTimeout(3000);
  await page
    .getByRole('button', { name: "Activer/désactiver l'interrogation des couches", exact: true })
    .click();
  // Let the control register its map listener before the (single) click it waits for.
  await page.waitForTimeout(500);
  // Click on central France (inside the sols layer, north of the measure line drawn above). The GeoServer
  // answer lands in a collapsed accordion: wait for its text (textContent, not innerText).
  await page.mouse.click(820, 430);
  const gfiPanel = page.locator('[id^="GPgetFeatureInfoPanel-"]');
  const gfiContent = await page
    .waitForFunction(
      () => {
        const text = document.querySelector('[id^="GPgetFeatureInfoPanel-"]')?.textContent ?? '';
        return /STOCK_C|featureInfo|FID/i.test(text) ? text : null;
      },
      undefined,
      { timeout: 25_000 },
    )
    .then((handle) => handle.jsonValue() as Promise<string>)
    .catch(() => gfiPanel.evaluate((panel) => panel.textContent ?? ''));
  check(
    /stocks de carbone/i.test(gfiContent) && /STOCK_C|featureInfo|FID/i.test(gfiContent),
    `infos : GetFeatureInfo sur la couche sols affiche les attributs (sortie GeoServer) [${gfiContent.replace(/\s+/g, ' ').slice(0, 100)}]`,
  );
  await page
    .getByRole('button', { name: "Activer/désactiver l'interrogation des couches", exact: true })
    .click();
  await page.getByRole('button', { name: 'Légende', exact: true }).click();
  await page.waitForTimeout(500);
  const legendIds = await page
    .locator('.legend-entry-container')
    .evaluateAll((entries) => entries.map((e) => e.id));
  check(
    legendIds.includes('stock_carbone_fao_fr_wmsv') &&
      legendIds.includes('GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2'),
    `légendes : couche sols et fond listés (${legendIds.join(', ')})`,
  );
  check(
    (await page.getByRole('button', { name: /^Afficher la légende : Plan IGN/ }).count()) >= 1,
    'légendes : bouton de dépliage nommé',
  );
  await page.getByRole('button', { name: 'Légende', exact: true }).click();
  // Print: PNG download and the print sheet.
  await page.getByRole('button', { name: PRINT_LABELS.button, exact: true }).click();
  await page.waitForTimeout(400);
  const download = page.waitForEvent('download', { timeout: 20_000 }).catch(() => null);
  await page.getByRole('button', { name: PRINT_LABELS.download }).click();
  const file = await download;
  check(
    file?.suggestedFilename() === 'carte-des-sols.png',
    'impression : téléchargement PNG de la carte',
  );
  await page.getByRole('button', { name: PRINT_LABELS.print }).click();
  await page.waitForTimeout(1500);
  check(
    prints === 1 && (await page.locator('.map-print-sheet img').count()) === 1,
    'impression : la feuille d’impression (titre, image, sources) est produite et window.print appelé',
  );
  await page.keyboard.press('Escape');
  const { messages, notes } = consoleReport();
  check(messages.length === 0, `outils : console vide${notes} ${messages.join(' | ')}`);
  // Last: the panels of the compute tools, then a WMS import (it fits the view to the layer extent and
  // its tiles, loaded without CORS by geopf, taint the canvas: nothing else is printed afterwards).
  // v1.1: « Itinéraire » is a default tool (button on the map); the other two are on demand: their
  // button is hidden until the tool is chosen in « Afficher tous les outils », then stays.
  for (const [name, onDemand] of [
    ['Itinéraire', false],
    ['Zone selon le temps de trajet ou distance', true],
    ['Profil altimétrique', true],
  ] as const) {
    const button = page.getByRole('button', { name, exact: true });
    const hiddenBefore = !(await button.isVisible());
    if (onDemand) {
      await page.getByRole('button', { name: CONTROL_LABELS.controlList, exact: true }).click();
      await page.waitForTimeout(300);
      await page
        .locator('[id^="GPcontrolListPanel-"] li')
        .filter({ hasText: name })
        .first()
        .click();
    } else {
      await button.click();
    }
    await page.waitForTimeout(300);
    const pressed = (await button.getAttribute('aria-pressed')) === 'true';
    const shown = await button.isVisible();
    await button.click();
    await page.waitForTimeout(200);
    check(
      hiddenBefore === onDemand &&
        pressed &&
        shown &&
        (await button.getAttribute('aria-pressed')) === 'false' &&
        (await button.isVisible()),
      `outils : « ${name} » ${onDemand ? 'caché au départ, choisi dans la liste, bouton ajouté' : 'affiché par défaut'}, s’ouvre et se ferme`,
    );
  }
  // Accessibility with « Afficher tous les outils » open (axe-core, default rule set, as the e2e suite).
  await page.getByRole('button', { name: CONTROL_LABELS.controlList, exact: true }).click();
  await page.waitForTimeout(500);
  const axe = await new AxeBuilder({ page }).analyze();
  check(
    axe.violations.length === 0,
    `a11y : axe sans violation avec « Afficher tous les outils » ouvert${
      axe.violations.length
        ? ` : ${axe.violations
            .map(
              (v) => `${v.id} [${v.impact}] ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`,
            )
            .join(' | ')}`
        : ''
    }`,
  );
  await page.getByRole('button', { name: CONTROL_LABELS.controlList, exact: true }).click();
  await page.waitForTimeout(300);
  // WMS import of GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2 ("Plan IGN" on wms-r).
  await page.getByRole('button', { name: "Ouvrir l'import de couches", exact: true }).click();
  await page.locator('[id^="GPimportTypeSelect-"]').selectOption('WMS');
  await page.locator('[id^="GPimportServiceUrl-"]').fill(GPF_ENDPOINTS.wmsRaster);
  await page.locator('[id^="GPimportSubmit-"]').click();
  const capabilitiesListed = await page
    .locator('[id^="GPimportGetCapResults-"] .GPimportGetCapProposal')
    .first()
    .waitFor({ state: 'attached', timeout: 40_000 })
    .then(() => true)
    .catch(() => false);
  check(capabilitiesListed, 'import : les couches du WMS raster de la Géoplateforme sont listées');
  const rubric = page.locator('label.GPimportGetCapRubriqueTitle').first();
  if (!(await page.locator('[id^="GPimportGetCapRubrique-"]').first().isChecked())) {
    await rubric.click();
  }
  const planIgnEntry = page
    .locator('[id^="GPimportGetCapResults-"] .GPimportGetCapProposal')
    .filter({ hasText: /^Plan IGN$/ })
    .first();
  await planIgnEntry.click();
  await page.waitForTimeout(2500);
  const titlesAfterImport = await switcherTitles(page);
  check(
    titlesAfterImport.filter((t) => t === 'Plan IGN').length === 2,
    `import : la couche WMS Plan IGN importée est dans le gestionnaire (${titlesAfterImport.join(' | ')})`,
  );
  await page.getByRole('button', { name: "Ouvrir l'import de couches", exact: true }).click();
  const importReport = consoleReport();
  check(
    importReport.messages.length === 0,
    `import : console vide${importReport.notes} ${importReport.messages.join(' | ')}`,
  );
  await context.close();
}

// M9: the catalogue of the sols datasets (geopf Catalog): entries, record links, producer tags, search,
// one-click add with the legend, no axe violation with the catalogue open.
{
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  const consoleReport = watchConsole(page);
  await page.goto(url, { waitUntil: 'load' });
  await page.getByRole('button', { name: CATALOGUE, exact: true }).waitFor({ timeout: 30_000 });
  const column = await page
    .locator('#position-container-top-right > *')
    .evaluateAll((widgets) => widgets.map((w) => w.id.split('-')[0]));
  check(
    column[0] === 'GPcatalog',
    `catalogue : premier widget de la colonne de droite (${column[0]})`,
  );
  // M12: geopf draws the button icon as a masked ::after filled with a background colour; on our
  // primary (blue) button it must be inverted, open or not.
  const iconContrast = async () =>
    page.evaluate(() => {
      const button = document.querySelector('button[id^="GPshowCatalogPicto-"]');
      if (!button) return false;
      const icon = getComputedStyle(button, '::after').backgroundColor;
      return icon !== getComputedStyle(button).backgroundColor && icon !== 'rgba(0, 0, 0, 0)';
    });
  const iconClosed = await iconContrast();
  await openCatalogue(page);
  check(
    iconClosed && (await iconContrast()),
    'catalogue : icône du bouton primaire visible (couleur inversée), fermé et ouvert',
  );
  const entries = await page.locator('[data-layeritem]').evaluateAll((items) =>
    items.map((item) => ({
      layer: item.querySelector('input')?.getAttribute('data-layer') ?? '',
      name: item.querySelector('input')?.getAttribute('aria-label') ?? '',
      thumbnail: item.querySelector('img')?.getAttribute('src') ?? '',
      record: item.querySelector('a.fr-link')?.getAttribute('href') ?? '',
      producer: item.querySelector('a.fr-tag')?.getAttribute('href') ?? '',
    })),
  );
  check(
    entries.length === 7 &&
      entries.every(
        (e) =>
          e.name.startsWith('Ajouter à la carte : ') &&
          e.thumbnail.startsWith('https://data.geopf.fr/annexes/gissol-osf/thumbnail/') &&
          e.record.startsWith('/rechercher-une-donnee/dataset/') &&
          e.producer === '/rechercher-une-donnee/search?organization=INRAE%20-%20Info%26Sols',
      ),
    `catalogue : 7 données nommées, avec vignette, lien de la fiche et étiquette producteur « organization=INRAE%20-%20Info%26Sols » (${entries.length}, ${entries[0]?.producer})`,
  );
  const producerText = (await page.locator('.catalog-layer-producer').first().innerText()).trim();
  check(
    producerText === 'INRAE - Info&Sols',
    `catalogue : producteur affiché « INRAE - Info&Sols » (${producerText})`,
  );
  const axe = await new AxeBuilder({ page }).analyze();
  check(
    axe.violations.length === 0,
    `a11y : axe sans violation avec le catalogue ouvert${
      axe.violations.length
        ? ` : ${axe.violations
            .map(
              (v) => `${v.id} [${v.impact}] ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`,
            )
            .join(' | ')}`
        : ''
    }`,
  );
  const visibleEntries = () =>
    page
      .locator('[data-layeritem]')
      .evaluateAll((items) => items.filter((e) => (e as HTMLElement).offsetParent !== null).length);
  // The search reads the raw texts (not the escaped display strings): « Info&Sols » matches all.
  await page.locator('#catalog-input-search-global').fill('Info&Sols');
  await page.waitForTimeout(700);
  const byProducer = await visibleEntries();
  check(
    byProducer === 7,
    `catalogue : la recherche « Info&Sols » garde les 7 données (${byProducer})`,
  );
  await page.locator('#catalog-input-search-global').fill('carbone');
  await page.waitForTimeout(700);
  const visible = await visibleEntries();
  check(visible === 1, `catalogue : la recherche « carbone » ne laisse qu’une donnée (${visible})`);
  // M12: the filtered panel keeps a usable height (DSFR tabs would shrink it to ~210 px) and the
  // remaining record is entirely inside it.
  const filtered = await page.evaluate(() => {
    const dialog = document.querySelector('dialog[id^="GPcatalogPanel-"]');
    const entry = Array.from(document.querySelectorAll('[data-layeritem]')).find(
      (e) => (e as HTMLElement).offsetParent !== null,
    );
    if (!dialog || !entry) return null;
    const d = dialog.getBoundingClientRect();
    const r = entry.getBoundingClientRect();
    return { height: Math.round(d.height), fits: r.top >= d.top && r.bottom <= d.bottom };
  });
  check(
    filtered !== null && filtered.height >= 320 && filtered.fits,
    `catalogue filtré : panneau d’au moins 20rem (${filtered?.height ?? '?'} px), donnée entière (${filtered?.fits ?? '?'})`,
  );
  await page.locator(CARBONE_ENTRY).focus();
  await page.keyboard.press('Space');
  await page.waitForTimeout(3000);
  await closeCatalogue(page);
  check(
    (await switcherTitles(page))[0]?.startsWith('Carte nationale des stocks de carbone') === true,
    'catalogue : la donnée ajoutée est en tête du gestionnaire de couches',
  );
  await page.getByRole('button', { name: 'Légende', exact: true }).click();
  await page.waitForTimeout(800);
  // The legend image is lazy: expand the entry, then wait for the GetLegendGraphic image.
  await page
    .getByRole('button', { name: /^Afficher la légende : Carte nationale des stocks/ })
    .click();
  const legendLoaded = await page
    .waitForFunction(
      () => {
        const img = document.querySelector(
          '#stock_carbone_fao_fr_wmsv img',
        ) as HTMLImageElement | null;
        return Boolean(img && img.complete && img.naturalWidth > 0);
      },
      undefined,
      { timeout: 20_000 },
    )
    .then(() => true)
    .catch(() => false);
  check(legendLoaded, 'catalogue : la légende de la donnée ajoutée est chargée (GetLegendGraphic)');
  const { messages, notes } = consoleReport();
  check(messages.length === 0, `catalogue : console vide${notes} ${messages.join(' | ')}`);
  await context.close();
}
// A layer added from the catalogue whose service returns no image gets the same notice as a link.
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const consoleReport = watchConsole(page);
  await page.goto(url, { waitUntil: 'load' });
  await page.getByRole('button', { name: CATALOGUE, exact: true }).waitFor({ timeout: 30_000 });
  await openCatalogue(page);
  await page.locator(LOIRET_ENTRY).focus();
  await page.keyboard.press('Space');
  const noticed = await unavailableNotice(page)
    .waitFor({ timeout: 30_000 })
    .then(() => true)
    .catch(() => false);
  check(
    noticed && (await unavailableNotice(page).innerText()).includes('Loiret'),
    'catalogue : une donnée ajoutée dont le service ne renvoie pas d’image est signalée (« Couche indisponible »)',
  );
  const before = (await switcherTitles(page)).length;
  await page.locator(LOIRET_ENTRY).focus();
  await page.keyboard.press('Space');
  await page.waitForTimeout(800);
  check(
    (await unavailableNotice(page).count()) === 0 &&
      (await switcherTitles(page)).length === before - 1,
    'catalogue : décocher la donnée retire la couche et son avis',
  );
  const { messages, notes } = consoleReport();
  check(messages.length === 0, `catalogue (Loiret) : console vide${notes} ${messages.join(' | ')}`);
  await page.close();
}
{
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
  await page.goto(url, { waitUntil: 'load' });
  await page.getByRole('button', { name: CATALOGUE, exact: true }).waitFor({ timeout: 30_000 });
  await openCatalogue(page);
  const panel = await page.locator('[id^="GPcatalogPanel-"]').boundingBox();
  check(
    Boolean(panel && panel.x >= 0 && panel.width <= 375),
    `375px : le catalogue tient dans la largeur de l’écran (x = ${Math.round(panel?.x ?? -1)}, ${Math.round(panel?.width ?? 0)} px)`,
  );
  // M12: the open catalogue leaves the button column usable (layer switcher reachable without closing).
  const switcherButton = page.getByRole('button', { name: 'Ma sélection de cartes' }).first();
  const switcherBox = await switcherButton.boundingBox();
  const hit = switcherBox
    ? await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.id ?? '', {
        x: switcherBox.x + switcherBox.width / 2,
        y: switcherBox.y + switcherBox.height / 2,
      })
    : '';
  check(
    Boolean(panel && switcherBox && panel.x + panel.width <= switcherBox.x) &&
      hit === (await switcherButton.getAttribute('id')),
    `375px : catalogue ouvert, le gestionnaire de couches reste atteignable (panneau jusqu’à ${Math.round((panel?.x ?? 0) + (panel?.width ?? 0))} px, bouton à ${Math.round(switcherBox?.x ?? -1)} px)`,
  );
  await switcherButton.click();
  await page.waitForTimeout(500);
  check(
    (await page
      .locator('[id^="GPlayerSwitcherPanel-"], [id^="GPlayersListPanel-"]')
      .first()
      .isVisible()) || (await switcherButton.getAttribute('aria-pressed')) === 'true',
    '375px : le gestionnaire s’ouvre par-dessus le catalogue ouvert',
  );
  await page.close();
}

// Mobile (M8, v1.1): the default tools and « Afficher tous les outils » (last) are visible, the
// on-demand tools are not; a panel fills the map width.
{
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
  await page.goto(url, { waitUntil: 'load' });
  await page
    .locator('[id^="GPcontrolList-"]')
    .waitFor({ timeout: 30_000 })
    .catch(() => undefined);
  await page.waitForTimeout(1000);
  const columnIds = await page
    .locator('#position-container-top-right > *')
    .evaluateAll((widgets) =>
      widgets
        .filter((w) => getComputedStyle(w.querySelector('button') ?? w).display !== 'none')
        .map((w) => w.id.split('-')[0]),
    );
  check(
    (await page.getByRole('button', { name: 'Mesurer une distance', exact: true }).isVisible()) &&
      !(await page
        .getByRole('button', { name: 'Zone selon le temps de trajet ou distance', exact: true })
        .isVisible()) &&
      columnIds.at(-1) === 'GPcontrolList',
    `375px : outils par défaut visibles, outils à la demande cachés, « Afficher tous les outils » en dernier (${columnIds.join(' ')})`,
  );
  const toolsButton = page.getByRole('button', { name: CONTROL_LABELS.controlList, exact: true });
  await toolsButton.focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(400);
  const firstEntryFocused = await page.evaluate(
    () => document.activeElement?.closest('[id^="GPcontrolListPanel-"] li') !== null,
  );
  // Arrow down to « Itinéraire » (sixth entry), Enter activates it: the list closes, the panel shows.
  for (let i = 0; i < 5; i += 1) await page.keyboard.press('ArrowDown');
  const onRoute = await page.evaluate(
    () => document.activeElement?.textContent?.trim() === 'Itinéraire',
  );
  await page.keyboard.press('Enter');
  await page.waitForTimeout(800);
  const panel = await page.locator('[id^="GProutePanel-"]').boundingBox();
  const listClosed = (await toolsButton.getAttribute('aria-pressed')) === 'false';
  const focusOnTools = await page.evaluate(
    () => document.activeElement?.id.startsWith('GPshowControlListPicto-') === true,
  );
  check(
    firstEntryFocused && onRoute,
    '375px : Entrée ouvre « Afficher tous les outils » sur sa première entrée, les flèches y circulent',
  );
  check(
    listClosed && focusOnTools && Boolean(panel && panel.width >= 360 && panel.x <= 8),
    `375px : Entrée sur « Itinéraire » ferme la liste, rend le focus à « Afficher tous les outils » et ouvre le panneau sur la largeur de la carte (${Math.round(panel?.width ?? 0)} px)`,
  );
  await page.close();
}

// M11: axe at 375 px, dark theme, page idle. Headless Chromium starts with the pointer at (0, 0), on the header
// brand block: DSFR `.fr-enlarge-link:hover` then paints it `--background-lifted-grey-hover` (#3f3f3f) under the
// « Menu » button (#8585f6, 3.35:1). Upstream DSFR, same on the edito (doc/agents/geopf-ext.md §9.7, QUESTIONS M-5).
{
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    colorScheme: 'dark',
  });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'load' });
  await page.locator('.ol-viewport canvas').first().waitFor({ timeout: 30_000 });
  const seriousViolations = async () =>
    (await new AxeBuilder({ page }).analyze()).violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical',
    );
  const describe = (violations: Awaited<ReturnType<typeof seriousViolations>>) =>
    violations
      .map((v) => `${v.id} [${v.impact}] ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)
      .join(' | ');
  await page.mouse.move(370, 806);
  await page.waitForTimeout(800);
  const idle = await seriousViolations();
  check(
    idle.length === 0,
    `a11y 375px sombre, page au repos : axe sans violation grave${idle.length ? ` : ${describe(idle)}` : ''}`,
  );
  await page.mouse.move(8, 8);
  await page.waitForTimeout(400);
  const hovered = await seriousViolations();
  const onlyKnownDsfr = hovered.every(
    (v) =>
      v.id === 'color-contrast' &&
      v.nodes.every((n) => n.target.join(' ') === '#en-tete-menu-button'),
  );
  check(
    onlyKnownDsfr,
    `a11y 375px sombre, pointeur sur la marque : seul le contraste DSFR connu du bouton « Menu » (M-5)${
      onlyKnownDsfr ? '' : ` : ${describe(hovered)}`
    }`,
  );
  await context.close();
}

await browser.close();
process.exit(failed ? 1 : 0);
