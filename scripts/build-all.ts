/**
 * Builds every brick and assembles a single static tree in ./dist:
 *   /                        <- apps/accueil
 *   /rechercher-une-donnee   <- apps/rechercher-une-donnee
 *   /explorer-les-cartes     <- apps/explorer-les-cartes
 * With SITE_BASE set (GitHub Pages preview, see doc/ci.md), a root 404.html and .nojekyll are added.
 * Usage: [SITE_BASE=/prefix/] bun scripts/build-all.ts [--skip-build]
 */
import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { APPS, DIST_ROOT, ROOT, SITE_BASE, appExists, hasScript, runCommand } from './apps';
import { notFoundPage } from './not-found-page';

const skipBuild = process.argv.includes('--skip-build');

if (!skipBuild) {
  for (const app of APPS) {
    if (!appExists(app) || !(await hasScript(app, 'build'))) {
      console.log(`[${app.id}] skipped: nothing to build in ${app.dir}`);
      continue;
    }
    console.log(`[${app.id}] building in ${app.dir}`);
    const proc = Bun.spawn(runCommand(app, 'build'), {
      cwd: join(ROOT, app.dir),
      stdout: 'inherit',
      stderr: 'inherit',
      env: process.env,
    });
    const code = await proc.exited;
    if (code !== 0) {
      console.error(`[${app.id}] build failed with exit code ${code}`);
      process.exit(code);
    }
  }
}

await rm(DIST_ROOT, { recursive: true, force: true });
await mkdir(DIST_ROOT, { recursive: true });

for (const app of APPS) {
  const source = join(ROOT, app.dir, app.outDir);
  if (!existsSync(source)) {
    console.log(`[${app.id}] skipped: no build output at ${source}`);
    continue;
  }
  if (!existsSync(join(source, 'index.html'))) {
    console.error(
      `[${app.id}] no index.html in ${source}: rebuild this brick before assembling dist`,
    );
    process.exit(1);
  }
  const target = join(DIST_ROOT, app.publicPath);
  await mkdir(target, { recursive: true });
  await cp(source, target, { recursive: true });
  console.log(`[${app.id}] ${app.dir}/${app.outDir} -> dist${app.publicPath}`);
}
if (SITE_BASE !== '/') {
  // GitHub Pages: no Jekyll processing, and its only fallback page is the root 404.html.
  await writeFile(join(DIST_ROOT, '.nojekyll'), '');
  await writeFile(join(DIST_ROOT, '404.html'), notFoundPage(SITE_BASE, APPS));
  console.log(`404.html and .nojekyll added for SITE_BASE=${SITE_BASE}`);
}
console.log(`dist assembled at ${DIST_ROOT} (SITE_BASE=${SITE_BASE})`);
