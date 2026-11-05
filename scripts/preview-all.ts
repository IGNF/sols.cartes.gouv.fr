/**
 * Serves ./dist (produced by build-all) on one origin, with SPA fallbacks for the
 * catalogue and carto sub-paths. Usage: bun scripts/preview-all.ts  (PORT=8080 by default)
 */
import { existsSync, statSync } from 'node:fs';
import { join, normalize } from 'node:path';
import { APPS, DIST_ROOT, PREVIEW_PORT } from './apps';

if (!existsSync(DIST_ROOT)) {
  console.error(`No ${DIST_ROOT}: run "bun run build:all" first.`);
  process.exit(1);
}

function resolveFile(pathname: string): string | null {
  const safe = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, '');
  const candidates = [join(DIST_ROOT, safe), join(DIST_ROOT, safe, 'index.html')];
  if (!safe.endsWith('/') && !/\.[a-z0-9]+$/i.test(safe)) {
    candidates.push(join(DIST_ROOT, `${safe}.html`));
  }
  for (const candidate of candidates) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return null;
}

function spaFallback(pathname: string): string | null {
  for (const app of APPS) {
    if (app.publicPath !== '/' && pathname.startsWith(app.publicPath)) {
      const index = join(DIST_ROOT, app.publicPath, 'index.html');
      return existsSync(index) ? index : null;
    }
  }
  return null;
}

const server = Bun.serve({
  port: PREVIEW_PORT,
  fetch(request) {
    const { pathname } = new URL(request.url);
    const file = resolveFile(pathname) ?? spaFallback(pathname);
    if (!file) {
      const notFound = join(DIST_ROOT, '404.html');
      return new Response(existsSync(notFound) ? Bun.file(notFound) : 'Not found', { status: 404 });
    }
    return new Response(Bun.file(file));
  },
});
console.log(`preview:all serving ${DIST_ROOT} at ${server.url}`);
