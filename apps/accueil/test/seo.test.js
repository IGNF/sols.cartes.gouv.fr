import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { checkLinks } from '../scripts/check-links.js';
import site from '../src/_data/site.js';
import { DIST, LOCALES, allPages, build, localizedPages, read } from './helpers.js';

const stripLocale = (path) => path.replace(/^\/[a-z]{2}\//, '/');

beforeAll(build);

describe('sitemap.xml et robots.txt', () => {
  const sitemap = () => readFileSync(join(DIST, 'sitemap.xml'), 'utf8');

  test('le sitemap liste les pages des deux langues et les racines des autres briques', () => {
    const locs = [...sitemap().matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, loc]) => loc);
    const expected = [...localizedPages(), ...site.crossBrick].map((path) => `${site.url}${path}`);
    expect(locs.sort()).toEqual(expected.sort());
    for (const code of LOCALES) expect(locs).toContain(`${site.url}/${code}/`);
  });

  test('chaque page du sitemap a ses alternates fr, en et x-default', () => {
    for (const path of localizedPages()) {
      const entry = sitemap().match(
        new RegExp(`<url>\\s*<loc>${site.url}${path}</loc>([\\s\\S]*?)</url>`),
      )[1];
      for (const code of LOCALES) {
        expect(entry).toContain(
          `<xhtml:link rel="alternate" hreflang="${code}" href="${site.url}/${code}${stripLocale(path)}"/>`,
        );
      }
      expect(entry).toContain(
        `<xhtml:link rel="alternate" hreflang="x-default" href="${site.url}${stripLocale(path)}"/>`,
      );
    }
  });

  test('les articles ont un lastmod égal à leur date', () => {
    const articles = localizedPages().filter((path) =>
      /^\/[a-z]{2}\/articles\/[^/]+\/$/.test(path),
    );
    expect(articles.length).toBeGreaterThan(0);
    for (const path of articles) {
      const [, date] = read(path).match(/<time datetime="(\d{4}-\d{2}-\d{2})">/);
      expect(sitemap()).toContain(`<loc>${site.url}${path}</loc>\n    <lastmod>${date}</lastmod>`);
    }
  });

  test('robots.txt autorise tout et pointe le sitemap de production', () => {
    const robots = readFileSync(join(DIST, 'robots.txt'), 'utf8');
    expect(robots).toContain('User-agent: *\nAllow: /');
    expect(robots).toContain(`Sitemap: ${site.url}/sitemap.xml`);
  });
});

describe('en-tête de chaque page', () => {
  test('chaque page a une meta description non vide et une canonique', () => {
    for (const path of allPages()) {
      const html = read(path);
      const target =
        html.match(/<meta http-equiv="refresh" content="0; url=([^"]+)">/)?.[1] ?? path;
      expect(html).toContain(`<link rel="canonical" href="${site.url}${target}">`);
      expect(html).toMatch(/<meta name="description" content="[^"\s][^"]*">/);
    }
  });

  test('chaque page localisée a ses alternates hreflang fr, en et x-default', () => {
    for (const path of localizedPages()) {
      const html = read(path);
      for (const code of LOCALES) {
        expect(html).toContain(
          `<link rel="alternate" hreflang="${code}" href="${site.url}/${code}${stripLocale(path)}">`,
        );
      }
      expect(html).toContain(
        `<link rel="alternate" hreflang="x-default" href="${site.url}${stripLocale(path)}">`,
      );
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
