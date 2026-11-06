import { expect, type Page } from '@playwright/test';
import { readFileSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export interface ConsoleIssues {
  errors: string[];
}

/** Collecte tous les `console.error` et `pageerror`, sans rien ignorer. */
export function collectConsole(page: Page): ConsoleIssues {
  const issues: ConsoleIssues = { errors: [] };
  page.on('console', (msg) => {
    if (msg.type() === 'error')
      issues.errors.push(`console: ${msg.text()} @ ${msg.location().url}`);
  });
  page.on('pageerror', (err) => issues.errors.push(`pageerror: ${err.message}`));
  return issues;
}

/** Retire les erreurs tolérées (motif + raison documentée) et renvoie le reste. */
export function untolerated(
  errors: string[],
  tolerated: { pattern: RegExp; reason: string }[],
): string[] {
  return errors.filter((e) => !tolerated.some((t) => t.pattern.test(e)));
}

export const RECORD_STOCK_CARBONE = 'osff858525a-9fea-5ae3-93ab-43afab78483f';

/** Lu depuis @sols/brand pour rester aligné avec le pied de page. */
export const GISSOL_URL: string = (
  JSON.parse(
    readFileSync(
      resolve(dirname(fileURLToPath(import.meta.url)), '../../packages/brand/brand.json'),
      'utf8',
    ),
  ) as { external: { gissol: string } }
).external.gissol;

export const PAGES = {
  home: '/fr/',
  aide: '/fr/aide/',
  catalogue: '/rechercher-une-donnee/',
  carto: '/explorer-les-cartes/',
  liste: '/explorer-les-cartes/?vue=liste',
  fiche: `/rechercher-une-donnee/dataset/${RECORD_STOCK_CARBONE}`,
} as const;

/** Pages dont axe doit rester sans violation critique/sérieuse (fiche incluse depuis C7). */
export const AXE_STRICT = ['home', 'aide', 'catalogue', 'carto', 'liste', 'fiche'] as const;

/** Nombre de chargements du test de stabilité du rendu de la carte (D-carto-1). */
export const MAP_STABILITY_RUNS = 20;
export const GPF_WMTS = 'data.geopf.fr/wmts';
export const SOLS_GROUP = 'gissol-osf_g';
export const SOLS_LAYER = 'stock_carbone_fao_fr_wmsv';
export const GPF_WMS_V = 'data.geopf.fr/wms-v';
export const DEEP_LINK_WMS = `/explorer-les-cartes/?l=${SOLS_LAYER}$GEOPORTAIL:OGC:WMS(1;1;1;0)&permalink=no`;
export const DEEP_LINK_LOIRET =
  '/explorer-les-cartes/?l=rrp_loiret_gpkg_11-09-2026_wmsv$GEOPORTAIL:OGC:WMS(1;1;1;0)&permalink=no';
export const DEEP_LINK_WMTS =
  '/explorer-les-cartes/?l=INRAE_CARTE-SOLS$GEOPORTAIL:OGC:WMTS(1;1;1;0)&permalink=no';
export const DEEP_LINK_UNKNOWN =
  '/explorer-les-cartes/?l=nexiste_pas$GEOPORTAIL:OGC:WMS(1;1;1;0)&permalink=no';

export interface GpfResponse {
  url: string;
  status: number;
  contentType: string;
}

/** Enregistre les réponses dont l'URL contient `fragment` (tuiles, GetMap). */
export function trackResponses(page: Page, fragment: string): GpfResponse[] {
  const out: GpfResponse[] = [];
  page.on('response', (r) => {
    if (r.url().includes(fragment))
      out.push({
        url: r.url(),
        status: r.status(),
        contentType: r.headers()['content-type'] ?? '',
      });
  });
  return out;
}

/** Flake GPF (question M-2) : 400/404 ponctuels de tuiles, comptés séparément et tolérés jusqu'à 10 %. */
export const GPF_TILE_FLAKE =
  /Failed to load resource: the server responded with a status of (400|404|502|503).*data\.geopf\.fr\/(wmts|wms-v|wms-r)/;

export function expectFlakeWithin(
  responses: GpfResponse[],
  testInfo: { annotations: { type: string; description?: string }[] },
  label: string,
): string | null {
  const bad = responses.filter((t) => t.status !== 200);
  testInfo.annotations.push({
    type: 'flake GPF',
    description: `${label} : ${responses.length} requêtes, ${bad.length} non-200`,
  });
  // Seuil : 10 % des requêtes, au moins 2 (sur un petit échantillon, une tuile isolée pèse 10 % à elle seule).
  return bad.length <= Math.max(2, Math.ceil(responses.length * 0.1))
    ? null
    : `trop de réponses non-200 (${bad.length}/${responses.length}): ${bad[0]?.status} ${bad[0]?.url}`;
}
export const MAX_SCREENSHOT_BYTES = 300_000;

/** Dossier de sortie (captures, axe), indépendant du répertoire courant. */
export const OUT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../../doc/e2e');

/** Attend la liste de résultats du catalogue et renvoie le nombre annoncé (au moins 1 résultat exigé). */
export async function waitForCatalogueResults(page: Page): Promise<number> {
  const count = page.getByText(/\d+ résultats?/).first();
  await count.waitFor({ timeout: 60_000 });
  await page
    .locator('gn-ui-record-preview-row, gn-ui-record-preview-list')
    .first()
    .waitFor({ timeout: 60_000 });
  const n = Number(/(\d+)/.exec(await count.innerText())?.[1] ?? 0);
  if (n < 1) throw new Error(`aucun résultat dans le catalogue (« ${await count.innerText()} »)`);
  return n;
}

/** Vrai si le corps d'une requête `_search` demande des résultats (`size` > 0). */
export function isResultQuery(body: string): boolean {
  try {
    return Number((JSON.parse(body) as { size?: number }).size ?? 0) > 0;
  } catch {
    return true; // corps illisible : traité comme requête de résultats, donc contrôlé
  }
}

/** Ouvre le menu « Services » de l'en-tête (sur mobile : d'abord le menu burger) et le renvoie. */
export async function openServicesMenu(page: Page, isMobile: boolean) {
  await waitForDsfr(page);
  if (isMobile) await page.locator('header .fr-btn--menu').click();
  const button = page
    .locator('header')
    .getByRole('button', { name: 'Services' })
    .locator('visible=true');
  // Le JS DSFR pose `data-fr-js` avant d'attacher tous ses gestionnaires : on réessaie le clic jusqu'à l'ouverture.
  await expect(async () => {
    if ((await button.getAttribute('aria-expanded')) !== 'true') await button.click();
    await expect(button).toHaveAttribute('aria-expanded', 'true', { timeout: 1500 });
  }).toPass({ timeout: 15_000 });
  return button;
}

/** Capture JPEG sous 300 kB : baisse la qualité (55, 40, 30, 20) jusqu'à tenir ; échoue sinon. */
export async function shootJpeg(
  page: Page,
  file: string,
  options: {
    fullPage?: boolean;
    clip?: { x: number; y: number; width: number; height: number };
  } = {},
): Promise<void> {
  for (const quality of [55, 40, 30, 20]) {
    await page.screenshot({ path: file, type: 'jpeg', quality, scale: 'css', ...options });
    if (statSync(file).size < MAX_SCREENSHOT_BYTES) return;
  }
  throw new Error(`${file} dépasse 300 kB même à qualité 20`);
}

/** Attend l'initialisation du JS DSFR (les menus ne répondent pas avant). */
export async function waitForDsfr(page: Page): Promise<void> {
  await expect(page.locator('html')).toHaveAttribute('data-fr-js', 'true');
}

/** Ouvre le catalogue des données sols (contrôle geopf, M9) et attend son panneau. */
export async function openCatalogue(page: Page): Promise<void> {
  const button = page.getByRole('button', { name: 'Catalogue de cartes', exact: true });
  if ((await button.getAttribute('aria-pressed')) !== 'true') await button.click();
  await expect(page.locator('[id^="GPcatalogPanel-"]')).toBeVisible();
}

export async function searchCatalogue(page: Page, text: string): Promise<void> {
  await page.locator('#catalog-input-search-global').fill(text);
}

/** Liens du menu « Aide » (v1.1, E10/C13) : tous externes vers cartes.gouv.fr. */
export const AIDE_CONTACT_URL = 'https://cartes.gouv.fr/aide/fr/nous-ecrire/';

/** Ouvre le menu « Aide » de l'en-tête (sur mobile : d'abord le menu burger) et le renvoie. */
export async function openAideMenu(page: Page, isMobile: boolean, label = 'Aide') {
  await waitForDsfr(page);
  if (isMobile) await page.locator('header .fr-btn--menu').click();
  // `visible=true` : l'en-tête contient deux copies du menu (bureau et modale mobile, ids suffixés `-mobile`) ;
  // on ne garde que celle qui est affichée dans le viewport courant.
  const button = page
    .locator('header')
    .getByRole('button', { name: label })
    .locator('visible=true');
  // Le JS DSFR pose `data-fr-js` avant d'attacher tous ses gestionnaires : on réessaie le clic jusqu'à l'ouverture.
  await expect(async () => {
    if ((await button.getAttribute('aria-expanded')) !== 'true') await button.click();
    await expect(button).toHaveAttribute('aria-expanded', 'true', { timeout: 1500 });
  }).toPass({ timeout: 15_000 });
  return button;
}

/** Vérifie les deux liens du menu « Aide » : cible, attributs, icône avant et icône « lien externe » après. */
export async function expectAideLinks(page: Page, lang: 'fr' | 'en'): Promise<void> {
  const links = page
    .locator('header a[href^="https://cartes.gouv.fr/aide/"]')
    .locator('visible=true');
  await expect(links).toHaveCount(2);
  const [centre, contact] = [links.nth(0), links.nth(1)];
  await expect(centre).toHaveAttribute('href', `https://cartes.gouv.fr/aide/${lang}/`);
  await expect(contact).toHaveAttribute('href', AIDE_CONTACT_URL);
  for (const link of [centre, contact]) {
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', 'noopener external');
    const icons = await link.evaluate((el) => ({
      before:
        getComputedStyle(el, '::before').maskImage +
        getComputedStyle(el, '::before').webkitMaskImage,
      after: getComputedStyle(el, '::after').content,
    }));
    expect(icons.before, 'icône avant (masque DSFR)').toContain('url(');
    expect(icons.after, 'icône « lien externe » après (::after)').not.toBe('none');
  }
}
