/**
 * Browser check of the map page (Playwright, headless Chromium), run against a running preview:
 *   bun run build:all && PORT=8101 bun run preview:all   (repository root)
 *   bun run check:map [url]                              (this app; default http://localhost:8101/explorer-les-cartes/)
 * Asserts at 375, 768 and 1280 px: the zoom-in button is clickable (not covered by the search engine),
 * the search engine never overlaps the zoom column, the attribution/rotate buttons and the search input
 * have accessible names, and no console error or warning is logged.
 * Sols layers (M4): a layer added from the "Données sols" tab with the keyboard is drawn (GetMap answered
 * with image/png) and listed in the layer switcher; the "Voir sur la carte" deep links add their layer
 * (WMS, and the Lambert-93 WMTS reprojected), or show "Couche introuvable" / "Format non pris en charge".
 * Exits 1 on failure.
 */
import { chromium } from 'playwright';
import { CONTROL_LABELS } from '../src/config/map';

const url = process.argv[2] ?? 'http://localhost:8101/explorer-les-cartes/';

/**
 * Console messages of a page, minus the "Failed to load resource" lines caused by GPF tiles that
 * failed once and loaded on the single retry (intermittent GPF errors, doc/agents/QUESTIONS.md M-2).
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
    const recovered = failed.filter(([, codes]) => codes.at(-1) === 200);
    const unexplained = messages.filter((m) => !m.startsWith('Failed to load resource'));
    const loadErrors = messages.length - unexplained.length;
    const notes = recovered.length
      ? ` (${recovered.length} tuile(s) GPF en erreur puis rechargée(s))`
      : '';
    if (loadErrors > recovered.length) {
      unexplained.push(
        ...failed.filter(([, c]) => c.at(-1) !== 200).map(([u, c]) => `${c.join('→')} ${u}`),
      );
      if (unexplained.length === 0) unexplained.push(`${loadErrors} ressource(s) en erreur`);
    }
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
  await page.goto(url, { waitUntil: 'networkidle' });
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
  check(
    (await page.getByRole('button', { name: CONTROL_LABELS.attribution }).count()) === 1,
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
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.getByRole('tab', { name: 'Données sols' }).click();
  const title =
    'Carte nationale des stocks de carbone des sols intégrée dans la carte mondiale de la FAO';
  const add = page.getByRole('button', { name: new RegExp(`^Ajouter à la carte\\s*: ${title}$`) });
  await add.focus();
  await page.keyboard.press('Enter');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
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

const deepLinks: Array<[string, string, (page: import('playwright').Page) => Promise<boolean>]> = [
  [
    'lien WMS (couche du fichier généré)',
    '?layer=stock_carbone_fao_fr_wmsv&type=WMS&url=https%3A%2F%2Fdata.geopf.fr%2Fwms-v',
    async (page) => (await switcherTitles(page)).length === 2,
  ],
  [
    'lien WMTS Lambert-93 (INRAE_CARTE-SOLS, reprojeté)',
    '?layer=INRAE_CARTE-SOLS&type=WMTS&url=https%3A%2F%2Fdata.geopf.fr%2Fwmts',
    async (page) => (await switcherTitles(page)).length === 2,
  ],
  [
    'lien vers un nom absent des capacités',
    '?layer=INRAE_CARTE-SOLS_WMTS&type=WMTS&url=https%3A%2F%2Fdata.geopf.fr%2Fwmts',
    async (page) =>
      (await page.getByRole('alert').filter({ hasText: 'Couche introuvable' }).count()) === 1,
  ],
  [
    'lien TMS (style MapLibre)',
    '?layer=style&type=TMS&url=https%3A%2F%2Fdata.geopf.fr%2Fannexes%2Fgissol-osf%2Fstyle%2Fc9740106-d6a2-481b-92ae-4e4609a25e49_sols_gironde.json',
    async (page) =>
      (await page.getByRole('status').filter({ hasText: 'Format non pris en charge' }).count()) ===
      1,
  ],
];
for (const [label, query, assertion] of deepLinks) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const consoleReport = watchConsole(page);
  await page.goto(`${url}${query}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
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

await browser.close();
process.exit(failed ? 1 : 0);
