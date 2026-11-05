import type { Page } from '@playwright/test';
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

export const PAGES = {
  home: '/fr/',
  catalogue: '/rechercher-une-donnee/',
  carto: '/explorer-les-cartes/',
  liste: '/explorer-les-cartes/?vue=liste',
  fiche: `/rechercher-une-donnee/dataset/${RECORD_STOCK_CARBONE}`,
} as const;

/** Pages que axe doit garder sans violation critique/sérieuse (les fiches gardent des violations amont documentées). */
export const AXE_STRICT = ['home', 'catalogue', 'carto', 'liste'] as const;

/** Nombre de chargements du test de stabilité du rendu de la carte (D-carto-1). */
export const MAP_STABILITY_RUNS = 20;
export const GPF_WMTS = 'data.geopf.fr/wmts';
export const SOLS_GROUP = 'gissol-osf_g';
export const SOLS_LAYER = 'stock_carbone_fao_fr_wmsv';
export const GPF_WMS_V = 'data.geopf.fr/wms-v';
export const DEEP_LINK_WMS = `/explorer-les-cartes/?l=${SOLS_LAYER}$GEOPORTAIL:OGC:WMS(1;1;1;0)&permalink=no`;
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
