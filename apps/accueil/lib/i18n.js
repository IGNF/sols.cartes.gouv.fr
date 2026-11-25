/** Locale helpers shared by eleventy.config.js and computed data. */
import site from '../src/_data/site.js';

const CODES = new Set(site.languages.map((language) => language.code));

/** Locale of a site URL ("/en/articles/" -> "en"); default language when the URL has none. */
export function localeOf(url) {
  const [, first] = (url ?? '').split('/');
  return CODES.has(first) ? first : site.defaultLanguage;
}

/** Language-independent path of a localized URL ("/en/articles/" -> "/articles/"). */
export function stripLocale(url) {
  const [, first] = (url ?? '').split('/');
  return CODES.has(first) ? url.slice(first.length + 1) : url;
}

/** Default-language version of a localized URL ("/en/articles/" -> "/fr/articles/"), used for x-default. */
export function defaultLocaleUrl(url) {
  return `/${site.defaultLanguage}${stripLocale(url)}`;
}
