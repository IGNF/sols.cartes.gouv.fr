/**
 * Browser check of the map page (Playwright, headless Chromium), run against a running preview:
 *   bun run build:all && PORT=8101 bun run preview:all   (repository root)
 *   bun run check:map [url]                              (this app; default http://localhost:8101/explorer-les-cartes/)
 * Asserts at 375, 768 and 1280 px: the zoom-in button is clickable (not covered by the search engine),
 * the search engine never overlaps the zoom column, the attribution/rotate buttons and the search input
 * have accessible names, and no console error or warning is logged.
 * Sols layers (M4): a layer added from the "Données sols" tab with the keyboard is drawn (GetMap answered
 * with image/png) and listed in the layer switcher; the "Voir sur la carte" deep links (`l=` cartes.gouv.fr
 * permalink, and the `layer/type/url` alias) add their layer or show the matching notice.
 * M5: keyboard (tabs, add/remove focus, Escape on the layer list) and the non-map list view (?vue=liste).
 * M6: a canvas on 20 fresh loads (D-carto-1) and the side panel closed by default at 375 px.
 * M7: header v1 (brand), compact footer, map width and no page scroll, controls in both themes.
 * M8: the geopf-extensions tool set (every button named and operable, a distance measured, a WMS import of
 * GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2, feature info on a sols layer, legends), the share permalink reopened
 * with the same layers, the print dialog (PNG download, print sheet); mobile tools through « Mes outils ».
 * Exits 1 on failure.
 */
import { chromium } from 'playwright';
import brand from '@sols/brand/brand.json';
import { CONTROL_LABELS, PRINT_LABELS, SHARE_LABELS } from '../src/config/map';
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
 * Console messages of a page, minus the "Failed to load resource" lines caused by GPF tiles, as long as
 * failed tiles stay within TILE_ERROR_TOLERANCE of the tile requests (doc/agents/QUESTIONS.md M-2, same
 * tolerance as the e2e suite). Other messages always count.
 */
