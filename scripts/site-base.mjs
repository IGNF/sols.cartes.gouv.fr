/**
 * Public prefix of the whole site, from the SITE_BASE environment variable (default "/").
 * "/" in dev, preview:all and production (sols.cartes.gouv.fr); "/sols.cartes.gouv.fr/" for the
 * GitHub Pages preview (project site). Plain JavaScript without dependencies so that every brick
 * (Bun scripts, Vite, Eleventy, the catalogue Node scripts) reads it from this single place.
 */

/** Normalised SITE_BASE: starts and ends with "/". */
export function siteBase(value = process.env.SITE_BASE) {
  const raw = (value ?? '').trim();
  if (raw === '' || raw === '/') return '/';
  return `/${raw.replace(/^\/+|\/+$/g, '')}/`;
}

/** Prefixes a root-absolute path ("/x") with SITE_BASE; other values (URLs, "//host", relative) are kept. */
export function withSiteBase(path, base = siteBase()) {
  if (base === '/' || typeof path !== 'string' || !/^\/(?!\/)/.test(path)) return path;
  if (path.startsWith(base)) return path;
  return `${base}${path.slice(1)}`;
}
