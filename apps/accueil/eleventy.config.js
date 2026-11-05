import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, posix } from 'node:path';
import accueil from './src/_data/accueil.js';

const require = createRequire(import.meta.url);
const DSFR_DIST = join(dirname(require.resolve('@gouvfr/dsfr/package.json')), 'dist');
const DSFR_OUTPUT = 'dsfr';

/** DSFR stylesheets served by the site; every file they reference through url() is copied too. */
const DSFR_STYLESHEETS = ['dsfr.min.css'];
/** Other DSFR files served as is. */
const DSFR_FILES = [
  'dsfr.module.min.js',
  'dsfr.nomodule.min.js',
  'favicon/apple-touch-icon.png',
  'favicon/android-chrome-192x192.png',
  'favicon/android-chrome-512x512.png',
  'favicon/favicon.ico',
  'favicon/favicon.svg',
  'favicon/manifest.webmanifest',
  ...accueil.service.items.map((item) => `artwork/pictograms/${item.pictogram}`),
];

/** Relative paths (from the DSFR dist folder) of the local files referenced by a stylesheet. */
function referencedAssets(stylesheet) {
  const css = readFileSync(join(DSFR_DIST, stylesheet), 'utf8');
  const base = posix.dirname(stylesheet);
  const assets = new Set();
  for (const [, , raw] of css.matchAll(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g)) {
    if (/^(data:|https?:|#)/.test(raw)) continue;
    assets.add(posix.normalize(posix.join(base, raw.split(/[?#]/)[0])));
  }
  return [...assets];
}

export function dsfrPassthrough() {
  const files = [...DSFR_STYLESHEETS, ...DSFR_STYLESHEETS.flatMap(referencedAssets), ...DSFR_FILES];
  return Object.fromEntries(
    files.map((file) => [join(DSFR_DIST, file), posix.join(DSFR_OUTPUT, file)]),
  );
}

export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy(dsfrPassthrough());
  eleventyConfig.addPassthroughCopy({ 'src/css': 'css' });

  return {
    dir: { input: 'src', output: 'dist', includes: '_includes', data: '_data' },
    templateFormats: ['njk', 'md'],
    htmlTemplateEngine: 'njk',
    markdownTemplateEngine: 'njk',
  };
}
