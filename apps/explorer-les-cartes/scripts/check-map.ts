/**
 * Browser check of the map page (Playwright, headless Chromium), run against a running preview:
 *   bun run build:all && PORT=8101 bun run preview:all   (repository root)
 *   bun run check:map [url]                              (this app; default http://localhost:8101/explorer-les-cartes/)
 * Asserts at 375, 768 and 1280 px: the zoom-in button is clickable (not covered by the search engine),
 * the search engine never overlaps the zoom column, the attribution/rotate buttons and the search input
 * have accessible names, and no console error or warning is logged. Exits 1 on failure.
 */
import { chromium } from 'playwright';
import { CONTROL_LABELS } from '../src/config/map';

const url = process.argv[2] ?? 'http://localhost:8101/explorer-les-cartes/';
const browser = await chromium.launch();
let failed = false;
const check = (ok: boolean, message: string) => {
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${message}\n`);
  if (!ok) failed = true;
};

for (const width of [375, 768, 1280]) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  const messages: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') messages.push(m.text());
  });
  page.on('pageerror', (e) => messages.push(e.message));
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
  check(
    messages.length === 0,
    `${width}px : aucune erreur ni alerte console ${messages.join(' | ')}`,
  );
  await page.close();
}

await browser.close();
process.exit(failed ? 1 : 0);
