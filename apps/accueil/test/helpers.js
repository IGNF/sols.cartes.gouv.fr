import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import site from '../src/_data/site.js';

export const APP_DIR = join(import.meta.dir, '..');
export const DIST = join(APP_DIR, 'dist');
export const LOCALES = site.languages.map((language) => language.code);
export const SHARED_PAGE = '/partage/en-tete-pied-de-page/';
export const FOOTER_PATHS = site.footer.bottomLinks.map((link) => link.href);

/** Builds the site once per test file. */
export function build() {
  const result = Bun.spawnSync(['bun', 'run', 'build'], {
    cwd: APP_DIR,
    stdout: 'pipe',
    stderr: 'pipe',
  });
  if (result.exitCode !== 0) throw new Error(result.stderr.toString());
}

export const read = (url) => readFileSync(join(DIST, url, 'index.html'), 'utf8');
export const exists = (url) => existsSync(join(DIST, url, 'index.html'));
export const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Site paths of every generated HTML page, e.g. "/", "/fr/articles/". */
export function allPages() {
  return readdirSync(DIST, { recursive: true })
    .filter((file) => file.endsWith('index.html'))
    .map((file) => `/${file.replace(/index\.html$/, '')}`)
    .sort();
}

/** Localized pages (/fr/..., /en/...). */
export const localizedPages = () =>
  allPages().filter((path) => LOCALES.some((code) => path.startsWith(`/${code}/`)));

/** Article slugs of a locale, from src/<locale>/articles/*.md. */
export const articleSlugs = (locale) =>
  readdirSync(join(APP_DIR, 'src', locale, 'articles'))
    .filter((file) => file.endsWith('.md'))
    .map((file) => file.replace(/\.md$/, ''));

/** Text as Nunjucks autoescape renders it in HTML. */
export const html = (text) =>
  String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
