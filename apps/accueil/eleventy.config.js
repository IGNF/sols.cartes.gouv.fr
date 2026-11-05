import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, posix } from 'node:path';
import { I18nPlugin } from '@11ty/eleventy';
import { defaultLocaleUrl, localeOf, stripLocale } from './lib/i18n.js';
import accueil from './src/_data/accueil.js';
import site from './src/_data/site.js';

const require = createRequire(import.meta.url);
const DSFR_DIST = join(dirname(require.resolve('@gouvfr/dsfr/package.json')), 'dist');
const DSFR_OUTPUT = 'dsfr';
const BRAND_DIR = dirname(require.resolve('@sols/brand/brand.json'));
/** Generated files (not committed): the reduced DSFR icon stylesheet. */
const CACHE_DIR = join(import.meta.dirname, 'node_modules', '.cache', 'sols-accueil');

/** DSFR utility icons used by the site; only their rules and SVGs are published (/dsfr/icons.css). */
/** DSFR utility icons of the home page (frieze, data cards, agenda). */
const HOME_ICONS = [
  accueil.frieze.without.icon,
  accueil.frieze.with.icon,
  accueil.frieze.arrow,
  ...accueil.donnees.items.map((item) => item.icon),
  ...Object.values(accueil.agenda.icons),
];
const DSFR_ICONS = [
  ...new Set([...site.header.tools.map((tool) => tool.icon), 'fr-icon-theme-fill', ...HOME_ICONS]),
];

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
  ...site.display.themes.map((theme) => `artwork/pictograms/${theme.pictogram}`),
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

/**
 * Extracts the mask-image rule of each icon from the DSFR utility stylesheets (one per category)
 * and writes a small icons.css; returns the SVG files it references. Fails if an icon is unknown.
 */
function buildIconStylesheet() {
  const iconsDir = join(DSFR_DIST, 'utility', 'icons');
  const categories = readdirSync(iconsDir).filter((name) => name.startsWith('icons-'));
  const rules = [];
  const svgs = [];
  for (const icon of DSFR_ICONS) {
    const rule = new RegExp(
      `\\.${icon}:after,\\.${icon}:before\\{-webkit-mask-image:url\\(([^)]+)\\);mask-image:url\\([^)]+\\)\\}`,
    );
    const category = categories.find((name) =>
      rule.test(readFileSync(join(iconsDir, name, `${name}.min.css`), 'utf8')),
    );
    if (!category) throw new Error(`Icône DSFR inconnue : ${icon}`);
    const css = readFileSync(join(iconsDir, category, `${category}.min.css`), 'utf8');
    const svg = posix.normalize(posix.join('utility/icons', category, css.match(rule)[1]));
    svgs.push(svg);
    rules.push(
      `.${icon}::before,.${icon}::after{-webkit-mask-image:url(${svg});mask-image:url(${svg})}`,
    );
  }
  mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(join(CACHE_DIR, 'icons.css'), `${rules.join('\n')}\n`);
  return svgs;
}

export function dsfrPassthrough() {
  const files = [
    ...DSFR_STYLESHEETS,
    ...DSFR_STYLESHEETS.flatMap(referencedAssets),
    ...DSFR_FILES,
    ...buildIconStylesheet(),
  ];
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
/** Build day (UTC, YYYY-MM-DD): agenda events before it are not published. */
const BUILD_DAY = new Date().toISOString().slice(0, 10);
const REFRESH = /<meta http-equiv="refresh" content="0; url=([^"]+)">/;

export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy(dsfrPassthrough());
  eleventyConfig.addPassthroughCopy({ 'src/css': 'css' });
  eleventyConfig.addPassthroughCopy({ 'src/js': 'js' });
  eleventyConfig.addPassthroughCopy({ [join(CACHE_DIR, 'icons.css')]: `${DSFR_OUTPUT}/icons.css` });
  // Brand images are published unchanged from packages/brand/assets/.
  eleventyConfig.addPassthroughCopy({ [join(BRAND_DIR, 'assets')]: site.assets.brand.slice(1) });

  // Pages live in src/<locale>/; locale_url and locale_links come from the plugin. errorMode "never":
  // a link without a translation falls back to the given URL (the link checker still runs on dist).
  eleventyConfig.addPlugin(I18nPlugin, {
    defaultLanguage: site.defaultLanguage,
    errorMode: 'never',
  });
  // Localizes an internal link (path + optional #anchor). Shared markup (empty locale) keeps
  // language-independent paths, except anchored links: a rerouting page cannot keep the anchor.
  eleventyConfig.addFilter('localize', function (href, locale) {
    if (
      /^[a-z][a-z0-9+.-]*:/i.test(href) ||
      site.crossBrick.some((path) => href.startsWith(path))
    ) {
      return href;
    }
    const [path, anchor] = href.split('#');
    const hash = anchor ? `#${anchor}` : '';
    if (!locale) return anchor ? `/${site.defaultLanguage}${stripLocale(path)}${hash}` : path;
    // The plugin registers locale_url when plugins are processed, after this function runs.
    return `${eleventyConfig.getFilter('locale_url').call(this, path, locale)}${hash}`;
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
  // Agenda: events of the build day and later, sorted by date and time.
  eleventyConfig.addFilter('upcoming', (events) =>
    events
      .filter((event) => event.date >= BUILD_DAY)
      .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`)),
  );
  eleventyConfig.addFilter('eventDay', (date) => date.slice(8, 10));
  eleventyConfig.addFilter('eventMonth', (date, locale) =>
    new Intl.DateTimeFormat(site.languages.find((l) => l.code === locale).dateLocale, {
      month: 'short',
      timeZone: 'UTC',
    })
      .format(new Date(`${date}T00:00:00Z`))
      .replace('.', ''),
  );
  eleventyConfig.addFilter('eventTime', (time, locale) =>
    locale === 'fr' ? time.replace(':', 'h') : time,
  );
  eleventyConfig.addFilter('dateIso', (date) => date.toISOString().slice(0, 10));
  eleventyConfig.addFilter('dateLong', (date, locale) =>
    DATE_FORMATS[locale].format(typeof date === 'string' ? new Date(`${date}T00:00:00Z`) : date),
  );

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
