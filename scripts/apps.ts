/**
 * Single description of the three bricks served under one origin.
 * Root scripts (run-all, build-all, preview-all) read this file; nothing else should
 * hardcode an app directory, a public path or a build output folder.
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';

export type PackageManager = 'bun' | 'npm';

export interface AppSpec {
  /** Task id prefix used in STATUS.md and branch names. */
  id: 'edito' | 'catalogue' | 'carto';
  /** Directory relative to the repository root. */
  dir: string;
  /** Public path under which the build is served (no trailing slash except root). */
  publicPath: string;
  /** Build output directory relative to the app directory. */
  outDir: string;
  /** Package manager used inside the app (catalogue needs npm, see doc/agents/geonetwork-ui.md). */
  pm: PackageManager;
}

export const ROOT = join(import.meta.dir, '..');

export const APPS: readonly AppSpec[] = [
  { id: 'edito', dir: 'apps/accueil', publicPath: '/', outDir: 'dist', pm: 'bun' },
  {
    id: 'catalogue',
    dir: 'apps/rechercher-une-donnee',
    publicPath: '/rechercher-une-donnee',
    outDir: 'dist',
    pm: 'npm',
  },
  {
    id: 'carto',
    dir: 'apps/explorer-les-cartes',
    publicPath: '/explorer-les-cartes',
    outDir: 'dist',
    pm: 'bun',
  },
];

export const DIST_ROOT = join(ROOT, 'dist');
export const PREVIEW_PORT = Number(process.env.PORT ?? 8080);

export function appExists(app: AppSpec): boolean {
  return existsSync(join(ROOT, app.dir, 'package.json'));
}

export async function hasScript(app: AppSpec, script: string): Promise<boolean> {
  const pkg = (await Bun.file(join(ROOT, app.dir, 'package.json')).json()) as {
    scripts?: Record<string, string>;
  };
  return Boolean(pkg.scripts?.[script]);
}

export function runCommand(app: AppSpec, script: string): string[] {
  return app.pm === 'bun' ? ['bun', 'run', script] : ['npm', 'run', script];
}