function watchConsole(page: import('playwright').Page) {
  const messages: string[] = [];
  const tiles = new Map<string, number[]>();
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') messages.push(m.text());
  });
  page.on('pageerror', (e) => messages.push(e.message));
  page.on('response', (r) => {
    if (/REQUEST=Get(Tile|Map)/i.test(r.url()))
      tiles.set(r.url(), [...(tiles.get(r.url()) ?? []), r.status()]);
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
    if (loadErrors > 0 && (!withinTolerance || failed.length === 0)) {
      unexplained.push(...lost.map(([u, c]) => `${c.join('→')} ${u}`));
      if (failed.length === 0) unexplained.push(`${loadErrors} ressource(s) en erreur hors tuiles`);
    }
    const noted = [
      ...(failed.length
        ? [
            `${failed.length} tuile(s) GPF en erreur sur ${tiles.size}, dont ${lost.length} perdue(s), tolérance ${TILE_ERROR_TOLERANCE * 100} %`,
          ]
        : []),
      ...(upstream ? [`${upstream} avertissement(s) amont geopf-ext (niveaux de gris)`] : []),
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

{
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const images: string[] = [];
  page.on('response', (r) => {
    if (/REQUEST=GetMap/i.test(r.url()))
      images.push(`${r.status()} ${r.headers()['content-type']}`);
  });
  await page.goto(url, { waitUntil: 'load' });
  await page.getByRole('tab', { name: 'Données sols' }).click();
  const title =
    'Carte nationale des stocks de carbone des sols intégrée dans la carte mondiale de la FAO';
  const add = page.getByRole('button', { name: new RegExp(`^Ajouter à la carte\\s*: ${title}$`) });
  await add.focus();
  const firstGetMap = page.waitForResponse((r) => /REQUEST=GetMap/i.test(r.url()), {
    timeout: 30_000,
  });
  await page.keyboard.press('Enter');
  await firstGetMap;
  await page.waitForTimeout(3000);
  check(
    images.length > 0 && images.every((i) => i === '200 image/png'),
    `couche sols ajoutée au clavier : ${images.length} GetMap, toutes « 200 image/png »`,
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
const deepLinks: Array<[string, string, (page: import('playwright').Page) => Promise<boolean>]> = [
  // Primary format: cartes.gouv.fr permalink, values emitted by the catalogue (C6).
  [
    'lien l= WMS (stock_carbone_fao_fr_wmsv)',
    '?l=stock_carbone_fao_fr_wmsv$GEOPORTAIL:OGC:WMS(1;1;1;0)&permalink=no',
    listed(/stocks de carbone/i),
  ],
  [
    'lien l= WMTS Lambert-93 (INRAE_CARTE-SOLS, reprojeté)',
    '?l=INRAE_CARTE-SOLS$GEOPORTAIL:OGC:WMTS(1;1;1;0)&permalink=no',
    listed(/sols dominants/i),
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
    'lien l= WMS du RRP du Loiret (erreur serveur M-4)',
    '?l=rrp_loiret_gpkg_11-09-2026_wmsv$GEOPORTAIL:OGC:WMS(1;1;1;0)&permalink=no',
    alertWith('Couche indisponible'),
  ],
  // Secondary alias: layer/type/url.
  [
    'alias layer/type/url WMS',
    '?layer=stock_carbone_fao_fr_wmsv&type=WMS&url=https%3A%2F%2Fdata.geopf.fr%2Fwms-v',
    listed(/stocks de carbone/i),
  ],
  [
    'alias vers un hôte refusé',
    '?layer=x&type=WMS&url=https%3A%2F%2Fexemple.fr%2Fwms-v',
    alertWith('Lien invalide'),
  ],
];
for (const [label, query, assertion] of deepLinks) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const consoleReport = watchConsole(page);
  // `load` + a fixed wait: a slow GPF request must not block the check (no reliance on network idle).
  await page.goto(`${url}${query}`, { waitUntil: 'load' });
  await page.waitForTimeout(4000);
  check(await assertion(page), label);
  check(
    (await page.getByRole('tab', { name: 'Données sols' }).getAttribute('aria-selected')) ===
      'true' && (await page.locator('[role=tab][aria-selected=true]').count()) === 1,
    `${label} : onglet « Données sols » seul sélectionné`,
  );
  const { messages, notes } = consoleReport();
  check(messages.length === 0, `${label} : console vide${notes} ${messages.join(' | ')}`);
  await page.close();
}

// Keyboard: tabs with arrows, add/remove with Enter/Space keeps focus, Escape closes the layer list.
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(url, { waitUntil: 'load' });
  const focused = () =>
    page.evaluate(() => {
      const element = document.activeElement;
      return `${element?.getAttribute('role') ?? element?.tagName}:${(element?.textContent ?? '').trim()}`;
    });
  await page.getByRole('tab', { name: 'Fonds de carte' }).focus();
  await page.keyboard.press('ArrowRight');
  check(
    (await focused()) === 'tab:Données sols' &&
      (await page.getByRole('heading', { level: 2, name: 'Données sols' }).count()) === 1,
    'clavier : flèche droite sélectionne l’onglet « Données sols »',
  );
  const add = page.getByRole('button', {
    name: /^Ajouter à la carte\s*: Carte nationale des stocks/,
  });
  await add.focus();
  await page.keyboard.press('Enter');
  check(
    (await focused()).startsWith('BUTTON:Retirer de la carte'),
    'clavier : Entrée ajoute la couche, le focus reste sur le bouton (« Retirer de la carte »)',
  );
  await page.keyboard.press(' ');
  check(
    (await focused()).startsWith('BUTTON:Ajouter à la carte'),
    'clavier : Espace retire la couche, le focus reste sur le bouton (« Ajouter à la carte »)',
  );
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
  await page.goto(url, { waitUntil: 'load' });
  await page
    .getByRole('link', { name: 'Version accessible de la liste des données' })
    .first()
    .click();
  await page.waitForURL(/vue=liste/);
  await page.waitForLoadState('load');
  check(
    new URL(page.url()).search === '?vue=liste',
    'liste : lien « Version accessible » depuis la carte',
  );
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

// Mobile: side panel closed by default below the DSFR md breakpoint, map above the fold, toggle first.
{
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
  await page.goto(url, { waitUntil: 'load' });
  const toggle = page.getByRole('button', { name: 'Afficher le panneau' });
  await toggle.waitFor({ state: 'attached', timeout: 15_000 }).catch(() => undefined);
  check(
    (await toggle.getAttribute('aria-expanded')) === 'false' &&
      !(await page.locator('#panneau-lateral').isVisible()),
    '375px : panneau latéral fermé par défaut',
  );
  const mapBox = await page.locator('.map-view').boundingBox();
  check(
    Boolean(mapBox && mapBox.y < 812),
    `375px : la carte commence au-dessus du pli (y = ${Math.round(mapBox?.y ?? -1)} px)`,
  );
  await toggle.focus();
  await page.keyboard.press('Enter');
  check(
    (await page
      .getByRole('button', { name: 'Masquer le panneau' })
      .getAttribute('aria-expanded')) === 'true' &&
      (await page.getByRole('tab', { name: 'Fonds de carte' }).isVisible()),
    '375px : Entrée sur « Afficher le panneau » ouvre le panneau et ses onglets',
  );
  await page.close();
}
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(url, { waitUntil: 'load' });
  check(
    await page
      .getByRole('button', { name: 'Masquer le panneau' })
      .waitFor({ state: 'attached', timeout: 15_000 })
      .then(() => true)
      .catch(() => false),
    '1280px : panneau latéral ouvert par défaut',
  );
  await page.close();
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
      panelOpen: !(document.getElementById('panneau-lateral')?.hidden ?? true),
      scroll: document.documentElement.scrollHeight - window.innerHeight,
      footer: box('.fr-footer')?.height ?? 0,
      mapBottom: box('.map-view')?.bottom ?? 0,
      footerTop: box('.fr-footer')?.top ?? 0,
    };
  });
  check(
    layout.panelOpen && layout.map >= width * 0.6,
    `${width}px : panneau ouvert, la carte garde ${Math.round((layout.map / width) * 100)} % de la largeur (≥ 60 %)`,
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
  await page.keyboard.press('Tab');
  await page.keyboard.press('Escape');
  check(
    (await services.getAttribute('aria-expanded')) === 'false' &&
      (await page.evaluate(() => document.activeElement?.textContent?.trim() ?? '')).startsWith(
        brand.header.tools.services.label,
      ),
    'en-tête : Échap ferme « Services » et rend le focus au bouton',
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
const CARBONE = /^Ajouter à la carte\s*: Carte nationale des stocks/;
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
    'outils : le jeu d’outils geopf-extensions est chargé (« Mes outils » présent)',
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
  await page.getByRole('tab', { name: 'Données sols' }).click();
  await page.getByRole('button', { name: CARBONE }).click();
  await page.waitForTimeout(3000);
  await page
    .getByRole('button', { name: "Activer/désactiver l'interrogation des couches", exact: true })
    .click();
  await page.mouse.click(760, 500);
  // The GeoServer answer lands in a collapsed accordion: read textContent, not innerText.
  const gfiPanel = page.locator('[id^="GPgetFeatureInfoPanel-"]');
  const gfiContent = await gfiPanel
    .locator('.fr-accordion')
    .first()
    .waitFor({ state: 'attached', timeout: 20_000 })
    .then(() => page.waitForTimeout(1500))
    .then(() => gfiPanel.evaluate((panel) => panel.textContent ?? ''))
    .catch(() => '');
  check(
    /stocks de carbone/i.test(gfiContent) && /STOCK_C|featureInfo|FID/i.test(gfiContent),
    'infos : GetFeatureInfo sur la couche sols affiche les attributs (sortie GeoServer)',
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
  // Share: the permalink carries the view, the base layer and the sols layer, and reopens the same map.
  await page.getByRole('button', { name: SHARE_LABELS.button, exact: true }).click();
  await page.waitForTimeout(500);
  const permalink = await page
    .getByRole('textbox', { name: new RegExp(`^${SHARE_LABELS.linkLabel}`) })
    .inputValue();
  const query = new URL(permalink || url).searchParams;
  check(
    permalink.startsWith(url) &&
      /^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/.test(query.get('c') ?? '') &&
      Number.isFinite(Number(query.get('z'))) &&
      (query.get('l') ?? '').startsWith(
        'GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2$GEOPORTAIL:OGC:WMTS(0;',
      ) &&
      (query.get('l') ?? '').includes('stock_carbone_fao_fr_wmsv$GEOPORTAIL:OGC:WMS(') &&
      query.get('permalink') === 'yes',
    `partage : permalien au format cartes.gouv.fr (${permalink.slice(url.length, url.length + 90)}…)`,
  );
  await page.keyboard.press('Escape');
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
  for (const name of [
    'Itinéraire',
    'Zone selon le temps de trajet ou distance',
    'Profil altimétrique',
  ]) {
    const button = page.getByRole('button', { name, exact: true });
    await button.click();
    await page.waitForTimeout(300);
    const pressed = (await button.getAttribute('aria-pressed')) === 'true';
    await button.click();
    await page.waitForTimeout(200);
    check(
      pressed && (await button.getAttribute('aria-pressed')) === 'false',
      `outils : « ${name} » s’ouvre et se ferme`,
    );
  }
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
  // The permalink reopens the same layers in a fresh page.
  const reopened = await context.newPage();
  const reopenedReport = watchConsole(reopened);
  await reopened.goto(permalink, { waitUntil: 'load' });
  const sameLayers = await visible(
    reopened.locator('[id^="GPtitle_ID_"]').filter({ hasText: /stocks de carbone/i }),
  );
  await reopened.waitForTimeout(1000);
  const reopenedTitles = await switcherTitles(reopened);
  check(
    sameLayers && reopenedTitles.includes('Plan IGN'),
    `partage : le permalien rouvre les mêmes couches (${reopenedTitles.join(' | ')})`,
  );
  const reopenedConsole = reopenedReport();
  check(
    reopenedConsole.messages.length === 0,
    `partage : console vide à la réouverture${reopenedConsole.notes} ${reopenedConsole.messages.join(' | ')}`,
  );
  await context.close();
}

// M8 mobile: the listable tools are hidden, « Mes outils » opens them; a panel fills the map width.
{
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
  await page.goto(url, { waitUntil: 'load' });
  await page
    .locator('[id^="GPcontrolList-"]')
    .waitFor({ timeout: 30_000 })
    .catch(() => undefined);
  await page.waitForTimeout(1000);
  check(
    !(await page.getByRole('button', { name: 'Mesurer une distance', exact: true }).isVisible()) &&
      (await page
        .getByRole('button', { name: CONTROL_LABELS.controlList, exact: true })
        .isVisible()),
    '375px : outils listables masqués, « Mes outils » visible',
  );
  await page.getByRole('button', { name: CONTROL_LABELS.controlList, exact: true }).click();
  await page.locator('[id^="GPcontrolListPanel-"] li', { hasText: 'Itinéraire' }).click();
  await page.waitForTimeout(800);
  const panel = await page.locator('[id^="GProutePanel-"]').boundingBox();
  check(
    Boolean(panel && panel.width >= 360 && panel.x <= 8),
    `375px : « Itinéraire » ouvert depuis « Mes outils » occupe la largeur de la carte (${Math.round(panel?.width ?? 0)} px)`,
  );
  await page.close();
}

await browser.close();
process.exit(failed ? 1 : 0);
