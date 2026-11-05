import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, posix } from 'node:path';
import { I18nPlugin } from '@11ty/eleventy';
import { defaultLocaleUrl, localeOf, stripLocale } from './lib/i18n.js';
import accueil from './src/_data/accueil.js';
import site from './src/_data/site.js';

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
  ...accueil.service.map((item) => `artwork/pictograms/${item.pictogram}`),
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

const DATE_FORMATS = Object.fromEntries(
  site.languages.map(({ code, dateLocale }) => [
    code,
    new Intl.DateTimeFormat(dateLocale, { dateStyle: 'long', timeZone: 'UTC' }),
  ]),
);
const REFRESH = /<meta http-equiv="refresh" content="0; url=([^"]+)">/;

export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy(dsfrPassthrough());
  eleventyConfig.addPassthroughCopy({ 'src/css': 'css' });

  // Pages live in src/<locale>/; locale_url and locale_links come from the plugin. errorMode "never":
  // a link without a translation falls back to the given URL (the link checker still runs on dist).
  eleventyConfig.addPlugin(I18nPlugin, {
    defaultLanguage: site.defaultLanguage,
    errorMode: 'never',
  });
  eleventyConfig.addFilter('localeOf', localeOf);
  eleventyConfig.addFilter('stripLocale', stripLocale);
  eleventyConfig.addFilter('defaultLocaleUrl', defaultLocaleUrl);
  eleventyConfig.addFilter('language', (code) => site.languages.find((item) => item.code === code));
  eleventyConfig.addFilter('byLocale', (items, locale) =>
    items.filter((item) => localeOf(item.url) === locale),
  );

  eleventyConfig.addCollection('articles', (collectionApi) =>
    collectionApi.getFilteredByGlob('src/*/articles/*.md').sort((a, b) => b.date - a.date),
  );
  // French pages, each gets a language-independent rerouting page (src/reroute.njk).
  eleventyConfig.addCollection(site.defaultLanguage, (collectionApi) =>
    collectionApi.getFilteredByGlob(`src/${site.defaultLanguage}/**/*.{njk,md}`),
  );
  eleventyConfig.addFilter('dateIso', (date) => date.toISOString().slice(0, 10));
  eleventyConfig.addFilter('dateLong', (date, locale) => DATE_FORMATS[locale].format(date));

  eleventyConfig.addLinter('seo-head', function (content) {
    if (!this.page.outputPath?.endsWith('.html')) return;
    const missing = [];
    if (!/<meta name="description" content="[^"\s][^"]*">/.test(content))
      missing.push('meta description');
    // A rerouting page is canonicalised to its target, every other page to itself.
    const target = content.match(REFRESH)?.[1] ?? this.page.url;
    if (!content.includes(`<link rel="canonical" href="${site.url}${target}">`)) {
      missing.push('canonical');
    }
    if (missing.length > 0) {
      throw new Error(`${this.page.inputPath}: ${missing.join(', ')} manquant(e)`);
    }
  });

  return {
    dir: { input: 'src', output: 'dist', includes: '_includes', data: '_data' },
    templateFormats: ['njk', 'md'],
    htmlTemplateEngine: 'njk',
    markdownTemplateEngine: 'njk',
  };
}
