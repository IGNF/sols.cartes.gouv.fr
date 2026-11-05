import { beforeAll, describe, expect, test } from 'bun:test';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import site from '../src/_data/site.js';

const APP_DIR = join(import.meta.dir, '..');
const DIST = join(APP_DIR, 'dist');
let html = '';

beforeAll(() => {
  const build = Bun.spawnSync(['bun', 'run', 'build'], {
    cwd: APP_DIR,
    stdout: 'pipe',
    stderr: 'pipe',
  });
  if (build.exitCode !== 0) throw new Error(build.stderr.toString());
  html = readFileSync(join(DIST, 'index.html'), 'utf8');
});

describe('page d’accueil générée', () => {
  test('déclare la langue, un titre et une meta description', () => {
    expect(html).toMatch(/<html lang="fr"/);
    expect(html).toMatch(/<title>[^<]+<\/title>/);
    expect(html).toMatch(/<meta name="description" content="[^"]+">/);
  });

  test('contient un seul h1', () => {
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1);
  });

  test('contient le lien d’évitement vers le contenu principal', () => {
    expect(html).toContain('class="fr-skiplinks"');
    expect(html).toContain('href="#contenu"');
    expect(html).toMatch(/<main id="contenu"/);
  });

  test('contient les trois liens de navigation, Accueil étant la page courante', () => {
    for (const item of site.header.nav) {
      expect(html).toMatch(
        new RegExp(`class="fr-nav__link" href="${item.href}"[^>]*>${item.label}<`),
      );
    }
    expect(html).toMatch(/href="\/" target="_self" aria-current="page">Accueil</);
  });

  test('copie les ressources DSFR référencées', () => {
    for (const asset of ['dsfr.min.css', 'dsfr.module.min.js', 'fonts/Marianne-Regular.woff2']) {
      expect(existsSync(join(DIST, 'dsfr', asset))).toBe(true);
    }
  });
});
