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

export const PAGES = {
  home: '/fr/',
  catalogue: '/rechercher-une-donnee/',
  carto: '/explorer-les-cartes/',
} as const;

export const GPF_WMTS = 'data.geopf.fr/wmts';
export const SOLS_GROUP = 'gissol-osf_g';
export const DEEP_LINK_LAYER = 'rrp_loiret_gpkg_11-09-2026_wmsv';
export const DEEP_LINK_URL = 'https://data.geopf.fr/wms-v';
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
