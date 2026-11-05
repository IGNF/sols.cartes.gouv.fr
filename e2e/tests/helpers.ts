import type { Page } from '@playwright/test';

export interface ConsoleIssues {
  errors: string[];
}

/** Collecte tous les `console.error` et `pageerror`, sans rien ignorer. */
export function collectConsole(page: Page): ConsoleIssues {
  const issues: ConsoleIssues = { errors: [] };
  page.on('console', (msg) => {
    if (msg.type() === 'error') issues.errors.push(`console: ${msg.text()} @ ${msg.location().url}`);
  });
  page.on('pageerror', (err) => issues.errors.push(`pageerror: ${err.message}`));
  return issues;
}

/** Retire les erreurs tolérées (motif + raison documentée) et renvoie le reste. */
export function untolerated(errors: string[], tolerated: { pattern: RegExp; reason: string }[]): string[] {
  return errors.filter((e) => !tolerated.some((t) => t.pattern.test(e)));
}

export const PAGES = {
  home: '/fr/',
  catalogue: '/rechercher-une-donnee/',
  carto: '/explorer-les-cartes/',
} as const;
