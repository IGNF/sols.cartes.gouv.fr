import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { checkLinks } from '../scripts/check-links.js';
import site from '../src/_data/site.js';

const APP_DIR = join(import.meta.dir, '..');
const DIST = join(APP_DIR, 'dist');
let pages = [];

/** Site path of every generated HTML page, e.g. "/" or "/articles/". */
function sitePaths() {
  return readdirSync(DIST, { recursive: true })
    .filter((file) => file.endsWith('index.html'))
    .map((file) => `/${file.replace(/index\.html$/, '')}`);
}

beforeAll(() => {
  const build = Bun.spawnSync(['bun', 'run', 'build'], {
    cwd: APP_DIR,
    stdout: 'pipe',
    stderr: 'pipe',
  });
  if (build.exitCode !== 0) throw new Error(build.stderr.toString());
  pages = sitePaths();
});

describe('sitemap.xml et robots.txt', () => {
  test('le sitemap liste chaque page et les racines des autres briques', () => {
    const sitemap = readFileSync(join(DIST, 'sitemap.xml'), 'utf8');
    const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, loc]) => loc);
    const expected = [
      ...pages,
      site.sections.rechercherUneDonnee,
      site.sections.explorerLesCartes,
    ].map((path) => `${site.url}${path}`);
    expect(locs.sort()).toEqual(expected.sort());
  });

  test('les articles ont un lastmod égal à leur date', () => {
    const sitemap = readFileSync(join(DIST, 'sitemap.xml'), 'utf8');
    const articles = pages.filter(
      (path) => path.startsWith(site.sections.articles) && path !== site.sections.articles,
    );
    expect(articles.length).toBeGreaterThan(0);
    for (const path of articles) {
      const html = readFileSync(join(DIST, path, 'index.html'), 'utf8');
      const [, date] = html.match(/<time datetime="(\d{4}-\d{2}-\d{2})">/);
      expect(sitemap).toContain(`<loc>${site.url}${path}</loc>\n    <lastmod>${date}</lastmod>`);
    }
  });

  test('robots.txt autorise tout et pointe le sitemap de production', () => {
    const robots = readFileSync(join(DIST, 'robots.txt'), 'utf8');
    expect(robots).toContain('User-agent: *\nAllow: /');
    expect(robots).toContain(`Sitemap: ${site.url}/sitemap.xml`);
  });
});

describe('en-tête de chaque page', () => {
  test('chaque page a une canonique et une meta description non vide', () => {
    expect(pages.length).toBeGreaterThan(0);
    for (const path of pages) {
      const html = readFileSync(join(DIST, path, 'index.html'), 'utf8');
      expect(html).toContain(`<link rel="canonical" href="${site.url}${path}">`);
      expect(html).toMatch(/<meta name="description" content="[^"\s][^"]*">/);
    }
  });
});

describe('liens internes', () => {
  test('tous les liens internes de dist/ aboutissent', () => {
    const { checked, errors } = checkLinks(DIST);
    expect(checked).toBeGreaterThan(0);
    expect(errors).toEqual([]);
  });

  describe('vérificateur', () => {
    let dir = '';
    beforeAll(() => {
      dir = mkdtempSync(join(tmpdir(), 'check-links-'));
      mkdirSync(join(dir, 'page'));
      writeFileSync(join(dir, 'page', 'index.html'), '<h1 id="titre">Page</h1>');
      writeFileSync(join(dir, 'style.css'), '');
      writeFileSync(
        join(dir, 'index.html'),
        [
          '<a href="/page/">ok</a>',
          '<a href="/page/#titre">ok</a>',
          '<a href="page/">ok</a>',
          '<link href="/style.css">',
          '<a href="#ici" id="ici">ok</a>',
          `<a href="${site.sections.explorerLesCartes}">ok</a>`,
          `<a href="${site.sections.rechercherUneDonnee}fiche/1">ok</a>`,
          '<a href="https://example.org/absent/">ok</a>',
          '<a href="/absent/">ko</a>',
          '<img src="/absent.png" alt="">',
          '<a href="/page/#absente">ko</a>',
          '<a href="#nulle-part">ko</a>',
        ].join('\n'),
      );
    });
    afterAll(() => rmSync(dir, { recursive: true, force: true }));

    test('signale fichiers et ancres manquants, ignore externes et autres briques', () => {
      const { checked, errors } = checkLinks(dir);
      expect(checked).toBe(11);
      expect(errors).toEqual([
        'index.html: /absent/ -> introuvable',
        'index.html: /absent.png -> introuvable',
        'index.html: /page/#absente -> ancre #absente absente',
        'index.html: #nulle-part -> ancre #nulle-part absente',
      ]);
    });
  });
});
