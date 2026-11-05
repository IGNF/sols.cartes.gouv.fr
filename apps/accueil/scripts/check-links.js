/**
 * Checks every internal href / src of dist/**\/*.html:
 * - a path must resolve to a file, or to a directory containing index.html;
 * - a fragment (#id) must match an id in the target page (same page for "#id");
 * - paths under another brick's public root (catalogue, carto) are accepted as is;
 * - external links (scheme, protocol-relative) are not fetched.
 * Usage: bun scripts/check-links.js [distDir]   (exit code 1 when a link is broken)
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import site from '../src/_data/site.js';

const CROSS_BRICK_ROOTS = [site.sections.rechercherUneDonnee, site.sections.explorerLesCartes];
const ATTRIBUTE = /\s(?:href|src)="([^"]*)"/g;
const ID = /\sid="([^"]+)"/g;

function htmlFiles(dir) {
  return readdirSync(dir, { recursive: true })
    .filter((file) => file.endsWith('.html'))
    .map((file) => join(dir, file));
}

/** Absolute dist file a site path points to, or null. */
function resolveTarget(distDir, path) {
  const candidate = join(distDir, decodeURIComponent(path));
  if (!candidate.startsWith(distDir)) return null;
  if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  const index = join(candidate, 'index.html');
  return existsSync(index) ? index : null;
}

function idsOf(file, cache) {
  if (!cache.has(file)) {
    const html = readFileSync(file, 'utf8');
    cache.set(file, new Set([...html.matchAll(ID)].map(([, id]) => id)));
  }
  return cache.get(file);
}

/** Site path of a dist HTML file, used to resolve relative links. */
function pagePath(distDir, file) {
  const rel = relative(distDir, dirname(file)).split(sep).join('/');
  return rel ? `/${rel}/` : '/';
}

export function checkLinks(distDir) {
  const root = resolve(distDir);
  const cache = new Map();
  const errors = [];
  let checked = 0;
  for (const file of htmlFiles(root)) {
    const html = readFileSync(file, 'utf8');
    const base = new URL(pagePath(root, file), 'http://localhost');
    for (const [, raw] of html.matchAll(ATTRIBUTE)) {
      if (raw === '' || /^([a-z][a-z0-9+.-]*:|\/\/)/i.test(raw)) continue;
      checked += 1;
      const url = new URL(raw, base);
      const fragment = decodeURIComponent(url.hash.slice(1));
      if (CROSS_BRICK_ROOTS.some((prefix) => url.pathname.startsWith(prefix))) continue;
      const target = raw.startsWith('#') ? file : resolveTarget(root, url.pathname);
      const where = `${relative(root, file)}: ${raw}`;
      if (!target) {
        errors.push(`${where} -> introuvable`);
      } else if (fragment && target.endsWith('.html') && !idsOf(target, cache).has(fragment)) {
        errors.push(`${where} -> ancre #${fragment} absente`);
      }
    }
  }
  return { checked, errors };
}

if (import.meta.main) {
  const distDir = process.argv[2] ?? join(import.meta.dir, '..', 'dist');
  const { checked, errors } = checkLinks(distDir);
  for (const error of errors) process.stderr.write(`${error}\n`);
  process.stdout.write(`${checked} liens internes vérifiés, ${errors.length} en erreur\n`);
  process.exit(errors.length > 0 ? 1 : 0);
}
